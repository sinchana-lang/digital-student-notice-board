import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Department, NoticeCategory, NoticePriority } from '../../types';
import { NOTICE_CATEGORIES, SEMESTER_OPTIONS, YEAR_OPTIONS } from '../../utils/constants';

export interface NoticeFilterState {
  query: string;
  departmentId: string;
  category: NoticeCategory | 'all';
  priority: NoticePriority | 'all';
  year: string;
  semester: string;
  dateFrom: string;
  sortBy: 'newest' | 'oldest' | 'priority';
}

interface SearchFilterBarProps {
  filters: NoticeFilterState;
  departments: Department[];
  onChange: (next: NoticeFilterState) => void;
  totalCount: number;
}

export function SearchFilterBar({
  filters,
  departments,
  onChange,
  totalCount,
}: SearchFilterBarProps) {
  const ugDepartments = departments.filter((d) => (d.programLevel || 'UG') === 'UG');
  const pgDepartments = departments.filter((d) => d.programLevel === 'PG');

  const hasActiveFilters =
    filters.query.trim() !== '' ||
    filters.departmentId !== 'all' ||
    filters.category !== 'all' ||
    filters.priority !== 'all' ||
    filters.year !== 'all' ||
    filters.semester !== 'all' ||
    filters.dateFrom !== '';

  const resetFilters = () => {
    onChange({
      query: '',
      departmentId: 'all',
      category: 'all',
      priority: 'all',
      year: 'all',
      semester: 'all',
      dateFrom: '',
      sortBy: 'newest',
    });
  };

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1C31] p-4 sm:p-5 space-y-4">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Search GAT notices by title, keyword, department, or circular content..."
            className="w-full h-10 pl-10 pr-4 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onChange({ ...filters, sortBy: e.target.value as NoticeFilterState['sortBy'] })
            }
            aria-label="Sort notices"
            className="h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-slate-100 focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
          >
            <option value="newest">Newest First</option>
            <option value="priority">Priority (Urgent First)</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Filter Row with UG/PG Departments, Category, Priority, Year, Semester & Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Department / Program
          </label>
          <select
            value={filters.departmentId}
            onChange={(e) => onChange({ ...filters, departmentId: e.target.value })}
            className="w-full h-9 px-3 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-slate-100 focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
          >
            <option value="all">All Departments & Programs</option>
            {ugDepartments.length > 0 && (
              <optgroup label="Undergraduate Programs (B.E.)">
                {ugDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </optgroup>
            )}
            {pgDepartments.length > 0 && (
              <optgroup label="Postgraduate Programs (M.Tech / MBA)">
                {pgDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) =>
              onChange({ ...filters, category: e.target.value as NoticeCategory | 'all' })
            }
            className="w-full h-9 px-3 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-slate-100 focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
          >
            <option value="all">All Categories</option>
            {NOTICE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Year
          </label>
          <select
            value={filters.year}
            onChange={(e) => onChange({ ...filters, year: e.target.value })}
            className="w-full h-9 px-3 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-slate-100 focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
          >
            {YEAR_OPTIONS.map((yr) => (
              <option key={yr} value={yr}>
                {yr === 'all' ? 'All Years' : yr}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Semester
          </label>
          <select
            value={filters.semester}
            onChange={(e) => onChange({ ...filters, semester: e.target.value })}
            className="w-full h-9 px-3 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-slate-100 focus:outline-none focus:border-[#0B1F3A] dark:focus:border-[#C9972C]"
          >
            {SEMESTER_OPTIONS.map((sem) => (
              <option key={sem} value={sem}>
                {sem === 'all' ? 'All Semesters' : sem}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Priority & Date
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={filters.priority}
              onChange={(e) =>
                onChange({ ...filters, priority: e.target.value as NoticePriority | 'all' })
              }
              aria-label="Filter by priority"
              className="w-full h-9 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-slate-100"
            >
              <option value="all">Priority</option>
              <option value="urgent">Urgent</option>
              <option value="important">Important</option>
              <option value="normal">Normal</option>
            </select>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
              aria-label="Published from date"
              className="w-full h-9 px-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#081322] text-[#0B1F3A] dark:text-slate-100 font-mono"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-mono tabular-nums">
          Showing {totalCount} matching notice{totalCount === 1 ? '' : 's'}
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 font-medium text-[#0B1F3A] dark:text-[#DFB047] hover:underline cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
