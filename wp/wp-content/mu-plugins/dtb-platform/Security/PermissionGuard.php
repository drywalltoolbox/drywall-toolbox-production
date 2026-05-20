<?php
defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_PermissionGuard' ) ) {
	return;
}

final class DTB_PermissionGuard {
	public static function require_cap( string $capability, int $status = 403 ) {
		if ( current_user_can( $capability ) ) {
			return true;
		}

		dtb_security_log(
			'permission_denied',
			[
				'capability' => $capability,
			]
		);

		return new WP_Error( 'forbidden', 'Insufficient permissions.', [ 'status' => $status ] );
	}

	public static function require_admin_ops() {
		$capability = defined( 'DTB_CAP_OPS' ) ? DTB_CAP_OPS : 'manage_options';
		return self::require_cap( $capability );
	}
}
