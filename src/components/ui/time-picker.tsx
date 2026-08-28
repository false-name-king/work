import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ScrollPicker } from "./scroll-picker";
import { Button } from "./button";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string; // "HH:mm"
  onChange: (value: string) => void;
  label?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

export const TimePicker = ({ value, onChange, label }: TimePickerProps) => {
  const [h, m] = value.split(':');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="h-10 w-full justify-start gap-2 bg-black/[0.05] border-none rounded-xl px-3 font-normal active:bg-black/[0.1]"
        >
          <Clock className="h-4 w-4 opacity-50" />
          <span>{value || "选择时间"}</span>
          {label && <span className="ml-auto text-[10px] text-black/30 font-bold uppercase">{label}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 flex gap-4 bg-white/80 backdrop-blur-2xl border-white/20">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold text-black/40 uppercase">时</span>
          <ScrollPicker 
            options={HOURS} 
            value={h} 
            onChange={(val) => onChange(`${val}:${m}`)} 
            className="w-20"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold text-black/40 uppercase">分</span>
          <ScrollPicker 
            options={MINUTES} 
            value={m} 
            onChange={(val) => onChange(`${h}:${val}`)} 
            className="w-20"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};