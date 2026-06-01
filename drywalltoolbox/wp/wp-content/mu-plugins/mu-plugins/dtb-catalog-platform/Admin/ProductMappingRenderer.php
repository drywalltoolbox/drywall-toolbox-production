<?php
/**
 * Product Mapping admin renderer.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

function dtb_product_mapping_render_page() {
	if ( ! current_user_can( 'dtb_manage_product_mapping' ) ) {
		dtb_admin_shell_access_denied();
		return;
	}

	$nonce  = wp_create_nonce( 'dtb_mapping_nonce' );
	$brands = [ 'Asgard', 'Columbia Taping Tools', 'Platinum Drywall Tools', 'SurPro', 'TapeTech' ];

	dtb_admin_shell_open( [
		'title'    => __( 'Product Mapping', 'drywall-toolbox' ),
		'subtitle' => __( 'Map external catalog IDs and variations to WooCommerce products.', 'drywall-toolbox' ),
		'section'  => 'tools',
		'page'     => 'dtb-product-mapping',
		'template' => 'tool',
		'icon'     => 'dashicons-randomize',
	] );
	?>
	<div class="dtb-mapping-inner">
		<h1 class="wp-heading-inline dtb-inline-hidden">Product Mapping</h1>
		<hr class="wp-header-end dtb-inline-hidden">

		<!-- Tabs -->
		<div class="dtb-tabs">
			<button class="dtb-tab active" data-tab="variables">Variable Products</button>
			<button class="dtb-tab" data-tab="parts">Parts Compatibility</button>
			<button class="dtb-tab" data-tab="relationships">Upsells &amp; Cross-sells</button>
		</div>

		<!-- ── TAB 1: Variable Products ──────────────────────────────────── -->
		<div id="dtb-tab-variables" class="dtb-tab-panel active">
			<div class="dtb-card">
				<p class="dtb-section-note">
					Manage variable products and their variation children. Each row expands to show existing variations (SKU, price, attributes) and lets you add or edit individual variations.
				</p>
				<div class="dtb-toolbar">
					<select id="dtb-var-brand" class="dtb-select">
						<option value="">All Brands</option>
						<?php foreach ( $brands as $b ) : ?>
							<option value="<?php echo esc_attr( $b ); ?>"><?php echo esc_html( $b ); ?></option>
						<?php endforeach; ?>
					</select>
					<input type="text" id="dtb-var-search" class="dtb-input dtb-input--wide" placeholder="Search by name or SKU…">
					<button id="dtb-btn-var-load" class="dtb-btn dtb-btn-secondary">
						<span class="dashicons dashicons-search dtb-icon-sm"></span> Load
					</button>
					<span id="dtb-var-count" class="dtb-toolbar-inline-end"></span>
				</div>
				<div id="dtb-var-loading" class="dtb-empty dtb-inline-hidden">Loading…</div>
				<div id="dtb-var-container" class="dtb-inline-hidden">
					<table class="dtb-tbl">
						<thead><tr>
							<th class="dtb-col-narrow"></th>
							<th>SKU</th>
							<th>Product Name</th>
							<th>Attributes</th>
							<th>Variations</th>
							<th>Actions</th>
						</tr></thead>
						<tbody id="dtb-var-body"></tbody>
					</table>
				</div>
				<div id="dtb-var-empty" class="dtb-empty dtb-inline-hidden">No variable products found.</div>
			</div>
		</div>

		<!-- ── TAB 2: Parts Compatibility ─────────────────────────────────── -->
		<div id="dtb-tab-parts" class="dtb-tab-panel">
			<div class="dtb-card">
				<p class="dtb-section-note">
					Map part products to the tool products they service. Relationships are bidirectional — linking a part to a tool also links the tool back to the part.
					The React SPA uses these mappings for the parts lookup and repairs page.
				</p>
				<div class="dtb-toolbar">
					<select id="dtb-parts-brand" class="dtb-select">
						<option value="">All Brands</option>
						<?php foreach ( $brands as $b ) : ?>
							<option value="<?php echo esc_attr( $b ); ?>"><?php echo esc_html( $b ); ?></option>
						<?php endforeach; ?>
					</select>
					<input type="text" id="dtb-parts-search" class="dtb-input dtb-input--wide" placeholder="Search parts…">
					<button id="dtb-btn-parts-load" class="dtb-btn dtb-btn-secondary">
						<span class="dashicons dashicons-search dtb-icon-sm"></span> Load Parts
					</button>
				</div>
				<div id="dtb-parts-loading" class="dtb-empty dtb-inline-hidden">Loading…</div>
				<div id="dtb-parts-container" class="dtb-inline-hidden">
					<table class="dtb-tbl">
						<thead><tr>
							<th>Part SKU</th>
							<th>Part Name</th>
							<th>Compatible With</th>
							<th>Add Tool</th>
						</tr></thead>
						<tbody id="dtb-parts-body"></tbody>
					</table>
					<div id="dtb-parts-pagination" class="dtb-toolbar dtb-toolbar--mt"></div>
				</div>
				<div id="dtb-parts-empty" class="dtb-empty dtb-inline-hidden">No parts found.</div>
			</div>
		</div>

		<!-- ── TAB 3: Upsells & Cross-sells ──────────────────────────────── -->
		<div id="dtb-tab-relationships" class="dtb-tab-panel">
			<div class="dtb-card">
				<p class="dtb-section-note">
					Manage upsells (shown on product pages as premium alternatives) and cross-sells (shown in cart).
					Search for a product to view and edit its relationships.
				</p>
				<div class="dtb-toolbar">
					<div class="dtb-product-search-wrap dtb-product-search-wrap--main">
						<input type="text" id="dtb-rel-product-search" class="dtb-input dtb-w-full" placeholder="Search for a product to manage…">
						<div class="dtb-product-dropdown" id="dtb-rel-product-dropdown"><ul></ul></div>
					</div>
					<span id="dtb-rel-selected-name" class="dtb-muted-inline"></span>
					<input type="hidden" id="dtb-rel-product-id">
				</div>
				<div id="dtb-rel-editor" class="dtb-inline-hidden">
					<div class="dtb-pair-layout">
						<div class="dtb-pair-col">
							<h4>Upsells</h4>
							<p class="dtb-form-note">Shown on the product page as recommended upgrades.</p>
							<div class="dtb-product-search-wrap">
								<input type="text" id="dtb-upsell-search" class="dtb-input dtb-w-full" placeholder="Add upsell product…">
								<div class="dtb-product-dropdown" id="dtb-upsell-dropdown"><ul></ul></div>
							</div>
							<div class="dtb-chips-wrap dtb-mt-8" id="dtb-upsell-chips"></div>
							<input type="hidden" id="dtb-upsell-ids">
						</div>
						<div class="dtb-pair-col">
							<h4>Cross-sells</h4>
							<p class="dtb-form-note">Shown in the cart as complementary items.</p>
							<div class="dtb-product-search-wrap">
								<input type="text" id="dtb-cross-search" class="dtb-input dtb-w-full" placeholder="Add cross-sell product…">
								<div class="dtb-product-dropdown" id="dtb-cross-dropdown"><ul></ul></div>
							</div>
							<div class="dtb-chips-wrap dtb-mt-8" id="dtb-cross-chips"></div>
							<input type="hidden" id="dtb-crosssell-ids">
						</div>
					</div>
					<div class="dtb-modal-actions dtb-mt-16">
						<button id="dtb-btn-save-rel" class="dtb-btn dtb-btn-primary">Save Relationships</button>
						<span id="dtb-rel-spinner" class="dtb-inline-hidden"><span class="spinner is-active"></span></span>
						<span id="dtb-rel-msg" class="dtb-saved-msg"></span>
					</div>
				</div>
				<div id="dtb-rel-empty" class="dtb-empty">Search for a product above to get started.</div>
			</div>
		</div>

	</div>

	<!-- Variation Edit Modal -->
	<div class="dtb-modal-overlay" id="dtb-var-modal">
		<div class="dtb-modal">
			<button class="dtb-modal-close" id="dtb-var-modal-close">✕</button>
			<h3 id="dtb-var-modal-title">Add Variation</h3>
			<input type="hidden" id="dtb-var-modal-parent-id">
			<input type="hidden" id="dtb-var-modal-variation-id">
			<div class="dtb-form-row">
				<label>SKU</label>
				<input type="text" id="dtb-vmod-sku" placeholder="e.g. EZ07-AD">
			</div>
			<div class="dtb-pair-layout dtb-pair-layout--tight">
				<div class="dtb-form-row">
					<label>Regular Price ($)</label>
					<input type="number" id="dtb-vmod-price" placeholder="0.00" min="0" step="0.01">
				</div>
				<div class="dtb-form-row">
					<label>Sale Price ($)</label>
					<input type="number" id="dtb-vmod-sale" placeholder="0.00" min="0" step="0.01">
				</div>
			</div>
			<div class="dtb-form-row">
				<label>Stock Quantity</label>
				<input type="number" id="dtb-vmod-stock" placeholder="Leave blank to not manage" min="0">
			</div>
			<div id="dtb-vmod-attrs-wrap">
				<p class="dtb-form-note dtb-form-note--mb8">Attribute values for this variation:</p>
				<div id="dtb-vmod-attrs"></div>
			</div>
			<div class="dtb-modal-actions dtb-mt-16">
				<button id="dtb-vmod-save" class="dtb-btn dtb-btn-primary">Save Variation</button>
				<span id="dtb-vmod-spinner" class="dtb-inline-hidden"><span class="spinner is-active"></span></span>
				<button id="dtb-vmod-delete" class="dtb-btn dtb-btn-danger dtb-inline-end dtb-inline-hidden">Delete Variation</button>
			</div>
			<div id="dtb-vmod-msg" class="dtb-form-msg"></div>
		</div>
	</div>
	<?php
	echo dtb_admin_ui_drawer(
		'dtb-product-mapping-conflict-drawer',
		__( 'Action Requires Review', 'drywall-toolbox' ),
		'<div class="dtb-alert dtb-alert--warning" role="alert"><span class="dashicons dashicons-warning" aria-hidden="true"></span><div class="dtb-alert__body"><p class="dtb-alert__title">'
			. esc_html__( 'Product mapping action could not be completed.', 'drywall-toolbox' )
			. '</p><p class="dtb-alert__text" data-dtb-target="summary"></p></div></div>'
			. '<pre class="dtb-mt-12 dtb-conflict-details" data-dtb-target="details"></pre>'
			. '<p class="dtb-mt-12">' . esc_html__( 'Use System Manager for technical diagnostics if this persists.', 'drywall-toolbox' ) . '</p>',
		dtb_admin_ui_button( __( 'Close', 'drywall-toolbox' ), [ 'type' => 'secondary', 'data' => [ 'dtb-close-drawer' => '1' ] ] )
	); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	?>

	<script>
	(function($){
		var nonce      = <?php echo wp_json_encode( $nonce ); ?>;
		var partsPaged = 1;
		var partsTotal = 1;
		var currentVariables = [];
		var expandedRows = {};

		// ── Tabs ──────────────────────────────────────────────────────────────

		$('.dtb-tab').on('click', function(){
			$('.dtb-tab').removeClass('active');
			$('.dtb-tab-panel').removeClass('active');
			$(this).addClass('active');
			$('#dtb-tab-' + $(this).data('tab')).addClass('active');
		});

		// ── Generic product search factory ────────────────────────────────────
		function openConflictDrawer(message, payload) {
			var drawer = document.getElementById('dtb-product-mapping-conflict-drawer');
			if (!drawer) return;

			var summary = drawer.querySelector('[data-dtb-target="summary"]');
			var details = drawer.querySelector('[data-dtb-target="details"]');
			if (summary) {
				summary.textContent = message || 'Request failed.';
			}
			if (details) {
				details.textContent = payload ? JSON.stringify(payload, null, 2) : '';
			}

			if (window.DtbAdmin && typeof window.DtbAdmin.openDrawer === 'function') {
				window.DtbAdmin.openDrawer(drawer);
			}
		}

		function makeProductSearch(inputId, dropdownId, typeFilter, onSelect) {
			var timer;
			$('#' + inputId).on('input', function(){
				clearTimeout(timer);
				var q = $(this).val().trim();
				if (!q) { $('#' + dropdownId).hide(); return; }
				timer = setTimeout(function(){
					$.post(ajaxurl, {
						action: 'dtb_pm_search_products',
						nonce: nonce,
						q: q,
						product_type: typeFilter || ''
					}, function(res){
						if (!res.success || !res.data.length) { $('#' + dropdownId).hide(); return; }
						var html = '';
						$.each(res.data, function(i, p){
							html += '<li data-id="' + p.id + '" data-name="' + $('<div>').text(p.name).html() + '" data-sku="' + $('<div>').text(p.sku).html() + '">'
								+ $('<div>').text(p.name).html()
								+ ' <small class="dtb-sku-subtle">(' + $('<div>').text(p.sku).html() + ')</small></li>';
						});
						$('#' + dropdownId + ' ul').html(html);
						$('#' + dropdownId).show();
					});
				}, 250);
			});
			$(document).on('click', '#' + dropdownId + ' li', function(){
				var data = { id: $(this).data('id'), name: $(this).data('name'), sku: $(this).data('sku') };
				$('#' + dropdownId).hide();
				$('#' + inputId).val('');
				onSelect(data);
			});
		}

		$(document).on('click', function(e){
			if (!$(e.target).closest('.dtb-product-search-wrap').length) {
				$('.dtb-product-dropdown').hide();
			}
		});

		// ════════════════════════════════════════════════════════════════════
		// TAB 1: VARIABLE PRODUCTS
		// ════════════════════════════════════════════════════════════════════

		function renderAttrTags(attrs) {
			var html = '';
			$.each(attrs, function(i, a){
				html += '<span>' + $('<div>').text(a.name).html() + ': ';
				$.each(a.values, function(j, v){
					html += '<span class="dtb-var-attr-tag">' + $('<div>').text(v).html() + '</span>';
				});
				html += '</span> ';
			});
			return html || '—';
		}

		function renderVariationsTable(vars, parentId, attributes) {
			if (!vars || !vars.length) {
				return '<div class="dtb-empty dtb-empty--tight">No variations yet. <button class="dtb-btn dtb-btn-secondary dtb-btn-sm dtb-add-var-btn" data-parent="' + parentId + '" data-attrs=\'' + JSON.stringify(attributes) + '\'>+ Add First Variation</button></div>';
			}
			var html = '<table class="dtb-var-table"><thead><tr><th>SKU</th><th>Attributes</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody>';
			$.each(vars, function(i, v){
				var attrStr = '';
				$.each(v.attributes, function(k, val){ attrStr += k + ': ' + val + ' '; });
				var stockStr = v.in_stock ? (v.stock !== null && v.stock !== undefined ? v.stock : '✓') : '✗';
				html += '<tr class="dtb-var-row">';
				html += '<td class="dtb-var-sku"><code class="dtb-code-xs">' + $('<div>').text(v.sku).html() + '</code></td>';
				html += '<td class="dtb-var-attrs">' + $('<div>').text(attrStr.trim()).html() + '</td>';
				html += '<td class="dtb-var-price">$' + (v.price || '—') + (v.sale_price ? ' <strike class="dtb-var-sale">$' + v.sale_price + '</strike>' : '') + '</td>';
				html += '<td class="dtb-var-stock">' + stockStr + '</td>';
				html += '<td class="dtb-var-status">' + v.status + '</td>';
				html += '<td><button class="dtb-btn dtb-btn-secondary dtb-btn-sm dtb-edit-var-btn" data-parent="' + parentId + '" data-varid="' + v.id + '" data-sku="' + $('<div>').text(v.sku).html() + '" data-price="' + v.price + '" data-sale="' + v.sale_price + '" data-stock="' + (v.stock !== null ? v.stock : '') + '" data-attrs=\'' + JSON.stringify(v.attributes) + '\' data-parent-attrs=\'' + JSON.stringify(attributes) + '\'>Edit</button></td>';
				html += '</tr>';
			});
			html += '</tbody></table>';
			html += '<button class="dtb-btn dtb-btn-secondary dtb-btn-sm dtb-add-var-btn" data-parent="' + parentId + '" data-attrs=\'' + JSON.stringify(attributes) + '\'>+ Add Variation</button>';
			return html;
		}

		function loadVariables() {
			$('#dtb-var-loading').show();
			$('#dtb-var-container').hide();
			$('#dtb-var-empty').hide();
			$.post(ajaxurl, {
				action: 'dtb_pm_get_variables',
				nonce:  nonce,
				brand:  $('#dtb-var-brand').val(),
				search: $('#dtb-var-search').val()
			}, function(res){
				$('#dtb-var-loading').hide();
				if (!res.success || !res.data.length) { $('#dtb-var-empty').show(); return; }
				currentVariables = res.data;
				$('#dtb-var-count').text(res.data.length + ' variable product' + (res.data.length !== 1 ? 's' : ''));
				var rows = '';
				$.each(res.data, function(i, p){
					rows += '<tr id="dtb-var-row-' + p.id + '">';
					rows += '<td><button class="dtb-expand-btn" data-id="' + p.id + '">▶</button></td>';
					rows += '<td><code>' + $('<div>').text(p.sku).html() + '</code></td>';
					rows += '<td><a href="' + p.permalink + '" target="_blank">' + $('<div>').text(p.name).html() + '</a></td>';
					rows += '<td>' + renderAttrTags(p.attributes) + '</td>';
					rows += '<td><span class="dtb-badge dtb-badge-count">' + p.variations.length + ' variation' + (p.variations.length !== 1 ? 's' : '') + '</span></td>';
					rows += '<td></td>';
					rows += '</tr>';
					rows += '<tr id="dtb-var-detail-' + p.id + '" class="dtb-var-detail"><td colspan="6" class="dtb-var-detail-cell">' + renderVariationsTable(p.variations, p.id, p.attributes) + '</td></tr>';
				});
				$('#dtb-var-body').html(rows);
				$('#dtb-var-container').show();
			});
		}

		$('#dtb-btn-var-load').on('click', loadVariables);
		$('#dtb-var-search').on('keydown', function(e){ if(e.key==='Enter') loadVariables(); });

		// Expand row
		$(document).on('click', '.dtb-expand-btn', function(){
			var id = $(this).data('id');
			var $detail = $('#dtb-var-detail-' + id);
			var visible = $detail.is(':visible');
			$detail.toggle();
			$(this).text(visible ? '▶' : '▼');
		});

		// ── Variation modal ───────────────────────────────────────────────────

		function openVarModal(parentId, parentAttrs, varId, varData) {
			$('#dtb-var-modal-parent-id').val(parentId);
			$('#dtb-var-modal-variation-id').val(varId || '');
			$('#dtb-vmod-sku').val(varData ? varData.sku : '');
			$('#dtb-vmod-price').val(varData ? varData.price : '');
			$('#dtb-vmod-sale').val(varData ? varData.sale : '');
			$('#dtb-vmod-stock').val(varData ? varData.stock : '');
			$('#dtb-vmod-msg').text('');
			$('#dtb-vmod-delete').toggle(!!varId);
			$('#dtb-var-modal-title').text(varId ? 'Edit Variation' : 'Add Variation');

			// Build attribute fields
			var attrsHtml = '';
			if (Array.isArray(parentAttrs)) {
				$.each(parentAttrs, function(i, attr){
					var curVal = (varData && varData.attrs) ? (varData.attrs[attr.name] || '') : '';
					attrsHtml += '<div class="dtb-vmod-field">';
					attrsHtml += '<label class="dtb-vmod-label">' + $('<div>').text(attr.name).html() + '</label>';
					if (Array.isArray(attr.values) && attr.values.length) {
						attrsHtml += '<select class="dtb-select dtb-vmod-attr-select dtb-vmod-input" data-attr="' + $('<div>').text(attr.name).html() + '">';
						attrsHtml += '<option value="">— Select —</option>';
						$.each(attr.values, function(j, v){
							attrsHtml += '<option value="' + $('<div>').text(v).html() + '"' + (curVal === v ? ' selected' : '') + '>' + $('<div>').text(v).html() + '</option>';
						});
						attrsHtml += '</select>';
					} else {
						attrsHtml += '<input type="text" class="dtb-input dtb-vmod-attr-input dtb-vmod-input" data-attr="' + $('<div>').text(attr.name).html() + '" value="' + $('<div>').text(curVal).html() + '">';
					}
					attrsHtml += '</div>';
				});
			} else if (varData && varData.attrs) {
				$.each(varData.attrs, function(k, v){
					attrsHtml += '<div class="dtb-vmod-field">';
					attrsHtml += '<label class="dtb-vmod-label">' + $('<div>').text(k).html() + '</label>';
					attrsHtml += '<input type="text" class="dtb-input dtb-vmod-attr-input dtb-vmod-input" data-attr="' + $('<div>').text(k).html() + '" value="' + $('<div>').text(v).html() + '">';
					attrsHtml += '</div>';
				});
			}
			$('#dtb-vmod-attrs').html(attrsHtml || '<p class="dtb-text-muted-xs">No attributes defined on parent product.</p>');
			$('#dtb-var-modal').addClass('open');
		}

		$(document).on('click', '.dtb-add-var-btn', function(){
			var parentId = $(this).data('parent');
			var attrs    = $(this).data('attrs');
			openVarModal(parentId, attrs, null, null);
		});

		$(document).on('click', '.dtb-edit-var-btn', function(){
			var $btn = $(this);
			openVarModal(
				$btn.data('parent'),
				$btn.data('parent-attrs'),
				$btn.data('varid'),
				{
					sku:   $btn.data('sku'),
					price: $btn.data('price'),
					sale:  $btn.data('sale'),
					stock: $btn.data('stock'),
					attrs: $btn.data('attrs')
				}
			);
		});

		$('#dtb-var-modal-close').on('click', function(){ $('#dtb-var-modal').removeClass('open'); });

		$('#dtb-vmod-save').on('click', function(){
			var $btn = $(this);
			var attrs = {};
			$('.dtb-vmod-attr-select, .dtb-vmod-attr-input').each(function(){
				attrs[$(this).data('attr')] = $(this).val();
			});
			$btn.prop('disabled', true);
			$('#dtb-vmod-spinner').show();
			$.post(ajaxurl, {
				action:       'dtb_pm_save_variation',
				nonce:        nonce,
				parent_id:    $('#dtb-var-modal-parent-id').val(),
				variation_id: $('#dtb-var-modal-variation-id').val(),
				sku:          $('#dtb-vmod-sku').val(),
				price:        $('#dtb-vmod-price').val(),
				sale_price:   $('#dtb-vmod-sale').val(),
				stock:        $('#dtb-vmod-stock').val(),
				attributes:   attrs
			}, function(res){
				$btn.prop('disabled', false);
				$('#dtb-vmod-spinner').hide();
				if (res.success) {
					$('#dtb-vmod-msg').text('✓ ' + res.data.message).css('color','#1a7f37');
					setTimeout(function(){ $('#dtb-var-modal').removeClass('open'); loadVariables(); }, 700);
				} else {
					$('#dtb-vmod-msg').text('✗ ' + (res.data && res.data.message ? res.data.message : 'Save failed.')).css('color','#d63638');
					openConflictDrawer(res.data && res.data.message ? res.data.message : 'Variation save failed.', res && res.data ? res.data : res);
				}
			});
		});

		$('#dtb-vmod-delete').on('click', function(){
			if (!confirm('Delete this variation? This cannot be undone.')) return;
			$.post(ajaxurl, {
				action:       'dtb_pm_delete_variation',
				nonce:        nonce,
				variation_id: $('#dtb-var-modal-variation-id').val()
			}, function(res){
				if (res.success) {
					$('#dtb-var-modal').removeClass('open');
					loadVariables();
				} else {
					openConflictDrawer(res.data && res.data.message ? res.data.message : 'Variation delete failed.', res && res.data ? res.data : res);
				}
			});
		});

		// ════════════════════════════════════════════════════════════════════
		// TAB 2: PARTS COMPATIBILITY
		// ════════════════════════════════════════════════════════════════════

		function loadParts(p) {
			partsPaged = p || 1;
			$('#dtb-parts-loading').show();
			$('#dtb-parts-container,#dtb-parts-empty').hide();
			$.post(ajaxurl, {
				action: 'dtb_pm_get_parts',
				nonce:  nonce,
				brand:  $('#dtb-parts-brand').val(),
				search: $('#dtb-parts-search').val(),
				paged:  partsPaged
			}, function(res){
				$('#dtb-parts-loading').hide();
				if (!res.success || !res.data.items.length) { $('#dtb-parts-empty').show(); return; }
				partsTotal = res.data.pages;
				var rows = '';
				$.each(res.data.items, function(i, part){
					var chips = '';
					$.each(part.linked, function(j, t){
						chips += '<span class="dtb-chip">' + $('<div>').text(t.sku || t.name).html() + '<button class="dtb-chip-remove dtb-parts-unlink" type="button" data-part="' + part.id + '" data-tool="' + t.id + '">×</button></span>';
					});
					rows += '<tr>';
					rows += '<td class="dtb-cell-xs"><code class="dtb-code-xs">' + $('<div>').text(part.sku).html() + '</code></td>';
					rows += '<td class="dtb-cell-sm">' + $('<div>').text(part.name).html() + '</td>';
					rows += '<td><div class="dtb-chips-wrap" id="dtb-parts-chips-' + part.id + '">' + (chips || '<span class="dtb-empty-note">none</span>') + '</div></td>';
					rows += '<td><div class="dtb-product-search-wrap dtb-product-search-wrap--min">';
					rows += '<input type="text" class="dtb-input dtb-input--compact dtb-parts-tool-search" placeholder="Add tool…" data-part="' + part.id + '">';
					rows += '<div class="dtb-product-dropdown dtb-parts-tool-dropdown" id="dtb-tool-dd-' + part.id + '"><ul></ul></div>';
					rows += '</div></td>';
					rows += '</tr>';
				});
				$('#dtb-parts-body').html(rows);

				var pg = '';
				if (partsTotal > 1) {
					pg += '<button class="dtb-btn dtb-btn-secondary dtb-btn-sm" id="dtb-parts-prev"' + (partsPaged<=1?' disabled':'') + '>‹</button>';
					pg += '<span class="dtb-page-indicator">Page ' + partsPaged + ' / ' + partsTotal + '</span>';
					pg += '<button class="dtb-btn dtb-btn-secondary dtb-btn-sm" id="dtb-parts-next"' + (partsPaged>=partsTotal?' disabled':'') + '>›</button>';
				}
				$('#dtb-parts-pagination').html(pg);
				$('#dtb-parts-container').show();

				initPartsToolSearches();
			});
		}

		$('#dtb-btn-parts-load').on('click', function(){ loadParts(1); });
		$('#dtb-parts-search').on('keydown', function(e){ if(e.key==='Enter') loadParts(1); });
		$(document).on('click','#dtb-parts-prev',function(){ if(partsPaged>1) loadParts(partsPaged-1); });
		$(document).on('click','#dtb-parts-next',function(){ if(partsPaged<partsTotal) loadParts(partsPaged+1); });

		function initPartsToolSearches() {
			var timer;
			$(document).off('input','.dtb-parts-tool-search').on('input', '.dtb-parts-tool-search', function(){
				clearTimeout(timer);
				var $input  = $(this);
				var partId  = $input.data('part');
				var q       = $input.val().trim();
				var $dd     = $('#dtb-tool-dd-' + partId);
				if (!q) { $dd.hide(); return; }
				timer = setTimeout(function(){
					$.post(ajaxurl, {
						action: 'dtb_pm_search_products',
						nonce:  nonce,
						q:      q,
						product_type: 'simple,variable'
					}, function(res){
						if (!res.success || !res.data.length) { $dd.hide(); return; }
						var items = '';
						$.each(res.data, function(i, p){
							items += '<li data-id="' + p.id + '" data-sku="' + $('<div>').text(p.sku).html() + '" data-name="' + $('<div>').text(p.name).html() + '">'
								+ $('<div>').text(p.name).html()
								+ ' <small class="dtb-sku-subtle">(' + $('<div>').text(p.sku).html() + ')</small></li>';
						});
						$dd.find('ul').html(items);
						$dd.show();
					});
				}, 250);
			});
		}

		$(document).on('click', '.dtb-parts-tool-dropdown li', function(){
			var $li     = $(this);
			var $dd     = $li.closest('.dtb-product-dropdown');
			var $row    = $li.closest('td').closest('tr');
			var partId  = $row.find('.dtb-parts-tool-search').data('part');
			var toolId  = $li.data('id');
			var toolSku = $li.data('sku');
			$dd.hide();
			$dd.prev('input').val('');

			$.post(ajaxurl, {
				action:         'dtb_pm_save_compatibility',
				nonce:          nonce,
				part_id:        partId,
				tool_id:        toolId,
				mapping_action: 'add'
			}, function(res){
				if (res.success) {
					var chip = '<span class="dtb-chip">' + $('<div>').text(toolSku).html() + '<button class="dtb-chip-remove dtb-parts-unlink" type="button" data-part="' + partId + '" data-tool="' + toolId + '">×</button></span>';
					var $chips = $('#dtb-parts-chips-' + partId);
					$chips.find('span[style*="color"]').remove();
					$chips.append(chip);
				} else {
					openConflictDrawer(res.data && res.data.message ? res.data.message : 'Compatibility update failed.', res && res.data ? res.data : res);
				}
			});
		});

		$(document).on('click', '.dtb-parts-unlink', function(){
			var $btn   = $(this);
			var partId = $btn.data('part');
			var toolId = $btn.data('tool');
			$.post(ajaxurl, {
				action:         'dtb_pm_save_compatibility',
				nonce:          nonce,
				part_id:        partId,
				tool_id:        toolId,
				mapping_action: 'remove'
			}, function(res){
				if (res.success) {
					$btn.closest('.dtb-chip').remove();
				} else {
					openConflictDrawer(res.data && res.data.message ? res.data.message : 'Compatibility removal failed.', res && res.data ? res.data : res);
				}
			});
		});

		// ════════════════════════════════════════════════════════════════════
		// TAB 3: UPSELLS & CROSS-SELLS
		// ════════════════════════════════════════════════════════════════════

		function chipHtml(id, name, sku, type) {
			return '<span class="dtb-chip">' + $('<div>').text(sku || name).html() + '<button class="dtb-chip-remove dtb-rel-chip-remove" type="button" data-id="' + id + '" data-type="' + type + '">×</button></span>';
		}

		function addRelChip(type, p) {
			var idsInput = type === 'upsell' ? '#dtb-upsell-ids' : '#dtb-crosssell-ids';
			var chipsWrap = type === 'upsell' ? '#dtb-upsell-chips' : '#dtb-cross-chips';
			var cur  = $(idsInput).val();
			var ids  = cur ? cur.split(',').map(Number) : [];
			if (ids.indexOf(p.id) !== -1) return;
			ids.push(p.id);
			$(idsInput).val(ids.join(','));
			$(chipsWrap).append(chipHtml(p.id, p.name, p.sku, type));
		}

		makeProductSearch('dtb-rel-product-search', 'dtb-rel-product-dropdown', 'simple,variable', function(p){
			$('#dtb-rel-product-id').val(p.id);
			$('#dtb-rel-selected-name').text('Editing: ' + p.name + ' (' + p.sku + ')');
			$('#dtb-rel-msg').text('');
			$('#dtb-upsell-ids,#dtb-crosssell-ids').val('');
			$('#dtb-upsell-chips,#dtb-cross-chips').empty();
			$('#dtb-rel-empty').hide();
			$('#dtb-rel-editor').hide();

			$.post(ajaxurl, {
				action:     'dtb_pm_get_relationships',
				nonce:      nonce,
				product_id: p.id
			}, function(res){
				if (!res.success) return;
				var d = res.data;
				var uIds = [], cIds = [];
				$.each(d.upsells, function(i, u){ uIds.push(u.id); $('#dtb-upsell-chips').append(chipHtml(u.id, u.name, u.sku, 'upsell')); });
				$.each(d.crosssells, function(i, c){ cIds.push(c.id); $('#dtb-cross-chips').append(chipHtml(c.id, c.name, c.sku, 'cross')); });
				$('#dtb-upsell-ids').val(uIds.join(','));
				$('#dtb-crosssell-ids').val(cIds.join(','));
				$('#dtb-rel-editor').show();
			});
		});

		makeProductSearch('dtb-upsell-search', 'dtb-upsell-dropdown', '', function(p){ addRelChip('upsell', p); });
		makeProductSearch('dtb-cross-search', 'dtb-cross-dropdown', '', function(p){ addRelChip('cross', p); });

		$(document).on('click', '.dtb-rel-chip-remove', function(){
			var id   = $(this).data('id');
			var type = $(this).data('type');
			var idsInput = type === 'upsell' ? '#dtb-upsell-ids' : '#dtb-crosssell-ids';
			var cur  = $(idsInput).val();
			var ids  = cur ? cur.split(',').map(Number).filter(function(x){ return x !== id; }) : [];
			$(idsInput).val(ids.join(','));
			$(this).closest('.dtb-chip').remove();
		});

		$('#dtb-btn-save-rel').on('click', function(){
			var $btn = $(this);
			var pid  = $('#dtb-rel-product-id').val();
			if (!pid) return;
			$btn.prop('disabled', true);
			$('#dtb-rel-spinner').show();
			$.post(ajaxurl, {
				action:        'dtb_pm_save_relationships',
				nonce:         nonce,
				product_id:    pid,
				upsell_ids:    $('#dtb-upsell-ids').val(),
				crosssell_ids: $('#dtb-crosssell-ids').val()
			}, function(res){
				$btn.prop('disabled', false);
				$('#dtb-rel-spinner').hide();
				$('#dtb-rel-msg')
					.text(res.success ? '✓ Saved.' : '✗ Save failed.')
					.removeClass('dtb-saved-ok dtb-saved-err')
					.addClass(res.success ? 'dtb-saved-ok' : 'dtb-saved-err');
				if (!res.success) {
					openConflictDrawer(res.data && res.data.message ? res.data.message : 'Relationship save failed.', res && res.data ? res.data : res);
				}
			});
		});

	})(jQuery);
	</script>
	</div><?php // .dtb-mapping-inner ?>
	<?php
	dtb_admin_shell_close();
}



