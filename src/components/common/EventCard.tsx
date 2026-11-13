import { useState } from 'react';
import { Calendar, Clock, ExternalLink, MapPin } from 'lucide-react';
import type { CampusEvent } from '../../types';
import { formatDate } from '../../utils/formatters';

interface EventCardProps {
  event: CampusEvent;
}

export function EventCard({ event }: EventCardProps) {
  const [imgError, setImgError] = useState(false);

  const statusLabel =
    event.status === 'upcoming'
      ? 'Upcoming Event'
      : event.status === 'completed'
      ? 'Completed'
      : 'Cancelled';

  const statusColor =
    event.status === 'upcoming'
      ? 'text-emerald-700 dark:text-emerald-400'
      : event.status === 'completed'
      ? 'text-slate-500 dark:text-slate-400'
      : 'text-red-700 dark:text-red-400';

  return (
    <article className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] overflow-hidden flex flex-col">
      <div className="aspect-4/3 bg-slate-100 dark:bg-[#091526] overflow-hidden relative">
        {event.posterUrl && !imgError ? (
          <img
            src={event.posterUrl}
            alt={event.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#0B1F3A] to-[#1A3861] text-white">
            <Calendar className="w-8 h-8 text-[#DFB047] mb-2" />
            <p className="font-display text-sm font-semibold line-clamp-2">{event.title}</p>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className={`font-semibold ${statusColor}`}>{statusLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{event.departmentName}</span>
          {event.isSample && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-amber-700 dark:text-amber-400">Sample Demo</span>
            </>
          )}
        </div>

        <h3 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white leading-snug">
          {event.title}
        </h3>

        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed flex-1">
          {event.description}
        </p>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
          <p className="flex items-center gap-2 font-mono tabular-nums">
            <Calendar className="w-3.5 h-3.5 text-[#C9972C] shrink-0" />
            <span>{formatDate(event.eventDate)}</span>
            <span aria-hidden="true">·</span>
            <Clock className="w-3.5 h-3.5 text-[#C9972C] shrink-0" />
            <span>{event.eventTime}</span>
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#C9972C] shrink-0" />
            <span className="truncate">{event.venue}</span>
          </p>
          {event.registrationDeadline && (
            <p className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              Registration Deadline: {formatDate(event.registrationDeadline)}
            </p>
          )}
        </div>

        {event.registrationLink && event.status === 'upcoming' && (
          <a
            href={event.registrationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-[#0B1F3A] text-white hover:bg-[#132F54] dark:bg-[#C9972C] dark:text-[#07111F] dark:hover:bg-[#DFB047] transition-colors"
          >
            <span>Register for Event</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </article>
  );
}
