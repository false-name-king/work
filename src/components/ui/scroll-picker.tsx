import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ScrollPickerProps {
  options: (string | number)[];
  value: string | number;
  onChange: (value: string | number) => void;
  className?: string;
}

const ITEM_HEIGHT = 44; 

export const ScrollPicker = ({ options, value, onChange, className }: ScrollPickerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scrollToValue = useCallback((val: string | number, instant = false) => {
    const idx = options.indexOf(val);
    if (idx !== -1 && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: idx * ITEM_HEIGHT,
        behavior: instant ? 'auto' : 'smooth'
      });
    }
  }, [options]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let timer: any = null;

    const handleScroll = () => {
      if (timer) clearTimeout(timer);
      
      timer = setTimeout(() => {
        const newIndex = Math.round(el.scrollTop / ITEM_HEIGHT);
        const newValue = options[newIndex];
        if (newValue !== undefined && newValue !== value) {
          onChange(newValue);
        }
        el.scrollTo({ top: newIndex * ITEM_HEIGHT, behavior: 'smooth' });
      }, 150);
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [options, value, onChange]);

  useEffect(() => {
    // Instant scroll on mount to avoid the "scrolling from 0" effect
    scrollToValue(value, true);
  }, []);

  return (
    <div className={cn("relative h-[220px] w-full overflow-hidden bg-white/50 backdrop-blur-md rounded-xl border border-black/[0.05]", className)}>
      {/* Selection Overlay (centered in 5 items) */}
      <div className="absolute top-[88px] left-0 w-full h-[44px] pointer-events-none bg-black/[0.03] border-y border-black/[0.05] z-10" />
      
      <div 
        ref={scrollRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar py-[88px]"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {options.map((opt, i) => (
          <div 
            key={i}
            className={cn(
              "h-[44px] flex items-center justify-center text-lg snap-center cursor-pointer",
              value === opt ? "text-[#007AFF] font-semibold scale-110" : "text-black/30 scale-100"
            )}
            onClick={() => scrollToValue(opt)}
          >
            {opt}
          </div>
        ))}
      </div>
    </div>
  );
};