<?php
/**
 * DTB Admin — AdminUi
 *
 * PHP render helpers for all shared DTB UI components.
 * Each function returns an HTML string. Use echo or capture with ob_start.
 *
 * All output is escaped.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

// =============================================================================
// CARD
// =============================================================================

/**
 * Render a DTB card.
 *
 * @param string $body_html   Inner body content (pre-escaped by caller).
 * @param array  $args {
 *   @type string $title       Card title.
 *   @type string $subtitle    Card subtitle.
 *   @type string $header_html Custom header right HTML (actions area).
 *   @type string $footer_html Custom footer HTML.
 *   @type string $modifier    Extra CSS class modifier (e.g. 'dtb-card--accent').
 *   @type string $id          Optional DOM id.
 * }
 * @return string
 */
function dtb_admin_ui_card( string $body_html, array $args = [] ): string {
	$args = wp_parse_args( $args, [
		'title'       => '',
		'subtitle'    => '',
		'header_html' => '',
		'footer_html' => '',
		'modifier'    => '',
		'id'          => '',
	] );

	$id_attr  = $args['id'] ? ' id="' . esc_attr( $args['id'] ) . '"' : '';
	$modifier = $args['modifier'] ? ' ' . esc_attr( $args['modifier'] ) : '';

	$html = '<div class="dtb-card' . $modifier . '"' . $id_attr . '>';

	if ( $args['title'] || $args['header_html'] ) {
		$html .= '<div class="dtb-card__header">';
		$html .= '<div>';
		if ( $args['title'] ) {
			$html .= '<h3 class="dtb-card__title">' . esc_html( $args['title'] ) . '</h3>';
		}
		if ( $args['subtitle'] ) {
			$html .= '<p class="dtb-card__subtitle">' . esc_html( $args['subtitle'] ) . '</p>';
		}
		$html .= '</div>';
		if ( $args['header_html'] ) {
			$html .= '<div class="dtb-card__actions">' . $args['header_html'] . '</div>';
		}
		$html .= '</div>';
	}

	$html .= '<div class="dtb-card__body">' . $body_html . '</div>';

	if ( $args['footer_html'] ) {
		$html .= '<div class="dtb-card__footer">' . $args['footer_html'] . '</div>';
	}

	$html .= '</div>';

	return $html;
}

// =============================================================================
// KPI WIDGET
// =============================================================================

/**
 * Render a KPI widget.
 *
 * @param string|int $value  Numeric value or formatted string.
 * @param string     $label  Metric label.
 * @param array      $args {
 *   @type string $icon       Dashicon class (e.g. 'dashicons-cart').
 *   @type string $icon_color 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral'.
 *   @type string $trend      Optional trend string (e.g. '↑ 12%').
 *   @type string $trend_dir  'up' | 'down' | 'flat'.
 *   @type string $href       Makes the widget a link/redirect card.
 * }
 * @return string
 */
function dtb_admin_ui_kpi( $value, string $label, array $args = [] ): string {
	$args = wp_parse_args( $args, [
		'icon'       => 'dashicons-chart-bar',
		'icon_color' => 'primary',
		'trend'      => '',
		'trend_dir'  => 'flat',
		'href'       => '',
	] );

	$tag      = $args['href'] ? 'a' : 'div';
	$href_att = $args['href'] ? ' href="' . esc_url( $args['href'] ) . '"' : '';

	$html  = '<' . $tag . ' class="dtb-kpi"' . $href_att . '>';
	$html .= '<div class="dtb-kpi__icon dtb-kpi__icon--' . esc_attr( $args['icon_color'] ) . '">';
	$html .= '<span class="dashicons ' . esc_attr( $args['icon'] ) . '" aria-hidden="true"></span>';
	$html .= '</div>';
	$html .= '<div class="dtb-kpi__content">';
	$html .= '<div class="dtb-kpi__value">' . esc_html( (string) $value ) . '</div>';
	$html .= '<div class="dtb-kpi__label">' . esc_html( $label ) . '</div>';

	if ( $args['trend'] ) {
		$html .= '<div class="dtb-kpi__trend dtb-kpi__trend--' . esc_attr( $args['trend_dir'] ) . '">'
			. esc_html( $args['trend'] ) . '</div>';
	}

	$html .= '</div>';
	$html .= '</' . $tag . '>';

	return $html;
}

