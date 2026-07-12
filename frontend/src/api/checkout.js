/**
 * Server-authoritative checkout API.
 *
 * This module carries checkout intent and opaque session credentials only.
 * Prices, stock, tax, shipping, coupons, payment state, and order creation
 * are owned by the DTB backend.
 */
import { apiClient } from './client.js';

function post( path, payload = {} ) {
	return apiClient( `/wp-json/dtb/v1/checkout/${ path }`, {
		method: 'POST',
		body: JSON.stringify( payload ),
	} );
}

export async function getCheckoutCapabilities() {
	const response = await apiClient( '/wp-json/dtb/v1/checkout/capabilities' );
	return response?.capabilities || response || {};
}

export async function createCheckoutQuote( payload = {} ) {
	const response = await post( 'quote', payload );
	return response?.quote || response || {};
}

export async function createCheckoutSession( payload = {} ) {
	return post( 'session', payload );
}

export async function confirmCheckoutSession( payload = {} ) {
	return post( 'confirm', payload );
}

export async function finalizeCheckout( payload = {} ) {
	return post( 'finalize', payload );
}

export async function getCheckoutStatus( resumeToken ) {
	const token = encodeURIComponent( String( resumeToken || '' ) );
	return apiClient( `/wp-json/dtb/v1/checkout/status?resume_token=${ token }` );
}

export async function resumeCheckoutPayment( resumeToken ) {
	return post( 'resume-payment', { resume_token: resumeToken } );
}

export async function cancelCheckoutSession( resumeToken ) {
	return post( 'cancel', { resume_token: resumeToken } );
}
