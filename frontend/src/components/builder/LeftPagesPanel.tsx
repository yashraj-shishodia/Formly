"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Layers,
  ChevronDown,
  Plus,
  GripVertical,
  Trash2,
  Copy,
  Sparkles,
  FileCheck2,
  Type,
  AlignLeft,
  ListFilter,
  ChevronDownSquare,
  ToggleLeft,
  Mail,
  Hash,
  Star,
} from "lucide-react";
import { Question, QuestionType } from "@/lib/types";

interface LeftPagesPanelProps {
  questions: Question[];
  selectedQuestionId: number | null;
  onSelectQuestion: (id: number) => void;
  onOpenAddModal: () => void;
  onDuplicateQuestion: (id: number) => void;
  onDeleteQuestion: (id: number) => void;
  onReorder: (newQuestions: Question[]) => void;
  isEndingsSelected: boolean;
  onSelectEndings: () => void;
  welcomeScreenEnabled: boolean;
  isWelcomeSelected: boolean;
  onSelectWelcome: () => void;
}

// Icon helper
function getQuestionIcon(type: QuestionType) {
  switch (type) {
    case "short_text":
      return { icon: Type, bg: "bg-[#E1F0FF]", color: "text-[#0066CC]" };
    case "long_text":
      return { icon: AlignLeft, bg: "bg-[#E1F0FF]", color: "text-[#0066CC]" };
    case "multiple_choice":
      return { icon: ListFilter, bg: "bg-[#F3EAFB]", color: "text-[#8E4FC0]" };
    case "dropdown":
      return { icon: ChevronDownSquare, bg: "bg-[#F3EAFB]", color: "text-[#8E4FC0]" };
    case "yes_no":
      return { icon: ToggleLeft, bg: "bg-[#F3EAFB]", color: "text-[#8E4FC0]" };
    case "email":
      return { icon: Mail, bg: "bg-[#FDE8F1]", color: "text-[#D83A7D]" };
    case "number":
      return { icon: Hash, bg: "bg-[#FEF6E6]", color: "text-[#B25E00]" };
    case "rating":
      return { icon: Star, bg: "bg-[#E6F4EA]", color: "text-[#2F7D69]" };
    default:
      return { icon: Type, bg: "bg-[#E1F0FF]", color: "text-[#0066CC]" };
  }
}

