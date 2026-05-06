import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, ChevronLeft, ChevronRight, PackageCheck, Search, ShieldCheck, SlidersHorizontal, Truck, Wrench, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getProductById } from '../services/catalog';
import { getProductVariations } from '../services/api';
import { TOOLSET_BUILDER_CATALOG, TOOLSET_GROUPS, TOOLSET_TEMPLATES, TOOLSET_BRANDS, getToolsetProducts, getDefaultToolsetSelection } from '../data/toolsetBuilderCatalog';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function classNames(...values) { return values.filter(Boolean).join(' '); }

function stepKey(index, group) { return `step_${index}_${group}`; }

function toCartProduct(row, resolvedProduct = null, resolvedVariation = null) {
  const source = resolvedVariation || resolvedProduct || {};
  return {
    id: source.id || row.sku,
    name: source.name || row.name,
    brand: source.brand || row.brand,
    price: Number(source.price || row.price || 0),
    image: source.image || row.image,
    part_number: source.part_number || row.mpn || row.sku,
    sku: source.sku || row.sku,
    parent_id: source.parent_id || resolvedProduct?.id || null,
    variation_attribute_values: source.variation_attribute_values || null,
    toolset_builder: true,
  };
}

async function resolveCatalogRow(row) {
  if (!row?.sku) return { product: null, variation: null };
  if (row.type !== 'variation') {
    return { product: await getProductById(row.sku), variation: null };
  }

  const parent = row.parentSku ? await getProductById(row.parentSku) : null;
  if (!parent?.id) return { product: null, variation: null };

  const variations = await getProductVariations(parent.id);
  const variation = variations.find((item) => item.sku === row.sku || item.part_number === row.sku) || null;
  return { product: parent, variation };
}

