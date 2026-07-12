<?php
defined( 'ABSPATH' ) || exit;

/**
 * Server-authoritative checkout validation and WooCommerce cart projection.
 *
 * Browser cart values are display data only. Every value used for a quote or
 * order is read from the current WooCommerce cart/session in this boundary.
 */
final class DTB_CheckoutValidator {

	// =========================================================================
	// CART / SESSION BOOTSTRAP
	// =========================================================================

	/**
	 * Ensure WooCommerce cart, customer, and session are loaded and non-empty.
	 *
	 * ROOT CAUSE OF EMPTY CART ON REST REQUESTS:
	 * WooCommerce calls WC()->initialize_session() on the 'init' hook, before
	 * WordPress REST authentication has resolved the current user from the DTB
	 * JWT.  At that moment get_current_user_id() returns 0, so WC_Session_Handler
	 * loads a guest session.  By the time our checkout endpoint handler runs,
	 * the session is already initialised — wc_load_cart() is a no-op and the
	 * cart appears empty even though the user's WC session has items.
	 *
	 * THE FIX: call prime_wc_session() before wc_load_cart().  It resolves the
	 * correct WC customer_id (WP user ID, or user_id from the Cart-Token JWT),
	 * loads that session row from the DB, and reloads the cart if WC->cart
	 * already exists with the wrong (guest) session data.
	 *
	 * @return true|WP_Error
	 */
	public static function ensure_cart(): true|WP_Error {
		if ( ! function_exists( 'WC' ) || ! function_exists( 'wc_get_product' ) ) {
			return new WP_Error( 'dtb_checkout_wc_unavailable', 'WooCommerce is not available.', [ 'status' => 503 ] );
		}

		// Ensure WC cart/session objects exist.
		if ( function_exists( 'wc_load_cart' ) && ( ! WC()->cart || ! WC()->customer || ! WC()->session ) ) {
			wc_load_cart();
		}

		if ( ! WC()->cart || ! WC()->customer || ! WC()->session ) {
			return new WP_Error( 'dtb_checkout_cart_unavailable', 'The checkout cart session is unavailable.', [ 'status' => 503 ] );
		}

		// If WC()->cart already has items (correct session was loaded via WP
		// auth cookie + WC session cookie), we're done.
		if ( ! WC()->cart->is_empty() ) {
			return true;
		}

		// WC loaded an empty session.  This happens when:
		//  a) The cart was built as a guest (Cart-Token user_id = "t_<hash>") and
		//     login did not migrate the cart to the authenticated user's session.
		//  b) The WC session cookie was absent and WC loaded a brand-new session.
		//
		// Recovery: query the session rows for all plausible session keys and
		// inject the first one that contains cart items directly into WC.
		self::recover_cart_from_db();

		if ( WC()->cart->is_empty() ) {
			return new WP_Error( 'dtb_checkout_empty_cart', 'Your cart is empty.', [ 'status' => 422 ] );
		}

		return true;
	}

