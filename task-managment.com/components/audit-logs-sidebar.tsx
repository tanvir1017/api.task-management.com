"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import {
  deleteAuditLog,
  getAuditLogs,
  getAuditLogsByTaskId,
} from "@/lib/api-client";
import type { AuditActionType, AuditLog } from "@/lib/types";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Link as LinkIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AuditLogsSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "all" | "task"; // 'all' for all logs, 'task' for specific task
  taskId?: number;
  taskTitle?: string;
  isAdmin?: boolean;
}

export function AuditLogsSidebar({
  open,
  onOpenChange,
  mode = "all",
  taskId,
  taskTitle,
  isAdmin = false,
}: AuditLogsSidebarProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const take = 20;

  useEffect(() => {
    if (!open) return;

    const loadLogs = async () => {
      try {
        setLoading(true);
        let fetchedLogs: AuditLog[] = [];

        if (mode === "task" && taskId) {
          fetchedLogs = await getAuditLogsByTaskId(taskId);
        } else {
          const response = await getAuditLogs({
            page,
            limit: take,
          });
          fetchedLogs = response.result;
          setHasMore(page < response.meta.totalPages);
        }

        setLogs(fetchedLogs);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load audit logs";
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [open, toast, mode, taskId, page]);

  const handleDelete = async (logId: number) => {
    if (!isAdmin) {
      toast.error("Only admins can delete audit logs");
      return;
    }

    try {
      setDeleting(logId);
      await deleteAuditLog(logId);
      setLogs((prevLogs) => prevLogs.filter((log) => log.id !== logId));
      toast.success("Audit log deleted successfully");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete audit log";
      toast.error(errorMsg);
    } finally {
      setDeleting(null);
    }
  };

  const getActionIcon = (actionType: AuditActionType) => {
    switch (actionType) {
      case "CREATE_TASK":
        return <Plus className="h-4 w-4 text-green-600" />;
      case "UPDATE_TASK":
        return <Edit2 className="h-4 w-4 text-blue-600" />;
      case "DELETE_TASK":
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case "UPDATE_STATUS":
        return <CheckCircle className="h-4 w-4 text-purple-600" />;
      case "ASSIGN_TASK":
        return <LinkIcon className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getActionLabel = (actionType: AuditActionType): string => {
    switch (actionType) {
      case "CREATE_TASK":
        return "Task Created";
      case "UPDATE_TASK":
        return "Task Updated";
      case "DELETE_TASK":
        return "Task Deleted";
      case "UPDATE_STATUS":
        return "Status Updated";
      case "ASSIGN_TASK":
        return "Task Assigned";
      default:
        return "Unknown Action";
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActorDisplay = (log: AuditLog): string => {
    if (log.actor) {
      return log.actor.fullName || log.actor.email || `User #${log.actorId}`;
    }
    return `User #${log.actorId}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-96 flex flex-col"
        aria-describedby="audit-logs-description"
      >
        <SheetHeader>
          <SheetTitle>
            {mode === "task" ? `Task History: ${taskTitle}` : "All Task Logs"}
          </SheetTitle>
          <SheetDescription id="audit-logs-description">
            {mode === "task"
              ? "View all actions performed on this task"
              : "View all actions performed on all tasks"}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-2">
            <Spinner className="h-6 w-6" />
            <p className="text-sm text-gray-600">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-2">
            <p className="text-sm text-gray-600">No audit logs found</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-3 pr-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors"
                    role="article"
                    aria-label={`${getActionLabel(log.actionType)} on task ${log.targetEntity}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-1">
                        {getActionIcon(log.actionType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-sm text-gray-900">
                            {getActionLabel(log.actionType)}
                          </h4>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(log.id)}
                              disabled={deleting === log.id}
                              className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                              title="Delete log"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Task ID: {log.targetEntity}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          By {getActorDisplay(log)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(log.createdAt)}
                        </p>

                        {/* Show payload details if available */}
                        {log.payload && Object.keys(log.payload).length > 0 && (
                          <details className="mt-2 cursor-pointer group">
                            <summary className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                              View Details
                            </summary>
                            <div className="mt-2 text-xs bg-gray-50 rounded p-2 max-h-24 overflow-auto">
                              <pre className="whitespace-pre-wrap break-word text-gray-700">
                                {JSON.stringify(log.payload, null, 2)}
                              </pre>
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Pagination controls for "all" mode */}
            {mode === "all" && (
              <div className="border-t mt-4 pt-4 flex gap-2 justify-between">
                <Button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1 || loading}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-xs text-gray-600 py-2">
                  Showing page {page}
                </span>
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={!hasMore || loading}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
