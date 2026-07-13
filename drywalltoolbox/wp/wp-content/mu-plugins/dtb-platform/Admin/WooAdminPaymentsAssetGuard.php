<?php
/**
 * WooCommerce payment-settings asset guard.
 *
 * Keeps WooCommerce/WooPayments admin screens authoritative while preventing the
 * PayPal Payments section bundle from mounting on non-PayPal payment settings
 * pages where its React root is absent.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_enqueue_scripts', 'dtb_woo_admin_payments_asset_guard_dequeue_foreign_provider_scripts', 9999 );
add_action( 'admin_print_scripts', 'dtb_woo_admin_payments_asset_guard_dequeue_foreign_provider_scripts', 0 );

/**
 * Whether this guard is enabled.
 */
function dtb_woo_admin_payments_asset_guard_enabled(): bool {
	return function_exists( 'dtb_feature_enabled' )
		? dtb_feature_enabled( 'DTB_ENABLE_WOO_ADMIN_PAYMENTS_ASSET_GUARD', true )
		: true;
}

/**
 * Whether the current admin page is WooCommerce Settings > Payments.
 */
function dtb_woo_admin_payments_asset_guard_is_payments_page(): bool {
	if ( ! dtb_woo_admin_payments_asset_guard_enabled() || ! is_admin() || wp_doing_ajax() ) {
		return false;
	}

	$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$tab  = isset( $_GET['tab'] ) ? sanitize_key( wp_unslash( $_GET['tab'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	return 'wc-settings' === $page && 'checkout' === $tab;
}

/**
 * Whether the current payment settings section belongs to PayPal Payments.
 */
function dtb_woo_admin_payments_asset_guard_is_paypal_section(): bool {
	$section = isset( $_GET['section'] ) ? sanitize_key( wp_unslash( $_GET['section'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	return '' !== $section && ( false !== strpos( $section, 'paypal' ) || false !== strpos( $section, 'ppcp' ) );
}

/**
 * Dequeue PayPal's section-specific React bundle outside PayPal sections.
 */
function dtb_woo_admin_payments_asset_guard_dequeue_foreign_provider_scripts(): void {
	if ( ! dtb_woo_admin_payments_asset_guard_is_payments_page() || dtb_woo_admin_payments_asset_guard_is_paypal_section() ) {
		return;
	}

	if ( ! current_user_can( 'manage_woocommerce' ) && ! current_user_can( 'manage_options' ) ) {
		return;
	}

	global $wp_scripts;
	if ( ! $wp_scripts instanceof WP_Scripts ) {
		return;
	}

	$handles = array_unique( array_merge( (array) $wp_scripts->queue, array_keys( (array) $wp_scripts->registered ) ) );

	foreach ( $handles as $handle ) {
		$registered = $wp_scripts->registered[ $handle ] ?? null;
		$src        = $registered && isset( $registered->src ) ? (string) $registered->src : '';
		$haystack   = strtolower( $handle . ' ' . $src );

		$is_paypal_settings_bundle = false !== strpos( $haystack, 'ppcp-settings' )
			|| false !== strpos( $haystack, 'ppcp-settings-js' )
			|| ( false !== strpos( $haystack, 'paypal' ) && false !== strpos( $haystack, 'settings' ) );

		if ( ! $is_paypal_settings_bundle ) {
			continue;
		}

		wp_dequeue_script( $handle );
		wp_deregister_script( $handle );
	}
}
