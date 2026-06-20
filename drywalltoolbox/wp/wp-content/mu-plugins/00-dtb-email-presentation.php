<?php
/**
 * Plugin Name: DTB Early Email Presentation Loader
 * Description: Loads the branded email renderer before the platform bootstrap defines fallback email helpers.
 * Version: 1.0.0
 * Author: Drywall Toolbox
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

$dtb_email_presentation = __DIR__ . '/dtb-email-presentation.php';
if ( file_exists( $dtb_email_presentation ) ) {
	require_once $dtb_email_presentation;
}
