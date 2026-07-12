/**
 * Store API cart operations only.
 *
 * Checkout quoting, payment handoff, and order creation belong to
 * frontend/src/api/checkout.js and the DTB server checkout boundary.
 */
const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : '';
const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const envApiBase = ( process.env.REACT_APP_API_BASE_URL || '' ).replace( /\/+$/, '' );
const resolvedApiBase = envApiBase || ( /github\.io$/i.test( runtimeHost ) ? 'https://drywalltoolbox.com' : runtimeOrigin );
const configuredStorePath = ( process.env.REACT_APP_STORE_API_BASE || '/wp-json/wc/store/v1' ).replace( /\/+$/, '' );

const STORE_BASE_CANDIDATES = Array.from( new Set( [
	`${ resolvedApiBase.replace( /\/+$/, '' ) }${ configuredStorePath }`,
	`${ resolvedApiBase.replace( /\/+$/, '' ) }/wp/wp-json/wc/store/v1`,
] ) ).filter( Boolean );

let activeStoreBaseIndex = 0;
let storeNonce = '';
let cartToken = '';

function currentStoreBase() {
	return STORE_BASE_CANDIDATES[ activeStoreBaseIndex ] || STORE_BASE_CANDIDATES[0] || '';
}

function updateStoreSessionHeaders( response ) {
	const nonce = response.headers.get( 'Nonce' ) || response.headers.get( 'X-WC-Store-API-Nonce' );
	if ( nonce ) storeNonce = nonce;
	const token = response.headers.get( 'Cart-Token' );
	if ( token ) cartToken = token;
}

async function storeFetch( path, options = {}, isRetry = false ) {
	const url = `${ currentStoreBase() }${ path }`;
	const response = await fetch( url, {
		credentials: 'include',
		...options,
		headers: {
			'Content-Type': 'application/json',
			...( storeNonce ? { 'X-WC-Store-API-Nonce': storeNonce } : {} ),
			...( cartToken ? { 'Cart-Token': cartToken } : {} ),
			...( options.headers || {} ),
		},
	} );

	updateStoreSessionHeaders( response );
	if ( response.status === 404 && !isRetry && activeStoreBaseIndex < STORE_BASE_CANDIDATES.length - 1 ) {
		activeStoreBaseIndex += 1;
		return storeFetch( path, options, true );
	}
	if ( response.status === 401 ) {
		if ( isRetry ) throw new Error( `Store API 401: ${ url }` );
		await initCart();
		return storeFetch( path, options, true );
	}
	if ( !response.ok ) {
		let message = `Store API error ${ response.status }: ${ url }`;
		try {
			const body = await response.json();
			if ( body?.message ) message = body.message;
		} catch { /* Response may not contain JSON. */ }
		throw new Error( message );
	}
	if ( response.status === 204 ) return null;
	return response.json();
}

export async function initCart() {
	const url = `${ currentStoreBase() }/cart`;
	const response = await fetch( url, {
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
	} );
	updateStoreSessionHeaders( response );
	if ( response.status === 404 && activeStoreBaseIndex < STORE_BASE_CANDIDATES.length - 1 ) {
		activeStoreBaseIndex += 1;
		return initCart();
	}
	if ( !response.ok ) throw new Error( `Store API error ${ response.status }: ${ url }` );
	if ( response.status === 204 ) return null;
	return response.json();
}

export async function getCart() {
	return storeFetch( '/cart' );
}

export async function addToCart( productId, qty = 1, variation = [], extensions = {} ) {
	return storeFetch( '/cart/add-item', {
		method: 'POST',
		body: JSON.stringify( { id: productId, quantity: qty, variation, extensions } ),
	} );
}

export async function updateCartItem( key, qty ) {
	const encodedKey = encodeURIComponent( key );
	const quantity = Math.max( 1, Math.floor( Number( qty ) || 1 ) );
	try {
		const payload = await storeFetch( '/cart/update-item', {
			method: 'POST',
			body: JSON.stringify( { key, quantity } ),
		} );
		return payload?.items ? payload : getCart();
	} catch {
		const payload = await storeFetch( `/cart/items/${ encodedKey }`, {
			method: 'PUT',
			body: JSON.stringify( { quantity } ),
		} );
		return payload?.items ? payload : getCart();
	}
}

export async function removeCartItem( key ) {
	const encodedKey = encodeURIComponent( key );
	try {
		const payload = await storeFetch( `/cart/items/${ encodedKey }`, { method: 'DELETE' } );
		return payload?.items ? payload : getCart();
	} catch {
		const payload = await storeFetch( '/cart/remove-item', {
			method: 'POST',
			body: JSON.stringify( { key } ),
		} );
		return payload?.items ? payload : getCart();
	}
}

export async function applyCoupon( code ) {
	return storeFetch( '/cart/coupons', {
		method: 'POST',
		body: JSON.stringify( { code } ),
	} );
}

export async function removeCoupon( code ) {
	return storeFetch( `/cart/coupons/${ encodeURIComponent( code ) }`, { method: 'DELETE' } );
}

export async function updateCartCustomer( customerData ) {
	return storeFetch( '/cart/update-customer', {
		method: 'POST',
		body: JSON.stringify( customerData ),
	} );
}

export async function selectShippingRate( rateId, packageId = 0 ) {
	return storeFetch( '/cart/select-shipping-rate', {
		method: 'POST',
		body: JSON.stringify( { rate_id: rateId, package_id: packageId } ),
	} );
}

export async function clearStoreCart() {
	const cart = await getCart();
	if ( !cart?.items?.length ) return cart;
	for ( const item of cart.items ) await removeCartItem( item.key );
	return getCart();
}