interface SortableQuestionRowProps {
  question: Question;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

function SortableQuestionRow({
  question,
  index,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
}: SortableQuestionRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const { icon: Icon, bg, color } = getQuestionIcon(question.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-[8px] cursor-pointer transition-all ${
        isSelected
          ? "bg-[#EAEAEC] text-[#2B2530] font-medium shadow-2xs"
          : "hover:bg-[#F5F5F5] text-[#2B2530]"
      }`}
    >
      <div className="flex items-center gap-2 truncate">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-[#A8A3AD] hover:text-[#2B2530] cursor-grab active:cursor-grabbing p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        {/* Type Icon Pill */}
        <div
          className={`w-5 h-5 rounded-[4px] ${bg} ${color} flex items-center justify-center shrink-0`}
        >
          <Icon className="w-3 h-3" />
        </div>

        {/* Number */}
        <span className="text-xs font-bold text-[#6B6570] shrink-0">
          {index + 1}
        </span>

        {/* Title */}
        <span className="text-xs truncate max-w-[130px]">
          {question.title || "Untitled question"}
        </span>
      </div>

      {/* Row Hover Menu: Duplicate / Delete */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          type="button"
          onClick={onDuplicate}
          className="p-1 rounded-[4px] hover:bg-white text-[#6B6570] hover:text-[#2B2530] transition-colors"
          title="Duplicate"
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 rounded-[4px] hover:bg-white text-[#6B6570] hover:text-[#D9383A] transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export function LeftPagesPanel({
  questions,
  selectedQuestionId,
  onSelectQuestion,
  onOpenAddModal,
  onDuplicateQuestion,
  onDeleteQuestion,
  onReorder,
  isEndingsSelected,
  onSelectEndings,
  welcomeScreenEnabled,
  isWelcomeSelected,
  onSelectWelcome,
}: LeftPagesPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      const reordered = arrayMove(questions, oldIndex, newIndex);
      onReorder(reordered);
    }
  };

  return (
    <div className="w-full lg:w-[270px] shrink-0 flex flex-col gap-3.5 select-none overflow-y-auto pr-1">
      {/* Card 1: Mode selector pill */}
      <div className="p-3 bg-[#F5F5F5] rounded-[14px] border border-[#E6E6E8] flex items-center justify-between text-xs text-[#2B2530] font-medium cursor-default">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#6B6570]" />
          <span>Universal mode</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#A8A3AD]" />
      </div>

      {/* Card 2: Pages List */}
      <div className="bg-[#F5F5F5] rounded-[16px] border border-[#E6E6E8] p-3.5 flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-semibold text-[#2B2530]">Pages</span>
          <span className="text-xs text-[#6B6570] font-medium">
            {questions.length}
          </span>
        </div>

        {/* Inner bordered container */}
        <div className="bg-white rounded-[12px] border border-[#E6E6E8] p-2 flex flex-col gap-1">
          {/* Welcome screen entry (if enabled) */}
          {welcomeScreenEnabled && (
            <div
              onClick={onSelectWelcome}
              className={`flex items-center justify-between px-2.5 py-2 rounded-[8px] cursor-pointer transition-colors ${
                isWelcomeSelected
                  ? "bg-[#EAEAEC] font-semibold text-[#2B2530]"
                  : "hover:bg-[#F5F5F5] text-[#2B2530]"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-5 h-5 rounded-[4px] bg-[#F0EFF2] text-[#2B2530] flex items-center justify-center shrink-0">
                  <Layers className="w-3 h-3" />
                </div>
                <span className="text-xs">Welcome Screen</span>
              </div>
            </div>
          )}

          {/* Dnd Sortable Questions List */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-0.5">
                {questions.map((q, idx) => (
                  <SortableQuestionRow
                    key={q.id}
                    question={q}
                    index={idx}
                    isSelected={!isEndingsSelected && !isWelcomeSelected && selectedQuestionId === q.id}
                    onSelect={() => onSelectQuestion(q.id)}
                    onDuplicate={(e) => {
                      e.stopPropagation();
                      onDuplicateQuestion(q.id);
                    }}
                    onDelete={(e) => {
                      e.stopPropagation();
                      onDeleteQuestion(q.id);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Bottom Divider and + Add content text button */}
          <div className="pt-2 mt-1 border-t border-[#F0EFF2]">
            <button
              type="button"
              onClick={onOpenAddModal}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-[6px] hover:bg-[#F5F5F5] text-xs font-semibold text-[#2B2530] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add content</span>
            </button>
          </div>
        </div>
      </div>

      {/* Card 3: Endings List */}
      <div className="bg-[#F5F5F5] rounded-[16px] border border-[#E6E6E8] p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-semibold text-[#2B2530]">Endings</span>
          <button
            type="button"
            onClick={onSelectEndings}
            className="w-5 h-5 rounded-[4px] border border-[#D4D2D6] hover:bg-white flex items-center justify-center text-[#6B6570]"
            title="Edit Endings"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        <button
          type="button"
          onClick={onSelectEndings}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] border text-left transition-colors text-xs ${
            isEndingsSelected
              ? "bg-[#EAEAEC] border-[#C5C3C8] text-[#2B2530] font-semibold"
              : "bg-white border-[#E6E6E8] text-[#2B2530] hover:bg-[#FAFAFA]"
          }`}
        >
          <div className="w-5 h-5 rounded-[4px] bg-[#E6F4EA] text-[#2F7D69] flex items-center justify-center shrink-0">
            <FileCheck2 className="w-3 h-3" />
          </div>
          <span className="truncate">Thank You Screen</span>
        </button>
      </div>

      {/* Card 4: Ask Formly AI pill */}
      <div className="p-3 rounded-[12px] bg-[#F3EAFB]/50 border border-[#8E4FC0]/30 flex items-center gap-2.5 text-xs text-[#8E4FC0] font-semibold cursor-pointer hover:bg-[#F3EAFB]/70 transition-colors">
        <Sparkles className="w-4 h-4 text-[#8E4FC0]" />
        <span>Ask Formly AI</span>
        <span className="ml-auto text-[10px] text-[#2F7D69] bg-[#E6F4EA] px-1 py-0.5 rounded-[4px]">
          Soon
        </span>
      </div>
    </div>
  );
}
