import { PREMIUM_PLANS } from "./constants";

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  planId: string;
}

export async function createOrder(planId: string): Promise<RazorpayOrder> {
  const res = await fetch("/api/payment/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create order");
  }

  return res.json();
}

export async function verifyPayment(data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planId: string;
  paymentMethod: string;
}) {
  const res = await fetch("/api/payment/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Verification failed");
  }

  return res.json();
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function getPlanLabel(planId: string): string {
  const plan = PREMIUM_PLANS.find((p) => p.id === planId);
  return plan?.label || planId;
}
