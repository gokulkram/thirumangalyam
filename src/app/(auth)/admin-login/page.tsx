"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button, Input } from "@/components/ui";
import { Loader2 } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [forgotMsg, setForgotMsg] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        if (!email || !password) {
            setError("Please enter your admin ID and password");
            return;
        }
        setLoading(true);
        setError("");

        const res = await signIn("admin", {
            email,
            password,
            redirect: false,
        });

        if (res?.error) {
            setError("Invalid admin credentials.");
            setLoading(false);
        } else {
            router.push("/admin/dashboard");
        }
    };

    return (
        <div className="w-full max-w-[520px]">
            <div className="rounded-[var(--radius-xl)] border-2 border-rose-100 bg-white p-6 shadow-md sm:p-8">
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-rose-100 p-4 text-rose-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-3 5.92-5.46a1 1 0 0 1 1.5 0C18 3 20 4 22 5a1 1 0 0 1 1 1z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-center text-neutral-900">Admin Login</h1>
                <p className="mt-2 text-sm text-center text-rose-600 font-medium">
                    Restricted area. Authorized personnel only.
                </p>

                <div className="mt-8 space-y-5">
                    <Input
                        label="Administrator Email"
                        placeholder="admin@thirumangalyam.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                        label="Secure Password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {error && (
                    <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>
                )}

                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="remember" className="h-4 w-4 rounded border-neutral-300 text-rose-600 focus:ring-rose-500" />
                        <label htmlFor="remember" className="text-sm font-medium text-neutral-600">Trust this device</label>
                    </div>
                    <button
                        onClick={() => setForgotMsg(true)}
                        className="text-sm font-medium text-rose-600 hover:text-rose-700 hover:underline"
                    >
                        Forgot access?
                    </button>
                </div>

                {forgotMsg && (
                    <p className="mt-2 text-sm text-rose-700 font-medium">
                        Contact the super admin to reset your credentials.
                    </p>
                )}

                <Button
                    size="lg"
                    fullWidth
                    className="mt-8 bg-rose-600 text-white hover:bg-rose-700 hover:ring-rose-200"
                    disabled={loading}
                    onClick={handleLogin}
                >
                    {loading ? (
                        <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Authenticating...
                        </span>
                    ) : (
                        "Authenticate"
                    )}
                </Button>

                <div className="mt-6 rounded-lg bg-rose-50 p-4 border border-rose-100">
                    <div className="flex items-start gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500 mt-0.5"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                        <p className="text-xs text-rose-800 font-medium leading-relaxed">
                            Notice: All access attempts are securely logged. Unauthorized access is strictly prohibited.
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center pt-6 border-t border-neutral-100">
                    <Link href="/login" className="text-sm font-medium text-neutral-500 hover:text-neutral-800 transition-colors">
                        &larr; Return to User Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
