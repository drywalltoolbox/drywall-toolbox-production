<?php
/**
 * Plugin Name: DTB Rewards Kill Switch
 * Description: Temporarily disables account/order rewards scheduling, execution, and reward event writes until the rewards program is production-ready.
 * Version: 1.0.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'DTB_REWARDS_ENABLED' ) ) {
	define( 'DTB_REWARDS_ENABLED', false );
}

const DTB_REWARDS_DISABLED_HOOKS = [
	'dtb_order_issue_rewards',
];

/**
 * Runtime guard for disabled rewards jobs.
 *
 * Intentionally does not append integration.rewards.* events. The objective is
 * to make disabled rewards completely silent except for Action Scheduler's own
 * unavoidable bookkeeping when an already-started legacy job finishes.
 */
function dtb_rewards_disabled_noop(): void {
	return;
}

/**
 * Remove all reward job callbacks and attach a no-op sentinel.
 */
function dtb_rewards_kill_switch_disable_callbacks(): void {
	foreach ( DTB_REWARDS_DISABLED_HOOKS as $hook ) {
		remove_all_actions( $hook );
		add_action( $hook, 'dtb_rewards_disabled_noop', 0, 99 );
	}
}

/**
 * Cancel pending reward jobs across Action Scheduler and WP-Cron.
 */
function dtb_rewards_kill_switch_cancel_pending_jobs(): void {
	foreach ( DTB_REWARDS_DISABLED_HOOKS as $hook ) {
		if ( function_exists( 'as_unschedule_all_actions' ) ) {
			as_unschedule_all_actions( $hook, null, 'dtb-orders' );
			as_unschedule_all_actions( $hook );
		}

		if ( function_exists( 'wp_clear_scheduled_hook' ) ) {
			wp_clear_scheduled_hook( $hook );
		}
	}
}

/**
 * Block late/direct reward enqueue attempts during the current request.
 */
function dtb_rewards_kill_switch_enforce(): void {
	dtb_rewards_kill_switch_disable_callbacks();
	dtb_rewards_kill_switch_cancel_pending_jobs();
}

add_action( 'muplugins_loaded', 'dtb_rewards_kill_switch_enforce', PHP_INT_MAX );
add_action( 'plugins_loaded', 'dtb_rewards_kill_switch_enforce', PHP_INT_MAX );
add_action( 'init', 'dtb_rewards_kill_switch_enforce', PHP_INT_MAX );
add_action( 'admin_init', 'dtb_rewards_kill_switch_enforce', PHP_INT_MAX );
add_action( 'action_scheduler_init', 'dtb_rewards_kill_switch_enforce', PHP_INT_MAX );
add_action( 'shutdown', 'dtb_rewards_kill_switch_cancel_pending_jobs', PHP_INT_MAX );

/**
 * Last line of defense: remove callbacks immediately before Action Scheduler
 * attempts to execute any disabled rewards hook.
 */
add_action(
	'action_scheduler_before_execute',
	static function ( $action_id ): void {
		if ( ! function_exists( 'as_get_scheduled_action' ) ) {
			return;
		}

		$action = as_get_scheduled_action( $action_id );
		if ( ! is_object( $action ) || ! method_exists( $action, 'get_hook' ) ) {
			return;
		}

		if ( in_array( (string) $action->get_hook(), DTB_REWARDS_DISABLED_HOOKS, true ) ) {
			dtb_rewards_kill_switch_disable_callbacks();
		}
	},
	0,
	1
);
