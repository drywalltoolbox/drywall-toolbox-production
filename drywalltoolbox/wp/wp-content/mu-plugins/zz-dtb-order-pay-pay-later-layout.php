<?php
/**
 * Plugin Name: DTB Order Pay Pay Later Layout
 * Description: Loads the express-wallet / Pay Later / card-payment order-pay layout stylesheet and the Varela Round font preconnect.
 * Version: 2.0.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

add_action(
'wp_head',
static function (): void {
if ( ! function_exists( 'dtb_wc_payment_runtime_request' ) || ! dtb_wc_payment_runtime_request() ) {
return;
}
?>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Varela+Round&display=swap" rel="stylesheet">
<?php
},
1
);

add_action(
'wp_enqueue_scripts',
static function (): void {
if ( ! function_exists( 'dtb_wc_payment_runtime_request' ) || ! dtb_wc_payment_runtime_request() ) {
return;
}

$asset_path = __DIR__ . '/dtb-platform/assets/payment-runtime-pay-later-layout.css';
if ( ! file_exists( $asset_path ) ) {
return;
}

wp_enqueue_style(
'dtb-payment-runtime-pay-later-layout',
plugin_dir_url( __FILE__ ) . 'dtb-platform/assets/payment-runtime-pay-later-layout.css',
[ 'dtb-payment-runtime' ],
(string) filemtime( $asset_path )
);
},
40
);