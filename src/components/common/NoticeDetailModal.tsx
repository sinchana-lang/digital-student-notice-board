import { useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Pin,
  X,
} from 'lucide-react';
import type { Department, Notice, NoticeAttachment } from '../../types';
import { formatDate, formatFileSize, generateSampleCircularPdfBlob } from '../../utils/formatters';

interface NoticeDetailModalProps {
  notice: Notice | null;
  departments: Department[];
  isBookmarked?: boolean;
  isRead?: boolean;
  onClose: () => void;
  onToggleBookmark?: (notice: Notice) => void;
  onMarkRead?: (notice: Notice) => void;
}

export function NoticeDetailModal({
  notice,
  departments,
  isBookmarked = false,
  isRead = false,
  onClose,
  onToggleBookmark,
  onMarkRead,
}: NoticeDetailModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'pdf' | 'image' | null>(null);

  if (!notice) return null;

  const deptNames = notice.targetAllDepartments
    ? 'All Academic Departments'
    : notice.departmentIds
        .map((id) => departments.find((d) => d.id === id)?.name || id.toUpperCase())
        .join(', ');

  const resolveAttachmentUrl = (att: NoticeAttachment): string => {
    if (att.url.startsWith('sample://')) {
      const blob = generateSampleCircularPdfBlob(notice);
      return URL.createObjectURL(blob);
    }
    return att.url;
  };

  const handleDownload = (att: NoticeAttachment) => {
    const resolved = resolveAttachmentUrl(att);
    const link = document.createElement('a');
    link.href = resolved;
    link.download = att.name;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (att: NoticeAttachment) => {
    const resolved = resolveAttachmentUrl(att);
    if (att.type.startsWith('image/')) {
      setPreviewType('image');
      setPreviewUrl(resolved);
    } else if (att.type === 'application/pdf' || att.url.startsWith('sample://')) {
      setPreviewType('pdf');
      setPreviewUrl(resolved);
    } else {
      handleDownload(att);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-modal-title"
    >
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1C31] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#091526]">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {notice.priority === 'urgent' && (
                <span className="inline-flex items-center gap-1 font-semibold text-red-700 dark:text-red-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Urgent Circular
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
              <span className="font-medium text-[#0B1F3A] dark:text-slate-200">{notice.category}</span>
              {notice.isSample && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    Sample Demonstration Notice
                  </span>
                </>
              )}
            </div>
            <h2
              id="notice-modal-title"
              className="font-display text-xl sm:text-2xl font-bold text-[#0B1F3A] dark:text-white leading-snug"
            >
              {notice.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Close notice detail"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <p className="text-slate-500 dark:text-slate-400">Published Date</p>
              <p className="mt-0.5 font-mono tabular-nums font-medium text-[#0B1F3A] dark:text-slate-100 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C9972C]" />
                {formatDate(notice.publishAt)}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Expiry Date</p>
              <p className="mt-0.5 font-mono tabular-nums font-medium text-[#0B1F3A] dark:text-slate-100">
                {notice.expiresAt ? formatDate(notice.expiresAt) : 'No Expiry'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Issued By</p>
              <p className="mt-0.5 font-medium text-[#0B1F3A] dark:text-slate-100">{notice.authorName}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Target Audience</p>
            <p className="mt-1 text-sm font-medium text-[#0B1F3A] dark:text-slate-200">
              {deptNames}
              {notice.targetYear && notice.targetYear !== 'all' ? ` · ${notice.targetYear}` : ''}
              {notice.targetSemester && notice.targetSemester !== 'all'
                ? ` · ${notice.targetSemester}`
                : ''}
            </p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="whitespace-pre-line text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
              {notice.content}
            </div>
          </div>

          {notice.attachments.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-display text-sm font-semibold text-[#0B1F3A] dark:text-white">
                Attachments & Circulars
              </h3>
              <div className="space-y-2">
                {notice.attachments.map((att, idx) => (
                  <div
                    key={`${att.name}-${idx}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#091526] px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-[#C9972C] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0B1F3A] dark:text-slate-100 truncate">
                          {att.name}
                        </p>
                        <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {formatFileSize(att.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(att.type === 'application/pdf' ||
                        att.type.startsWith('image/') ||
                        att.url.startsWith('sample://')) && (
                        <button
                          type="button"
                          onClick={() => handlePreview(att)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDownload(att)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {previewUrl && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Document Preview</p>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setPreviewType(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Hide Preview
                </button>
              </div>
              {previewType === 'image' ? (
                <img
                  src={previewUrl}
                  alt="Attachment preview"
                  referrerPolicy="no-referrer"
                  className="max-h-96 w-auto rounded-lg border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <iframe
                  src={previewUrl}
                  title="PDF Circular Preview"
                  className="w-full h-96 rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#091526]">
          <div className="flex items-center gap-2">
            {onMarkRead && (
              <button
                type="button"
                onClick={() => onMarkRead(notice)}
                disabled={isRead}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  isRead
                    ? 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 cursor-default'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRead ? 'Marked as Read' : 'Mark as Read'}</span>
              </button>
            )}
            {onToggleBookmark && (
              <button
                type="button"
                onClick={() => onToggleBookmark(notice)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  isBookmarked
                    ? 'border-[#C9972C] bg-[#C9972C]/10 text-[#A47717] dark:text-[#DFB047]'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                <span>{isBookmarked ? 'Saved to Bookmarks' : 'Save Notice'}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-slate-700 hover:opacity-90 transition-opacity cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
