<?php
/**
 * SEO metadata validator.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_SeoValidator {

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

		if ( '' === (string) ( $meta['meta:seo_title'] ?? '' ) ) {
			$issues[] = [
				'severity' => 'warning',
				'code'     => 'missing_seo_title',
				'message'  => 'Product is missing meta:seo_title.',
			];
		}

		if ( '' === (string) ( $meta['meta:seo_description'] ?? '' ) ) {
			$issues[] = [
				'severity' => 'warning',
				'code'     => 'missing_seo_description',
				'message'  => 'Product is missing meta:seo_description.',
			];
		}

		return $issues;
	}
}
