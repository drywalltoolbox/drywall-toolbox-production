export function QuickBuyCard() {
  return (
    <div className="w-80 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md overflow-hidden flex group hover:shadow-lg transition-shadow duration-300">

      {/* Thumbnail */}
      <div className="relative w-32 shrink-0 bg-linear-to-br from-sky-100 to-blue-100 dark:from-sky-950/60 dark:to-blue-950/60 flex items-center justify-center overflow-hidden">

        {/* Package SVG */}
        <svg className="w-14 h-14 text-sky-400 dark:text-sky-500 opacity-60 group-hover:scale-110 transition-transform duration-300"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16.5 9.4 7.5 4.21"/>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>

        <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-sky-600 text-white text-[10px] font-semibold">
          -20%
        </span>

      </div>

      {/* Details */}
      <div className="flex-1 p-4 flex flex-col justify-between">

        <div>

          <div className="flex items-center justify-between mb-1">

            <div className="flex items-center gap-0.5">

              {[...Array(5)].map((_, i) => (
                <svg key={i}
                  className={`w-3 h-3 ${i < 4 ? "text-amber-400 fill-amber-400" : "text-zinc-300 dark:text-zinc-600"}`}
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              ))}

              <span className="text-[10px] text-zinc-400 ml-1">4.2</span>

            </div>

            <button className="text-zinc-400 hover:text-rose-500 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>
              </svg>
            </button>

          </div>

          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-0.5 line-clamp-1">
            Sony WH-1000XM5
          </h3>

          <p className="text-xs text-zinc-400 dark:text-zinc-500 line-clamp-1">
            Industry-leading noise cancelling
          </p>

        </div>

        <div className="flex items-center justify-between mt-3">

          <div>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">$279</span>
            <span className="text-xs text-zinc-400 line-through ml-1.5">$349</span>
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors active:scale-95">

            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.6a2 2 0 0 0 2-1.6L23 6H6"/>
            </svg>

            Add
          </button>

        </div>

      </div>

    </div>
  );
}