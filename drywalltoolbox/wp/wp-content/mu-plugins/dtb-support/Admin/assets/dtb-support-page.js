/* global DtbAdmin, dtbAdminConfig */
( function () {
	'use strict';

	var MODAL_ID = 'dtb-support-ticket-modal';
	var state = {
		currentTicketId: 0,
		currentTicketUrl: '',
	};

	function byId( id ) {
		return document.getElementById( id );
	}

	function escHtml( value ) {
		var d = document.createElement( 'div' );
		d.appendChild( document.createTextNode( String( value == null ? '' : value ) ) );
		return d.innerHTML;
	}

	function getWorkbench() {
		return byId( 'dtb-support-workbench' );
	}

	function getLiveRegion() {
		return byId( 'dtb-support-workspace' );
	}

	function getModalElements() {
		var overlay = byId( MODAL_ID );
		if ( ! overlay ) {
			return null;
		}
		return {
			overlay: overlay,
			title: overlay.querySelector( '.dtb-modal__title' ),
			body: overlay.querySelector( '.dtb-modal__body' ),
			viewButton: overlay.querySelector( '[data-dtb-support-modal-action="view"]' ),
		};
	}

	function normalizeStatus( status ) {
		var map = {
			all: '',
			needs_reply: 'needs-reply',
			past_sla: 'past-sla',
		};
		var key = String( status || '' );
		return map[ key ] != null ? map[ key ] : key;
	}

	function resolveActiveQueue( query ) {
		if ( query.queue ) {
			return query.queue;
		}
		var status = normalizeStatus( query.status || query.tab || '' );
		var map = {
			'': 'all_active',
			open: 'all_active',
			'needs-reply': 'needs_reply',
			'past-sla': 'overdue',
			resolved: 'resolved_pending_close',
		};
		return map[ status ] || 'all_active';
	}

	function currentQueryFromUrl() {
		var params = new URLSearchParams( window.location.search );
		return {
			status: normalizeStatus( params.get( 'status' ) || params.get( 'tab' ) || '' ),
			queue: params.get( 'queue' ) || '',
			search: params.get( 'search' ) || params.get( 's' ) || '',
			type: params.get( 'type' ) || '',
			priority: params.get( 'priority' ) || '',
			paged: params.get( 'paged' ) || '1',
		};
	}

	function updateQueueUi( activeQueue ) {
		document.querySelectorAll( '[data-dtb-support-queue]' ).forEach( function ( el ) {
			el.classList.toggle( 'is-active', el.getAttribute( 'data-dtb-support-queue' ) === activeQueue );
		} );
		var active = document.querySelector( '[data-dtb-support-queue="' + activeQueue + '"] .dtb-support-queue__label' );
		var label = active ? active.textContent : 'All Active';
		document.querySelectorAll( '[data-dtb-support-current-queue]' ).forEach( function ( el ) {
			el.textContent = label;
		} );
	}

	function syncFiltersFromQuery( query ) {
		var search = document.querySelector( '[data-dtb-support-search]' );
		var type = document.querySelector( '[data-dtb-support-filter="type"]' );
		var priority = document.querySelector( '[data-dtb-support-filter="priority"]' );
		if ( search && search.value !== String( query.search || '' ) ) {
			search.value = String( query.search || '' );
		}
		if ( type ) {
			type.value = String( query.type || '' );
		}
		if ( priority ) {
			priority.value = String( query.priority || '' );
		}
	}

	function setTicketParam( ticketId ) {
		if ( ! window.URL || ! window.history || ! window.history.replaceState ) {
			return;
		}
		var url = new URL( window.location.href );
		if ( ticketId ) {
			url.searchParams.set( 'ticket_id', String( ticketId ) );
		} else {
			url.searchParams.delete( 'ticket_id' );
		}
		window.history.replaceState( {}, '', url.toString() );
	}

	function getTicketUrl( ticketId, preferredUrl ) {
		if ( preferredUrl ) {
			return preferredUrl;
		}
		var adminUrl = window.dtbAdminConfig && window.dtbAdminConfig.adminUrl ? window.dtbAdminConfig.adminUrl : '/wp-admin/admin.php';
		var joiner = adminUrl.indexOf( '?' ) === -1 ? '?' : '&';
		return adminUrl + joiner + 'page=dtb-support&ticket_id=' + encodeURIComponent( String( ticketId || '' ) );
	}

	function renderModalLoading( els, ticketRef ) {
		if ( els.title ) {
			els.title.textContent = ticketRef ? 'Ticket ' + ticketRef : 'Support Ticket';
		}
		if ( els.body ) {
			els.body.innerHTML = '<div class="dtb-support-modal-loading">Loading ticket details…</div>';
		}
	}

	function renderModalError( els ) {
		if ( els.body ) {
			els.body.innerHTML = '<div class="dtb-support-modal-error">Unable to load ticket details.</div>';
		}
	}

	function renderTicketModal( els, payload ) {
		var ticket = payload && payload.ticket ? payload.ticket : {};
		var events = payload && payload.events ? payload.events : [];
		var ticketLabel = ticket.ticket_number || ( '#' + ( ticket.id || '' ) );
		var customer = ticket.customer_name || ticket.customer_email || '—';
		var subject = ticket.subject || '—';
		var status = ticket.status_label || ticket.status || '—';
		var priority = ticket.priority_label || ticket.priority || '—';
		var typeLabel = ticket.type_label || ticket.ticket_type || '—';
		var message = ticket.message || '';
		var created = ticket.created_at || '—';
		var updated = ticket.updated_at || '—';
		var dueAt = ticket.action_due_at || '—';

		var timeline = '';
		if ( Array.isArray( events ) && events.length ) {
			timeline = events.slice( 0, 60 ).map( function ( ev ) {
				var evGroup = ev.group || 'system';
				var evLabel = ev.event_label || ev.event_type || 'Event';
				var evWhen = ev.created_at || '';
				var evBody = ev.summary || ev.body || '—';
				return '<article class="dtb-support-ticket-message dtb-support-ticket-message--' + escHtml( evGroup ) + '">'
					+ '<header class="dtb-support-ticket-message__meta"><strong>' + escHtml( evLabel ) + '</strong><span>' + escHtml( evWhen ) + '</span></header>'
					+ '<div class="dtb-support-ticket-message__body">' + escHtml( evBody ) + '</div>'
					+ '</article>';
			} ).join( '' );
		} else {
			timeline = '<p class="dtb-support-ticket-empty">No timeline events yet.</p>';
		}

		if ( els.title ) {
			els.title.textContent = 'Ticket ' + ticketLabel;
		}

		if ( els.body ) {
			els.body.innerHTML =
				'<div class="dtb-support-ticket-modal">'
				+ '<header class="dtb-support-ticket-modal__header">'
				+ '<div><h3>' + escHtml( subject ) + '</h3><p>' + escHtml( customer ) + '</p></div>'
				+ '<div class="dtb-support-ticket-modal__badges">'
				+ '<span class="dtb-support-ticket-pill">' + escHtml( status ) + '</span>'
				+ '<span class="dtb-support-ticket-pill">' + escHtml( priority ) + '</span>'
				+ '<span class="dtb-support-ticket-pill">' + escHtml( typeLabel ) + '</span>'
				+ '</div>'
				+ '</header>'
				+ '<div class="dtb-support-ticket-modal__body">'
				+ '<section class="dtb-support-ticket-thread">'
				+ '<article class="dtb-support-ticket-message dtb-support-ticket-message--customer">'
				+ '<header class="dtb-support-ticket-message__meta"><strong>Customer Message</strong></header>'
				+ '<div class="dtb-support-ticket-message__body">' + escHtml( message || 'No original message body.' ) + '</div>'
				+ '</article>'
				+ timeline
				+ '</section>'
				+ '<aside class="dtb-support-ticket-context">'
				+ '<div class="dtb-support-ticket-card"><h4>Ticket Snapshot</h4>'
				+ '<div class="dtb-support-ticket-kv"><span>Ticket</span><strong>' + escHtml( ticketLabel ) + '</strong></div>'
				+ '<div class="dtb-support-ticket-kv"><span>Status</span><strong>' + escHtml( status ) + '</strong></div>'
				+ '<div class="dtb-support-ticket-kv"><span>Priority</span><strong>' + escHtml( priority ) + '</strong></div>'
				+ '<div class="dtb-support-ticket-kv"><span>Action Due</span><strong>' + escHtml( dueAt ) + '</strong></div>'
				+ '<div class="dtb-support-ticket-kv"><span>Created</span><strong>' + escHtml( created ) + '</strong></div>'
				+ '<div class="dtb-support-ticket-kv"><span>Updated</span><strong>' + escHtml( updated ) + '</strong></div>'
				+ '</div>'
				+ '<div class="dtb-support-ticket-card"><h4>Customer</h4>'
				+ '<div class="dtb-support-ticket-kv"><span>Name</span><strong>' + escHtml( ticket.customer_name || '—' ) + '</strong></div>'
				+ '<div class="dtb-support-ticket-kv"><span>Email</span><strong>' + escHtml( ticket.customer_email || '—' ) + '</strong></div>'
				+ '<div class="dtb-support-ticket-kv"><span>Order</span><strong>' + escHtml( ticket.order_id ? '#' + ticket.order_id : '—' ) + '</strong></div>'
				+ '</div>'
				+ '</aside>'
				+ '</div>'
				+ '</div>';
		}
	}

	function fetchWorkbenchAggregate() {
		var wb = getWorkbench();
		if ( ! wb ) {
			return;
		}
		var endpoint = wb.getAttribute( 'data-dtb-support-endpoint' );
		if ( ! endpoint ) {
			return;
		}
		var query = currentQueryFromUrl();
		query.queue = resolveActiveQueue( query );
		var url = new URL( endpoint, window.location.origin );
		Object.keys( query ).forEach( function ( key ) {
			var value = query[ key ];
			if ( value ) {
				url.searchParams.set( key, String( value ) );
			}
		} );
		var nonce = window.dtbAdminConfig && window.dtbAdminConfig.nonce ? window.dtbAdminConfig.nonce : '';

		fetch( url.toString(), {
			headers: {
				Accept: 'application/json',
				'X-WP-Nonce': nonce,
			},
			credentials: 'same-origin',
		} )
			.then( function ( res ) {
				if ( ! res.ok ) {
					throw new Error( 'HTTP ' + res.status );
				}
				return res.json();
			} )
			.then( function ( data ) {
				var queues = data && data.queues ? data.queues : {};
				Object.keys( queues ).forEach( function ( key ) {
					var value = parseInt( queues[ key ], 10 ) || 0;
					document.querySelectorAll( '[data-dtb-support-queue-count="' + key + '"], [data-dtb-support-summary="' + key + '"]' ).forEach( function ( el ) {
						el.textContent = String( value );
					} );
				} );
				if ( data && data.meta ) {
					document.querySelectorAll( '[data-dtb-support-current-total]' ).forEach( function ( el ) {
						el.textContent = String( parseInt( data.meta.total || 0, 10 ) );
					} );
				}
			} )
			.catch( function () {} );
	}

	function openModalWithTicket( ticketId, ticketRef, ticketUrl ) {
		var els = getModalElements();
		if ( ! els || ! ticketId ) {
			return;
		}

		state.currentTicketId = Number( ticketId ) || 0;
		state.currentTicketUrl = getTicketUrl( ticketId, ticketUrl || '' );
		if ( els.viewButton ) {
			els.viewButton.setAttribute( 'data-dtb-ticket-url', state.currentTicketUrl );
		}
		setTicketParam( ticketId );
		renderModalLoading( els, ticketRef || ( '#' + ticketId ) );

		if ( typeof DtbAdmin !== 'undefined' && DtbAdmin.openModal ) {
			DtbAdmin.openModal( MODAL_ID );
		}

		var restBase = ( window.dtbAdminConfig && window.dtbAdminConfig.restUrl ? window.dtbAdminConfig.restUrl : '/wp-json' ).replace( /\/$/, '' );
		var endpoint = restBase + '/dtb/v1/support/tickets/' + encodeURIComponent( String( ticketId ) );
		var nonce = window.dtbAdminConfig && window.dtbAdminConfig.nonce ? window.dtbAdminConfig.nonce : '';

		fetch( endpoint, {
			headers: {
				Accept: 'application/json',
				'X-WP-Nonce': nonce,
			},
			credentials: 'same-origin',
		} )
			.then( function ( res ) {
				if ( ! res.ok ) {
					throw new Error( 'HTTP ' + res.status );
				}
				return res.json();
			} )
			.then( function ( payload ) {
				renderTicketModal( els, payload );
			} )
			.catch( function () {
				renderModalError( els );
			} );
	}

	function parseRowContext( row ) {
		if ( ! row || ! row.dataset ) {
			return null;
		}
		return {
			ticketId: row.dataset.dtbTicketId || '',
			ticketRef: row.dataset.dtbTicketRef || '',
			ticketUrl: row.dataset.dtbTicketUrl || '',
		};
	}

	function navigateRegion( patch ) {
		var region = getLiveRegion();
		if ( ! region || typeof DtbAdmin === 'undefined' || ! DtbAdmin.liveNavigate ) {
			return;
		}
		var endpoint = region.getAttribute( 'data-dtb-endpoint' );
		if ( ! endpoint ) {
			return;
		}
		var current = currentQueryFromUrl();
		var query = {
			status: patch && patch.status != null ? patch.status : current.status,
			queue: patch && patch.queue != null ? patch.queue : current.queue,
			search: patch && patch.search != null ? patch.search : current.search,
			type: patch && patch.type != null ? patch.type : current.type,
			priority: patch && patch.priority != null ? patch.priority : current.priority,
			paged: patch && patch.paged != null ? patch.paged : current.paged || '1',
		};

		DtbAdmin.liveNavigate( {
			target: region,
			endpoint: endpoint,
			query: query,
			history: true,
		} );
	}

	function bindQueueAndFilters() {
		var searchTimer;

		document.addEventListener( 'click', function ( evt ) {
			var queueLink = evt.target && evt.target.closest ? evt.target.closest( '[data-dtb-support-queue]' ) : null;
			if ( queueLink ) {
				evt.preventDefault();
				var queue = queueLink.getAttribute( 'data-dtb-support-queue' ) || '';
				var status = queueLink.getAttribute( 'data-dtb-support-status' ) || '';
				navigateRegion( { queue: queue, status: status, paged: '1' } );
				return;
			}

			var rowLink = evt.target && evt.target.closest ? evt.target.closest( '.dtb-support-open-ticket' ) : null;
			if ( rowLink ) {
				if ( evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey || evt.button !== 0 ) {
					return;
				}
				var row = rowLink.closest( '.dtb-support-row' );
				var context = parseRowContext( row );
				if ( context && context.ticketId ) {
					evt.preventDefault();
					openModalWithTicket( context.ticketId, context.ticketRef, context.ticketUrl );
				}
				return;
			}

			var row = evt.target && evt.target.closest ? evt.target.closest( '.dtb-support-row' ) : null;
			if ( row && ! evt.target.closest( 'a,button,input,select,textarea,label' ) ) {
				var rowContext = parseRowContext( row );
				if ( rowContext && rowContext.ticketId ) {
					openModalWithTicket( rowContext.ticketId, rowContext.ticketRef, rowContext.ticketUrl );
				}
			}
		} );

		document.addEventListener( 'change', function ( evt ) {
			var filter = evt.target && evt.target.matches ? evt.target.matches( '[data-dtb-support-filter]' ) : false;
			if ( ! filter ) {
				return;
			}
			var type = document.querySelector( '[data-dtb-support-filter="type"]' );
			var priority = document.querySelector( '[data-dtb-support-filter="priority"]' );
			navigateRegion( {
				type: type ? type.value : '',
				priority: priority ? priority.value : '',
				paged: '1',
			} );
		} );

		document.addEventListener( 'input', function ( evt ) {
			var isSearch = evt.target && evt.target.matches ? evt.target.matches( '[data-dtb-support-search]' ) : false;
			if ( ! isSearch ) {
				return;
			}
			clearTimeout( searchTimer );
			searchTimer = setTimeout( function () {
				navigateRegion( {
					search: evt.target.value || '',
					paged: '1',
				} );
			}, 260 );
		} );
	}

	function bindModalActions() {
		document.addEventListener( 'click', function ( evt ) {
			var viewBtn = evt.target && evt.target.closest ? evt.target.closest( '[data-dtb-support-modal-action="view"]' ) : null;
			if ( viewBtn ) {
				var targetUrl = viewBtn.getAttribute( 'data-dtb-ticket-url' ) || state.currentTicketUrl;
				if ( targetUrl ) {
					window.location.href = targetUrl;
				}
				return;
			}

			var closeBtn = evt.target && evt.target.closest ? evt.target.closest( '.dtb-modal__close, [data-dtb-close-modal]' ) : null;
			if ( closeBtn && closeBtn.closest( '#' + MODAL_ID ) ) {
				state.currentTicketId = 0;
				state.currentTicketUrl = '';
				setTicketParam( '' );
			}
		} );
	}

	function openFromDeepLink() {
		if ( ! window.URLSearchParams ) {
			return;
		}
		var params = new URLSearchParams( window.location.search );
		var ticketId = params.get( 'ticket_id' );
		if ( ! ticketId ) {
			return;
		}

		var row = document.querySelector( '.dtb-support-row[data-dtb-ticket-id="' + String( ticketId ).replace( /"/g, '' ) + '"]' );
		var context = parseRowContext( row ) || {
			ticketId: ticketId,
			ticketRef: '#' + ticketId,
			ticketUrl: getTicketUrl( ticketId, '' ),
		};
		openModalWithTicket( context.ticketId, context.ticketRef, context.ticketUrl );
	}

	function syncWorkbenchFromUrl() {
		var query = currentQueryFromUrl();
		var activeQueue = resolveActiveQueue( query );
		updateQueueUi( activeQueue );
		syncFiltersFromQuery( query );
		fetchWorkbenchAggregate();
	}

	function bindLiveRegionEvents() {
		var region = getLiveRegion();
		if ( ! region ) {
			return;
		}
		region.addEventListener( 'dtb:live:navigated', function () {
			syncWorkbenchFromUrl();
		} );
	}

	function init() {
		if ( ! getWorkbench() || ! getLiveRegion() || ! byId( MODAL_ID ) ) {
			return;
		}

		bindQueueAndFilters();
		bindModalActions();
		bindLiveRegionEvents();
		syncWorkbenchFromUrl();
		openFromDeepLink();
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init, { once: true } );
	} else {
		init();
	}
}() );
