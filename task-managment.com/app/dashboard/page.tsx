"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === "SYSTEM_ADMIN" || user?.role === "ADMIN";

  return (
    <ProtectedRoute>
      <div className="flex-1 flex flex-col">
        <div className="border-b bg-white p-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin
              ? "Manage tasks and view system activity"
              : "View and update your assigned tasks"}
          </p>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Tasks</CardTitle>
                <CardDescription>System-wide</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-600">12</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">In Progress</CardTitle>
                <CardDescription>Active tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-yellow-600">5</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Completed</CardTitle>
                <CardDescription>Done tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">7</div>
              </CardContent>
            </Card>
          </div>

          {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/dashboard/profile" className="block">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start">
                      Edit Profile
                    </Button>
                  </Link>
                  <Link href="/dashboard/tasks" className="block">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start">
                      Manage Tasks
                    </Button>
                  </Link>
                  <Link href="/dashboard/audit-logs" className="block">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start">
                      View Audit Logs
                    </Button>
                  </Link>
                  <Link href="/dashboard/users" className="block">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start">
                      View Users
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}

          {!isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Your Tasks</CardTitle>
                <CardDescription>Tasks assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/user-tasks" className="block">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    View Your Tasks
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
