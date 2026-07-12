<?php
defined( 'ABSPATH' ) || exit;

/**
 * Canonical catalog admin capability.
 */
function dtb_catalog_admin_capability(): string {
	return defined( 'DTB_CAP_CATALOG' ) ? DTB_CAP_CATALOG : 'manage_woocommerce';
}

/**
 * Canonical catalog root tools slug.
 */
function dtb_catalog_admin_tools_slug(): string {
	return 'dtb-toolbox';
}
