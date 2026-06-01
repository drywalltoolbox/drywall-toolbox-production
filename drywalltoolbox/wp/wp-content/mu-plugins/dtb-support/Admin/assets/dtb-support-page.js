/* global DtbAdmin, dtbAdminConfig */
( function () {
	'use strict';

	var DRAWER_ID = 'dtb-support-detail-drawer';
	var state = {
		currentTicketId: 0,
		currentTicketUrl: '',
	};

	function escHtml( value ) {
		var d = document.createElement( 'div' );
		d.appendChild( document.createTextNode( String( value == null ? '' : value ) ) );
		return d.innerHTML;
	}

	function byId( id ) {
		return document.getElementById( id );
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

	function getDrawerElements() {
		var drawer = byId( DRAWER_ID );
		if ( ! drawer ) {
			return null;
		}
		return {
			drawer: drawer,
			body: drawer.querySelector( '.dtb-drawer__body' ),
			title: drawer.querySelector( '.dtb-drawer__title' ),
			viewButton: drawer.querySelector( '[data-dtb-drawer-action="view"]' ),
		};
	}

	function renderLoading( els, ticketRef ) {
		if ( els.title && ticketRef ) {
			els.title.textContent = 'Ticket ' + ticketRef;
		}
		if ( els.body ) {
			els.body.innerHTML = '<div class="dtb-drawer-loading">Loading ticket details…</div>';
		}
	}

	function renderError( els ) {
		if ( els.body ) {
			els.body.innerHTML = '<div class="dtb-support-modal-error">Unable to load ticket details.</div>';
		}
	}

	function renderTicket( els, payload ) {
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

		if ( els.title ) {
			els.title.textContent = 'Ticket ' + ticketLabel;
		}

		var timeline = '';
		if ( Array.isArray( events ) && events.length ) {
			timeline = events.slice( 0, 30 ).map( function ( ev ) {
				var label = ev.event_label || ev.event_type || 'Event';
				var time = ev.created_at || '';
				var body = ev.summary || ev.body || '';
				return '<div class="dtb-support-event">'
					+ '<div class="dtb-support-event__head"><strong>' + escHtml( label ) + '</strong><span>' + escHtml( time ) + '</span></div>'
					+ '<div class="dtb-support-event__body">' + escHtml( body || '\u2014' ) + '</div>'
					+ '</div>';
			} ).join( '' );
		} else {
			timeline = '<p class="dtb-support-event-empty">No activity yet.</p>';
		}

		if ( els.body ) {
			els.body.innerHTML =
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
	}

	function openDrawerWithTicket( ticketId, ticketRef, ticketUrl ) {
		var els = getDrawerElements();
		if ( ! els || ! ticketId ) {
			return;
		}

		state.currentTicketId = Number( ticketId ) || 0;
		state.currentTicketUrl = getTicketUrl( ticketId, ticketUrl || '' );

		if ( els.viewButton ) {
			els.viewButton.setAttribute( 'href', state.currentTicketUrl );
			els.viewButton.setAttribute( 'target', '_self' );
		}

		renderLoading( els, ticketRef || ( '#' + ticketId ) );
		setTicketParam( ticketId );

		if ( typeof DtbAdmin !== 'undefined' && DtbAdmin.openDrawer ) {
			DtbAdmin.openDrawer( DRAWER_ID );
		} else {
			els.drawer.classList.add( 'dtb-drawer--open' );
		}

		var restBase = ( window.dtbAdminConfig && window.dtbAdminConfig.restUrl ? window.dtbAdminConfig.restUrl : '/wp-json' ).replace( /\/$/, '' );
		var endpoint = restBase + '/dtb/v1/support/tickets/' + encodeURIComponent( String( ticketId ) );
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
			.then( function (payload) {
				renderTicket( els, payload );
			} )
			.catch( function () {
				renderError( els );
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

	function bindDrawerPopulate() {
		var els = getDrawerElements();
		if ( ! els ) {
			return;
		}

		els.drawer.addEventListener( 'dtb:drawer:populate', function ( evt ) {
			var data = evt && evt.detail ? evt.detail.rowData || {} : {};
			openDrawerWithTicket( data['ticket-id'] || data.ticketId || '', data['ticket-ref'] || data.ticketRef || '', data['ticket-url'] || data.ticketUrl || '' );
		} );
	}

	function bindTicketLinkIntercept() {
		document.addEventListener( 'click', function ( evt ) {
			var target = evt.target && evt.target.closest ? evt.target.closest( '.dtb-support-open-ticket' ) : null;
			if ( ! target ) {
				return;
			}

			if ( evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey || evt.button !== 0 ) {
				return;
			}

			var row = target.closest( '.dtb-support-row' );
			var context = parseRowContext( row );
			if ( ! context || ! context.ticketId ) {
				return;
			}

			evt.preventDefault();
			openDrawerWithTicket( context.ticketId, context.ticketRef, context.ticketUrl );
		} );
	}

	function bindDrawerFooterAction() {
		var els = getDrawerElements();
		if ( ! els || ! els.viewButton ) {
			return;
		}

		els.viewButton.addEventListener( 'click', function (evt) {
			if ( ! state.currentTicketUrl ) {
				evt.preventDefault();
				return;
			}
			els.viewButton.setAttribute( 'href', state.currentTicketUrl );
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
		var ctx = parseRowContext( row ) || {
			ticketId: ticketId,
			ticketRef: '#' + ticketId,
			ticketUrl: getTicketUrl( ticketId, '' ),
		};

		openDrawerWithTicket( ctx.ticketId, ctx.ticketRef, ctx.ticketUrl );
	}

	function bindCloseCleanup() {
		document.addEventListener( 'click', function ( evt ) {
			var closeBtn = evt.target && evt.target.closest ? evt.target.closest( '.dtb-drawer__close, [data-dtb-close-drawer]' ) : null;
			if ( ! closeBtn ) {
				return;
			}

			var drawer = closeBtn.closest( '.dtb-drawer' );
			if ( drawer && drawer.id === DRAWER_ID ) {
				state.currentTicketId = 0;
				state.currentTicketUrl = '';
				setTicketParam( '' );
			}
		} );
	}

	function init() {
		if ( ! byId( DRAWER_ID ) ) {
			return;
		}
		bindDrawerPopulate();
		bindTicketLinkIntercept();
		bindDrawerFooterAction();
		bindCloseCleanup();
		openFromDeepLink();
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init, { once: true } );
	} else {
		init();
	}
}() );
