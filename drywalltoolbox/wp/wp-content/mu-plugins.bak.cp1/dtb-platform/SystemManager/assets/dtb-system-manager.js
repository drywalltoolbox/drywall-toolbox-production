/**
 * DTB System Manager — manual operational snapshot runtime.
 *
 * All System Manager tabs, including Audit Log, are intentionally snapshot based.
 * Updates occur only on page load, tab navigation, or explicit operator refresh.
 */
( function () {
	'use strict';

	const cfg = window.dtbAdminConfig || {};
	const DtbAdmin = window.DtbAdmin || null;

	function isSystemManagerPage() {
		return cfg?.page?.slug === 'dtb-system-manager' || document.querySelector( '.dtb-admin[data-dtb-page="dtb-system-manager"]' );
	}

	function currentTab() {
		const params = new URLSearchParams( window.location.search );
		return params.get( 'tab' ) || 'system';
	}

	function isAuditTab() {
		return currentTab() === 'audit';
	}

	function suppressGlobalAutoPolling() {
		if ( ! DtbAdmin || ! DtbAdmin.registerLiveRegion || DtbAdmin._dtbSystemManagerObservabilityPatch ) return;

		const originalRegisterLiveRegion = DtbAdmin.registerLiveRegion;
		DtbAdmin.registerLiveRegion = function ( el ) {
			if ( el && el.getAttribute( 'data-dtb-live-module' ) === 'system-manager' ) {
				el.setAttribute( 'data-dtb-refresh-interval', '0' );
			}
			return originalRegisterLiveRegion.call( DtbAdmin, el );
		};
		DtbAdmin._dtbSystemManagerObservabilityPatch = true;
	}

	function endpointWithCurrentState( endpoint ) {
		const url = new URL( endpoint, window.location.origin );
		const params = new URLSearchParams( window.location.search );
		params.forEach( ( value, key ) => {
			if ( key === 'status' || key === 'paged' || key === '_dtb_live' || key === '_dtb_snapshot' ) return;
			if ( value === '' ) {
				url.searchParams.delete( key );
			} else {
				url.searchParams.set( key, value );
			}
		} );
		url.searchParams.set( '_dtb_snapshot', String( Date.now() ) );
		return url.toString();
	}

	function normalizePayload( payload ) {
		if ( payload && typeof payload === 'object' ) {
			return {
				html: String( payload.html || '' ),
				meta: payload.meta || {},
			};
		}
		return { html: String( payload || '' ), meta: {} };
	}

	function createToolbar( region ) {
		const existing = document.querySelector( '[data-dtb-system-live-toolbar]' );
		if ( existing ) return existing;

		const toolbar = document.createElement( 'div' );
		toolbar.className = 'dtb-system-live-toolbar';
		toolbar.setAttribute( 'data-dtb-system-live-toolbar', '1' );
		toolbar.setAttribute( 'data-state', 'ready' );
		toolbar.innerHTML = [
			'<div class="dtb-system-live-toolbar__left">',
				'<span class="dtb-system-live-toolbar__status"><span class="dtb-system-live-toolbar__dot" aria-hidden="true"></span><span data-dtb-live-label></span></span>',
				'<span class="dtb-system-live-toolbar__meta" data-dtb-live-meta></span>',
			'</div>',
			'<div class="dtb-system-live-toolbar__right">',
				'<button type="button" class="dtb-system-live-toolbar__button" data-dtb-system-refresh></button>',
			'</div>',
		].join( '' );

		region.parentNode.insertBefore( toolbar, region );
		return toolbar;
	}

	function setToolbarState( toolbar, state, message ) {
		if ( ! toolbar ) return;
		toolbar.setAttribute( 'data-state', state );
		const label = toolbar.querySelector( '[data-dtb-live-label]' );
		const meta = toolbar.querySelector( '[data-dtb-live-meta]' );
		const button = toolbar.querySelector( '[data-dtb-system-refresh]' );
		if ( label ) {
			if ( state === 'error' ) label.textContent = 'Snapshot refresh failed';
			else if ( state === 'refreshing' ) label.textContent = 'Refreshing snapshot';
			else label.textContent = isAuditTab() ? 'Manual audit snapshot mode' : 'Manual snapshot mode';
		}
		if ( meta && message ) meta.textContent = message;
		if ( button ) button.textContent = isAuditTab() ? 'Refresh audit snapshot' : 'Refresh snapshot';
	}

	function signatureForRegion( region ) {
		const firstRow = region.querySelector( 'tbody tr:first-child' );
		const logTail = region.querySelector( '.dtb-system-log-tail' );
		return ( firstRow ? firstRow.textContent.trim() : '' ) || ( logTail ? logTail.textContent.slice( -280 ) : '' );
	}

	function markNewRows( region, previousSignature ) {
		if ( ! previousSignature ) return;
		const firstRow = region.querySelector( 'tbody tr:first-child' );
		if ( ! firstRow ) return;
		const current = firstRow.textContent.trim();
		if ( current && current !== previousSignature ) {
			region.querySelectorAll( 'tbody tr:nth-child(-n+8)' ).forEach( ( row ) => row.classList.add( 'dtb-system-row--new' ) );
		}
	}

	function scrollLogTailToEnd( region ) {
		const tail = region.querySelector( '.dtb-system-log-tail' );
		if ( tail ) tail.scrollTop = tail.scrollHeight;
	}

	async function fetchRegion( region, toolbar, state, reason = 'manual' ) {
		if ( state.inFlight || document.hidden ) return;
		const endpoint = region.getAttribute( 'data-dtb-endpoint' );
		if ( ! endpoint ) return;

		state.inFlight = true;
		region.classList.add( 'is-refreshing' );
		setToolbarState( toolbar, 'refreshing', isAuditTab() ? 'Loading latest audit, workflow, integration, queue, and order events…' : 'Loading latest snapshot…' );

		try {
			if ( state.controller ) state.controller.abort();
			state.controller = new AbortController();
			const response = await fetch( endpointWithCurrentState( endpoint ), {
				signal: state.controller.signal,
				credentials: 'same-origin',
				headers: {
					'Accept': 'application/json',
					'X-WP-Nonce': cfg.nonce || '',
				},
			} );

			if ( ! response.ok ) throw new Error( 'HTTP ' + response.status );
			const parsed = normalizePayload( await response.json() );
			if ( ! parsed.html ) throw new Error( 'Empty observability payload' );

			const previousSignature = signatureForRegion( region );
			if ( parsed.html !== state.lastHtml ) {
				state.lastHtml = parsed.html;
				region.innerHTML = parsed.html;
				region.classList.add( 'is-updating' );
				window.setTimeout( () => region.classList.remove( 'is-updating' ), 220 );
				markNewRows( region, previousSignature );
				scrollLogTailToEnd( region );
				if ( DtbAdmin?.rebind ) DtbAdmin.rebind( region );
			}

			state.failures = 0;
			const nowLabel = parsed.meta?.updated_at || new Date().toLocaleTimeString();
			setToolbarState(
				toolbar,
				'ready',
				isAuditTab()
					? 'Audit snapshot refreshed ' + nowLabel + '. No automatic polling is running.'
					: 'Snapshot refreshed ' + nowLabel + '. No automatic polling is running.'
			);
		} catch ( error ) {
			if ( error?.name === 'AbortError' ) return;
			state.failures += 1;
			setToolbarState( toolbar, 'error', 'Refresh failed. Check the PHP error log if this repeats.' );
			window.console.warn( '[DTB System Manager] snapshot refresh failed:', error, reason );
		} finally {
			state.inFlight = false;
			region.classList.remove( 'is-refreshing' );
		}
	}

	function init() {
		if ( ! isSystemManagerPage() ) return;
		const region = document.querySelector( '[data-dtb-live-region][data-dtb-live-module="system-manager"]' );
		if ( ! region ) return;

		region.setAttribute( 'data-dtb-refresh-interval', '0' );
		region.classList.add( 'dtb-system-live-region' );
		const toolbar = createToolbar( region );
		const state = {
			controller: null,
			failures: 0,
			inFlight: false,
			lastHtml: region.innerHTML,
		};

		const refresh = ( reason = 'manual' ) => fetchRegion( region, toolbar, state, reason );
		const refreshButton = toolbar.querySelector( '[data-dtb-system-refresh]' );
		if ( refreshButton ) {
			refreshButton.addEventListener( 'click', () => refresh( 'button' ) );
		}

		setToolbarState(
			toolbar,
			'ready',
			isAuditTab()
				? 'Refresh manually, reload the page, or switch tabs to update the audit snapshot. No automatic polling is running.'
				: 'Refresh manually, reload the page, or switch tabs to update this view. No automatic polling is running.'
		);

		region.addEventListener( 'dtb:live:navigated', () => {
			state.lastHtml = region.innerHTML;
			state.failures = 0;
			setToolbarState(
				toolbar,
				'ready',
				isAuditTab()
					? 'Audit snapshot updated from tab navigation. No automatic polling is running.'
					: 'Snapshot updated from tab navigation. No automatic polling is running.'
			);
		} );
	}

	suppressGlobalAutoPolling();

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
