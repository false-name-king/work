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
  updatePerson: (id: number, updates: Partial<Person>) => void;
  addPerson: (name: string) => void;
  removePerson: (id: number) => void;
  setToday: (today: string) => void;
  setMemo: (memo: string) => void;
}

const initialPeople: Person[] = [
  { id: 1, name: '郭书楠', machine: null, role: '机长', attendance: '出勤', workStatus: [], batches: 20, pieces: 20, startTime: '19:00', endTime: '20:30' },
  { id: 2, name: '严文雅', machine: null, role: '组员', attendance: '出勤', workStatus: [], batches: 20, pieces: 20, startTime: '19:00', endTime: '20:30' },
  { id: 3, name: '卢从庆', machine: null, role: '组员', attendance: '出勤', workStatus: [], batches: 20, pieces: 20, startTime: '19:00', endTime: '20:30' },
  { id: 4, name: '杜瑶瑶', machine: null, role: '组员', attendance: '出勤', workStatus: [], batches: 20, pieces: 20, startTime: '19:00', endTime: '20:30' },
  { id: 5, name: '章　屹', machine: null, role: '组员', attendance: '出勤', workStatus: [], batches: 20, pieces: 20, startTime: '19:00', endTime: '20:30' },
];

export const useStore = create<PeopleStore>((set) => ({
  people: initialPeople,
  today: `${new Date().getMonth() + 1} 月 ${new Date().getDate()} 日`,
  memo: "无",
  updatePerson: (id, updates) => set((state) => ({
    people: state.people.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  addPerson: (name) => set((state) => {
    const lastPerson = state.people[state.people.length - 1];
    const newPerson: Person = {
      id: Math.max(0, ...state.people.map(p => p.id)) + 1,
      name,
      role: '组员',
      machine: null,
      attendance: '出勤',
      workStatus: [],
      batches: lastPerson?.batches ?? 20,
      pieces: lastPerson?.pieces ?? 20,
      startTime: lastPerson?.startTime ?? '19:00',
      endTime: lastPerson?.endTime ?? '20:30',
    };
    return { people: [...state.people, newPerson] };
  }),
  removePerson: (id) => set((state) => ({
    people: state.people.filter(p => p.id !== id)
  })),
  setToday: (today) => set({ today }),
  setMemo: (memo) => set({ memo }),
}));

export const ROLES = ['机长', '组员'];
export const MACHINES = Array.from({ length: 100 }, (_, i) => i);
export const COUNTS = Array.from({ length: 200 }, (_, i) => i);
export const ATTENDANCE_TYPES: AttendanceStatus[] = ["出勤", "请假", "公休", "产假"];
export const WORK_STATUSES = ["人工", "引导", "闸机", "货检", "商务", "未进岗"];