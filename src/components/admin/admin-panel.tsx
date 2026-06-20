"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, RefreshCw, ChevronLeft, ChevronRight, KeyRound, ScrollText } from "lucide-react";
import { format } from "date-fns";

// ========== Types ==========
interface InviteCode {
  id: string;
  code: string;
  note: string;
  active: boolean;
  createdAt: string;
  usedCount: number;
}

interface LogEntry {
  id: string;
  action: string;
  detail: string;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: "登录成功",
  LOGIN_FAILED: "登录失败",
  CREATE_EXPENSE: "新增账目",
  UPDATE_EXPENSE: "修改账目",
  DELETE_EXPENSE: "删除账目",
  IMPORT: "导入 Excel",
  EXPORT: "导出 Excel",
  CREATE_INVITE_CODE: "创建邀请码",
  UPDATE_INVITE_CODE: "修改邀请码",
  DELETE_INVITE_CODE: "删除邀请码",
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN_SUCCESS: "bg-green-100 text-green-800",
  LOGIN_FAILED: "bg-red-100 text-red-800",
  CREATE_EXPENSE: "bg-blue-100 text-blue-800",
  UPDATE_EXPENSE: "bg-amber-100 text-amber-800",
  DELETE_EXPENSE: "bg-red-100 text-red-800",
  IMPORT: "bg-purple-100 text-purple-800",
  EXPORT: "bg-indigo-100 text-indigo-800",
  CREATE_INVITE_CODE: "bg-emerald-100 text-emerald-800",
  UPDATE_INVITE_CODE: "bg-orange-100 text-orange-800",
  DELETE_INVITE_CODE: "bg-red-100 text-red-800",
};

// ========== Sub-components ==========

function InviteCodeManager() {
  const { toast } = useToast();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newNote, setNewNote] = useState("");
  const [creating, setCreating] = useState(false);

  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/invite-codes");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setCodes(data);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchTrigger]);

  const refreshCodes = () => setFetchTrigger((n) => n + 1);

  const handleCreate = async () => {
    if (!newCode.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCode.trim(), note: newNote.trim() }),
      });
      if (res.ok) {
        toast({ title: "创建成功" });
        setNewCode("");
        setNewNote("");
        setShowCreate(false);
        refreshCodes();
      } else {
        const data = await res.json();
        toast({ title: data.error || "创建失败", variant: "destructive" });
      }
    } catch {
      toast({ title: "创建失败", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (code: InviteCode) => {
    try {
      const res = await fetch("/api/invite-codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: code.id, active: !code.active }),
      });
      if (res.ok) {
        refreshCodes();
      }
    } catch {
      toast({ title: "操作失败", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/invite-codes?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "已删除" });
        refreshCodes();
      }
    } catch {
      toast({ title: "删除失败", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">邀请码管理</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCodes}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            新建
          </Button>
        </div>
      </div>

      {codes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          暂无邀请码，请新建一个
        </div>
      ) : (
        <div className="space-y-2">
          {codes.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="font-mono text-sm font-semibold">
                    {c.code}
                  </code>
                  <Badge variant={c.active ? "default" : "secondary"} className="text-xs">
                    {c.active ? "启用" : "禁用"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {c.note && <span>{c.note}</span>}
                  <span>使用 {c.usedCount} 次</span>
                  <span>{format(new Date(c.createdAt), "MM-dd HH:mm")}</span>
                </div>
              </div>
              <Switch
                checked={c.active}
                onCheckedChange={() => handleToggle(c)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDelete(c.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建邀请码</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>邀请码</Label>
              <Input
                placeholder="输入邀请码"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>备注（可选）</Label>
              <Input
                placeholder="例如：给张三的邀请码"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newCode.trim()}>
              {creating ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 30;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        if (actionFilter !== "all") {
          params.set("action", actionFilter);
        }
        const res = await fetch(`/api/logs?${params}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setLogs(data.logs);
          setTotal(data.total);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page, actionFilter]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">操作日志</h3>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key} className="text-xs">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">暂无日志</div>
      ) : (
        <>
          <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-card border text-sm"
              >
                <Badge
                  variant="secondary"
                  className={`shrink-0 text-xs ${ACTION_COLORS[log.action] || ""}`}
                >
                  {ACTION_LABELS[log.action] || log.action}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm break-all">{log.detail}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(log.createdAt), "MM-dd HH:mm:ss")}
                  </p>
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
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ========== Main AdminPanel ==========

export function AdminPanel() {
  const [tab, setTab] = useState<"codes" | "logs">("codes");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={tab === "codes" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("codes")}
          className="flex-1"
        >
          <KeyRound className="h-3.5 w-3.5 mr-1.5" />
          邀请码
        </Button>
        <Button
          variant={tab === "logs" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("logs")}
          className="flex-1"
        >
          <ScrollText className="h-3.5 w-3.5 mr-1.5" />
          操作日志
        </Button>
      </div>

      {tab === "codes" && <InviteCodeManager />}
      {tab === "logs" && <LogViewer />}
    </div>
  );
}