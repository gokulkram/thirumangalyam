"use client";

import { useState, useCallback } from "react";
import {
  Globe,
  Shield,
  Bell,
  Save,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Button,
  Switch,
  Badge,
} from "@/components/ui";
import { useAdminStore } from "@/store/admin-store";

export default function AdminSettingsPage() {
  const admin = useAdminStore((s) => s.admin);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [reportAlerts, setReportAlerts] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChangePassword = useCallback(async () => {
    if (!currentPw || !newPw) { setPwMsg({ type: "error", text: "Both fields are required" }); return; }
    if (newPw.length < 6) { setPwMsg({ type: "error", text: "Minimum 6 characters" }); return; }
    setPwLoading(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPwMsg({ type: "success", text: "Password changed successfully!" });
      setCurrentPw("");
      setNewPw("");
    } catch (err: any) {
      setPwMsg({ type: "error", text: err.message });
    } finally {
      setPwLoading(false);
    }
  }, [currentPw, newPw]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Configure your admin panel and site settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* Site Configuration */}
        <Card variant="flat" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-rose-500" />
              Site Configuration
            </CardTitle>
            <CardDescription>General application settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-md">
              <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800">Coming Soon</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Site-wide configuration (app name, maintenance mode) is not yet available.
                  These settings will be supported once a server-side settings API is implemented.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Account */}
        <Card variant="flat" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-rose-500" />
              Admin Account
            </CardTitle>
            <CardDescription>Your admin profile details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-md">
              <Input label="Name" value={admin.name} readOnly />
              <Input label="Email" value={admin.email} readOnly />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-600">Role:</span>
                <Badge variant="primary" size="md">
                  {admin.role.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-600">Last Login:</span>
                <span className="text-sm text-neutral-700">
                  {new Date(admin.lastLogin).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full space-y-3">
              <Button variant="ghost" size="sm" onClick={() => setShowChangePassword(!showChangePassword)}>
                {showChangePassword ? "Cancel" : "Change Password"}
              </Button>
              {showChangePassword && (
                <div className="space-y-3 max-w-md">
                  <Input
                    label="Current Password"
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Minimum 6 characters"
                  />
                  {pwMsg && (
                    <p className={`text-sm font-medium ${pwMsg.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                      {pwMsg.text}
                    </p>
                  )}
                  <Button size="sm" disabled={pwLoading} onClick={handleChangePassword} className="bg-rose-600 hover:bg-rose-700">
                    {pwLoading ? "Changing..." : "Update Password"}
                  </Button>
                </div>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Notifications */}
        <Card variant="flat" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-rose-500" />
              Notifications
            </CardTitle>
            <CardDescription>Configure alert preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-w-md">
              <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-neutral-200 p-4">
                <div>
                  <p className="text-sm font-medium text-neutral-900">Email Notifications</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Receive daily summary emails
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-neutral-200 p-4">
                <div>
                  <p className="text-sm font-medium text-neutral-900">Report Alerts</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Instant alerts for new user reports
                  </p>
                </div>
                <Switch
                  checked={reportAlerts}
                  onCheckedChange={setReportAlerts}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => {
                localStorage.setItem("admin_notifications", JSON.stringify({ emailNotifications, reportAlerts }));
                setSaveMsg("Notification preferences saved!");
                setTimeout(() => setSaveMsg(""), 2000);
              }}
            >
              <Save className="h-4 w-4" />
              Save Preferences
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
