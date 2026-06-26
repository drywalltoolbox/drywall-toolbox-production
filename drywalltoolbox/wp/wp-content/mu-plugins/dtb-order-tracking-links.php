<?php
/**
 * Plugin Name: DTB Order Tracking Links
 * Description: Routes customer-facing product orders to the React order tracking page and injects tracking links into customer emails.
 * Version: 1.0.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'dtb_tracking_links_is_public_request' ) ) {
	function dtb_tracking_links_is_public_request(): bool {
		return ! is_admin()
			&& ! ( defined( 'REST_REQUEST' ) && REST_REQUEST )
			&& ! ( defined( 'DOING_AJAX' ) && DOING_AJAX )
			&& ! ( defined( 'DOING_CRON' ) && DOING_CRON )
			&& ! ( defined( 'WP_CLI' ) && WP_CLI );
	}
}

if ( ! function_exists( 'dtb_tracking_links_request_order_id' ) ) {
	function dtb_tracking_links_request_order_id(): int {
		$order_id = absint( get_query_var( 'order-received' ) );
		if ( $order_id > 0 ) {
			return $order_id;
		}

		$order_id = absint( get_query_var( 'order-pay' ) );
		if ( $order_id > 0 ) {
			return $order_id;
		}

		$request_uri = isset( $_SERVER['REQUEST_URI'] )
			? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) )
			: '';
		$path = (string) wp_parse_url( $request_uri, PHP_URL_PATH );

		if ( preg_match( '#/(?:wp/)?checkout/(?:order-pay|order-received)/(\d+)/?#', $path, $matches ) ) {
			return absint( $matches[1] );
		}

		return 0;
	}
}

if ( ! function_exists( 'dtb_tracking_links_is_order_received_request' ) ) {
	function dtb_tracking_links_is_order_received_request(): bool {
		if ( absint( get_query_var( 'order-received' ) ) > 0 ) {
			return true;
		}

		$request_uri = isset( $_SERVER['REQUEST_URI'] )
			? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) )
			: '';
		$path = (string) wp_parse_url( $request_uri, PHP_URL_PATH );

		return (bool) preg_match( '#/(?:wp/)?checkout/order-received/\d+/?#', $path );
	}
}

if ( ! function_exists( 'dtb_tracking_links_frontend_base_from_referer' ) ) {
	function dtb_tracking_links_frontend_base_from_referer(): string {
		$referer = wp_get_referer();
		if ( ! $referer ) {
			return '';
		}

		$home_parts = wp_parse_url( home_url( '/' ) );
		$ref_parts  = wp_parse_url( $referer );
		if ( ! is_array( $home_parts ) || ! is_array( $ref_parts ) ) {
			return '';
		}

		$home_host = strtolower( (string) ( $home_parts['host'] ?? '' ) );
		$ref_host  = strtolower( (string) ( $ref_parts['host'] ?? '' ) );
		if ( '' === $home_host || '' === $ref_host || $home_host !== $ref_host ) {
			return '';
		}

		$scheme = (string) ( $ref_parts['scheme'] ?? ( $home_parts['scheme'] ?? 'https' ) );
		$host   = (string) ( $ref_parts['host'] ?? $home_host );
		$path   = (string) ( $ref_parts['path'] ?? '' );

		if ( preg_match( '#^(/staging/\d+)(?:/|$)#', $path, $matches ) ) {
			return esc_url_raw( $scheme . '://' . $host . $matches[1] );
		}

		return esc_url_raw( home_url( '/' ) );
	}
}

if ( ! function_exists( 'dtb_tracking_links_frontend_base_for_order' ) ) {
	function dtb_tracking_links_frontend_base_for_order( WC_Order $order ): string {
		$stored = esc_url_raw( (string) $order->get_meta( '_dtb_frontend_tracking_base_url', true ) );
		if ( '' !== $stored ) {
			return rtrim( $stored, '/' );
		}

		$from_referer = dtb_tracking_links_frontend_base_from_referer();
		if ( '' !== $from_referer ) {
			return rtrim( $from_referer, '/' );
		}

		return rtrim( home_url( '/' ), '/' );
	}
}

if ( ! function_exists( 'dtb_order_tracking_url' ) ) {
	function dtb_order_tracking_url( WC_Order $order ): string {
		$base = dtb_tracking_links_frontend_base_for_order( $order );
		$url  = $base . '/order-tracking/' . absint( $order->get_id() );

		return add_query_arg( 'order_key', rawurlencode( (string) $order->get_order_key() ), $url );
	}
}

if ( ! function_exists( 'dtb_tracking_links_capture_frontend_base' ) ) {
	function dtb_tracking_links_capture_frontend_base(): void {
		if ( ! dtb_tracking_links_is_public_request() || ! function_exists( 'wc_get_order' ) ) {
			return;
		}

		$order_id = dtb_tracking_links_request_order_id();
		if ( $order_id <= 0 ) {
			return;
		}

		$order = wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order ) {
			return;
		}

		if ( '' !== (string) $order->get_meta( '_dtb_frontend_tracking_base_url', true ) ) {
			return;
		}

		$frontend_base = dtb_tracking_links_frontend_base_from_referer();
		if ( '' === $frontend_base ) {
			return;
		}

		$order->update_meta_data( '_dtb_frontend_tracking_base_url', rtrim( $frontend_base, '/' ) );
		$order->save();
	}
}

add_action( 'template_redirect', 'dtb_tracking_links_capture_frontend_base', 4 );

add_filter(
	'woocommerce_get_checkout_order_received_url',
	static function ( $url, $order ) {
		if ( $order instanceof WC_Order ) {
			return dtb_order_tracking_url( $order );
		}

		return $url;
	},
	20,
	2
);

add_action(
	'template_redirect',
	static function (): void {
		if ( ! dtb_tracking_links_is_public_request() || ! dtb_tracking_links_is_order_received_request() || ! function_exists( 'wc_get_order' ) ) {
			return;
		}

		$order_id = dtb_tracking_links_request_order_id();
		if ( $order_id <= 0 ) {
			return;
		}

		$order = wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order ) {
			return;
		}

		$key = isset( $_GET['key'] ) ? sanitize_text_field( wp_unslash( $_GET['key'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( '' !== $key && ! hash_equals( (string) $order->get_order_key(), $key ) ) {
			return;
		}

		wp_safe_redirect( dtb_order_tracking_url( $order ), 303 );
		exit;
	},
	20
);

add_action(
	'woocommerce_email_after_order_table',
	static function ( $order, $sent_to_admin, $plain_text, $email ): void {
		if ( $sent_to_admin || ! $order instanceof WC_Order ) {
			return;
		}

		$url = dtb_order_tracking_url( $order );
		if ( '' === $url ) {
			return;
		}

		if ( $plain_text ) {
			echo "\nTrack Order: " . esc_url_raw( $url ) . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			return;
		}

		echo '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:26px 0 22px;border-collapse:separate;">';
		echo '<tr><td align="center" style="padding:0;">';
		echo '<a href="' . esc_url( $url ) . '" style="display:block;width:100%;box-sizing:border-box;padding:16px 22px;border-radius:16px;background:#2563eb;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;font-size:16px;font-weight:800;line-height:22px;text-align:center;text-decoration:none;box-shadow:0 14px 28px rgba(37,99,235,0.24);">Track Order</a>';
		echo '</td></tr></table>';
	},
	20,
	4
);
