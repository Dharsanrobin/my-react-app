import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type JwtPayload = {
  sub?: string;
  role?: string;
  Role?: string;
  roles?: string | string[];
  authority?: string;
  authorities?: string[];
  cole?: string;
  [key: string]: any;
};

function parseJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split("")
        .map((char) => "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("JWT parse error:", error);
    return null;
  }
}

function getRoleFromToken(token: string): string | null {
  const payload = parseJwt(token);

  if (!payload) return null;

  if (typeof payload.role === "string") return payload.role;
  if (typeof payload.Role === "string") return payload.Role;
  if (typeof payload.authority === "string") return payload.authority;
  if (typeof payload.cole === "string") return payload.cole;

  if (Array.isArray(payload.roles) && payload.roles.length > 0) {
    return String(payload.roles[0]);
  }

  if (typeof payload.roles === "string") {
    return payload.roles;
  }

  if (Array.isArray(payload.authorities) && payload.authorities.length > 0) {
    return String(payload.authorities[0]);
  }

  return null;
}

export default function AuthLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAuth");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please fill all fields.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8080/project/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      console.log("Login response:", data);

      const token = data.token;
      if (!token) {
        throw new Error("Token not found in login response");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("isAuth", "true");
      localStorage.setItem("loggedInEmail", email);

      const tokenRole = getRoleFromToken(token);
      const role = tokenRole?.toUpperCase() || "";

      console.log("Decoded role:", role);
      console.log("Decoded payload:", parseJwt(token));

      localStorage.setItem("role", role);
      localStorage.setItem("user", JSON.stringify(data));

      if (role === "ADMIN") {
        navigate("/");
      } else if (role === "MEMBER") {
        navigate("/member-dashboard");
      } else {
        alert("User role not recognized from token");
        localStorage.removeItem("token");
        localStorage.removeItem("isAuth");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        localStorage.removeItem("loggedInEmail");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Invalid email/password or server error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-6">
      <div className="pointer-events-none absolute top-10 right-10 h-40 w-40 rounded-full bg-purple-300 blur-3xl opacity-40 animate-pulse" />
      <div className="pointer-events-none absolute bottom-10 left-10 h-40 w-40 rounded-full bg-indigo-300 blur-3xl opacity-40 animate-pulse [animation-delay:1.5s]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white/80 p-8 shadow-2xl backdrop-blur-xl border border-white/40">
        <h1 className="text-3xl font-extrabold text-center text-slate-900">
          Sign in
        </h1>

        <p className="text-center text-slate-600 mt-2 mb-6">
          Login to access your dashboard
        </p>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              className="mt-1 w-full rounded-xl bg-white px-4 py-3 border border-slate-300 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
              placeholder="admin@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl bg-white px-4 py-3 border border-slate-300 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
              placeholder="admin123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={[
              "w-full rounded-xl bg-slate-900 text-white font-semibold py-3 shadow-lg transition-all",
              isLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-slate-800 hover:-translate-y-0.5",
            ].join(" ")}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          Demo credentials: admin@gmail.com / admin123
        </p>
      </div>
    </div>
  );
}