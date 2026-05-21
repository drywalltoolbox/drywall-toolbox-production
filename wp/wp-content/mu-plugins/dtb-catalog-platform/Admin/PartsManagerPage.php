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

function dtb_register_parts_manager_submenu(): void {
	add_submenu_page(
		'dtb-toolbox',
		__( 'Parts', 'dtb' ),
		__( 'Parts', 'dtb' ),
		'manage_woocommerce',
		'dtb-parts-manager',
		'dtb_parts_manager_render_page'
	);
}

add_action( 'admin_menu', 'dtb_register_parts_manager_submenu' );

function dtb_parts_manager_render_page(): void {
	if ( ! current_user_can( 'manage_woocommerce' ) ) {
		wp_die( esc_html__( 'You do not have permission to access this page.', 'dtb' ) );
	}

	$nonce  = wp_create_nonce( 'dtb_parts_manager_nonce' );
	$brands = defined( 'DTB_BRANDS' ) && is_array( DTB_BRANDS ) ? DTB_BRANDS : [];
	?>
	<div class="wrap dtb-parts-manager">
		<h1 class="wp-heading-inline">Parts</h1>
		<hr class="wp-header-end">

		<style>
			.dtb-parts-manager { max-width: 1200px; }
			.dtb-pm-card { background:#fff;border:1px solid #dcdcde;border-radius:4px;padding:16px 18px;margin:14px 0; }
			.dtb-pm-toolbar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:14px; }
			.dtb-pm-input, .dtb-pm-select { padding:6px 10px; border:1px solid #c3c4c7; border-radius:4px; min-height:34px; }
			.dtb-pm-btn { border:1px solid transparent; border-radius:4px; min-height:34px; padding:0 12px; font-weight:600; cursor:pointer; }
			.dtb-pm-btn-primary { background:#2271b1; color:#fff; border-color:#2271b1; }
			.dtb-pm-btn-secondary { background:#f6f7f7; color:#2c3338; border-color:#c3c4c7; }
			.dtb-pm-btn-danger { background:#fff; color:#d63638; border-color:#d63638; }
			.dtb-pm-btn:disabled { opacity:.6; cursor:not-allowed; }
			.dtb-pm-grid { display:grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap:10px; }
			.dtb-pm-table { width:100%; border-collapse:collapse; }
			.dtb-pm-table th, .dtb-pm-table td { text-align:left; padding:9px 10px; border-bottom:1px solid #f0f0f1; vertical-align:top; }
			.dtb-pm-table th { border-bottom:2px solid #dcdcde; background:#f6f7f7; }
			.dtb-pm-status { display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;background:#eef4ff;color:#1d4ed8; }
			.dtb-pm-modal-overlay { position:fixed; inset:0; z-index:100000; background:rgba(0,0,0,.45); display:none; align-items:center; justify-content:center; }
			.dtb-pm-modal-overlay.open { display:flex; }
			.dtb-pm-modal { width:min(760px,95vw); max-height:90vh; overflow:auto; background:#fff; border-radius:8px; padding:18px; }
			.dtb-pm-row label { display:block; font-size:12px; font-weight:600; margin-bottom:4px; }
			.dtb-pm-row { margin-bottom:10px; }
			@media (max-width: 840px) { .dtb-pm-grid { grid-template-columns: 1fr; } }
		</style>

		<div class="dtb-pm-card">
			<div class="dtb-pm-toolbar">
				<input id="dtb-pm-search" class="dtb-pm-input" type="text" placeholder="Search part title or SKU..." style="min-width:230px;">
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
				<span id="dtb-pm-count" style="margin-left:auto;color:#787c82;"></span>
			</div>
			<div id="dtb-pm-loading" style="color:#787c82;">Loading parts...</div>
			<table class="dtb-pm-table" id="dtb-pm-table" style="display:none;">
				<thead>
					<tr><th>ID</th><th>Title</th><th>SKU</th><th>Brand</th><th>Price</th><th>Status</th><th>Actions</th></tr>
				</thead>
				<tbody id="dtb-pm-body"></tbody>
			</table>
			<div id="dtb-pm-empty" style="display:none;color:#787c82;padding:10px 0;">No parts found.</div>
			<div id="dtb-pm-pagination" style="display:flex;gap:8px;align-items:center;margin-top:12px;"></div>
		</div>

		<div class="dtb-pm-card">
			<h2 style="margin-top:0;">Import Parts</h2>
			<p style="margin-top:0;color:#787c82;">CSV required columns: <code>sku</code>, <code>title</code>. Optional: <code>id</code>, <code>brand_label</code>, <code>manufacturer_sku</code>, <code>price</code>, <code>status</code>, <code>description</code>.</p>
			<input id="dtb-pm-import-file" type="file" accept=".csv,text/csv">
			<div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
				<button id="dtb-pm-import" class="dtb-pm-btn dtb-pm-btn-primary">Import CSV</button>
				<span id="dtb-pm-import-spinner" style="display:none;"><span class="spinner is-active" style="float:none;margin:0;"></span></span>
			</div>
			<div id="dtb-pm-import-msg" style="margin-top:10px;font-size:13px;"></div>
			<pre id="dtb-pm-import-errors" style="display:none;margin-top:10px;background:#fff8f8;border:1px solid #f0c0c1;padding:10px;border-radius:4px;white-space:pre-wrap;color:#8a2424;"></pre>
		</div>
	</div>

	<div class="dtb-pm-modal-overlay" id="dtb-pm-modal-wrap">
		<div class="dtb-pm-modal">
			<h2 id="dtb-pm-modal-title" style="margin-top:0;">Add Part</h2>
			<input type="hidden" id="dtb-pm-id" value="0">
			<div class="dtb-pm-grid">
				<div class="dtb-pm-row"><label>Title *</label><input id="dtb-pm-title" class="dtb-pm-input" type="text" style="width:100%;"></div>
				<div class="dtb-pm-row"><label>SKU *</label><input id="dtb-pm-sku" class="dtb-pm-input" type="text" style="width:100%;"></div>
				<div class="dtb-pm-row"><label>Brand</label><input id="dtb-pm-brand-label" class="dtb-pm-input" type="text" style="width:100%;"></div>
				<div class="dtb-pm-row"><label>Manufacturer SKU</label><input id="dtb-pm-msku" class="dtb-pm-input" type="text" style="width:100%;"></div>
				<div class="dtb-pm-row"><label>Price</label><input id="dtb-pm-price" class="dtb-pm-input" type="text" placeholder="0.00" style="width:100%;"></div>
				<div class="dtb-pm-row"><label>Status</label><select id="dtb-pm-post-status" class="dtb-pm-select" style="width:100%;"><option value="draft">Draft</option><option value="publish">Publish</option></select></div>
			</div>
			<div class="dtb-pm-row"><label>Description</label><textarea id="dtb-pm-description" class="dtb-pm-input" style="width:100%;min-height:110px;"></textarea></div>
			<div style="display:flex;gap:8px;align-items:center;">
				<button id="dtb-pm-save" class="dtb-pm-btn dtb-pm-btn-primary">Save Part</button>
				<button id="dtb-pm-close" class="dtb-pm-btn dtb-pm-btn-secondary">Close</button>
				<button id="dtb-pm-trash" class="dtb-pm-btn dtb-pm-btn-danger" style="margin-left:auto;display:none;">Move to Trash</button>
				<span id="dtb-pm-spinner" style="display:none;"><span class="spinner is-active" style="float:none;margin:0;"></span></span>
			</div>
			<div id="dtb-pm-msg" style="margin-top:10px;font-size:13px;"></div>
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

		loadParts(1);
	})(jQuery);
	</script>
	<?php
}
