/* global DtbWorkbench, dtbAdminConfig */
/**
 * DTB Repairs — Support-style conversation UI
 *
 * Keeps Repairs messaging visually and behaviorally aligned with Support:
 * - same chat row/bubble/avatar class structure
 * - same pinned compose bar
 * - same Reply/Internal Note mode toggle
 * - same quick-response macro behavior
 */
( function () {
	'use strict';

	var WB = window.DtbWorkbench || {};
	var CONFIG = window.dtbAdminConfig || {};
	var REST = ( CONFIG.restUrl || '/wp-json' ).replace( /\/$/, '' );
	var state = {
		repairId: 0,
		payload: null,
		loading: false,
		scheduled: false,
	};

	function qs( selector, ctx ) {
		return ( ctx || document ).querySelector( selector );
	}

	function esc( value ) {
		if ( WB.escapeHtml ) {
			return WB.escapeHtml( value );
		}
		var d = document.createElement( 'div' );
		d.appendChild( document.createTextNode( String( value == null ? '' : value ) ) );
		return d.innerHTML;
	}

	function getModal() {
		return qs( '#dtb-repair-modal' );
	}

	function getPanel() {
		var modal = getModal();
		return modal ? qs( '[data-panel="conversation"]', modal ) : null;
	}

	function getOpenRepairId() {
		var params = new URLSearchParams( window.location.search );
		var id = parseInt( params.get( 'open_repair' ) || '', 10 );
		if ( id > 0 ) {
			return id;
		}
		var title = qs( '#dtb-repair-modal-title' );
		var match = title && String( title.textContent || '' ).match( /#(\d+)/ );
		return match ? parseInt( match[1], 10 ) : 0;
	}

	function apiFetch( url, options ) {
		if ( WB.apiFetch ) {
			return WB.apiFetch( url, options || {} );
		}
		options = options || {};
		options.headers = Object.assign( {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			'X-WP-Nonce': CONFIG.nonce || '',
		}, options.headers || {} );
		options.credentials = 'same-origin';
		return fetch( url, options ).then( function ( response ) {
			return response.json().then( function ( data ) {
				if ( ! response.ok ) {
					throw new Error( data && data.message ? data.message : 'HTTP ' + response.status );
				}
				return data;
			} );
		} );
	}

	function toast( message, type ) {
		if ( WB.showToast ) {
			WB.showToast( message, type || 'success' );
		}
	}

	function avatarInitials( name ) {
		var parts = String( name || '?' ).trim().split( /\s+/ ).filter( Boolean );
		if ( ! parts.length ) {
			return '?';
		}
		if ( parts.length >= 2 ) {
			return ( parts[0][0] + parts[ parts.length - 1 ][0] ).toUpperCase();
		}
		return parts[0].slice( 0, 2 ).toUpperCase();
	}

	function formatDate( raw ) {
		if ( ! raw || raw === '—' ) {
			return raw || '—';
		}
		var d = new Date( String( raw ).replace( ' ', 'T' ) );
		if ( isNaN( d.getTime() ) ) {
			return raw;
		}
		var now = new Date();
		var diffS = ( now - d ) / 1000;
		if ( diffS >= 0 && diffS < 60 ) {
			return 'Just now';
		}
		if ( diffS >= 0 && diffS < 3600 ) {
			var m = Math.floor( diffS / 60 );
			return m + ' minute' + ( m === 1 ? '' : 's' ) + ' ago';
		}
		if ( d.toDateString() === now.toDateString() ) {
			return 'Today at ' + d.toLocaleTimeString( undefined, { hour: 'numeric', minute: '2-digit' } );
		}
		var yesterday = new Date( now );
		yesterday.setDate( now.getDate() - 1 );
		if ( d.toDateString() === yesterday.toDateString() ) {
			return 'Yesterday at ' + d.toLocaleTimeString( undefined, { hour: 'numeric', minute: '2-digit' } );
		}
		return d.toLocaleDateString( undefined, { month: 'short', day: 'numeric', year: 'numeric' } )
			+ ' at ' + d.toLocaleTimeString( undefined, { hour: 'numeric', minute: '2-digit' } );
	}

	function normalizeMessage( msg ) {
		var type = String( msg.type || msg.event_group || msg.group || '' ).toLowerCase();
		var eventType = String( msg.event_type || '' ).toLowerCase();
		var body = msg.body || msg.message || msg.summary || msg.comment_content || '';
		var actor = msg.user_label || msg.actor_label || msg.author || msg.author_name || msg.actor_name || '';
		if ( eventType.indexOf( 'internal' ) !== -1 || type === 'internal' || type === 'note' ) {
			return { direction: 'note', body: body, actor: actor || 'Internal Note', when: msg.age_label || msg.created_at || msg.date || '' };
		}
		if ( type === 'customer' || type === 'inbound' || eventType.indexOf( 'customer' ) !== -1 ) {
			return { direction: 'inbound', body: body, actor: actor || 'Customer', when: msg.age_label || msg.created_at || msg.date || '' };
		}
		if ( type === 'staff' || type === 'admin' || type === 'operator' || type === 'reply' || eventType.indexOf( 'reply' ) !== -1 ) {
			return { direction: 'outbound', body: body, actor: actor || 'Staff', when: msg.age_label || msg.created_at || msg.date || '' };
		}
		return { direction: 'system', body: body, actor: actor, when: msg.age_label || msg.created_at || msg.date || '' };
	}

	function renderChatRow( raw, customerName ) {
		var msg = normalizeMessage( raw );
		var when = msg.when ? formatDate( msg.when ) : '';
		if ( ! msg.body ) {
			return '';
		}
		if ( msg.direction === 'inbound' ) {
			return '<div class="dtb-chat-row dtb-chat-row--inbound">'
				+ '<div class="dtb-chat-avatar" aria-hidden="true">' + esc( avatarInitials( customerName || msg.actor || 'Customer' ) ) + '</div>'
				+ '<div class="dtb-chat-bubble-wrap">'
				+ '<div class="dtb-chat-meta"><strong>' + esc( customerName || msg.actor || 'Customer' ) + '</strong>'
				+ ( when ? ' <span class="dtb-chat-meta__time">· ' + esc( when ) + '</span>' : '' ) + '</div>'
				+ '<div class="dtb-chat-bubble dtb-chat-bubble--inbound">' + esc( msg.body ) + '</div>'
				+ '</div></div>';
		}
		if ( msg.direction === 'outbound' ) {
			return '<div class="dtb-chat-row dtb-chat-row--outbound">'
				+ '<div class="dtb-chat-bubble-wrap">'
				+ '<div class="dtb-chat-meta dtb-chat-meta--right"><strong>' + esc( msg.actor || 'Staff' ) + '</strong>'
				+ ( when ? ' <span class="dtb-chat-meta__time">· ' + esc( when ) + '</span>' : '' ) + '</div>'
				+ '<div class="dtb-chat-bubble dtb-chat-bubble--outbound">' + esc( msg.body ) + '</div>'
				+ '</div><div class="dtb-chat-avatar dtb-chat-avatar--staff" aria-hidden="true">' + esc( avatarInitials( msg.actor || 'Staff' ) ) + '</div></div>';
		}
		if ( msg.direction === 'note' ) {
			return '<div class="dtb-chat-row dtb-chat-row--note">'
				+ '<div class="dtb-chat-note">'
				+ '<div class="dtb-chat-note__label">Internal note'
				+ ( msg.actor ? ' <span class="dtb-chat-note__author">· ' + esc( msg.actor ) + '</span>' : '' )
				+ ( when ? ' <span class="dtb-chat-note__time">· ' + esc( when ) + '</span>' : '' ) + '</div>'
				+ '<div class="dtb-chat-note__body">' + esc( msg.body ) + '</div>'
				+ '</div></div>';
		}
		return '<div class="dtb-chat-row dtb-chat-row--system"><span class="dtb-chat-system-event">' + esc( msg.body ) + ( when ? ' <span class="dtb-chat-system-time">' + esc( when ) + '</span>' : '' ) + '</span></div>';
	}

	function repairMacros( record ) {
		var customer = record.customer_name || 'there';
		return [
			{
				category: 'Repair Updates',
				items: [
					{ label: 'Received / reviewing', text: 'Hi ' + customer + ',\n\nWe received your repair request and are reviewing the details now. We will update you as soon as we complete the initial assessment.\n\nBest,\nDrywall Toolbox Repair Team' },
					{ label: 'Need photos', text: 'Hi ' + customer + ',\n\nCould you please send clear photos of the tool, serial label, and the problem area? This will help us diagnose the repair accurately.\n\nThank you,\nDrywall Toolbox Repair Team' },
					{ label: 'Technician update', text: 'Hi ' + customer + ',\n\nOur technician has reviewed your repair and we are continuing the service process. We will keep you updated as the repair progresses.\n\nBest,\nDrywall Toolbox Repair Team' },
				],
			},
			{
				category: 'Quote & Shipping',
				items: [
					{ label: 'Quote ready', text: 'Hi ' + customer + ',\n\nYour repair quote has been prepared. Please review it and let us know how you would like to proceed.\n\nBest,\nDrywall Toolbox Repair Team' },
					{ label: 'Ready to ship', text: 'Hi ' + customer + ',\n\nYour repair is complete and is being prepared for return shipment. We will provide tracking as soon as it is available.\n\nBest,\nDrywall Toolbox Repair Team' },
				],
			},
		];
	}

	function buildMacroHtml( record ) {
		var html = '<div class="dtb-macro-panel" id="dtb-repair-macro-panel" hidden>';
		repairMacros( record || {} ).forEach( function ( group ) {
			html += '<div class="dtb-macro-group"><div class="dtb-macro-group__label">' + esc( group.category ) + '</div><div class="dtb-macro-group__items">';
			group.items.forEach( function ( macro ) {
				html += '<button type="button" class="dtb-macro-btn" data-dtb-repair-macro="' + esc( macro.text ) + '">' + esc( macro.label ) + '</button>';
			} );
			html += '</div></div>';
		} );
		html += '</div>';
		return html;
	}

	function renderConversation( payload ) {
		var panel = getPanel();
		if ( ! panel ) {
			return;
		}
		var record = payload.record || {};
		var messages = Array.isArray( payload.conversation ) ? payload.conversation : [];
		var customerName = record.customer_name || record.customer_email || 'Customer';
		var signature = JSON.stringify( {
			id: record.id || state.repairId,
			messages: messages,
		} );
		if ( panel.getAttribute( 'data-dtb-repair-support-chat-signature' ) === signature ) {
			return;
		}
		panel.setAttribute( 'data-dtb-repair-support-chat-signature', signature );
		panel.classList.add( 'dtb-support-chat-panel', 'dtb-repair-support-chat-panel' );
		panel.innerHTML = '<div class="dtb-chat-thread" id="dtb-repair-chat-thread">'
			+ ( messages.length ? messages.map( function ( msg ) { return renderChatRow( msg, customerName ); } ).join( '' ) : '<p class="dtb-chat-empty">No activity yet.</p>' )
			+ '</div>'
			+ '<div class="dtb-chat-compose" data-dtb-repair-compose="reply">'
			+ buildMacroHtml( record )
			+ '<div class="dtb-chat-compose__toolbar">'
			+ '<button type="button" class="dtb-chat-mode-btn is-active" data-dtb-repair-compose-mode="reply">Reply to Customer</button>'
			+ '<button type="button" class="dtb-chat-mode-btn" data-dtb-repair-compose-mode="note">Internal Note</button>'
			+ '<button type="button" class="dtb-chat-macro-toggle dtb-btn dtb-btn--ghost dtb-btn--sm" data-dtb-repair-macro-toggle aria-expanded="false" aria-controls="dtb-repair-macro-panel">⚡ Quick Responses</button>'
			+ '</div>'
			+ '<form class="dtb-chat-compose__form dtb-repair-support-chat-form" data-dtb-repair-reply-type="reply">'
			+ '<div class="dtb-chat-compose__input-row">'
			+ '<textarea class="dtb-chat-compose__textarea" name="message" placeholder="Write a reply to the customer…" rows="3" autocomplete="off"></textarea>'
			+ '<div class="dtb-chat-compose__actions"><button type="submit" class="dtb-btn dtb-btn--primary dtb-btn--sm">Send</button><span class="dtb-support-form-status"></span></div>'
			+ '</div></form></div>';

		var thread = qs( '#dtb-repair-chat-thread', panel );
		if ( thread ) {
			thread.scrollTop = thread.scrollHeight;
		}
	}

	function loadDetail( force ) {
		var modal = getModal();
		if ( ! modal || ! modal.closest( '.dtb-modal-overlay--open' ) ) {
			return;
		}
		var repairId = getOpenRepairId();
		if ( ! repairId || state.loading ) {
			return;
		}
		if ( ! force && state.payload && state.repairId === repairId ) {
			renderConversation( state.payload );
			return;
		}
		state.loading = true;
		state.repairId = repairId;
		apiFetch( REST + '/dtb/v1/admin/repairs/' + repairId + '/detail', { method: 'GET' } )
			.then( function ( payload ) {
				state.payload = payload || {};
				renderConversation( state.payload );
			} )
			.catch( function ( error ) {
				console.warn( 'DTB repair support-style chat failed to load:', error );
			} )
			.finally( function () {
				state.loading = false;
			} );
	}

	function sendRepairMessage( type, body ) {
		var path = type === 'note' ? 'internal-note' : 'customer-message';
		return apiFetch( REST + '/dtb/v1/admin/repairs/' + state.repairId + '/' + path, {
			method: 'POST',
			body: JSON.stringify( { body: body } ),
		} ).then( function ( payload ) {
			state.payload = payload || state.payload;
			renderConversation( state.payload );
			return payload;
		} );
	}

	function scheduleLoad( force ) {
		if ( state.scheduled ) {
			return;
		}
		state.scheduled = true;
		window.requestAnimationFrame( function () {
			state.scheduled = false;
			loadDetail( !! force );
		} );
	}

	function bindEvents() {
		document.addEventListener( 'click', function ( event ) {
			var modeButton = event.target.closest( '[data-dtb-repair-compose-mode]' );
			if ( modeButton && modeButton.closest( '#dtb-repair-modal' ) ) {
				var mode = modeButton.getAttribute( 'data-dtb-repair-compose-mode' ) || 'reply';
				var compose = modeButton.closest( '.dtb-chat-compose' );
				var form = compose ? qs( '.dtb-repair-support-chat-form', compose ) : null;
				var textarea = compose ? qs( '.dtb-chat-compose__textarea', compose ) : null;
				if ( compose ) {
					compose.setAttribute( 'data-dtb-repair-compose', mode );
					compose.classList.toggle( 'dtb-chat-compose--note', mode === 'note' );
				}
				modeButton.parentNode.querySelectorAll( '.dtb-chat-mode-btn' ).forEach( function ( btn ) {
					btn.classList.toggle( 'is-active', btn === modeButton );
				} );
				if ( form ) {
					form.setAttribute( 'data-dtb-repair-reply-type', mode );
				}
				if ( textarea ) {
					textarea.placeholder = mode === 'note' ? 'Write an internal note…' : 'Write a reply to the customer…';
					textarea.focus();
				}
			}

			var toggle = event.target.closest( '[data-dtb-repair-macro-toggle]' );
			if ( toggle && toggle.closest( '#dtb-repair-modal' ) ) {
				var panel = qs( '#dtb-repair-macro-panel' );
				if ( panel ) {
					var isHidden = panel.hasAttribute( 'hidden' );
					panel.toggleAttribute( 'hidden', ! isHidden );
					toggle.setAttribute( 'aria-expanded', isHidden ? 'true' : 'false' );
				}
			}

			var macro = event.target.closest( '[data-dtb-repair-macro]' );
			if ( macro && macro.closest( '#dtb-repair-modal' ) ) {
				var container = macro.closest( '.dtb-chat-compose' );
				var input = container ? qs( '.dtb-chat-compose__textarea', container ) : null;
				if ( input ) {
					input.value = macro.getAttribute( 'data-dtb-repair-macro' ) || '';
					input.focus();
				}
			}
		} );

		document.addEventListener( 'submit', function ( event ) {
			var form = event.target.closest( '.dtb-repair-support-chat-form' );
			if ( ! form || ! form.closest( '#dtb-repair-modal' ) ) {
				return;
			}
			event.preventDefault();
			var textarea = qs( '.dtb-chat-compose__textarea', form );
			var status = qs( '.dtb-support-form-status', form );
			var button = qs( 'button[type="submit"]', form );
			var body = textarea ? textarea.value.trim() : '';
			var type = form.getAttribute( 'data-dtb-repair-reply-type' ) || 'reply';
			if ( ! body ) {
				if ( status ) {
					status.textContent = 'Message body is empty.';
					status.className = 'dtb-support-form-status is-error';
				}
				return;
			}
			if ( button ) {
				button.disabled = true;
				button.textContent = type === 'note' ? 'Saving…' : 'Sending…';
			}
			if ( status ) {
				status.textContent = '';
				status.className = 'dtb-support-form-status';
			}
			sendRepairMessage( type, body )
				.then( function () {
					if ( textarea ) {
						textarea.value = '';
					}
					if ( status ) {
						status.textContent = type === 'note' ? 'Internal note saved.' : 'Reply sent.';
						status.className = 'dtb-support-form-status is-success';
					}
					toast( type === 'note' ? 'Internal note saved.' : 'Reply sent.', 'success' );
					loadDetail( true );
				} )
				.catch( function ( error ) {
					if ( status ) {
						status.textContent = error && error.message ? error.message : 'Message failed.';
						status.className = 'dtb-support-form-status is-error';
					}
					toast( error && error.message ? error.message : 'Message failed.', 'error' );
				} )
				.finally( function () {
					if ( button ) {
						button.disabled = false;
						button.textContent = 'Send';
					}
				} );
		} );
	}

	function boot() {
		bindEvents();
		scheduleLoad( true );
		var observer = new MutationObserver( function () {
			scheduleLoad( false );
		} );
		observer.observe( document.body, { childList: true, subtree: true } );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', boot );
	} else {
		boot();
	}
} )();
