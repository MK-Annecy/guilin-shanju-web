'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';

/**
 * DateRangePicker — a booking.com–style date range selector.
 *
 * Features
 *  • Single trigger button: shows "入住 — 退房" placeholder or the selected range.
 *  • Modal dialog with two months side-by-side and prev/next navigation.
 *  • Click-first-then-second interaction to pick check-in / check-out.
 *  • Range highlighting between the two dates (light fill in between, solid at endpoints).
 *  • Hover preview shows what the range would look like if you clicked the hovered day.
 *  • Past dates disabled, check-out must be strictly after check-in.
 *  • "Clear" and "Apply" buttons. Esc / backdrop click closes.
 *  • Optional flexibility pills (exact / ±N days) — purely visual nudge that doesn't change behaviour
 *    in v1 (kept for future filter integration with the rooms query).
 *  • Locale-aware (zh / en) — days of week, months, button labels all via props.
 */

export interface DateRangePickerProps {
  /** Current check-in ISO date (YYYY-MM-DD) */
  checkIn: string;
  /** Current check-out ISO date (YYYY-MM-DD) */
  checkOut: string;
  /** Earliest date the user can pick (ISO YYYY-MM-DD). Defaults to today. */
  minDate?: string;
  /** Called when the user confirms a range via the dialog's Apply button */
  onChange: (range: { checkIn: string; checkOut: string }) => void;
  /** Locale-aware labels */
  labels: {
    placeholder: string;          // Trigger placeholder, e.g. "选择入住和退房日期"
    checkInLabel: string;         // e.g. "入住"
    checkOutLabel: string;        // e.g. "退房"
    nights: (n: number) => string; // e.g. (n) => `${n} 晚`
    apply: string;                // e.g. "确定"
    clear: string;                // e.g. "清除"
    cancel: string;               // e.g. "取消"
    selectCheckIn: string;        // hint when nothing selected, e.g. "请选择入住日期"
    selectCheckOut: string;       // hint after picking check-in, e.g. "请选择退房日期"
  };
}

const DAY_MS = 86400000;
const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_NAMES_ZH = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
];
const WEEKDAY_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEEKDAY_ZH = ['日', '一', '二', '三', '四', '五', '六'];

function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
function todayIso(): string {
  return dateToIso(new Date());
}

/**
 * Build the 6×7 grid of dates for a given (year, month).
 * Starts on Sunday (US-style) — matches booking.com.
 * Includes leading days from the previous month and trailing days from the next month.
 */
function buildMonthGrid(year: number, month: number): Array<{
  date: Date;
  iso: string;
  inMonth: boolean;
}> {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sun
  const gridStart = new Date(year, month, 1 - startWeekday);
  const cells: Array<{ date: Date; iso: string; inMonth: boolean }> = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    cells.push({
      date: d,
      iso: dateToIso(d),
      inMonth: d.getMonth() === month,
    });
  }
  return cells;
}

