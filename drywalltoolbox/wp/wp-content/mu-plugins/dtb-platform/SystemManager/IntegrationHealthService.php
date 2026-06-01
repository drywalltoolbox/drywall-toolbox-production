<?php
/**
 * DTB Platform — IntegrationHealthService
 *
 * Tests reachability of configured third-party integrations.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_integration_health_get(): array {
	$transient = get_transient( 'dtb_integration_health' );
	if ( is_array( $transient ) ) {
		return $transient;
	}

	$integrations = [
		[
			'name'    => 'WooCommerce',
			'ok'      => class_exists( 'WooCommerce' ),
			'version' => defined( 'WC_VERSION' ) ? WC_VERSION : 'n/a',
		],
		[
			'name'    => 'Stripe',
			'ok'      => class_exists( 'WC_Stripe' ),
			'version' => defined( 'WC_STRIPE_VERSION' ) ? WC_STRIPE_VERSION : 'n/a',
		],
		[
			'name'    => 'ShipStation',
			'ok'      => function_exists( 'wc_shipstation' ) || defined( 'WC_SHIPSTATION_VERSION' ),
			'version' => defined( 'WC_SHIPSTATION_VERSION' ) ? WC_SHIPSTATION_VERSION : 'n/a',
		],
	];

	// Add DTB mu-plugin module presence checks.
	$modules = [
		'dtb-platform'       => 'dtb_admin_shell_open',
		'dtb-catalog'        => 'dtb_catalog_get_product',
		'dtb-commerce'       => 'dtb_orders_get',
		'dtb-repair-service' => 'dtb_repairs_count_by_status',
		'dtb-returns'        => 'dtb_returns_count_by_status',
		'dtb-support'        => 'dtb_support_count_by_status',
		'dtb-schematics'     => 'dtb_schematics_get',
		'dtb-media'          => 'dtb_image_sync_status',
	];

	foreach ( $modules as $label => $probe_fn ) {
		$integrations[] = [
			'name'    => $label,
			'ok'      => function_exists( $probe_fn ),
			'version' => 'mu-plugin',
		];
	}

	$data = [ 'integrations' => $integrations ];

	set_transient( 'dtb_integration_health', $data, 5 * MINUTE_IN_SECONDS );

	return $data;
}
