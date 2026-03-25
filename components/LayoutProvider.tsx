'use client';

import { createContext, useEffect, useState, useCallback, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

type LayoutContextType = {
  layout: number;
  setLayout: (n: number) => void;
};

const AVAILABLE_LAYOUTS = [3, 7, 8];
const DEFAULT_LAYOUT = 8;

const LayoutContext = createContext<LayoutContextType>({
  layout: DEFAULT_LAYOUT,
  setLayout: () => {},
});

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayoutState] = useState(DEFAULT_LAYOUT);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('bracket-layout');
    const n = saved ? Number(saved) : DEFAULT_LAYOUT;
    const valid = AVAILABLE_LAYOUTS.includes(n) ? n : DEFAULT_LAYOUT;
    setLayoutState(valid);
    document.documentElement.setAttribute('data-layout', String(valid));
  }, []);

  const setLayout = useCallback((n: number) => {
    const valid = AVAILABLE_LAYOUTS.includes(n) ? n : DEFAULT_LAYOUT;
    setLayoutState(valid);
    localStorage.setItem('bracket-layout', String(valid));
    document.documentElement.setAttribute('data-layout', String(valid));
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-layout', String(layout));
    }
  }, [layout, mounted]);

  return (
    <LayoutContext.Provider value={{ layout, setLayout }}>
      {children}
      {mounted && <LayoutDropdown layout={layout} setLayout={setLayout} />}
    </LayoutContext.Provider>
  );
}

const LAYOUT_NAMES: Record<number, string> = {
  3: 'Yellow',
  7: 'Pac-man',
  8: 'MarioKart',
};

function LayoutDropdown({ layout, setLayout }: { layout: number; setLayout: (n: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div
      ref={ref}
      className="layout-switcher-dropdown"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 99999,
      }}
    >
      <button
        className="layout-dropdown-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch UI layout"
      >
        <span>{LAYOUT_NAMES[layout]}</span>
        <ChevronDown
          size={14}
          style={{
            transition: 'transform 0.15s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Layout options"
          className="layout-dropdown-menu"
        >
          {AVAILABLE_LAYOUTS.map((n) => (
            <li key={n} role="option" aria-selected={layout === n}>
              <button
                onClick={() => {
                  setLayout(n);
                  setOpen(false);
                }}
                className={`layout-dropdown-item${layout === n ? ' layout-dropdown-item--active' : ''}`}
              >
                {LAYOUT_NAMES[n]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
