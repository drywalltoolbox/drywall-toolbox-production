<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the #content div and all content after.
 *
 * @package Drywall_Toolbox
 */

?>
        </div><!-- .container -->

        <!-- Copyright -->
        <div class="copyright">
            <?php
                $year = date( 'Y' );
                /* translators: %d: Current year */
                printf( esc_html__( 'COPYRIGHT © %d. ALL RIGHTS RESERVED.', 'drywall-toolbox' ), $year );
            ?>
        </div>

        <!-- Message Display -->
        <div class="message" id="message"></div>
    </div><!-- #page -->

    <?php wp_footer(); ?>
</body>
</html>
