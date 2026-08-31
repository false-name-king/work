import { useState, useEffect, useCallback, useMemo, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Trash2, Calendar, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STORAGE_KEY_BASE = 'schedule_base';
const STORAGE_KEY_CUSTOM = 'schedule_custom';

interface HolidayInfo {
  holiday: boolean;
  name: string;
  wage?: number;
  date?: string;
  rest?: number;
  after?: boolean;
}

interface HolidayApiResponse {
  code: number;
  holiday?: Record<string, HolidayInfo>;
}

const holidayCache = new Map<string, Record<string, HolidayInfo>>();

function getCleanToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function fetchMonthHolidayData(year: number, month: number): Promise<Record<string, HolidayInfo>> {
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  if (holidayCache.has(monthKey)) {
    return holidayCache.get(monthKey)!;
  }

  try {
    const res = await fetch(`https://holiday.ailcc.com/api/holiday/year/${monthKey}`);
    if (!res.ok) return {};
    const data = (await res.json()) as HolidayApiResponse;
    if (data.code === 0 && data.holiday) {
      const monthHolidays: Record<string, HolidayInfo> = {};
      for (const [md, info] of Object.entries(data.holiday)) {
        monthHolidays[`${year}-${md}`] = info;
      }
      holidayCache.set(monthKey, monthHolidays);
      return monthHolidays;
    }
  } catch (e) {
    console.warn("Could not fetch external holidays", e);
  }
  return {};
}

export default function DatePage() {
  const today = useMemo(() => getCleanToday(), []);
  const todayStr = useMemo(() => fmtKey(today), [today]);

  // Lazy initialize base settings from localStorage
  const [baseDate, setBaseDate] = useState<Date>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BASE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.date) {
          const [y, m, date] = parsed.date.split('-');
          const d = new Date(Number(y), Number(m) - 1, Number(date));
          d.setHours(0, 0, 0, 0);
          return d;
        }
      }
    } catch (e) {
      console.error("Failed to parse base date", e);
    }
    return getCleanToday();
  });

  const [baseWork, setBaseWork] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BASE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.work === 'number') {
          return parsed.work;
        }
      }
    } catch (e) {
      console.error("Failed to parse base work", e);
    }
    return 1;
  });

  // Lazy initialize custom overrides from localStorage
  const [customDays, setCustomDays] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, boolean>;
        const currentToday = fmtKey(getCleanToday());
        const filtered: Record<string, boolean> = {};
        let modified = false;

        for (const key of Object.keys(parsed)) {
          if (key >= currentToday) {
            filtered[key] = parsed[key];
          } else {
            modified = true;
          }
        }
        if (modified) {
          localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(filtered));
        }
        return filtered;
      }
    } catch (e) {
      console.error("Failed to parse custom days", e);
    }
    return {};
  });

  const [curMonth, setCurMonth] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedBaseDateStr, setSelectedBaseDateStr] = useState(todayStr);
  const [holidays, setHolidays] = useState<Record<string, HolidayInfo>>({});

  useEffect(() => {
    let isMounted = true;
    const nextMonth = new Date(curMonth.getFullYear(), curMonth.getMonth() + 1, 1);

    Promise.all([
      fetchMonthHolidayData(curMonth.getFullYear(), curMonth.getMonth()),
      fetchMonthHolidayData(nextMonth.getFullYear(), nextMonth.getMonth())
    ]).then(([m1, m2]) => {
      if (isMounted) {
        setHolidays(prev => ({ ...prev, ...m1, ...m2 }));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [curMonth]);

  const isW = useCallback((d: Date, bDate: Date, bWork: number) => {
    const diff = Math.round((d.getTime() - bDate.getTime()) / 864e5);
    const mod = ((diff % 2) + 2) % 2;
    return bWork ? mod === 0 : mod !== 0;
  }, []);

  const getWorkStatus = useCallback((d: Date, bDate: Date, bWork: number) => {
    const y = d.getFullYear();
    const m = d.getMonth();
    const date = d.getDate();
    const firstDay = new Date(y, m, 1).getDay();
    const firstMonday = firstDay === 0 ? 2 : firstDay === 1 ? 1 : 9 - firstDay;
    const secondMonday = firstMonday + 7;

    if (date >= secondMonday && date <= secondMonday + 3) {
      const prevSunday = new Date(y, m, secondMonday - 1);
      const prevIsWork = isW(prevSunday, bDate, bWork);
      const offset = date - secondMonday;
      return prevIsWork ? offset >= 2 : offset < 2;
    }
    return isW(d, bDate, bWork);
  }, [isW]);

  const toggleDay = (dateStr: string) => {
    if (dateStr < todayStr) {
      toast.info("历史排班无法修改");
      return;
    }
    const next = { ...customDays };
    if (next[dateStr]) {
      delete next[dateStr];
    } else {
      next[dateStr] = true;
    }
    setCustomDays(next);
    localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(next));
    toast.success(`已切换 ${dateStr} 的排班状态`);
  };

  const handleDayKeyDown = (e: KeyboardEvent<HTMLButtonElement>, dateStr: string) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleDay(dateStr);
    }
  };

  const goMonth = (n: number) => {
    setCurMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + n, 1));
  };

  const goToday = () => {
    setCurMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const applyBaseSetting = (isWork: number) => {
    if (!selectedBaseDateStr) {
      toast.error('请先选择基准日期');
      return;
    }
    const [y, m, d] = selectedBaseDateStr.split('-');
    const newBase = new Date(Number(y), Number(m) - 1, Number(d));
    newBase.setHours(0, 0, 0, 0);
    
    setBaseDate(newBase);
    setBaseWork(isWork);
    localStorage.setItem(STORAGE_KEY_BASE, JSON.stringify({ date: selectedBaseDateStr, work: isWork }));
    toast.success(`已设置 ${selectedBaseDateStr} 为【${isWork ? '上班' : '休息'}】基准`);
  };

  const clearCustom = () => {
    setCustomDays({});
    localStorage.removeItem(STORAGE_KEY_CUSTOM);
    toast.success('已清空所有手动修改的排班');
  };

  const clearAll = () => {
    localStorage.removeItem(STORAGE_KEY_BASE);
    localStorage.removeItem(STORAGE_KEY_CUSTOM);
    setBaseDate(getCleanToday());
    setBaseWork(1);
    setCustomDays({});
    toast.success('已重置所有排班配置');
  };

  const renderMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    const weekLabels = ['日', '一', '二', '三', '四', '五', '六'];

    return (
      <div key={`${year}-${month}`} className="mb-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1.5" role="row">
          {weekLabels.map((d, idx) => (
            <div 
              key={d} 
              className={cn(
                "text-center text-[11px] font-bold py-1",
                idx === 0 || idx === 6 ? "text-red-500/60" : "text-black/40"
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`${year}年${month + 1}月排班日历`}>
          {days.map((dt, idx) => {
            if (!dt) {
              return <div key={`empty-${idx}`} className="h-[76px] sm:h-[86px]" aria-hidden="true" />;
            }
            
            const dateStr = fmtKey(dt);
            let isWorkDay = getWorkStatus(dt, baseDate, baseWork);
            const isToday = dt.getTime() === today.getTime();
            const isModified = !!customDays[dateStr];
            const canEdit = dateStr >= todayStr;
            const holidayData = holidays[dateStr];
            const isHoliday = !!holidayData?.holiday;
            const holidayName = holidayData?.name?.replace(/（休）|（班）/g, '') || '';
            const holidayRest = holidayData?.rest;
            
            if (isModified) isWorkDay = !isWorkDay;

            const accessibleLabel = `${year}年${month + 1}月${dt.getDate()}日 ${isWorkDay ? '上班' : '休息'}${isHoliday ? ' ' + holidayName : ''}${isToday ? ' 今天' : ''}${isModified ? ' 已手动修改' : ''}`;

            return (
              <button 
                key={dateStr}
                type="button"
                role="gridcell"
                aria-label={accessibleLabel}
                disabled={!canEdit}
                onKeyDown={(e) => canEdit && handleDayKeyDown(e, dateStr)}
                onClick={() => canEdit && toggleDay(dateStr)}
                className={cn(
                  "h-[76px] sm:h-[86px] p-1 rounded-xl flex flex-col items-center justify-start relative select-none transition-all duration-150 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] border",
                  canEdit ? "cursor-pointer active:scale-95" : "opacity-50 cursor-not-allowed",
                  isToday 
                    ? "bg-[#007AFF] border-[#007AFF] text-white shadow-md" 
                    : isWorkDay 
                      ? "bg-rose-50/70 border-rose-100 text-rose-600 hover:bg-rose-100/70" 
                      : "bg-emerald-50/70 border-emerald-100 text-emerald-600 hover:bg-emerald-100/70",
                  !isToday && isModified && "ring-1 ring-amber-400"
                )}
              >
                {/* Date number & Status */}
                <div className="flex flex-col items-center justify-center w-full mt-0.5 gap-0.5 pointer-events-none">
                  <span className={cn(
                    "text-[18px] sm:text-[20px] font-black leading-none tracking-tight font-mono",
                    isToday ? "text-white" : "text-black/85"
                  )}>
                    {dt.getDate()}
                  </span>
                  <span className={cn(
                    "text-[10px] sm:text-[11px] font-bold leading-none px-1.5 py-0.5 rounded-md",
                    isToday 
                      ? "bg-white/20 text-white" 
                      : isWorkDay 
                        ? "bg-rose-100/80 text-rose-700" 
                        : "bg-emerald-100/80 text-emerald-700"
                  )}>
                    {isWorkDay ? '班' : '休'}
                  </span>
                </div>

                {/* Holiday Info Row */}
                {isHoliday && (
                  <div className="flex flex-col items-center justify-end flex-1 w-full pb-0.5 pointer-events-none">
                    <span className={cn(
                      "text-[9px] sm:text-[10px] font-bold truncate w-full text-center leading-tight",
                      isToday ? "text-white/95" : "text-rose-700 font-semibold"
                    )}>
                      {holidayName}
                    </span>
                    {holidayRest !== undefined && holidayRest > 0 && (
                      <span className={cn(
                        "text-[8px] sm:text-[9px] font-medium leading-none mt-0.5",
                        isToday ? "text-white/80" : "text-black/40"
                      )}>
                        {holidayRest}天后
                      </span>
                    )}
                    {holidayRest === 0 && (
                      <span className={cn(
                        "text-[8px] sm:text-[9px] font-bold leading-none mt-0.5",
                        isToday ? "text-white/90" : "text-rose-600"
                      )}>
                        今日休
                      </span>
                    )}
                  </div>
                )}

                {/* Manual Modification Badge */}
                {isModified && (
                  <span 
                    title="已手动修改"
                    className={cn(
                      "absolute top-1 right-1 w-1.5 h-1.5 rounded-full",
                      isToday ? "bg-amber-300 ring-1 ring-white" : "bg-amber-500 shadow-sm"
                    )} 
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const nextMonth = new Date(curMonth.getFullYear(), curMonth.getMonth() + 1, 1);

  return (
    <div className="space-y-4 pb-8">
      {/* Calendar Card */}
      <section 
        aria-label="排班日历"
        className="ios-card p-3.5 border border-black/[0.04]"
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#007AFF]" />
            <h2 className="text-base font-bold text-black/90 tracking-tight">
              {curMonth.getFullYear()}年{curMonth.getMonth() + 1}月
            </h2>
          </div>

          <div className="flex items-center gap-1 bg-black/[0.03] p-0.5 rounded-xl border border-black/[0.03]">
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="查看上一月"
              className="h-7 w-7 rounded-lg text-black/60 hover:bg-black/[0.05]" 
              onClick={() => goMonth(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              aria-label="回到本月"
              className="h-7 px-2.5 rounded-lg text-xs font-bold text-black/70 hover:bg-black/[0.05]" 
              onClick={goToday}
            >
              本月
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="查看下一月"
              className="h-7 w-7 rounded-lg text-black/60 hover:bg-black/[0.05]" 
              onClick={() => goMonth(1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {renderMonth(curMonth.getFullYear(), curMonth.getMonth())}
        
        {/* Next Month Preview Divider */}
        <div className="h-px bg-black/[0.04] w-full my-5" />
        
        <div className="px-1 mb-2">
          <h3 className="text-xs font-bold text-black/40">
            次月预告：{nextMonth.getFullYear()}年{nextMonth.getMonth() + 1}月
          </h3>
        </div>
        {renderMonth(nextMonth.getFullYear(), nextMonth.getMonth())}

        {/* Legend */}
        <div className="flex justify-center items-center gap-3 mt-4 pt-3 border-t border-black/[0.04] flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-black/50">
            <div className="w-3 h-3 rounded-md bg-rose-50 border border-rose-200" /> 上班
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-black/50">
            <div className="w-3 h-3 rounded-md bg-emerald-50 border border-emerald-200" /> 休息
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-black/50">
            <div className="w-2 h-2 rounded-full bg-amber-500" /> 手动调班
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#007AFF]">
            <div className="w-3 h-3 rounded-md bg-[#007AFF]" /> 今日
          </div>
        </div>
      </section>

      {/* Settings Card */}
      <section 
        aria-label="排班基准设置"
        className="ios-card p-3.5 space-y-3.5 border border-black/[0.04]"
      >
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-black/80">排班基准与轮班配置</h3>
          <span className="text-[10px] text-black/40 font-medium">做一休一 + 第二周翻转</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[130px]">
            <label htmlFor="base-date-picker" className="sr-only">选择基准日期</label>
            <input 
              id="base-date-picker"
              type="date" 
              value={selectedBaseDateStr}
              onChange={(e) => setSelectedBaseDateStr(e.target.value)}
              aria-label="基准日期"
              className="w-full h-10 bg-black/[0.03] border border-black/[0.04] rounded-xl px-3 text-xs font-bold text-black/80 outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>
          <Button 
            type="button"
            onClick={() => applyBaseSetting(1)} 
            className="h-10 px-3.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white font-bold text-xs transition-colors whitespace-nowrap gap-1 border border-rose-100"
          >
            <Sun className="w-3.5 h-3.5" />
            设为上班
          </Button>
          <Button 
            type="button"
            onClick={() => applyBaseSetting(0)} 
            className="h-10 px-3.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-bold text-xs transition-colors whitespace-nowrap gap-1 border border-emerald-100"
          >
            <Moon className="w-3.5 h-3.5" />
            设为休息
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button 
            type="button"
            variant="ghost" 
            onClick={clearCustom} 
            className="h-9 rounded-xl bg-black/[0.03] text-black/70 font-semibold text-xs hover:text-black hover:bg-black/[0.06]"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> 取消手动调班
          </Button>
          <Button 
            type="button"
            variant="ghost" 
            onClick={clearAll} 
            className="h-9 rounded-xl bg-red-50 text-red-600 font-semibold text-xs hover:text-red-700 hover:bg-red-100"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> 重置基准配置
          </Button>
        </div>
      </section>
    </div>
  );
}
