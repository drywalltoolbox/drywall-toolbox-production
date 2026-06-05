import { useState, useEffect } from 'react';
import { X, ChevronDown, Sliders, RefreshCw, Check } from 'lucide-react';
import '../../styles/filter-panel.css';

export default function FilterPanel({
  isOpen,
  onClose,
  categories,
  brands,
  maxPrice,
  selectedBrands,
  selectedCategories,
  priceRange,
  onBrandChange,
  onCategoryChange,
  onPriceChange,
  onClearFilters,
  resultsCount,
}) {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    brands: true,
    price: true,
  });

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const hasActiveFilters =
    selectedBrands.length > 0 ||
    selectedCategories.length > 0 ||
    priceRange[0] !== 0 ||
    priceRange[1] !== maxPrice;

  return (
    <>
      {/* Desktop Sidebar - Always Visible */}
      <aside className="hidden lg:block lg:w-80 shrink-0">
        <div className="lg:sticky lg:top-24 h-full">
          <FilterContent
            categories={categories}
            brands={brands}
            maxPrice={maxPrice}
            selectedBrands={selectedBrands}
            selectedCategories={selectedCategories}
            priceRange={priceRange}
            onBrandChange={onBrandChange}
            onCategoryChange={onCategoryChange}
            onPriceChange={onPriceChange}
            onClearFilters={onClearFilters}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            hasActiveFilters={hasActiveFilters}
            resultsCount={resultsCount}
          />
        </div>
      </aside>

      {/* Mobile Sidebar - Slide In */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" style={{ top: 'var(--header-height)' }}>
          <div 
            className="absolute inset-0 bg-black/35 backdrop-blur-[1px] filter-mobile-overlay-enter"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
          />
          
          <div className="absolute inset-x-0 top-0">
            <div
              className="w-full bg-white shadow-2xl overflow-hidden flex flex-col rounded-b-2xl filter-mobile-sheet-enter"
              style={{
                maxHeight: 'min(78dvh, calc(100dvh - var(--header-height) - 0.5rem))',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between shrink-0">
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Sliders size={18} />
                  Advanced Filters
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors touch-target"
                  aria-label="Close filters"
                  title="Close filters (ESC)"
                >
                  <X size={22} className="text-slate-600" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3">
                <FilterContent
                  categories={categories}
                  brands={brands}
                  maxPrice={maxPrice}
                  selectedBrands={selectedBrands}
                  selectedCategories={selectedCategories}
                  priceRange={priceRange}
                  onBrandChange={onBrandChange}
                  onCategoryChange={onCategoryChange}
                  onPriceChange={onPriceChange}
                  onClearFilters={onClearFilters}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                  hasActiveFilters={hasActiveFilters}
                  resultsCount={resultsCount}
                  isMobile
                />
              </div>

              <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3 shrink-0">
                <div className="flex gap-3">
                  <button
                    onClick={onClearFilters}
                    className="flex-1 border border-slate-300 text-slate-700 font-medium py-2.5 px-4 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterContent({
  categories,
  brands,
  maxPrice,
  selectedBrands,
  selectedCategories,
  priceRange,
  onBrandChange,
  onCategoryChange,
  onPriceChange,
  onClearFilters,
  expandedSections,
  toggleSection,
  hasActiveFilters,
  resultsCount,
  isMobile,
}) {
  const totalApplied =
    selectedBrands.length +
    selectedCategories.length +
    (priceRange[0] !== 0 || priceRange[1] !== maxPrice ? 1 : 0);

  return (
    <div
      className={`overflow-hidden border border-slate-200 bg-linear-to-b from-slate-50 to-white ${
        isMobile ? 'rounded-2xl' : 'rounded-2xl shadow-sm'
      }`}
    >
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Sliders size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Advanced Filters</h3>
            <p className="text-xs text-slate-500">Refine your search</p>
          </div>
        </div>
        {resultsCount !== undefined && (
          <p className="mt-3 text-xs text-slate-600">
            <span className="font-semibold text-primary-700">{resultsCount}</span> products found
          </p>
        )}
      </div>

      <div className="space-y-2 px-3 py-3">
        {/* Categories Section - only shown when categories are provided */}
        {categories && categories.length > 0 && (
        <FilterSection
          title="Categories"
          isExpanded={expandedSections.categories}
          onToggle={() => toggleSection('categories')}
          itemCount={selectedCategories.length}
          isMobile={isMobile}
        >
          <div className="space-y-2">
            {categories.map(category => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onCategoryChange(category.id)}
                  aria-pressed={isSelected}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg text-left border transition-all ${
                    isSelected
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-medium">{category.name}</span>
                  {isSelected && (
                    <Check size={16} />
                  )}
                </button>
              );
            })}
          </div>
        </FilterSection>
        )}

        {/* Brands Section */}
        <FilterSection
          title="Brands"
          isExpanded={expandedSections.brands}
          onToggle={() => toggleSection('brands')}
          itemCount={selectedBrands.length}
          isMobile={isMobile}
        >
          <div className={`space-y-2 ${isMobile ? 'max-h-48' : 'max-h-56'} overflow-y-auto pr-1 custom-scrollbar`}>
            {brands.map(brand => {
              const isSelected = selectedBrands.includes(brand);
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => onBrandChange(brand)}
                  aria-pressed={isSelected}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg text-left border transition-all ${
                    isSelected
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-medium">{brand}</span>
                  {isSelected && (
                    <Check size={16} />
                  )}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Price Range Section - only shown when maxPrice is set */}
        {maxPrice > 0 && (
        <FilterSection
          title="Price Range"
          isExpanded={expandedSections.price}
          onToggle={() => toggleSection('price')}
          isMobile={isMobile}
        >
          <div className="space-y-3 p-1">
            {/* Price Display */}
            <div className="flex items-center justify-between bg-primary-50 px-3 py-2 rounded-lg border border-primary-200">
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-primary-600">
                  ${priceRange[0].toFixed(0)}
                </span>
                <span className="text-xs text-gray-500">to</span>
                <span className="text-base font-bold text-primary-600">
                  ${priceRange[1].toFixed(0)}
                </span>
              </div>
            </div>

            {/* Range Slider */}
            <div className="space-y-3">
              {/* Min Price Input */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">
                  Min Price
                </label>
                <input
                  type="range"
                  min="0"
                  max={maxPrice}
                  step="50"
                  value={priceRange[0]}
                  onChange={(e) => {
                    const newMin = parseInt(e.target.value);
                    if (newMin <= priceRange[1]) {
                      onPriceChange([newMin, priceRange[1]]);
                    }
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>$0</span>
                  <span>${maxPrice}</span>
                </div>
              </div>

              {/* Max Price Input */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">
                  Max Price
                </label>
                <input
                  type="range"
                  min="0"
                  max={maxPrice}
                  step="50"
                  value={priceRange[1]}
                  onChange={(e) => {
                    const newMax = parseInt(e.target.value);
                    if (newMax >= priceRange[0]) {
                      onPriceChange([priceRange[0], newMax]);
                    }
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
              </div>
            </div>
          </div>
        </FilterSection>
        )}
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && !isMobile && (
        <div className="border-t border-slate-200 px-4 py-4">
          <div className="flex gap-3">
            <button
              onClick={onClearFilters}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors"
            >
              <RefreshCw size={16} />
              Clear All
            </button>
            <button
              className="flex-1 px-3 py-2.5 bg-primary-600 rounded-xl hover:bg-primary-700 text-white font-semibold text-sm transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-slate-200 px-4 py-3 bg-slate-50">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>{hasActiveFilters ? 'Filters active' : 'No filters'}</span>
          <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 font-semibold text-primary-800">
            {totalApplied}
          </span>
        </div>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  isExpanded,
  onToggle,
  itemCount,
  children,
  isMobile,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-2 transition-colors hover:bg-slate-50 ${
          isMobile ? 'px-3 py-3' : 'px-4 py-3.5'
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{title}</span>
          {itemCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
              {itemCount}
            </span>
          )}
        </span>
        <ChevronDown
          size={18}
          className={`text-slate-500 transition-transform duration-200 shrink-0 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className={`${isMobile ? 'px-3 pb-3' : 'px-4 pb-4'} border-t border-slate-100 bg-slate-50/60`}>
          {children}
        </div>
      )}
    </div>
  );
}
