'use client';

import React, { useState } from 'react';

export interface TruncatedCellProps {
  content: string | number | null | undefined;
  maxWidth?: string;
  className?: string;
}

export function TruncatedCell({
  content,
  maxWidth = 'max-w-[200px]',
  className = '',
}: TruncatedCellProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const text = content != null ? String(content) : '—';

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
      role="tooltip"
      aria-label={text}
    >
      <span className={`truncate ${maxWidth} block cursor-default text-xs`}>
        {text}
      </span>

      {showTooltip && text.length > 20 && (
        <div
          role="status"
          className="absolute bottom-full left-0 mb-1 z-30 px-2.5 py-1 text-[11px] leading-tight text-white bg-slate-900 rounded shadow-md whitespace-normal max-w-xs break-words pointer-events-none"
        >
          {text}
        </div>
      )}
    </div>
  );
}
