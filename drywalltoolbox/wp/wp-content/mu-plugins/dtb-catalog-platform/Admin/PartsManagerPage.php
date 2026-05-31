<?php
/**
 * Parts Manager admin page registration + renderer.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

if ( ! dtb_is_admin_or_ajax_request() ) {
	return;
}

function dtb_parts_manager_render_page(): void {
	if ( ! current_user_can( 'dtb_manage_parts' ) ) {
		dtb_admin_shell_access_denied();
		return;
	}

	$nonce  = wp_create_nonce( 'dtb_parts_manager_nonce' );
	$brands = defined( 'DTB_BRANDS' ) && is_array( DTB_BRANDS ) ? DTB_BRANDS : [];

	dtb_admin_shell_open( [
		'title'    => __( 'Parts Manager', 'drywall-toolbox' ),
		'subtitle' => __( 'Manage repair parts inventory and schematic part associations.', 'drywall-toolbox' ),
		'section'  => 'tools',
		'page'     => 'dtb-parts-manager',
		'template' => 'tool',
		'icon'     => 'dashicons-admin-tools',
	] );
	?>
	<div class="dtb-pm-inner">
		<h1 class="wp-heading-inline dtb-inline-hidden">Parts</h1>
		<hr class="wp-header-end dtb-inline-hidden">

		<div class="dtb-pm-card">
			<div class="dtb-pm-toolbar">
				<input id="dtb-pm-search" class="dtb-pm-input dtb-pm-input--wide" type="text" placeholder="Search part title or SKU...">
				<select id="dtb-pm-brand" class="dtb-pm-select">
					<option value="">All brands</option>
					<?php foreach ( $brands as $brand ) : ?>
						<option value="<?php echo esc_attr( $brand ); ?>"><?php echo esc_html( $brand ); ?></option>
					<?php endforeach; ?>
				</select>
				<select id="dtb-pm-status" class="dtb-pm-select">
					<option value="">All statuses</option>
					<option value="publish">Published</option>
					<option value="draft">Draft</option>
				</select>
				<button id="dtb-pm-btn-search" class="dtb-pm-btn dtb-pm-btn-secondary">Search</button>
				<button id="dtb-pm-btn-add" class="dtb-pm-btn dtb-pm-btn-primary">Add Part</button>
				<button id="dtb-pm-export-csv" class="dtb-pm-btn dtb-pm-btn-secondary">Export CSV</button>
				<button id="dtb-pm-export-json" class="dtb-pm-btn dtb-pm-btn-secondary">Export JSON</button>
				<span id="dtb-pm-count" class="dtb-toolbar-inline-end"></span>
			</div>
			<div id="dtb-pm-loading" class="dtb-pm-loading">Loading parts...</div>
			<table class="dtb-pm-table dtb-inline-hidden" id="dtb-pm-table">
				<thead>
					<tr><th>ID</th><th>Title</th><th>SKU</th><th>Brand</th><th>Price</th><th>Status</th><th>Actions</th></tr>
				</thead>
				<tbody id="dtb-pm-body"></tbody>
			</table>
			<div id="dtb-pm-empty" class="dtb-pm-empty">No parts found.</div>
			<div id="dtb-pm-pagination" class="dtb-pm-pagination"></div>
		</div>

		<div class="dtb-pm-card">
			<h2 class="dtb-form-title">Import Parts</h2>
			<p class="dtb-form-note">CSV required columns: <code>sku</code>, <code>title</code>. Optional: <code>id</code>, <code>brand_label</code>, <code>manufacturer_sku</code>, <code>price</code>, <code>status</code>, <code>description</code>.</p>
			<input id="dtb-pm-import-file" type="file" accept=".csv,text/csv">
			<div class="dtb-toolbar-inline-wrap">
				<button id="dtb-pm-import" class="dtb-pm-btn dtb-pm-btn-primary">Import CSV</button>
				<span id="dtb-pm-import-spinner" class="dtb-inline-hidden"><span class="spinner is-active"></span></span>
			</div>
			<div id="dtb-pm-import-msg" class="dtb-form-msg"></div>
			<pre id="dtb-pm-import-errors" class="dtb-pm-error-log dtb-inline-hidden"></pre>
		</div>

		<div class="dtb-pm-card">
			<h2 class="dtb-form-title">Import Schematic Parts Map</h2>
			<p class="dtb-form-note">Upload flattened schematic parts CSV for technician cross-mapping. Required columns: <code>schematic_id</code>, <code>part_id</code>, <code>part_name</code>, <code>qty</code>, <code>source_sku</code>.</p>
			<input id="dtb-pm-map-import-file" type="file" accept=".csv,text/csv">
			<div class="dtb-toolbar-inline-wrap">
				<button id="dtb-pm-map-import" class="dtb-pm-btn dtb-pm-btn-primary">Import Schematic Map</button>
				<span id="dtb-pm-map-import-spinner" class="dtb-inline-hidden"><span class="spinner is-active"></span></span>
			</div>
			<div id="dtb-pm-map-import-msg" class="dtb-form-msg"></div>
			<pre id="dtb-pm-map-import-errors" class="dtb-pm-error-log dtb-inline-hidden"></pre>
		</div>
	</div>

	<div class="dtb-pm-modal-overlay" id="dtb-pm-modal-wrap">
		<div class="dtb-pm-modal">
			<h2 id="dtb-pm-modal-title" class="dtb-form-title">Add Part</h2>
			<input type="hidden" id="dtb-pm-id" value="0">
			<div class="dtb-pm-grid">
				<div class="dtb-pm-row"><label>Title *</label><input id="dtb-pm-title" class="dtb-pm-input dtb-w-full" type="text"></div>
				<div class="dtb-pm-row"><label>SKU *</label><input id="dtb-pm-sku" class="dtb-pm-input dtb-w-full" type="text"></div>
				<div class="dtb-pm-row"><label>Brand</label><input id="dtb-pm-brand-label" class="dtb-pm-input dtb-w-full" type="text"></div>
				<div class="dtb-pm-row"><label>Manufacturer SKU</label><input id="dtb-pm-msku" class="dtb-pm-input dtb-w-full" type="text"></div>
				<div class="dtb-pm-row"><label>Price</label><input id="dtb-pm-price" class="dtb-pm-input dtb-w-full" type="text" placeholder="0.00"></div>
				<div class="dtb-pm-row"><label>Status</label><select id="dtb-pm-post-status" class="dtb-pm-select dtb-w-full"><option value="draft">Draft</option><option value="publish">Publish</option></select></div>
			</div>
			<div class="dtb-pm-row"><label>Description</label><textarea id="dtb-pm-description" class="dtb-pm-input dtb-pm-textarea"></textarea></div>
			<div class="dtb-pm-modal-actions">
				<button id="dtb-pm-save" class="dtb-pm-btn dtb-pm-btn-primary">Save Part</button>
				<button id="dtb-pm-close" class="dtb-pm-btn dtb-pm-btn-secondary">Close</button>
				<button id="dtb-pm-trash" class="dtb-pm-btn dtb-pm-btn-danger dtb-pm-trash dtb-inline-hidden">Move to Trash</button>
				<span id="dtb-pm-spinner" class="dtb-inline-hidden"><span class="spinner is-active"></span></span>
			</div>
			<div id="dtb-pm-msg" class="dtb-form-msg"></div>
		</div>
	</div>

	<script>
	(function($){
		var nonce = <?php echo wp_json_encode( $nonce ); ?>;
		var page = 1;
		var pages = 1;

		function esc(v){ return $('<div>').text(v || '').html(); }
		function downloadFile(content, mime, filename){
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

		function loadParts(p){
			page = p || 1;
			$('#dtb-pm-loading').show();
			$('#dtb-pm-table,#dtb-pm-empty').hide();
			$.post(ajaxurl, {
				action:'dtb_parts_list',
				nonce:nonce,
				search:$('#dtb-pm-search').val(),
				brand:$('#dtb-pm-brand').val(),
				status:$('#dtb-pm-status').val(),
				paged:page
			}, function(res){
				$('#dtb-pm-loading').hide();
				if(!res || !res.success){ return; }
				var d = res.data || {};
				pages = d.pages || 1;
				$('#dtb-pm-count').text((d.total || 0) + ' parts');
				if(!d.items || !d.items.length){
					$('#dtb-pm-empty').show();
					$('#dtb-pm-pagination').empty();
					return;
				}
				var html = '';
				$.each(d.items, function(_, item){
					html += '<tr>';
					html += '<td>' + item.id + '</td>';
					html += '<td>' + esc(item.title) + '</td>';
					html += '<td><code>' + esc(item.sku) + '</code></td>';
					html += '<td>' + esc(item.brand_label) + '</td>';
					html += '<td>' + esc(item.price) + '</td>';
					html += '<td><span class="dtb-pm-status">' + esc(item.status) + '</span></td>';
					html += '<td><button class="dtb-pm-btn dtb-pm-btn-secondary dtb-pm-edit" data-id="' + item.id + '">Edit</button></td>';
					html += '</tr>';
				});
				$('#dtb-pm-body').html(html);
				$('#dtb-pm-table').show();

				var pg = '';
				if(pages > 1){
					pg += '<button class="dtb-pm-btn dtb-pm-btn-secondary" id="dtb-pm-prev"' + (page <= 1 ? ' disabled' : '') + '>Prev</button>';
					pg += '<span>Page ' + page + ' of ' + pages + '</span>';
					pg += '<button class="dtb-pm-btn dtb-pm-btn-secondary" id="dtb-pm-next"' + (page >= pages ? ' disabled' : '') + '>Next</button>';
				}
				$('#dtb-pm-pagination').html(pg);
			});
		}

		function resetForm(){
			$('#dtb-pm-id').val('0');
			$('#dtb-pm-title,#dtb-pm-sku,#dtb-pm-brand-label,#dtb-pm-msku,#dtb-pm-price,#dtb-pm-description').val('');
			$('#dtb-pm-post-status').val('draft');
			$('#dtb-pm-modal-title').text('Add Part');
			$('#dtb-pm-trash').hide();
			$('#dtb-pm-msg').text('');
		}

		function openModal(){ $('#dtb-pm-modal-wrap').addClass('open'); }
		function closeModal(){ $('#dtb-pm-modal-wrap').removeClass('open'); }

		$('#dtb-pm-btn-search').on('click', function(){ loadParts(1); });
		$('#dtb-pm-search').on('keydown', function(e){ if(e.key === 'Enter'){ loadParts(1); } });
		$('#dtb-pm-brand,#dtb-pm-status').on('change', function(){ loadParts(1); });
		$(document).on('click', '#dtb-pm-prev', function(){ if(page > 1){ loadParts(page - 1); } });
		$(document).on('click', '#dtb-pm-next', function(){ if(page < pages){ loadParts(page + 1); } });

		$('#dtb-pm-btn-add').on('click', function(){ resetForm(); openModal(); });
		$('#dtb-pm-close').on('click', function(){ closeModal(); });
		$('#dtb-pm-modal-wrap').on('click', function(e){ if(e.target === this){ closeModal(); } });

		$(document).on('click', '.dtb-pm-edit', function(){
			var id = $(this).data('id');
			$.post(ajaxurl, { action:'dtb_parts_get', nonce:nonce, id:id }, function(res){
				if(!res || !res.success){ return; }
				var p = res.data || {};
				$('#dtb-pm-id').val(p.id || 0);
				$('#dtb-pm-title').val(p.title || '');
				$('#dtb-pm-sku').val(p.sku || '');
				$('#dtb-pm-brand-label').val(p.brand_label || '');
				$('#dtb-pm-msku').val(p.manufacturer_sku || '');
				$('#dtb-pm-price').val(p.price || '');
				$('#dtb-pm-description').val(p.description || '');
				$('#dtb-pm-post-status').val(p.status || 'draft');
				$('#dtb-pm-modal-title').text('Edit Part #' + p.id);
				$('#dtb-pm-trash').show();
				$('#dtb-pm-msg').text('');
				openModal();
			});
		});

		$('#dtb-pm-save').on('click', function(){
			var title = ($('#dtb-pm-title').val() || '').trim();
			var sku = ($('#dtb-pm-sku').val() || '').trim();
			if(!title || !sku){ alert('Title and SKU are required.'); return; }
			$('#dtb-pm-spinner').show();
			$(this).prop('disabled', true);
			$.post(ajaxurl, {
				action:'dtb_parts_save',
				nonce:nonce,
				id:$('#dtb-pm-id').val(),
				title:title,
				sku:sku,
				brand_label:$('#dtb-pm-brand-label').val(),
				manufacturer_sku:$('#dtb-pm-msku').val(),
				price:$('#dtb-pm-price').val(),
				description:$('#dtb-pm-description').val(),
				status:$('#dtb-pm-post-status').val()
			}, function(res){
				$('#dtb-pm-spinner').hide();
				$('#dtb-pm-save').prop('disabled', false);
				if(!res || !res.success){
					$('#dtb-pm-msg').text('Save failed.').css('color','#d63638');
					return;
				}
				$('#dtb-pm-msg').text('Saved.').css('color','#1a7f37');
				loadParts(page);
				setTimeout(closeModal, 500);
			});
		});

		$('#dtb-pm-trash').on('click', function(){
			var id = parseInt($('#dtb-pm-id').val(), 10);
			if(!id){ return; }
			if(!confirm('Move this part to trash?')){ return; }
			$.post(ajaxurl, { action:'dtb_parts_delete', nonce:nonce, id:id }, function(res){
				if(!res || !res.success){
					$('#dtb-pm-msg').text('Delete failed.').css('color','#d63638');
					return;
				}
				closeModal();
				loadParts(1);
			});
		});

		$('#dtb-pm-import').on('click', function(){
			var fileInput = document.getElementById('dtb-pm-import-file');
			if(!fileInput || !fileInput.files || !fileInput.files.length){
				alert('Please select a CSV file first.');
				return;
			}
			var fd = new FormData();
			fd.append('action', 'dtb_parts_import_csv');
			fd.append('nonce', nonce);
			fd.append('file', fileInput.files[0]);
			$('#dtb-pm-import-spinner').show();
			$('#dtb-pm-import-msg').text('');
			$('#dtb-pm-import-errors').hide().text('');
			$.ajax({
				url: ajaxurl,
				type: 'POST',
				data: fd,
				processData: false,
				contentType: false
			}).done(function(res){
				$('#dtb-pm-import-spinner').hide();
				if(!res || !res.success){
					$('#dtb-pm-import-msg').text('Import failed.').css('color','#d63638');
					return;
				}
				var d = res.data || {};
				$('#dtb-pm-import-msg').text('✓ ' + (d.message || 'Import completed.')).css('color','#1a7f37');
				if(d.errors && d.errors.length){
					$('#dtb-pm-import-errors').show().text(d.errors.join('\n'));
				}
				loadParts(1);
			}).fail(function(){
				$('#dtb-pm-import-spinner').hide();
				$('#dtb-pm-import-msg').text('Import failed.').css('color','#d63638');
			});
		});

		$('#dtb-pm-export-csv').on('click', function(){
			$.post(ajaxurl, { action:'dtb_parts_export', nonce:nonce, format:'csv' }, function(res){
				if(!res || !res.success){ alert('Export failed.'); return; }
				downloadFile((res.data || {}).content, (res.data || {}).mime, (res.data || {}).filename);
			});
		});

		$('#dtb-pm-export-json').on('click', function(){
			$.post(ajaxurl, { action:'dtb_parts_export', nonce:nonce, format:'json' }, function(res){
				if(!res || !res.success){ alert('Export failed.'); return; }
				downloadFile((res.data || {}).content, (res.data || {}).mime, (res.data || {}).filename);
			});
		});

		$('#dtb-pm-map-import').on('click', function(){
			var fileInput = document.getElementById('dtb-pm-map-import-file');
			if(!fileInput || !fileInput.files || !fileInput.files.length){
				alert('Please select a schematic map CSV first.');
				return;
			}
			var fd = new FormData();
			fd.append('action', 'dtb_parts_import_schematic_map');
			fd.append('nonce', nonce);
			fd.append('file', fileInput.files[0]);
			$('#dtb-pm-map-import-spinner').show();
			$('#dtb-pm-map-import-msg').text('');
			$('#dtb-pm-map-import-errors').hide().text('');
			$.ajax({
				url: ajaxurl,
				type: 'POST',
				data: fd,
				processData: false,
				contentType: false
			}).done(function(res){
				$('#dtb-pm-map-import-spinner').hide();
				if(!res || !res.success){
					$('#dtb-pm-map-import-msg').text('Schematic map import failed.').css('color','#d63638');
					return;
				}
				var d = res.data || {};
				$('#dtb-pm-map-import-msg').text('✓ ' + (d.message || 'Schematic map import completed.')).css('color','#1a7f37');
				if(d.errors && d.errors.length){
					$('#dtb-pm-map-import-errors').show().text(d.errors.join('\n'));
				}
				loadParts(page);
			}).fail(function(){
				$('#dtb-pm-map-import-spinner').hide();
				$('#dtb-pm-map-import-msg').text('Schematic map import failed.').css('color','#d63638');
			});
		});

		loadParts(1);
	})(jQuery);
	</script>
	</div><?php // .dtb-pm-inner ?>
	<?php
	dtb_admin_shell_close();
}