export default function ToolsetBuilder() {
  const { addToCart } = useCart();
  const [brand, setBrand] = useState(TOOLSET_BRANDS[0] || 'Columbia');
  const [templateId, setTemplateId] = useState('full_automatic_set');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const template = useMemo(() => TOOLSET_TEMPLATES.find((item) => item.id === templateId) || TOOLSET_TEMPLATES[0], [templateId]);
  const [selection, setSelection] = useState(() => getDefaultToolsetSelection(TOOLSET_BRANDS[0] || 'Columbia', TOOLSET_TEMPLATES[0]));

  const steps = template.requiredGroups;
  const activeGroup = steps[currentStepIndex];
  const activeKey = stepKey(currentStepIndex, activeGroup);

  const selectedRows = useMemo(() => steps.map((group, index) => {
    const sku = selection[stepKey(index, group)];
    return getToolsetProducts({ brand, group }).find((item) => item.sku === sku) || null;
  }).filter(Boolean), [brand, selection, steps]);

  const subtotal = selectedRows.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const discount = subtotal * ((template.discountPercent || 0) / 100);
  const total = Math.max(0, subtotal - discount);
  const completion = Math.round((selectedRows.length / steps.length) * 100);

  const activeOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return getToolsetProducts({ brand, group: activeGroup })
      .filter((item) => !q || `${item.name} ${item.sku} ${item.mpn} ${item.sizeLabel}`.toLowerCase().includes(q))
      .sort((a, b) => Number(b.inStock) - Number(a.inStock) || a.sortKey - b.sortKey || a.name.localeCompare(b.name));
  }, [brand, activeGroup, query]);

  const resetFor = (nextBrand, nextTemplate = template) => {
    setBrand(nextBrand);
    setSelection(getDefaultToolsetSelection(nextBrand, nextTemplate));
    setCurrentStepIndex(0);
    setQuery('');
  };

  const changeTemplate = (nextTemplateId) => {
    const nextTemplate = TOOLSET_TEMPLATES.find((item) => item.id === nextTemplateId) || template;
    setTemplateId(nextTemplateId);
    resetFor(brand, nextTemplate);
  };

  const addConfiguredSet = async () => {
    setAddError('');
    setIsAdding(true);
    try {
      for (const row of selectedRows) {
        const { product, variation } = await resolveCatalogRow(row);
        addToCart(toCartProduct(row, product, variation), 1);
      }
    } catch (error) {
      setAddError(error?.message || 'Unable to add the configured set.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.28),transparent_35%),linear-gradient(135deg,#020617_0%,#0f172a_65%,#111827_100%)]">
        <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-sky-100">Toolset Builder</div>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">Build a toolset from the official WooCommerce catalog.</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">Configured from {TOOLSET_BUILDER_CATALOG.productCount} sellable non-parts catalog rows across {TOOLSET_BRANDS.length} brands, with variation SKU, parent SKU, price, stock state, images, and MPN preserved.</p>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 lg:grid-cols-[minmax(0,1fr)_390px]">
        <section className="space-y-6">
          <Panel title="1. Brand" icon={<ShieldCheck size={18} />}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {TOOLSET_BRANDS.map((item) => (
                <button key={item} type="button" onClick={() => resetFor(item)} className={classNames('rounded-2xl border p-4 text-left transition', brand === item ? 'border-sky-300 bg-sky-400/15' : 'border-white/10 bg-white/[0.04] hover:border-white/25')}>
                  <div className="flex items-center justify-between gap-3"><span className="font-black">{item}</span>{brand === item ? <Check size={17} className="text-sky-200" /> : null}</div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{Object.values(TOOLSET_BUILDER_CATALOG.countsByBrandAndGroup[item] || {}).reduce((a, b) => a + b, 0)} builder products</p>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="2. Template" icon={<PackageCheck size={18} />}>
            <div className="grid gap-3">
              {TOOLSET_TEMPLATES.map((item) => (
                <button key={item.id} type="button" onClick={() => changeTemplate(item.id)} className={classNames('rounded-2xl border p-4 text-left transition', templateId === item.id ? 'border-emerald-300 bg-emerald-400/10' : 'border-white/10 bg-white/[0.04] hover:border-white/25')}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div><p className="font-black">{item.label}</p><p className="mt-1 text-sm leading-6 text-slate-400">{item.description}</p></div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300">{item.requiredGroups.length} steps</span>
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="3. Configure" icon={<SlidersHorizontal size={18} />}>
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div><h2 className="text-2xl font-black">{TOOLSET_GROUPS[activeGroup]?.label || activeGroup}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{TOOLSET_GROUPS[activeGroup]?.description}</p></div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2"><Search size={16} className="text-slate-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-52 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="Search SKU or product" />{query ? <button onClick={() => setQuery('')}><X size={15} /></button> : null}</div>
            </div>

            <div className="mb-5 overflow-x-auto pb-2"><div className="flex min-w-max gap-2">{steps.map((group, index) => <button key={`${index}-${group}`} onClick={() => setCurrentStepIndex(index)} className={classNames('rounded-full border px-4 py-2 text-sm font-black', index === currentStepIndex ? 'border-sky-300 bg-sky-400/15 text-sky-100' : selection[stepKey(index, group)] ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100' : 'border-white/10 bg-white/[0.04] text-slate-400')}>{index + 1}. {TOOLSET_GROUPS[group]?.label || group}</button>)}</div></div>

            <AnimatePresence mode="wait"><motion.div key={`${brand}-${templateId}-${activeGroup}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activeOptions.map((item) => {
                const selected = selection[activeKey] === item.sku;
                return <button key={item.sku} type="button" onClick={() => setSelection((prev) => ({ ...prev, [activeKey]: item.sku }))} className={classNames('flex min-h-[210px] flex-col rounded-3xl border p-4 text-left transition', selected ? 'border-sky-300 bg-sky-400/15' : 'border-white/10 bg-slate-950/50 hover:border-white/25 hover:bg-white/[0.07]')}>
                  <div className="mb-4 flex items-start justify-between gap-3"><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/10">{item.image ? <img src={item.image} alt="" className="h-full w-full object-contain" /> : <Wrench size={22} />}</div><span className="rounded-full bg-white/10 px-3 py-1 text-sm font-black">{currency.format(item.price)}</span></div>
                  <h3 className="text-sm font-black leading-6">{item.name}</h3><p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">SKU {item.sku}{item.parentSku ? ` · Parent ${item.parentSku}` : ''}</p>{item.sizeLabel ? <p className="mt-2 text-sm text-slate-300">{item.sizeLabel}</p> : null}<p className="mt-2 flex-1 text-sm leading-6 text-slate-400">{item.inStock ? 'In stock' : 'Out of stock / verify availability before checkout'}</p><div className="mt-4 border-t border-white/10 pt-3 text-sm font-black text-sky-100">{selected ? 'Selected' : 'Select'}</div>
                </button>;
              })}
            </motion.div></AnimatePresence>

            <div className="mt-6 flex justify-between border-t border-white/10 pt-5"><button disabled={currentStepIndex === 0} onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-sm font-black disabled:opacity-40"><ChevronLeft size={17} />Previous</button><button disabled={currentStepIndex === steps.length - 1} onClick={() => setCurrentStepIndex((i) => Math.min(steps.length - 1, i + 1))} className="inline-flex items-center gap-2 rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-40">Next<ChevronRight size={17} /></button></div>
          </Panel>
        </section>

        <aside className="lg:sticky lg:top-28 lg:self-start"><div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-5 shadow-2xl ring-1 ring-white/5"><p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Bundle summary</p><h2 className="mt-2 text-2xl font-black">{brand} {template.label}</h2><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gradient-to-r from-sky-400 to-emerald-300" style={{ width: `${completion}%` }} /></div><div className="mt-5 grid gap-2">{selectedRows.map((item, index) => <div key={`${index}-${item.sku}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3"><div className="flex justify-between gap-3"><div><p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-500">{TOOLSET_GROUPS[item.optionGroup]?.label}</p><p className="mt-1 text-sm font-bold leading-5">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.sku}</p></div><p className="text-sm font-black">{currency.format(item.price)}</p></div></div>)}</div><div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4"><PriceRow label="Subtotal" value={subtotal} /><PriceRow label={`${template.discountPercent}% builder savings`} value={-discount} highlight /><div className="my-3 border-t border-white/10" /><div className="flex justify-between"><span className="font-black">Estimated total</span><span className="text-2xl font-black">{currency.format(total)}</span></div></div><div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/[0.035] px-3 py-2 text-sm font-semibold text-slate-300"><Truck size={16} className="text-emerald-300" /> Free ground shipping eligibility must be verified by checkout rules.</div>{addError ? <p className="mt-3 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{addError}</p> : null}<button onClick={addConfiguredSet} disabled={isAdding || selectedRows.length === 0} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-4 text-sm font-black text-slate-950 disabled:opacity-50"><PackageCheck size={18} />{isAdding ? 'Adding…' : 'Add configured set to cart'}</button></div></aside>
      </main>
    </div>
  );
}

function Panel({ title, icon, children }) { return <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 md:p-5"><div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-400"><span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-sky-200">{icon}</span>{title}</div>{children}</section>; }
function PriceRow({ label, value, highlight = false }) { return <div className="mb-2 flex justify-between text-sm"><span className="font-semibold text-slate-400">{label}</span><span className={highlight ? 'font-black text-emerald-300' : 'font-black text-slate-200'}>{value < 0 ? `-${currency.format(Math.abs(value))}` : currency.format(value)}</span></div>; }
