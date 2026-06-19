import { create } from "zustand";

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

interface ExpenseStore {
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  removeExpense: (id: string) => void;
  updateExpense: (id: string, data: Partial<Expense>) => void;
}

export const useExpenseStore = create<ExpenseStore>((set) => ({
  expenses: [],
  setExpenses: (expenses) => set({ expenses }),
  addExpense: (expense) =>
    set((state) => ({ expenses: [expense, ...state.expenses] })),
  removeExpense: (id) =>
    set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) })),
  updateExpense: (id, data) =>
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...data } : e)),
    })),
}));

export const CATEGORIES = [
  "餐饮",
  "交通",
  "购物",
  "住房",
  "娱乐",
  "医疗",
  "教育",
  "通讯",
  "日用",
  "其他",
] as const;