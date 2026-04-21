"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button, Input } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotStep, setForgotStep] = useState<"idle" | "phone" | "otp" | "newpass" | "done">("idle");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotOtp, setForgotOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotCountdown, setForgotCountdown] = useState(0);
  const forgotInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [showOtp, setShowOtp] = useState(false);
  const [otpStep, setOtpStep] = useState<"phone" | "verify">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [demoOtp, setDemoOtp] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (forgotCountdown <= 0) return;
    const t = setTimeout(() => setForgotCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [forgotCountdown]);

  // Send OTP for login
  const handleSendOtp = useCallback(async () => {
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      setDemoOtp(data.demoOtp || "");
      setOtpStep("verify");
      setCountdown(30);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [phone]);

  // Verify OTP and login
  const handleVerify = useCallback(async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: code, context: "login" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      // Sign in via NextAuth with the verified userId
      const signInRes = await signIn("otp", {
        userId: data.userId,
        redirect: false,
      });
      if (signInRes?.error) throw new Error("Session creation failed");

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [otp, phone, router]);

  // Resend
  const handleResend = useCallback(async () => {
    if (countdown > 0) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/otp/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend");
      if (data.demoOtp) setDemoOtp(data.demoOtp);
      setCountdown(30);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [phone, countdown]);

  // Forgot password — Step 1: Show phone input
  const handleForgotPassword = useCallback(() => {
    setForgotStep("phone");
    setForgotPhone(identifier || "");
    setError("");
  }, [identifier]);

  // Forgot password — Step 2: Send OTP to phone
  const handleForgotSendOtp = useCallback(async () => {
    if (!forgotPhone || forgotPhone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: forgotPhone, action: "send" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setForgotStep("otp");
      setForgotCountdown(30);
      setForgotOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [forgotPhone]);

  // Forgot password — Step 3: Verify OTP & set new password
  const handleForgotReset = useCallback(async () => {
    const code = forgotOtp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: forgotPhone,
          otp: code,
          newPassword,
          action: "reset",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setForgotStep("done");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [forgotOtp, forgotPhone, newPassword, confirmPassword]);

  // Forgot password OTP input handlers
  const handleForgotOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...forgotOtp];
    updated[index] = value.slice(-1);
    setForgotOtp(updated);
    if (value && index < 5) forgotInputRefs.current[index + 1]?.focus();
  };

  const handleForgotOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !forgotOtp[index] && index > 0) {
      forgotInputRefs.current[index - 1]?.focus();
    }
  };

  const handleForgotOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const updated = [...forgotOtp];
    for (let i = 0; i < pasted.length; i++) updated[i] = pasted[i];
    setForgotOtp(updated);
    forgotInputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="w-full max-w-[520px]">
      <div className="rounded-[var(--radius-xl)] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-neutral-900">{t.auth.loginTitle}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t.auth.loginSubtitle}</p>

        {/* Password login */}
        {!showOtp && (
          <>
            <div className="mt-6 space-y-4">
              <Input
                label={t.auth.phoneOrEmail}
                placeholder={t.auth.phoneOrEmail}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
              <Input
                label={t.auth.passwordLabel}
                type="password"
                placeholder={t.auth.passwordLabel}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="mt-3 text-right">
              <button
                onClick={handleForgotPassword}
                className="text-sm font-medium text-primary-600 hover:underline"
              >
                {t.auth.forgotPassword}
              </button>
            </div>

            {error && !showOtp && forgotStep === "idle" && (
              <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="mt-6"
              disabled={loading}
              onClick={async () => {
                if (!identifier || !password) {
                  setError("Please enter your phone/email and password");
                  return;
                }
                setLoading(true);
                setError("");
                try {
                  const res = await signIn("credentials", {
                    identifier,
                    password,
                    redirect: false,
                  });
                  if (res?.error) {
                    setError("Invalid credentials. Please try again.");
                    setLoading(false);
                  } else {
                    router.push("/dashboard");
                  }
                } catch (err) {
                  setError("Network error. Please check your connection and try again.");
                  setLoading(false);
                }
              }}
            >
              {loading && !showOtp ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging in...
                </span>
              ) : (
                t.auth.loginButton
              )}
            </Button>
          </>
        )}

        {/* OTP login */}
        {showOtp && otpStep === "phone" && (
          <div className="mt-6 space-y-4">
            <Input
              label="Phone number"
              type="tel"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
              onClick={handleSendOtp}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending OTP...
                </span>
              ) : (
                "Send OTP"
              )}
            </Button>
          </div>
        )}

        {showOtp && otpStep === "verify" && (
          <div className="mt-6">
            <p className="text-sm text-neutral-500 mb-4">
              Enter the 6-digit code sent to +91 XXXXX{phone.replace(/\D/g, "").slice(-2)}
            </p>

            {demoOtp && (
              <div className="mb-4 flex items-center justify-between rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Demo Mode — No SMS sent</p>
                  <p className="text-sm text-amber-800 mt-0.5">
                    Your OTP is: <span className="font-mono font-bold text-lg tracking-widest">{demoOtp}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const digits = demoOtp.split("");
                    setOtp(digits);
                    inputRefs.current[5]?.focus();
                  }}
                  className="ml-3 rounded-[var(--radius-md)] bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="h-12 w-12 rounded-[var(--radius-md)] border-[1.5px] border-neutral-300 bg-white text-center text-xl font-bold text-neutral-800 focus:border-primary-500 focus:ring-[3px] focus:ring-primary-100 focus:outline-none"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            {error && <p className="mt-3 text-center text-sm text-red-600 font-medium">{error}</p>}

            <div className="mt-4 flex items-center justify-between text-sm">
              {countdown > 0 ? (
                <span className="text-neutral-400">Resend in 0:{countdown.toString().padStart(2, "0")}</span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="text-primary-600 font-medium hover:underline disabled:opacity-50"
                >
                  {t.auth.resendOtp}
                </button>
              )}
              <button
                onClick={() => { setOtpStep("phone"); setError(""); setDemoOtp(""); }}
                className="text-primary-600 font-medium hover:underline"
              >
                Change number
              </button>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="mt-6"
              disabled={loading || otp.join("").length !== 6}
              onClick={handleVerify}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify & Login"
              )}
            </Button>
          </div>
        )}

        {/* Forgot Password Flow */}
        {forgotStep !== "idle" && forgotStep !== "done" && (
          <div className="mt-6 rounded-[var(--radius-lg)] border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-800">Reset Password</h3>
              <button
                onClick={() => { setForgotStep("idle"); setError(""); }}
                className="text-xs text-neutral-400 hover:text-neutral-600"
              >
                Cancel
              </button>
            </div>

            {/* Step: Enter phone */}
            {forgotStep === "phone" && (
              <div className="space-y-3">
                <Input
                  label="Registered phone number"
                  type="tel"
                  placeholder="98765 43210"
                  value={forgotPhone}
                  onChange={(e) => setForgotPhone(e.target.value)}
                />
                {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
                <Button variant="primary" size="md" fullWidth disabled={loading} onClick={handleForgotSendOtp}>
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending OTP...
                    </span>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </div>
            )}

            {/* Step: Enter OTP + new password */}
            {forgotStep === "otp" && (
              <div className="space-y-4">
                <p className="text-xs text-neutral-500">
                  Enter the 6-digit code sent to +91 XXXXX{forgotPhone.replace(/\D/g, "").slice(-2)}
                </p>
                <div className="flex justify-center gap-2" onPaste={handleForgotOtpPaste}>
                  {forgotOtp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { forgotInputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleForgotOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleForgotOtpKeyDown(i, e)}
                      className="h-10 w-10 rounded-[var(--radius-md)] border-[1.5px] border-neutral-300 bg-white text-center text-lg font-bold text-neutral-800 focus:border-primary-500 focus:ring-[3px] focus:ring-primary-100 focus:outline-none"
                      aria-label={`Reset digit ${i + 1}`}
                    />
                  ))}
                </div>
                <div className="text-center text-xs">
                  {forgotCountdown > 0 ? (
                    <span className="text-neutral-400">Resend in 0:{forgotCountdown.toString().padStart(2, "0")}</span>
                  ) : (
                    <button onClick={handleForgotSendOtp} disabled={loading} className="text-primary-600 font-medium hover:underline">
                      Resend OTP
                    </button>
                  )}
                </div>

                {forgotOtp.join("").length === 6 && (
                  <>
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Input
                      label="Confirm Password"
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </>
                )}

                {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                <Button variant="primary" size="md" fullWidth disabled={loading || forgotOtp.join("").length !== 6} onClick={handleForgotReset}>
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Resetting...
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {forgotStep === "done" && (
          <div className="mt-6 rounded-[var(--radius-lg)] border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-sm font-semibold text-green-700">Password reset successfully!</p>
            <p className="text-xs text-green-600 mt-1">You can now login with your new password.</p>
            <button
              onClick={() => { setForgotStep("idle"); setNewPassword(""); setConfirmPassword(""); }}
              className="mt-2 text-sm font-medium text-primary-600 hover:underline"
            >
              Back to Login
            </button>
          </div>
        )}

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 border-t border-neutral-200" />
          <span className="text-xs text-neutral-400">{t.common.or}</span>
          <div className="flex-1 border-t border-neutral-200" />
        </div>

        <Button
          variant="ghost"
          size="md"
          fullWidth
          className="mt-4"
          onClick={() => {
            setShowOtp(!showOtp);
            setOtpStep("phone");
            setError("");
          }}
        >
          {showOtp ? "Login with Password" : t.auth.otpLogin}
        </Button>

        <p className="mt-6 text-center text-sm text-neutral-500">
          {t.auth.noAccount}{" "}
          <Link href="/register" className="font-medium text-primary-600 hover:underline">
            {t.auth.registerNow}
          </Link>
        </p>
      </div>
    </div>
  );
}
