<?php

namespace PaymentPlugins\Stripe\WooCommerceSubscriptions;

use PaymentPlugins\Stripe\ContextHandler;

/**
 * @package PaymentPlugins\WooCommerceSubscriptions\Stripe
 */
class FrontendRequests {

	/**
	 * @var ContextHandler
	 */
	private $context_handler;

	public function __construct( ContextHandler $context_handler ) {
		$this->context_handler = $context_handler;
	}

	public function is_change_payment_method() {
		return \WC_Subscriptions_Change_Payment_Gateway::$is_request_to_change_payment;
	}

	public function is_checkout_with_free_trial() {
		if ( WC()->cart ) {
			return ( $this->context_handler->is_checkout() || $this->context_handler->is_cart() )
			       && \WC_Subscriptions_Cart::cart_contains_free_trial()
			       && WC()->cart->total == 0;
		}

		return false;
	}

	public function is_checkout_with_free_coupon() {
		if ( WC()->cart ) {
			return $this->context_handler->is_checkout() && WC()->cart->get_total( 'edit' ) == 0
			       && \WC_Subscriptions_Cart::cart_contains_subscription();
		}

		return false;
	}

	public function is_checkout_with_subscription() {
		return ( $this->context_handler->is_checkout() || $this->context_handler->is_cart() )
		       && $this->cart_contains_subscription();
	}

	/**
	 * Same underlying check as is_checkout_with_subscription(), without the page-context gate.
	 * Needed because get_element_options() (and therefore the mode decision) also gets computed
	 * for gateway components that can render on any page regardless of context - e.g. the Mini
	 * Cart block's express payment buttons - where is_checkout()/is_cart() are correctly false
	 * even though the same WC()->cart, containing a subscription, is what's about to be paid.
	 *
	 * @return bool
	 * @since 4.0.7
	 */
	public function cart_contains_subscription() {
		return WC()->cart && ( \WC_Subscriptions_Cart::cart_contains_subscription() || \wcs_cart_contains_renewal() );
	}

	public function is_order_pay_with_subscription() {
		if ( ! $this->context_handler->is_order_pay() ) {
			return false;
		}
		$order = $this->context_handler->get_order_from_query();

		return $order && ( \wcs_order_contains_subscription( $order ) || \wcs_order_contains_renewal( $order ) );
	}

	public function is_order_pay_with_free_trial() {
		if ( $this->context_handler->is_order_pay() ) {
			$order = $this->context_handler->get_order_from_query();

			return $order && wcs_order_contains_subscription( $order ) && $order->get_total() == 0;
		}

		return false;
	}

}