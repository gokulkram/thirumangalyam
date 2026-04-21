"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button, Input, Card, Switch, Tabs, TabsList, TabsTrigger, TabsContent, RadioGroup, Badge } from "@/components/ui";
import { User, Shield, Bell, CreditCard, AlertTriangle, LogOut, Loader2, Crown, CheckCircle, Clock, Calendar, Receipt, Mail, KeyRound } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  premium_3: "Premium · 3 Months",
  premium_6: "Premium · 6 Months",
  premium_12: "Premium · 12 Months",
};

function daysLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showBlocked, setShowBlocked] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<{ id: string; blockedUserId: string; fullName: string; primaryPhotoUrl: string }[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Account data from DB
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState("free");
  const [profileComplete, setProfileComplete] = useState(0);
  const [primaryPhotoUrl, setPrimaryPhotoUrl] = useState("");

  // Email verification
  const [emailVerifyStep, setEmailVerifyStep] = useState<"idle" | "sent" | "verified">("idle");
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState("");
  const [emailOtpValue, setEmailOtpValue] = useState("");
  const [emailDemoOtp, setEmailDemoOtp] = useState("");
  const [emailOtpCountdown, setEmailOtpCountdown] = useState(0);

  // Subscription
  const [subLoading, setSubLoading] = useState(true);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [subHistory, setSubHistory] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profiles/me");
        if (!res.ok) return;
        const data = await res.json();
        const u = data.user || {};
        const p = data.profile || {};

        setFullName(p.fullName || "");
        setPhone(u.phone || "");
        setEmail(u.email || "");
        setPlan(u.plan || "free");
        setProfileComplete(u.profileComplete || 0);

        const primary = (p.photos || []).find((ph: any) => ph.isPrimary) || (p.photos || [])[0];
        setPrimaryPhotoUrl(primary?.url || "");
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchSubscription() {
      try {
        const res = await fetch("/api/subscription/me");
        if (!res.ok) return;
        const data = await res.json();
        setActiveSub(data.active || null);
        setSubHistory(data.history || []);
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
      } finally {
        setSubLoading(false);
      }
    }

    fetchProfile();
    fetchSubscription();
  }, []);

  useEffect(() => {
    if (emailOtpCountdown <= 0) return;
    const timer = setTimeout(() => setEmailOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [emailOtpCountdown]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profiles/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          ...(password && password.length >= 6 && { password }),
        }),
      });
      if (res.ok) {
        setSaved(true);
        setPassword(""); // Clear password field after save
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = useCallback(async () => {
    if (!confirm("Are you sure you want to deactivate your profile? You can reactivate anytime by logging in.")) return;
    setDeactivating(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deactivate" }),
      });
      if (!res.ok) throw new Error("Failed to deactivate");
      await signOut({ callbackUrl: "/login" });
    } catch (err) {
      console.error("Deactivation error:", err);
      setDeactivating(false);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!confirm("Are you sure? This will permanently delete your account and all your data. This action cannot be undone.")) return;
    if (!confirm("FINAL WARNING: All your matches, conversations, and profile data will be permanently removed. Proceed?")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      await signOut({ callbackUrl: "/login" });
    } catch (err) {
      console.error("Deletion error:", err);
      setDeleting(false);
    }
  }, []);

  // Mask phone for display: show first 4 and last 2
  const maskedPhone = phone
    ? phone.slice(0, 4) + "XXXXX" + phone.slice(-2)
    : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">{t.settings.title}</h1>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account"><User className="h-4 w-4" /> {t.settings.accountTab}</TabsTrigger>
          <TabsTrigger value="privacy"><Shield className="h-4 w-4" /> {t.settings.privacyTab}</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4" /> {t.settings.notificationsTab}</TabsTrigger>
          <TabsTrigger value="subscription"><CreditCard className="h-4 w-4" /> {t.settings.subscriptionTab}</TabsTrigger>
        </TabsList>

        {/* Account */}
        <TabsContent value="account">
          <Card variant="flat" padding="lg" className="space-y-6">
            <div className="flex items-center gap-4">
              {primaryPhotoUrl ? (
                <img src={primaryPhotoUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-neutral-200 flex items-center justify-center text-xl font-bold text-neutral-400">
                  {fullName.charAt(0) || "?"}
                </div>
              )}
              <Button variant="secondary" size="sm" asChild>
                <Link href="/profile/me">{t.settings.changePhoto}</Link>
              </Button>
            </div>
            <Input
              label={t.profile.fullName}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label={t.settings.phone}
              value={maskedPhone}
              disabled
              hint={t.profile.contactSupport}
            />
            {/* Email with verification */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                {t.settings.email}
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailVerifyStep("idle");
                    setEmailOtpValue("");
                    setEmailOtpError("");
                    setEmailDemoOtp("");
                  }}
                  placeholder="your@email.com"
                  className="flex-1 rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:ring-[3px] focus:ring-primary-100 focus:outline-none"
                />
                {emailVerifyStep !== "verified" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={emailOtpLoading || !email || emailVerifyStep === "sent"}
                    onClick={async () => {
                      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                        setEmailOtpError("Enter a valid email address first");
                        return;
                      }
                      setEmailOtpLoading(true);
                      setEmailOtpError("");
                      try {
                        const res = await fetch("/api/email-otp/send", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || "Failed to send code");
                        setEmailDemoOtp(data.demoOtp || "");
                        setEmailVerifyStep("sent");
                        setEmailOtpCountdown(30);
                        setEmailOtpValue("");
                      } catch (err: any) {
                        setEmailOtpError(err.message);
                      } finally {
                        setEmailOtpLoading(false);
                      }
                    }}
                  >
                    {emailOtpLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                    {emailVerifyStep === "sent" ? "Resend" : "Verify"}
                  </Button>
                )}
                {emailVerifyStep === "verified" && (
                  <div className="flex items-center gap-1 text-sm text-green-600 font-medium px-2">
                    <CheckCircle className="h-4 w-4" /> Verified
                  </div>
                )}
              </div>

              {/* OTP entry panel */}
              {emailVerifyStep === "sent" && (
                <div className="mt-3 rounded-[var(--radius-md)] border border-neutral-200 bg-neutral-50 p-4 space-y-3">
                  {emailDemoOtp && (
                    <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2">
                      <div>
                        <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">Demo Mode — No email sent</p>
                        <p className="text-sm text-amber-800 mt-0.5">
                          Code: <span className="font-mono font-bold tracking-widest">{emailDemoOtp}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEmailOtpValue(emailDemoOtp)}
                        className="ml-2 rounded-[var(--radius-md)] bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                      >
                        Auto-fill
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-neutral-400 shrink-0" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      value={emailOtpValue}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setEmailOtpValue(v);
                        setEmailOtpError("");
                      }}
                      className="flex-1 rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 py-2 text-sm font-mono tracking-widest focus:border-primary-500 focus:ring-[3px] focus:ring-primary-100 focus:outline-none"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={emailOtpLoading || emailOtpValue.length !== 6}
                      onClick={async () => {
                        setEmailOtpLoading(true);
                        setEmailOtpError("");
                        try {
                          const res = await fetch("/api/email-otp/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ otp: emailOtpValue }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Verification failed");
                          setEmailVerifyStep("verified");
                          setEmailDemoOtp("");
                          if (data.email) setEmail(data.email);
                        } catch (err: any) {
                          setEmailOtpError(err.message);
                        } finally {
                          setEmailOtpLoading(false);
                        }
                      }}
                    >
                      {emailOtpLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm"}
                    </Button>
                  </div>

                  {emailOtpError && (
                    <p className="text-xs text-red-600 font-medium">{emailOtpError}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    {emailOtpCountdown > 0 ? (
                      <span>Resend in 0:{emailOtpCountdown.toString().padStart(2, "0")}</span>
                    ) : (
                      <button
                        type="button"
                        disabled={emailOtpLoading}
                        className="text-primary-600 font-medium hover:underline disabled:opacity-50"
                        onClick={async () => {
                          setEmailOtpLoading(true);
                          setEmailOtpError("");
                          try {
                            const res = await fetch("/api/email-otp/send", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email }),
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error);
                            if (data.demoOtp) setEmailDemoOtp(data.demoOtp);
                            setEmailOtpCountdown(30);
                            setEmailOtpValue("");
                          } catch (err: any) {
                            setEmailOtpError(err.message);
                          } finally {
                            setEmailOtpLoading(false);
                          }
                        }}
                      >
                        Resend code
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEmailVerifyStep("idle");
                        setEmailOtpValue("");
                        setEmailOtpError("");
                        setEmailDemoOtp("");
                      }}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {emailOtpError && emailVerifyStep === "idle" && (
                <p className="mt-1 text-xs text-red-600 font-medium">{emailOtpError}</p>
              )}
            </div>
            <Input
              label={t.settings.password}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
            />
            {saved && <p className="text-sm text-success font-medium">Settings saved!</p>}
            <Button variant="primary" size="md" disabled={saving} onClick={handleSave}>
              {saving ? "Saving..." : t.common.save}
            </Button>
          </Card>

          <Card variant="flat" padding="lg" className="mt-6">
            <h3 className="text-base font-semibold text-neutral-900 mb-4">{t.settings.linkedParent}</h3>
            <p className="text-sm text-neutral-500">{t.settings.noParentLinked}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              disabled={inviteLoading}
              onClick={async () => {
                setInviteLoading(true);
                try {
                  const res = await fetch("/api/invite-parent", { method: "POST" });
                  if (!res.ok) throw new Error("Failed to generate invite");
                  const data = await res.json();
                  setInviteLink(data.inviteLink);
                } catch (err) {
                  console.error("Invite error:", err);
                } finally {
                  setInviteLoading(false);
                }
              }}
            >
              {inviteLoading ? "Generating..." : t.settings.inviteParent}
            </Button>
            {inviteLink && (
              <div className="mt-3 rounded-[var(--radius-md)] border border-neutral-200 bg-neutral-50 p-3">
                <p className="text-xs text-neutral-500 mb-1">Share this link with your parent/guardian:</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={inviteLink}
                    className="flex-1 rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-700"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink);
                      setInviteCopied(true);
                      setTimeout(() => setInviteCopied(false), 2000);
                    }}
                  >
                    {inviteCopied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <p className="text-xs text-neutral-400 mt-1">Link expires in 7 days.</p>
              </div>
            )}
          </Card>

          <Card variant="flat" padding="lg" className="mt-6 border-error/20">
            <h3 className="text-base font-semibold text-error flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {t.settings.dangerZone}
            </h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="ghost" size="sm" disabled={deactivating} onClick={handleDeactivate}>
                {deactivating ? "Deactivating..." : t.settings.deactivateProfile}
              </Button>
              <Button variant="destructive" size="sm" disabled={deleting} onClick={handleDelete}>
                {deleting ? "Deleting..." : t.settings.deleteAccount}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Privacy */}
        <TabsContent value="privacy">
          <Card variant="flat" padding="lg" className="space-y-6">
            <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-800">Coming soon — Privacy settings are not yet active. Changes here will not be saved.</p>
            </div>
            <fieldset disabled className="space-y-6 opacity-60">
            <RadioGroup
              label={t.settings.profileVisibility}
              options={[
                { value: "all", label: t.settings.visibleAll },
                { value: "premium", label: t.settings.visiblePremium },
                { value: "hidden", label: t.settings.visibleHidden },
              ]}
              defaultValue="all"
            />

            <RadioGroup
              label={t.settings.photoPrivacy}
              options={[
                { value: "all", label: t.settings.photoAll },
                { value: "accepted", label: t.settings.photoAccepted },
                { value: "protected", label: t.settings.photoProtected },
              ]}
              defaultValue="all"
            />

            <Switch
              label={t.settings.showContact}
              defaultChecked
            />
            <Switch
              label={t.settings.showHoroscope}
              defaultChecked
            />
            <Switch
              label={t.settings.showOnline}
              defaultChecked
            />
            </fieldset>

            <div>
              <Button
                variant="ghost"
                size="sm"
                disabled={loadingBlocked}
                onClick={async () => {
                  if (showBlocked) { setShowBlocked(false); return; }
                  setLoadingBlocked(true);
                  try {
                    const res = await fetch("/api/block");
                    if (res.ok) {
                      const data = await res.json();
                      setBlockedUsers(data.blocked || []);
                    }
                  } catch (err) {
                    console.error("Failed to fetch blocked users:", err);
                  } finally {
                    setLoadingBlocked(false);
                    setShowBlocked(true);
                  }
                }}
              >
                {loadingBlocked ? "Loading..." : t.settings.manageBlocked}
              </Button>
              {showBlocked && (
                <div className="mt-3 space-y-2">
                  {blockedUsers.length === 0 ? (
                    <p className="text-sm text-neutral-500">No blocked users. You can block users from their profile page.</p>
                  ) : (
                    blockedUsers.map((bu) => (
                      <div key={bu.id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-neutral-200 px-3 py-2">
                        <div className="flex items-center gap-3">
                          {bu.primaryPhotoUrl ? (
                            <img src={bu.primaryPhotoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-400">
                              {bu.fullName.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm font-medium text-neutral-800">{bu.fullName}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              await fetch("/api/block", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ blockedUserId: bu.blockedUserId }),
                              });
                              setBlockedUsers((prev) => prev.filter((b) => b.id !== bu.id));
                            } catch (err) {
                              console.error("Unblock error:", err);
                            }
                          }}
                        >
                          Unblock
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
            <p className="text-sm font-medium text-amber-800">Coming soon — Notification preferences are not yet active. Changes here will not be saved.</p>
          </div>
          <Card variant="flat" padding="lg" className="space-y-2">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">{t.settings.emailNotifications}</h3>
            <fieldset disabled className="space-y-2 opacity-60">
            <Switch label={t.settings.newMatches} defaultChecked />
            <Switch label={t.settings.interestsReceived} defaultChecked />
            <Switch label={t.settings.interestAccepted} defaultChecked />
            <Switch label={t.settings.newMessages} defaultChecked />
            <Switch label={t.settings.profileViews} />
            <Switch label={t.settings.weeklyDigest} defaultChecked />
            </fieldset>
          </Card>

          <Card variant="flat" padding="lg" className="mt-6 space-y-2">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">{t.settings.pushNotifications}</h3>
            <fieldset disabled className="space-y-2 opacity-60">
            <Switch label={t.nav.interests} defaultChecked />
            <Switch label={t.nav.messages} defaultChecked />
            <Switch label={t.settings.matchAlerts} defaultChecked />
            </fieldset>
          </Card>
        </TabsContent>

        {/* Subscription */}
        <TabsContent value="subscription">
          {subLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-500">Manage your membership and view full order history</p>
                <Button variant="secondary" size="sm" asChild>
                  <Link href="/subscription">View All Orders</Link>
                </Button>
              </div>
              {/* Active membership card */}
              {activeSub ? (
                <Card variant="flat" padding="lg" className="border-primary-200 bg-gradient-to-br from-primary-50 to-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-primary-100 flex items-center justify-center">
                        <Crown className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-xs text-primary-600 font-semibold uppercase tracking-wider">Active Membership</p>
                        <p className="text-lg font-bold text-neutral-900">{PLAN_LABELS[activeSub.plan] || activeSub.plan}</p>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">Active</Badge>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-[var(--radius-md)] bg-white border border-primary-100 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                        <Calendar className="h-3.5 w-3.5" /> Started
                      </div>
                      <p className="text-sm font-semibold text-neutral-800">{fmt(activeSub.startDate)}</p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-white border border-primary-100 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                        <Calendar className="h-3.5 w-3.5" /> Expires
                      </div>
                      <p className="text-sm font-semibold text-neutral-800">{fmt(activeSub.endDate)}</p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-white border border-primary-100 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                        <Clock className="h-3.5 w-3.5" /> Days Left
                      </div>
                      <p className="text-sm font-semibold text-neutral-800" suppressHydrationWarning>{mounted ? `${daysLeft(activeSub.endDate)} days` : "—"}</p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-white border border-primary-100 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                        <CreditCard className="h-3.5 w-3.5" /> Paid
                      </div>
                      <p className="text-sm font-semibold text-neutral-800">₹{activeSub.amount?.toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Unlimited daily matches
                    </div>
                    <div className="flex items-center gap-2 text-neutral-600">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Direct chat with matches
                    </div>
                    <div className="flex items-center gap-2 text-neutral-600">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> View contact details
                    </div>
                    <div className="flex items-center gap-2 text-neutral-600">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Detailed horoscope match
                    </div>
                    <div className="flex items-center gap-2 text-neutral-600">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> See who viewed you
                    </div>
                    <div className="flex items-center gap-2 text-neutral-600">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Priority support
                    </div>
                  </div>

                  {mounted && daysLeft(activeSub.endDate) <= 30 && (
                    <div className="mt-4 rounded-[var(--radius-md)] bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                      Your membership expires in <strong suppressHydrationWarning>{daysLeft(activeSub.endDate)} days</strong>. Renew to keep access.
                      <Button variant="premium" size="sm" className="mt-2 w-full" asChild>
                        <Link href="/premium">Renew Membership</Link>
                      </Button>
                    </div>
                  )}
                </Card>
              ) : (
                <Card variant="flat" padding="lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-11 w-11 rounded-full bg-neutral-100 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-neutral-400" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Current Plan</p>
                      <p className="text-lg font-bold text-neutral-900">Free Plan</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                    <div>
                      <p className="text-neutral-500">Daily Matches</p>
                      <p className="font-medium text-neutral-800">10 / day</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Express Interest</p>
                      <p className="font-medium text-neutral-800">5 / day</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Chat Access</p>
                      <p className="font-medium text-error">Not available</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Contact Details</p>
                      <p className="font-medium text-error">Hidden</p>
                    </div>
                  </div>
                  <Button variant="premium" size="md" fullWidth asChild>
                    <Link href="/premium">Upgrade to Premium</Link>
                  </Button>
                </Card>
              )}

              {/* Payment history */}
              {subHistory.length > 0 && (
                <Card variant="flat" padding="lg">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                    <Receipt className="h-4 w-4" /> Payment History
                  </h3>
                  <div className="space-y-2">
                    {subHistory.map((sub: any) => (
                      <div key={sub._id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-neutral-100 bg-neutral-50 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-neutral-800">{PLAN_LABELS[sub.plan] || sub.plan}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {fmt(sub.startDate)} → {fmt(sub.endDate)} &middot; {sub.paymentMethod || "Razorpay"}
                          </p>
                          {sub.razorpayPaymentId && (
                            <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">{sub.razorpayPaymentId}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-sm font-bold text-neutral-900">₹{sub.amount?.toLocaleString("en-IN")}</p>
                          <Badge
                            variant={sub.status === "active" ? "success" : sub.status === "expired" ? "outline" : "error"}
                            size="sm"
                            className="mt-1"
                          >
                            {sub.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Logout */}
      <Card variant="flat" padding="lg">
        <Button
          variant="destructive"
          size="lg"
          fullWidth
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          {t.nav.logout}
        </Button>
      </Card>
    </div>
  );
}
