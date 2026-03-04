<?php
/**
 * The front page / home page template
 *
 * @package Drywall_Toolbox
 */

get_header();
?>

<!-- Hero Section -->
<div class="hero">
    <?php
        // Display logo
        echo drywall_toolbox_get_logo();
    ?>
    <h1 class="coming-soon"><?php echo esc_html( get_theme_mod( 'hero_title', 'COMING SOON' ) ); ?></h1>
    <p class="tagline"><?php echo esc_html( get_theme_mod( 'hero_tagline', 'PRODUCTION-GRADE | UNBEATABLE PRICES | LIGHTNING-FAST SHIPPING' ) ); ?></p>
</div>

<!-- Form Section -->
<div class="form-section">
    <p class="form-description"><?php echo esc_html( get_theme_mod( 'form_description', 'BE THE FIRST TO KNOW WHEN WE LAUNCH. SIGN UP FOR EARLY ACCESS.' ) ); ?></p>
    <form class="form-container" id="emailForm">
        <input 
            type="email" 
            class="email-input" 
            placeholder="<?php echo esc_attr__( 'EMAIL ADDRESS', 'drywall-toolbox' ); ?>" 
            id="emailInput"
            required
        >
        <button type="submit" class="signup-btn">
            <?php echo esc_html( get_theme_mod( 'form_button', 'SIGN UP' ) ); ?>
        </button>
        <?php wp_nonce_field( 'drywall_toolbox_nonce', 'nonce' ); ?>
    </form>
</div>

<!-- Divider -->
<div class="divider"></div>

<!-- Social Section -->
<div class="social-section">
    <p class="follow-header"><?php echo esc_html( get_theme_mod( 'social_title', 'FOLLOW US' ) ); ?></p>
    <div class="social-links">
        <?php
            $social_links = drywall_toolbox_get_social_links();
            $icons = array(
                'instagram' => '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm5.5-8.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" fill="currentColor"/></svg>',
                'facebook'  => '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
                'twitter'   => '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.207-6.802-5.974 6.802H2.882l7.687-8.802L2.288 2.25h6.826l4.721 6.24 5.727-6.24zM17.15 18.75h1.828L5.594 3.75H3.61L17.15 18.75z"/></svg>',
            );

            foreach ( $social_links as $platform => $url ) {
                if ( ! empty( $url ) ) {
                    $icon = isset( $icons[ $platform ] ) ? $icons[ $platform ] : '';
                    $label = ucfirst( $platform );
                    echo sprintf(
                        '<a href="%s" class="social-link" target="_blank" rel="noopener noreferrer" title="%s">%s</a>',
                        esc_url( $url ),
                        esc_attr( $label ),
                        $icon
                    );
                }
            }
        ?>
    </div>
</div>

<?php
get_footer();
