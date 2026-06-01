(function () {
		var modal = document.getElementById( 'dtb-support-ticket-modal' );
		if ( ! modal ) return;

		var modalBody = document.getElementById( 'dtb-support-modal-body' );
		var modalTitle = document.getElementById( 'dtb-support-modal-title' );
		var modalOpenLink = modal.querySelector( '.dtb-support-modal-open-link' );
		var lastFocused = null;

		function escHtml( str ) {
			var d = document.createElement( 'div' );
			d.appendChild( document.createTextNode( String( str == null ? '' : str ) ) );
			return d.innerHTML;
		}

		function setTicketParam( ticketId ) {
			var url = new URL( window.location.href );
			if ( ticketId ) {
				url.searchParams.set( 'ticket_id', ticketId );
			} else {
				url.searchParams.delete( 'ticket_id' );
			}
			window.history.replaceState( {}, '', url.toString() );
		}

		function renderTicket( payload ) {
			var ticket = payload && payload.ticket ? payload.ticket : {};
			var events = payload && payload.events ? payload.events : [];

			var ticketLabel = ticket.ticket_number || ('#' + (ticket.id || ''));
			var subject = ticket.subject || '—';
			var customer = ticket.customer_name || ticket.customer_email || '—';
			var status = ticket.status_label || ticket.status || '—';
			var priority = ticket.priority_label || ticket.priority || '—';
			var createdAt = ticket.created_at || '—';
			var updatedAt = ticket.updated_at || '—';
			var message = ticket.message || '';
			var openUrl = ticket.edit_url || (window.location.origin + '/wp-admin/admin.php?page=dtb-support&ticket_id=' + (ticket.id || ''));

			modalTitle.textContent = 'Ticket ' + ticketLabel;
			if ( modalOpenLink ) {
				modalOpenLink.href = openUrl;
			}

			var timeline = '';
			if ( Array.isArray( events ) && events.length ) {
				timeline = events.slice(0, 20).map( function ( ev ) {
					var label = ev.event_label || ev.event_type || 'Event';
					var time = ev.created_at || '';
					var body = ev.summary || ev.body || '';
					return '<div class="dtb-support-event">'
						+ '<div class="dtb-support-event__head"><strong>' + escHtml( label ) + '</strong><span>' + escHtml( time ) + '</span></div>'
						+ '<div class="dtb-support-event__body">' + escHtml( body || '—' ) + '</div>'
						+ '</div>';
				} ).join( '' );
			} else {
				timeline = '<p class="dtb-support-event-empty">No activity yet.</p>';
			}

			modalBody.innerHTML =
				'<div class="dtb-support-modal-grid">'
					+ '<section class="dtb-support-modal-main">'
						+ '<div class="dtb-support-modal-card">'
							+ '<h6>Summary</h6>'
							+ '<div class="dtb-support-kv"><span>Ticket</span><strong>' + escHtml( ticketLabel ) + '</strong></div>'
							+ '<div class="dtb-support-kv"><span>Subject</span><strong>' + escHtml( subject ) + '</strong></div>'
							+ '<div class="dtb-support-kv"><span>Customer</span><strong>' + escHtml( customer ) + '</strong></div>'
							+ '<div class="dtb-support-kv"><span>Status</span><strong>' + escHtml( status ) + '</strong></div>'
							+ '<div class="dtb-support-kv"><span>Priority</span><strong>' + escHtml( priority ) + '</strong></div>'
						+ '</div>'
						+ '<div class="dtb-support-modal-card">'
							+ '<h6>Timeline</h6>'
							+ '<div class="dtb-support-events">' + timeline + '</div>'
						+ '</div>'
					+ '</section>'
					+ '<aside class="dtb-support-modal-side">'
						+ '<div class="dtb-support-modal-card">'
							+ '<h6>Message</h6>'
							+ '<p class="dtb-support-message">' + escHtml( message || 'No message body.' ) + '</p>'
						+ '</div>'
						+ '<div class="dtb-support-modal-card">'
							+ '<h6>Dates</h6>'
							+ '<div class="dtb-support-kv"><span>Created</span><strong>' + escHtml( createdAt ) + '</strong></div>'
							+ '<div class="dtb-support-kv"><span>Updated</span><strong>' + escHtml( updatedAt ) + '</strong></div>'
						+ '</div>'
					+ '</aside>'
				+ '</div>';
		}

		function openModal() {
			lastFocused = document.activeElement;
			modal.classList.add( 'show' );
			modal.setAttribute( 'aria-hidden', 'false' );
			document.body.classList.add( 'dtb-support-modal-open' );
		}

		function closeModal() {
			modal.classList.remove( 'show' );
			modal.setAttribute( 'aria-hidden', 'true' );
			document.body.classList.remove( 'dtb-support-modal-open' );
			setTicketParam( '' );
			if ( lastFocused && typeof lastFocused.focus === 'function' ) {
				lastFocused.focus();
			}
		}

		function loadTicket( ticketId, row ) {
			if ( ! ticketId ) return;

			openModal();
			setTicketParam( String( ticketId ) );

			var titleBase = row && row.dataset ? ( row.dataset.dtbTicketRef || ('#' + ticketId) ) : ('#' + ticketId);
			modalTitle.textContent = 'Ticket ' + titleBase;
			modalBody.innerHTML = '<div class="dtb-support-modal-loading">Loading ticket…</div>';

			var restBase = (window.dtbAdminConfig && window.dtbAdminConfig.restUrl ? window.dtbAdminConfig.restUrl : '/wp-json').replace(/\/$/, '');
			var endpoint = restBase + '/dtb/v1/support/tickets/' + encodeURIComponent( ticketId );

			fetch( endpoint, {
				headers: {
					'X-WP-Nonce': window.dtbAdminConfig && window.dtbAdminConfig.nonce ? window.dtbAdminConfig.nonce : '',
					'Accept': 'application/json'
				}
			} )
				.then( function ( res ) {
					if ( ! res.ok ) throw new Error( 'HTTP ' + res.status );
					return res.json();
				} )
				.then( renderTicket )
				.catch( function () {
					modalBody.innerHTML = '<div class="dtb-support-modal-error">Unable to load ticket details.</div>';
				} );
		}

		document.addEventListener( 'click', function ( e ) {
			var closeBtn = e.target.closest( '[data-dtb-support-modal-close]' );
			if ( closeBtn ) {
				e.preventDefault();
				closeModal();
				return;
			}

			if ( e.target === modal ) {
				closeModal();
				return;
			}

			var ticketTrigger = e.target.closest( '.dtb-support-open-ticket, .dtb-support-row' );
			if ( ! ticketTrigger ) return;

			var row = ticketTrigger.closest( '.dtb-support-row' );
			if ( ! row ) return;

			e.preventDefault();
			loadTicket( row.dataset.dtbTicketId, row );
		} );

		document.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'Escape' && modal.classList.contains( 'show' ) ) {
				closeModal();
			}
		} );

		var params = new URLSearchParams( window.location.search );
		var ticketId = params.get( 'ticket_id' );
		if ( ticketId ) {
			loadTicket( ticketId, document.querySelector( '.dtb-support-row[data-dtb-ticket-id="' + ticketId + '"]' ) );
		}
	}());