// =============================================================================
// BADGE
// =============================================================================

/**
 * Render a status badge.
 *
 * @param string $label
 * @param string $type    'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' | 'processing'
 * @param bool   $dot     Show dot indicator.
 * @return string
 */
function dtb_admin_ui_badge( string $label, string $type = 'neutral', bool $dot = false ): string {
	$dot_class = $dot ? ' dtb-badge--dot' : '';
	return '<span class="dtb-badge dtb-badge--' . esc_attr( $type ) . $dot_class . '">'
		. esc_html( $label )
		. '</span>';
}

/**
 * Map a workflow status string to a badge type.
 *
 * @param string $status
 * @return string badge type
 */
function dtb_admin_ui_status_badge_type( string $status ): string {
	$map = [
		// Generic
		'active'     => 'success',
		'complete'   => 'success',
		'completed'  => 'success',
		'closed'     => 'neutral',
		'cancelled'  => 'neutral',
		'canceled'   => 'neutral',
		'pending'    => 'warning',
		'failed'     => 'danger',
		'error'      => 'danger',
		'new'        => 'primary',
		'open'       => 'primary',
		'processing' => 'processing',
		'in_progress' => 'processing',

		// Orders
		'on-hold'    => 'warning',
		'refunded'   => 'neutral',

		// Repairs
		'awaiting_review'        => 'warning',
		'awaiting_quote_approval' => 'warning',
		'awaiting_parts'         => 'info',
		'in_repair'              => 'processing',
		'ready_to_ship'          => 'success',
		'shipped'                => 'success',

		// Returns
		'submitted'        => 'primary',
		'under_review'     => 'warning',
		'approved'         => 'success',
		'rejected'         => 'danger',
		'label_issued'     => 'info',
		'in_transit'       => 'processing',
		'received'         => 'info',
		'inspection_pending' => 'warning',
		'refund_pending'   => 'warning',
		'exchange_pending' => 'warning',
		'store_credit_pending' => 'warning',

		// Support
		'needs_reply'    => 'danger',
		'pending_staff'  => 'warning',
		'resolved'       => 'success',
		'spam'           => 'neutral',
	];

	return $map[ $status ] ?? 'neutral';
}

// =============================================================================
// BUTTON
// =============================================================================

/**
 * Render a button.
 *
 * @param string $label
 * @param array  $args {
 *   @type string $type       'primary' | 'secondary' | 'danger' | 'ghost' | 'accent'. Default 'secondary'.
 *   @type string $size       'sm' | '' | 'lg'. Default ''.
 *   @type string $icon       Optional dashicon class.
 *   @type string $href       Renders an <a> tag.
 *   @type string $btn_type   'button' | 'submit' | 'reset'. Default 'button'.
 *   @type string $id         DOM id.
 *   @type string $name       Form field name.
 *   @type string $value      Form field value.
 *   @type string $class      Extra CSS classes.
 *   @type array  $data       Extra data attributes as key => value.
 *   @type bool   $disabled   Disabled state.
 *   @type string $confirm    data-dtb-confirm text.
 * }
 * @return string
 */
