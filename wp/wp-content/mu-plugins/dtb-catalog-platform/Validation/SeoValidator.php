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
		$product = $context['product'] ?? null;
		$meta    = $context['meta']    ?? [];
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

		if ( '' === (string) ( $meta['meta:seo_canonical'] ?? '' ) ) {
			$issues[] = [
				'severity' => 'info',
				'code'     => 'missing_seo_canonical',
				'message'  => 'Product has no explicit meta:seo_canonical. The default WooCommerce permalink will be used; set this if the canonical should differ.',
			];
		}

		// schema_condition is meaningful for purchasable products (new/used/refurbished).
		if ( $product && $product->is_purchasable() ) {
			if ( '' === (string) ( $meta['meta:schema_condition'] ?? '' ) ) {
				$issues[] = [
					'severity' => 'info',
					'code'     => 'missing_schema_condition',
					'message'  => 'Purchasable product has no meta:schema_condition. Schema.org structured data will omit the item condition (NewCondition/UsedCondition/etc.).',
				];
			}
		}

		return $issues;
	}
}
