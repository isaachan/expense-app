"use client";

import { ExpenseForm } from "@/components/expense/expense-form";
import { ExpenseList } from "@/components/expense/expense-list";
import { ExpenseReport } from "@/components/expense/expense-report";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, List, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50/50 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <Receipt className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">记账本</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4">
        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="add" className="gap-1.5">
              <Receipt className="h-3.5 w-3.5" />
              记账
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-1.5">
              <List className="h-3.5 w-3.5" />
              明细
            </TabsTrigger>
            <TabsTrigger value="report" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              报表
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add">
            <ExpenseForm />
          </TabsContent>

          <TabsContent value="list">
            <ExpenseList />
          </TabsContent>

          <TabsContent value="report">
            <ExpenseReport />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t">
        <div className="max-w-lg mx-auto px-4 py-3 text-center text-xs text-muted-foreground">
          微信 SSO 登录需配置 AppID 和 AppSecret 后启用
        </div>
      </footer>
    </div>
  );
}