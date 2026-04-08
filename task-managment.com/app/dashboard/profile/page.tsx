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
import { Input } from "@/components/ui/input";
import { useAuth, type UserRole } from "@/contexts/auth-context";
import { getCurrentUser, updateCurrentUser } from "@/lib/api-client";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const profile = await getCurrentUser();

        if (!active) {
          return;
        }

        setEmail(profile.email);
        setUsername(profile.username);
        setFullName(profile.fullName ?? "");
      } catch (error) {
        if (!active) {
          return;
        }

        toast.error(
          error instanceof Error ? error.message : "Failed to load profile",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [toast]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const profile = await updateCurrentUser({
        email,
        username,
        fullName,
      });

      updateUser({
        id: String(profile.id),
        email: profile.email,
        role: profile.role as UserRole,
        name: profile.fullName || profile.username,
      });

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-full bg-linear-to-br from-slate-50 via-white to-indigo-50">
        <div className="border-b bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl px-6 py-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Profile
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Update the account details used across the dashboard.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-6 py-6">
          <Card>
            <CardHeader>
              <CardTitle>Account details</CardTitle>
              <CardDescription>
                {user?.name
                  ? `Signed in as ${user.name}`
                  : "Edit your profile information."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2 py-8 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading profile...
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-slate-700"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="username"
                      className="text-sm font-medium text-slate-700"
                    >
                      Username
                    </label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="your-username"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="fullName"
                      className="text-sm font-medium text-slate-700"
                    >
                      Full name
                    </label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="flex justify-end border-t pt-4">
                    <Button type="submit" disabled={saving} className="gap-2">
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save changes
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
