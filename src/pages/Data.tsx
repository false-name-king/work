import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Clock, 
  Share2, 
  UserPlus, 
  Trash2, 
  Loader2, 
  Users, 
  Search, 
  CheckCircle2, 
  Settings2,
  CalendarDays,
  RotateCcw
} from "lucide-react";
import PersonItem from "./PersonItem";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const Data = () => {
  const people = useStore((state) => state.people);
  const today = useStore((state) => state.today);
  const memo = useStore((state) => state.memo);
  const isLoading = useStore((state) => state.isLoading);
  const setToday = useStore((state) => state.setToday);
  const setMemo = useStore((state) => state.setMemo);
  const addPerson = useStore((state) => state.addPerson);
  const removePerson = useStore((state) => state.removePerson);
  const fetchData = useStore((state) => state.fetchData);
  const setAllAttendance = useStore((state) => state.setAllAttendance);
  const setAllTimes = useStore((state) => state.setAllTimes);
  const resetAllData = useStore((state) => state.resetAllData);

  useEffect(() => {
    fetchData(today);
  }, [fetchData, today]);

  // Form states with direct local syncing
  const [localToday, setLocalToday] = useState(today);
  const [localMemo, setLocalMemo] = useState(memo);
  const [searchQuery, setSearchQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);

  const handleResetData = async () => {
    if (window.confirm("确定要恢复到最初数据值吗？所有人员名单、生产数据及备注将被重置为初始状态。")) {
      await resetAllData();
      setLocalMemo("无");
      setIsBatchOpen(false);
    }
  };

  // Sync when store values change from external source (e.g., initial fetch)
  const handleTodayBlur = () => {
    if (localToday.trim() && localToday !== today) {
      setToday(localToday.trim());
    }
  };

  const handleMemoBlur = () => {
    if (localMemo !== memo) {
      setMemo(localMemo.trim() || "无");
    }
  };

  // Memoized stats
  const { batchesNum, piecesNum, attendedCount, workStatusCounts } = useMemo(() => {
    const statusMap: Record<string, number> = {};
    let bNum = 0;
    let pNum = 0;
    let aCount = 0;

    people.forEach((p) => {
      if (p.attendance === '出勤') {
        aCount += 1;
        bNum += p.batches || 0;
        pNum += p.pieces || 0;
        if (p.workStatus && p.workStatus.length > 0) {
          p.workStatus.forEach((s) => {
            statusMap[s] = (statusMap[s] || 0) + 1;
          });
        }
      }
    });

    return {
      batchesNum: bNum,
      piecesNum: pNum,
      attendedCount: aCount,
      workStatusCounts: statusMap,
    };
  }, [people]);

  // Filtered people
  const filteredPeople = useMemo(() => {
    if (!searchQuery.trim()) return people;
    const query = searchQuery.trim().toLowerCase();
    return people.filter(p => 
      p.name.toLowerCase().includes(query) ||
      (p.machine !== null && p.machine.toString().includes(query)) ||
      p.role.includes(query)
    );
  }, [people, searchQuery]);

  const handleAddPerson = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("请输入人员姓名");
      return;
    }
    const success = await addPerson(trimmed);
    if (success) {
      setNewName("");
      toast.success(`已添加成员【${trimmed}】`);
    }
  };

  const buildCopyText = () => {
    const lines = [today];
    people.forEach((i) => {
      lines.push(
        `${i.machine !== null ? i.machine : ''} ${i.role}：${i.name}${i.attendance === '出勤' ? (i.batches || 0) + '批' + (i.pieces || 0) + '件' : '（ ' + i.attendance + ' ）'}${i.workStatus && i.workStatus.length ? '( ' + i.workStatus.join('，') + ' )' : ''}`
      );
    });
    lines.push(`合计：${batchesNum} 批 ${piecesNum} 件`);
    lines.push(`大批量/奖金情况：${memo}`);
    return lines.join("\n");
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText());
      toast.success("生产日报表已复制到剪贴板");
    } catch {
      toast.error("复制失败，请手动长按复制");
    }
  };

  const handleCopyTime = async () => {
    const lines = [today];
    const attendedPeople = people.filter((i) => i.attendance === '出勤');

    if (attendedPeople.length === 0) {
      toast.info("今日暂无出勤人员工时数据");
      return;
    }

    attendedPeople.forEach((i) => {
      lines.push(`${i.name}：${i.startTime || '19:00'} - ${i.endTime || '20:30'}`);
    });

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success(`工时表已复制（共 ${attendedPeople.length} 人）`);
    } catch {
      toast.error("复制失败，请手动长按复制");
    }
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Global Config Card */}
      <section 
        aria-label="全局配置"
        className="clay-card p-3 space-y-2"
      >
        <div className="flex items-center gap-2">
          <span 
            className="text-[11px] font-black text-[#5B60C4] bg-[#EEF0FD] px-2.5 py-1 rounded-xl shrink-0 flex items-center gap-1.5 clay-badge"
          >
            <CalendarDays className="w-3.5 h-3.5 text-[#7379E6]" />
            日期
          </span>
          <div className="clay-tray rounded-xl flex-1 flex items-center px-2 py-0.5">
            <Input 
              id="config-date"
              type="text"
              value={localToday} 
              onChange={(e) => setLocalToday(e.target.value)}
              onBlur={handleTodayBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleTodayBlur()}
              placeholder="例如：8 月 31 日"
              aria-label="记录日期"
              className="h-7 text-xs font-bold border-none bg-transparent shadow-none px-1 text-[#2D3142] focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span 
            className="text-[11px] font-black text-[#C46835] bg-[#FFF2EB] px-2.5 py-1 rounded-xl shrink-0 clay-badge"
          >
            备注
          </span>
          <div className="clay-tray rounded-xl flex-1 flex items-center px-2 py-0.5">
            <Input 
              id="config-memo"
              type="text"
              value={localMemo} 
              onChange={(e) => setLocalMemo(e.target.value)}
              onBlur={handleMemoBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleMemoBlur()}
              placeholder="大批量/奖金情况（无则填无）"
              aria-label="产量备注"
              className="h-7 text-xs font-medium border-none bg-transparent shadow-none px-1 text-[#2D3142] focus-visible:ring-0"
            />
          </div>
        </div>
      </section>

      {/* List Header & Action Toolbar */}
      <div className="flex justify-between items-center px-1 pt-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-black text-[#2D3142] tracking-tight">组员数据</h2>
          <span className="text-[11px] text-[#1F6E47] font-black bg-[#E6F7EF] border border-white/80 shadow-xs px-2.5 py-0.5 rounded-full clay-badge">
            共 {people.length} 人 · 出勤 {attendedCount}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Batch Actions Dialog */}
          <Dialog open={isBatchOpen} onOpenChange={setIsBatchOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                aria-label="批量快速设置"
                className="h-7.5 text-xs text-[#524D6E] font-black px-3 bg-white/95 hover:bg-white rounded-full border border-white shadow-[0_3px_8px_rgba(50,45,75,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.9),inset_0_-1.5px_2px_rgba(0,0,0,0.06)] active:scale-95 transition-all"
              >
                <Settings2 className="w-3.5 h-3.5 mr-1 text-[#7379E6]" />
                快捷
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] rounded-3xl border-2 border-white/90 bg-[#FAF7F2] shadow-2xl p-5">
              <DialogHeader>
                <DialogTitle className="text-[#2D3142] font-black text-base">批量快捷设置</DialogTitle>
                <DialogDescription className="text-xs text-[#65617D]">一键为全部成员统一设置出勤状态或上下班工时</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <div className="text-xs font-black text-[#5B60C4]">批量出勤状态</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => { setAllAttendance("出勤"); setIsBatchOpen(false); }}
                      className="h-10 text-xs rounded-2xl bg-[#E6F7EF] text-[#1F6E47] font-black border border-white shadow-[0_3px_8px_rgba(78,186,138,0.2),inset_0_1.5px_2px_rgba(255,255,255,0.8),inset_0_-2px_3px_rgba(0,0,0,0.08)] active:scale-95 transition-all"
                    >
                      全员出勤
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setAllAttendance("公休"); setIsBatchOpen(false); }}
                      className="h-10 text-xs rounded-2xl bg-[#EEF0FD] text-[#555BD9] font-black border border-white shadow-[0_3px_8px_rgba(115,121,230,0.2),inset_0_1.5px_2px_rgba(255,255,255,0.8),inset_0_-2px_3px_rgba(0,0,0,0.08)] active:scale-95 transition-all"
                    >
                      全员公休
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-black text-[#5B60C4]">批量统一工时</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => { setAllTimes("19:00", "20:30"); setIsBatchOpen(false); }}
                      className="h-10 text-xs font-mono font-bold rounded-2xl bg-white text-[#2D3142] border border-white shadow-[0_3px_8px_rgba(50,45,75,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.9),inset_0_-1.5px_2px_rgba(0,0,0,0.06)] active:scale-95 transition-all"
                    >
                      19:00 - 20:30
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setAllTimes("08:00", "17:00"); setIsBatchOpen(false); }}
                      className="h-10 text-xs font-mono font-bold rounded-2xl bg-white text-[#2D3142] border border-white shadow-[0_3px_8px_rgba(50,45,75,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.9),inset_0_-1.5px_2px_rgba(0,0,0,0.06)] active:scale-95 transition-all"
                    >
                      08:00 - 17:00
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#E8E2D5]">
                  <div className="text-xs font-black text-[#FF6B8B]">恢复初始数据</div>
                  <button 
                    type="button"
                    onClick={handleResetData}
                    className="w-full h-10 text-xs font-black text-[#D9385C] bg-[#FFE8EE] hover:bg-[#FFD9E3] rounded-2xl border border-white shadow-[0_3px_8px_rgba(255,107,139,0.2),inset_0_1.5px_2px_rgba(255,255,255,0.8),inset_0_-2px_3px_rgba(0,0,0,0.08)] flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    一键重制数据
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Manage People Dialog */}
          <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                aria-label="管理组员人员名单"
                className="h-7.5 text-xs text-white font-black px-3.5 bg-[#7379E6] hover:bg-[#656BD9] rounded-full shadow-[0_4px_12px_rgba(115,121,230,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.5),inset_0_-2px_3px_rgba(0,0,0,0.18)] active:scale-95 transition-all"
              >
                管理名单
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-3xl border-2 border-white/90 bg-[#FAF7F2] shadow-2xl p-5">
              <DialogHeader>
                <DialogTitle className="text-[#2D3142] font-black text-base">人员管理</DialogTitle>
                <DialogDescription className="text-xs text-[#65617D]">添加或移除团队成员，人员信息将保存在本地存储中</DialogDescription>
              </DialogHeader>
              <div className="py-2 space-y-4">
                {/* Add Section */}
                <form onSubmit={handleAddPerson} className="space-y-2">
                  <label htmlFor="new-person-name" className="text-[10px] font-black text-[#5B60C4] uppercase tracking-wider block">
                    新增成员
                  </label>
                  <div className="flex gap-2">
                    <div className="clay-tray rounded-2xl flex-1 flex items-center px-3 py-1">
                      <Input 
                        id="new-person-name"
                        placeholder="输入人员姓名" 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)}
                        className="h-8 text-sm bg-transparent border-none shadow-none text-[#2D3142] focus-visible:ring-0 px-0 font-bold"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="h-10 px-4 rounded-2xl bg-[#7379E6] text-white hover:bg-[#656BD9] font-black shadow-[0_4px_12px_rgba(115,121,230,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.5),inset_0_-2px_3px_rgba(0,0,0,0.18)] active:scale-95 transition-all flex items-center justify-center text-xs"
                    >
                      <UserPlus className="w-4 h-4 mr-1.5" />
                      添加
                    </button>
                  </div>
                </form>

                {/* List Section */}
                <div className="space-y-2">
                  <div className="text-[10px] font-black text-[#5B60C4] uppercase tracking-wider flex justify-between">
                    <span>当前组员列表 ({people.length})</span>
                  </div>
                  <div 
                    role="list"
                    aria-label="组员列表"
                    className="max-h-[260px] overflow-y-auto space-y-1.5 pr-1 overscroll-contain"
                  >
                    {people.map((p) => (
                      <div 
                        key={p.id} 
                        role="listitem"
                        className="flex items-center justify-between p-2.5 bg-white rounded-2xl shadow-[0_3px_8px_rgba(50,45,75,0.05),inset_0_1.5px_2px_rgba(255,255,255,0.9)] border border-white/80"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="px-3 py-1 rounded-full bg-[#7379E6] text-white font-black text-xs shadow-[0_3px_8px_rgba(115,121,230,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.6),inset_0_-1.5px_2px_rgba(0,0,0,0.15)] tracking-wide flex items-center justify-center select-none">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-[#7379E6] font-bold">{p.role} · {p.machine !== null ? `${p.machine}号机` : '未配机'}</span>
                        </div>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          aria-label={`删除 ${p.name}`}
                          onClick={async () => {
                            const ok = await removePerson(p.id);
                            if (ok) toast.success(`已删除【${p.name}】`);
                          }}
                          className="h-7 w-7 text-red-500 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <button 
                  type="button"
                  onClick={() => setIsManageOpen(false)} 
                  className="w-full h-11 rounded-2xl bg-[#7379E6] hover:bg-[#656BD9] text-white font-black text-xs shadow-[0_4px_12px_rgba(115,121,230,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.5),inset_0_-2px_3px_rgba(0,0,0,0.18)] active:scale-95 transition-all"
                >
                  完成
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Search filter when team > 4 */}
      {people.length > 4 && (
        <div className="relative clay-tray rounded-2xl px-2.5 py-0.5 flex items-center">
          <Search className="w-3.5 h-3.5 text-[#86839C] ml-1 pointer-events-none shrink-0" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索姓名、机号或角色..."
            aria-label="搜索组员"
            className="h-7.5 text-xs bg-transparent border-none shadow-none pl-2 text-[#2D3142] placeholder:text-[#86839C] focus-visible:ring-0 font-bold"
          />
        </div>
      )}

      {/* People Cards List */}
      <section aria-label="人员数据详情" className="space-y-3 min-h-[160px]">
        {isLoading ? (
          <div 
            className="flex flex-col items-center justify-center py-12 space-y-3 bg-white rounded-3xl border border-white shadow-[0_8px_20px_rgba(50,45,75,0.05)]"
            aria-live="polite"
          >
            <Loader2 className="w-7 h-7 animate-spin text-[#7379E6]" />
            <span className="text-xs font-black tracking-wider text-[#7379E6]">加载数据中...</span>
          </div>
        ) : filteredPeople.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-white rounded-3xl border border-white shadow-[0_8px_20px_rgba(50,45,75,0.05)]">
            <Users className="w-10 h-10 text-[#7379E6]/30 mb-2" />
            <p className="text-xs font-black text-[#2D3142] mb-1">
              {searchQuery ? "未找到匹配的人员" : "暂无组员数据"}
            </p>
            <p className="text-[11px] text-[#65617D] mb-3">
              {searchQuery ? "请尝试更改搜索关键字" : "点击上方【管理名单】添加班组成员"}
            </p>
            {!searchQuery && (
              <Button 
                size="sm" 
                onClick={() => setIsManageOpen(true)}
                className="h-8.5 text-xs bg-[#7379E6] hover:bg-[#656BD9] text-white font-black rounded-full px-4 shadow-[0_4px_12px_rgba(115,121,230,0.35)]"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                立即添加成员
              </Button>
            )}
          </div>
        ) : (
          filteredPeople.map((person) => (
            <PersonItem key={person.id} id={person.id} />
          ))
        )}
      </section>

      {/* Summary & Report Copy Section */}
      <section 
        aria-label="汇总与导出"
        className="clay-card-lavender overflow-hidden p-0"
      >
        <div className="p-3 bg-white/45 border-b border-[#D8DBF7] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#7379E6]" />
            <h3 className="text-xs font-black text-[#3E4491] uppercase tracking-wider">
              预览与汇总
            </h3>
          </div>
          <span className="text-[10px] text-white bg-[#4EBA8A] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-[0_2px_6px_rgba(78,186,138,0.35),inset_0_1px_2px_rgba(255,255,255,0.4)]">
            <CheckCircle2 className="w-3 h-3 text-white" />
            实时计算
          </span>
        </div>

        <div className="p-3 space-y-2.5">
          {/* Data Summary View */}
          <div className="bg-white rounded-2xl p-3 space-y-2 shadow-[0_4px_14px_rgba(50,45,75,0.04),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_3px_rgba(0,0,0,0.02)] border border-white">
            <div className="flex justify-between items-center border-b border-[#F0EBE1] pb-1.5">
              <span className="font-black text-[#2D3142] text-xs">生产数据明细</span>
              <span className="text-[10px] text-[#7379E6] font-mono font-black bg-[#EEF0FD] px-2 py-0.5 rounded-md">{today}</span>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 overscroll-contain">
              {people.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-[11px] py-0.5 border-b border-[#F5F2EB] last:border-0 gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-[#2D3142] font-bold shrink-0">
                      {p.machine !== null ? `${p.machine}号` : ''}{p.role} {p.name}
                    </span>
                    {p.attendance === '出勤' && p.workStatus && p.workStatus.length > 0 ? (
                      <span className="inline-flex items-center text-[10px] text-[#555BD9] bg-[#EDF2FE] border border-white shadow-2xs px-1.5 py-0.2 rounded-md font-bold truncate max-w-[130px]">
                        {p.workStatus.join(' · ')}
                      </span>
                    ) : p.attendance === '出勤' ? (
                      <span className="text-[10px] text-[#86839C] font-normal">
                        未设岗
                      </span>
                    ) : null}
                  </div>
                  <span className={cn(
                    "font-bold shrink-0 text-xs", 
                    p.attendance === '出勤' ? "text-[#38A169] font-mono font-black" : "text-[#FF6B8B] font-bold"
                  )}>
                    {p.attendance === '出勤' ? `${p.batches || 0}批 · ${p.pieces || 0}件` : p.attendance}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#F0EBE1] flex justify-between items-center font-black text-[#2D3142] text-xs">
              <span>合计总产量</span>
              <span className="text-[#7379E6] text-sm font-black font-mono bg-[#EEF0FD] border border-white px-2.5 py-0.5 rounded-xl shadow-xs">
                {batchesNum} 批 / {piecesNum} 件
              </span>
            </div>

            {Object.keys(workStatusCounts).length > 0 && (
              <div className="pt-2 border-t border-[#F0EBE1] flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black text-[#5B60C4]">岗位分布：</span>
                {Object.entries(workStatusCounts).map(([status, count]) => (
                  <span 
                    key={status}
                    className="text-[10px] bg-[#EEF0FD] border border-white text-[#555BD9] px-2 py-0.5 rounded-lg font-bold shadow-2xs"
                  >
                    {status} <span className="font-black text-[#7379E6]">{count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Time Summary View */}
          <div className="bg-white rounded-2xl p-3 space-y-1.5 text-xs text-[#2D3142] shadow-[0_4px_14px_rgba(50,45,75,0.04)] border border-white">
            <div className="flex justify-between items-center border-b border-[#F0EBE1] pb-1">
              <span className="font-black text-[#2D3142] text-xs">出勤工时明细</span>
              <span className="text-[10px] text-[#227C53] font-black bg-[#E6F7EF] px-2 py-0.5 rounded-full">已出勤 {attendedCount} 人</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 max-h-36 overflow-y-auto pr-1">
              {people.filter(p => p.attendance === '出勤').length === 0 ? (
                <div className="col-span-2 text-center py-2 text-[10px] text-[#86839C] font-medium">
                  今日暂无出勤人员
                </div>
              ) : (
                people
                  .filter((p) => p.attendance === '出勤')
                  .map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-[10px] py-0.5">
                      <span className="text-[#555BD9] font-bold truncate max-w-[60px]">{p.name}</span>
                      <span className="font-mono font-black text-[#2D3142]">
                        {p.startTime || '19:00'}-{p.endTime || '20:30'}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
          
          {/* Action Buttons - Puffy 3D Clay Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button 
              type="button"
              className="h-11 w-full gap-1.5 text-white text-xs font-black rounded-2xl flex items-center justify-center clay-btn clay-btn-lavender cursor-pointer" 
              onClick={handleCopyText}
              aria-label="复制生产日报文本"
            >
              <Share2 className="w-4 h-4 stroke-[2.5]" />
              复制日报
            </button>
            <button 
              type="button"
              className="h-11 w-full gap-1.5 text-white text-xs font-black rounded-2xl flex items-center justify-center clay-btn clay-btn-coral cursor-pointer" 
              onClick={handleCopyTime}
              aria-label="复制工时表格文本"
            >
              <Clock className="w-4 h-4 stroke-[2.5]" />
              复制工时
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Data;
