import TechnicalSpecifications from '../components/product/TechnicalSpecifications';
import SEOHead from '../components/shared/SEOHead';

const automaticTaperSpecs = [
  { label: 'Brand', value: 'TapeTech' },
  { label: 'SKU', value: 'T05CF' },
  { label: 'Tool Type', value: 'Automatic drywall taper' },
  { label: 'Material', value: 'Anodized aluminum tube with stainless wear parts' },
  { label: 'Capacity', value: '2.25 qt compound tube' },
  { label: 'Tape Width', value: '2.0625 in paper joint tape' },
  { label: 'Blade System', value: 'Precision creaser wheel with cutoff knife' },
  { label: 'Compatible Compound', value: 'All-purpose or taping joint compound' },
  { label: 'Application', value: 'Flat joints, butt joints, and internal corners' },
  { label: 'Maintenance', value: 'Tool-free cleanout with replaceable wear components' },
  {
    label: 'Includes',
    items: [
      { name: 'Automatic Taper', sku: 'T05CF' },
      { name: 'Creaser Wheel Assembly', sku: 'T05-77' },
      { name: 'Taper Cable Assembly', sku: 'T05-120' },
      { name: 'Cleaning Brush', sku: 'CB-36' },
    ],
  },
];

const flatBoxSpecs = [
  { label: 'Brand', value: 'Level5' },
  { label: 'SKU', value: '4-764' },
  { label: 'Size', value: '10 in' },
  { label: 'Material', value: 'Aircraft-grade aluminum body' },
  { label: 'Blade', value: 'Adjustable stainless steel finishing blade' },
  { label: 'Handle Compatibility', value: 'Most standard brake-handle systems' },
  { label: 'Finish Range', value: ['First coat', 'Fill coat', 'Finish coat'] },
  { label: 'Use Case', value: 'Consistent compound crowns over taped seams' },
];

export default function TechnicalSpecificationsPreview() {
  return (
    <>
      <SEOHead
        noindex
        title="Technical Specifications Preview"
        description="Preview page for the Drywall Toolbox product technical specifications component."
      />

      <div className="page-wrapper bg-slate-50">
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">
              Component preview
            </p>
            <h1 className="mb-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Drywall Tool Technical Specifications
            </h1>
            <p className="text-base font-medium leading-7 text-slate-600">
              Production component rendering structured product specs, priority values, and kit contents.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
            <div className="min-w-0">
              <TechnicalSpecifications
                title="Automatic Taper Specifications"
                specs={automaticTaperSpecs}
              />
            </div>

            <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                Responsive states
              </p>
              <div className="grid gap-3 text-sm font-semibold text-slate-700">
                <span className="rounded-md bg-slate-50 px-3 py-2">Mobile: stacked data rows</span>
                <span className="rounded-md bg-slate-50 px-3 py-2">Tablet: two-column kit grid</span>
                <span className="rounded-md bg-slate-50 px-3 py-2">Desktop: four primary spec tiles</span>
              </div>
            </aside>
          </div>

          <div className="mt-10">
            <TechnicalSpecifications
              title="Flat Box Specifications"
              specs={flatBoxSpecs}
            />
          </div>
        </section>
      </div>
    </>
  );
}
