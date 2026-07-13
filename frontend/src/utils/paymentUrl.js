/**
 * Normalise a WooCommerce order-pay URL for the DTB headless storefront.
 *
 * WooCommerce payment collection is not a React route. The order-pay URL must
 * stay in the public WordPress/WooCommerce checkout URL space so the native
 * gateway template, gateway scripts, nonces, cookies, and payment callbacks are
 * resolved by WordPress. Staging React builds may live under /staging/{id}, but
 * order-pay must not be prefixed with that SPA base path.
 *
 * Also normalises legacy /wp/checkout/order-pay/ and /order-pay/ variants that
 * some WooCommerce configurations emit.
 *
 * @param {string} value Raw payment_url from the API response.
 * @returns {string}     Normalised absolute URL safe to assign to window.location.
 */
export function normalizePaymentUrl( value ) {
	if ( typeof value !== 'string' || !value.trim() ) return '';

	// process.env.REACT_APP_API_BASE_URL is inlined by Webpack as a string literal.
	const apiBase = ( process.env.REACT_APP_API_BASE_URL || '' ).replace( /\/+$/, '' );
	const fallbackBase = apiBase || window.location.origin;

	let url;
	try {
		url = new URL( value.trim(), fallbackBase );
	} catch {
		return value.trim();
	}

	// Native payment pages are served by WordPress/WooCommerce, not by the React
	// SPA. Strip staging prefixes that earlier builds added so the browser lands
	// on the canonical root payment runtime instead of the staging SPA namespace,
	// which WordPress canonical redirects can collapse to /checkout/ and lose the
	// order-pay endpoint context.
	url.pathname = url.pathname.replace( /^\/staging\/\d+(?=\/checkout(?:\/order-pay)?(?:\/|$))/, '' );

	// Normalise legacy /wp/checkout/order-pay/ → /checkout/order-pay/.
	if ( /^\/wp\/checkout\/order-pay(?:\/|$)/.test( url.pathname ) ) {
		url.pathname = url.pathname.replace( /^\/wp/, '' );
	}

	// Normalise bare /order-pay/ → /checkout/order-pay/.
	if ( /^\/order-pay(?:\/|$)/.test( url.pathname ) ) {
		url.pathname = `/checkout${url.pathname}`;
	}

	return url.toString();
}
