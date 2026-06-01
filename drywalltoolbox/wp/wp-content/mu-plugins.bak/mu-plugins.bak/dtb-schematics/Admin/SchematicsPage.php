<?php
/**
 * DTB Schematics — SchematicsPage
 *
 * Renders dtb-schematics — schematic management tool.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_schematics_render_page(): void {
	if ( ! current_user_can( 'dtb_manage_schematics' ) ) {
		dtb_admin_shell_access_denied();
		return;
	}

	$search = sanitize_text_field( $_GET['s'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$paged  = max( 1, (int) ( $_GET['paged'] ?? 1 ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$per    = (int) get_option( 'dtb_admin_items_per_page', 25 );
	$base   = admin_url( 'admin.php?page=dtb-schematics' );

	dtb_admin_shell_open( [
		'title'    => __( 'Schematics', 'drywall-toolbox' ),
		'subtitle' => __( 'Manage product schematics and hotspot mappings.', 'drywall-toolbox' ),
		'section'  => 'tools',
		'page'     => 'dtb-schematics',
		'template' => 'tool',
		'icon'     => 'dashicons-editor-ul',
	] );

	dtb_admin_ui_toolbar_open();
	echo '<form method="get" style="display:contents">';
	echo '<input type="hidden" name="page" value="dtb-schematics">';
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_input( 's', $search, [ 'placeholder' => __( 'Search schematics…', 'drywall-toolbox' ) ] );
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_button( __( 'Search', 'drywall-toolbox' ), [ 'type' => 'secondary', 'attr' => 'type="submit"', 'size' => 'sm' ] );
	echo '</form>';
	dtb_admin_ui_toolbar_spacer();
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_button( __( 'New Schematic', 'drywall-toolbox' ), [
		'href' => admin_url( 'post-new.php?post_type=dtb_schematic' ),
		'icon' => 'dashicons-plus-alt2',
		'size' => 'sm',
	] );
	dtb_admin_ui_toolbar_close();

	$query = new WP_Query( [
		'post_type'      => 'dtb_schematic',
		'post_status'    => 'publish',
		'posts_per_page' => $per,
		'paged'          => $paged,
		's'              => $search,
	] );

	if ( ! $query->have_posts() ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_empty_state( __( 'No schematics found', 'drywall-toolbox' ), __( 'Upload a schematic image and map hotspots to create your first schematic.', 'drywall-toolbox' ), [
			'action_label' => __( 'New Schematic', 'drywall-toolbox' ),
			'action_href'  => admin_url( 'post-new.php?post_type=dtb_schematic' ),
		] );
		dtb_admin_shell_close();
		return;
	}

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo dtb_admin_ui_table_open( [
		[ 'label' => __( 'Title', 'drywall-toolbox' ),    'key' => 'title' ],
		[ 'label' => __( 'Brand', 'drywall-toolbox' ),    'key' => 'brand' ],
		[ 'label' => __( 'Model', 'drywall-toolbox' ),    'key' => 'model' ],
		[ 'label' => __( 'Hotspots', 'drywall-toolbox' ), 'key' => 'hotspots' ],
		[ 'label' => __( 'Updated', 'drywall-toolbox' ),  'key' => 'updated' ],
		[ 'label' => '', 'key' => 'actions' ],
	], [] );

	while ( $query->have_posts() ) {
		$query->the_post();
		$id       = get_the_ID();
		$brand    = get_post_meta( $id, '_dtb_schematic_brand', true ) ?: '—';
		$model    = get_post_meta( $id, '_dtb_schematic_model', true ) ?: '—';
		$hotspots = count( (array) get_post_meta( $id, '_dtb_schematic_hotspots', true ) );

		echo '<tr>';
		echo '<td><a href="' . esc_url( get_edit_post_link( $id ) ) . '">' . esc_html( get_the_title() ) . '</a></td>';
		echo '<td>' . esc_html( $brand ) . '</td>';
		echo '<td>' . esc_html( $model ) . '</td>';
		echo '<td>' . esc_html( $hotspots ) . '</td>';
		echo '<td>' . esc_html( get_the_modified_date() ) . '</td>';
		echo '<td>';
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo dtb_admin_ui_button( __( 'Edit', 'drywall-toolbox' ), [ 'href' => get_edit_post_link( $id ), 'size' => 'xs', 'type' => 'ghost' ] );
		echo '</td>';
		echo '</tr>';
	}
	wp_reset_postdata();

	echo dtb_admin_ui_table_close();
	dtb_admin_shell_close();
}
