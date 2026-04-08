"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isAdmin = user?.role === "ADMIN" || user?.role === "SYSTEM_ADMIN";

  return (
    <aside className="w-64 bg-white shadow-md flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-blue-600">Task Manager</h2>
        <p className="text-sm text-gray-600 mt-2">{user?.name}</p>
        <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
          {user?.role}
        </p>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-blue-50 hover:text-blue-600"
            >
              Dashboard
            </Button>
          </Link>

          <Link href="/dashboard/profile">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-blue-50 hover:text-blue-600"
            >
              Profile
            </Button>
          </Link>

          {isAdmin && (
            <>
              <Link href="/dashboard/tasks">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  Tasks
                </Button>
              </Link>
              <Link href="/dashboard/audit-logs">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  Audit Logs
                </Button>
              </Link>
              <Link href="/dashboard/users">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  Users
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="p-4 border-t">
        <Button
          onClick={handleLogout}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Logout
        </Button>
      </div>
    </aside>
  );
}
