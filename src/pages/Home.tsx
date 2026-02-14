import { Link } from "react-router-dom";
import { useState } from "react";

type LinkItem = {
  to: string;
  label: string;
  icon: string;
  desc: string;
  state?: any;
  badge?: string;
};

export default function Home() {
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  const modules: LinkItem[] = [
    { to: "/CreateAuction", label: "Create Auction", icon: "✨", desc: "List a new item for bidding", badge: "New" },
    { to: "/AuctionsDetails", label: "Auction Details", icon: "📦", desc: "Browse auctions & bids", badge: "Live" },
    { to: "/Members", label: "Members", icon: "👥", desc: "Manage users and teams", state: { from: "home" } },
    { to: "/AddPlayers", label: "Add Players", icon: "⚽", desc: "Add and manage players", badge: "Pro",state: { from: "home" } },
    { to: "/login", label: "Login", icon: "🔐", desc: "Access your login modules" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-animated bg-gradient-to-br from-indigo-50 via-slate-50 to-cyan-50">
      {/* floating background blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-300/35 blur-3xl floaty" />
      <div className="pointer-events-none absolute top-32 -right-28 h-96 w-96 rounded-full bg-cyan-300/35 blur-3xl floaty [animation-delay:1.2s]" />
      <div className="pointer-events-none absolute bottom-[-140px] left-1/3 h-96 w-96 rounded-full bg-fuchsia-300/25 blur-3xl floaty [animation-delay:2.2s]" />

      <div className="relative mx-auto max-w-7xl px-6 py-10">
        {/* Top Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-sm font-medium text-slate-700 ring-1 ring-slate-200 backdrop-blur">
              ⚡ Auction House
              <span className="text-slate-300">•</span>
              Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Good to see you
              <span className="ml-2 bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                back
              </span>
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Everything you need — auctions, members, and players — in one place.
            </p>
          </div>

          {/* Search + Quick Actions + Logout */}
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
              <input
                placeholder="Search modules..."
                className="w-full rounded-2xl bg-white/80 px-10 py-3 text-sm text-slate-900 ring-1 ring-slate-200 outline-none backdrop-blur focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <Link
              to="/CreateAuction"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              ➕ Quick Create
              <span className="text-white/70">→</span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutPopup(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/10 transition hover:-translate-y-0.5 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="border-glow rounded-3xl">
            <div className="rounded-3xl bg-white/75 p-5 ring-1 ring-slate-200 backdrop-blur breathe">
              <p className="text-sm text-slate-600">Modules</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{modules.length}</p>
              <p className="mt-2 text-xs text-slate-500">Active shortcuts available</p>
            </div>
          </div>

          <div className="border-glow rounded-3xl">
            <div className="rounded-3xl bg-white/75 p-5 ring-1 ring-slate-200 backdrop-blur breathe [animation-delay:0.8s]">
              <p className="text-sm text-slate-600">Status</p>
              <p className="mt-1 text-3xl font-bold text-emerald-700">Ready</p>
              <p className="mt-2 text-xs text-slate-500">All systems normal</p>
            </div>
          </div>

          <div className="border-glow rounded-3xl">
            <div className="rounded-3xl bg-white/75 p-5 ring-1 ring-slate-200 backdrop-blur breathe [animation-delay:1.6s]">
              <p className="text-sm text-slate-600">Today</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">Build</p>
              <p className="mt-2 text-xs text-slate-500">Keep it consistent</p>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="mt-8 rounded-3xl bg-white/70 p-6 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200 backdrop-blur sm:p-8">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Modules</h2>
              <p className="mt-1 text-sm text-slate-600">Open any module to continue.</p>
            </div>
            <span className="hidden sm:inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              Premium UI
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => (
              <Link
                key={m.to}
                to={m.to}
                state={m.state}
                className="shine group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm transition
                           hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100"
              >
                <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-indigo-100/80 blur-2xl transition group-hover:bg-cyan-100/80" />

                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-xl ring-1 ring-slate-200 transition group-hover:bg-slate-900 group-hover:text-white">
                    {m.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-base font-semibold text-slate-900">{m.label}</h3>
                      {m.badge && (
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200">
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{m.desc}</p>

                    <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className="rounded-full bg-slate-100 px-2 py-1 ring-1 ring-slate-200 transition group-hover:bg-slate-900 group-hover:text-white">
                        Open
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="transition group-hover:text-slate-700">Go to module</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 🔴 Logout Popup */}
      {showLogoutPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[90%] max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200 animate-scaleIn">
            <h3 className="text-lg font-semibold text-slate-900">Are you sure?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Do you really want to log out?
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutPopup(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-300 hover:bg-slate-100"
              >
                No
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem("isAuth");
                  window.location.href = "/login";
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 shadow"
              >
                Yes, Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
