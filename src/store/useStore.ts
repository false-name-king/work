import { create } from 'zustand';

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
  fetchData: (dateStr: string) => Promise<void>;
  updatePerson: (id: number, updates: Partial<Person>) => Promise<void>;
  addPerson: (name: string) => Promise<void>;
  removePerson: (id: number) => Promise<void>;
  setToday: (today: string) => void;
  setMemo: (memo: string) => Promise<void>;
}

export const useStore = create<PeopleStore>((set, get) => ({
  people: [],
  today: new Date().toISOString().split('T')[0], // Use ISO format for DB consistency
  memo: "无",
  isLoading: false,

  fetchData: async (dateStr) => {
    set({ isLoading: true });
    try {
      const [peopleRes, memoRes] = await Promise.all([
        fetch(`/api/people?date=${dateStr}`),
        fetch(`/api/memo?date=${dateStr}`)
      ]);
      
      const people = await peopleRes.json();
      const { memo } = await memoRes.json();

      set({ people, memo, today: dateStr, isLoading: false });
    } catch (e) {
      console.error("加载数据失败", e);
      set({ isLoading: false });
    }
  },

  updatePerson: async (id, updates) => {
    // 乐观更新
    set((state) => ({
      people: state.people.map(p => p.id === id ? { ...p, ...updates } : p)
    }));

    // 异步同步到后端
    try {
      const { today } = get();
      await fetch(`/api/people/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, ...updates })
      });
    } catch (e) {
      console.error("同步人员数据失败", e);
    }
  },

  addPerson: async (name) => {
    try {
      await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      // 重新拉取以获取正确的数据库 ID 和数据
      await get().fetchData(get().today);
    } catch (e) {
      console.error("添加人员失败", e);
    }
  },

  removePerson: async (id) => {
    // 乐观删除
    set((state) => ({
      people: state.people.filter(p => p.id !== id)
    }));

    try {
      await fetch(`/api/people/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error("删除人员失败", e);
      // 如果失败可以考虑回滚，这里为了简单直接抛出错误日志
    }
  },

  setToday: (today) => {
    set({ today });
    // 当日期改变时，重新拉取当天的数据库数据
    get().fetchData(today);
  },

  setMemo: async (memo) => {
    set({ memo });
    try {
      const { today } = get();
      await fetch('/api/memo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, memo })
      });
    } catch (e) {
      console.error("同步备注失败", e);
    }
  },
}));

export const ROLES = ['机长', '组员'];
export const MACHINES = Array.from({ length: 100 }, (_, i) => i);
export const COUNTS = Array.from({ length: 200 }, (_, i) => i);
export const ATTENDANCE_TYPES: AttendanceStatus[] = ["出勤", "请假", "公休", "产假"];
export const WORK_STATUSES = ["人工", "引导", "闸机", "货检", "商务", "未进岗"];