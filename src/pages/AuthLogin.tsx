import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type LoginMode = "email" | "mobile";

export default function AuthLogin() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<LoginMode>("email");

  // Email login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Mobile login
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Demo OTP (replace with real API)
  const DEMO_OTP = "123456";

  // ✅ When login page opens, logout user (prevents forward-bypass)
  useEffect(() => {
    localStorage.removeItem("isAuth");
  }, []);

  const canSendOtp = useMemo(() => {
    // simple validation: 10 digits
    return /^\d{10}$/.test(mobile);
  }, [mobile]);

  const handleSendOtp = () => {
    if (!canSendOtp) {
      alert("Enter a valid 10-digit mobile number.");
      return;
    }

    // demo: mark otp sent (in real app call API)
    setOtpSent(true);
    setOtp("");
    alert(`OTP sent (demo OTP is ${DEMO_OTP})`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Email login
    if (mode === "email") {
      if (!email || !password) {
        alert("Please fill all fields.");
        return;
      }

      // demo credentials
      if (email === "admin@gmail.com" && password === "admin123") {
        localStorage.setItem("isAuth", "true");
        navigate("/");
      } else {
        alert("Invalid email/password.");
      }
      return;
    }

    // ✅ Mobile login
    if (!otpSent) {
      alert("Please click Send OTP first.");
      return;
    }

    if (!canSendOtp) {
      alert("Enter a valid 10-digit mobile number.");
      return;
    }

    if (!otp) {
      alert("Please enter OTP.");
      return;
    }

    if (otp === DEMO_OTP) {
      localStorage.setItem("isAuth", "true");
      navigate("/");
    } else {
      alert("Invalid OTP. Try again.");
    }
  };

  const resetMobileFlow = () => {
    setOtpSent(false);
    setOtp("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-6">
      {/* glow blobs */}
      <div className="pointer-events-none absolute top-10 right-10 h-40 w-40 rounded-full bg-purple-300 blur-3xl opacity-40 animate-pulse" />
      <div className="pointer-events-none absolute bottom-10 left-10 h-40 w-40 rounded-full bg-indigo-300 blur-3xl opacity-40 animate-pulse [animation-delay:1.5s]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white/80 p-8 shadow-2xl backdrop-blur-xl border border-white/40">
        <h1 className="text-3xl font-extrabold text-center text-slate-900">
          Sign in
        </h1>
        <p className="text-center text-slate-600 mt-2 mb-6">
          Login to access your dashboard
        </p>

        {/* Mode Toggle */}
        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-white ring-1 ring-slate-200 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("email");
              resetMobileFlow();
            }}
            className={[
              "rounded-xl py-2 text-sm font-semibold transition",
              mode === "email"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-700 hover:bg-slate-50",
            ].join(" ")}
          >
            Email
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("mobile");
              setEmail("");
              setPassword("");
            }}
            className={[
              "rounded-xl py-2 text-sm font-semibold transition",
              mode === "mobile"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-700 hover:bg-slate-50",
            ].join(" ")}
          >
            Mobile
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* EMAIL MODE */}
          {mode === "email" && (
            <>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-xl bg-white px-4 py-3 border border-slate-300 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  placeholder="admin@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-xl bg-white px-4 py-3 border border-slate-300 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  placeholder="admin123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          )}

          {/* MOBILE MODE */}
          {mode === "mobile" && (
            <>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  className="mt-1 w-full rounded-xl bg-white px-4 py-3 border border-slate-300 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  placeholder="10-digit number"
                  value={mobile}
                  onChange={(e) => {
                    // keep only digits
                    const onlyDigits = e.target.value.replace(/\D/g, "");
                    setMobile(onlyDigits.slice(0, 10));
                    resetMobileFlow();
                  }}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Demo: OTP is <span className="font-semibold">123456</span>
                </p>
              </div>

              {/* Send OTP + OTP input */}
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={!canSendOtp}
                  className={[
                    "w-full rounded-xl py-3 font-semibold shadow-lg transition",
                    canSendOtp
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-slate-200 text-slate-500 cursor-not-allowed",
                  ].join(" ")}
                >
                  {otpSent ? "Resend OTP" : "Send OTP"}
                </button>

                <div>
                  <label className="text-sm font-medium text-slate-700">OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={[
                      "mt-1 w-full rounded-xl bg-white px-4 py-3 border shadow-sm outline-none",
                      otpSent
                        ? "border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        : "border-slate-200 bg-slate-50 cursor-not-allowed",
                    ].join(" ")}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    disabled={!otpSent}
                    onChange={(e) => {
                      const onlyDigits = e.target.value.replace(/\D/g, "");
                      setOtp(onlyDigits.slice(0, 6));
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 text-white font-semibold py-3 shadow-lg hover:bg-slate-800 hover:-translate-y-0.5 transition-all"
          >
            {mode === "mobile" ? "Verify & Login" : "Login"}
          </button>
        </form>

        {/* hint */}
        <p className="mt-5 text-center text-xs text-slate-500">
          You can keep both methods now. Later we can connect real API.
        </p>
      </div>
    </div>
  );
}
