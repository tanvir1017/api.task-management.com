"use client";

import { AuditLogsSidebar } from "@/components/audit-logs-sidebar";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { EditTaskDialog } from "@/components/edit-task-dialog";
import { ProtectedRoute } from "@/components/protected-route";
import { TaskList } from "@/components/task-list";
import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/types";
import { Plus, RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";

export default function AdminTasksPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAuditSidebarOpen, setIsAuditSidebarOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTaskForLogs, setSelectedTaskForLogs] = useState<Task | null>(
    null,
  );
  const [isTaskLogsSidebarOpen, setIsTaskLogsSidebarOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTaskCreated = useCallback(() => {
    setIsCreateDialogOpen(false);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const handleTaskUpdated = useCallback(() => {
    setIsEditDialogOpen(false);
    setEditingTask(null);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleTaskLogsClick = (task: Task) => {
    setSelectedTaskForLogs(task);
    setIsTaskLogsSidebarOpen(true);
  };

  return (
    <>
      <ProtectedRoute allowedRoles={["ADMIN", "SYSTEM_ADMIN"]}>
        <div className="flex-1 flex flex-col h-screen">
          {/* Header */}
          <div className="border-b bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Tasks Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage all tasks in the system with audit logs
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  aria-label="Create new task"
                >
                  <Plus className="h-4 w-4" />
                  Create Task
                </Button>
                <Button
                  onClick={async () => {
                    setIsRefreshing(true);
                    try {
                      setRefreshTrigger((prev) => prev + 1);
                      await new Promise((resolve) => setTimeout(resolve, 500));
                    } finally {
                      setIsRefreshing(false);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  disabled={isRefreshing}
                  aria-label="Refresh tasks"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-auto">
            <TaskList
              key={refreshTrigger}
              isAdmin={true}
              refreshTrigger={refreshTrigger}
              onViewLogsClick={() => setIsAuditSidebarOpen(true)}
              onEditTask={handleEditTask}
              onTaskLogsClick={handleTaskLogsClick}
            />
          </div>

          {/* Create Task Dialog */}
          <CreateTaskDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onTaskCreated={handleTaskCreated}
          />

          {/* Edit Task Dialog */}
          <EditTaskDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            task={editingTask}
            onTaskUpdated={handleTaskUpdated}
          />

          {/* All Tasks Audit Logs Sidebar */}
          <AuditLogsSidebar
            open={isAuditSidebarOpen}
            onOpenChange={setIsAuditSidebarOpen}
            mode="all"
            isAdmin={true}
          />

          {/* Specific Task Logs Sidebar */}
          {selectedTaskForLogs && (
            <AuditLogsSidebar
              open={isTaskLogsSidebarOpen}
              onOpenChange={setIsTaskLogsSidebarOpen}
              mode="task"
              taskId={selectedTaskForLogs.id}
              taskTitle={selectedTaskForLogs.title}
              isAdmin={true}
            />
          )}
        </div>
      </ProtectedRoute>
    </>
  );
}