function dtb_admin_ui_button( string $label, array $args = [] ): string {
	$args = wp_parse_args( $args, [
		'type'     => 'secondary',
		'size'     => '',
		'icon'     => '',
		'href'     => '',
		'btn_type' => 'button',
		'id'       => '',
		'name'     => '',
		'value'    => '',
		'class'    => '',
		'data'     => [],
		'disabled' => false,
		'confirm'  => '',
	] );

	$classes   = 'dtb-btn dtb-btn--' . $args['type'];
	if ( $args['size'] ) $classes .= ' dtb-btn--' . $args['size'];
	if ( $args['class'] ) $classes .= ' ' . $args['class'];

	$attrs  = ' class="' . esc_attr( $classes ) . '"';
	if ( $args['id'] )      $attrs .= ' id="' . esc_attr( $args['id'] ) . '"';
	if ( $args['disabled'] ) $attrs .= ' disabled aria-disabled="true"';
	if ( $args['confirm'] ) $attrs .= ' data-dtb-confirm="' . esc_attr( $args['confirm'] ) . '"';

	foreach ( (array) $args['data'] as $k => $v ) {
		$attrs .= ' data-' . esc_attr( $k ) . '="' . esc_attr( (string) $v ) . '"';
	}

	$icon_html = $args['icon']
		? '<span class="dashicons ' . esc_attr( $args['icon'] ) . '" aria-hidden="true"></span>'
		: '';

	if ( $args['href'] ) {
		return '<a href="' . esc_url( $args['href'] ) . '"' . $attrs . '>'
			. $icon_html . esc_html( $label ) . '</a>';
	}

	$name_val = '';
	if ( $args['name'] )  $name_val .= ' name="' . esc_attr( $args['name'] ) . '"';
	if ( $args['value'] ) $name_val .= ' value="' . esc_attr( $args['value'] ) . '"';

	return '<button type="' . esc_attr( $args['btn_type'] ) . '"' . $attrs . $name_val . '>'
		. $icon_html . esc_html( $label ) . '</button>';
}

// =============================================================================
// ALERT
// =============================================================================

/**
 * Render an alert/notice.
 *
 * @param string $message
 * @param string $type        'success' | 'warning' | 'danger' | 'info'.
 * @param string $title       Optional title.
 * @param bool   $dismissible Show close button.
 * @return string
 */
function dtb_admin_ui_alert( string $message, string $type = 'info', string $title = '', bool $dismissible = true ): string {
	$icon_map = [
		'success' => 'dashicons-yes-alt',
		'warning' => 'dashicons-flag',
		'danger'  => 'dashicons-warning',
		'info'    => 'dashicons-info',
	];
	$icon = $icon_map[ $type ] ?? 'dashicons-info';

	$html  = '<div class="dtb-alert dtb-alert--' . esc_attr( $type ) . '" role="alert">';
	$html .= '<span class="dtb-alert__icon dashicons ' . esc_attr( $icon ) . '" aria-hidden="true"></span>';
	$html .= '<div class="dtb-alert__body">';

	if ( $title ) {
		$html .= '<p class="dtb-alert__title">' . esc_html( $title ) . '</p>';
	}

	$html .= '<p class="dtb-alert__text">' . esc_html( $message ) . '</p>';
	$html .= '</div>';

	if ( $dismissible ) {
		$html .= '<button type="button" class="dtb-alert__close" aria-label="' . esc_attr__( 'Dismiss', 'drywall-toolbox' ) . '">&#10005;</button>';
	}

	$html .= '</div>';

	return $html;
}

// =============================================================================
// EMPTY STATE
// =============================================================================

/**
 * Render an empty state.
 *
 * @param string $title
 * @param string $description
 * @param array  $args {
 *   @type string $icon       Dashicon class.
 *   @type string $action_html Optional action button HTML.
 * }
 * @return string
 */
function dtb_admin_ui_empty_state( string $title, string $description = '', array $args = [] ): string {
	$args = wp_parse_args( $args, [
		'icon'        => 'dashicons-inbox',
		'action_html' => '',
	] );

	$html  = '<div class="dtb-empty-state">';
	$html .= '<div class="dtb-empty-state__icon">';
	$html .= '<span class="dashicons ' . esc_attr( $args['icon'] ) . '" aria-hidden="true"></span>';
	$html .= '</div>';
	$html .= '<h3 class="dtb-empty-state__title">' . esc_html( $title ) . '</h3>';

	if ( $description ) {
		$html .= '<p class="dtb-empty-state__text">' . esc_html( $description ) . '</p>';
	}

	if ( $args['action_html'] ) {
		$html .= $args['action_html'];
	}

	$html .= '</div>';

	return $html;
}

