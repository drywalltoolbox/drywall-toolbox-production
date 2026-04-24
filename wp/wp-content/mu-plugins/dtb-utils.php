<?php
/**
 * DTB Utilities — Shared helpers for the mu-plugin suite.
 *
 * Loaded after 00-dtb-loader.php (alphabetical order) and before all other
 * mu-plugins, so every file in this directory can call these helpers freely.
 *
 * Functions provided:
 *   dtb_is_rest_api_request()  — true when the current request is a WP REST call
 *   dtb_get_config()           — single lookup of all wp-config.php constants
 *   dtb_get_wc_credentials()   — WC auth pair, only for allowlisted browser origins
 *   dtb_error_envelope()       — uniform JSON error shape used by all DTB endpoints
 *   dtb_get_client_ip()        — real client IP respecting CF / proxy headers
 *   dtb_anonymise_ip()         — GDPR-friendly IP anonymisation before storage
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

// ─── Request detection ────────────────────────────────────────────────────────

/**
 * Return true when the current request is a WordPress REST API request.
 *
 * WordPress sets REST_REQUEST early in wp-includes/rest-api.php, so this
 * constant is reliable from plugins_loaded onward.
 *
 * @return bool
 */
function dtb_is_rest_api_request(): bool {
	return defined( 'REST_REQUEST' ) && REST_REQUEST;
}

/**
 * Return true when the current request is an admin or AJAX request.
 */
function dtb_is_admin_or_ajax_request(): bool {
	if ( function_exists( 'is_admin' ) && is_admin() ) {
		return true;
	}

	if ( function_exists( 'wp_doing_ajax' ) && wp_doing_ajax() ) {
		return true;
	}

	return false;
}

/**
 * Return true when the current request is admin, AJAX, or REST API.
 */
function dtb_is_admin_or_rest_request(): bool {
	return dtb_is_admin_or_ajax_request() || dtb_is_rest_api_request();
}

// ─── Config cache ─────────────────────────────────────────────────────────────

/**
 * Return all DTB wp-config.php constants as a single associative array.
 *
 * Calling defined() once here (at first use) is cheaper than scattering
 * individual defined() checks throughout every route callback.  The result
 * is stored in $GLOBALS so the check runs at most once per request.
 *
 * Keys:
 *   wc_proxy_key      WC REST API consumer key  (WC_PROXY_CONSUMER_KEY)
 *   wc_proxy_secret   WC REST API consumer secret (WC_PROXY_CONSUMER_SECRET)
 *   wc_auth_user      App-password username for browser clients (DTB_WC_AUTH_USER)
 *   wc_auth_pass      App-password string for browser clients   (DTB_WC_AUTH_PASS)
 *   webhook_secret    HMAC secret for webhook validation        (WC_WEBHOOK_SECRET)
 *   import_secret     CI/CD catalog-import auth token          (DTB_IMPORT_SECRET)
 *   jwt_secret        JWT signing secret                        (DRYWALL_JWT_SECRET)
 *   csv_filename      Resolved catalog CSV filename (auto-discovered or fallback)
 *   csv_filenames     Always a single-element array wrapping csv_filename
 *   webhook_delivery  Webhook delivery URL                      (DTB_WEBHOOK_DELIVERY_URL)
 *
 * @return array<string,string>
 */
function dtb_get_config(): array {
	if ( isset( $GLOBALS['_dtb_config_cache'] ) ) {
		return $GLOBALS['_dtb_config_cache'];
	}

	// ── Resolve catalog CSV filename ─────────────────────────────────────────
	// Auto-discovery: scan wc-imports/ for all product-wc-*.csv files and pick
	// the single most-recently modified one (Last Modified / filemtime).
	// Fallback: wp-catalog.csv — used when no product-wc-*.csv file exists yet.
	// No wp-config.php constant needed; simply upload a new product-wc-*.csv
	// via cPanel or WooCommerce → Products → Import and it is picked up
	// automatically on the next request.
	$upload_dir  = wp_upload_dir();
	$wc_imports  = trailingslashit( $upload_dir['basedir'] ) . 'wc-imports/';
	$found       = glob( $wc_imports . 'product-wc-*.csv' ) ?: [];

	$csv_filename = '';
	if ( ! empty( $found ) ) {
		// Sort descending by Last Modified (filemtime) — pick the newest file.
		usort( $found, static function ( string $a, string $b ): int {
			return filemtime( $b ) <=> filemtime( $a );
		} );
		$csv_filename = basename( $found[0] );
	}

	// Fallback to the stable wp-catalog.csv when auto-discovery finds nothing.
	if ( '' === $csv_filename ) {
		$fallback = $wc_imports . 'wp-catalog.csv';
		if ( file_exists( $fallback ) ) {
			$csv_filename = 'wp-catalog.csv';
		}
	}

	$csv_filenames = '' !== $csv_filename ? [ $csv_filename ] : [];

	$GLOBALS['_dtb_config_cache'] = [
		'wc_proxy_key'     => defined( 'WC_PROXY_CONSUMER_KEY' )    ? WC_PROXY_CONSUMER_KEY    : '',
		'wc_proxy_secret'  => defined( 'WC_PROXY_CONSUMER_SECRET' ) ? WC_PROXY_CONSUMER_SECRET : '',
		'wc_auth_user'     => defined( 'DTB_WC_AUTH_USER' )         ? DTB_WC_AUTH_USER         : '',
		'wc_auth_pass'     => defined( 'DTB_WC_AUTH_PASS' )         ? DTB_WC_AUTH_PASS         : '',
		'webhook_secret'   => defined( 'WC_WEBHOOK_SECRET' )        ? WC_WEBHOOK_SECRET        : '',
		'import_secret'    => defined( 'DTB_IMPORT_SECRET' )        ? DTB_IMPORT_SECRET        : '',
		'jwt_secret'       => defined( 'DRYWALL_JWT_SECRET' )       ? DRYWALL_JWT_SECRET       : '',
		// Resolved filename — auto-discovered product-wc-*.csv or wp-catalog.csv fallback.
		'csv_filename'     => $csv_filename,
		// Single-element array for compatibility with multi-file import/stream routes.
		'csv_filenames'    => $csv_filenames,
		'webhook_delivery' => defined( 'DTB_WEBHOOK_DELIVERY_URL' ) ? DTB_WEBHOOK_DELIVERY_URL : 'https://drywalltoolbox.com/wp-json/drywall/v1/webhooks/products',
	];

	return $GLOBALS['_dtb_config_cache'];
}

