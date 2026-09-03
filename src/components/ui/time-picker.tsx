import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ScrollPicker } from "./scroll-picker";
import { Button } from "./button";
import { Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string; // "HH:mm"
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

const COMMON_PRESETS = ["19:00", "19:30", "20:00", "20:30", "21:00", "08:00", "17:00", "18:00"];

export const TimePicker = ({ value, onChange, label, className }: TimePickerProps) => {
  const [open, setOpen] = useState(false);
  const parts = (value || "19:00").split(':');
  const h = parts[0]?.padStart(2, '0') || "19";
  const m = parts[1]?.padStart(2, '0') || "00";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          type="button"
          variant="outline" 
          role="combobox"
          aria-expanded={open}
          aria-label={label ? `${label}时间：${value || '未设置'}` : `选择时间：${value || '未设置'}`}
          className={cn(
            "h-8.5 w-full justify-start gap-1.5 clay-tray rounded-2xl px-3 font-normal active:scale-[0.98] transition-all border border-white/60 shadow-none",
            className
          )}
        >
          <Clock className="h-3.5 w-3.5 text-[#7379E6] shrink-0" />
          <span className="font-tabular text-xs font-black text-[#2D3142]">{value || "选择时间"}</span>
          {label && <span className="ml-auto text-[9px] text-[#5B60C4] font-black uppercase tracking-wider">{label}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 bg-[#FAF7F2] border-2 border-white/95 shadow-2xl rounded-3xl">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F0EBE0]">
          <span className="text-xs font-black text-[#2D3142]">{label ? `${label}时间` : '选择时间'}</span>
          <span className="text-xs font-mono font-black text-[#7379E6] bg-[#EEF0FD] border border-white px-2.5 py-0.5 rounded-xl shadow-2xs">
            {h}:{m}
          </span>
        </div>

        {/* Scroll Pickers */}
        <div className="flex gap-3 justify-center">
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[10px] font-black text-[#5B60C4] uppercase">小时</span>
            <ScrollPicker 
              options={HOURS} 
              value={h} 
              onChange={(val) => onChange(`${val}:${m}`)} 
              aria-label="选择小时"
            />
          </div>
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[10px] font-black text-[#5B60C4] uppercase">分钟</span>
            <ScrollPicker 
              options={MINUTES} 
              value={m} 
              onChange={(val) => onChange(`${h}:${val}`)} 
              aria-label="选择分钟"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-3 pt-2.5 border-t border-[#F0EBE0]">
          <div className="text-[10px] font-black text-[#5B60C4] uppercase tracking-wider mb-1.5">快捷选择</div>
          <div className="grid grid-cols-4 gap-1.5">
            {COMMON_PRESETS.map((preset) => {
              const active = value === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    onChange(preset);
                    setOpen(false);
                  }}
                  className={cn(
                    "h-6.5 rounded-xl text-[10px] font-mono font-black flex items-center justify-center transition-all cursor-pointer",
                    active 
                      ? "bg-[#7379E6] text-white shadow-xs border border-white" 
                      : "bg-white text-[#2D3142] border border-[#EFEAE1] hover:bg-[#F4EFE6]"
                  )}
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </div>

        {/* Close confirmation button */}
        <div className="mt-3">
          <Button 
            type="button"
            size="sm" 
            className="w-full h-9 text-xs bg-[#7379E6] hover:bg-[#656BD9] text-white font-black rounded-2xl gap-1 shadow-[0_4px_12px_rgba(115,121,230,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.5)]"
            onClick={() => setOpen(false)}
          >
            <Check className="w-3.5 h-3.5" />
            确定
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
