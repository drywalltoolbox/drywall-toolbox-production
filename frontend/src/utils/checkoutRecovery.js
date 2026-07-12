const PENDING_CHECKOUT_KEY = 'dtb:checkout:pending-payment:v2';

function canUseSessionStorage() {
	return typeof window !== 'undefined' && Boolean( window.sessionStorage );
}

export function makeCheckoutAttemptId() {
	const random = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
		? crypto.randomUUID()
		: Math.random().toString( 36 ).slice( 2, 12 );
	return `checkout-${ Date.now() }-${ random }`;
}

export function readPendingCheckoutPayment() {
	if ( !canUseSessionStorage() ) return null;
	try {
		const raw = window.sessionStorage.getItem( PENDING_CHECKOUT_KEY );
		if ( !raw ) return null;
		const parsed = JSON.parse( raw );
		if ( !parsed || typeof parsed !== 'object' || !parsed.resumeToken || !parsed.sessionId ) return null;
		if ( parsed.expiresAt && Date.parse( parsed.expiresAt ) <= Date.now() ) {
			window.sessionStorage.removeItem( PENDING_CHECKOUT_KEY );
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}

export function writePendingCheckoutPayment( payload = {} ) {
	if ( !canUseSessionStorage() || !payload.resumeToken || !payload.sessionId ) return null;
	const normalized = {
		attemptId: payload.attemptId || makeCheckoutAttemptId(),
		resumeToken: String( payload.resumeToken ),
		sessionId: String( payload.sessionId ),
		expiresAt: payload.expiresAt || '',
		cartSnapshot: Array.isArray( payload.cartSnapshot ) ? payload.cartSnapshot : [],
		createdAt: new Date().toISOString(),
	};
	try {
		window.sessionStorage.setItem( PENDING_CHECKOUT_KEY, JSON.stringify( normalized ) );
	} catch {
		// Payment redirect still proceeds if opportunistic recovery storage fails.
	}
	return normalized;
}

export function clearPendingCheckoutPayment() {
	if ( !canUseSessionStorage() ) return;
	try {
		window.sessionStorage.removeItem( PENDING_CHECKOUT_KEY );
	} catch {
		// Non-fatal storage cleanup failure.
	}
}
