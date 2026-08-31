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
  CalendarDays
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
  const { batchesNum, piecesNum, attendedCount } = useMemo(() => {
    return people.reduce(
      (acc, p) => {
        if (p.attendance === '出勤') {
          acc.attendedCount += 1;
          acc.batchesNum += p.batches || 0;
          acc.piecesNum += p.pieces || 0;
        }
        return acc;
      },
      { batchesNum: 0, piecesNum: 0, attendedCount: 0 }
    );
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
    people.forEach((i) => {
      lines.push(`${i.name}：${i.startTime || '19:00'} - ${i.endTime || '20:30'}`);
    });
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success("工时表已复制到剪贴板");
    } catch {
      toast.error("复制失败，请手动长按复制");
    }
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Global Config Card */}
      <section 
        aria-label="全局配置"
        className="ios-card p-3 space-y-2.5 border border-black/[0.04]"
      >
        <div className="flex items-center gap-2.5">
          <label 
            htmlFor="config-date"
            className="text-[11px] text-black/50 font-bold uppercase w-12 text-center shrink-0 flex items-center justify-center gap-1"
          >
            <CalendarDays className="w-3 h-3 text-[#007AFF]" />
            日期
          </label>
          <Input 
            id="config-date"
            type="text"
            value={localToday} 
            onChange={(e) => setLocalToday(e.target.value)}
            onBlur={handleTodayBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleTodayBlur()}
            placeholder="例如：8 月 31 日"
            aria-label="记录日期"
            className="h-8 text-xs font-semibold flex-1 bg-black/[0.03] rounded-xl px-2.5"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <label 
            htmlFor="config-memo"
            className="text-[11px] text-black/50 font-bold uppercase w-12 text-center shrink-0"
          >
            备注
          </label>
          <Input 
            id="config-memo"
            type="text"
            value={localMemo} 
            onChange={(e) => setLocalMemo(e.target.value)}
            onBlur={handleMemoBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleMemoBlur()}
            placeholder="大批量/奖金情况（无则填无）"
            aria-label="产量备注"
            className="h-8 text-xs flex-1 bg-black/[0.03] rounded-xl px-2.5"
          />
        </div>
      </section>

      {/* List Header & Action Toolbar */}
      <div className="flex justify-between items-center px-1 pt-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-black/90">组员数据</h2>
          <span className="text-[11px] text-black/40 font-semibold bg-black/[0.04] px-2 py-0.5 rounded-full">
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
                className="h-7 text-xs text-black/60 font-semibold px-2 hover:bg-black/[0.05] rounded-lg"
              >
                <Settings2 className="w-3.5 h-3.5 mr-1" />
                快捷
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>批量快捷设置</DialogTitle>
                <DialogDescription>一键为全部成员统一设置出勤状态或上下班工时</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-3">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-black/60">批量出勤状态</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => { setAllAttendance("出勤"); setIsBatchOpen(false); }}
                      className="h-9 text-xs rounded-xl border-black/[0.08]"
                    >
                      全员出勤
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => { setAllAttendance("公休"); setIsBatchOpen(false); }}
                      className="h-9 text-xs rounded-xl border-black/[0.08]"
                    >
                      全员公休
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-black/60">批量统一工时</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => { setAllTimes("19:00", "20:30"); setIsBatchOpen(false); }}
                      className="h-9 text-xs font-mono rounded-xl border-black/[0.08]"
                    >
                      19:00 - 20:30
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => { setAllTimes("08:00", "17:00"); setIsBatchOpen(false); }}
                      className="h-9 text-xs font-mono rounded-xl border-black/[0.08]"
                    >
                      08:00 - 17:00
                    </Button>
                  </div>
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
                className="h-7 text-xs text-[#007AFF] font-bold px-2.5 hover:bg-[#007AFF]/10 rounded-lg"
              >
                管理名单
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>人员管理</DialogTitle>
                <DialogDescription>添加或移除团队成员，人员信息将同步至云端数据库</DialogDescription>
              </DialogHeader>
              <div className="py-2 space-y-5">
                {/* Add Section */}
                <form onSubmit={handleAddPerson} className="space-y-2">
                  <label htmlFor="new-person-name" className="text-[10px] font-bold text-black/40 uppercase tracking-wider block">
                    新增成员
                  </label>
                  <div className="flex gap-2">
                    <Input 
                      id="new-person-name"
                      placeholder="输入人员姓名" 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)}
                      className="h-10 text-sm bg-black/[0.03] border border-black/[0.06] rounded-xl"
                    />
                    <Button 
                      type="submit" 
                      className="h-10 px-4 rounded-xl bg-[#007AFF] text-white hover:bg-[#0071EB]"
                    >
                      <UserPlus className="w-4 h-4 mr-1.5" />
                      添加
                    </Button>
                  </div>
                </form>

                {/* List Section */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-black/40 uppercase tracking-wider flex justify-between">
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
                        className="flex items-center justify-between p-2.5 bg-black/[0.02] hover:bg-black/[0.04] rounded-xl transition-colors border border-black/[0.02]"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-xs font-bold text-black/70">
                            {p.name.slice(0, 1)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-black/80">{p.name}</span>
                            <span className="ml-2 text-[10px] text-black/40 font-medium">{p.role} · {p.machine !== null ? `${p.machine}号机` : '未配机'}</span>
                          </div>
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
                          className="h-7 w-7 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button"
                  onClick={() => setIsManageOpen(false)} 
                  className="w-full h-10 rounded-xl bg-black text-white font-bold"
                >
                  完成
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Search filter when team > 4 */}
      {people.length > 4 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索姓名、机号或角色..."
            aria-label="搜索组员"
            className="h-8 pl-8 text-xs bg-white/80 border border-black/[0.04] rounded-xl placeholder:text-black/30"
          />
        </div>
      )}

      {/* People Cards List */}
      <section aria-label="人员数据详情" className="space-y-3 min-h-[160px]">
        {isLoading ? (
          <div 
            className="flex flex-col items-center justify-center py-12 space-y-3 bg-white/40 rounded-2xl border border-black/[0.03]"
            aria-live="polite"
          >
            <Loader2 className="w-7 h-7 animate-spin text-[#007AFF]" />
            <span className="text-xs font-bold tracking-wider text-black/40">加载数据中...</span>
          </div>
        ) : filteredPeople.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-white/60 rounded-2xl border border-dashed border-black/[0.08]">
            <Users className="w-10 h-10 text-black/20 mb-2" />
            <p className="text-xs font-bold text-black/60 mb-1">
              {searchQuery ? "未找到匹配的人员" : "暂无组员数据"}
            </p>
            <p className="text-[11px] text-black/40 mb-3">
              {searchQuery ? "请尝试更改搜索关键字" : "点击上方【管理名单】添加班组成员"}
            </p>
            {!searchQuery && (
              <Button 
                size="sm" 
                variant="ios" 
                onClick={() => setIsManageOpen(true)}
                className="h-8 text-xs"
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
        className="ios-card overflow-hidden border border-black/[0.04]"
      >
        <div className="p-2.5 bg-black/[0.02] border-b border-black/[0.05] flex items-center justify-between">
          <h3 className="text-[11px] font-bold text-black/60 uppercase tracking-wider">
            预览与汇总
          </h3>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            实时计算
          </span>
        </div>

        <div className="p-3 space-y-3">
          {/* Data Summary View */}
          <div className="bg-black/[0.02] p-3 rounded-xl space-y-1.5 text-xs text-black/70 font-medium">
            <div className="flex justify-between items-center border-b border-black/5 pb-1.5 mb-1.5">
              <span className="font-bold text-black text-xs">生产数据明细</span>
              <span className="text-[10px] text-black/40 font-mono">{today}</span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 overscroll-contain">
              {people.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-[11px] py-0.5 border-b border-black/[0.02] last:border-0">
                  <span className="text-black/80 font-medium truncate max-w-[160px]">
                    {p.machine !== null ? `${p.machine}号` : ''}{p.role} {p.name}
                  </span>
                  <span className={cn("font-medium shrink-0", p.attendance === '出勤' ? "text-black/60 font-mono" : "text-amber-600 font-bold")}>
                    {p.attendance === '出勤' ? `${p.batches || 0}批 · ${p.pieces || 0}件` : p.attendance}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 mt-1 border-t border-black/5 flex justify-between items-center font-bold text-black text-xs">
              <span>合计总产量</span>
              <span className="text-[#007AFF] text-sm font-bold font-mono">
                {batchesNum} 批 / {piecesNum} 件
              </span>
            </div>
          </div>

          {/* Time Summary View */}
          <div className="bg-black/[0.02] p-3 rounded-xl space-y-1.5 text-xs text-black/70 font-medium">
            <div className="flex justify-between items-center border-b border-black/5 pb-1 mb-1">
              <span className="font-bold text-black text-xs">出勤工时明细</span>
              <span className="text-[10px] text-black/40">已出勤 {attendedCount} 人</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 max-h-36 overflow-y-auto pr-1">
              {people.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-[10px] py-0.5">
                  <span className="text-black/50 truncate max-w-[60px]">{p.name}</span>
                  <span className={cn("font-mono font-medium", p.attendance === '出勤' ? "text-black/80" : "text-black/30")}>
                    {p.attendance === '出勤' ? `${p.startTime || '19:00'}-${p.endTime || '20:30'}` : p.attendance}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button 
              type="button"
              className="h-10 w-full gap-1.5 text-white text-xs font-bold rounded-xl shadow-sm" 
              variant="ios" 
              onClick={handleCopyText}
              aria-label="复制生产日报文本"
            >
              <Share2 className="w-3.5 h-3.5" />
              复制日报
            </Button>
            <Button 
              type="button"
              className="bg-black/85 hover:bg-black text-white h-10 w-full gap-1.5 rounded-xl text-xs font-bold shadow-sm" 
              onClick={handleCopyTime}
              aria-label="复制工时表格文本"
            >
              <Clock className="w-3.5 h-3.5" />
              复制工时
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Data;
