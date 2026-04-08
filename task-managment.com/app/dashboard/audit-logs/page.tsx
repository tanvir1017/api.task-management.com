"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuditLogs } from "@/lib/api-client";
import type { AuditLog } from "@/lib/types";
import {
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 25;

const ACTION_FILTERS: Array<{
  value:
    | "ALL"
    | "CREATE_TASK"
    | "UPDATE_TASK"
    | "DELETE_TASK"
    | "UPDATE_STATUS"
    | "ASSIGN_TASK";
  label: string;
}> = [
  { value: "ALL", label: "All actions" },
  { value: "CREATE_TASK", label: "Created" },
  { value: "UPDATE_TASK", label: "Updated" },
  { value: "DELETE_TASK", label: "Deleted" },
  { value: "UPDATE_STATUS", label: "Status changed" },
  { value: "ASSIGN_TASK", label: "Reassigned" },
];

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActionTone(
  actionType: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (actionType.includes("DELETE")) {
    return "destructive";
  }

  if (actionType.includes("CREATE")) {
    return "default";
  }

  if (actionType.includes("UPDATE")) {
    return "secondary";
  }

  return "outline";
}

function getActionIcon(actionType: string) {
  if (actionType.includes("DELETE")) {
    return <Trash2 className="h-4 w-4" />;
  }

  if (actionType.includes("CREATE")) {
    return <CheckCircle2 className="h-4 w-4" />;
  }

  if (actionType.includes("UPDATE")) {
    return <RefreshCw className="h-4 w-4" />;
  }

  return <ShieldCheck className="h-4 w-4" />;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<
    "ALL" | AuditLog["actionType"]
  >("ALL");
  const [targetEntityInput, setTargetEntityInput] = useState("");
  const [targetEntityQuery, setTargetEntityQuery] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadLogs() {
      try {
        setLoading(true);
        const response = await getAuditLogs({
          search: searchQuery.trim() || undefined,
          actionType: actionFilter === "ALL" ? undefined : actionFilter,
          targetEntity: targetEntityQuery
            ? Number(targetEntityQuery)
            : undefined,
          page,
          limit: PAGE_SIZE,
        });

        if (!active) {
          return;
        }

        setLogs(response.result);
        setTotal(response.meta.total);
        setTotalPages(response.meta.totalPages);

        if (response.meta.total > 0 && page > response.meta.totalPages) {
          setPage(response.meta.totalPages);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        toast.error(
          error instanceof Error ? error.message : "Failed to load audit logs",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLogs();

    return () => {
      active = false;
    };
  }, [actionFilter, page, refreshToken, searchQuery, targetEntityQuery]);

  const applySearch = () => {
    setPage(1);
    setSearchQuery(searchInput.trim());
    setTargetEntityQuery(targetEntityInput.trim());
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setActionFilter("ALL");
    setTargetEntityInput("");
    setTargetEntityQuery("");
    setPage(1);
  };

  const summary = useMemo(() => {
    return {
      total: logs.length,
      deletes: logs.filter((log) => log.actionType.includes("DELETE")).length,
      updates: logs.filter((log) => log.actionType.includes("UPDATE")).length,
    };
  }, [logs]);

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SYSTEM_ADMIN"]}>
      <div className="min-h-full bg-linear-to-br from-slate-50 via-white to-sky-50">
        <div className="border-b bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Audit Logs
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                A live history of task and system changes.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setRefreshToken((current) => current + 1);
                setPage(1);
              }}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-col gap-3 lg:flex-row">
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          applySearch();
                        }
                      }}
                      placeholder="Search audit logs"
                      className="max-w-md"
                    />
                    <Button
                      onClick={applySearch}
                      variant="outline"
                      className="gap-2"
                    >
                      <Search className="h-4 w-4" />
                      Search
                    </Button>
                  </div>

                  <Select
                    value={actionFilter}
                    onValueChange={(value) => {
                      setActionFilter(value as typeof actionFilter);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full lg:w-52">
                      <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_FILTERS.map((actionOption) => (
                        <SelectItem
                          key={actionOption.value}
                          value={actionOption.value}
                        >
                          {actionOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={targetEntityInput}
                    onChange={(event) =>
                      setTargetEntityInput(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        applySearch();
                      }
                    }}
                    placeholder="Task ID"
                    className="w-full lg:w-40"
                  />
                </div>

                <Button
                  variant="ghost"
                  onClick={resetFilters}
                  className="shrink-0"
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Matching logs</CardDescription>
                <CardTitle className="text-3xl">{total}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Logs matching the current filters
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Updates</CardDescription>
                <CardTitle className="text-3xl">{summary.updates}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Modified records
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Deletes</CardDescription>
                <CardTitle className="text-3xl">{summary.deletes}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Destructive actions
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-slate-50/80">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Paginated results from the audit endpoint.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Payload</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-10 text-center text-slate-500"
                        >
                          Loading audit logs...
                        </TableCell>
                      </TableRow>
                    ) : logs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-10 text-center text-slate-500"
                        >
                          No audit logs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="align-top">
                            <Badge
                              variant={getActionTone(log.actionType)}
                              className="gap-1 px-2 py-1"
                            >
                              {getActionIcon(log.actionType)}
                              {log.actionType.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-top text-slate-700">
                            Task #{log.targetEntity}
                          </TableCell>
                          <TableCell className="align-top text-slate-700">
                            {log.actor?.fullName ||
                              log.actor?.username ||
                              log.actor?.email ||
                              `User #${log.actorId}`}
                          </TableCell>
                          <TableCell className="align-top text-slate-700">
                            <details className="group">
                              <summary className="cursor-pointer text-sm font-medium text-sky-700 hover:text-sky-900">
                                View details
                              </summary>
                              <div className="mt-2 rounded-lg border bg-slate-50 p-3 text-xs text-slate-700 shadow-sm">
                                <pre className="whitespace-pre-wrap wrap-break-word font-mono">
                                  {JSON.stringify(log.payload, null, 2)}
                                </pre>
                              </div>
                            </details>
                          </TableCell>
                          <TableCell className="align-top text-slate-700">
                            <div className="flex items-center gap-2">
                              <Clock3 className="h-4 w-4 text-slate-400" />
                              {formatDate(log.createdAt)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between pb-6">
            <Button
              variant="outline"
              onClick={() =>
                setPage((currentPage) => Math.max(1, currentPage - 1))
              }
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <p className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </p>
            <Button
              variant="outline"
              onClick={() => setPage((currentPage) => currentPage + 1)}
              disabled={page >= totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
