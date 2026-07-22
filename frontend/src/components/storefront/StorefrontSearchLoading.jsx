const SEARCH_LOADING_ROWS = [0, 1, 2];

export default function StorefrontSearchLoading({ compact = false }) {
  return (
    <div
      className={`storefront-search-loading${compact ? ' storefront-search-loading--compact' : ''}`}
      aria-hidden="true"
    >
      {SEARCH_LOADING_ROWS.map((row) => (
        <div className="storefront-search-loading__row" key={row}>
          <span className="storefront-search-loading__thumb" />
          <span className="storefront-search-loading__copy">
            <span className="storefront-search-loading__line storefront-search-loading__line--title" />
            <span className="storefront-search-loading__line storefront-search-loading__line--meta" />
          </span>
        </div>
      ))}
    </div>
  );
}
