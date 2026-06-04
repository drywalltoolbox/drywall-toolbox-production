<?php
/**
 * DTB Platform — AdminWorkbenchContract
 *
 * Documents and validates the canonical admin workbench payload shape.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Return required top-level keys for Admin Workbench v2.
 *
 * @return string[]
 */
function dtb_admin_workbench_contract_required_keys(): array {
	return [
		'ok',
		'record',
		'customer',
		'linked_records',
		'workflow',
		'intelligence',
		'communication',
		'integrations',
		'timeline',
		'actions',
		'permissions',
		'meta',
	];
}

/**
 * Normalize a partial payload into the canonical top-level workbench shape.
 *
 * This is intentionally additive. It preserves module aliases during migration.
 *
 * @param array $payload Workbench payload.
 * @return array
 */
function dtb_admin_prepare_workbench_payload( array $payload ): array {
	$defaults = [
		'ok'             => true,
		'record'         => [],
		'customer'       => [],
		'linked_records' => [],
		'workflow'       => [],
		'intelligence'   => [],
		'communication'  => [],
		'integrations'   => [],
		'timeline'       => [],
		'actions'        => [],
		'permissions'    => [],
		'meta'           => [],
	];

	$payload = array_replace_recursive( $defaults, $payload );

	if ( empty( $payload['meta']['fetched_at'] ) ) {
		$payload['meta']['fetched_at'] = gmdate( 'c' );
	}
	if ( empty( $payload['meta']['poll_after_ms'] ) ) {
		$payload['meta']['poll_after_ms'] = 180000;
	}

	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		$errors = dtb_admin_validate_workbench_payload( $payload );
		if ( $errors ) {
			$payload['meta']['contract_errors'] = $errors;
		}
	}

	return $payload;
}

/**
 * Validate the canonical workbench payload shape.
 *
 * @param array $payload Workbench payload.
 * @return string[] Human-readable validation errors.
 */
function dtb_admin_validate_workbench_payload( array $payload ): array {
	$errors = [];

	foreach ( dtb_admin_workbench_contract_required_keys() as $key ) {
		if ( ! array_key_exists( $key, $payload ) ) {
			$errors[] = 'Missing required key: ' . $key;
		}
	}

	foreach ( [ 'record', 'customer', 'linked_records', 'workflow', 'intelligence', 'communication', 'integrations', 'permissions', 'meta' ] as $key ) {
		if ( isset( $payload[ $key ] ) && ! is_array( $payload[ $key ] ) ) {
			$errors[] = 'Expected array at key: ' . $key;
		}
	}

	foreach ( [ 'timeline', 'actions' ] as $key ) {
		if ( isset( $payload[ $key ] ) && ! is_array( $payload[ $key ] ) ) {
			$errors[] = 'Expected list/array at key: ' . $key;
		}
	}

	return $errors;
}
