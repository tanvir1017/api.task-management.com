"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { getAllUsers, updateTask } from "@/lib/api-client";
import type { Task, UpdateTaskRequest, User } from "@/lib/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onTaskUpdated?: () => void;
}

export function EditTaskDialog({
  open,
  onOpenChange,
  task,
  onTaskUpdated,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Load task data and users when dialog opens
  useEffect(() => {
    if (!open || !task) return;

    const loadData = async () => {
      try {
        setLoadingUsers(true);
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers.result);

        // Set form values from task
        setTitle(task.title);
        setDescription(task.description || "");
        setAssignedToId(task.assigneeId?.toString() || "");
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to load users";
        toast.error(errorMsg);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadData();
  }, [open, task, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!task) return;

    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    if (!assignedToId) {
      toast.error("Please select a user to assign the task");
      return;
    }

    try {
      setSubmitting(true);
      const request: UpdateTaskRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        assignedToId: parseInt(assignedToId, 10),
      };

      await updateTask(task.id, request);

      toast.success("Task updated successfully");

      onOpenChange(false);
      onTaskUpdated?.();
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to update task";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update task details and assignment
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="edit-title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title *
            </label>
            <Input
              id="edit-title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="edit-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <Textarea
              id="edit-description"
              placeholder="Enter task description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              rows={3}
            />
          </div>

          {/* Assign To User */}
          <div>
            <label
              htmlFor="edit-assignedTo"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Assign To *
            </label>
            {loadingUsers ? (
              <div className="flex items-center justify-center p-2 bg-gray-50 rounded border border-gray-200">
                <Spinner className="h-4 w-4" />
                <span className="ml-2 text-sm text-gray-600">
                  Loading users...
                </span>
              </div>
            ) : (
              <Select
                value={assignedToId}
                onValueChange={setAssignedToId}
                disabled={submitting || users.length === 0}
              >
                <SelectTrigger id="edit-assignedTo">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.fullName || user.username || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Task Info */}
          <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-2 text-xs">
            <div>
              <strong className="text-gray-700">Current Status:</strong>
              <span className="ml-2 text-gray-600">{task.status}</span>
            </div>
            <div>
              <strong className="text-gray-700">Task ID:</strong>
              <span className="ml-2 text-gray-600">{task.id}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={submitting || loadingUsers}
            >
              {submitting ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Updating...
                </>
              ) : (
                "Update Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
