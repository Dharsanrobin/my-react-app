import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Member = {
  id: number | string;
  name: string;
  email: string;
  teamName: string;
  role?: string;
  phoneNumber?: string;
};

export default function MemberDashboard() {
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAuth");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("loggedInEmail");
    navigate("/auth");
  };

  useEffect(() => {
    const fetchLoggedInMember = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const loggedInEmail = localStorage
          .getItem("loggedInEmail")
          ?.toLowerCase()
          .trim();

        if (!token) {
          navigate("/auth");
          return;
        }

        if (!loggedInEmail) {
          throw new Error("Logged-in email not found.");
        }

        const response = await fetch("/project/api/members", {
          method: "GET",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch members: ${response.status}`);
        }

        const data: Member[] = await response.json();
        console.log("Members API response:", data);
        console.log("Logged-in email:", loggedInEmail);

        const matchedMember = data.find(
          (m) => m.email?.toLowerCase().trim() === loggedInEmail
        );

        if (!matchedMember) {
          throw new Error("Logged-in member details not found.");
        }

        setMember(matchedMember);
      } catch (err: any) {
        console.error("Member dashboard error:", err);
        setError(err.message || "Failed to load member details");
      } finally {
        setLoading(false);
      }
    };

    fetchLoggedInMember();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                Member Dashboard
              </p>

              {loading ? (
                <h1 className="mt-3 text-3xl font-extrabold text-slate-900">
                  Loading member details...
                </h1>
              ) : member ? (
                <>
                  <h1 className="mt-3 text-3xl font-extrabold text-slate-900">
                    Welcome, {member.name} 👋
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Here are your account details.
                  </p>
                </>
              ) : (
                <h1 className="mt-3 text-3xl font-extrabold text-slate-900">
                  Member Dashboard
                </h1>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">Loading your details...</p>
          </div>
        ) : member ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">Member ID</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  #{member.id}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">Name</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {member.name}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">Team</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {member.teamName}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">Role</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {member.role || "MEMBER"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">Email</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 break-all">
                  {member.email}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">Mobile</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {member.phoneNumber || "-"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => navigate("/Standing")}
                className="rounded-2xl bg-blue-600 p-6 text-left text-white shadow-lg hover:bg-blue-700"
              >
                <h2 className="text-xl font-semibold">🏆 View Standings</h2>
                <p className="mt-1 text-sm text-blue-100">
                  Check tournament leaderboard
                </p>
              </button>

              <button
                onClick={() =>
                  navigate("/Members", { state: { from: "home" } })
                }
                className="rounded-2xl bg-purple-600 p-6 text-left text-white shadow-lg hover:bg-purple-700"
              >
                <h2 className="text-xl font-semibold">👥 View Members</h2>
                <p className="mt-1 text-sm text-purple-100">
                  See all members in view-only mode
                </p>
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}