	/**
	 * Recover cart contents by loading the correct WC session row from the DB.
	 *
	 * WHEN THIS RUNS AND WHY:
	 *   WooCommerce initialises WC()->session on the 'init' hook (priority 10).
	 *   For REST requests the WC session cookie is often absent (the browser
	 *   sends the DTB auth cookie and the WC Store API Cart-Token header, but
	 *   not the separate WC session cookie).  WC therefore starts a brand-new
	 *   empty session.
	 *
	 *   Additionally, when a storefront user adds items via WC Store API as a
	 *   guest and then logs in via DTB auth (not WC's own login form), WC never
	 *   migrates the guest cart to the logged-in user's session.  The cart still
	 *   lives under the guest session key encoded in the Cart-Token.
	 *
	 * STRATEGY:
	 *   Build a prioritised list of session keys to try (guest Cart-Token key,
	 *   then logged-in user numeric key), query woocommerce_sessions directly
	 *   (with expiry check), inject the session data into the live WC session,
	 *   and call get_cart_from_session() to rebuild cart_contents.
	 *
	 * SERIALIZATION NOTE:
	 *   WC_Session_Handler::save_data() writes:
	 *     serialize( $this->_data )
	 *   where _data values are already plain PHP values (no pre-serialization).
	 *   The stored blob is therefore single-level.  We call maybe_unserialize()
	 *   on the outer blob AND on each individual value to handle both current
	 *   and legacy double-serialized rows transparently.
	 */
	private static function recover_cart_from_db(): void {
		global $wpdb;
		if ( ! $wpdb instanceof wpdb ) {
			return;
		}

		$candidates = self::session_key_candidates();
		if ( empty( $candidates ) ) {
			error_log( '[DTB Checkout] recover_cart_from_db: no session key candidates — Cart-Token missing and user not logged in.' );
			return;
		}

		$table = $wpdb->prefix . 'woocommerce_sessions';
		$now   = time();

		foreach ( $candidates as $session_key ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$row = $wpdb->get_row(
				$wpdb->prepare(
					"SELECT session_value, session_expiry FROM `{$table}` WHERE session_key = %s LIMIT 1", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
					$session_key
				),
				ARRAY_A
			);

			if ( empty( $row['session_value'] ) ) {
				error_log( sprintf( '[DTB Checkout] recover_cart_from_db: no session row for key "%s".', $session_key ) );
				continue;
			}

			// Check expiry — expired sessions cannot be trusted.
			$expiry = (int) ( $row['session_expiry'] ?? 0 );
			if ( $expiry > 0 && $expiry < $now ) {
				error_log( sprintf( '[DTB Checkout] recover_cart_from_db: session "%s" expired at %d (now %d).', $session_key, $expiry, $now ) );
				continue;
			}

			// Outer unserialize: session_value = serialize($data_array).
			$data = maybe_unserialize( $row['session_value'] );
			if ( ! is_array( $data ) ) {
				error_log( sprintf( '[DTB Checkout] recover_cart_from_db: session "%s" outer unserialize failed.', $session_key ) );
				continue;
			}

			// Verify a cart key exists and contains items after full deserialization.
			// WC stores cart as either an already-plain array or a serialized string
			// (legacy double-serialization).  maybe_unserialize handles both.
			$cart_value = maybe_unserialize( $data['cart'] ?? '' );
			if ( empty( $cart_value ) || ! is_array( $cart_value ) ) {
				error_log( sprintf( '[DTB Checkout] recover_cart_from_db: session "%s" has no cart items (cart_value type: %s).', $session_key, gettype( $cart_value ) ) );
				continue;
			}

			error_log( sprintf( '[DTB Checkout] recover_cart_from_db: found %d cart item(s) in session "%s".', count( $cart_value ), $session_key ) );

			// Inject session values into the live WC session store.
			// Apply maybe_unserialize to each value to normalise single and
			// double-serialized rows.
			foreach ( $data as $key => $value ) {
				WC()->session->set( $key, maybe_unserialize( $value ) );
			}

			// Reset cart_contents so get_cart_from_session() rebuilds from the
			// injected data.  We call it directly to bypass the did_action gate
			// that WC_Cart::get_cart() enforces after wc_load_cart() has fired.
			WC()->cart->cart_contents = [];
			WC()->cart->get_cart_from_session();

			if ( ! WC()->cart->is_empty() ) {
				error_log( sprintf( '[DTB Checkout] recover_cart_from_db: cart successfully loaded from session "%s" — %d item(s).', $session_key, count( WC()->cart->get_cart() ) ) );
				return; // Success.
			}

			error_log( sprintf( '[DTB Checkout] recover_cart_from_db: get_cart_from_session() returned empty cart after injecting session "%s".', $session_key ) );
		}

		error_log( '[DTB Checkout] recover_cart_from_db: all candidates exhausted — cart remains empty.' );
	}

	/**
	 * Build a prioritised list of woocommerce_sessions.session_key values to try.
	 *
	 * Priority order:
	 *   1. user_id from Cart-Token JWT (the session key where Store API stored the
	 *      cart — may be "t_<hash>" for guests or a numeric user ID string).
	 *   2. WP user ID (numeric string) — for carts built while logged in without
	 *      a Cart-Token, or after WC migrated the guest cart on login.
	 *
	 * Deduplication and skipping of the already-active session are applied to
	 * avoid redundant DB queries (WC()->cart already showed this session is empty).
	 *
	 * @return string[]
	 */
	private static function session_key_candidates(): array {
		$candidates = [];
		$active_key = function_exists( 'WC' ) && WC()->session ? (string) WC()->session->get_customer_id() : '';

		// Priority 1: Cart-Token session key.
		$token_key = self::decode_cart_token_session_key();
		if ( '' !== $token_key && $token_key !== $active_key ) {
			$candidates[] = $token_key;
		}

		// Priority 2: Logged-in WP user ID.
		$wp_user_id = get_current_user_id();
		if ( $wp_user_id > 0 ) {
			$user_key = (string) $wp_user_id;
			if ( $user_key !== $active_key && ! in_array( $user_key, $candidates, true ) ) {
				$candidates[] = $user_key;
			}
		}

		return $candidates;
	}

