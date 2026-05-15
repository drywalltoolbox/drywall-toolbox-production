<?php
/**
 * Toolset eligibility validator.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_ToolsetEligibilityValidator {

	/**
	 * @param  array $context
	 * @return array[]
	 */
	public static function validate( array $context ): array {
		$meta = $context['meta'] ?? [];
		if ( ! is_array( $meta ) ) {
			return [];
		}

		$issues = [];

		$builder_eligible = (string) ( $meta['_dtb_builder_eligible'] ?? '' );
		$tool_family      = (string) ( $meta['_dtb_tool_family'] ?? '' );
		$builder_slots    = (string) ( $meta['_dtb_builder_slots'] ?? '' );

		if ( '1' !== $builder_eligible ) {
			return [];
		}

		if ( '' === $tool_family ) {
			$issues[] = [
				'severity' => 'warning',
				'code'     => 'dtb_builder_missing_family',
				'message'  => 'Product is marked builder eligible but has no _dtb_tool_family.',
			];
		}

		if ( '' === $builder_slots ) {
			$issues[] = [
				'severity' => 'warning',
				'code'     => 'dtb_builder_missing_slots',
				'message'  => 'Product is marked builder eligible but has no _dtb_builder_slots.',
			];
		}

		return $issues;
	}
}
