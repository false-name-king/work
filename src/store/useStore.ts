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

interface BasePerson {
  id: number;
  name: string;
  role: string;
  machine: number | null;
}

interface DailyRecord {
  attendance?: AttendanceStatus;
  workStatus?: string[];
  batches?: number;
  pieces?: number;
  startTime?: string;
  endTime?: string;
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
  resetAllData: () => Promise<void>;
}

export const getTodayDefaultDate = (): string => {
  const now = new Date();
  return `${now.getMonth() + 1} 月 ${now.getDate()} 日`;
};

const STORAGE_KEY_PEOPLE = 'attendance_people_v1';
const STORAGE_KEY_DAILY_RECORDS = 'attendance_daily_records_v1';
const STORAGE_KEY_MEMOS = 'attendance_memos_v1';

const DEFAULT_BASE_PEOPLE: BasePerson[] = [
  { id: 1, name: '郭书楠', role: '机长', machine: null },
  { id: 2, name: '严文雅', role: '组员', machine: null },
  { id: 3, name: '卢从庆', role: '组员', machine: null },
  { id: 4, name: '杜瑶瑶', role: '组员', machine: null },
  { id: 5, name: '章屹', role: '组员', machine: null },
];

function getStoredBasePeople(): BasePerson[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PEOPLE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("读取本地组员名单失败", e);
  }
  return DEFAULT_BASE_PEOPLE;
}

function saveStoredBasePeople(people: BasePerson[]) {
  try {
    localStorage.setItem(STORAGE_KEY_PEOPLE, JSON.stringify(people));
  } catch (e) {
    console.error("保存本地组员名单失败", e);
  }
}

function getStoredDailyRecords(): Record<string, Record<string, DailyRecord>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY_RECORDS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("读取本地每日记录失败", e);
  }
  return {};
}

function saveStoredDailyRecords(records: Record<string, Record<string, DailyRecord>>) {
  try {
    localStorage.setItem(STORAGE_KEY_DAILY_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error("保存本地每日记录失败", e);
  }
}

function getStoredMemos(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MEMOS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("读取本地备注失败", e);
  }
  return {};
}

function saveStoredMemos(memos: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY_MEMOS, JSON.stringify(memos));
  } catch (e) {
    console.error("保存本地备注失败", e);
  }
}

function assemblePeopleForDate(
  dateStr: string,
  basePeople: BasePerson[],
  dailyRecords: Record<string, Record<string, DailyRecord>>
): Person[] {
  const dateMap = dailyRecords[dateStr] || {};
  return basePeople.map((bp) => {
    const rec = dateMap[String(bp.id)];
    return {
      id: bp.id,
      name: bp.name,
      role: bp.role,
      machine: bp.machine,
      attendance: rec?.attendance ?? "出勤",
      workStatus: rec?.workStatus ?? [],
      batches: rec?.batches ?? 20,
      pieces: rec?.pieces ?? 20,
      startTime: rec?.startTime ?? "19:00",
      endTime: rec?.endTime ?? "20:30",
    };
  });
}

const initialDate = getTodayDefaultDate();
const initialBasePeople = getStoredBasePeople();
const initialDailyRecords = getStoredDailyRecords();
const initialMemos = getStoredMemos();

