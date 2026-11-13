import React, { useEffect, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { uploadEventPoster } from '../../services/eventService';
import type { CampusEvent, Department, EventStatus } from '../../types';

interface EventFormModalProps {
  open: boolean;
  editingEvent: CampusEvent | null;
  departments: Department[];
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    posterUrl: string;
    eventDate: string;
    eventTime: string;
    venue: string;
    departmentId: string;
    departmentName: string;
    registrationLink: string;
    registrationDeadline: string;
    status: EventStatus;
  }) => Promise<void>;
}

export function EventFormModal({
  open,
  editingEvent,
  departments,
  onClose,
  onSubmit,
}: EventFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [venue, setVenue] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [registrationLink, setRegistrationLink] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [status, setStatus] = useState<EventStatus>('upcoming');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    setErrorMsg('');
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description);
      setPosterUrl(editingEvent.posterUrl || '');
      setEventDate(editingEvent.eventDate);
      setEventTime(editingEvent.eventTime);
      setVenue(editingEvent.venue);
      setDepartmentId(editingEvent.departmentId);
      setRegistrationLink(editingEvent.registrationLink || '');
      setRegistrationDeadline(editingEvent.registrationDeadline || '');
      setStatus(editingEvent.status);
    } else {
      setTitle('');
      setDescription('');
      setPosterUrl('');
      setEventDate('');
      setEventTime('10:00 AM – 04:00 PM');
      setVenue('');
      setDepartmentId(departments[0]?.id || 'cse');
      setRegistrationLink('');
      setRegistrationDeadline('');
      setStatus('upcoming');
    }
  }, [open, editingEvent, departments]);

  if (!open) return null;

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrorMsg('');
    try {
      const url = await uploadEventPoster(file);
      setPosterUrl(url);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Poster upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (title.trim().length < 3 || description.trim().length < 3 || !eventDate || !venue.trim()) {
      setErrorMsg('Please complete all required event fields.');
      return;
    }

    const dept = departments.find((d) => d.id === departmentId);
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        posterUrl: posterUrl.trim(),
        eventDate,
        eventTime: eventTime.trim(),
        venue: venue.trim(),
        departmentId: departmentId || 'cse',
        departmentName: dept?.name || 'Global Academy of Technology',
        registrationLink: registrationLink.trim(),
        registrationDeadline,
        status,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save event.');
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
      <div className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1C31] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
            {editingEvent ? 'Edit Event' : 'Create Campus Event'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/40 px-4 py-2.5 text-xs text-red-800 dark:text-red-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1">Event Title *</label>
            <input
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Description *</label>
            <textarea
              required
              rows={3}
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Event Date *</label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Time *</label>
              <input
                type="text"
                required
                maxLength={40}
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                placeholder="10:00 AM – 04:00 PM"
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Venue *</label>
              <input
                type="text"
                required
                maxLength={160}
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Auditorium / Block A"
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Organized Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
              >
                <optgroup label="Undergraduate Programs (B.E.)">
                  {departments
                    .filter((d) => (d.programLevel || 'UG') === 'UG')
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Postgraduate Programs (M.Tech / MBA)">
                  {departments
                    .filter((d) => d.programLevel === 'PG')
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Registration Link</label>
              <input
                type="url"
                maxLength={500}
                value={registrationLink}
                onChange={(e) => setRegistrationLink(e.target.value)}
                placeholder="https://..."
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Registration Deadline</label>
              <input
                type="date"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold mb-1">Event Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322]"
              >
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Event Poster Image</label>
              <label className="h-10 px-3 inline-flex items-center justify-center gap-2 w-full text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 text-[#C9972C]" />
                )}
                <span>{uploading ? 'Uploading Poster...' : posterUrl ? 'Replace Poster' : 'Upload Poster'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePosterUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#0B1F3A] text-white dark:bg-[#C9972C] dark:text-[#07111F] cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingEvent ? 'Update Event' : 'Publish Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
