'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  FileText,
  Send,
  CheckCircle,
  PenTool,
  Zap,
} from 'lucide-react';

interface SOWTimelineProps {
  status: string;
  updatedAt?: string;
}

const stages = [
  { key: 'discovery', label: 'Discovery', icon: Search },
  { key: 'draft', label: 'Draft Generated', icon: FileText },
  { key: 'in_review', label: 'Sent for Review', icon: Send },
  { key: 'approved', label: 'Approved', icon: CheckCircle },
  { key: 'signed', label: 'Signed', icon: PenTool },
  { key: 'active', label: 'Active', icon: Zap },
];

const STATUS_TO_STAGE: Record<string, number> = {
  draft: 1,
  in_review: 2,
  approved: 3,
  signed: 4,
  active: 5,
  rejected: 2,
};

function formatTimestamp(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function SOWTimeline({ status, updatedAt }: SOWTimelineProps) {
  const [animated, setAnimated] = useState(false);
  const currentStageIndex = STATUS_TO_STAGE[status] ?? 1;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="rounded-[2rem] bg-gradient-to-r from-purple-50 to-white border border-gray-100 shadow-sm p-8 mb-6">
      {/* Desktop: horizontal */}
      <div className="hidden md:block">
        <div className="flex items-start">
          {stages.map((stage, i) => {
            const isCompleted = i < currentStageIndex;
            const isCurrent = i === currentStageIndex;
            const isFuture = i > currentStageIndex;
            const Icon = stage.icon;
            const isLast = i === stages.length - 1;

            return (
              <div key={stage.key} className="flex-1 flex flex-col items-center relative">
                {/* Connecting line */}
                {!isLast && (
                  <div className="absolute top-5 left-[calc(50%+20px)] right-[calc(-50%+20px)] h-[2px]">
                    {isCompleted ? (
                      <div
                        className="h-full bg-[#9333EA] origin-left"
                        style={{
                          transform: animated ? 'scaleX(1)' : 'scaleX(0)',
                          transition: `transform 0.6s ease-out ${i * 0.15}s`,
                        }}
                      />
                    ) : (
                      <div className="h-full border-t-2 border-dashed border-gray-200" />
                    )}
                  </div>
                )}

                {/* Node */}
                <div
                  className="relative z-10"
                  style={{
                    opacity: animated ? 1 : 0,
                    transform: animated ? 'scale(1)' : 'scale(0.5)',
                    transition: `opacity 0.4s ease-out ${i * 0.12}s, transform 0.4s ease-out ${i * 0.12}s`,
                  }}
                >
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-full bg-[#9333EA]/20 animate-ping" />
                  )}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center relative ${
                      isCompleted
                        ? 'bg-[#9333EA] text-white'
                        : isCurrent
                          ? 'bg-[#9333EA] text-white ring-4 ring-[#9333EA]/20'
                          : 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-200'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle size={18} />
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>
                </div>

                {/* Label */}
                <p
                  className={`text-xs mt-3 text-center leading-tight ${
                    isCurrent
                      ? 'font-bold text-[#9333EA]'
                      : isCompleted
                        ? 'font-medium text-gray-700'
                        : 'text-gray-400'
                  }`}
                >
                  {stage.label}
                </p>

                {/* Timestamp under current stage */}
                {isCurrent && updatedAt && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    {formatTimestamp(updatedAt)}
                  </p>
                )}

                {/* Future indicator */}
                {isFuture && (
                  <div className="w-1 h-1 rounded-full bg-gray-200 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: vertical */}
      <div className="md:hidden space-y-0">
        {stages.map((stage, i) => {
          const isCompleted = i < currentStageIndex;
          const isCurrent = i === currentStageIndex;
          const Icon = stage.icon;
          const isLast = i === stages.length - 1;

          return (
            <div key={stage.key} className="flex gap-4">
              {/* Left column: node + line */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted
                      ? 'bg-[#9333EA] text-white'
                      : isCurrent
                        ? 'bg-[#9333EA] text-white ring-4 ring-[#9333EA]/20'
                        : 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-200'
                  }`}
                >
                  {isCompleted ? <CheckCircle size={14} /> : <Icon size={13} />}
                </div>
                {!isLast && (
                  <div
                    className={`w-[2px] flex-1 min-h-[24px] ${
                      isCompleted ? 'bg-[#9333EA]' : 'border-l-2 border-dashed border-gray-200'
                    }`}
                  />
                )}
              </div>

              {/* Right column: label */}
              <div className="pb-4">
                <p
                  className={`text-sm ${
                    isCurrent
                      ? 'font-bold text-[#9333EA]'
                      : isCompleted
                        ? 'font-medium text-gray-700'
                        : 'text-gray-400'
                  }`}
                >
                  {stage.label}
                </p>
                {isCurrent && updatedAt && (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {formatTimestamp(updatedAt)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
