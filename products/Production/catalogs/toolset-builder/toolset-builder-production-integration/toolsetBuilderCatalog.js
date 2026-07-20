/**
 * frontend/src/data/toolsetBuilderCatalog.js
 * Generated from production WooCommerce CSV: woocommerce_catalog.csv
 * Do not hand-edit product rows. Regenerate from the catalog export.
 */

export const TOOLSET_BUILDER_CATALOG = {
  "generatedFrom": "woocommerce_catalog.csv",
  "productCount": 608,
  "countsByGroup": {
    "adapter": 2,
    "angle_head": 22,
    "automatic_taper": 11,
    "corner_applicator": 26,
    "filler_adapter": 14,
    "flat_box": 47,
    "flat_box_handle": 30,
    "loading_pump": 9,
    "other_tool": 122,
    "preset_bundle": 67,
    "support_handle": 10,
    "corner_roller": 2,
    "hand_tool": 181,
    "smoothing_blade": 51,
    "smoothing_blade_handle": 12,
    "semi_automatic_taper": 2
  },
  "countsByBrandAndGroup": {
    "Asgard": {
      "adapter": 1,
      "angle_head": 3,
      "automatic_taper": 1,
      "corner_applicator": 1,
      "filler_adapter": 2,
      "flat_box": 9,
      "flat_box_handle": 3,
      "loading_pump": 2,
      "other_tool": 1,
      "preset_bundle": 1,
      "support_handle": 1
    },
    "Columbia": {
      "angle_head": 4,
      "automatic_taper": 6,
      "corner_applicator": 14,
      "corner_roller": 1,
      "filler_adapter": 3,
      "flat_box": 20,
      "flat_box_handle": 9,
      "hand_tool": 44,
      "loading_pump": 3,
      "other_tool": 60,
      "preset_bundle": 40,
      "smoothing_blade": 30,
      "smoothing_blade_handle": 7,
      "support_handle": 4
    },
    "Level 5": {
      "angle_head": 6,
      "automatic_taper": 1,
      "corner_applicator": 3,
      "filler_adapter": 3,
      "flat_box": 8,
      "flat_box_handle": 8,
      "hand_tool": 81,
      "other_tool": 41,
      "preset_bundle": 16,
      "semi_automatic_taper": 1,
      "smoothing_blade": 21,
      "smoothing_blade_handle": 5
    },
    "TapeTech": {
      "adapter": 1,
      "angle_head": 9,
      "automatic_taper": 3,
      "corner_applicator": 8,
      "corner_roller": 1,
      "filler_adapter": 6,
      "flat_box": 10,
      "flat_box_handle": 10,
      "hand_tool": 56,
      "loading_pump": 4,
      "other_tool": 20,
      "preset_bundle": 10,
      "semi_automatic_taper": 1,
      "support_handle": 5
    }
  },
  "brands": [
    "Asgard",
    "Columbia",
    "Level 5",
    "TapeTech"
  ],
  "groups": {
    "automatic_taper": {
      "label": "Automatic Tapers",
      "description": "Production automatic tapers from the official catalog."
    },
    "semi_automatic_taper": {
      "label": "Semi-Automatic Taping Tools",
      "description": "Banjos and semi-automatic taping options."
    },
    "flat_box": {
      "label": "Flat / Finishing Boxes",
      "description": "Flat boxes, finishing boxes, MAXXBOX, QuickBox, and power-assist finishing boxes."
    },
    "flat_box_handle": {
      "label": "Flat Box Handles",
      "description": "Fixed, extendable, bent, 180 grip, Wizard, and box handle options."
    },
    "angle_head": {
      "label": "Angle Heads / Corner Finishers",
      "description": "Angle heads and corner finishers for internal corners."
    },
    "corner_applicator": {
      "label": "Corner Applicators",
      "description": "Applicator boxes, compound tubes, MudRunner tools, and corner applicators."
    },
    "corner_roller": {
      "label": "Corner Rollers",
      "description": "Inside/internal corner rollers."
    },
    "loading_pump": {
      "label": "Loading Pumps",
      "description": "Mud/loading pump options."
    },
    "filler_adapter": {
      "label": "Fillers / Goosenecks",
      "description": "Goosenecks, fillers, fill tubes, and box fillers."
    },
    "adapter": {
      "label": "Adapters",
      "description": "Angle-head, thread, nozzle, and workflow adapters."
    },
    "support_handle": {
      "label": "Support / Corner Handles",
      "description": "Angle-head, corner-roller, compound-tube, and support handles."
    },
    "smoothing_blade": {
      "label": "Smoothing / Skimming Blades",
      "description": "Smoothing blades, skimming blades, and finishing blade options."
    },
    "smoothing_blade_handle": {
      "label": "Smoothing Blade Handles",
      "description": "Extension handles for smoothing/skimming blades."
    },
    "hand_tool": {
      "label": "Hand Tools",
      "description": "Knives, trowels, hawks, mud pans, and sanding tools."
    },
    "preset_bundle": {
      "label": "Catalog Preset Sets",
      "description": "Official bundled tool sets from the catalog."
    },
    "other_tool": {
      "label": "Other Tools",
      "description": "Additional non-parts tools that did not match a primary builder group."
    }
  },
  "templates": [
    {
      "id": "full_automatic_set",
      "label": "Full Automatic Set",
      "description": "Automatic taper, flat boxes, handles, corner tools, pump, and filler workflow.",
      "requiredGroups": [
        "automatic_taper",
        "flat_box",
        "flat_box",
        "flat_box_handle",
        "angle_head",
        "corner_applicator",
        "corner_roller",
        "support_handle",
        "loading_pump",
        "filler_adapter"
      ],
      "discountPercent": 5
    },
    {
      "id": "finishing_set",
      "label": "Finishing Set",
      "description": "Flat finishing boxes, box handle, angle head, corner applicator, support handle, pump, and filler.",
      "requiredGroups": [
        "flat_box",
        "flat_box",
        "flat_box_handle",
        "angle_head",
        "corner_applicator",
        "support_handle",
        "loading_pump",
        "filler_adapter"
      ],
      "discountPercent": 5
    },
    {
      "id": "taping_set",
      "label": "Taping Set",
      "description": "Automatic taper with corner finishing, rolling, support handle, pump, and gooseneck/filler.",
      "requiredGroups": [
        "automatic_taper",
        "angle_head",
        "corner_roller",
        "support_handle",
        "loading_pump",
        "filler_adapter"
      ],
      "discountPercent": 5
    },
    {
      "id": "semi_automatic_set",
      "label": "Semi-Automatic Set",
      "description": "Semi-automatic taping or banjo workflow with corner applicator and support tools.",
      "requiredGroups": [
        "semi_automatic_taper",
        "corner_applicator",
        "corner_roller",
        "support_handle",
        "loading_pump",
        "filler_adapter"
      ],
      "discountPercent": 5
    },
    {
      "id": "flat_box_set",
      "label": "Flat Box Set",
      "description": "Two finishing boxes plus compatible box handle and filler.",
      "requiredGroups": [
        "flat_box",
        "flat_box",
        "flat_box_handle",
        "filler_adapter"
      ],
      "discountPercent": 5
    },
    {
      "id": "smoothing_blade_set",
      "label": "Smoothing Blade Set",
      "description": "Smoothing blade, handle, and hand-tool finishing support.",
      "requiredGroups": [
        "smoothing_blade",
        "smoothing_blade",
        "smoothing_blade_handle",
        "hand_tool"
      ],
      "discountPercent": 5
    }
  ],
  "products": [
    {
      "sku": "CFA-AD",
      "parentSku": null,
      "type": "simple",
      "brand": "Asgard",
      "name": "Asgard Angle Head Adapter - [CFA-AD]",
      "description": "The Asgard CFA-AD Angle Head Adapter is used to connect the 2.5” or 3” Angle Head to the support handle as part of the Taping process. The Angle Head Adapter connects securely to the XH-AD or FH-AD support handles. The support handle, Angle Head Adapter and Angle Head are used to wipe down the excess joint compound...",
      "price": 45.0,
      "regularPrice": 45.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CFA-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "CFA-AD",
        "accessory",
        "adaptor",
        "angle head adaptor",
        "semi automatic"
      ],
      "attributes": [],
      "optionGroup": "adapter",
      "sizeLabel": "CFA-AD",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AH25-AD",
      "parentSku": "ASG-ASGARD-ANGLE-HEAD",
      "type": "variation",
      "brand": "Asgard",
      "name": "Asgard Angle Head - [AH25-AD]",
      "description": "The Asgard® Angle Head is used to perfectly feather the joint compound applied to both sides of internal corners in one pass. The Angle Head can be used for wall-to-wall internal corners or wall-to-ceiling corners. The Angle Head is generally used as part of the Taping process to wipe down the corner after the corne...",
      "price": 349.0,
      "regularPrice": 349.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AH25-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "AH25-AD",
        "AH30-AD",
        "AH35-AD",
        "Asgard",
        "Automatic Taping Tools",
        "angle head",
        "corner finisher",
        "corner flusher",
        "finisher"
      ],
      "attributes": [
        {
          "name": "Angle Head Size",
          "value": "2.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Angle Head Size: 2.5\"",
      "sortKey": 25.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AH30-AD",
      "parentSku": "ASG-ASGARD-ANGLE-HEAD",
      "type": "variation",
      "brand": "Asgard",
      "name": "Asgard Angle Head - [AH30-AD]",
      "description": "The Asgard® Angle Head is used to perfectly feather the joint compound applied to both sides of internal corners in one pass. The Angle Head can be used for wall-to-wall internal corners or wall-to-ceiling corners. The Angle Head is generally used as part of the Taping process to wipe down the corner after the corne...",
      "price": 373.0,
      "regularPrice": 373.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "AH30-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "AH25-AD",
        "AH30-AD",
        "AH35-AD",
        "Asgard",
        "Automatic Taping Tools",
        "angle head",
        "corner finisher",
        "corner flusher",
        "finisher"
      ],
      "attributes": [
        {
          "name": "Angle Head Size",
          "value": "3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Angle Head Size: 3\"",
      "sortKey": 30.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AH35-AD",
      "parentSku": "ASG-ASGARD-ANGLE-HEAD",
      "type": "variation",
      "brand": "Asgard",
      "name": "Asgard Angle Head - [AH35-AD]",
      "description": "The Asgard® Angle Head is used to perfectly feather the joint compound applied to both sides of internal corners in one pass. The Angle Head can be used for wall-to-wall internal corners or wall-to-ceiling corners. The Angle Head is generally used as part of the Taping process to wipe down the corner after the corne...",
      "price": 393.0,
      "regularPrice": 393.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "AH35-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "AH25-AD",
        "AH30-AD",
        "AH35-AD",
        "Asgard",
        "Automatic Taping Tools",
        "angle head",
        "corner finisher",
        "corner flusher",
        "finisher"
      ],
      "attributes": [
        {
          "name": "Angle Head Size",
          "value": "3.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Angle Head Size: 3.5\"",
      "sortKey": 35.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT01-AD",
      "parentSku": null,
      "type": "simple",
      "brand": "Asgard",
      "name": "Asgard The HAMMER™ Automatic Taper - [AT01-AD]",
      "description": "The Asgard® “HAMMER™” Automatic Taper redefines Value. The Taper simultaneously applies joint tape and the correct amount of joint compound for all drywall joints - dramatically improving taping efficiency. Model AT01-AD features stainless steel side plates plus a hard anodized push rod and cable drum to prevent cor...",
      "price": 1402.0,
      "regularPrice": 1402.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT01-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "AT01-AD",
        "Asgard",
        "Automatic Taping Tools",
        "bazooka",
        "taper",
        "the hammer"
      ],
      "attributes": [],
      "optionGroup": "automatic_taper",
      "sizeLabel": "AT01-AD",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CA08-AD",
      "parentSku": null,
      "type": "simple",
      "brand": "Asgard",
      "name": "Asgard Applicator Box – Head Only - [CA08-AD]",
      "description": "The Asgard® CA08-AD Corner Applicator supplies joint compound to the Angle Heads for fast and efficient finishing of internal corners (angles). The CA08-AD Corner Applicator features a stainless steel cone and a D-Shaped adapter to prevent rotation. Use with the FH-AD or XH-AD Support Handle – not included.",
      "price": 298.0,
      "regularPrice": 298.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CA08-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "CA08-AD",
        "corner angle box",
        "corner box",
        "corner finisher box",
        "corner flusher box",
        "cornerbox",
        "flusher box"
      ],
      "attributes": [],
      "optionGroup": "corner_applicator",
      "sizeLabel": "CA08-AD",
      "sortKey": 8.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "XH-AD",
      "parentSku": null,
      "type": "simple",
      "brand": "Asgard",
      "name": "Asgard Extension Support Handle - 43” to 76” - [XH-AD]",
      "description": "Asgard® Tools feature an interchangeable handle system that allows one support handle to be used with the Corner Applicator, Corner Roller and Nail Spotter without additional adapters. To attach the support handles to the Angle Heads, use the CFA-AD adapter. The XH-AD extendable support handle features robust constr...",
      "price": 224.0,
      "regularPrice": 224.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "XH-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "XH-AD",
        "corner roller handle",
        "extendable handle",
        "nail spotter handle",
        "semi automatic"
      ],
      "attributes": [],
      "optionGroup": "filler_adapter",
      "sizeLabel": "XH-AD",
      "sortKey": 43.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FH-AD",
      "parentSku": null,
      "type": "simple",
      "brand": "Asgard",
      "name": "Asgard Fiberglass Handle - 43\" - [FH-AD]",
      "description": "Asgard® Tools feature an interchangeable handle system that allows one support handle to be used with the Corner Applicator, Corner Roller and Nail Spotter without additional adapters. To attach the support handles to the Angle Heads, use the CFA-AD adapter. The FH-AD support handle is lightweight but robust and its...",
      "price": 48.0,
      "regularPrice": 48.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FH-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "FH-AD",
        "corner roller handle",
        "extendable handle",
        "nail spotter handle",
        "semi automatic"
      ],
      "attributes": [],
      "optionGroup": "filler_adapter",
      "sizeLabel": "FH-AD",
      "sortKey": 43.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "EZ07-AD",
      "parentSku": "ASG-ASGARD-FINISHING-BOX",
      "type": "variation",
      "brand": "Asgard",
      "name": "Asgard Finishing Box - [EZ07-AD]",
      "description": "The Asgard® Classic Finishing Box automatically dispenses the proper amount of joint compound and feathers the edges of butt joints and flat joints in one pass. The Finishing Box helps produce professional results every time. The adjustable crown setting dial allows you to easily adjust the amount of joint compound...",
      "price": 330.0,
      "regularPrice": 330.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "EZ07-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "EZ07-AD",
        "EZ10-AD",
        "EZ12-AD",
        "automatic taping tools",
        "flat box",
        "flatbox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 7\"",
      "sortKey": 7.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "EHC07-AD",
      "parentSku": "ASG-ASGARD-MAXXBOX-FINISHING-BOX",
      "type": "variation",
      "brand": "Asgard",
      "name": "Asgard MAXXBOX Finishing Box - [EHC07-AD]",
      "description": "The Asgard® MAXXBOX® Finishing Box automatically dispenses the proper amount of joint compound and feathers the edges of butt joints and flat joints in one pass. The MAXXBOX® Finishing Box helps produce professional results every time. The adjustable crown setting dial allows you to easily adjust the amount of joint...",
      "price": 403.0,
      "regularPrice": 403.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "EHC07-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "EHC07-AD",
        "EHC10-AD",
        "EHC12-AD",
        "MAXXBOX",
        "finishing box",
        "flat box",
        "flatbox",
        "maxx box"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 7\"",
      "sortKey": 7.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PA07-AD",
      "parentSku": "ASG-ASGARD-POWER-ASSIST-MAXXBOX-FINISHING-BOX",
      "type": "variation",
      "brand": "Asgard",
      "name": "Asgard Power Assist MAXXBOX Finishing Box - [PA07-AD]",
      "description": "The Asgard® Power Assist® Finishing Box requires 50% less effort to automatically dispense the proper amount of joint compound and feather the edges of butt joints and flat joints in one pass. Simply place the blade on the joint first then apply the wheels to activate the Power Assist mechanism. The Power Assist® fi...",
      "price": 472.0,
      "regularPrice": 472.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PA07-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "PA07-AD",
        "PA10-AD",
        "PA12-AD",
        "auto box",
        "auto flat",
        "auto flat box",
        "automatic",
        "finishing box",
        "flat box",
        "power assist"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 7\"",
      "sortKey": 7.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "EZ10-AD",
      "parentSku": "ASG-ASGARD-FINISHING-BOX",
      "type": "variation",
      "brand": "Asgard",
      "name": "Asgard Finishing Box - [EZ10-AD]",
      "description": "The Asgard® Classic Finishing Box automatically dispenses the proper amount of joint compound and feathers the edges of butt joints and flat joints in one pass. The Finishing Box helps produce professional results every time. The adjustable crown setting dial allows you to easily adjust the amount of joint compound...",
      "price": 346.0,
      "regularPrice": 346.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "EZ10-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "EZ07-AD",
        "EZ10-AD",
        "EZ12-AD",
        "automatic taping tools",
        "flat box",
        "flatbox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 10\"",
      "sortKey": 10.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "EHC10-AD",
      "parentSku": "ASG-ASGARD-MAXXBOX-FINISHING-BOX",
      "type": "variation",
      "brand": "Asgard",
      "name": "Asgard MAXXBOX Finishing Box - [EHC10-AD]",
      "description": "The Asgard® MAXXBOX® Finishing Box automatically dispenses the proper amount of joint compound and feathers the edges of butt joints and flat joints in one pass. The MAXXBOX® Finishing Box helps produce professional results every time. The adjustable crown setting dial allows you to easily adjust the amount of joint...",
      "price": 413.0,
      "regularPrice": 413.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "EHC10-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "EHC07-AD",
        "EHC10-AD",
        "EHC12-AD",
        "MAXXBOX",
        "finishing box",
        "flat box",
        "flatbox",
        "maxx box"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 10\"",
      "sortKey": 10.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PA10-AD",
      "parentSku": "ASG-ASGARD-POWER-ASSIST-MAXXBOX-FINISHING-BOX",
      "type": "variation",
      "brand": "Asgard",
      "name": "Asgard Power Assist MAXXBOX Finishing Box - [PA10-AD]",
      "description": "The Asgard® Power Assist® Finishing Box requires 50% less effort to automatically dispense the proper amount of joint compound and feather the edges of butt joints and flat joints in one pass. Simply place the blade on the joint first then apply the wheels to activate the Power Assist mechanism. The Power Assist® fi...",
      "price": 488.0,
      "regularPrice": 488.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PA10-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "PA07-AD",
        "PA10-AD",
        "PA12-AD",
        "auto box",
        "auto flat",
        "auto flat box",
        "automatic",
        "finishing box",
        "flat box",
        "power assist"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 10\"",
      "sortKey": 10.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "EZ12-AD",
      "parentSku": "ASG-ASGARD-FINISHING-BOX",
      "type": "variation",
      "brand": "Asgard",
      "name": "Asgard Finishing Box - [EZ12-AD]",
      "description": "The Asgard® Classic Finishing Box automatically dispenses the proper amount of joint compound and feathers the edges of butt joints and flat joints in one pass. The Finishing Box helps produce professional results every time. The adjustable crown setting dial allows you to easily adjust the amount of joint compound...",
      "price": 361.0,
      "regularPrice": 361.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "EZ12-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "EZ07-AD",
        "EZ10-AD",
        "EZ12-AD",
        "automatic taping tools",
        "flat box",
        "flatbox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 12\"",
      "sortKey": 12.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "EHC12-AD",
      "parentSku": "ASG-ASGARD-MAXXBOX-FINISHING-BOX",
      "type": "variation",
      "brand": "Asgard",
      "name": "Asgard MAXXBOX Finishing Box - [EHC12-AD]",
      "description": "The Asgard® MAXXBOX® Finishing Box automatically dispenses the proper amount of joint compound and feathers the edges of butt joints and flat joints in one pass. The MAXXBOX® Finishing Box helps produce professional results every time. The adjustable crown setting dial allows you to easily adjust the amount of joint...",
      "price": 458.0,
      "regularPrice": 458.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "EHC12-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "EHC07-AD",
        "EHC10-AD",
        "EHC12-AD",
        "MAXXBOX",
        "finishing box",
        "flat box",
        "flatbox",
        "maxx box"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 12\"",
      "sortKey": 12.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PA12-AD",
      "parentSku": "ASG-ASGARD-POWER-ASSIST-MAXXBOX-FINISHING-BOX",
      "type": "variation",
      "brand": "Asgard",
      "name": "Asgard Power Assist MAXXBOX Finishing Box - [PA12-AD]",
      "description": "The Asgard® Power Assist® Finishing Box requires 50% less effort to automatically dispense the proper amount of joint compound and feather the edges of butt joints and flat joints in one pass. Simply place the blade on the joint first then apply the wheels to activate the Power Assist mechanism. The Power Assist® fi...",
      "price": 503.0,
      "regularPrice": 503.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PA12-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "PA07-AD",
        "PA10-AD",
        "PA12-AD",
        "auto box",
        "auto flat",
        "auto flat box",
        "automatic",
        "finishing box",
        "flat box",
        "power assist"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 12\"",
      "sortKey": 12.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "BBH-AD",
      "parentSku": null,
      "type": "simple",
      "brand": "Asgard",
      "name": "Asgard Brakeless Box Handle (Fixed Length) - 34\" - [BBH-AD]",
      "description": "Asgard® introduces the first full length brakeless finishing box handle. The friction brake design eliminates the learning curve associated with standard finishing box handles and makes it easy to achieve professional results within minutes of starting to work with automatic taping and finishing tools. Ergonomic kno...",
      "price": 142.0,
      "regularPrice": 142.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "BBH-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "BBH-AD",
        "Brakeless",
        "Brakeless Box Handle",
        "Brakeless Handle",
        "flat box handle"
      ],
      "attributes": [],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "BBH-AD",
      "sortKey": 34.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "BBHE-AD",
      "parentSku": null,
      "type": "simple",
      "brand": "Asgard",
      "name": "Asgard Brakeless Box Extendable Handle - 38” - 60” - [BBHE-AD]",
      "description": "Asgard® introduces the first full length brakeless finishing box handle. The friction brake design eliminates the learning curve associated with standard finishing box handles and makes it easy to achieve professional results within minutes of starting to work with automatic taping and finishing tools. Ergonomic kno...",
      "price": 294.0,
      "regularPrice": 294.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "BBHE-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "BBHE-AD",
        "Brakeless",
        "Brakeless Box Handle",
        "Brakeless Handle",
        "flat box handle"
      ],
      "attributes": [],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "BBHE-AD",
      "sortKey": 38.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FBHE-AD",
      "parentSku": null,
      "type": "simple",
      "brand": "Asgard",
      "name": "Asgard Extendable Finishing Box Handle - 41\" - 63\" - [FBHE-AD]",
      "description": "The Asgard® Extendable Finishing Box Handle attaches to the Classic, MAXXBOX® or Power Assist® Finishing Boxes and provides control to cleanly sweep the boxes off the joint for a perfect finish. The FBHE-AD Handle is the strongest extendable finishing box handle and the industry and adjusts from 41\" to 63\" for incre...",
      "price": 322.0,
      "regularPrice": 322.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FBHE-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "Extendable Handle",
        "FBHE-AD",
        "flat box handle"
      ],
      "attributes": [],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "FBHE-AD",
      "sortKey": 41.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "GN01-AD",
      "parentSku": null,
      "type": "simple",
      "brand": "Asgard",
      "name": "Asgard Gooseneck Adapter - [GN01-AD]",
      "description": "The Asgard® GN01-AD Gooseneck used with the LP01-AD Loading Pump to fill the automatic taper. It features a heavy duty, durable design to provide years of service. The cradle of the Gooseneck features rubber sleeves to protect the main tube of the Automatic Taper.",
      "price": 111.0,
      "regularPrice": 111.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "GN01-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "GN01-AD",
        "goose neck",
        "gooseneck"
      ],
      "attributes": [],
      "optionGroup": "loading_pump",
      "sizeLabel": "GN01-AD",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "LP01-AD",
      "parentSku": null,
      "type": "simple",
      "brand": "Asgard",
      "name": "Asgard Loading Pump - [LP01-AD]",
      "description": "The Asgard® Loading Pump combines reliability with innovation. It is used together with the GN01-TT Gooseneck and FA01-AD Filler Adapter to fill the Automatic Taper, Finishing Boxes, Corner Applicator and Nail Spotter with joint compound. The LP01-AD features the slim tube design preferred by professional finishers...",
      "price": 417.0,
      "regularPrice": 417.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "LP01-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "LP01-AD",
        "automatic taping tools",
        "loading pump"
      ],
      "attributes": [],
      "optionGroup": "loading_pump",
      "sizeLabel": "LP01-AD",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "NS03-AD",
      "parentSku": null,
      "type": "simple",
      "brand": "Asgard",
      "name": "Asgard Nail Spotter – Head Only - [NS03-AD]",
      "description": "The Asgard® Nail Spotter is used to fill the depressions left from the nails or screw heads during installation of the drywall. The Nail Spotter features an easy clean box design that removes excess compound at the same time as filling the depressions. The hardened steel skid plate allows the Nail Spotter to move al...",
      "price": 298.0,
      "regularPrice": 298.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "NS03-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "NS03-AD",
        "nail spotter",
        "nailspotter"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "NS03-AD",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TTBDL9",
      "parentSku": null,
      "type": "simple",
      "brand": "Asgard",
      "name": "Asgard Classic Finishing Set - [TTBDL9]",
      "description": "The Asgard Classic Finishing Box Combo includes the tools you need to start finishing flat joints quickly and professionally. The adjustable length handle provides flexibility for multiple ceiling heights",
      "price": 1246.0,
      "regularPrice": 1246.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "TTBDL9",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "BBHE-AD",
        "EZ10-AD",
        "EZ12-AD",
        "FA01-AD",
        "LP01-AD",
        "flat box set",
        "mud pump",
        "set",
        "taping set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "TTBDL9",
      "sortKey": 9.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CR01-AD",
      "parentSku": null,
      "type": "simple",
      "brand": "Asgard",
      "name": "Asgard Inside Corner Roller – Head Only - [CR01-AD]",
      "description": "The Asgard® CR01-AD Inside Corner Roller attaches to the FH-AD or XH-AD Support Handle to quickly and accurately embed the joint tape into the internal corner joints. Use the Inside Corner Roller immediately after applying joint tape to the internal corner with the Automatic Taper. The CR01-AD forces excess joint co...",
      "price": 178.0,
      "regularPrice": 178.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CR01-AD",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Asgard > Automatic Taping Tools"
      ],
      "tags": [
        "Asgard",
        "Automatic Taping Tools",
        "CR01-AD",
        "corner roller",
        "inside corner roller"
      ],
      "attributes": [],
      "optionGroup": "support_handle",
      "sizeLabel": "CR01-AD",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "2AH",
      "parentSku": "COL-COLUMBIA-ANGLE-HEAD",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Angle Head - [2AH]",
      "description": "Our angle On Perfection",
      "price": 358.0,
      "regularPrice": 358.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "2AH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "2.5AH",
        "2AH",
        "3.5AH",
        "3AH",
        "Automatic Taping Tools",
        "Columbia",
        "angle head",
        "colombia",
        "columbia flusher",
        "corner finisher",
        "corner flusher",
        "finisher"
      ],
      "attributes": [
        {
          "name": "Angle Head Size",
          "value": "2\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Angle Head Size: 2\"",
      "sortKey": 2.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "2.5AH",
      "parentSku": "COL-COLUMBIA-ANGLE-HEAD",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Angle Head - [2.5AH]",
      "description": "Our angle On Perfection",
      "price": 363.0,
      "regularPrice": 363.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "2.5AH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "2.5AH",
        "2AH",
        "3.5AH",
        "3AH",
        "Automatic Taping Tools",
        "Columbia",
        "angle head",
        "colombia",
        "columbia flusher",
        "corner finisher",
        "corner flusher",
        "finisher"
      ],
      "attributes": [
        {
          "name": "Angle Head Size",
          "value": "2.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Angle Head Size: 2.5\"",
      "sortKey": 2.5,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "3AH",
      "parentSku": "COL-COLUMBIA-ANGLE-HEAD",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Angle Head - [3AH]",
      "description": "Our angle On Perfection",
      "price": 367.0,
      "regularPrice": 367.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "3AH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "2.5AH",
        "2AH",
        "3.5AH",
        "3AH",
        "Automatic Taping Tools",
        "Columbia",
        "angle head",
        "colombia",
        "columbia flusher",
        "corner finisher",
        "corner flusher",
        "finisher"
      ],
      "attributes": [
        {
          "name": "Angle Head Size",
          "value": "3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Angle Head Size: 3\"",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "3.5AH",
      "parentSku": "COL-COLUMBIA-ANGLE-HEAD",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Angle Head - [3.5AH]",
      "description": "Our angle On Perfection",
      "price": 409.0,
      "regularPrice": 409.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "3.5AH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "2.5AH",
        "2AH",
        "3.5AH",
        "3AH",
        "Automatic Taping Tools",
        "Columbia",
        "angle head",
        "colombia",
        "columbia flusher",
        "corner finisher",
        "corner flusher",
        "finisher"
      ],
      "attributes": [
        {
          "name": "Angle Head Size",
          "value": "3.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Angle Head Size: 3.5\"",
      "sortKey": 3.5,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "C1PTAPER",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia One Predator Automatic Taper - [C1PTAPER]",
      "description": "The Predator – Now with Removable Taper Head",
      "price": 1896.0,
      "regularPrice": 1896.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "C1PTAPER",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "C1PTAPER",
        "Columbia",
        "bazooka",
        "carbon fiber",
        "colombia",
        "predator",
        "taper"
      ],
      "attributes": [],
      "optionGroup": "automatic_taper",
      "sizeLabel": "C1PTAPER",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TBPTAPER",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia 6ft Tall Boy Predator Automatic Taper - [TBPTAPER]",
      "description": "The 6ft Predator Carbon Fiber Taper is engineered for professionals who demand the best performance for higher ceilings.",
      "price": 1919.0,
      "regularPrice": 1919.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TBPTAPER",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "TBPTAPER",
        "bazooka",
        "carbon fiber",
        "colombia",
        "predator",
        "taper"
      ],
      "attributes": [],
      "optionGroup": "automatic_taper",
      "sizeLabel": "TBPTAPER",
      "sortKey": 6.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "STAPER",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Sawed Off Automatic Taper 39\" - [STAPER]",
      "description": "The Columbia Automatic Taper is a precision built tool that is back by popular demand. This tool will tape flats and angles effortlessly year after year. From less drag in the corners to any easy to remove cap for cleaning, this tool will not let you down. A hard anodized tube eliminates the track lines that occur o...",
      "price": 1683.0,
      "regularPrice": 1683.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "STAPER",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "STAPER",
        "bazooka",
        "colombia",
        "taper"
      ],
      "attributes": [],
      "optionGroup": "automatic_taper",
      "sizeLabel": "STAPER",
      "sortKey": 39.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SPTAPER",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Sawed Off Predator Automatic Taper 39\" - [SPTAPER]",
      "description": "Columbia Taping Tools introduces the world's first Mini Carbon Fiber Taper, The Predator \"Sawed Off\" Mini and the benefits that come with this are endless. The Columbia Taper is a precision built tool that has been perfected over 38 years, but now it is also significantly lighter than all other tapers on the market...",
      "price": 1896.0,
      "regularPrice": 1896.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "SPTAPER",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "SPTAPER",
        "bazooka",
        "carbon fiber",
        "colombia",
        "predator",
        "taper"
      ],
      "attributes": [],
      "optionGroup": "automatic_taper",
      "sizeLabel": "SPTAPER",
      "sortKey": 39.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TAPER",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Automatic Taper - [TAPER]",
      "description": "Columbia is proud to offer you the finest Automatic Taper on the market. This precision engineered tool is designed to be the lightest, fastest and smoothest running taper on the market. Built with durable stainless steel and hard anodized aluminum parts, it offers many years of rugged use.",
      "price": 1683.0,
      "regularPrice": 1683.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TAPER",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "bazooka",
        "colombia",
        "taper"
      ],
      "attributes": [],
      "optionGroup": "automatic_taper",
      "sizeLabel": "TAPER",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SAT",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Semi Automatic Taper - [SAT]",
      "description": "Introducing the Columbia Semi Automatic Taper. A great tool for the first time taper, it works with any 5 gallon bucket. Features a smooth running tape spool for easy operation.",
      "price": 192.0,
      "regularPrice": 192.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "SAT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "SAT",
        "Semi Automatic Taping Tools",
        "bucket puller",
        "bucket taper",
        "colombia",
        "semi automatic",
        "semi-auto taper",
        "semi-automatic taper",
        "super taper",
        "tape puller",
        "wet taper"
      ],
      "attributes": [],
      "optionGroup": "automatic_taper",
      "sizeLabel": "SAT",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "ICA2-1",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia 2 Wheeled Internal 90° Applicator - [ICA2-1]",
      "description": "Precision Billet Aluminum Body with Stainless Steel skids The Internal Corner Applicator is best suited paired with the Compound Tube and is used to pre fill internal 90 degree corners",
      "price": 49.0,
      "regularPrice": 49.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "ICA2-1",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "ICA2-1",
        "Semi Automatic Taping Tools",
        "applicator",
        "colombia",
        "internal applicator",
        "semi automatic"
      ],
      "attributes": [],
      "optionGroup": "corner_applicator",
      "sizeLabel": "ICA2-1",
      "sortKey": 2.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "ICA4-1",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia 4 Wheeled Internal 90° Applicator - [ICA4-1]",
      "description": "Precision Billet Aluminum Body with Stainless Steel skids The Internal Corner Applicator is best suited paired with the Compound Tube and is used to pre fill internal 90 degree corners",
      "price": 63.0,
      "regularPrice": 63.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "ICA4-1",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "ICA4-1",
        "Semi Automatic Taping Tools",
        "applicator",
        "colombia",
        "internal applicator",
        "semi automatic"
      ],
      "attributes": [],
      "optionGroup": "corner_applicator",
      "sizeLabel": "ICA4-1",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "7CFB",
      "parentSku": "COL-COLUMBIA-THROTTLE-BOX",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Throttle Box - [7CFB]",
      "description": "The Throttle Box is another great product of ours that offers years of great performance. All billet construction with a threaded stainless steel ball, this Corner Box looks and operates seamlessly. All our Corner Boxes now come standard with automatic capabilities, making pushing the box at least 50% easier than st...",
      "price": 299.0,
      "regularPrice": 299.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "7CFB",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "7CFB",
        "8CFB",
        "Automatic Taping Tools",
        "Columbia",
        "angle box",
        "colombia",
        "corner angle box",
        "corner box",
        "corner flusher box",
        "cornerbox",
        "flusher box",
        "throttle box",
        "throttlebox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "corner_applicator",
      "sizeLabel": "Size: 7\"",
      "sortKey": 7.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "8CFB",
      "parentSku": "COL-COLUMBIA-THROTTLE-BOX",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Throttle Box - [8CFB]",
      "description": "The Throttle Box is another great product of ours that offers years of great performance. All billet construction with a threaded stainless steel ball, this Corner Box looks and operates seamlessly. All our Corner Boxes now come standard with automatic capabilities, making pushing the box at least 50% easier than st...",
      "price": 311.0,
      "regularPrice": 311.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "8CFB",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "7CFB",
        "8CFB",
        "Automatic Taping Tools",
        "Columbia",
        "angle box",
        "colombia",
        "corner angle box",
        "corner box",
        "corner flusher box",
        "cornerbox",
        "flusher box",
        "throttle box",
        "throttlebox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "corner_applicator",
      "sizeLabel": "Size: 8\"",
      "sortKey": 8.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CMT24",
      "parentSku": "COL-COLUMBIA-COMPOUND-TUBE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Compound Tube - [CMT24]",
      "description": "Columbia Compound Tubes have taken the market place by storm. Finally a high quality long lasting tube that is easy to push. We have had many customers, after trying this tube, report back that they changed over their entire fleet.",
      "price": 158.0,
      "regularPrice": 158.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CMT24",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "CMT24",
        "CMT32",
        "CMT42",
        "CMT55",
        "Columbia",
        "Semi Automatic Taping Tools",
        "colombia",
        "compound tube",
        "semi automatic",
        "syringe"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "24\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "corner_applicator",
      "sizeLabel": "Size: 24\"",
      "sortKey": 24.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CMT32",
      "parentSku": "COL-COLUMBIA-COMPOUND-TUBE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Compound Tube - [CMT32]",
      "description": "Columbia Compound Tubes have taken the market place by storm. Finally a high quality long lasting tube that is easy to push. We have had many customers, after trying this tube, report back that they changed over their entire fleet.",
      "price": 167.0,
      "regularPrice": 167.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CMT32",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "CMT24",
        "CMT32",
        "CMT42",
        "CMT55",
        "Columbia",
        "Semi Automatic Taping Tools",
        "colombia",
        "compound tube",
        "semi automatic",
        "syringe"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "32\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "corner_applicator",
      "sizeLabel": "Size: 32\"",
      "sortKey": 32.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CMT42",
      "parentSku": "COL-COLUMBIA-COMPOUND-TUBE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Compound Tube - [CMT42]",
      "description": "Columbia Compound Tubes have taken the market place by storm. Finally a high quality long lasting tube that is easy to push. We have had many customers, after trying this tube, report back that they changed over their entire fleet.",
      "price": 182.0,
      "regularPrice": 182.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CMT42",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "CMT24",
        "CMT32",
        "CMT42",
        "CMT55",
        "Columbia",
        "Semi Automatic Taping Tools",
        "colombia",
        "compound tube",
        "semi automatic",
        "syringe"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "42\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "corner_applicator",
      "sizeLabel": "Size: 42\"",
      "sortKey": 42.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PCMT42",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Predator Compound Tube - [PCMT42]",
      "description": "Columbia Compound Tubes have taken the market place by storm. Finally a high quality long lasting tube that is easy to push. We have had many customers, after trying this tube, report back that they changed over their entire fleet. Now we introduce the carbon fiber version.",
      "price": 217.0,
      "regularPrice": 217.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PCMT42",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "PCMT42",
        "Semi Automatic Taping Tools",
        "carbon fiber",
        "compound tube",
        "predator",
        "semi automatic",
        "syringe"
      ],
      "attributes": [],
      "optionGroup": "corner_applicator",
      "sizeLabel": "PCMT42",
      "sortKey": 42.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CMT55",
      "parentSku": "COL-COLUMBIA-COMPOUND-TUBE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Compound Tube - [CMT55]",
      "description": "Columbia Compound Tubes have taken the market place by storm. Finally a high quality long lasting tube that is easy to push. We have had many customers, after trying this tube, report back that they changed over their entire fleet.",
      "price": 190.0,
      "regularPrice": 190.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CMT55",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "CMT24",
        "CMT32",
        "CMT42",
        "CMT55",
        "Columbia",
        "Semi Automatic Taping Tools",
        "colombia",
        "compound tube",
        "semi automatic",
        "syringe"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "55\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "corner_applicator",
      "sizeLabel": "Size: 55\"",
      "sortKey": 55.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CEXT90",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia External 90° Applicator - [CEXT90]",
      "description": "The Columbia External \"Bead Coater\" is best paired with the Columbia Compound Tube and coats both Bullnose and Standard types of Bead.",
      "price": 98.0,
      "regularPrice": 98.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CEXT90",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "CEXT90",
        "Columbia",
        "Semi Automatic Taping Tools",
        "applicator",
        "colombia",
        "external 90",
        "external applicator",
        "semi automatic"
      ],
      "attributes": [],
      "optionGroup": "corner_applicator",
      "sizeLabel": "CEXT90",
      "sortKey": 90.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "BF",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Box Filler - [BF]",
      "description": "Available for both our regular and Tallboy pumps, these aluminum and stainless steel attachments are tough and effective. The Box Filler makes filling your Flat Boxes, Nail Spotters and Corner Boxes a dream.",
      "price": 52.0,
      "regularPrice": 52.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "BF",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "BF",
        "BF box filler",
        "Columbia",
        "box filler",
        "colombia"
      ],
      "attributes": [],
      "optionGroup": "corner_applicator",
      "sizeLabel": "BF",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CLT-BF",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Cam Lock Tube Box Filler - [CLT-BF]",
      "description": "Our Cam Lock Tube Box Filler is a simple attachment to the Cam Lock Compound Tube, that allows you to easily fill your Flat Finishing Boxes without the use of a Hot Mud Pump. This is a great addition to any finisher's tool collection.",
      "price": 66.0,
      "regularPrice": 66.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CLT-BF",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "CLT-BF",
        "CLTBF",
        "Columbia",
        "box filler",
        "cam lock tube",
        "cam lock tube box filler",
        "colombia",
        "compound tube attachment",
        "compound tube filler",
        "filler tube attachment",
        "semi automatic"
      ],
      "attributes": [],
      "optionGroup": "corner_applicator",
      "sizeLabel": "CLT-BF",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CFLT",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Flat Applicator - [CFLT]",
      "description": "Best paired with the Columbia Compound Tube and is used to pre fill flat joints",
      "price": 60.0,
      "regularPrice": 60.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CFLT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "CFLT",
        "Columbia",
        "Flat Applicator",
        "Semi Automatic Taping Tools",
        "applicator",
        "colombia",
        "semi automatic"
      ],
      "attributes": [],
      "optionGroup": "corner_applicator",
      "sizeLabel": "CFLT",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TBBF",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Tall Boy Box Filler - [TBBF]",
      "description": "Available for both our regular and Tallboy pumps, these aluminum and stainless steel attachments are tough and effective. The Box Filler makes filling your Flat Boxes, Nail Spotters and Corner Boxes a dream.",
      "price": 52.0,
      "regularPrice": 52.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TBBF",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "TBBF",
        "box filler",
        "colombia",
        "tall boy box filler"
      ],
      "attributes": [],
      "optionGroup": "corner_applicator",
      "sizeLabel": "TBBF",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CR",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Corner Roller - [CR]",
      "description": "The slickest, most durable roller on the market! Manufactured with a die-cast head, and hardened stainless steel top rollers for long lasting angle work.",
      "price": 141.0,
      "regularPrice": 141.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CR",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "colombia",
        "columbia corner roller",
        "corner roller",
        "cr",
        "roller",
        "semi automatic"
      ],
      "attributes": [],
      "optionGroup": "corner_roller",
      "sizeLabel": "CR",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CPFGN",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Powerfill 5 Gallon Taper Gooseneck Fill Tube - [CPFGN]",
      "description": "Add this to a Standard Series PowerFill 3.5 to easily fill automatic taping tools.",
      "price": 275.0,
      "regularPrice": 275.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CPFGN",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "CPFGN",
        "Columbia",
        "goose neck",
        "gooseneck"
      ],
      "attributes": [],
      "optionGroup": "filler_adapter",
      "sizeLabel": "CPFGN",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "GN",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Gooseneck - [GN]",
      "description": "Treated stainless steel tubing",
      "price": 86.0,
      "regularPrice": 86.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "GN",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "GN",
        "colombia",
        "goose neck",
        "gooseneck"
      ],
      "attributes": [],
      "optionGroup": "filler_adapter",
      "sizeLabel": "GN",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TBGN",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Tall Boy Gooseneck - [TBGN]",
      "description": "Works with the Columbia Tall Boy Pump, it allows for height adjustable support and makes filling an Automatic Taper a dream.",
      "price": 124.0,
      "regularPrice": 124.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TBGN",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "TBMP",
        "colombia",
        "gooseneck",
        "tall boy",
        "tall boy gooseneck"
      ],
      "attributes": [],
      "optionGroup": "filler_adapter",
      "sizeLabel": "TBGN",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5.5FBBB",
      "parentSku": "COL-COLUMBIA-FAT-BOY-BOX",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Fat Boy Finishing Box - [5.5FBBB]",
      "description": "Columbia offers the widest range of high quality, high capacity finishing boxes in the world. From our 5.5″ Fat Boy to our 12″, they are all star performers. Well-built and fine-tuned to offer great flat joints for years. We have been told for years that our boxes are the smoothest finishing and easiest to push, and...",
      "price": 382.0,
      "regularPrice": 382.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5.5FBBB",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10FBB",
        "12FBB",
        "5.5FBB",
        "8FBB",
        "Automatic Taping Tools",
        "Columbia",
        "colombia",
        "finishing box",
        "flat box",
        "flatbox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "5.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 5.5\"",
      "sortKey": 5.5,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5.5FFB",
      "parentSku": "COL-COLUMBIA-FLAT-FINISHING-BOXES",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Flat Finishing Box - [5.5FFB]",
      "description": "Available in sizes: 5.5″, 7″, 8″, 10″, 12″ & 14″",
      "price": 363.0,
      "regularPrice": 363.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5.5FFB",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10FFB",
        "12FFB",
        "14FFB",
        "5.5FFB",
        "7FFB",
        "8FFB",
        "Automatic Taping Tools",
        "Columbia",
        "automatic taping tools",
        "colombia",
        "flat box",
        "flatbox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "5.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 5.5\"",
      "sortKey": 5.5,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "7FFB",
      "parentSku": "COL-COLUMBIA-FLAT-FINISHING-BOXES",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Flat Finishing Box - [7FFB]",
      "description": "Available in sizes: 5.5″, 7″, 8″, 10″, 12″ & 14″",
      "price": 367.0,
      "regularPrice": 367.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "7FFB",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10FFB",
        "12FFB",
        "14FFB",
        "5.5FFB",
        "7FFB",
        "8FFB",
        "Automatic Taping Tools",
        "Columbia",
        "automatic taping tools",
        "colombia",
        "flat box",
        "flatbox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 7\"",
      "sortKey": 7.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "8FBBA",
      "parentSku": "COL-COLUMBIA-AUTOMATIC-FAT-BOY-FLAT-BOX",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Automatic Fat Boy Finishing Box - [8FBBA]",
      "description": "Columbia offers the widest range of high quality Flat Boxes in the world. The Automatic Flat Boxes reduce the need to push the compound on to the wall. By engaging, the box springs put pressure on the compound chamber requiring only a light push to operate the box. Well-built and fine-tuned to offer great flat joint...",
      "price": 431.0,
      "regularPrice": 431.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "8FBBA",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10FBBA",
        "12FBBA",
        "8FBBA",
        "Automatic Taping Tools",
        "Columbia",
        "auto box",
        "auto flat",
        "auto flat box",
        "automatic",
        "automatic flat box",
        "colombia",
        "flat",
        "flat box"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 8\"",
      "sortKey": 8.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "8FFBA",
      "parentSku": "COL-COLUMBIA-AUTOMATIC-FLAT-BOX",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Automatic Flat Finishing Box - [8FFBA]",
      "description": "Columbia offers the widest range of high quality Flat Boxes in the world. The Automatic Flat Boxes reduce the need to push the compound on to the wall. By engaging, the box springs put pressure on the compound chamber requiring only a light push to operate the box. Well-built and fine-tuned to offer great flat joint...",
      "price": 397.0,
      "regularPrice": 397.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "8FFBA",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10FFBA",
        "12FFBA",
        "14FFBA",
        "8FFBA",
        "Automatic Taping Tools",
        "Columbia",
        "auto box",
        "auto flat",
        "auto flat box",
        "automatic",
        "automatic flat box",
        "colombia",
        "flat box",
        "flatbox",
        "power assist"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 8\"",
      "sortKey": 8.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "8FBBB",
      "parentSku": "COL-COLUMBIA-FAT-BOY-BOX",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Fat Boy Finishing Box - [8FBBB]",
      "description": "Columbia offers the widest range of high quality, high capacity finishing boxes in the world. From our 5.5″ Fat Boy to our 12″, they are all star performers. Well-built and fine-tuned to offer great flat joints for years. We have been told for years that our boxes are the smoothest finishing and easiest to push, and...",
      "price": 401.0,
      "regularPrice": 401.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "8FBBB",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10FBB",
        "12FBB",
        "5.5FBB",
        "8FBB",
        "Automatic Taping Tools",
        "Columbia",
        "colombia",
        "finishing box",
        "flat box",
        "flatbox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 8\"",
      "sortKey": 8.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "8FFB",
      "parentSku": "COL-COLUMBIA-FLAT-FINISHING-BOXES",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Flat Finishing Box - [8FFB]",
      "description": "Available in sizes: 5.5″, 7″, 8″, 10″, 12″ & 14″",
      "price": 371.0,
      "regularPrice": 371.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "8FFB",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10FFB",
        "12FFB",
        "14FFB",
        "5.5FFB",
        "7FFB",
        "8FFB",
        "Automatic Taping Tools",
        "Columbia",
        "automatic taping tools",
        "colombia",
        "flat box",
        "flatbox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 8\"",
      "sortKey": 8.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "8ITFB",
      "parentSku": "COL-COLUMBIA-INSIDE-TRACK-FAT-BOY-BOX",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Inside Track Fat Boy Finishing Box - [8ITFB]",
      "description": "(8ITFB, 10ITFB, 12ITFB) Columbia offers the widest range of high quality Flat Boxes in the world. From our 5.5” specialty box to our 14”, they are all star performers. Well-built and fine-tuned to offer great flat joints for years. We have been told for years that our boxes are the smoothest finishing and easiest to...",
      "price": 401.0,
      "regularPrice": 401.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "8ITFB",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10ITFB",
        "12ITFB",
        "8ITFB",
        "Automatic Taping Tools",
        "Columbia",
        "colombia",
        "flat box",
        "flatbox",
        "inside track",
        "inside track box",
        "insidetrack"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 8\"",
      "sortKey": 8.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "10FBBA",
      "parentSku": "COL-COLUMBIA-AUTOMATIC-FAT-BOY-FLAT-BOX",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Automatic Fat Boy Finishing Box - [10FBBA]",
      "description": "Columbia offers the widest range of high quality Flat Boxes in the world. The Automatic Flat Boxes reduce the need to push the compound on to the wall. By engaging, the box springs put pressure on the compound chamber requiring only a light push to operate the box. Well-built and fine-tuned to offer great flat joint...",
      "price": 435.0,
      "regularPrice": 435.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "10FBBA",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10FBBA",
        "12FBBA",
        "8FBBA",
        "Automatic Taping Tools",
        "Columbia",
        "auto box",
        "auto flat",
        "auto flat box",
        "automatic",
        "automatic flat box",
        "colombia",
        "flat",
        "flat box"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 10\"",
      "sortKey": 10.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "10FFBA",
      "parentSku": "COL-COLUMBIA-AUTOMATIC-FLAT-BOX",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Automatic Flat Finishing Box - [10FFBA]",
      "description": "Columbia offers the widest range of high quality Flat Boxes in the world. The Automatic Flat Boxes reduce the need to push the compound on to the wall. By engaging, the box springs put pressure on the compound chamber requiring only a light push to operate the box. Well-built and fine-tuned to offer great flat joint...",
      "price": 401.0,
      "regularPrice": 401.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "10FFBA",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10FFBA",
        "12FFBA",
        "14FFBA",
        "8FFBA",
        "Automatic Taping Tools",
        "Columbia",
        "auto box",
        "auto flat",
        "auto flat box",
        "automatic",
        "automatic flat box",
        "colombia",
        "flat box",
        "flatbox",
        "power assist"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 10\"",
      "sortKey": 10.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "10FBBB",
      "parentSku": "COL-COLUMBIA-FAT-BOY-BOX",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Fat Boy Finishing Box - [10FBBB]",
      "description": "Columbia offers the widest range of high quality, high capacity finishing boxes in the world. From our 5.5″ Fat Boy to our 12″, they are all star performers. Well-built and fine-tuned to offer great flat joints for years. We have been told for years that our boxes are the smoothest finishing and easiest to push, and...",
      "price": 405.0,
      "regularPrice": 405.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "10FBBB",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10FBB",
        "12FBB",
        "5.5FBB",
        "8FBB",
        "Automatic Taping Tools",
        "Columbia",
        "colombia",
        "finishing box",
        "flat box",
        "flatbox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 10\"",
      "sortKey": 10.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "10FFB",
      "parentSku": "COL-COLUMBIA-FLAT-FINISHING-BOXES",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Flat Finishing Box - [10FFB]",
      "description": "Available in sizes: 5.5″, 7″, 8″, 10″, 12″ & 14″",
      "price": 375.0,
      "regularPrice": 375.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "10FFB",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10FFB",
        "12FFB",
        "14FFB",
        "5.5FFB",
        "7FFB",
        "8FFB",
        "Automatic Taping Tools",
        "Columbia",
        "automatic taping tools",
        "colombia",
        "flat box",
        "flatbox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 10\"",
      "sortKey": 10.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "10ITFB",
      "parentSku": "COL-COLUMBIA-INSIDE-TRACK-FAT-BOY-BOX",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Inside Track Fat Boy Finishing Box - [10ITFB]",
      "description": "(8ITFB, 10ITFB, 12ITFB) Columbia offers the widest range of high quality Flat Boxes in the world. From our 5.5” specialty box to our 14”, they are all star performers. Well-built and fine-tuned to offer great flat joints for years. We have been told for years that our boxes are the smoothest finishing and easiest to...",
      "price": 405.0,
      "regularPrice": 405.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "10ITFB",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10ITFB",
        "12ITFB",
        "8ITFB",
        "Automatic Taping Tools",
        "Columbia",
        "colombia",
        "flat box",
        "flatbox",
        "inside track",
        "inside track box",
        "insidetrack"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 10\"",
      "sortKey": 10.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "12FBBA",
      "parentSku": "COL-COLUMBIA-AUTOMATIC-FAT-BOY-FLAT-BOX",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Automatic Fat Boy Finishing Box - [12FBBA]",
      "description": "Columbia offers the widest range of high quality Flat Boxes in the world. The Automatic Flat Boxes reduce the need to push the compound on to the wall. By engaging, the box springs put pressure on the compound chamber requiring only a light push to operate the box. Well-built and fine-tuned to offer great flat joint...",
      "price": 443.0,
      "regularPrice": 443.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "12FBBA",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10FBBA",
        "12FBBA",
        "8FBBA",
        "Automatic Taping Tools",
        "Columbia",
        "auto box",
        "auto flat",
        "auto flat box",
        "automatic",
        "automatic flat box",
        "colombia",
        "flat",
        "flat box"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 12\"",
      "sortKey": 12.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "12FFBA",
      "parentSku": "COL-COLUMBIA-AUTOMATIC-FLAT-BOX",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Automatic Flat Finishing Box - [12FFBA]",
      "description": "Columbia offers the widest range of high quality Flat Boxes in the world. The Automatic Flat Boxes reduce the need to push the compound on to the wall. By engaging, the box springs put pressure on the compound chamber requiring only a light push to operate the box. Well-built and fine-tuned to offer great flat joint...",
      "price": 405.0,
      "regularPrice": 405.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "12FFBA",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10FFBA",
        "12FFBA",
        "14FFBA",
        "8FFBA",
        "Automatic Taping Tools",
        "Columbia",
        "auto box",
        "auto flat",
        "auto flat box",
        "automatic",
        "automatic flat box",
        "colombia",
        "flat box",
        "flatbox",
        "power assist"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 12\"",
      "sortKey": 12.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "12FBBB",
      "parentSku": "COL-COLUMBIA-FAT-BOY-BOX",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Fat Boy Finishing Box - [12FBBB]",
      "description": "Columbia offers the widest range of high quality, high capacity finishing boxes in the world. From our 5.5″ Fat Boy to our 12″, they are all star performers. Well-built and fine-tuned to offer great flat joints for years. We have been told for years that our boxes are the smoothest finishing and easiest to push, and...",
      "price": 414.0,
      "regularPrice": 414.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "12FBBB",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10FBB",
        "12FBB",
        "5.5FBB",
        "8FBB",
        "Automatic Taping Tools",
        "Columbia",
        "colombia",
        "finishing box",
        "flat box",
        "flatbox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 12\"",
      "sortKey": 12.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "12FFB",
      "parentSku": "COL-COLUMBIA-FLAT-FINISHING-BOXES",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Flat Finishing Box - [12FFB]",
      "description": "Available in sizes: 5.5″, 7″, 8″, 10″, 12″ & 14″",
      "price": 380.0,
      "regularPrice": 380.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "12FFB",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10FFB",
        "12FFB",
        "14FFB",
        "5.5FFB",
        "7FFB",
        "8FFB",
        "Automatic Taping Tools",
        "Columbia",
        "automatic taping tools",
        "colombia",
        "flat box",
        "flatbox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 12\"",
      "sortKey": 12.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "12ITFB",
      "parentSku": "COL-COLUMBIA-INSIDE-TRACK-FAT-BOY-BOX",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Inside Track Fat Boy Finishing Box - [12ITFB]",
      "description": "(8ITFB, 10ITFB, 12ITFB) Columbia offers the widest range of high quality Flat Boxes in the world. From our 5.5” specialty box to our 14”, they are all star performers. Well-built and fine-tuned to offer great flat joints for years. We have been told for years that our boxes are the smoothest finishing and easiest to...",
      "price": 414.0,
      "regularPrice": 414.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "12ITFB",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10ITFB",
        "12ITFB",
        "8ITFB",
        "Automatic Taping Tools",
        "Columbia",
        "colombia",
        "flat box",
        "flatbox",
        "inside track",
        "inside track box",
        "insidetrack"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 12\"",
      "sortKey": 12.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "14FFBA",
      "parentSku": "COL-COLUMBIA-AUTOMATIC-FLAT-BOX",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Automatic Flat Finishing Box - [14FFBA]",
      "description": "Columbia offers the widest range of high quality Flat Boxes in the world. The Automatic Flat Boxes reduce the need to push the compound on to the wall. By engaging, the box springs put pressure on the compound chamber requiring only a light push to operate the box. Well-built and fine-tuned to offer great flat joint...",
      "price": 409.0,
      "regularPrice": 409.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "14FFBA",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10FFBA",
        "12FFBA",
        "14FFBA",
        "8FFBA",
        "Automatic Taping Tools",
        "Columbia",
        "auto box",
        "auto flat",
        "auto flat box",
        "automatic",
        "automatic flat box",
        "colombia",
        "flat box",
        "flatbox",
        "power assist"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 14\"",
      "sortKey": 14.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "14FFB",
      "parentSku": "COL-COLUMBIA-FLAT-FINISHING-BOXES",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Flat Finishing Box - [14FFB]",
      "description": "Available in sizes: 5.5″, 7″, 8″, 10″, 12″ & 14″",
      "price": 384.0,
      "regularPrice": 384.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "14FFB",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10FFB",
        "12FFB",
        "14FFB",
        "5.5FFB",
        "7FFB",
        "8FFB",
        "Automatic Taping Tools",
        "Columbia",
        "automatic taping tools",
        "colombia",
        "flat box",
        "flatbox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 14\"",
      "sortKey": 14.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PC1H",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Predator One Fixed Handle - [PC1H]",
      "description": "The Columbia Predator One Fixed Handle is designed to work with your Columbia products universally. From the Nailspotters and Angleheads, to the Rollers and the Corner Boxes, the one system allows you to lighten your load and still utilize all the finishing tools you love. With the exception of the flat boxes, this...",
      "price": 62.0,
      "regularPrice": 62.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PC1H",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "PC1H",
        "carbon fiber",
        "columbia one",
        "corner roller handle",
        "fixed handle",
        "nail spotter handle",
        "predator",
        "semi automatic"
      ],
      "attributes": [],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "PC1H",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "C1HEXT",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia One Extendable Handle - 3' - 5' - [C1HEXT]",
      "description": "The Columbia One Handle is designed to work with your Columbia products universally. From the Nailspotters and Angleheads, to the Rollers and the Corner Boxes, the one system allows you to lighten your load and still utilize all the finishing tools you love. With the exception of the flat boxes, this one handle is a...",
      "price": 128.0,
      "regularPrice": 128.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "C1HEXT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "C1HEXT",
        "Columbia",
        "colombia",
        "columbia one",
        "corner roller handle",
        "extendable handle",
        "nail spotter handle",
        "semi automatic"
      ],
      "attributes": [],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "C1HEXT",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PC1HEXT",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Predator One Extendable Handle - 3' - 5' - [PC1HEXT]",
      "description": "The Columbia Predator One Extendable Handle is designed to work with your Columbia products universally. From the Nailspotters and Angleheads, to the Rollers and the Corner Boxes, the one system allows you to lighten your load and still utilize all the finishing tools you love. With the exception of the flat boxes,...",
      "price": 138.0,
      "regularPrice": 138.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PC1HEXT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "PC1HEXT",
        "carbon fiber",
        "columbia one",
        "corner roller handle",
        "extendable handle",
        "nail spotter handle",
        "predator",
        "semi automatic"
      ],
      "attributes": [],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "PC1HEXT",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "3BH",
      "parentSku": "COL-COLUMBIA-180-GRIP-FLAT-BOX-HANDLE-FIXED-LENGTH",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia 180 Grip Flat Box Handle (Fixed Length) - [3BH]",
      "description": "Never lose your grip.",
      "price": 174.0,
      "regularPrice": 174.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "3BH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "3bh",
        "42bh",
        "4bh",
        "5bh",
        "6bh",
        "Automatic Taping Tools",
        "Columbia",
        "bh",
        "colombia",
        "flat box handle",
        "flatbox handle"
      ],
      "attributes": [
        {
          "name": "Handle Length",
          "value": "3'",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "Handle Length: 3'",
      "sortKey": 180.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "42BH",
      "parentSku": "COL-COLUMBIA-180-GRIP-FLAT-BOX-HANDLE-FIXED-LENGTH",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia 180 Grip Flat Box Handle (Fixed Length) - [42BH]",
      "description": "Never lose your grip.",
      "price": 175.0,
      "regularPrice": 175.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "42BH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "3bh",
        "42bh",
        "4bh",
        "5bh",
        "6bh",
        "Automatic Taping Tools",
        "Columbia",
        "bh",
        "colombia",
        "flat box handle",
        "flatbox handle"
      ],
      "attributes": [
        {
          "name": "Handle Length",
          "value": "42\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "Handle Length: 42\"",
      "sortKey": 180.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4BH",
      "parentSku": "COL-COLUMBIA-180-GRIP-FLAT-BOX-HANDLE-FIXED-LENGTH",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia 180 Grip Flat Box Handle (Fixed Length) - [4BH]",
      "description": "Never lose your grip.",
      "price": 176.0,
      "regularPrice": 176.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4BH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "3bh",
        "42bh",
        "4bh",
        "5bh",
        "6bh",
        "Automatic Taping Tools",
        "Columbia",
        "bh",
        "colombia",
        "flat box handle",
        "flatbox handle"
      ],
      "attributes": [
        {
          "name": "Handle Length",
          "value": "4'",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "Handle Length: 4'",
      "sortKey": 180.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5BH",
      "parentSku": "COL-COLUMBIA-180-GRIP-FLAT-BOX-HANDLE-FIXED-LENGTH",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia 180 Grip Flat Box Handle (Fixed Length) - [5BH]",
      "description": "Never lose your grip.",
      "price": 177.0,
      "regularPrice": 177.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5BH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "3bh",
        "42bh",
        "4bh",
        "5bh",
        "6bh",
        "Automatic Taping Tools",
        "Columbia",
        "bh",
        "colombia",
        "flat box handle",
        "flatbox handle"
      ],
      "attributes": [
        {
          "name": "Handle Length",
          "value": "5'",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "Handle Length: 5'",
      "sortKey": 180.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "6BH",
      "parentSku": "COL-COLUMBIA-180-GRIP-FLAT-BOX-HANDLE-FIXED-LENGTH",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia 180 Grip Flat Box Handle (Fixed Length) - [6BH]",
      "description": "Never lose your grip.",
      "price": 178.0,
      "regularPrice": 178.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "6BH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "3bh",
        "42bh",
        "4bh",
        "5bh",
        "6bh",
        "Automatic Taping Tools",
        "Columbia",
        "bh",
        "colombia",
        "flat box handle",
        "flatbox handle"
      ],
      "attributes": [
        {
          "name": "Handle Length",
          "value": "6'",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "Handle Length: 6'",
      "sortKey": 180.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CMH",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Closet Monster Flat Box Handle - [CMH]",
      "description": "The Closet Monster Flat Box Handle is especially useful for boxing tight areas where a longer handle will not fit. At approximately 19 inches (50cm) in overall all length this short handle is a great option for closets, behind scaffolding, certain high work, etc. Like all of our Flat Box Handles, the Closet Monster...",
      "price": 115.0,
      "regularPrice": 115.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CMH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "CMH",
        "Columbia",
        "closet monster handle",
        "colombia",
        "flat box handle"
      ],
      "attributes": [],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "CMH",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "12-4.3-0.3-G-C",
      "parentSku": "COL-COLUMBIA-SUPER-FLEX-0-3-FLAT-BLADE-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Super Flex 0.3 Flat Blade Stainless Steel Finishing Trowel - [12-4.3-0.3-G-C]",
      "description": "Premium Finishing Trowels",
      "price": 65.0,
      "regularPrice": 65.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "12-4.3-0.3-G-C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "12-4.3-0.3-G-C",
        "14-4.3-0.3-G-C",
        "Columbia",
        "Taping & Finishing Tools",
        "flat trowel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.3\" x 12\" Cork Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.3\" x 12\" Cork Handle",
      "sortKey": 0.3,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "14-4.3-0.3-G-C",
      "parentSku": "COL-COLUMBIA-SUPER-FLEX-0-3-FLAT-BLADE-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Super Flex 0.3 Flat Blade Stainless Steel Finishing Trowel - [14-4.3-0.3-G-C]",
      "description": "Premium Finishing Trowels",
      "price": 70.0,
      "regularPrice": 70.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "14-4.3-0.3-G-C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "12-4.3-0.3-G-C",
        "14-4.3-0.3-G-C",
        "Columbia",
        "Taping & Finishing Tools",
        "flat trowel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.3\" x 14\" Cork Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.3\" x 14\" Cork Handle",
      "sortKey": 0.3,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "12-4.7-0.4-S-C-C",
      "parentSku": "COL-COLUMBIA-SILVER-0-4-CURVED-BLADE-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Silver 0.4 Curved Blade Stainless Steel Finishing Trowel - [12-4.7-0.4-S-C-C]",
      "description": "Premium Finishing Trowels",
      "price": 59.0,
      "regularPrice": 59.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "12-4.7-0.4-S-C-C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "12-4.7-0.4-S-C-C",
        "14-4.7-0.4-S-C-C",
        "Columbia",
        "Taping & Finishing Tools",
        "curved trowel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.7\" x 12\" Cork Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.7\" x 12\" Cork Handle",
      "sortKey": 0.4,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "14-4.7-0.4-S-C-C",
      "parentSku": "COL-COLUMBIA-SILVER-0-4-CURVED-BLADE-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Silver 0.4 Curved Blade Stainless Steel Finishing Trowel - [14-4.7-0.4-S-C-C]",
      "description": "Premium Finishing Trowels",
      "price": 65.0,
      "regularPrice": 65.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "14-4.7-0.4-S-C-C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "12-4.7-0.4-S-C-C",
        "14-4.7-0.4-S-C-C",
        "Columbia",
        "Taping & Finishing Tools",
        "curved trowel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.7\" x 14\" Cork Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.7\" x 14\" Cork Handle",
      "sortKey": 0.4,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "12-4.7-0.7-G-C-C",
      "parentSku": "COL-COLUMBIA-PRO-FLEX-0-7-CURVED-BLADE-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Pro Flex 0.7 Curved Blade Stainless Steel Finishing Trowel - [12-4.7-0.7-G-C-C]",
      "description": "Premium Finishing Trowels",
      "price": 63.0,
      "regularPrice": 63.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "12-4.7-0.7-G-C-C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "12-4.7-0.7-G-C-C",
        "14-4.7-0.7-G-C-C",
        "16-4.7-0.7-G-C-C",
        "Columbia",
        "Taping & Finishing Tools",
        "curved trowel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.7\" x 12\" Cork Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.7\" x 12\" Cork Handle",
      "sortKey": 0.7,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "14-4.7-0.7-G-C-C",
      "parentSku": "COL-COLUMBIA-PRO-FLEX-0-7-CURVED-BLADE-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Pro Flex 0.7 Curved Blade Stainless Steel Finishing Trowel - [14-4.7-0.7-G-C-C]",
      "description": "Premium Finishing Trowels",
      "price": 68.0,
      "regularPrice": 68.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "14-4.7-0.7-G-C-C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "12-4.7-0.7-G-C-C",
        "14-4.7-0.7-G-C-C",
        "16-4.7-0.7-G-C-C",
        "Columbia",
        "Taping & Finishing Tools",
        "curved trowel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.7\" x 14\" Cork Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.7\" x 14\" Cork Handle",
      "sortKey": 0.7,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "16-4.7-0.7-G-C-C",
      "parentSku": "COL-COLUMBIA-PRO-FLEX-0-7-CURVED-BLADE-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Pro Flex 0.7 Curved Blade Stainless Steel Finishing Trowel - [16-4.7-0.7-G-C-C]",
      "description": "Premium Finishing Trowels",
      "price": 74.0,
      "regularPrice": 74.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "16-4.7-0.7-G-C-C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "12-4.7-0.7-G-C-C",
        "14-4.7-0.7-G-C-C",
        "16-4.7-0.7-G-C-C",
        "Columbia",
        "Taping & Finishing Tools",
        "curved trowel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.7\" x 16\" Cork Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.7\" x 16\" Cork Handle",
      "sortKey": 0.7,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "12-4.7-0.7-G-C",
      "parentSku": "COL-DEWALT-PRO-FLEX-FLAT-BLADE-STAINLESS-STEEL-FINISHING-TROWEL-COPY",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Pro Flex 0.7 Flat Blade Stainless Steel Finishing Trowel - [12-4.7-0.7-G-C]",
      "description": "Premium Finishing Trowels",
      "price": 63.0,
      "regularPrice": 63.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "12-4.7-0.7-G-C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "12-4.7-0.7-G-C",
        "14-4.7-0.7-G-C",
        "16-4.7-0.7-G-C",
        "18-4.7-0.7-G-C",
        "Columbia",
        "Taping & Finishing Tools",
        "flat trowel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.7\" x 12\" Cork Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.7\" x 12\" Cork Handle",
      "sortKey": 0.7,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "14-4.7-0.7-G-C",
      "parentSku": "COL-DEWALT-PRO-FLEX-FLAT-BLADE-STAINLESS-STEEL-FINISHING-TROWEL-COPY",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Pro Flex 0.7 Flat Blade Stainless Steel Finishing Trowel - [14-4.7-0.7-G-C]",
      "description": "Premium Finishing Trowels",
      "price": 68.0,
      "regularPrice": 68.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "14-4.7-0.7-G-C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "12-4.7-0.7-G-C",
        "14-4.7-0.7-G-C",
        "16-4.7-0.7-G-C",
        "18-4.7-0.7-G-C",
        "Columbia",
        "Taping & Finishing Tools",
        "flat trowel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.7\" x 14\" Cork Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.7\" x 14\" Cork Handle",
      "sortKey": 0.7,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "16-4.7-0.7-G-C",
      "parentSku": "COL-DEWALT-PRO-FLEX-FLAT-BLADE-STAINLESS-STEEL-FINISHING-TROWEL-COPY",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Pro Flex 0.7 Flat Blade Stainless Steel Finishing Trowel - [16-4.7-0.7-G-C]",
      "description": "Premium Finishing Trowels",
      "price": 74.0,
      "regularPrice": 74.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "16-4.7-0.7-G-C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "12-4.7-0.7-G-C",
        "14-4.7-0.7-G-C",
        "16-4.7-0.7-G-C",
        "18-4.7-0.7-G-C",
        "Columbia",
        "Taping & Finishing Tools",
        "flat trowel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.7\" x 16\" Cork Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.7\" x 16\" Cork Handle",
      "sortKey": 0.7,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "18-4.7-0.7-G-C",
      "parentSku": "COL-DEWALT-PRO-FLEX-FLAT-BLADE-STAINLESS-STEEL-FINISHING-TROWEL-COPY",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Pro Flex 0.7 Flat Blade Stainless Steel Finishing Trowel - [18-4.7-0.7-G-C]",
      "description": "Premium Finishing Trowels",
      "price": 78.0,
      "regularPrice": 78.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "18-4.7-0.7-G-C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "12-4.7-0.7-G-C",
        "14-4.7-0.7-G-C",
        "16-4.7-0.7-G-C",
        "18-4.7-0.7-G-C",
        "Columbia",
        "Taping & Finishing Tools",
        "flat trowel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.7\" x 18\" Cork Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.7\" x 18\" Cork Handle",
      "sortKey": 0.7,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "OPPK1.5",
      "parentSku": "COL-COLUMBIA-ONE-PIECE-STAINLESS-STEEL-PUTTY-KNIVES",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia One Piece Stainless Steel Putty Knives - [OPPK1.5]",
      "description": "Columbia Tools is proud to launch our all-new One Piece Putty Knives – precision-crafted from stainless steel for strength, flexibility, and all-day comfort.",
      "price": 16.0,
      "regularPrice": 16.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "OPPK1.5",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "OPPK1.5",
        "OPPK2",
        "OPPK3",
        "OPPK4",
        "OPPK5",
        "OPPK6",
        "OPPK8",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "1.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 1.5\"",
      "sortKey": 1.5,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "NPK1.5",
      "parentSku": "COL-COLUMBIA-STAINLESS-STEEL-PUTTY-KNIVES-WITH-NYLON-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Putty Knives with Nylon Handle - [NPK1.5]",
      "description": "Columbia is excited to announce three additions to our premium hand tool line, crafted for top performance in drywall finishing.",
      "price": 11.0,
      "regularPrice": 11.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "NPK1.5",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "NPK1.5",
        "NPK10",
        "NPK2",
        "NPK3",
        "NPK4",
        "NPK5",
        "NPK6",
        "NPK8",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "1.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 1.5\"",
      "sortKey": 1.5,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "OPPK2",
      "parentSku": "COL-COLUMBIA-ONE-PIECE-STAINLESS-STEEL-PUTTY-KNIVES",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia One Piece Stainless Steel Putty Knives - [OPPK2]",
      "description": "Columbia Tools is proud to launch our all-new One Piece Putty Knives – precision-crafted from stainless steel for strength, flexibility, and all-day comfort.",
      "price": 16.0,
      "regularPrice": 16.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "OPPK2",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "OPPK1.5",
        "OPPK2",
        "OPPK3",
        "OPPK4",
        "OPPK5",
        "OPPK6",
        "OPPK8",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "2\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 2\"",
      "sortKey": 2.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "NPK2",
      "parentSku": "COL-COLUMBIA-STAINLESS-STEEL-PUTTY-KNIVES-WITH-NYLON-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Putty Knives with Nylon Handle - [NPK2]",
      "description": "Columbia is excited to announce three additions to our premium hand tool line, crafted for top performance in drywall finishing.",
      "price": 12.0,
      "regularPrice": 12.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "NPK2",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "NPK1.5",
        "NPK10",
        "NPK2",
        "NPK3",
        "NPK4",
        "NPK5",
        "NPK6",
        "NPK8",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "2\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 2\"",
      "sortKey": 2.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "3NPK4",
      "parentSku": "COL-COLUMBIA-3WAY-STAINLESS-STEEL-PUTTY-KNIVES-WITH-NYLON-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia 3Way Stainless Steel Putty Knives with Nylon Handle - [3NPK4]",
      "description": "Columbia Tools is proud to launch all-new Three-Way Knives – expertly designed to make finishing three-way drywall corners faster, cleaner, and easier than ever.",
      "price": 14.0,
      "regularPrice": 14.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "3NPK4",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "3NPK4",
        "3NPK5",
        "3NPK6",
        "Columbia",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4\"",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "3NPK5",
      "parentSku": "COL-COLUMBIA-3WAY-STAINLESS-STEEL-PUTTY-KNIVES-WITH-NYLON-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia 3Way Stainless Steel Putty Knives with Nylon Handle - [3NPK5]",
      "description": "Columbia Tools is proud to launch all-new Three-Way Knives – expertly designed to make finishing three-way drywall corners faster, cleaner, and easier than ever.",
      "price": 17.0,
      "regularPrice": 17.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "3NPK5",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "3NPK4",
        "3NPK5",
        "3NPK6",
        "Columbia",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 5\"",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "3NPK6",
      "parentSku": "COL-COLUMBIA-3WAY-STAINLESS-STEEL-PUTTY-KNIVES-WITH-NYLON-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia 3Way Stainless Steel Putty Knives with Nylon Handle - [3NPK6]",
      "description": "Columbia Tools is proud to launch all-new Three-Way Knives – expertly designed to make finishing three-way drywall corners faster, cleaner, and easier than ever.",
      "price": 17.0,
      "regularPrice": 17.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "3NPK6",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "3NPK4",
        "3NPK5",
        "3NPK6",
        "Columbia",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "6\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 6\"",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "OPPK3",
      "parentSku": "COL-COLUMBIA-ONE-PIECE-STAINLESS-STEEL-PUTTY-KNIVES",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia One Piece Stainless Steel Putty Knives - [OPPK3]",
      "description": "Columbia Tools is proud to launch our all-new One Piece Putty Knives – precision-crafted from stainless steel for strength, flexibility, and all-day comfort.",
      "price": 17.0,
      "regularPrice": 17.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "OPPK3",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "OPPK1.5",
        "OPPK2",
        "OPPK3",
        "OPPK4",
        "OPPK5",
        "OPPK6",
        "OPPK8",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 3\"",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "NPK3",
      "parentSku": "COL-COLUMBIA-STAINLESS-STEEL-PUTTY-KNIVES-WITH-NYLON-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Putty Knives with Nylon Handle - [NPK3]",
      "description": "Columbia is excited to announce three additions to our premium hand tool line, crafted for top performance in drywall finishing.",
      "price": 12.0,
      "regularPrice": 12.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "NPK3",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "NPK1.5",
        "NPK10",
        "NPK2",
        "NPK3",
        "NPK4",
        "NPK5",
        "NPK6",
        "NPK8",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 3\"",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PJK3.5",
      "parentSku": "COL-COLUMBIA-SPECIALTY-KNIFE-WITH-NYLON-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Specialty Knife with Nylon Handle - [PJK3.5]",
      "description": "Columbia is excited to announce three additions to our premium hand tool line, crafted for top performance in drywall finishing.",
      "price": 14.0,
      "regularPrice": 14.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PJK3.5",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "CJK6",
        "Columbia",
        "PJK3.5",
        "Taping & Finishing Tools",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Option",
          "value": "3.5\" Pointed Knife",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Option: 3.5\" Pointed Knife",
      "sortKey": 3.5,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "OPPK4",
      "parentSku": "COL-COLUMBIA-ONE-PIECE-STAINLESS-STEEL-PUTTY-KNIVES",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia One Piece Stainless Steel Putty Knives - [OPPK4]",
      "description": "Columbia Tools is proud to launch our all-new One Piece Putty Knives – precision-crafted from stainless steel for strength, flexibility, and all-day comfort.",
      "price": 18.0,
      "regularPrice": 18.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "OPPK4",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "OPPK1.5",
        "OPPK2",
        "OPPK3",
        "OPPK4",
        "OPPK5",
        "OPPK6",
        "OPPK8",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4\"",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CGPK4",
      "parentSku": "COL-COLUMBIA-STAINLESS-STEEL-JOINT-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Joint Knife with Soft Grip Handle - [CGPK4]",
      "description": "Columbia Tools is proud to launch our all-new Columbia Taping Knives – crafted for professionals who demand speed, precision, comfort, and durability on every job.",
      "price": 15.0,
      "regularPrice": 15.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CGPK4",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "CGPK4",
        "CGPK5",
        "CGPK6",
        "Columbia",
        "Taping & Finishing Tools",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4\"",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "NPK4",
      "parentSku": "COL-COLUMBIA-STAINLESS-STEEL-PUTTY-KNIVES-WITH-NYLON-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Putty Knives with Nylon Handle - [NPK4]",
      "description": "Columbia is excited to announce three additions to our premium hand tool line, crafted for top performance in drywall finishing.",
      "price": 14.0,
      "regularPrice": 14.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "NPK4",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "NPK1.5",
        "NPK10",
        "NPK2",
        "NPK3",
        "NPK4",
        "NPK5",
        "NPK6",
        "NPK8",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4\"",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "OPPK5",
      "parentSku": "COL-COLUMBIA-ONE-PIECE-STAINLESS-STEEL-PUTTY-KNIVES",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia One Piece Stainless Steel Putty Knives - [OPPK5]",
      "description": "Columbia Tools is proud to launch our all-new One Piece Putty Knives – precision-crafted from stainless steel for strength, flexibility, and all-day comfort.",
      "price": 19.0,
      "regularPrice": 19.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "OPPK5",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "OPPK1.5",
        "OPPK2",
        "OPPK3",
        "OPPK4",
        "OPPK5",
        "OPPK6",
        "OPPK8",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 5\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CGPK5",
      "parentSku": "COL-COLUMBIA-STAINLESS-STEEL-JOINT-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Joint Knife with Soft Grip Handle - [CGPK5]",
      "description": "Columbia Tools is proud to launch our all-new Columbia Taping Knives – crafted for professionals who demand speed, precision, comfort, and durability on every job.",
      "price": 16.0,
      "regularPrice": 16.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CGPK5",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "CGPK4",
        "CGPK5",
        "CGPK6",
        "Columbia",
        "Taping & Finishing Tools",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "5",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 5",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "NPK5",
      "parentSku": "COL-COLUMBIA-STAINLESS-STEEL-PUTTY-KNIVES-WITH-NYLON-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Putty Knives with Nylon Handle - [NPK5]",
      "description": "Columbia is excited to announce three additions to our premium hand tool line, crafted for top performance in drywall finishing.",
      "price": 17.0,
      "regularPrice": 17.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "NPK5",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "NPK1.5",
        "NPK10",
        "NPK2",
        "NPK3",
        "NPK4",
        "NPK5",
        "NPK6",
        "NPK8",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 5\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "OPPK6",
      "parentSku": "COL-COLUMBIA-ONE-PIECE-STAINLESS-STEEL-PUTTY-KNIVES",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia One Piece Stainless Steel Putty Knives - [OPPK6]",
      "description": "Columbia Tools is proud to launch our all-new One Piece Putty Knives – precision-crafted from stainless steel for strength, flexibility, and all-day comfort.",
      "price": 20.0,
      "regularPrice": 20.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "OPPK6",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "OPPK1.5",
        "OPPK2",
        "OPPK3",
        "OPPK4",
        "OPPK5",
        "OPPK6",
        "OPPK8",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "6\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 6\"",
      "sortKey": 6.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CJK6",
      "parentSku": "COL-COLUMBIA-SPECIALTY-KNIFE-WITH-NYLON-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Specialty Knife with Nylon Handle - [CJK6]",
      "description": "Columbia is excited to announce three additions to our premium hand tool line, crafted for top performance in drywall finishing.",
      "price": 18.0,
      "regularPrice": 18.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CJK6",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "CJK6",
        "Columbia",
        "PJK3.5",
        "Taping & Finishing Tools",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Option",
          "value": "6\" Clipped Knife 30 Degree Angle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Option: 6\" Clipped Knife 30 Degree Angle",
      "sortKey": 6.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CGPK6",
      "parentSku": "COL-COLUMBIA-STAINLESS-STEEL-JOINT-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Joint Knife with Soft Grip Handle - [CGPK6]",
      "description": "Columbia Tools is proud to launch our all-new Columbia Taping Knives – crafted for professionals who demand speed, precision, comfort, and durability on every job.",
      "price": 17.0,
      "regularPrice": 17.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CGPK6",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "CGPK4",
        "CGPK5",
        "CGPK6",
        "Columbia",
        "Taping & Finishing Tools",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "6\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 6\"",
      "sortKey": 6.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "NPK6",
      "parentSku": "COL-COLUMBIA-STAINLESS-STEEL-PUTTY-KNIVES-WITH-NYLON-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Putty Knives with Nylon Handle - [NPK6]",
      "description": "Columbia is excited to announce three additions to our premium hand tool line, crafted for top performance in drywall finishing.",
      "price": 19.0,
      "regularPrice": 19.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "NPK6",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "NPK1.5",
        "NPK10",
        "NPK2",
        "NPK3",
        "NPK4",
        "NPK5",
        "NPK6",
        "NPK8",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "6\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 6\"",
      "sortKey": 6.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "OPPK8",
      "parentSku": "COL-COLUMBIA-ONE-PIECE-STAINLESS-STEEL-PUTTY-KNIVES",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia One Piece Stainless Steel Putty Knives - [OPPK8]",
      "description": "Columbia Tools is proud to launch our all-new One Piece Putty Knives – precision-crafted from stainless steel for strength, flexibility, and all-day comfort.",
      "price": 24.0,
      "regularPrice": 24.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "OPPK8",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "OPPK1.5",
        "OPPK2",
        "OPPK3",
        "OPPK4",
        "OPPK5",
        "OPPK6",
        "OPPK8",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 8\"",
      "sortKey": 8.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "NPK8",
      "parentSku": "COL-COLUMBIA-STAINLESS-STEEL-PUTTY-KNIVES-WITH-NYLON-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Putty Knives with Nylon Handle - [NPK8]",
      "description": "Columbia is excited to announce three additions to our premium hand tool line, crafted for top performance in drywall finishing.",
      "price": 20.0,
      "regularPrice": 20.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "NPK8",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "NPK1.5",
        "NPK10",
        "NPK2",
        "NPK3",
        "NPK4",
        "NPK5",
        "NPK6",
        "NPK8",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 8\"",
      "sortKey": 8.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CTK8",
      "parentSku": "COL-COLUMBIOA-STAINLESS-STEEL-TAPING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Taping Knife with Soft Grip Handle - [CTK8]",
      "description": "Columbia Tools is proud to launch our all-new Columbia Taping Knives – crafted for professionals who demand speed, precision, comfort, and durability on every job.",
      "price": 18.0,
      "regularPrice": 18.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CTK8",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "CTK10",
        "CTK12",
        "CTK14",
        "CTK8",
        "Columbia",
        "Taping & Finishing Tools",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 8\"",
      "sortKey": 8.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "9-1MT",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel 9-in-1 Putty Knife with Nylon Grip Handle - [9-1MT]",
      "description": "Columbia is excited to announce three additions to our premium hand tool line, crafted for top performance in drywall finishing.",
      "price": 14.0,
      "regularPrice": 14.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "9-1MT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "9-1MT",
        "Columbia",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [],
      "optionGroup": "hand_tool",
      "sizeLabel": "9-1MT",
      "sortKey": 9.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "OPPK10-1",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia One Piece Stainless Steel 10-in-1 Multi Tool - [OPPK10-1]",
      "description": "Columbia Tools is proud to launch all-new One Piece Putty Knives – precision-crafted from stainless steel for strength, flexibility, and all-day comfort.",
      "price": 18.0,
      "regularPrice": 18.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "OPPK10-1",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "OPPK10-1",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [],
      "optionGroup": "hand_tool",
      "sizeLabel": "OPPK10-1",
      "sortKey": 10.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "NPK10",
      "parentSku": "COL-COLUMBIA-STAINLESS-STEEL-PUTTY-KNIVES-WITH-NYLON-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Putty Knives with Nylon Handle - [NPK10]",
      "description": "Columbia is excited to announce three additions to our premium hand tool line, crafted for top performance in drywall finishing.",
      "price": 21.0,
      "regularPrice": 21.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "NPK10",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "NPK1.5",
        "NPK10",
        "NPK2",
        "NPK3",
        "NPK4",
        "NPK5",
        "NPK6",
        "NPK8",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 10\"",
      "sortKey": 10.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CTK10",
      "parentSku": "COL-COLUMBIOA-STAINLESS-STEEL-TAPING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Taping Knife with Soft Grip Handle - [CTK10]",
      "description": "Columbia Tools is proud to launch our all-new Columbia Taping Knives – crafted for professionals who demand speed, precision, comfort, and durability on every job.",
      "price": 19.0,
      "regularPrice": 19.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "CTK10",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "CTK10",
        "CTK12",
        "CTK14",
        "CTK8",
        "Columbia",
        "Taping & Finishing Tools",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 10\"",
      "sortKey": 10.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "C12MP",
      "parentSku": "COL-COLUMBIA-STAINLESS-STEEL-MUD-PAN-WITH-FREE-MUD-GRIP",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Mud Pan with Mud Grip - [C12MP]",
      "description": "Columbia Tools has launched the Columbia Mud Pan—the first in our new line of premium hand tools, designed for professionals who demand durability, comfort, and performance. Crafted from heavy-gauge stainless steel, this mud pan is built to withstand the toughest tasks, while its watertight, laser-welded seams ensur...",
      "price": 24.0,
      "regularPrice": 24.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "C12MP",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "C12MP",
        "C14MP",
        "C16MP",
        "Columbia",
        "Mud Pan",
        "Taping & Finishing Tools",
        "stainless steel mud pan"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\"",
      "sortKey": 12.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CTK12",
      "parentSku": "COL-COLUMBIOA-STAINLESS-STEEL-TAPING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Taping Knife with Soft Grip Handle - [CTK12]",
      "description": "Columbia Tools is proud to launch our all-new Columbia Taping Knives – crafted for professionals who demand speed, precision, comfort, and durability on every job.",
      "price": 20.0,
      "regularPrice": 20.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CTK12",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "CTK10",
        "CTK12",
        "CTK14",
        "CTK8",
        "Columbia",
        "Taping & Finishing Tools",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\"",
      "sortKey": 12.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "13-H-S",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Aluminum Finishing Hawk - [13-H-S]",
      "description": "Designed for professional drywall finishers for smooth gliding while using a trowel/knife.",
      "price": 50.0,
      "regularPrice": 50.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "13-H-S",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "13-H-C",
        "13-H-S",
        "Columbia",
        "Taping & Finishing Tools",
        "hawk"
      ],
      "attributes": [],
      "optionGroup": "hand_tool",
      "sizeLabel": "13-H-S",
      "sortKey": 13.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "C14MP",
      "parentSku": "COL-COLUMBIA-STAINLESS-STEEL-MUD-PAN-WITH-FREE-MUD-GRIP",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Mud Pan with Mud Grip - [C14MP]",
      "description": "Columbia Tools has launched the Columbia Mud Pan—the first in our new line of premium hand tools, designed for professionals who demand durability, comfort, and performance. Crafted from heavy-gauge stainless steel, this mud pan is built to withstand the toughest tasks, while its watertight, laser-welded seams ensur...",
      "price": 25.0,
      "regularPrice": 25.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "C14MP",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "C12MP",
        "C14MP",
        "C16MP",
        "Columbia",
        "Mud Pan",
        "Taping & Finishing Tools",
        "stainless steel mud pan"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\"",
      "sortKey": 14.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CTK14",
      "parentSku": "COL-COLUMBIOA-STAINLESS-STEEL-TAPING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Taping Knife with Soft Grip Handle - [CTK14]",
      "description": "Columbia Tools is proud to launch our all-new Columbia Taping Knives – crafted for professionals who demand speed, precision, comfort, and durability on every job.",
      "price": 21.0,
      "regularPrice": 21.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CTK14",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "CTK10",
        "CTK12",
        "CTK14",
        "CTK8",
        "Columbia",
        "Taping & Finishing Tools",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\"",
      "sortKey": 14.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "C16MP",
      "parentSku": "COL-COLUMBIA-STAINLESS-STEEL-MUD-PAN-WITH-FREE-MUD-GRIP",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Mud Pan with Mud Grip - [C16MP]",
      "description": "Columbia Tools has launched the Columbia Mud Pan—the first in our new line of premium hand tools, designed for professionals who demand durability, comfort, and performance. Crafted from heavy-gauge stainless steel, this mud pan is built to withstand the toughest tasks, while its watertight, laser-welded seams ensur...",
      "price": 25.0,
      "regularPrice": 25.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "C16MP",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "C12MP",
        "C14MP",
        "C16MP",
        "Columbia",
        "Mud Pan",
        "Taping & Finishing Tools",
        "stainless steel mud pan"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "16\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 16\"",
      "sortKey": 16.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PHMP",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Predator Quick-Clean Mud Pump (Box Filler Not Included) - [PHMP]",
      "description": "Cleaning a Pump doesn’t get any easier than this! Columbia Predator Quick-Clean Mud Pumps feature quick-release clamps on head that allow for easy removal of the pump tube from the head. This allows for easy and quick cleaning of the entire unit, and is especially useful when using fast setting joint compound (a.k.a...",
      "price": 376.0,
      "regularPrice": 376.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PHMP",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "PHMP",
        "carbon fiber",
        "colombia",
        "loading pump",
        "mud pump",
        "predator",
        "pump"
      ],
      "attributes": [],
      "optionGroup": "loading_pump",
      "sizeLabel": "PHMP",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "HMP",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Quick-Clean Mud Pump (Box Filler Not Included) - [HMP]",
      "description": "Cleaning a Pump doesn’t get any easier than this! Columbia Quick-Clean Mud Pumps feature quick-release clamps on head that allow for easy removal of the pump tube from the head. This allows for easy and quick cleaning of the entire unit, and is especially useful when using fast setting joint compound (a.k.a Hot Mud....",
      "price": 363.0,
      "regularPrice": 363.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "HMP",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "automatic taping tools",
        "colombia",
        "hmp",
        "loading pump"
      ],
      "attributes": [],
      "optionGroup": "loading_pump",
      "sizeLabel": "HMP",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TBMP",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Tall Boy Loading Pump - [TBMP]",
      "description": "The Columbia Tall Boy Pump is a BIG step up from a standard sized drywall mud pump. Size really does matter - This taller pump allows you to stand comfortably upright while you fill your tools. Stand Tall - When filling the automatic taper you can see the piston, and you no longer need to use your fingers to indicat...",
      "price": 473.0,
      "regularPrice": 473.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TBMP",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "colombia",
        "loading pump",
        "mud pump",
        "tall boy mud pump"
      ],
      "attributes": [],
      "optionGroup": "loading_pump",
      "sizeLabel": "TBMP",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "C1SPBODY",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia One Sawed Off Predator Automatic Taper Body (Head Not Included) - [C1SPBODY]",
      "description": "Built for finishers who want maximum agility in tight spaces, the Sawed Off Predator Body delivers compact performance in the world’s first carbon fiber taper. Its ultra-lightweight, dent-proof carbon fiber shell provides exceptional control, reduced fatigue, and a warm-to-the-touch feel — all in a shorter, more man...",
      "price": 526.0,
      "regularPrice": 526.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "C1SPBODY",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "C1SPBODY",
        "Columbia",
        "bazooka",
        "carbon fiber",
        "colombia",
        "predator",
        "taper"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "C1SPBODY",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "C1TBPBODY",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia One Tall Boy Predator Automatic Taper Body (Head Not Included) - [C1TBPBODY]",
      "description": "Built for finishers who need maximum reach without added weight, the Tall Boy Predator Body brings full-height performance to the world’s first carbon fiber taper. Crafted from an ultra-lightweight, dent-proof carbon fiber shell, it delivers exceptional control, reduced fatigue, and a warm-to-the-touch feel in any e...",
      "price": 661.0,
      "regularPrice": 661.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "C1TBPBODY",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "C1TBPBODY",
        "Columbia",
        "bazooka",
        "carbon fiber",
        "colombia",
        "predator",
        "taper"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "C1TBPBODY",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FCMR1.5X18MM",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Corner Mud Roller Replacement - [FCMR1.5X18MM]",
      "description": "The Mud Roller from Columbia Tools – the ultimate solution for fast, smooth, and efficient coating applications. Designed for professionals, this innovative mud roller ensures consistent coating thickness and minimal effort for every pass.",
      "price": 23.0,
      "regularPrice": 23.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FCMR1.5X18MM",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FCMR1.5X18MM",
        "Taping & Finishing Tools",
        "compound roller",
        "mud roller",
        "plastering roller"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "FCMR1.5X18MM",
      "sortKey": 1.5,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FMRAF1.5",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Corner Mud Roller with Acme Thread Roller Frame - [FMRAF1.5]",
      "description": "The Mud Roller from Columbia Tools – the ultimate solution for fast, smooth, and efficient coating applications. Designed for professionals, this innovative mud roller ensures consistent coating thickness and minimal effort for every pass.",
      "price": 34.0,
      "regularPrice": 34.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FMRAF1.5",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FMRAF1.5",
        "Taping & Finishing Tools",
        "compound roller",
        "mud roller",
        "plastering roller"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "FMRAF1.5",
      "sortKey": 1.5,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "2KMR12",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia 2K Drywall Mud Roller Complete - [2KMR12]",
      "description": "The Columbia Mud Roller is engineered to make applying large volumes of drywall compound fast, smooth, and efficient. Perfect for coating walls and ceilings, this high-capacity roller allows you to quickly load and release joint compound across broad surfaces—ideal when preparing taped seams for final finishing with...",
      "price": 36.0,
      "regularPrice": 36.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "2KMR12",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "12\"",
        "2KMR12",
        "9\"",
        "Columbia",
        "Taping & Finishing Tools",
        "mud roller"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "2KMR12",
      "sortKey": 2.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "MRR12",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia 2K Drywall Mud Roller Replacement - [MRR12]",
      "description": "The Columbia Mud Roller Replacement Cover is designed for professionals who need consistent, high-volume compound application without interruption. Built to deliver fast, smooth, and efficient coverage, this replacement roller is perfect for loading joint compound onto walls and ceilings—especially when prepping tap...",
      "price": 23.0,
      "regularPrice": 23.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "MRR12",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "12\"",
        "9\"",
        "Columbia",
        "MRR12",
        "Taping & Finishing Tools",
        "mud roller"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "MRR12",
      "sortKey": 2.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "2NS",
      "parentSku": "COL-COLUMBIA-NAIL-SPOTTER",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Nail Spotter - [2NS]",
      "description": "The Columbia Nailspotter is a big improvement in screw finishing. It has the option of having wheels or the traditional skid plate. It is light weight and has an easy to adjust thumb screw for swivel tension. By far the best Nailspotter on the market .",
      "price": 324.0,
      "regularPrice": 324.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "2NS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "2NS",
        "3NS",
        "Automatic Taping Tools",
        "Columbia",
        "colombia",
        "nail spotter",
        "nailspotter"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "2\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 2\"",
      "sortKey": 2.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CBS2K",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Bucket Scoop with Soft Grip Handle - [CBS2K]",
      "description": "The Columbia Bucket Scoop is built from premium materials with precision craftsmanship, delivering a durable tool that makes mixing and scooping compound easier than ever.",
      "price": 11.0,
      "regularPrice": 11.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CBS2K",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "CBS2K",
        "Columbia",
        "Taping & Finishing Tools",
        "bucket scoop"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "CBS2K",
      "sortKey": 2.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "2.5CSF",
      "parentSku": "COL-COLUMBIA-COMBO-FLUSHER",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Combo Flusher - [2.5CSF]",
      "description": "(2.5CSF, 3CSF, 3.5CSF, 3WTCSF) Columbia Combo Flushers have redefined angle finishing. They are built from the best materials, but above all, they are each hand ground and checked on a granite plate for perfection. Each one comes with wheels and an allen key for those who prefer not to use them.",
      "price": 145.0,
      "regularPrice": 145.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "2.5CSF",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "2.5CSF",
        "3.5CSF",
        "3CSF",
        "3WTCSF",
        "Columbia",
        "Semi Automatic Taping Tools",
        "colombia",
        "columbia flusher",
        "flusher",
        "flusher with wheels",
        "semi automatic",
        "standard flusher",
        "wiper"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "2.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 2.5\"",
      "sortKey": 2.5,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "2.5DF",
      "parentSku": "COL-COLUMBIA-DIRECT-FLUSHER",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Direct Flusher - [2.5DF]",
      "description": "Columbia Direct Corner Flushers have redefined angle finishing. They are built from the best materials, but above all, they are each hand ground and checked on a granite plate for perfection. Each one comes with wheels and an allen key for those who prefer not to use them.",
      "price": 95.0,
      "regularPrice": 95.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "2.5DF",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "2.5DF",
        "3.5DF",
        "3DF",
        "3WTDF",
        "4DF",
        "Columbia",
        "Semi Automatic Taping Tools",
        "colombia",
        "direct flusher",
        "flusher",
        "semi automatic"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "2.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 2.5\"",
      "sortKey": 2.5,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "2.5SF",
      "parentSku": "COL-COLUMBIA-STANDARD-FLUSHERS",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Standard Flusher - [2.5SF]",
      "description": "Columbia Standard Corner Flushers have redefined angle finishing. They are built from the best materials, but above all, they are each hand ground and checked on a granite plate for perfection. Each one comes with wheels and an allen key for those who prefer not to use them.",
      "price": 87.0,
      "regularPrice": 87.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "2.5SF",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "2.5SF",
        "3.5SF",
        "3SF",
        "3WTSF",
        "4SF",
        "Columbia",
        "Semi Automatic Taping Tools",
        "colombia",
        "columbia flusher",
        "flusher",
        "flusher with wheels",
        "semi automatic",
        "standard flusher",
        "wiper"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "2.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 2.5\"",
      "sortKey": 2.5,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "3BBH",
      "parentSku": "COL-COLUMBIA-BENT-BOX-HANDLES-3-6",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Bent Box Handle - [3BBH]",
      "description": "Comes in 3ft, 42\", 4ft, 5ft and 6ft",
      "price": 203.0,
      "regularPrice": 203.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "3BBH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "3BBH",
        "42BBH",
        "4BBH",
        "5BBH",
        "6BBH",
        "Automatic Taping Tools",
        "Columbia",
        "bent",
        "bent box handle",
        "box handle",
        "colombia",
        "flat box bent",
        "flat box handle"
      ],
      "attributes": [
        {
          "name": "Handle Length",
          "value": "3'",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Handle Length: 3'",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "3CSF",
      "parentSku": "COL-COLUMBIA-COMBO-FLUSHER",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Combo Flusher - [3CSF]",
      "description": "(2.5CSF, 3CSF, 3.5CSF, 3WTCSF) Columbia Combo Flushers have redefined angle finishing. They are built from the best materials, but above all, they are each hand ground and checked on a granite plate for perfection. Each one comes with wheels and an allen key for those who prefer not to use them.",
      "price": 150.0,
      "regularPrice": 150.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "3CSF",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "2.5CSF",
        "3.5CSF",
        "3CSF",
        "3WTCSF",
        "Columbia",
        "Semi Automatic Taping Tools",
        "colombia",
        "columbia flusher",
        "flusher",
        "flusher with wheels",
        "semi automatic",
        "standard flusher",
        "wiper"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 3\"",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "3DF",
      "parentSku": "COL-COLUMBIA-DIRECT-FLUSHER",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Direct Flusher - [3DF]",
      "description": "Columbia Direct Corner Flushers have redefined angle finishing. They are built from the best materials, but above all, they are each hand ground and checked on a granite plate for perfection. Each one comes with wheels and an allen key for those who prefer not to use them.",
      "price": 98.0,
      "regularPrice": 98.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "3DF",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "2.5DF",
        "3.5DF",
        "3DF",
        "3WTDF",
        "4DF",
        "Columbia",
        "Semi Automatic Taping Tools",
        "colombia",
        "direct flusher",
        "flusher",
        "semi automatic"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 3\"",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "3WTDF",
      "parentSku": "COL-COLUMBIA-DIRECT-FLUSHER",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Direct Flusher - [3WTDF]",
      "description": "Columbia Direct Corner Flushers have redefined angle finishing. They are built from the best materials, but above all, they are each hand ground and checked on a granite plate for perfection. Each one comes with wheels and an allen key for those who prefer not to use them.",
      "price": 101.0,
      "regularPrice": 101.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "3WTDF",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "2.5DF",
        "3.5DF",
        "3DF",
        "3WTDF",
        "4DF",
        "Columbia",
        "Semi Automatic Taping Tools",
        "colombia",
        "direct flusher",
        "flusher",
        "semi automatic"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3\" Widetrack",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 3\" Widetrack",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FMR3X18MM",
      "parentSku": "COL-COLUMBIA-MUD-ROLLER-REPLACEMENT",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Mud Roller Replacement - [FMR3X18MM]",
      "description": "The Mud Roller from Columbia Tools – the ultimate solution for fast, smooth, and efficient coating applications. Designed for professionals, this innovative mud roller ensures consistent coating thickness and minimal effort for every pass.",
      "price": 16.0,
      "regularPrice": 16.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FMR3X18MM",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FMR3X18MM",
        "FMR9X18MM",
        "Taping & Finishing Tools",
        "compound roller",
        "mud roller",
        "plastering roller"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "80 mm / 3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 80 mm / 3\"",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FMRAF3",
      "parentSku": "COL-COLUMBIA-MUD-ROLLER-WITH-ACME-THREAD-ROLLER-FRAME",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Mud Roller with Acme Thread Roller Frame - [FMRAF3]",
      "description": "The Mud Roller from Columbia Tools – the ultimate solution for fast, smooth, and efficient coating applications. Designed for professionals, this innovative mud roller ensures consistent coating thickness and minimal effort for every pass.",
      "price": 26.0,
      "regularPrice": 26.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FMRAF3",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FMRAF3",
        "FMRAF9",
        "Taping & Finishing Tools",
        "compound roller",
        "mud roller",
        "plastering roller"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "80 mm / 3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 80 mm / 3\"",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "3NS",
      "parentSku": "COL-COLUMBIA-NAIL-SPOTTER",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Nail Spotter - [3NS]",
      "description": "The Columbia Nailspotter is a big improvement in screw finishing. It has the option of having wheels or the traditional skid plate. It is light weight and has an easy to adjust thumb screw for swivel tension. By far the best Nailspotter on the market .",
      "price": 324.0,
      "regularPrice": 324.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "3NS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "2NS",
        "3NS",
        "Automatic Taping Tools",
        "Columbia",
        "colombia",
        "nail spotter",
        "nailspotter"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 3\"",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "3SF",
      "parentSku": "COL-COLUMBIA-STANDARD-FLUSHERS",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Standard Flusher - [3SF]",
      "description": "Columbia Standard Corner Flushers have redefined angle finishing. They are built from the best materials, but above all, they are each hand ground and checked on a granite plate for perfection. Each one comes with wheels and an allen key for those who prefer not to use them.",
      "price": 92.0,
      "regularPrice": 92.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "3SF",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "2.5SF",
        "3.5SF",
        "3SF",
        "3WTSF",
        "4SF",
        "Columbia",
        "Semi Automatic Taping Tools",
        "colombia",
        "columbia flusher",
        "flusher",
        "flusher with wheels",
        "semi automatic",
        "standard flusher",
        "wiper"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 3\"",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "3WTSF",
      "parentSku": "COL-COLUMBIA-STANDARD-FLUSHERS",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Standard Flusher - [3WTSF]",
      "description": "Columbia Standard Corner Flushers have redefined angle finishing. They are built from the best materials, but above all, they are each hand ground and checked on a granite plate for perfection. Each one comes with wheels and an allen key for those who prefer not to use them.",
      "price": 93.0,
      "regularPrice": 93.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "3WTSF",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "2.5SF",
        "3.5SF",
        "3SF",
        "3WTSF",
        "4SF",
        "Columbia",
        "Semi Automatic Taping Tools",
        "colombia",
        "columbia flusher",
        "flusher",
        "flusher with wheels",
        "semi automatic",
        "standard flusher",
        "wiper"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3\" Widetrack",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 3\" Widetrack",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TL3-8",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Twist and Lock Handle 3' - 8' - [TL3-8]",
      "description": "Our popular Twist Lock Handle is a three stage pole with a brass thread that allows users to easily adjust where the seam falls, creating a more comfortable grip. This handle extends from 3' to 8' and is used with the Nail Spotters, all Rollers and the Angle Head Adaptor.",
      "price": 73.0,
      "regularPrice": 73.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TL3-8",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "TL-3-8",
        "colombia",
        "extendable handle",
        "extendable sanding pole",
        "rolling pole",
        "sander handle",
        "sanding pole",
        "semi automatic",
        "tl3-8",
        "twist lock",
        "twist lock pole"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "TL3-8",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "3.5CSF",
      "parentSku": "COL-COLUMBIA-COMBO-FLUSHER",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Combo Flusher - [3.5CSF]",
      "description": "(2.5CSF, 3CSF, 3.5CSF, 3WTCSF) Columbia Combo Flushers have redefined angle finishing. They are built from the best materials, but above all, they are each hand ground and checked on a granite plate for perfection. Each one comes with wheels and an allen key for those who prefer not to use them.",
      "price": 154.0,
      "regularPrice": 154.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "3.5CSF",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "2.5CSF",
        "3.5CSF",
        "3CSF",
        "3WTCSF",
        "Columbia",
        "Semi Automatic Taping Tools",
        "colombia",
        "columbia flusher",
        "flusher",
        "flusher with wheels",
        "semi automatic",
        "standard flusher",
        "wiper"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 3.5\"",
      "sortKey": 3.5,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "3.5DF",
      "parentSku": "COL-COLUMBIA-DIRECT-FLUSHER",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Direct Flusher - [3.5DF]",
      "description": "Columbia Direct Corner Flushers have redefined angle finishing. They are built from the best materials, but above all, they are each hand ground and checked on a granite plate for perfection. Each one comes with wheels and an allen key for those who prefer not to use them.",
      "price": 104.0,
      "regularPrice": 104.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "3.5DF",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "2.5DF",
        "3.5DF",
        "3DF",
        "3WTDF",
        "4DF",
        "Columbia",
        "Semi Automatic Taping Tools",
        "colombia",
        "direct flusher",
        "flusher",
        "semi automatic"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 3.5\"",
      "sortKey": 3.5,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CPFP",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia PowerFill 3.5 Pro Series Cordless Loading Pump - [CPFP]",
      "description": "Columbia Tools has partnered with Graco to bring you a Columbia Tools branded version of their already successful cordless powered loading pump for Columbia customers. The Columbia X Graco PowerFill is designed to fill all automatic taping and finishing tools with ease. The PowerFill system completely eliminates the...",
      "price": 1473.0,
      "regularPrice": 1473.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CPFP",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "26B418",
        "Automatic Taping Tools",
        "CPFP",
        "Columbia",
        "Graco",
        "automatic loading pump",
        "loading pump",
        "mud pump",
        "power fill",
        "powerfill"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "CPFP",
      "sortKey": 3.5,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "3.5SF",
      "parentSku": "COL-COLUMBIA-STANDARD-FLUSHERS",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Standard Flusher - [3.5SF]",
      "description": "Columbia Standard Corner Flushers have redefined angle finishing. They are built from the best materials, but above all, they are each hand ground and checked on a granite plate for perfection. Each one comes with wheels and an allen key for those who prefer not to use them.",
      "price": 97.0,
      "regularPrice": 97.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "3.5SF",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "2.5SF",
        "3.5SF",
        "3SF",
        "3WTSF",
        "4SF",
        "Columbia",
        "Semi Automatic Taping Tools",
        "colombia",
        "columbia flusher",
        "flusher",
        "flusher with wheels",
        "semi automatic",
        "standard flusher",
        "wiper"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 3.5\"",
      "sortKey": 3.5,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CFBH",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia 4' Fixed Length Aluminum Corner Flusher Box Handle (Old Style) - [CFBH]",
      "description": "4 ft. Fixed-length Fiberglass Corner Flusher Box Handle for use with old style mounting Columbia Taping Tools angle boxes.",
      "price": 44.0,
      "regularPrice": 44.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CFBH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "CFBH",
        "Columbia",
        "angle box handle",
        "colombia",
        "corner box handle",
        "fixed corner box handle",
        "old style corner box handle"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "CFBH",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4BBH",
      "parentSku": "COL-COLUMBIA-BENT-BOX-HANDLES-3-6",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Bent Box Handle - [4BBH]",
      "description": "Comes in 3ft, 42\", 4ft, 5ft and 6ft",
      "price": 205.0,
      "regularPrice": 205.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4BBH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "3BBH",
        "42BBH",
        "4BBH",
        "5BBH",
        "6BBH",
        "Automatic Taping Tools",
        "Columbia",
        "bent",
        "bent box handle",
        "box handle",
        "colombia",
        "flat box bent",
        "flat box handle"
      ],
      "attributes": [
        {
          "name": "Handle Length",
          "value": "4'",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Handle Length: 4'",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4DF",
      "parentSku": "COL-COLUMBIA-DIRECT-FLUSHER",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Direct Flusher - [4DF]",
      "description": "Columbia Direct Corner Flushers have redefined angle finishing. They are built from the best materials, but above all, they are each hand ground and checked on a granite plate for perfection. Each one comes with wheels and an allen key for those who prefer not to use them.",
      "price": 108.0,
      "regularPrice": 108.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4DF",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "2.5DF",
        "3.5DF",
        "3DF",
        "3WTDF",
        "4DF",
        "Columbia",
        "Semi Automatic Taping Tools",
        "colombia",
        "direct flusher",
        "flusher",
        "semi automatic"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 4\"",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4SF",
      "parentSku": "COL-COLUMBIA-STANDARD-FLUSHERS",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Standard Flusher - [4SF]",
      "description": "Columbia Standard Corner Flushers have redefined angle finishing. They are built from the best materials, but above all, they are each hand ground and checked on a granite plate for perfection. Each one comes with wheels and an allen key for those who prefer not to use them.",
      "price": 105.0,
      "regularPrice": 105.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4SF",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "2.5SF",
        "3.5SF",
        "3SF",
        "3WTSF",
        "4SF",
        "Columbia",
        "Semi Automatic Taping Tools",
        "colombia",
        "columbia flusher",
        "flusher",
        "flusher with wheels",
        "semi automatic",
        "standard flusher",
        "wiper"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 4\"",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5BBH",
      "parentSku": "COL-COLUMBIA-BENT-BOX-HANDLES-3-6",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Bent Box Handle - [5BBH]",
      "description": "Comes in 3ft, 42\", 4ft, 5ft and 6ft",
      "price": 206.0,
      "regularPrice": 206.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5BBH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "3BBH",
        "42BBH",
        "4BBH",
        "5BBH",
        "6BBH",
        "Automatic Taping Tools",
        "Columbia",
        "bent",
        "bent box handle",
        "box handle",
        "colombia",
        "flat box bent",
        "flat box handle"
      ],
      "attributes": [
        {
          "name": "Handle Length",
          "value": "5'",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Handle Length: 5'",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SF5",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Shrink Fit Comfort Grips for Welded Stainless Steel Joint Knives - [SF5]",
      "description": "Use a heat gun to install Columbia Heat-Shrink Handle Grips install in less than 30 seconds. Increase the grip-ability and comfort of your Columbia Welded Stainless Steel Joint Knives.",
      "price": 8.0,
      "regularPrice": 8.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "SF5",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "SF5",
        "Taping & Finishing Tools",
        "handle grip",
        "joint knife",
        "taping knife grip"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "SF5",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "6BBH",
      "parentSku": "COL-COLUMBIA-BENT-BOX-HANDLES-3-6",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Bent Box Handle - [6BBH]",
      "description": "Comes in 3ft, 42\", 4ft, 5ft and 6ft",
      "price": 207.0,
      "regularPrice": 207.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "6BBH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "3BBH",
        "42BBH",
        "4BBH",
        "5BBH",
        "6BBH",
        "Automatic Taping Tools",
        "Columbia",
        "bent",
        "bent box handle",
        "box handle",
        "colombia",
        "flat box bent",
        "flat box handle"
      ],
      "attributes": [
        {
          "name": "Handle Length",
          "value": "6'",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Handle Length: 6'",
      "sortKey": 6.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FMR9X18MM",
      "parentSku": "COL-COLUMBIA-MUD-ROLLER-REPLACEMENT",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Mud Roller Replacement - [FMR9X18MM]",
      "description": "The Mud Roller from Columbia Tools – the ultimate solution for fast, smooth, and efficient coating applications. Designed for professionals, this innovative mud roller ensures consistent coating thickness and minimal effort for every pass.",
      "price": 17.0,
      "regularPrice": 17.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FMR9X18MM",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FMR3X18MM",
        "FMR9X18MM",
        "Taping & Finishing Tools",
        "compound roller",
        "mud roller",
        "plastering roller"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "220 mm / 9\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 220 mm / 9\"",
      "sortKey": 9.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FMRAF9",
      "parentSku": "COL-COLUMBIA-MUD-ROLLER-WITH-ACME-THREAD-ROLLER-FRAME",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Mud Roller with Acme Thread Roller Frame - [FMRAF9]",
      "description": "The Mud Roller from Columbia Tools – the ultimate solution for fast, smooth, and efficient coating applications. Designed for professionals, this innovative mud roller ensures consistent coating thickness and minimal effort for every pass.",
      "price": 28.0,
      "regularPrice": 28.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FMRAF9",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FMRAF3",
        "FMRAF9",
        "Taping & Finishing Tools",
        "compound roller",
        "mud roller",
        "plastering roller"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "220 mm / 9\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 220 mm / 9\"",
      "sortKey": 9.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CLT24",
      "parentSku": "COL-COLUMBIA-CAM-LOCK-TUBE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Cam Lock Tube - [CLT24]",
      "description": "The Columbia Cam Lock Tube is so simple and so positive we would not recommend using any other tube when it comes to fast set compounds. The brass cams easily find and lock to the stainless ring using the same technology as a firehose.",
      "price": 236.0,
      "regularPrice": 236.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CLT24",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "CLT24",
        "CLT32",
        "CLT42",
        "CLT55",
        "Columbia",
        "Semi Automatic Taping Tools",
        "cam lock tube",
        "colombia",
        "compound tube",
        "semi automatic",
        "syringe"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "24\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 24\"",
      "sortKey": 24.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CLT32",
      "parentSku": "COL-COLUMBIA-CAM-LOCK-TUBE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Cam Lock Tube - [CLT32]",
      "description": "The Columbia Cam Lock Tube is so simple and so positive we would not recommend using any other tube when it comes to fast set compounds. The brass cams easily find and lock to the stainless ring using the same technology as a firehose.",
      "price": 242.0,
      "regularPrice": 242.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CLT32",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "CLT24",
        "CLT32",
        "CLT42",
        "CLT55",
        "Columbia",
        "Semi Automatic Taping Tools",
        "cam lock tube",
        "colombia",
        "compound tube",
        "semi automatic",
        "syringe"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "32\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 32\"",
      "sortKey": 32.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FECCL33",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia 33\" Mud Roller Case - [FECCL33]",
      "description": "Mud roller case only.",
      "price": 86.0,
      "regularPrice": 86.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FECCL33",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "FECCL33",
        "Semi Automatic Taping Tools",
        "gun case",
        "hard case",
        "semi automatic",
        "tool case"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "FECCL33",
      "sortKey": 33.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "42BBH",
      "parentSku": "COL-COLUMBIA-BENT-BOX-HANDLES-3-6",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Bent Box Handle - [42BBH]",
      "description": "Comes in 3ft, 42\", 4ft, 5ft and 6ft",
      "price": 204.0,
      "regularPrice": 204.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "42BBH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "3BBH",
        "42BBH",
        "4BBH",
        "5BBH",
        "6BBH",
        "Automatic Taping Tools",
        "Columbia",
        "bent",
        "bent box handle",
        "box handle",
        "colombia",
        "flat box bent",
        "flat box handle"
      ],
      "attributes": [
        {
          "name": "Handle Length",
          "value": "42\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Handle Length: 42\"",
      "sortKey": 42.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CLT42",
      "parentSku": "COL-COLUMBIA-CAM-LOCK-TUBE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Cam Lock Tube - [CLT42]",
      "description": "The Columbia Cam Lock Tube is so simple and so positive we would not recommend using any other tube when it comes to fast set compounds. The brass cams easily find and lock to the stainless ring using the same technology as a firehose.",
      "price": 256.0,
      "regularPrice": 256.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CLT42",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "CLT24",
        "CLT32",
        "CLT42",
        "CLT55",
        "Columbia",
        "Semi Automatic Taping Tools",
        "cam lock tube",
        "colombia",
        "compound tube",
        "semi automatic",
        "syringe"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "42\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 42\"",
      "sortKey": 42.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PCLT42",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Predator Cam Lock Tube - [PCLT42]",
      "description": "The Columbia Predator Cam Lock Tube is so simple and so positive we would not recommend using any other tube when it comes to fast set compounds.",
      "price": 290.0,
      "regularPrice": 290.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PCLT42",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "PCLT42",
        "Semi Automatic Taping Tools",
        "cam lock tube",
        "carbon fiber",
        "compound tube",
        "predator",
        "semi automatic",
        "syringe"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "PCLT42",
      "sortKey": 42.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CLT55",
      "parentSku": "COL-COLUMBIA-CAM-LOCK-TUBE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Cam Lock Tube - [CLT55]",
      "description": "The Columbia Cam Lock Tube is so simple and so positive we would not recommend using any other tube when it comes to fast set compounds. The brass cams easily find and lock to the stainless ring using the same technology as a firehose.",
      "price": 220.0,
      "regularPrice": 220.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CLT55",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "CLT24",
        "CLT32",
        "CLT42",
        "CLT55",
        "Columbia",
        "Semi Automatic Taping Tools",
        "cam lock tube",
        "colombia",
        "compound tube",
        "semi automatic",
        "syringe"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "55\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 55\"",
      "sortKey": 55.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "IA90",
      "parentSku": "COL-COLUMBIA-PLASTIC-MUD-HEAD-APPLICATOR",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Plastic Mud Head Applicator - [IA90]",
      "description": "Proportionate grooves give you a consistent mud distribution on the wall and speeds up the pre-filling process. Made out of UHMW, the strong durable design makes these Mud Heads the best on the market.",
      "price": 98.0,
      "regularPrice": 98.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "IA90",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "FMH",
        "IA90",
        "OA90",
        "Semi Automatic Taping Tools",
        "applicator",
        "colombia",
        "compound applicator",
        "mud head",
        "plastic applicator"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "Inside 90°",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: Inside 90°",
      "sortKey": 90.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "OA90",
      "parentSku": "COL-COLUMBIA-PLASTIC-MUD-HEAD-APPLICATOR",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Plastic Mud Head Applicator - [OA90]",
      "description": "Proportionate grooves give you a consistent mud distribution on the wall and speeds up the pre-filling process. Made out of UHMW, the strong durable design makes these Mud Heads the best on the market.",
      "price": 98.0,
      "regularPrice": 98.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "OA90",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "FMH",
        "IA90",
        "OA90",
        "Semi Automatic Taping Tools",
        "applicator",
        "colombia",
        "compound applicator",
        "mud head",
        "plastic applicator"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "Outside 90°",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: Outside 90°",
      "sortKey": 90.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CC",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Corner Cobra - [CC]",
      "description": "The Corner Cobra is an amazing time saving tool. It allows the user to roll out No-Coat and other structural corner beads at almost all inside and outside angles. We have heard back from users that it does it quicker and better, which is to us a home run. Another one of our patented products that is changing the tim...",
      "price": 401.0,
      "regularPrice": 401.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CC",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "CC",
        "Columbia",
        "cobra",
        "colombia",
        "corner cobra",
        "corner roller",
        "inside corner roller",
        "no coat roller",
        "outside corner roller",
        "roller"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "CC",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "MHL",
      "parentSku": "COL-COLUMBIA-MATRIX-BOX-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Matrix Box Handle - [MHL]",
      "description": "The Columbia Matrix Flat Box Handle is lightweight and all mechanical. With a 90 degree grip, the Matrix gives you increased control over your box. These handles are durable and extremely long lasting, all while maintaining the comfort and ease of use that you're used to with the Columbia brand of tools. The Columbi...",
      "price": 495.0,
      "regularPrice": 495.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "MHL",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "MH",
        "MHL",
        "MHS",
        "automatic taping tools",
        "colombia",
        "flat box handle"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "Long 56\" to 76\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: Long 56\" to 76\"",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "MHS",
      "parentSku": "COL-COLUMBIA-MATRIX-BOX-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Matrix Box Handle - [MHS]",
      "description": "The Columbia Matrix Flat Box Handle is lightweight and all mechanical. With a 90 degree grip, the Matrix gives you increased control over your box. These handles are durable and extremely long lasting, all while maintaining the comfort and ease of use that you're used to with the Columbia brand of tools. The Columbi...",
      "price": 375.0,
      "regularPrice": 375.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "MHS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "MH",
        "MHL",
        "MHS",
        "automatic taping tools",
        "colombia",
        "flat box handle"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "Short 29\" to 39\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: Short 29\" to 39\"",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "MH",
      "parentSku": "COL-COLUMBIA-MATRIX-BOX-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Matrix Box Handle - [MH]",
      "description": "The Columbia Matrix Flat Box Handle is lightweight and all mechanical. With a 90 degree grip, the Matrix gives you increased control over your box. These handles are durable and extremely long lasting, all while maintaining the comfort and ease of use that you're used to with the Columbia brand of tools. The Columbi...",
      "price": 409.0,
      "regularPrice": 409.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "MH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "MH",
        "MHL",
        "MHS",
        "automatic taping tools",
        "colombia",
        "flat box handle"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "Regular 40\" to 60\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: Regular 40\" to 60\"",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "MRW",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Mud Roller Washer - [MRW]",
      "description": "The Columbia Mud Roller Washer makes cleaning drywall tools fast and easy. Its strong steel frame and roller design help remove mud, compound, and debris quickly. Just attach it to your cleaning setup or use with water pressure to rinse tools clean in seconds.",
      "price": 24.0,
      "regularPrice": 24.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "MRW",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "MRW",
        "Taping & Finishing Tools",
        "mixing tool",
        "mud mixing tools"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "MRW",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "OPBS",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia One Piece Stainless Steel Bucket Scoop - [OPBS]",
      "description": "The Columbia One Piece Bucket Scoop is built from premium materials with precision craftsmanship, delivering a durable tool that makes mixing and scooping compound easier than ever.",
      "price": 21.0,
      "regularPrice": 21.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "OPBS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "OPBS",
        "Taping & Finishing Tools",
        "bucket scoop"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "OPBS",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CBNCR",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Outside Bead Bullnose Corner Roller - [CBNCR]",
      "description": "The new Columbia Taping Tools Outside Bullnose Cornerbead Roller squares up tape-on cornerbead and applies even pressure as you roll the bead in place. *Does not Include Handle",
      "price": 64.0,
      "regularPrice": 64.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CBNCR",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "bullnose roller",
        "colombia",
        "corner roller",
        "outside bead bullnose",
        "semi automatic"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "CBNCR",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COBCR",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Outside Bead Corner Roller - [COBCR]",
      "description": "The new Columbia Taping Tools Outside 90 Degree Cornerbead Roller squares up tape-on cornerbead and applies even pressure as you roll the bead in place. *Does not Include Handle",
      "price": 60.0,
      "regularPrice": 60.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COBCR",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "cobcr",
        "colombia",
        "corner roller",
        "ouside corner roller",
        "outside bead",
        "semi automatic"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "COBCR",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FMH",
      "parentSku": "COL-COLUMBIA-PLASTIC-MUD-HEAD-APPLICATOR",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Plastic Mud Head Applicator - [FMH]",
      "description": "Proportionate grooves give you a consistent mud distribution on the wall and speeds up the pre-filling process. Made out of UHMW, the strong durable design makes these Mud Heads the best on the market.",
      "price": 98.0,
      "regularPrice": 98.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FMH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "FMH",
        "IA90",
        "OA90",
        "Semi Automatic Taping Tools",
        "applicator",
        "colombia",
        "compound applicator",
        "mud head",
        "plastic applicator"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "L-Trim",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: L-Trim",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PMHL",
      "parentSku": "COL-COLUMBIA-PREDATOR-MATRIX-BOX-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Predator Matrix Box Handle - [PMHL]",
      "description": "The Columbia Predator Matrix Flat Box Handle is lightweight and all mechanical. With a 90 degree grip, the Matrix gives you increased control over your box. These handles are light, durable and extremely long lasting, all while maintaining the comfort and ease of use that you're used to with the Columbia brand of to...",
      "price": 503.0,
      "regularPrice": 503.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PMHL",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "PMH",
        "PMHL",
        "PMHS",
        "automatic taping tools",
        "carbon fiber",
        "coumbia",
        "flat box handle",
        "predator"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "Long 56\" to 76\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: Long 56\" to 76\"",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PMHS",
      "parentSku": "COL-COLUMBIA-PREDATOR-MATRIX-BOX-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Predator Matrix Box Handle - [PMHS]",
      "description": "The Columbia Predator Matrix Flat Box Handle is lightweight and all mechanical. With a 90 degree grip, the Matrix gives you increased control over your box. These handles are light, durable and extremely long lasting, all while maintaining the comfort and ease of use that you're used to with the Columbia brand of to...",
      "price": 384.0,
      "regularPrice": 384.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PMHS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "PMH",
        "PMHL",
        "PMHS",
        "automatic taping tools",
        "carbon fiber",
        "coumbia",
        "flat box handle",
        "predator"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "Short 29\" to 39\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: Short 29\" to 39\"",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PMH",
      "parentSku": "COL-COLUMBIA-PREDATOR-MATRIX-BOX-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Predator Matrix Box Handle - [PMH]",
      "description": "The Columbia Predator Matrix Flat Box Handle is lightweight and all mechanical. With a 90 degree grip, the Matrix gives you increased control over your box. These handles are light, durable and extremely long lasting, all while maintaining the comfort and ease of use that you're used to with the Columbia brand of to...",
      "price": 418.0,
      "regularPrice": 418.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PMH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "PMH",
        "PMHL",
        "PMHS",
        "automatic taping tools",
        "carbon fiber",
        "coumbia",
        "flat box handle",
        "predator"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "Regular 40\" to 60\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: Regular 40\" to 60\"",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "RC",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Road Case - [RC]",
      "description": "The highly requested Columbia Road Case has an extremely durable design to protect your tools on the job. Built to take the abuses of travel and wear and tear from job sites, the Road Case comes equipped with rubber feet, rolling wheels and ergonomical handles. This case will hold a full set of Columbia tools.",
      "price": 992.0,
      "regularPrice": 992.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "RC",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "RC",
        "automatic tool case",
        "case",
        "colombia",
        "columbia case",
        "columbia road case",
        "columbia tools",
        "hard case",
        "road case",
        "tool case",
        "tool case columbia"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "RC",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TCS",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Semi-Auto Tool Case By Flambeau - [TCS]",
      "description": "Branded Flambeau. Columnbia TCS Equivalent. Semi-Auto Taping Tool case only.",
      "price": 178.0,
      "regularPrice": 178.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TCS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "Semi Automatic Taping Tools",
        "TCS",
        "colombia",
        "columbia case",
        "gun case",
        "hard case",
        "semi automatic",
        "tool case"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "TCS",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "BSNC",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Bucket Scoop with Cork Handle - [BSNC]",
      "description": "The Columbia Bucket Scoop with Cork Handle is built from premium materials with precision craftsmanship, it’s a durable tool that makes mixing and scooping compound easier than ever.",
      "price": 21.0,
      "regularPrice": 21.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "BSNC",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "BCNC",
        "Columbia",
        "Taping & Finishing Tools",
        "bucket scoop"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "BSNC",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TT",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Throttle Tube - [TT]",
      "description": "Columbia Tools is excited to introduce the newest addition to the Carbon Fiber family — the ThrottleTube.",
      "price": 905.0,
      "regularPrice": 905.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "TT",
        "automatic compound tube",
        "compound tube",
        "dewalt drywall tools",
        "mud runner",
        "mud shot",
        "throttletube"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "TT",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "ICATW",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Two Way Internal Corner Applicator - [ICATW]",
      "description": "Columbia Two Way Internal Corner Applicators are all machined from solid aluminum billet. They are very accurate and their Delrin wheels glide along the wall.",
      "price": 83.0,
      "regularPrice": 83.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "ICATW",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "ICATW",
        "Semi Automatic Taping Tools",
        "applicator",
        "colombia",
        "inside corner applicator",
        "semi automatic",
        "two way applicator"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "ICATW",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLHTBDL12",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Super Flex 0.3 Flat Blade Stainless Steel Finishing Trowel & Hawk Set - [COLHTBDL12]",
      "description": "",
      "price": 174.0,
      "regularPrice": 174.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLHTBDL12",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Taping & Finishing Tools",
        "hawk",
        "trowel"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLHTBDL12",
      "sortKey": 0.3,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLHTBDL10",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Silver 0.4 Curved Blade Stainless Steel Finishing Trowel & Hawk Set - [COLHTBDL10]",
      "description": "",
      "price": 164.0,
      "regularPrice": 164.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLHTBDL10",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Taping & Finishing Tools",
        "hawk",
        "trowel"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLHTBDL10",
      "sortKey": 0.4,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLHTBDL9",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Pro Flex 0.7 Curved Blade Stainless Steel Finishing Trowel & Hawk Set - [COLHTBDL9]",
      "description": "",
      "price": 171.0,
      "regularPrice": 171.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLHTBDL9",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Taping & Finishing Tools",
        "hawk",
        "trowel"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLHTBDL9",
      "sortKey": 0.7,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLHTBDL11",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Pro Flex 0.7 Flat Blade Stainless Steel Finishing Trowel & Hawk Set - [COLHTBDL11]",
      "description": "",
      "price": 171.0,
      "regularPrice": 171.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLHTBDL11",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Taping & Finishing Tools",
        "hawk",
        "trowel"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLHTBDL11",
      "sortKey": 0.7,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLATBDL1",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Full Taping Set with Carbon Fiber Taper with Bonus Hand Tool Set - [COLATBDL1]",
      "description": "Predator Automatic Taper (PTAPER)",
      "price": 3697.0,
      "regularPrice": 3697.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLATBDL1",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "Columbia Set",
        "Columbia Taping Tools",
        "colombia",
        "full set",
        "set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLATBDL1",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLSABDL1",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Semi-Automatic Taping Tool Set with Bonus Hand Tool Set - [COLSABDL1]",
      "description": "The Columbia Semi-Auto Taping Tool Kit can significantly increase your taping and finishing production capabilities when compared to hand taping. Semi-Auto taping tools greatly increase efficiency and consistency compared to hand taping and decrease waste, resulting in reduced material use. The corner and flat compo...",
      "price": 903.0,
      "regularPrice": 903.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "COLSABDL1",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "Columbia Set",
        "Columbia Taping Tools",
        "Semi Automatic Taping Tools",
        "colombia",
        "columbia semi auto set",
        "columbia sets",
        "semi auto kit",
        "set",
        "starter kit",
        "taping kit",
        "taping set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLSABDL1",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLHTBDL1",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Hand Tool Finishing Set - [COLHTBDL1]",
      "description": "Engineered for everyday performance, these versatile knives feature a medium-flex stainless steel blade that glides smoothly for faster finishing and consistent results.",
      "price": 90.0,
      "regularPrice": 90.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "COLHTBDL1",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Taping & Finishing Tools",
        "hand tool set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLHTBDL1",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLTLBDL1",
      "parentSku": "COL-COLUMBIA-STANDARD-FLUSHER-AND-TWIST-LOCK-HANDLE-SET",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Standard Flusher and Twist-Lock Handle Set - [COLTLBDL1]",
      "description": "Professional-grade angle finishing with precision, comfort, and versatility — all in one complete set.",
      "price": 170.0,
      "regularPrice": 170.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLTLBDL1",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "08AHA",
        "08TL3-8",
        "2.5SF",
        "3.5SF",
        "3SF",
        "3SFWT",
        "4SF",
        "Columbia",
        "Columbia Set",
        "Semi Automatic Taping Tools",
        "colombia",
        "set"
      ],
      "attributes": [
        {
          "name": "Columbia Standard Flusher (Size)",
          "value": "2.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "preset_bundle",
      "sizeLabel": "Columbia Standard Flusher (Size): 2.5\"",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLATBDL2",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Predator Combo Set with Bonus Hand Tool Set - [COLATBDL2]",
      "description": "The Predator (PTAPER)",
      "price": 2155.0,
      "regularPrice": 2155.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLATBDL2",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "Columbia Set",
        "auto taper",
        "bazooka",
        "colombia",
        "predator",
        "set",
        "taper combo"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLATBDL2",
      "sortKey": 2.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLSABDL2",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Predator Semi-Automatic Taping Tool Set with Bonus Hand Tool Set - [COLSABDL2]",
      "description": "The Columbia Semi-Auto Taping Tool Kit can significantly increase your taping and finishing production capabilities when compared to hand taping. Semi-Auto taping tools greatly increase efficiency and consistency compared to hand taping and decrease waste, resulting in reduced material use. The corner and flat compo...",
      "price": 962.0,
      "regularPrice": 962.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "COLSABDL2",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "Columbia Set",
        "Columbia Taping Tools",
        "Semi Automatic Taping Tools",
        "colombia",
        "columbia semi auto set",
        "columbia sets",
        "semi auto kit",
        "set",
        "starter kit",
        "taping kit",
        "taping set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLSABDL2",
      "sortKey": 2.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLTLBD2",
      "parentSku": "COL-COLUMBIA-STANDARD-FLUSHER-AND-TWIST-LOCK-HANDLE-SET",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Standard Flusher and Twist-Lock Handle Set - [COLTLBD2]",
      "description": "Professional-grade angle finishing with precision, comfort, and versatility — all in one complete set.",
      "price": 174.0,
      "regularPrice": 174.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLTLBD2",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "08AHA",
        "08TL3-8",
        "2.5SF",
        "3.5SF",
        "3SF",
        "3SFWT",
        "4SF",
        "Columbia",
        "Columbia Set",
        "Semi Automatic Taping Tools",
        "colombia",
        "set"
      ],
      "attributes": [
        {
          "name": "Columbia Standard Flusher (Size)",
          "value": "3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "preset_bundle",
      "sizeLabel": "Columbia Standard Flusher (Size): 3\"",
      "sortKey": 2.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "JKBP",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia 3 Piece Stainless Steel Comfort Grip Joint Knife Set - [JKBP]",
      "description": "Columbia Tools is proud to launch all-new Knives with Comfort Grip Handles — expertly designed to make drywall finishing faster, cleaner, and easier than ever.",
      "price": 43.0,
      "regularPrice": 43.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "JKBP",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "CGPK4",
        "CGPK5",
        "CGPK6",
        "Columbia",
        "JKBP",
        "Taping & Finishing Tools",
        "blister",
        "joint knife",
        "joint knife set",
        "taping knife set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "JKBP",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "3WJKBP",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia 3 Piece Three-Way Stainless Steel Comfort Grip Joint Knife Set - [3WJKBP]",
      "description": "Columbia Tools is proud to launch all-new Three-Way Knives with Comfort Grip Handles — expertly designed to make finishing three-way drywall corners faster, cleaner, and easier than ever.",
      "price": 43.0,
      "regularPrice": 43.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "3WJKBP",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "3CGPK4",
        "3CGPK5",
        "3CGPK6",
        "3WJKBP",
        "Columbia",
        "Taping & Finishing Tools",
        "blister",
        "joint knife",
        "joint knife set",
        "taping knife set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "3WJKBP",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLHTBDL2",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia 3Way Stainless Steel Putty Knife Set with Nylon Handle - [COLHTBDL2]",
      "description": "Columbia Tools is proud to launch all-new Three-Way Knives – expertly designed to make finishing three-way drywall corners faster, cleaner, and easier than ever.",
      "price": 44.0,
      "regularPrice": 44.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLHTBDL2",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Taping & Finishing Tools",
        "hand tool set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLHTBDL2",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLSABDL3",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Full Semi-Automatic Taping Tool and Sanding Set with Bonus Hand Tool Set - [COLSABDL3]",
      "description": "The Columbia Full Semi-Automatic Taping Tool Kit can significantly increase your taping and finishing production capabilities when compared to hand taping. Semi-Auto taping tools greatly increase efficiency and consistency compared to hand taping and decrease waste, resulting in reduced material use. Apply the tape...",
      "price": 1347.0,
      "regularPrice": 1347.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "COLSABDL3",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "Columbia Set",
        "Columbia Taping Tools",
        "Semi Automatic Taping Tools",
        "colombia",
        "columbia semi auto set",
        "columbia sets",
        "full semit kit",
        "semi auto kit",
        "set",
        "starter kit",
        "taping and sanding promo",
        "taping kit",
        "taping set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLSABDL3",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLHTBDL3",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Taping Knife Set - [COLHTBDL3]",
      "description": "Columbia Tools is proud to launch our all-new Columbia Taping Knives – crafted for professionals who demand speed, precision, comfort, and durability on every job.",
      "price": 53.0,
      "regularPrice": 53.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "COLHTBDL3",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Taping & Finishing Tools",
        "hand tool set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLHTBDL3",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLTLBDL3",
      "parentSku": "COL-COLUMBIA-STANDARD-FLUSHER-AND-TWIST-LOCK-HANDLE-SET",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Standard Flusher and Twist-Lock Handle Set - [COLTLBDL3]",
      "description": "Professional-grade angle finishing with precision, comfort, and versatility — all in one complete set.",
      "price": 175.0,
      "regularPrice": 175.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLTLBDL3",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "08AHA",
        "08TL3-8",
        "2.5SF",
        "3.5SF",
        "3SF",
        "3SFWT",
        "4SF",
        "Columbia",
        "Columbia Set",
        "Semi Automatic Taping Tools",
        "colombia",
        "set"
      ],
      "attributes": [
        {
          "name": "Columbia Standard Flusher (Size)",
          "value": "3\" Widetrack",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "preset_bundle",
      "sizeLabel": "Columbia Standard Flusher (Size): 3\" Widetrack",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLTLBDL3.5",
      "parentSku": "COL-COLUMBIA-STANDARD-FLUSHER-AND-TWIST-LOCK-HANDLE-SET",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Standard Flusher and Twist-Lock Handle Set - [COLTLBDL3.5]",
      "description": "Professional-grade angle finishing with precision, comfort, and versatility — all in one complete set.",
      "price": 179.0,
      "regularPrice": 179.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLTLBDL3.5",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "08AHA",
        "08TL3-8",
        "2.5SF",
        "3.5SF",
        "3SF",
        "3SFWT",
        "4SF",
        "Columbia",
        "Columbia Set",
        "Semi Automatic Taping Tools",
        "colombia",
        "set"
      ],
      "attributes": [
        {
          "name": "Columbia Standard Flusher (Size)",
          "value": "3.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "preset_bundle",
      "sizeLabel": "Columbia Standard Flusher (Size): 3.5\"",
      "sortKey": 3.5,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLATBDL4",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Basic Finishing Set with Bonus Hand Tool Set - [COLATBDL4]",
      "description": "10\" and 12\" Flat Finishing Boxes (10FFB) (12FFB)",
      "price": 1419.0,
      "regularPrice": 1419.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLATBDL4",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "Columbia Set",
        "colombia",
        "flat box set",
        "mud pump",
        "set",
        "taping set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLATBDL4",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLSABDL4",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Predator Full Semi-Automatic Taping Tool and Sanding Set with Bonus Hand Tool Set - [COLSABDL4]",
      "description": "The Columbia Full Semi-Automatic Taping Tool Kit can significantly increase your taping and finishing production capabilities when compared to hand taping. Semi-Auto taping tools greatly increase efficiency and consistency compared to hand taping and decrease waste, resulting in reduced material use. Apply the tape...",
      "price": 1389.0,
      "regularPrice": 1389.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "COLSABDL4",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "Columbia Set",
        "Columbia Taping Tools",
        "Semi Automatic Taping Tools",
        "full semi kit",
        "set",
        "set semi auto kit",
        "sets",
        "starter kit",
        "taping and sanding promo",
        "taping kit",
        "taping set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLSABDL4",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLHTBDL4",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Stainless Steel Knife and Mud Pan Set with Bucket - [COLHTBDL4]",
      "description": "Designed for precision, strength, signed for precision, strength, and flexibility.",
      "price": 110.0,
      "regularPrice": 110.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLHTBDL4",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Taping & Finishing Tools",
        "hand tool set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLHTBDL4",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLTLBDL4",
      "parentSku": "COL-COLUMBIA-STANDARD-FLUSHER-AND-TWIST-LOCK-HANDLE-SET",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Standard Flusher and Twist-Lock Handle Set - [COLTLBDL4]",
      "description": "Professional-grade angle finishing with precision, comfort, and versatility — all in one complete set.",
      "price": 187.0,
      "regularPrice": 187.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLTLBDL4",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "08AHA",
        "08TL3-8",
        "2.5SF",
        "3.5SF",
        "3SF",
        "3SFWT",
        "4SF",
        "Columbia",
        "Columbia Set",
        "Semi Automatic Taping Tools",
        "colombia",
        "set"
      ],
      "attributes": [
        {
          "name": "Columbia Standard Flusher (Size)",
          "value": "4\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "preset_bundle",
      "sizeLabel": "Columbia Standard Flusher (Size): 4\"",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLSABDL5",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Basic Semi-Automatic Taping Tool Set with Express Case - [COLSABDL5]",
      "description": "The Columbia Basic Semi-Automatic Taping Tool Set with Express Case is the perfect solution for professionals and DIY enthusiasts looking to streamline taping tasks. This set includes high-quality semi-automatic taping tools that helps you apply mud quickly and efficiently in corners, saving you time and effort.",
      "price": 688.0,
      "regularPrice": 688.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLSABDL5",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "Columbia Set",
        "Columbia Taping Tools",
        "Semi Automatic Taping Tools",
        "colombia",
        "columbia semi auto set",
        "columbia sets",
        "semi auto kit",
        "set",
        "starter kit",
        "taping kit",
        "taping set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLSABDL5",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLHTBDL5",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Basic Stainless Steel Knife and Mud Pan Set with Bucket - [COLHTBDL5]",
      "description": "Designed for precision, strength, signed for precision, strength, and flexibility.",
      "price": 70.0,
      "regularPrice": 70.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLHTBDL5",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Taping & Finishing Tools",
        "hand tool set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLHTBDL5",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLHTBDL6",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Basic Mud Roller and Sabre Smoothing Blade Set with Case - [COLHTBDL6]",
      "description": "The Mud Roller from Columbia Tools – the ultimate solution for fast, smooth, and efficient coating applications. Designed for professionals, this innovative mud roller ensures consistent coating thickness and minimal effort for every pass.",
      "price": 247.0,
      "regularPrice": 247.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLHTBDL6",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Taping & Finishing Tools",
        "mud roller",
        "smoothing blade",
        "smoothing blades"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLHTBDL6",
      "sortKey": 6.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLSABDL6",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Starter Semi-Automatic Taping Tool Set with Compact Case - [COLSABDL6]",
      "description": "Upgrade your taping and finishing production with the Columbia Starter Set, an essential semi-automatic taping tool kit that outperforms traditional hand taping. The Semi-Auto Taper increases efficiency and consistency while reducing material waste. Achieve a professional finish with corner flushers. All tools conve...",
      "price": 594.0,
      "regularPrice": 594.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLSABDL6",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "Semi Automatic Taping Tools",
        "set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLSABDL6",
      "sortKey": 6.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLHTBDL7",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Essentials Stainless Steel Putty Knife Set with Bucket - [COLHTBDL7]",
      "description": "Designed for precision, strength, signed for precision, strength, and flexibility.",
      "price": 51.0,
      "regularPrice": 51.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLHTBDL7",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Taping & Finishing Tools",
        "hand tool set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLHTBDL7",
      "sortKey": 7.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLSABDL7",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Predator Tomahawk Smoothing Blade Set with Hard Case - [COLSABDL7]",
      "description": "The Columbia Predator Tomahawk set of Smoothing Blades is the most durable set on the market today. With no plastic pieces, the Tomahawk doesn't snap under pressure. And because the blades use a Flat Box handle, there are no plastic adaptors that will break with the weight of the larger blades. This also increases t...",
      "price": 634.0,
      "regularPrice": 634.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "COLSABDL7",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Taping & Finishing Tools",
        "colombia",
        "set",
        "skim blade",
        "skimming blade",
        "skimming blades",
        "smoothing blade",
        "tomahawk",
        "tomahawk kit"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLSABDL7",
      "sortKey": 7.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLATBDL3",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia 8pc Starter Finishing Set with Bonus Hand Tool Set - [COLATBDL3]",
      "description": "10\" and 12\" Flat Finishing Boxes (10FFB) (12FFB)",
      "price": 2132.0,
      "regularPrice": 2132.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLATBDL3",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "Columbia Set",
        "Columbia Taping Tools",
        "Starter Set",
        "colombia",
        "set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLATBDL3",
      "sortKey": 8.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLHTBDL8",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Complete Stainless Steel Putty Knife Set with Bucket - [COLHTBDL8]",
      "description": "Designed for precision, strength, signed for precision, strength, and flexibility.",
      "price": 157.0,
      "regularPrice": 157.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLHTBDL8",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Taping & Finishing Tools",
        "hand tool set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLHTBDL8",
      "sortKey": 8.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLHTBDL13",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia One Piece Stainless Steel Putty Knife Set - [COLHTBDL13]",
      "description": "Columbia Tools is proud to launch our all-new One Piece Putty Knives – precision-crafted from stainless steel for strength, flexibility, and all-day comfort.",
      "price": 52.0,
      "regularPrice": 52.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLHTBDL13",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "OPPK4",
        "OPPK5",
        "OPPK6",
        "Taping & Finishing Tools",
        "set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLHTBDL13",
      "sortKey": 13.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLHTBDL14",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Basic One Piece Stainless Steel Hand Tool Set - [COLHTBDL14]",
      "description": "Columbia Tools is proud to launch our all-new One Piece Putty Knives – precision-crafted from stainless steel for strength, flexibility, and all-day comfort.",
      "price": 94.0,
      "regularPrice": 94.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLHTBDL14",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Taping & Finishing Tools"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLHTBDL14",
      "sortKey": 14.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "COLHTBDL15",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Mud Roller and Putty Knife Set - [COLHTBDL15]",
      "description": "The Columbia Mud Roller and Putty Knife Set is the ideal all-in-one solution for professionals who need speed, consistency, and precision when applying and finishing compounds. Designed for efficiency on the jobsite, this kit combines Columbia’s trusted tools to help you spread, smooth, and finish coatings with mini...",
      "price": 212.0,
      "regularPrice": 212.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "COLHTBDL15",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Taping & Finishing Tools"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "COLHTBDL15",
      "sortKey": 15.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SACS",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Commando Set - [SACS]",
      "description": "The NEW Commando Set from Columbia Tools takes the guess work out of moving over to Semi-Automatic Drywall Tools. This set is a great introduction to Semi-Auto tools for the part-time finisher, or someone who is looking to make the leap to Automatic tools but doesn’t want to jump right in yet. This set will save you...",
      "price": 919.0,
      "regularPrice": 919.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "SACS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "Columbia Set",
        "Columbia Taping Tools",
        "SACS",
        "Semi Automatic Taping Tools",
        "colombia",
        "columbia semi auto set",
        "columbia sets",
        "commando",
        "commando set",
        "semi auto kit",
        "set",
        "starter kit",
        "taping kit",
        "taping set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "SACS",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FSBSET",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Fat Boy Smoothing Blade Set - [FSBSET]",
      "description": "Upgrade your finishing game with this premium Fat Boy Smoothing Blades Set, designed for precision, durability, and ultra-smooth results on every job. Built for professional drywall finishers and contractors, these blades deliver consistent performance whether you're working on large surfaces or detailed touch-ups.",
      "price": 472.0,
      "regularPrice": 472.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FSBSET",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Columbia Set",
        "Columbia Taping Tools",
        "FSBSET",
        "Taping & Finishing Tools",
        "colombia",
        "columbia sets",
        "set",
        "smoothing blade",
        "warrior set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "FSBSET",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PTS",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Predator Tactical Set - [PTS]",
      "description": "The NEW Tactical Set makes moving to Automatic Taping Tools easy! Every taping tool you will need to completely finish a house comes packaged inside our durable, rugged Road Case. This set takes the guess work out of choosing the perfect drywall taping tools kit. Now with all carbon fiber handles (excluding twist lo...",
      "price": 5861.0,
      "regularPrice": 5861.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PTS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "Columbia Set",
        "PTS",
        "colombia",
        "set",
        "tactical set",
        "taping set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "PTS",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SBSET",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Sabre Smoothing Blade Set - [SBSET]",
      "description": "The New Columbia Sabre set takes the guess work out of starting off with Smoothing Blades. Just like the Tomahawk Warrior set, this set contains a variety of sizes that will help you complete most every smoothing blade job. From wiping down tapes, to fully coating walls and ceilings, and everything in between, this...",
      "price": 413.0,
      "regularPrice": 413.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "SBSET",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Columbia Set",
        "Columbia Taping Tools",
        "SBSET",
        "Taping & Finishing Tools",
        "colombia",
        "columbia sets",
        "set",
        "smoothing blade"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "SBSET",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SPECIALOPS",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Special Ops Set with Bonus Hand Tool Set - [SPECIALOPS]",
      "description": "The EXCLUSIVE Special Ops Set makes moving to automatic taping tools easy! Almost every taping tool you will need to completely finish a house comes packaged inside a durable, high impact and supreme weather resistance case. This set takes the guess work out of choosing the perfect drywall taping tools kit.",
      "price": 2940.0,
      "regularPrice": 2940.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "SPECIALOPS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "10FFB",
        "12FFB",
        "3AH",
        "3NS",
        "3SF",
        "Automatic Taping Tools",
        "BF",
        "C1HEXT",
        "Columbia",
        "Columbia Set",
        "MH",
        "PHA",
        "Special OPS",
        "VCV800",
        "aha",
        "box filler",
        "colombia",
        "set",
        "special edition",
        "taping set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "SPECIALOPS",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TS",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Tactical Set - [TS]",
      "description": "The NEW Tactical Set makes moving to Automatic Taping Tools easy! Every taping tool you will need to completely finish a house comes packaged inside our durable, rugged Road Case. This set takes the guess work out of choosing the perfect drywall taping tools kit.",
      "price": 5435.0,
      "regularPrice": 5435.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "Columbia Set",
        "TS",
        "colombia",
        "price:4984.47",
        "set",
        "tactical set",
        "taping set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "TS",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TWS",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Tomahawk Warrior Set - [TWS]",
      "description": "The New Columbia Warrior set takes the guess work out of starting off with Smoothing Blades. This set contains a variety of sizes that will help you complete most every smoothing blade job. From wiping down tapes, to fully coating walls and ceilings, and everything in between, this kit will have you covered.The Warr...",
      "price": 663.0,
      "regularPrice": 663.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TWS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Columbia Set",
        "Columbia Taping Tools",
        "TWS",
        "Taping & Finishing Tools",
        "colombia",
        "columbia sets",
        "set",
        "smoothing blade",
        "warrior set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "TWS",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FSB7",
      "parentSku": "COL-COLUMBIA-FAT-BOY-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Fat Boy Smoothing Blade - [FSB7]",
      "description": "Due to their lightweight design and ease of use, skimming blades are becoming an increasingly popular tool in the drywall finishing industry.",
      "price": 38.0,
      "regularPrice": 38.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FSB7",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FSB10",
        "FSB12",
        "FSB14",
        "FSB16",
        "FSB18",
        "FSB24",
        "FSB32",
        "FSB40",
        "FSB48",
        "FSB7",
        "Taping & Finishing Tools",
        "colombia",
        "fat boy",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 7\"",
      "sortKey": 7.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SSB7",
      "parentSku": "COL-COLUMBIA-SABRE-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Sabre Smoothing Blade - [SSB7]",
      "description": "Columbia has answered the call from our customers looking for a lighter/more affordable version of the Tomahawk Smoothing Blades. The Sabre Smoothing Blades still offer a precise finish but by no means does this product replace the Tomahawk’s being our premium option. It is our solution to Columbia Customers looking...",
      "price": 21.0,
      "regularPrice": 21.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "SSB7",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "SSB-10",
        "SSB-12",
        "SSB-14",
        "SSB-16",
        "SSB-18",
        "SSB-24",
        "SSB-32",
        "SSB-40",
        "SSB-48",
        "SSB-7",
        "SSB10",
        "SSB12",
        "SSB14",
        "SSB16",
        "SSB18",
        "SSB24",
        "SSB32",
        "SSB40",
        "SSB48",
        "SSB7",
        "Taping & Finishing Tools",
        "colombia",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 7\"",
      "sortKey": 7.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TSB-7",
      "parentSku": "COL-COLUMBIA-TOMAHAWK-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Tomahawk Smoothing Blade - [TSB-7]",
      "description": "Newly upgraded Columbia Tomahawk Smoothing Blades! Now the handle grip is removable so those that want to use the blades by hand won’t have to worry about the bolts in the way! The new grip also comes equipped with a safety latch for handle attachment. Add in the new end caps for a smoother, slicker look and you hav...",
      "price": 50.0,
      "regularPrice": 50.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TSB-7",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "TSB-10",
        "TSB-12",
        "TSB-14",
        "TSB-16",
        "TSB-18",
        "TSB-24",
        "TSB-32",
        "TSB-40",
        "TSB-48",
        "TSB-7",
        "Taping & Finishing Tools",
        "colombia",
        "new tomahawk",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 7\"",
      "sortKey": 7.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FSB10",
      "parentSku": "COL-COLUMBIA-FAT-BOY-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Fat Boy Smoothing Blade - [FSB10]",
      "description": "Due to their lightweight design and ease of use, skimming blades are becoming an increasingly popular tool in the drywall finishing industry.",
      "price": 41.0,
      "regularPrice": 41.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FSB10",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FSB10",
        "FSB12",
        "FSB14",
        "FSB16",
        "FSB18",
        "FSB24",
        "FSB32",
        "FSB40",
        "FSB48",
        "FSB7",
        "Taping & Finishing Tools",
        "colombia",
        "fat boy",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 10\"",
      "sortKey": 10.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SSB10",
      "parentSku": "COL-COLUMBIA-SABRE-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Sabre Smoothing Blade - [SSB10]",
      "description": "Columbia has answered the call from our customers looking for a lighter/more affordable version of the Tomahawk Smoothing Blades. The Sabre Smoothing Blades still offer a precise finish but by no means does this product replace the Tomahawk’s being our premium option. It is our solution to Columbia Customers looking...",
      "price": 28.0,
      "regularPrice": 28.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "SSB10",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "SSB-10",
        "SSB-12",
        "SSB-14",
        "SSB-16",
        "SSB-18",
        "SSB-24",
        "SSB-32",
        "SSB-40",
        "SSB-48",
        "SSB-7",
        "SSB10",
        "SSB12",
        "SSB14",
        "SSB16",
        "SSB18",
        "SSB24",
        "SSB32",
        "SSB40",
        "SSB48",
        "SSB7",
        "Taping & Finishing Tools",
        "colombia",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 10\"",
      "sortKey": 10.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TSB-10",
      "parentSku": "COL-COLUMBIA-TOMAHAWK-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Tomahawk Smoothing Blade - [TSB-10]",
      "description": "Newly upgraded Columbia Tomahawk Smoothing Blades! Now the handle grip is removable so those that want to use the blades by hand won’t have to worry about the bolts in the way! The new grip also comes equipped with a safety latch for handle attachment. Add in the new end caps for a smoother, slicker look and you hav...",
      "price": 62.0,
      "regularPrice": 62.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TSB-10",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "TSB-10",
        "TSB-12",
        "TSB-14",
        "TSB-16",
        "TSB-18",
        "TSB-24",
        "TSB-32",
        "TSB-40",
        "TSB-48",
        "TSB-7",
        "Taping & Finishing Tools",
        "colombia",
        "new tomahawk",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 10\"",
      "sortKey": 10.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FSB12",
      "parentSku": "COL-COLUMBIA-FAT-BOY-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Fat Boy Smoothing Blade - [FSB12]",
      "description": "Due to their lightweight design and ease of use, skimming blades are becoming an increasingly popular tool in the drywall finishing industry.",
      "price": 45.0,
      "regularPrice": 45.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FSB12",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FSB10",
        "FSB12",
        "FSB14",
        "FSB16",
        "FSB18",
        "FSB24",
        "FSB32",
        "FSB40",
        "FSB48",
        "FSB7",
        "Taping & Finishing Tools",
        "colombia",
        "fat boy",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 12\"",
      "sortKey": 12.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SSB12",
      "parentSku": "COL-COLUMBIA-SABRE-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Sabre Smoothing Blade - [SSB12]",
      "description": "Columbia has answered the call from our customers looking for a lighter/more affordable version of the Tomahawk Smoothing Blades. The Sabre Smoothing Blades still offer a precise finish but by no means does this product replace the Tomahawk’s being our premium option. It is our solution to Columbia Customers looking...",
      "price": 34.0,
      "regularPrice": 34.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "SSB12",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "SSB-10",
        "SSB-12",
        "SSB-14",
        "SSB-16",
        "SSB-18",
        "SSB-24",
        "SSB-32",
        "SSB-40",
        "SSB-48",
        "SSB-7",
        "SSB10",
        "SSB12",
        "SSB14",
        "SSB16",
        "SSB18",
        "SSB24",
        "SSB32",
        "SSB40",
        "SSB48",
        "SSB7",
        "Taping & Finishing Tools",
        "colombia",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 12\"",
      "sortKey": 12.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TSB-12",
      "parentSku": "COL-COLUMBIA-TOMAHAWK-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Tomahawk Smoothing Blade - [TSB-12]",
      "description": "Newly upgraded Columbia Tomahawk Smoothing Blades! Now the handle grip is removable so those that want to use the blades by hand won’t have to worry about the bolts in the way! The new grip also comes equipped with a safety latch for handle attachment. Add in the new end caps for a smoother, slicker look and you hav...",
      "price": 70.0,
      "regularPrice": 70.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TSB-12",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "TSB-10",
        "TSB-12",
        "TSB-14",
        "TSB-16",
        "TSB-18",
        "TSB-24",
        "TSB-32",
        "TSB-40",
        "TSB-48",
        "TSB-7",
        "Taping & Finishing Tools",
        "colombia",
        "new tomahawk",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 12\"",
      "sortKey": 12.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FSB14",
      "parentSku": "COL-COLUMBIA-FAT-BOY-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Fat Boy Smoothing Blade - [FSB14]",
      "description": "Due to their lightweight design and ease of use, skimming blades are becoming an increasingly popular tool in the drywall finishing industry.",
      "price": 52.0,
      "regularPrice": 52.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FSB14",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FSB10",
        "FSB12",
        "FSB14",
        "FSB16",
        "FSB18",
        "FSB24",
        "FSB32",
        "FSB40",
        "FSB48",
        "FSB7",
        "Taping & Finishing Tools",
        "colombia",
        "fat boy",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 14\"",
      "sortKey": 14.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SSB14",
      "parentSku": "COL-COLUMBIA-SABRE-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Sabre Smoothing Blade - [SSB14]",
      "description": "Columbia has answered the call from our customers looking for a lighter/more affordable version of the Tomahawk Smoothing Blades. The Sabre Smoothing Blades still offer a precise finish but by no means does this product replace the Tomahawk’s being our premium option. It is our solution to Columbia Customers looking...",
      "price": 40.0,
      "regularPrice": 40.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "SSB14",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "SSB-10",
        "SSB-12",
        "SSB-14",
        "SSB-16",
        "SSB-18",
        "SSB-24",
        "SSB-32",
        "SSB-40",
        "SSB-48",
        "SSB-7",
        "SSB10",
        "SSB12",
        "SSB14",
        "SSB16",
        "SSB18",
        "SSB24",
        "SSB32",
        "SSB40",
        "SSB48",
        "SSB7",
        "Taping & Finishing Tools",
        "colombia",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 14\"",
      "sortKey": 14.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TSB-14",
      "parentSku": "COL-COLUMBIA-TOMAHAWK-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Tomahawk Smoothing Blade - [TSB-14]",
      "description": "Newly upgraded Columbia Tomahawk Smoothing Blades! Now the handle grip is removable so those that want to use the blades by hand won’t have to worry about the bolts in the way! The new grip also comes equipped with a safety latch for handle attachment. Add in the new end caps for a smoother, slicker look and you hav...",
      "price": 76.0,
      "regularPrice": 76.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TSB-14",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "TSB-10",
        "TSB-12",
        "TSB-14",
        "TSB-16",
        "TSB-18",
        "TSB-24",
        "TSB-32",
        "TSB-40",
        "TSB-48",
        "TSB-7",
        "Taping & Finishing Tools",
        "colombia",
        "new tomahawk",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 14\"",
      "sortKey": 14.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FSB16",
      "parentSku": "COL-COLUMBIA-FAT-BOY-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Fat Boy Smoothing Blade - [FSB16]",
      "description": "Due to their lightweight design and ease of use, skimming blades are becoming an increasingly popular tool in the drywall finishing industry.",
      "price": 59.0,
      "regularPrice": 59.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FSB16",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FSB10",
        "FSB12",
        "FSB14",
        "FSB16",
        "FSB18",
        "FSB24",
        "FSB32",
        "FSB40",
        "FSB48",
        "FSB7",
        "Taping & Finishing Tools",
        "colombia",
        "fat boy",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "16\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 16\"",
      "sortKey": 16.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SSB16",
      "parentSku": "COL-COLUMBIA-SABRE-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Sabre Smoothing Blade - [SSB16]",
      "description": "Columbia has answered the call from our customers looking for a lighter/more affordable version of the Tomahawk Smoothing Blades. The Sabre Smoothing Blades still offer a precise finish but by no means does this product replace the Tomahawk’s being our premium option. It is our solution to Columbia Customers looking...",
      "price": 46.0,
      "regularPrice": 46.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "SSB16",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "SSB-10",
        "SSB-12",
        "SSB-14",
        "SSB-16",
        "SSB-18",
        "SSB-24",
        "SSB-32",
        "SSB-40",
        "SSB-48",
        "SSB-7",
        "SSB10",
        "SSB12",
        "SSB14",
        "SSB16",
        "SSB18",
        "SSB24",
        "SSB32",
        "SSB40",
        "SSB48",
        "SSB7",
        "Taping & Finishing Tools",
        "colombia",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "16\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 16\"",
      "sortKey": 16.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FSB18",
      "parentSku": "COL-COLUMBIA-FAT-BOY-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Fat Boy Smoothing Blade - [FSB18]",
      "description": "Due to their lightweight design and ease of use, skimming blades are becoming an increasingly popular tool in the drywall finishing industry.",
      "price": 66.0,
      "regularPrice": 66.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FSB18",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FSB10",
        "FSB12",
        "FSB14",
        "FSB16",
        "FSB18",
        "FSB24",
        "FSB32",
        "FSB40",
        "FSB48",
        "FSB7",
        "Taping & Finishing Tools",
        "colombia",
        "fat boy",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "18\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 18\"",
      "sortKey": 18.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SSB18",
      "parentSku": "COL-COLUMBIA-SABRE-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Sabre Smoothing Blade - [SSB18]",
      "description": "Columbia has answered the call from our customers looking for a lighter/more affordable version of the Tomahawk Smoothing Blades. The Sabre Smoothing Blades still offer a precise finish but by no means does this product replace the Tomahawk’s being our premium option. It is our solution to Columbia Customers looking...",
      "price": 52.0,
      "regularPrice": 52.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "SSB18",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "SSB-10",
        "SSB-12",
        "SSB-14",
        "SSB-16",
        "SSB-18",
        "SSB-24",
        "SSB-32",
        "SSB-40",
        "SSB-48",
        "SSB-7",
        "SSB10",
        "SSB12",
        "SSB14",
        "SSB16",
        "SSB18",
        "SSB24",
        "SSB32",
        "SSB40",
        "SSB48",
        "SSB7",
        "Taping & Finishing Tools",
        "colombia",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "18\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 18\"",
      "sortKey": 18.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TSB-18",
      "parentSku": "COL-COLUMBIA-TOMAHAWK-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Tomahawk Smoothing Blade - [TSB-18]",
      "description": "Newly upgraded Columbia Tomahawk Smoothing Blades! Now the handle grip is removable so those that want to use the blades by hand won’t have to worry about the bolts in the way! The new grip also comes equipped with a safety latch for handle attachment. Add in the new end caps for a smoother, slicker look and you hav...",
      "price": 91.0,
      "regularPrice": 91.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "TSB-18",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "TSB-10",
        "TSB-12",
        "TSB-14",
        "TSB-16",
        "TSB-18",
        "TSB-24",
        "TSB-32",
        "TSB-40",
        "TSB-48",
        "TSB-7",
        "Taping & Finishing Tools",
        "colombia",
        "new tomahawk",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "18\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 18\"",
      "sortKey": 18.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FSB24",
      "parentSku": "COL-COLUMBIA-FAT-BOY-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Fat Boy Smoothing Blade - [FSB24]",
      "description": "Due to their lightweight design and ease of use, skimming blades are becoming an increasingly popular tool in the drywall finishing industry.",
      "price": 77.0,
      "regularPrice": 77.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FSB24",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FSB10",
        "FSB12",
        "FSB14",
        "FSB16",
        "FSB18",
        "FSB24",
        "FSB32",
        "FSB40",
        "FSB48",
        "FSB7",
        "Taping & Finishing Tools",
        "colombia",
        "fat boy",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "24\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 24\"",
      "sortKey": 24.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SSB24",
      "parentSku": "COL-COLUMBIA-SABRE-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Sabre Smoothing Blade - [SSB24]",
      "description": "Columbia has answered the call from our customers looking for a lighter/more affordable version of the Tomahawk Smoothing Blades. The Sabre Smoothing Blades still offer a precise finish but by no means does this product replace the Tomahawk’s being our premium option. It is our solution to Columbia Customers looking...",
      "price": 69.0,
      "regularPrice": 69.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "SSB24",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "SSB-10",
        "SSB-12",
        "SSB-14",
        "SSB-16",
        "SSB-18",
        "SSB-24",
        "SSB-32",
        "SSB-40",
        "SSB-48",
        "SSB-7",
        "SSB10",
        "SSB12",
        "SSB14",
        "SSB16",
        "SSB18",
        "SSB24",
        "SSB32",
        "SSB40",
        "SSB48",
        "SSB7",
        "Taping & Finishing Tools",
        "colombia",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "24\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 24\"",
      "sortKey": 24.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TSB-24",
      "parentSku": "COL-COLUMBIA-TOMAHAWK-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Tomahawk Smoothing Blade - [TSB-24]",
      "description": "Newly upgraded Columbia Tomahawk Smoothing Blades! Now the handle grip is removable so those that want to use the blades by hand won’t have to worry about the bolts in the way! The new grip also comes equipped with a safety latch for handle attachment. Add in the new end caps for a smoother, slicker look and you hav...",
      "price": 110.0,
      "regularPrice": 110.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TSB-24",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "TSB-10",
        "TSB-12",
        "TSB-14",
        "TSB-16",
        "TSB-18",
        "TSB-24",
        "TSB-32",
        "TSB-40",
        "TSB-48",
        "TSB-7",
        "Taping & Finishing Tools",
        "colombia",
        "new tomahawk",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "24\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 24\"",
      "sortKey": 24.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FSB32",
      "parentSku": "COL-COLUMBIA-FAT-BOY-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Fat Boy Smoothing Blade - [FSB32]",
      "description": "Due to their lightweight design and ease of use, skimming blades are becoming an increasingly popular tool in the drywall finishing industry.",
      "price": 99.0,
      "regularPrice": 99.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FSB32",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FSB10",
        "FSB12",
        "FSB14",
        "FSB16",
        "FSB18",
        "FSB24",
        "FSB32",
        "FSB40",
        "FSB48",
        "FSB7",
        "Taping & Finishing Tools",
        "colombia",
        "fat boy",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "32\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 32\"",
      "sortKey": 32.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SSB32",
      "parentSku": "COL-COLUMBIA-SABRE-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Sabre Smoothing Blade - [SSB32]",
      "description": "Columbia has answered the call from our customers looking for a lighter/more affordable version of the Tomahawk Smoothing Blades. The Sabre Smoothing Blades still offer a precise finish but by no means does this product replace the Tomahawk’s being our premium option. It is our solution to Columbia Customers looking...",
      "price": 92.0,
      "regularPrice": 92.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "SSB32",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "SSB-10",
        "SSB-12",
        "SSB-14",
        "SSB-16",
        "SSB-18",
        "SSB-24",
        "SSB-32",
        "SSB-40",
        "SSB-48",
        "SSB-7",
        "SSB10",
        "SSB12",
        "SSB14",
        "SSB16",
        "SSB18",
        "SSB24",
        "SSB32",
        "SSB40",
        "SSB48",
        "SSB7",
        "Taping & Finishing Tools",
        "colombia",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "32\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 32\"",
      "sortKey": 32.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TSB-32",
      "parentSku": "COL-COLUMBIA-TOMAHAWK-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Tomahawk Smoothing Blade - [TSB-32]",
      "description": "Newly upgraded Columbia Tomahawk Smoothing Blades! Now the handle grip is removable so those that want to use the blades by hand won’t have to worry about the bolts in the way! The new grip also comes equipped with a safety latch for handle attachment. Add in the new end caps for a smoother, slicker look and you hav...",
      "price": 136.0,
      "regularPrice": 136.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TSB-32",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "TSB-10",
        "TSB-12",
        "TSB-14",
        "TSB-16",
        "TSB-18",
        "TSB-24",
        "TSB-32",
        "TSB-40",
        "TSB-48",
        "TSB-7",
        "Taping & Finishing Tools",
        "colombia",
        "new tomahawk",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "32\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 32\"",
      "sortKey": 32.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FSB40",
      "parentSku": "COL-COLUMBIA-FAT-BOY-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Fat Boy Smoothing Blade - [FSB40]",
      "description": "Due to their lightweight design and ease of use, skimming blades are becoming an increasingly popular tool in the drywall finishing industry.",
      "price": 126.0,
      "regularPrice": 126.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FSB40",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FSB10",
        "FSB12",
        "FSB14",
        "FSB16",
        "FSB18",
        "FSB24",
        "FSB32",
        "FSB40",
        "FSB48",
        "FSB7",
        "Taping & Finishing Tools",
        "colombia",
        "fat boy",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "40\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 40\"",
      "sortKey": 40.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SSB40",
      "parentSku": "COL-COLUMBIA-SABRE-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Sabre Smoothing Blade - [SSB40]",
      "description": "Columbia has answered the call from our customers looking for a lighter/more affordable version of the Tomahawk Smoothing Blades. The Sabre Smoothing Blades still offer a precise finish but by no means does this product replace the Tomahawk’s being our premium option. It is our solution to Columbia Customers looking...",
      "price": 115.0,
      "regularPrice": 115.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "SSB40",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "SSB-10",
        "SSB-12",
        "SSB-14",
        "SSB-16",
        "SSB-18",
        "SSB-24",
        "SSB-32",
        "SSB-40",
        "SSB-48",
        "SSB-7",
        "SSB10",
        "SSB12",
        "SSB14",
        "SSB16",
        "SSB18",
        "SSB24",
        "SSB32",
        "SSB40",
        "SSB48",
        "SSB7",
        "Taping & Finishing Tools",
        "colombia",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "40\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 40\"",
      "sortKey": 40.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TSB-40",
      "parentSku": "COL-COLUMBIA-TOMAHAWK-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Tomahawk Smoothing Blade - [TSB-40]",
      "description": "Newly upgraded Columbia Tomahawk Smoothing Blades! Now the handle grip is removable so those that want to use the blades by hand won’t have to worry about the bolts in the way! The new grip also comes equipped with a safety latch for handle attachment. Add in the new end caps for a smoother, slicker look and you hav...",
      "price": 168.0,
      "regularPrice": 168.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TSB-40",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "TSB-10",
        "TSB-12",
        "TSB-14",
        "TSB-16",
        "TSB-18",
        "TSB-24",
        "TSB-32",
        "TSB-40",
        "TSB-48",
        "TSB-7",
        "Taping & Finishing Tools",
        "colombia",
        "new tomahawk",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "40\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 40\"",
      "sortKey": 40.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FSB48",
      "parentSku": "COL-COLUMBIA-FAT-BOY-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Fat Boy Smoothing Blade - [FSB48]",
      "description": "Due to their lightweight design and ease of use, skimming blades are becoming an increasingly popular tool in the drywall finishing industry.",
      "price": 162.0,
      "regularPrice": 162.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FSB48",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FSB10",
        "FSB12",
        "FSB14",
        "FSB16",
        "FSB18",
        "FSB24",
        "FSB32",
        "FSB40",
        "FSB48",
        "FSB7",
        "Taping & Finishing Tools",
        "colombia",
        "fat boy",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "48\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 48\"",
      "sortKey": 48.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SSB48",
      "parentSku": "COL-COLUMBIA-SABRE-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Sabre Smoothing Blade - [SSB48]",
      "description": "Columbia has answered the call from our customers looking for a lighter/more affordable version of the Tomahawk Smoothing Blades. The Sabre Smoothing Blades still offer a precise finish but by no means does this product replace the Tomahawk’s being our premium option. It is our solution to Columbia Customers looking...",
      "price": 133.0,
      "regularPrice": 133.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "SSB48",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "SSB-10",
        "SSB-12",
        "SSB-14",
        "SSB-16",
        "SSB-18",
        "SSB-24",
        "SSB-32",
        "SSB-40",
        "SSB-48",
        "SSB-7",
        "SSB10",
        "SSB12",
        "SSB14",
        "SSB16",
        "SSB18",
        "SSB24",
        "SSB32",
        "SSB40",
        "SSB48",
        "SSB7",
        "Taping & Finishing Tools",
        "colombia",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "48\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 48\"",
      "sortKey": 48.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TSB-48",
      "parentSku": "COL-COLUMBIA-TOMAHAWK-SMOOTHING-BLADE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Tomahawk Smoothing Blade - [TSB-48]",
      "description": "Newly upgraded Columbia Tomahawk Smoothing Blades! Now the handle grip is removable so those that want to use the blades by hand won’t have to worry about the bolts in the way! The new grip also comes equipped with a safety latch for handle attachment. Add in the new end caps for a smoother, slicker look and you hav...",
      "price": 221.0,
      "regularPrice": 221.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "TSB-48",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "TSB-10",
        "TSB-12",
        "TSB-14",
        "TSB-16",
        "TSB-18",
        "TSB-24",
        "TSB-32",
        "TSB-40",
        "TSB-48",
        "TSB-7",
        "Taping & Finishing Tools",
        "colombia",
        "new tomahawk",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "48\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 48\"",
      "sortKey": 48.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SBCASEM",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Sabre Blade Case (Medium) - [SBCASEM]",
      "description": "The Sabre Blade Case is convenient case to protect your investment. The case also makes it easy to get your set onto the job site.",
      "price": 91.0,
      "regularPrice": 91.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "SBCASEM",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Columbia",
        "Columbia Taping Tools",
        "SBCASEM",
        "Semi Automatic Taping Tools",
        "carrying case",
        "case",
        "colombia",
        "gun case",
        "hard case",
        "tool case"
      ],
      "attributes": [],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "SBCASEM",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FTH4-6",
      "parentSku": "COL-COLUMBIA-FIBERGLASS-SMOOTHING-BLADE-EXTENSION-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Fiberglass Smoothing Blade Extension Handle - [FTH4-6]",
      "description": "Manufactured with high-quality fiberglass, aluminum, and high-impact ABS composite, Columbia Skimming Blade and Compound Roller Extendable Handles offer lightweight handling while maintaining exceptional rigidity and durability. The most popular handle size for both Columbia skimming blades and compound rollers is t...",
      "price": 59.0,
      "regularPrice": 59.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FTH4-6",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FTH4-6",
        "FTH5-8",
        "Taping & Finishing Tools",
        "blade",
        "finishing blade",
        "finishing blades",
        "level 5 skim blade",
        "pole",
        "skim blade",
        "skimming blades",
        "smoothing blade",
        "wiping blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4' - 6' Telescopic",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade_handle",
      "sizeLabel": "Size: 4' - 6' Telescopic",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FTH5-8",
      "parentSku": "COL-COLUMBIA-FIBERGLASS-SMOOTHING-BLADE-EXTENSION-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia Fiberglass Smoothing Blade Extension Handle - [FTH5-8]",
      "description": "Manufactured with high-quality fiberglass, aluminum, and high-impact ABS composite, Columbia Skimming Blade and Compound Roller Extendable Handles offer lightweight handling while maintaining exceptional rigidity and durability. The most popular handle size for both Columbia skimming blades and compound rollers is t...",
      "price": 63.0,
      "regularPrice": 63.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FTH5-8",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FTH4-6",
        "FTH5-8",
        "Taping & Finishing Tools",
        "blade",
        "finishing blade",
        "finishing blades",
        "level 5 skim blade",
        "pole",
        "skim blade",
        "skimming blades",
        "smoothing blade",
        "wiping blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "5' - 8' Telescopic",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade_handle",
      "sizeLabel": "Size: 5' - 8' Telescopic",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FSBC",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Fat Boy Smoothing Blade Adapter Claw - [FSBC]",
      "description": "Upgrade the versatility of your Fat Boy Smoothing Blade with this precision-made Adapter. Designed for a secure, reliable fit, this adapter allows the Fat Boy Smoothing Blade to attach effortlessly to compatible tools or extension handles. Built for durability and ease of use, it ensures a stable connection that enh...",
      "price": 32.0,
      "regularPrice": 32.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FSBC",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "FSBC",
        "Taping & Finishing Tools",
        "adaptor for pole",
        "blade",
        "finishing blade",
        "finishing blade adaptor",
        "finishing blades",
        "pole adaptor",
        "skim blade",
        "skimming blades",
        "smoothing blade",
        "wiping blade"
      ],
      "attributes": [],
      "optionGroup": "smoothing_blade_handle",
      "sizeLabel": "FSBC",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SBC",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Sabre Smoothing Blade Claw - [SBC]",
      "description": "Adapter for use with Sabre Smoothing Blade. Attaches to Sabre Extension pole and Sabre Smoothing Blade.",
      "price": 24.0,
      "regularPrice": 24.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "SBC",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "SBC",
        "Taping & Finishing Tools",
        "adaptor",
        "blade adaptor",
        "colombia",
        "semi automatic",
        "smoothing blade",
        "smoothing blade adaptor"
      ],
      "attributes": [],
      "optionGroup": "smoothing_blade_handle",
      "sizeLabel": "SBC",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "SBP",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Sabre Smoothing Blade Extension Pole - [SBP]",
      "description": "Enhance your reach with a Sabre Extension pole.",
      "price": 66.0,
      "regularPrice": 66.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "SBP",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "SBP",
        "Taping & Finishing Tools",
        "smoothing blade"
      ],
      "attributes": [],
      "optionGroup": "smoothing_blade_handle",
      "sizeLabel": "SBP",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CLTHA",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Tomalock Adaptor - [CLTHA]",
      "description": "Convert your Columbia ONE handle into a Columbia Tomahawk Smoothing Blade Handle, with Columbia Tomalock Adaptor. Machined in Columbia's \"State of the Art\" North American Factory, the Tomalock, features a Cam Lock system, that locks the smoothing blade into position as you work. Unlike traditional flat box handles,...",
      "price": 94.0,
      "regularPrice": 94.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CLTHA",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "CLTHA",
        "Columbia",
        "Taping & Finishing Tools",
        "adaptor",
        "blade adaptor",
        "colombia",
        "columbia tomalock",
        "semi automatic",
        "smoothing blade",
        "smoothing blade adaptor",
        "tomalock",
        "tomalock adaptor"
      ],
      "attributes": [],
      "optionGroup": "smoothing_blade_handle",
      "sizeLabel": "CLTHA",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "UTA",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Universal Thread Adaptor - [UTA]",
      "description": "Upgrade the versatility of your Columbia Fiberglass Smoothing Blade Extension Handle with this Composite-Body Skimming Blade Adapter. This is the same adapter included with Columbia extension handles, designed specifically to connect composite-body Columbia skimming blades to extendable handles with a secure, non-ro...",
      "price": 11.0,
      "regularPrice": 11.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "UTA",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Taping & Finishing Tools"
      ],
      "tags": [
        "Columbia",
        "Taping & Finishing Tools",
        "UTA",
        "adaptor for pole",
        "finishing blade adaptor",
        "finishing blades",
        "pole adaptor",
        "skim blade",
        "skimming blades",
        "smoothing blade",
        "wiping blade"
      ],
      "attributes": [],
      "optionGroup": "smoothing_blade_handle",
      "sizeLabel": "UTA",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "C1HS",
      "parentSku": "COL-COLUMBIA-ONE-FIXED-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia One Fixed Handle - [C1HS]",
      "description": "The Columbia One Handle is designed to work with your Columbia products universally. From the Nailspotters and Angleheads, to the Rollers and the Corner Boxes, the one system allows you to lighten your load and still utilize all the finishing tools you love. With the exception of the flat boxes, this one handle is a...",
      "price": 40.0,
      "regularPrice": 40.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "C1HS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "C1H",
        "Columbia",
        "colombia",
        "columbia one",
        "corner roller handle",
        "fixed handle",
        "nail spotter handle",
        "semi automatic"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "1'",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "support_handle",
      "sizeLabel": "Size: 1'",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "C1H",
      "parentSku": "COL-COLUMBIA-ONE-FIXED-HANDLE",
      "type": "variation",
      "brand": "Columbia",
      "name": "Columbia One Fixed Handle - [C1H]",
      "description": "The Columbia One Handle is designed to work with your Columbia products universally. From the Nailspotters and Angleheads, to the Rollers and the Corner Boxes, the one system allows you to lighten your load and still utilize all the finishing tools you love. With the exception of the flat boxes, this one handle is a...",
      "price": 35.0,
      "regularPrice": 35.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "C1H",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "C1H",
        "Columbia",
        "colombia",
        "columbia one",
        "corner roller handle",
        "fixed handle",
        "nail spotter handle",
        "semi automatic"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4'",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "support_handle",
      "sizeLabel": "Size: 4'",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CHXL",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Long Extendable Handle - 4' - 8' - [CHXL]",
      "description": "The Columbia Long Extendible Handle is a 1 and 1/4\" thick design pipe. These handles are durable and extremely long lasting, all while maintaining the comfort and ease of use that you're used to with the Columbia brand of tools. The Columbia Long Extendible Handle is not only the lightest on the market, but also the...",
      "price": 150.0,
      "regularPrice": 150.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CHXL",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "CHXL",
        "Columbia",
        "angle head handle",
        "colombia",
        "corner roller handle",
        "extendable handle",
        "nail spotter handle",
        "nailspotter handle",
        "semi automatic"
      ],
      "attributes": [],
      "optionGroup": "support_handle",
      "sizeLabel": "CHXL",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PCHXL",
      "parentSku": null,
      "type": "simple",
      "brand": "Columbia",
      "name": "Columbia Predator Long Extendable Handle - 4' - 8' - [PCHXL]",
      "description": "The Columbia Predator Long Extendible Handle is a 1 and 1/4\" thick design pipe. These handles are light, durable and extremely long lasting, all while maintaining the comfort and ease of use that you're used to with the Columbia brand of tools. The Columbia Predator Long Extendible Handle is not only the lightest on...",
      "price": 168.0,
      "regularPrice": 168.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PCHXL",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Columbia > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "Columbia",
        "PCHXL",
        "angle head handle",
        "carbon fiber",
        "corner roller handle",
        "extendable handle",
        "nail spotter handle",
        "predator",
        "semi automatic"
      ],
      "attributes": [],
      "optionGroup": "support_handle",
      "sizeLabel": "PCHXL",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-732",
      "parentSku": "LVL5-LEVEL-5-CORNER-FINISHER",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Corner Finisher - [4-732]",
      "description": "The Level 5 Tools Corner Finisher has a classic, high quality cast-aluminum design that evenly finishes both sides of inside corners in a single pass. The frames are cast and machined out of high-strength stainless steel and the high-carbon steel blades are designed to last longer and chip less than competitive blad...",
      "price": 439.0,
      "regularPrice": 439.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-732",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-732",
        "4-733",
        "4-734",
        "4-735",
        "Automatic Taping Tools",
        "Level 5",
        "angle head",
        "corner flusher",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "2.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Size: 2.5\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-733",
      "parentSku": "LVL5-LEVEL-5-CORNER-FINISHER",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Corner Finisher - [4-733]",
      "description": "The Level 5 Tools Corner Finisher has a classic, high quality cast-aluminum design that evenly finishes both sides of inside corners in a single pass. The frames are cast and machined out of high-strength stainless steel and the high-carbon steel blades are designed to last longer and chip less than competitive blad...",
      "price": 449.0,
      "regularPrice": 449.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-733",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-732",
        "4-733",
        "4-734",
        "4-735",
        "Automatic Taping Tools",
        "Level 5",
        "angle head",
        "corner flusher",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Size: 3\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-734",
      "parentSku": "LVL5-LEVEL-5-CORNER-FINISHER",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Corner Finisher - [4-734]",
      "description": "The Level 5 Tools Corner Finisher has a classic, high quality cast-aluminum design that evenly finishes both sides of inside corners in a single pass. The frames are cast and machined out of high-strength stainless steel and the high-carbon steel blades are designed to last longer and chip less than competitive blad...",
      "price": 459.0,
      "regularPrice": 459.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-734",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-732",
        "4-733",
        "4-734",
        "4-735",
        "Automatic Taping Tools",
        "Level 5",
        "angle head",
        "corner flusher",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Size: 3.5\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-735",
      "parentSku": "LVL5-LEVEL-5-CORNER-FINISHER",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Corner Finisher - [4-735]",
      "description": "The Level 5 Tools Corner Finisher has a classic, high quality cast-aluminum design that evenly finishes both sides of inside corners in a single pass. The frames are cast and machined out of high-strength stainless steel and the high-carbon steel blades are designed to last longer and chip less than competitive blad...",
      "price": 470.0,
      "regularPrice": 470.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-735",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-732",
        "4-733",
        "4-734",
        "4-735",
        "Automatic Taping Tools",
        "Level 5",
        "angle head",
        "corner flusher",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Size: 4\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-743",
      "parentSku": "LVL5-LEVEL-5-CORNER-FLUSHER",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Corner Flusher - [4-743]",
      "description": "A drywall corner flusher or \"glazer\" is a tool used to apply joint compound to the inside corners of drywall in order to create a smooth, seamless finish.",
      "price": 142.0,
      "regularPrice": 142.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-743",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "4-743",
        "4-744",
        "Level 5",
        "Semi Automatic Taping Tools",
        "corner flusher",
        "flusher",
        "flusher with wheels",
        "semi automatic",
        "standard flusher",
        "wiper"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Size: 3\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-744",
      "parentSku": "LVL5-LEVEL-5-CORNER-FLUSHER",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Corner Flusher - [4-744]",
      "description": "A drywall corner flusher or \"glazer\" is a tool used to apply joint compound to the inside corners of drywall in order to create a smooth, seamless finish.",
      "price": 147.0,
      "regularPrice": 147.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-744",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "4-743",
        "4-744",
        "Level 5",
        "Semi Automatic Taping Tools",
        "corner flusher",
        "flusher",
        "flusher with wheels",
        "semi automatic",
        "standard flusher",
        "wiper"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Size: 3.5\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-760",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Automatic Taper - [4-760]",
      "description": "The LEVEL5 Automatic Drywall Taper is used to simultaneously apply the optimal amount of joint compound and tape to wall and ceiling joints. This automatic taper is a true workhorse in the industry.",
      "price": 1594.0,
      "regularPrice": 1594.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-760",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-760",
        "Automatic Taping Tools",
        "Level 5",
        "auto taper",
        "bazooka",
        "level 5",
        "level5",
        "taper"
      ],
      "attributes": [],
      "optionGroup": "automatic_taper",
      "sizeLabel": "4-760",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-741",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Compound Tube - [4-741]",
      "description": "The drywall compound applicator tube is a versatile tool that can be used to draw finishing compound from a bucket and apply it to drywall using various finishing heads. It features a universal ball nozzle and comes with a BONUS flat box filler attachment. Simply draw your mixed finishing compound from a bucket and...",
      "price": 225.0,
      "regularPrice": 225.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-741",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "4-741",
        "Level 5",
        "Semi Automatic Taping Tools",
        "compound tube",
        "semi automatic",
        "syringe"
      ],
      "attributes": [],
      "optionGroup": "corner_applicator",
      "sizeLabel": "4-741",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-811",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 MiniShot Cleaning Accessory Nozzle Adapter 2 Pack - [4-811]",
      "description": "LEVEL5 Cleaning Nozzles not only offer a quick, precise and easy way to clean the interior of the compound tubes for the MiniShot and the Auto Taper, but deliver precise water flow and focused pressure to clean all moving parts on all your drywall finishing tools.",
      "price": 27.0,
      "regularPrice": 27.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-811",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-811",
        "Automatic Taping Tools",
        "Level 5",
        "accessory"
      ],
      "attributes": [],
      "optionGroup": "corner_applicator",
      "sizeLabel": "4-811",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-772",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 MiniShot with Handle Extension and Bonus Storage Case - [4-772]",
      "description": "The LEVEL5 MiniShot Gas-Assisted Compound Tube enables you to apply drywall finishing compound to walls and ceilings with unprecedented ease and precision.",
      "price": 1031.0,
      "regularPrice": 1031.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-772",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-772",
        "Automatic Taping Tools",
        "Level 5",
        "automatic compound tube",
        "compound tube",
        "dewalt taping tools",
        "minishot",
        "mud runner",
        "mud shot",
        "mudshot"
      ],
      "attributes": [],
      "optionGroup": "corner_applicator",
      "sizeLabel": "4-772",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-771",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Compound Pump with Filler and Wrench with Bonus Storage Case - [4-771]",
      "description": "Drywall finishers worldwide rely on LEVEL5’s Drywall Compound Pump to be the backbone of their automatic taping tool arsenal. Lab tested to more than 250,000 cycles without needing replacement parts or repair and anodized for extreme durability and easy cleaning, you can depend on our pump to keep your tools primed...",
      "price": 500.0,
      "regularPrice": 500.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-771",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-771",
        "Automatic Taping Tools",
        "Level 5",
        "compound pump",
        "level 5",
        "level5",
        "loading pump",
        "mud pump"
      ],
      "attributes": [],
      "optionGroup": "filler_adapter",
      "sizeLabel": "4-771",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-715",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Filler - [4-715]",
      "description": "The Level 5 Tools Filler is made of high-strength cast aluminum and an extruded stainless steel filler nozzle. The filler is designed for quick changes with the gooseneck when required.",
      "price": 75.0,
      "regularPrice": 75.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-715",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-715",
        "Automatic Taping Tools",
        "Level 5",
        "box filler",
        "filler"
      ],
      "attributes": [],
      "optionGroup": "filler_adapter",
      "sizeLabel": "4-715",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-714",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Gooseneck - [4-714]",
      "description": "The Level 5 Tools Gooseneck is used to fill the automatic taper and is extruded from high quality stainless steel. The mounting bracket featured on the Level 5 Tools Gooseneck is designed for quick changes between it and the filler attachment.",
      "price": 112.0,
      "regularPrice": 112.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-714",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-714",
        "Automatic Taping Tools",
        "Level 5",
        "goose neck",
        "gooseneck"
      ],
      "attributes": [],
      "optionGroup": "filler_adapter",
      "sizeLabel": "4-714",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-764",
      "parentSku": "LVL5-LEVEL-5-FLAT-BOX",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Flat Box with Bonus Storage Case - [4-764]",
      "description": "A flat box is used in conjunction with a flat box handle to efficiently apply a crowned, feathered coat of joint compound over taped flat seams on walls and ceilings.",
      "price": 419.0,
      "regularPrice": 419.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-764",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-764",
        "4-765",
        "4-766",
        "4-770",
        "Automatic Taping Tools",
        "Level 5",
        "flat box",
        "flatbox",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 7\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-765",
      "parentSku": "LVL5-LEVEL-5-FLAT-BOX",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Flat Box with Bonus Storage Case - [4-765]",
      "description": "A flat box is used in conjunction with a flat box handle to efficiently apply a crowned, feathered coat of joint compound over taped flat seams on walls and ceilings.",
      "price": 429.0,
      "regularPrice": 429.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-765",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-764",
        "4-765",
        "4-766",
        "4-770",
        "Automatic Taping Tools",
        "Level 5",
        "flat box",
        "flatbox",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 10\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-766",
      "parentSku": "LVL5-LEVEL-5-FLAT-BOX",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Flat Box with Bonus Storage Case - [4-766]",
      "description": "A flat box is used in conjunction with a flat box handle to efficiently apply a crowned, feathered coat of joint compound over taped flat seams on walls and ceilings.",
      "price": 440.0,
      "regularPrice": 440.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-766",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-764",
        "4-765",
        "4-766",
        "4-770",
        "Automatic Taping Tools",
        "Level 5",
        "flat box",
        "flatbox",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 12\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-770",
      "parentSku": "LVL5-LEVEL-5-FLAT-BOX",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Flat Box with Bonus Storage Case - [4-770]",
      "description": "A flat box is used in conjunction with a flat box handle to efficiently apply a crowned, feathered coat of joint compound over taped flat seams on walls and ceilings.",
      "price": 456.0,
      "regularPrice": 456.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-770",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-764",
        "4-765",
        "4-766",
        "4-770",
        "Automatic Taping Tools",
        "Level 5",
        "flat box",
        "flatbox",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 14\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-767",
      "parentSku": "LVL5-LEVEL-5-MEGA-FLAT-BOX",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 MEGA Flat Box - [4-767]",
      "description": "A flat box is used in conjunction with a flat box handle to efficiently apply a crowned, feathered coat of joint compound over taped flat seams on walls and ceilings.",
      "price": 440.0,
      "regularPrice": 440.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-767",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-767",
        "4-768",
        "4-769",
        "Automatic Taping Tools",
        "Level 5",
        "flat box",
        "flatbox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 7\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-768",
      "parentSku": "LVL5-LEVEL-5-MEGA-FLAT-BOX",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 MEGA Flat Box - [4-768]",
      "description": "A flat box is used in conjunction with a flat box handle to efficiently apply a crowned, feathered coat of joint compound over taped flat seams on walls and ceilings.",
      "price": 450.0,
      "regularPrice": 450.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-768",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-767",
        "4-768",
        "4-769",
        "Automatic Taping Tools",
        "Level 5",
        "flat box",
        "flatbox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 10\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-769",
      "parentSku": "LVL5-LEVEL-5-MEGA-FLAT-BOX",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 MEGA Flat Box - [4-769]",
      "description": "A flat box is used in conjunction with a flat box handle to efficiently apply a crowned, feathered coat of joint compound over taped flat seams on walls and ceilings.",
      "price": 466.0,
      "regularPrice": 466.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-769",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-767",
        "4-768",
        "4-769",
        "Automatic Taping Tools",
        "Level 5",
        "flat box",
        "flatbox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 12\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-862",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 The Outsider Flat Box Corner Bead Finishing Kit - [4-862]",
      "description": "Install this ‘Outsider’ kit on a LEVEL5 drywall flat box to coat outside corner beads very quickly and with professional results. This kit saves hours of time over hand coating.",
      "price": 75.0,
      "regularPrice": 75.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-862",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-862",
        "Automatic Taping Tools",
        "Level 5",
        "accessory",
        "corner bead wheel",
        "cornerbead wheels",
        "out sider"
      ],
      "attributes": [],
      "optionGroup": "flat_box",
      "sizeLabel": "4-862",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-759",
      "parentSku": "LVL5-LEVEL-5-FLAT-BOX-EXTENSION-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Flat Box Extendable Handle - [4-759]",
      "description": "Lightweight aluminum build and easy slide adjustment lever provide unrivaled performance and convenience.",
      "price": 346.0,
      "regularPrice": 346.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-759",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-759",
        "4-780",
        "4-781",
        "4-782",
        "Automatic Taping Tools",
        "Level 5",
        "flat box handle",
        "flatbox handle",
        "level 5 handle",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "48\" - 78\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "Size: 48\" - 78\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-780",
      "parentSku": "LVL5-LEVEL-5-FLAT-BOX-EXTENSION-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Flat Box Extendable Handle - [4-780]",
      "description": "Lightweight aluminum build and easy slide adjustment lever provide unrivaled performance and convenience.",
      "price": 336.0,
      "regularPrice": 336.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-780",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-759",
        "4-780",
        "4-781",
        "4-782",
        "Automatic Taping Tools",
        "Level 5",
        "flat box handle",
        "flatbox handle",
        "level 5 handle",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "40\" - 62\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "Size: 40\" - 62\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-781",
      "parentSku": "LVL5-LEVEL-5-FLAT-BOX-EXTENSION-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Flat Box Extendable Handle - [4-781]",
      "description": "Lightweight aluminum build and easy slide adjustment lever provide unrivaled performance and convenience.",
      "price": 325.0,
      "regularPrice": 325.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-781",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-759",
        "4-780",
        "4-781",
        "4-782",
        "Automatic Taping Tools",
        "Level 5",
        "flat box handle",
        "flatbox handle",
        "level 5 handle",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "30\" - 42\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "Size: 30\" - 42\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-782",
      "parentSku": "LVL5-LEVEL-5-FLAT-BOX-EXTENSION-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Flat Box Extendable Handle - [4-782]",
      "description": "Lightweight aluminum build and easy slide adjustment lever provide unrivaled performance and convenience.",
      "price": 305.0,
      "regularPrice": 305.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-782",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-759",
        "4-780",
        "4-781",
        "4-782",
        "Automatic Taping Tools",
        "Level 5",
        "flat box handle",
        "flatbox handle",
        "level 5 handle",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "23\" - 32\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "Size: 23\" - 32\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-711",
      "parentSku": "LVL5-LEVEL-5-FLAT-BOX-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Flat Box Handle (Fixed Length) - [4-711]",
      "description": "The Level 5 Tools Flat Box Handles are designed with a sturdy wrap-around brake that is designed for unlimited positions during use and long wear life.",
      "price": 194.0,
      "regularPrice": 194.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-711",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-711",
        "4-712",
        "Automatic Taping Tools",
        "Level 5",
        "box handle",
        "fixed handle",
        "flat box handle",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "34\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "Size: 34\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-712",
      "parentSku": "LVL5-LEVEL-5-FLAT-BOX-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Flat Box Handle (Fixed Length) - [4-712]",
      "description": "The Level 5 Tools Flat Box Handles are designed with a sturdy wrap-around brake that is designed for unlimited positions during use and long wear life.",
      "price": 203.0,
      "regularPrice": 203.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-712",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-711",
        "4-712",
        "Automatic Taping Tools",
        "Level 5",
        "box handle",
        "fixed handle",
        "flat box handle",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "42\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "Size: 42\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-740",
      "parentSku": "LVL5-LEVEL-5-FLAT-BOX-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Flat Box Handle (Fixed Length) - [4-740]",
      "description": "The Level 5 Tools Flat Box Handles are designed with a sturdy wrap-around brake that is designed for unlimited positions during use and long wear life.",
      "price": 224.0,
      "regularPrice": 224.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-740",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-711",
        "4-712",
        "Automatic Taping Tools",
        "Level 5",
        "box handle",
        "fixed handle",
        "flat box handle",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "54\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "Size: 54\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-605",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 L5T Flat Box Combo with Extension Handle and Bonus Tool Cases 4-605 - [4-605]",
      "description": "This LEVEL5 drywall flat box set includes everything you need to finish and feather flat joints to perfection. Whether you're new to automatic finishing tools or expanding your arsenal, these premium-grade drywall taping tools are what you need to make your finishing work more productive and profitable.",
      "price": 1603.0,
      "regularPrice": 1603.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-605",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-605",
        "Automatic Taping Tools",
        "Bonus",
        "Level 5",
        "level 5 set",
        "level5",
        "set",
        "taping tools"
      ],
      "attributes": [],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "4-605",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-180",
      "parentSku": "LVL5-LEVEL-5-BLUE-STEEL-BIG-BACK-TAPING-KNIFE-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Blue Steel Big Back Taping Knife - Soft Grip Handle - [5-180]",
      "description": "Use these LEVEL5 \"Big Back\" drywall taping knives for mudding over nail and screw indents, filling flats, patching holes, applying drywall corner bead or top coating seams for a professional finish. Featuring a LEVEL5 Soft-Grip Handle, this mud knife offers ergonomic handling, slip-resistance and all-day comfort. \"B...",
      "price": 17.0,
      "regularPrice": 17.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "5-180",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-180",
        "5-182",
        "5-184",
        "5-186",
        "5-188",
        "CLEARANCE",
        "Level 5",
        "Taping & Finishing Tools",
        "blue steel",
        "level 5",
        "level5",
        "soft grip",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 8\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-182",
      "parentSku": "LVL5-LEVEL-5-BLUE-STEEL-BIG-BACK-TAPING-KNIFE-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Blue Steel Big Back Taping Knife - Soft Grip Handle - [5-182]",
      "description": "Use these LEVEL5 \"Big Back\" drywall taping knives for mudding over nail and screw indents, filling flats, patching holes, applying drywall corner bead or top coating seams for a professional finish. Featuring a LEVEL5 Soft-Grip Handle, this mud knife offers ergonomic handling, slip-resistance and all-day comfort. \"B...",
      "price": 18.0,
      "regularPrice": 18.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-182",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-180",
        "5-182",
        "5-184",
        "5-186",
        "5-188",
        "CLEARANCE",
        "Level 5",
        "Taping & Finishing Tools",
        "blue steel",
        "level 5",
        "level5",
        "soft grip",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 10\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-184",
      "parentSku": "LVL5-LEVEL-5-BLUE-STEEL-BIG-BACK-TAPING-KNIFE-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Blue Steel Big Back Taping Knife - Soft Grip Handle - [5-184]",
      "description": "Use these LEVEL5 \"Big Back\" drywall taping knives for mudding over nail and screw indents, filling flats, patching holes, applying drywall corner bead or top coating seams for a professional finish. Featuring a LEVEL5 Soft-Grip Handle, this mud knife offers ergonomic handling, slip-resistance and all-day comfort. \"B...",
      "price": 19.0,
      "regularPrice": 19.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-184",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-180",
        "5-182",
        "5-184",
        "5-186",
        "5-188",
        "CLEARANCE",
        "Level 5",
        "Taping & Finishing Tools",
        "blue steel",
        "level 5",
        "level5",
        "soft grip",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-186",
      "parentSku": "LVL5-LEVEL-5-BLUE-STEEL-BIG-BACK-TAPING-KNIFE-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Blue Steel Big Back Taping Knife - Soft Grip Handle - [5-186]",
      "description": "Use these LEVEL5 \"Big Back\" drywall taping knives for mudding over nail and screw indents, filling flats, patching holes, applying drywall corner bead or top coating seams for a professional finish. Featuring a LEVEL5 Soft-Grip Handle, this mud knife offers ergonomic handling, slip-resistance and all-day comfort. \"B...",
      "price": 20.0,
      "regularPrice": 20.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-186",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-180",
        "5-182",
        "5-184",
        "5-186",
        "5-188",
        "CLEARANCE",
        "Level 5",
        "Taping & Finishing Tools",
        "blue steel",
        "level 5",
        "level5",
        "soft grip",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-188",
      "parentSku": "LVL5-LEVEL-5-BLUE-STEEL-BIG-BACK-TAPING-KNIFE-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Blue Steel Big Back Taping Knife - Soft Grip Handle - [5-188]",
      "description": "Use these LEVEL5 \"Big Back\" drywall taping knives for mudding over nail and screw indents, filling flats, patching holes, applying drywall corner bead or top coating seams for a professional finish. Featuring a LEVEL5 Soft-Grip Handle, this mud knife offers ergonomic handling, slip-resistance and all-day comfort. \"B...",
      "price": 22.0,
      "regularPrice": 22.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-188",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-180",
        "5-182",
        "5-184",
        "5-186",
        "5-188",
        "CLEARANCE",
        "Level 5",
        "Taping & Finishing Tools",
        "blue steel",
        "level 5",
        "level5",
        "soft grip",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "16\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 16\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-122",
      "parentSku": "LVL5-LEVEL-5-BLUE-STEEL-TAPING-KNIFE-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Blue Steel Taping Knife - Soft Grip Handle - [5-122]",
      "description": "Use these LEVEL5 drywall taping knife for mudding over nail and screw indents, filling flats, patching holes, applying drywall corner bead or top coating seams for a professional finish. Its wide blade surface and precision flex feathers joint compound to perfection.",
      "price": 16.0,
      "regularPrice": 16.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-122",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-122",
        "5-124",
        "5-126",
        "5-127",
        "5-128",
        "Level 5",
        "Taping & Finishing Tools",
        "blue steel",
        "level 5",
        "level5",
        "soft grip",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "6\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 6\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-124",
      "parentSku": "LVL5-LEVEL-5-BLUE-STEEL-TAPING-KNIFE-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Blue Steel Taping Knife - Soft Grip Handle - [5-124]",
      "description": "Use these LEVEL5 drywall taping knife for mudding over nail and screw indents, filling flats, patching holes, applying drywall corner bead or top coating seams for a professional finish. Its wide blade surface and precision flex feathers joint compound to perfection.",
      "price": 17.0,
      "regularPrice": 17.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-124",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-122",
        "5-124",
        "5-126",
        "5-127",
        "5-128",
        "Level 5",
        "Taping & Finishing Tools",
        "blue steel",
        "level 5",
        "level5",
        "soft grip",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 8\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-126",
      "parentSku": "LVL5-LEVEL-5-BLUE-STEEL-TAPING-KNIFE-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Blue Steel Taping Knife - Soft Grip Handle - [5-126]",
      "description": "Use these LEVEL5 drywall taping knife for mudding over nail and screw indents, filling flats, patching holes, applying drywall corner bead or top coating seams for a professional finish. Its wide blade surface and precision flex feathers joint compound to perfection.",
      "price": 18.0,
      "regularPrice": 18.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-126",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-122",
        "5-124",
        "5-126",
        "5-127",
        "5-128",
        "Level 5",
        "Taping & Finishing Tools",
        "blue steel",
        "level 5",
        "level5",
        "soft grip",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 10\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-127",
      "parentSku": "LVL5-LEVEL-5-BLUE-STEEL-TAPING-KNIFE-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Blue Steel Taping Knife - Soft Grip Handle - [5-127]",
      "description": "Use these LEVEL5 drywall taping knife for mudding over nail and screw indents, filling flats, patching holes, applying drywall corner bead or top coating seams for a professional finish. Its wide blade surface and precision flex feathers joint compound to perfection.",
      "price": 19.0,
      "regularPrice": 19.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-127",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-122",
        "5-124",
        "5-126",
        "5-127",
        "5-128",
        "Level 5",
        "Taping & Finishing Tools",
        "blue steel",
        "level 5",
        "level5",
        "soft grip",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-128",
      "parentSku": "LVL5-LEVEL-5-BLUE-STEEL-TAPING-KNIFE-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Blue Steel Taping Knife - Soft Grip Handle - [5-128]",
      "description": "Use these LEVEL5 drywall taping knife for mudding over nail and screw indents, filling flats, patching holes, applying drywall corner bead or top coating seams for a professional finish. Its wide blade surface and precision flex feathers joint compound to perfection.",
      "price": 20.0,
      "regularPrice": 20.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-128",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-122",
        "5-124",
        "5-126",
        "5-127",
        "5-128",
        "Level 5",
        "Taping & Finishing Tools",
        "blue steel",
        "level 5",
        "level5",
        "soft grip",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-149",
      "parentSku": "LVL5-LEVEL-5-CARBON-STEEL-FINISHING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Carbon Steel Finishing Knife with Soft Grip Handle - [5-149]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 13.0,
      "regularPrice": 13.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-149",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-149",
        "5-150",
        "5-151",
        "5-152",
        "5-154",
        "5-156",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 3\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-150",
      "parentSku": "LVL5-LEVEL-5-CARBON-STEEL-FINISHING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Carbon Steel Finishing Knife with Soft Grip Handle - [5-150]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 15.0,
      "regularPrice": 15.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-150",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-149",
        "5-150",
        "5-151",
        "5-152",
        "5-154",
        "5-156",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-151",
      "parentSku": "LVL5-LEVEL-5-CARBON-STEEL-FINISHING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Carbon Steel Finishing Knife with Soft Grip Handle - [5-151]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 16.0,
      "regularPrice": 16.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-151",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-149",
        "5-150",
        "5-151",
        "5-152",
        "5-154",
        "5-156",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 5\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-152",
      "parentSku": "LVL5-LEVEL-5-CARBON-STEEL-FINISHING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Carbon Steel Finishing Knife with Soft Grip Handle - [5-152]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 17.0,
      "regularPrice": 17.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "5-152",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-149",
        "5-150",
        "5-151",
        "5-152",
        "5-154",
        "5-156",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "6\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 6\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-154",
      "parentSku": "LVL5-LEVEL-5-CARBON-STEEL-FINISHING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Carbon Steel Finishing Knife with Soft Grip Handle - [5-154]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 18.0,
      "regularPrice": 18.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-154",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-149",
        "5-150",
        "5-151",
        "5-152",
        "5-154",
        "5-156",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 8\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-156",
      "parentSku": "LVL5-LEVEL-5-CARBON-STEEL-FINISHING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Carbon Steel Finishing Knife with Soft Grip Handle - [5-156]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 19.0,
      "regularPrice": 19.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-156",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-149",
        "5-150",
        "5-151",
        "5-152",
        "5-154",
        "5-156",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 10\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-200",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Carbon Steel Specialized Putty Knife with Soft Grip Handle - [5-200]",
      "description": "Use the LEVEL5 9-in-1 Multi-tool as a compound scraper, screwdriver, roller cleaner, bottle opener and more. This is your \"go-to\" hand tool which features a polished carbon steel blade for superior durability.",
      "price": 15.0,
      "regularPrice": 15.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-200",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-200",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife",
        "level 5",
        "level5"
      ],
      "attributes": [],
      "optionGroup": "hand_tool",
      "sizeLabel": "5-200",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-201",
      "parentSku": "LVL5-LEVEL-5-CUSTOM-STAINLESS-STEEL-FINISHING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Custom Stainless Steel Finishing Knife with Soft Grip Handle - [5-201]",
      "description": "Level5 Pointed Joint Knives feature mirror-finished stainless steel for superior durability and reliability. Their unique 60-degree angled blade provides an even distribution of pressure for improved application rates & professionally-smooth finishes.",
      "price": 15.0,
      "regularPrice": 15.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-201",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-201",
        "5-202",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Option",
          "value": "6\" Clipped Knife 30 Degree Angle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Option: 6\" Clipped Knife 30 Degree Angle",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-202",
      "parentSku": "LVL5-LEVEL-5-CUSTOM-STAINLESS-STEEL-FINISHING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Custom Stainless Steel Finishing Knife with Soft Grip Handle - [5-202]",
      "description": "Level5 Pointed Joint Knives feature mirror-finished stainless steel for superior durability and reliability. Their unique 60-degree angled blade provides an even distribution of pressure for improved application rates & professionally-smooth finishes.",
      "price": 15.0,
      "regularPrice": 15.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-202",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-201",
        "5-202",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Option",
          "value": "3.5\" Pointed Knife",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Option: 3.5\" Pointed Knife",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-974",
      "parentSku": "LVL5-LEVEL-5-FLAT-FLEX-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Flat Flex Stainless Steel Finishing Trowel - [4-974]",
      "description": "LEVEL5 0.4mm Flex Finishing Trowels are an essential hand tool for the professional finisher. They offer a combination of features to provide a superior, smooth finish using drywall compound or plaster, while also providing comfort and ease of use.",
      "price": 70.0,
      "regularPrice": 70.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-974",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-974",
        "4-975",
        "4-976",
        "Level 5",
        "Taping & Finishing Tools",
        "flat trowel",
        "level 5 trowel",
        "level5",
        "stainless steel trowel",
        "trowel",
        "ultraflex trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.75\" x 12\" Leather Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.75\" x 12\" Leather Handle",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-975",
      "parentSku": "LVL5-LEVEL-5-FLAT-FLEX-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Flat Flex Stainless Steel Finishing Trowel - [4-975]",
      "description": "LEVEL5 0.4mm Flex Finishing Trowels are an essential hand tool for the professional finisher. They offer a combination of features to provide a superior, smooth finish using drywall compound or plaster, while also providing comfort and ease of use.",
      "price": 75.0,
      "regularPrice": 75.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-975",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-974",
        "4-975",
        "4-976",
        "Level 5",
        "Taping & Finishing Tools",
        "flat trowel",
        "level 5 trowel",
        "level5",
        "stainless steel trowel",
        "trowel",
        "ultraflex trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.75\" x 14\" Leather Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.75\" x 14\" Leather Handle",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-976",
      "parentSku": "LVL5-LEVEL-5-FLAT-FLEX-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Flat Flex Stainless Steel Finishing Trowel - [4-976]",
      "description": "LEVEL5 0.4mm Flex Finishing Trowels are an essential hand tool for the professional finisher. They offer a combination of features to provide a superior, smooth finish using drywall compound or plaster, while also providing comfort and ease of use.",
      "price": 88.0,
      "regularPrice": 88.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-976",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-974",
        "4-975",
        "4-976",
        "Level 5",
        "Taping & Finishing Tools",
        "flat trowel",
        "level 5 trowel",
        "level5",
        "stainless steel trowel",
        "trowel",
        "ultraflex trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.75\" x 16\" Leather Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.75\" x 16\" Leather Handle",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-401",
      "parentSku": "LVL5-LEVEL-5-ONE-PIECE-STAINLESS-STEEL-PUTTY-KNIVES-WITH-WELDED-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 One Piece Stainless Steel Putty Knives with Welded Handle - [5-401]",
      "description": "These knives are lightweight, extremely comfortable in the hand, and clean up like a dream.",
      "price": 17.0,
      "regularPrice": 17.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-401",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-401",
        "5-402",
        "5-403",
        "5-404",
        "5-405",
        "5-406",
        "5-408",
        "5-410",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "1.5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 1.5\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-402",
      "parentSku": "LVL5-LEVEL-5-ONE-PIECE-STAINLESS-STEEL-PUTTY-KNIVES-WITH-WELDED-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 One Piece Stainless Steel Putty Knives with Welded Handle - [5-402]",
      "description": "These knives are lightweight, extremely comfortable in the hand, and clean up like a dream.",
      "price": 18.0,
      "regularPrice": 18.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-402",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-401",
        "5-402",
        "5-403",
        "5-404",
        "5-405",
        "5-406",
        "5-408",
        "5-410",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "2\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 2\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-403",
      "parentSku": "LVL5-LEVEL-5-ONE-PIECE-STAINLESS-STEEL-PUTTY-KNIVES-WITH-WELDED-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 One Piece Stainless Steel Putty Knives with Welded Handle - [5-403]",
      "description": "These knives are lightweight, extremely comfortable in the hand, and clean up like a dream.",
      "price": 19.0,
      "regularPrice": 19.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-403",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-401",
        "5-402",
        "5-403",
        "5-404",
        "5-405",
        "5-406",
        "5-408",
        "5-410",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 3\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-404",
      "parentSku": "LVL5-LEVEL-5-ONE-PIECE-STAINLESS-STEEL-PUTTY-KNIVES-WITH-WELDED-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 One Piece Stainless Steel Putty Knives with Welded Handle - [5-404]",
      "description": "These knives are lightweight, extremely comfortable in the hand, and clean up like a dream.",
      "price": 20.0,
      "regularPrice": 20.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-404",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-401",
        "5-402",
        "5-403",
        "5-404",
        "5-405",
        "5-406",
        "5-408",
        "5-410",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-405",
      "parentSku": "LVL5-LEVEL-5-ONE-PIECE-STAINLESS-STEEL-PUTTY-KNIVES-WITH-WELDED-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 One Piece Stainless Steel Putty Knives with Welded Handle - [5-405]",
      "description": "These knives are lightweight, extremely comfortable in the hand, and clean up like a dream.",
      "price": 21.0,
      "regularPrice": 21.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-405",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-401",
        "5-402",
        "5-403",
        "5-404",
        "5-405",
        "5-406",
        "5-408",
        "5-410",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 5\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-406",
      "parentSku": "LVL5-LEVEL-5-ONE-PIECE-STAINLESS-STEEL-PUTTY-KNIVES-WITH-WELDED-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 One Piece Stainless Steel Putty Knives with Welded Handle - [5-406]",
      "description": "These knives are lightweight, extremely comfortable in the hand, and clean up like a dream.",
      "price": 22.0,
      "regularPrice": 22.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-406",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-401",
        "5-402",
        "5-403",
        "5-404",
        "5-405",
        "5-406",
        "5-408",
        "5-410",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "6\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 6\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-408",
      "parentSku": "LVL5-LEVEL-5-ONE-PIECE-STAINLESS-STEEL-PUTTY-KNIVES-WITH-WELDED-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 One Piece Stainless Steel Putty Knives with Welded Handle - [5-408]",
      "description": "These knives are lightweight, extremely comfortable in the hand, and clean up like a dream.",
      "price": 23.0,
      "regularPrice": 23.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-408",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-401",
        "5-402",
        "5-403",
        "5-404",
        "5-405",
        "5-406",
        "5-408",
        "5-410",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 8\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-410",
      "parentSku": "LVL5-LEVEL-5-ONE-PIECE-STAINLESS-STEEL-PUTTY-KNIVES-WITH-WELDED-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 One Piece Stainless Steel Putty Knives with Welded Handle - [5-410]",
      "description": "These knives are lightweight, extremely comfortable in the hand, and clean up like a dream.",
      "price": 24.0,
      "regularPrice": 24.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-410",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-401",
        "5-402",
        "5-403",
        "5-404",
        "5-405",
        "5-406",
        "5-408",
        "5-410",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 10\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-988",
      "parentSku": "LVL5-LEVEL-5-PRO-FLEX-CURVED-BLADE-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Pro Flex Curved Blade Stainless Steel Finishing Trowel - [4-988]",
      "description": "LEVEL5 offers a full line of finishing trowels that are manufactured under a proprietary innovative design and strict quality manufacturing requirements in Europe. These hand trowels offer the finisher some outstanding features, including:",
      "price": 54.0,
      "regularPrice": 54.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-988",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-988",
        "4-989",
        "Level 5",
        "Taping & Finishing Tools",
        "curved trowel",
        "level 5 trowel",
        "level5",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.75\" x 12\" Leather Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.75\" x 12\" Leather Handle",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-989",
      "parentSku": "LVL5-LEVEL-5-PRO-FLEX-CURVED-BLADE-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Pro Flex Curved Blade Stainless Steel Finishing Trowel - [4-989]",
      "description": "LEVEL5 offers a full line of finishing trowels that are manufactured under a proprietary innovative design and strict quality manufacturing requirements in Europe. These hand trowels offer the finisher some outstanding features, including:",
      "price": 58.0,
      "regularPrice": 58.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-989",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-988",
        "4-989",
        "Level 5",
        "Taping & Finishing Tools",
        "curved trowel",
        "level 5 trowel",
        "level5",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.75\" x 14\" Leather Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.75\" x 14\" Leather Handle",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-325",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Professional Aluminum Hawk - [5-325]",
      "description": "The patent-pending LEVEL5 Drywall Finishing Hawk features a hard coat, non-stick finish that is easy to clean, wear and corrosion resistant. Your trowel/knife will glide across the surface making it the smoothest hawk you’ve ever used. Made of solid extruded aluminum this hawk will hold up under extreme conditions.",
      "price": 50.0,
      "regularPrice": 50.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-325",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-325",
        "Level 5",
        "Taping & Finishing Tools",
        "hawk"
      ],
      "attributes": [],
      "optionGroup": "hand_tool",
      "sizeLabel": "5-325",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-190",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-BIG-BACK-TAPING-KNIFE-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Big Back Taping Knife – Soft Grip Handle - [5-190]",
      "description": "LEVEL5 Stainless Steel Drywall Taping Knives feature a premium stainless steel blade that flexes accordingly for both a high-precision finish and quicker application rates. These are lightweight workhorse drywall knives which offer premium build quality, precision results and fast application rates. \"Big Back\" tapin...",
      "price": 20.0,
      "regularPrice": 20.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-190",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-190",
        "5-192",
        "5-194",
        "5-196",
        "5-198",
        "Level 5",
        "Taping & Finishing Tools",
        "Taping Knives",
        "big back taping knife",
        "big black taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 8\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-192",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-BIG-BACK-TAPING-KNIFE-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Big Back Taping Knife – Soft Grip Handle - [5-192]",
      "description": "LEVEL5 Stainless Steel Drywall Taping Knives feature a premium stainless steel blade that flexes accordingly for both a high-precision finish and quicker application rates. These are lightweight workhorse drywall knives which offer premium build quality, precision results and fast application rates. \"Big Back\" tapin...",
      "price": 22.0,
      "regularPrice": 22.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-192",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-190",
        "5-192",
        "5-194",
        "5-196",
        "5-198",
        "Level 5",
        "Taping & Finishing Tools",
        "Taping Knives",
        "big back taping knife",
        "big black taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 10\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-194",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-BIG-BACK-TAPING-KNIFE-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Big Back Taping Knife – Soft Grip Handle - [5-194]",
      "description": "LEVEL5 Stainless Steel Drywall Taping Knives feature a premium stainless steel blade that flexes accordingly for both a high-precision finish and quicker application rates. These are lightweight workhorse drywall knives which offer premium build quality, precision results and fast application rates. \"Big Back\" tapin...",
      "price": 23.0,
      "regularPrice": 23.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-194",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-190",
        "5-192",
        "5-194",
        "5-196",
        "5-198",
        "Level 5",
        "Taping & Finishing Tools",
        "Taping Knives",
        "big back taping knife",
        "big black taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-196",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-BIG-BACK-TAPING-KNIFE-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Big Back Taping Knife – Soft Grip Handle - [5-196]",
      "description": "LEVEL5 Stainless Steel Drywall Taping Knives feature a premium stainless steel blade that flexes accordingly for both a high-precision finish and quicker application rates. These are lightweight workhorse drywall knives which offer premium build quality, precision results and fast application rates. \"Big Back\" tapin...",
      "price": 24.0,
      "regularPrice": 24.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-196",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-190",
        "5-192",
        "5-194",
        "5-196",
        "5-198",
        "Level 5",
        "Taping & Finishing Tools",
        "Taping Knives",
        "big back taping knife",
        "big black taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-198",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-BIG-BACK-TAPING-KNIFE-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Big Back Taping Knife – Soft Grip Handle - [5-198]",
      "description": "LEVEL5 Stainless Steel Drywall Taping Knives feature a premium stainless steel blade that flexes accordingly for both a high-precision finish and quicker application rates. These are lightweight workhorse drywall knives which offer premium build quality, precision results and fast application rates. \"Big Back\" tapin...",
      "price": 25.0,
      "regularPrice": 25.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-198",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-190",
        "5-192",
        "5-194",
        "5-196",
        "5-198",
        "Level 5",
        "Taping & Finishing Tools",
        "Taping Knives",
        "big back taping knife",
        "big black taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "16\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 16\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-139",
      "parentSku": "LVL5-LEVEL-5-TOOLS-STAINLESS-STEEL-FINISHING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Finishing Knife with Soft Grip Handle - [5-139]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 15.0,
      "regularPrice": 15.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-139",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-139",
        "5-140",
        "5-141",
        "5-142",
        "5-144",
        "5-147",
        "5-148",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife",
        "joint knives",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 3\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-140",
      "parentSku": "LVL5-LEVEL-5-TOOLS-STAINLESS-STEEL-FINISHING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Finishing Knife with Soft Grip Handle - [5-140]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 16.0,
      "regularPrice": 16.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-140",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-139",
        "5-140",
        "5-141",
        "5-142",
        "5-144",
        "5-147",
        "5-148",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife",
        "joint knives",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-141",
      "parentSku": "LVL5-LEVEL-5-TOOLS-STAINLESS-STEEL-FINISHING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Finishing Knife with Soft Grip Handle - [5-141]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 17.0,
      "regularPrice": 17.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-141",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-139",
        "5-140",
        "5-141",
        "5-142",
        "5-144",
        "5-147",
        "5-148",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife",
        "joint knives",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 5\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-142",
      "parentSku": "LVL5-LEVEL-5-TOOLS-STAINLESS-STEEL-FINISHING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Finishing Knife with Soft Grip Handle - [5-142]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 18.0,
      "regularPrice": 18.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-142",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-139",
        "5-140",
        "5-141",
        "5-142",
        "5-144",
        "5-147",
        "5-148",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife",
        "joint knives",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "6\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 6\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-144",
      "parentSku": "LVL5-LEVEL-5-TOOLS-STAINLESS-STEEL-FINISHING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Finishing Knife with Soft Grip Handle - [5-144]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 19.0,
      "regularPrice": 19.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-144",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-139",
        "5-140",
        "5-141",
        "5-142",
        "5-144",
        "5-147",
        "5-148",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife",
        "joint knives",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 8\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-146",
      "parentSku": "LVL5-LEVEL-5-TOOLS-STAINLESS-STEEL-FINISHING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Finishing Knife with Soft Grip Handle - [5-146]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 20.0,
      "regularPrice": 20.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-146",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-139",
        "5-140",
        "5-141",
        "5-142",
        "5-144",
        "5-147",
        "5-148",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife",
        "joint knives",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 10\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-147",
      "parentSku": "LVL5-LEVEL-5-TOOLS-STAINLESS-STEEL-FINISHING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Finishing Knife with Soft Grip Handle - [5-147]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 12.0,
      "regularPrice": 12.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-147",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-139",
        "5-140",
        "5-141",
        "5-142",
        "5-144",
        "5-147",
        "5-148",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife",
        "joint knives",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "1\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 1\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-148",
      "parentSku": "LVL5-LEVEL-5-TOOLS-STAINLESS-STEEL-FINISHING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Finishing Knife with Soft Grip Handle - [5-148]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 13.0,
      "regularPrice": 13.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-148",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-139",
        "5-140",
        "5-141",
        "5-142",
        "5-144",
        "5-147",
        "5-148",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife",
        "joint knives",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "2\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 2\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-381",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-FLEX-OFFSET-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Flex Offset Knife with Soft Grip Handle - [5-381]",
      "description": "Stainless Steel Flex Offset Knife with Soft Grip Handle",
      "price": 33.0,
      "regularPrice": 33.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-381",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-381",
        "5-383",
        "5-385",
        "5-387",
        "5-389",
        "5-391",
        "Flex Offset Knife",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 8\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-383",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-FLEX-OFFSET-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Flex Offset Knife with Soft Grip Handle - [5-383]",
      "description": "Stainless Steel Flex Offset Knife with Soft Grip Handle",
      "price": 35.0,
      "regularPrice": 35.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-383",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-381",
        "5-383",
        "5-385",
        "5-387",
        "5-389",
        "5-391",
        "Flex Offset Knife",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 10\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-385",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-FLEX-OFFSET-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Flex Offset Knife with Soft Grip Handle - [5-385]",
      "description": "Stainless Steel Flex Offset Knife with Soft Grip Handle",
      "price": 38.0,
      "regularPrice": 38.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-385",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-381",
        "5-383",
        "5-385",
        "5-387",
        "5-389",
        "5-391",
        "Flex Offset Knife",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-387",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-FLEX-OFFSET-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Flex Offset Knife with Soft Grip Handle - [5-387]",
      "description": "Stainless Steel Flex Offset Knife with Soft Grip Handle",
      "price": 40.0,
      "regularPrice": 40.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-387",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-381",
        "5-383",
        "5-385",
        "5-387",
        "5-389",
        "5-391",
        "Flex Offset Knife",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-389",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-FLEX-OFFSET-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Flex Offset Knife with Soft Grip Handle - [5-389]",
      "description": "Stainless Steel Flex Offset Knife with Soft Grip Handle",
      "price": 42.0,
      "regularPrice": 42.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-389",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-381",
        "5-383",
        "5-385",
        "5-387",
        "5-389",
        "5-391",
        "Flex Offset Knife",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "16\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 16\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-391",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-FLEX-OFFSET-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Flex Offset Knife with Soft Grip Handle - [5-391]",
      "description": "Stainless Steel Flex Offset Knife with Soft Grip Handle",
      "price": 44.0,
      "regularPrice": 44.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-391",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-381",
        "5-383",
        "5-385",
        "5-387",
        "5-389",
        "5-391",
        "Flex Offset Knife",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "18\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 18\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-504",
      "parentSku": "LVL5-LEVEL5-STAINLESS-STEEL-JOINT-KNIFE-WITH-COMPOSITE-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Joint Knife with Composite Handle - [5-504]",
      "description": "Precision-ground blade provides the proper flex point and feel for smooth finish",
      "price": 12.0,
      "regularPrice": 12.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-504",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-504",
        "5-505",
        "5-506",
        "Level 5",
        "Taping & Finishing Tools",
        "composite joint knife",
        "joint knife",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-505",
      "parentSku": "LVL5-LEVEL5-STAINLESS-STEEL-JOINT-KNIFE-WITH-COMPOSITE-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Joint Knife with Composite Handle - [5-505]",
      "description": "Precision-ground blade provides the proper flex point and feel for smooth finish",
      "price": 13.0,
      "regularPrice": 13.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-505",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-504",
        "5-505",
        "5-506",
        "Level 5",
        "Taping & Finishing Tools",
        "composite joint knife",
        "joint knife",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 5\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-506",
      "parentSku": "LVL5-LEVEL5-STAINLESS-STEEL-JOINT-KNIFE-WITH-COMPOSITE-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Joint Knife with Composite Handle - [5-506]",
      "description": "Precision-ground blade provides the proper flex point and feel for smooth finish",
      "price": 15.0,
      "regularPrice": 15.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-506",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-504",
        "5-505",
        "5-506",
        "Level 5",
        "Taping & Finishing Tools",
        "composite joint knife",
        "joint knife",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "6\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 6\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-332",
      "parentSku": "LVL5-LEVEL-5-TOOLS-STAINLESS-STEEL-MUD-PAN",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Mud Pan - [5-332]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 24.0,
      "regularPrice": 24.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-332",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-332",
        "5-334",
        "5-336",
        "8-336",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "mud pan",
        "mudpan"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-336",
      "parentSku": "LVL5-LEVEL-5-TOOLS-STAINLESS-STEEL-MUD-PAN",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Mud Pan - [5-336]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 26.0,
      "regularPrice": 26.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-336",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-332",
        "5-334",
        "5-336",
        "8-336",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "mud pan",
        "mudpan"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "16\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 16\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "8-334",
      "parentSku": "LVL5-LEVEL-5-TOOLS-STAINLESS-STEEL-MUD-PAN",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Mud Pan - [8-334]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 25.0,
      "regularPrice": 25.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "8-334",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-332",
        "5-334",
        "5-336",
        "8-336",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "mud pan",
        "mudpan"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-380",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-STIFF-OFFSET-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Stiff Offset Knife with Soft Grip Handle - [5-380]",
      "description": "Stainless Steel Stiff Offset Knife with Soft Grip Handle",
      "price": 33.0,
      "regularPrice": 33.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-380",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-380",
        "5-382",
        "5-384",
        "5-386",
        "5-388",
        "5-390",
        "Level 5",
        "Stiff Offset Knife",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 8\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-382",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-STIFF-OFFSET-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Stiff Offset Knife with Soft Grip Handle - [5-382]",
      "description": "Stainless Steel Stiff Offset Knife with Soft Grip Handle",
      "price": 35.0,
      "regularPrice": 35.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-382",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-380",
        "5-382",
        "5-384",
        "5-386",
        "5-388",
        "5-390",
        "Level 5",
        "Stiff Offset Knife",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 10\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-384",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-STIFF-OFFSET-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Stiff Offset Knife with Soft Grip Handle - [5-384]",
      "description": "Stainless Steel Stiff Offset Knife with Soft Grip Handle",
      "price": 38.0,
      "regularPrice": 38.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-384",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-380",
        "5-382",
        "5-384",
        "5-386",
        "5-388",
        "5-390",
        "Level 5",
        "Stiff Offset Knife",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-386",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-STIFF-OFFSET-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Stiff Offset Knife with Soft Grip Handle - [5-386]",
      "description": "Stainless Steel Stiff Offset Knife with Soft Grip Handle",
      "price": 40.0,
      "regularPrice": 40.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-386",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-380",
        "5-382",
        "5-384",
        "5-386",
        "5-388",
        "5-390",
        "Level 5",
        "Stiff Offset Knife",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-388",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-STIFF-OFFSET-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Stiff Offset Knife with Soft Grip Handle - [5-388]",
      "description": "Stainless Steel Stiff Offset Knife with Soft Grip Handle",
      "price": 42.0,
      "regularPrice": 42.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-388",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-380",
        "5-382",
        "5-384",
        "5-386",
        "5-388",
        "5-390",
        "Level 5",
        "Stiff Offset Knife",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "16\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 16\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-390",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-STIFF-OFFSET-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Stiff Offset Knife with Soft Grip Handle - [5-390]",
      "description": "Stainless Steel Stiff Offset Knife with Soft Grip Handle",
      "price": 44.0,
      "regularPrice": 44.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-390",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-380",
        "5-382",
        "5-384",
        "5-386",
        "5-388",
        "5-390",
        "Level 5",
        "Stiff Offset Knife",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "18\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 18\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-512",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-TAPING-KNIFE-COMPOSITE-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Taping Knife - Composite Handle - [5-512]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 15.0,
      "regularPrice": 15.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-512",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-512",
        "5-514",
        "5-516",
        "5-518",
        "5-520",
        "CLEARANCE",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-514",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-TAPING-KNIFE-COMPOSITE-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Taping Knife - Composite Handle - [5-514]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 16.0,
      "regularPrice": 16.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-514",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-512",
        "5-514",
        "5-516",
        "5-518",
        "5-520",
        "CLEARANCE",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-516",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-TAPING-KNIFE-COMPOSITE-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Taping Knife - Composite Handle - [5-516]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 11.0,
      "regularPrice": 11.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-516",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-512",
        "5-514",
        "5-516",
        "5-518",
        "5-520",
        "CLEARANCE",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "6\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 6\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-518",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-TAPING-KNIFE-COMPOSITE-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Taping Knife - Composite Handle - [5-518]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 12.0,
      "regularPrice": 12.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-518",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-512",
        "5-514",
        "5-516",
        "5-518",
        "5-520",
        "CLEARANCE",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 8\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-520",
      "parentSku": "LVL5-LEVEL-5-STAINLESS-STEEL-TAPING-KNIFE-COMPOSITE-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Taping Knife - Composite Handle - [5-520]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 13.0,
      "regularPrice": 13.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-520",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-512",
        "5-514",
        "5-516",
        "5-518",
        "5-520",
        "CLEARANCE",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 10\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-134",
      "parentSku": "LVL5-LEVEL-5-TOOLS-STAINLESS-STEEL-TAPING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Taping Knife with Soft Grip Handle - [5-134]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 19.0,
      "regularPrice": 19.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-134",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-134",
        "5-136",
        "5-137",
        "5-138",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 8\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-136",
      "parentSku": "LVL5-LEVEL-5-TOOLS-STAINLESS-STEEL-TAPING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Taping Knife with Soft Grip Handle - [5-136]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 20.0,
      "regularPrice": 20.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-136",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-134",
        "5-136",
        "5-137",
        "5-138",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 10\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-137",
      "parentSku": "LVL5-LEVEL-5-TOOLS-STAINLESS-STEEL-TAPING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Taping Knife with Soft Grip Handle - [5-137]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 21.0,
      "regularPrice": 21.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-137",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-134",
        "5-136",
        "5-137",
        "5-138",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-138",
      "parentSku": "LVL5-LEVEL-5-TOOLS-STAINLESS-STEEL-TAPING-KNIFE-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Taping Knife with Soft Grip Handle - [5-138]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 22.0,
      "regularPrice": 22.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-138",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-134",
        "5-136",
        "5-137",
        "5-138",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "stainlessteel taping knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-971",
      "parentSku": "LVL5-LEVEL-5-TRIPLE-HARDENED-RIGID-CURVED-GOLDEN-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Triple Hardened Rigid Curved Golden Stainless Steel Finishing Trowel - [4-971]",
      "description": "Use this LEVEL5 Curved Drywall Trowel for smoothing and finishing drywall joint compound, plaster, EIFS, stucco, and more. Its brushed leather composite handle molds to the user's hand over time and its surface-welded rivets ensure it can stand up to the toughest of work environments.",
      "price": 58.0,
      "regularPrice": 58.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-971",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-971",
        "4-972",
        "4-973",
        "Level 5",
        "Taping & Finishing Tools",
        "curved trowel",
        "level 5 trowel",
        "level5",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.75\" x 12\" Leather Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.75\" x 12\" Leather Handle",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-972",
      "parentSku": "LVL5-LEVEL-5-TRIPLE-HARDENED-RIGID-CURVED-GOLDEN-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Triple Hardened Rigid Curved Golden Stainless Steel Finishing Trowel - [4-972]",
      "description": "Use this LEVEL5 Curved Drywall Trowel for smoothing and finishing drywall joint compound, plaster, EIFS, stucco, and more. Its brushed leather composite handle molds to the user's hand over time and its surface-welded rivets ensure it can stand up to the toughest of work environments.",
      "price": 63.0,
      "regularPrice": 63.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-972",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-971",
        "4-972",
        "4-973",
        "Level 5",
        "Taping & Finishing Tools",
        "curved trowel",
        "level 5 trowel",
        "level5",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.75\" x 14\" Leather Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.75\" x 14\" Leather Handle",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-973",
      "parentSku": "LVL5-LEVEL-5-TRIPLE-HARDENED-RIGID-CURVED-GOLDEN-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Triple Hardened Rigid Curved Golden Stainless Steel Finishing Trowel - [4-973]",
      "description": "Use this LEVEL5 Curved Drywall Trowel for smoothing and finishing drywall joint compound, plaster, EIFS, stucco, and more. Its brushed leather composite handle molds to the user's hand over time and its surface-welded rivets ensure it can stand up to the toughest of work environments.",
      "price": 67.0,
      "regularPrice": 67.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-973",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-971",
        "4-972",
        "4-973",
        "Level 5",
        "Taping & Finishing Tools",
        "curved trowel",
        "level 5 trowel",
        "level5",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.75\" x 16\" Leather Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.75\" x 16\" Leather Handle",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-960",
      "parentSku": "LVL5-LEVEL-5-TRIPLE-HARDENED-RIGID-FLAT-GOLDEN-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Triple Hardened Rigid Flat Golden Stainless Steel Finishing Trowel - [4-960]",
      "description": "LEVEL5 offers a full line of finishing trowels that are manufactured under a proprietary innovative design and strict quality manufacturing requirements in Europe. These hand trowels offer the finisher some outstanding features, including:",
      "price": 57.0,
      "regularPrice": 57.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-960",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-960",
        "4-961",
        "4-962",
        "4-963",
        "4-964",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5 trowel",
        "level5",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.75\" x 11.5\" Leather Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.75\" x 11.5\" Leather Handle",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-961",
      "parentSku": "LVL5-LEVEL-5-TRIPLE-HARDENED-RIGID-FLAT-GOLDEN-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Triple Hardened Rigid Flat Golden Stainless Steel Finishing Trowel - [4-961]",
      "description": "LEVEL5 offers a full line of finishing trowels that are manufactured under a proprietary innovative design and strict quality manufacturing requirements in Europe. These hand trowels offer the finisher some outstanding features, including:",
      "price": 58.0,
      "regularPrice": 58.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-961",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-960",
        "4-961",
        "4-962",
        "4-963",
        "4-964",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5 trowel",
        "level5",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.75\" x 12\" Leather Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.75\" x 12\" Leather Handle",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-962",
      "parentSku": "LVL5-LEVEL-5-TRIPLE-HARDENED-RIGID-FLAT-GOLDEN-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Triple Hardened Rigid Flat Golden Stainless Steel Finishing Trowel - [4-962]",
      "description": "LEVEL5 offers a full line of finishing trowels that are manufactured under a proprietary innovative design and strict quality manufacturing requirements in Europe. These hand trowels offer the finisher some outstanding features, including:",
      "price": 63.0,
      "regularPrice": 63.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-962",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-960",
        "4-961",
        "4-962",
        "4-963",
        "4-964",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5 trowel",
        "level5",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.75\" x 14\" Leather Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.75\" x 14\" Leather Handle",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-963",
      "parentSku": "LVL5-LEVEL-5-TRIPLE-HARDENED-RIGID-FLAT-GOLDEN-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Triple Hardened Rigid Flat Golden Stainless Steel Finishing Trowel - [4-963]",
      "description": "LEVEL5 offers a full line of finishing trowels that are manufactured under a proprietary innovative design and strict quality manufacturing requirements in Europe. These hand trowels offer the finisher some outstanding features, including:",
      "price": 67.0,
      "regularPrice": 67.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-963",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-960",
        "4-961",
        "4-962",
        "4-963",
        "4-964",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5 trowel",
        "level5",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.75\" x 16\" Leather Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.75\" x 16\" Leather Handle",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-964",
      "parentSku": "LVL5-LEVEL-5-TRIPLE-HARDENED-RIGID-FLAT-GOLDEN-STAINLESS-STEEL-FINISHING-TROWEL",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Triple Hardened Rigid Flat Golden Stainless Steel Finishing Trowel - [4-964]",
      "description": "LEVEL5 offers a full line of finishing trowels that are manufactured under a proprietary innovative design and strict quality manufacturing requirements in Europe. These hand trowels offer the finisher some outstanding features, including:",
      "price": 72.0,
      "regularPrice": 72.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-964",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-960",
        "4-961",
        "4-962",
        "4-963",
        "4-964",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5 trowel",
        "level5",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4.75\" x 18\" Leather Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4.75\" x 18\" Leather Handle",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-701",
      "parentSku": "LVL5-LEVEL-5-CORNER-APPLICATOR",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Corner Applicator - [4-701]",
      "description": "A Corner Applicator Box is used to apply a steady flow of joint compound over taped inside and outside corners.",
      "price": 315.0,
      "regularPrice": 315.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-701",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-701",
        "4-702",
        "Automatic Taping Tools",
        "Level 5",
        "corner box",
        "cornerbox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 7\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-702",
      "parentSku": "LVL5-LEVEL-5-CORNER-APPLICATOR",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Corner Applicator - [4-702]",
      "description": "A Corner Applicator Box is used to apply a steady flow of joint compound over taped inside and outside corners.",
      "price": 325.0,
      "regularPrice": 325.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-702",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-701",
        "4-702",
        "Automatic Taping Tools",
        "Level 5",
        "corner box",
        "cornerbox"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 8\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-002",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Corner Drywall Compound Roller Cover Replacement - [4-002]",
      "description": "A joint compound roller makes light work of getting large amounts of drywall compound onto walls and ceilings - ideal when you need to cover and smooth out large surface areas.",
      "price": 22.0,
      "regularPrice": 22.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-002",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-002",
        "Level 5",
        "Taping & Finishing Tools",
        "compound roller",
        "mud roller",
        "plastering roller"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "4-002",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-006",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Corner Drywall Compound Roller with Frame - [4-006]",
      "description": "A compound roller makes light work of getting large amounts of drywall bedding and finishing compounds onto walls and ceilings - ideal when you need to cover and smooth out large surface areas.",
      "price": 35.0,
      "regularPrice": 35.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-006",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-006",
        "Level 5",
        "Taping & Finishing Tools",
        "corner applicator",
        "mud applicator",
        "mud roller"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "4-006",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-707",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Corner Roller with Bonus Storage Case - [4-707]",
      "description": "LEVEL5’s high performance corner roller enables you to remove air pockets and/or excess compound from behind freshly applied drywall tape with lightning speed.",
      "price": 168.0,
      "regularPrice": 168.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-707",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-707",
        "Automatic Taping Tools",
        "Level 5",
        "corner roller",
        "level 5",
        "level5"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "4-707",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-901",
      "parentSku": "LVL5-MUD-ROLLER",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Drywall Compound Roller Replacement Cover - [4-901]",
      "description": "A joint compound roller makes light work of getting large amounts of drywall compound onto walls and ceilings - ideal when you need to cover and smooth out large surface areas. ‍ This Compound Roller Cover fits with the Level 5 Compound Roller Frame. These rollers are very durable and can be easily cleaned and reuse...",
      "price": 21.0,
      "regularPrice": 21.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-901",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-901",
        "4-902",
        "Level 5",
        "Taping & Finishing Tools",
        "mud roller",
        "plastering roller"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "9\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 9\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-902",
      "parentSku": "LVL5-MUD-ROLLER",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Drywall Compound Roller Replacement Cover - [4-902]",
      "description": "A joint compound roller makes light work of getting large amounts of drywall compound onto walls and ceilings - ideal when you need to cover and smooth out large surface areas. ‍ This Compound Roller Cover fits with the Level 5 Compound Roller Frame. These rollers are very durable and can be easily cleaned and reuse...",
      "price": 23.0,
      "regularPrice": 23.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-902",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-901",
        "4-902",
        "Level 5",
        "Taping & Finishing Tools",
        "mud roller",
        "plastering roller"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 12\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-905",
      "parentSku": "LVL5-LEVEL-5-DRYWALL-COMPOUND-ROLLER-WITH-FRAME",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Drywall Compound Roller with Frame - [4-905]",
      "description": "A compound roller makes light work of getting large amounts of drywall bedding and finishing compounds onto walls and ceilings - ideal when you need to cover and smooth out large surface areas.",
      "price": 37.0,
      "regularPrice": 37.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-905",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "12\"",
        "4-905",
        "4-906",
        "9\"",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "mud roller",
        "red handle"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "9\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 9\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-906",
      "parentSku": "LVL5-LEVEL-5-DRYWALL-COMPOUND-ROLLER-WITH-FRAME",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Drywall Compound Roller with Frame - [4-906]",
      "description": "A compound roller makes light work of getting large amounts of drywall bedding and finishing compounds onto walls and ceilings - ideal when you need to cover and smooth out large surface areas.",
      "price": 40.0,
      "regularPrice": 40.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-906",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "12\"",
        "4-905",
        "4-906",
        "9\"",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "mud roller",
        "red handle"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 12\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-362",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Duffel Tool Bag - 24\" - [5-362]",
      "description": "Protect Your Tools in the new Level 5 24\" Duffel Tool Bag.",
      "price": 134.0,
      "regularPrice": 134.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-362",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "5-362",
        "Level 5",
        "Semi Automatic Taping Tools",
        "tool bag"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "5-362",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-757",
      "parentSku": "LVL5-LEVEL-5-EXTENDABLE-ACCESSORY-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Extendable Accessory Handle - [4-757]",
      "description": "The Level 5 Tools Accessory Handles are the only handles on the market that are made of solid aluminum for jobsite durability. Unlike competitive handles that use fiberglass that is easily broken, the Level 5 handle is designed to last for years.",
      "price": 188.0,
      "regularPrice": 188.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "4-757",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-792",
        "4-793",
        "4-794",
        "4-795",
        "4-796",
        "4-798",
        "4-799",
        "4-880",
        "4-881",
        "Automatic Taping Tools",
        "Level 5",
        "No Head",
        "extendable handle",
        "extension pole",
        "handles",
        "level 5",
        "level 5 handle",
        "level5 handles"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "Nail Spotter Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        },
        {
          "name": "Size",
          "value": "52\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: Nail Spotter Handle / Size: 52\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-758",
      "parentSku": "LVL5-LEVEL-5-EXTENDABLE-ACCESSORY-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Extendable Accessory Handle - [4-758]",
      "description": "The Level 5 Tools Accessory Handles are the only handles on the market that are made of solid aluminum for jobsite durability. Unlike competitive handles that use fiberglass that is easily broken, the Level 5 handle is designed to last for years.",
      "price": 209.0,
      "regularPrice": 209.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-758",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-792",
        "4-793",
        "4-794",
        "4-795",
        "4-796",
        "4-798",
        "4-799",
        "4-880",
        "4-881",
        "Automatic Taping Tools",
        "Level 5",
        "No Head",
        "extendable handle",
        "extension pole",
        "handles",
        "level 5",
        "level 5 handle",
        "level5 handles"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "Nail Spotter Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        },
        {
          "name": "Size",
          "value": "72\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: Nail Spotter Handle / Size: 72\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-792",
      "parentSku": "LVL5-LEVEL-5-EXTENDABLE-ACCESSORY-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Extendable Accessory Handle - [4-792]",
      "description": "The Level 5 Tools Accessory Handles are the only handles on the market that are made of solid aluminum for jobsite durability. Unlike competitive handles that use fiberglass that is easily broken, the Level 5 handle is designed to last for years.",
      "price": 198.0,
      "regularPrice": 198.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-792",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-792",
        "4-793",
        "4-794",
        "4-795",
        "4-796",
        "4-798",
        "4-799",
        "4-880",
        "4-881",
        "Automatic Taping Tools",
        "Level 5",
        "No Head",
        "extendable handle",
        "extension pole",
        "handles",
        "level 5",
        "level 5 handle",
        "level5 handles"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "Corner Roller Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        },
        {
          "name": "Size",
          "value": "52\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: Corner Roller Handle / Size: 52\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-794",
      "parentSku": "LVL5-LEVEL-5-EXTENDABLE-ACCESSORY-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Extendable Accessory Handle - [4-794]",
      "description": "The Level 5 Tools Accessory Handles are the only handles on the market that are made of solid aluminum for jobsite durability. Unlike competitive handles that use fiberglass that is easily broken, the Level 5 handle is designed to last for years.",
      "price": 194.0,
      "regularPrice": 194.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-794",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-792",
        "4-793",
        "4-794",
        "4-795",
        "4-796",
        "4-798",
        "4-799",
        "4-880",
        "4-881",
        "Automatic Taping Tools",
        "Level 5",
        "No Head",
        "extendable handle",
        "extension pole",
        "handles",
        "level 5",
        "level 5 handle",
        "level5 handles"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "Corner Applicator Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        },
        {
          "name": "Size",
          "value": "52\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: Corner Applicator Handle / Size: 52\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-795",
      "parentSku": "LVL5-LEVEL-5-EXTENDABLE-ACCESSORY-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Extendable Accessory Handle - [4-795]",
      "description": "The Level 5 Tools Accessory Handles are the only handles on the market that are made of solid aluminum for jobsite durability. Unlike competitive handles that use fiberglass that is easily broken, the Level 5 handle is designed to last for years.",
      "price": 207.0,
      "regularPrice": 207.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-795",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-792",
        "4-793",
        "4-794",
        "4-795",
        "4-796",
        "4-798",
        "4-799",
        "4-880",
        "4-881",
        "Automatic Taping Tools",
        "Level 5",
        "No Head",
        "extendable handle",
        "extension pole",
        "handles",
        "level 5",
        "level 5 handle",
        "level5 handles"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "Corner Finisher Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        },
        {
          "name": "Size",
          "value": "52\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: Corner Finisher Handle / Size: 52\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-796",
      "parentSku": "LVL5-LEVEL-5-EXTENDABLE-ACCESSORY-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Extendable Accessory Handle - [4-796]",
      "description": "The Level 5 Tools Accessory Handles are the only handles on the market that are made of solid aluminum for jobsite durability. Unlike competitive handles that use fiberglass that is easily broken, the Level 5 handle is designed to last for years.",
      "price": 219.0,
      "regularPrice": 219.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-796",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-792",
        "4-793",
        "4-794",
        "4-795",
        "4-796",
        "4-798",
        "4-799",
        "4-880",
        "4-881",
        "Automatic Taping Tools",
        "Level 5",
        "No Head",
        "extendable handle",
        "extension pole",
        "handles",
        "level 5",
        "level 5 handle",
        "level5 handles"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "Corner Roller Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        },
        {
          "name": "Size",
          "value": "72\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: Corner Roller Handle / Size: 72\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-798",
      "parentSku": "LVL5-LEVEL-5-EXTENDABLE-ACCESSORY-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Extendable Accessory Handle - [4-798]",
      "description": "The Level 5 Tools Accessory Handles are the only handles on the market that are made of solid aluminum for jobsite durability. Unlike competitive handles that use fiberglass that is easily broken, the Level 5 handle is designed to last for years.",
      "price": 214.0,
      "regularPrice": 214.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-798",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-792",
        "4-793",
        "4-794",
        "4-795",
        "4-796",
        "4-798",
        "4-799",
        "4-880",
        "4-881",
        "Automatic Taping Tools",
        "Level 5",
        "No Head",
        "extendable handle",
        "extension pole",
        "handles",
        "level 5",
        "level 5 handle",
        "level5 handles"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "Corner Applicator Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        },
        {
          "name": "Size",
          "value": "72\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: Corner Applicator Handle / Size: 72\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-799",
      "parentSku": "LVL5-LEVEL-5-EXTENDABLE-ACCESSORY-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Extendable Accessory Handle - [4-799]",
      "description": "The Level 5 Tools Accessory Handles are the only handles on the market that are made of solid aluminum for jobsite durability. Unlike competitive handles that use fiberglass that is easily broken, the Level 5 handle is designed to last for years.",
      "price": 227.0,
      "regularPrice": 227.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-799",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-792",
        "4-793",
        "4-794",
        "4-795",
        "4-796",
        "4-798",
        "4-799",
        "4-880",
        "4-881",
        "Automatic Taping Tools",
        "Level 5",
        "No Head",
        "extendable handle",
        "extension pole",
        "handles",
        "level 5",
        "level 5 handle",
        "level5 handles"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "Corner Finisher Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        },
        {
          "name": "Size",
          "value": "72\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: Corner Finisher Handle / Size: 72\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-880",
      "parentSku": "LVL5-LEVEL-5-EXTENDABLE-ACCESSORY-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Extendable Accessory Handle - [4-880]",
      "description": "The Level 5 Tools Accessory Handles are the only handles on the market that are made of solid aluminum for jobsite durability. Unlike competitive handles that use fiberglass that is easily broken, the Level 5 handle is designed to last for years.",
      "price": 153.0,
      "regularPrice": 153.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-880",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-792",
        "4-793",
        "4-794",
        "4-795",
        "4-796",
        "4-798",
        "4-799",
        "4-880",
        "4-881",
        "Automatic Taping Tools",
        "Level 5",
        "No Head",
        "extendable handle",
        "extension pole",
        "handles",
        "level 5",
        "level 5 handle",
        "level5 handles"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "No Head",
          "visible": false,
          "usedForVariations": true,
          "global": true
        },
        {
          "name": "Size",
          "value": "52\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: No Head / Size: 52\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-881",
      "parentSku": "LVL5-LEVEL-5-EXTENDABLE-ACCESSORY-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Extendable Accessory Handle - [4-881]",
      "description": "The Level 5 Tools Accessory Handles are the only handles on the market that are made of solid aluminum for jobsite durability. Unlike competitive handles that use fiberglass that is easily broken, the Level 5 handle is designed to last for years.",
      "price": 173.0,
      "regularPrice": 173.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-881",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-792",
        "4-793",
        "4-794",
        "4-795",
        "4-796",
        "4-798",
        "4-799",
        "4-880",
        "4-881",
        "Automatic Taping Tools",
        "Level 5",
        "No Head",
        "extendable handle",
        "extension pole",
        "handles",
        "level 5",
        "level 5 handle",
        "level5 handles"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "No Head",
          "visible": false,
          "usedForVariations": true,
          "global": true
        },
        {
          "name": "Size",
          "value": "72\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: No Head / Size: 72\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-756",
      "parentSku": "LVL5-LEVEL-5-ACCESSORY-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Fixed Accessory Handle - [4-756]",
      "description": "The Level 5 Tools Accessory Handles are the only handles on the market that are made of solid aluminum for jobsite durability. Unlike competitive handles that use fiberglass that is easily broken, the Level 5 handle is designed to last for years.",
      "price": 97.0,
      "regularPrice": 97.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "4-756",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-756",
        "4-777",
        "4-778",
        "4-779",
        "Automatic Taping Tools",
        "Level 5",
        "fixed handle",
        "handles",
        "level 5",
        "level 5 handle",
        "level5 handles"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "Nail Spotter Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: Nail Spotter Handle",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-777",
      "parentSku": "LVL5-LEVEL-5-ACCESSORY-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Fixed Accessory Handle - [4-777]",
      "description": "The Level 5 Tools Accessory Handles are the only handles on the market that are made of solid aluminum for jobsite durability. Unlike competitive handles that use fiberglass that is easily broken, the Level 5 handle is designed to last for years.",
      "price": 102.0,
      "regularPrice": 102.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-777",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-756",
        "4-777",
        "4-778",
        "4-779",
        "Automatic Taping Tools",
        "Level 5",
        "fixed handle",
        "handles",
        "level 5",
        "level 5 handle",
        "level5 handles"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "Corner Roller Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: Corner Roller Handle",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-778",
      "parentSku": "LVL5-LEVEL-5-ACCESSORY-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Fixed Accessory Handle - [4-778]",
      "description": "The Level 5 Tools Accessory Handles are the only handles on the market that are made of solid aluminum for jobsite durability. Unlike competitive handles that use fiberglass that is easily broken, the Level 5 handle is designed to last for years.",
      "price": 102.0,
      "regularPrice": 102.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-778",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-756",
        "4-777",
        "4-778",
        "4-779",
        "Automatic Taping Tools",
        "Level 5",
        "fixed handle",
        "handles",
        "level 5",
        "level 5 handle",
        "level5 handles"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "Corner Applicator Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: Corner Applicator Handle",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-779",
      "parentSku": "LVL5-LEVEL-5-ACCESSORY-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Fixed Accessory Handle - [4-779]",
      "description": "The Level 5 Tools Accessory Handles are the only handles on the market that are made of solid aluminum for jobsite durability. Unlike competitive handles that use fiberglass that is easily broken, the Level 5 handle is designed to last for years.",
      "price": 102.0,
      "regularPrice": 102.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-779",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-756",
        "4-777",
        "4-778",
        "4-779",
        "Automatic Taping Tools",
        "Level 5",
        "fixed handle",
        "handles",
        "level 5",
        "level 5 handle",
        "level5 handles"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "Corner Finisher Handle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: Corner Finisher Handle",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-360",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Flat Tool Bag - 20\" - [5-360]",
      "description": "Protect Your Tools in the new Level 5 20\" Flat Tool Bag.",
      "price": 125.0,
      "regularPrice": 125.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-360",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-360",
        "Level 5",
        "Taping & Finishing Tools",
        "tool bag"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "5-360",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-411",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Heat-Shrink Handle Grips for Welded Joint Knives - [5-411]",
      "description": "Use a heat gun to install LEVEL5 Heat-Shrink Handle Grips install in less than 30 seconds. Increase the grip-ability and comfort of your LEVEL5 Welded Joint Knives.",
      "price": 8.0,
      "regularPrice": 8.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-411",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-411",
        "Level 5",
        "Taping & Finishing Tools",
        "handle grip",
        "joint knife",
        "taping knife grip"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "5-411",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-604",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 L5T Flat Box Combo with Bonus Tool Cases 4-604 - [4-604]",
      "description": "This LEVEL5 drywall flat box set includes everything you need to finish and feather flat joints to perfection. Whether you're new to automatic finishing tools or expanding your arsenal, these premium-grade drywall taping tools are what you need to make your finishing work more productive and profitable.",
      "price": 1478.0,
      "regularPrice": 1478.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-604",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-604",
        "Automatic Taping Tools",
        "Bonus",
        "Level 5",
        "level 5 set",
        "level5",
        "set",
        "taping tools"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "4-604",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-754",
      "parentSku": "LVL5-LEVEL-5-NAIL-SPOTTER",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Nail Spotter (2nd Gen) with Bonus Storage Case - [4-754]",
      "description": "LEVEL5 nail spotters are used to quickly fill and finish fastener indentations during the drywall finishing process.",
      "price": 299.0,
      "regularPrice": 299.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-754",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-754",
        "4-755",
        "Automatic Taping Tools",
        "Bonus",
        "Level 5",
        "level 5 nailspotter",
        "nail spotter",
        "nailspotter"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "2\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 2\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-755",
      "parentSku": "LVL5-LEVEL-5-NAIL-SPOTTER",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Nail Spotter (2nd Gen) with Bonus Storage Case - [4-755]",
      "description": "LEVEL5 nail spotters are used to quickly fill and finish fastener indentations during the drywall finishing process.",
      "price": 320.0,
      "regularPrice": 320.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-755",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-754",
        "4-755",
        "Automatic Taping Tools",
        "Bonus",
        "Level 5",
        "level 5 nailspotter",
        "nail spotter",
        "nailspotter"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 3\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-746",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Outside Corner Applicator Head (Red) - [4-746]",
      "description": "The LEVEL5 Outside Corner Applicator is a specialized tool for evenly applying compound onto 90 degree outside corners.",
      "price": 82.0,
      "regularPrice": 82.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-746",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "4-746",
        "Level 5",
        "Semi Automatic Taping Tools",
        "applicator"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "4-746",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-295",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Pro Mixer Adaptor with Hex Key - [5-295]",
      "description": "Mixer Adaptor for Level 5 Pro Mixing Paddle.",
      "price": 12.0,
      "regularPrice": 12.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-295",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-295",
        "Level 5",
        "Taping & Finishing Tools",
        "adapter",
        "adaptor",
        "level5",
        "mixer",
        "mixer adapter",
        "mixing tool",
        "pro mixer"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "5-295",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-291",
      "parentSku": "LVL5-LEVEL-5-PROFESSIONAL-MIXER",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Professional Mixer - [5-291]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other. Level 5 Tools are OVER-BUILT, NOT OVER-PRICED and will exceed expectations on any drywall...",
      "price": 33.0,
      "regularPrice": 33.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-291",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-291",
        "5-292",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "mixer",
        "mixing paddle",
        "mixing tool"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "32\"Length with 5\" Head",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 32\"Length with 5\" Head",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-292",
      "parentSku": "LVL5-LEVEL-5-PROFESSIONAL-MIXER",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Professional Mixer - [5-292]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other. Level 5 Tools are OVER-BUILT, NOT OVER-PRICED and will exceed expectations on any drywall...",
      "price": 41.0,
      "regularPrice": 41.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-292",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-291",
        "5-292",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "mixer",
        "mixing paddle",
        "mixing tool"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "32\" Length with 7\" Head",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 32\" Length with 7\" Head",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-293",
      "parentSku": "LVL5-LEVEL-5-PROFESSIONAL-MIXER",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Professional Mixer - [5-293]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other. Level 5 Tools are OVER-BUILT, NOT OVER-PRICED and will exceed expectations on any drywall...",
      "price": 16.0,
      "regularPrice": 16.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-293",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-291",
        "5-292",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "mixer",
        "mixing paddle",
        "mixing tool"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "13\" Length with 2\" Head",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 13\" Length with 2\" Head",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-294",
      "parentSku": "LVL5-LEVEL-5-PROFESSIONAL-MIXER",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Professional Mixer - [5-294]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other. Level 5 Tools are OVER-BUILT, NOT OVER-PRICED and will exceed expectations on any drywall...",
      "price": 27.0,
      "regularPrice": 27.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-294",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-291",
        "5-292",
        "Level 5",
        "Taping & Finishing Tools",
        "level 5",
        "level5",
        "mixer",
        "mixing paddle",
        "mixing tool"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "28\" Length with 4\" Head",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 28\" Length with 4\" Head",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-210",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Bucket Scoop - [5-210]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 13.0,
      "regularPrice": 13.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-210",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-210",
        "Level 5",
        "Taping & Finishing Tools",
        "bucket scoop",
        "level 5",
        "level5"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "5-210",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-310",
      "parentSku": "LVL5-LEVEL-5-TOOLS-STAINLESS-STEEL-CORNER-TOOLS-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Corner Tool with Soft Grip Handle - [5-310]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 15.0,
      "regularPrice": 15.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-310",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-310",
        "5-312",
        "5-320",
        "Level 5",
        "Taping & Finishing Tools",
        "corner trowel",
        "corner trowels",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4\" x 3.5\" Inside Corner Tool",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 4\" x 3.5\" Inside Corner Tool",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-312",
      "parentSku": "LVL5-LEVEL-5-TOOLS-STAINLESS-STEEL-CORNER-TOOLS-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Corner Tool with Soft Grip Handle - [5-312]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 17.0,
      "regularPrice": 17.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-312",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-310",
        "5-312",
        "5-320",
        "Level 5",
        "Taping & Finishing Tools",
        "corner trowel",
        "corner trowels",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "6.5\" x 11.5\" Inside Corner Tool",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 6.5\" x 11.5\" Inside Corner Tool",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-320",
      "parentSku": "LVL5-LEVEL-5-TOOLS-STAINLESS-STEEL-CORNER-TOOLS-WITH-SOFT-GRIP-HANDLE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Corner Tool with Soft Grip Handle - [5-320]",
      "description": "Level 5 hand tools have been built with over 20 years of feedback and input from professional finishers. Built to last with industry leading designs and high-quality materials and workmanship, these tools perform like no other.",
      "price": 15.0,
      "regularPrice": 15.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-320",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-310",
        "5-312",
        "5-320",
        "Level 5",
        "Taping & Finishing Tools",
        "corner trowel",
        "corner trowels",
        "level 5",
        "level5"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4\" x 3.5\" Outside Corner Tool",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 4\" x 3.5\" Outside Corner Tool",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-812",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Tape Jam Remover Tool - [4-812]",
      "description": "Generally speaking, jams will most frequently occur when the cutter blade returns to its retracted position after use. Small pieces of cut tape may catch on the blade after repeated cutting, causing a small obstruction within the left hand side of the taper head (when the head is facing you).",
      "price": 18.0,
      "regularPrice": 18.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-812",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-812",
        "Automatic Taping Tools",
        "Level 5",
        "accessory"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "4-812",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-203",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Trim Puller - [5-203]",
      "description": "The LEVEL5 Trim Puller is a versatile, professional-grade tool that makes trim removal projects faster, easier and more comfortable on the hands. The angled handle, and split blade design are built to protect your trim & drywall as well as your knuckles.",
      "price": 22.0,
      "regularPrice": 22.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-203",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-203",
        "Level 5",
        "Taping & Finishing Tools",
        "joint knife"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "5-203",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-603",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Carbon Steel Joint Knife Set 5-603 - [5-603]",
      "description": "This LEVEL 5 Carbon Steel Joint Knife Set includes five high-grade carbon steel joint knives (4\", 5\", 6\", 8\", 10\") with soft-grip handles. Our carbon steel joint knives feature incredibly strong, high-grade carbon steel blades for superior strength and durability versus stainless steel.",
      "price": 82.0,
      "regularPrice": 82.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-603",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-603",
        "Level 5",
        "Taping & Finishing Tools",
        "carbon steel",
        "hand tool set",
        "joint knife set",
        "level 5 drywall tools",
        "level 5 hand tool set",
        "level 5 sets",
        "level5",
        "level5 taping knife set",
        "taping knife set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "5-603",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-440C",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Composite Skimming Blade Set - 10\", 16\", 24\" with Extendable Handle - [5-440C]",
      "description": "LEVEL5 Drywall Composite Skimming Blades Set adds that extra edge to your finishing tool arsenal. This is an all-in-one drywall skimming tool set ideal for smoothing and finishing fresh compound on walls and ceilings.",
      "price": 282.0,
      "regularPrice": 282.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-440C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-910C",
        "4-916C",
        "4-924C",
        "4-942C",
        "5-440C",
        "Level 5",
        "Taping & Finishing Tools",
        "composite skimming blade",
        "composite skimming blade set",
        "level 5",
        "level 5 set",
        "set",
        "smoothing blade"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "5-440C",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-441C",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Composite Skimming Blade Set - 10\", 24\", 32\" with Extendable Handle - [5-441C]",
      "description": "LEVEL5 Drywall Composite Skimming Blade Sets add that extra edge to your finishing tool arsenal. This is an all-in-one drywall skimming tool set ideal for smoothing and finishing fresh compound on walls and ceilings.",
      "price": 310.0,
      "regularPrice": 310.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-441C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-910C",
        "4-924C",
        "4-932C",
        "4-941C",
        "4-942",
        "5-441C",
        "Level 5",
        "Taping & Finishing Tools",
        "composite skimming blade",
        "composite skimming blade set",
        "set",
        "skimming blade",
        "skimming blade set",
        "skimming blades",
        "smoothing blade"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "5-441C",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-609",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Deluxe Stainless Hand Tool Set 5-609 - [5-609]",
      "description": "Level 5 drywall tools are premium grade. They are designed and built using nearly 20 years of input from professional finishers and meant for reliable, daily use on the jobsite.",
      "price": 254.0,
      "regularPrice": 254.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-609",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-609",
        "Level 5",
        "Taping & Finishing Tools",
        "hand tool set",
        "joint knife set",
        "level 5 drywall tools",
        "level 5 hand tool set",
        "level 5 sets",
        "level5",
        "level5 taping knife set",
        "taping knife set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "5-609",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-600P",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 L5T Full Set with Bonus Tool Cases Set 4-600P - [4-600P]",
      "description": "This LEVEL5 Taping Tool Set is for professional finishers who want the best results in the fastest time possible.",
      "price": 4247.0,
      "regularPrice": 4247.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-600P",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-600",
        "4-600P",
        "Automatic Taping Tools",
        "Bonus",
        "Level 5",
        "level 5 set",
        "level5",
        "set",
        "taping tools"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "4-600P",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-601P",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 L5T Full Set with Extension Handles and Bonus Tool Cases Set 4-601P - [4-601P]",
      "description": "This LEVEL5 Taping Tool Set is for professional finishers who want the best results in the fastest time possible.",
      "price": 4646.0,
      "regularPrice": 4646.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-601P",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Automatic Taping Tools"
      ],
      "tags": [
        "4-601",
        "4-601P",
        "Automatic Taping Tools",
        "Bonus",
        "Level 5",
        "level 5 set",
        "level5",
        "set",
        "taping tools"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "4-601P",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-392",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Off-Set Knife Adapter - [5-392]",
      "description": "Off-Set Knife Adapter for Level 5 Offset Knives.",
      "price": 9.0,
      "regularPrice": 9.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-392",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-392",
        "Level 5",
        "Off-Set Knife Adapter",
        "Taping & Finishing Tools",
        "handles & accessories",
        "offset",
        "taping & finishing tools",
        "taping knife"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "5-392",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-651",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Professional Stainless Steel Joint Knife Set 5-651 - [5-651]",
      "description": "LEVEL5 Stainless Joint Knives with Soft-Grip Handles offer outstanding quality and a Lifetime Guarantee. Featuring a premium stainless steel construction, these knives are lightweight, extremely comfortable in the hand and clean up like a dream. LEVEL5 Hand Tool Sets offer professional finishers and DIYers an array...",
      "price": 45.0,
      "regularPrice": 45.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-651",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-651",
        "Level 5",
        "Taping & Finishing Tools",
        "blister",
        "hand tool set",
        "joint knife set",
        "level 5 drywall tools",
        "level 5 hand tool set",
        "level 5 sets",
        "level5",
        "level5 taping knife set",
        "taping knife set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "5-651",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-653",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Professional Stainless Steel Joint Knife Set with Handle Grips 5-653 - [5-653]",
      "description": "Level 5 drywall tools are premium grade. They are designed and built using nearly 20 years of input from professional finishers and meant for reliable, daily use on the jobsite.",
      "price": 59.0,
      "regularPrice": 59.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-653",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-404",
        "5-405",
        "5-406",
        "5-653",
        "Level 5",
        "Taping & Finishing Tools",
        "blister",
        "hand tool set",
        "joint knife set",
        "level 5 drywall tools",
        "level 5 hand tool set",
        "level 5 sets",
        "level5",
        "level5 taping knife set",
        "taping knife set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "5-653",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-550",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Skimming Blade & Compound Roller Set - 10\", 16\", 24\", 32\" with Extendable Handle - [5-550]",
      "description": "Due to their lightweight design and ease of use, skimming blades are becoming an increasingly popular tool in the drywall finishing industry.",
      "price": 600.0,
      "regularPrice": 600.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-550",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-910",
        "4-916",
        "4-924",
        "4-932",
        "4-941",
        "4-942",
        "5-550",
        "Level 5",
        "Taping & Finishing Tools",
        "set",
        "smoothing blade"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "5-550",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-440",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Skimming Blade Set - 10\", 16\", 24\" with Extendable Handle - [5-440]",
      "description": "LEVEL5 Drywall Skimming Blade Sets add that extra edge to your finishing tool arsenal. This is an all-in-one drywall skimming tool set ideal for smoothing and finishing fresh compound on walls and ceilings.",
      "price": 350.0,
      "regularPrice": 350.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-440",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-910",
        "4-916",
        "4-924",
        "4-941",
        "4-942",
        "5-440",
        "Level 5",
        "Taping & Finishing Tools",
        "set",
        "smoothing blade"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "5-440",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-441",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Skimming Blade Set - 10\", 24\", 32\" with Extendable Handle - [5-441]",
      "description": "LEVEL5 Drywall Skimming Blade Sets add that extra edge to your finishing tool arsenal. This is an all-in-one drywall skimming tool set ideal for smoothing and finishing fresh compound on walls and ceilings.",
      "price": 394.0,
      "regularPrice": 394.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-441",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-910",
        "4-924",
        "4-932",
        "4-941",
        "4-942",
        "5-441",
        "Level 5",
        "Taping & Finishing Tools",
        "set",
        "smoothing blade"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "5-441",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-600",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Hand Tool Finishing Set 5-600 - [5-600]",
      "description": "LEVEL5 Hand Tool Sets offer professional finishers and DIYers an array of options for high-performance hand tools. This LEVEL 5 Stainless Steel Finishing Set comes with all the hand tools necessary to tackle many professional and DIY finishing jobs.",
      "price": 94.0,
      "regularPrice": 94.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-600",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-600",
        "Level 5",
        "Taping & Finishing Tools",
        "hand tool set",
        "joint knife set",
        "level 5 drywall tools",
        "level 5 hand tool set",
        "level 5 sets",
        "level5",
        "level5 taping knife set",
        "taping knife set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "5-600",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-602",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Joint Knife Set 5-602 - [5-602]",
      "description": "LEVEL5 Stainless Joint Knives with Soft-Grip Handles offer outstanding quality and a Lifetime Guarantee. Featuring a premium stainless steel construction, these knives are lightweight, extremely comfortable in the hand and clean up like a dream. LEVEL5 Hand Tool Sets offer professional finishers and DIYers an array...",
      "price": 78.0,
      "regularPrice": 78.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "5-602",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-139",
        "5-140",
        "5-141",
        "5-142",
        "5-144",
        "5-602",
        "Level 5",
        "Taping & Finishing Tools",
        "hand tool set",
        "joint knife set",
        "level 5 drywall tools",
        "level 5 hand tool set",
        "level 5 sets",
        "level5",
        "level5 taping knife set",
        "taping knife set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "5-602",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-620",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Joint Knife Set with Soft Grip Handles 5-620 - [5-620]",
      "description": "This LEVEL 5 Stainless Steel Joint (Putty) Knife Set includes three 4\", 5\" and 6\" stainless steel drywall joint knives with soft-grip handles. Thanks to the high-grade construction of the blade, LEVEL5 joint knives are some of the most lightweight knives on the market.",
      "price": 47.0,
      "regularPrice": 47.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-620",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-620",
        "Level 5",
        "Taping & Finishing Tools",
        "carbon steel",
        "hand tool set",
        "joint knife set",
        "level 5 drywall tools",
        "level 5 hand tool set",
        "level 5 sets",
        "level5",
        "level5 taping knife set",
        "taping knife set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "5-620",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-619",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Stainless Steel Taping Knife Set 5-619 - [5-619]",
      "description": "LEVEL5 Hand Tool Sets offer professional drywall finishers an array of options for high-performance hand tools.",
      "price": 56.0,
      "regularPrice": 56.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-619",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-619",
        "Level 5",
        "Taping & Finishing Tools",
        "hand tool set",
        "joint knife set",
        "level 5 drywall tools",
        "level 5 hand tool set",
        "level 5 sets",
        "level5",
        "level5 taping knife set",
        "taping knife set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "5-619",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "5-311",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Semi-Automatic Drywall Banjo - [5-311]",
      "description": "The LEVEL5 Banjo Drywall Taper is an intermediate or “semi-automatic” tool that enables you to apply paper tape or Fibafuse to flat drywall seams with precision and efficiency.",
      "price": 166.0,
      "regularPrice": 166.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "5-311",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "5-311",
        "Level 5",
        "Taping & Finishing Tools",
        "banjo",
        "level5 banjo"
      ],
      "attributes": [],
      "optionGroup": "semi_automatic_taper",
      "sizeLabel": "5-311",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-910C",
      "parentSku": "LVL5-LEVEL-5-COMPOSITE-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Composite Skimming Blade - [4-910C]",
      "description": "Level 5's patent-pending skimming blades have been developed and refined through years of feedback from professional finishers. Although competitively priced, they are the highest quality line of skimming blades available on the market today.",
      "price": 42.0,
      "regularPrice": 42.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-910C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-910C",
        "4-914C",
        "4-916C",
        "4-924C",
        "4-932C",
        "Level 5",
        "Taping & Finishing Tools",
        "composite skimming blade",
        "skimming blades",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 10\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-914C",
      "parentSku": "LVL5-LEVEL-5-COMPOSITE-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Composite Skimming Blade - [4-914C]",
      "description": "Level 5's patent-pending skimming blades have been developed and refined through years of feedback from professional finishers. Although competitively priced, they are the highest quality line of skimming blades available on the market today.",
      "price": 53.0,
      "regularPrice": 53.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-914C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-910C",
        "4-914C",
        "4-916C",
        "4-924C",
        "4-932C",
        "Level 5",
        "Taping & Finishing Tools",
        "composite skimming blade",
        "skimming blades",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 14\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-916C",
      "parentSku": "LVL5-LEVEL-5-COMPOSITE-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Composite Skimming Blade - [4-916C]",
      "description": "Level 5's patent-pending skimming blades have been developed and refined through years of feedback from professional finishers. Although competitively priced, they are the highest quality line of skimming blades available on the market today.",
      "price": 61.0,
      "regularPrice": 61.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-916C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-910C",
        "4-914C",
        "4-916C",
        "4-924C",
        "4-932C",
        "Level 5",
        "Taping & Finishing Tools",
        "composite skimming blade",
        "skimming blades",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "16\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 16\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-924C",
      "parentSku": "LVL5-LEVEL-5-COMPOSITE-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Composite Skimming Blade - [4-924C]",
      "description": "Level 5's patent-pending skimming blades have been developed and refined through years of feedback from professional finishers. Although competitively priced, they are the highest quality line of skimming blades available on the market today.",
      "price": 79.0,
      "regularPrice": 79.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-924C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-910C",
        "4-914C",
        "4-916C",
        "4-924C",
        "4-932C",
        "Level 5",
        "Taping & Finishing Tools",
        "composite skimming blade",
        "skimming blades",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "24\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 24\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-932C",
      "parentSku": "LVL5-LEVEL-5-COMPOSITE-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Composite Skimming Blade - [4-932C]",
      "description": "Level 5's patent-pending skimming blades have been developed and refined through years of feedback from professional finishers. Although competitively priced, they are the highest quality line of skimming blades available on the market today.",
      "price": 102.0,
      "regularPrice": 102.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-932C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-910C",
        "4-914C",
        "4-916C",
        "4-924C",
        "4-932C",
        "Level 5",
        "Taping & Finishing Tools",
        "composite skimming blade",
        "skimming blades",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "32\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 32\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-949",
      "parentSku": "LVL5-LEVEL-5-REPLACEMENT-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Replacement Skimming Blade - [4-949]",
      "description": "Replacement blade only.",
      "price": 18.0,
      "regularPrice": 18.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-949",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-949",
        "4-950",
        "4-951",
        "4-952",
        "4-953",
        "4-954",
        "4-955",
        "4-956",
        "Level 5",
        "Taping & Finishing Tools",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 7\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-950",
      "parentSku": "LVL5-LEVEL-5-REPLACEMENT-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Replacement Skimming Blade - [4-950]",
      "description": "Replacement blade only.",
      "price": 28.0,
      "regularPrice": 28.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-950",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-949",
        "4-950",
        "4-951",
        "4-952",
        "4-953",
        "4-954",
        "4-955",
        "4-956",
        "Level 5",
        "Taping & Finishing Tools",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 14\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-951",
      "parentSku": "LVL5-LEVEL-5-REPLACEMENT-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Replacement Skimming Blade - [4-951]",
      "description": "Replacement blade only.",
      "price": 23.0,
      "regularPrice": 23.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-951",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-949",
        "4-950",
        "4-951",
        "4-952",
        "4-953",
        "4-954",
        "4-955",
        "4-956",
        "Level 5",
        "Taping & Finishing Tools",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 10\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-952",
      "parentSku": "LVL5-LEVEL-5-REPLACEMENT-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Replacement Skimming Blade - [4-952]",
      "description": "Replacement blade only.",
      "price": 31.0,
      "regularPrice": 31.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-952",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-949",
        "4-950",
        "4-951",
        "4-952",
        "4-953",
        "4-954",
        "4-955",
        "4-956",
        "Level 5",
        "Taping & Finishing Tools",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "16\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 16\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-953",
      "parentSku": "LVL5-LEVEL-5-REPLACEMENT-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Replacement Skimming Blade - [4-953]",
      "description": "Replacement blade only.",
      "price": 37.0,
      "regularPrice": 37.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-953",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-949",
        "4-950",
        "4-951",
        "4-952",
        "4-953",
        "4-954",
        "4-955",
        "4-956",
        "Level 5",
        "Taping & Finishing Tools",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "24\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 24\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-954",
      "parentSku": "LVL5-LEVEL-5-REPLACEMENT-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Replacement Skimming Blade - [4-954]",
      "description": "Replacement blade only.",
      "price": 50.0,
      "regularPrice": 50.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "4-954",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-949",
        "4-950",
        "4-951",
        "4-952",
        "4-953",
        "4-954",
        "4-955",
        "4-956",
        "Level 5",
        "Taping & Finishing Tools",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "32\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 32\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-955",
      "parentSku": "LVL5-LEVEL-5-REPLACEMENT-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Replacement Skimming Blade - [4-955]",
      "description": "Replacement blade only.",
      "price": 59.0,
      "regularPrice": 59.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-955",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-949",
        "4-950",
        "4-951",
        "4-952",
        "4-953",
        "4-954",
        "4-955",
        "4-956",
        "Level 5",
        "Taping & Finishing Tools",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "40\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 40\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-956",
      "parentSku": "LVL5-LEVEL-5-REPLACEMENT-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Replacement Skimming Blade - [4-956]",
      "description": "Replacement blade only.",
      "price": 64.0,
      "regularPrice": 64.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-956",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-949",
        "4-950",
        "4-951",
        "4-952",
        "4-953",
        "4-954",
        "4-955",
        "4-956",
        "Level 5",
        "Taping & Finishing Tools",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "48\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 48\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-907",
      "parentSku": "LVL5-LEVEL-5-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Skimming Blade - [4-907]",
      "description": "Level 5’s patent-pending skimming blades have been developed and refined through years of feedback from professional finishers. Although competitively priced, they are the highest quality line of skimming blades available on the market today.",
      "price": 51.0,
      "regularPrice": 51.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-907",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-907",
        "4-910",
        "4-914",
        "4-916",
        "4-924",
        "4-932",
        "4-940",
        "4-948",
        "Level 5",
        "Taping & Finishing Tools",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 7\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-910",
      "parentSku": "LVL5-LEVEL-5-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Skimming Blade - [4-910]",
      "description": "Level 5’s patent-pending skimming blades have been developed and refined through years of feedback from professional finishers. Although competitively priced, they are the highest quality line of skimming blades available on the market today.",
      "price": 59.0,
      "regularPrice": 59.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-910",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-907",
        "4-910",
        "4-914",
        "4-916",
        "4-924",
        "4-932",
        "4-940",
        "4-948",
        "Level 5",
        "Taping & Finishing Tools",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 10\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-914",
      "parentSku": "LVL5-LEVEL-5-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Skimming Blade - [4-914]",
      "description": "Level 5’s patent-pending skimming blades have been developed and refined through years of feedback from professional finishers. Although competitively priced, they are the highest quality line of skimming blades available on the market today.",
      "price": 73.0,
      "regularPrice": 73.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-914",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-907",
        "4-910",
        "4-914",
        "4-916",
        "4-924",
        "4-932",
        "4-940",
        "4-948",
        "Level 5",
        "Taping & Finishing Tools",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 14\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-916",
      "parentSku": "LVL5-LEVEL-5-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Skimming Blade - [4-916]",
      "description": "Level 5’s patent-pending skimming blades have been developed and refined through years of feedback from professional finishers. Although competitively priced, they are the highest quality line of skimming blades available on the market today.",
      "price": 83.0,
      "regularPrice": 83.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-916",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-907",
        "4-910",
        "4-914",
        "4-916",
        "4-924",
        "4-932",
        "4-940",
        "4-948",
        "Level 5",
        "Taping & Finishing Tools",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "16\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 16\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-924",
      "parentSku": "LVL5-LEVEL-5-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Skimming Blade - [4-924]",
      "description": "Level 5’s patent-pending skimming blades have been developed and refined through years of feedback from professional finishers. Although competitively priced, they are the highest quality line of skimming blades available on the market today.",
      "price": 107.0,
      "regularPrice": 107.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-924",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-907",
        "4-910",
        "4-914",
        "4-916",
        "4-924",
        "4-932",
        "4-940",
        "4-948",
        "Level 5",
        "Taping & Finishing Tools",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "24\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 24\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-932",
      "parentSku": "LVL5-LEVEL-5-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Skimming Blade - [4-932]",
      "description": "Level 5’s patent-pending skimming blades have been developed and refined through years of feedback from professional finishers. Although competitively priced, they are the highest quality line of skimming blades available on the market today.",
      "price": 140.0,
      "regularPrice": 140.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-932",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-907",
        "4-910",
        "4-914",
        "4-916",
        "4-924",
        "4-932",
        "4-940",
        "4-948",
        "Level 5",
        "Taping & Finishing Tools",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "32\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 32\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-940",
      "parentSku": "LVL5-LEVEL-5-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Skimming Blade - [4-940]",
      "description": "Level 5’s patent-pending skimming blades have been developed and refined through years of feedback from professional finishers. Although competitively priced, they are the highest quality line of skimming blades available on the market today.",
      "price": 159.0,
      "regularPrice": 159.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-940",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-907",
        "4-910",
        "4-914",
        "4-916",
        "4-924",
        "4-932",
        "4-940",
        "4-948",
        "Level 5",
        "Taping & Finishing Tools",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "40\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 40\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-948",
      "parentSku": "LVL5-LEVEL-5-SKIMMING-BLADE",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Skimming Blade - [4-948]",
      "description": "Level 5’s patent-pending skimming blades have been developed and refined through years of feedback from professional finishers. Although competitively priced, they are the highest quality line of skimming blades available on the market today.",
      "price": 214.0,
      "regularPrice": 214.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "4-948",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-907",
        "4-910",
        "4-914",
        "4-916",
        "4-924",
        "4-932",
        "4-940",
        "4-948",
        "Level 5",
        "Taping & Finishing Tools",
        "smoothing blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "48\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade",
      "sizeLabel": "Size: 48\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-941C",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Composite Skimming Blade Pole Adapter - [4-941C]",
      "description": "The LEVEL5 Composite Skimming Blade Handle Adapter is used to connect a range of extendable handles to LEVEL5 Skimming Blades.",
      "price": 43.0,
      "regularPrice": 43.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-941C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-941C",
        "Level 5",
        "Taping & Finishing Tools",
        "adaptor for pole",
        "blade",
        "finishing blade",
        "finishing blade adaptor",
        "finishing blades",
        "level 5 adaptor",
        "level 5 skim blade",
        "level5",
        "pole adaptor",
        "skim blade",
        "skimming blades",
        "smoothing blade",
        "wiping blade"
      ],
      "attributes": [],
      "optionGroup": "smoothing_blade_handle",
      "sizeLabel": "4-941C",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-942",
      "parentSku": "LVL5-LEVEL-5-SKIMMING-BLADE-EXTENSION-HANDLES",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Skimming Blade Extension Handle - [4-942]",
      "description": "Manufactured with high-quality fiberglass, aluminium, and high-impact ABS composite LEVEL5 Skimming Blade and Compound Roller Extendable Handles offer lightweight handling while maintaining rigidity and durability. The most popular handle size for both skimming blades and compound rollers is the medium (37-63\") hand...",
      "price": 64.0,
      "regularPrice": 64.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-942",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-942",
        "4-943",
        "Level 5",
        "Taping & Finishing Tools",
        "blade",
        "finishing blade",
        "finishing blades",
        "level 5 skim blade",
        "level5",
        "pole",
        "skim blade",
        "skimming blades",
        "smoothing blade",
        "wiping blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "2' - 5' Telescopic",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade_handle",
      "sizeLabel": "Size: 2' - 5' Telescopic",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-943",
      "parentSku": "LVL5-LEVEL-5-SKIMMING-BLADE-EXTENSION-HANDLES",
      "type": "variation",
      "brand": "Level 5",
      "name": "Level 5 Skimming Blade Extension Handle - [4-943]",
      "description": "Manufactured with high-quality fiberglass, aluminium, and high-impact ABS composite LEVEL5 Skimming Blade and Compound Roller Extendable Handles offer lightweight handling while maintaining rigidity and durability. The most popular handle size for both skimming blades and compound rollers is the medium (37-63\") hand...",
      "price": 68.0,
      "regularPrice": 68.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-943",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-942",
        "4-943",
        "Level 5",
        "Taping & Finishing Tools",
        "blade",
        "finishing blade",
        "finishing blades",
        "level 5 skim blade",
        "level5",
        "pole",
        "skim blade",
        "skimming blades",
        "smoothing blade",
        "wiping blade"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4' - 7' Telescopic",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "smoothing_blade_handle",
      "sizeLabel": "Size: 4' - 7' Telescopic",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-945",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Skimming Blade Extension Handle with Skimming Blade Pole Adapter - [4-945]",
      "description": "Manufactured from high-quality fiberglass, aluminum, and high-impact ABS composite, the LEVEL5 Skimming Blade Extension Handle provides lightweight handling while maintaining excellent rigidity and durability. Available in Long (48–87\") length.",
      "price": 106.0,
      "regularPrice": 106.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-945",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-945",
        "Level 5",
        "Taping & Finishing Tools",
        "blade",
        "clearance",
        "finishing blade",
        "finishing blades",
        "level 5 skim blade",
        "level5",
        "pole",
        "skim blade",
        "skimming blades",
        "smoothing blade",
        "wiping blade"
      ],
      "attributes": [],
      "optionGroup": "smoothing_blade_handle",
      "sizeLabel": "4-945",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "4-941",
      "parentSku": null,
      "type": "simple",
      "brand": "Level 5",
      "name": "Level 5 Skimming Blade Pole Adapter - [4-941]",
      "description": "The LEVEL5 Drywall Skimming Blade Handle Adapter is used to connect a range of extendable handles to LEVEL5 Composite-Body Skimming Blades.",
      "price": 50.0,
      "regularPrice": 50.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "4-941",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > Level 5 > Taping & Finishing Tools"
      ],
      "tags": [
        "4-941",
        "Level 5",
        "Taping & Finishing Tools",
        "adaptor for pole",
        "blade",
        "finishing blade",
        "finishing blade adaptor",
        "finishing blades",
        "level 5 adaptor",
        "level 5 skim blade",
        "level5",
        "pole adaptor",
        "skim blade",
        "skimming blades",
        "smoothing blade",
        "wiping blade"
      ],
      "attributes": [],
      "optionGroup": "smoothing_blade_handle",
      "sizeLabel": "4-941",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CNA-TT",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Cleaning Nozzle Adapter Only - [CNA-TT]",
      "description": "The TapeTech Cleaning Nozzle Adapter makes cleaning the head of the Automatic Taper easy. The Adapter securely threads on to the Spray Nozzle and fits over the filler valve of the Automatic Taper to thoroughly clean the valve and the head without soaking the user. The Adapter can also be used to quickly clean the fi...",
      "price": 18.0,
      "regularPrice": 18.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "CNA-TT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "CNA-TT",
        "TapeTech",
        "accessory"
      ],
      "attributes": [],
      "optionGroup": "adapter",
      "sizeLabel": "CNA-TT",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT042",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech 14TT MudRunner® - [AT042]",
      "description": "The TapeTech MudRunner® delivers joint compound to corners with precision control and minimal effort. A simple twist of the wrist activates the piston and creates a consistent flow of joint compound. Twist it back and the flow stops immediately. Use it with TapeTech Corner Finishers to quickly achieve high quality,...",
      "price": 1084.0,
      "regularPrice": 1084.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT042",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "14TT",
        "AT042",
        "Automatic Taping Tools",
        "TapeTech",
        "automatic compound tube",
        "compound tube",
        "mud runner",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "angle_head",
      "sizeLabel": "AT042",
      "sortKey": 14.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT056A",
      "parentSku": "TT-TAPETECH-CORNER-FINISHER",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Corner Finisher - [AT056A]",
      "description": "The TapeTech Corner Finisher is used to perfectly feather both joint compound edges of internal corners in one pass. The Corner Finishers can be used for wall-to-wall internal corners or wall-to-ceiling corners. Corner Finishers, also referred to as Angle Finishers, are attached to a corner applicator (35TT or 50TT)...",
      "price": 440.0,
      "regularPrice": 440.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT056A",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "40TT",
        "42TT",
        "48TT",
        "48XTT",
        "AT056",
        "AT056-X",
        "AT056A",
        "AT056X",
        "AT057",
        "AT058",
        "AT080",
        "Automatic Taping Tools",
        "TapeTech",
        "angle head",
        "corner finisher",
        "corner flusher",
        "finisher",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Angle Head Size",
          "value": "2.5\" (42TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Angle Head Size: 2.5\" (42TT)",
      "sortKey": 56.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT056X",
      "parentSku": "TT-TAPETECH-CORNER-FINISHER",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Corner Finisher - [AT056X]",
      "description": "The TapeTech Corner Finisher is used to perfectly feather both joint compound edges of internal corners in one pass. The Corner Finishers can be used for wall-to-wall internal corners or wall-to-ceiling corners. Corner Finishers, also referred to as Angle Finishers, are attached to a corner applicator (35TT or 50TT)...",
      "price": 429.0,
      "regularPrice": 429.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT056X",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "40TT",
        "42TT",
        "48TT",
        "48XTT",
        "AT056",
        "AT056-X",
        "AT056A",
        "AT056X",
        "AT057",
        "AT058",
        "AT080",
        "Automatic Taping Tools",
        "TapeTech",
        "angle head",
        "corner finisher",
        "corner flusher",
        "finisher",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Angle Head Size",
          "value": "2\" (40XTT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Angle Head Size: 2\" (40XTT)",
      "sortKey": 56.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT058",
      "parentSku": "TT-TAPETECH-CORNER-FINISHER",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Corner Finisher - [AT058]",
      "description": "The TapeTech Corner Finisher is used to perfectly feather both joint compound edges of internal corners in one pass. The Corner Finishers can be used for wall-to-wall internal corners or wall-to-ceiling corners. Corner Finishers, also referred to as Angle Finishers, are attached to a corner applicator (35TT or 50TT)...",
      "price": 474.0,
      "regularPrice": 474.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT058",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "40TT",
        "42TT",
        "48TT",
        "48XTT",
        "AT056",
        "AT056-X",
        "AT056A",
        "AT056X",
        "AT057",
        "AT058",
        "AT080",
        "Automatic Taping Tools",
        "TapeTech",
        "angle head",
        "corner finisher",
        "corner flusher",
        "finisher",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Angle Head Size",
          "value": "3\" EasyRoll Adjustable (48TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Angle Head Size: 3\" EasyRoll Adjustable (48TT)",
      "sortKey": 58.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT080",
      "parentSku": "TT-TAPETECH-CORNER-FINISHER",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Corner Finisher - [AT080]",
      "description": "The TapeTech Corner Finisher is used to perfectly feather both joint compound edges of internal corners in one pass. The Corner Finishers can be used for wall-to-wall internal corners or wall-to-ceiling corners. Corner Finishers, also referred to as Angle Finishers, are attached to a corner applicator (35TT or 50TT)...",
      "price": 485.0,
      "regularPrice": 485.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT080",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "40TT",
        "42TT",
        "48TT",
        "48XTT",
        "AT056",
        "AT056-X",
        "AT056A",
        "AT056X",
        "AT057",
        "AT058",
        "AT080",
        "Automatic Taping Tools",
        "TapeTech",
        "angle head",
        "corner finisher",
        "corner flusher",
        "finisher",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Angle Head Size",
          "value": "3.5\" EasyRoll Adjustable (48XTT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Angle Head Size: 3.5\" EasyRoll Adjustable (48XTT)",
      "sortKey": 80.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT134",
      "parentSku": "TT-TAPETECH-CORNER-FLUSHER",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Corner Flusher - [AT134]",
      "description": "TapeTech Corner Flushers make quick work of wiping or finishing inside corners. Direct flushers are used to apply joint compound to internal corners. Indirect flushers simply smooth compound that has been applied by another tool. TapeTech flushers work as both a direct and indirect flusher. That means you don’t have...",
      "price": 126.0,
      "regularPrice": 126.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT134",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "AT134",
        "AT135",
        "AT136",
        "AT137",
        "CF25TT",
        "CF30TT",
        "CF35TT",
        "CF40TT",
        "Semi Automatic Taping Tools",
        "TapeTech",
        "corner flusher",
        "flusher",
        "flusher with wheels",
        "semi automatic",
        "standard flusher",
        "tape tech",
        "wiper"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "2.5\" (CF25TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Size: 2.5\" (CF25TT)",
      "sortKey": 134.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT135",
      "parentSku": "TT-TAPETECH-CORNER-FLUSHER",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Corner Flusher - [AT135]",
      "description": "TapeTech Corner Flushers make quick work of wiping or finishing inside corners. Direct flushers are used to apply joint compound to internal corners. Indirect flushers simply smooth compound that has been applied by another tool. TapeTech flushers work as both a direct and indirect flusher. That means you don’t have...",
      "price": 132.0,
      "regularPrice": 132.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT135",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "AT134",
        "AT135",
        "AT136",
        "AT137",
        "CF25TT",
        "CF30TT",
        "CF35TT",
        "CF40TT",
        "Semi Automatic Taping Tools",
        "TapeTech",
        "corner flusher",
        "flusher",
        "flusher with wheels",
        "semi automatic",
        "standard flusher",
        "tape tech",
        "wiper"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3\" (CF30TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Size: 3\" (CF30TT)",
      "sortKey": 135.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT136",
      "parentSku": "TT-TAPETECH-CORNER-FLUSHER",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Corner Flusher - [AT136]",
      "description": "TapeTech Corner Flushers make quick work of wiping or finishing inside corners. Direct flushers are used to apply joint compound to internal corners. Indirect flushers simply smooth compound that has been applied by another tool. TapeTech flushers work as both a direct and indirect flusher. That means you don’t have...",
      "price": 138.0,
      "regularPrice": 138.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT136",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "AT134",
        "AT135",
        "AT136",
        "AT137",
        "CF25TT",
        "CF30TT",
        "CF35TT",
        "CF40TT",
        "Semi Automatic Taping Tools",
        "TapeTech",
        "corner flusher",
        "flusher",
        "flusher with wheels",
        "semi automatic",
        "standard flusher",
        "tape tech",
        "wiper"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3.5\" (CF35TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Size: 3.5\" (CF35TT)",
      "sortKey": 136.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT137",
      "parentSku": "TT-TAPETECH-CORNER-FLUSHER",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Corner Flusher - [AT137]",
      "description": "TapeTech Corner Flushers make quick work of wiping or finishing inside corners. Direct flushers are used to apply joint compound to internal corners. Indirect flushers simply smooth compound that has been applied by another tool. TapeTech flushers work as both a direct and indirect flusher. That means you don’t have...",
      "price": 143.0,
      "regularPrice": 143.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT137",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "AT134",
        "AT135",
        "AT136",
        "AT137",
        "CF25TT",
        "CF30TT",
        "CF35TT",
        "CF40TT",
        "Semi Automatic Taping Tools",
        "TapeTech",
        "corner flusher",
        "flusher",
        "flusher with wheels",
        "semi automatic",
        "standard flusher",
        "tape tech",
        "wiper"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4\" (CF40TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "angle_head",
      "sizeLabel": "Size: 4\" (CF40TT)",
      "sortKey": 137.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT040A",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech 03TT MINI EasyClean® Automatic Taper 40.5″ - [AT040A]",
      "description": "At just 40.5” long (103 cm), the 03TT EasyClean® Automatic Mini-Taper is 23% shorter than standard Automatic Tapers and is ideal for working in small spaces like closets and hallways or when working from scaffolding. The 03TT is also a great tool for new team members to use when learning to use the Automatic Taper....",
      "price": 1958.0,
      "regularPrice": 1958.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT040A",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "03TT",
        "AT040A",
        "Automatic Taping Tools",
        "TapeTech",
        "bazooka",
        "tape tech",
        "taper"
      ],
      "attributes": [],
      "optionGroup": "automatic_taper",
      "sizeLabel": "AT040A",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT041",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech 07TT EasyClean® Automatic Taper - [AT041]",
      "description": "The TapeTech 07TT EasyClean® Automatic Taper redefines Quality, Durability and Value. The Taper simultaneously applies tape and the correct amount of joint compound for all drywall joints - dramatically improving taping efficiency. The EasyClean® cover plate can be removed with just a quarter turn for quick and easy...",
      "price": 1764.0,
      "regularPrice": 1764.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT041",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "07TT",
        "AT041",
        "Automatic Taping Tools",
        "TapeTech",
        "bazooka",
        "tape tech",
        "taper"
      ],
      "attributes": [],
      "optionGroup": "automatic_taper",
      "sizeLabel": "AT041",
      "sortKey": 7.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT041C",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech 07TT-C EasyClean Carbon Fiber Automatic Taper - [AT041C]",
      "description": "The TapeTech 07TT-C Carbon Fiber Automatic Taper is the world’s lightest automatic taper. At just 5.65 pounds, the 07TT-C is up to 20% lighter than competitive tapers, reducing worker fatigue. Both the main tube and the control tube are carbon fiber, a material that will not dent and is temperature-neutral. No more...",
      "price": 1963.0,
      "regularPrice": 1963.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT041C",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "07TT-C",
        "AT041C",
        "Automatic Taping Tools",
        "TapeTech",
        "bazooka",
        "tape tech",
        "taper"
      ],
      "attributes": [],
      "optionGroup": "automatic_taper",
      "sizeLabel": "AT041C",
      "sortKey": 7.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "MR01TT",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech MR01TT MudRunner® Pro - [MR01TT]",
      "description": "The improved second generation MudRunner® Pro tool now applies joint compound to both inside and outside corners more quickly and accurately with minimal effort. The easy-to-use twist on/off handle offers precise control, while a 20% stronger piston allows for faster application of joint compound. The adjustable len...",
      "price": 1212.0,
      "regularPrice": 1212.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "MR01TT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "MR01TT",
        "TapeTech",
        "automatic compound tube",
        "compound tube",
        "mud runner",
        "mud runner pro",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "corner_applicator",
      "sizeLabel": "MR01TT",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "MRX01TT",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech MudRunner Pro Handle Extension - [MRX01TT]",
      "description": "The new MudRunner® Pro Extension allows the user to add 12″ length to the MR01TT to reach higher spaces. The MRX01TT simply attaches by inserting the extrusion piece into the receiving port on the MR01TT and securing the clamps. The MRX01TT also has a receiving port to add multiple extensions. The New MudRunner® Pro...",
      "price": 198.0,
      "regularPrice": 198.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "MRX01TT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "MRX01TT",
        "TapeTech",
        "automatic compound tube",
        "compound tube",
        "mud runner",
        "mud shot",
        "mudrunner",
        "mudshot",
        "mudshot extension",
        "mudshot handle"
      ],
      "attributes": [],
      "optionGroup": "corner_applicator",
      "sizeLabel": "MRX01TT",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT151",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech TC01TT Tool Caddy - [AT151]",
      "description": "The TapeTech Tool Caddy make filling finishing boxes with a compound tube even easier. It conveniently holds any length compound tube and filler adapter, preventing the need to place the tool on the floor or in the bucket of joint compound between fills. The Tool Caddy is light weight, durable, and securely holds an...",
      "price": 67.0,
      "regularPrice": 67.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT151",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "AT151",
        "Semi Automatic Taping Tools",
        "TC01TT",
        "TapeTech",
        "compound tube",
        "semi automatic",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "corner_applicator",
      "sizeLabel": "AT151",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT055CA",
      "parentSku": "TT-TAPETECH-CORNER-APPLICATOR-BOX-HEAD-ONLY",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Corner Applicator Box – Head Only - [AT055CA]",
      "description": "The TapeTech Corner Applicator supplies joint compound to the Corner Finishers for fast and efficient finishing of internal corners (angles). Corner Applicators are also used with Applicator Heads to quickly and cleanly apply joint compound to internal or external corners for the installation of paper-faced corner b...",
      "price": 364.0,
      "regularPrice": 364.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT055CA",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT055CA",
        "AT059CA",
        "Automatic Taping Tools",
        "CA07TT",
        "CA08TT",
        "TapeTech",
        "angle box",
        "corner angle box",
        "corner box",
        "corner finisher box",
        "corner flusher box",
        "cornerbox",
        "flusher box",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\" (CA08TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "corner_applicator",
      "sizeLabel": "Size: 8\" (CA08TT)",
      "sortKey": 55.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT059CA",
      "parentSku": "TT-TAPETECH-CORNER-APPLICATOR-BOX-HEAD-ONLY",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Corner Applicator Box – Head Only - [AT059CA]",
      "description": "The TapeTech Corner Applicator supplies joint compound to the Corner Finishers for fast and efficient finishing of internal corners (angles). Corner Applicators are also used with Applicator Heads to quickly and cleanly apply joint compound to internal or external corners for the installation of paper-faced corner b...",
      "price": 348.0,
      "regularPrice": 348.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT059CA",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT055CA",
        "AT059CA",
        "Automatic Taping Tools",
        "CA07TT",
        "CA08TT",
        "TapeTech",
        "angle box",
        "corner angle box",
        "corner box",
        "corner finisher box",
        "corner flusher box",
        "cornerbox",
        "flusher box",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "7\" (CA07TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "corner_applicator",
      "sizeLabel": "Size: 7\" (CA07TT)",
      "sortKey": 59.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT131",
      "parentSku": "TT-TAPETECH-COMPOUND-TUBE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Compound Tube - [AT131]",
      "description": "TapeTech Compound Tubes supply joint compound to Corner Flushers for finishing inside corners. Also attaches to TapeTech Applicator Heads for applying corner bead to internal and external corners. Available in three sizes, the Compound Tubes disassemble for easy cleaning.",
      "price": 209.0,
      "regularPrice": 209.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT131",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "AT131",
        "AT132",
        "AT133",
        "CT24TT",
        "CT36TT",
        "CT42TT",
        "Semi Automatic Taping Tools",
        "TapeTech",
        "compound tube",
        "semi automatic",
        "syringe",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "24\" (CT24TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "corner_applicator",
      "sizeLabel": "Size: 24\" (CT24TT)",
      "sortKey": 131.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT132",
      "parentSku": "TT-TAPETECH-COMPOUND-TUBE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Compound Tube - [AT132]",
      "description": "TapeTech Compound Tubes supply joint compound to Corner Flushers for finishing inside corners. Also attaches to TapeTech Applicator Heads for applying corner bead to internal and external corners. Available in three sizes, the Compound Tubes disassemble for easy cleaning.",
      "price": 220.0,
      "regularPrice": 220.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT132",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "AT131",
        "AT132",
        "AT133",
        "CT24TT",
        "CT36TT",
        "CT42TT",
        "Semi Automatic Taping Tools",
        "TapeTech",
        "compound tube",
        "semi automatic",
        "syringe",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "36\" (CT36TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "corner_applicator",
      "sizeLabel": "Size: 36\" (CT36TT)",
      "sortKey": 132.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT133",
      "parentSku": "TT-TAPETECH-COMPOUND-TUBE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Compound Tube - [AT133]",
      "description": "TapeTech Compound Tubes supply joint compound to Corner Flushers for finishing inside corners. Also attaches to TapeTech Applicator Heads for applying corner bead to internal and external corners. Available in three sizes, the Compound Tubes disassemble for easy cleaning.",
      "price": 231.0,
      "regularPrice": 231.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT133",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "AT131",
        "AT132",
        "AT133",
        "CT24TT",
        "CT36TT",
        "CT42TT",
        "Semi Automatic Taping Tools",
        "TapeTech",
        "compound tube",
        "semi automatic",
        "syringe",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "42\" (CT42TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "corner_applicator",
      "sizeLabel": "Size: 42\" (CT42TT)",
      "sortKey": 133.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT043A",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech 15TTE Inside Corner Roller – Head Only - [AT043A]",
      "description": "The TapeTech Corner Roller quickly and accurately embeds the tape firmly into the internal corners of the drywall. Use the corner roller immediately after applying joint tape to the internal corner with the automatic taper. The corner roller forces excess joint compound out from behind the tape in preparation for th...",
      "price": 209.0,
      "regularPrice": 209.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT043A",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "15TTE",
        "AT043A",
        "Automatic Taping Tools",
        "TapeTech",
        "corner roller",
        "inside corner roller",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "corner_roller",
      "sizeLabel": "AT043A",
      "sortKey": 15.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT017",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech CAA-TT Corner Applicator Adapter for FHTT/XHTT Support Handle - [AT017]",
      "description": "Corner Applicator Adapter (CAA-TT)",
      "price": 50.0,
      "regularPrice": 50.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT017",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT017",
        "Automatic Taping Tools",
        "CAA-TT",
        "CAATT",
        "TapeTech",
        "accessory",
        "adaptor",
        "semi automatic",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "filler_adapter",
      "sizeLabel": "AT017",
      "sortKey": 17.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT018",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech CFA-TT Corner Finisher Adapter for FHTT/XHTT Support Handle - [AT018]",
      "description": "Corner Finisher Adapter (CFA-TT)",
      "price": 55.0,
      "regularPrice": 55.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT018",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT018",
        "Automatic Taping Tools",
        "CFA-TT",
        "CFATT",
        "TapeTech",
        "accessory",
        "adaptor",
        "semi automatic",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "filler_adapter",
      "sizeLabel": "AT018",
      "sortKey": 18.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT019",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech NSA-TT Nail Spotter Adapter for FHTT/XHTT Support Handle - [AT019]",
      "description": "Nail Spotter Adapter (NSA-TT)",
      "price": 52.0,
      "regularPrice": 52.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT019",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT019",
        "Automatic Taping Tools",
        "NSA-TT",
        "NSATT",
        "TapeTech",
        "accessory",
        "adaptor",
        "semi automatic",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "filler_adapter",
      "sizeLabel": "AT019",
      "sortKey": 19.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT071",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech 90T Filler Adapter - [AT071]",
      "description": "The TapeTech 90T Filler Adapter attaches to the TapeTech 72TT, 73TT or 76TT EasyClean® Pumps to fill Corner Applicators, Nail Spotters and EasyClean®, EasyClean® MAXXBOX® or Power Assist® Finishing boxes with joint compound. Use with gasket 700049 (for 72TT or 73TT only - not included).",
      "price": 88.0,
      "regularPrice": 88.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT071",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "90T",
        "AT071",
        "Automatic Taping Tools",
        "TapeTech",
        "box filler",
        "boxfiller",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "filler_adapter",
      "sizeLabel": "AT071",
      "sortKey": 90.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PFKHATT",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Finishing Knife Handle Adapter - [PFKHATT]",
      "description": "The Finishing Knife Handle adapter is more robust, provides quick angle adjustment and improved durability. The Handle Adapter quickly and securely attaches to the TapeTech FHTT or XHTT Support handles. No need to buy another handle for your smoothing knives. The D-Shape fitting prevents twisting. This handle adapte...",
      "price": 16.0,
      "regularPrice": 16.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PFKHATT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "PFKHATT",
        "TapeTech",
        "Taping & Finishing Tools",
        "adaptor",
        "adaptor for pole",
        "blade",
        "finishing blade",
        "finishing blade adaptor",
        "finishing blades",
        "skim blade",
        "skimming blades",
        "smoothing blade",
        "tape tech",
        "wiping blade"
      ],
      "attributes": [],
      "optionGroup": "filler_adapter",
      "sizeLabel": "PFKHATT",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PIP857355",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Gooseneck Cleaning Brush - [PIP857355]",
      "description": "The TapeTech Gooseneck Cleaning Brush is specifically designed to keep the gooseneck clean for optimal operation. The brush is the ideal stiffness to effectively remove the compound while the shaft has the flexibility to navigate the challenging shape of the gooseneck adapter.",
      "price": 36.0,
      "regularPrice": 36.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PIP857355",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "857355",
        "Automatic Taping Tools",
        "PIP857355",
        "TapeTech",
        "accessory"
      ],
      "attributes": [],
      "optionGroup": "filler_adapter",
      "sizeLabel": "PIP857355",
      "sortKey": 857355.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT027",
      "parentSku": "TT-TAPETECH-POWER-ASSIST-MAXXBOX-FLAT-BOX-W-EASYROLL-WHEELS",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Power Assist® MAXXBOX® Flat Box w/EasyRoll Wheels - [AT027]",
      "description": "Introducing the new Power Assist® MAXXBOX® finishing boxes from TapeTech®. Now you can have the extra capacity you want with half the effort required from other high capacity finishing boxes. Featuring the same smart design that matches the usable capacity to the application, the Power Assist® MAXXBOX® is sure to be...",
      "price": 507.0,
      "regularPrice": 507.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT027",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT027",
        "AT028",
        "AT029",
        "Automatic Taping Tools",
        "PAHC07",
        "PAHC10",
        "PAHC12",
        "TapeTech",
        "auto box",
        "auto flat",
        "auto flat box",
        "automatic",
        "automatic flat box",
        "flat box",
        "flatbox",
        "power assist",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "7\" (PAHC07)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 7\" (PAHC07)",
      "sortKey": 27.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT028",
      "parentSku": "TT-TAPETECH-POWER-ASSIST-MAXXBOX-FLAT-BOX-W-EASYROLL-WHEELS",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Power Assist® MAXXBOX® Flat Box w/EasyRoll Wheels - [AT028]",
      "description": "Introducing the new Power Assist® MAXXBOX® finishing boxes from TapeTech®. Now you can have the extra capacity you want with half the effort required from other high capacity finishing boxes. Featuring the same smart design that matches the usable capacity to the application, the Power Assist® MAXXBOX® is sure to be...",
      "price": 518.0,
      "regularPrice": 518.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT028",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT027",
        "AT028",
        "AT029",
        "Automatic Taping Tools",
        "PAHC07",
        "PAHC10",
        "PAHC12",
        "TapeTech",
        "auto box",
        "auto flat",
        "auto flat box",
        "automatic",
        "automatic flat box",
        "flat box",
        "flatbox",
        "power assist",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\" (PAHC10)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 10\" (PAHC10)",
      "sortKey": 28.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT029",
      "parentSku": "TT-TAPETECH-POWER-ASSIST-MAXXBOX-FLAT-BOX-W-EASYROLL-WHEELS",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Power Assist® MAXXBOX® Flat Box w/EasyRoll Wheels - [AT029]",
      "description": "Introducing the new Power Assist® MAXXBOX® finishing boxes from TapeTech®. Now you can have the extra capacity you want with half the effort required from other high capacity finishing boxes. Featuring the same smart design that matches the usable capacity to the application, the Power Assist® MAXXBOX® is sure to be...",
      "price": 529.0,
      "regularPrice": 529.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT029",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT027",
        "AT028",
        "AT029",
        "Automatic Taping Tools",
        "PAHC07",
        "PAHC10",
        "PAHC12",
        "TapeTech",
        "auto box",
        "auto flat",
        "auto flat box",
        "automatic",
        "automatic flat box",
        "flat box",
        "flatbox",
        "power assist",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\" (PAHC12)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 12\" (PAHC12)",
      "sortKey": 29.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT030",
      "parentSku": "TT-TAPETECH-MAXXBOX-R-EXTRA-HIGH-CAPACITY-FLAT-BOXES-W-EASYROLL-WHEELS",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech MAXXBOX® Extra High Capacity Flat Boxes w/EasyRoll Wheels - [AT030]",
      "description": "Introducing the first high capacity finishing boxes designed to hold the right amount of joint compound when you really need it – on the first or second coat when you’re filling the joint – without the unnecessary weight when you don’t need it – on the finish coat. The NEW TapeTech MAXXBOX® Finishing Boxes are desig...",
      "price": 463.0,
      "regularPrice": 463.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT030",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT030",
        "AT031",
        "AT032",
        "Automatic Taping Tools",
        "EHC07",
        "EHC10",
        "EHC12",
        "TapeTech",
        "finishing box",
        "flat box",
        "flatbox",
        "maxx box",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "7\" (EHC07)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 7\" (EHC07)",
      "sortKey": 30.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT031",
      "parentSku": "TT-TAPETECH-MAXXBOX-R-EXTRA-HIGH-CAPACITY-FLAT-BOXES-W-EASYROLL-WHEELS",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech MAXXBOX® Extra High Capacity Flat Boxes w/EasyRoll Wheels - [AT031]",
      "description": "Introducing the first high capacity finishing boxes designed to hold the right amount of joint compound when you really need it – on the first or second coat when you’re filling the joint – without the unnecessary weight when you don’t need it – on the finish coat. The NEW TapeTech MAXXBOX® Finishing Boxes are desig...",
      "price": 463.0,
      "regularPrice": 463.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT031",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT030",
        "AT031",
        "AT032",
        "Automatic Taping Tools",
        "EHC07",
        "EHC10",
        "EHC12",
        "TapeTech",
        "finishing box",
        "flat box",
        "flatbox",
        "maxx box",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\" (EHC10)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 10\" (EHC10)",
      "sortKey": 31.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT032",
      "parentSku": "TT-TAPETECH-MAXXBOX-R-EXTRA-HIGH-CAPACITY-FLAT-BOXES-W-EASYROLL-WHEELS",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech MAXXBOX® Extra High Capacity Flat Boxes w/EasyRoll Wheels - [AT032]",
      "description": "Introducing the first high capacity finishing boxes designed to hold the right amount of joint compound when you really need it – on the first or second coat when you’re filling the joint – without the unnecessary weight when you don’t need it – on the finish coat. The NEW TapeTech MAXXBOX® Finishing Boxes are desig...",
      "price": 490.0,
      "regularPrice": 490.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT032",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT030",
        "AT031",
        "AT032",
        "Automatic Taping Tools",
        "EHC07",
        "EHC10",
        "EHC12",
        "TapeTech",
        "finishing box",
        "flat box",
        "flatbox",
        "maxx box",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\" (EHC12)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 12\" (EHC12)",
      "sortKey": 32.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT046EZ",
      "parentSku": "TT-TAPETECH-EASYCLEAN-FINISHING-BOX-W-EASYROLL-WHEELS",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech EasyClean Finishing Box w/ EasyRoll Wheels - [AT046EZ]",
      "description": "The TapeTech EasyClean® Finishing Box automatically dispenses the proper amount of joint compound and feathers the edges of butt joints and flat joints in one pass. The EasyClean Finishing Box helps produce professional results every time. The adjustable crown setting dial allows the user to easily adjust the amount...",
      "price": 418.0,
      "regularPrice": 418.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT046EZ",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT046EZ",
        "AT049EZ",
        "AT052EZ",
        "AT053EZ",
        "Automatic Taping Tools",
        "EZ07TT",
        "EZ10TT",
        "EZ12TT",
        "EZ15TT",
        "TapeTech",
        "automatic taping tools",
        "flat box",
        "flatbox",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "7\" (EZ07TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 7\" (EZ07TT)",
      "sortKey": 46.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT049EZ",
      "parentSku": "TT-TAPETECH-EASYCLEAN-FINISHING-BOX-W-EASYROLL-WHEELS",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech EasyClean Finishing Box w/ EasyRoll Wheels - [AT049EZ]",
      "description": "The TapeTech EasyClean® Finishing Box automatically dispenses the proper amount of joint compound and feathers the edges of butt joints and flat joints in one pass. The EasyClean Finishing Box helps produce professional results every time. The adjustable crown setting dial allows the user to easily adjust the amount...",
      "price": 429.0,
      "regularPrice": 429.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT049EZ",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT046EZ",
        "AT049EZ",
        "AT052EZ",
        "AT053EZ",
        "Automatic Taping Tools",
        "EZ07TT",
        "EZ10TT",
        "EZ12TT",
        "EZ15TT",
        "TapeTech",
        "automatic taping tools",
        "flat box",
        "flatbox",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\" (EZ10TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 10\" (EZ10TT)",
      "sortKey": 49.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT052EZ",
      "parentSku": "TT-TAPETECH-EASYCLEAN-FINISHING-BOX-W-EASYROLL-WHEELS",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech EasyClean Finishing Box w/ EasyRoll Wheels - [AT052EZ]",
      "description": "The TapeTech EasyClean® Finishing Box automatically dispenses the proper amount of joint compound and feathers the edges of butt joints and flat joints in one pass. The EasyClean Finishing Box helps produce professional results every time. The adjustable crown setting dial allows the user to easily adjust the amount...",
      "price": 440.0,
      "regularPrice": 440.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT052EZ",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT046EZ",
        "AT049EZ",
        "AT052EZ",
        "AT053EZ",
        "Automatic Taping Tools",
        "EZ07TT",
        "EZ10TT",
        "EZ12TT",
        "EZ15TT",
        "TapeTech",
        "automatic taping tools",
        "flat box",
        "flatbox",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\" (EZ12TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 12\" (EZ12TT)",
      "sortKey": 52.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT053EZ",
      "parentSku": "TT-TAPETECH-EASYCLEAN-FINISHING-BOX-W-EASYROLL-WHEELS",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech EasyClean Finishing Box w/ EasyRoll Wheels - [AT053EZ]",
      "description": "The TapeTech EasyClean® Finishing Box automatically dispenses the proper amount of joint compound and feathers the edges of butt joints and flat joints in one pass. The EasyClean Finishing Box helps produce professional results every time. The adjustable crown setting dial allows the user to easily adjust the amount...",
      "price": 474.0,
      "regularPrice": 474.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT053EZ",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT046EZ",
        "AT049EZ",
        "AT052EZ",
        "AT053EZ",
        "Automatic Taping Tools",
        "EZ07TT",
        "EZ10TT",
        "EZ12TT",
        "EZ15TT",
        "TapeTech",
        "automatic taping tools",
        "flat box",
        "flatbox",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "15\" (EZ15TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box",
      "sizeLabel": "Size: 15\" (EZ15TT)",
      "sortKey": 53.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "BH",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Brakeless Box Handle (Fixed Length) - 34\" - [BH]",
      "description": "The new TapeTech brakeless finishing box handles – Models BH ad BHE – are perfect for both new or experienced ATF tool users. The friction brake design eliminates the need for new users to learn how and when to properly apply the brake found on traditional finishing box handles. There is no learning curve! And for e...",
      "price": 165.0,
      "regularPrice": 165.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "BH",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "BH",
        "Brakeless",
        "Brakeless Box Handle",
        "Brakeless Handle",
        "TapeTech",
        "flat box handle"
      ],
      "attributes": [],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "BH",
      "sortKey": 34.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "BHE",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Brakeless Box Extendable Handle - 38” - 60” - [BHE]",
      "description": "The new TapeTech brakeless finishing box handles – Models BH ad BHE – are perfect for both new or experienced ATF tool users. The friction brake design eliminates the need for new users to learn how and when to properly apply the brake found on traditional finishing box handles. There is no learning curve! And for e...",
      "price": 330.0,
      "regularPrice": 330.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "BHE",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "BHE",
        "Brakeless",
        "Brakeless Box Handle",
        "Brakeless Handle",
        "TapeTech",
        "flat box handle"
      ],
      "attributes": [],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "BHE",
      "sortKey": 38.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TTCASE46H",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech 46” Hard Utility Case - [TTCASE46H]",
      "description": "46″ hard case used to carry tools and accessories. Case is waterproof and lockable. Will handle up to 5 premium finishing knives in various lengths. Will also carry a complete box set with 10″ and 12″ finishing box, 2 handles, filler adapter and pump.",
      "price": 158.0,
      "regularPrice": 158.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TTCASE46H",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "Semi Automatic Taping Tools",
        "TTCASE46H",
        "TapeTech",
        "hard case",
        "semi automatic",
        "tool case"
      ],
      "attributes": [],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "TTCASE46H",
      "sortKey": 46.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT064",
      "parentSku": "TT-TAPETECH-FINISHING-BOX-HANDLES-FIXED-LENGTH",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Finishing Box Handles (Fixed Length) - [AT064]",
      "description": "The TapeTech Finishing Box Handles attach to the TapeTech EasyClean®, MAXXBOX® or Power Assist® Finishing Boxes and provide control to cleanly sweep the boxes off the joint for a perfect finish.",
      "price": 253.0,
      "regularPrice": 253.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT064",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "8034TT",
        "8042TT",
        "8054TT",
        "8072TT",
        "AT064",
        "AT065",
        "AT066",
        "AT067",
        "Automatic Taping Tools",
        "TapeTech",
        "flat box handle",
        "flatbox handle",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Handle Length",
          "value": "34\" (8034TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "Handle Length: 34\" (8034TT)",
      "sortKey": 64.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT065",
      "parentSku": "TT-TAPETECH-FINISHING-BOX-HANDLES-FIXED-LENGTH",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Finishing Box Handles (Fixed Length) - [AT065]",
      "description": "The TapeTech Finishing Box Handles attach to the TapeTech EasyClean®, MAXXBOX® or Power Assist® Finishing Boxes and provide control to cleanly sweep the boxes off the joint for a perfect finish.",
      "price": 259.0,
      "regularPrice": 259.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT065",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "8034TT",
        "8042TT",
        "8054TT",
        "8072TT",
        "AT064",
        "AT065",
        "AT066",
        "AT067",
        "Automatic Taping Tools",
        "TapeTech",
        "flat box handle",
        "flatbox handle",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Handle Length",
          "value": "42\" (8042TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "Handle Length: 42\" (8042TT)",
      "sortKey": 65.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT066",
      "parentSku": "TT-TAPETECH-FINISHING-BOX-HANDLES-FIXED-LENGTH",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Finishing Box Handles (Fixed Length) - [AT066]",
      "description": "The TapeTech Finishing Box Handles attach to the TapeTech EasyClean®, MAXXBOX® or Power Assist® Finishing Boxes and provide control to cleanly sweep the boxes off the joint for a perfect finish.",
      "price": 264.0,
      "regularPrice": 264.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT066",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "8034TT",
        "8042TT",
        "8054TT",
        "8072TT",
        "AT064",
        "AT065",
        "AT066",
        "AT067",
        "Automatic Taping Tools",
        "TapeTech",
        "flat box handle",
        "flatbox handle",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Handle Length",
          "value": "54\" (8054TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "Handle Length: 54\" (8054TT)",
      "sortKey": 66.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT067",
      "parentSku": "TT-TAPETECH-FINISHING-BOX-HANDLES-FIXED-LENGTH",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Finishing Box Handles (Fixed Length) - [AT067]",
      "description": "The TapeTech Finishing Box Handles attach to the TapeTech EasyClean®, MAXXBOX® or Power Assist® Finishing Boxes and provide control to cleanly sweep the boxes off the joint for a perfect finish.",
      "price": 275.0,
      "regularPrice": 275.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT067",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "8034TT",
        "8042TT",
        "8054TT",
        "8072TT",
        "AT064",
        "AT065",
        "AT066",
        "AT067",
        "Automatic Taping Tools",
        "TapeTech",
        "flat box handle",
        "flatbox handle",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Handle Length",
          "value": "72\" (8072TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "Handle Length: 72\" (8072TT)",
      "sortKey": 67.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT069",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech 88TTE Box XTender™ Handle - [AT069]",
      "description": "The TapeTech XTender® Finishing Box Handle attaches to the EasyClean®, EasyClean® High Capacity or Power Assist® Finishing Boxes and provides control to cleanly sweep the boxes off the joint for a perfect finish. The XTender® is the strongest extendable finishing box handle and the industry and adjusts from 41\" to 6...",
      "price": 417.0,
      "regularPrice": 417.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "AT069",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "88TTE",
        "AT069",
        "Automatic Taping Tools",
        "TapeTech",
        "flat box handle",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "AT069",
      "sortKey": 88.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT130A",
      "parentSku": "TT-TAPETECH-WIZARD-R-FINISHING-BOX-HANDLE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Wizard® Finishing Box Handle - [AT130A]",
      "description": "The new model 8000TT Wizard® handle from TapeTech provides unmatched control, maximum access and eliminates the learning curve of using traditional finishing box brake handles. The Wizard is the only finishing box handle that places your hand directly over the pressure plate, reducing the effort required while provi...",
      "price": 121.0,
      "regularPrice": 121.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT130A",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "8000TT",
        "8000TT-PA",
        "AT130",
        "AT130A",
        "Automatic Taping Tools",
        "TapeTech",
        "flat box handle",
        "flatbox handle",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "Wizard® Handle for Power Assist® (8000TT-PA)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "Type: Wizard® Handle for Power Assist® (8000TT-PA)",
      "sortKey": 130.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT130",
      "parentSku": "TT-TAPETECH-WIZARD-R-FINISHING-BOX-HANDLE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Wizard® Finishing Box Handle - [AT130]",
      "description": "The new model 8000TT Wizard® handle from TapeTech provides unmatched control, maximum access and eliminates the learning curve of using traditional finishing box brake handles. The Wizard is the only finishing box handle that places your hand directly over the pressure plate, reducing the effort required while provi...",
      "price": 121.0,
      "regularPrice": 121.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT130",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "8000TT",
        "8000TT-PA",
        "AT130",
        "AT130A",
        "Automatic Taping Tools",
        "TapeTech",
        "flat box handle",
        "flatbox handle",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "Wizard® Compact Finishing Box Handle (8000TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "flat_box_handle",
      "sizeLabel": "Type: Wizard® Compact Finishing Box Handle (8000TT)",
      "sortKey": 130.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "HWK001-PS",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Aluminum Hawk - [HWK001-PS]",
      "description": "Professional Grade ultra-light aluminum Hawk with 1.75mm tray features milled grooves to prevent slippage of compound, plaster, EIFS material or stucco. Rubber cushion under tray provides comfort and prevents abrasions. Features the ergonomic TapeTech ProSoft grip for all-day comfort and reduced fatigue.",
      "price": 36.0,
      "regularPrice": 36.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "HWK001-PS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "HWK001-PS",
        "TapeTech",
        "Taping & Finishing Tools",
        "hawk"
      ],
      "attributes": [],
      "optionGroup": "hand_tool",
      "sizeLabel": "HWK001-PS",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "JK01SSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-STAINLESS-STEEL-JOINT-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Stainless Steel Joint Knife - [JK01SSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 9.0,
      "regularPrice": 9.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "JK01SSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "JK01SSTT",
        "JK02SSTT",
        "JK03SSTT",
        "JK04SSTT",
        "JK05SSTT",
        "JK06SSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "1\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 1\"",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "JK02SSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-STAINLESS-STEEL-JOINT-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Stainless Steel Joint Knife - [JK02SSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 10.0,
      "regularPrice": 10.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "JK02SSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "JK01SSTT",
        "JK02SSTT",
        "JK03SSTT",
        "JK04SSTT",
        "JK05SSTT",
        "JK06SSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "2\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 2\"",
      "sortKey": 2.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "JK03SSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-STAINLESS-STEEL-JOINT-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Stainless Steel Joint Knife - [JK03SSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 11.0,
      "regularPrice": 11.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "JK03SSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "JK01SSTT",
        "JK02SSTT",
        "JK03SSTT",
        "JK04SSTT",
        "JK05SSTT",
        "JK06SSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 3\"",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "JK04CSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-CARBON-STEEL-JOINT-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Carbon Steel Joint Knife - [JK04CSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 11.0,
      "regularPrice": 11.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "JK04CSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "JK04CSTT",
        "JK05CSTT",
        "JK06CSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4\"",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "JK04SSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-STAINLESS-STEEL-JOINT-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Stainless Steel Joint Knife - [JK04SSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 12.0,
      "regularPrice": 12.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "JK04SSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "JK01SSTT",
        "JK02SSTT",
        "JK03SSTT",
        "JK04SSTT",
        "JK05SSTT",
        "JK06SSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 4\"",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "JK05CSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-CARBON-STEEL-JOINT-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Carbon Steel Joint Knife - [JK05CSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 12.0,
      "regularPrice": 12.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "JK05CSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "JK04CSTT",
        "JK05CSTT",
        "JK06CSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 5\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "JK05SSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-STAINLESS-STEEL-JOINT-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Stainless Steel Joint Knife - [JK05SSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 13.0,
      "regularPrice": 13.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "JK05SSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "JK01SSTT",
        "JK02SSTT",
        "JK03SSTT",
        "JK04SSTT",
        "JK05SSTT",
        "JK06SSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "5\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 5\"",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "JK06CSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-CARBON-STEEL-JOINT-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Carbon Steel Joint Knife - [JK06CSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 13.0,
      "regularPrice": 13.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "JK06CSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "JK04CSTT",
        "JK05CSTT",
        "JK06CSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "6\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 6\"",
      "sortKey": 6.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CK06CSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-SPECIALTY-KNIVES",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Specialty Knife - [CK06CSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 4.0,
      "regularPrice": 4.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CK06CSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "CK06CSTT",
        "PK35CSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Option",
          "value": "6\" Clipped Knife 30 Degree Angle",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Option: 6\" Clipped Knife 30 Degree Angle",
      "sortKey": 6.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "JK06SSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-STAINLESS-STEEL-JOINT-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Stainless Steel Joint Knife - [JK06SSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 14.0,
      "regularPrice": 14.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "JK06SSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "JK01SSTT",
        "JK02SSTT",
        "JK03SSTT",
        "JK04SSTT",
        "JK05SSTT",
        "JK06SSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "6\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 6\"",
      "sortKey": 6.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TK08BSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-BLUE-STEEL-TAPING-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Blue Steel Taping Knife - [TK08BSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 9.0,
      "regularPrice": 9.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "TK08BSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TK08BSTT",
        "TK10BSTT",
        "TK12BSTT",
        "TK14BSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 8\"",
      "sortKey": 8.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TK08SSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-STAINLESS-STEEL-TAPING-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Stainless Steel Taping Knife - [TK08SSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 11.0,
      "regularPrice": 11.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TK08SSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TK08SSTT",
        "TK10SSTT",
        "TK12SSTT",
        "TK14SSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 8\"",
      "sortKey": 8.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TK10BSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-BLUE-STEEL-TAPING-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Blue Steel Taping Knife - [TK10BSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 10.0,
      "regularPrice": 10.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "TK10BSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TK08BSTT",
        "TK10BSTT",
        "TK12BSTT",
        "TK14BSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 10\"",
      "sortKey": 10.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TK10SSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-STAINLESS-STEEL-TAPING-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Stainless Steel Taping Knife - [TK10SSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 12.0,
      "regularPrice": 12.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "TK10SSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TK08SSTT",
        "TK10SSTT",
        "TK12SSTT",
        "TK14SSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 10\"",
      "sortKey": 10.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TK12BSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-BLUE-STEEL-TAPING-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Blue Steel Taping Knife - [TK12BSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 11.0,
      "regularPrice": 11.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "TK12BSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TK08BSTT",
        "TK10BSTT",
        "TK12BSTT",
        "TK14BSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\"",
      "sortKey": 12.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TK12SSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-STAINLESS-STEEL-TAPING-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Stainless Steel Taping Knife - [TK12SSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 13.0,
      "regularPrice": 13.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TK12SSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TK08SSTT",
        "TK10SSTT",
        "TK12SSTT",
        "TK14SSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\"",
      "sortKey": 12.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "MP12TT",
      "parentSku": "TT-TAPETECH-STAINLESS-STEEL-MUD-PAN",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Stainless Steel Mud Pan - [MP12TT]",
      "description": "TapeTech Premium Mud Pans feature stainless steel construction and a contoured bottom to make mixing, cleaning and removal of joint compound easier. The contoured shape is more ergonomic and comfortable to hold. The continuous heli-arc weld provides maximum durability and value.",
      "price": 16.0,
      "regularPrice": 16.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "MP12TT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "MP12TT",
        "MP14TT",
        "TapeTech",
        "Taping & Finishing Tools",
        "mud pan"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\"",
      "sortKey": 12.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TK14BSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-BLUE-STEEL-TAPING-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Blue Steel Taping Knife - [TK14BSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 11.0,
      "regularPrice": 11.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TK14BSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TK08BSTT",
        "TK10BSTT",
        "TK12BSTT",
        "TK14BSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\"",
      "sortKey": 14.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TK14SSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-STAINLESS-STEEL-TAPING-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Stainless Steel Taping Knife - [TK14SSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 14.0,
      "regularPrice": 14.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TK14SSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TK08SSTT",
        "TK10SSTT",
        "TK12SSTT",
        "TK14SSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\"",
      "sortKey": 14.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "MP14TT",
      "parentSku": "TT-TAPETECH-STAINLESS-STEEL-MUD-PAN",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Stainless Steel Mud Pan - [MP14TT]",
      "description": "TapeTech Premium Mud Pans feature stainless steel construction and a contoured bottom to make mixing, cleaning and removal of joint compound easier. The contoured shape is more ergonomic and comfortable to hold. The continuous heli-arc weld provides maximum durability and value.",
      "price": 17.0,
      "regularPrice": 17.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "MP14TT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "MP12TT",
        "MP14TT",
        "TapeTech",
        "Taping & Finishing Tools",
        "mud pan"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\"",
      "sortKey": 14.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PK35CSTT",
      "parentSku": "TT-TAPETECH-PREMIUM-SPECIALTY-KNIVES",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Specialty Knife - [PK35CSTT]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 5.0,
      "regularPrice": 5.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PK35CSTT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "CK06CSTT",
        "PK35CSTT",
        "TapeTech",
        "Taping & Finishing Tools",
        "joint knife",
        "taping knife"
      ],
      "attributes": [
        {
          "name": "Option",
          "value": "3.5\" Pointed Knife",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Option: 3.5\" Pointed Knife",
      "sortKey": 35.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT141",
      "parentSku": "TT-TAPETECH-PREMIUM-FINISHING-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Finishing Knife (New Style) - [AT141]",
      "description": "TapeTech premium knives are the Gold Standard for premium wipe-down and finishing knives. Featuring advanced engineering and the highest grade INOX German stainless steel, TapeTech knives produce the absolute best finish in the industry. The secret is the strong but flexible INOX blade and the precise fulcrum point...",
      "price": 19.0,
      "regularPrice": 19.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT141",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "AT141",
        "AT142",
        "AT143",
        "AT144",
        "AT145",
        "AT146",
        "AT147",
        "AT148",
        "BX07TT",
        "BX10TT",
        "BX14TT",
        "BX18TT",
        "BX24TT",
        "BX32TT",
        "BX40TT",
        "BX48TT",
        "PFK07TT",
        "PFK10TT",
        "PFK14TT",
        "PFK18TT",
        "PFK24TT",
        "PFK32TT",
        "PFK40TT",
        "PFK48TT",
        "TapeTech",
        "Taping & Finishing Tools",
        "skimming blade",
        "smoothing blade",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "7\" (PFK07TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 7\" (PFK07TT)",
      "sortKey": 141.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT142",
      "parentSku": "TT-TAPETECH-PREMIUM-FINISHING-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Finishing Knife (New Style) - [AT142]",
      "description": "TapeTech premium knives are the Gold Standard for premium wipe-down and finishing knives. Featuring advanced engineering and the highest grade INOX German stainless steel, TapeTech knives produce the absolute best finish in the industry. The secret is the strong but flexible INOX blade and the precise fulcrum point...",
      "price": 35.0,
      "regularPrice": 35.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT142",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "AT141",
        "AT142",
        "AT143",
        "AT144",
        "AT145",
        "AT146",
        "AT147",
        "AT148",
        "BX07TT",
        "BX10TT",
        "BX14TT",
        "BX18TT",
        "BX24TT",
        "BX32TT",
        "BX40TT",
        "BX48TT",
        "PFK07TT",
        "PFK10TT",
        "PFK14TT",
        "PFK18TT",
        "PFK24TT",
        "PFK32TT",
        "PFK40TT",
        "PFK48TT",
        "TapeTech",
        "Taping & Finishing Tools",
        "skimming blade",
        "smoothing blade",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\" (PFK14TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\" (PFK14TT)",
      "sortKey": 142.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT143",
      "parentSku": "TT-TAPETECH-PREMIUM-FINISHING-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Finishing Knife (New Style) - [AT143]",
      "description": "TapeTech premium knives are the Gold Standard for premium wipe-down and finishing knives. Featuring advanced engineering and the highest grade INOX German stainless steel, TapeTech knives produce the absolute best finish in the industry. The secret is the strong but flexible INOX blade and the precise fulcrum point...",
      "price": 44.0,
      "regularPrice": 44.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT143",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "AT141",
        "AT142",
        "AT143",
        "AT144",
        "AT145",
        "AT146",
        "AT147",
        "AT148",
        "BX07TT",
        "BX10TT",
        "BX14TT",
        "BX18TT",
        "BX24TT",
        "BX32TT",
        "BX40TT",
        "BX48TT",
        "PFK07TT",
        "PFK10TT",
        "PFK14TT",
        "PFK18TT",
        "PFK24TT",
        "PFK32TT",
        "PFK40TT",
        "PFK48TT",
        "TapeTech",
        "Taping & Finishing Tools",
        "skimming blade",
        "smoothing blade",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "18\" (PFK18TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 18\" (PFK18TT)",
      "sortKey": 143.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT144",
      "parentSku": "TT-TAPETECH-PREMIUM-FINISHING-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Finishing Knife (New Style) - [AT144]",
      "description": "TapeTech premium knives are the Gold Standard for premium wipe-down and finishing knives. Featuring advanced engineering and the highest grade INOX German stainless steel, TapeTech knives produce the absolute best finish in the industry. The secret is the strong but flexible INOX blade and the precise fulcrum point...",
      "price": 60.0,
      "regularPrice": 60.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT144",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "AT141",
        "AT142",
        "AT143",
        "AT144",
        "AT145",
        "AT146",
        "AT147",
        "AT148",
        "BX07TT",
        "BX10TT",
        "BX14TT",
        "BX18TT",
        "BX24TT",
        "BX32TT",
        "BX40TT",
        "BX48TT",
        "PFK07TT",
        "PFK10TT",
        "PFK14TT",
        "PFK18TT",
        "PFK24TT",
        "PFK32TT",
        "PFK40TT",
        "PFK48TT",
        "TapeTech",
        "Taping & Finishing Tools",
        "skimming blade",
        "smoothing blade",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "24\" (PFK24TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 24\" (PFK24TT)",
      "sortKey": 144.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT145",
      "parentSku": "TT-TAPETECH-PREMIUM-FINISHING-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Finishing Knife (New Style) - [AT145]",
      "description": "TapeTech premium knives are the Gold Standard for premium wipe-down and finishing knives. Featuring advanced engineering and the highest grade INOX German stainless steel, TapeTech knives produce the absolute best finish in the industry. The secret is the strong but flexible INOX blade and the precise fulcrum point...",
      "price": 79.0,
      "regularPrice": 79.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT145",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "AT141",
        "AT142",
        "AT143",
        "AT144",
        "AT145",
        "AT146",
        "AT147",
        "AT148",
        "BX07TT",
        "BX10TT",
        "BX14TT",
        "BX18TT",
        "BX24TT",
        "BX32TT",
        "BX40TT",
        "BX48TT",
        "PFK07TT",
        "PFK10TT",
        "PFK14TT",
        "PFK18TT",
        "PFK24TT",
        "PFK32TT",
        "PFK40TT",
        "PFK48TT",
        "TapeTech",
        "Taping & Finishing Tools",
        "skimming blade",
        "smoothing blade",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "32\" (PFK32TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 32\" (PFK32TT)",
      "sortKey": 145.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT146",
      "parentSku": "TT-TAPETECH-PREMIUM-FINISHING-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Finishing Knife (New Style) - [AT146]",
      "description": "TapeTech premium knives are the Gold Standard for premium wipe-down and finishing knives. Featuring advanced engineering and the highest grade INOX German stainless steel, TapeTech knives produce the absolute best finish in the industry. The secret is the strong but flexible INOX blade and the precise fulcrum point...",
      "price": 114.0,
      "regularPrice": 114.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT146",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "AT141",
        "AT142",
        "AT143",
        "AT144",
        "AT145",
        "AT146",
        "AT147",
        "AT148",
        "BX07TT",
        "BX10TT",
        "BX14TT",
        "BX18TT",
        "BX24TT",
        "BX32TT",
        "BX40TT",
        "BX48TT",
        "PFK07TT",
        "PFK10TT",
        "PFK14TT",
        "PFK18TT",
        "PFK24TT",
        "PFK32TT",
        "PFK40TT",
        "PFK48TT",
        "TapeTech",
        "Taping & Finishing Tools",
        "skimming blade",
        "smoothing blade",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "48\" (PFK48TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 48\" (PFK48TT)",
      "sortKey": 146.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT147",
      "parentSku": "TT-TAPETECH-PREMIUM-FINISHING-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Finishing Knife (New Style) - [AT147]",
      "description": "TapeTech premium knives are the Gold Standard for premium wipe-down and finishing knives. Featuring advanced engineering and the highest grade INOX German stainless steel, TapeTech knives produce the absolute best finish in the industry. The secret is the strong but flexible INOX blade and the precise fulcrum point...",
      "price": 29.0,
      "regularPrice": 29.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT147",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "AT141",
        "AT142",
        "AT143",
        "AT144",
        "AT145",
        "AT146",
        "AT147",
        "AT148",
        "BX07TT",
        "BX10TT",
        "BX14TT",
        "BX18TT",
        "BX24TT",
        "BX32TT",
        "BX40TT",
        "BX48TT",
        "PFK07TT",
        "PFK10TT",
        "PFK14TT",
        "PFK18TT",
        "PFK24TT",
        "PFK32TT",
        "PFK40TT",
        "PFK48TT",
        "TapeTech",
        "Taping & Finishing Tools",
        "skimming blade",
        "smoothing blade",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\" (PFK12TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\" (PFK12TT)",
      "sortKey": 147.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT148",
      "parentSku": "TT-TAPETECH-PREMIUM-FINISHING-KNIFE",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Finishing Knife (New Style) - [AT148]",
      "description": "TapeTech premium knives are the Gold Standard for premium wipe-down and finishing knives. Featuring advanced engineering and the highest grade INOX German stainless steel, TapeTech knives produce the absolute best finish in the industry. The secret is the strong but flexible INOX blade and the precise fulcrum point...",
      "price": 97.0,
      "regularPrice": 97.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT148",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "AT141",
        "AT142",
        "AT143",
        "AT144",
        "AT145",
        "AT146",
        "AT147",
        "AT148",
        "BX07TT",
        "BX10TT",
        "BX14TT",
        "BX18TT",
        "BX24TT",
        "BX32TT",
        "BX40TT",
        "BX48TT",
        "PFK07TT",
        "PFK10TT",
        "PFK14TT",
        "PFK18TT",
        "PFK24TT",
        "PFK32TT",
        "PFK40TT",
        "PFK48TT",
        "TapeTech",
        "Taping & Finishing Tools",
        "skimming blade",
        "smoothing blade",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "40\" (PFK40TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 40\" (PFK40TT)",
      "sortKey": 148.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TTCASE0810TT",
      "parentSku": "TT-TAPETECH-TROWEL-WALLET",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Trowel Wallet - [TTCASE0810TT]",
      "description": "The perfect complement to your trowels. The 600D Poly-Cloth with a PVC backing plate provides the right amount of protection for trowels.",
      "price": 12.0,
      "regularPrice": 12.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TTCASE0810TT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TTCASE0810TT",
        "TTCASE1012TT",
        "TTCASE1214TT",
        "TTCASE1416TT",
        "TTCASE1618TT",
        "TapeTech",
        "Taping & Finishing Tools",
        "accessory",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8\" - 10\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 8\" - 10\"",
      "sortKey": 810.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TTCASE1012TT",
      "parentSku": "TT-TAPETECH-TROWEL-WALLET",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Trowel Wallet - [TTCASE1012TT]",
      "description": "The perfect complement to your trowels. The 600D Poly-Cloth with a PVC backing plate provides the right amount of protection for trowels.",
      "price": 12.0,
      "regularPrice": 12.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TTCASE1012TT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TTCASE0810TT",
        "TTCASE1012TT",
        "TTCASE1214TT",
        "TTCASE1416TT",
        "TTCASE1618TT",
        "TapeTech",
        "Taping & Finishing Tools",
        "accessory",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "10\" - 12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 10\" - 12\"",
      "sortKey": 1012.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TTCASE1214TT",
      "parentSku": "TT-TAPETECH-TROWEL-WALLET",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Trowel Wallet - [TTCASE1214TT]",
      "description": "The perfect complement to your trowels. The 600D Poly-Cloth with a PVC backing plate provides the right amount of protection for trowels.",
      "price": 12.0,
      "regularPrice": 12.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "TTCASE1214TT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TTCASE0810TT",
        "TTCASE1012TT",
        "TTCASE1214TT",
        "TTCASE1416TT",
        "TTCASE1618TT",
        "TapeTech",
        "Taping & Finishing Tools",
        "accessory",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\" - 14\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\" - 14\"",
      "sortKey": 1214.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TTCASE1416TT",
      "parentSku": "TT-TAPETECH-TROWEL-WALLET",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Trowel Wallet - [TTCASE1416TT]",
      "description": "The perfect complement to your trowels. The 600D Poly-Cloth with a PVC backing plate provides the right amount of protection for trowels.",
      "price": 12.0,
      "regularPrice": 12.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TTCASE1416TT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TTCASE0810TT",
        "TTCASE1012TT",
        "TTCASE1214TT",
        "TTCASE1416TT",
        "TTCASE1618TT",
        "TapeTech",
        "Taping & Finishing Tools",
        "accessory",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\" - 16\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\" - 16\"",
      "sortKey": 1416.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TTCASE1618TT",
      "parentSku": "TT-TAPETECH-TROWEL-WALLET",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Trowel Wallet - [TTCASE1618TT]",
      "description": "The perfect complement to your trowels. The 600D Poly-Cloth with a PVC backing plate provides the right amount of protection for trowels.",
      "price": 12.0,
      "regularPrice": 12.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TTCASE1618TT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TTCASE0810TT",
        "TTCASE1012TT",
        "TTCASE1214TT",
        "TTCASE1416TT",
        "TTCASE1618TT",
        "TapeTech",
        "Taping & Finishing Tools",
        "accessory",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "16\"- 18\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 16\"- 18\"",
      "sortKey": 1618.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TG12053-PS",
      "parentSku": "TT-TAPETECH-GOLD-STAINLESS-STEEL-MAXFLEXX-FINISHING-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Gold Stainless Steel MAXFLEXX Finishing Trowel - [TG12053-PS]",
      "description": "Discover the precision and durability of the TapeTech Premium Gold Finishing Trowel, engineered for professional drywall finishers who demand top-tier performance and quality. Built with MAXFLEXX technology, this trowel offers unparalleled flexibility and strength, ensuring a smooth, flawless finish on various surfa...",
      "price": 66.0,
      "regularPrice": 66.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TG12053-PS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TG12053-PS",
        "TG14053-PS",
        "TG16053-PS",
        "TG18053-PS",
        "TapeTech",
        "Taping & Finishing Tools",
        "maxflexx",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\" x 4.3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\" x 4.3\"",
      "sortKey": 12053.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TG12054-PS",
      "parentSku": "TT-TAPETECH-GOLD-STAINLESS-STEEL-MIDFLEXX-FINISHING-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Gold Stainless Steel MIDFLEXX Finishing Trowel - [TG12054-PS]",
      "description": "Discover the precision and durability of the TapeTech Premium Gold Finishing Trowel, engineered for professional drywall finishers who demand top-tier performance and quality. Built with MIDFLEXX technology, this trowel offers unparalleled flexibility and strength, ensuring a smooth, flawless finish on various surfa...",
      "price": 51.0,
      "regularPrice": 51.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TG12054-PS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TG12054-PS",
        "TG14054-PS",
        "TG16054-PS",
        "TG18054-PS",
        "TapeTech",
        "Taping & Finishing Tools",
        "midflexx",
        "stainless steel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\" x 4.7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\" x 4.7\"",
      "sortKey": 12054.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TG14053-PS",
      "parentSku": "TT-TAPETECH-GOLD-STAINLESS-STEEL-MAXFLEXX-FINISHING-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Gold Stainless Steel MAXFLEXX Finishing Trowel - [TG14053-PS]",
      "description": "Discover the precision and durability of the TapeTech Premium Gold Finishing Trowel, engineered for professional drywall finishers who demand top-tier performance and quality. Built with MAXFLEXX technology, this trowel offers unparalleled flexibility and strength, ensuring a smooth, flawless finish on various surfa...",
      "price": 70.0,
      "regularPrice": 70.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TG14053-PS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TG12053-PS",
        "TG14053-PS",
        "TG16053-PS",
        "TG18053-PS",
        "TapeTech",
        "Taping & Finishing Tools",
        "maxflexx",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\" x 4.3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\" x 4.3\"",
      "sortKey": 14053.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TG14054-PS",
      "parentSku": "TT-TAPETECH-GOLD-STAINLESS-STEEL-MIDFLEXX-FINISHING-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Gold Stainless Steel MIDFLEXX Finishing Trowel - [TG14054-PS]",
      "description": "Discover the precision and durability of the TapeTech Premium Gold Finishing Trowel, engineered for professional drywall finishers who demand top-tier performance and quality. Built with MIDFLEXX technology, this trowel offers unparalleled flexibility and strength, ensuring a smooth, flawless finish on various surfa...",
      "price": 57.0,
      "regularPrice": 57.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TG14054-PS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TG12054-PS",
        "TG14054-PS",
        "TG16054-PS",
        "TG18054-PS",
        "TapeTech",
        "Taping & Finishing Tools",
        "midflexx",
        "stainless steel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\" x 4.7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\" x 4.7\"",
      "sortKey": 14054.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TG16053-PS",
      "parentSku": "TT-TAPETECH-GOLD-STAINLESS-STEEL-MAXFLEXX-FINISHING-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Gold Stainless Steel MAXFLEXX Finishing Trowel - [TG16053-PS]",
      "description": "Discover the precision and durability of the TapeTech Premium Gold Finishing Trowel, engineered for professional drywall finishers who demand top-tier performance and quality. Built with MAXFLEXX technology, this trowel offers unparalleled flexibility and strength, ensuring a smooth, flawless finish on various surfa...",
      "price": 74.0,
      "regularPrice": 74.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TG16053-PS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TG12053-PS",
        "TG14053-PS",
        "TG16053-PS",
        "TG18053-PS",
        "TapeTech",
        "Taping & Finishing Tools",
        "maxflexx",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "16\" x 4.3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 16\" x 4.3\"",
      "sortKey": 16053.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TG16054-PS",
      "parentSku": "TT-TAPETECH-GOLD-STAINLESS-STEEL-MIDFLEXX-FINISHING-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Gold Stainless Steel MIDFLEXX Finishing Trowel - [TG16054-PS]",
      "description": "Discover the precision and durability of the TapeTech Premium Gold Finishing Trowel, engineered for professional drywall finishers who demand top-tier performance and quality. Built with MIDFLEXX technology, this trowel offers unparalleled flexibility and strength, ensuring a smooth, flawless finish on various surfa...",
      "price": 60.0,
      "regularPrice": 60.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TG16054-PS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TG12054-PS",
        "TG14054-PS",
        "TG16054-PS",
        "TG18054-PS",
        "TapeTech",
        "Taping & Finishing Tools",
        "midflexx",
        "stainless steel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "16\" x 4.7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 16\" x 4.7\"",
      "sortKey": 16054.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TG18053-PS",
      "parentSku": "TT-TAPETECH-GOLD-STAINLESS-STEEL-MAXFLEXX-FINISHING-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Gold Stainless Steel MAXFLEXX Finishing Trowel - [TG18053-PS]",
      "description": "Discover the precision and durability of the TapeTech Premium Gold Finishing Trowel, engineered for professional drywall finishers who demand top-tier performance and quality. Built with MAXFLEXX technology, this trowel offers unparalleled flexibility and strength, ensuring a smooth, flawless finish on various surfa...",
      "price": 80.0,
      "regularPrice": 80.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TG18053-PS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TG12053-PS",
        "TG14053-PS",
        "TG16053-PS",
        "TG18053-PS",
        "TapeTech",
        "Taping & Finishing Tools",
        "maxflexx",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "18\" x 4.3\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 18\" x 4.3\"",
      "sortKey": 18053.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TG18054-PS",
      "parentSku": "TT-TAPETECH-GOLD-STAINLESS-STEEL-MIDFLEXX-FINISHING-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Gold Stainless Steel MIDFLEXX Finishing Trowel - [TG18054-PS]",
      "description": "Discover the precision and durability of the TapeTech Premium Gold Finishing Trowel, engineered for professional drywall finishers who demand top-tier performance and quality. Built with MIDFLEXX technology, this trowel offers unparalleled flexibility and strength, ensuring a smooth, flawless finish on various surfa...",
      "price": 67.0,
      "regularPrice": 67.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TG18054-PS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TG12054-PS",
        "TG14054-PS",
        "TG16054-PS",
        "TG18054-PS",
        "TapeTech",
        "Taping & Finishing Tools",
        "midflexx",
        "stainless steel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "18\" x 4.7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 18\" x 4.7\"",
      "sortKey": 18054.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TG110565-PS",
      "parentSku": "TT-TAPETECH-GOLD-STAINLESS-STEEL-FLEXX-FINISHING-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Gold Stainless Steel FLEXX Finishing Trowel - [TG110565-PS]",
      "description": "Discover the precision and durability of the TapeTech Premium Gold Finishing Trowel, engineered for professional drywall finishers who demand top-tier performance and quality. Built with FLEXX technology, this trowel offers unparalleled flexibility and strength, ensuring a smooth, flawless finish on various surfaces...",
      "price": 60.0,
      "regularPrice": 60.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TG110565-PS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TG110565-PS",
        "TG120565-PS",
        "TG140565-PS",
        "TG160565-PS",
        "TG180565-PS",
        "TapeTech",
        "Taping & Finishing Tools",
        "flexx",
        "stainless steel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "11\" x 4.7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 11\" x 4.7\"",
      "sortKey": 110565.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TG120565-PS",
      "parentSku": "TT-TAPETECH-GOLD-STAINLESS-STEEL-FLEXX-FINISHING-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Gold Stainless Steel FLEXX Finishing Trowel - [TG120565-PS]",
      "description": "Discover the precision and durability of the TapeTech Premium Gold Finishing Trowel, engineered for professional drywall finishers who demand top-tier performance and quality. Built with FLEXX technology, this trowel offers unparalleled flexibility and strength, ensuring a smooth, flawless finish on various surfaces...",
      "price": 57.0,
      "regularPrice": 57.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TG120565-PS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TG110565-PS",
        "TG120565-PS",
        "TG140565-PS",
        "TG160565-PS",
        "TG180565-PS",
        "TapeTech",
        "Taping & Finishing Tools",
        "flexx",
        "stainless steel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\" x 4.7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\" x 4.7\"",
      "sortKey": 120565.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TGP120565-PS",
      "parentSku": "TT-TAPETECH-PREMIUM-GOLD-FLEXX-ROUNDED-FRONT-POOL-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Gold FLEXX Rounded Front Pool Trowel - [TGP120565-PS]",
      "description": "TapeTech Premium Gold Stainless Steel Pool Trowels are not just for pools! TapeTech Premium Pool Trowels feature two rounded ends, ideal to generate a smooth appearance on curved or flat surfaces, minimizing the number of lines or sweep marks that can occur with square-edged trowels. This makes them a great choice f...",
      "price": 57.0,
      "regularPrice": 57.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TGP120565-PS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TGP120565-PS",
        "TGP140565-PS",
        "TGP160565-PS",
        "TGP180565-PS",
        "TapeTech",
        "Taping & Finishing Tools",
        "flexx",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\" x 4.7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\" x 4.7\"",
      "sortKey": 120565.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TG120565-PSCU",
      "parentSku": "TT-TAPETECH-PREMIUM-GOLD-STAINLESS-STEEL-FLEXX-CURVED-FINISHING-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Gold Stainless Steel FLEXX Curved Finishing Trowel - [TG120565-PSCU]",
      "description": "TapeTech premium curved drywall trowels allow you to professionally feather and taper drywall, EIFS and stucco joints, leaving extra joint compound where you need it most – over butt joints and uneven adjacent gypsum or EPS panels. The triple-hardened stainless steel blades ensure maximum performance, and the ProSof...",
      "price": 67.0,
      "regularPrice": 67.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "TG120565-PSCU",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TG120565-PSCU",
        "TG140565-PSCU",
        "TG160565-PSCU",
        "TG180565-PSCU",
        "TapeTech",
        "Taping & Finishing Tools",
        "flexx",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\" x 4.7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 12\" x 4.7\"",
      "sortKey": 120565.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TG140565-PS",
      "parentSku": "TT-TAPETECH-GOLD-STAINLESS-STEEL-FLEXX-FINISHING-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Gold Stainless Steel FLEXX Finishing Trowel - [TG140565-PS]",
      "description": "Discover the precision and durability of the TapeTech Premium Gold Finishing Trowel, engineered for professional drywall finishers who demand top-tier performance and quality. Built with FLEXX technology, this trowel offers unparalleled flexibility and strength, ensuring a smooth, flawless finish on various surfaces...",
      "price": 60.0,
      "regularPrice": 60.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "TG140565-PS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TG110565-PS",
        "TG120565-PS",
        "TG140565-PS",
        "TG160565-PS",
        "TG180565-PS",
        "TapeTech",
        "Taping & Finishing Tools",
        "flexx",
        "stainless steel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\" x 4.7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\" x 4.7\"",
      "sortKey": 140565.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TGP140565-PS",
      "parentSku": "TT-TAPETECH-PREMIUM-GOLD-FLEXX-ROUNDED-FRONT-POOL-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Gold FLEXX Rounded Front Pool Trowel - [TGP140565-PS]",
      "description": "TapeTech Premium Gold Stainless Steel Pool Trowels are not just for pools! TapeTech Premium Pool Trowels feature two rounded ends, ideal to generate a smooth appearance on curved or flat surfaces, minimizing the number of lines or sweep marks that can occur with square-edged trowels. This makes them a great choice f...",
      "price": 60.0,
      "regularPrice": 60.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TGP140565-PS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TGP120565-PS",
        "TGP140565-PS",
        "TGP160565-PS",
        "TGP180565-PS",
        "TapeTech",
        "Taping & Finishing Tools",
        "flexx",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\" x 4.7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\" x 4.7\"",
      "sortKey": 140565.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TG140565-PSCU",
      "parentSku": "TT-TAPETECH-PREMIUM-GOLD-STAINLESS-STEEL-FLEXX-CURVED-FINISHING-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Gold Stainless Steel FLEXX Curved Finishing Trowel - [TG140565-PSCU]",
      "description": "TapeTech premium curved drywall trowels allow you to professionally feather and taper drywall, EIFS and stucco joints, leaving extra joint compound where you need it most – over butt joints and uneven adjacent gypsum or EPS panels. The triple-hardened stainless steel blades ensure maximum performance, and the ProSof...",
      "price": 71.0,
      "regularPrice": 71.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TG140565-PSCU",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TG120565-PSCU",
        "TG140565-PSCU",
        "TG160565-PSCU",
        "TG180565-PSCU",
        "TapeTech",
        "Taping & Finishing Tools",
        "flexx",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "14\" x 4.7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 14\" x 4.7\"",
      "sortKey": 140565.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TG160565-PS",
      "parentSku": "TT-TAPETECH-GOLD-STAINLESS-STEEL-FLEXX-FINISHING-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Gold Stainless Steel FLEXX Finishing Trowel - [TG160565-PS]",
      "description": "Discover the precision and durability of the TapeTech Premium Gold Finishing Trowel, engineered for professional drywall finishers who demand top-tier performance and quality. Built with FLEXX technology, this trowel offers unparalleled flexibility and strength, ensuring a smooth, flawless finish on various surfaces...",
      "price": 63.0,
      "regularPrice": 63.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TG160565-PS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TG110565-PS",
        "TG120565-PS",
        "TG140565-PS",
        "TG160565-PS",
        "TG180565-PS",
        "TapeTech",
        "Taping & Finishing Tools",
        "flexx",
        "stainless steel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "16\" x 4.7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 16\" x 4.7\"",
      "sortKey": 160565.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TGP160565-PS",
      "parentSku": "TT-TAPETECH-PREMIUM-GOLD-FLEXX-ROUNDED-FRONT-POOL-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Gold FLEXX Rounded Front Pool Trowel - [TGP160565-PS]",
      "description": "TapeTech Premium Gold Stainless Steel Pool Trowels are not just for pools! TapeTech Premium Pool Trowels feature two rounded ends, ideal to generate a smooth appearance on curved or flat surfaces, minimizing the number of lines or sweep marks that can occur with square-edged trowels. This makes them a great choice f...",
      "price": 63.0,
      "regularPrice": 63.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TGP160565-PS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TGP120565-PS",
        "TGP140565-PS",
        "TGP160565-PS",
        "TGP180565-PS",
        "TapeTech",
        "Taping & Finishing Tools",
        "flexx",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "16\" x 4.7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 16\" x 4.7\"",
      "sortKey": 160565.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TG160565-PSCU",
      "parentSku": "TT-TAPETECH-PREMIUM-GOLD-STAINLESS-STEEL-FLEXX-CURVED-FINISHING-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Gold Stainless Steel FLEXX Curved Finishing Trowel - [TG160565-PSCU]",
      "description": "TapeTech premium curved drywall trowels allow you to professionally feather and taper drywall, EIFS and stucco joints, leaving extra joint compound where you need it most – over butt joints and uneven adjacent gypsum or EPS panels. The triple-hardened stainless steel blades ensure maximum performance, and the ProSof...",
      "price": 85.0,
      "regularPrice": 85.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "TG160565-PSCU",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TG120565-PSCU",
        "TG140565-PSCU",
        "TG160565-PSCU",
        "TG180565-PSCU",
        "TapeTech",
        "Taping & Finishing Tools",
        "flexx",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "16\" x 4.7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 16\" x 4.7\"",
      "sortKey": 160565.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TG180565-PS",
      "parentSku": "TT-TAPETECH-GOLD-STAINLESS-STEEL-FLEXX-FINISHING-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Gold Stainless Steel FLEXX Finishing Trowel - [TG180565-PS]",
      "description": "Discover the precision and durability of the TapeTech Premium Gold Finishing Trowel, engineered for professional drywall finishers who demand top-tier performance and quality. Built with FLEXX technology, this trowel offers unparalleled flexibility and strength, ensuring a smooth, flawless finish on various surfaces...",
      "price": 68.0,
      "regularPrice": 68.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TG180565-PS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TG110565-PS",
        "TG120565-PS",
        "TG140565-PS",
        "TG160565-PS",
        "TG180565-PS",
        "TapeTech",
        "Taping & Finishing Tools",
        "flexx",
        "stainless steel",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "18\" x 4.7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 18\" x 4.7\"",
      "sortKey": 180565.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TGP180565-PS",
      "parentSku": "TT-TAPETECH-PREMIUM-GOLD-FLEXX-ROUNDED-FRONT-POOL-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Gold FLEXX Rounded Front Pool Trowel - [TGP180565-PS]",
      "description": "TapeTech Premium Gold Stainless Steel Pool Trowels are not just for pools! TapeTech Premium Pool Trowels feature two rounded ends, ideal to generate a smooth appearance on curved or flat surfaces, minimizing the number of lines or sweep marks that can occur with square-edged trowels. This makes them a great choice f...",
      "price": 68.0,
      "regularPrice": 68.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "TGP180565-PS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TGP120565-PS",
        "TGP140565-PS",
        "TGP160565-PS",
        "TGP180565-PS",
        "TapeTech",
        "Taping & Finishing Tools",
        "flexx",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "18\" x 4.7",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 18\" x 4.7",
      "sortKey": 180565.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TG180565-PSCU",
      "parentSku": "TT-TAPETECH-PREMIUM-GOLD-STAINLESS-STEEL-FLEXX-CURVED-FINISHING-TROWEL",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Gold Stainless Steel FLEXX Curved Finishing Trowel - [TG180565-PSCU]",
      "description": "TapeTech premium curved drywall trowels allow you to professionally feather and taper drywall, EIFS and stucco joints, leaving extra joint compound where you need it most – over butt joints and uneven adjacent gypsum or EPS panels. The triple-hardened stainless steel blades ensure maximum performance, and the ProSof...",
      "price": 89.0,
      "regularPrice": 89.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "TG180565-PSCU",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TG120565-PSCU",
        "TG140565-PSCU",
        "TG160565-PSCU",
        "TG180565-PSCU",
        "TapeTech",
        "Taping & Finishing Tools",
        "flexx",
        "stainless steel trowel",
        "trowel"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "18\" x 4.7\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "hand_tool",
      "sizeLabel": "Size: 18\" x 4.7\"",
      "sortKey": 180565.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT087",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech 76XLTT Extra Long EasyClean® Loading Pump - [AT087]",
      "description": "Are you a high production company taking advantage of the 30 gallon barrels of joint compound now widely available in the market? The TapeTech Extra Long EasyClean® Loading Pump was designed in conjunction with a major joint compound manufacturer to fit these barrels perfectly, providing the extra length and stabili...",
      "price": 727.0,
      "regularPrice": 727.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT087",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "76XLTT",
        "AT087",
        "Automatic Taping Tools",
        "TapeTech",
        "automatic taping tools",
        "loading pump",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "loading_pump",
      "sizeLabel": "AT087",
      "sortKey": 76.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PIPGSR-TT",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Gooseneck Riser for 76TT-CA - [PIPGSR-TT]",
      "description": "The TapeTech Gooseneck Riser is designed to align the height of the 85T Gooseneck with the 76TT-CA EasyClean® Loading Pump for Canada. When using the 76TT-CA and the 85T Gooseneck without the GSR-TT Adapter risks placing unnecessary stress on the flanges of both the gooseneck and the pump.",
      "price": 12.0,
      "regularPrice": 12.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PIPGSR-TT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "GSR-TT",
        "PIPGSR-TT",
        "TapeTech",
        "accessory"
      ],
      "attributes": [],
      "optionGroup": "loading_pump",
      "sizeLabel": "PIPGSR-TT",
      "sortKey": 76.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT068",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech 85T Gooseneck Adapter - [AT068]",
      "description": "The TapeTech 85T Gooseneck Adapter is used with either the 72TT, 73TT or 76TT loading pump to fill the automatic taper. It features a heavy duty, durable design to provide years of service. Use with gasket 700049 (for 72TT or 73TT only - not included).",
      "price": 116.0,
      "regularPrice": 116.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT068",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "85T",
        "AT068",
        "Automatic Taping Tools",
        "TapeTech",
        "goose neck",
        "gooseneck",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "loading_pump",
      "sizeLabel": "AT068",
      "sortKey": 85.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT088",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech 85XLTT Extra Long Gooseneck Adapter - [AT088]",
      "description": "The TapeTech Extra Long Gooseneck is designed to work in conjunction with the 76XLTT EasyClean® Loading Pump. The foot of the gooseneck should always be placed on the same level or surface as the foot stand of the 76XLTT loading pump.",
      "price": 218.0,
      "regularPrice": 218.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT088",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "85XLTT",
        "AT088",
        "Automatic Taping Tools",
        "TapeTech",
        "goose neck",
        "gooseneck",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "loading_pump",
      "sizeLabel": "AT088",
      "sortKey": 85.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT041X",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech ATX01TT Automatic Taper Extension - [AT041X]",
      "description": "The TapeTech Automatic Taper Extension adds 76 cm to your 07TT EasyClean® Automatic Taper or 07TT-C EasyClean Carbon Fiber Automatic Taper. With nearly 60% more length compared to the Taper alone, you’ll easily reach joints up to 3.6 m high without the need to invest in a dedicated, extra-long taper that is only use...",
      "price": 440.0,
      "regularPrice": 440.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT041X",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT041X",
        "ATX01TT",
        "Automatic Taping Tools",
        "TapeTech",
        "bazooka",
        "tape tech",
        "taper"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "AT041X",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT165",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech MWS01-TT Mobile Wash Station - 110V - [AT165]",
      "description": "The TapeTech MWS01-TT Mobile Wash Station is the lightest and most portable wash station available. It is the perfect solution for cleaning tools and equipment on the jobsite, especially when water supplies are limited. Working from just a 5-gallon bucket of water, the MWS01-TT generates the ideal water pressure to...",
      "price": 661.0,
      "regularPrice": 661.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "AT165",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT165",
        "Automatic Taping Tools",
        "MWS01-TT",
        "TapeTech",
        "accessory",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "AT165",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CROLL02",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech 2″ Premium Inside Corner Compound Roller with Frame - [CROLL02]",
      "description": "TapeTech drywall joint compound rollers are ideal for applying large amounts of drywall compound on walls and ceilings for finishing large patches and butt joints, or skimming entire walls, ceilings and rooms. They are a great alternative to breaking out a sprayer or trying to apply the compound with knives or trowe...",
      "price": 17.0,
      "regularPrice": 17.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CROLL02",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "CROLL02",
        "TapeTech",
        "Taping & Finishing Tools",
        "corner applicator",
        "mud applicator",
        "mud roller"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "CROLL02",
      "sortKey": 2.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CCAGE04",
      "parentSku": "TT-TAPETECH-COMPOUND-ROLLER-FRAME",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Compound Roller Frame - [CCAGE04]",
      "description": "TapeTech drywall joint compound rollers are ideal for applying large amounts of drywall compound on walls and ceilings for finishing large patches and butt joints, or skimming entire walls, ceilings and rooms. They are a great alternative to breaking out a sprayer or trying to apply the compound with knives or trowe...",
      "price": 6.0,
      "regularPrice": 6.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CCAGE04",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "CCAGE04",
        "CCAGE09",
        "CCAGE12",
        "TapeTech",
        "Taping & Finishing Tools",
        "mud roller",
        "plastering roller"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 4\"",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CROLL04",
      "parentSku": "TT-TAPETECH-PREMIUM-DRYWALL-COMPOUND-ROLLER-COVER-ONLY",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Drywall Compound Roller (Cover Only) - [CROLL04]",
      "description": "TapeTech drywall joint compound rollers are ideal for applying large amounts of drywall compound on walls and ceilings for finishing large patches and butt joints, or skimming entire walls, ceilings and rooms. They are a great alternative to breaking out a sprayer or trying to apply the compound with knives or trowe...",
      "price": 8.0,
      "regularPrice": 8.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CROLL04",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "CROLL04",
        "CROLL09",
        "CROLL12",
        "TapeTech",
        "Taping & Finishing Tools",
        "mud roller",
        "plastering roller"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "4\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 4\"",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CCAGE09",
      "parentSku": "TT-TAPETECH-COMPOUND-ROLLER-FRAME",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Compound Roller Frame - [CCAGE09]",
      "description": "TapeTech drywall joint compound rollers are ideal for applying large amounts of drywall compound on walls and ceilings for finishing large patches and butt joints, or skimming entire walls, ceilings and rooms. They are a great alternative to breaking out a sprayer or trying to apply the compound with knives or trowe...",
      "price": 6.0,
      "regularPrice": 6.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CCAGE09",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "CCAGE04",
        "CCAGE09",
        "CCAGE12",
        "TapeTech",
        "Taping & Finishing Tools",
        "mud roller",
        "plastering roller"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "9\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 9\"",
      "sortKey": 9.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CROLL09",
      "parentSku": "TT-TAPETECH-PREMIUM-DRYWALL-COMPOUND-ROLLER-COVER-ONLY",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Drywall Compound Roller (Cover Only) - [CROLL09]",
      "description": "TapeTech drywall joint compound rollers are ideal for applying large amounts of drywall compound on walls and ceilings for finishing large patches and butt joints, or skimming entire walls, ceilings and rooms. They are a great alternative to breaking out a sprayer or trying to apply the compound with knives or trowe...",
      "price": 12.0,
      "regularPrice": 12.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CROLL09",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "CROLL04",
        "CROLL09",
        "CROLL12",
        "TapeTech",
        "Taping & Finishing Tools",
        "mud roller",
        "plastering roller"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "9\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 9\"",
      "sortKey": 9.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CCAGE12",
      "parentSku": "TT-TAPETECH-COMPOUND-ROLLER-FRAME",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Compound Roller Frame - [CCAGE12]",
      "description": "TapeTech drywall joint compound rollers are ideal for applying large amounts of drywall compound on walls and ceilings for finishing large patches and butt joints, or skimming entire walls, ceilings and rooms. They are a great alternative to breaking out a sprayer or trying to apply the compound with knives or trowe...",
      "price": 9.0,
      "regularPrice": 9.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CCAGE12",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "CCAGE04",
        "CCAGE09",
        "CCAGE12",
        "TapeTech",
        "Taping & Finishing Tools",
        "mud roller",
        "plastering roller"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 12\"",
      "sortKey": 12.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CROLL12",
      "parentSku": "TT-TAPETECH-PREMIUM-DRYWALL-COMPOUND-ROLLER-COVER-ONLY",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Premium Drywall Compound Roller (Cover Only) - [CROLL12]",
      "description": "TapeTech drywall joint compound rollers are ideal for applying large amounts of drywall compound on walls and ceilings for finishing large patches and butt joints, or skimming entire walls, ceilings and rooms. They are a great alternative to breaking out a sprayer or trying to apply the compound with knives or trowe...",
      "price": 17.0,
      "regularPrice": 17.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CROLL12",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "CROLL04",
        "CROLL09",
        "CROLL12",
        "TapeTech",
        "Taping & Finishing Tools",
        "mud roller",
        "plastering roller"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "12\"",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 12\"",
      "sortKey": 12.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TTGMCASE22",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech 22\" Gate Mouth Utility Bag - [TTGMCASE22]",
      "description": "22″ gate mouth gear bag to carry tools and accessories for drywall finishing. Multiple pockets inside and outside for storage. Large gate mouth opening with zippers to close.",
      "price": 38.0,
      "regularPrice": 38.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TTGMCASE22",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TTGMCASE22",
        "TapeTech",
        "Taping & Finishing Tools",
        "gate mouth",
        "tool bag",
        "utility bag"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "TTGMCASE22",
      "sortKey": 22.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "BHE-SW",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech SideWinder™ Brakeless Box Extendable Handle - 38” - 60” - [BHE-SW]",
      "description": "The SideWinder is a brakeless box handle with rotating head that allows you to comfortably finish high horizontal joints by keeping the box and handle at the optimal angle for performance. The SideWinder has the same features as our other brakeless handles with the added convenience of the rotating head.",
      "price": 363.0,
      "regularPrice": 363.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "BHE-SW",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "BHE-SW",
        "Brakeless",
        "Brakeless Box Handle",
        "Brakeless Handle",
        "TapeTech",
        "flat box handle"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "BHE-SW",
      "sortKey": 38.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT044A",
      "parentSku": "TT-TAPETECH-APPLICATOR-MUD-HEAD",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Applicator Mud Head - [AT044A]",
      "description": "Applicator Head - 90 Degree Inside Corner - 16TT90",
      "price": 94.0,
      "regularPrice": 94.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "AT044A",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "16TT",
        "16TT90",
        "AT044",
        "AT044A",
        "Semi Automatic Taping Tools",
        "TapeTech",
        "applicator",
        "compound applicator",
        "mud head",
        "plastic applicator",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "Inside 90° (16TT90)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: Inside 90° (16TT90)",
      "sortKey": 44.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT044",
      "parentSku": "TT-TAPETECH-APPLICATOR-MUD-HEAD",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech Applicator Mud Head - [AT044]",
      "description": "Applicator Head - 90 Degree Inside Corner - 16TT90",
      "price": 94.0,
      "regularPrice": 94.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT044",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Semi-Automatic Taping Tools"
      ],
      "tags": [
        "16TT",
        "16TT90",
        "AT044",
        "AT044A",
        "Semi Automatic Taping Tools",
        "TapeTech",
        "applicator",
        "compound applicator",
        "mud head",
        "plastic applicator",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Type",
          "value": "Outside 90° (16TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Type: Outside 90° (16TT)",
      "sortKey": 44.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT060NS",
      "parentSku": "TT-TAPETECH-EASYCLEAN-NAIL-SPOTTER-HEAD-ONLY",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech EasyClean™ Nail Spotter – Head Only - [AT060NS]",
      "description": "The TapeTech EasyClean Nail Spotter is used to fill the depressions left from the nails or screw heads during installation of the drywall. The Nail Spotter features an easy clean box design that removes excess compound at the same time as filling the depressions. The hardened steel skid plate allows the Nail Spotter...",
      "price": 307.0,
      "regularPrice": 307.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT060NS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT060NS",
        "AT061NS",
        "Automatic Taping Tools",
        "NS02TT",
        "NS03TT",
        "TapeTech",
        "nail spotter",
        "nailspotter",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "2\" (NS02TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 2\" (NS02TT)",
      "sortKey": 60.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT061NS",
      "parentSku": "TT-TAPETECH-EASYCLEAN-NAIL-SPOTTER-HEAD-ONLY",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech EasyClean™ Nail Spotter – Head Only - [AT061NS]",
      "description": "The TapeTech EasyClean Nail Spotter is used to fill the depressions left from the nails or screw heads during installation of the drywall. The Nail Spotter features an easy clean box design that removes excess compound at the same time as filling the depressions. The hardened steel skid plate allows the Nail Spotter...",
      "price": 319.0,
      "regularPrice": 319.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT061NS",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT060NS",
        "AT061NS",
        "Automatic Taping Tools",
        "NS02TT",
        "NS03TT",
        "TapeTech",
        "nail spotter",
        "nailspotter",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "3\" (NS03TT)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "other_tool",
      "sizeLabel": "Size: 3\" (NS03TT)",
      "sortKey": 61.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT086",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech 76TT-CA EasyClean™ Loading Pump for Canada - [AT086]",
      "description": "The 76TT-CA EasyClean® Loading Pump is specifically designed to work with standard joint compound buckets in Canada, which are slightly taller than standard U.S. buckets. The additional length provides stability and allows the foot valve to reach the bottom of the bucket, maximizing joint compound usage. The 76TT-CA...",
      "price": 451.0,
      "regularPrice": 451.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT086",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "76TT-CA",
        "AT086",
        "Automatic Taping Tools",
        "TapeTech",
        "automatic taping tools",
        "loading pump",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "AT086",
      "sortKey": 76.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CN-TT",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Cleaning Nozzle - [CN-TT]",
      "description": "Used in conjunction with the CNA-TT to fit snugly onto the CFS tool fittings and allow for thorough cleaning. There is no better way to keep your investment in continuous flow clean and running efficiently.",
      "price": 19.0,
      "regularPrice": 19.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CN-TT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "CN-TT",
        "TapeTech",
        "accessory"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "CN-TT",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PIPRTTC-TT",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Taper Cable Repair Tool - [PIPRTTC-TT]",
      "description": "Are you tired of always trying to find something to push the plunger through the tube when repairing your taper cable? The TapeTech Taper Cable repair Tool is designed to easily fit in your tool box or tool bag and is the correct length for quickly pushing the plunger without damaging the main taper tube. This tool...",
      "price": 13.0,
      "regularPrice": 13.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PIPRTTC-TT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "PIPRTTC-TT",
        "RTTC-TT",
        "TapeTech",
        "accessory"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "PIPRTTC-TT",
      "sortKey": 999,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PIP056707",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Bazooka Oil - [PIP056707]",
      "description": "Specially formulated for lubricating Automatic Taping and Finishing Tools. Bazooka Oil keeps your tools running free, but more importantly this bazooka oil acts as a water barrier that will keep away corrosion, to extend the life of your drywall tools. Avoid the damage to gaskets wipers and O-rings caused by the use...",
      "price": 13.0,
      "regularPrice": 13.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PIP056707",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "056707",
        "Automatic Taping Tools",
        "PIP056707",
        "PIP058707",
        "TapeTech",
        "accessory"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "PIP056707",
      "sortKey": 56707.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "PIP057356",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Pump Tube Cleaning Brush - Head Only - [PIP057356]",
      "description": "The TapeTech Pump Tube Cleaning Brush is specifically designed to quickly and efficiently clean the main tube of the loading pump. The brush is perfectly sized for the tube’s diameter and the bristles are the ideal stiffness to clean without damaging the tube. The brush attaches to any length handle with a standard...",
      "price": 33.0,
      "regularPrice": 33.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "PIP057356",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "057356",
        "Automatic Taping Tools",
        "PIP057356",
        "TapeTech",
        "accessory"
      ],
      "attributes": [],
      "optionGroup": "other_tool",
      "sizeLabel": "PIP057356",
      "sortKey": 57356.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TTBDL1",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Premium Gold Finishing Trowel & Hawk Set - [TTBDL1]",
      "description": "Discover the precision and durability of the TapeTech Premium Gold Finishing Trowel, engineered for professional drywall finishers who demand top-tier performance and quality. Built with MAXFLEXX technology, this trowel offers unparalleled flexibility and strength, ensuring a smooth, flawless finish on various surfa...",
      "price": 169.0,
      "regularPrice": 169.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TTBDL1",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TapeTech",
        "Taping & Finishing Tools",
        "hand tool set",
        "trowel and hawk set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "TTBDL1",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TTBDL2",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Premium Finishing Knife Set with Hard Case - [TTBDL2]",
      "description": "The TapeTech Premium Finishing Knife Set includes three drywall skimming blades, an extension handle, adapter, and hard case.",
      "price": 457.0,
      "regularPrice": 457.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TTBDL2",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "AT016",
        "PFK12TT",
        "PFK24TT",
        "PFK32TT",
        "PFKHATT",
        "TapeTech",
        "Taping & Finishing Tools",
        "XH-TT",
        "set",
        "skimming blade",
        "smoothing blade"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "TTBDL2",
      "sortKey": 2.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TTBDL3",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Premium Stainless Steel Taping Knife and Sanding Set - [TTBDL3]",
      "description": "TapeTech Premium Taping and Jointing Knives feature the optimal combination of design, materials experience and testing to produce knives with the best balance, flex, comfort, and control so you achieve premium results when applying and smoothing joint compound.",
      "price": 158.0,
      "regularPrice": 158.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "TTBDL3",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TapeTech",
        "Taping & Finishing Tools",
        "hand tool set",
        "taping knife set"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "TTBDL3",
      "sortKey": 3.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TTBDL4",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Mud Dog Premium Taping Banjo Kit - [TTBDL4]",
      "description": "The TapeTech Premium Mud Dog Taping Banjo (BAN001 TT) is loaded with features like side straps for left or right handed use, a cutting blade / roller assembly, and a truly ergonomic handle. Perfect for smaller jobs, this banjos functional design beats taping joints by hand. The Mud Dog also holds 33% more compound t...",
      "price": 185.0,
      "regularPrice": 185.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TTBDL4",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "BAN001-TT",
        "JK04SSTT",
        "JK05SSTT",
        "JK06SSTT",
        "MP14TT",
        "TTGMCCASE22",
        "TapeTech",
        "Taping & Finishing Tools",
        "banjo",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "TTBDL4",
      "sortKey": 4.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TTBDL5",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Basic Box Set - [TTBDL5]",
      "description": "Most popular TapeTech finishing boxes, Loading Pump, Filler Adapter and extendable handle",
      "price": 1551.0,
      "regularPrice": 1551.0,
      "salePrice": null,
      "inStock": false,
      "stock": null,
      "mpn": "TTBDL5",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "TTBBS",
        "TapeTech",
        "set",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "TTBDL5",
      "sortKey": 5.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TTBDL6",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech MudRunner Pro Corner Finishing Set - [TTBDL6]",
      "description": "For faster finishing of inside corners, with less effort, after tape has been applied",
      "price": 1890.0,
      "regularPrice": 1890.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TTBDL6",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "TapeTech"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "TTBDL6",
      "sortKey": 6.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TTBDL7",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Full Taping Set with Carbon Fiber Taper - [TTBDL7]",
      "description": "Applies tape and compound to wall, ceiling and corner joints",
      "price": 4499.0,
      "regularPrice": 4499.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TTBDL7",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "TapeTech"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "TTBDL7",
      "sortKey": 7.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "TTBDL8",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Flat Box Combo Set - [TTBDL8]",
      "description": "Most popular TapeTech finishing boxes, Loading Pump and handle",
      "price": 1416.0,
      "regularPrice": 1416.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "TTBDL8",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "TapeTech"
      ],
      "attributes": [],
      "optionGroup": "preset_bundle",
      "sizeLabel": "TTBDL8",
      "sortKey": 8.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT026A",
      "parentSku": "TT-TAPETECH-QUICKBOX-QSX-FINISHING-BOX-FAST-SET-COMPOUND",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech QuickBox™ QSX Finishing Box (Fast Set Compound) - [AT026A]",
      "description": "6.5\" QuickBox® QSX QB06-QSX",
      "price": 192.0,
      "regularPrice": 192.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT026A",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT026",
        "AT026A",
        "Automatic Taping Tools",
        "QB06-QSX",
        "QB06QSX",
        "QB08-QSX",
        "QB08QSX",
        "TapeTech",
        "flat box",
        "flatbox",
        "quick box",
        "quickbox",
        "quik box",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "8.5\" (QB08-QSX)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "preset_bundle",
      "sizeLabel": "Size: 8.5\" (QB08-QSX)",
      "sortKey": 26.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT026",
      "parentSku": "TT-TAPETECH-QUICKBOX-QSX-FINISHING-BOX-FAST-SET-COMPOUND",
      "type": "variation",
      "brand": "TapeTech",
      "name": "TapeTech QuickBox™ QSX Finishing Box (Fast Set Compound) - [AT026]",
      "description": "6.5\" QuickBox® QSX QB06-QSX",
      "price": 165.0,
      "regularPrice": 165.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT026",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT026",
        "AT026A",
        "Automatic Taping Tools",
        "QB06-QSX",
        "QB06QSX",
        "QB08-QSX",
        "QB08QSX",
        "TapeTech",
        "flat box",
        "flatbox",
        "quick box",
        "quickbox",
        "quik box",
        "tape tech"
      ],
      "attributes": [
        {
          "name": "Size",
          "value": "6.5\" (QB06-QSX)",
          "visible": false,
          "usedForVariations": true,
          "global": true
        }
      ],
      "optionGroup": "preset_bundle",
      "sizeLabel": "Size: 6.5\" (QB06-QSX)",
      "sortKey": 26.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "BAN001-TT",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Mud Dog Premium Taping Banjo - [BAN001-TT]",
      "description": "The TapeTech Premium Mud Dog Taping Banjo (BAN001 TT) is loaded with features like side straps for left or right handed use, a cutting blade / roller assembly, and a truly ergonomic handle. Perfect for smaller jobs, this banjos functional design beats taping joints by hand. The Mud Dog also holds 33% more compound t...",
      "price": 132.0,
      "regularPrice": 132.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "BAN001-TT",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "BAN001-TT",
        "TapeTech",
        "Taping & Finishing Tools",
        "banjo",
        "tape tech banjo"
      ],
      "attributes": [],
      "optionGroup": "semi_automatic_taper",
      "sizeLabel": "BAN001-TT",
      "sortKey": 1.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "CROLLHAN2",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech Compound Roller Support Handle - [CROLLHAN2]",
      "description": "TapeTech drywall joint compound rollers are ideal for applying large amounts of drywall compound on walls and ceilings for finishing large patches and butt joints, or skimming entire walls, ceilings and rooms. They are a great alternative to breaking out a sprayer or trying to apply the compound with knives or trowe...",
      "price": 8.0,
      "regularPrice": 8.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "CROLLHAN2",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Taping & Finishing Tools"
      ],
      "tags": [
        "TapeTech",
        "Taping & Finishing Tools",
        "mud roller",
        "plastering roller"
      ],
      "attributes": [],
      "optionGroup": "support_handle",
      "sizeLabel": "CROLLHAN2",
      "sortKey": 2.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT090A",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech 17TT Outside Corner Roller - [AT090A]",
      "description": "The TapeTech Outside Corner Roller firmly embeds paper-faced corner bead on external drywall corners and removes the excess joint compound from beneath it. The nylon rollers provide a smooth surface to prevent damage to the corner bead. Use with the FHTT Fiberglass Handle or the XHTT Extension Handle – not included.",
      "price": 188.0,
      "regularPrice": 188.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT090A",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "17TT",
        "17TTE",
        "AT090A",
        "Automatic Taping Tools",
        "TapeTech",
        "corner roller",
        "ouside corner roller",
        "outside bead",
        "semi automatic"
      ],
      "attributes": [],
      "optionGroup": "support_handle",
      "sizeLabel": "AT090A",
      "sortKey": 17.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "FHTT-CC",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech FHTT-CC Closet Crusher Handle - 18″ - [FHTT-CC]",
      "description": "Finally! A support handle to allow professional finishers to use ATF tools in closets and other tight spaces. For more than 80 years, even dedicated ATF tool users have been forced to finish closets with traditional hand tools. But the new TapeTech Closet Crusher – model FHTT-CC – makes it possible to use corner rol...",
      "price": 56.0,
      "regularPrice": 56.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "FHTT-CC",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "Automatic Taping Tools",
        "FHTT-CC",
        "TapeTech",
        "corner roller handle",
        "fixed handle",
        "nail spotter handle",
        "semi automatic",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "support_handle",
      "sizeLabel": "FHTT-CC",
      "sortKey": 18.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT015",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech FH-TT Fibreglass Support Handle - 43″ - [AT015]",
      "description": "TapeTech is the first company to introduce an interchangeable handle system that allows one support handle to be used with every tool. Whether you use standard, fixed length fiberglass handles or aluminum extension support handles, you’ll need just one base handle. The base handle for the fiberglass system is model...",
      "price": 66.0,
      "regularPrice": 66.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT015",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT015",
        "Automatic Taping Tools",
        "FH-TT",
        "FHTT",
        "TapeTech",
        "corner roller handle",
        "fixed handle",
        "nail spotter handle",
        "semi automatic",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "support_handle",
      "sizeLabel": "AT015",
      "sortKey": 43.0,
      "source": "woocommerce_catalog.csv"
    },
    {
      "sku": "AT016",
      "parentSku": null,
      "type": "simple",
      "brand": "TapeTech",
      "name": "TapeTech XH-TT Extendable Support Handle - 43\" - 76.25\" - [AT016]",
      "description": "TapeTech is the first company to introduce an interchangeable handle system that allows one support handle to be used with every tool. Whether you use standard, fixed length fiberglass handles or aluminum extension support handles, you’ll need just one base handle. The base handle for the fiberglass system is model...",
      "price": 198.0,
      "regularPrice": 198.0,
      "salePrice": null,
      "inStock": true,
      "stock": null,
      "mpn": "AT016",
      "image": "",
      "images": [],
      "categories": [
        "Drywall Finishing Tools > TapeTech > Automatic Taping Tools"
      ],
      "tags": [
        "AT016",
        "Automatic Taping Tools",
        "TapeTech",
        "XH-TT",
        "XHTT",
        "corner roller handle",
        "extendable handle",
        "nail spotter handle",
        "semi automatic",
        "tape tech"
      ],
      "attributes": [],
      "optionGroup": "support_handle",
      "sizeLabel": "AT016",
      "sortKey": 43.0,
      "source": "woocommerce_catalog.csv"
    }
  ]
};

export const TOOLSET_PRODUCTS = TOOLSET_BUILDER_CATALOG.products;
export const TOOLSET_GROUPS = TOOLSET_BUILDER_CATALOG.groups;
export const TOOLSET_TEMPLATES = TOOLSET_BUILDER_CATALOG.templates;
export const TOOLSET_BRANDS = TOOLSET_BUILDER_CATALOG.brands;

export function getToolsetProducts({ brand, group } = {}) {
  return TOOLSET_PRODUCTS.filter((product) => {
    if (brand && product.brand !== brand) return false;
    if (group && product.optionGroup !== group) return false;
    return true;
  });
}

export function getDefaultToolsetSelection(brand, template) {
  const usageByGroup = new Map();
  return template.requiredGroups.reduce((acc, group, index) => {
    const used = usageByGroup.get(group) || 0;
    usageByGroup.set(group, used + 1);
    const options = getToolsetProducts({ brand, group }).filter((item) => item.inStock);
    const fallbackOptions = getToolsetProducts({ brand, group });
    const selected = options[used] || options[0] || fallbackOptions[used] || fallbackOptions[0] || null;
    if (selected) acc[`step_${index}_${group}`] = selected.sku;
    return acc;
  }, {});
}
