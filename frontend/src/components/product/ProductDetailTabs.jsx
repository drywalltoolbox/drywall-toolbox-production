export default function ProductDetailTabs({ activeTab, setActiveTab, descriptionNode, specsNode, reviewsNode }) {
  const tabs = [
    { key: 'description', label: 'Description' },
    { key: 'specs', label: 'Specifications' },
    { key: 'reviews', label: 'Reviews' },
  ];

  const activeTabConfig = tabs.find((tab) => tab.key === activeTab) || tabs[0];
  const contentByTab = {
    description: descriptionNode,
    specs: specsNode,
    reviews: reviewsNode,
  };

  return (
    <div className="dtb-pdp-sections">
      <div className="dtb-pdp-tabs" role="tablist" aria-label="Product detail tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            role="tab"
            id={`product-tab-${tab.key}`}
            aria-controls={`product-tabpanel-${tab.key}`}
            aria-selected={activeTab === tab.key}
            tabIndex={activeTab === tab.key ? 0 : -1}
            className={`dtb-pdp-tabs__tab ${activeTab === tab.key ? 'is-active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="dtb-pdp-section" aria-live="polite">
        <div className="dtb-pdp-section__heading-wrap">
          <h3 className="dtb-pdp-section__heading">{activeTabConfig.label}</h3>
          <span className="dtb-pdp-section__underline" aria-hidden="true" />
        </div>
        <div
          role="tabpanel"
          id={`product-tabpanel-${activeTabConfig.key}`}
          aria-labelledby={`product-tab-${activeTabConfig.key}`}
          className={`dtb-pdp-section__content ${activeTabConfig.key === 'description' ? 'prose max-w-none text-sm text-gray-700' : ''}`}
        >
          {contentByTab[activeTabConfig.key]}
        </div>
      </section>
    </div>
  );
}