	/**
	 * Decode the WC session key from a WooCommerce Store API Cart-Token JWT.
	 *
	 * The Cart-Token is an HS256 JWT.  Its `user_id` payload claim is the
	 * woocommerce_sessions.session_key for the cart:
	 *   - Logged-in users: numeric WP user ID as a string (e.g. "2").
	 *   - Guest sessions:  "t_<hash>" string.
	 *
	 * We decode only the payload (no signature verification — we are using
	 * this solely to locate the correct session row, not to grant capability).
	 *
	 * @return string Raw session_key string, or '' if missing/malformed.
	 */
	private static function decode_cart_token_session_key(): string {
		$cart_token = isset( $_SERVER['HTTP_CART_TOKEN'] )
			? sanitize_text_field( wp_unslash( (string) $_SERVER['HTTP_CART_TOKEN'] ) )
			: '';
		if ( '' === $cart_token || strlen( $cart_token ) > 600 ) {
			return '';
		}
		$parts = explode( '.', $cart_token );
		if ( 3 !== count( $parts ) ) {
			return '';
		}
		$b64    = $parts[1];
		$padded = $b64 . str_repeat( '=', ( 4 - ( strlen( $b64 ) % 4 ) ) % 4 );
		$json   = base64_decode( strtr( $padded, '-_', '+/' ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		if ( false === $json || '' === $json ) {
			return '';
		}
		$data = json_decode( $json, true );
		if ( ! is_array( $data ) || ! isset( $data['user_id'] ) || '' === (string) $data['user_id'] ) {
			return '';
		}
		// Return the raw session key — do NOT cast to int; guest keys are "t_<hash>".
		return sanitize_text_field( (string) $data['user_id'] );
	}

	// =========================================================================
	// ADDRESS NORMALISATION AND VALIDATION
	// =========================================================================

	public static function normalize_address( $address, bool $include_contact = false ): array {
		$address = is_array( $address ) ? $address : [];
		$country = strtoupper( sanitize_text_field( (string) ( $address['country'] ?? 'US' ) ) );
		if ( 2 !== strlen( $country ) && function_exists( 'WC' ) && WC()->countries ) {
			foreach ( (array) WC()->countries->get_countries() as $code => $name ) {
				if ( 0 === strcasecmp( (string) $name, $country ) ) {
					$country = strtoupper( (string) $code );
					break;
				}
			}
		}

		$normalized = [
			'first_name' => sanitize_text_field( (string) ( $address['first_name'] ?? $address['firstName'] ?? '' ) ),
			'last_name'  => sanitize_text_field( (string) ( $address['last_name'] ?? $address['lastName'] ?? '' ) ),
			'company'    => sanitize_text_field( (string) ( $address['company'] ?? '' ) ),
			'address_1'  => sanitize_text_field( (string) ( $address['address_1'] ?? $address['address'] ?? '' ) ),
			'address_2'  => sanitize_text_field( (string) ( $address['address_2'] ?? '' ) ),
			'city'       => sanitize_text_field( (string) ( $address['city'] ?? '' ) ),
			'state'      => strtoupper( sanitize_text_field( (string) ( $address['state'] ?? '' ) ) ),
			'postcode'   => sanitize_text_field( (string) ( $address['postcode'] ?? $address['zip'] ?? '' ) ),
			'country'    => $country ?: 'US',
		];

		if ( $include_contact ) {
			$normalized['email'] = sanitize_email( (string) ( $address['email'] ?? '' ) );
			$normalized['phone'] = sanitize_text_field( (string) ( $address['phone'] ?? '' ) );
		}

		return $normalized;
	}

	public static function validate_addresses( array $billing, array $shipping ): true|WP_Error {
		$required_billing = [ 'first_name', 'last_name', 'address_1', 'city', 'state', 'postcode', 'country', 'email' ];
		foreach ( $required_billing as $field ) {
			if ( '' === trim( (string) ( $billing[ $field ] ?? '' ) ) ) {
				return new WP_Error( 'dtb_checkout_invalid_address', sprintf( 'Billing field "%s" is required.', $field ), [ 'status' => 422 ] );
			}
		}

		if ( ! is_email( (string) $billing['email'] ) ) {
			return new WP_Error( 'dtb_checkout_invalid_email', 'A valid billing email address is required.', [ 'status' => 422 ] );
		}

		foreach ( [ 'address_1', 'city', 'state', 'postcode', 'country' ] as $field ) {
			if ( '' === trim( (string) ( $shipping[ $field ] ?? '' ) ) ) {
				return new WP_Error( 'dtb_checkout_invalid_address', sprintf( 'Shipping field "%s" is required.', $field ), [ 'status' => 422 ] );
			}
		}

		return true;
	}

	// =========================================================================
	// COUPON NORMALISATION
	// =========================================================================

	public static function normalize_coupon_codes( $codes ): array {
		$normalized = [];
		foreach ( is_array( $codes ) ? $codes : [] as $code ) {
			$code = strtolower( sanitize_text_field( (string) $code ) );
			if ( '' !== $code && strlen( $code ) <= 100 ) {
				$normalized[] = $code;
			}
		}
		return array_values( array_unique( $normalized ) );
	}

	// =========================================================================
	// CUSTOMER IDENTITY
	// =========================================================================

	public static function customer_identity(): array {
		$customer_id = get_current_user_id();

		// Use the Cart-Token session key as the stable session identifier.
		//
		// WHY: WC()->session->get_customer_id() varies by request depending on
		// which session WC loaded (guest session vs user session vs the session
		// cookie that happened to be sent).  The Cart-Token is a signed WC JWT
		// that is sent on every checkout request and always encodes the same
		// session key for this cart's lifecycle.  Using it as the basis for
		// woo_session_identifier ensures the hash is deterministic across all
		// steps of the same checkout flow (quote → session → confirm → finalize).
		$session_id = self::decode_cart_token_session_key();

		// Fallback chain when no Cart-Token is present (e.g. server-side calls).
		if ( '' === $session_id ) {
			$session_id = function_exists( 'WC' ) && WC()->session ? (string) WC()->session->get_customer_id() : '';
		}
		if ( '' === $session_id ) {
			$session_id = function_exists( 'WC' ) && WC()->session ? (string) WC()->session->get( 'dtb_checkout_identity_nonce' ) : '';
			if ( '' === $session_id && function_exists( 'WC' ) && WC()->session ) {
				$session_id = 'guest-' . wp_generate_uuid4();
				WC()->session->set( 'dtb_checkout_identity_nonce', $session_id );
			}
		}
		if ( '' === $session_id ) {
			$session_id = 'user-' . ( $customer_id > 0 ? $customer_id : 'unbound' );
		}

		return [
			'customer_id'           => (int) $customer_id,
			'customer_session_hash' => hash( 'sha256', $session_id ),
		];
	}

	// =========================================================================
	// CUSTOMER CONTEXT — SET DESTINATION ON WC CUSTOMER, FLUSH PACKAGE CACHE
	// =========================================================================

	/**
	 * Apply billing/shipping address and coupons to the WC customer object.
	 *
	 * IMPORTANT: This method saves the customer destination and flushes the
	 * shipping package cache.  It must be called before shipping_rates() so
	 * that WC calculates rates against the correct destination.  It must NOT
	 * call calculate_totals() because that triggers shipping recalculation
	 * internally — shipping_rates() will request a fresh calculation after
	 * the destination is committed.
	 *
	 * @return true|WP_Error
	 */
	public static function apply_customer_context( array $billing, array $shipping, array $coupon_codes ): true|WP_Error {
		$validated = self::validate_addresses( $billing, $shipping );
		if ( is_wp_error( $validated ) ) {
			return $validated;
		}

		$customer       = WC()->customer;

		// Write billing fields.
		$billing_fields = [ 'first_name', 'last_name', 'company', 'address_1', 'address_2', 'city', 'state', 'postcode', 'country', 'email', 'phone' ];
		foreach ( $billing_fields as $field ) {
			$method = 'set_billing_' . $field;
			if ( method_exists( $customer, $method ) ) {
				$customer->{$method}( $billing[ $field ] ?? '' );
			}
		}

		// Write shipping fields.
		foreach ( [ 'first_name', 'last_name', 'company', 'address_1', 'address_2', 'city', 'state', 'postcode', 'country' ] as $field ) {
			$method = 'set_shipping_' . $field;
			if ( method_exists( $customer, $method ) ) {
				$customer->{$method}( $shipping[ $field ] ?? '' );
			}
		}
		if ( method_exists( $customer, 'set_calculated_shipping' ) ) {
			$customer->set_calculated_shipping( true );
		}

		// Persist destination so WC includes it in shipping package hash keys.
		if ( method_exists( $customer, 'save' ) ) {
			$customer->save();
		}

		// Flush the package cache AFTER saving the customer so the new destination
		// is used when WC recomputes the cache key.
		$packages = (array) WC()->cart->get_shipping_packages();
		if ( function_exists( 'dtb_commerce_invalidate_shipping_package_cache' ) ) {
			dtb_commerce_invalidate_shipping_package_cache( $packages );
		}

		// Apply / validate coupons.
		$requested = self::normalize_coupon_codes( $coupon_codes );
		$current   = self::normalize_coupon_codes( WC()->cart->get_applied_coupons() );
		foreach ( array_values( array_unique( array_merge( $current, $requested ) ) ) as $code ) {
			if ( WC()->cart->has_discount( $code ) ) {
				continue;
			}
			$applied = WC()->cart->apply_coupon( $code );
			if ( false === $applied && ! WC()->cart->has_discount( $code ) ) {
				return new WP_Error( 'dtb_checkout_invalid_coupon', sprintf( 'Coupon "%s" could not be applied.', $code ), [ 'status' => 422 ] );
			}
		}

		return true;
	}

	// =========================================================================
	// CART SNAPSHOT
	// =========================================================================

	public static function cart_snapshot(): array|WP_Error {
		$items = [];
		foreach ( (array) WC()->cart->get_cart() as $cart_item ) {
			$product  = $cart_item['data'] ?? null;
			$quantity = absint( $cart_item['quantity'] ?? 0 );
			if ( ! $product instanceof WC_Product || $quantity < 1 ) {
				continue;
			}
			if ( ! $product->is_purchasable() || ( $product->managing_stock() && ! $product->has_enough_stock( $quantity ) ) ) {
				return new WP_Error( 'dtb_checkout_stock_changed', sprintf( 'The product "%s" is no longer available in the requested quantity.', $product->get_name() ), [ 'status' => 409 ] );
			}

			$items[] = [
				'product_id'    => absint( $cart_item['product_id'] ?? ( $product->get_parent_id() ?: $product->get_id() ) ),
				'variation_id'  => absint( $cart_item['variation_id'] ?? ( $product->is_type( 'variation' ) ? $product->get_id() : 0 ) ),
				'quantity'      => $quantity,
				'sku'           => sanitize_text_field( (string) $product->get_sku() ),
				'name'          => sanitize_text_field( (string) $product->get_name() ),
				'line_subtotal' => wc_format_decimal( (string) ( $cart_item['line_subtotal'] ?? 0 ), 2 ),
				'line_total'    => wc_format_decimal( (string) ( $cart_item['line_total'] ?? 0 ), 2 ),
				'product'       => $product,
			];
		}

		if ( empty( $items ) ) {
			return new WP_Error( 'dtb_checkout_empty_cart', 'Your cart is empty.', [ 'status' => 422 ] );
		}

		$cart_hash = method_exists( WC()->cart, 'get_cart_hash' ) ? (string) WC()->cart->get_cart_hash() : '';
		if ( '' === $cart_hash ) {
			$cart_hash = hash( 'sha256', wp_json_encode( array_map( static function ( array $item ): array {
				return array_intersect_key( $item, array_flip( [ 'product_id', 'variation_id', 'quantity', 'line_total' ] ) );
			}, $items ) ) ?: '' );
		}

		return [
			'cart_hash' => $cart_hash,
			'items'     => $items,
			'coupons'   => self::normalize_coupon_codes( WC()->cart->get_applied_coupons() ),
			'totals'    => [
				'subtotal' => (float) WC()->cart->get_subtotal(),
				'discount' => (float) WC()->cart->get_discount_total(),
				'shipping' => (float) WC()->cart->get_shipping_total(),
				'tax'      => (float) WC()->cart->get_total_tax(),
				'total'    => (float) WC()->cart->get_total( 'edit' ),
				'currency' => function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'USD',
			],
		];
	}

	// =========================================================================
	// SHIPPING RATES
	// =========================================================================

	/**
	 * Retrieve available shipping rates for the current WC cart and customer.
	 *
	 * Prerequisites (must be satisfied before calling):
	 *   - ensure_cart() returned true
	 *   - apply_customer_context() returned true (destination set + cache flushed)
	 *
	 * This method triggers a single authoritative WC shipping recalculation and
	 * reads rates from WC_Shipping's calculated packages. WC_Cart's shipping
	 * packages are calculation inputs and do not contain the resulting rates.
	 * It does NOT fall back to inline
	 * policy logic — if WC returns no rates the zone/method configuration must
	 * be fixed rather than silently bypassed.
	 *
	 * @return array<int,array{id:string,method_id:string,instance_id:int,name:string,price:float,tax:float,total:float,currency:string}>
	 */
	public static function shipping_rates(): array {
		// Recalculate shipping using the destination already committed by
		// apply_customer_context().  The package cache was flushed there so
		// WC will compute fresh rates for the new destination.
		WC()->cart->calculate_shipping();

		$rates    = [];
		$currency = function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'USD';

		$calculated_packages = WC()->shipping()
			? (array) WC()->shipping()->get_packages()
			: [];

		foreach ( $calculated_packages as $package ) {
			foreach ( (array) ( $package['rates'] ?? [] ) as $rate ) {
				if ( ! ( $rate instanceof WC_Shipping_Rate ) ) {
					continue;
				}
				$cost    = (float) $rate->get_cost();
				$taxes   = array_sum( array_map( 'floatval', (array) $rate->get_taxes() ) );
				$rates[] = [
					'id'          => (string) $rate->get_id(),
					'method_id'   => sanitize_key( (string) $rate->get_method_id() ),
					'instance_id' => absint( $rate->get_instance_id() ),
					'name'        => sanitize_text_field( (string) $rate->get_label() ),
					'price'       => $cost,
					'tax'         => (float) $taxes,
					'total'       => $cost + (float) $taxes,
					'currency'    => $currency,
				];
			}
		}

		return $rates;
	}

	/**
	 * Return shipping rates for the given address against the current cart.
	 *
	 * Convenience wrapper used by the shipping-rates REST route.
	 *
	 * @param array $address Shipping address fields.
	 * @return array|WP_Error
	 */
	public static function shipping_rates_for_current_cart( array $address ): array|WP_Error {
		$ready = self::ensure_cart();
		if ( is_wp_error( $ready ) ) {
			return $ready;
		}
		$shipping = self::normalize_address( $address );
		foreach ( [ 'address_1', 'city', 'state', 'postcode', 'country' ] as $field ) {
			if ( '' === trim( (string) ( $shipping[ $field ] ?? '' ) ) ) {
				return new WP_Error( 'dtb_checkout_invalid_address', 'A complete shipping address is required.', [ 'status' => 422 ] );
			}
		}
		$customer = WC()->customer;
		foreach ( [ 'first_name', 'last_name', 'company', 'address_1', 'address_2', 'city', 'state', 'postcode', 'country' ] as $field ) {
			$method = 'set_shipping_' . $field;
			if ( method_exists( $customer, $method ) ) {
				$customer->{$method}( $shipping[ $field ] ?? '' );
			}
		}
		if ( method_exists( $customer, 'set_calculated_shipping' ) ) {
			$customer->set_calculated_shipping( true );
		}
		if ( method_exists( $customer, 'save' ) ) {
			$customer->save();
		}
		$packages = (array) WC()->cart->get_shipping_packages();
		if ( function_exists( 'dtb_commerce_invalidate_shipping_package_cache' ) ) {
			dtb_commerce_invalidate_shipping_package_cache( $packages );
		}
		$rates = self::shipping_rates();
		return empty( $rates )
			? new WP_Error( 'dtb_checkout_shipping_unavailable', 'No shipping method is available for this destination.', [ 'status' => 422 ] )
			: $rates;
	}

	// =========================================================================
	// FULL EVALUATION (quote / session / confirm path)
	// =========================================================================

	/**
	 * Fully evaluate a checkout payload: validate, apply context, compute rates.
	 *
	 * @param array $payload Checkout payload (billing, shipping, coupon_codes, shipping_rate_id).
	 * @return array|WP_Error
	 */
	public static function evaluate( array $payload ): array|WP_Error {
		$ready = self::ensure_cart();
		if ( is_wp_error( $ready ) ) {
			return $ready;
		}

		$billing  = self::normalize_address( $payload['billing'] ?? [], true );
		$shipping = self::normalize_address( $payload['shipping'] ?? $billing );
		$coupons  = self::normalize_coupon_codes( $payload['coupon_codes'] ?? [] );

		// Set destination + flush package cache.  Does NOT calculate totals.
		$applied  = self::apply_customer_context( $billing, $shipping, $coupons );
		if ( is_wp_error( $applied ) ) {
			return $applied;
		}

		// Single authoritative shipping recalculation using the committed destination.
		$rates = self::shipping_rates();
		if ( empty( $rates ) ) {
			return new WP_Error( 'dtb_checkout_shipping_unavailable', 'No shipping method is available for this destination.', [ 'status' => 422 ] );
		}

		$requested_rate = sanitize_text_field( (string) ( $payload['shipping_rate_id'] ?? '' ) );
		$selected       = null;
		foreach ( $rates as $rate ) {
			if ( '' !== $requested_rate && hash_equals( (string) $rate['id'], $requested_rate ) ) {
				$selected = $rate;
				break;
			}
		}

		if ( '' !== $requested_rate && null === $selected ) {
			return new WP_Error(
				'dtb_checkout_shipping_rate_changed',
				'The selected shipping method is no longer available. Refresh shipping options and try again.',
				[ 'status' => 409 ]
			);
		}
		if ( null === $selected ) {
			$selected = $rates[0];
		}

		// Commit the chosen shipping method to the session and calculate totals once.
		$chosen    = (array) WC()->session->get( 'chosen_shipping_methods', [] );
		$chosen[0] = $selected['id'];
		WC()->session->set( 'chosen_shipping_methods', $chosen );
		WC()->cart->calculate_totals();

		$snapshot = self::cart_snapshot();
		if ( is_wp_error( $snapshot ) ) {
			return $snapshot;
		}

		return [
			'billing'          => $billing,
			'shipping'         => $shipping,
			'coupon_codes'     => $snapshot['coupons'],
			'shipping_rate_id' => $selected['id'],
			'shipping_rate'    => $selected,
			'cart_hash'        => $snapshot['cart_hash'],
			'items'            => $snapshot['items'],
			'rates'            => $rates,
			'totals'           => $snapshot['totals'],
		];
	}

	// =========================================================================
	// FINGERPRINT + PUBLIC QUOTE SHAPE
	// =========================================================================

	public static function fingerprint( array $context, string $payment_method = '' ): string {
		$items = [];
		foreach ( (array) ( $context['items'] ?? [] ) as $item ) {
			$items[] = array_intersect_key( $item, array_flip( [ 'product_id', 'variation_id', 'quantity', 'line_total' ] ) );
		}

		return hash( 'sha256', wp_json_encode( [
			'cart_hash'        => (string) ( $context['cart_hash'] ?? '' ),
			'payment_method'   => sanitize_key( $payment_method ),
			'billing'          => $context['billing'] ?? [],
			'shipping'         => $context['shipping'] ?? [],
			'coupon_codes'     => $context['coupon_codes'] ?? [],
			'shipping_rate_id' => (string) ( $context['shipping_rate_id'] ?? '' ),
			'items'            => $items,
			'totals'           => $context['totals'] ?? [],
		] ) ?: '' );
	}

	public static function public_quote( array $quote, string $quote_id, string $expires_at ): array {
		return [
			'quote_id'         => $quote_id,
			'cart_hash'        => $quote['cart_hash'],
			'expires_at'       => $expires_at,
			'rates'            => $quote['rates'],
			'selected_rate_id' => $quote['shipping_rate_id'],
			'totals'           => $quote['totals'],
		];
	}
}
