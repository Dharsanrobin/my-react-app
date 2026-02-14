import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const links = [
    // ✅ Login -> Members (hide Add User)
    { to: "/Members", label: "Members", icon: "👥", desc: "Manage users and teams", state: { from: "login" } },
    { to: "/AddPlayers", label: "Add Players", icon: "👥", desc: "Manage users and teams", state: { from: "login" } },

    { to: "/CreateTour", label: "Create Tournament", icon: "➕", desc: "Create a new tournament", state: { from: "login" } },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-cyan-50">
      <div className="relative mx-auto max-w-5xl px-6 py-12">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200"
        >
          ← Back
        </button>

        <div className="mb-8 mt-6 flex flex-col gap-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Login
            <span className="ml-2 bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              Page
            </span>
          </h1>
        </div>

        <div className="rounded-3xl bg-white/70 p-6 shadow-xl ring-1 ring-slate-200 backdrop-blur sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                state={item.state}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-indigo-100 blur-2xl transition group-hover:bg-cyan-100" />

                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-xl ring-1 ring-slate-200 transition group-hover:bg-slate-900 group-hover:text-white">
                    {item.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold text-slate-900">{item.label}</h2>
                      <span className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-600">
                        →
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
