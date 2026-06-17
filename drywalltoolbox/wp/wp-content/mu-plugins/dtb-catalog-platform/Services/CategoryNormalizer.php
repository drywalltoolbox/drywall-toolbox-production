<?php
/**
 * DTB_CategoryNormalizer
 *
 * Maps WooCommerce category names and slugs to DTB's internal category keys.
 *
 * This is the backend counterpart of CATEGORY_MAP in parseProductCsv.js.
 * Moving the mapping here means the frontend can consume pre-keyed data from
 * the catalog API rather than deriving keys itself.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_CategoryNormalizer {

	/**
	 * Map from lowercase WC category name → DTB category key.
	 *
	 * @var array<string, string>
	 */
	const CATEGORY_MAP = [
		// Taping
		'automatic taping tools'  => 'taping',
		'taping tools'            => 'taping',
		'automatic tapers'        => 'taping',
		'tapers'                  => 'taping',
		// Finishing
		'finishing tools'         => 'finishing',
		'flat boxes'              => 'finishing',
		'finishing boxes'         => 'finishing',
		'angle heads'             => 'finishing',
		'skimming blades'         => 'finishing',
		'accessories & adapters'  => 'finishing',
		'accessories and adapters'=> 'finishing',
		'accessories'             => 'finishing',
		// Corner
		'corner tools'            => 'corner',
		'corner boxes'            => 'corner',
		'corner applicators'      => 'corner',
		// Mud Boxes / Pumps
		'mud boxes'               => 'mudboxes',
		'mud boxes & pumps'       => 'mudboxes',
		'mud boxes and pumps'     => 'mudboxes',
		'loading pumps'           => 'mudboxes',
		'pumps'                   => 'mudboxes',
		// Handles & Extensions
		'handles & extensions'    => 'handles',
		'handles and extensions'  => 'handles',
		'box handles'             => 'handles',
		'angle head handles'      => 'handles',
		'handles'                 => 'handles',
		// Sanding
		'sanding'                 => 'sanding',
		'sanding tools'           => 'sanding',
		'sanders'                 => 'sanding',
		// Stilts
		'stilts'                  => 'stilts',
		'extension tubes & clamps'=> 'stilts',
		'legs & brackets'         => 'stilts',
		'springs & bearings'      => 'stilts',
		'straps & buckles'        => 'stilts',
		'soles & floor plates'    => 'stilts',
		// Texture
		'texture'                 => 'texture',
		'texture tools'           => 'texture',
		'texture sprayers'        => 'texture',
		// Taping tool sets
		'taping tool sets'        => 'taping',
		'tool cases'              => 'taping',
		'tool sets'               => 'taping',
		// Parts
		'parts'                   => 'parts',
		'replacement parts'       => 'parts',
		'parts & accessories'     => 'parts',
		'parts and accessories'   => 'parts',
		// Services
		'services'                => 'services',
		'repair services'         => 'services',
	];

	/**
	 * DTB category key → human-readable label.
	 *
	 * @var array<string, string>
	 */
	const CATEGORY_LABELS = [
		'taping'   => 'Automatic Taping Tools',
		'finishing'=> 'Finishing Tools',
		'corner'   => 'Corner Tools',
		'handles'  => 'Handles & Extensions',
		'mudboxes' => 'Mud Boxes & Pumps',
		'sanding'  => 'Sanding Tools',
		'stilts'   => 'Stilts',
		'texture'  => 'Texture Tools',
		'parts'    => 'Replacement Parts',
		'services' => 'Repair Services',
	];

	/**
	 * Resolve a DTB category identity from a WC product array.
	 *
	 * Priority:
	 *   1. _dtb_category_key meta (explicit)
	 *   2. WC category names mapped through CATEGORY_MAP
	 *
	 * @param  array $wc_categories  WC product categories ([ { id, name, slug } ]).
	 * @param  string $meta_key      Existing _dtb_category_key value (may be empty).
	 * @return array{ key: string, label: string, slug: string }
	 */
	public static function resolve( array $wc_categories, string $meta_key = '' ): array {
		if ( '' !== $meta_key ) {
			return self::from_key( $meta_key );
		}

		foreach ( $wc_categories as $cat ) {
			$name = strtolower( trim( $cat['name'] ?? '' ) );
			if ( isset( self::CATEGORY_MAP[ $name ] ) ) {
				return self::from_key( self::CATEGORY_MAP[ $name ] );
			}
			// Try slug
			$slug = strtolower( trim( $cat['slug'] ?? '' ) );
			// Convert hyphens to spaces for a slug-based lookup
			$slug_as_name = str_replace( '-', ' ', $slug );
			if ( isset( self::CATEGORY_MAP[ $slug_as_name ] ) ) {
				return self::from_key( self::CATEGORY_MAP[ $slug_as_name ] );
			}
		}

		return [ 'key' => '', 'label' => '', 'slug' => '' ];
	}

	/**
	 * Build a category identity from a known DTB category key.
	 *
	 * @param  string $key
	 * @return array{ key: string, label: string, slug: string }
	 */
	public static function from_key( string $key ): array {
		$label = self::CATEGORY_LABELS[ $key ] ?? ucwords( str_replace( '_', ' ', $key ) );
		return [ 'key' => $key, 'label' => $label, 'slug' => $key ];
	}

	/** Returns true when $key is a recognized DTB category key. */
	public static function is_valid_key( string $key ): bool {
		return isset( self::CATEGORY_LABELS[ $key ] );
	}

	// ── Display category normalization ─────────────────────────────────────────

	/**
	 * Canonical display category labels for the customer-facing filter UI.
	 *
	 * @var array<string, string>
	 */
	const DISPLAY_CATEGORY_LABELS = [
		'automatic_tapers'      => 'Automatic Tapers',
		'nail_spotters'         => 'Nail Spotters',
		'finishing_boxes'       => 'Finishing Boxes',
		'handles'               => 'Handles & Extensions',
		'pumps'                 => 'Pumps',
		'corner_tools'          => 'Corner Tools',
		'accessories'           => 'Accessories',
		'smoothing_blades'      => 'Smoothing Blades',
		'toolsets'              => 'Tool Sets & Kits',
		'parts'                 => 'Parts',
		'stilts'                => 'Stilts',
		'semi_automatic_tapers' => 'Semi-Automatic Tapers',
		'predator_family'       => 'Predator Family',
	];

	/**
	 * Alias map: normalized raw value → canonical display-category slug.
	 *
	 * Keys are lowercased and have spaces/hyphens replaced with underscores.
	 * Built from the same mapping used by scripts/fix_display_categories.py.
	 *
	 * @var array<string, string>
	 */
	const DISPLAY_CATEGORY_ALIASES = [
		// Automatic Tapers
		'automatic_taping_tools'    => 'automatic_tapers',
		'automatic_tapers'          => 'automatic_tapers',
		'automatic_taper'           => 'automatic_tapers',
		'taper'                     => 'automatic_tapers',
		'taping_tool'               => 'automatic_tapers',
		'auto_taper'                => 'automatic_tapers',
		// Nail Spotters
		'nail_spotters'             => 'nail_spotters',
		'nail_spotter'              => 'nail_spotters',
		'nailspotter'               => 'nail_spotters',
		'nailspotters'              => 'nail_spotters',
		'spotter'                   => 'nail_spotters',
		// Finishing Boxes
		'finishing_boxes'           => 'finishing_boxes',
		'finishing_box'             => 'finishing_boxes',
		'flat_box'                  => 'finishing_boxes',
		'flatbox'                   => 'finishing_boxes',
		'drywall_box'               => 'finishing_boxes',
		'drywall_finishing_box'     => 'finishing_boxes',
		'maxx_box'                  => 'finishing_boxes',
		'box'                       => 'finishing_boxes',
		// Handles
		'handles'                   => 'handles',
		'handle'                    => 'handles',
		'handles_and_extensions'    => 'handles',
		'handles_&_extensions'      => 'handles',
		'box_handle'                => 'handles',
		'extension_handle'          => 'handles',
		'extension'                 => 'handles',
		'extendable_handle'         => 'handles',
		// Pumps
		'pumps'                     => 'pumps',
		'pump'                      => 'pumps',
		'mud_pans_and_pumps'        => 'pumps',
		'mud_pans_&_pumps'          => 'pumps',
		'mud_pans'                  => 'pumps',
		'loading_pump'              => 'pumps',
		'mud_pump'                  => 'pumps',
		'compound_pump'             => 'pumps',
		// Corner Tools
		'corner_tools'              => 'corner_tools',
		'corner_tool'               => 'corner_tools',
		'corner_finisher'           => 'corner_tools',
		'corner_flusher'            => 'corner_tools',
		'angle_head'                => 'corner_tools',
		'corner_roller'             => 'corner_tools',
		'corner_applicator'         => 'corner_tools',
		'inside_corner_tool'        => 'corner_tools',
		'outside_corner_tool'       => 'corner_tools',
		// Accessories
		'accessories'               => 'accessories',
		'accessory'                 => 'accessories',
		// Smoothing Blades
		'smoothing_blades'          => 'smoothing_blades',
		'smoothing_blade'           => 'smoothing_blades',
		'blade'                     => 'smoothing_blades',
		'skimming_blade'            => 'smoothing_blades',
		// Toolsets
		'toolsets'                  => 'toolsets',
		'toolset'                   => 'toolsets',
		'tool_sets_and_kits'        => 'toolsets',
		'tool_set'                  => 'toolsets',
		'tool_kit'                  => 'toolsets',
		// Parts
		'parts'                     => 'parts',
		'part'                      => 'parts',
		'replacement_parts'         => 'parts',
		// Stilts
		'stilts'                    => 'stilts',
		'stilt'                     => 'stilts',
		// Semi-Automatic Tapers
		'semi_automatic_tapers'     => 'semi_automatic_tapers',
		'semi_automatic_taper'      => 'semi_automatic_tapers',
		// Predator Family
		'predator_family'           => 'predator_family',
		'predator'                  => 'predator_family',
	];

	/**
	 * All raw DB values that could be stored for each canonical display slug.
	 *
	 * Used by CatalogProductRepository to build a comprehensive IN clause that
	 * matches products regardless of how their meta was imported.
	 *
	 * @var array<string, string[]>
	 */
	const DISPLAY_CATEGORY_RAW_FORMS = [
		'automatic_tapers'  => [
			'automatic_tapers', 'automatic tapers', 'Automatic Tapers',
			'automatic_taping_tools', 'automatic taping tools', 'Automatic Taping Tools',
			'automatic_taper', 'auto_taper', 'auto taper', 'Auto Taper', 'taper', 'Taper',
		],
		'nail_spotters'     => [
			'nail_spotters', 'nail spotters', 'Nail Spotters',
			'Nailspotters', 'nailspotters', 'nailspotter', 'Nailspotter',
			'nail_spotter', 'nail spotter', 'Nail Spotter', 'spotter', 'Spotter',
		],
		'finishing_boxes'   => [
			'finishing_boxes', 'finishing boxes', 'Finishing Boxes',
			'finishing_box', 'finishing box', 'flat_box', 'flat box', 'Flat Box',
			'flatbox', 'Flatbox', 'drywall box', 'drywall_box', 'Drywall Box',
			'drywall_finishing_box', 'drywall finishing box', 'box',
		],
		'handles'           => [
			'handles', 'Handles', 'handle', 'Handle',
			'handles_and_extensions', 'handles and extensions', 'Handles and Extensions',
			'handles & extensions', 'Handles & Extensions',
			'box handle', 'box_handle', 'extension handle', 'extension_handle', 'extension',
		],
		'pumps'             => [
			'pumps', 'Pumps', 'pump', 'Pump',
			'mud_pans_and_pumps', 'mud pans and pumps', 'Mud Pans and Pumps',
			'mud pans & pumps', 'Mud Pans & Pumps', 'mud_pans', 'mud pans',
			'loading pump', 'mud pump', 'compound pump',
		],
		'corner_tools'      => [
			'corner_tools', 'corner tools', 'Corner Tools',
			'corner_tool', 'corner tool', 'corner finisher', 'corner flusher',
			'angle head', 'corner roller', 'corner applicator',
		],
		'accessories'       => [ 'accessories', 'Accessories', 'accessory' ],
		'smoothing_blades'  => [
			'smoothing_blades', 'smoothing blades', 'Smoothing Blades',
			'smoothing_blade', 'smoothing blade', 'blade', 'skimming blade',
		],
		'toolsets'          => [
			'toolsets', 'Toolsets', 'toolset',
			'tool_sets_and_kits', 'tool sets and kits', 'Tool Sets and Kits',
			'tool set', 'tool_set', 'tool kit', 'tool_kit',
		],
		'parts'             => [
			'parts', 'Parts', 'part',
			'replacement_parts', 'replacement parts', 'Replacement Parts',
		],
		'stilts'            => [ 'stilts', 'Stilts', 'stilt' ],
		'semi_automatic_tapers' => [
			'semi_automatic_tapers', 'semi automatic tapers', 'Semi Automatic Tapers',
			'semi_automatic_taper',
		],
		'predator_family' => [
			'predator_family', 'predator family', 'Predator Family',
			'predator-family', 'Predator-Family', 'predator', 'Predator',
		],
	];

	/**
	 * Normalize a raw _dtb_display_category_key meta value to a canonical slug.
	 *
	 * Normalises by lowercasing and collapsing whitespace/hyphens to underscores
	 * before looking up in DISPLAY_CATEGORY_ALIASES.
	 *
	 * @param  string $raw  Raw stored meta value (e.g. 'Nail Spotters', 'nailspotters').
	 * @return string       Canonical slug (e.g. 'nail_spotters'), or sanitized raw fallback.
	 */
	public static function canonical_display_slug( string $raw ): string {
		if ( '' === $raw ) {
			return '';
		}

		// Normalize: lowercase, collapse any space/hyphen/underscore run to single underscore.
		$lookup = strtolower( trim( preg_replace( '/[\s\-]+/', '_', $raw ) ?? $raw ) );
		if ( isset( self::DISPLAY_CATEGORY_ALIASES[ $lookup ] ) ) {
			return self::DISPLAY_CATEGORY_ALIASES[ $lookup ];
		}

		// Direct match without transformation (handles already-normalized values).
		$lower = strtolower( trim( $raw ) );
		if ( isset( self::DISPLAY_CATEGORY_ALIASES[ $lower ] ) ) {
			return self::DISPLAY_CATEGORY_ALIASES[ $lower ];
		}

		// Unknown value: sanitize and return as-is so it still functions.
		return str_replace( '-', '_', sanitize_title( $raw ) );
	}

	/**
	 * Return all raw DB value variants for a canonical display category slug.
	 *
	 * Used to build a comprehensive meta_query IN clause that matches products
	 * regardless of how _dtb_display_category_key was stored during import.
	 *
	 * @param  string   $canonical_slug  e.g. 'nail_spotters'
	 * @return string[]
	 */
	public static function display_category_raw_forms( string $canonical_slug ): array {
		if ( '' === $canonical_slug ) {
			return [];
		}

		$known = self::DISPLAY_CATEGORY_RAW_FORMS[ $canonical_slug ] ?? [];

		if ( ! empty( $known ) ) {
			return $known;
		}

		// Fallback: generate the 3 standard normalised forms for unknown slugs.
		$space_form = str_replace( '_', ' ', $canonical_slug );
		$title_form = ucwords( $space_form );

		return array_values( array_unique( array_filter( [
			$canonical_slug,
			$space_form,
			$title_form,
		] ) ) );
	}
}
