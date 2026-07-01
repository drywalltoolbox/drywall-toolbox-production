<?php
/**
 * WooCommerce admin email branded shell integration.
 *
 * @package DrywalltoolboxCommerce
 */

namespace DTB\Commerce\Email;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function dtb_commerce_init_wc_admin_branded_emails(): void {
	if ( ! function_exists( 'WC' ) || ! function_exists( 'dtb_render_branded_email' ) ) {
		return;
	}

	add_action( 'woocommerce_email_header', 'DTB\\Commerce\\Email\\dtb_commerce_wc_admin_email_header_capture', 0 );
	add_action( 'woocommerce_email_footer', 'DTB\\Commerce\\Email\\dtb_commerce_wc_admin_email_footer_wrap', 1000 );
}
add_action( 'init', 'DTB\\Commerce\\Email\\dtb_commerce_init_wc_admin_branded_emails' );

function dtb_commerce_should_brand_admin_email(): bool {
	global $email;

	if ( ! is_object( $email ) || ! isset( $email->id ) ) {
		return false;
	}

	return in_array( (string) $email->id, [ 'new_order', 'cancelled_order', 'failed_order' ], true );
}

function dtb_commerce_wc_admin_email_header_capture( $email_heading ): void {
	if ( ! dtb_commerce_should_brand_admin_email() ) {
		return;
	}

	global $dtb_wc_admin_email_capture, $email;

	$dtb_wc_admin_email_capture = [
		'heading'  => sanitize_text_field( (string) $email_heading ),
		'email_id' => is_object( $email ) && isset( $email->id ) ? sanitize_key( (string) $email->id ) : '',
	];

	ob_start();
}

function dtb_commerce_wc_admin_email_footer_wrap(): void {
	global $dtb_wc_admin_email_capture, $email;

	if ( empty( $dtb_wc_admin_email_capture ) ) {
		return;
	}

	$content = ob_get_clean();
	if ( '' === trim( (string) $content ) ) {
		unset( $dtb_wc_admin_email_capture );
		return;
	}

	$order        = is_object( $email ) && isset( $email->object ) && is_a( $email->object, 'WC_Order' ) ? $email->object : null;
	$order_id     = $order instanceof \WC_Order ? (int) $order->get_id() : 0;
	$order_number = $order instanceof \WC_Order ? (string) $order->get_order_number() : '';
	$admin_url    = $order_id > 0 ? admin_url( 'post.php?post=' . $order_id . '&action=edit' ) : '';
	$heading      = (string) ( $dtb_wc_admin_email_capture['heading'] ?? 'Order notification' );

	echo dtb_render_branded_email(
		[
			'title'       => $heading,
			'preheader'   => $order_number ? 'Order #' . $order_number . ' requires review.' : $heading,
			'eyebrow'     => 'Order operations',
			'greeting'    => '',
			'intro'       => 'A WooCommerce order notification was generated for the operations team.',
			'body_html'   => $content,
			'details'     => $order_number ? [ [ 'label' => 'Order number', 'value' => '#' . $order_number ] ] : [],
			'cta_url'     => $admin_url,
			'cta_label'   => $admin_url ? 'Open order in WP-Admin' : '',
			'signoff'     => 'Drywall Toolbox Operations',
			'footer_note' => 'This message was sent by the Drywall Toolbox operations platform.',
			'theme'       => 'dark',
		]
	); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	unset( $dtb_wc_admin_email_capture );
}
