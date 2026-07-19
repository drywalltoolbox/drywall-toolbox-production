<?php
/**
 * Branded native WooCommerce single-product document.
 *
 * Product form rendering remains delegated to WooCommerce. The official Stripe
 * extension therefore owns its Express Checkout Element and payment lifecycle.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

$storefront_base_path = function_exists( 'dtb_detect_storefront_base_path' )
	? dtb_detect_storefront_base_path()
	: '';
$storefront_url = static function ( string $path = '/' ) use ( $storefront_base_path ): string {
	return home_url( $storefront_base_path . '/' . ltrim( $path, '/' ) );
};
$cart_count = function_exists( 'WC' ) && WC()->cart ? WC()->cart->get_cart_contents_count() : 0;
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'dtb-native-product-document' ); ?>>
<?php wp_body_open(); ?>
	<header class="dtb-product-header">
		<div class="dtb-product-header__inner">
			<a class="dtb-product-header__brand" href="<?php echo esc_url( $storefront_url() ); ?>" aria-label="<?php esc_attr_e( 'Drywall Toolbox home', 'drywall-toolbox' ); ?>">
				<img src="<?php echo esc_url( home_url( '/logos/drywall-logo-white.png' ) ); ?>" alt="<?php esc_attr_e( 'Drywall Toolbox', 'drywall-toolbox' ); ?>">
			</a>
			<nav class="dtb-product-header__nav" aria-label="<?php esc_attr_e( 'Store navigation', 'drywall-toolbox' ); ?>">
				<a href="<?php echo esc_url( $storefront_url( 'products/' ) ); ?>"><?php esc_html_e( 'Shop', 'drywall-toolbox' ); ?></a>
				<a href="<?php echo esc_url( $storefront_url( 'schematics/' ) ); ?>"><?php esc_html_e( 'Schematics', 'drywall-toolbox' ); ?></a>
				<a href="<?php echo esc_url( $storefront_url( 'calculators/' ) ); ?>"><?php esc_html_e( 'Calculators', 'drywall-toolbox' ); ?></a>
				<a href="<?php echo esc_url( $storefront_url( 'repairs/' ) ); ?>"><?php esc_html_e( 'Repair services', 'drywall-toolbox' ); ?></a>
			</nav>
			<div class="dtb-product-header__actions">
				<a href="<?php echo esc_url( $storefront_url( 'products/' ) ); ?>" aria-label="<?php esc_attr_e( 'Search products', 'drywall-toolbox' ); ?>">
					<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>
				</a>
				<a href="<?php echo esc_url( $storefront_url( 'dashboard/' ) ); ?>" aria-label="<?php esc_attr_e( 'Your account', 'drywall-toolbox' ); ?>">
					<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"></circle><path d="M4.5 21a7.5 7.5 0 0 1 15 0"></path></svg>
				</a>
				<a class="dtb-product-header__cart" href="<?php echo esc_url( $storefront_url( 'cart/' ) ); ?>" aria-label="<?php echo esc_attr( sprintf( __( 'Cart with %d items', 'drywall-toolbox' ), $cart_count ) ); ?>">
					<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20.5 7H6"></path><circle cx="10" cy="20" r="1"></circle><circle cx="17" cy="20" r="1"></circle></svg>
					<?php if ( $cart_count > 0 ) : ?>
						<span><?php echo esc_html( (string) min( 99, $cart_count ) ); ?></span>
					<?php endif; ?>
				</a>
			</div>
		</div>
	</header>

	<main id="primary" class="dtb-native-product-main" role="main">
		<nav class="dtb-product-breadcrumb" aria-label="<?php esc_attr_e( 'Breadcrumb', 'drywall-toolbox' ); ?>">
			<a href="<?php echo esc_url( $storefront_url() ); ?>"><?php esc_html_e( 'Home', 'drywall-toolbox' ); ?></a>
			<span aria-hidden="true">/</span>
			<a href="<?php echo esc_url( $storefront_url( 'products/' ) ); ?>"><?php esc_html_e( 'Products', 'drywall-toolbox' ); ?></a>
			<?php if ( is_singular( 'product' ) ) : ?>
				<span aria-hidden="true">/</span>
				<span aria-current="page"><?php echo esc_html( get_the_title() ); ?></span>
			<?php endif; ?>
		</nav>

		<?php
		if ( have_posts() ) {
			while ( have_posts() ) {
				the_post();
				wc_get_template_part( 'content', 'single-product' );
			}
		} else {
			status_header( 404 );
			?>
			<section class="dtb-product-not-found">
				<p class="dtb-product-not-found__eyebrow"><?php esc_html_e( 'Product unavailable', 'drywall-toolbox' ); ?></p>
				<h1><?php esc_html_e( 'We could not find that product.', 'drywall-toolbox' ); ?></h1>
				<p><?php esc_html_e( 'It may have moved or is no longer available.', 'drywall-toolbox' ); ?></p>
				<a href="<?php echo esc_url( $storefront_url( 'products/' ) ); ?>"><?php esc_html_e( 'Browse all products', 'drywall-toolbox' ); ?></a>
			</section>
			<?php
		}
		?>
	</main>

	<footer class="dtb-product-footer">
		<div>
			<strong><?php esc_html_e( 'Professional tools. Secure checkout.', 'drywall-toolbox' ); ?></strong>
			<span><?php esc_html_e( 'Payments are processed by WooCommerce and Stripe.', 'drywall-toolbox' ); ?></span>
		</div>
		<a href="<?php echo esc_url( $storefront_url( 'support/' ) ); ?>"><?php esc_html_e( 'Need help?', 'drywall-toolbox' ); ?></a>
	</footer>
<?php wp_footer(); ?>
</body>
</html>
