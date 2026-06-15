# DTB Integration Pipeline Local Fixture Guide

Purpose: validate pipeline shape before Veeqo, QuickBooks, Amazon, and eBay credentials exist. This is not a broad preflight framework. It is a small checklist for deterministic local payload testing.

## What to validate before API keys

1. Marketplace SKUs map to WooCommerce SKUs exactly.
2. Marketplace orders do not create duplicate Woo orders.
3. Missing marketplace buyer email produces deterministic fallback email.
4. Missing marketplace shipping address does not crash materialization.
5. Missing marketplace item price falls back to Woo product price.
6. Paid marketplace orders queue Veeqo and QuickBooks jobs.
7. Pending marketplace orders create Woo orders on hold and do not queue external fulfillment/accounting writes.
8. Unmapped SKUs create a marketplace linking exception instead of creating a broken Woo order.

## Canonical duplicate keys

Use these keys consistently:

```text
_dtb_marketplace_channel
_dtb_marketplace_order_id
_dtb_marketplace_order_row_id
_amazon_order_id
_ebay_order_id
```

Materialization must check existing Woo orders before creating a new one. The marketplace row should receive `woo_order_id` after successful materialization or auto-linking.

## Local payload preview helper

After a staging/local Woo order exists, call this helper from WP-CLI eval, a temporary staging-only snippet, or a local shell:

```php
$preview = dtb_pipeline_preview_order_payloads(12345);
print_r($preview);
```

Expected shape:

```text
ok
order_id
order_type
source
status
issues
veeqo.payload
veeqo.line_count
quickbooks.sales_lines
quickbooks.refund_lines
```

This helper does not call Veeqo, QuickBooks, Amazon, or eBay. It only builds local payload previews.

## Minimal Amazon paid-order fixture

Use this fixture shape when manually calling `DTB_MarketplaceOrderNormalizer::from_amazon()` and `DTB_MarketplaceOrderMaterializationService::materialize_amazon()` in a local/staging shell.

```json
{
  "AmazonOrderId": "TEST-AMZ-1001",
  "PurchaseDate": "2026-06-13T15:00:00Z",
  "OrderStatus": "Unshipped",
  "FulfillmentChannel": "MFN",
  "SalesChannel": "Amazon.com",
  "OrderTotal": { "CurrencyCode": "USD", "Amount": "199.95" },
  "BuyerInfo": {
    "BuyerEmail": "buyer@example.test",
    "BuyerName": "Test Buyer"
  },
  "ShippingAddress": {
    "Name": "Test Buyer",
    "AddressLine1": "123 Test Street",
    "City": "Chicago",
    "StateOrRegion": "IL",
    "PostalCode": "60601",
    "CountryCode": "US"
  }
}
```

Amazon item fixture:

```json
[
  {
    "OrderItemId": "AMZ-LINE-1",
    "SellerSKU": "REPLACE-WITH-REAL-WOO-SKU",
    "Title": "Fixture Product",
    "QuantityOrdered": 1,
    "ItemPrice": { "CurrencyCode": "USD", "Amount": "199.95" }
  }
]
```

Expected result with mapped SKU:

```text
Woo order created
_dtb_order_type = marketplace
_dtb_marketplace_channel = amazon
_dtb_marketplace_order_id = TEST-AMZ-1001
marketplace row linked with woo_order_id
paid order moves to processing
dtb_order_sync_veeqo queued
dtb_order_sync_quickbooks queued
```

## Minimal Amazon unmapped-SKU fixture

Use the same order fixture but set:

```json
"SellerSKU": "DOES-NOT-EXIST-IN-WOO"
```

Expected result:

```text
No Woo order created
Marketplace exception category: order_linking
Exception code: sku_mapping_failed
```

## Minimal eBay paid-order fixture

```json
{
  "orderId": "TEST-EBAY-1001",
  "creationDate": "2026-06-13T15:00:00.000Z",
  "orderPaymentStatus": "PAID",
  "orderFulfillmentStatus": "NOT_STARTED",
  "buyer": {
    "username": "testbuyer",
    "email": "buyer@example.test"
  },
  "pricingSummary": {
    "total": { "currency": "USD", "value": "89.95" },
    "deliveryCost": { "currency": "USD", "value": "9.95" }
  },
  "fulfillmentStartInstructions": [
    {
      "shippingStep": {
        "shipTo": {
          "contactAddress": {
            "addressLine1": "123 Test Street",
            "city": "Chicago",
            "stateOrProvince": "IL",
            "postalCode": "60601",
            "countryCode": "US"
          }
        }
      }
    }
  ],
  "lineItems": [
    {
      "lineItemId": "EBAY-LINE-1",
      "sku": "REPLACE-WITH-REAL-WOO-SKU",
      "title": "Fixture Product",
      "quantity": 1,
      "lineItemCost": { "currency": "USD", "value": "80.00" }
    }
  ]
}
```

Expected result with mapped SKU:

```text
Woo order created
_dtb_order_type = marketplace
_dtb_marketplace_channel = ebay
_dtb_marketplace_order_id = TEST-EBAY-1001
paid order moves to processing
dtb_order_sync_veeqo queued
dtb_order_sync_quickbooks queued
```

## Missing-price fallback fixture

Set Amazon `ItemPrice.Amount` or eBay `lineItemCost.value` to `0` or omit the price. Expected result:

```text
Materializer uses Woo product price * quantity
Woo order is still created when SKU maps correctly
```

## Missing-email fallback fixture

Omit buyer email. Expected result:

```text
Billing email becomes deterministic:
marketplace+{channel}-{hash}@drywalltoolbox.local
```

## Missing-address fallback fixture

Omit the shipping address object. Expected result:

```text
Woo order still materializes
Shipping address line 1 = Marketplace address pending
Country defaults to US
```

## QuickBooks dry payload validation

Use a mapped Woo order and call `dtb_pipeline_preview_order_payloads($order_id)`. Confirm:

```text
quickbooks.sales_lines is not empty
Line descriptions include product name/SKU
Shipping line is present when shipping total > 0
Discount line is present when discount total > 0
quickbooks.refund_lines is empty when no refund exists
quickbooks.refund_lines contains a Refund line when refunded total > 0
```

## Veeqo dry payload validation

Use a mapped Woo order and call `dtb_pipeline_preview_order_payloads($order_id)`. Confirm:

```text
veeqo.payload is not null
veeqo.line_count matches Woo line item count
Each line item has SKU/product data
Shipping address exists or has deterministic fallback
No external Veeqo POST is attempted until credentials are configured
```
