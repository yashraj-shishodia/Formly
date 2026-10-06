"use client";

import React, { useState } from "react";
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Hash,
  HelpCircle,
  ListChecks,
  Mail,
  Minus,
  Play,
  Share2,
  Sparkles,
  Star,
  ToggleLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";

export default function StyleguidePage() {
  const [toggleState, setToggleState] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState<string>("B");
  const [selectedSegment, setSelectedSegment] = useState<string>("Text");
  const [activeTab, setActiveTab] = useState<string>("Content");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#2B2530] p-8 md:p-12 max-w-6xl mx-auto space-y-16">
      {showLoading && (
        <div onClick={() => setShowLoading(false)}>
          <LoadingScreen message="Previewing Formly Loading Screen (Click anywhere to close)" />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Sample Formly Modal"
      >
        <div className="space-y-4">
          <p className="text-[15px] text-[#6B6570]">
            This modal uses a dimmed backdrop, 24px corner radius, and subtle border per DESIGN_SPEC.md §4.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#F0F0F2]">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => { setIsModalOpen(false); toast.success("Action confirmed"); }}>
              Confirm Action
            </Button>
          </div>
        </div>
      </Modal>

      {/* Header */}
      <div className="border-b border-[#E6E6E8] pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#2B2530]">
              Formly Design Tokens & Components Showcase
            </h1>
            <p className="text-[#6B6570] text-sm mt-1">
              Interactive testbed for DESIGN_SPEC.md (screenshots ref-08 to ref-14)
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowLoading(true)}>
              Test Loading Screen
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              Test Modal Primitive
            </Button>
          </div>
        </div>
      </div>

      {/* 1. Typography */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6B6570]">
          1. Typography (Inter vs. Karla)
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-[#F5F5F5] rounded-[18px] border border-[#E6E6E8] space-y-3">
            <span className="text-xs font-semibold text-[#6B6570] uppercase">
              App UI Font — Inter
            </span>
            <h3 className="text-2xl font-semibold text-[#2B2530]">
              Forms › Customer Feedback Survey
            </h3>
            <p className="text-[15px] text-[#6B6570]">
              Used for builder panels, dashboards, navigation breadcrumbs, settings cards, and table lists.
            </p>
          </div>

          <div className="p-6 bg-[#EAEAEC] rounded-[20px] border border-[#D4D2D6] space-y-3 font-respondent">
            <span className="text-xs font-semibold text-[#6B6570] uppercase font-sans">
              Respondent Default Font — Karla
            </span>
            <h3 className="text-[30px] font-medium text-[#2B2530] leading-snug">
              What is your <span className="font-bold">full name</span>? *
            </h3>
            <p className="text-[17px] text-[#6B6570]">
              Notice the distinctive rounded humanist glyphs and relaxed spacing for respondent immersion.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Buttons & Actions */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6B6570]">
          2. Button Variants & Hints
        </h2>
        <div className="p-6 bg-[#F5F5F5] rounded-[18px] border border-[#E6E6E8] flex flex-wrap items-center gap-4">
          {/* Primary Respondent Button */}
          <div className="flex items-center gap-3">
            <Button variant="primary" size="md">
              Continue
            </Button>
            <span className="text-[13px] text-[#6B6570] font-sans">
              press <strong className="text-[#2B2530]">Enter ↵</strong>
            </span>
          </div>

          {/* Builder Publish Button */}
          <Button variant="publish" size="md">
            Publish
          </Button>

          {/* Share Button (Builder style) */}
          <Button variant="outline" size="md" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>

          {/* Secondary Button */}
          <Button variant="secondary" size="md">
            Discard changes
          </Button>

          {/* Danger Button */}
          <Button variant="danger" size="md">
            Delete form
          </Button>

          {/* Toast trigger */}
          <Button
            variant="outline"
            size="md"
            onClick={() => toast.success("Form saved automatically")}
          >
            Trigger Toast
          </Button>
        </div>
      </section>

      {/* 3. Respondent Choice Rows */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6B6570]">
          3. Choice Rows (Idle, Hover, Selected)
        </h2>
        <div className="p-8 bg-[#EAEAEC] rounded-[20px] max-w-xl space-y-3 font-respondent">
          {[
            { key: "A", label: "Social Media (Twitter / LinkedIn)" },
            { key: "B", label: "Friend or Colleague recommendation" },
            { key: "C", label: "Search Engine (Google)" },
            { key: "D", label: "Blog post or Tech Article" },
          ].map((item) => {
            const isSelected = selectedChoice === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedChoice(item.key)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-[4px] text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white border-2 border-[#2B2530] text-[#2B2530] shadow-xs"
                    : "bg-[#E0E0E2] hover:bg-[#D8D8DC] text-[#2B2530] border-2 border-transparent"
                }`}
              >
                {/* Letter badge */}
                <span
                  className={`w-7 h-7 flex items-center justify-center text-[13px] font-bold rounded-[4px] font-sans transition-colors ${
                    isSelected
                      ? "bg-[#2B2530] text-white"
                      : "border border-[#2B2530]/40 text-[#2B2530]"
                  }`}
                >
                  {item.key}
                </span>
                <span className="text-[17px] font-medium leading-none">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Underline Input & Number Badges */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6B6570]">
          4. Number Badges & Underline Inputs
        </h2>
        <div className="p-8 bg-[#EAEAEC] rounded-[20px] max-w-xl space-y-6">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 bg-[#2B2530] text-white text-[13px] font-bold rounded-[5px] flex items-center justify-center shrink-0 mt-1">
              1
            </span>
            <div className="w-full">
              <h3 className="text-[26px] font-medium text-[#2B2530] font-respondent">
                What company are you with?
              </h3>
              <p className="text-[14px] text-[#6B6570] italic mt-1 font-sans">
                Description (optional)
              </p>
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Type your answer here..."
                  className="w-full bg-transparent border-b border-[#2B2530]/30 focus:border-[#2B2530] py-2 text-[20px] font-respondent text-[#2B2530] placeholder:text-[#A8A3AD] outline-hidden transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Navigation Controls & Joined Arrows */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6B6570]">
          5. Joined Up/Down Navigation Arrows (Bottom-Right Canvas)
        </h2>
        <div className="p-8 bg-[#EAEAEC] rounded-[20px] max-w-sm flex items-center justify-between">
          <span className="text-sm text-[#6B6570]">Progress: 2 of 5</span>
          <div className="inline-flex rounded-[8px] overflow-hidden shadow-xs border border-[#D4D2D6]">
            <button
              type="button"
              className="w-12 h-11 bg-[#2B2530] text-white flex items-center justify-center hover:bg-[#3A3340] cursor-pointer"
              title="Previous question"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <div className="w-[1px] bg-[#3A3340]" />
            <button
              type="button"
              className="w-12 h-11 bg-[#2B2530] text-white flex items-center justify-center hover:bg-[#3A3340] cursor-pointer"
              title="Next question"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Builder Top Bar Tabs with Top-Edge Active Line */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6B6570]">
          6. Builder Top Bar Tabs (Active Line at TOP Edge)
        </h2>
        <div className="bg-[#F5F5F5] rounded-[18px] border border-[#E6E6E8] px-6 h-14 flex items-center gap-8">
          {["Content", "Workflow", "Connect"].map((tab) => {
            const isActive = activeTab === tab;
            const isComingSoon = tab !== "Content";
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative h-full flex items-center gap-1.5 text-[14px] font-medium transition-colors cursor-pointer ${
                  isActive ? "text-[#2B2530]" : "text-[#6B6570] hover:text-[#2B2530]"
                }`}
              >
                {/* Active marker at TOP edge */}
                {isActive && (
                  <span className="absolute top-0 left-0 right-0 h-[2.5px] bg-[#2B2530]" />
                )}
                {tab}
                {isComingSoon && (
                  <span className="text-[10px] bg-[#E6E6E8] text-[#6B6570] px-1.5 py-0.5 rounded-[4px]">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 7. Segmented Control & Toggles */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6B6570]">
          7. Segmented Controls & Setting Toggles
        </h2>
        <div className="p-6 bg-[#F5F5F5] rounded-[18px] border border-[#E6E6E8] max-w-md space-y-6">
          {/* Segmented Control */}
          <div>
            <label className="text-xs font-semibold text-[#6B6570] uppercase block mb-2">
              Question Format
            </label>
            <div className="bg-[#EAEAEC] p-1 rounded-[8px] flex">
              {["Text", "Video"].map((seg) => {
                const isSelected = selectedSegment === seg;
                return (
                  <button
                    key={seg}
                    type="button"
                    onClick={() => setSelectedSegment(seg)}
                    className={`flex-1 py-1.5 text-[13px] font-medium rounded-[6px] transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white text-[#2B2530] shadow-xs"
                        : "text-[#6B6570] hover:text-[#2B2530]"
                    }`}
                  >
                    {seg} {seg === "Video" && "(Soon)"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[14px] font-medium text-[#2B2530] block">
                Required Question
              </span>
              <span className="text-[12px] text-[#6B6570]">
                Respondents cannot skip this question
              </span>
            </div>
            <button
              type="button"
              onClick={() => setToggleState(!toggleState)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                toggleState ? "bg-[#2B2530]" : "bg-[#D4D2D6]"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  toggleState ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 8. Question Type Colored Squares */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6B6570]">
          8. Question Type Badges (Pastel Icon Squares per DESIGN_SPEC.md §4)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Short Text", icon: Minus, bg: "#E1F0FF", text: "#0066CC" },
            { label: "Long Text", icon: AlignLeft, bg: "#E1F0FF", text: "#0066CC" },
            { label: "Multiple Choice", icon: ListChecks, bg: "#F0E8FA", text: "#6B3FA0" },
            { label: "Dropdown", icon: ChevronDown, bg: "#F0E8FA", text: "#6B3FA0" },
            { label: "Email", icon: Mail, bg: "#FCE8E6", text: "#C5221F" },
            { label: "Number", icon: Hash, bg: "#FEF7E0", text: "#B06000" },
            { label: "Yes / No", icon: ToggleLeft, bg: "#F0E8FA", text: "#6B3FA0" },
            { label: "Rating", icon: Star, bg: "#E6F4EA", text: "#137333" },
          ].map((item) => (
            <div
              key={item.label}
              className="p-3.5 bg-[#F5F5F5] rounded-[14px] border border-[#E6E6E8] flex items-center gap-3"
            >
              <div
                className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0"
                style={{ backgroundColor: item.bg, color: item.text }}
              >
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[14px] font-medium text-[#2B2530]">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
