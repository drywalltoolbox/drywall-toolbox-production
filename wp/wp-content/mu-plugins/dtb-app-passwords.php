<?php
/**
 * Plugin Name: DTB Application Passwords Manager
 * Description: Enable and manage Application Passwords for WooCommerce REST API access
 * Version: 1.0.0
 * Author: Drywall Toolbox
 * 
 * Must-use plugin: Place in wp/wp-content/mu-plugins/
 */

// Ensure WP_Application_Passwords class is available
if ( ! class_exists( 'WP_Application_Passwords' ) ) {
	require_once ABSPATH . 'wp-includes/class-wp-application-passwords.php';
}

// Log plugin activation for debugging
if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
	error_log( 'DTB Application Passwords plugin loaded' );
}

// Add REST API endpoint to create application passwords
add_action( 'rest_api_init', function() {
	register_rest_route( 'dtb/v1', '/create-app-password', array(
		'methods'             => 'POST',
		'callback'            => 'dtb_create_app_password',
		'permission_callback' => '__return_true',
		'args'                => array(
			'username'  => array(
				'required'          => true,
				'sanitize_callback' => 'sanitize_user',
				'description'       => 'WordPress username',
			),
			'password'  => array(
				'required'          => true,
				'sanitize_callback' => 'sanitize_text_field',
				'description'       => 'WordPress password',
			),
			'app_name'  => array(
				'required'          => false,
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => 'Drywall Toolbox',
				'description'       => 'Application name',
			),
		),
	) );
} );

/**
 * Create an application password for a user
 * 
 * Usage: POST /wp-json/dtb/v1/create-app-password
 * Body: {
 *   "username": "your-wordpress-username",
 *   "password": "your-wordpress-password",
 *   "app_name": "Drywall Toolbox Frontend"
 * }
 */
function dtb_create_app_password( $request ) {
	try {
		$username = sanitize_user( $request->get_param( 'username' ) );
		$password = $request->get_param( 'password' );
		$app_name = sanitize_text_field( $request->get_param( 'app_name' ) ) ?: 'Drywall Toolbox';

		if ( empty( $username ) || empty( $password ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => 'Username and password are required',
				),
				400
			);
		}

		// Verify user credentials
		$user = wp_authenticate( $username, $password );
		
		if ( ! $user || is_wp_error( $user ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => 'Invalid username or password',
					'error'   => is_wp_error( $user ) ? $user->get_error_message() : 'Unknown error',
				),
				401
			);
		}

		// Ensure Application Passwords class is loaded
		if ( ! class_exists( 'WP_Application_Passwords' ) ) {
			require_once ABSPATH . 'wp-includes/class-wp-application-passwords.php';
		}

		// Create the application password
		$result = WP_Application_Passwords::create_new_application_password(
			$user->ID,
			$app_name,
			array()
		);

		if ( is_wp_error( $result ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => 'Failed to create application password',
					'error'   => $result->get_error_message(),
				),
				500
			);
		}

		// $result is array: [ 'password' => 'xxxx xxxx xxxx xxxx' ]
		$password_string = isset( $result[0] ) ? $result[0] : '';

		if ( empty( $password_string ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => 'Application password was created but password string is empty',
				),
				500
			);
		}

		return new WP_REST_Response(
			array(
				'success'  => true,
				'message'  => 'Application password created successfully',
				'username' => $username,
				'password' => $password_string,
				'app_name' => $app_name,
				'note'     => 'Use these credentials for WooCommerce REST API access. Password will not be shown again.',
			),
			200
		);
	} catch ( Exception $e ) {
		return new WP_REST_Response(
			array(
				'success' => false,
				'message' => 'An error occurred',
				'error'   => $e->getMessage(),
			),
			500
		);
	}
}

// Simpler approach: Just ensure Application Passwords work without admin UI for now
// Once deployed and tested, we can add the admin UI back
