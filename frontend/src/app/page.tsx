"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Sparkles,
  RefreshCw,
  Menu,
} from "lucide-react";
import { useForms, useDuplicateForm } from "@/hooks/useForms";
import { FormListItem } from "@/lib/types";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { FormCard } from "@/components/dashboard/FormCard";
import { CreateFormModal } from "@/components/dashboard/CreateFormModal";
import { ShareModal } from "@/components/dashboard/ShareModal";
import { RenameModal } from "@/components/dashboard/RenameModal";
import { DeleteModal } from "@/components/dashboard/DeleteModal";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";

type FilterStatus = "all" | "published" | "draft";
type SortOption =
  | "updated_desc"
  | "updated_asc"
  | "title_asc"
  | "title_desc"
  | "responses_desc";

export default function DashboardPage() {
  const { data: forms, isLoading, isError, refetch, isRefetching } = useForms();
  const duplicateMutation = useDuplicateForm();

  // Search, Filter, Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortOption>("updated_desc");

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [shareModalForm, setShareModalForm] = useState<FormListItem | null>(null);
  const [renameModalForm, setRenameModalForm] = useState<FormListItem | null>(null);
  const [deleteModalForm, setDeleteModalForm] = useState<FormListItem | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter & Sort calculation
  const filteredAndSortedForms = useMemo(() => {
    if (!forms) return [];

    let result = [...forms];

    // Status filter
    if (filterStatus !== "all") {
      result = result.filter((f) => f.status === filterStatus);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          (f.slug && f.slug.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "updated_desc":
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        case "updated_asc":
          return (
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          );
        case "title_asc":
          return a.title.localeCompare(b.title);
        case "title_desc":
          return b.title.localeCompare(a.title);
        case "responses_desc":
          return b.response_count - a.response_count;
        default:
          return 0;
      }
    });

    return result;
  }, [forms, filterStatus, searchQuery, sortBy]);

  // Counts for tabs
  const publishedCount = useMemo(
    () => forms?.filter((f) => f.status === "published").length || 0,
    [forms]
  );
  const draftCount = useMemo(
    () => forms?.filter((f) => f.status === "draft").length || 0,
    [forms]
  );

  return (
    <div className="flex h-screen bg-white text-[#2B2530] font-sans overflow-hidden">
      {/* Left Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        formCount={forms?.length}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#FCFCFD]">
        {/* Workspace Top Header */}
        <header className="px-4 md:px-8 py-5 md:py-6 border-b border-[#E6E6E8] bg-white sticky top-0 z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-[8px] border border-[#E6E6E8] hover:bg-[#F5F5F5] text-[#2B2530] transition-colors"
                aria-label="Open workspace menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-[#2B2530] tracking-tight">
                  My workspace
                </h1>
                <p className="text-xs text-[#6B6570] mt-0.5">
                  {forms?.length === 1
                    ? "1 form in this workspace"
                    : `${forms?.length ?? 0} forms in this workspace`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isRefetching}
                className="w-9 h-9 rounded-[8px] border border-[#E6E6E8] hover:bg-[#F5F5F5] flex items-center justify-center text-[#6B6570] hover:text-[#2B2530] transition-colors disabled:opacity-50"
                title="Refresh forms"
                aria-label="Refresh forms"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
                />
              </button>

              <Button
                variant="primary"
                size="md"
                onClick={() => setCreateModalOpen(true)}
                className="gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create form</span>
              </Button>
            </div>
          </div>

          {/* Search, Filter Pills & Sort Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-6 pt-4 border-t border-[#F0EFF2]">
            {/* Left: Status Filter Pills */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors ${
                  filterStatus === "all"
                    ? "bg-[#2B2530] text-white"
                    : "text-[#6B6570] hover:bg-[#F0EFF2]"
                }`}
              >
                All ({forms?.length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("published")}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors ${
                  filterStatus === "published"
                    ? "bg-[#2B2530] text-white"
                    : "text-[#6B6570] hover:bg-[#F0EFF2]"
                }`}
              >
                Published ({publishedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("draft")}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors ${
                  filterStatus === "draft"
                    ? "bg-[#2B2530] text-white"
                    : "text-[#6B6570] hover:bg-[#F0EFF2]"
                }`}
              >
                Draft ({draftCount})
              </button>
            </div>

            {/* Right: Search Input & Sort Dropdown */}
            <div className="flex items-center gap-2.5">
              {/* Search Box */}
              <div className="relative w-full md:w-60">
                <Search className="w-4 h-4 text-[#A8A3AD] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search forms..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E6E6E8] rounded-[8px] text-xs text-[#2B2530] placeholder-[#A8A3AD] focus:outline-hidden focus:border-[#2B2530]"
                />
              </div>

              {/* Sort Selector */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none bg-white border border-[#E6E6E8] rounded-[8px] pl-3 pr-8 py-1.5 text-xs text-[#2B2530] font-medium focus:outline-hidden focus:border-[#2B2530] cursor-pointer"
                >
                  <option value="updated_desc">Recently updated</option>
                  <option value="updated_asc">Oldest updated</option>
                  <option value="title_asc">Name (A-Z)</option>
                  <option value="title_desc">Name (Z-A)</option>
                  <option value="responses_desc">Most responses</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#A8A3AD] absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 flex-1">
          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-44 bg-[#F5F5F5] rounded-[16px] border border-[#E6E6E8]"
                />
              ))}
            </div>
          )}

          {/* Backend Error State */}
          {isError && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-[14px] text-red-900 space-y-3">
              <h3 className="font-semibold text-sm">Failed to connect to backend API</h3>
              <p className="text-xs text-red-700 leading-relaxed">
                Make sure the FastAPI backend is running on port 8000 (
                <code className="bg-red-100 px-1 py-0.5 rounded">./backend/venv/bin/uvicorn app.main:app</code>).
              </p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Retry connection
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && forms && forms.length === 0 && (
            <EmptyState
              isSearch={false}
              onCreateForm={() => setCreateModalOpen(true)}
            />
          )}

          {/* No search matches */}
          {!isLoading &&
            !isError &&
            forms &&
            forms.length > 0 &&
            filteredAndSortedForms.length === 0 && (
              <EmptyState
                isSearch={true}
                searchTerm={searchQuery}
                onClearSearch={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                }}
                onCreateForm={() => setCreateModalOpen(true)}
              />
            )}

          {/* Form Cards Grid */}
          {!isLoading &&
            !isError &&
            filteredAndSortedForms.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAndSortedForms.map((form) => (
                  <FormCard
                    key={form.id}
                    form={form}
                    onShare={(f) => setShareModalForm(f)}
                    onRename={(f) => setRenameModalForm(f)}
                    onDuplicate={(f) => duplicateMutation.mutate(f.id)}
                    onDelete={(f) => setDeleteModalForm(f)}
                  />
                ))}
              </div>
            )}
        </div>
      </main>

      {/* Interactive Modals */}
      <CreateFormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      <ShareModal
        form={shareModalForm}
        isOpen={!!shareModalForm}
        onClose={() => setShareModalForm(null)}
      />

      <RenameModal
        form={renameModalForm}
        isOpen={!!renameModalForm}
        onClose={() => setRenameModalForm(null)}
      />

      <DeleteModal
        form={deleteModalForm}
        isOpen={!!deleteModalForm}
        onClose={() => setDeleteModalForm(null)}
      />
    </div>
  );
}
