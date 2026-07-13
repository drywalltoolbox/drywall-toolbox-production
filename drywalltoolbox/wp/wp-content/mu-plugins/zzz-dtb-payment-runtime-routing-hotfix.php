<?php
/**
 * Compatibility hotfix: payment runtime routing guard.
 *
 * Keeps WooCommerce keyed order-pay requests inside the native payment runtime
 * when the storefront is served from the staging SPA prefix. This file is a
 * deliberately narrow root-level MU shim because it must run after the loader
 * and before WordPress canonical redirect/template resolution.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_payment_runtime_hotfix_request' ) ) {
	/** Detect keyed WooCommerce order-pay requests across production and staging paths. */
	function dtb_payment_runtime_hotfix_request(): bool {
		if (
			is_admin()
			|| ( defined( 'REST_REQUEST' ) && REST_REQUEST )
			|| ( defined( 'DOING_CRON' ) && DOING_CRON )
			|| ( defined( 'WP_CLI' ) && WP_CLI )
			|| ( defined( 'DOING_AJAX' ) && DOING_AJAX )
		) {
			return false;
		}

		if ( function_exists( 'dtb_wc_payment_runtime_request' ) && dtb_wc_payment_runtime_request() ) {
			return true;
		}

		$request_uri = isset( $_SERVER['REQUEST_URI'] )
			? sanitize_text_field( wp_unslash( (string) $_SERVER['REQUEST_URI'] ) )
			: '';
		$path        = (string) wp_parse_url( $request_uri, PHP_URL_PATH );
		$query       = (string) wp_parse_url( $request_uri, PHP_URL_QUERY );

		return (bool) preg_match( '#/(?:staging/\d+/)?checkout/order-pay/\d+/?#', $path )
			|| ( false !== stripos( $query, 'pay_for_order=true' ) && false !== stripos( $query, 'key=wc_order_' ) );
	}
}

if ( ! function_exists( 'dtb_payment_runtime_hotfix_mu_root' ) ) {
	/** Return the canonical mu-plugins root directory. */
	function dtb_payment_runtime_hotfix_mu_root(): string {
		return __DIR__;
	}
}

if ( ! function_exists( 'dtb_payment_runtime_hotfix_asset_url' ) ) {
	/** Return a public URL for a file under the canonical mu-plugins asset tree. */
	function dtb_payment_runtime_hotfix_asset_url( string $asset ): string {
		$base = defined( 'WPMU_PLUGIN_URL' ) ? WPMU_PLUGIN_URL : content_url( '/mu-plugins' );
		return trailingslashit( $base ) . 'dtb-platform/assets/' . ltrim( $asset, '/' );
	}
}

add_filter(
	'redirect_canonical',
	static function ( $redirect_url, $requested_url ) {
		unset( $requested_url );
		return dtb_payment_runtime_hotfix_request() ? false : $redirect_url;
	},
	0,
	2
);

add_action(
	'template_redirect',
	static function (): void {
		if ( ! dtb_payment_runtime_hotfix_request() ) {
			return;
		}

		if ( function_exists( 'dtb_wc_payment_runtime_prime_order_pay_query_vars' ) ) {
			dtb_wc_payment_runtime_prime_order_pay_query_vars();
		}
		if ( function_exists( 'dtb_wc_payment_runtime_prepare_current_order' ) ) {
			dtb_wc_payment_runtime_prepare_current_order();
		}
	},
	0
);

add_action(
	'wp_enqueue_scripts',
	static function (): void {
		if ( ! dtb_payment_runtime_hotfix_request() ) {
			return;
		}

		if ( function_exists( 'hb_dequeue_all_frontend_assets' ) ) {
			remove_action( 'wp_enqueue_scripts', 'hb_dequeue_all_frontend_assets', 9999 );
		}
		if ( function_exists( 'dtb_dequeue_non_react_assets' ) ) {
			remove_action( 'wp_enqueue_scripts', 'dtb_dequeue_non_react_assets', 9999 );
		}
		if ( function_exists( 'dtb_enqueue_react_app' ) ) {
			remove_action( 'wp_enqueue_scripts', 'dtb_enqueue_react_app' );
		}

		$asset_dir = dtb_payment_runtime_hotfix_mu_root() . '/dtb-platform/assets';
		$assets    = [
			'payment-runtime.css' => [ 'type' => 'style', 'deps' => [] ],
			'payment-runtime-modern-typography.css' => [ 'type' => 'style', 'deps' => [ 'dtb-payment-runtime' ] ],
			'payment-runtime.js'  => [ 'type' => 'script', 'deps' => [] ],
			'payment-runtime-bnpl-flow.js' => [ 'type' => 'script', 'deps' => [ 'dtb-payment-runtime' ] ],
		];

		foreach ( $assets as $file => $meta ) {
			$path = $asset_dir . '/' . $file;
			if ( ! file_exists( $path ) ) {
				continue;
			}

			$handle = 'dtb-' . sanitize_key( str_replace( [ '.css', '.js' ], '', $file ) );
			$url    = dtb_payment_runtime_hotfix_asset_url( $file );
			$ver    = (string) filemtime( $path );
			$deps   = (array) ( $meta['deps'] ?? [] );

			if ( 'style' === $meta['type'] ) {
				wp_enqueue_style( $handle, $url, $deps, $ver );
			} else {
				wp_enqueue_script( $handle, $url, $deps, $ver, true );
			}
		}
	},
	0
);

add_filter(
	'template_include',
	static function ( string $template ): string {
		if ( ! dtb_payment_runtime_hotfix_request() ) {
			return $template;
		}

		if ( function_exists( 'dtb_wc_payment_runtime_prepare_current_order' ) ) {
			dtb_wc_payment_runtime_prepare_current_order();
		}

		$runtime_template = dtb_payment_runtime_hotfix_mu_root() . '/dtb-platform/Templates/WooPaymentRuntime.php';
		return file_exists( $runtime_template ) ? $runtime_template : $template;
	},
	PHP_INT_MAX
);
