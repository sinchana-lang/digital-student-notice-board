import { AlertCircle, Bookmark, BookmarkCheck, CheckCircle2, FileText, Pin } from 'lucide-react';
import type { Department, Notice } from '../../types';
import { formatDate, isNoticeExpired } from '../../utils/formatters';

interface NoticeCardProps {
  notice: Notice;
  departments: Department[];
  isBookmarked?: boolean;
  isRead?: boolean;
  onOpen: (notice: Notice) => void;
  onToggleBookmark?: (notice: Notice) => void;
  onMarkRead?: (notice: Notice) => void;
}

export function NoticeCard({
  notice,
  departments,
  isBookmarked = false,
  isRead = false,
  onOpen,
  onToggleBookmark,
  onMarkRead,
}: NoticeCardProps) {
  const deptLabel = notice.targetAllDepartments
    ? 'All Departments'
    : notice.departmentIds
        .map((id) => departments.find((d) => d.id === id)?.shortName || id.toUpperCase())
        .slice(0, 3)
        .join(', ') + (notice.departmentIds.length > 3 ? ` +${notice.departmentIds.length - 3}` : '');

  const expired = isNoticeExpired(notice);

  return (
    <article
      className={`group rounded-lg border transition-colors bg-white dark:bg-[#0D1C31] ${
        notice.priority === 'urgent'
          ? 'border-red-300 dark:border-red-900/60 hover:border-red-400 dark:hover:border-red-700'
          : 'border-slate-200 dark:border-slate-800 hover:border-[#0B1F3A]/40 dark:hover:border-[#C9972C]/50'
      }`}
    >
      <div className="p-5 flex flex-col gap-3">
        {/* Clean unboxed typographic metadata line (Zero-Pill Discipline) */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            {notice.priority === 'urgent' && (
              <span className="inline-flex items-center gap-1 font-semibold text-red-700 dark:text-red-400">
                <AlertCircle className="w-3.5 h-3.5" />
                Urgent
              </span>
            )}
            {notice.priority === 'important' && (
              <span className="font-semibold text-[#A47717] dark:text-[#DFB047]">Important</span>
            )}
            {notice.pinned && (
              <span className="inline-flex items-center gap-1 font-medium text-[#0B1F3A] dark:text-slate-200">
                <Pin className="w-3 h-3 text-[#C9972C]" />
                Pinned
              </span>
            )}
            {(notice.priority !== 'normal' || notice.pinned) && <span aria-hidden="true">·</span>}
            <span className="font-medium text-slate-700 dark:text-slate-200">{notice.category}</span>
            <span aria-hidden="true">·</span>
            <span>{deptLabel}</span>
            {notice.targetYear && notice.targetYear !== 'all' && (
              <>
                <span aria-hidden="true">·</span>
                <span>{notice.targetYear}</span>
              </>
            )}
            {notice.targetSemester && notice.targetSemester !== 'all' && (
              <>
                <span aria-hidden="true">·</span>
                <span>{notice.targetSemester}</span>
              </>
            )}
            {notice.isSample && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-amber-700 dark:text-amber-400">Sample Demo</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono tabular-nums">
            <span>{formatDate(notice.publishAt)}</span>
            {expired && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500 dark:text-slate-400">Expired</span>
              </>
            )}
          </div>
        </div>

        {/* Title & Summary */}
        <div>
          <button
            type="button"
            onClick={() => onOpen(notice)}
            className="text-left w-full focus-visible:outline-2 focus-visible:outline-[#C9972C] rounded"
          >
            <h3 className="font-display text-base sm:text-lg font-semibold text-[#0B1F3A] dark:text-white group-hover:text-[#1D4ED8] dark:group-hover:text-[#DFB047] transition-colors leading-snug">
              {notice.title}
            </h3>
          </button>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {notice.summary}
          </p>
        </div>

        {/* Bottom row: Author, Attachments & Actions */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400">
            <span>Issued by {notice.authorName}</span>
            {notice.attachments.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-[#0B1F3A] dark:text-slate-200 font-medium">
                  <FileText className="w-3.5 h-3.5 text-[#C9972C]" />
                  {notice.attachments.length} attachment{notice.attachments.length > 1 ? 's' : ''}
                </span>
              </>
            )}
            {notice.expiresAt && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">Valid till {formatDate(notice.expiresAt)}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onMarkRead && (
              <button
                type="button"
                onClick={() => onMarkRead(notice)}
                disabled={isRead}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isRead
                    ? 'text-emerald-700 dark:text-emerald-400 cursor-default'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isRead ? 'Read' : 'Mark Read'}</span>
              </button>
            )}

            {onToggleBookmark && (
              <button
                type="button"
                onClick={() => onToggleBookmark(notice)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isBookmarked
                    ? 'text-[#A47717] dark:text-[#DFB047] bg-[#C9972C]/10'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark notice'}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-3.5 h-3.5" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
                <span>{isBookmarked ? 'Saved' : 'Save'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpen(notice)}
              className="px-3 py-1.5 rounded font-semibold text-[#0B1F3A] dark:text-[#DFB047] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Read Notice
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
