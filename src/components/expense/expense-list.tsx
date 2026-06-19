"use client";

import { useEffect, useState } from "react";
import { useExpenseStore } from "@/lib/expense-store";
import { format } from "date-fns";
import { Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES } from "@/lib/expense-store";

const PAGE_SIZE = 15;

export function ExpenseList() {
  const { expenses, setExpenses, removeExpense, updateExpense } =
    useExpenseStore();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    date: "",
    amount: "",
    category: "",
    note: "",
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/expenses")
      .then((res) => res.json())
      .then((data) =>
        setExpenses(
          data.map((e: { id: string; date: string; amount: number; category: string; note: string; createdAt: string; updatedAt: string }) => ({
            ...e,
            date: e.date,
          }))
        )
      )
      .catch(() => {});
  }, [setExpenses]);

  const filtered = expenses.filter(
    (e) =>
      e.category.includes(search) ||
      e.note.includes(search) ||
      String(e.amount).includes(search)
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const startEdit = (expense: typeof expenses[0]) => {
    setEditingId(expense.id);
    setEditForm({
      date: expense.date.split("T")[0],
      amount: String(expense.amount),
      category: expense.category,
      note: expense.note,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const res = await fetch(`/api/expenses/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: editForm.date,
          amount: parseFloat(editForm.amount),
          category: editForm.category,
          note: editForm.note,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      updateExpense(editingId, {
        ...updated,
        date: updated.date,
      });
      setEditingId(null);
      toast({ title: "修改成功" });
    } catch {
      toast({ title: "修改失败", variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/expenses/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      removeExpense(deleteId);
      setDeleteId(null);
      toast({ title: "删除成功" });
    } catch {
      toast({ title: "删除失败", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索分类、备注、金额..."
          className="pl-9"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
      </div>

      {paged.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {expenses.length === 0 ? "还没有记录，去记一笔吧" : "没有匹配的记录"}
        </div>
      ) : (
        <>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {paged.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="shrink-0">
                      {expense.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(expense.date), "MM-dd")}
                    </span>
                  </div>
                  {expense.note && (
                    <p className="text-sm text-muted-foreground truncate">
                      {expense.note}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold tabular-nums">
                    ¥{expense.amount.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => startEdit(expense)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(expense.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑账目</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>日期</Label>
                <Input
                  type="date"
                  value={editForm.date}
                  onChange={(e) =>
                    setEditForm({ ...editForm, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>金额</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) =>
                    setEditForm({ ...editForm, amount: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>分类</Label>
              <Select
                value={editForm.category}
                onValueChange={(v) =>
                  setEditForm({ ...editForm, category: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                value={editForm.note}
                onChange={(e) =>
                  setEditForm({ ...editForm, note: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>
              取消
            </Button>
            <Button onClick={saveEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">删除后无法恢复，确定要删除这条记录吗？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}