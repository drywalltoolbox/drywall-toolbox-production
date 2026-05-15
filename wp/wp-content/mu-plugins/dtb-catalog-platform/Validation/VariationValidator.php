<?php
/**
 * Variation integrity validator.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_VariationValidator {

	/**
	 * @param  array $context
	 * @return array[]
	 */
	public static function validate( array $context ): array {
		$product = $context['product'] ?? null;
		$meta    = $context['meta'] ?? [];
		if ( ! $product || ! is_array( $meta ) ) {
			return [];
		}

		if ( ! $product->is_type( 'variable' ) ) {
			return [];
		}

		$issues = [];
		$children = $product->get_children();

		if ( empty( $children ) ) {
			$issues[] = [
				'severity' => 'error',
				'code'     => 'variable_parent_no_children',
				'message'  => 'Variable parent has no child variations.',
			];
			return $issues;
		}

		$default_var_id = (int) ( $meta['_dtb_default_variation_id'] ?? 0 );
		if ( $default_var_id <= 0 ) {
			$issues[] = [
				'severity' => 'warning',
				'code'     => 'dtb_missing_default_var',
				'message'  => 'Variable parent is missing _dtb_default_variation_id. UI will rely on fallback selection.',
			];
		} elseif ( ! in_array( $default_var_id, $children, true ) ) {
			$issues[] = [
				'severity' => 'warning',
				'code'     => 'dtb_invalid_default_var',
				'message'  => sprintf( '_dtb_default_variation_id (%d) does not belong to this parent.', $default_var_id ),
			];
		}

		return $issues;
	}
}
