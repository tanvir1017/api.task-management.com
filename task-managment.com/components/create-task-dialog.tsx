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
import { createTask, getAllUsers } from "@/lib/api-client";
import type { CreateTaskRequest, User } from "@/lib/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: () => void;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  onTaskCreated,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Fetch users when dialog opens
  useEffect(() => {
    if (!open) return;

    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers.result);
        // Set first user as default
        if (fetchedUsers.result.length > 0) {
          setAssignedToId(fetchedUsers.result[0].id.toString());
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to load users";
        toast.error(errorMsg);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [open, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    if (!assignedToId) {
      toast.error("Please select a user to assign the task");
      return;
    }

    try {
      setSubmitting(true);
      const request: CreateTaskRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        assignedToId: parseInt(assignedToId, 10),
      };

      await createTask(request);

      toast.success("Task created successfully");

      // Reset form
      setTitle("");
      setDescription("");
      if (users.length > 0) {
        setAssignedToId(users[0].id.toString());
      }

      onOpenChange(false);
      onTaskCreated?.();
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to create task";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a new task and assign it to a user. All tasks start as
            PENDING.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title *
            </label>
            <Input
              id="title"
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
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <Textarea
              id="description"
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
              htmlFor="assignedTo"
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
                <SelectTrigger id="assignedTo">
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

          {/* Status Info */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              <strong>Status:</strong> All new tasks are created as PENDING. The
              assigned user can update the status.
            </p>
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
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
