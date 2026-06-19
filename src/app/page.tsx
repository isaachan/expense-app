"use client";

import { useEffect, useState, useCallback } from "react";
import { ExpenseForm } from "@/components/expense/expense-form";
import { ExpenseList } from "@/components/expense/expense-list";
import { ExpenseReport } from "@/components/expense/expense-report";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Receipt, List, BarChart3, LogOut, Loader2, KeyRound } from "lucide-react";

type AuthState = "loading" | "authenticated" | "not_authenticated" | "error";

export default function Home() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [code, setCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setAuthState(data.authenticated ? "authenticated" : "not_authenticated");
      })
      .catch(() => setAuthState("not_authenticated"));
  }, []);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLogging(true);
    setLoginError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setAuthState("authenticated");
        setCode("");
      } else {
        setLoginError(data.error || "登录失败");
      }
    } catch {
      setLoginError("网络错误，请重试");
    } finally {
      setLogging(false);
    }
  }, [code]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthState("not_authenticated");
  }, []);

  // Loading
  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Login
  if (authState === "not_authenticated" || authState === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-orange-50/50 to-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-orange-500 flex items-center justify-center">
              <Receipt className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-xl">记账本</CardTitle>
            <p className="text-sm text-muted-foreground">请输入邀请码访问</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code" className="sr-only">邀请码</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="invite-code"
                    type="password"
                    placeholder="邀请码"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="pl-9 h-12 text-center text-lg tracking-widest"
                    autoFocus
                  />
                </div>
              </div>

              {loginError && (
                <p className="text-sm text-destructive text-center">{loginError}</p>
              )}

              <Button
                type="submit"
                className="w-full h-11"
                disabled={logging || !code.trim()}
              >
                {logging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {logging ? "验证中..." : "进入"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated - app
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50/50 to-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">记账本</h1>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

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

      <footer className="mt-auto border-t">
        <div className="max-w-lg mx-auto px-4 py-3 text-center text-xs text-muted-foreground">
          已登录
        </div>
      </footer>
    </div>
  );
}