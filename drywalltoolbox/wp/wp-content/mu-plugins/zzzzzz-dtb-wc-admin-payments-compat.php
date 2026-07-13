<?php
/**
 * WooCommerce payments admin compatibility fallback.
 *
 * Admin-only safety layer for the WooCommerce Settings > Payments screen. The
 * official WooCommerce provider app remains authoritative; this file only keeps
 * core admin scripts/cache behavior safe and renders direct gateway settings
 * links when the provider panel loads without gateway controls.
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
 * Determine whether the current admin user may manage payment settings.
 */
function dtb_wc_admin_payments_compat_user_can_manage(): bool {
	return current_user_can( 'manage_woocommerce' ) || current_user_can( 'manage_options' );
}

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
		.dtb-wc-admin-payments-compat{max-width:1180px;margin:24px 24px 0 24px;padding:22px;border:1px solid #dcdcde;border-radius:8px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.04)}
		.dtb-wc-admin-payments-compat h2{margin:0 0 8px;font-size:20px;line-height:1.25;color:#1d2327}
		.dtb-wc-admin-payments-compat p{max-width:860px;margin:0 0 16px;color:#50575e;font-size:13px;line-height:1.55}
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
 * Render a direct gateway-settings fallback only when Woo's provider UI is empty.
 */
function dtb_wc_admin_payments_compat_footer(): void {
	if ( ! dtb_wc_admin_payments_compat_is_screen() || ! dtb_wc_admin_payments_compat_user_can_manage() ) {
		return;
	}

	$payload = [
		'gateways' => dtb_wc_admin_payments_compat_gateway_payload(),
		'heading'  => __( 'Payment gateway controls', 'drywall-toolbox' ),
		'copy'     => __( 'WooCommerce did not render gateway controls in the payment providers panel. Use these direct gateway settings links while the provider panel finishes loading or is blocked by an admin script conflict.', 'drywall-toolbox' ),
		'columns'  => [
			'gateway'     => __( 'Gateway', 'drywall-toolbox' ),
			'status'      => __( 'Status', 'drywall-toolbox' ),
			'description' => __( 'Description', 'drywall-toolbox' ),
			'action'      => __( 'Action', 'drywall-toolbox' ),
		],
		'enabled'  => __( 'Enabled', 'drywall-toolbox' ),
		'disabled' => __( 'Disabled', 'drywall-toolbox' ),
		'manage'   => __( 'Manage', 'drywall-toolbox' ),
	];
	?>
	<script id="dtb-wc-admin-payments-compat-js">
	(function(config){
		function text(value){return String(value || '').replace(/\s+/g,' ').trim();}
		function lower(value){return text(value).toLowerCase();}
		function appendText(node, value){node.appendChild(document.createTextNode(value));}
		function hasRenderedGateway(content, gateways){
			var pageText = lower(content && content.textContent);
			return (gateways || []).some(function(gateway){
				var title = lower(gateway.title);
				return title.length > 2 && pageText.indexOf(title) !== -1;
			});
		}
		function createCell(tag, value){
			var cell = document.createElement(tag);
			appendText(cell, value || '');
			return cell;
		}
		function insertFallback(){
			var gateways = config.gateways || [];
			if(!gateways.length || document.querySelector('.dtb-wc-admin-payments-compat')){return;}
			var root = document.querySelector('#wpbody-content') || document.body;
			if(hasRenderedGateway(root, gateways)){return;}

			var panel = document.createElement('section');
			panel.className = 'dtb-wc-admin-payments-compat';
			panel.setAttribute('aria-label', config.heading || 'Payment gateway controls');

			var heading = document.createElement('h2');
			appendText(heading, config.heading || 'Payment gateway controls');
			panel.appendChild(heading);

			var copy = document.createElement('p');
			appendText(copy, config.copy || 'Direct payment gateway settings are available below.');
			panel.appendChild(copy);

			var table = document.createElement('table');
			table.className = 'widefat striped';
			var thead = document.createElement('thead');
			var headRow = document.createElement('tr');
			['gateway','status','description','action'].forEach(function(key){headRow.appendChild(createCell('th', (config.columns || {})[key] || key));});
			thead.appendChild(headRow);
			table.appendChild(thead);

			var tbody = document.createElement('tbody');
			gateways.forEach(function(gateway){
				var row = document.createElement('tr');
				row.appendChild(createCell('td', gateway.title || gateway.id));
				var statusCell = document.createElement('td');
				var status = document.createElement('span');
				status.className = 'dtb-status ' + (gateway.enabled ? 'dtb-status--enabled' : 'dtb-status--disabled');
				appendText(status, gateway.enabled ? config.enabled : config.disabled);
				statusCell.appendChild(status);
				row.appendChild(statusCell);
				row.appendChild(createCell('td', gateway.description || '—'));
				var action = document.createElement('td');
				var link = document.createElement('a');
				link.className = 'button button-secondary';
				link.href = gateway.settingsUrl;
				appendText(link, config.manage || 'Manage');
				action.appendChild(link);
				row.appendChild(action);
				tbody.appendChild(row);
			});
			table.appendChild(tbody);
			panel.appendChild(table);

			var target = document.querySelector('.woocommerce-layout__primary') || document.querySelector('#mainform') || root;
			target.appendChild(panel);
		}
		if(document.readyState === 'loading'){
			document.addEventListener('DOMContentLoaded', function(){window.setTimeout(insertFallback, 600);}, {once:true});
		} else {
			window.setTimeout(insertFallback, 600);
		}
	})(<?php echo wp_json_encode( $payload ); ?>);
	</script>
	<?php
}
add_action( 'admin_footer', 'dtb_wc_admin_payments_compat_footer', 50 );
