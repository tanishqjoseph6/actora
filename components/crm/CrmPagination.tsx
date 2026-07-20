"use client";

import type { ReactNode } from "react";

const DEFAULT_PAGE_SIZES = [10, 20, 50] as const;

type CrmPaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: readonly number[];
};

export function CrmPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}: CrmPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);

  const pages = buildPageList(safePage, totalPages);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-white/[0.06]">
      <p className="text-sm text-[#71717A] tabular-nums">
        {totalItems === 0 ? (
          "No results"
        ) : (
          <>
            Showing <span className="text-[#A1A1AA]">{start}</span>–
            <span className="text-[#A1A1AA]">{end}</span> of{" "}
            <span className="text-[#A1A1AA]">{totalItems}</span>
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="crm-page-size"
              className="text-xs text-[#71717A] uppercase tracking-wider"
            >
              Rows
            </label>
            <select
              id="crm-page-size"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg bg-[#0A0A0A] border border-white/[0.06] text-sm text-[#A1A1AA] focus:outline-none focus:border-[#3B82F6]/50 cursor-pointer"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size} className="bg-[#111111]">
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="flex items-center gap-1" aria-label="Pagination">
          <PageButton
            label="Previous page"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </PageButton>

          {pages.map((p, i) =>
            p === "ellipsis" ? (
              <span
                key={`ellipsis-${i}`}
                className="px-2 text-[#71717A] text-sm select-none"
              >
                …
              </span>
            ) : (
              <PageButton
                key={p}
                label={`Page ${p}`}
                active={p === safePage}
                onClick={() => onPageChange(p)}
              >
                {p}
              </PageButton>
            )
          )}

          <PageButton
            label="Next page"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </PageButton>
        </nav>
      </div>
    </div>
  );
}

function PageButton({
  children,
  onClick,
  disabled,
  active,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`
        min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium transition-colors
        disabled:opacity-40 disabled:cursor-not-allowed
        ${
          active
            ? "bg-[#3B82F6] text-white"
            : "border border-white/[0.06] text-[#A1A1AA] hover:border-[#3B82F6]/40 hover:text-white"
        }
      `}
    >
      {children}
    </button>
  );
}

function buildPageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("ellipsis");

  pages.push(total);
  return pages;
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
