'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type LayoutContextType = {
  layout: number;
  setLayout: (n: number) => void;
};

const LayoutContext = createContext<LayoutContextType>({
  layout: 1,
  setLayout: () => {},
});

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayoutState] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('bracket-layout');
    const n = saved ? Number(saved) : 1;
    setLayoutState(n);
    document.documentElement.setAttribute('data-layout', String(n));
  }, []);

  const setLayout = useCallback((n: number) => {
    setLayoutState(n);
    localStorage.setItem('bracket-layout', String(n));
    document.documentElement.setAttribute('data-layout', String(n));
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-layout', String(layout));
    }
  }, [layout, mounted]);

  return (
    <LayoutContext.Provider value={{ layout, setLayout }}>
      {children}
      {mounted && <LayoutPillBar layout={layout} setLayout={setLayout} />}
    </LayoutContext.Provider>
  );
}

const LAYOUT_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const LAYOUT_NAMES = ['Clean', 'Neon', 'Brut', 'Gold', 'Term', 'Candy', '8Bit', '8Lt'];

function LayoutPillBar({ layout, setLayout }: { layout: number; setLayout: (n: number) => void }) {
  return (
    <div className="layout-switcher" role="toolbar" aria-label="Switch UI layout">
      {LAYOUT_LABELS.map((label, i) => {
        const n = i + 1;
        return (
          <button
            key={n}
            onClick={() => setLayout(n)}
            className={`layout-pill${layout === n ? ' layout-pill--active' : ''}`}
            title={`Layout ${n}: ${LAYOUT_NAMES[i]}`}
            aria-label={`Layout ${n}: ${LAYOUT_NAMES[i]}`}
            aria-pressed={layout === n}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
