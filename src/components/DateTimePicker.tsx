"use client";
import { useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export function DateTimePicker({
  value,
  onChange,
  minHoursFromNow = 24,
}: {
  value?: string;
  onChange: (iso: string) => void;
  minHoursFromNow?: number;
}) {
  const minDate = useMemo(() => {
    const d = new Date(Date.now() + minHoursFromNow * 3600 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, [minHoursFromNow]);

  const initial = value ? new Date(value) : new Date(Date.now() + minHoursFromNow * 3600 * 1000);
  const [dt, setDt] = useState<Date>(initial);
  const apply = (d: Date) => onChange(d.toISOString());

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium mb-1">Data e ora</label>
        <DatePicker
          selected={dt}
          onChange={(d) => { if (d) { setDt(d); apply(d); } }}
          showTimeSelect
          timeIntervals={30}
          minDate={new Date(minDate)}
          dateFormat="Pp"
          className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}


