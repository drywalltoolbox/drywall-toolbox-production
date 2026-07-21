<?php
/**
 * Canonical WooCommerce checkout-field policy.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_CheckoutFieldPolicy {
	public static function register(): void {
		add_filter( 'option_woocommerce_checkout_phone_field', [ __CLASS__, 'optional_phone' ] );
		add_filter( 'default_option_woocommerce_checkout_phone_field', [ __CLASS__, 'optional_phone' ] );
	}

	/** Keep the standard WooCommerce phone field visible but optional. */
	public static function optional_phone( $value ): string {
		return 'optional';
	}
}

