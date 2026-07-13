/**
 * Normalise a WooCommerce order-pay URL for the current deployment context.
 *
 * WooCommerce always generates payment URLs rooted at the production checkout
 * path (e.g. https://drywalltoolbox.com/checkout/order-pay/{id}/...).
 *
 * On staging the React app runs under PUBLIC_URL (e.g. /staging/2972), so the
 * redirect must be prefixed to keep the user inside the staging environment
 * where the correct WP theme / PaymentRuntime template is reached.
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

	// Normalise legacy /wp/checkout/order-pay/ → /checkout/order-pay/
	if ( /^\/wp\/checkout\/order-pay(?:\/|$)/.test( url.pathname ) ) {
		url.pathname = url.pathname.replace( /^\/wp/, '' );
	}

	// Normalise bare /order-pay/ → /checkout/order-pay/
	if ( /^\/order-pay(?:\/|$)/.test( url.pathname ) ) {
		url.pathname = `/checkout${url.pathname}`;
	}

	// WooCommerce's get_checkout_payment_url() does not always emit the
	// pretty-permalink /checkout/order-pay/{id}/ path shape. With plain
	// permalinks (or when the URL is reduced for any other reason) it emits
	// a bare /checkout/ path with the order id and pay_for_order carried in
	// the query string instead — e.g.
	//   /checkout/?pay_for_order=true&key=wc_order_xxx
	//   /checkout/?order-pay=123&key=wc_order_xxx
	// This is a legitimate, order-pay-equivalent shape and MUST be treated
	// identically to /checkout/order-pay/ for staging-prefix purposes. Every
	// production incident traced to this file so far was this exact case:
	// the pathname-only check below matched neither shape, so the staging
	// prefix was silently dropped and the browser navigated to the bare
	// production domain (which serves only the static coming-soon page).
	const isOrderPayPath = /^\/checkout\/order-pay(?:\/|$)/.test( url.pathname );
	const isReducedOrderPayShape =
		/^\/checkout\/?$/.test( url.pathname ) &&
		( url.searchParams.get( 'pay_for_order' ) === 'true' || url.searchParams.has( 'order-pay' ) ) &&
		url.searchParams.has( 'key' );

	// Prefix with the staging/sub-path base when the app is deployed under a
	// sub-directory.  process.env.PUBLIC_URL is inlined as a string literal by
	// Webpack — "/staging/2972" for staging, "" or "/" for production.
	const publicUrl = ( process.env.PUBLIC_URL || '' ).replace( /\/+$/, '' );

	if (
		publicUrl &&
		publicUrl !== '/' &&
		( isOrderPayPath || isReducedOrderPayShape ) &&
		!url.pathname.startsWith( publicUrl + '/checkout' )
	) {
		url.pathname = publicUrl + url.pathname;
	}

	return url.toString();
}
