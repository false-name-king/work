import { useShallow } from 'zustand/react/shallow';
import { useStore, ROLES, MACHINES, COUNTS, ATTENDANCE_TYPES, WORK_STATUSES, type Person } from '@/store/useStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { memo } from 'react';

import xiuxi from '@/assets/休息.svg'
import dujia from '@/assets/度假.svg'
import chanjia from '@/assets/产假.svg'

interface PersonItemProps {
  id: number;
}

const PersonItem = memo(({ id }: PersonItemProps) => {
  const item = useStore(useShallow((state) => state.people.find(p => p.id === id))) as Person;
  const updatePerson = useStore((state) => state.updatePerson);

  if (!item) return null;

  const renderResultIcon = (v: string) => {
    if (v === '请假') return xiuxi;
    if (v === '公休') return dujia;
    if (v === '产假') return chanjia;
    return null;
  };

  return (
    <div className="ios-card overflow-hidden">
      {/* Header Info */}
      <div className="bg-black/[0.02] p-2.5 flex flex-wrap items-center gap-2 border-b border-black/[0.05]">
        <span className="text-sm font-semibold text-black/90 min-w-[50px]">{item.name}</span>
        <div className="flex gap-1.5 items-center flex-1">
          <Select 
            value={item.role} 
            onValueChange={(v) => updatePerson(id, { role: v })}
          >
            <SelectTrigger className="h-7 w-20 bg-white/80 text-[11px] px-2 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select 
            value={item.machine?.toString() || ""} 
            onValueChange={(v) => updatePerson(id, { machine: v ? parseInt(v) : null })}
          >
            <SelectTrigger className="h-7 w-24 bg-white/80 text-[11px] px-2 rounded-lg">
              <SelectValue placeholder="选择机器号" />
            </SelectTrigger>
            <SelectContent>
              {MACHINES.map(m => <SelectItem key={m} value={m.toString()}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-[9px] text-black/40 font-bold uppercase">号机</span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Attendance Toggle */}
        <div className="flex bg-black/[0.05] p-0.5 rounded-lg">
          {ATTENDANCE_TYPES.map((type) => {
            const active = item.attendance === type;
            const activeColor = type === '请假' ? 'text-red-500' : type === '公休' ? 'text-teal-500' : type === '产假' ? 'text-green-500' : 'text-[#007AFF]';
            return (
              <button
                key={type}
                onClick={() => updatePerson(id, { attendance: type, workStatus: [], batches: 0, pieces: 0 })}
                className={cn(
                  "flex-1 py-1 text-[10px] font-semibold rounded-md",
                  active ? "bg-white shadow-sm " + activeColor : "text-black/40"
                )}
              >
                {type}
              </button>
            )
          })}
        </div>

        {item.attendance === '出勤' ? (
          <div className="space-y-3">
            {/* Work Status Grid */}
            <div className="grid grid-cols-3 gap-2">
              {WORK_STATUSES.map(status => (
                <div 
                  key={status} 
                  className={cn(
                    "flex flex-col items-center justify-center p-1.5 rounded-lg border active:scale-95",
                    item.workStatus.includes(status) 
                      ? "bg-[#007AFF]/5 border-[#007AFF]/20 text-[#007AFF]" 
                      : "bg-black/[0.02] border-transparent text-black/40"
                  )}
                  onClick={() => {
                    const next = item.workStatus.includes(status)
                      ? item.workStatus.filter(s => s !== status)
                      : [...item.workStatus, status];
                    updatePerson(id, { workStatus: next });
                  }}
                >
                  <Checkbox 
                    checked={item.workStatus.includes(status)}
                    className="h-3.5 w-3.5 mb-1 pointer-events-none"
                  />
                  <span className="text-[9px] font-bold">{status}</span>
                </div>
              ))}
            </div>

            {/* Production Inputs */}
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-1.5 bg-black/[0.02] p-1 rounded-lg">
                <span className="text-[9px] text-black/30 font-bold uppercase ml-1">批</span>
                <Select 
                  value={item.batches.toString()} 
                  onValueChange={(v) => updatePerson(id, { batches: parseInt(v) })}
                >
                  <SelectTrigger className="h-7 bg-transparent border-none text-[11px] px-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTS.map(c => <SelectItem key={c} value={c.toString()}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 flex items-center gap-1.5 bg-black/[0.02] p-1 rounded-lg">
                <span className="text-[9px] text-black/30 font-bold uppercase ml-1">件</span>
                <Select 
                  value={item.pieces.toString()} 
                  onValueChange={(v) => updatePerson(id, { pieces: parseInt(v) })}
                >
                  <SelectTrigger className="h-7 bg-transparent border-none text-[11px] px-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTS.map(c => <SelectItem key={c} value={c.toString()}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Time Selectors */}
            <div className="grid grid-cols-2 gap-3">
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
        ) : (
          <div className="py-4 flex flex-col items-center justify-center bg-black/[0.02] rounded-xl border border-dashed border-black/[0.05]">
            <img src={renderResultIcon(item.attendance) || ""} className="w-10 h-10 mb-2 opacity-50" alt="" />
            <p className="text-[10px] text-black/30 font-bold uppercase">{item.attendance}中</p>
          </div>
        )}
      </div>
    </div>
  );
});

PersonItem.displayName = "PersonItem";

export default PersonItem;