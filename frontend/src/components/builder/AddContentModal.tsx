"use client";

import React, { useState } from "react";
import {
  X,
  Search,
  Type,
  AlignLeft,
  ListFilter,
  ChevronDownSquare,
  ToggleLeft,
  Mail,
  Hash,
  Star,
  Upload,
  CreditCard,
  FileQuestion,
  Layers,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { QuestionType } from "@/lib/types";

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: QuestionType) => void;
  onEnableWelcomeScreen?: () => void;
  onEnableEndingScreen?: () => void;
}

interface ElementItem {
  id: string;
  type?: QuestionType;
  label: string;
  category: "Text & Video" | "Choice" | "Contact info" | "Rating & ranking" | "Other" | "Structure";
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  disabled?: boolean;
  isComingSoon?: boolean;
  action?: "welcome" | "ending";
}

const FORM_ELEMENTS: ElementItem[] = [
  // Text & Video
  {
    id: "short_text",
    type: "short_text",
    label: "Short Text",
    category: "Text & Video",
    icon: Type,
    iconBg: "bg-[#E1F0FF]",
    iconColor: "text-[#0066CC]",
  },
  {
    id: "long_text",
    type: "long_text",
    label: "Long Text",
    category: "Text & Video",
    icon: AlignLeft,
    iconBg: "bg-[#E1F0FF]",
    iconColor: "text-[#0066CC]",
  },

  // Choice
  {
    id: "multiple_choice",
    type: "multiple_choice",
    label: "Multiple Choice",
    category: "Choice",
    icon: ListFilter,
    iconBg: "bg-[#F3EAFB]",
    iconColor: "text-[#8E4FC0]",
  },
  {
    id: "dropdown",
    type: "dropdown",
    label: "Dropdown",
    category: "Choice",
    icon: ChevronDownSquare,
    iconBg: "bg-[#F3EAFB]",
    iconColor: "text-[#8E4FC0]",
  },
  {
    id: "yes_no",
    type: "yes_no",
    label: "Yes / No",
    category: "Choice",
    icon: ToggleLeft,
    iconBg: "bg-[#F3EAFB]",
    iconColor: "text-[#8E4FC0]",
  },

  // Contact info
  {
    id: "email",
    type: "email",
    label: "Email",
    category: "Contact info",
    icon: Mail,
    iconBg: "bg-[#FDE8F1]",
    iconColor: "text-[#D83A7D]",
  },

  // Rating & ranking
  {
    id: "rating",
    type: "rating",
    label: "Rating",
    category: "Rating & ranking",
    icon: Star,
    iconBg: "bg-[#E6F4EA]",
    iconColor: "text-[#2F7D69]",
  },

  // Other
  {
    id: "number",
    type: "number",
    label: "Number",
    category: "Other",
    icon: Hash,
    iconBg: "bg-[#FEF6E6]",
    iconColor: "text-[#B25E00]",
  },
  {
    id: "file_upload",
    type: "file_upload",
    label: "File Upload",
    category: "Other",
    icon: Upload,
    iconBg: "bg-[#FEF6E6]",
    iconColor: "text-[#B25E00]",
  },
  {
    id: "payment",
    label: "Payment",
    category: "Other",
    icon: CreditCard,
    iconBg: "bg-[#FEF6E6]",
    iconColor: "text-[#B25E00]",
    disabled: true,
    isComingSoon: true,
  },

  // Structure
  {
    id: "welcome_screen",
    label: "Welcome Screen",
    category: "Structure",
    icon: Layers,
    iconBg: "bg-[#F0EFF2]",
    iconColor: "text-[#2B2530]",
    action: "welcome",
  },
  {
    id: "end_screen",
    label: "End Screen",
    category: "Structure",
    icon: FileQuestion,
    iconBg: "bg-[#F0EFF2]",
    iconColor: "text-[#2B2530]",
    action: "ending",
  },
];

