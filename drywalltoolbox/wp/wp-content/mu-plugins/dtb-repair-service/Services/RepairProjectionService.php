<?php
/**
 * Services — RepairProjectionService: customer-safe status projection builder.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Build the full customer-safe status projection for a repair.
 *
 * @param int $repair_id
 * @return array
 */
function dtb_build_repair_status_projection( int $repair_id ): array {
$status       = dtb_get_repair_status( $repair_id );
$label        = dtb_get_repair_status_label( $status );
$submitted_at = (string) get_post_meta( $repair_id, '_repair_submitted_at', true );

$last_event   = null;
$last_updated = '';

if ( function_exists( 'dtb_repair_get_last_event' ) ) {
$last_event   = dtb_repair_get_last_event( $repair_id );
$last_updated = $last_event ? (string) $last_event->created_at : $submitted_at;
}

$timeline = [];
if ( function_exists( 'dtb_repair_get_customer_timeline' ) ) {
$timeline = dtb_repair_get_customer_timeline( $repair_id );
}

$tracking_number = null;
$expose_tracking = in_array( $status, [ 'ready_to_ship', 'completed', 'closed' ], true );
if ( $expose_tracking ) {
$tracking_number = (string) get_post_meta( $repair_id, '_repair_veeqo_tracking', true ) ?: null;
}

$request_details = [
'customer_name'      => sanitize_text_field( (string) get_post_meta( $repair_id, '_repair_customer_name', true ) ),
'customer_email'     => sanitize_email( (string) get_post_meta( $repair_id, '_repair_customer_email', true ) ),
'customer_phone'     => sanitize_text_field( (string) get_post_meta( $repair_id, '_repair_customer_phone', true ) ),
'company'            => sanitize_text_field( (string) get_post_meta( $repair_id, '_repair_company', true ) ),
'tool_brand'         => sanitize_text_field( (string) get_post_meta( $repair_id, '_repair_tool_brand', true ) ),
'tool_category'      => sanitize_text_field( (string) get_post_meta( $repair_id, '_repair_tool_category', true ) ),
'tool_model'         => sanitize_text_field( (string) get_post_meta( $repair_id, '_repair_model', true ) ),
'serial_number'      => sanitize_text_field( (string) get_post_meta( $repair_id, '_repair_serial', true ) ),
'tool_age'           => sanitize_text_field( (string) get_post_meta( $repair_id, '_repair_tool_age', true ) ),
'service_tier'       => sanitize_text_field( (string) get_post_meta( $repair_id, '_repair_service_tier', true ) ),
'priority'           => sanitize_text_field( (string) get_post_meta( $repair_id, '_repair_priority', true ) ),
'issue_start'        => sanitize_text_field( (string) get_post_meta( $repair_id, '_repair_issue_start', true ) ),
'issue_description'  => sanitize_textarea_field( (string) get_post_meta( $repair_id, '_repair_issue', true ) ),
'contact_preference' => sanitize_text_field( (string) get_post_meta( $repair_id, '_repair_contact_preference', true ) ),
'address_1'          => sanitize_text_field( (string) get_post_meta( $repair_id, '_repair_return_address_1', true ) ),
'city'               => sanitize_text_field( (string) get_post_meta( $repair_id, '_repair_return_city', true ) ),
'state'              => sanitize_text_field( (string) get_post_meta( $repair_id, '_repair_return_state', true ) ),
'postcode'           => sanitize_text_field( (string) get_post_meta( $repair_id, '_repair_return_postcode', true ) ),
'country'            => sanitize_text_field( (string) get_post_meta( $repair_id, '_repair_return_country', true ) ),
'shipping_rate_name' => sanitize_text_field( (string) get_post_meta( $repair_id, '_repair_shipping_rate_name', true ) ),
'shipping_rate_price'=> (float) get_post_meta( $repair_id, '_repair_shipping_rate_price', true ),
];

return [
'repair_id'            => $repair_id,
'status'               => $status,
'label'                => $label,
'submitted_at'         => $submitted_at,
'last_updated_at'      => $last_updated,
'estimated_completion' => null,
'tracking_number'      => $tracking_number,
'request_details'      => $request_details,
'timeline'             => $timeline,
];
}