// =============================================================================
// LOADING STATE
// =============================================================================

/**
 * Render a loading spinner.
 *
 * @param string $label
 * @return string
 */
function dtb_admin_ui_loading( string $label = '' ): string {
	$label = $label ?: __( 'Loading…', 'drywall-toolbox' );
	return '<div class="dtb-loading" aria-live="polite" aria-label="' . esc_attr( $label ) . '">'
		. '<div class="dtb-loading__spinner" aria-hidden="true"></div>'
		. '<span>' . esc_html( $label ) . '</span>'
		. '</div>';
}

// =============================================================================
// TOOLBAR
// =============================================================================

/**
 * Render a page toolbar wrapper (open).
 *
 * @return string
 */
function dtb_admin_ui_toolbar_open(): string {
	return '<div class="dtb-toolbar">';
}

/**
 * Render a toolbar spacer.
 *
 * @return string
 */
function dtb_admin_ui_toolbar_spacer(): string {
	return '<div class="dtb-toolbar__spacer"></div>';
}

/**
 * Render a toolbar close.
 *
 * @return string
 */
function dtb_admin_ui_toolbar_close(): string {
	return '</div>';
}

// =============================================================================
// TABLE SHELL
// =============================================================================

/**
 * Render an open table wrapper and table tag.
 *
 * @param array $columns Array of column definitions.
 *                        Each: [ 'label' => string, 'class' => string, 'sortable' => bool ]
 * @param array $args {
 *   @type string $id         DOM id for the table.
 *   @type string $wrapper_id DOM id for the wrapper.
 * }
 * @return string
 */
function dtb_admin_ui_table_open( array $columns, array $args = [] ): string {
	$args = wp_parse_args( $args, [
		'id'         => '',
		'wrapper_id' => '',
	] );

	$wrapper_id = $args['wrapper_id'] ? ' id="' . esc_attr( $args['wrapper_id'] ) . '"' : '';
	$table_id   = $args['id'] ? ' id="' . esc_attr( $args['id'] ) . '"' : '';

	$html  = '<div class="dtb-table-wrap"' . $wrapper_id . '>';
	$html .= '<table class="dtb-table"' . $table_id . '>';
	$html .= '<thead class="dtb-table__head"><tr>';

	foreach ( $columns as $col ) {
		$sort_class = ! empty( $col['sortable'] ) ? ' sortable' : '';
		$col_class  = ! empty( $col['class'] ) ? ' ' . esc_attr( $col['class'] ) : '';
		$html .= '<th class="' . esc_attr( ltrim( $sort_class . $col_class ) ) . '">'
			. esc_html( $col['label'] ?? '' ) . '</th>';
	}

	$html .= '</tr></thead>';
	$html .= '<tbody>';

	return $html;
}

/**
 * Render the table close tags.
 *
 * @return string
 */
function dtb_admin_ui_table_close(): string {
	return '</tbody></table></div>';
}

/**
 * Render an empty row inside a table body.
 *
 * @param int    $col_span
 * @param string $message
 * @param string $icon
 * @return string
 */
function dtb_admin_ui_table_empty_row( int $col_span, string $message = '', string $icon = 'dashicons-inbox' ): string {
	$message = $message ?: __( 'No items found.', 'drywall-toolbox' );
	return '<tr><td colspan="' . absint( $col_span ) . '" class="dtb-table__empty">'
		. '<span class="dashicons ' . esc_attr( $icon ) . '" aria-hidden="true"></span>'
		. '<span>' . esc_html( $message ) . '</span>'
		. '</td></tr>';
}

// =============================================================================
// DRAWER
// =============================================================================

/**
 * Render a drawer shell.
 *
 * @param string $id           Unique drawer DOM id.
 * @param string $title        Drawer title.
 * @param string $body_html    Body content (pre-escaped by caller).
 * @param string $footer_html  Optional footer content.
 * @return string
 */
