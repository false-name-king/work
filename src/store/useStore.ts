import { create } from 'zustand';
import { toast } from 'sonner';

export type AttendanceStatus = "出勤" | "请假" | "公休" | "产假";

export interface Person {
  id: number;
  name: string;
  role: string;
  machine: number | null;
  attendance: AttendanceStatus;
  workStatus: string[];
  batches: number;
  pieces: number;
  startTime: string; // "19:00"
  endTime: string;   // "20:30"
}

interface PeopleStore {
  people: Person[];
  today: string;
  memo: string;
  isLoading: boolean;
  error: string | null;
  fetchData: (dateStr: string) => Promise<void>;
  updatePerson: (id: number, updates: Partial<Person>) => Promise<void>;
  addPerson: (name: string) => Promise<boolean>;
  removePerson: (id: number) => Promise<boolean>;
  setToday: (today: string) => void;
  setMemo: (memo: string) => Promise<void>;
  setAllAttendance: (status: AttendanceStatus) => Promise<void>;
  setAllTimes: (startTime: string, endTime: string) => Promise<void>;
}

export const getTodayDefaultDate = (): string => {
  const now = new Date();
  return `${now.getMonth() + 1} 月 ${now.getDate()} 日`;
};

export const useStore = create<PeopleStore>((set, get) => {
  return {
    people: [],
    today: getTodayDefaultDate(),
    memo: "无",
    isLoading: false,
    error: null,

    fetchData: async (dateStr) => {
      set({ isLoading: true, error: null });
      try {
        const [peopleRes, memoRes] = await Promise.all([
          fetch(`/api/people?date=${encodeURIComponent(dateStr)}`),
          fetch(`/api/memo?date=${encodeURIComponent(dateStr)}`)
        ]);
        
        if (!peopleRes.ok || !memoRes.ok) {
          throw new Error("服务端响应异常");
        }

        const people = (await peopleRes.json()) as Person[];
        const memoData = (await memoRes.json()) as { memo?: string };

        set({ 
          people: Array.isArray(people) ? people : [], 
          memo: memoData?.memo || "无", 
          today: dateStr, 
          isLoading: false 
        });
      } catch (e) {
        const message = (e as Error).message || "加载数据失败";
        console.error("加载数据失败", e);
        set({ isLoading: false, error: message });
        toast.error("加载数据失败，请检查网络连接");
      }
    },

    updatePerson: async (id, updates) => {
      const prevPeople = get().people;
      
      // 乐观更新
      set((state) => ({
        people: state.people.map(p => p.id === id ? { ...p, ...updates } : p)
      }));

      // 异步同步到后端
      try {
        const { today } = get();
        const res = await fetch(`/api/people/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: today, ...updates })
        });
        if (!res.ok) {
          throw new Error("同步失败");
        }
      } catch (e) {
        console.error("同步人员数据失败", e);
        // 回滚状态
        set({ people: prevPeople });
        toast.error("修改未保存，网络异常");
      }
    },

    addPerson: async (name) => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      try {
        const res = await fetch('/api/people', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed })
        });
        if (!res.ok) throw new Error("添加失败");

        await get().fetchData(get().today);
        return true;
      } catch (e) {
        console.error("添加人员失败", e);
        toast.error("添加人员失败");
        return false;
      }
    },

    removePerson: async (id) => {
      const prevPeople = get().people;
      const targetPerson = prevPeople.find(p => p.id === id);

      // 乐观删除
      set((state) => ({
        people: state.people.filter(p => p.id !== id)
      }));

      try {
        const res = await fetch(`/api/people/${id}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error("删除失败");
        return true;
      } catch (e) {
        console.error("删除人员失败", e);
        // 回滚
        set({ people: prevPeople });
        toast.error(`删除 ${targetPerson?.name || '人员'} 失败`);
        return false;
      }
    },

    setToday: (today) => {
      set({ today });
      get().fetchData(today);
    },

    setMemo: async (memo) => {
      const prevMemo = get().memo;
      set({ memo });
      try {
        const { today } = get();
        const res = await fetch('/api/memo', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: today, memo })
        });
        if (!res.ok) throw new Error("保存备注失败");
      } catch (e) {
        console.error("同步备注失败", e);
        set({ memo: prevMemo });
        toast.error("备注保存失败");
      }
    },

    setAllAttendance: async (status: AttendanceStatus) => {
      const { people, updatePerson } = get();
      const updates = people.map(p => 
        updatePerson(p.id, { 
          attendance: status, 
          workStatus: status === "出勤" ? p.workStatus : [],
          batches: status === "出勤" ? (p.batches || 20) : 0,
          pieces: status === "出勤" ? (p.pieces || 20) : 0,
        })
      );
      await Promise.allSettled(updates);
      toast.success(`已全员设置为【${status}】`);
    },

    setAllTimes: async (startTime: string, endTime: string) => {
      const { people, updatePerson } = get();
      const updates = people
        .filter(p => p.attendance === '出勤')
        .map(p => updatePerson(p.id, { startTime, endTime }));
      await Promise.allSettled(updates);
      toast.success(`已批量设置出勤工时：${startTime} - ${endTime}`);
    }
  };
});

export const ROLES = ['机长', '组员'] as const;
export const MACHINES = Array.from({ length: 100 }, (_, i) => i);
export const COUNTS = Array.from({ length: 200 }, (_, i) => i);
export const ATTENDANCE_TYPES: AttendanceStatus[] = ["出勤", "请假", "公休", "产假"];
export const WORK_STATUSES = ["人工", "引导", "闸机", "货检", "商务", "未进岗"] as const;
