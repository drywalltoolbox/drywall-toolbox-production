<?php
/**
 * Image availability validator.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_ImageValidator {

	/**
	 * @param  array $context
	 * @return array[]
	 */
	public static function validate( array $context ): array {
		$product = $context['product'] ?? null;
		if ( ! $product ) {
			return [];
		}

		if ( ! $product->is_visible() ) {
			return [];
		}

		$image_id = (int) $product->get_image_id();
		if ( $image_id > 0 ) {
			return [];
		}

		return [
			[
				'severity' => 'warning',
				'code'     => 'missing_primary_image',
				'message'  => 'Visible product is missing a primary image.',
			],
		];
	}
}
