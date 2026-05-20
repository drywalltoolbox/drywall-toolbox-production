<?php
defined( 'ABSPATH' ) || exit;

/**
 * Check whether a tool family is valid.
 */
function dtb_catalog_tool_family_is_valid( string $tool_family ): bool {
	return DTB_ToolFamilies::is_valid( $tool_family );
}

/**
 * Resolve tool families for a slot.
 *
 * @return string[]
 */
function dtb_catalog_tool_family_for_slot( string $slot_id ): array {
	return DTB_ToolFamilies::families_for_slot( $slot_id );
}

/**
 * Resolve slots for a tool family.
 *
 * @return string[]
 */
function dtb_catalog_tool_slots_for_family( string $tool_family ): array {
	return DTB_ToolFamilies::slots_for_family( $tool_family );
}
