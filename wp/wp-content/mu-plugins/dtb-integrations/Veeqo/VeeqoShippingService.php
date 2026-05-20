<?php
/**
 * Veeqo shipping service facade.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_VeeqoShippingService' ) ) {
	return;
}

final class DTB_VeeqoShippingService {
	/**
	 * Dispatch the existing shipping-rates REST calculation handler.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response|null
	 */
	public static function rates( WP_REST_Request $request ): ?WP_REST_Response {
		if ( function_exists( 'dtb_veeqo_route_shipping_rates' ) ) {
			return dtb_veeqo_route_shipping_rates( $request );
		}

		return null;
	}
}

/**
 * Backward-compatible shipping rate wrapper.
 *
 * @param WP_REST_Request $request REST request.
 * @return WP_REST_Response|null
 */
function dtb_integrations_veeqo_shipping_rates( WP_REST_Request $request ): ?WP_REST_Response {
	return DTB_VeeqoShippingService::rates( $request );
}
