<?php
defined( 'ABSPATH' ) || exit;

/**
 * Normalize schematic manifest ID.
 */
function dtb_schematic_manifest_normalize_id( string $schematic_id ): string {
	return sanitize_text_field( trim( $schematic_id ) );
}

/**
 * Normalize schematic manifest page key.
 */
function dtb_schematic_manifest_normalize_page( $page ): string {
	$page = sanitize_text_field( (string) $page );
	return '' === $page ? '1' : $page;
}

/**
 * Normalize schematic manifest type.
 */
function dtb_schematic_manifest_normalize_type( string $type ): string {
	return 'preview' === strtolower( sanitize_text_field( $type ) ) ? 'preview' : 'diagram';
}
