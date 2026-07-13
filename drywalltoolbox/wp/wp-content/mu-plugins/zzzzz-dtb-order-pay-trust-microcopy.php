<?php
/**
 * Compact trust microcopy for WooCommerce order-pay.
 *
 * Presentation-only enhancement for the native order-pay runtime. This file does
 * not alter gateway fields, payment nonces, tokenization, callbacks, order
 * lifecycle hooks, or checkout authority.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Determine whether the current request is a WooCommerce order-pay document.
 */
function dtb_order_pay_trust_microcopy_is_request(): bool {
	$order_pay = function_exists( 'get_query_var' ) ? absint( get_query_var( 'order-pay' ) ) : 0;
	if ( $order_pay > 0 ) {
		return true;
	}

	$uri  = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
	$path = '' !== $uri ? (string) wp_parse_url( $uri, PHP_URL_PATH ) : '';
	if ( false !== strpos( $path, '/checkout/order-pay/' ) ) {
		return true;
	}

	$pay_for_order = isset( $_GET['pay_for_order'] ) ? sanitize_text_field( wp_unslash( $_GET['pay_for_order'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$order_key     = isset( $_GET['key'] ) ? sanitize_text_field( wp_unslash( $_GET['key'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	return 'true' === strtolower( $pay_for_order ) && 0 === strpos( $order_key, 'wc_order_' );
}

/**
 * Add compact trust-strip styling.
 */
function dtb_order_pay_trust_microcopy_head(): void {
	if ( ! dtb_order_pay_trust_microcopy_is_request() ) {
		return;
	}
	?>
	<style id="dtb-order-pay-trust-microcopy-css">
		.dtb-native-order-pay-trust {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 8px;
			max-width: 760px;
			margin: 14px 0 0;
			color: #475569;
			font-size: 12.5px;
			font-weight: 800;
			line-height: 1.35;
		}

		.dtb-native-order-pay-trust__item,
		.dtb-native-order-pay-trust__link {
			display: inline-flex;
			align-items: center;
			min-height: 30px;
			padding: 7px 10px;
			border: 1px solid rgba(219, 228, 240, 0.92);
			border-radius: 999px;
			background: rgba(255, 255, 255, 0.72);
			box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
			white-space: nowrap;
		}

		.dtb-native-order-pay-trust__item::before,
		.dtb-native-order-pay-trust__link::before {
			content: '';
			display: inline-block;
			width: 7px;
			height: 7px;
			margin-right: 7px;
			border-radius: 999px;
			background: #2563eb;
			box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
		}

		.dtb-native-order-pay-trust__link {
			color: #1d4ed8 !important;
			text-decoration: none;
		}

		.dtb-native-order-pay-trust__link:hover,
		.dtb-native-order-pay-trust__link:focus {
			text-decoration: underline;
			text-underline-offset: 3px;
		}

		@media (max-width: 720px) {
			.dtb-native-order-pay-trust {
				gap: 7px;
				margin-top: 12px;
				font-size: 12px;
			}

			.dtb-native-order-pay-trust__item,
			.dtb-native-order-pay-trust__link {
				min-height: 28px;
				padding: 6px 9px;
			}
		}
	</style>
	<?php
}
add_action( 'wp_head', 'dtb_order_pay_trust_microcopy_head', 100 );

/**
 * Insert the trust strip after the order-pay intro copy.
 */
function dtb_order_pay_trust_microcopy_footer(): void {
	if ( ! dtb_order_pay_trust_microcopy_is_request() ) {
		return;
	}

	$payload = [
		'items'      => [
			__( 'Secure WooCommerce payment', 'drywall-toolbox' ),
			__( 'Order reserved during payment', 'drywall-toolbox' ),
		],
		'supportUrl' => home_url( '/support' ),
		'support'    => __( 'Need help? Contact support', 'drywall-toolbox' ),
	];
	?>
	<script id="dtb-order-pay-trust-microcopy-js">
	(function(config){
		function insertTrustStrip(){
			var copy = document.querySelector('.dtb-native-order-pay-copy');
			if(!copy || document.querySelector('.dtb-native-order-pay-trust')){return;}

			var strip = document.createElement('div');
			strip.className = 'dtb-native-order-pay-trust';
			strip.setAttribute('aria-label', 'Payment trust and support information');

			(config.items || []).forEach(function(text){
				if(!text){return;}
				var item = document.createElement('span');
				item.className = 'dtb-native-order-pay-trust__item';
				item.textContent = text;
				strip.appendChild(item);
			});

			if(config.supportUrl && config.support){
				var link = document.createElement('a');
				link.className = 'dtb-native-order-pay-trust__link';
				link.href = config.supportUrl;
				link.textContent = config.support;
				strip.appendChild(link);
			}

			copy.insertAdjacentElement('afterend', strip);
		}

		if(document.readyState === 'loading'){
			document.addEventListener('DOMContentLoaded', insertTrustStrip, {once:true});
		} else {
			insertTrustStrip();
		}
	})(<?php echo wp_json_encode( $payload ); ?>);
	</script>
	<?php
}
add_action( 'wp_footer', 'dtb_order_pay_trust_microcopy_footer', 100 );
