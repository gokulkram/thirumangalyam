"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Badge, Card } from "@/components/ui";
import { PREMIUM_PLANS } from "@/lib/constants";
import { createOrder, verifyPayment, loadRazorpayScript } from "@/lib/razorpay";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Shield,
  CreditCard,
  Smartphone,
  Wallet,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  FlaskConical,
  Landmark,
  Tag,
} from "lucide-react";
import Link from "next/link";

const IS_TEST_MODE = process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE === "true";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh] text-neutral-400">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get("plan") || "premium_6";
  const plan = PREMIUM_PLANS.find((p) => p.id === planId) || PREMIUM_PLANS[1];

  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [testLog, setTestLog] = useState<{ type: "info" | "success" | "error"; msg: string }[]>([]);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponResult, setCouponResult] = useState<{
    valid: boolean; code?: string; discountAmount?: number;
    originalAmount?: number; finalAmount?: number; message: string;
  } | null>(null);

  const { userId, update: updateSession } = useCurrentUser();

  useEffect(() => { loadRazorpayScript(); }, []);

  async function validateCoupon() {
    if (!couponInput.trim()) return;
    setCouponValidating(true);
    try {
      const res = await fetch("/api/payment/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), planId: plan.id }),
      });
      const data = await res.json();
      setCouponResult(data);
    } catch {
      setCouponResult({ valid: false, message: "Could not validate coupon" });
    } finally {
      setCouponValidating(false);
    }
  }

  function addLog(type: "info" | "success" | "error", msg: string) {
    setTestLog((prev) => [...prev, { type, msg }]);
  }

  // ── Real Razorpay payment — all methods enabled ──────────────────────────
  async function handlePay() {
    setLoading(true);
    setStatus("processing");
    setErrorMsg("");

    try {
      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) throw new Error("Failed to load Razorpay. Check your connection.");

      const order = await createOrder(plan.id, couponResult?.valid ? couponResult.code : undefined);

      const options: any = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Thirumangalyam",
        description: `${plan.label} Premium Plan`,
        order_id: order.orderId,
        theme: { color: "#dc2626" },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setStatus("idle");
          },
        },
        handler: async (response: any) => {
          try {
            const result = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan.id,
              paymentMethod: "Razorpay",
              couponCode: couponResult?.valid ? couponResult.code : undefined,
            });
            if (result.success) {
              await updateSession({ isPremium: true, plan: plan.id });
              setStatus("success");
            } else {
              throw new Error("Verification failed");
            }
          } catch {
            setStatus("failed");
            setErrorMsg("Payment received but verification failed. Contact support.");
          }
          setLoading(false);
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        setStatus("failed");
        setErrorMsg(response.error?.description || "Payment failed. Please try again.");
        setLoading(false);
      });
      rzp.open();
    } catch (error: any) {
      setStatus("failed");
      setErrorMsg(error.message || "Something went wrong");
      setLoading(false);
    }
  }

  // ── Test payment ─────────────────────────────────────────────────────────
  async function runTestPayment(method: "UPI" | "Card" | "Netbanking" | "Wallet", shouldFail = false) {
    const key = `${method}_${shouldFail ? "fail" : "success"}`;
    setTestLoading(key);
    setTestLog([]);
    addLog("info", `Test: ${method} ${shouldFail ? "Failure" : "Success"} — ${plan.label}`);

    try {
      addLog("info", "Creating Razorpay order...");
      const res = await fetch("/api/payment/test-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, paymentMethod: method, simulateFailure: shouldFail }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (shouldFail && res.status === 402) {
          addLog("error", `Declined: ${data.description || data.error}`);
          addLog("success", "Failure scenario handled correctly ✓");
          setStatus("failed");
          setErrorMsg(`[TEST] ${data.description || "Payment declined"}`);
        } else {
          addLog("error", `Error: ${data.error}`);
          setStatus("failed");
          setErrorMsg(data.error);
        }
        return;
      }

      addLog("success", `Order: ${data.orderId}`);
      addLog("success", `Payment ID: ${data.paymentId}`);
      addLog("success", "Signature verified ✓");
      addLog("success", `Subscription saved to DB ✓`);
      addLog("success", `Expires: ${new Date(data.subscription.endDate).toLocaleDateString("en-IN")}`);
      addLog("success", "User marked Premium ✓");
      addLog("info", "Refreshing session...");
      await updateSession({ isPremium: true, plan: plan.id });
      addLog("success", "Session updated — all pages reflect Premium ✓");
      setStatus("success");
    } catch (err: any) {
      addLog("error", err.message || "Unexpected error");
      setStatus("failed");
      setErrorMsg(err.message);
    } finally {
      setTestLoading(null);
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">Payment Successful!</h1>
        <p className="mt-2 text-neutral-500 max-w-sm">
          Your {plan.label} Premium plan is now active. Enjoy unlimited access to all features.
        </p>
        <Button variant="primary" className="mt-6" onClick={() => router.push("/dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/premium" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Plans
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Checkout</h1>
        <p className="text-neutral-500 mt-1">Complete your payment to activate Premium</p>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Left */}
        <div className="md:col-span-3 space-y-4">

          {/* ── TEST PANEL ── */}
          {IS_TEST_MODE && (
            <div className="rounded-[var(--radius-lg)] border-2 border-dashed border-amber-300 bg-amber-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                <FlaskConical className="h-4 w-4" /> Test Mode — All Payment Methods
              </div>
              <p className="text-xs text-amber-600">
                Tests full flow: order → signature → DB save → premium activation. No real payment.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { method: "UPI" as const, icon: <Smartphone className="h-3.5 w-3.5" />, label: "UPI" },
                  { method: "Card" as const, icon: <CreditCard className="h-3.5 w-3.5" />, label: "Card" },
                  { method: "Netbanking" as const, icon: <Landmark className="h-3.5 w-3.5" />, label: "Net Banking" },
                  { method: "Wallet" as const, icon: <Wallet className="h-3.5 w-3.5" />, label: "Wallet" },
                ].map(({ method, icon, label }) => (
                  <button
                    key={method}
                    onClick={() => runTestPayment(method, false)}
                    disabled={!!testLoading}
                    className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-green-600 text-white text-xs font-medium py-2.5 px-3 hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {testLoading === `${method}_success` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
                    {label} — Success
                  </button>
                ))}
                {[
                  { method: "UPI" as const, icon: <Smartphone className="h-3.5 w-3.5" />, label: "UPI" },
                  { method: "Card" as const, icon: <CreditCard className="h-3.5 w-3.5" />, label: "Card" },
                ].map(({ method, icon, label }) => (
                  <button
                    key={`${method}-fail`}
                    onClick={() => runTestPayment(method, true)}
                    disabled={!!testLoading}
                    className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-red-100 text-red-700 border border-red-300 text-xs font-medium py-2.5 px-3 hover:bg-red-200 disabled:opacity-50 transition-colors"
                  >
                    {testLoading === `${method}_fail` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                    {label} — Failure
                  </button>
                ))}
              </div>

              {testLog.length > 0 && (
                <div className="mt-1 rounded-[var(--radius-md)] bg-neutral-900 p-3 space-y-1 font-mono text-[11px] max-h-36 overflow-y-auto">
                  {testLog.map((log, i) => (
                    <div key={i} className={log.type === "success" ? "text-green-400" : log.type === "error" ? "text-red-400" : "text-neutral-400"}>
                      {log.type === "success" ? "✓" : log.type === "error" ? "✗" : "›"} {log.msg}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PAYMENT OPTIONS INFO ── */}
          <Card variant="flat" padding="lg">
            <h2 className="text-base font-semibold text-neutral-900 mb-4">Available Payment Options</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Smartphone className="h-5 w-5 text-green-600" />, label: "UPI", desc: "GPay, PhonePe, Paytm, BHIM" },
                { icon: <CreditCard className="h-5 w-5 text-blue-600" />, label: "Cards", desc: "Visa, Mastercard, Rupay" },
                { icon: <Landmark className="h-5 w-5 text-purple-600" />, label: "Net Banking", desc: "All major banks" },
                { icon: <Wallet className="h-5 w-5 text-orange-500" />, label: "Wallets", desc: "Paytm, Amazon Pay & more" },
              ].map((opt) => (
                <div key={opt.label} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-neutral-200 p-3 bg-neutral-50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-neutral-200 shrink-0">
                    {opt.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-800">{opt.label}</p>
                    <p className="text-xs text-neutral-500">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-neutral-400 text-center">All payment options will be shown in the next screen</p>
          </Card>

          {status === "failed" && errorMsg && (
            <div className="rounded-[var(--radius-lg)] bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <Button variant="primary" fullWidth size="lg" onClick={handlePay} disabled={loading} className="text-base font-semibold">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Processing...
              </span>
            ) : (
              `Pay ₹${(couponResult?.valid ? couponResult.finalAmount! : plan.totalPrice).toLocaleString("en-IN")} — Choose Payment`
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
            <Shield className="h-3.5 w-3.5" />
            Secured by Razorpay &middot; 256-bit SSL &middot; UPI · Cards · Netbanking · Wallets
          </div>
        </div>

        {/* Right — Order summary */}
        <div className="md:col-span-2">
          <Card variant="flat" padding="lg" className="sticky top-24">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Plan</span>
                <Badge variant="premium" size="sm">{plan.label}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Duration</span>
                <span className="text-sm font-medium text-neutral-900">{plan.months} months</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Per month</span>
                <span className="text-sm text-neutral-500">&#8377;{plan.monthlyPrice}/mo</span>
              </div>
              {"savings" in plan && plan.savings && !couponResult?.valid && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Savings</span>
                  <Badge variant="success" size="sm">{plan.savings}</Badge>
                </div>
              )}

              {/* Coupon row */}
              {couponResult?.valid ? (
                <>
                  <div className="flex items-center justify-between text-emerald-700">
                    <span className="text-sm flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> {couponResult.code}</span>
                    <span className="text-sm font-medium">−₹{couponResult.discountAmount?.toLocaleString("en-IN")}</span>
                  </div>
                  <button onClick={() => { setCouponResult(null); setCouponInput(""); }} className="text-xs text-neutral-400 hover:text-red-500 -mt-1 self-end">Remove</button>
                </>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponResult(null); }}
                      onKeyDown={(e) => e.key === "Enter" && validateCoupon()}
                      placeholder="Promo code"
                      className="flex-1 h-9 rounded-[var(--radius-md)] border border-neutral-300 bg-white px-3 text-sm uppercase placeholder:normal-case placeholder:text-neutral-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none"
                    />
                    <button
                      onClick={validateCoupon}
                      disabled={couponValidating || !couponInput.trim()}
                      className="h-9 px-3 rounded-[var(--radius-md)] bg-neutral-100 text-sm font-medium text-neutral-700 hover:bg-neutral-200 disabled:opacity-50 transition-colors"
                    >
                      {couponValidating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                    </button>
                  </div>
                  {couponResult && !couponResult.valid && (
                    <p className="text-xs text-red-600">{couponResult.message}</p>
                  )}
                </div>
              )}

              <div className="border-t border-neutral-200 pt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-900">Total</span>
                <div className="text-right">
                  {couponResult?.valid && (
                    <p className="text-xs text-neutral-400 line-through">₹{plan.totalPrice.toLocaleString("en-IN")}</p>
                  )}
                  <span className="text-xl font-bold text-neutral-900">
                    &#8377;{(couponResult?.valid ? couponResult.finalAmount! : plan.totalPrice).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-neutral-200 pt-4">
              <p className="text-xs font-semibold text-neutral-700 mb-2">Premium includes:</p>
              <ul className="space-y-1.5">
                {["Unlimited profile views", "Direct chat with matches", "View contact details", "See who viewed you", "Detailed horoscope matching", "Priority support"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-neutral-500">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-4 text-[10px] text-neutral-400 leading-relaxed">
              By completing this purchase you agree to our{" "}
              <Link href="/terms" className="underline hover:text-neutral-600">Terms of Service</Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-neutral-600">Privacy Policy</Link>.
              No auto-renewal. One-time payment only.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
