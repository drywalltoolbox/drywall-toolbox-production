/**
 * PageTransition
 *
 * Wraps page content and plays a smooth fade + upward-drift animation
 * every time the component mounts (i.e. on every route change).
 *
 * Usage:
 *   <PageTransition locationKey={location.pathname}>
 *     <Routes>…</Routes>
 *   </PageTransition>
 *
 * The `locationKey` prop is forwarded as the React `key` so React unmounts
 * and remounts this wrapper on every navigation, reliably re-triggering the
 * CSS animation without any JavaScript timers.
 */
export default function PageTransition({ children, locationKey }) {
  return (
    <div key={locationKey} className="dtb-page-in" style={{ width: '100%' }}>
      {children}
    </div>
  );
}
