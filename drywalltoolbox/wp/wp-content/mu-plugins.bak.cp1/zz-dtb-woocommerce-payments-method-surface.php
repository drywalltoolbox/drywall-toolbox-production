<?php
/**
 * Plugin Name: DTB WooPayments Method Surface
 * Description: Passive compatibility shim. WooPayments payment methods are controlled only by the official WooPayments settings.
 * Version: 1.1.0
 * Author: Drywall Toolbox
 */

defined( 'ABSPATH' ) || exit;

/*
 * This file intentionally performs no runtime mutation.
 *
 * Previous versions modified WooPayments options at runtime to force cards, wallets,
 * and BNPL methods onto the order-pay page. That created duplicate/conflicting rows
 * when WooPayments was already configured through wp-admin and caused Stripe/WooPayments
 * Elements to re-render during payment-method switching.
 *
 * Payment availability must remain source-of-truth in:
 * WooCommerce > Settings > Payments > WooPayments.
 */
