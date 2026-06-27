"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { User, Users, Heart, Loader2 } from "lucide-react";
import { Button, Input, RadioGroup, Select } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [role, setRole] = useState("myself");
  const [gender, setGender] = useState("male");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [community, setCommunity] = useState("");
  const [subCommunity, setSubCommunity] = useState("");
  const [communityList, setCommunityList] = useState<string[]>([]);
  const [subCommunityMap, setSubCommunityMap] = useState<Record<string, string[]>>({});

  // Fetch communities from DB
  useEffect(() => {
    fetch("/api/communities")
      .then((res) => res.json())
      .then((data) => {
        setCommunityList(data.communities || []);
        setSubCommunityMap(data.subCommunities || {});
      })
      .catch(() => {});
  }, []);

  const ROLES = [
    { value: "myself", label: t.landing.myself, description: t.landing.myself },
    { value: "child", label: `${t.landing.son} / ${t.landing.daughter}`, description: t.landing.son },
    { value: "sibling", label: `${t.landing.brother} / ${t.landing.sister}`, description: t.landing.brother },
  ];
  const [step, setStep] = useState<"form" | "otp">("form");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Send OTP
  const handleSendOtp = useCallback(async () => {
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    if (!fullName.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (
      community &&
      community !== "no_community" &&
      subCommunityMap[community]?.length > 0 &&
      !subCommunity
    ) {
      setError("Please select a Sub-Community");
      return;
    }
    if (!termsAccepted) {
      setError("Please accept the Terms of Service and Privacy Policy");
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

      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setDemoOtp(data.demoOtp || "");
      setStep("otp");
      setCountdown(30);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [phone, fullName, community, subCommunity, termsAccepted]);

  // Resend OTP
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

  // Verify OTP
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
        body: JSON.stringify({
          phone,
          otp: code,
          context: "register",
          userData: {
            fullName,
            email,
            role,
            gender,
            community: community && community !== "no_community" ? community : "",
            subCommunity: community && community !== "no_community" ? subCommunity : "",
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Verification failed");

      // Sign in via NextAuth with the new userId
      const signInRes = await signIn("otp", {
        userId: data.userId,
        redirect: false,
      });
      if (signInRes?.error) throw new Error("Session creation failed");

      router.push("/onboarding/1");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [otp, phone, fullName, email, role, gender, community, subCommunity, router]);

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
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
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const maskedPhone = phone
    ? `+91 ${phone.replace(/\D/g, "").slice(0, 5).replace(/./g, "X")}${phone.replace(/\D/g, "").slice(-2)}`
    : "";

  return (
    <div className="w-full sm:max-w-[520px]">
      <div className="bg-white px-5 py-7 sm:rounded-[var(--radius-xl)] sm:border sm:border-neutral-200 sm:p-8 sm:shadow-sm">
        {step === "form" ? (
          <>
            <h1 className="text-2xl font-bold text-neutral-900">{t.auth.registerTitle}</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {t.auth.registerSubtitle}
            </p>

            <div className="mt-6">
              <RadioGroup
                label={t.auth.profileCreatedFor}
                options={ROLES}
                value={role}
                onValueChange={setRole}
                layout="cards"
              />
            </div>

            <div className="mt-6 space-y-4">
              <Input
                label={t.profile.fullName}
                placeholder={t.profile.fullName}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <RadioGroup
                label={t.auth.genderLabel}
                options={[
                  { value: "male", label: t.auth.male },
                  { value: "female", label: t.auth.female },
                ]}
                value={gender}
                onValueChange={setGender}
                layout="horizontal"
              />
              <Input
                label={t.auth.phoneLabel}
                type="tel"
                inputMode="numeric"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
              <p className="text-center text-xs text-neutral-400">{t.common.or}</p>
              <Input
                label={t.auth.emailLabel}
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Select
                label="Community"
                placeholder="Select Community"
                options={[
                  { value: "no_community", label: "No Community" },
                  ...communityList.map((c) => ({ value: c, label: c })),
                ]}
                value={community}
                onValueChange={(val) => {
                  setCommunity(val);
                  setSubCommunity("");
                }}
              />
              {community && community !== "no_community" && subCommunityMap[community] && (
                <Select
                  label="Sub-Community"
                  placeholder="Select Sub-Community"
                  options={subCommunityMap[community].map((sc) => ({ value: sc, label: sc }))}
                  value={subCommunity}
                  onValueChange={setSubCommunity}
                />
              )}
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>
            )}

            <div className="mt-6">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600" />
                <span className="text-xs text-neutral-500">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary-600 hover:underline">Terms of Service</Link> and{" "}
                  <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
                </span>
              </label>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="mt-6"
              disabled={loading}
              onClick={handleSendOtp}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending OTP...
                </span>
              ) : (
                t.auth.continueBtn
              )}
            </Button>

            <p className="mt-6 text-center text-sm text-neutral-500">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary-600 hover:underline">
                {t.auth.loginButton}
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-neutral-900">{t.auth.verifyOtp}</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Enter the 6-digit code sent to {maskedPhone}
            </p>

            {demoOtp && (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Demo Mode — No SMS sent</p>
                  <p className="text-sm text-amber-800 mt-0.5">
                    OTP: <span className="font-mono font-bold text-xl tracking-[0.3em]">{demoOtp}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const digits = demoOtp.split("");
                    setOtp(digits);
                    inputRefs.current[5]?.focus();
                  }}
                  className="self-start sm:self-center rounded-[var(--radius-md)] bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <div className="mt-6 flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
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
                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-[var(--radius-md)] border-[1.5px] border-neutral-300 bg-white text-center text-lg sm:text-xl font-bold text-neutral-800 focus:border-primary-500 focus:ring-[3px] focus:ring-primary-100 focus:outline-none"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            {error && (
              <p className="mt-3 text-center text-sm text-red-600 font-medium">{error}</p>
            )}

            <div className="mt-4 flex items-center justify-between text-sm">
              {countdown > 0 ? (
                <span className="text-neutral-400">
                  Resend OTP in 0:{countdown.toString().padStart(2, "0")}
                </span>
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
                onClick={() => { setStep("form"); setError(""); setDemoOtp(""); }}
                className="text-primary-600 font-medium hover:underline"
              >
                Change number
              </button>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="mt-8"
              disabled={loading || otp.join("").length !== 6}
              onClick={handleVerify}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify & Continue"
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
