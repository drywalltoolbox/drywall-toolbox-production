<?php
/**
 * Plugin Name: DTB Admin Workbench Stabilization
 * Description: Post-merge stabilization guards for DTB admin workbench contracts before the next full upgrade wave.
 * Version: 1.0.0
 * Author: Drywall Toolbox
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Add small compatibility shims after the shared/module admin scripts are enqueued.
 *
 * This keeps the merged workbench stable without rewriting large JS assets in place.
 */
add_action( 'admin_enqueue_scripts', 'dtb_admin_workbench_stabilization_enqueue', 999 );
function dtb_admin_workbench_stabilization_enqueue(): void {
	if ( wp_script_is( 'dtb-admin-workbench', 'enqueued' ) ) {
		wp_add_inline_script(
			'dtb-admin-workbench',
			"(function(w){'use strict';if(w.DtbWorkbench&&!w.DtbWorkbench.getUrlParam){w.DtbWorkbench.getUrlParam=function(key){try{return new URL(w.location.href).searchParams.get(String(key||''));}catch(e){return null;}};}})(window);",
			'after'
		);
	}

	if ( wp_script_is( 'dtb-returns-page-script', 'enqueued' ) ) {
		wp_add_inline_script(
			'dtb-returns-page-script',
			dtb_admin_workbench_stabilization_returns_js(),
			'after'
		);
	}
}

/**
 * Return an inline JS guard that hides return-status actions the backend will reject.
 *
 * The existing returns modal builds buttons from the full status list. This guard uses
 * the enriched detail endpoint's allowed_transitions contract and disables invalid
 * actions before the operator can submit them.
 *
 * @return string
 */
