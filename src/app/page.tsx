"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ExpenseForm } from "@/components/expense/expense-form";
import { ExpenseList } from "@/components/expense/expense-list";
import { ExpenseReport } from "@/components/expense/expense-report";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, List, BarChart3, LogOut, ShieldOff, Loader2 } from "lucide-react";

interface UserInfo {
  openid: string;
  nickname: string;
  avatar: string;
}

type AuthState = "loading" | "authenticated" | "not_authenticated" | "rejected" | "error" | "not_configured";

export default function Home() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const searchParams = useSearchParams();

  const errorParam = searchParams.get("error");

  // Clean URL error params on mount
  useEffect(() => {
    if (errorParam) {
      window.history.replaceState({}, "", "/");
    }
  }, [errorParam]);

  // Check auth status
  useEffect(() => {
    // If there's an error in URL, set state via the errorParam ref (not synchronous setState)
    // This is handled via the derived state pattern below
    if (errorParam) return;

    // Check session
    const controller = new AbortController();
    fetch("/api/auth/me", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser({ openid: data.openid, nickname: data.nickname, avatar: data.avatar });
          setAuthState("authenticated");
        } else {
          setAuthState("not_authenticated");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setAuthState("not_authenticated");
      });
    return () => controller.abort();
  }, [errorParam]);

  const handleWechatLogin = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/wechat");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setAuthState("not_configured");
      }
    } catch {
      setAuthState("error");
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setAuthState("not_authenticated");
  }, []);

  // Loading screen
  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // Handle URL error states
  if (errorParam === "not_configured") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-sm w-full">
          <CardHeader className="text-center">
            <CardTitle>微信登录未配置</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              请在环境变量中配置以下参数后重新部署：
            </p>
            <div className="text-left bg-muted rounded-lg p-3 space-y-1">
              <p className="text-xs font-mono">WECHAT_APP_ID=你的AppID</p>
              <p className="text-xs font-mono">WECHAT_APP_SECRET=你的AppSecret</p>
              <p className="text-xs font-mono">WECHAT_REDIRECT_URI=回调地址</p>
              <p className="text-xs font-mono">ADMIN_SECRET=管理密钥</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Rejected (not in whitelist)
  if (authState === "rejected") {
    const nickname = searchParams.get("nickname") || "";
    const openid = searchParams.get("openid") || "";
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-sm w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldOff className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>访问被拒绝</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            {nickname && (
              <p className="text-sm">
                <span className="font-medium">{decodeURIComponent(nickname)}</span>，你没有访问权限
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {openid && <span className="font-mono break-all">OpenID: {openid}</span>}
            </p>
            <p className="text-sm text-muted-foreground">
              请联系管理员将你加入白名单
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error
  if (authState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-sm w-full">
          <CardHeader className="text-center">
            <CardTitle>登录出错</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">{errorMsg || "请稍后重试"}</p>
            <Button onClick={handleWechatLogin}>重新登录</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Login screen
  if (authState === "not_authenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50/50 to-background px-4">
        <div className="h-16 w-16 rounded-2xl bg-green-500 flex items-center justify-center mb-6">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="currentColor">
            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.007-.273-.025-.407-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold mb-2">记账本</h1>
        <p className="text-sm text-muted-foreground mb-8">使用微信扫码登录</p>
        <Button
          size="lg"
          className="bg-green-500 hover:bg-green-600 text-white px-8"
          onClick={handleWechatLogin}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" fill="currentColor">
            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348z" />
          </svg>
          微信登录
        </Button>
      </div>
    );
  }

  // Authenticated - show the app
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50/50 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">记账本</h1>
          </div>
          <div className="flex items-center gap-2">
            {user?.nickname && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.nickname}
              </span>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
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
          已登录 · {user?.nickname || "微信用户"}
        </div>
      </footer>
    </div>
  );
}