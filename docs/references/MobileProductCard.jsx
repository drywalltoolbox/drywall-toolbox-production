export function FashionCard() {
  return (
    <div className="w-60 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl overflow-hidden group">
      
      {/* Image area */}
      <div className="relative h-64 bg-linear-to-br from-zinc-900 to-zinc-800 flex items-center justify-center overflow-hidden">
        
        <div className="absolute inset-0 bg-linear-to-br from-rose-900/30 via-transparent to-purple-900/30" />

        {/* Package SVG */}
        <svg
          className="w-24 h-24 text-zinc-600 group-hover:scale-105 transition-transform duration-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16.5 9.4 7.5 4.21" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          
          {/* Heart button */}
          <button className="p-2.5 rounded-full bg-white text-zinc-900 hover:bg-rose-500 hover:text-white transition-colors">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
          </button>

          {/* Quick Add */}
          <button className="px-4 py-2 rounded-full bg-white text-zinc-900 text-xs font-semibold hover:bg-indigo-600 hover:text-white transition-colors">
            Quick Add
          </button>

          {/* Shopping cart */}
          <button className="p-2.5 rounded-full bg-white text-zinc-900 hover:bg-indigo-500 hover:text-white transition-colors">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.6a2 2 0 0 0 2-1.6L23 6H6" />
            </svg>
          </button>

        </div>

        <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold tracking-wide uppercase">
          Hot
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
          Zara Collection
        </p>

        <h3 className="font-semibold text-white text-sm mb-2 line-clamp-1">
          Oversized Linen Blazer
        </h3>

        <div className="flex items-center justify-between">
          
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white">$124.00</span>
            <span className="text-xs text-zinc-500 line-through">$185.00</span>
          </div>

          <div className="flex gap-1">
            {["#18181b", "#f4f4f5", "#92400e"].map((c) => (
              <span
                key={c}
                className="w-4 h-4 rounded-full border border-zinc-700 cursor-pointer hover:scale-110 transition-transform"
                style={{ background: c }}
              />
            ))}
          </div>

        </div>
      </div>

    </div>
  );
}