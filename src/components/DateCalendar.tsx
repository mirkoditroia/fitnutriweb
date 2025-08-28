"use client";
import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";

export function DateCalendar({ 
  availableDates, 
  selectedDate, 
  onDateSelect, 
  showPromotionalBanner 
}: { 
  availableDates: string[]; 
  selectedDate: string; 
  onDateSelect: (date: string) => void; 
  showPromotionalBanner: boolean;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const isDateAvailable = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return availableDates.includes(dateStr);
  };

  const isDateSelected = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return selectedDate === dateStr;
  };

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    onDateSelect(dateStr);
  };

  const getDayClasses = (date: Date) => {
    let classes = "w-10 h-10 flex items-center justify-center text-sm rounded-full cursor-pointer transition-all duration-200";
    if (isToday(date)) classes += " ring-2 ring-primary/50";
    if (isDateSelected(date)) classes += " bg-primary text-primary-foreground font-semibold";
    else if (isDateAvailable(date)) classes += " bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-medium border border-emerald-200";
    else classes += " text-muted-foreground/50 cursor-not-allowed";
    return classes;
  };

  const dayOfWeek = (d: Date) => ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"][d.getDay()];

  return (
    <div className="border border-border rounded-lg p-4">
      {showPromotionalBanner && (
        <div className="mb-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          Seleziona una data disponibile per la consultazione gratuita
        </div>
      )}
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="px-2 py-1 border rounded hover:bg-muted">←</button>
        <div className="text-sm font-medium">{format(currentMonth, "MMMM yyyy")}</div>
        <button type="button" onClick={nextMonth} className="px-2 py-1 border rounded hover:bg-muted">→</button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground mb-2">
        {["Lun","Mar","Mer","Gio","Ven","Sab","Dom"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {monthDays.map((date) => (
          <button
            key={date.toISOString()}
            type="button"
            // permettiamo il click anche su date non disponibili per impostare selezione e mostrare messaggio
            className={getDayClasses(date)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDateClick(date);
            }}
            title={`${dayOfWeek(date)} ${format(date, "dd/MM")}`}
          >
            {format(date, "d")}
          </button>
        ))}
      </div>
    </div>
  );
}


