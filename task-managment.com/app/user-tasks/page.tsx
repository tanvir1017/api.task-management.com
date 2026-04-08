"use client";

import { TaskList } from "@/components/task-list";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UserTasksPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  const handleGoBack = () => {
    router.push("/dashboard");
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Tasks</h1>
            <p className="text-gray-600 mt-1">
              View and manage your assigned tasks
            </p>
          </div>
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="gap-2"
            aria-label="Go back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <TaskList isAdmin={false} />
      </div>
    </div>
  );
}
