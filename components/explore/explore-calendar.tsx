"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Star,
  MapPin,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Event } from "@/lib/dtos/event.dto";
import { useMonthEvents } from "@/hooks/api/useEvents";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";

const THAILAND_TZ = "Asia/Bangkok";
const THAILAND_OFFSET_HOURS = 7;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// DB stores Thailand local time as UTC (Z suffix), so we need to add offset
function parseThailandDateFromUTC(utcDateStr: string): Date {
  const date = new Date(utcDateStr);
  date.setHours(date.getHours() + THAILAND_OFFSET_HOURS);
  return date;
}

const EVENT_COLORS = [
  {
    bg: "bg-violet-500",
    light: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-600 dark:text-violet-400",
  },
  {
    bg: "bg-rose-500",
    light: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-600 dark:text-rose-400",
  },
  {
    bg: "bg-amber-500",
    light: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-600 dark:text-amber-400",
  },
  {
    bg: "bg-emerald-500",
    light: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  {
    bg: "bg-sky-500",
    light: "bg-sky-100 dark:bg-sky-900/30",
    text: "text-sky-600 dark:text-sky-400",
  },
  {
    bg: "bg-pink-500",
    light: "bg-pink-100 dark:bg-pink-900/30",
    text: "text-pink-600 dark:text-pink-400",
  },
];

interface ExploreCalendarProps {
  initialYear?: number;
  initialMonth?: number;
}

export function ExploreCalendar({
  initialYear,
  initialMonth,
}: ExploreCalendarProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    new Date(
      initialYear ?? today.getFullYear(),
      initialMonth ?? today.getMonth(),
      1,
    ),
  );
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;

  const { data: events = [] } = useMonthEvents(year, month);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const eventsByDay = useMemo(() => {
    const map: Record<string, Event[]> = {};
    events.forEach((event) => {
      const startDate = parseThailandDateFromUTC(event.start_date);
      const endDate = parseThailandDateFromUTC(event.end_date);
      const eventDays = eachDayOfInterval({ start: startDate, end: endDate });
      eventDays.forEach((day) => {
        const key = formatInTimeZone(day, THAILAND_TZ, "yyyy-MM-dd");
        if (!map[key]) map[key] = [];
        if (!map[key].find((e) => e.id === event.id)) {
          map[key].push(event);
        }
      });
    });
    return map;
  }, [events]);

  const prevMonth = () => setViewDate(new Date(year, month - 2, 1));
  const nextMonth = () => setViewDate(new Date(year, month, 1));

  const todayZoned = toZonedTime(today, THAILAND_TZ);
  const activeDay = selectedDay || (hoveredDay ? new Date(hoveredDay) : null);
  const activeDayKey = activeDay
    ? formatInTimeZone(activeDay, THAILAND_TZ, "yyyy-MM-dd")
    : null;
  const activeDayEvents = activeDayKey ? eventsByDay[activeDayKey] || [] : [];

  const getEventColor = (index: number) =>
    EVENT_COLORS[index % EVENT_COLORS.length];

  return (
    <div className="flex gap-0 bg-white dark:bg-[#0a0f16]/80 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
      {/* Calendar Section */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                className="text-xl font-bold text-gray-900 dark:text-white"
                style={{ fontWeight: 800 }}
              >
                {formatInTimeZone(viewDate, THAILAND_TZ, "MMMM")}
              </h2>
              <p
                className="text-sm text-gray-500 dark:text-slate-400"
                style={{ fontWeight: 500 }}
              >
                {formatInTimeZone(viewDate, THAILAND_TZ, "yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() =>
                setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))
              }
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
            >
              {formatInTimeZone(todayZoned, THAILAND_TZ, "MMM yyyy")}
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-slate-800">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayKey = formatInTimeZone(day, THAILAND_TZ, "yyyy-MM-dd");
            const dayEvents = eventsByDay[dayKey] || [];
            const inMonth = isSameMonth(day, viewDate);
            const isTodayDate = isToday(toZonedTime(day, THAILAND_TZ));
            const isActive = activeDayKey === dayKey;

            return (
              <button
                key={dayKey}
                onClick={() =>
                  setSelectedDay(
                    selectedDay?.getTime() === day.getTime() ? null : day,
                  )
                }
                onMouseEnter={() => setHoveredDay(dayKey)}
                onMouseLeave={() => setHoveredDay(null)}
                className={`
                  relative aspect-square p-2 flex flex-col items-center justify-start transition-all
                  ${!inMonth ? "opacity-25" : ""}
                  ${isActive ? "bg-violet-50 dark:bg-violet-900/20" : "hover:bg-gray-50 dark:hover:bg-slate-800/50"}
                `}
              >
                {/* Day number */}
                <span
                  className={`
                    w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all
                    ${isTodayDate ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "text-gray-700 dark:text-slate-300"}
                    ${isActive && !isTodayDate ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30" : ""}
                  `}
                  style={{ fontWeight: isTodayDate || isActive ? 700 : 600 }}
                >
                  {formatInTimeZone(day, THAILAND_TZ, "d")}
                </span>

                {/* Event dots */}
                {dayEvents.length > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-1.5 flex-wrap max-w-full px-1">
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <div
                        key={event.id}
                        className={`w-2 h-2 rounded-full ${getEventColor(i).bg} shadow-sm`}
                        title={event.name_en || event.name}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Event count badge */}
                {dayEvents.length > 0 && (
                  <div className="absolute top-1 right-1">
                    <span
                      className={`
                      text-[10px] font-bold px-1.5 py-0.5 rounded-full
                      ${getEventColor(0).light} ${getEventColor(0).text}
                    `}
                    >
                      {dayEvents.length}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Color legend */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">
              Event types:
            </span>
            {EVENT_COLORS.slice(0, 5).map((color, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${color.bg}`} />
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  {i + 1}
                </span>
              </div>
            ))}
            <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto">
              {events.length} events this month
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px bg-gray-100 dark:bg-slate-800" />

      {/* Events Panel */}
      <div className="w-80 xl:w-96 shrink-0 flex flex-col max-h-[580px]">
        {/* Panel header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          {activeDay ? (
            <div>
              <h3
                className="text-base font-bold text-gray-900 dark:text-white"
                style={{ fontWeight: 800 }}
              >
                {formatInTimeZone(activeDay, THAILAND_TZ, "EEEE")}
              </h3>
              <p
                className="text-sm text-gray-500 dark:text-slate-400"
                style={{ fontWeight: 500 }}
              >
                {formatInTimeZone(activeDay, THAILAND_TZ, "d MMMM yyyy")}
              </p>
            </div>
          ) : (
            <div>
              <h3
                className="text-base font-bold text-gray-900 dark:text-white"
                style={{ fontWeight: 800 }}
              >
                Events
              </h3>
              <p className="text-sm text-gray-400 dark:text-slate-500">
                Hover or click a day to see events
              </p>
            </div>
          )}
        </div>

        {/* Events list */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {activeDayEvents.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  No events on this day
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                  Try selecting another date
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={activeDayKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                    {activeDayEvents.length} event
                    {activeDayEvents.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {activeDayEvents.map((event, i) => (
                  <EventPanelCard key={event.id} event={event} colorIndex={i} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function EventPanelCard({
  event,
  colorIndex,
}: {
  event: Event;
  colorIndex: number;
}) {
  const router = useRouter();
  const color = EVENT_COLORS[colorIndex % EVENT_COLORS.length];

  const startDate = formatInTimeZone(
    parseThailandDateFromUTC(event.start_date),
    THAILAND_TZ,
    "d MMM",
  );
  const endDate = formatInTimeZone(
    parseThailandDateFromUTC(event.end_date),
    THAILAND_TZ,
    "d MMM",
  );
  const isMultiDay = event.start_date !== event.end_date;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: colorIndex * 0.05 }}
      onClick={() => router.push(`/event/${event.id}`)}
      className="group p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-slate-900/50 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Color indicator */}
        <div className={`w-1.5 h-12 rounded-full ${color.bg} shrink-0`} />

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4
            className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2"
            style={{ fontWeight: 700 }}
          >
            {event.name_en || event.name}
          </h4>

          {/* Thai name */}
          {event.name_en && event.name && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">
              {event.name}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Date */}
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
              <Calendar className="w-3 h-3" />
              {startDate}
              {isMultiDay && <span> – {endDate}</span>}
            </span>

            {/* Rating */}
            {event.rating > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                {Number(event.rating).toFixed(1)}
              </span>
            )}
          </div>

          {/* Category badge */}
          {event.categories?.[0] && (
            <span
              className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-lg text-xs font-semibold ${color.light} ${color.text}`}
            >
              {event.categories[0]}
            </span>
          )}

          {/* Province */}
          {event.province && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 dark:text-slate-500">
              <MapPin className="w-3 h-3 text-emerald-500" />
              <span className="truncate">
                {event.province.name_en || event.province.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
