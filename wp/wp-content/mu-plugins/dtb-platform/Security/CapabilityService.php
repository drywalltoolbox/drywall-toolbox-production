<?php
defined( 'ABSPATH' ) || exit;

if ( class_exists( 'DTB_CapabilityService' ) ) {
	return;
}

final class DTB_CapabilityService {
	public static function can_manage_ops( ?int $user_id = null ): bool {
		$user_id ??= get_current_user_id();
		$user = get_user_by( 'id', (int) $user_id );
		if ( ! $user instanceof WP_User ) {
			return false;
		}

		return user_can( $user, 'manage_options' )
			|| user_can( $user, 'manage_woocommerce' )
			|| user_can( $user, 'dtb_admin_ops' );
	}

	public static function can_manage_catalog( ?int $user_id = null ): bool {
		$user_id ??= get_current_user_id();
		$user = get_user_by( 'id', (int) $user_id );
		if ( ! $user instanceof WP_User ) {
			return false;
		}

		$catalog_cap = defined( 'DTB_CAP_CATALOG' ) ? DTB_CAP_CATALOG : 'manage_woocommerce';
		return user_can( $user, $catalog_cap );
	}
}
