<?php
defined( 'ABSPATH' ) || exit;

/**
 * Validate that an attachment ID exists and is an attachment.
 */
function dtb_validate_schematic_attachment_id( int $attachment_id ): bool {
	return $attachment_id > 0 && 'attachment' === get_post_type( $attachment_id );
}

/**
 * Normalize schematic save payload.
 */
function dtb_schematic_normalize_save_payload( array $payload ): array {
	return [
		'brand'        => dtb_schematic_normalize_brand( (string) ( $payload['brand'] ?? '' ) ),
		'model_number' => sanitize_text_field( (string) ( $payload['model_number'] ?? '' ) ),
		'model_name'   => sanitize_text_field( (string) ( $payload['model_name'] ?? '' ) ),
		'part_count'   => absint( $payload['part_count'] ?? 0 ),
		'notes'        => sanitize_textarea_field( (string) ( $payload['notes'] ?? '' ) ),
		'product_ids'  => dtb_schematic_normalize_product_ids( $payload['product_ids'] ?? [] ),
	];
}
