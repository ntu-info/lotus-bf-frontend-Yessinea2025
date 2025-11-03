
import { useCallback, useRef, useState, useEffect } from 'react'
import { Terms } from './components/Terms'
import { QueryBuilder } from './components/QueryBuilder'
import { Studies } from './components/Studies'
import { NiiViewer } from './components/NiiViewer'
import { useUrlQueryState } from './hooks/useUrlQueryState'
import './App.css'

export default function App () {
  const [query, setQuery] = useUrlQueryState('q')

  const handlePickTerm = useCallback((t) => {
    setQuery((q) => (q ? `${q} ${t}` : t))
  }, [setQuery])

  // --- resizable panes state ---
  const gridRef = useRef(null)
  const [sizes, setSizes] = useState([28, 44, 28]) // [left, middle, right]
  const [mobileHeights, setMobileHeights] = useState([33, 34, 33]); // % heights for mobile
  const MIN_MOBILE_PX = 80;

  // Detect mobile view (responsive)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 1023px)')
    const update = () => setIsMobile(mq.matches)
    update() // initial check
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Desktop drag (horizontal)
  const startDrag = (which, e) => {
    if (isMobile) return;
    e.preventDefault();
    const startX = e.clientX;
    const rect = gridRef.current.getBoundingClientRect();
    const total = rect.width;
    const curPx = sizes.map(p => (p / 100) * total);
    const onMouseMove = (ev) => {
      const dx = ev.clientX - startX;
      if (which === 0) {
        let newLeft = curPx[0] + dx;
        let newMid = curPx[1] - dx;
        if (newLeft < 240) { newMid -= (240 - newLeft); newLeft = 240; }
        if (newMid < 240) { newLeft -= (240 - newMid); newMid = 240; }
        const s0 = (newLeft / total) * 100;
        const s1 = (newMid / total) * 100;
        const s2 = 100 - s0 - s1;
        setSizes([s0, s1, Math.max(s2, 0)]);
      } else {
        let newMid = curPx[1] + dx;
        let newRight = curPx[2] - dx;
        if (newMid < 240) { newRight -= (240 - newMid); newMid = 240; }
        if (newRight < 240) { newMid -= (240 - newRight); newRight = 240; }
        const s1 = (newMid / total) * 100;
        const s2 = (newRight / total) * 100;
        const s0 = (curPx[0] / total) * 100;
        setSizes([s0, s1, Math.max(s2, 0)]);
      }
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Mobile drag (vertical)
  const startMobileDrag = (which, e) => {
    if (!isMobile) return;
    e.preventDefault();
    const startY = e.clientY;
    const grid = gridRef.current;
    const total = grid ? grid.getBoundingClientRect().height : window.innerHeight;
    const curPx = mobileHeights.map(p => (p / 100) * total);
    const onMouseMove = (ev) => {
      const dy = ev.clientY - startY;
      if (which === 0) {
        let newTop = curPx[0] + dy;
        let newMid = curPx[1] - dy;
        if (newTop < MIN_MOBILE_PX) { newMid -= (MIN_MOBILE_PX - newTop); newTop = MIN_MOBILE_PX; }
        if (newMid < MIN_MOBILE_PX) { newTop -= (MIN_MOBILE_PX - newMid); newMid = MIN_MOBILE_PX; }
        const s0 = (newTop / total) * 100;
        const s1 = (newMid / total) * 100;
        const s2 = 100 - s0 - s1;
        setMobileHeights([s0, s1, Math.max(s2, 0)]);
      } else {
        let newMid = curPx[1] + dy;
        let newBot = curPx[2] - dy;
        if (newMid < MIN_MOBILE_PX) { newBot -= (MIN_MOBILE_PX - newMid); newMid = MIN_MOBILE_PX; }
        if (newBot < MIN_MOBILE_PX) { newMid -= (MIN_MOBILE_PX - newBot); newBot = MIN_MOBILE_PX; }
        const s1 = (newMid / total) * 100;
        const s2 = (newBot / total) * 100;
        const s0 = (curPx[0] / total) * 100;
        setMobileHeights([s0, s1, Math.max(s2, 0)]);
      }
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="app">
      {/* Inline style injection to enforce no-hover look */}
      <style>{`
        :root {
          --primary-600: #2563eb;
          --primary-700: #1d4ed8;
          --primary-800: #1e40af;
          --border: #e5e7eb;
        }
        .app { padding-right: 0 !important; }
        .app__grid { width: 100vw; max-width: 100vw; }
        .card input[type="text"],
        .card input[type="search"],
        .card input[type="number"],
        .card select,
        .card textarea {
          width: 100% !important;
          max-width: 100% !important;
          display: block;
        }
        /* Downsized buttons */
        .card button,
        .card [role="button"],
        .card .btn,
        .card .button {
          font-size: 12px !important;
          padding: 4px 8px !important;
          border-radius: 8px !important;
          line-height: 1.2 !important;
          background: var(--primary-600) !important;
          color: #fff !important;
          border: none !important;
        }
        /* No visual change on hover/active */
        .card button:hover,
        .card button:active,
        .card [role="button"]:hover,
        .card [role="button"]:active,
        .card .btn:hover,
        .card .btn:active,
        .card .button:hover,
        .card .button:active {
          background: var(--primary-600) !important;
          color: #fff !important;
        }
        /* Toolbars / chips also no-hover */
        .card .toolbar button,
        .card .toolbar [role="button"],
        .card .toolbar .btn,
        .card .toolbar .button,
        .card .qb-toolbar button,
        .card .qb-toolbar [role="button"],
        .card .qb-toolbar .btn,
        .card .qb-toolbar .button,
        .card .query-builder button,
        .card .query-builder [role="button"],
        .card .query-builder .btn,
        .card .query-builder .button,
        .card .chip,
        .card .pill,
        .card .tag {
          background: var(--primary-600) !important;
          color: #fff !important;
          border: none !important;
        }
        .card .toolbar button:hover,
        .card .qb-toolbar button:hover,
        .card .query-builder button:hover,
        .card .chip:hover,
        .card .pill:hover,
        .card .tag:hover,
        .card .toolbar button:active,
        .card .qb-toolbar button:active,
        .card .query-builder button:active {
          background: var(--primary-600) !important;
          color: #fff !important;
        }
        /* Disabled stays same color but dimmer for affordance */
        .card .toolbar button:disabled,
        .card .qb-toolbar button:disabled,
        .card .query-builder button:disabled,
        .card button[disabled],
        .card [aria-disabled="true"] {
          background: var(--primary-600) !important;
          color: #fff !important;
          opacity: .55 !important;
        }
      `}</style>

      <header className="app__header">
        <h1 className="app__title">LoTUS-BF</h1>
        <div className="app__subtitle">Location-or-Term Unified Search for Brain Functions</div>
      </header>

      <main className="app__grid" ref={gridRef}>
        {isMobile ? (
          <>
            <section className="card" style={{ height: `${Math.max(mobileHeights[0], 15)}%`, minHeight: 80 }}>
              <div className="card__title">Terms</div>
              <Terms onPickTerm={handlePickTerm} />
            </section>
            <div className="resizer resizer-horizontal" aria-label="Resize top/middle" />
            <section className="card card--stack" style={{ height: `${Math.max(mobileHeights[1], 15)}%`, minHeight: 80 }}>
              <QueryBuilder query={query} setQuery={setQuery} />
              <div className="divider" />
              <Studies query={query} />
            </section>
            <div className="resizer resizer-horizontal" aria-label="Resize middle/bottom" />
            <section className="card" style={{ height: `${Math.max(mobileHeights[2], 15)}%`, minHeight: 80 }}>
              <NiiViewer query={query} />
            </section>
          </>
        ) : (
          <>
            <section className="card" style={{ flexBasis: `${sizes[0]}%` }}>
              <div className="card__title">Terms</div>
              <Terms onPickTerm={handlePickTerm} />
            </section>
            <div className="resizer" aria-label="Resize left/middle" onMouseDown={(e) => startDrag(0, e)} />
            <section className="card card--stack" style={{ flexBasis: `${sizes[1]}%` }}>
              <QueryBuilder query={query} setQuery={setQuery} />
              <div className="divider" />
              <Studies query={query} />
            </section>
            <div className="resizer" aria-label="Resize middle/right" onMouseDown={(e) => startDrag(1, e)} />
            <section className="card" style={{ flexBasis: `${sizes[2]}%` }}>
              <NiiViewer query={query} />
            </section>
          </>
        )}
      </main>
    </div>
  )
}
