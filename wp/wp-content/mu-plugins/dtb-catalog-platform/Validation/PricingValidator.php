<?php
/**
 * Pricing validator.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_PricingValidator {

	/**
	 * @param  array $context
	 * @return array[]
	 */
	public static function validate( array $context ): array {
		$product = $context['product'] ?? null;
		if ( ! $product ) {
			return [];
		}

		$issues = [];

		if ( $product->is_type( 'simple' ) && $product->is_purchasable() ) {
			$price = $product->get_price();
			if ( '' === (string) $price || null === $price ) {
				$issues[] = [
					'severity' => 'error',
					'code'     => 'simple_missing_price',
					'message'  => 'Simple product is purchasable but has no price.',
				];
			}
		}

		if ( $product->is_type( 'variation' ) && $product->is_purchasable() ) {
			$price = $product->get_price();
			if ( '' === (string) $price || null === $price ) {
				$issues[] = [
					'severity' => 'error',
					'code'     => 'variation_missing_price',
					'message'  => 'Variation is purchasable but has no price.',
				];
			}
		}

		return $issues;
	}
}
