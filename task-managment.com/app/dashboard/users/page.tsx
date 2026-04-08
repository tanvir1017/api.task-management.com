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
import { getAllUsers } from "@/lib/api-client";
import type { User } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldUser,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 10;

const ROLE_FILTERS: Array<{ value: "ALL" | User["role"]; label: string }> = [
  { value: "ALL", label: "All roles" },
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Admin" },
  { value: "SYSTEM_ADMIN", label: "System Admin" },
];

const STATUS_FILTERS: Array<{
  value: "ALL" | "true" | "false";
  label: string;
}> = [
  { value: "ALL", label: "All statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Disabled" },
];

function getRoleVariant(role: User["role"]) {
  if (role === "SYSTEM_ADMIN") {
    return "default";
  }

  if (role === "ADMIN") {
    return "secondary";
  }

  return "outline";
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | User["role"]>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "true" | "false">(
    "ALL",
  );

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        const response = await getAllUsers({
          search: searchQuery.trim() || undefined,
          role: roleFilter === "ALL" ? undefined : roleFilter,
          isActive: statusFilter === "ALL" ? undefined : statusFilter,
          page,
          limit: PAGE_SIZE,
        });

        if (active) {
          setUsers(response.result);
          setTotal(response.meta.total);
          setTotalPages(response.meta.totalPages);

          if (response.meta.total > 0 && page > response.meta.totalPages) {
            setPage(response.meta.totalPages);
          }
        }
      } catch (error) {
        if (!active) {
          return;
        }

        toast.error(
          error instanceof Error ? error.message : "Failed to load users",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      active = false;
    };
  }, [page, roleFilter, searchQuery, statusFilter]);

  const applySearch = () => {
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setPage(1);
  };

  const stats = useMemo(() => {
    return {
      total,
      active: users.filter((user) => user.isActive).length,
      admins: users.filter((user) => user.role !== "USER").length,
    };
  }, [total, users]);

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SYSTEM_ADMIN"]}>
      <div className="min-h-full bg-linear-to-br from-slate-50 via-white to-emerald-50">
        <div className="border-b bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6 py-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Users
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              All registered accounts in the system.
            </p>
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
                      placeholder="Search users by name, username, or email"
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
                    value={roleFilter}
                    onValueChange={(value) => {
                      setRoleFilter(value as "ALL" | User["role"]);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full lg:w-44">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_FILTERS.map((roleOption) => (
                        <SelectItem
                          key={roleOption.value}
                          value={roleOption.value}
                        >
                          {roleOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value as "ALL" | "true" | "false");
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full lg:w-44">
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
                <CardDescription>Total users</CardDescription>
                <CardTitle className="text-3xl">{stats.total}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="h-4 w-4" /> Account count
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active users</CardDescription>
                <CardTitle className="text-3xl">{stats.active}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-sm text-slate-600">
                <UserCheck className="h-4 w-4" /> Currently enabled
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Admins</CardDescription>
                <CardTitle className="text-3xl">{stats.admins}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-sm text-slate-600">
                <ShieldUser className="h-4 w-4" /> Elevated access
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-slate-50/80">
              <CardTitle>User Directory</CardTitle>
              <CardDescription>
                Loaded from the admin user endpoint.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-10 text-center text-slate-500"
                        >
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-10 text-center text-slate-500"
                        >
                          No users found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium text-slate-900">
                            {user.fullName || user.username}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleVariant(user.role)}>
                              {user.role.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.isActive ? "secondary" : "destructive"
                              }
                            >
                              {user.isActive ? "Active" : "Disabled"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            <Button
              variant="outline"
              onClick={() =>
                setPage((currentPage) => Math.max(1, currentPage - 1))
              }
              disabled={page === 1 || loading}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((currentPage) => currentPage + 1)}
              disabled={page >= totalPages || loading}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
