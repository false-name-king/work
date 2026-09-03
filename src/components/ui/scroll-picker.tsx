import { useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface ScrollPickerProps {
  options: (string | number)[];
  value: string | number;
  onChange: (value: string | number) => void;
  className?: string;
  'aria-label'?: string;
}

const ITEM_HEIGHT = 44;

export const ScrollPicker = ({ 
  options, 
  value, 
  onChange, 
  className,
  'aria-label': ariaLabel = "选择器" 
}: ScrollPickerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInternalScrollRef = useRef(false);

  const scrollToValue = useCallback((val: string | number, instant = false) => {
    const idx = options.indexOf(val);
    if (idx !== -1 && scrollRef.current) {
      isInternalScrollRef.current = true;
      scrollRef.current.scrollTo({
        top: idx * ITEM_HEIGHT,
        behavior: instant ? 'instant' : 'smooth'
      });
      setTimeout(() => {
        isInternalScrollRef.current = false;
      }, 200);
    }
  }, [options]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      if (timer) clearTimeout(timer);
      
      timer = setTimeout(() => {
        const newIndex = Math.round(el.scrollTop / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(newIndex, options.length - 1));
        const newValue = options[clampedIndex];
        if (newValue !== undefined && newValue !== value) {
          onChange(newValue);
        }
        el.scrollTo({ top: clampedIndex * ITEM_HEIGHT, behavior: 'smooth' });
      }, 120);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (timer) clearTimeout(timer);
      el.removeEventListener('scroll', handleScroll);
    };
  }, [options, value, onChange]);

  useEffect(() => {
    scrollToValue(value, true);
  }, [value, scrollToValue]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = options.indexOf(value);
    if (currentIndex === -1) return;

    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (currentIndex > 0) {
        onChange(options[currentIndex - 1]);
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (currentIndex < options.length - 1) {
        onChange(options[currentIndex + 1]);
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(options[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(options[options.length - 1]);
    }
  };

  return (
    <div 
      className={cn(
        "relative h-[220px] w-full overflow-hidden clay-tray rounded-3xl border border-white/80 focus-within:ring-2 focus-within:ring-[#7379E6]", 
        className
      )}
      role="listbox"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Selection Center Highlight Bar */}
      <div 
        className="absolute top-[88px] left-0 w-full h-[44px] pointer-events-none bg-[#7379E6]/10 border-y-2 border-[#7379E6]/30 z-10 rounded-xl" 
        aria-hidden="true"
      />
      
      <div 
        ref={scrollRef}
        className="h-full overflow-y-scroll overflow-x-hidden snap-y snap-mandatory no-scrollbar py-[88px] overscroll-contain"
        style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {options.map((opt, i) => {
          const isSelected = value === opt;
          return (
            <div 
              key={i}
              role="option"
              aria-selected={isSelected}
              className={cn(
                "h-[44px] flex items-center justify-center text-lg snap-center cursor-pointer font-tabular transition-all duration-150 select-none",
                isSelected 
                  ? "text-[#7379E6] font-black scale-110" 
                  : "text-[#86839C] hover:text-[#2D3142] scale-95 font-bold"
              )}
              onClick={() => {
                onChange(opt);
                scrollToValue(opt);
              }}
            >
              {opt}
            </div>
          );
        })}
      </div>
    </div>
  );
};