// ─── Credential helpers ───────────────────────────────────────────────────────

/**
 * Return WooCommerce Application Password credentials for the current request.
 *
 * Credentials are only exposed to browser requests whose Origin header is
 * on the DTB allowlist (defined in 00-dtb-loader.php).  Server-to-server
 * requests (curl, CI, scrapers) receive empty strings so secrets are never
 * leaked outside a browser session.
 *
 * @return array{ auth_user: string, auth_pass: string }
 */
function dtb_get_wc_credentials(): array {
	$raw_origin = isset( $_SERVER['HTTP_ORIGIN'] )
		? rtrim( (string) wp_unslash( $_SERVER['HTTP_ORIGIN'] ), '/' ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		: '';

	$origin_ok = '' !== $raw_origin && in_array( $raw_origin, dtb_allowed_origins(), true );
	$config    = dtb_get_config();

	return [
		'auth_user' => $origin_ok ? $config['wc_auth_user'] : '',
		'auth_pass' => $origin_ok ? $config['wc_auth_pass'] : '',
	];
}

// ─── Error envelope ───────────────────────────────────────────────────────────

/**
 * Build the uniform JSON error envelope used by all DTB REST endpoints.
 *
 * Shape:
 * {
 *   "success": false,
 *   "code":    "snake_case_error_code",
 *   "message": "Human-readable explanation.",
 *   "data":    { "status": 400 }
 * }
 *
 * @param string $code    Machine-readable error code (snake_case).
 * @param string $message Human-readable explanation shown to the client.
 * @param int    $status  HTTP status code to accompany the response.
 * @return array<string,mixed>
 */
function dtb_error_envelope( string $code, string $message, int $status ): array {
	return [
		'success' => false,
		'code'    => $code,
		'message' => $message,
		'data'    => [ 'status' => $status ],
	];
}

// ─── IP helpers ───────────────────────────────────────────────────────────────

/**
 * Determine the real client IP, accounting for Cloudflare and common proxies.
 *
 * Header priority (first valid IP wins):
 *   1. HTTP_CF_CONNECTING_IP  — Cloudflare
 *   2. HTTP_X_FORWARDED_FOR   — load balancers / reverse proxies (first value)
 *   3. HTTP_X_REAL_IP         — Nginx-style single-IP proxy header
 *   4. REMOTE_ADDR            — direct TCP connection (final fallback)
 *
 * @return string A validated IP address string, or '0.0.0.0' if none found.
 */
function dtb_get_client_ip(): string {
	$candidates = [
		'HTTP_CF_CONNECTING_IP',
		'HTTP_X_FORWARDED_FOR',
		'HTTP_X_REAL_IP',
		'REMOTE_ADDR',
	];

	foreach ( $candidates as $key ) {
		if ( empty( $_SERVER[ $key ] ) ) {
			continue;
		}

		// X-Forwarded-For may carry a comma-separated list; take the first entry.
		$raw = sanitize_text_field( wp_unslash( $_SERVER[ $key ] ) );
		$ip  = trim( explode( ',', $raw )[0] );

		if ( filter_var( $ip, FILTER_VALIDATE_IP ) ) {
			return $ip;
		}
	}

	return '0.0.0.0';
}

/**
 * Anonymise an IP address before persisting it (GDPR-friendlier storage).
 *
 *   IPv4 — zeroes the last octet:       203.0.113.42  → 203.0.113.0
 *   IPv6 — keeps the first 48 bits, zeroes the remaining 80 bits.
 *
 * @param string $ip Raw IP address string.
 * @return string    Anonymised IP, or a safe placeholder on parse failure.
 */
function dtb_anonymise_ip( string $ip ): string {
	if ( filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 ) ) {
		$bin = inet_pton( $ip );
		if ( false === $bin ) {
			return '::';
		}
		$bin = substr( $bin, 0, 6 ) . str_repeat( "\x00", 10 );
		return inet_ntop( $bin ) ?: '::';
	}

	$parts = explode( '.', $ip );
	if ( 4 === count( $parts ) ) {
		$parts[3] = '0';
		return implode( '.', $parts );
	}

	return '0.0.0.0';
}
