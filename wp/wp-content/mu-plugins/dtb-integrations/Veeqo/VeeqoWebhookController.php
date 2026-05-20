<?php
/**
 * Veeqo webhook controller facade.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_VeeqoWebhookController' ) ) {
	return;
}

final class DTB_VeeqoWebhookController {
	/**
	 * Dispatch Veeqo order webhook request.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response|null
	 */
	public static function order( WP_REST_Request $request ): ?WP_REST_Response {
		if ( function_exists( 'dtb_veeqo_route_webhook_order' ) ) {
			return dtb_veeqo_route_webhook_order( $request );
		}

		return null;
	}
}

/**
 * Backward-compatible Veeqo webhook wrapper.
 *
 * @param WP_REST_Request $request REST request.
 * @return WP_REST_Response|null
 */
function dtb_integrations_veeqo_webhook_order( WP_REST_Request $request ): ?WP_REST_Response {
	return DTB_VeeqoWebhookController::order( $request );
}
