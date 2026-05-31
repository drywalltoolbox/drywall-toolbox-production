/**
 * DTB Admin UI System — dtb-admin.js
 *
 * Shared JavaScript behaviors for all Drywall Toolbox wp-admin pages.
 * No module-specific business logic belongs here.
 *
 * Responsibilities:
 *  - Namespace: window.DtbAdmin
 *  - Dropdown behavior
 *  - Dismissible alerts
 *  - Toast notification helper
 *  - Loading button states
 *  - Confirmation helper
 *  - Drawer open/close
 *  - Modal open/close
 *  - Tab panels
 *  - Refresh helpers
 *  - Table row click → drawer
 *  - Bulk-select toggle
 *
 * @package drywall-toolbox
 */

/* global dtbAdminConfig */
( function () {
	'use strict';

	// =========================================================================
	// NAMESPACE
	// =========================================================================

	/** @type {DtbAdminConfig} dtbAdminConfig — localized via AdminAssets.php */
	const cfg = window.dtbAdminConfig || {};

	const DtbAdmin = {
		version: '2.0.0',
	};

	window.DtbAdmin = DtbAdmin;

	// =========================================================================
	// READY
	// =========================================================================

	document.addEventListener( 'DOMContentLoaded', function () {
		DtbAdmin.initAlerts();
		DtbAdmin.initDropdowns();
		DtbAdmin.initDrawers();
		DtbAdmin.initModals();
		DtbAdmin.initTabs();
		DtbAdmin.initLoadingButtons();
		DtbAdmin.initBulkSelect();
		DtbAdmin.initTableRowDrawer();
		DtbAdmin.initToastContainer();
	} );

	// =========================================================================
	// ALERTS — dismissible
	// =========================================================================

	DtbAdmin.initAlerts = function () {
		document.querySelectorAll( '.dtb-alert .dtb-alert__close' ).forEach( function ( btn ) {
			btn.addEventListener( 'click', function () {
				const alert = btn.closest( '.dtb-alert' );
				if ( ! alert ) return;
				alert.style.transition = 'opacity 180ms ease, transform 180ms ease';
				alert.style.opacity    = '0';
				alert.style.transform  = 'translateY(-4px)';
				setTimeout( function () { alert.remove(); }, 200 );
			} );
		} );
	};

	// =========================================================================
	// TOASTS
	// =========================================================================

	DtbAdmin.initToastContainer = function () {
		if ( ! document.querySelector( '.dtb-toast-container' ) ) {
			const container    = document.createElement( 'div' );
			container.className = 'dtb-toast-container';
			document.body.appendChild( container );
		}
	};

	/**
	 * Show a toast notification.
	 *
	 * @param {string} message  - Main text.
	 * @param {string} [type]   - 'success' | 'danger' | 'warning' | 'info'. Default 'info'.
	 * @param {string} [title]  - Optional title line above message.
	 * @param {number} [duration] - Auto-dismiss ms. 0 = permanent. Default 4000.
	 */
	DtbAdmin.toast = function ( message, type, title, duration ) {
		type     = type     || 'info';
		duration = ( duration === undefined ) ? 4000 : duration;

		const iconMap = {
			success : 'dashicons-yes-alt',
			danger  : 'dashicons-warning',
			warning : 'dashicons-flag',
			info    : 'dashicons-info',
		};

		const iconClass = iconMap[ type ] || iconMap.info;

		const toast = document.createElement( 'div' );
		toast.className = 'dtb-toast dtb-toast--' + type;
		toast.setAttribute( 'role', 'status' );
		toast.setAttribute( 'aria-live', 'polite' );

		toast.innerHTML =
			'<span class="dtb-toast__icon dashicons ' + iconClass + '" aria-hidden="true"></span>' +
			'<div class="dtb-toast__body">' +
				( title ? '<div class="dtb-toast__title">' + escHtml( title ) + '</div>' : '' ) +
				'<p class="dtb-toast__text">' + escHtml( message ) + '</p>' +
			'</div>' +
			'<button class="dtb-toast__close" aria-label="Dismiss" type="button">&#10005;</button>';

		const container = document.querySelector( '.dtb-toast-container' );
		if ( container ) container.appendChild( toast );

		toast.querySelector( '.dtb-toast__close' ).addEventListener( 'click', function () {
			dismissToast( toast );
		} );

		if ( duration > 0 ) {
			setTimeout( function () { dismissToast( toast ); }, duration );
		}

		return toast;
	};

	function dismissToast( toast ) {
		toast.classList.add( 'dtb-toast--exit' );
		setTimeout( function () { toast.remove(); }, 200 );
	}

	// =========================================================================
	// DROPDOWNS
	// =========================================================================

	DtbAdmin.initDropdowns = function () {
		document.querySelectorAll( '[data-dtb-dropdown]' ).forEach( function ( trigger ) {
			trigger.addEventListener( 'click', function ( e ) {
				e.stopPropagation();
				const targetId = trigger.dataset.dtbDropdown;
				const menu     = document.getElementById( targetId );
				if ( ! menu ) return;

				const isOpen = menu.hasAttribute( 'data-open' );

				// Close all open dropdowns.
				document.querySelectorAll( '[data-dtb-dropdown-menu][data-open]' ).forEach( function ( m ) {
					m.removeAttribute( 'data-open' );
					m.style.display = 'none';
				} );

				if ( ! isOpen ) {
					menu.setAttribute( 'data-open', '' );
					menu.style.display = 'block';
				}
			} );
		} );

		// Close on outside click.
		document.addEventListener( 'click', function () {
			document.querySelectorAll( '[data-dtb-dropdown-menu][data-open]' ).forEach( function ( m ) {
				m.removeAttribute( 'data-open' );
				m.style.display = 'none';
			} );
		} );

		// Close on Escape.
		document.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'Escape' ) {
				document.querySelectorAll( '[data-dtb-dropdown-menu][data-open]' ).forEach( function ( m ) {
					m.removeAttribute( 'data-open' );
					m.style.display = 'none';
				} );
			}
		} );
	};

	// =========================================================================
	// DRAWERS
	// =========================================================================

	DtbAdmin.initDrawers = function () {
		// Open triggers.
		document.querySelectorAll( '[data-dtb-open-drawer]' ).forEach( function ( btn ) {
			btn.addEventListener( 'click', function () {
				const drawerId = btn.dataset.dtbOpenDrawer;
				DtbAdmin.openDrawer( drawerId );
			} );
		} );

		// Close buttons inside drawers.
		document.addEventListener( 'click', function ( e ) {
			const closeBtn = e.target.closest( '.dtb-drawer__close, [data-dtb-close-drawer]' );
			if ( closeBtn ) {
				const drawer = closeBtn.closest( '.dtb-drawer' );
				if ( drawer ) DtbAdmin.closeDrawer( drawer.id );
			}

			// Overlay click closes drawer.
			if ( e.target.classList.contains( 'dtb-drawer-overlay' ) ) {
				document.querySelectorAll( '.dtb-drawer.dtb-drawer--open' ).forEach( function ( d ) {
					DtbAdmin.closeDrawer( d.id );
				} );
			}
		} );

		// Escape key.
		document.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'Escape' ) {
				document.querySelectorAll( '.dtb-drawer.dtb-drawer--open' ).forEach( function ( d ) {
					DtbAdmin.closeDrawer( d.id );
				} );
			}
		} );
	};

	/**
	 * Open a drawer by ID.
	 * @param {string} drawerId
	 */
	DtbAdmin.openDrawer = function ( drawerId ) {
		const drawer  = document.getElementById( drawerId );
		const overlay = document.querySelector( '.dtb-drawer-overlay' );
		if ( ! drawer ) return;

		drawer.classList.add( 'dtb-drawer--open' );
		drawer.setAttribute( 'aria-hidden', 'false' );

		if ( overlay ) {
			overlay.classList.add( 'dtb-drawer-overlay--open' );
			overlay.setAttribute( 'aria-hidden', 'false' );
		}

		// Focus first focusable element.
		const focusable = drawer.querySelector( 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])' );
		if ( focusable ) setTimeout( function () { focusable.focus(); }, 50 );
	};

	/**
	 * Close a drawer by ID.
	 * @param {string} drawerId
	 */
	DtbAdmin.closeDrawer = function ( drawerId ) {
		const drawer  = document.getElementById( drawerId );
		const overlay = document.querySelector( '.dtb-drawer-overlay' );
		if ( ! drawer ) return;

		drawer.classList.remove( 'dtb-drawer--open' );
		drawer.setAttribute( 'aria-hidden', 'true' );

		if ( overlay && ! document.querySelector( '.dtb-drawer.dtb-drawer--open' ) ) {
			overlay.classList.remove( 'dtb-drawer-overlay--open' );
			overlay.setAttribute( 'aria-hidden', 'true' );
		}
	};

	// =========================================================================
	// MODALS
	// =========================================================================

	DtbAdmin.initModals = function () {
		document.querySelectorAll( '[data-dtb-open-modal]' ).forEach( function ( btn ) {
			btn.addEventListener( 'click', function () {
				DtbAdmin.openModal( btn.dataset.dtbOpenModal );
			} );
		} );

		document.addEventListener( 'click', function ( e ) {
			const closeBtn = e.target.closest( '.dtb-modal__close, [data-dtb-close-modal]' );
			if ( closeBtn ) {
				const modal = closeBtn.closest( '.dtb-modal-overlay' );
				if ( modal ) DtbAdmin.closeModal( modal.id );
			}

			if ( e.target.classList.contains( 'dtb-modal-overlay' ) ) {
				DtbAdmin.closeModal( e.target.id );
			}
		} );

		document.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'Escape' ) {
				document.querySelectorAll( '.dtb-modal-overlay.dtb-modal-overlay--open' ).forEach( function ( o ) {
					DtbAdmin.closeModal( o.id );
				} );
			}
		} );
	};

	DtbAdmin.openModal = function ( overlayId ) {
		const overlay = document.getElementById( overlayId );
		if ( ! overlay ) return;
		overlay.classList.add( 'dtb-modal-overlay--open' );
		overlay.setAttribute( 'aria-hidden', 'false' );
		document.body.style.overflow = 'hidden';
		const focusable = overlay.querySelector( 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])' );
		if ( focusable ) setTimeout( function () { focusable.focus(); }, 50 );
	};

	DtbAdmin.closeModal = function ( overlayId ) {
		const overlay = document.getElementById( overlayId );
		if ( ! overlay ) return;
		overlay.classList.remove( 'dtb-modal-overlay--open' );
		overlay.setAttribute( 'aria-hidden', 'true' );
		document.body.style.overflow = '';
	};

	// =========================================================================
	// TABS
	// =========================================================================

	DtbAdmin.initTabs = function () {
		document.querySelectorAll( '.dtb-section-nav' ).forEach( function ( nav ) {
			nav.querySelectorAll( '.dtb-section-nav__tab[data-dtb-tab]' ).forEach( function ( tab ) {
				tab.addEventListener( 'click', function ( e ) {
					e.preventDefault();
					const panelId = tab.dataset.dtbTab;
					const navEl   = tab.closest( '.dtb-section-nav' );
					const wrapper = navEl ? navEl.closest( '.dtb-admin' ) || document : document;

					// Deactivate all tabs in this nav.
					navEl.querySelectorAll( '.dtb-section-nav__tab' ).forEach( function ( t ) {
						t.classList.remove( 'dtb-section-nav__tab--active' );
						t.setAttribute( 'aria-selected', 'false' );
					} );

					tab.classList.add( 'dtb-section-nav__tab--active' );
					tab.setAttribute( 'aria-selected', 'true' );

					// Hide all panels associated with this nav.
					const navGroup = navEl.dataset.dtbTabGroup;
					if ( navGroup ) {
						wrapper.querySelectorAll( '[data-dtb-tab-panel][data-dtb-tab-group="' + navGroup + '"]' ).forEach( function ( p ) {
							p.hidden = true;
						} );
					} else {
						wrapper.querySelectorAll( '[data-dtb-tab-panel]' ).forEach( function ( p ) {
							p.hidden = true;
						} );
					}

					const panel = document.getElementById( panelId );
					if ( panel ) panel.hidden = false;
				} );
			} );
		} );
	};

	// =========================================================================
	// LOADING BUTTONS
	// =========================================================================

	DtbAdmin.initLoadingButtons = function () {
		document.querySelectorAll( '[data-dtb-loading]' ).forEach( function ( form ) {
			form.addEventListener( 'submit', function () {
				const btn = form.querySelector( '[type="submit"]' );
				if ( btn ) DtbAdmin.setButtonLoading( btn, true );
			} );
		} );
	};

	DtbAdmin.setButtonLoading = function ( btn, loading ) {
		if ( loading ) {
			btn.classList.add( 'dtb-btn--loading' );
			btn.disabled = true;
			if ( btn.dataset.loadingText ) {
				btn.dataset.originalText = btn.innerHTML;
				btn.innerHTML = btn.dataset.loadingText;
			}
		} else {
			btn.classList.remove( 'dtb-btn--loading' );
			btn.disabled = false;
			if ( btn.dataset.originalText ) {
				btn.innerHTML = btn.dataset.originalText;
			}
		}
	};

	// =========================================================================
	// CONFIRM HELPER
	// =========================================================================

	/**
	 * Attach confirmation to elements with data-dtb-confirm attribute.
	 */
	document.addEventListener( 'click', function ( e ) {
		const btn = e.target.closest( '[data-dtb-confirm]' );
		if ( ! btn ) return;

		const message = btn.dataset.dtbConfirm || 'Are you sure?';
		if ( ! window.confirm( message ) ) {
			e.preventDefault();
			e.stopImmediatePropagation();
		}
	}, true );

	// =========================================================================
	// BULK SELECT
	// =========================================================================

	DtbAdmin.initBulkSelect = function () {
		document.querySelectorAll( '.dtb-table' ).forEach( function ( table ) {
			const masterCheck = table.querySelector( '.dtb-bulk-select-all' );
			const rowChecks   = table.querySelectorAll( '.dtb-bulk-select-row' );
			if ( ! masterCheck ) return;

			masterCheck.addEventListener( 'change', function () {
				rowChecks.forEach( function ( c ) {
					c.checked = masterCheck.checked;
				} );
				updateBulkActions( table );
			} );

			rowChecks.forEach( function ( c ) {
				c.addEventListener( 'change', function () {
					const total   = rowChecks.length;
					const checked = table.querySelectorAll( '.dtb-bulk-select-row:checked' ).length;
					masterCheck.checked       = checked === total;
					masterCheck.indeterminate = checked > 0 && checked < total;
					updateBulkActions( table );
				} );
			} );
		} );
	};

	function updateBulkActions( table ) {
		const checked     = table.querySelectorAll( '.dtb-bulk-select-row:checked' ).length;
		const bulkActions = document.querySelector( '[data-dtb-bulk-count]' );
		if ( bulkActions ) bulkActions.textContent = checked;

		const bulkBar = document.querySelector( '.dtb-bulk-action-bar' );
		if ( bulkBar ) {
			bulkBar.hidden = checked === 0;
		}
	}

	// =========================================================================
	// TABLE ROW → DRAWER
	// =========================================================================

	DtbAdmin.initTableRowDrawer = function () {
		document.querySelectorAll( '.dtb-table__row--clickable' ).forEach( function ( row ) {
			row.addEventListener( 'click', function ( e ) {
				// Don't fire if clicking a button/link inside the row.
				if ( e.target.closest( 'a, button, input, .dtb-btn' ) ) return;

				const drawerId = row.dataset.dtbDrawer;
				if ( drawerId ) {
					DtbAdmin.openDrawer( drawerId );
					DtbAdmin.populateDrawerFromRow( row, drawerId );
				}
			} );

			// Keyboard accessibility.
			row.setAttribute( 'tabindex', '0' );
			row.addEventListener( 'keydown', function ( e ) {
				if ( e.key === 'Enter' || e.key === ' ' ) {
					e.preventDefault();
					const drawerId = row.dataset.dtbDrawer;
					if ( drawerId ) {
						DtbAdmin.openDrawer( drawerId );
						DtbAdmin.populateDrawerFromRow( row, drawerId );
					}
				}
			} );
		} );
	};

	/**
	 * Populate drawer fields from row data attributes.
	 * Row should have data-dtb-* attributes for each drawer field.
	 */
	DtbAdmin.populateDrawerFromRow = function ( row, drawerId ) {
		const drawer = document.getElementById( drawerId );
		if ( ! drawer ) return;

		const data = row.dataset;

		// Update drawer title.
		const titleEl = drawer.querySelector( '.dtb-drawer__title' );
		if ( titleEl && data.dtbDrawerTitle ) titleEl.textContent = data.dtbDrawerTitle;

		// Fill any [data-dtb-field] targets.
		Object.keys( data ).forEach( function ( key ) {
			if ( ! key.startsWith( 'dtbField' ) ) return;
			const fieldName = key.replace( 'dtbField', '' ).toLowerCase();
			const target    = drawer.querySelector( '[data-dtb-target="' + fieldName + '"]' );
			if ( target ) target.textContent = data[ key ];
		} );

		// Trigger a custom event for page-level JS to hook into.
		drawer.dispatchEvent( new CustomEvent( 'dtb:drawer:populate', { detail: { rowData: data }, bubbles: false } ) );
	};

	// =========================================================================
	// AJAX HELPER
	// =========================================================================

	/**
	 * Minimal REST fetch wrapper.
	 * Uses nonce from dtbAdminConfig.nonce (localized by AdminAssets.php).
	 *
	 * @param {string} endpoint  - e.g. '/dtb/v1/command-center'
	 * @param {object} [options] - fetch options (method, body, etc.)
	 * @returns {Promise<any>}
	 */
	DtbAdmin.apiFetch = function ( endpoint, options ) {
		options = options || {};
		const headers = Object.assign(
			{
				'Content-Type' : 'application/json',
				'X-WP-Nonce'   : cfg.nonce || '',
			},
			options.headers || {}
		);

		const baseUrl = ( cfg.restUrl || '/wp-json' ).replace( /\/$/, '' );
		const url     = baseUrl + '/' + endpoint.replace( /^\//, '' );

		return fetch( url, Object.assign( {}, options, { headers } ) )
			.then( function ( res ) {
				if ( ! res.ok ) {
					return res.json().then( function ( err ) {
						throw err;
					} );
				}
				return res.json();
			} );
	};

	// =========================================================================
	// REFRESH HELPER
	// =========================================================================

	/**
	 * Auto-refresh a container by calling a REST endpoint.
	 *
	 * @param {string} containerId   - DOM element ID to update.
	 * @param {string} endpoint      - REST endpoint.
	 * @param {function} renderFn    - Function(data, container) to update DOM.
	 * @param {number} intervalMs    - Polling interval in ms. 0 = no polling.
	 */
	DtbAdmin.startAutoRefresh = function ( containerId, endpoint, renderFn, intervalMs ) {
		const container = document.getElementById( containerId );
		if ( ! container ) return null;

		function refresh() {
			DtbAdmin.apiFetch( endpoint )
				.then( function ( data ) { renderFn( data, container ); } )
				.catch( function () {
					// Silently fail polling — don't disrupt the user.
				} );
		}

		refresh();

		if ( intervalMs && intervalMs > 0 ) {
			return setInterval( refresh, intervalMs );
		}

		return null;
	};

	// =========================================================================
	// UTILITIES
	// =========================================================================

	function escHtml( str ) {
		const d = document.createElement( 'div' );
		d.appendChild( document.createTextNode( String( str ) ) );
		return d.innerHTML;
	}

	DtbAdmin.escHtml = escHtml;

	/**
	 * Format a number as a compact string (e.g. 1.2k).
	 * @param {number} n
	 * @returns {string}
	 */
	DtbAdmin.formatNumber = function ( n ) {
		n = parseInt( n, 10 );
		if ( isNaN( n ) ) return '–';
		if ( n >= 1000000 ) return ( n / 1000000 ).toFixed( 1 ).replace( /\.0$/, '' ) + 'm';
		if ( n >= 1000 )    return ( n / 1000 ).toFixed( 1 ).replace( /\.0$/, '' ) + 'k';
		return String( n );
	};

	/**
	 * Format a currency amount.
	 * @param {number|string} amount
	 * @param {string} [symbol]
	 * @returns {string}
	 */
	DtbAdmin.formatCurrency = function ( amount, symbol ) {
		symbol = symbol || cfg.currencySymbol || '$';
		const num = parseFloat( amount );
		if ( isNaN( num ) ) return symbol + '0.00';
		return symbol + num.toFixed( 2 ).replace( /\B(?=(\d{3})+(?!\d))/g, ',' );
	};

	/**
	 * Relative time string (e.g. "2 hours ago").
	 * @param {string|number} dateInput
	 * @returns {string}
	 */
	DtbAdmin.relativeTime = function ( dateInput ) {
		const date   = new Date( dateInput );
		const now    = new Date();
		const diffMs = now - date;
		const diffS  = Math.floor( diffMs / 1000 );
		const diffM  = Math.floor( diffS / 60 );
		const diffH  = Math.floor( diffM / 60 );
		const diffD  = Math.floor( diffH / 24 );

		if ( diffS < 60 )  return 'Just now';
		if ( diffM < 60 )  return diffM + 'm ago';
		if ( diffH < 24 )  return diffH + 'h ago';
		if ( diffD < 7 )   return diffD + 'd ago';
		return date.toLocaleDateString();
	};

} )();