function dtb_admin_ui_drawer( string $id, string $title, string $body_html, string $footer_html = '' ): string {
	$html  = '<div class="dtb-drawer" id="' . esc_attr( $id ) . '" role="dialog" aria-modal="true" aria-label="' . esc_attr( $title ) . '" aria-hidden="true">';
	$html .= '<div class="dtb-drawer__header">';
	$html .= '<h2 class="dtb-drawer__title">' . esc_html( $title ) . '</h2>';
	$html .= '<button type="button" class="dtb-drawer__close dtb-btn--icon" aria-label="' . esc_attr__( 'Close', 'drywall-toolbox' ) . '">'
		. '<span class="dashicons dashicons-no-alt" aria-hidden="true"></span>'
		. '</button>';
	$html .= '</div>';
	$html .= '<div class="dtb-drawer__body">' . $body_html . '</div>';

	if ( $footer_html ) {
		$html .= '<div class="dtb-drawer__footer">' . $footer_html . '</div>';
	}

	$html .= '</div>';

	return $html;
}

/**
 * Render a single detail row for a drawer.
 *
 * @param string $label
 * @param string $value_html Pre-escaped value HTML.
 * @return string
 */
function dtb_admin_ui_detail_row( string $label, string $value_html ): string {
	return '<div class="dtb-detail-row">'
		. '<span class="dtb-detail-row__label">' . esc_html( $label ) . '</span>'
		. '<span class="dtb-detail-row__value">' . $value_html . '</span>'
		. '</div>';
}

// =============================================================================
// MODAL
// =============================================================================

/**
 * Render a modal shell.
 *
 * @param string $overlay_id Unique overlay DOM id.
 * @param string $title      Modal title.
 * @param string $body_html  Body content.
 * @param string $footer_html Optional footer with action buttons.
 * @param string $size       '' | 'sm' | 'lg'.
 * @return string
 */
function dtb_admin_ui_modal( string $overlay_id, string $title, string $body_html, string $footer_html = '', string $size = '' ): string {
	$size_class = $size ? ' dtb-modal--' . $size : '';

	$html  = '<div class="dtb-modal-overlay" id="' . esc_attr( $overlay_id ) . '" role="dialog" aria-modal="true" aria-label="' . esc_attr( $title ) . '" aria-hidden="true">';
	$html .= '<div class="dtb-modal' . esc_attr( $size_class ) . '">';
	$html .= '<div class="dtb-modal__header">';
	$html .= '<h2 class="dtb-modal__title">' . esc_html( $title ) . '</h2>';
	$html .= '<button type="button" class="dtb-modal__close" aria-label="' . esc_attr__( 'Close', 'drywall-toolbox' ) . '">'
		. '<span class="dashicons dashicons-no-alt" aria-hidden="true"></span>'
		. '</button>';
	$html .= '</div>';
	$html .= '<div class="dtb-modal__body">' . $body_html . '</div>';

	if ( $footer_html ) {
		$html .= '<div class="dtb-modal__footer">' . $footer_html . '</div>';
	}

	$html .= '</div></div>';

	return $html;
}

// =============================================================================
// FORM FIELD
// =============================================================================

/**
 * Render a labeled form field.
 *
 * @param string $input_html Pre-built input/select/textarea HTML.
 * @param string $label_text
 * @param array  $args {
 *   @type string $for       Input id for label[for].
 *   @type string $hint      Hint text below the field.
 *   @type bool   $required  Show required marker.
 * }
 * @return string
 */
function dtb_admin_ui_field( string $input_html, string $label_text, array $args = [] ): string {
	$args = wp_parse_args( $args, [
		'for'      => '',
		'hint'     => '',
		'required' => false,
	] );

	$for_attr    = $args['for'] ? ' for="' . esc_attr( $args['for'] ) . '"' : '';
	$req_class   = $args['required'] ? ' dtb-label--required' : '';

	$html  = '<div class="dtb-field">';
	$html .= '<label class="dtb-label' . $req_class . '"' . $for_attr . '>' . esc_html( $label_text ) . '</label>';
	$html .= $input_html;

	if ( $args['hint'] ) {
		$html .= '<p class="dtb-hint">' . esc_html( $args['hint'] ) . '</p>';
	}

	$html .= '</div>';

	return $html;
}