function formatRangeShort(checkIn: string, checkOut: string, locale: 'zh' | 'en'): string {
  const a = isoToDate(checkIn);
  const b = isoToDate(checkOut);
  if (locale === 'zh') {
    return `${a.getMonth() + 1}月${a.getDate()}日 — ${b.getMonth() + 1}月${b.getDate()}日`;
  }
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthShort[a.getMonth()]} ${a.getDate()} — ${monthShort[b.getMonth()]} ${b.getDate()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function DateRangePicker({
  checkIn,
  checkOut,
  minDate,
  onChange,
  labels,
}: DateRangePickerProps) {
  // Resolve locale from labels shape — we'll receive a `locale` hint via the labels `flexDays` etc.
  // Easier: pass `locale` prop separately would be cleaner; but to keep API tight we infer from
  // the weekday-style by checking labels.placeholder for a CJK character.
  const locale: 'zh' | 'en' = /[一-龥]/.test(labels.placeholder) ? 'zh' : 'en';

  const today = todayIso();
  const effectiveMin = minDate ?? today;

  const [open, setOpen] = useState(false);
  // Dialog-local draft state — separate from the committed `checkIn`/`checkOut` props.
  const [draftIn, setDraftIn] = useState(checkIn);
  const [draftOut, setDraftOut] = useState(checkOut);
  // Which side are we currently picking? 'in' | 'out' | 'done'
  const [picking, setPicking] = useState<'in' | 'out' | 'done'>(
    checkIn && checkOut ? 'done' : 'in'
  );
  // Hover preview — used to show a tentative range between check-in and the hovered cell
  const [hoverIso, setHoverIso] = useState<string | null>(null);
  // Which month is shown as the LEFT month in the dialog.
  const [viewYear, setViewYear] = useState(() => isoToDate(checkIn || effectiveMin).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => isoToDate(checkIn || effectiveMin).getMonth());

  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Sync draft state when the trigger button is opened
  useEffect(() => {
    if (open) {
      setDraftIn(checkIn);
      setDraftOut(checkOut);
      setPicking(checkIn && checkOut ? 'done' : 'in');
      setHoverIso(null);
      const start = isoToDate(checkIn || effectiveMin);
      setViewYear(start.getFullYear());
      setViewMonth(start.getMonth());
    }
  }, [open, checkIn, checkOut, effectiveMin]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Lock body scroll while dialog is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const minDateObj = useMemo(() => isoToDate(effectiveMin), [effectiveMin]);
  const draftInDate = draftIn ? isoToDate(draftIn) : null;
  const draftOutDate = draftOut ? isoToDate(draftOut) : null;

  // Compute hover range — for previewing what the range WOULD be if user clicks hovered day
  const previewRange = useMemo(() => {
    if (picking !== 'out' || !draftInDate || !hoverIso) return null;
    const hover = isoToDate(hoverIso);
    if (hover < draftInDate) return null;
    return { start: draftInDate, end: hover };
  }, [picking, draftInDate, hoverIso]);

  const isDisabled = useCallback(
    (iso: string) => iso < effectiveMin,
    [effectiveMin]
  );

  const handlePick = useCallback(
    (iso: string) => {
      if (isDisabled(iso)) return;
      const d = isoToDate(iso);

      // If we already have both dates picked (in 'done' state), the next click
      // resets the selection starting from this date as the new check-in.
      if (picking === 'done' || picking === 'in') {
        setDraftIn(iso);
        setDraftOut('');
        setPicking('out');
        return;
      }
      // picking === 'out'
      if (draftInDate && d < draftInDate) {
        // User clicked a date earlier than check-in → restart from this date
        setDraftIn(iso);
        setDraftOut('');
        setPicking('out');
        return;
      }
      if (d.getTime() === draftInDate?.getTime()) {
        // Same-day click → just confirm as 1-night stay (we treat same day as invalid;
        // set check-out to the next day as a friendly default).
        const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        setDraftOut(dateToIso(next));
        setPicking('done');
        return;
      }
      setDraftOut(iso);
      setPicking('done');
    },
    [picking, draftInDate, isDisabled]
  );

  const navigateMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const clear = () => {
    setDraftIn('');
    setDraftOut('');
    setPicking('in');
    setHoverIso(null);
  };

  const apply = () => {
    if (!draftIn || !draftOut) return;
    onChange({ checkIn: draftIn, checkOut: draftOut });
    setOpen(false);
    triggerRef.current?.focus();
  };

  const nights = (() => {
    if (!draftIn || !draftOut) return 0;
    return Math.max(0, Math.round((isoToDate(draftOut).getTime() - isoToDate(draftIn).getTime()) / DAY_MS));
  })();

  const renderMonth = (year: number, month: number, isLeft: boolean) => {
    const cells = buildMonthGrid(year, month);
    const monthNames = locale === 'zh' ? MONTH_NAMES_ZH : MONTH_NAMES_EN;
    const weekdayNames = locale === 'zh' ? WEEKDAY_ZH : WEEKDAY_EN;
    const canGoBack = isLeft; // only left month has the prev arrow
    const canGoForward = !isLeft; // only right month has the next arrow

    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4 px-2">
          <button
            type="button"
            onClick={() => canGoBack && navigateMonth(-1)}
            disabled={!canGoBack}
            aria-label={locale === 'zh' ? '上个月' : 'Previous month'}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
              canGoBack ? 'hover:bg-moss/10 text-ink-soft hover:text-moss' : 'invisible'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="font-medium text-ink">
            {monthNames[month]} {year}
          </div>
          <button
            type="button"
            onClick={() => canGoForward && navigateMonth(1)}
            disabled={!canGoForward}
            aria-label={locale === 'zh' ? '下个月' : 'Next month'}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
              canGoForward ? 'hover:bg-moss/10 text-ink-soft hover:text-moss' : 'invisible'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {weekdayNames.map((d, i) => (
            <div key={i} className="h-9 flex items-center justify-center text-xs text-ink-mute font-medium">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell) => {
            const disabled = isDisabled(cell.iso);
            const isStart = draftInDate && isSameDay(cell.date, draftInDate);
            const isEnd = draftOutDate && isSameDay(cell.date, draftOutDate);
            const inRange =
              draftInDate && draftOutDate &&
              cell.date > draftInDate && cell.date < draftOutDate;
            const inPreview =
              previewRange &&
              cell.date > previewRange.start && cell.date < previewRange.end;
            const isEndpointInPreview =
              previewRange &&
              (isSameDay(cell.date, previewRange.start) || isSameDay(cell.date, previewRange.end));
            const isToday = isSameDay(cell.date, minDateObj);

            // Visual state classes
            const baseCell =
              'relative h-10 flex items-center justify-center text-sm select-none transition-colors';
            const disabledCls = 'text-ink-mute/40 cursor-not-allowed';
            const inMonthCls = cell.inMonth ? 'text-ink' : 'text-ink-mute/50';
            const isEndpoint = isStart || isEnd || isEndpointInPreview;
            const isInRange = !isEndpoint && (inRange || inPreview);
            const rangeFill = isEndpoint
              ? 'bg-moss text-cloud font-medium rounded-full z-10'
              : isInRange
              ? 'bg-moss/15 text-ink rounded-none'
              : 'hover:bg-moss/10 text-ink rounded-full';
            // For in-range cells we drop the button's rounded corners and let the
            // surrounding grid gap collapse so the band looks continuous like
            // booking.com. Endpoints stay as discrete pills.
            const buttonShape = isEndpoint
              ? 'w-10 h-10 rounded-full'
              : isInRange
              ? 'w-full h-10 rounded-none'
              : 'w-10 h-10 rounded-full';
            const sideFade =
              isStart
                ? 'after:absolute after:inset-y-0 after:right-0 after:w-1/2 after:bg-moss/15 after:-z-0 after:rounded-r-full'
                : isEnd
                ? 'after:absolute after:inset-y-0 after:left-0 after:w-1/2 after:bg-moss/15 after:-z-0 after:rounded-l-full'
                : '';

            return (
              <div
                key={cell.iso}
                className={`flex items-center justify-center ${
                  isInRange ? 'p-0 -mx-px' : 'p-0.5'
                }`}
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handlePick(cell.iso)}
                  onMouseEnter={() => !disabled && setHoverIso(cell.iso)}
                  onMouseLeave={() => setHoverIso(null)}
                  aria-label={cell.iso}
                  className={[
                    baseCell,
                    buttonShape,
                    disabled ? disabledCls : inMonthCls,
                    !disabled && rangeFill,
                    !disabled && sideFade,
                  ].join(' ')}
                >
                  <span className="relative z-10">{cell.date.getDate()}</span>
                  {isToday && !isStart && !isEnd && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-moss" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // The right-month is always +1 from the left
  const rightMonthDate = new Date(viewYear, viewMonth + 1, 1);

  // ---- Trigger button label ----
  const triggerLabel = useMemo(() => {
    if (checkIn && checkOut) {
      return formatRangeShort(checkIn, checkOut, locale);
    }
    return labels.placeholder;
  }, [checkIn, checkOut, labels.placeholder, locale]);

  // ---- Nights count for the dialog summary line ----
  const summaryLine = useMemo(() => {
    if (!draftIn || !draftOut) {
      return picking === 'in' ? labels.selectCheckIn : labels.selectCheckOut;
    }
    const n = Math.max(1, Math.round((isoToDate(draftOut).getTime() - isoToDate(draftIn).getTime()) / DAY_MS));
    return labels.nights(n);
  }, [draftIn, draftOut, picking, labels]);

  return (
    <div className="w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="w-full px-4 py-3 bg-cloud-dark border border-line focus:border-moss focus:outline-none text-left flex items-center justify-between gap-2 hover:border-moss/60 transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <CalendarIcon className="w-4 h-4 text-ink-mute flex-shrink-0" />
          <span className={checkIn && checkOut ? 'text-ink' : 'text-ink-mute'}>
            {triggerLabel}
          </span>
        </span>
        {nights > 0 && checkIn && checkOut && (
          <span className="text-xs text-ink-mute flex-shrink-0">
            {labels.nights(nights)}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={labels.placeholder}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label={labels.cancel}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm cursor-default"
          />

          {/* Panel */}
          <div
            ref={dialogRef}
            className="relative bg-cloud border border-line shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — two side captions for check-in / check-out */}
            <div className="grid grid-cols-2 border-b border-line">
              <div className={`px-6 py-4 ${picking === 'in' ? 'bg-moss/5' : ''}`}>
                <div className="text-xs tracking-[0.2em] uppercase text-ink-mute mb-1">
                  {labels.checkInLabel}
                </div>
                <div className="text-ink font-medium">
                  {draftIn
                    ? formatDateLong(draftIn, locale)
                    : <span className="text-ink-mute">—</span>}
                </div>
              </div>
              <div className={`px-6 py-4 border-l border-line ${picking === 'out' ? 'bg-moss/5' : ''}`}>
                <div className="text-xs tracking-[0.2em] uppercase text-ink-mute mb-1">
                  {labels.checkOutLabel}
                </div>
                <div className="text-ink font-medium">
                  {draftOut
                    ? formatDateLong(draftOut, locale)
                    : <span className="text-ink-mute">—</span>}
                </div>
              </div>
            </div>

            {/* Calendar grid — two months */}
            <div className="px-4 md:px-6 py-4 flex flex-col md:flex-row gap-4 md:gap-6">
              {renderMonth(viewYear, viewMonth, true)}
              <div className="hidden md:block w-px bg-line" />
              {renderMonth(rightMonthDate.getFullYear(), rightMonthDate.getMonth(), false)}
            </div>

            {/* Summary + actions */}
            <div className="border-t border-line px-4 md:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="text-sm text-ink-soft">
                {summaryLine}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={clear}
                  className="px-4 py-2 text-sm text-ink-soft hover:text-ink underline-offset-2 hover:underline"
                >
                  {labels.clear}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm text-ink-soft hover:text-ink border border-line hover:border-ink-soft transition-colors"
                >
                  {labels.cancel}
                </button>
                <button
                  type="button"
                  onClick={apply}
                  disabled={!draftIn || !draftOut || draftOut <= draftIn}
                  className="px-5 py-2 text-sm bg-moss text-cloud hover:bg-moss-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {labels.apply}
                </button>
              </div>
            </div>

            {/* Close X */}
            <button
              type="button"
              aria-label={labels.cancel}
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-ink-mute hover:text-ink hover:bg-line/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateLong(iso: string, locale: 'zh' | 'en'): string {
  const d = isoToDate(iso);
  if (locale === 'zh') {
    const w = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${w}`;
  }
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `${weekdays[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}