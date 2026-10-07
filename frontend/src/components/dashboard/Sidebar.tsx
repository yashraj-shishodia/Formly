"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  LayoutTemplate,
  Puzzle,
  Users2,
  ChevronDown,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface SidebarProps {
  formCount?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  formCount = 0,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Workspace",
      icon: FolderKanban,
      href: "/",
      badge: formCount > 0 ? `${formCount}` : undefined,
      active: pathname === "/" || pathname?.startsWith("/forms"),
      disabled: false,
    },
    {
      label: "Templates",
      icon: LayoutTemplate,
      href: "#",
      badge: "Coming Soon",
      isComingSoon: true,
      active: false,
      disabled: true,
    },
    {
      label: "Integrations",
      icon: Puzzle,
      href: "#",
      badge: "Coming Soon",
      isComingSoon: true,
      active: false,
      disabled: true,
    },
    {
      label: "Team",
      icon: Users2,
      href: "#",
      badge: "Coming Soon",
      isComingSoon: true,
      active: false,
      disabled: true,
    },
  ];

  const content = (
    <div className="flex flex-col justify-between h-full">
      {/* Top Branding & Workspace Selector */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[var(--border)]">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* Formly Two-Rectangle Emblem */}
            <div className="relative w-7 h-7 flex items-center justify-center">
              <div
                className="absolute w-3.5 h-6 rounded-[3px] -left-0.5 group-hover:scale-105 transition-transform"
                style={{ backgroundColor: "var(--text-primary)" }}
              />
              <div
                className="absolute w-3.5 h-3.5 opacity-80 rounded-[3px] -right-0.5 top-2.5 group-hover:scale-105 transition-transform"
                style={{ backgroundColor: "var(--text-primary)" }}
              />
            </div>
            <span className="font-bold text-[19px] tracking-tight text-[var(--text-primary)]">
              Formly
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-[var(--surface-canvas)] text-[var(--text-secondary)] rounded-[4px]">
              v1.0
            </span>
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="md:hidden p-1 rounded-[6px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-canvas)] transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Current Workspace Dropdown Pill */}
        <div className="p-4">
          <div className="flex items-center justify-between px-3 py-2 bg-[var(--surface-card)] rounded-[10px] border border-[var(--border)] shadow-xs cursor-default">
            <div className="flex items-center gap-2.5 truncate">
              <div
                className="w-6 h-6 rounded-[6px] text-white flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor: "var(--primary)" }}
              >
                W
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  My Workspace
                </span>
                <span className="text-[10px] text-[var(--text-secondary)]">Personal</span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.disabled) {
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[13px] font-medium text-[var(--text-muted)] cursor-not-allowed group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                    <span>{item.label}</span>
                  </div>
                  {item.isComingSoon && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--accent-publish)] bg-[var(--accent-publish)]/10 border border-[var(--accent-publish)]/20 px-1.5 py-0.5 rounded-[4px]">
                      <span className="w-1.5 h-1.5 rotate-45 border border-[var(--accent-publish)]" />
                      Soon
                    </span>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[13px] font-medium transition-colors ${
                  item.active
                    ? "bg-[var(--surface-canvas)] text-[var(--text-primary)] font-semibold"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-card-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      item.active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-[var(--surface-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Theme Toggle & User Profile */}
      <div className="p-4 border-t border-[var(--border)] space-y-3">
        {/* Accessible Theme Toggle */}
        <ThemeToggle variant="full" />

        {/* User Profile Card */}
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-2.5 truncate">
            {/* Round Avatar per DESIGN_SPEC */}
            <div className="w-8 h-8 rounded-full bg-[var(--surface-row)] border border-[var(--border-strong)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center shrink-0">
              YS
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                Yashraj Shishodia
              </span>
              <span className="text-[11px] text-[var(--text-secondary)] truncate">
                creator@formly.io
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[var(--accent-publish)]/10 text-[var(--accent-publish)] rounded-[4px] border border-[var(--accent-publish)]/20">
            Free
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-[var(--border)] bg-[var(--surface-inner)] flex-col justify-between h-screen shrink-0 select-none">
        {content}
      </aside>

      {/* Mobile Off-canvas Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-[var(--surface-inner)] shadow-2xl flex flex-col justify-between h-full select-none z-10 animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