/**
 * Render a text input.
 *
 * @param string $name
 * @param mixed  $value
 * @param array  $attrs Extra HTML attributes.
 * @return string
 */
function dtb_admin_ui_input( string $name, $value = '', array $attrs = [] ): string {
	$attrs = wp_parse_args( $attrs, [
		'type'        => 'text',
		'id'          => $name,
		'class'       => '',
		'placeholder' => '',
		'required'    => false,
		'readonly'    => false,
	] );

	$extra  = ' id="' . esc_attr( $attrs['id'] ) . '"';
	$extra .= ' type="' . esc_attr( $attrs['type'] ) . '"';
	if ( $attrs['placeholder'] ) $extra .= ' placeholder="' . esc_attr( $attrs['placeholder'] ) . '"';
	if ( $attrs['required'] )    $extra .= ' required';
	if ( $attrs['readonly'] )    $extra .= ' readonly';
	$class  = 'dtb-input' . ( $attrs['class'] ? ' ' . esc_attr( $attrs['class'] ) : '' );

	return '<input name="' . esc_attr( $name ) . '" value="' . esc_attr( (string) $value ) . '" class="' . esc_attr( $class ) . '"' . $extra . '>';
}

/**
 * Render a select element.
 *
 * @param string $name
 * @param array  $options [ value => label ]
 * @param string $selected Currently selected value.
 * @param array  $attrs
 * @return string
 */
function dtb_admin_ui_select( string $name, array $options, string $selected = '', array $attrs = [] ): string {
	$attrs = wp_parse_args( $attrs, [
		'id'    => $name,
		'class' => '',
	] );

	$class = 'dtb-select' . ( $attrs['class'] ? ' ' . esc_attr( $attrs['class'] ) : '' );

	$html  = '<select name="' . esc_attr( $name ) . '" id="' . esc_attr( $attrs['id'] ) . '" class="' . esc_attr( $class ) . '">';
	foreach ( $options as $val => $lbl ) {
		$sel   = selected( $selected, (string) $val, false );
		$html .= '<option value="' . esc_attr( (string) $val ) . '"' . $sel . '>' . esc_html( (string) $lbl ) . '</option>';
	}
	$html .= '</select>';

	return $html;
}

// =============================================================================
// KPI GRID
// =============================================================================

/**
 * Render a KPI grid from an array of kpi definitions.
 *
 * @param array $kpis Each: [ 'value', 'label', 'icon', 'icon_color', 'trend', 'trend_dir', 'href' ]
 * @return string
 */
function dtb_admin_ui_kpi_grid( array $kpis ): string {
	$html = '<div class="dtb-grid dtb-grid--kpi" aria-label="Key metrics">';
	foreach ( $kpis as $kpi ) {
		$html .= dtb_admin_ui_kpi(
			$kpi['value'] ?? '–',
			$kpi['label'] ?? '',
			[
				'icon'       => $kpi['icon'] ?? 'dashicons-chart-bar',
				'icon_color' => $kpi['icon_color'] ?? 'primary',
				'trend'      => $kpi['trend'] ?? '',
				'trend_dir'  => $kpi['trend_dir'] ?? 'flat',
				'href'       => $kpi['href'] ?? '',
			]
		);
	}
	$html .= '</div>';
	return $html;
}

// =============================================================================
// GRID
// =============================================================================

/**
 * Render a grid container.
 *
 * @param string $inner_html
 * @param string $variant 'kpi' | 'two' | 'three' | 'four'
 * @return string
 */
function dtb_admin_ui_grid( string $inner_html, string $variant = 'two' ): string {
	return '<div class="dtb-grid dtb-grid--' . esc_attr( $variant ) . '">'
		. $inner_html
		. '</div>';
}
