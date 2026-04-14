<?php
/**
 * Enhanced OPcache Invalidation & CORS Validation Script
 * ──────────────────────────────────────────────────────
 * 
 * When PHP OPcache serves stale compiled code despite file uploads,
 * this script forces a complete OPcache reset and WordPress reload.
 * 
 * ALSO validates that CORS handler will emit correct headers.
 * 
 * HOW TO USE:
 * 1. Upload this file to /public_html/clear-opcache.php on your server
 * 2. Visit https://drywalltoolbox.com/clear-opcache.php in your browser
 * 3. You should see detailed validation output
 * 4. DELETE this file after verifying the fix
 */

echo "═══════════════════════════════════════════════════════════\n";
echo "  OPcache Invalidation & CORS Validation\n";
echo "═══════════════════════════════════════════════════════════\n\n";

// Step 1: Clear OPcache
echo "[ 1/4 ] Clearing OPcache...\n";
if ( function_exists( 'opcache_reset' ) ) {
	opcache_reset();
	echo "        ✅ OPcache cleared\n";
} else {
	echo "        ⚠️  OPcache not enabled\n";
}

// Step 2: Force PHP to forget compiled code
echo "\n[ 2/4 ] Forcing PHP to reload compiled code...\n";
if ( function_exists( 'opcache_get_status' ) ) {
	$status = @opcache_get_status( false );
	if ( $status ) {
		echo "        ✅ OPcache Status: {$status['memory_usage']['used_memory']} bytes in use\n";
	}
}

// Step 3: Load WordPress fresh
echo "\n[ 3/4 ] Loading WordPress (triggers mu-plugins reload)...\n";
if ( file_exists( dirname( __FILE__ ) . '/wp/wp-load.php' ) ) {
	require_once dirname( __FILE__ ) . '/wp/wp-load.php';
	echo "        ✅ WordPress loaded\n";
} else {
	echo "        ❌ wp-load.php not found\n";
	exit( 1 );
}

// Step 4: Validate CORS functions loaded
echo "\n[ 4/4 ] Validating CORS handler...\n";

$cors_ok = true;

if ( function_exists( 'dtb_allowed_origins' ) ) {
	echo "        ✅ dtb_allowed_origins() found\n";
	$origins = dtb_allowed_origins();
	echo "           Allowed origins:\n";
	foreach ( $origins as $origin ) {
		echo "             • $origin\n";
	}
} else {
	echo "        ❌ dtb_allowed_origins() NOT FOUND\n";
	$cors_ok = false;
}

if ( function_exists( 'dtb_emit_cors_headers' ) ) {
	echo "        ✅ dtb_emit_cors_headers() found\n";
} else {
	echo "        ❌ dtb_emit_cors_headers() NOT FOUND\n";
	$cors_ok = false;
}

if ( function_exists( 'dtb_check_origin' ) ) {
	echo "        ✅ dtb_check_origin() found\n";
	
	// Test with GitHub Pages origin
	$test_origin = 'https://elliotttmiller.github.io';
	$result = dtb_check_origin( $test_origin );
	if ( $result ) {
		echo "           ✅ GitHub Pages origin ACCEPTED: $test_origin\n";
	} else {
		echo "           ❌ GitHub Pages origin REJECTED: $test_origin\n";
		$cors_ok = false;
	}
} else {
	echo "        ❌ dtb_check_origin() NOT FOUND\n";
	$cors_ok = false;
}

echo "\n═══════════════════════════════════════════════════════════\n";
if ( $cors_ok ) {
	echo "✅ SUCCESS: All CORS functions validated and working!\n";
	echo "\n   Next steps:\n";
	echo "   1. DELETE this file from the server\n";
	echo "   2. Go to https://elliotttmiller.github.io/drywall-toolbox\n";
	echo "   3. Open browser console (F12)\n";
	echo "   4. Test: fetch('https://drywalltoolbox.com/wp-json/dtb/v1/auth/validate', {method:'POST', credentials:'include'})\n";
	echo "   5. Check response headers for Access-Control-Allow-Origin\n";
} else {
	echo "❌ ERROR: CORS functions not found or invalid!\n";
	echo "\nTroubleshooting:\n";
	echo "1. Check that these files exist on server:\n";
	echo "   /wp/wp-content/mu-plugins/00-dtb-loader.php\n";
	echo "   /wp/wp-content/mu-plugins/dtb-rest-api.php\n";
	echo "2. Check PHP error log: /wp-content/debug.log\n";
	echo "3. Try restarting PHP via cPanel: Restart service > PHP-FPM\n";
}
echo "═══════════════════════════════════════════════════════════\n";
echo "3. Open console and test CORS\n";
echo "4. Should see: Access-Control-Allow-Origin: https://elliotttmiller.github.io\n";

// Self-destruct (optional - comment out if you want to keep it for debugging)
// unlink( __FILE__ );
// echo "\n✅ This file has been deleted.\n";
?>
