"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { deleteTask, getAllTasks, updateTaskStatus } from "@/lib/api-client";
import type { Task, TaskStatus } from "@/lib/types";
import {
  AlertTriangle,
  Edit2,
  HistoryIcon,
  Search,
  Trash2,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 10;

const STATUS_FILTERS: Array<{ value: "ALL" | TaskStatus; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

interface TaskListProps {
  isAdmin?: boolean;
  refreshTrigger?: number;
  onViewLogsClick?: () => void;
  onEditTask?: (task: Task) => void;
  onTaskLogsClick?: (task: Task) => void;
}

export function TaskList({
  isAdmin = false,
  refreshTrigger = 0,
  onViewLogsClick,
  onEditTask,
  onTaskLogsClick,
}: TaskListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Math.max(
    1,
    Number.parseInt(searchParams.get("page") || "1", 10) || 1,
  );
  const currentLimit = Math.max(
    1,
    Number.parseInt(searchParams.get("limit") || String(PAGE_SIZE), 10) ||
      PAGE_SIZE,
  );
  const currentSearch = (searchParams.get("search") || "").trim();
  const statusParam = searchParams.get("status");
  const currentStatus: "ALL" | TaskStatus =
    statusParam &&
    ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(statusParam)
      ? (statusParam as TaskStatus)
      : "ALL";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<number | null>(
    null,
  );

  const paginationItems = useMemo(() => {
    if (totalPages <= 1) {
      return [] as Array<number | "ellipsis">;
    }

    const items: Array<number | "ellipsis"> = [];
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, currentPage + 1);

    if (startPage > 1) {
      items.push(1);
      if (startPage > 2) {
        items.push("ellipsis");
      }
    }

    for (let page = startPage; page <= endPage; page += 1) {
      items.push(page);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push("ellipsis");
      }
      items.push(totalPages);
    }

    return items;
  }, [currentPage, totalPages]);

  const updateUrlQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname);
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    let active = true;

    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedTasks = await getAllTasks({
          search: currentSearch || undefined,
          status: currentStatus === "ALL" ? undefined : currentStatus,
          page: currentPage,
          limit: currentLimit,
        });

        if (!active) {
          return;
        }

        setTasks(fetchedTasks.result);
        setTotal(fetchedTasks.meta.total);
        setTotalPages(fetchedTasks.meta.totalPages);

        if (
          fetchedTasks.meta.total > 0 &&
          currentPage > fetchedTasks.meta.totalPages
        ) {
          updateUrlQuery({ page: String(fetchedTasks.meta.totalPages) });
        }
      } catch (err) {
        if (!active) {
          return;
        }

        const errorMsg =
          err instanceof Error ? err.message : "Failed to load tasks";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadTasks();

    return () => {
      active = false;
    };
  }, [
    currentLimit,
    currentPage,
    currentSearch,
    currentStatus,
    refreshTrigger,
    updateUrlQuery,
  ]);

  const applySearch = () => {
    updateUrlQuery({
      search: searchInput.trim() || null,
      page: "1",
      limit: String(PAGE_SIZE),
    });
  };

  const resetFilters = () => {
    updateUrlQuery({
      search: null,
      status: null,
      page: "1",
      limit: String(PAGE_SIZE),
    });
  };

  const handleStatusChange = useCallback(
    async (taskId: number, newStatus: TaskStatus) => {
      try {
        const updatedTask = await updateTaskStatus(taskId, {
          status: newStatus,
        });
        setTasks(tasks.map((t) => (t.id === taskId ? updatedTask : t)));
        toast.success("Task status updated successfully");
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to update task status";
        toast.error(errorMsg);
      }
    },
    [tasks, toast],
  );

  const handleDeleteTask = useCallback(
    async (taskId: number) => {
      try {
        await deleteTask(taskId);
        setTasks((currentTasks) => currentTasks.filter((t) => t.id !== taskId));
        setDeleteConfirmTaskId(null);
        toast.success("Task deleted successfully");
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to delete task";
        toast.error(errorMsg);
      }
    },
    [toast],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-8 w-8" />
        <span className="ml-2 text-gray-600">Loading tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Tasks</h3>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
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
                  placeholder="Search tasks by title or description"
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
                value={currentStatus}
                onValueChange={(value) => {
                  updateUrlQuery({
                    status: value === "ALL" ? null : value,
                    page: "1",
                    limit: String(PAGE_SIZE),
                  });
                }}
              >
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((statusOption) => (
                    <SelectItem
                      key={statusOption.value}
                      value={statusOption.value}
                    >
                      {statusOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="ghost" onClick={resetFilters} className="shrink-0">
              Reset
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">
            No tasks found. Create one or adjust the search filters.
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPersonDisplay = (
    person?: { fullName: string | null; email: string } | null,
    fallbackLabel?: string,
  ): { name: string; email: string; initials: string } => {
    const fallbackName = fallbackLabel || "Unassigned";

    if (!person) {
      return {
        name: fallbackName,
        email: "",
        initials: fallbackName
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() || "")
          .join("")
          .slice(0, 2),
      };
    }

    const trimmedName = person.fullName?.trim() || "";
    const nameParts = trimmedName.split(/\s+/).filter(Boolean);
    const initials =
      nameParts.length >= 2
        ? `${nameParts[0][0] ?? ""}${nameParts[nameParts.length - 1][0] ?? ""}`
        : (trimmedName || person.email)
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() || "")
            .join("")
            .slice(0, 2);

    return {
      name: trimmedName || person.email,
      email: person.email,
      initials: initials.toUpperCase() || "U",
    };
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
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
                placeholder="Search tasks by title or description"
                className="max-w-md"
              />
              <Button onClick={applySearch} variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>

            <Select
              value={currentStatus}
              onValueChange={(value) => {
                updateUrlQuery({
                  status: value === "ALL" ? null : value,
                  page: "1",
                  limit: String(PAGE_SIZE),
                });
              }}
            >
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((statusOption) => (
                  <SelectItem
                    key={statusOption.value}
                    value={statusOption.value}
                  >
                    {statusOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>
              Showing {tasks.length} of {total} tasks
            </span>
            <Button variant="ghost" onClick={resetFilters} className="shrink-0">
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Header with View Logs Button */}
      {isAdmin && onViewLogsClick && (
        <div className="flex justify-end mb-4">
          <Button
            onClick={onViewLogsClick}
            variant="outline"
            size="sm"
            aria-label="View task history and logs"
            className="gap-2"
          >
            <HistoryIcon className="h-4 w-4" />
            View History/Logs
          </Button>
        </div>
      )}

      {/* Tasks Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full"
            role="grid"
            aria-label={isAdmin ? "All tasks" : "Your assigned tasks"}
          >
            <thead className="bg-gray-50 border-b">
              <tr role="row">
                <th
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                  scope="col"
                >
                  Title
                </th>
                <th
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                  scope="col"
                >
                  {isAdmin ? "Assignee" : "Assigned By"}
                </th>
                <th
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                  scope="col"
                >
                  Status
                </th>
                <th
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                  scope="col"
                >
                  Created
                </th>
                {isAdmin && (
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                    scope="col"
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50" role="row">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {(() => {
                      const person = isAdmin ? task.assignee : task.creator;
                      const fallbackLabel = isAdmin
                        ? task.assigneeId
                          ? `User #${task.assigneeId}`
                          : "Unassigned"
                        : `User #${task.creatorId}`;
                      const display = getPersonDisplay(person, fallbackLabel);

                      return (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-slate-200 bg-slate-100">
                            <AvatarFallback className="bg-slate-100 text-[11px] font-semibold tracking-wide text-slate-700">
                              {display.initials || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {display.name}
                            </p>
                            {display.email && (
                              <p className="truncate text-xs text-slate-500">
                                {display.email}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <Select
                      value={task.status}
                      onValueChange={(value) =>
                        handleStatusChange(task.id, value as TaskStatus)
                      }
                      disabled={!isAdmin && task.status === "COMPLETED"}
                    >
                      <SelectTrigger
                        className="w-36"
                        aria-label={`Task status: ${task.status}`}
                        tabIndex={0}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor("PENDING")}`}
                          >
                            Pending
                          </span>
                        </SelectItem>
                        <SelectItem value="IN_PROGRESS">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor("IN_PROGRESS")}`}
                          >
                            In Progress
                          </span>
                        </SelectItem>
                        <SelectItem value="COMPLETED">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor("COMPLETED")}`}
                          >
                            Completed
                          </span>
                        </SelectItem>
                        <SelectItem value="CANCELLED">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor("CANCELLED")}`}
                          >
                            Cancelled
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(task.createdAt)}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => onEditTask?.(task)}
                          variant="ghost"
                          size="sm"
                          aria-label={`Edit task: ${task.title}`}
                          className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => onTaskLogsClick?.(task)}
                          variant="ghost"
                          size="sm"
                          aria-label={`View logs for task: ${task.title}`}
                          className="text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                        >
                          <HistoryIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => setDeleteConfirmTaskId(task.id)}
                          variant="ghost"
                          size="sm"
                          aria-label={`Delete task: ${task.title}`}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {total >= PAGE_SIZE && (
        <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
          <div className="mb-2 text-center text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    if (currentPage <= 1 || loading) return;
                    updateUrlQuery({
                      page: String(currentPage - 1),
                      limit: String(PAGE_SIZE),
                    });
                  }}
                  aria-disabled={currentPage <= 1 || loading}
                  className={
                    currentPage <= 1 || loading
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>

              {paginationItems.map((item, index) =>
                item === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={`page-${item}`}>
                    <PaginationLink
                      href="#"
                      isActive={item === currentPage}
                      onClick={(event) => {
                        event.preventDefault();
                        if (loading || item === currentPage) return;
                        updateUrlQuery({
                          page: String(item),
                          limit: String(PAGE_SIZE),
                        });
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    if (currentPage >= totalPages || loading) return;
                    updateUrlQuery({
                      page: String(currentPage + 1),
                      limit: String(PAGE_SIZE),
                    });
                  }}
                  aria-disabled={currentPage >= totalPages || loading}
                  className={
                    currentPage >= totalPages || loading
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmTaskId !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="presentation"
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 max-w-sm"
            role="alertdialog"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <h2
              id="delete-dialog-title"
              className="text-lg font-bold text-gray-900"
            >
              Delete Task
            </h2>
            <p id="delete-dialog-description" className="text-gray-600 mt-2">
              Are you sure you want to delete this task? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 mt-6 justify-end">
              <Button
                onClick={() => setDeleteConfirmTaskId(null)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (deleteConfirmTaskId === null) {
                    return;
                  }

                  handleDeleteTask(deleteConfirmTaskId);
                }}
                variant="destructive"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