function dtb_admin_workbench_stabilization_returns_js(): string {
	return <<<'JS'
(function(w,d){
	'use strict';
	var cache = {};
	var inflight = {};
	var timer = null;

	function cfg(){ return w.dtbAdminConfig || {}; }
	function rest(path){
		var base = (cfg().restUrl || '/wp-json/').replace(/\/$/, '');
		return base + '/' + String(path || '').replace(/^\//, '');
	}
	function nonce(){ return cfg().nonce || ''; }
	function currentReturnId(){
		try { return new URL(w.location.href).searchParams.get('return_id'); }
		catch(e){ return null; }
	}
	function fetchAllowed(id){
		if (!id) { return Promise.resolve([]); }
		if (cache[id]) { return Promise.resolve(cache[id]); }
		if (inflight[id]) { return inflight[id]; }
		inflight[id] = fetch(rest('dtb/v1/returns/' + encodeURIComponent(id) + '/detail'), {
			method: 'GET',
			credentials: 'same-origin',
			headers: { 'X-WP-Nonce': nonce() }
		}).then(function(res){ return res.json(); }).then(function(data){
			var ret = (data && (data.return || data.return_data)) || {};
			var allowed = Array.isArray(ret.allowed_transitions) ? ret.allowed_transitions : [];
			cache[id] = allowed;
			delete inflight[id];
			return allowed;
		}).catch(function(){
			delete inflight[id];
			return [];
		});
		return inflight[id];
	}
	function applyAllowedTransitions(){
		var overlay = d.getElementById('dtb-returns-modal');
		if (!overlay || !overlay.classList.contains('dtb-modal-overlay--open')) { return; }
		var id = currentReturnId();
		if (!id) { return; }
		fetchAllowed(id).then(function(allowed){
			var buttons = overlay.querySelectorAll('[data-dtb-returns-action="status"]');
			buttons.forEach(function(btn){
				var value = btn.getAttribute('data-dtb-returns-value') || '';
				var ok = allowed.indexOf(value) !== -1;
				btn.hidden = !ok;
				btn.disabled = !ok;
				btn.setAttribute('aria-disabled', ok ? 'false' : 'true');
			});
			var section = buttons.length ? buttons[0].closest('.dtb-returns-section') : null;
			if (section && !allowed.length && !section.querySelector('.dtb-returns-no-transitions')) {
				var note = d.createElement('p');
				note.className = 'dtb-returns-no-transitions';
				note.textContent = 'No valid status transitions are available from the current return status.';
				section.appendChild(note);
			}
		});
	}
	d.addEventListener('click', function(e){
		var btn = e.target && e.target.closest ? e.target.closest('#dtb-returns-modal [data-dtb-returns-action="status"]') : null;
		if (!btn) { return; }
		if (btn.disabled || btn.hidden || btn.getAttribute('aria-disabled') === 'true') {
			e.preventDefault();
			e.stopImmediatePropagation();
		}
	}, true);
	new MutationObserver(function(){
		clearTimeout(timer);
		timer = setTimeout(applyAllowedTransitions, 60);
	}).observe(d.body, { childList: true, subtree: true });
	d.addEventListener('DOMContentLoaded', applyAllowedTransitions);
})(window, document);
JS;
}

/**
 * Normalize merged REST contracts that the current admin workbench depends on.
 */
add_filter( 'rest_post_dispatch', 'dtb_admin_workbench_stabilization_rest_contracts', 20, 3 );
function dtb_admin_workbench_stabilization_rest_contracts( $response, WP_REST_Server $server, WP_REST_Request $request ) {
	unset( $server );

	if ( is_wp_error( $response ) || ! $response instanceof WP_REST_Response ) {
		return $response;
	}

	$route = $request->get_route();
	$data  = $response->get_data();

	if ( ! is_array( $data ) ) {
		return $response;
	}

	if ( preg_match( '#^/dtb/v1/returns/(\d+)/detail$#', $route, $m ) ) {
		$return_data = isset( $data['return'] ) && is_array( $data['return'] ) ? $data['return'] : [];
		$status      = sanitize_key( (string) ( $return_data['status'] ?? '' ) );

		if ( function_exists( 'dtb_return_get_allowed_transitions' ) ) {
			$data['return']['allowed_transitions'] = array_values( dtb_return_get_allowed_transitions( $status ) );
		}
		if ( class_exists( 'DTB_Return_Status' ) && method_exists( 'DTB_Return_Status', 'all' ) ) {
			$data['return']['all_statuses'] = array_values( DTB_Return_Status::all() );
		}

		$response->set_data( $data );
		return $response;
	}

	if ( preg_match( '#^/dtb/v1/admin/repairs/(\d+)/detail$#', $route, $m ) ) {
		$repair_id = absint( $m[1] );
		$data      = dtb_admin_workbench_stabilization_repair_detail_payload( $repair_id, $data );
		$response->set_data( $data );
		return $response;
	}

	return $response;
}

/**
 * Patch repair-detail payload fields that must be authoritative for the modal.
 *
 * @param int   $repair_id Repair post ID.
 * @param array $data      Existing REST payload.
 * @return array
 */
function dtb_admin_workbench_stabilization_repair_detail_payload( int $repair_id, array $data ): array {
	$record = isset( $data['record'] ) && is_array( $data['record'] ) ? $data['record'] : [];

	$order_id = absint( get_post_meta( $repair_id, '_repair_wc_order_id', true ) );
	if ( ! $order_id ) {
		$order_id = absint( get_post_meta( $repair_id, '_repair_order_id', true ) );
	}

	$email   = sanitize_email( (string) ( $record['customer_email'] ?? get_post_meta( $repair_id, '_repair_customer_email', true ) ) );
	$user_id = absint( get_post_meta( $repair_id, '_repair_customer_user_id', true ) );

	if ( $order_id && function_exists( 'wc_get_order' ) ) {
		$order = wc_get_order( $order_id );
		if ( $order instanceof WC_Order ) {
			if ( ! $email ) {
				$email = sanitize_email( $order->get_billing_email() );
			}
			if ( ! $user_id ) {
				$user_id = absint( $order->get_customer_id() );
			}
		}
	}

	if ( function_exists( 'dtb_admin_get_customer_context' ) ) {
		$customer = dtb_admin_get_customer_context( [
			'customer_email'   => $email,
			'customer_user_id' => $user_id,
			'order_id'         => $order_id,
			'exclude_module'   => 'repair',
		] );
		if ( isset( $customer['lifetime_spend'] ) && ! isset( $customer['lifetime_value'] ) ) {
			$customer['lifetime_value'] = $customer['lifetime_spend'];
		}
		$data['customer'] = $customer;
	}

	$linked          = dtb_admin_workbench_stabilization_repair_links( $repair_id, $order_id, $email, $user_id );
	$existing_linked = isset( $data['linked'] ) && is_array( $data['linked'] ) ? $data['linked'] : [];
	$data['linked']  = array_replace_recursive( $existing_linked, $linked );

	if ( isset( $data['record'] ) && is_array( $data['record'] ) ) {
		$data['record']['wc_order_id'] = $order_id;
	}

	return $data;
}

/**
 * Build repair linked-record data with a normalized records[] list.
 *
 * @param int    $repair_id Repair post ID.
 * @param int    $order_id  WooCommerce order ID.
 * @param string $email     Customer email.
 * @param int    $user_id   Customer user ID.
 * @return array
 */
function dtb_admin_workbench_stabilization_repair_links( int $repair_id, int $order_id, string $email, int $user_id ): array {
	global $wpdb;

	$linked = [
		'order_id'         => $order_id ?: null,
		'order_edit_url'   => $order_id ? (string) get_edit_post_link( $order_id ) : '',
		'order_status'     => '',
		'customer_user_id' => $user_id ?: null,
		'ticket_ids'       => [],
		'return_ids'       => [],
		'repair_ids'       => [],
		'veeqo_order_id'   => (string) get_post_meta( $repair_id, '_repair_veeqo_order_id', true ),
		'confidence'       => [
			'order' => $order_id ? 'verified' : 'not_linked',
		],
		'synced_at'        => gmdate( 'c' ),
		'records'          => [],
	];

	if ( $order_id && function_exists( 'wc_get_order' ) ) {
		$order = wc_get_order( $order_id );
		if ( $order instanceof WC_Order ) {
			$linked['order_status'] = $order->get_status();
			$linked['records'][]    = dtb_admin_workbench_stabilization_record_chip( 'order', $order_id, 'WooCommerce Order #' . $order_id, $linked['order_edit_url'], 'verified' );
		} else {
			$linked['confidence']['order'] = 'orphaned';
		}
	}

	$tickets_table = $wpdb->prefix . 'dtb_support_tickets';
	if ( dtb_admin_workbench_stabilization_table_exists( $tickets_table ) && ( $email || $user_id ) ) {
		if ( $email ) {
			$ids = $wpdb->get_col( $wpdb->prepare( "SELECT id FROM {$tickets_table} WHERE customer_email = %s ORDER BY id DESC LIMIT 20", $email ) ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		} else {
			$ids = $wpdb->get_col( $wpdb->prepare( "SELECT id FROM {$tickets_table} WHERE customer_user_id = %d ORDER BY id DESC LIMIT 20", $user_id ) ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		}
		$linked['ticket_ids'] = array_values( array_map( 'absint', (array) $ids ) );
		foreach ( $linked['ticket_ids'] as $id ) {
			$linked['records'][] = dtb_admin_workbench_stabilization_record_chip( 'support', $id, 'Support Ticket #' . $id, admin_url( 'admin.php?page=dtb-support&ticket_id=' . $id ), 'customer_match' );
		}
	}

	$returns_table = $wpdb->prefix . 'dtb_returns';
	if ( dtb_admin_workbench_stabilization_table_exists( $returns_table ) && ( $email || $user_id ) ) {
		if ( $email ) {
			$ids = $wpdb->get_col( $wpdb->prepare( "SELECT id FROM {$returns_table} WHERE customer_email = %s ORDER BY id DESC LIMIT 20", $email ) ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		} else {
			$ids = $wpdb->get_col( $wpdb->prepare( "SELECT id FROM {$returns_table} WHERE customer_user_id = %d ORDER BY id DESC LIMIT 20", $user_id ) ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		}
		$linked['return_ids'] = array_values( array_map( 'absint', (array) $ids ) );
		foreach ( $linked['return_ids'] as $id ) {
			$linked['records'][] = dtb_admin_workbench_stabilization_record_chip( 'returns', $id, 'Return #' . $id, admin_url( 'admin.php?page=dtb-returns&return_id=' . $id ), 'customer_match' );
		}
	}

	if ( $email || $user_id ) {
		$meta_query = [ 'relation' => 'OR' ];
		if ( $email ) {
			$meta_query[] = [ 'key' => '_repair_customer_email', 'value' => $email ];
		}
		if ( $user_id ) {
			$meta_query[] = [ 'key' => '_repair_customer_user_id', 'value' => $user_id, 'type' => 'NUMERIC' ];
		}
		$q = new WP_Query( [
			'post_type'      => 'dtb_repair_request',
			'post_status'    => 'publish',
			'posts_per_page' => 20,
			'fields'         => 'ids',
			'post__not_in'   => [ $repair_id ],
			'meta_query'     => $meta_query, // phpcs:ignore WordPress.DB.SlowDBQuery
		] );
		$linked['repair_ids'] = array_values( array_map( 'absint', (array) $q->posts ) );
		foreach ( $linked['repair_ids'] as $id ) {
			$linked['records'][] = dtb_admin_workbench_stabilization_record_chip( 'repair', $id, 'Repair #' . $id, admin_url( 'admin.php?page=dtb-repairs&open_repair=' . $id ), 'customer_match' );
		}
	}

	return $linked;
}

/**
 * Build one normalized linked-record row for the JS modal.
 *
 * @param string $module     Module slug.
 * @param int    $id         Record ID.
 * @param string $label      Human label.
 * @param string $url        Admin URL.
 * @param string $confidence Link confidence/source.
 * @return array
 */
function dtb_admin_workbench_stabilization_record_chip( string $module, int $id, string $label, string $url, string $confidence ): array {
	return [
		'module'     => $module,
		'id'         => $id,
		'label'      => $label,
		'url'        => $url,
		'confidence' => $confidence,
	];
}

/**
 * Safe table-exists check.
 *
 * @param string $table Table name.
 * @return bool
 */
function dtb_admin_workbench_stabilization_table_exists( string $table ): bool {
	global $wpdb;
	return (bool) $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
}
