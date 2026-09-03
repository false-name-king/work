import { useCallback, memo, type KeyboardEvent } from 'react';
import { useStore, ROLES, MACHINES, COUNTS, ATTENDANCE_TYPES, WORK_STATUSES, type Person, type AttendanceStatus } from '@/store/useStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";

import xiuxi from '@/assets/休息.svg';
import dujia from '@/assets/度假.svg';
import chanjia from '@/assets/产假.svg';

interface PersonItemProps {
  id: number;
}

const renderResultIcon = (v: AttendanceStatus) => {
  if (v === '请假') return xiuxi;
  if (v === '公休') return dujia;
  if (v === '产假') return chanjia;
  return null;
};

const PersonItem = memo(({ id }: PersonItemProps) => {
  const item = useStore(useCallback((state) => state.people.find((p) => p.id === id), [id])) as Person | undefined;
  const updatePerson = useStore((state) => state.updatePerson);

  if (!item) return null;

  const handleAttendanceChange = (type: AttendanceStatus) => {
    updatePerson(id, {
      attendance: type,
      workStatus: type === '出勤' ? item.workStatus : [],
      batches: type === '出勤' ? (item.batches || 20) : 0,
      pieces: type === '出勤' ? (item.pieces || 20) : 0
    });
  };

  const handleToggleWorkStatus = (status: string) => {
    const next = item.workStatus.includes(status)
      ? item.workStatus.filter(s => s !== status)
      : [...item.workStatus, status];
    updatePerson(id, { workStatus: next });
  };

  const handleStatusKeyDown = (e: KeyboardEvent<HTMLDivElement>, status: string) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggleWorkStatus(status);
    }
  };

  const attendanceBadgeClass = (type: AttendanceStatus, active: boolean) => {
    if (!active) return "text-[#65617D] hover:text-[#2D3142] font-bold";
    switch (type) {
      case '请假':
        return "bg-[#FF758F] text-white font-black shadow-[0_3px_8px_rgba(255,117,143,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.45),inset_0_-2px_3px_rgba(0,0,0,0.15)]";
      case '公休':
        return "bg-[#7379E6] text-white font-black shadow-[0_3px_8px_rgba(115,121,230,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.45),inset_0_-2px_3px_rgba(0,0,0,0.15)]";
      case '产假':
        return "bg-[#FFB74D] text-white font-black shadow-[0_3px_8px_rgba(255,183,77,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.45),inset_0_-2px_3px_rgba(0,0,0,0.15)]";
      case '出勤':
      default:
        return "bg-[#4EBA8A] text-white font-black shadow-[0_3px_8px_rgba(78,186,138,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.45),inset_0_-2px_3px_rgba(0,0,0,0.15)]";
    }
  };

  const getCardTopStripe = (att: AttendanceStatus) => {
    switch (att) {
      case '请假':
        return "border-t-[4px] border-t-[#FF758F]";
      case '公休':
        return "border-t-[4px] border-t-[#7379E6]";
      case '产假':
        return "border-t-[4px] border-t-[#FFB74D]";
      case '出勤':
      default:
        return "border-t-[4px] border-t-[#4EBA8A]";
    }
  };

  return (
    <article 
      aria-label={`组员卡片: ${item.name}`}
      className={cn(
        "clay-card overflow-hidden transition-all duration-200 bg-white",
        "border-2 border-[#D5CEBF] hover:border-[#7379E6]/60",
        getCardTopStripe(item.attendance)
      )}
    >
      {/* Header Info */}
      <div className="bg-[#FAF7F2] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#F0EBE1]">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#7379E6] text-white font-black text-xs shadow-[0_3px_8px_rgba(115,121,230,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.6),inset_0_-1.5px_2px_rgba(0,0,0,0.15)] tracking-wide flex items-center justify-center select-none">
            {item.name}
          </span>
        </div>

        <div className="flex gap-1.5 items-center">
          {/* Role selector */}
          <Select 
            value={item.role} 
            onValueChange={(v) => updatePerson(id, { role: v })}
          >
            <SelectTrigger 
              aria-label={`${item.name}的角色`}
              className="h-7.5 w-20 bg-white text-[11px] text-[#2D3142] font-black px-2.5 rounded-xl shadow-xs border border-white hover:border-[#7379E6]/30"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-white shadow-xl bg-[#FAF7F2]">
              {ROLES.map(r => <SelectItem key={r} value={r} className="font-bold text-xs">{r}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Machine selector */}
          <div className="flex items-center gap-1">
            <Select 
              value={item.machine?.toString() || ""} 
              onValueChange={(v) => updatePerson(id, { machine: v ? parseInt(v, 10) : null })}
            >
              <SelectTrigger 
                aria-label={`${item.name}的机号`}
                className="h-7.5 w-20 bg-white text-[11px] text-[#2D3142] font-black px-2.5 rounded-xl shadow-xs border border-white hover:border-[#7379E6]/30"
              >
                <SelectValue placeholder="机号" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white shadow-xl bg-[#FAF7F2]">
                {MACHINES.map(m => <SelectItem key={m} value={m.toString()} className="font-bold text-xs">{m} 号</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-[10px] text-[#7379E6] font-black">机</span>
          </div>
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Attendance Radiogroup Toggle inside Clay Tray */}
        <fieldset className="p-0 m-0 border-none">
          <legend className="sr-only">{item.name}的出勤状态</legend>
          <div 
            role="radiogroup" 
            aria-label={`${item.name}的出勤状态`}
            className="clay-tray p-1 rounded-2xl flex gap-1"
          >
            {ATTENDANCE_TYPES.map((type) => {
              const active = item.attendance === type;
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => handleAttendanceChange(type)}
                  className={cn(
                    "flex-1 py-1.5 text-[11px] rounded-xl transition-all duration-150 active:scale-95 text-center cursor-pointer",
                    attendanceBadgeClass(type, active)
                  )}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </fieldset>

        {item.attendance === '出勤' ? (
          <div className="space-y-3 pt-0.5">
            {/* Work Status Grid */}
            <div>
              <span className="text-[10px] font-black text-[#5B60C4] uppercase tracking-wider block mb-1.5">
                岗位类型
              </span>
              <div 
                className="grid grid-cols-3 gap-1.5"
                role="group"
                aria-label={`${item.name}的岗位选择`}
              >
                {WORK_STATUSES.map(status => {
                  const isChecked = item.workStatus.includes(status);
                  return (
                    <div 
                      key={status} 
                      role="checkbox"
                      aria-checked={isChecked}
                      aria-label={status}
                      tabIndex={0}
                      onKeyDown={(e) => handleStatusKeyDown(e, status)}
                      onClick={() => handleToggleWorkStatus(status)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-2xl cursor-pointer select-none transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7379E6]",
                        isChecked 
                          ? "bg-[#EEF0FD] border-2 border-[#7379E6] text-[#3E4491] font-black shadow-[0_4px_10px_rgba(115,121,230,0.2),inset_0_1.5px_2px_rgba(255,255,255,0.8)]" 
                          : "bg-[#FAF7F2] border border-[#EFEAE1] text-[#65617D] hover:bg-[#F4EFE6] font-bold"
                      )}
                    >
                      <Checkbox 
                        checked={isChecked}
                        tabIndex={-1}
                        className={cn(
                          "h-3.5 w-3.5 mb-1 pointer-events-none rounded-md",
                          isChecked && "border-[#7379E6] bg-[#7379E6] text-white"
                        )}
                        aria-hidden="true"
                      />
                      <span className="text-[10px]">{status}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Production Inputs */}
            <div>
              <span className="text-[10px] font-black text-[#5B60C4] uppercase tracking-wider block mb-1.5">
                生产产量
              </span>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-1.5 clay-tray rounded-2xl px-2.5 py-1">
                  <span className="text-[10px] text-[#5B60C4] font-black">批</span>
                  <Select 
                    value={item.batches.toString()} 
                    onValueChange={(v) => updatePerson(id, { batches: parseInt(v, 10) })}
                  >
                    <SelectTrigger 
                      aria-label={`${item.name}的批数`}
                      className="h-7 bg-transparent border-none text-xs font-black text-[#2D3142] px-1 focus:ring-0 shadow-none"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white shadow-xl bg-[#FAF7F2]">
                      {COUNTS.map(c => <SelectItem key={c} value={c.toString()} className="font-bold text-xs">{c} 批</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 flex items-center gap-1.5 clay-tray rounded-2xl px-2.5 py-1">
                  <span className="text-[10px] text-[#5B60C4] font-black">件</span>
                  <Select 
                    value={item.pieces.toString()} 
                    onValueChange={(v) => updatePerson(id, { pieces: parseInt(v, 10) })}
                  >
                    <SelectTrigger 
                      aria-label={`${item.name}的件数`}
                      className="h-7 bg-transparent border-none text-xs font-black text-[#2D3142] px-1 focus:ring-0 shadow-none"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white shadow-xl bg-[#FAF7F2]">
                      {COUNTS.map(c => <SelectItem key={c} value={c.toString()} className="font-bold text-xs">{c} 件</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Time Selectors */}
            <div>
              <span className="text-[10px] font-black text-[#5B60C4] uppercase tracking-wider block mb-1.5">
                工时记录
              </span>
              <div className="grid grid-cols-2 gap-2">
                <TimePicker 
                  value={item.startTime} 
                  onChange={(v) => updatePerson(id, { startTime: v })} 
                  label="上班"
                />
                <TimePicker 
                  value={item.endTime} 
                  onChange={(v) => updatePerson(id, { endTime: v })} 
                  label="下班"
                />
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="py-4 flex flex-col items-center justify-center bg-[#FAF6EE] rounded-2xl border border-white shadow-xs"
            aria-live="polite"
          >
            {renderResultIcon(item.attendance) && (
              <img 
                src={renderResultIcon(item.attendance) || ""} 
                className="w-10 h-10 mb-1.5 opacity-80 transition-transform duration-300 hover:scale-105" 
                alt={`${item.attendance}图标`} 
              />
            )}
            <p className="text-xs text-[#65617D] font-bold">
              当前状态：<span className="font-black text-[#2D3142]">{item.attendance}</span>
            </p>
          </div>
        )}
      </div>
    </article>
  );
});

PersonItem.displayName = "PersonItem";

export default PersonItem;