export const useStore = create<PeopleStore>((set, get) => {
  return {
    people: assemblePeopleForDate(initialDate, initialBasePeople, initialDailyRecords),
    today: initialDate,
    memo: initialMemos[initialDate] || "无",
    isLoading: false,
    error: null,

    fetchData: async (dateStr) => {
      set({ isLoading: true, error: null });
      try {
        const basePeople = getStoredBasePeople();
        const dailyRecords = getStoredDailyRecords();
        const memos = getStoredMemos();

        const people = assemblePeopleForDate(dateStr, basePeople, dailyRecords);
        const memo = memos[dateStr] || "无";

        set({
          people,
          memo,
          today: dateStr,
          isLoading: false,
        });
      } catch (e) {
        console.error("加载本地数据失败", e);
        set({ isLoading: false, error: "加载本地数据失败" });
      }
    },

    updatePerson: async (id, updates) => {
      const { today, people } = get();

      // 1. 同步更新状态树
      const updatedPeople = people.map(p => p.id === id ? { ...p, ...updates } : p);
      set({ people: updatedPeople });

      // 2. 如果包含基础信息修改 (角色、机号)，持久化至 basePeople
      if (updates.role !== undefined || updates.machine !== undefined) {
        const basePeople = getStoredBasePeople();
        const updatedBasePeople = basePeople.map(p => {
          if (p.id === id) {
            return {
              ...p,
              ...(updates.role !== undefined ? { role: updates.role } : {}),
              ...(updates.machine !== undefined ? { machine: updates.machine } : {}),
            };
          }
          return p;
        });
        saveStoredBasePeople(updatedBasePeople);
      }

      // 3. 如果包含日期动态属性修改，持久化至 dailyRecords
      const hasDailyChanges = 
        updates.attendance !== undefined ||
        updates.workStatus !== undefined ||
        updates.batches !== undefined ||
        updates.pieces !== undefined ||
        updates.startTime !== undefined ||
        updates.endTime !== undefined;

      if (hasDailyChanges) {
        const dailyRecords = getStoredDailyRecords();
        if (!dailyRecords[today]) {
          dailyRecords[today] = {};
        }
        const existing = dailyRecords[today][String(id)] || {};
        dailyRecords[today][String(id)] = {
          ...existing,
          ...(updates.attendance !== undefined ? { attendance: updates.attendance } : {}),
          ...(updates.workStatus !== undefined ? { workStatus: updates.workStatus } : {}),
          ...(updates.batches !== undefined ? { batches: updates.batches } : {}),
          ...(updates.pieces !== undefined ? { pieces: updates.pieces } : {}),
          ...(updates.startTime !== undefined ? { startTime: updates.startTime } : {}),
          ...(updates.endTime !== undefined ? { endTime: updates.endTime } : {}),
        };
        saveStoredDailyRecords(dailyRecords);
      }
    },

    addPerson: async (name) => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      try {
        const basePeople = getStoredBasePeople();
        const maxId = basePeople.reduce((max, p) => Math.max(max, p.id), 0);
        const newPerson: BasePerson = {
          id: maxId + 1,
          name: trimmed,
          role: "组员",
          machine: null,
        };
        const updatedBasePeople = [...basePeople, newPerson];
        saveStoredBasePeople(updatedBasePeople);

        await get().fetchData(get().today);
        return true;
      } catch (e) {
        console.error("添加人员失败", e);
        toast.error("添加人员失败");
        return false;
      }
    },

    removePerson: async (id) => {
      try {
        const basePeople = getStoredBasePeople();
        const updatedBasePeople = basePeople.filter(p => p.id !== id);
        saveStoredBasePeople(updatedBasePeople);

        // 清理 dailyRecords 中该人员的数据
        const dailyRecords = getStoredDailyRecords();
        Object.keys(dailyRecords).forEach(d => {
          if (dailyRecords[d]) {
            delete dailyRecords[d][String(id)];
          }
        });
        saveStoredDailyRecords(dailyRecords);

        set((state) => ({
          people: state.people.filter(p => p.id !== id)
        }));
        return true;
      } catch (e) {
        console.error("删除人员失败", e);
        toast.error("删除人员失败");
        return false;
      }
    },

    setToday: (today) => {
      set({ today });
      get().fetchData(today);
    },

    setMemo: async (memo) => {
      const { today } = get();
      set({ memo });
      const memos = getStoredMemos();
      memos[today] = memo;
      saveStoredMemos(memos);
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
      await Promise.all(updates);
      toast.success(`已全员设置为【${status}】`);
    },

    setAllTimes: async (startTime: string, endTime: string) => {
      const { people, updatePerson } = get();
      const updates = people
        .filter(p => p.attendance === '出勤')
        .map(p => updatePerson(p.id, { startTime, endTime }));
      await Promise.all(updates);
      toast.success(`已批量设置出勤工时：${startTime} - ${endTime}`);
    },

    resetAllData: async () => {
      try {
        localStorage.removeItem(STORAGE_KEY_PEOPLE);
        localStorage.removeItem(STORAGE_KEY_DAILY_RECORDS);
        localStorage.removeItem(STORAGE_KEY_MEMOS);

        const defaultPeople = DEFAULT_BASE_PEOPLE;
        const currentDate = get().today;
        const people = assemblePeopleForDate(currentDate, defaultPeople, {});

        set({
          people,
          memo: "无",
          isLoading: false,
          error: null,
        });
        toast.success("已恢复为初始数据");
      } catch (e) {
        console.error("重置数据失败", e);
        toast.error("重置数据失败");
      }
    }
  };
});

export const ROLES = ['机长', '组员'] as const;
export const MACHINES = Array.from({ length: 100 }, (_, i) => i);
export const COUNTS = Array.from({ length: 200 }, (_, i) => i);
export const ATTENDANCE_TYPES: AttendanceStatus[] = ["出勤", "请假", "公休", "产假"];
export const WORK_STATUSES = ["人工", "引导", "闸机", "货检", "商务", "未进岗"] as const;
