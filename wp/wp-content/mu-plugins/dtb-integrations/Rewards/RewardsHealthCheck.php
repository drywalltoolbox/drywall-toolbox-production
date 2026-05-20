<?php
defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_RewardsHealthCheck' ) ) {
	return;
}

final class DTB_RewardsHealthCheck {
	/** Register with platform health registry. */
	public static function register(): void {
		if ( class_exists( 'DTB_HealthRegistry' ) ) {
			DTB_HealthRegistry::register( 'rewards', [ self::class, 'run' ] );
		}
	}

	/**
	 * Return passive Rewards health diagnostics.
	 *
	 * @return array<string,mixed>
	 */
	public static function run(): array {
		$wployalty_loaded = class_exists( 'WLR\Plugin\Helpers\App' );
		$liability_total  = function_exists( 'dtb_rewards_get_total_liability' )
			? (float) dtb_rewards_get_total_liability()
			: 0.0;

		return [
			'ok'                        => $wployalty_loaded,
			'wployalty_loaded'          => $wployalty_loaded,
			'rewards_routes_registered' => function_exists( 'dtb_rewards_register_routes' ),
			'balance_function'          => function_exists( 'dtb_rewards_get_balance' ),
			'liability_function'        => function_exists( 'dtb_rewards_get_total_liability' ),
			'liability_total'           => $liability_total,
		];
	}
}

add_action( 'plugins_loaded', [ 'DTB_RewardsHealthCheck', 'register' ], 20 );

function dtb_integrations_rewards_liability_total(): float {
	return function_exists( 'dtb_rewards_get_total_liability' ) ? (float) dtb_rewards_get_total_liability() : 0.0;
}

/**
 * Backward-compatible rewards health snapshot wrapper.
 *
 * @return array<string,mixed>
 */
function dtb_integrations_rewards_health(): array {
	return DTB_RewardsHealthCheck::run();
}
