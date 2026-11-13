import React, { useEffect, useState } from 'react';
import { FileUp, Loader2, Trash2, X } from 'lucide-react';
import { uploadNoticeAttachment } from '../../services/noticeService';
import type {
  Department,
  Notice,
  NoticeAttachment,
  NoticeCategory,
  NoticePriority,
  NoticeStatus,
} from '../../types';
import { NOTICE_CATEGORIES, SEMESTER_OPTIONS, YEAR_OPTIONS } from '../../utils/constants';
import { formatFileSize, toDate } from '../../utils/formatters';

interface NoticeFormModalProps {
  open: boolean;
  editingNotice: Notice | null;
  departments: Department[];
  allowPinning: boolean;
  defaultDepartmentId?: string;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    summary: string;
    content: string;
    category: NoticeCategory;
    departmentIds: string[];
    targetAllDepartments: boolean;
    targetYear: string;
    targetSemester: string;
    priority: NoticePriority;
    pinned: boolean;
    status: NoticeStatus;
    publishAt: Date;
    expiresAt: Date | null;
    attachments: NoticeAttachment[];
  }) => Promise<void>;
}

function toInputDateTime(date: Date | null): string {
  if (!date) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function NoticeFormModal({
  open,
  editingNotice,
  departments,
  allowPinning,
  defaultDepartmentId,
  onClose,
  onSubmit,
}: NoticeFormModalProps) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoticeCategory>('General Announcements');
  const [targetAllDepartments, setTargetAllDepartments] = useState(true);
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [targetYear, setTargetYear] = useState('all');
  const [targetSemester, setTargetSemester] = useState('all');
  const [priority, setPriority] = useState<NoticePriority>('normal');
  const [pinned, setPinned] = useState(false);
  const [status, setStatus] = useState<NoticeStatus>('published');
  const [publishAtStr, setPublishAtStr] = useState('');
  const [expiresAtStr, setExpiresAtStr] = useState('');
  const [attachments, setAttachments] = useState<NoticeAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const ugDepartments = departments.filter((d) => (d.programLevel || 'UG') === 'UG');
  const pgDepartments = departments.filter((d) => d.programLevel === 'PG');

  useEffect(() => {
    if (!open) return;
    setErrorMsg('');
    if (editingNotice) {
      setTitle(editingNotice.title);
      setSummary(editingNotice.summary);
      setContent(editingNotice.content);
      setCategory(editingNotice.category);
      setTargetAllDepartments(editingNotice.targetAllDepartments);
      setDepartmentIds(editingNotice.departmentIds);
      setTargetYear(editingNotice.targetYear || 'all');
      setTargetSemester(editingNotice.targetSemester || 'all');
      setPriority(editingNotice.priority);
      setPinned(editingNotice.pinned);
      setStatus(editingNotice.status);
      setPublishAtStr(toInputDateTime(toDate(editingNotice.publishAt)));
      setExpiresAtStr(toInputDateTime(toDate(editingNotice.expiresAt)));
      setAttachments(editingNotice.attachments || []);
    } else {
      setTitle('');
      setSummary('');
      setContent('');
      setCategory('General Announcements');
      setTargetAllDepartments(!defaultDepartmentId);
      setDepartmentIds(defaultDepartmentId ? [defaultDepartmentId] : []);
      setTargetYear('all');
      setTargetSemester('all');
      setPriority('normal');
      setPinned(false);
      setStatus('published');
      setPublishAtStr(toInputDateTime(new Date()));
      setExpiresAtStr('');
      setAttachments([]);
    }
  }, [open, editingNotice, defaultDepartmentId]);

  if (!open) return null;

  const toggleDept = (deptId: string) => {
    setDepartmentIds((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (attachments.length >= 5) {
      setErrorMsg('Maximum 5 attachments allowed per notice.');
      return;
    }
    setUploading(true);
    setErrorMsg('');
    try {
      const uploaded = await uploadNoticeAttachment(file);
      setAttachments((prev) => [...prev, uploaded]);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'File upload failed. Check Firebase Storage configuration.'
      );
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (title.trim().length < 3 || summary.trim().length < 3 || content.trim().length < 3) {
      setErrorMsg('Title, summary, and detailed content must each be at least 3 characters.');
      return;
    }
    if (!targetAllDepartments && departmentIds.length === 0) {
      setErrorMsg('Select at least one department or choose All Departments.');
      return;
    }

    const publishAt = publishAtStr ? new Date(publishAtStr) : new Date();
    const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;
    if (expiresAt && expiresAt.getTime() <= publishAt.getTime()) {
      setErrorMsg('Expiry date must be later than the publish date.');
      return;
    }

    const resolvedStatus: NoticeStatus =
      status === 'published' && publishAt.getTime() > Date.now() + 60000
        ? 'scheduled'
        : status;

    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        category,
        departmentIds: targetAllDepartments ? [] : departmentIds,
        targetAllDepartments,
        targetYear,
        targetSemester,
        priority,
        pinned: allowPinning ? pinned : false,
        status: resolvedStatus,
        publishAt,
        expiresAt,
        attachments,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save notice.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1C31] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
            {editingNotice ? 'Edit Notice' : 'Publish New Notice — GAT'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs sm:text-sm text-red-800 dark:text-red-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Notice Title *
            </label>
            <input
              type="text"
              required
              maxLength={220}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., End-Semester Practical Examination Schedule (2026)"
              className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-white focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NoticeCategory)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-white"
              >
                {NOTICE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as NoticePriority)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-white"
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Short Summary *
            </label>
            <input
              type="text"
              required
              maxLength={500}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One-line overview shown on the notice card..."
              className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-white focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Full Notice Content *
            </label>
            <textarea
              required
              rows={5}
              maxLength={12000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter complete announcement details, instructions, venue, and contact information..."
              className="w-full p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-white focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
            />
          </div>

          {/* Target Departments (UG & PG separated clearly) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Target Departments & Programs
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetAllDepartments}
                  onChange={(e) => setTargetAllDepartments(e.target.checked)}
                  className="rounded border-slate-300 text-[#0B1F3A]"
                />
                <span>All Departments (UG & PG)</span>
              </label>
            </div>
            {!targetAllDepartments && (
              <div className="space-y-3 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]">
                {ugDepartments.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Undergraduate Programs (B.E.)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {ugDepartments.map((dept) => (
                        <label
                          key={dept.id}
                          className="inline-flex items-center gap-2 text-xs cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={departmentIds.includes(dept.id)}
                            onChange={() => toggleDept(dept.id)}
                          />
                          <span className="truncate">
                            {dept.name} ({dept.code})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {pgDepartments.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Postgraduate Programs (M.Tech / MBA)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {pgDepartments.map((dept) => (
                        <label
                          key={dept.id}
                          className="inline-flex items-center gap-2 text-xs cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={departmentIds.includes(dept.id)}
                            onChange={() => toggleDept(dept.id)}
                          />
                          <span className="truncate">
                            {dept.name} ({dept.code})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Year & Semester Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Target Academic Year
              </label>
              <select
                value={targetYear}
                onChange={(e) => setTargetYear(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
              >
                {YEAR_OPTIONS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr === 'all' ? 'All Years' : yr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Target Semester
              </label>
              <select
                value={targetSemester}
                onChange={(e) => setTargetSemester(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
              >
                {SEMESTER_OPTIONS.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem === 'all' ? 'All Semesters' : sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule, Status & Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Publishing Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as NoticeStatus)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-white"
              >
                <option value="published">Publish Immediately</option>
                <option value="scheduled">Schedule Future</option>
                <option value="draft">Save as Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Publish Date & Time
              </label>
              <input
                type="datetime-local"
                value={publishAtStr}
                onChange={(e) => setPublishAtStr(e.target.value)}
                className="w-full h-10 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Expiry Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAtStr}
                onChange={(e) => setExpiresAtStr(e.target.value)}
                className="w-full h-10 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-white font-mono"
              />
            </div>
          </div>

          {allowPinning && (
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
              />
              <span>Pin this notice to the top of the Notice Board</span>
            </label>
          )}

          {/* Attachments */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Attachments (PDF, Images, Docs — max 10 MB)
              </label>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileUp className="w-3.5 h-3.5 text-[#C9972C]" />
                )}
                <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-1.5">
                {attachments.map((att, idx) => (
                  <div
                    key={`${att.name}-${idx}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <span className="truncate">
                      {att.name} ({formatFileSize(att.size)})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-red-600 hover:text-red-700 p-1 cursor-pointer"
                      aria-label="Remove attachment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingNotice ? 'Update Notice' : 'Save Notice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
