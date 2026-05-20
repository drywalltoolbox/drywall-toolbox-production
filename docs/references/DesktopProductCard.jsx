export function ProductCard() {
  return (
    <div className="w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors duration-300">
      <div className="relative h-44 bg-linear-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center overflow-hidden">
        <svg className="w-20 h-20 text-zinc-400 dark:text-zinc-600 group-hover:scale-110 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.5 4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">-30%</span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">Air Max Comfort Sneakers</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">Lightweight mesh upper, cushioned sole</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">$69.99</span>
            <span className="text-xs text-zinc-400 line-through ml-2">$99.99</span>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-opacity active:scale-95">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}