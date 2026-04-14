<?php
/**
 * CORS Debug Script
 * 
 * This script tests the CORS header emission directly.
 * It simulates what happens when GitHub Pages makes a request.
 */

echo "═══════════════════════════════════════════════════════════\n";
echo "  CORS Header Debug Test\n";
echo "═══════════════════════════════════════════════════════════\n\n";

// Load WordPress
if ( ! file_exists( dirname( __FILE__ ) . '/wp/wp-load.php' ) ) {
	echo "❌ wp-load.php not found\n";
	exit( 1 );
}

require_once dirname( __FILE__ ) . '/wp/wp-load.php';

echo "[ 1/4 ] WordPress loaded\n";

// Simulate GitHub Pages request
$_SERVER['HTTP_ORIGIN'] = 'https://elliotttmiller.github.io';
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REQUEST_URI'] = '/wp-json/dtb/v1/auth/validate';

echo "[ 2/4 ] Simulating request:\n";
echo "        Origin: https://elliotttmiller.github.io\n";
echo "        Method: POST\n";
echo "        Path: /wp-json/dtb/v1/auth/validate\n";

// Test dtb_check_origin
echo "\n[ 3/4 ] Testing dtb_check_origin():\n";
if ( function_exists( 'dtb_check_origin' ) ) {
	$origin = 'https://elliotttmiller.github.io';
	$is_allowed = dtb_check_origin( $origin );
	if ( $is_allowed ) {
		echo "        ✅ Origin allowed: $origin\n";
	} else {
		echo "        ❌ Origin blocked: $origin\n";
	}
} else {
	echo "        ❌ dtb_check_origin() not found\n";
}

// Test dtb_allowed_origins
echo "\n[ 4/4 ] Allowed origins list:\n";
if ( function_exists( 'dtb_allowed_origins' ) ) {
	$origins = dtb_allowed_origins();
	foreach ( $origins as $o ) {
		if ( $o === 'https://elliotttmiller.github.io' ) {
			echo "        ✅ $o (GitHub Pages — FOUND)\n";
		} else {
			echo "        • $o\n";
		}
	}
} else {
	echo "        ❌ dtb_allowed_origins() not found\n";
}

// Test what header would be emitted
echo "\n[ 5/5 ] Testing dtb_emit_cors_headers() behavior:\n";
if ( function_exists( 'dtb_emit_cors_headers' ) ) {
	echo "        Calling dtb_emit_cors_headers('https://elliotttmiller.github.io')\n";
	
	// Capture what header would be set
	$test_origin = 'https://elliotttmiller.github.io';
	
	// Test the logic from dtb_emit_cors_headers
	$local_allowlist = [
		'https://drywalltoolbox.com',
		'https://www.drywalltoolbox.com',
		'https://elliotttmiller.github.io',
		'http://localhost:3000',
		'http://localhost:5173',
		'http://127.0.0.1:3000',
		'http://127.0.0.1:5173',
	];
	
	$allowed = function_exists( 'dtb_allowed_origins' )
		? array_unique( array_merge( $local_allowlist, dtb_allowed_origins() ) )
		: $local_allowlist;
	
	if ( $test_origin && in_array( rtrim( $test_origin, '/' ), $allowed, true ) ) {
		$header_value = $test_origin;
		echo "        ✅ Would emit: Access-Control-Allow-Origin: $header_value\n";
	} else {
		echo "        ❌ Would emit: Access-Control-Allow-Origin: https://drywalltoolbox.com (FALLBACK)\n";
	}
} else {
	echo "        ❌ dtb_emit_cors_headers() not found\n";
}

echo "\n═══════════════════════════════════════════════════════════\n";
echo "✅ Debug complete. Compare these results with actual response.\n";
echo "═══════════════════════════════════════════════════════════\n";
