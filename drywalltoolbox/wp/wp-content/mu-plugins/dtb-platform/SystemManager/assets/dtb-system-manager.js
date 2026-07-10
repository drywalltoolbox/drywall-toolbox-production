/**
 * DTB System Manager — live operations console runtime.
 *
 * Provides short-interval, resilient polling for the System Manager page without
 * changing the global admin live-region cadence used by heavier queue pages.
 */
( function () {
	'use strict';

	const cfg = window.dtbAdminConfig || {};
	const DtbAdmin = window.DtbAdmin || null;
	const POLL_INTERVAL_MS = 5000;
	const ERROR_BACKOFF_MS = 15000;

	function isSystemManagerPage() {
		return cfg?.page?.slug === 'dtb-system-manager' || document.querySelector( '.dtb-admin[data-dtb-page="dtb-system-manager"]' );
	}

	function endpointWithCurrentState( endpoint ) {
		const url = new URL( endpoint, window.location.origin );
		const params = new URLSearchParams( window.location.search );
		params.forEach( ( value, key ) => {
			if ( value === '' ) {
				url.searchParams.delete( key );
			} else {
				url.searchParams.set( key, value );
			}
		} );
		url.searchParams.set( '_dtb_live', String( Date.now() ) );
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
				'<span class="dtb-system-live-toolbar__status"><span class="dtb-system-live-toolbar__dot" aria-hidden="true"></span><span data-dtb-live-label>Live stream active</span></span>',
				'<span class="dtb-system-live-toolbar__meta" data-dtb-live-meta>Waiting for first sync…</span>',
			'</div>',
			'<div class="dtb-system-live-toolbar__right">',
				'<button type="button" class="dtb-system-live-toolbar__button" data-dtb-system-refresh>Refresh now</button>',
				'<button type="button" class="dtb-system-live-toolbar__button" data-dtb-system-pause>Pause</button>',
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
		if ( label ) {
			label.textContent = state === 'error' ? 'Live stream degraded' : state === 'paused' ? 'Live stream paused' : state === 'refreshing' ? 'Syncing live data' : 'Live stream active';
		}
		if ( meta && message ) meta.textContent = message;
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
			region.querySelectorAll( 'tbody tr:nth-child(-n+5)' ).forEach( ( row ) => row.classList.add( 'dtb-system-row--new' ) );
		}
	}

	function scrollLogTailToEnd( region ) {
		const tail = region.querySelector( '.dtb-system-log-tail' );
		if ( tail ) tail.scrollTop = tail.scrollHeight;
	}

	async function fetchRegion( region, toolbar, state ) {
		if ( state.inFlight || state.paused || document.hidden ) return;
		const endpoint = region.getAttribute( 'data-dtb-endpoint' );
		if ( ! endpoint ) return;

		state.inFlight = true;
		region.classList.add( 'is-refreshing' );
		setToolbarState( toolbar, 'refreshing', 'Checking for new actions, workflows, and logs…' );

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
			if ( ! parsed.html ) throw new Error( 'Empty live payload' );

			const nextHash = parsed.meta?.html_hash || String( parsed.html.length ) + ':' + parsed.html.slice( 0, 120 );
			const previousSignature = signatureForRegion( region );
			if ( nextHash !== state.lastHash ) {
				state.lastHash = nextHash;
				region.innerHTML = parsed.html;
				region.classList.add( 'is-updating' );
				window.setTimeout( () => region.classList.remove( 'is-updating' ), 220 );
				markNewRows( region, previousSignature );
				scrollLogTailToEnd( region );
				if ( DtbAdmin?.rebind ) DtbAdmin.rebind( region );
			}

			state.failures = 0;
			const nowLabel = parsed.meta?.updated_at || new Date().toLocaleTimeString();
			setToolbarState( toolbar, 'ready', 'Last synced ' + nowLabel + ' · 5s cadence' );
		} catch ( error ) {
			if ( error?.name === 'AbortError' ) return;
			state.failures += 1;
			setToolbarState( toolbar, 'error', 'Live sync failed. Retrying in ' + Math.round( ERROR_BACKOFF_MS / 1000 ) + 's.' );
			window.console.warn( '[DTB System Manager] live stream refresh failed:', error );
		} finally {
			state.inFlight = false;
			region.classList.remove( 'is-refreshing' );
		}
	}

	function init() {
		if ( ! isSystemManagerPage() ) return;
		const region = document.querySelector( '[data-dtb-live-region][data-dtb-live-module="system-manager"]' );
		if ( ! region ) return;

		region.classList.add( 'dtb-system-live-region' );
		const toolbar = createToolbar( region );
		const state = {
			controller: null,
			failures: 0,
			inFlight: false,
			lastHash: '',
			paused: false,
		};

		const refresh = () => fetchRegion( region, toolbar, state );
		const pauseButton = toolbar.querySelector( '[data-dtb-system-pause]' );
		const refreshButton = toolbar.querySelector( '[data-dtb-system-refresh]' );

		if ( refreshButton ) {
			refreshButton.addEventListener( 'click', () => refresh() );
		}
		if ( pauseButton ) {
			pauseButton.addEventListener( 'click', () => {
				state.paused = ! state.paused;
				pauseButton.textContent = state.paused ? 'Resume' : 'Pause';
				setToolbarState( toolbar, state.paused ? 'paused' : 'ready', state.paused ? 'Polling paused by admin.' : 'Live polling resumed.' );
				if ( ! state.paused ) refresh();
			} );
		}

		region.addEventListener( 'dtb:live:navigated', () => {
			state.lastHash = '';
			window.setTimeout( refresh, 120 );
		} );

		window.setTimeout( refresh, 250 );
		window.setInterval( () => {
			const delay = state.failures > 0 ? ERROR_BACKOFF_MS : POLL_INTERVAL_MS;
			const last = state.lastAttemptAt || 0;
			if ( Date.now() - last < delay ) return;
			state.lastAttemptAt = Date.now();
			refresh();
		}, 1000 );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
