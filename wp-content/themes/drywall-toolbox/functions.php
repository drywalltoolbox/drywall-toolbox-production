<?php
/**
 * Drywall Toolbox Theme Functions and Definitions
 *
 * @package Drywall_Toolbox
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Set up theme defaults and register support for various WordPress features.
 */
function drywall_toolbox_setup() {
    // Add support for block styles
    add_theme_support( 'wp-block-styles' );

    // Add support for wide align blocks
    add_theme_support( 'align-wide' );

    // Add support for responsive embeds
    add_theme_support( 'responsive-embeds' );

    // Add support for editor styles
    add_theme_support( 'editor-styles' );

    // Add Google Fonts
    add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'script', 'style' ) );

    // Add theme support for selective refresh for widgets
    add_theme_support( 'customize-selective-refresh-widgets' );

    // Add support for post thumbnails
    add_theme_support( 'post-thumbnails' );

    // Register navigation menus
    register_nav_menus( array(
        'primary' => esc_html__( 'Primary Menu', 'drywall-toolbox' ),
        'footer'  => esc_html__( 'Footer Menu', 'drywall-toolbox' ),
    ) );

    // Add support for title tag
    add_theme_support( 'title-tag' );

    // Load text domain for translations
    load_theme_textdomain( 'drywall-toolbox', get_template_directory() . '/languages' );
}
add_action( 'after_setup_theme', 'drywall_toolbox_setup' );

/**
 * Enqueue scripts and styles.
 */
function drywall_toolbox_enqueue_scripts() {
    // Enqueue main stylesheet
    wp_enqueue_style( 'drywall-toolbox-style', get_stylesheet_uri(), array(), wp_get_theme()->get( 'Version' ) );

    // Enqueue Google Fonts
    wp_enqueue_style( 'drywall-toolbox-fonts', 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap', array(), null );

    // Enqueue main JavaScript
    wp_enqueue_script( 'drywall-toolbox-main', get_template_directory_uri() . '/js/main.js', array(), wp_get_theme()->get( 'Version' ), true );

    // Localize script for AJAX
    wp_localize_script( 'drywall-toolbox-main', 'drywallToolbox', array(
        'ajaxurl'  => admin_url( 'admin-ajax.php' ),
        'nonce'    => wp_create_nonce( 'drywall_toolbox_nonce' ),
    ) );
}
add_action( 'wp_enqueue_scripts', 'drywall_toolbox_enqueue_scripts' );

/**
 * Handle email signup form submission via AJAX
 */
function drywall_toolbox_email_signup() {
    // Verify nonce
    check_ajax_referer( 'drywall_toolbox_nonce', 'nonce' );

    $email = isset( $_POST['email'] ) ? sanitize_email( $_POST['email'] ) : '';

    if ( empty( $email ) || ! is_email( $email ) ) {
        wp_send_json_error( array( 'message' => 'Please enter a valid email address.' ) );
    }

    // Store email in options (you can later integrate with mailing list service)
    $emails = get_option( 'drywall_toolbox_emails', array() );
    if ( ! is_array( $emails ) ) {
        $emails = array();
    }

    // Avoid duplicates
    if ( ! in_array( $email, $emails, true ) ) {
        $emails[] = $email;
        update_option( 'drywall_toolbox_emails', $emails );
    }

    wp_send_json_success( array( 'message' => 'Thank you! Check your email for updates.' ) );
}
add_action( 'wp_ajax_drywall_toolbox_email_signup', 'drywall_toolbox_email_signup' );
add_action( 'wp_ajax_nopriv_drywall_toolbox_email_signup', 'drywall_toolbox_email_signup' );

/**
 * Get the Drywall Toolbox logo
 */
function drywall_toolbox_get_logo() {
    $logo_id = get_theme_mod( 'custom_logo' );
    if ( $logo_id ) {
        return wp_get_attachment_image( $logo_id, 'full' );
    } else {
        // Fallback to WordPress uploads directory
        return '<img src="' . esc_url( 'https://drywalltoolbox.com/wp-content/uploads/2026/03/logo-white-scaled.png' ) . '" alt="' . esc_attr( get_bloginfo( 'name' ) ) . '" class="logo-img">';
    }
}

/**
 * Custom excerpt length
 */
function drywall_toolbox_excerpt_length( $length ) {
    return 20;
}
add_filter( 'excerpt_length', 'drywall_toolbox_excerpt_length' );

/**
 * Custom excerpt more
 */
function drywall_toolbox_excerpt_more( $more ) {
    return ' ...';
}
add_filter( 'excerpt_more', 'drywall_toolbox_excerpt_more' );

/**
 * Remove WordPress version from header
 */
remove_action( 'wp_head', 'wp_generator' );

/**
 * Disable admin bar for frontend
 */
show_admin_bar( false );

/**
 * Custom logo support
 */
function drywall_toolbox_customize_register( $wp_customize ) {
    $wp_customize->add_setting( 'custom_logo', array(
        'default'           => '',
        'sanitize_callback' => 'absint',
    ) );

    $wp_customize->add_control( new WP_Customize_Image_Control( $wp_customize, 'custom_logo', array(
        'label'    => __( 'Logo', 'drywall-toolbox' ),
        'section'  => 'title_tagline',
        'settings' => 'custom_logo',
    ) ) );
}
add_action( 'customize_register', 'drywall_toolbox_customize_register' );

/**
 * Customize tagline color
 */
function drywall_toolbox_customize_register_colors( $wp_customize ) {
    $wp_customize->add_setting( 'tagline_color', array(
        'default'           => '#ffffff',
        'sanitize_callback' => 'sanitize_hex_color',
    ) );

    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'tagline_color', array(
        'label'   => __( 'Tagline Color', 'drywall-toolbox' ),
        'section' => 'colors',
    ) ) );
}
add_action( 'customize_register', 'drywall_toolbox_customize_register_colors' );

/**
 * Get social links from theme options
 */
function drywall_toolbox_get_social_links() {
    return array(
        'instagram' => get_theme_mod( 'social_instagram', 'https://instagram.com' ),
        'facebook'  => get_theme_mod( 'social_facebook', 'https://facebook.com' ),
        'twitter'   => get_theme_mod( 'social_twitter', 'https://twitter.com' ),
    );
}

/**
 * Register social links customizer settings
 */
function drywall_toolbox_customize_register_social( $wp_customize ) {
    $wp_customize->add_section( 'social_section', array(
        'title'    => __( 'Social Links', 'drywall-toolbox' ),
        'priority' => 120,
    ) );

    $social_networks = array(
        'instagram' => 'Instagram',
        'facebook'  => 'Facebook',
        'twitter'   => 'Twitter',
    );

    foreach ( $social_networks as $key => $label ) {
        $wp_customize->add_setting( 'social_' . $key, array(
            'default'           => 'https://' . strtolower( $label ) . '.com',
            'sanitize_callback' => 'esc_url_raw',
        ) );

        $wp_customize->add_control( 'social_' . $key, array(
            'label'   => __( $label . ' URL', 'drywall-toolbox' ),
            'section' => 'social_section',
            'type'    => 'url',
        ) );
    }
}
add_action( 'customize_register', 'drywall_toolbox_customize_register_social' );
