"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";

function MenuIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopHidden, setDesktopHidden] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      {!desktopHidden && (
        <div className="hidden lg:flex">
          <Sidebar onCollapse={() => setDesktopHidden(true)} />
        </div>
      )}

      {/* Mobile drawer + backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 z-50 shadow-xl">
            <Sidebar
              onNavigate={() => setMobileOpen(false)}
              onCollapse={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar: always on mobile; on desktop only when sidebar hidden */}
        <header
          className={`flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 ${
            desktopHidden ? "flex" : "lg:hidden"
          }`}
        >
          <button
            type="button"
            aria-label="Open menu"
            className="rounded-md p-1 text-slate-600 hover:bg-slate-100"
            onClick={() => {
              setMobileOpen(true);
              setDesktopHidden(false);
            }}
          >
            <MenuIcon />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-sm font-bold text-white">
              P
            </div>
            <span className="text-sm font-bold text-slate-800">Packaging CRM</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
