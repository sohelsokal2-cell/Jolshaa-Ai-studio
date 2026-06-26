import React from 'react';
import { motion } from 'motion/react';

interface ReactionPickerProps {
  onSelect: (type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | null) => void;
  currentReaction?: string;
  onClose?: () => void;
}

const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Like', color: 'text-blue-500 bg-blue-50 border-blue-200' },
  { type: 'love', emoji: '❤️', label: 'Love', color: 'text-rose-500 bg-rose-50 border-rose-200' },
  { type: 'haha', emoji: '😂', label: 'Haha', color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { type: 'wow', emoji: '😮', label: 'Wow', color: 'text-orange-500 bg-orange-50 border-orange-200' },
  { type: 'sad', emoji: '😢', label: 'Sad', color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
  { type: 'angry', emoji: '😡', label: 'Angry', color: 'text-red-500 bg-red-50 border-red-200' }
] as const;

export default function ReactionPicker({ onSelect, currentReaction, onClose }: ReactionPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="absolute bottom-full left-0 mb-2 bg-white rounded-full p-2 shadow-xl border border-pink-100 flex gap-2.5 z-50 items-center justify-center ring-4 ring-rose-500/5"
    >
      {REACTIONS.map((rx, idx) => {
        const isSelected = currentReaction === rx.type;
        return (
          <motion.button
            key={rx.type}
            initial={{ scale: 0, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: idx * 0.04, type: 'spring', stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.3, y: -5 }}
            onClick={(e) => {
              e.stopPropagation();
              if (isSelected) {
                // If already selected, clicking it again toggles/removes it!
                onSelect(null);
              } else {
                onSelect(rx.type);
              }
              onClose?.();
            }}
            className={`w-11 h-11 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-md relative group ${
              isSelected ? 'bg-rose-50 ring-2 ring-rose-300' : 'bg-slate-50 hover:bg-white'
            }`}
            title={rx.label}
          >
            <span className="text-2xl">{rx.emoji}</span>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold">
              {rx.label}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