export function AddContentModal({
  isOpen,
  onClose,
  onSelectType,
  onEnableWelcomeScreen,
  onEnableEndingScreen,
}: AddContentModalProps) {
  const [activeTab, setActiveTab] = useState<"elements" | "import" | "ai">("elements");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredElements = FORM_ELEMENTS.filter((el) =>
    el.label.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const categories: Array<ElementItem["category"]> = [
    "Contact info",
    "Choice",
    "Rating & ranking",
    "Text & Video",
    "Other",
    "Structure",
  ];

  const handleItemClick = (item: ElementItem) => {
    if (item.disabled) return;

    if (item.action === "welcome" && onEnableWelcomeScreen) {
      onEnableWelcomeScreen();
      onClose();
      return;
    }

    if (item.action === "ending" && onEnableEndingScreen) {
      onEnableEndingScreen();
      onClose();
      return;
    }

    if (item.type) {
      onSelectType(item.type);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
      <div className="-m-7 flex flex-col max-h-[85vh]">
        {/* Top Header Tabs with top-edge line per DESIGN_SPEC §4 (ref-13) */}
        <div className="flex items-center justify-between px-8 pt-5 pb-0 border-b border-[var(--border)]">
          <div className="flex items-center gap-8 text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("elements")}
              className={`pb-4 pt-1 relative transition-colors ${
                activeTab === "elements"
                  ? "text-[var(--text-primary)] font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {/* Short dark line at top edge */}
              {activeTab === "elements" && (
                <span className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--primary)] rounded-full" />
              )}
              Add form elements
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("import")}
              className={`pb-4 pt-1 relative text-[var(--text-muted)] cursor-not-allowed`}
              disabled
            >
              Import questions
              <span className="ml-1.5 text-[10px] text-[#2F7D69] bg-[#E6F4EA] px-1 py-0.5 rounded-[4px]">
                Soon
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ai")}
              className={`pb-4 pt-1 relative text-[var(--text-muted)] cursor-not-allowed`}
              disabled
            >
              Create with AI
              <span className="ml-1.5 text-[10px] text-[#2F7D69] bg-[#E6F4EA] px-1 py-0.5 rounded-[4px]">
                Soon
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--surface-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors -mt-3"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Inner Body: Two columns (~260px left sidebar + elements grid) */}
        <div className="flex flex-1 overflow-hidden bg-[var(--surface-inner)]">
          {/* Left Sub-column (~260px) */}
          <div className="w-64 p-6 border-r border-[var(--border)] bg-[var(--surface-page)] flex flex-col gap-6 shrink-0">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search elements..."
                autoFocus
                className="w-full pl-9 pr-3 py-1.5 bg-[var(--surface-card)] border border-[var(--border)] rounded-[8px] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--primary)]"
              />
            </div>

            {/* Quick Suggestions */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                Recommended
              </span>
              <button
                type="button"
                onClick={() => handleItemClick(FORM_ELEMENTS[0])}
                className="w-full flex items-center gap-2.5 p-2 rounded-[8px] hover:bg-[var(--surface-card-hover)] text-left transition-colors text-xs text-[var(--text-primary)]"
              >
                <div className="w-6 h-6 rounded-[5px] bg-[#E1F0FF] text-[#0066CC] flex items-center justify-center shrink-0">
                  <Type className="w-3.5 h-3.5" />
                </div>
                <span>Short Text</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick(FORM_ELEMENTS[2])}
                className="w-full flex items-center gap-2.5 p-2 rounded-[8px] hover:bg-[var(--surface-card-hover)] text-left transition-colors text-xs text-[var(--text-primary)]"
              >
                <div className="w-6 h-6 rounded-[5px] bg-[#F3EAFB] text-[#8E4FC0] flex items-center justify-center shrink-0">
                  <ListFilter className="w-3.5 h-3.5" />
                </div>
                <span>Multiple Choice</span>
              </button>

              <button
                type="button"
                onClick={() => handleItemClick(FORM_ELEMENTS[6])}
                className="w-full flex items-center gap-2.5 p-2 rounded-[8px] hover:bg-[var(--surface-card-hover)] text-left transition-colors text-xs text-[var(--text-primary)]"
              >
                <div className="w-6 h-6 rounded-[5px] bg-[#E6F4EA] text-[#2F7D69] flex items-center justify-center shrink-0">
                  <Star className="w-3.5 h-3.5" />
                </div>
                <span>Rating</span>
              </button>
            </div>
          </div>

          {/* Right Elements Grid grouped by Category per ref-13 */}
          <div className="flex-1 p-8 overflow-y-auto max-h-[65vh] space-y-6">
            {categories.map((category) => {
              const items = filteredElements.filter((el) => el.category === category);
              if (items.length === 0) return null;

              return (
                <div key={category} className="space-y-3">
                  <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={item.disabled}
                          onClick={() => handleItemClick(item)}
                          className={`flex items-center justify-between p-3 rounded-[10px] border transition-all text-left ${
                            item.disabled
                              ? "bg-[var(--surface-page)]/60 border-[var(--border)] opacity-60 cursor-not-allowed"
                              : "bg-[var(--surface-page)] hover:bg-[var(--surface-card-hover)] border-[var(--border)] hover:border-[var(--border-strong)] shadow-2xs hover:shadow-xs cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-[8px] ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              {item.label}
                            </span>
                          </div>

                          {item.isComingSoon && (
                            <span className="text-[10px] font-medium text-[#2F7D69] bg-[#E6F4EA] border border-[#2F7D69]/20 px-1.5 py-0.5 rounded-[4px] shrink-0">
                              Soon
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
