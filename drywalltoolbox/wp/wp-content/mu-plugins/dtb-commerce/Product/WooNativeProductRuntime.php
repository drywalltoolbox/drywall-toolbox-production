<?php
/**
 * Native WooCommerce product purchasing surface for the headless storefront.
 *
 * Catalog discovery remains React-owned. A canonical `/products/{slug}` request
 * is deliberately handed to WooCommerce so the product form, variations, cart
 * mutations, and official Stripe Express Checkout Element retain one native
 * lifecycle and one order/payment authority.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_WooNativeProductRuntime {
	private const ASSET_VERSION = '2026.07.19.1';

	public static function register(): void {
		add_action( 'wp', [ __CLASS__, 'prepare_runtime' ], 1 );
		add_filter( 'template_include', [ __CLASS__, 'template_include' ], 1000 );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_assets' ], 40 );
		add_filter( 'body_class', [ __CLASS__, 'body_class' ] );
		add_filter( 'post_type_link', [ __CLASS__, 'product_permalink' ], 20, 2 );
		add_filter( 'redirect_canonical', [ __CLASS__, 'preserve_public_product_url' ], 20, 2 );
		add_filter( 'woocommerce_product_get_default_attributes', [ __CLASS__, 'selected_variation_defaults' ], 20, 2 );
		add_filter( 'woocommerce_quantity_input_args', [ __CLASS__, 'selected_quantity' ], 20, 2 );
	}

	public static function prepare_runtime(): void {
		if ( ! self::is_native_product_surface() ) {
			return;
		}

		// The headless theme normally replaces every frontend template with the
		// React shell and removes plugin assets. Native product purchasing needs
		// WooCommerce and the official Stripe extension to keep their own assets.
		remove_action( 'wp_enqueue_scripts', 'dtb_enqueue_react_app', 10 );
		remove_action( 'wp_enqueue_scripts', 'dtb_dequeue_non_react_assets', 9999 );
		remove_filter( 'template_include', 'dtb_force_react_template', 99 );
	}

	public static function template_include( string $template ): string {
		if ( ! self::is_native_product_surface() ) {
			return $template;
		}

		$native_template = dirname( __DIR__ ) . '/Templates/WooNativeProductPage.php';
		return is_readable( $native_template ) ? $native_template : $template;
	}

	public static function enqueue_assets(): void {
		if ( ! self::is_native_product_surface() ) {
			return;
		}

		wp_enqueue_style(
			'dtb-woo-native-product',
			content_url( 'mu-plugins/dtb-commerce/assets/woo-native-product.css' ),
			[],
			self::ASSET_VERSION
		);
	}

	public static function body_class( array $classes ): array {
		if ( self::is_native_product_surface() ) {
			$classes[] = 'dtb-native-product-page';
			$classes[] = 'dtb-official-stripe-product';
		}
		return $classes;
	}

	/** Keep Woo-generated product and related-product links on the public route. */
	public static function product_permalink( string $url, $post ): string {
		if ( ! $post instanceof WP_Post || 'product' !== $post->post_type || '' === $post->post_name ) {
			return $url;
		}

		$base_path = function_exists( 'dtb_detect_storefront_base_path' )
			? dtb_detect_storefront_base_path()
			: '';

		return home_url( $base_path . '/products/' . rawurlencode( $post->post_name ) . '/' );
	}

	/** Prevent core canonical redirects from exposing `/wp/` or `/product/`. */
	public static function preserve_public_product_url( $redirect_url, $requested_url ) {
		return self::is_native_product_surface() ? false : $redirect_url;
	}

	/**
	 * Preselect a React-chosen variation after a modal/full-page handoff.
	 * WooCommerce still validates that the variation belongs to this product.
	 */
	public static function selected_variation_defaults( array $defaults, $product ): array {
		if ( ! self::is_native_product_surface() || ! $product instanceof WC_Product ) {
			return $defaults;
		}

		$variation_id = self::requested_variation_id();
		if ( $variation_id <= 0 ) {
			return $defaults;
		}

		$variation = wc_get_product( $variation_id );
		if (
			! $variation instanceof WC_Product_Variation ||
			(int) $variation->get_parent_id() !== (int) $product->get_id()
		) {
			return $defaults;
		}

		$selected = [];
		foreach ( $variation->get_variation_attributes() as $attribute_name => $value ) {
			$key = preg_replace( '/^attribute_/', '', (string) $attribute_name );
			if ( is_string( $key ) && '' !== $key && '' !== (string) $value ) {
				$selected[ $key ] = (string) $value;
			}
		}

		return $selected ?: $defaults;
	}

	/** Preserve the modal-selected quantity without bypassing Woo stock limits. */
	public static function selected_quantity( array $args, $product ): array {
		if ( ! self::is_native_product_surface() || ! $product instanceof WC_Product ) {
			return $args;
		}

		$quantity = isset( $_GET['quantity'] ) ? absint( wp_unslash( $_GET['quantity'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( $quantity <= 0 ) {
			return $args;
		}

		$maximum = isset( $args['max_value'] ) && (int) $args['max_value'] > 0
			? (int) $args['max_value']
			: 99;
		$args['input_value'] = min( max( 1, $quantity ), $maximum );

		return $args;
	}

	private static function requested_variation_id(): int {
		if ( isset( $_GET['variation_id'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return absint( wp_unslash( $_GET['variation_id'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		}
		if ( isset( $_GET['variant'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return absint( wp_unslash( $_GET['variant'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		}

		$path = self::request_path();
		if ( preg_match( '#/variations/([0-9]+)/?$#', $path, $matches ) ) {
			return absint( $matches[1] );
		}

		return 0;
	}

	private static function is_native_product_surface(): bool {
		if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
			return false;
		}

		if ( function_exists( 'is_product' ) && is_product() ) {
			return true;
		}

		return (bool) preg_match(
			'#^/(?:staging/[A-Za-z0-9_-]+/)?products/(?!brands(?:/|$))[A-Za-z0-9_-]+(?:/variations/[0-9]+)?/?$#i',
			self::request_path()
		);
	}

	private static function request_path(): string {
		$request_uri = isset( $_SERVER['REQUEST_URI'] )
			? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			: '';
		return (string) wp_parse_url( $request_uri, PHP_URL_PATH );
	}
}

DTB_WooNativeProductRuntime::register();
