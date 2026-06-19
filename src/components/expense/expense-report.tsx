"use client";

import { useEffect, useState } from "react";
import { useExpenseStore } from "@/lib/expense-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface Stats {
  totalAmount: number;
  totalCount: number;
  categoryBreakdown: { name: string; amount: number }[];
  dailyTrend: { date: string; amount: number }[];
  startDate: string;
  endDate: string;
}

const COLORS = [
  "hsl(0, 72%, 51%)",
  "hsl(25, 95%, 53%)",
  "hsl(45, 93%, 47%)",
  "hsl(142, 71%, 45%)",
  "hsl(199, 89%, 48%)",
  "hsl(262, 83%, 58%)",
  "hsl(326, 100%, 74%)",
  "hsl(210, 17%, 49%)",
  "hsl(175, 60%, 40%)",
  "hsl(345, 75%, 50%)",
];

const categoryChartConfig: Record<string, { label: string; color: string }> = {};

export function ExpenseReport() {
  const { expenses, setExpenses } = useExpenseStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

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

  useEffect(() => {
    fetch(`/api/expenses/stats?month=${currentMonth}`)
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {});
  }, [currentMonth, expenses]);

  const monthLabel = (() => {
    const [y, m] = currentMonth.split("-").map(Number);
    return `${y}年${m}月`;
  })();

  const changeMonth = (delta: number) => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setCurrentMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const pieConfig = (() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    if (stats) {
      stats.categoryBreakdown.forEach((item, i) => {
        cfg[item.name] = { label: item.name, color: COLORS[i % COLORS.length] };
      });
    }
    return cfg;
  })();

  const dailyConfig = {
    amount: { label: "日支出", color: "hsl(25, 95%, 53%)" },
  };

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => changeMonth(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold min-w-[100px] text-center">
          {monthLabel}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => changeMonth(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                本月总支出
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                ¥{stats.totalAmount.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                本月笔数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {stats.totalCount}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Pie Chart */}
      {stats && stats.categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">分类占比</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieConfig} className="h-[280px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={stats.categoryBreakdown}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={2}
                >
                  {stats.categoryBreakdown.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>

            {/* Category Detail List */}
            <div className="mt-4 space-y-2">
              {stats.categoryBreakdown.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-sm shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground tabular-nums">
                      ¥{item.amount.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground tabular-nums w-12 text-right">
                      {((item.amount / stats.totalAmount) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Trend Bar Chart */}
      {stats && stats.dailyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">每日支出趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={dailyConfig} className="h-[250px] w-full">
              <BarChart data={stats.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.split("-")[2]}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="amount" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {stats && stats.totalCount === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          本月暂无记录
        </div>
      )}
    </div>
  );
}