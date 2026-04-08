'use client';

import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'PENDING' | 'PROCESSING' | 'DONE';
  createdAt: string;
  updatedAt: string;
}

interface TasksTableProps {
  tasks: Task[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
}

export function TasksTable({ tasks, onDelete, onUpdate }: TasksTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">No tasks found. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Assigned To</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div>
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <p className="text-sm text-gray-600">{task.description}</p>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{task.assignedTo}</td>
              <td className="px-6 py-4">
                <Select
                  value={task.status}
                  onValueChange={(value) =>
                    onUpdate(task.id, {
                      status: value as 'PENDING' | 'PROCESSING' | 'DONE',
                    })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {new Date(task.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4">
                <Button
                  onClick={() => onDelete(task.id)}
                  variant="destructive"
                  size="sm"
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
