/* global dtbAdminConfig */
( function () {
	'use strict';

	function closestMatch( el, selector ) {
		var node = el;
		while ( node && node !== document ) {
			if ( node.matches && node.matches( selector ) ) {
				return node;
			}
			node = node.parentElement;
		}
		return null;
	}

	function getEventTargetElement( e ) {
		var t = e && e.target ? e.target : null;
		if ( ! t ) {
			return null;
		}
		if ( t.nodeType === 1 ) {
			return t;
		}
		return t.parentElement || null;
	}

	function escapeHtml( value ) {
		var d = document.createElement( 'div' );
		d.appendChild( document.createTextNode( String( value == null ? '' : value ) ) );
		return d.innerHTML;
	}

	function withReady( callback ) {
		if ( document.readyState === 'loading' ) {
			document.addEventListener( 'DOMContentLoaded', callback, { once: true } );
			return;
		}
		callback();
	}

	withReady( function () {
		var modal = document.getElementById( 'dtb-support-ticket-modal' );
		if ( ! modal ) {
			return;
		}

		var modalBody = document.getElementById( 'dtb-support-modal-body' );
		var modalTitle = document.getElementById( 'dtb-support-modal-title' );
		var modalOpenLink = modal.querySelector( '.dtb-support-modal-open-link' );
		var lastFocused = null;

		function setTicketParam( ticketId ) {
			if ( ! window.URL || ! window.history || ! window.history.replaceState ) {
				return;
			}

			var url = new URL( window.location.href );
			if ( ticketId ) {
				url.searchParams.set( 'ticket_id', ticketId );
			} else {
				url.searchParams.delete( 'ticket_id' );
			}
			window.history.replaceState( {}, '', url.toString() );
		}

		function getFallbackTicketUrl( ticketId ) {
			var adminUrl = window.dtbAdminConfig && window.dtbAdminConfig.adminUrl ? window.dtbAdminConfig.adminUrl : '/wp-admin/admin.php';
			var joiner = adminUrl.indexOf( '?' ) === -1 ? '?' : '&';
			return adminUrl + joiner + 'page=dtb-support&ticket_id=' + encodeURIComponent( String( ticketId || '' ) );
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

		function renderTicket( payload ) {
			var ticket = payload && payload.ticket ? payload.ticket : {};
			var events = payload && payload.events ? payload.events : [];

			var ticketLabel = ticket.ticket_number || ( '#' + ( ticket.id || '' ) );
			var subject = ticket.subject || '\u2014';
			var customer = ticket.customer_name || ticket.customer_email || '\u2014';
			var status = ticket.status_label || ticket.status || '\u2014';
			var priority = ticket.priority_label || ticket.priority || '\u2014';
			var createdAt = ticket.created_at || '\u2014';
			var updatedAt = ticket.updated_at || '\u2014';
			var message = ticket.message || '';
			var openUrl = ticket.edit_url || getFallbackTicketUrl( ticket.id || '' );

			modalTitle.textContent = 'Ticket ' + ticketLabel;
			if ( modalOpenLink ) {
				modalOpenLink.href = openUrl;
			}

			var timeline = '';
			if ( Array.isArray( events ) && events.length ) {
				timeline = events.slice( 0, 30 ).map( function ( ev ) {
					var label = ev.event_label || ev.event_type || 'Event';
					var time = ev.created_at || '';
					var body = ev.summary || ev.body || '';
					return '<div class="dtb-support-event">'
						+ '<div class="dtb-support-event__head"><strong>' + escapeHtml( label ) + '</strong><span>' + escapeHtml( time ) + '</span></div>'
						+ '<div class="dtb-support-event__body">' + escapeHtml( body || '\u2014' ) + '</div>'
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
				+ '<div class="dtb-support-kv"><span>Ticket</span><strong>' + escapeHtml( ticketLabel ) + '</strong></div>'
				+ '<div class="dtb-support-kv"><span>Subject</span><strong>' + escapeHtml( subject ) + '</strong></div>'
				+ '<div class="dtb-support-kv"><span>Customer</span><strong>' + escapeHtml( customer ) + '</strong></div>'
				+ '<div class="dtb-support-kv"><span>Status</span><strong>' + escapeHtml( status ) + '</strong></div>'
				+ '<div class="dtb-support-kv"><span>Priority</span><strong>' + escapeHtml( priority ) + '</strong></div>'
				+ '</div>'
				+ '<div class="dtb-support-modal-card">'
				+ '<h6>Timeline</h6>'
				+ '<div class="dtb-support-events">' + timeline + '</div>'
				+ '</div>'
				+ '</section>'
				+ '<aside class="dtb-support-modal-side">'
				+ '<div class="dtb-support-modal-card">'
				+ '<h6>Message</h6>'
				+ '<p class="dtb-support-message">' + escapeHtml( message || 'No message body.' ) + '</p>'
				+ '</div>'
				+ '<div class="dtb-support-modal-card">'
				+ '<h6>Dates</h6>'
				+ '<div class="dtb-support-kv"><span>Created</span><strong>' + escapeHtml( createdAt ) + '</strong></div>'
				+ '<div class="dtb-support-kv"><span>Updated</span><strong>' + escapeHtml( updatedAt ) + '</strong></div>'
				+ '</div>'
				+ '</aside>'
				+ '</div>';
		}

		function loadTicket( context ) {
			if ( ! context || ! context.ticketId ) {
				return;
			}

			openModal();
			setTicketParam( String( context.ticketId ) );

			modalTitle.textContent = 'Ticket ' + ( context.ticketRef || ( '#' + context.ticketId ) );
			modalBody.innerHTML = '<div class="dtb-support-modal-loading">Loading ticket\u2026</div>';
			if ( modalOpenLink ) {
				modalOpenLink.href = context.ticketUrl || getFallbackTicketUrl( context.ticketId );
			}

			var restBase = ( window.dtbAdminConfig && window.dtbAdminConfig.restUrl ? window.dtbAdminConfig.restUrl : '/wp-json' ).replace( /\/$/, '' );
			var endpoint = restBase + '/dtb/v1/support/tickets/' + encodeURIComponent( String( context.ticketId ) );
			var nonce = window.dtbAdminConfig && window.dtbAdminConfig.nonce ? window.dtbAdminConfig.nonce : '';

			fetch( endpoint, {
				headers: {
					'Accept': 'application/json',
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
				.then( renderTicket )
				.catch( function () {
					modalBody.innerHTML = '<div class="dtb-support-modal-error">Unable to load ticket details.</div>';
				} );
		}

		function extractTicketContext( source ) {
			var row = closestMatch( source, '.dtb-support-row' );
			var sourceId = source && source.dataset ? source.dataset.dtbTicketId : '';
			var rowId = row && row.dataset ? row.dataset.dtbTicketId : '';
			var ticketId = sourceId || rowId;

			if ( ! ticketId ) {
				return null;
			}

			var sourceUrl = source && source.dataset ? source.dataset.dtbTicketUrl : '';
			var rowUrl = row && row.dataset ? row.dataset.dtbTicketUrl : '';
			var sourceRef = source && source.dataset ? source.dataset.dtbTicketRef : '';
			var rowRef = row && row.dataset ? row.dataset.dtbTicketRef : '';

			return {
				row: row,
				ticketId: ticketId,
				ticketRef: sourceRef || rowRef || ( '#' + ticketId ),
				ticketUrl: sourceUrl || rowUrl || getFallbackTicketUrl( ticketId ),
			};
		}

		function maybeOpenTicketFromUrl() {
			var params = new URLSearchParams( window.location.search );
			var ticketId = params.get( 'ticket_id' );
			if ( ! ticketId ) {
				return;
			}

			var row = document.querySelector( '.dtb-support-row[data-dtb-ticket-id="' + String( ticketId ).replace( /"/g, '' ) + '"]' );
			loadTicket( extractTicketContext( row || { dataset: { dtbTicketId: ticketId } } ) );
		}

		window.dtbSupportOpenTicket = function ( source, eventObj ) {
			if ( eventObj && typeof eventObj.preventDefault === 'function' ) {
				eventObj.preventDefault();
			}
			loadTicket( extractTicketContext( source ) );
			return false;
		};

		document.body.classList.remove( 'dtb-support-modal-open' );

		document.addEventListener( 'click', function ( e ) {
			var target = getEventTargetElement( e );
			if ( ! target ) {
				return;
			}

			var closeBtn = closestMatch( target, '[data-dtb-support-modal-close]' );
			if ( closeBtn ) {
				e.preventDefault();
				closeModal();
				return;
			}

			if ( target === modal ) {
				closeModal();
				return;
			}

			var openTrigger = closestMatch( target, '.dtb-support-open-ticket, .dtb-support-row' );
			if ( ! openTrigger ) {
				return;
			}

			var context = extractTicketContext( openTrigger );
			if ( ! context ) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();
			loadTicket( context );
		} );

		document.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'Escape' && modal.classList.contains( 'show' ) ) {
				closeModal();
			}
		} );

		maybeOpenTicketFromUrl();
	} );
}() );
