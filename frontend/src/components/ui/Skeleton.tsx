'use client';

import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = '', width, height, style, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-slate-200/80 rounded-md ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      {...props}
    />
  );
}

export interface SkeletonTableRowProps {
  columns: number;
  heightClass?: string;
}

export function SkeletonTableRow({ columns, heightClass = 'h-4' }: SkeletonTableRowProps) {
  return (
    <tr className="border-b border-slate-100 last:border-b-0 animate-pulse">
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="py-3 px-4">
          <div className={`bg-slate-200/70 rounded ${heightClass} ${idx === 0 ? 'w-3/4' : idx === columns - 1 ? 'w-1/2 ml-auto' : 'w-full'}`} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden" aria-busy="true" aria-label="Loading tabular data">
      <div className="bg-slate-50 border-b border-slate-200 py-3 px-4 flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
      <table className="w-full text-left">
        <thead className="bg-slate-50/50 border-b border-slate-200">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="py-2.5 px-4">
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, r) => (
            <SkeletonTableRow key={r} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3" aria-busy="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
      <Skeleton className="h-6 w-36" />
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
