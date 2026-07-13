<?php
/**
 * WooCommerce payments admin compatibility fallback.
 *
 * Admin-only safety layer for the WooCommerce Settings > Payments screen. The
 * official WooCommerce provider app remains authoritative; this file only keeps
 * core admin scripts/cache behavior safe, prevents known third-party settings
 * bundles from crashing the provider overview, and renders direct gateway
 * settings links when the provider panel loads without gateway controls.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Determine whether the current request is the WooCommerce payment settings tab.
 */
function dtb_wc_admin_payments_compat_is_screen(): bool {
	if ( ! is_admin() || wp_doing_ajax() ) {
		return false;
	}

	$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$tab  = isset( $_GET['tab'] ) ? sanitize_key( wp_unslash( $_GET['tab'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	return 'wc-settings' === $page && 'checkout' === $tab;
}

/**
 * Determine whether the current payment settings request is the provider overview.
 */
function dtb_wc_admin_payments_compat_is_overview(): bool {
	if ( ! dtb_wc_admin_payments_compat_is_screen() ) {
		return false;
	}

	$section = isset( $_GET['section'] ) ? sanitize_key( wp_unslash( $_GET['section'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	return '' === $section;
}

/**
 * Determine whether the current admin user may manage payment settings.
 */
function dtb_wc_admin_payments_compat_user_can_manage(): bool {
	return current_user_can( 'manage_woocommerce' ) || current_user_can( 'manage_options' );
}

/**
 * Determine whether a REST request is an authenticated same-origin payment-admin request.
 */
function dtb_wc_admin_payments_compat_is_payment_admin_rest_request(): bool {
	$request_uri = isset( $_SERVER['REQUEST_URI'] )
		? sanitize_text_field( (string) wp_unslash( $_SERVER['REQUEST_URI'] ) ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: '';

	if ( '' === $request_uri || false === strpos( $request_uri, '/wp-json/' ) ) {
		return false;
	}

	$route_allowed = preg_match( '#/wp-json/(?:wc-admin|wc/v3/wc_paypal)(?:/|\?|$)#i', $request_uri );
	if ( ! $route_allowed ) {
		return false;
	}

	$referrer = wp_get_raw_referer();
	$ref_path = $referrer ? (string) wp_parse_url( $referrer, PHP_URL_PATH ) : '';
	$ref_query = $referrer ? (string) wp_parse_url( $referrer, PHP_URL_QUERY ) : '';

	return false !== strpos( $ref_path, '/wp-admin/admin.php' )
		&& false !== strpos( $ref_query, 'page=wc-settings' )
		&& false !== strpos( $ref_query, 'tab=checkout' );
}

/**
 * Bridge rare admin-role capability gaps without exposing gateway settings publicly.
 *
 * Some hardened wp-admin role/capability setups allow the WordPress administrator
 * to load WooCommerce Settings but deny Woo Admin REST endpoints that check only
 * manage_woocommerce. For same-origin payment-settings REST requests, allow a
 * user with manage_options to satisfy manage_woocommerce. This does not grant
 * access to unauthenticated users, non-admin users, or non-payment-admin routes.
 *
 * @param array<string,bool> $allcaps All primitive capabilities for the user.
 * @param array<int,string>  $caps    Required primitive capabilities.
 * @return array<string,bool>
 */
function dtb_wc_admin_payments_compat_bridge_admin_caps( array $allcaps, array $caps ): array {
	if ( empty( $allcaps['manage_options'] ) || ! dtb_wc_admin_payments_compat_is_payment_admin_rest_request() ) {
		return $allcaps;
	}

	if ( in_array( 'manage_woocommerce', $caps, true ) || in_array( 'manage_options', $caps, true ) ) {
		$allcaps['manage_woocommerce'] = true;
	}

	return $allcaps;
}
add_filter( 'user_has_cap', 'dtb_wc_admin_payments_compat_bridge_admin_caps', 10, 2 );

/**
 * Payment settings are dynamic admin state and should never be cached by host layers.
 */
function dtb_wc_admin_payments_compat_nocache(): void {
	if ( ! dtb_wc_admin_payments_compat_is_screen() || ! dtb_wc_admin_payments_compat_user_can_manage() ) {
		return;
	}

	nocache_headers();
}
add_action( 'admin_init', 'dtb_wc_admin_payments_compat_nocache', 1 );

/**
 * Keep the payment settings app's core WordPress admin dependencies available.
 */
function dtb_wc_admin_payments_compat_enqueue_core_admin_scripts(): void {
	if ( ! dtb_wc_admin_payments_compat_is_screen() || ! dtb_wc_admin_payments_compat_user_can_manage() ) {
		return;
	}

	if ( ! wp_script_is( 'heartbeat', 'registered' ) ) {
		wp_register_script(
			'heartbeat',
			includes_url( 'js/heartbeat.min.js' ),
			[ 'jquery' ],
			get_bloginfo( 'version' ),
			true
		);
	}
	wp_enqueue_script( 'heartbeat' );

	foreach ( [ 'wp-auth-check', 'wp-api-fetch', 'wp-data', 'wp-components', 'wp-element', 'wp-i18n' ] as $handle ) {
		if ( wp_script_is( $handle, 'registered' ) ) {
			wp_enqueue_script( $handle );
		}
	}
}
add_action( 'admin_enqueue_scripts', 'dtb_wc_admin_payments_compat_enqueue_core_admin_scripts', 1 );

/**
 * Dequeue PayPal's React settings bundle from the provider overview only.
 *
 * WooCommerce PayPal Payments may enqueue its section-specific React settings app
 * on the generic Payments overview. In that context the expected root container
 * is absent, causing React createRoot() to throw and interrupt the Woo provider
 * screen. The script remains available on the direct PayPal gateway section.
 */
function dtb_wc_admin_payments_compat_dequeue_overview_conflicts(): void {
	if ( ! dtb_wc_admin_payments_compat_is_overview() || ! dtb_wc_admin_payments_compat_user_can_manage() ) {
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

		$is_paypal_settings = (
			( false !== strpos( $haystack, 'ppcp' ) || false !== strpos( $haystack, 'paypal' ) || false !== strpos( $haystack, 'wc-paypal' ) )
			&& false !== strpos( $haystack, 'settings' )
		);

		if ( ! $is_paypal_settings ) {
			continue;
		}

		wp_dequeue_script( $handle );
		wp_deregister_script( $handle );
	}
}
add_action( 'admin_enqueue_scripts', 'dtb_wc_admin_payments_compat_dequeue_overview_conflicts', 9999 );
add_action( 'admin_print_scripts', 'dtb_wc_admin_payments_compat_dequeue_overview_conflicts', 0 );

/**
 * Build a read-only list of configured WooCommerce gateway objects.
 *
 * @return array<int,array<string,string|bool>>
 */
function dtb_wc_admin_payments_compat_gateway_payload(): array {
	if ( ! function_exists( 'WC' ) || ! WC() || ! method_exists( WC(), 'payment_gateways' ) || ! WC()->payment_gateways() ) {
		return [];
	}

	$gateway_objects = WC()->payment_gateways()->payment_gateways();
	$gateways        = [];

	foreach ( $gateway_objects as $gateway ) {
		$id = isset( $gateway->id ) ? sanitize_key( (string) $gateway->id ) : '';
		if ( '' === $id ) {
			continue;
		}

		$title = '';
		if ( method_exists( $gateway, 'get_method_title' ) ) {
			$title = (string) $gateway->get_method_title();
		}
		if ( '' === $title && isset( $gateway->method_title ) ) {
			$title = (string) $gateway->method_title;
		}
		if ( '' === $title && isset( $gateway->title ) ) {
			$title = (string) $gateway->title;
		}
		$title = '' !== $title ? wp_strip_all_tags( $title ) : strtoupper( $id );

		$description = '';
		if ( method_exists( $gateway, 'get_method_description' ) ) {
			$description = (string) $gateway->get_method_description();
		}
		if ( '' === $description && isset( $gateway->method_description ) ) {
			$description = (string) $gateway->method_description;
		}
		$description = wp_trim_words( wp_strip_all_tags( $description ), 28, '…' );

		$enabled = isset( $gateway->enabled ) && 'yes' === (string) $gateway->enabled;

		$gateways[] = [
			'id'          => $id,
			'title'       => html_entity_decode( $title, ENT_QUOTES, get_bloginfo( 'charset' ) ),
			'description' => html_entity_decode( $description, ENT_QUOTES, get_bloginfo( 'charset' ) ),
			'enabled'     => $enabled,
			'settingsUrl' => admin_url( 'admin.php?page=wc-settings&tab=checkout&section=' . rawurlencode( $id ) ),
		];
	}

	usort(
		$gateways,
		static function ( array $left, array $right ): int {
			if ( $left['enabled'] !== $right['enabled'] ) {
				return $left['enabled'] ? -1 : 1;
			}
			return strcasecmp( (string) $left['title'], (string) $right['title'] );
		}
	);

	return $gateways;
}

/**
 * Add compact fallback styling.
 */
function dtb_wc_admin_payments_compat_head(): void {
	if ( ! dtb_wc_admin_payments_compat_is_screen() || ! dtb_wc_admin_payments_compat_user_can_manage() ) {
		return;
	}
	?>
	<style id="dtb-wc-admin-payments-compat-css">
		.dtb-wc-admin-payments-compat{max-width:1180px;margin:18px 24px 0 24px;padding:20px 22px;border:1px solid #dcdcde;border-left:4px solid #3858e9;border-radius:8px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.04)}
		.dtb-wc-admin-payments-compat h2{margin:0 0 8px;font-size:20px;line-height:1.25;color:#1d2327}
		.dtb-wc-admin-payments-compat p{max-width:900px;margin:0 0 16px;color:#50575e;font-size:13px;line-height:1.55}
		.dtb-wc-admin-payments-compat table{margin-top:12px}
		.dtb-wc-admin-payments-compat .dtb-status{display:inline-flex;align-items:center;gap:6px;font-weight:600}
		.dtb-wc-admin-payments-compat .dtb-status:before{content:'';width:8px;height:8px;border-radius:999px;background:#8c8f94}
		.dtb-wc-admin-payments-compat .dtb-status--enabled:before{background:#00a32a}
		.dtb-wc-admin-payments-compat .dtb-status--disabled:before{background:#d63638}
		.dtb-wc-admin-payments-compat .button{white-space:nowrap}
	</style>
	<?php
}
add_action( 'admin_head', 'dtb_wc_admin_payments_compat_head', 50 );

/**
 * Render direct gateway controls as deterministic server-side fallback.
 */
function dtb_wc_admin_payments_compat_render_gateway_panel(): void {
	if ( ! dtb_wc_admin_payments_compat_is_screen() || ! dtb_wc_admin_payments_compat_user_can_manage() ) {
		return;
	}

	$gateways = dtb_wc_admin_payments_compat_gateway_payload();
	if ( empty( $gateways ) ) {
		return;
	}
	?>
	<section class="dtb-wc-admin-payments-compat" aria-label="<?php echo esc_attr__( 'Payment gateway controls', 'drywall-toolbox' ); ?>">
		<h2><?php echo esc_html__( 'Payment gateway controls', 'drywall-toolbox' ); ?></h2>
		<p><?php echo esc_html__( 'Direct WooCommerce gateway settings are available below. The official WooCommerce provider panel remains authoritative; this fallback keeps payment configuration reachable when the provider app is blocked by an admin REST or script conflict.', 'drywall-toolbox' ); ?></p>
		<table class="widefat striped">
			<thead>
				<tr>
					<th><?php echo esc_html__( 'Gateway', 'drywall-toolbox' ); ?></th>
					<th><?php echo esc_html__( 'Status', 'drywall-toolbox' ); ?></th>
					<th><?php echo esc_html__( 'Description', 'drywall-toolbox' ); ?></th>
					<th><?php echo esc_html__( 'Action', 'drywall-toolbox' ); ?></th>
				</tr>
			</thead>
			<tbody>
				<?php foreach ( $gateways as $gateway ) : ?>
					<tr>
						<td><?php echo esc_html( (string) $gateway['title'] ); ?></td>
						<td>
							<span class="dtb-status <?php echo $gateway['enabled'] ? 'dtb-status--enabled' : 'dtb-status--disabled'; ?>">
								<?php echo esc_html( $gateway['enabled'] ? __( 'Enabled', 'drywall-toolbox' ) : __( 'Disabled', 'drywall-toolbox' ) ); ?>
							</span>
						</td>
						<td><?php echo esc_html( (string) ( $gateway['description'] ?: '—' ) ); ?></td>
						<td><a class="button button-secondary" href="<?php echo esc_url( (string) $gateway['settingsUrl'] ); ?>"><?php echo esc_html__( 'Manage', 'drywall-toolbox' ); ?></a></td>
					</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
	</section>
	<?php
}
add_action( 'all_admin_notices', 'dtb_wc_admin_payments_compat_render_gateway_panel', 20 );