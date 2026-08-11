import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { Lock, LoaderCircle } from "lucide-react";

// Owner-only sign-in gate, via "Sign in with Google" rather than email/password.
// The underlying Firebase project restricts enabling the Email/Password
// provider to project owners, but Google sign-in is already enabled by
// default - so this needs zero Firebase Console changes. Access is still
// locked down server-side: firestore.rules only allows the specific email(s)
// listed there to read or write any data, so signing in with a different
// Google account will authenticate but every Firestore call will be denied.
export function LoginScreen() {
  const { loginWithGoogle } = useCRM();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-in failed.";
      setError(
        message.includes("popup-closed-by-user")
          ? "Sign-in was cancelled."
          : "Sign-in failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDF7F4] text-[#112F24] flex items-center justify-center p-4 antialiased font-sans">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E2F0EA] shadow-[0_8px_30px_rgba(0,172,118,0.06)] p-8 space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src="/meridian-interface-logo.png"
            alt="Meridian Interface"
            className="w-12 h-12 rounded-2xl object-contain shadow-[0_4px_12px_rgba(0,172,118,0.25)]"
          />
          <div>
            <h1 className="text-lg font-extrabold text-[#112F24] tracking-tight">Meridian Interface</h1>
            <p className="text-[10px] text-[#00AC76] font-bold tracking-widest mt-1 font-mono uppercase">CRM WORKSPACE</p>
          </div>
          <p className="text-xs text-[#6C8E82] flex items-center gap-1.5 pt-1">
            <Lock size={12} /> Owner sign-in required
          </p>
        </div>

        {error && (
          <p className="text-xs text-[#FF5A36] bg-[#FFECE8] rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full bg-white hover:bg-[#F8FAF9] disabled:opacity-60 disabled:cursor-not-allowed text-[#112F24] font-semibold text-sm py-2.5 rounded-xl transition flex items-center justify-center gap-2.5 cursor-pointer border border-[#E2F0EA] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          {isSubmitting ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
          )}
          {isSubmitting ? "Signing in..." : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
}
