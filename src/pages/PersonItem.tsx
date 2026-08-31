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
    if (!active) return "text-black/40 hover:text-black/70";
    switch (type) {
      case '请假':
        return "bg-white shadow-sm text-red-500 font-bold";
      case '公休':
        return "bg-white shadow-sm text-emerald-600 font-bold";
      case '产假':
        return "bg-white shadow-sm text-amber-600 font-bold";
      case '出勤':
      default:
        return "bg-white shadow-sm text-[#007AFF] font-bold";
    }
  };

  return (
    <article 
      aria-label={`组员卡片: ${item.name}`}
      className="ios-card overflow-hidden transition-all duration-200 border border-black/[0.04] hover:shadow-md focus-within:ring-1 focus-within:ring-[#007AFF]/30"
    >
      {/* Header Info */}
      <div className="bg-black/[0.02] p-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.05]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#007AFF]/10 text-[#007AFF] font-bold text-xs flex items-center justify-center shrink-0">
            {item.name.slice(0, 1)}
          </div>
          <span className="text-sm font-bold text-black/90 tracking-tight">{item.name}</span>
        </div>

        <div className="flex gap-1.5 items-center">
          {/* Role selector */}
          <Select 
            value={item.role} 
            onValueChange={(v) => updatePerson(id, { role: v })}
          >
            <SelectTrigger 
              aria-label={`${item.name}的角色`}
              className="h-7 w-20 bg-white/90 text-[11px] px-2 rounded-lg font-medium shadow-none border border-black/[0.05]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
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
                className="h-7 w-20 bg-white/90 text-[11px] px-2 rounded-lg font-medium shadow-none border border-black/[0.05]"
              >
                <SelectValue placeholder="机号" />
              </SelectTrigger>
              <SelectContent>
                {MACHINES.map(m => <SelectItem key={m} value={m.toString()}>{m} 号</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-[10px] text-black/40 font-bold">机</span>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Attendance Radiogroup Toggle */}
        <fieldset className="p-0 m-0 border-none">
          <legend className="sr-only">{item.name}的出勤状态</legend>
          <div 
            role="radiogroup" 
            aria-label={`${item.name}的出勤状态`}
            className="flex bg-black/[0.05] p-0.5 rounded-xl gap-0.5"
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
                    "flex-1 py-1 text-[11px] rounded-lg transition-all active:scale-95 text-center font-medium",
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
          <div className="space-y-3 pt-1">
            {/* Work Status Grid */}
            <div>
              <span className="text-[10px] text-black/40 font-bold uppercase tracking-wider block mb-1.5">
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
                        "flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer select-none transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]",
                        isChecked 
                          ? "bg-[#007AFF]/10 border-[#007AFF]/30 text-[#007AFF] shadow-sm font-bold" 
                          : "bg-black/[0.02] border-transparent text-black/50 hover:bg-black/[0.04]"
                      )}
                    >
                      <Checkbox 
                        checked={isChecked}
                        tabIndex={-1}
                        className="h-3.5 w-3.5 mb-1 pointer-events-none"
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
              <span className="text-[10px] text-black/40 font-bold uppercase tracking-wider block mb-1.5">
                生产产量
              </span>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-1.5 bg-black/[0.03] px-2 py-1 rounded-xl border border-black/[0.03]">
                  <span className="text-[10px] text-black/40 font-bold">批</span>
                  <Select 
                    value={item.batches.toString()} 
                    onValueChange={(v) => updatePerson(id, { batches: parseInt(v, 10) })}
                  >
                    <SelectTrigger 
                      aria-label={`${item.name}的批数`}
                      className="h-7 bg-transparent border-none text-xs font-semibold px-1 focus:ring-0"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTS.map(c => <SelectItem key={c} value={c.toString()}>{c} 批</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 flex items-center gap-1.5 bg-black/[0.03] px-2 py-1 rounded-xl border border-black/[0.03]">
                  <span className="text-[10px] text-black/40 font-bold">件</span>
                  <Select 
                    value={item.pieces.toString()} 
                    onValueChange={(v) => updatePerson(id, { pieces: parseInt(v, 10) })}
                  >
                    <SelectTrigger 
                      aria-label={`${item.name}的件数`}
                      className="h-7 bg-transparent border-none text-xs font-semibold px-1 focus:ring-0"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTS.map(c => <SelectItem key={c} value={c.toString()}>{c} 件</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Time Selectors */}
            <div>
              <span className="text-[10px] text-black/40 font-bold uppercase tracking-wider block mb-1.5">
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
            className="py-5 flex flex-col items-center justify-center bg-black/[0.02] rounded-xl border border-dashed border-black/[0.08]"
            aria-live="polite"
          >
            {renderResultIcon(item.attendance) && (
              <img 
                src={renderResultIcon(item.attendance) || ""} 
                className="w-10 h-10 mb-2 opacity-60 transition-transform duration-300 hover:scale-105" 
                alt={`${item.attendance}图标`} 
              />
            )}
            <p className="text-xs text-black/50 font-bold">
              当前状态：<span className="text-black/80">{item.attendance}</span>
            </p>
          </div>
        )}
      </div>
    </article>
  );
});

PersonItem.displayName = "PersonItem";

export default PersonItem;
