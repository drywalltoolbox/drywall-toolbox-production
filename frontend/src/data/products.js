// products.js
// Loads products from WooCommerce REST API

export async function loadProducts() {
  try {
    // Get WooCommerce configuration from environment variables
    const wcBaseUrl = process.env.REACT_APP_WC_BASE_URL || process.env.VITE_WC_BASE_URL || 
                      `${window.location.origin}/wp-json/wc/v3`;
    const authUser = process.env.REACT_APP_WC_AUTH_USER || process.env.VITE_WC_AUTH_USER || '';
    const authPass = process.env.REACT_APP_WC_AUTH_PASS || process.env.VITE_WC_AUTH_PASS || '';
    
    // Build Basic Auth header if credentials available
    const headers = {};
    if (authUser && authPass) {
      headers['Authorization'] = 'Basic ' + btoa(`${authUser}:${authPass}`);
    }
    
    // Fetch all products from WooCommerce (paginated, max 100 per request)
    let allProducts = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const url = `${wcBaseUrl}/products?per_page=100&page=${page}`;
      const res = await fetch(url, { headers });
      
      if (!res.ok) {
        console.warn(`Failed to fetch products page ${page}:`, res.statusText);
        hasMore = false;
        break;
      }
      
      const products = await res.json();
      if (!Array.isArray(products) || products.length === 0) {
        hasMore = false;
        break;
      }
      
      allProducts = allProducts.concat(products);
      page++;
    }
    
    // Transform WooCommerce products into app format
    const transformed = allProducts.map((wcProduct, idx) => {
      const images = (wcProduct.images || [])
        .filter(img => img.src)
        .map(img => img.src);
      
      return {
        id: wcProduct.id,
        part_number: wcProduct.sku || `wc-${wcProduct.id}`,
        sku: wcProduct.sku || '',
        upc: wcProduct.meta_data ? 
             (wcProduct.meta_data.find(m => m.key === 'upc')?.value || '') : '',
        name: wcProduct.name || `Product ${idx}`,
        brand: wcProduct.meta_data ? 
               (wcProduct.meta_data.find(m => m.key === 'brand')?.value || '') : '',
        url: wcProduct.permalink || '',
        image: images[0] || '/product-placeholder.jpg',
        images: images.length > 0 ? images : ['/product-placeholder.jpg'],
        short_description: wcProduct.short_description || '',
        description_full: wcProduct.description || '',
        category: wcProduct.categories && wcProduct.categories[0] ? 
                 wcProduct.categories[0].name : '',
        specifications: wcProduct.meta_data ? 
                       Object.fromEntries(
                         wcProduct.meta_data
                           .filter(m => m.key.startsWith('spec_'))
                           .map(m => [m.key.replace('spec_', ''), m.value])
                       ) : {},
        price: parseFloat(wcProduct.price) || 0,
        rating: wcProduct.average_rating ? parseFloat(wcProduct.average_rating) : 0,
        reviews: wcProduct.review_count || 0,
        _raw: wcProduct
      };
    });
    
    return transformed;
  } catch (error) {
    console.error('Error loading products from WooCommerce:', error);
    return [];
  }
}
