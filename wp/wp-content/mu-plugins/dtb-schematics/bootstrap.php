<?php
/**
 * DTB Schematics bootstrap.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

// Domain.
dtb_module_require( 'dtb-schematics/Domain/Schematic.php' );
dtb_module_require( 'dtb-schematics/Domain/SchematicAsset.php' );
dtb_module_require( 'dtb-schematics/Domain/SchematicBrand.php' );
dtb_module_require( 'dtb-schematics/Domain/SchematicPart.php' );

// Infrastructure.
dtb_module_require( 'dtb-schematics/Infrastructure/SchematicManifestRepository.php' );
dtb_module_require( 'dtb-schematics/Infrastructure/SchematicMediaRepository.php' );
dtb_module_require( 'dtb-schematics/Infrastructure/WordPressMediaStore.php' );

// Validation and services.
dtb_module_require( 'dtb-schematics/Validation/SchematicBrandValidator.php' );
dtb_module_require( 'dtb-schematics/Validation/SchematicManifestValidator.php' );
dtb_module_require( 'dtb-schematics/Validation/SchematicMediaValidator.php' );
dtb_module_require( 'dtb-schematics/Services/SchematicMediaService.php' );
dtb_module_require( 'dtb-schematics/Services/SchematicFallbackResolver.php' );
dtb_module_require( 'dtb-schematics/Services/SchematicPartResolver.php' );

// Application.
dtb_module_require( 'dtb-schematics/Application/SyncSchematicMedia.php' );
dtb_module_require( 'dtb-schematics/Application/BuildSchematicManifest.php' );
dtb_module_require( 'dtb-schematics/Application/ResolveSchematicParts.php' );

// REST.
dtb_module_require( 'dtb-schematics/Rest/SchematicMediaController.php' );
dtb_module_require( 'dtb-schematics/Rest/SchematicManifestController.php' );
dtb_module_require( 'dtb-schematics/Rest/SchematicPartsController.php' );

// Admin.
dtb_module_require( 'dtb-schematics/Admin/SchematicAdminMenu.php' );
dtb_module_require( 'dtb-schematics/Admin/SchematicSyncPage.php' );
dtb_module_require( 'dtb-schematics/Admin/SchematicEditorPage.php' );
dtb_module_require( 'dtb-schematics/Admin/SchematicMediaPage.php' );
