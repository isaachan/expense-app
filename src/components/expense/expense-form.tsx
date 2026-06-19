"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, useExpenseStore } from "@/lib/expense-store";
import { Plus, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExpenseFormProps {
  onClose?: () => void;
}

export function ExpenseForm({ onClose }: ExpenseFormProps) {
  const { addExpense } = useExpenseStore();
  const { toast } = useToast();

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !amount || !category) {
      toast({ title: "请填写完整信息", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, amount: parseFloat(amount), category, note }),
      });

      if (!res.ok) throw new Error("Failed to create");

      const expense = await res.json();
      addExpense({ ...expense, date: expense.date });
      setAmount("");
      setNote("");
      setCategory("");
      toast({ title: "记录成功" });
      if (onClose) onClose();
    } catch {
      toast({ title: "记录失败", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/expenses/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenses_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "导出成功" });
    } catch {
      toast({ title: "导出失败", variant: "destructive" });
    }
  };

  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/expenses/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Import failed");

      const { imported, skipped } = await res.json();
      toast({
        title: `导入完成`,
        description: `成功 ${imported} 条，跳过 ${skipped} 条`,
      });

      // Refresh expenses
      const listRes = await fetch("/api/expenses");
      if (listRes.ok) {
        const expenses = await listRes.json();
        useExpenseStore.getState().setExpenses(
          expenses.map((e: { id: string; date: string; amount: number; category: string; note: string; createdAt: string; updatedAt: string }) => ({
            ...e,
            date: e.date,
          }))
        );
      }
    } catch {
      toast({ title: "导入失败", variant: "destructive" });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">日期</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">金额 (元)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">分类</Label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger id="category">
              <SelectValue placeholder="选择分类" />
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
          <Label htmlFor="note">备注</Label>
          <Textarea
            id="note"
            placeholder="可选备注..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          <Plus className="h-4 w-4 mr-2" />
          {submitting ? "记录中..." : "记一笔"}
        </Button>
      </form>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
        >
          <Upload className="h-4 w-4 mr-2" />
          {importing ? "导入中..." : "导入 Excel"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleImport}
        />
        <Button variant="outline" className="flex-1" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          导出 Excel
        </Button>
      </div>
    </div>
  );
}