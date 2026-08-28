import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@/store/useStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Clock, Share, UserPlus, Trash2 } from "lucide-react";
import PersonItem from "./PersonItem";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const Data = () => {
  const peopleIds = useStore(useShallow((state) => state.people.map(p => p.id)));
  const today = useStore((state) => state.today);
  const memo = useStore((state) => state.memo);
  const setToday = useStore((state) => state.setToday);
  const setMemo = useStore((state) => state.setMemo);
  const addPerson = useStore((state) => state.addPerson);
  const removePerson = useStore((state) => state.removePerson);
  
  const { batchesNum, piecesNum, people } = useStore(useShallow((state) => ({
    batchesNum: state.people.reduce((sum, i) => sum + (i.batches || 0), 0),
    piecesNum: state.people.reduce((sum, i) => sum + (i.pieces || 0), 0),
    people: state.people
  })));

  const [newName, setNewName] = useState("");
  const [isManageOpen, setIsManageOpen] = useState(false);

  const handleAddPerson = () => {
    if (!newName.trim()) {
      toast.error("请输入姓名");
      return;
    }
    addPerson(newName.trim());
    setNewName("");
    toast.success(`已添加 ${newName}`);
  };

  const buildCopyText = () => {
    const lines = [today];
    people.forEach((i) => {
      lines.push(
        `${i.machine || ''} ${i.role}：${i.name}${i.attendance === '出勤' ? i.batches + '批' + i.pieces + '件' : '（ ' + i.attendance + ' ）'}${i.workStatus.length ? '( ' + i.workStatus.join('，') + ' )' : ''}`
      );
    });
    lines.push(`合计：${batchesNum} 批 ${piecesNum} 件`);
    lines.push(`大批量/奖金情况：${memo}`);
    return lines.join("\n");
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText());
      toast.success("报表已复制");
    } catch (error) {
      toast.error("复制失败");
    }
  };

  const handleCopyTime = async () => {
    const lines = [today];
    people.forEach((i) => {
      lines.push(`${i.name}：${i.startTime} - ${i.endTime}`);
    });
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success("工时表已复制");
    } catch (error) {
      toast.error("复制失败");
    }
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Global Config */}
      <div className="ios-card p-3 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-black/40 font-bold uppercase w-12 text-center">日期</span>
          <Input 
            value={today} 
            onChange={(e) => setToday(e.target.value)}
            className="h-8 text-xs flex-1 bg-black/[0.03]"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-black/40 font-bold uppercase w-12 text-center">备注</span>
          <Input 
            value={memo} 
            onChange={(e) => setMemo(e.target.value)}
            className="h-8 text-xs flex-1 bg-black/[0.03]"
          />
        </div>
      </div>

      {/* List Header */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-bold text-black/90">组员数据</h2>
        <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-[#007AFF] font-bold">管理</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none ios-glass p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">人员管理</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-6">
              {/* Add Section */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-black/40 uppercase tracking-wider ml-1">新增人员</h3>
                <div className="flex gap-2">
                  <Input 
                    placeholder="输入姓名" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-10 text-sm bg-black/[0.03] border-none rounded-2xl"
                  />
                  <Button onClick={handleAddPerson} className="h-10 px-4 rounded-2xl bg-[#007AFF] text-white">
                    <UserPlus className="w-4 h-4 mr-2" />
                    添加
                  </Button>
                </div>
              </div>

              {/* List Section */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-black/40 uppercase tracking-wider ml-1">现有人员 ({people.length})</h3>
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                  {people.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-black/[0.03] rounded-2xl group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-black/60 shadow-sm">
                          {p.name.slice(0, 1)}
                        </div>
                        <span className="text-sm font-bold text-black/80">{p.name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          removePerson(p.id);
                          toast.success(`已删除 ${p.name}`);
                        }}
                        className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsManageOpen(false)} className="w-full h-11 rounded-2xl bg-black text-white font-bold">完成</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* People List */}
      <div className="space-y-3">
        {peopleIds.map((id) => (
          <PersonItem key={id} id={id} />
        ))}
      </div>

      {/* Summary Section */}
      <div className="ios-card overflow-hidden">
        <div className="p-2.5 bg-black/[0.02] border-b border-black/[0.05]">
          <h3 className="text-[10px] font-bold text-black/60 uppercase tracking-wider">预览与操作</h3>
        </div>
        <div className="p-3 space-y-4">
          {/* Data Summary */}
          <div className="bg-black/[0.03] p-3 rounded-xl space-y-1.5 text-[11px] text-black/70 font-medium leading-relaxed">
            <p className="font-bold text-black text-xs mb-2 border-b border-black/5 pb-1 uppercase tracking-tighter">生产数据预览</p>
            {people.map((p) => (
              <div key={p.id} className="flex flex-col border-b border-black/[0.02] pb-1.5 mb-1.5 last:border-0 last:pb-0 last:mb-0">
                <div className="flex justify-between items-center">
                  <span className="text-black font-bold">{p.machine || '-'}{p.role} {p.name}</span>
                  <span className={cn("italic", p.attendance === '出勤' ? "text-black/40" : "text-red-500 font-bold")}>
                    {p.attendance === '出勤' ? `${p.batches}批${p.pieces}件` : p.attendance}
                  </span>
                </div>
                {p.attendance === '出勤' && p.workStatus.length > 0 && (
                  <p className="text-[9px] text-[#007AFF]/60 font-bold">
                    [ {p.workStatus.join(' · ')} ]
                  </p>
                )}
              </div>
            ))}
            <div className="pt-2 mt-1 border-t border-black/5 flex justify-between font-bold text-black text-xs">
              <span>合计总产出</span>
              <span className="text-[#007AFF]">{batchesNum} 批 / {piecesNum} 件</span>
            </div>
          </div>

          {/* Time Summary */}
          <div className="bg-black/[0.03] p-3 rounded-xl space-y-1.5 text-[11px] text-black/70 font-medium leading-relaxed">
            <p className="font-bold text-black text-xs mb-2 border-b border-black/5 pb-1 uppercase tracking-tighter">加班时间预览</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {people.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-[10px]">
                  <span className="text-black/40">{p.name}</span>
                  <span className="font-mono text-black/80">{p.startTime}-{p.endTime}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button className="h-10 w-full gap-2 text-white text-xs" variant="ios" onClick={handleCopyText}>
              <Share className="w-3.5 h-3.5" />
              复制报表
            </Button>
            <Button className="bg-black/90 text-white h-10 w-full gap-2 rounded-full active:bg-black text-xs" onClick={handleCopyTime}>
              <Clock className="w-3.5 h-3.5" />
              复制时间
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Data;