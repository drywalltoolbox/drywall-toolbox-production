<?php
defined( 'ABSPATH' ) || exit;

function dtb_schematics_render_page() {
	if ( ! dtb_schematics_can_manage() ) {
		dtb_admin_shell_access_denied();
		return;
	}

	$nonce        = wp_create_nonce( 'dtb_schematics_nonce' );
	$brands       = dtb_schematics_get_brand_options();
	$manifest_age = '';
	$transient    = get_option( '_transient_timeout_' . DTB_MANIFEST_TRANSIENT );
	if ( $transient ) {
		$expires_in   = $transient - time();
		$manifest_age = $expires_in > 0 ? 'Manifest cache expires in ' . human_time_diff( time(), $transient ) : 'Manifest cache expired.';
	} else {
		$manifest_age = 'No manifest cache found — will be generated on next request.';
	}

	dtb_admin_shell_open(
		[
			'title'    => __( 'Schematics', 'drywall-toolbox' ),
			'subtitle' => __( 'Manage schematic media, metadata, and product links.', 'drywall-toolbox' ),
			'section'  => 'tools',
			'page'     => 'dtb-schematics',
			'template' => 'tool',
			'icon'     => 'dashicons-networking',
		]
	);
	?>
	<div class="dtb-schematics">

		<!-- Tabs -->
		<div class="dtb-tabs">
			<button class="dtb-tab active" data-tab="list">All Schematics</button>
			<button class="dtb-tab" data-tab="add">Add Schematic</button>
			<button class="dtb-tab" data-tab="manifest">Manifest</button>
			<button class="dtb-tab" data-tab="import">Import & Audit</button>
		</div>

		<!-- Tab: List -->
		<div id="dtb-tab-list" class="dtb-tab-panel active">
			<div class="dtb-card">
				<div class="dtb-toolbar">
					<select id="dtb-filter-brand" class="dtb-select">
						<option value="">All Brands</option>
						<?php foreach ( $brands as $b ) : ?>
							<option value="<?php echo esc_attr( $b ); ?>"><?php echo esc_html( $b ); ?></option>
						<?php endforeach; ?>
					</select>
					<input type="text" id="dtb-filter-search" class="dtb-input dtb-input--wide" placeholder="Search model number or name…">
					<button id="dtb-btn-search" class="dtb-btn dtb-btn-secondary">
						<span class="dashicons dashicons-search dtb-icon-sm"></span> Search
					</button>
					<span id="dtb-list-count" class="dtb-toolbar-inline-end"></span>
				</div>
				<div id="dtb-list-loading">Loading schematics…</div>
				<div id="dtb-list-container" class="dtb-list-container">
					<table class="dtb-tbl">
						<thead>
							<tr>
								<th>Image</th>
								<th>Brand</th>
								<th>Model</th>
								<th>Name</th>
								<th>Parts</th>
								<th>Linked Products</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody id="dtb-list-body"></tbody>
					</table>
					<div class="dtb-pagination" id="dtb-pagination"></div>
				</div>
				<div id="dtb-list-empty" class="dtb-list-empty">No schematics found.</div>
			</div>
		</div>

		<!-- Tab: Add -->
		<div id="dtb-tab-add" class="dtb-tab-panel">
			<div class="dtb-card dtb-card--sm">
				<h3 class="dtb-title-reset">Register a Schematic from Media Library</h3>
				<p class="dtb-note-muted">Select an existing image from the WP Media Library (WebP preferred), then fill in the schematic metadata below.</p>

				<div class="dtb-form-row">
					<label>Schematic Image</label>
					<div class="dtb-row-inline">
						<button id="dtb-add-select-media" class="dtb-btn dtb-btn-secondary">
							<span class="dashicons dashicons-upload dtb-icon-sm"></span> Select from Media Library
						</button>
						<span id="dtb-add-filename" class="dtb-text-muted-xs"></span>
					</div>
					<input type="hidden" id="dtb-add-attachment-id">
					<div class="dtb-media-preview" id="dtb-add-preview"></div>
				</div>

				<div class="dtb-form-row">
					<label>Brand <span class="dtb-required">*</span></label>
					<select id="dtb-add-brand" class="dtb-select dtb-w-full">
						<option value="">— Select Brand —</option>
						<?php foreach ( $brands as $b ) : ?>
							<option value="<?php echo esc_attr( $b ); ?>"><?php echo esc_html( $b ); ?></option>
						<?php endforeach; ?>
					</select>
				</div>
				<div class="dtb-form-row">
					<label>Model Number <span class="dtb-required">*</span></label>
					<input type="text" id="dtb-add-model-number" placeholder="e.g. AT-EX">
				</div>
				<div class="dtb-form-row">
					<label>Model Name</label>
					<input type="text" id="dtb-add-model-name" placeholder="e.g. Automatic Taper">
				</div>
				<div class="dtb-form-row">
					<label>Part Count</label>
					<input type="number" id="dtb-add-part-count" class="dtb-w-120" placeholder="0" min="0">
				</div>
				<div class="dtb-form-row">
					<label>Notes</label>
					<textarea id="dtb-add-notes" placeholder="Optional internal notes…"></textarea>
				</div>
				<div class="dtb-form-row">
					<label>Linked Products</label>
					<div class="dtb-product-search-wrap">
						<input type="text" id="dtb-add-product-search" class="dtb-input dtb-w-full" placeholder="Search products by name or SKU…">
						<div class="dtb-product-dropdown" id="dtb-add-product-dropdown"><ul></ul></div>
					</div>
					<div class="dtb-linked-products" id="dtb-add-linked-products"></div>
					<input type="hidden" id="dtb-add-product-ids" value="">
				</div>
				<button id="dtb-btn-add-save" class="dtb-btn dtb-btn-primary dtb-mt-6">
					<span class="dashicons dashicons-yes dtb-icon-sm"></span> Register Schematic
				</button>
				<span id="dtb-add-spinner" class="dtb-spinner-inline"><span class="spinner is-active"></span></span>
				<div id="dtb-add-msg" class="dtb-msg-inline"></div>
			</div>
		</div>

		<!-- Tab: Manifest -->
		<div id="dtb-tab-manifest" class="dtb-tab-panel">
			<div class="dtb-card dtb-card--sm">
				<h3 class="dtb-title-reset">Manifest Cache</h3>
				<p class="dtb-manifest-status" id="dtb-manifest-status"><?php echo esc_html( $manifest_age ); ?></p>
				<p class="dtb-note-muted">
					The manifest is a cached JSON response served to the React SPA at <code><?php echo esc_html( rest_url( 'dtb/v1/schematics/manifest' ) ); ?></code>.
					It is rebuilt automatically on the next request after being purged. Purge it after adding or updating schematics to push changes to the frontend immediately.
				</p>
				<button id="dtb-btn-purge" class="dtb-btn dtb-btn-secondary">
					<span class="dashicons dashicons-trash dtb-icon-sm"></span> Purge Manifest Cache
				</button>
				<span id="dtb-purge-spinner" class="dtb-spinner-inline"><span class="spinner is-active"></span></span>
				<div id="dtb-purge-msg" class="dtb-msg-inline"></div>
			</div>
		</div>

		<!-- Tab: Import & Audit -->
		<div id="dtb-tab-import" class="dtb-tab-panel">
			<div class="dtb-card dtb-card--md">
				<h3 class="dtb-title-reset">Schematic Library Audit</h3>
				<p class="dtb-note-muted">Check how complete your schematics metadata is before frontend/admin lookups depend on it.</p>
				<div class="dtb-row-inline-wrap">
					<button id="dtb-btn-audit" class="dtb-btn dtb-btn-secondary">
						<span class="dashicons dashicons-search dtb-icon-sm"></span> Run Audit
					</button>
					<span id="dtb-audit-spinner" class="dtb-inline-hidden"><span class="spinner is-active"></span></span>
				</div>
				<pre id="dtb-audit-output" class="dtb-pre-block"></pre>
				<div class="dtb-row-inline-wrap dtb-mt-10">
					<button id="dtb-export-csv" class="dtb-btn dtb-btn-secondary">
						<span class="dashicons dashicons-download dtb-icon-sm"></span> Export CSV
					</button>
					<button id="dtb-export-json" class="dtb-btn dtb-btn-secondary">
						<span class="dashicons dashicons-download dtb-icon-sm"></span> Export JSON
					</button>
				</div>
			</div>

			<div class="dtb-card dtb-card--md">
				<h3 class="dtb-title-reset">Smart-Link Tool Products</h3>
				<p class="dtb-note-muted">Automatically match imported schematic media to live WooCommerce tool products using brand, model number, model name, SKU, and category tokens. Parts, kits, and toolsets are ignored.</p>
				<div class="dtb-row-inline-wrap">
					<label for="dtb-smart-link-threshold" class="dtb-label-compact">Auto-apply threshold</label>
					<input type="number" id="dtb-smart-link-threshold" class="dtb-input dtb-w-120" value="74" min="0" max="100">
					<button id="dtb-btn-smart-link-preview" class="dtb-btn dtb-btn-secondary">
						<span class="dashicons dashicons-search dtb-icon-sm"></span> Preview Matches
					</button>
					<button id="dtb-btn-smart-link-apply" class="dtb-btn dtb-btn-primary">
						<span class="dashicons dashicons-admin-links dtb-icon-sm"></span> Apply High-Confidence
					</button>
					<span id="dtb-smart-link-spinner" class="dtb-inline-hidden"><span class="spinner is-active"></span></span>
				</div>
				<div id="dtb-smart-link-msg" class="dtb-msg-inline"></div>
				<pre id="dtb-smart-link-output" class="dtb-pre-block"></pre>
			</div>

			<div class="dtb-card dtb-card--md">
				<h3 class="dtb-title-reset">Import Preflight</h3>
				<p class="dtb-note-muted">Validate staged-folder readiness and estimate CSV token match coverage before running import.</p>
				<div class="dtb-row-inline-wrap">
					<button id="dtb-btn-preflight" class="dtb-btn dtb-btn-secondary">
						<span class="dashicons dashicons-yes-alt dtb-icon-sm"></span> Run Preflight
					</button>
					<span id="dtb-preflight-spinner" class="dtb-inline-hidden"><span class="spinner is-active"></span></span>
				</div>
				<pre id="dtb-preflight-output" class="dtb-pre-block"></pre>
			</div>

			<div class="dtb-card dtb-card--md">
				<h3 class="dtb-title-reset">Bulk Import (CSV)</h3>
				<p class="dtb-note-muted">Required columns: <code>schematic_id</code>, <code>brand</code>, <code>model_number</code>. Optional: <code>attachment_id</code>, <code>model_name</code>, <code>part_count</code>, <code>notes</code>, <code>product_ids</code>. If <code>attachment_id</code> is missing/blank, use staged uploads folder matching (recommended) or upload a ZIP.</p>
				<input type="file" id="dtb-import-file" accept=".csv,text/csv">
				<div class="dtb-mt-10">
					<label for="dtb-import-staged-folder" class="dtb-label-compact">Staged Uploads Folder (recommended)</label>
					<div class="dtb-row-inline-wrap">
						<input type="text" id="dtb-import-staged-folder" class="dtb-input dtb-input--staged" value="2026/schematics" />
						<button id="dtb-register-staged-images" class="dtb-btn dtb-btn-secondary">
							<span class="dashicons dashicons-images-alt2 dtb-icon-sm"></span> Register staged images
						</button>
						<span id="dtb-register-staged-spinner" class="dtb-inline-hidden"><span class="spinner is-active"></span></span>
					</div>
					<div id="dtb-register-staged-msg" class="dtb-note-inline">Registers files from <code>wp-content/uploads/&lt;folder&gt;</code> into Media Library for fast CSV matching.</div>
				</div>
				<div class="dtb-mt-10">
					<label for="dtb-import-images-zip" class="dtb-label-compact">Optional Schematics Images ZIP</label>
					<input type="file" id="dtb-import-images-zip" accept=".zip,application/zip,application/x-zip-compressed">
				</div>
				<div class="dtb-row-inline-wrap dtb-mt-10">
					<button id="dtb-btn-import" class="dtb-btn dtb-btn-primary">
						<span class="dashicons dashicons-upload dtb-icon-sm"></span> Import CSV
					</button>
					<span id="dtb-import-spinner" class="dtb-inline-hidden"><span class="spinner is-active"></span></span>
				</div>
				<div id="dtb-import-msg" class="dtb-msg-inline"></div>
				<pre id="dtb-import-errors" class="dtb-pre-block dtb-pre-block--danger"></pre>
			</div>
		</div>

	</div>

	<!-- Edit Modal -->
	<div class="dtb-modal-overlay" id="dtb-edit-modal">
		<div class="dtb-modal">
			<button class="dtb-modal-close" id="dtb-modal-close">✕</button>
			<h2 id="dtb-edit-modal-title">Edit Schematic</h2>
			<input type="hidden" id="dtb-edit-id">
			<div class="dtb-form-row">
				<label>Current Image</label>
				<div id="dtb-edit-preview"></div>
			</div>
			<div class="dtb-form-row">
				<label>Brand <span class="dtb-required">*</span></label>
				<select id="dtb-edit-brand" class="dtb-select dtb-w-full">
					<option value="">— Select Brand —</option>
					<?php foreach ( $brands as $b ) : ?>
						<option value="<?php echo esc_attr( $b ); ?>"><?php echo esc_html( $b ); ?></option>
					<?php endforeach; ?>
				</select>
			</div>
			<div class="dtb-form-row">
				<label>Model Number <span class="dtb-required">*</span></label>
				<input type="text" id="dtb-edit-model-number">
			</div>
			<div class="dtb-form-row">
				<label>Model Name</label>
				<input type="text" id="dtb-edit-model-name">
			</div>
			<div class="dtb-form-row">
				<label>Part Count</label>
				<input type="number" id="dtb-edit-part-count" class="dtb-w-120" min="0">
			</div>
			<div class="dtb-form-row">
				<label>Notes</label>
				<textarea id="dtb-edit-notes"></textarea>
			</div>
			<div class="dtb-form-row">
				<label>Linked Products</label>
				<div class="dtb-product-search-wrap">
					<input type="text" id="dtb-edit-product-search" class="dtb-input dtb-w-full" placeholder="Search products by name or SKU…">
					<div class="dtb-product-dropdown" id="dtb-edit-product-dropdown"><ul></ul></div>
				</div>
				<div class="dtb-linked-products" id="dtb-edit-linked-products"></div>
				<input type="hidden" id="dtb-edit-product-ids" value="">
			</div>
			<div class="dtb-inline-flex-end">
				<button id="dtb-edit-save" class="dtb-btn dtb-btn-primary">Save Changes</button>
				<span id="dtb-edit-spinner" class="dtb-inline-hidden"><span class="spinner is-active"></span></span>
				<button id="dtb-edit-delete" class="dtb-btn dtb-btn-danger dtb-justify-end">Remove Schematic</button>
			</div>
			<div id="dtb-edit-msg" class="dtb-msg-inline"></div>
		</div>
	</div>

	<script>
	(function($){
		var nonce  = <?php echo wp_json_encode( $nonce ); ?>;
		var paged  = 1;
		var totalPages = 1;
		function downloadFile(content, mime, filename) {
			var blob = new Blob([content || ''], { type: mime || 'text/plain;charset=utf-8' });
			var url = URL.createObjectURL(blob);
			var a = document.createElement('a');
			a.href = url;
			a.download = filename || 'download.txt';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}

		// ── Tabs ──────────────────────────────────────────────────────────────

		$('.dtb-tab').on('click', function(){
			$('.dtb-tab').removeClass('active');
			$('.dtb-tab-panel').removeClass('active');
			$(this).addClass('active');
			$('#dtb-tab-' + $(this).data('tab')).addClass('active');
		});

		// ── List Tab ──────────────────────────────────────────────────────────

		function loadList(p) {
			paged = p || 1;
			$('#dtb-list-loading').text('Loading…').show();
			$('#dtb-list-container').hide();
			$('#dtb-list-empty').hide();
			$.post(ajaxurl, {
				action: 'dtb_schematics_list',
				nonce:  nonce,
				brand:  $('#dtb-filter-brand').val(),
				search: $('#dtb-filter-search').val(),
				paged:  paged
			}, function(res){
				$('#dtb-list-loading').hide();
				if (!res.success) return;
				var d = res.data;
				totalPages = d.pages;
				if (!d.items || !d.items.length) {
					$('#dtb-list-empty').show(); return;
				}
				$('#dtb-list-count').text(d.total + ' schematic' + (d.total !== 1 ? 's' : ''));
				var rows = '';
				$.each(d.items, function(i, s){
					var thumb = s.thumb
						? '<img src="' + s.thumb + '" class="dtb-thumb" data-id="' + s.id + '">'
						: '<div class="dtb-thumb-placeholder"><span class="dashicons dashicons-format-image"></span></div>';
					var chips = '';
					$.each(s.products, function(j, p){
						chips += '<span class="dtb-chip">' + $('<div>').text(p.sku || p.name).html() + '</span>';
					});
					rows += '<tr>';
					rows += '<td>' + thumb + '</td>';
					rows += '<td><span class="dtb-badge-brand">' + $('<div>').text(s.brand).html() + '</span></td>';
					rows += '<td><code>' + $('<div>').text(s.model_number).html() + '</code></td>';
					rows += '<td>' + $('<div>').text(s.model_name).html() + '</td>';
					rows += '<td>' + (s.part_count || '—') + '</td>';
					rows += '<td><div class="dtb-link-chips">' + (chips || '<span class="dtb-empty-note">—</span>') + '</div></td>';
					rows += '<td><button class="dtb-btn dtb-btn-secondary dtb-btn-sm dtb-edit-btn" data-id="' + s.id + '">Edit</button></td>';
					rows += '</tr>';
				});
				$('#dtb-list-body').html(rows);

				var pg = '';
				if (totalPages > 1) {
					pg += '<button class="dtb-btn dtb-btn-secondary dtb-btn-sm" id="dtb-pg-prev"' + (paged <= 1 ? ' disabled' : '') + '>‹ Prev</button>';
					pg += '<span>Page ' + paged + ' of ' + totalPages + '</span>';
					pg += '<button class="dtb-btn dtb-btn-secondary dtb-btn-sm" id="dtb-pg-next"' + (paged >= totalPages ? ' disabled' : '') + '>Next ›</button>';
				}
				$('#dtb-pagination').html(pg);
				$('#dtb-list-container').show();
			});
		}

		$('#dtb-btn-search').on('click', function(){ loadList(1); });
		$('#dtb-filter-search').on('keydown', function(e){ if(e.key === 'Enter') loadList(1); });
		$('#dtb-filter-brand').on('change', function(){ loadList(1); });
		$(document).on('click','#dtb-pg-prev', function(){ if(paged > 1) loadList(paged-1); });
		$(document).on('click','#dtb-pg-next', function(){ if(paged < totalPages) loadList(paged+1); });

		loadList(1);

		// ── Edit button → open modal ──────────────────────────────────────────

		$(document).on('click','.dtb-edit-btn', function(){
			var id = $(this).data('id');
			$('#dtb-edit-msg').text('');
			$.post(ajaxurl, { action: 'dtb_schematics_get', nonce: nonce, id: id }, function(res){
				if (!res.success) return;
				var s = res.data;
				$('#dtb-edit-id').val(s.id);
				$('#dtb-edit-modal-title').text('Edit Schematic — ' + (s.model_number || s.id));
				$('#dtb-edit-brand').val(s.brand);
				$('#dtb-edit-model-number').val(s.model_number);
				$('#dtb-edit-model-name').val(s.model_name);
				$('#dtb-edit-part-count').val(s.part_count || '');
				$('#dtb-edit-notes').val(s.notes || '');
				$('#dtb-edit-preview').html(s.thumb ? '<img src="' + s.thumb + '" class="dtb-thumb-preview">' : '');
				var ids = [], chips = '';
				$.each(s.products, function(i, p){
					ids.push(p.id);
					chips += renderChip(p.id, p.name, p.sku, 'edit');
				});
				$('#dtb-edit-product-ids').val(ids.join(','));
				$('#dtb-edit-linked-products').html(chips);
				$('#dtb-edit-modal').addClass('open');
			});
		});

		$('#dtb-modal-close').on('click', function(){ $('#dtb-edit-modal').removeClass('open'); });
		$('#dtb-edit-modal').on('click', function(e){ if($(e.target).hasClass('dtb-modal-overlay')) $(this).removeClass('open'); });

		// ── Save edit ─────────────────────────────────────────────────────────

		$('#dtb-edit-save').on('click', function(){
			var $btn = $(this);
			$btn.prop('disabled', true);
			$('#dtb-edit-spinner').show();
			$.post(ajaxurl, {
				action: 'dtb_schematics_save',
				nonce:  nonce,
				attachment_id: $('#dtb-edit-id').val(),
				brand:         $('#dtb-edit-brand').val(),
				model_number:  $('#dtb-edit-model-number').val(),
				model_name:    $('#dtb-edit-model-name').val(),
				part_count:    $('#dtb-edit-part-count').val(),
				notes:         $('#dtb-edit-notes').val(),
				product_ids:   $('#dtb-edit-product-ids').val()
			}, function(res){
				$btn.prop('disabled', false);
				$('#dtb-edit-spinner').hide();
				if (res.success) {
					$('#dtb-edit-msg').text('✓ Saved.').css('color','#1a7f37');
					loadList(paged);
					setTimeout(function(){ $('#dtb-edit-modal').removeClass('open'); }, 800);
				} else {
					$('#dtb-edit-msg').text('✗ Save failed.').css('color','#d63638');
				}
			});
		});

		// ── Delete schematic flag ─────────────────────────────────────────────

		$('#dtb-edit-delete').on('click', function(){
			if (!confirm('Remove this schematic? The media file will NOT be deleted, only the schematic metadata.')) return;
			$.post(ajaxurl, { action: 'dtb_schematics_remove', nonce: nonce, id: $('#dtb-edit-id').val() }, function(res){
				if (res.success) { $('#dtb-edit-modal').removeClass('open'); loadList(paged); }
			});
		});

		// ── Product search (shared for add and edit) ──────────────────────────

		var searchTimer;
		function initProductSearch(inputId, dropdownId, linkedId, idsId, ctx) {
			$('#' + inputId).on('input', function(){
				clearTimeout(searchTimer);
				var q = $(this).val().trim();
				if (q.length < 1) { $('#' + dropdownId).hide(); return; }
				searchTimer = setTimeout(function(){
					$.post(ajaxurl, { action: 'dtb_schematics_search_products', nonce: nonce, q: q }, function(res){
						if (!res.success || !res.data.length) { $('#' + dropdownId).hide(); return; }
						var items = '';
						$.each(res.data, function(i, p){
							items += '<li data-id="' + p.id + '" data-name="' + $('<div>').text(p.name).html() + '" data-sku="' + $('<div>').text(p.sku).html() + '">' + $('<div>').text(p.name).html() + ' <small class="dtb-sku-subtle">(' + $('<div>').text(p.sku).html() + ')</small></li>';
						});
						$('#' + dropdownId + ' ul').html(items);
						$('#' + dropdownId).show();
					});
				}, 250);
			});

			$(document).on('click', '#' + dropdownId + ' li', function(){
				var id   = $(this).data('id');
				var name = $(this).data('name');
				var sku  = $(this).data('sku');
				var cur  = $('#' + idsId).val();
				var ids  = cur ? cur.split(',').map(Number) : [];
				if (ids.indexOf(id) !== -1) { $('#' + dropdownId).hide(); return; }
				ids.push(id);
				$('#' + idsId).val(ids.join(','));
				$('#' + linkedId).append(renderChip(id, name, sku, ctx));
				$('#' + dropdownId).hide();
				$('#' + inputId).val('');
			});

			$(document).on('click', '.' + ctx + '-chip-remove', function(){
				var id  = $(this).data('id');
				var cur = $('#' + idsId).val();
				var ids = cur ? cur.split(',').map(Number).filter(function(x){ return x !== id; }) : [];
				$('#' + idsId).val(ids.join(','));
				$(this).closest('.dtb-chip').remove();
			});
		}

		function renderChip(id, name, sku, ctx) {
			return '<span class="dtb-chip">' + $('<div>').text(sku || name).html() + '<button class="dtb-chip-remove ' + ctx + '-chip-remove" data-id="' + id + '" type="button">×</button></span>';
		}

		initProductSearch('dtb-add-product-search', 'dtb-add-product-dropdown', 'dtb-add-linked-products', 'dtb-add-product-ids', 'add');
		initProductSearch('dtb-edit-product-search', 'dtb-edit-product-dropdown', 'dtb-edit-linked-products', 'dtb-edit-product-ids', 'edit');

		$(document).on('click', function(e){
			if (!$(e.target).closest('.dtb-product-search-wrap').length) {
				$('.dtb-product-dropdown').hide();
			}
		});

		// ── Add Tab: Media Library picker ─────────────────────────────────────

		var mediaFrame;
		$('#dtb-add-select-media').on('click', function(e){
			e.preventDefault();
			if (mediaFrame) { mediaFrame.open(); return; }
			mediaFrame = wp.media({ title: 'Select Schematic Image', button: { text: 'Use this image' }, multiple: false, library: { type: 'image' } });
			mediaFrame.on('select', function(){
				var attachment = mediaFrame.state().get('selection').first().toJSON();
				$('#dtb-add-attachment-id').val(attachment.id);
				$('#dtb-add-filename').text(attachment.filename);
				$('#dtb-add-preview').html('<img src="' + (attachment.sizes && attachment.sizes.thumbnail ? attachment.sizes.thumbnail.url : attachment.url) + '" class="dtb-thumb-preview">');
				// Pre-fill model name from filename
				if (!$('#dtb-add-model-number').val()) {
					var basename = attachment.filename.replace(/\.[^.]+$/, '').replace(/[-_]/g,' ').toUpperCase();
					$('#dtb-add-model-number').val(basename);
				}
			});
			mediaFrame.open();
		});

		// ── Add Tab: Save ─────────────────────────────────────────────────────

		$('#dtb-btn-add-save').on('click', function(){
			var id    = $('#dtb-add-attachment-id').val();
			var brand = $('#dtb-add-brand').val();
			var model = $('#dtb-add-model-number').val().trim();
			if (!id) { alert('Please select an image first.'); return; }
			if (!brand) { alert('Please select a brand.'); return; }
			if (!model) { alert('Please enter a model number.'); return; }
			var $btn = $(this);
			$btn.prop('disabled', true);
			$('#dtb-add-spinner').show();
			$('#dtb-add-msg').text('');
			$.post(ajaxurl, {
				action:       'dtb_schematics_save',
				nonce:        nonce,
				attachment_id: id,
				brand:         brand,
				model_number:  model,
				model_name:    $('#dtb-add-model-name').val(),
				part_count:    $('#dtb-add-part-count').val(),
				notes:         $('#dtb-add-notes').val(),
				product_ids:   $('#dtb-add-product-ids').val()
			}, function(res){
				$btn.prop('disabled', false);
				$('#dtb-add-spinner').hide();
				if (res.success) {
					$('#dtb-add-msg').text('✓ Schematic registered.').css('color','#1a7f37');
					$('#dtb-add-attachment-id,#dtb-add-model-number,#dtb-add-model-name,#dtb-add-part-count,#dtb-add-notes').val('');
					$('#dtb-add-brand').val('');
					$('#dtb-add-preview,#dtb-add-linked-products').empty();
					$('#dtb-add-filename').text('');
					$('#dtb-add-product-ids').val('');
					loadList(1);
				} else {
					$('#dtb-add-msg').text('✗ Save failed.').css('color','#d63638');
				}
			});
		});

		// ── Manifest Tab: Purge ───────────────────────────────────────────────

		$('#dtb-btn-purge').on('click', function(){
			var $btn = $(this);
			$btn.prop('disabled', true);
			$('#dtb-purge-spinner').show();
			$.post(ajaxurl, { action: 'dtb_schematics_purge', nonce: nonce }, function(res){
				$btn.prop('disabled', false);
				$('#dtb-purge-spinner').hide();
				if (res.success) {
					$('#dtb-purge-msg').text('✓ ' + res.data.message).css('color','#1a7f37');
					$('#dtb-manifest-status').text('Cache cleared. Will regenerate on next API request.');
				} else {
					$('#dtb-purge-msg').text('✗ Purge failed.').css('color','#d63638');
				}
			});
		});

		// ── Import & Audit Tab ───────────────────────────────────────────────

		$('#dtb-btn-audit').on('click', function(){
			var $btn = $(this);
			$btn.prop('disabled', true);
			$('#dtb-audit-spinner').show();
			$('#dtb-audit-output').hide().text('');
			$.post(ajaxurl, { action: 'dtb_schematics_audit', nonce: nonce }, function(res){
				$btn.prop('disabled', false);
				$('#dtb-audit-spinner').hide();
				if (!res.success) {
					$('#dtb-audit-output').show().text('Audit failed.');
					return;
				}
				var d = res.data || {};
				var lines = [
					'Total schematic attachments: ' + (d.total || 0),
					'With schematic ID: ' + (d.with_id || 0),
					'With schematic flag: ' + (d.with_flag || 0),
					'With brand: ' + (d.with_brand || 0),
					'With model number: ' + (d.with_model_number || 0),
					'Complete records (ID + brand + model): ' + (d.complete_records || 0),
					'Missing product map: ' + (d.missing_product_map || 0)
				];
				$('#dtb-audit-output').show().text(lines.join('\n'));
			});
		});

		function runSmartLink(apply) {
			var threshold = parseInt($('#dtb-smart-link-threshold').val() || '74', 10);
			if (Number.isNaN(threshold)) threshold = 74;
			threshold = Math.max(0, Math.min(100, threshold));

			var $preview = $('#dtb-btn-smart-link-preview');
			var $apply = $('#dtb-btn-smart-link-apply');
			$preview.prop('disabled', true);
			$apply.prop('disabled', true);
			$('#dtb-smart-link-spinner').show();
			$('#dtb-smart-link-msg').text(apply ? 'Applying high-confidence product links…' : 'Finding product link candidates…').css('color', '#1d6fa4');
			$('#dtb-smart-link-output').hide().text('');

			$.post(ajaxurl, {
				action: 'dtb_schematics_smart_link_products',
				nonce: nonce,
				apply: apply ? 1 : 0,
				threshold: threshold,
				limit: 3
			}, function(res){
				$preview.prop('disabled', false);
				$apply.prop('disabled', false);
				$('#dtb-smart-link-spinner').hide();

				if (!res || !res.success) {
					var failMsg = (res && res.data && res.data.message) ? res.data.message : 'Smart-link failed.';
					$('#dtb-smart-link-msg').text('✗ ' + failMsg).css('color', '#d63638');
					return;
				}

				var d = res.data || {};
				var counts = d.counts || {};
				$('#dtb-smart-link-msg').text('✓ ' + (d.message || 'Smart-link complete.')).css('color', '#1a7f37');

				var lines = [
					'Schematics scanned: ' + (d.schematics || 0),
					'Candidate products scanned: ' + (d.products || 0),
					'Threshold: ' + (d.threshold || threshold),
					'Auto matches: ' + (counts.auto || 0),
					'Needs review: ' + (counts.review || 0),
					'Unmatched: ' + (counts.none || 0),
					'Applied: ' + (d.applied || 0),
					''
				];

				(d.results || []).slice(0, 120).forEach(function(row){
					var best = row.candidates && row.candidates.length ? row.candidates[0] : null;
					lines.push(
						'[' + (row.status || 'none').toUpperCase() + '] ' +
						(row.schematic_id || '') + ' | ' +
						(row.model_number || '') + ' | ' +
						(row.model_name || '')
					);
					if (best) {
						lines.push('  -> ' + best.id + ' | ' + (best.sku || '') + ' | ' + best.name + ' | score ' + best.score + ' | ' + (best.reasons || ''));
					} else {
						lines.push('  -> no candidate');
					}
				});

				if ((d.results || []).length > 120) {
					lines.push('');
					lines.push('Showing first 120 rows in the browser report.');
				}

				$('#dtb-smart-link-output').show().text(lines.join('\n'));
				loadList(1);
			}).fail(function(xhr, textStatus){
				$preview.prop('disabled', false);
				$apply.prop('disabled', false);
				$('#dtb-smart-link-spinner').hide();
				$('#dtb-smart-link-msg').text('✗ Smart-link request failed (' + (xhr.status || textStatus || 'network') + ').').css('color', '#d63638');
			});
		}

		$('#dtb-btn-smart-link-preview').on('click', function(){
			runSmartLink(false);
		});

		$('#dtb-btn-smart-link-apply').on('click', function(){
			if (!confirm('Apply high-confidence schematic product links now? Run Preview Matches first if you have not reviewed candidates.')) {
				return;
			}
			runSmartLink(true);
		});

		function registerStagedImages(folderRel, done) {
			var offset = 0;
			var batchSize = 10;
			var maxRetriesPerBatch = 4;
			$('#dtb-register-staged-spinner').show();
			$('#dtb-register-staged-msg').text('Registering staged images…').css('color', '#1d6fa4');

			function isTransientHttpStatus(status) {
				return status === 0 || status === 429 || status === 502 || status === 503 || status === 504;
			}

			function backoffDelayMs(attempt) {
				var base = 700;
				var cappedAttempt = Math.min(6, Math.max(1, attempt));
				return (base * Math.pow(2, cappedAttempt - 1)) + Math.floor(Math.random() * 300);
			}

			function tick(retryAttempt) {
				retryAttempt = retryAttempt || 0;
				$.post(ajaxurl, {
					action: 'dtb_schematics_register_staged_images',
					nonce: nonce,
					staged_folder: folderRel,
					offset: offset,
					batch_size: batchSize
				}, function(res){
					if (!res || !res.success) {
						$('#dtb-register-staged-spinner').hide();
						var msg = (res && res.data && res.data.message) ? res.data.message : 'Register staged images failed.';
						$('#dtb-register-staged-msg').text('✗ ' + msg).css('color', '#d63638');
						if (done) done(false);
						return;
					}

					var d = res.data || {};
					offset = parseInt(d.next_offset || 0, 10);
					var modeMsg = ('generate_metadata' in d) ? (' · metadata ' + (d.generate_metadata ? 'on' : 'off')) : '';
					$('#dtb-register-staged-msg').text((d.message || ('Registered ' + (d.processed || 0) + '/' + (d.total || 0))) + modeMsg).css('color', '#1d6fa4');
					if (!d.done) {
						tick(0);
						return;
					}

					$('#dtb-register-staged-spinner').hide();
					$('#dtb-register-staged-msg').text('✓ ' + (d.message || 'Staged images registered.')).css('color', '#1a7f37');
					if (done) done(true);
				}).fail(function(xhr, textStatus){
					var status = (xhr && typeof xhr.status === 'number') ? xhr.status : 0;
					if (retryAttempt < maxRetriesPerBatch && isTransientHttpStatus(status)) {
						var nextAttempt = retryAttempt + 1;
						var delay = backoffDelayMs(nextAttempt);
						$('#dtb-register-staged-msg').text(
							'Transient error (' + (status || textStatus || 'network') + ') at offset ' + offset +
							'. Retrying ' + nextAttempt + '/' + maxRetriesPerBatch + '…'
						).css('color', '#b26200');
						setTimeout(function(){ tick(nextAttempt); }, delay);
						return;
					}
					$('#dtb-register-staged-spinner').hide();
					$('#dtb-register-staged-msg').text('✗ Register staged images request failed (' + (status || textStatus || 'network') + ').').css('color', '#d63638');
					if (done) done(false);
				});
			}

			tick(0);
		}

		$('#dtb-register-staged-images').on('click', function(){
			var folderRel = ($('#dtb-import-staged-folder').val() || '2026/schematics').trim();
			registerStagedImages(folderRel);
		});

		$('#dtb-btn-preflight').on('click', function(){
			var fileInput = document.getElementById('dtb-import-file');
			if (!fileInput || !fileInput.files || !fileInput.files.length) {
				alert('Select a CSV file first for preflight.');
				return;
			}
			var stagedFolder = ($('#dtb-import-staged-folder').val() || '2026/schematics').trim();
			var $btn = $(this);
			$btn.prop('disabled', true);
			$('#dtb-preflight-spinner').show();
			$('#dtb-preflight-output').hide().text('');

			var formData = new FormData();
			formData.append('action', 'dtb_schematics_import_preflight');
			formData.append('nonce', nonce);
			formData.append('staged_folder', stagedFolder);
			formData.append('file', fileInput.files[0]);

			$.ajax({
				url: ajaxurl,
				type: 'POST',
				data: formData,
				processData: false,
				contentType: false,
				timeout: 120000
			}).done(function(res){
				$btn.prop('disabled', false);
				$('#dtb-preflight-spinner').hide();
				if (!res || !res.success) {
					var msg = (res && res.data && res.data.message) ? res.data.message : 'Preflight failed.';
					$('#dtb-preflight-output').show().text(msg);
					return;
				}
				var d = res.data || {};
				var lines = [
					'Staged folder: ' + (d.staged_folder || stagedFolder),
					'Files found in staged folder: ' + (d.files_found || 0),
					'Attachments registered: ' + (d.attachments_registered || 0),
					'CSV rows: ' + (d.csv_total_rows || 0),
					'Token-matched rows: ' + (d.matched_rows || 0),
					'Unmatched rows: ' + (d.unmatched_rows || 0),
					'Coverage: ' + (d.coverage_pct || 0) + '%',
					'',
					(d.message || 'Preflight complete.')
				];
				var examples = d.unmatched_examples || [];
				if (examples.length) {
					lines.push('');
					lines.push('Unmatched examples (first ' + examples.length + '):');
					examples.forEach(function(ex){
						lines.push(
							'Line ' + ex.csv_line +
							' | sid=' + (ex.schematic_id || '') +
							' | model=' + (ex.model_number || '') +
							' | name=' + (ex.model_name || '')
						);
					});
				}
				$('#dtb-preflight-output').show().text(lines.join('\n'));
			}).fail(function(xhr, textStatus){
				$btn.prop('disabled', false);
				$('#dtb-preflight-spinner').hide();
				$('#dtb-preflight-output').show().text('Preflight request failed (' + (xhr.status || textStatus || 'network') + ').');
			});
		});

		$('#dtb-btn-import').on('click', function(){
			var fileInput = document.getElementById('dtb-import-file');
			var zipInput = document.getElementById('dtb-import-images-zip');
			var stagedFolder = ($('#dtb-import-staged-folder').val() || '2026/schematics').trim();
			if (!fileInput || !fileInput.files || !fileInput.files.length) {
				alert('Please select a CSV file first.');
				return;
			}
			var $btn = $(this);
			$btn.prop('disabled', true);
			$('#dtb-import-spinner').show();
			$('#dtb-import-msg').text('Initializing import…').css('color', '#1d6fa4');
			$('#dtb-import-errors').hide().text('');

			var formData = new FormData();
			formData.append('action', 'dtb_schematics_import_csv');
			formData.append('mode', 'init');
			formData.append('nonce', nonce);
			formData.append('file', fileInput.files[0]);
			if (zipInput && zipInput.files && zipInput.files.length) {
				formData.append('image_source', 'zip');
				formData.append('images_zip', zipInput.files[0]);
			} else {
				formData.append('image_source', 'staged');
				formData.append('staged_folder', stagedFolder);
			}

			var initialBatchSize = 10;
			var batchSizeTiers = [10, 6, 3];
			var maxTimeoutRetriesPerBatch = 3;

			function nextBatchSizeFromTimeout(currentSize) {
				for (var i = 0; i < batchSizeTiers.length; i++) {
					if (currentSize > batchSizeTiers[i]) {
						return batchSizeTiers[i];
					}
					if (currentSize === batchSizeTiers[i] && i < batchSizeTiers.length - 1) {
						return batchSizeTiers[i + 1];
					}
				}

				return batchSizeTiers[batchSizeTiers.length - 1];
			}

			function finishFailure(errorMsg, details) {
				$btn.prop('disabled', false);
				$('#dtb-import-spinner').hide();
				$('#dtb-import-msg').text(errorMsg).css('color', '#d63638');
				if (details) {
					$('#dtb-import-errors').show().text(details);
				} else {
					$('#dtb-import-errors')
						.show()
						.text('No raw trace is shown here by default. Open System Manager for technical diagnostics.');
				}
			}

			function buildReasonSummary(reasonCounts) {
				if (!reasonCounts) {
					return '';
				}

				var labelMap = {
					missing_required_fields: 'Missing required fields',
					invalid_product_parent: 'Invalid product parent',
					no_token_match: 'No token match',
					zip_missing_entry: 'ZIP missing entry',
					attachment_import_failed: 'Attachment import failed'
				};

				var lines = [];
				Object.keys(labelMap).forEach(function(key){
					var count = parseInt(reasonCounts[key] || 0, 10);
					if (count > 0) {
						lines.push(labelMap[key] + ': ' + count);
					}
				});

				if (!lines.length) {
					return '';
				}

				return 'Post-run summary:\n' + lines.join('\n');
			}

			function renderImportDiagnostics(data) {
				if (!data) {
					return;
				}

				var reasonSummary = buildReasonSummary(data.reason_counts || null);
				var errs = (data.errors && data.errors.length) ? data.errors.join('\n') : '';
				var out = reasonSummary;
				if (errs) {
					out = out ? (out + '\n\n' + errs) : errs;
				}

				if (out) {
					$('#dtb-import-errors').show().text(out);
				}
			}

			function runBatch(sessionId, totalRows, batchSize, timeoutRetryCount) {
				if (!sessionId) {
					finishFailure('Import failed: missing staged session ID.', 'The staged import session was not returned by the server.');
					return;
				}

				$.ajax({
					url: ajaxurl,
					type: 'POST',
					data: {
						action: 'dtb_schematics_import_csv',
						mode: 'batch',
						nonce: nonce,
						session_id: sessionId,
						batch_size: batchSize
					},
					timeout: 120000
				}).done(function(res){
					if (!res || !res.success) {
						var msg = 'Import failed during batch processing.';
						if (res && res.data && res.data.message) {
							msg = 'Import failed: ' + res.data.message;
						}
						var errs = (res && res.data && res.data.errors && res.data.errors.length)
							? res.data.errors.join('\n')
							: '';
						finishFailure(msg, errs);
						renderImportDiagnostics((res && res.data) ? res.data : null);
						return;
					}

					var d = res.data || {};
					var processed = d.processed_rows || 0;
					var total = d.total_rows || totalRows || 0;
					$('#dtb-import-msg').text('Processing rows ' + processed + ' / ' + total + '… (batch size ' + batchSize + ')').css('color', '#1d6fa4');

					if (!d.done) {
						runBatch(sessionId, total, batchSize, 0);
						return;
					}

					$btn.prop('disabled', false);
					$('#dtb-import-spinner').hide();

					var msg = d.message || 'Import complete.';
					$('#dtb-import-msg').text('✓ ' + msg).css('color', '#1a7f37');
					renderImportDiagnostics(d);
					loadList(1);
				}).fail(function(xhr, textStatus){
					var httpStatus = xhr && typeof xhr.status !== 'undefined' ? xhr.status : 0;
					var responseText = xhr && xhr.responseText ? xhr.responseText : '';
					var timedOut = ('timeout' === textStatus) || (524 === httpStatus);

					if (timedOut && timeoutRetryCount < maxTimeoutRetriesPerBatch) {
						var nextBatchSize = nextBatchSizeFromTimeout(batchSize);
						var nextRetry = timeoutRetryCount + 1;

						$('#dtb-import-msg')
							.text('Batch timed out. Retrying with smaller batch size (' + nextBatchSize + '), attempt ' + nextRetry + '/' + maxTimeoutRetriesPerBatch + '…')
							.css('color', '#1d6fa4');

						setTimeout(function(){
							runBatch(sessionId, totalRows, nextBatchSize, nextRetry);
						}, 1200);
						return;
					}

					var errorMsg = 'Import request failed (' + (httpStatus || textStatus || 'network') + ').';
					if (timedOut) {
						errorMsg = 'Import batch timed out after retries. The session remains staged; click Import CSV to retry.';
					}
					finishFailure(errorMsg, '');

					if (window.console && console.error) {
						console.error('DTB schematics import batch AJAX failure', {
							status: httpStatus,
							textStatus: textStatus,
							responseText: responseText,
							ajaxurl: ajaxurl,
							sessionId: sessionId
						});
					}
				});
			}

			$.ajax({
				url: ajaxurl,
				type: 'POST',
				data: formData,
				processData: false,
				contentType: false,
				timeout: 180000
			}).done(function(res){
				if (!res || !res.success) {
					var msg = 'Import failed.';
					if (res && res.data && res.data.message) {
						msg = 'Import failed: ' + res.data.message;
					}
					var errs = (res && res.data && res.data.errors && res.data.errors.length)
						? res.data.errors.join('\n')
						: '';
					finishFailure(msg, errs);
					renderImportDiagnostics((res && res.data) ? res.data : null);
					return;
				}
				var d = res.data || {};
				renderImportDiagnostics(d);
				if (d.done) {
					$btn.prop('disabled', false);
					$('#dtb-import-spinner').hide();
					$('#dtb-import-msg').text(d.message || 'Import complete.').css('color', '#1a7f37');
					loadList(1);
					return;
				}

				runBatch(d.session_id || '', d.total_rows || 0, initialBatchSize, 0);
			}).fail(function(xhr, textStatus){
				var httpStatus = xhr && typeof xhr.status !== 'undefined' ? xhr.status : 0;
				var responseText = xhr && xhr.responseText ? xhr.responseText : '';
				var errorMsg = 'Import request failed (' + (httpStatus || textStatus || 'network') + ').';
				if ('timeout' === textStatus) {
					errorMsg = 'Import initialization timed out. Try a smaller ZIP or rerun.';
				}
				finishFailure(errorMsg, '');

				if (window.console && console.error) {
					console.error('DTB schematics import AJAX failure', {
						status: httpStatus,
						textStatus: textStatus,
						responseText: responseText,
						ajaxurl: ajaxurl
					});
				}
			});
		});

		$('#dtb-export-csv').on('click', function(){
			$.post(ajaxurl, { action: 'dtb_schematics_export', nonce: nonce, format: 'csv' }, function(res){
				if (!res || !res.success) { alert('Export failed.'); return; }
				downloadFile((res.data || {}).content, (res.data || {}).mime, (res.data || {}).filename);
			});
		});

		$('#dtb-export-json').on('click', function(){
			$.post(ajaxurl, { action: 'dtb_schematics_export', nonce: nonce, format: 'json' }, function(res){
				if (!res || !res.success) { alert('Export failed.'); return; }
				downloadFile((res.data || {}).content, (res.data || {}).mime, (res.data || {}).filename);
			});
		});

	})(jQuery);
	</script>
	<?php
	dtb_admin_shell_close();
}


