<?php
defined( 'ABSPATH' ) || exit;

$dtb_customer_association_file = __DIR__ . '/dtb-commerce/Payment/CustomerAssociation.php';

if ( file_exists( $dtb_customer_association_file ) ) {
	require_once $dtb_customer_association_file;
} else {
	error_log( '[DTB] Retired checkout customer association wrapper skipped; canonical commerce bootstrap is active.' );
}

unset( $dtb_customer_association_file );
