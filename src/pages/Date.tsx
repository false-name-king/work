import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const K = 'schedule_base';
const K_C = 'schedule_custom';

const SCHED_T = new Date();
SCHED_T.setHours(0, 0, 0, 0);

function fmtKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DatePage() {
  const [baseDate, setBaseDate] = useState<Date>(new Date(SCHED_T));
  const [baseWork, setBaseWork] = useState<number>(1);
  const [customDays, setCustomDays] = useState<Record<string, boolean>>({});
  const [curMonth, setCurMonth] = useState<Date>(new Date(SCHED_T.getFullYear(), SCHED_T.getMonth(), 1));
  const [selectedBaseDateStr, setSelectedBaseDateStr] = useState(fmtKey(SCHED_T));
  
  // Store fetched holidays. Key: 'YYYY-MM-DD', Value: Holiday object
  const [holidays, setHolidays] = useState<Record<string, any>>({});

  const fetchHolidays = async (year: number, month: number) => {
    try {
      const monthStr = String(month + 1).padStart(2, '0');
      const res = await fetch(`https://holiday.ailcc.com/api/holiday/year/${year}-${monthStr}`);
      const data = await res.json();
      if (data.code === 0 && data.holiday) {
        const newHolidays: Record<string, any> = {};
        Object.entries(data.holiday).forEach(([md, info]: [string, any]) => {
          newHolidays[`${year}-${md}`] = info;
        });
        setHolidays(prev => ({ ...prev, ...newHolidays }));
      }
    } catch (e) {
      console.error("Failed to fetch holidays", e);
    }
  };

  useEffect(() => {
    // Load base
    const d = localStorage.getItem(K);
    let loadedBaseDate = new Date(SCHED_T);
    let loadedBaseWork = 1;
    if (d) {
      const o = JSON.parse(d);
      const [y, m, date] = o.date.split('-');
      loadedBaseDate = new Date(Number(y), Number(m) - 1, Number(date));
      loadedBaseWork = o.work;
    }
    loadedBaseDate.setHours(0, 0, 0, 0);
    setBaseDate(loadedBaseDate);
    setBaseWork(loadedBaseWork);

    // Load custom
    const c = localStorage.getItem(K_C);
    if (c) {
      const parsedCustom = JSON.parse(c);
      let changed = false;
      const todayStr = fmtKey(SCHED_T);
      for (let key in parsedCustom) {
        if (key < todayStr) {
          delete parsedCustom[key];
          changed = true;
        }
      }
      setCustomDays(parsedCustom);
      if (changed) localStorage.setItem(K_C, JSON.stringify(parsedCustom));
    }
  }, []);

  useEffect(() => {
    const month2 = new Date(curMonth.getFullYear(), curMonth.getMonth() + 1, 1);
    fetchHolidays(curMonth.getFullYear(), curMonth.getMonth());
    fetchHolidays(month2.getFullYear(), month2.getMonth());
  }, [curMonth]);

  const isW = (d: Date, bDate: Date, bWork: number) => {
    const diff = Math.round((d.getTime() - bDate.getTime()) / 864e5);
    const mod = ((diff % 2) + 2) % 2;
    return bWork ? mod === 0 : mod !== 0;
  };

  const getWorkStatus = (d: Date, bDate: Date, bWork: number) => {
    const y = d.getFullYear(), m = d.getMonth(), date = d.getDate();
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
  };

  const toggleDay = (dateStr: string) => {
    if (dateStr < fmtKey(SCHED_T)) return;
    const newCustom = { ...customDays };
    if (newCustom[dateStr]) {
      delete newCustom[dateStr];
    } else {
      newCustom[dateStr] = true;
    }
    setCustomDays(newCustom);
    localStorage.setItem(K_C, JSON.stringify(newCustom));
  };

  const goMonth = (n: number) => {
    setCurMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + n, 1));
  };

  const goToday = () => {
    setCurMonth(new Date(SCHED_T.getFullYear(), SCHED_T.getMonth(), 1));
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
    localStorage.setItem(K, JSON.stringify({ date: selectedBaseDateStr, work: isWork }));
    toast.success(`已设置 ${selectedBaseDateStr} 为${isWork ? '上班' : '休息'}`);
  };

  const clearCustom = () => {
    setCustomDays({});
    localStorage.removeItem(K_C);
    toast.success('已取消所有手动修改的日期');
  };

  const clearAll = () => {
    localStorage.removeItem(K);
    localStorage.removeItem(K_C);
    setBaseDate(new Date(SCHED_T));
    setBaseWork(1);
    setCustomDays({});
    toast.success('基准数据已清除，恢复默认设置');
  };

  const renderMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const todayStr = fmtKey(SCHED_T);
    
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return (
      <div key={`${year}-${month}`} className="mb-6">
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {['日', '一', '二', '三', '四', '五', '六'].map(d => (
            <div key={d} className="text-center text-[11px] font-bold text-black/40 py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((dt, idx) => {
            if (!dt) return <div key={`empty-${idx}`} className="h-[80px] sm:h-[90px]" />;
            
            const dateStr = fmtKey(dt);
            let isWorkDay = getWorkStatus(dt, baseDate, baseWork);
            const isToday = dt.getTime() === SCHED_T.getTime();
            const isModified = customDays[dateStr];
            const canEdit = dateStr >= todayStr;
            const holidayData = holidays[dateStr];
            const isHoliday = !!holidayData?.holiday;
            const holidayName = holidayData?.name?.replace(/（休）|（班）/g, '') || '';
            const holidayRest = holidayData?.rest;
            
            if (isModified) isWorkDay = !isWorkDay;

            return (
              <div 
                key={dateStr}
                onClick={() => canEdit && toggleDay(dateStr)}
                className={cn(
                  "h-[80px] sm:h-[90px] p-1 rounded-[12px] flex flex-col items-center justify-start relative select-none transition-all duration-200 overflow-hidden",
                  canEdit ? "cursor-pointer active:scale-95" : "opacity-60 cursor-not-allowed",
                  isWorkDay ? "bg-[#fff7f6] text-[#ff4d4f]" : "bg-[#f8fff6] text-[#52c41a]",
                  isToday && "bg-[#007AFF] text-white shadow-[0_4px_12px_rgba(0,122,255,0.3)]",
                  !isToday && !canEdit && isWorkDay && "bg-red-50/50 text-red-400",
                  !isToday && !canEdit && !isWorkDay && "bg-green-50/50 text-green-400"
                )}
              >
                {/* Date & Status */}
                <div className="flex flex-col items-center justify-center w-full mt-0.5 gap-0.5">
                  <span className={cn("text-[20px] sm:text-[22px] font-black leading-none tracking-tighter", isToday && "text-white")}>
                    {dt.getDate()}
                  </span>
                  <span className={cn(
                    "text-[11px] sm:text-[12px] font-bold leading-none",
                    isToday ? "text-white/90" : (isWorkDay ? "text-[#ff4d4f]/80" : "text-[#52c41a]/80")
                  )}>
                    {isWorkDay ? '班' : '休'}
                  </span>
                </div>

                {/* Holiday Info Row */}
                {isHoliday && (
                  <div className="flex flex-col items-center justify-end flex-1 w-full pb-0.5">
                    <span className={cn(
                      "text-[10px] sm:text-[11px] font-bold truncate w-[110%] text-center leading-tight scale-90",
                      isToday ? "text-white" : "text-[#cf1322]"
                    )}>
                      {holidayName}
                    </span>
                    {holidayRest !== undefined && holidayRest > 0 && (
                      <span className={cn(
                        "text-[9px] sm:text-[10px] font-medium leading-none mt-[2px]",
                        isToday ? "text-white/80" : "text-[#cf1322]/70"
                      )}>
                        {holidayRest}天后
                      </span>
                    )}
                    {holidayRest === 0 && (
                      <span className={cn(
                        "text-[9px] sm:text-[10px] font-bold leading-none mt-[2px]",
                        isToday ? "text-white/80" : "text-[#cf1322]/70"
                      )}>
                        今天
                      </span>
                    )}
                  </div>
                )}

                {/* Modified Indicator */}
                {isModified && (
                  <div className={cn(
                    "absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full",
                    isToday ? "bg-white" : "bg-[#faad14]"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const month2 = new Date(curMonth.getFullYear(), curMonth.getMonth() + 1, 1);

  return (
    <div className="space-y-4 pb-8">
      {/* Calendar Card */}
      <div className="ios-card p-4">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-[17px] font-bold text-black/90 tracking-tight">
            {curMonth.getFullYear()}年{curMonth.getMonth() + 1}月
          </h2>
          <div className="flex items-center gap-1 bg-black/[0.03] p-1 rounded-xl">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-black/60" onClick={() => goMonth(-1)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" className="h-8 px-3 rounded-lg text-[13px] font-bold text-black/70" onClick={goToday}>
              今天
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-black/60" onClick={() => goMonth(1)}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {renderMonth(curMonth.getFullYear(), curMonth.getMonth())}
        {/* Divider */}
        <div className="h-px bg-black/[0.04] w-full my-6" />
        {/* Render next month for preview */}
        <div className="px-1 mb-4">
          <h2 className="text-[15px] font-bold text-black/50">
            {month2.getFullYear()}年{month2.getMonth() + 1}月
          </h2>
        </div>
        {renderMonth(month2.getFullYear(), month2.getMonth())}

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-black/[0.04] flex-wrap">
          <div className="flex items-center gap-2 text-[11px] font-bold text-black/40">
            <div className="w-3 h-3 rounded-[4px] bg-[#fff7f6] border border-[#ffccc7]" /> 上班
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-black/40">
            <div className="w-3 h-3 rounded-[4px] bg-[#f6ffed] border border-[#d9f7be]" /> 休息
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-black/40">
            <div className="w-2 h-2 rounded-full bg-[#faad14]" /> 手动修改
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-black/40">
            <span className="text-[#cf1322] font-bold">国庆节</span> 法定节假日
          </div>
        </div>
      </div>

      {/* Settings Card */}
      <div className="ios-card p-4 space-y-4">
        <h3 className="text-[14px] font-bold text-black/80 px-1">设置排班基准</h3>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[130px]">
            <input 
              type="date" 
              value={selectedBaseDateStr}
              onChange={(e) => setSelectedBaseDateStr(e.target.value)}
              className="w-full h-11 bg-black/[0.03] border-none rounded-2xl px-3 text-[16px] font-bold text-black/80 outline-none appearance-none sm:text-[14px]"
            />
          </div>
          <Button onClick={() => applyBaseSetting(1)} className="h-11 px-3 sm:px-5 rounded-2xl bg-[#fff1f0] text-[#cf1322] hover:bg-[#ff4d4f] hover:text-white font-bold transition-colors whitespace-nowrap">
            设为上班
          </Button>
          <Button onClick={() => applyBaseSetting(0)} className="h-11 px-3 sm:px-5 rounded-2xl bg-[#f6ffed] text-[#389e0d] hover:bg-[#52c41a] hover:text-white font-bold transition-colors whitespace-nowrap">
            设为休息
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button variant="ghost" onClick={clearCustom} className="h-10 rounded-xl bg-black/[0.03] text-black/60 font-bold hover:text-black hover:bg-black/[0.05]">
            <RotateCcw className="w-4 h-4 mr-2" /> 取消手动修改
          </Button>
          <Button variant="ghost" onClick={clearAll} className="h-10 rounded-xl bg-red-50 text-red-500 font-bold hover:text-red-600 hover:bg-red-100">
            <Trash2 className="w-4 h-4 mr-2" /> 清除本地数据
          </Button>
        </div>
      </div>
    </div>
  );
}