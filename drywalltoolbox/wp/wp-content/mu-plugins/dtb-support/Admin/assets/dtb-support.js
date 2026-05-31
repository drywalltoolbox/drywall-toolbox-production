(function ($) {
  'use strict';

  var cfg = window.dtbSupportConfig || {};

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[char];
    });
  }

  function nl2br(value) {
    return esc(value).replace(/\n/g, '<br>');
  }

  function toUtcMysql(date) {
    var year = date.getUTCFullYear();
    var month = String(date.getUTCMonth() + 1).padStart(2, '0');
    var day = String(date.getUTCDate()).padStart(2, '0');
    var hour = String(date.getUTCHours()).padStart(2, '0');
    var minute = String(date.getUTCMinutes()).padStart(2, '0');
    var second = String(date.getUTCSeconds()).padStart(2, '0');
    return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
  }

  window.dtbSupport = {
    activeQueue: cfg.defaultQueue || 'needs_reply',
    activeTicketId: null,
    currentTicket: null,
    currentEvents: [],
    currentDisplayEvents: [],
    currentEventFilter: 'all',
    tickets: [],
    macros: [],
    selectedTickets: {},
    page: 1,
    pageCount: 1,
    filters: {},
    composerMode: 'reply',
    autoRefreshTimer: null,
    queueLabels: {
      needs_reply: 'Needs Reply',
      overdue: 'Overdue',
      due_soon: 'Due Soon',
      unassigned: 'Unassigned',
      urgent: 'Urgent',
      in_progress: 'In Progress',
      waiting_on_customer: 'Waiting on Customer',
      snoozed: 'Snoozed',
      resolved_pending_close: 'Resolved',
      all_active: 'All Active'
    },

    init: function () {
      this.bindEvents();
      this.loadMacros();
      this.loadQueueCounts();
      this.loadKpis();
      this.switchQueue(this.activeQueue);
      this.initKeyboardShortcuts();
      this.startAutoRefresh();
      this.bindLegacyReplyForm();
    },

    bindEvents: function () {
      var self = this;

      $(document).on('click', '.dtb-rail-item', function (e) {
        e.preventDefault();
        self.switchQueue($(this).data('queue'));
      });

      $(document).on('click', '.dtb-row-link,.dtb-open-ticket', function (e) {
        e.preventDefault();
        self.openTicket($(this).data('ticketId'));
      });

      $(document).on('click', '.dtb-event-filter', function (e) {
        e.preventDefault();
        self.setEventFilter($(this).data('filter'));
      });

      $(document).on('click', function (e) {
        var $picker = $('#dtb-macro-picker');
        if ($picker.length && $picker.is(':visible') && !$(e.target).closest('.dtb-macro-host').length) {
          $picker.hide();
        }
      });
    },

    bindLegacyReplyForm: function () {
      var self = this;
      var $form = $('#dtb-reply-form');
      if (!$form.length) {
        return;
      }

      $form.on('submit', function (e) {
        e.preventDefault();
        var ticketId = parseInt($form.data('ticketId'), 10);
        var body = $form.find('textarea[name="message"]').val();

        self
          .api('POST', 'tickets/' + ticketId + '/reply', {
            message: body,
            is_internal: $form.find('input[name="is_internal"]').is(':checked')
          })
          .done(function () {
            window.location.reload();
          })
          .fail(function (xhr) {
            self.showToast((xhr.responseJSON && xhr.responseJSON.message) || 'Reply failed', 'error');
          });
      });
    },

    refresh: function () {
      this.loadQueueCounts();
      this.loadKpis();
      this.loadTickets(this.activeQueue, this.filters);
      if (this.activeTicketId) {
        this.openTicket(this.activeTicketId);
      }
    },

    switchQueue: function (queue) {
      this.activeQueue = queue || 'needs_reply';
      this.page = 1;
      $('.dtb-rail-item').removeClass('is-active');
      $('.dtb-rail-item[data-queue="' + this.activeQueue + '"]').addClass('is-active');
      $('#dtb-active-queue-label').text(this.queueLabels[this.activeQueue] || this.activeQueue);
      $('#dtb-context-queue').text(this.queueLabels[this.activeQueue] || this.activeQueue);
      this.loadTickets(this.activeQueue, this.filters);
    },

    loadQueueCounts: function () {
      return this.api('GET', 'queues').done(function (res) {
        var counts = res.counts || res.queue_counts || res || {};
        $('.dtb-rail-item').each(function () {
          var queue = $(this).data('queue');
          $(this)
            .find('.dtb-rail-badge')
            .text(counts[queue] || 0);
        });
      });
    },

    loadKpis: function () {
      return this.api('GET', 'kpis').done(function (kpis) {
        var items = [
          ['Total Active', kpis.active_total || kpis.total || 0, 'ok'],
          ['Needs Reply', kpis.needs_reply || 0, kpis.needs_reply ? 'warning' : 'ok'],
          ['Overdue', kpis.overdue_count || 0, kpis.overdue_count ? 'breach' : 'ok'],
          ['Due Soon', kpis.due_soon_count || 0, kpis.due_soon_count ? 'warning' : 'ok'],
          ['Unassigned', kpis.unassigned || 0, kpis.unassigned ? 'warning' : 'ok'],
          ['Urgent', kpis.urgent || 0, kpis.urgent ? 'breach' : 'ok'],
          ['Email Failures', kpis.email_failures || 0, kpis.email_failures ? 'warning' : 'ok']
        ];

        $('#dtb-kpi-strip').html(
          items
            .map(function (item) {
              return (
                '<div class="dtb-kpi dtb-kpi--' +
                item[2] +
                '"><div class="dtb-kpi__val">' +
                esc(item[1]) +
                '</div><div class="dtb-kpi__label">' +
                esc(item[0]) +
                '</div></div>'
              );
            })
            .join('')
        );
      });
    },

    applyFilters: function () {
      this.filters = {
        search: $('#dtb-search').val() || '',
        type: $('#dtb-filter-type').val() || '',
        priority: $('#dtb-filter-priority').val() || ''
      };
      $('#dtb-clear-filters').toggle(Boolean(this.filters.search || this.filters.type || this.filters.priority));
      this.page = 1;
      this.loadTickets(this.activeQueue, this.filters);
    },

    clearFilters: function () {
      this.filters = {};
      $('#dtb-search').val('');
      $('#dtb-filter-type').val('');
      $('#dtb-filter-priority').val('');
      $('#dtb-clear-filters').hide();
      this.page = 1;
      this.loadTickets(this.activeQueue, {});
    },

    loadTickets: function (queue, filters) {
      var self = this;
      $('#dtb-list-loading').show();
      $('#dtb-tickets-table,#dtb-empty-state,#dtb-pagination').hide();

      var params = $.extend({}, filters || {}, {
        queue: queue,
        page: this.page,
        per_page: 25
      });

      return this.api('GET', 'tickets', params)
        .done(function (res) {
          self.tickets = res.tickets || [];
          self.page = res.page || 1;
          self.pageCount = res.page_count || 1;
          $('#dtb-ticket-count').text((res.total || 0) + ' tickets');
          $('#dtb-page-info').text('Page ' + self.page + ' of ' + self.pageCount);
          $('#dtb-prev-page').prop('disabled', self.page <= 1);
          $('#dtb-next-page').prop('disabled', self.page >= self.pageCount);
          $('#dtb-tickets-tbody').html(
            self.tickets
              .map(function (ticket) {
                return self.renderTicketRow(ticket);
              })
              .join('')
          );

          $('#dtb-list-loading').hide();
          if (self.tickets.length) {
            $('#dtb-tickets-table,#dtb-pagination').show();
          } else {
            $('#dtb-empty-state').show();
          }
          $('#dtb-last-refresh').text('Updated ' + new Date().toLocaleTimeString());
        })
        .fail(function () {
          self.showToast('Failed to load tickets', 'error');
          $('#dtb-list-loading').hide();
          $('#dtb-empty-state').show();
        });
    },

    renderTicketRow: function (ticket) {
      var assigned = ticket.assigned_user && ticket.assigned_user.display_name ? ticket.assigned_user.display_name : '-';
      var lastReply = ticket.last_customer_reply_at || ticket.last_staff_reply_at || ticket.created_at;
      var selected = this.selectedTickets[ticket.id] ? ' is-selected' : '';

      return (
        '<tr id="dtb-row-' +
        ticket.id +
        '" class="' +
        selected +
        '">' +
        '<td><input type="checkbox" ' +
        (this.selectedTickets[ticket.id] ? 'checked' : '') +
        ' onchange="dtbSupport.toggleBulkSelect(' +
        ticket.id +
        ', this.checked)"></td>' +
        '<td><a href="#" class="dtb-row-link" data-ticket-id="' +
        ticket.id +
        '">' +
        esc(ticket.ticket_number) +
        '</a></td>' +
        '<td><a href="#" class="dtb-row-link" data-ticket-id="' +
        ticket.id +
        '">' +
        esc(ticket.subject) +
        '</a><div class="dtb-subject-meta">' +
        esc(ticket.customer_name) +
        ' . ' +
        esc(ticket.customer_email) +
        '</div></td>' +
        '<td><span class="dtb-status dtb-status--' +
        esc(ticket.status) +
        '">' +
        esc(ticket.status_label || ticket.status) +
        '</span></td>' +
        '<td><span class="dtb-pri dtb-pri--' +
        esc(ticket.priority) +
        '">' +
        esc(ticket.priority_label || ticket.priority) +
        '</span></td>' +
        '<td>' +
        esc(ticket.type_label || ticket.ticket_type) +
        '</td>' +
        '<td>' +
        esc(assigned) +
        '</td>' +
        '<td>' +
        this.renderActionBadge(ticket) +
        '</td>' +
        '<td>' +
        (lastReply ? esc(this.formatAge(lastReply)) : '-') +
        '</td>' +
        '<td><button class="dtb-btn dtb-btn--ghost dtb-btn--xs" onclick="dtbSupport.toggleRow(' +
        ticket.id +
        ')">v</button> <button class="dtb-btn dtb-btn--primary dtb-btn--xs dtb-open-ticket" data-ticket-id="' +
        ticket.id +
        '">Open</button></td>' +
        '</tr>' +
        '<tr id="dtb-exp-' +
        ticket.id +
        '" class="dtb-expand-row"><td colspan="10"><div class="dtb-expand-inner"><div class="dtb-mini-thread"></div><div class="dtb-quick-actions"><a href="#" class="dtb-view-full-btn dtb-open-ticket" data-ticket-id="' +
        ticket.id +
        '">View Full Ticket</a></div></div></td></tr>'
      );
    },

    renderActionBadge: function (ticket) {
      var state = ticket.action_state || 'ok';
      var label = state === 'overdue' ? 'Overdue' : state === 'due_soon' ? 'Due Soon' : this.formatActionTime(ticket.seconds_until_due);
      return '<span class="dtb-action-state dtb-action-state--' + esc(state) + '">' + esc(label || 'OK') + '</span>';
    },

    toggleRow: function (ticketId) {
      var $row = $('#dtb-exp-' + ticketId);
      $row.toggleClass('is-open');
      if ($row.hasClass('is-open') && !$row.data('loaded')) {
        this.loadMiniThread(ticketId);
        $row.data('loaded', 1);
      }
    },

    loadMiniThread: function (ticketId) {
      var $container = $('#dtb-exp-' + ticketId + ' .dtb-mini-thread');
      $container.html('<div class="dtb-loading"><div class="dtb-spinner"></div>Loading...</div>');

      this.api('GET', 'tickets/' + ticketId + '/events').done(function (events) {
        var visible = (events || []).filter(function (event) {
          return event.visibility !== 'operator';
        });
        visible = visible.slice(-4).reverse();

        if (!visible.length) {
          $container.html('<p class="dtb-empty__sub">No conversation yet.</p>');
          return;
        }

        $container.html(
          visible
            .map(function (event) {
              var isCustomer = event.actor_type === 'customer';
              var label = event.actor_label || (isCustomer ? 'Customer' : 'Staff');
              var initials = label.slice(0, 2).toUpperCase();
              return (
                '<div class="dtb-mini-event"><div class="dtb-mini-event__avatar ' +
                (isCustomer ? 'dtb-mini-event__avatar--customer' : 'dtb-mini-event__avatar--staff') +
                '">' +
                esc(initials) +
                '</div><div class="dtb-mini-event__body"><div class="dtb-mini-event__header"><span class="dtb-mini-event__name">' +
                esc(label) +
                '</span><span class="dtb-mini-event__time">' +
                esc(event.age_label || '') +
                '</span></div><div class="dtb-mini-event__msg">' +
                esc(event.summary || event.body || '-') +
                '</div></div></div>'
              );
            })
            .join('')
        );
      });
    },

    openTicket: function (ticketId) {
      var self = this;
      this.activeTicketId = ticketId;
      this.currentEventFilter = 'all';

      $('#dtb-detail-overlay').show();
      $('#dtb-detail-loading').show();
      $('#dtb-detail-content').hide();

      this.api('GET', 'tickets/' + ticketId)
        .done(function (res) {
          self.currentTicket = res.ticket || null;
          self.currentEvents = res.events || [];
          self.currentDisplayEvents = self.buildTimelineEvents(self.currentTicket, self.currentEvents);
          self.renderDetail(self.currentTicket, self.currentDisplayEvents);
          $('#dtb-detail-loading').hide();
          $('#dtb-detail-content').show();
        })
        .fail(function () {
          self.showToast('Failed to load ticket detail', 'error');
          $('#dtb-detail-loading').hide();
        });
    },

    renderDetail: function (ticket, events) {
      if (!ticket) {
        return;
      }

      var detail =
        '<div class="dtb-topbar dtb-topbar--detail">' +
        '<div class="dtb-topbar__ticket-wrap"><h2 class="dtb-topbar__title">' +
        esc(ticket.ticket_number) +
        ' . ' +
        esc(ticket.subject) +
        '</h2><div class="dtb-detail-chip-row">' +
        '<span class="dtb-detail-chip dtb-detail-chip--status">' +
        esc(ticket.status_label || ticket.status) +
        '</span>' +
        '<span class="dtb-detail-chip dtb-detail-chip--priority">' +
        esc(ticket.priority_label || ticket.priority) +
        '</span>' +
        '<span class="dtb-detail-chip dtb-detail-chip--action">Action: ' +
        esc(ticket.action_state_label || ticket.action_state || 'On Track') +
        '</span>' +
        '</div></div>' +
        '<div class="dtb-detail-top-actions"><button class="dtb-btn dtb-btn--ghost dtb-btn--sm" onclick="dtbSupport.copyTicketSummary()">Copy Summary</button><button class="dtb-btn dtb-btn--ghost dtb-btn--sm" onclick="dtbSupport.closeDetail(event)">Close</button></div>' +
        '</div>' +
        '<div class="dtb-detail-shell">' +
        '<div class="dtb-detail-main">' +
        this.renderInsightStrip(ticket, events) +
        '<div id="dtb-thread-panel-host">' +
        this.renderThreadPanel(events) +
        '</div>' +
        this.renderComposer(ticket) +
        '</div>' +
        '<aside class="dtb-detail-sidebar">' +
        this.renderContextSidebar(ticket) +
        '</aside>' +
        '</div>';

      $('#dtb-detail-content').html(detail);
    },

    buildTimelineEvents: function (ticket, events) {
      var timeline = (events || []).slice();
      if (!ticket) {
        return timeline;
      }

      if (ticket.message && !this.hasCustomerMessageEvent(timeline)) {
        timeline.unshift({
          id: 'origin-message',
          event_type: 'ticket.created',
          event_label: 'Original Contact Message',
          event_group: 'message',
          actor_type: 'customer',
          actor_label: ticket.customer_name || 'Customer',
          source: ticket.source || 'web_form',
          created_at: ticket.created_at || '',
          body: ticket.message,
          summary: ticket.message,
          payload: {},
          synthetic: true
        });
      }

      return timeline;
    },

    hasCustomerMessageEvent: function (events) {
      return (events || []).some(function (event) {
        var group = event.event_group || '';
        var actorType = event.actor_type || '';
        var body = String(event.body || event.summary || '').trim();
        return body && (group === 'message' || actorType === 'customer');
      });
    },

    renderInsightStrip: function (ticket, events) {
      var assigned = ticket.assigned_user && ticket.assigned_user.display_name ? ticket.assigned_user.display_name : 'Unassigned';
      var actionDue = ticket.action_due_at ? this.formatDateTime(ticket.action_due_at) : 'Not set';
      var lastCustomer = ticket.last_customer_reply_at ? this.formatDateTime(ticket.last_customer_reply_at) : 'None yet';
      var lastStaff = ticket.last_staff_reply_at ? this.formatDateTime(ticket.last_staff_reply_at) : 'None yet';
      var notification = ticket.notification_status || 'unknown';
      var eventCount = events.length;

      return (
        '<section class="dtb-insights-grid">' +
        '<article class="dtb-insight-card"><div class="dtb-insight-card__title">Customer</div><div class="dtb-insight-card__primary">' +
        esc(ticket.customer_name || 'Unknown') +
        '</div><div class="dtb-insight-card__meta">' +
        esc(ticket.customer_email || 'No email') +
        '</div><div class="dtb-insight-card__meta">Assigned: ' +
        esc(assigned) +
        '</div></article>' +
        '<article class="dtb-insight-card"><div class="dtb-insight-card__title">Action Clock</div><div class="dtb-insight-card__primary">' +
        esc(ticket.action_state_label || ticket.action_state || 'On Track') +
        '</div><div class="dtb-insight-card__meta">Due: ' +
        esc(actionDue) +
        '</div><div class="dtb-insight-card__meta">Follow-up: ' +
        esc(ticket.followup_due_at ? this.formatDateTime(ticket.followup_due_at) : 'Not set') +
        '</div></article>' +
        '<article class="dtb-insight-card"><div class="dtb-insight-card__title">Activity</div><div class="dtb-insight-card__primary">' +
        esc(eventCount) +
        ' Events</div><div class="dtb-insight-card__meta">Last customer: ' +
        esc(lastCustomer) +
        '</div><div class="dtb-insight-card__meta">Last staff: ' +
        esc(lastStaff) +
        '</div></article>' +
        '<article class="dtb-insight-card"><div class="dtb-insight-card__title">Delivery Health</div><div class="dtb-insight-card__primary">' +
        esc(notification) +
        '</div><div class="dtb-insight-card__meta">Failures: ' +
        esc(ticket.notification_fail_count || 0) +
        '</div><div class="dtb-insight-card__meta">Last sent: ' +
        esc(ticket.notification_last_sent_at ? this.formatDateTime(ticket.notification_last_sent_at) : 'Never') +
        '</div></article>' +
        '</section>'
      );
    },

    renderThreadPanel: function (events) {
      return (
        '<section class="dtb-thread-panel">' +
        '<div class="dtb-thread-panel__header"><div class="dtb-thread-panel__title">Timeline & History</div><div class="dtb-thread-panel__filters">' +
        this.renderEventFilters() +
        '</div></div>' +
        '<div class="dtb-thread">' +
        this.renderThread(events) +
        '</div>' +
        '</section>'
      );
    },

    renderEventFilters: function () {
      var self = this;
      var filters = [
        ['all', 'All'],
        ['message', 'Messages'],
        ['workflow', 'Workflow'],
        ['internal', 'Internal'],
        ['delivery', 'Delivery'],
        ['system', 'System']
      ];

      return filters
        .map(function (filter) {
          var active = self.currentEventFilter === filter[0] ? ' is-active' : '';
          return '<button class="dtb-event-filter' + active + '" data-filter="' + esc(filter[0]) + '">' + esc(filter[1]) + '</button>';
        })
        .join('');
    },

    setEventFilter: function (filter) {
      this.currentEventFilter = filter || 'all';
      if ($('#dtb-thread-panel-host').length) {
        $('#dtb-thread-panel-host').html(this.renderThreadPanel(this.currentDisplayEvents || []));
      }
    },

    getFilteredEvents: function (events) {
      var filter = this.currentEventFilter || 'all';
      if (filter === 'all') {
        return events || [];
      }

      return (events || []).filter(function (event) {
        return (event.event_group || 'system') === filter;
      });
    },

    renderThread: function (events) {
      var filtered = this.getFilteredEvents(events || []);
      if (!filtered.length) {
        return '<div class="dtb-empty"><p class="dtb-empty__msg">No events for this filter.</p><p class="dtb-empty__sub">Try viewing all timeline activity.</p></div>';
      }

      var self = this;
      return filtered
        .map(function (event) {
          return self.renderEvent(event);
        })
        .join('');
    },

    renderEvent: function (event) {
      var group = event.event_group || 'system';
      var actor = event.actor_label || 'System';
      var isCustomer = event.actor_type === 'customer';
      var body = this.resolveEventBody(event);
      var created = event.created_at ? this.formatDateTime(event.created_at) : '';
      var source = event.source ? String(event.source) : '';

      var messageClass = 'dtb-msg dtb-msg--' + (group === 'internal' ? 'internal' : isCustomer ? 'customer' : 'staff');
      if (group === 'delivery') {
        messageClass += ' dtb-msg--delivery';
      }
      if (group === 'system') {
        messageClass += ' dtb-msg--system';
      }

      var metaBits =
        '<span class="dtb-msg__author">' +
        esc(actor) +
        '</span><span class="dtb-msg__time">' +
        esc(created) +
        '</span><span class="dtb-msg__pill">' +
        esc(event.event_label || event.event_type || 'Event') +
        '</span>' +
        (source ? '<span class="dtb-msg__pill dtb-msg__pill--subtle">' + esc(source) + '</span>' : '');

      return (
        '<article class="' +
        messageClass +
        '"><div class="dtb-msg__header">' +
        metaBits +
        '</div><div class="dtb-msg__body">' +
        nl2br(body) +
        '</div>' +
        this.renderEventPayload(event.payload) +
        '</article>'
      );
    },

    renderEventPayload: function (payload) {
      if (!payload || typeof payload !== 'object') {
        return '';
      }

      var keys = Object.keys(payload);
      if (!keys.length) {
        return '';
      }

      var rows = keys.slice(0, 6).map(function (key) {
        var value = payload[key];
        if (value == null) {
          value = '';
        } else if (typeof value === 'object') {
          value = JSON.stringify(value);
        } else {
          value = String(value);
        }

        return (
          '<div class="dtb-payload-row"><span class="dtb-payload-row__key">' +
          esc(key) +
          '</span><span class="dtb-payload-row__value">' +
          esc(value) +
          '</span></div>'
        );
      });

      return '<div class="dtb-payload">' + rows.join('') + '</div>';
    },

    resolveEventBody: function (event) {
      if (event.summary) {
        return String(event.summary);
      }

      if (event.body) {
        return String(event.body);
      }

      if (event.from_status || event.to_status) {
        return String(event.from_status || '') + ' -> ' + String(event.to_status || '');
      }

      return event.event_label || event.event_type || '-';
    },

    renderComposer: function (ticket) {
      return (
        '<div class="dtb-composer' +
        (this.composerMode === 'note' ? ' dtb-composer--internal' : '') +
        '" style="margin-top:16px"><div class="dtb-composer__mode-tabs"><button class="dtb-composer__mode-tab ' +
        (this.composerMode === 'reply' ? 'is-active' : '') +
        '" onclick="dtbSupport.setComposerMode(\'reply\')">Reply</button><button class="dtb-composer__mode-tab ' +
        (this.composerMode === 'note' ? 'is-active is-active--internal' : '') +
        '" onclick="dtbSupport.setComposerMode(\'note\')">Internal Note</button></div><div class="dtb-composer__body"><textarea id="dtb-composer-body" class="dtb-composer__textarea" placeholder="' +
        (this.composerMode === 'note' ? 'Add an internal note...' : 'Write a reply...') +
        '"></textarea></div><div class="dtb-composer__footer"><span class="dtb-internal-label" ' +
        (this.composerMode === 'note' ? '' : 'style="display:none"') +
        '>Internal</span><div class="dtb-macro-host"><button class="dtb-btn dtb-btn--ghost dtb-btn--sm" onclick="dtbSupport.showMacroPicker()">Macros</button><div id="dtb-macro-picker" class="dtb-macro-picker" style="display:none"></div></div><div style="margin-left:auto;display:flex;gap:8px"><button class="dtb-btn dtb-btn--ghost dtb-btn--sm" onclick="dtbSupport.' +
        (this.composerMode === 'note' ? 'addNote' : 'sendReply') +
        '(' +
        ticket.id +
        ')">Send</button></div></div></div>'
      );
    },

    renderContextSidebar: function (ticket) {
      var assigned = ticket.assigned_user && ticket.assigned_user.display_name ? ticket.assigned_user.display_name : 'Unassigned';
      var tags = (ticket.tags || []).length ? ticket.tags.join(', ') : 'None';
      var metadata = ticket.metadata && Object.keys(ticket.metadata).length ? JSON.stringify(ticket.metadata, null, 2) : '';
      var messagePreview = String(ticket.message || '').trim();

      return (
        '<div class="dtb-ctx-section"><div class="dtb-ctx-section__title">Ticket Snapshot</div>' +
        '<div class="dtb-ctx-row"><span class="dtb-ctx-label">Ticket</span><span class="dtb-ctx-value">' +
        esc(ticket.ticket_number || ticket.id) +
        '</span></div>' +
        '<div class="dtb-ctx-row"><span class="dtb-ctx-label">Type</span><span class="dtb-ctx-value">' +
        esc(ticket.type_label || ticket.ticket_type || '-') +
        '</span></div>' +
        '<div class="dtb-ctx-row"><span class="dtb-ctx-label">Status</span><span class="dtb-ctx-value">' +
        esc(ticket.status_label || ticket.status) +
        '</span></div>' +
        '<div class="dtb-ctx-row"><span class="dtb-ctx-label">Priority</span><span class="dtb-ctx-value">' +
        esc(ticket.priority_label || ticket.priority) +
        '</span></div>' +
        '<div class="dtb-ctx-row"><span class="dtb-ctx-label">Assigned</span><span class="dtb-ctx-value">' +
        esc(assigned) +
        '</span></div>' +
        '<div class="dtb-ctx-row"><span class="dtb-ctx-label">Order</span><span class="dtb-ctx-value">' +
        esc(ticket.order_id || '-') +
        '</span></div>' +
        '<div class="dtb-ctx-row"><span class="dtb-ctx-label">Tags</span><span class="dtb-ctx-value">' +
        esc(tags) +
        '</span></div>' +
        '<div class="dtb-ctx-row"><span class="dtb-ctx-label">Contact message</span><span class="dtb-ctx-value">' +
        esc(messagePreview ? 'Available' : 'Missing') +
        '</span></div>' +
        (messagePreview
          ? '<div class="dtb-ctx-message-preview">' + nl2br(messagePreview) + '</div>'
          : '<p class="dtb-empty__sub" style="margin:8px 0 0;">No original contact message on this ticket record.</p>') +
        '</div>' +
        '<div class="dtb-ctx-section"><div class="dtb-ctx-section__title">Workflow Tools</div>' +
        '<div class="dtb-tool-field"><label class="dtb-tool-label">Status</label><select id="dtb-ticket-status" class="dtb-select">' +
        this.renderStatusOptions(ticket.status) +
        '</select></div>' +
        '<div class="dtb-tool-field"><label class="dtb-tool-label">Priority</label><select id="dtb-ticket-priority" class="dtb-select">' +
        this.renderPriorityOptions(ticket.priority) +
        '</select></div>' +
        '<button class="dtb-btn dtb-btn--primary dtb-btn--sm dtb-tool-apply" onclick="dtbSupport.applyTicketWorkflow(' +
        ticket.id +
        ')">Apply Ticket Updates</button>' +
        '<div class="dtb-quick-actions"><a href="#" class="dtb-qa-btn" onclick="dtbSupport.assignToMe(' +
        ticket.id +
        ');return false;">Assign to me</a><a href="#" class="dtb-qa-btn" onclick="dtbSupport.unassignTicket(' +
        ticket.id +
        ');return false;">Unassign</a><a href="#" class="dtb-qa-btn dtb-qa-btn--resolve" onclick="dtbSupport.resolveTicket(' +
        ticket.id +
        ');return false;">Resolve</a><a href="#" class="dtb-qa-btn" onclick="dtbSupport.setPriority(' +
        ticket.id +
        ',\'urgent\');return false;">Urgent</a><a href="#" class="dtb-qa-btn dtb-qa-btn--spam" onclick="dtbSupport.setStatus(' +
        ticket.id +
        ',\'spam\');return false;">Spam</a></div></div>' +
        '<div class="dtb-ctx-section"><div class="dtb-ctx-section__title">Snooze & Follow-up</div>' +
        '<div class="dtb-quick-actions"><a href="#" class="dtb-qa-btn" onclick="dtbSupport.quickSnoozeHours(' +
        ticket.id +
        ',4);return false;">Snooze 4h</a><a href="#" class="dtb-qa-btn" onclick="dtbSupport.quickSnoozeHours(' +
        ticket.id +
        ',24);return false;">Snooze 24h</a><a href="#" class="dtb-qa-btn" onclick="dtbSupport.quickSnoozeTomorrow(' +
        ticket.id +
        ');return false;">Snooze until tomorrow</a>' +
        (ticket.is_snoozed ? '<a href="#" class="dtb-qa-btn" onclick="dtbSupport.unsnoozeTicket(' + ticket.id + ');return false;">Unsnooze</a>' : '') +
        '</div>' +
        '<div class="dtb-quick-actions" style="margin-top:8px;"><a href="#" class="dtb-qa-btn" onclick="dtbSupport.quickFollowupHours(' +
        ticket.id +
        ',2);return false;">Follow-up 2h</a><a href="#" class="dtb-qa-btn" onclick="dtbSupport.quickFollowupHours(' +
        ticket.id +
        ',24);return false;">Follow-up 24h</a><a href="#" class="dtb-qa-btn" onclick="dtbSupport.quickFollowupTomorrow(' +
        ticket.id +
        ');return false;">Follow-up tomorrow</a></div>' +
        '</div>' +
        '<div class="dtb-ctx-section"><div class="dtb-ctx-section__title">Diagnostics</div><div class="dtb-quick-actions"><a href="#" class="dtb-qa-btn" onclick="dtbSupport.copyTicketSummary();return false;">Copy Summary</a>' +
        (ticket.edit_url ? '<a href="' + esc(ticket.edit_url) + '" class="dtb-qa-btn" target="_blank" rel="noopener">Open Direct</a>' : '') +
        '</div>' +
        '<div class="dtb-ctx-row"><span class="dtb-ctx-label">Created</span><span class="dtb-ctx-value">' +
        esc(ticket.created_at ? this.formatDateTime(ticket.created_at) : '-') +
        '</span></div>' +
        '<div class="dtb-ctx-row"><span class="dtb-ctx-label">Updated</span><span class="dtb-ctx-value">' +
        esc(ticket.updated_at ? this.formatDateTime(ticket.updated_at) : '-') +
        '</span></div>' +
        (metadata ? '<pre class="dtb-ctx-metadata">' + esc(metadata) + '</pre>' : '<p class="dtb-empty__sub" style="margin:8px 0 0;">No metadata attached.</p>') +
        '</div>'
      );
    },

    renderStatusOptions: function (current) {
      var options = [
        ['open', 'Open'],
        ['pending_staff', 'Pending Staff'],
        ['pending_customer', 'Pending Customer'],
        ['in_progress', 'In Progress'],
        ['resolved', 'Resolved'],
        ['closed', 'Closed'],
        ['spam', 'Spam']
      ];

      return options
        .map(function (option) {
          return '<option value="' + esc(option[0]) + '" ' + (current === option[0] ? 'selected' : '') + '>' + esc(option[1]) + '</option>';
        })
        .join('');
    },

    renderPriorityOptions: function (current) {
      var options = [
        ['low', 'Low'],
        ['normal', 'Normal'],
        ['high', 'High'],
        ['urgent', 'Urgent']
      ];

      return options
        .map(function (option) {
          return '<option value="' + esc(option[0]) + '" ' + (current === option[0] ? 'selected' : '') + '>' + esc(option[1]) + '</option>';
        })
        .join('');
    },

    applyTicketWorkflow: function (ticketId) {
      var self = this;
      var patch = {};

      var status = $('#dtb-ticket-status').val();
      var priority = $('#dtb-ticket-priority').val();

      if (status && this.currentTicket && status !== this.currentTicket.status) {
        patch.status = status;
      }
      if (priority && this.currentTicket && priority !== this.currentTicket.priority) {
        patch.priority = priority;
      }

      if (!Object.keys(patch).length) {
        this.showToast('No ticket changes to apply', 'info');
        return;
      }

      this.api('PATCH', 'tickets/' + ticketId, patch)
        .done(function () {
          self.showToast('Ticket updated', 'success');
          self.refresh();
        })
        .fail(function (xhr) {
          self.showToast((xhr.responseJSON && xhr.responseJSON.message) || 'Update failed', 'error');
        });
    },

    setComposerMode: function (mode) {
      this.composerMode = mode === 'note' ? 'note' : 'reply';
      if (this.activeTicketId) {
        this.openTicket(this.activeTicketId);
      }
    },

    getComposerBody: function () {
      return $('#dtb-composer-body').val() || '';
    },

    sendReply: function (ticketId) {
      var self = this;
      var body = this.getComposerBody();
      if (!$.trim(body)) {
        this.showToast('Reply body required', 'info');
        return;
      }

      this.api('POST', 'tickets/' + ticketId + '/reply', {
        message: body,
        is_internal: false
      })
        .done(function () {
          self.showToast('Reply sent', 'success');
          self.openTicket(ticketId);
          self.loadTickets(self.activeQueue, self.filters);
        })
        .fail(function (xhr) {
          self.showToast((xhr.responseJSON && xhr.responseJSON.message) || 'Reply failed', 'error');
        });
    },

    addNote: function (ticketId) {
      var self = this;
      var body = this.getComposerBody();
      if (!$.trim(body)) {
        this.showToast('Note body required', 'info');
        return;
      }

      this.api('POST', 'tickets/' + ticketId + '/reply', {
        message: body,
        is_internal: true
      })
        .done(function () {
          self.showToast('Internal note added', 'success');
          self.openTicket(ticketId);
        })
        .fail(function (xhr) {
          self.showToast((xhr.responseJSON && xhr.responseJSON.message) || 'Note failed', 'error');
        });
    },

    loadMacros: function () {
      var self = this;
      return this.api('GET', 'macros').done(function (res) {
        self.macros = res.macros || [];
      });
    },

    showMacroPicker: function () {
      var self = this;
      var $picker = $('#dtb-macro-picker');
      if (!$picker.length) {
        return;
      }

      if ($picker.is(':visible')) {
        $picker.hide();
        return;
      }

      if (!this.macros.length) {
        this.loadMacros().done(function () {
          self.showMacroPicker();
        });
        return;
      }

      $picker
        .html(
          this.macros
            .map(function (macro) {
              return (
                '<div class="dtb-macro-item" onclick="dtbSupport.applyMacro(' +
                macro.id +
                ')"><div class="dtb-macro-item__name">' +
                esc(macro.macro_name) +
                '</div><div class="dtb-macro-item__cat">' +
                esc(macro.category) +
                '</div></div>'
              );
            })
            .join('')
        )
        .show();
    },

    applyMacro: function (macroId) {
      var self = this;
      if (!this.activeTicketId) {
        return;
      }

      this.api('POST', 'macros/' + macroId + '/render', {
        ticket_id: this.activeTicketId
      }).done(function (res) {
        $('#dtb-composer-body').val(res.body || '');
        $('#dtb-macro-picker').hide();
        self.showToast('Macro applied', 'success');
      });
    },

    assignToMe: function (ticketId) {
      var self = this;
      this.api('PATCH', 'tickets/' + ticketId, {
        assigned_user_id: cfg.currentUserId
      }).done(function () {
        self.showToast('Ticket assigned', 'success');
        self.refresh();
      });
    },

    unassignTicket: function (ticketId) {
      var self = this;
      this.api('POST', 'bulk', {
        ticket_ids: [ticketId],
        action: 'unassign'
      }).done(function () {
        self.showToast('Ticket unassigned', 'success');
        self.refresh();
      });
    },

    setStatus: function (ticketId, status) {
      var self = this;
      this.api('PATCH', 'tickets/' + ticketId, {
        status: status
      }).done(function () {
        self.showToast('Status updated', 'success');
        self.refresh();
      });
    },

    setPriority: function (ticketId, priority) {
      var self = this;
      this.api('PATCH', 'tickets/' + ticketId, {
        priority: priority
      }).done(function () {
        self.showToast('Priority updated', 'success');
        self.refresh();
      });
    },

    snoozeTicket: function (ticketId, until, reason) {
      var self = this;
      var snoozeUntil = until || window.prompt('Snooze until (YYYY-MM-DD HH:MM:SS UTC)');
      if (!snoozeUntil) {
        return;
      }

      var snoozeReason = reason || window.prompt('Reason (optional)', '') || '';
      this.api('POST', 'tickets/' + ticketId + '/snooze', {
        snooze_until: snoozeUntil,
        reason: snoozeReason
      }).done(function () {
        self.showToast('Ticket snoozed', 'success');
        self.refresh();
      });
    },

    unsnoozeTicket: function (ticketId) {
      var self = this;
      this.api('DELETE', 'tickets/' + ticketId + '/snooze')
        .done(function () {
          self.showToast('Ticket unsnoozed', 'success');
          self.refresh();
        })
        .fail(function (xhr) {
          self.showToast((xhr.responseJSON && xhr.responseJSON.message) || 'Unsnooze failed', 'error');
        });
    },

    quickSnoozeHours: function (ticketId, hours) {
      var date = new Date(Date.now() + hours * 60 * 60 * 1000);
      this.snoozeTicket(ticketId, toUtcMysql(date), 'Quick snooze: ' + hours + 'h');
    },

    quickSnoozeTomorrow: function (ticketId) {
      var date = new Date();
      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0);
      this.snoozeTicket(ticketId, toUtcMysql(date), 'Quick snooze: tomorrow 9AM local');
    },

    quickFollowupHours: function (ticketId, hours) {
      var self = this;
      var date = new Date(Date.now() + hours * 60 * 60 * 1000);
      this.api('POST', 'tickets/' + ticketId + '/followup', {
        followup_due_at: toUtcMysql(date),
        note: 'Quick follow-up set for ' + hours + 'h'
      }).done(function () {
        self.showToast('Follow-up scheduled', 'success');
        self.refresh();
      });
    },

    quickFollowupTomorrow: function (ticketId) {
      var self = this;
      var date = new Date();
      date.setDate(date.getDate() + 1);
      date.setHours(10, 0, 0, 0);
      this.api('POST', 'tickets/' + ticketId + '/followup', {
        followup_due_at: toUtcMysql(date),
        note: 'Quick follow-up set for tomorrow 10AM local'
      }).done(function () {
        self.showToast('Follow-up scheduled', 'success');
        self.refresh();
      });
    },

    resolveTicket: function (ticketId) {
      this.setStatus(ticketId, 'resolved');
    },

    toggleBulkSelect: function (ticketId, checked) {
      if (checked) {
        this.selectedTickets[ticketId] = true;
      } else {
        delete this.selectedTickets[ticketId];
      }

      $('#dtb-row-' + ticketId).toggleClass('is-selected', Boolean(checked));
      var count = Object.keys(this.selectedTickets).length;
      $('#dtb-bulk-bar').toggle(count > 0);
      $('#dtb-bulk-count').text(count + ' selected');
    },

    selectAll: function (checked) {
      var self = this;
      $('#dtb-tickets-tbody input[type="checkbox"]').each(function () {
        this.checked = Boolean(checked);
        self.toggleBulkSelect(parseInt($(this).closest('tr').attr('id').replace('dtb-row-', ''), 10), Boolean(checked));
      });

      if (!checked) {
        this.clearSelection();
      }
    },

    clearSelection: function () {
      this.selectedTickets = {};
      $('#dtb-bulk-bar').hide();
      $('#dtb-select-all').prop('checked', false);
      $('#dtb-tickets-tbody input[type="checkbox"]').prop('checked', false);
      $('#dtb-tickets-tbody tr').removeClass('is-selected');
    },

    applyBulkAction: function (action, value) {
      var self = this;
      var ids = Object.keys(this.selectedTickets).map(function (id) {
        return parseInt(id, 10);
      });

      if (!ids.length) {
        this.showToast('Select tickets first', 'info');
        return;
      }

      return this.api('POST', 'bulk', {
        ticket_ids: ids,
        action: action,
        value: value || ''
      }).done(function (res) {
        self.showToast('Processed ' + (res.processed || []).length + ' tickets', 'success');
        if ((res.errors || []).length) {
          self.showToast((res.errors || []).length + ' errors encountered', 'error');
        }
        self.clearSelection();
        self.refresh();
      });
    },

    executeBulkAction: function () {
      var raw = $('#dtb-bulk-action').val() || '';
      if (!raw) {
        return;
      }
      var parts = String(raw).split(':');
      this.applyBulkAction(parts[0], parts[1] || '');
    },

    prevPage: function () {
      if (this.page > 1) {
        this.page--;
        this.loadTickets(this.activeQueue, this.filters);
      }
    },

    nextPage: function () {
      if (this.page < this.pageCount) {
        this.page++;
        this.loadTickets(this.activeQueue, this.filters);
      }
    },

    initKeyboardShortcuts: function () {
      var self = this;
      $(document).on('keydown', function (e) {
        if ($(document.activeElement).is('input,textarea,select,[contenteditable]')) {
          return;
        }

        if (e.key === '/') {
          e.preventDefault();
          $('#dtb-search').focus();
        }

        if (e.key === 'r') {
          self.refresh();
        }

        if (e.key === 'Escape') {
          self.closeDetail({ target: { id: 'dtb-detail-overlay' } });
        }
      });
    },

    closeDetail: function (event) {
      if (event && event.target && event.target.id !== 'dtb-detail-overlay' && event.target.id !== 'dtb-detail-panel') {
        return;
      }

      $('#dtb-detail-overlay').hide();
      this.activeTicketId = null;
      this.currentTicket = null;
      this.currentEvents = [];
      this.currentDisplayEvents = [];
    },

    api: function (method, path, data) {
      var url = (cfg.restUrl || '') + String(path || '').replace(/^\//, '');
      var payload = data;

      if (method === 'GET' && payload) {
        url += (url.indexOf('?') === -1 ? '?' : '&') + $.param(payload);
        payload = undefined;
      }

      return $.ajax({
        url: url,
        method: method,
        contentType: 'application/json',
        data: payload ? JSON.stringify(payload) : undefined,
        beforeSend: function (xhr) {
          xhr.setRequestHeader('X-WP-Nonce', cfg.nonce || '');
        }
      });
    },

    showToast: function (message, type) {
      var $toast = $('<div class="dtb-toast dtb-toast--' + esc(type || 'info') + '">' + esc(message) + '</div>');
      $('#dtb-toast-container').append($toast);
      setTimeout(function () {
        $toast.fadeOut(200, function () {
          $(this).remove();
        });
      }, 3000);
    },

    copyTicketSummary: function () {
      if (!this.currentTicket) {
        return;
      }

      var text = this.buildTicketSummary();
      var self = this;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(function () {
            self.showToast('Ticket summary copied', 'success');
          })
          .catch(function () {
            self.fallbackCopyText(text);
          });
        return;
      }

      this.fallbackCopyText(text);
    },

    fallbackCopyText: function (text) {
      var self = this;
      var $textarea = $('<textarea>').val(text).appendTo('body');
      $textarea[0].select();
      try {
        document.execCommand('copy');
        self.showToast('Ticket summary copied', 'success');
      } catch (err) {
        self.showToast('Copy failed', 'error');
      }
      $textarea.remove();
    },

    buildTicketSummary: function () {
      var ticket = this.currentTicket || {};
      var events = (this.currentDisplayEvents || this.currentEvents || []).slice(-5).map(function (event) {
        return '- [' + (event.event_label || event.event_type || 'Event') + '] ' + (event.summary || event.body || 'No details');
      });

      var assigned = ticket.assigned_user && ticket.assigned_user.display_name ? ticket.assigned_user.display_name : 'Unassigned';

      return [
        'Ticket: ' + (ticket.ticket_number || ticket.id || ''),
        'Subject: ' + (ticket.subject || ''),
        'Customer: ' + (ticket.customer_name || '') + ' <' + (ticket.customer_email || '') + '>',
        'Original Message: ' + (ticket.message ? ticket.message.replace(/\s+/g, ' ').trim() : 'n/a'),
        'Status: ' + (ticket.status_label || ticket.status || ''),
        'Priority: ' + (ticket.priority_label || ticket.priority || ''),
        'Assigned: ' + assigned,
        'Action State: ' + (ticket.action_state_label || ticket.action_state || 'On Track'),
        'Action Due: ' + (ticket.action_due_at || 'n/a'),
        'Follow-up: ' + (ticket.followup_due_at || 'n/a'),
        'Notification: ' + (ticket.notification_status || 'unknown') + ' (failures: ' + (ticket.notification_fail_count || 0) + ')',
        '',
        'Recent Timeline:',
        events.join('\n') || '- No events yet.'
      ].join('\n');
    },

    formatActionTime: function (seconds) {
      var totalSeconds = parseInt(seconds, 10);
      if (!totalSeconds && totalSeconds !== 0) {
        return 'OK';
      }
      if (totalSeconds < 0) {
        return 'Overdue';
      }

      var days = Math.floor(totalSeconds / 86400);
      var hours = Math.floor((totalSeconds % 86400) / 3600);
      var minutes = Math.floor((totalSeconds % 3600) / 60);

      if (days > 0) {
        return days + 'd ' + hours + 'h';
      }
      if (hours > 0) {
        return hours + 'h ' + minutes + 'm';
      }
      return minutes + 'm';
    },

    formatAge: function (datetime) {
      var ts = Date.parse(datetime + 'Z');
      if (!ts) {
        return '-';
      }

      var seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
      if (seconds < 60) {
        return 'now';
      }
      if (seconds < 3600) {
        return Math.round(seconds / 60) + 'm';
      }
      if (seconds < 86400) {
        return Math.round(seconds / 3600) + 'h';
      }
      return Math.round(seconds / 86400) + 'd';
    },

    formatDateTime: function (datetime) {
      var parsed = Date.parse(String(datetime).replace(' ', 'T') + 'Z');
      if (!parsed) {
        return String(datetime);
      }

      return new Date(parsed).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    },

    startAutoRefresh: function () {
      var self = this;
      this.stopAutoRefresh();

      var interval = Math.max(30, parseInt(cfg.pollInterval || 60, 10)) * 1000;
      this.autoRefreshTimer = setInterval(function () {
        self.loadQueueCounts();
        self.loadKpis();
      }, interval);
    },

    stopAutoRefresh: function () {
      if (this.autoRefreshTimer) {
        clearInterval(this.autoRefreshTimer);
        this.autoRefreshTimer = null;
      }
    }
  };

  $(document).ready(function () {
    if ($('.dtb-cc-shell').length || $('#dtb-reply-form').length) {
      window.dtbSupport.init();
    }
  });
})(jQuery);
