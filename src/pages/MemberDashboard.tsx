import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type CurrentPlayer = {
  playerId: number;
  playerName: string;
  currentBid: number;
};

type Auction = {
  auctionId: number;
  status: string;
  currentPlayer?: CurrentPlayer | null;
};

type Tournament = {
  tournamentId: number;
  tournamentName: string;
  teamBalance: number | null;
  playersBought: number | null;
  auction?: Auction | null;
};

type DashboardResponse = {
  userName: string;
  teamName: string;
  tournaments: Tournament[];
};

export default function MemberDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
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
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/auth");
          return;
        }

        // ✅ FIXED URL HERE
        const response = await fetch(
          "/project/api/dashboard/dashboard/member",
          {
            method: "GET",
            headers: {
              accept: "*/*",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to load dashboard: ${response.status}`);
        }

        const data: DashboardResponse = await response.json();
        console.log("Dashboard response:", data);

        setDashboard(data);
      } catch (err: any) {
        console.error("Dashboard error:", err);
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                Member Dashboard
              </p>

              {loading ? (
                <h1 className="mt-3 text-3xl font-extrabold text-slate-900">
                  Loading...
                </h1>
              ) : dashboard ? (
                <>
                  <h1 className="mt-3 text-3xl font-extrabold text-slate-900">
                    Welcome, {dashboard.userName} 👋
                  </h1>

                  <p className="mt-1 text-sm text-slate-600">
                    Team: {dashboard.teamName}
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
              className="rounded-2xl bg-red-600 px-5 py-3 text-white font-semibold hover:bg-red-700"
            >
              Logout
            </button>

          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white p-6 rounded-3xl ring-1 ring-slate-200">
            Loading dashboard...
          </div>
        )}

        {/* Content */}
        {!loading && dashboard && (
          <>

            {/* Top cards */}
            <div className="grid gap-4 md:grid-cols-2">

              <div className="bg-white p-5 rounded-3xl ring-1 ring-slate-200">
                <p>User Name</p>
                <h2 className="text-2xl font-bold">
                  {dashboard.userName}
                </h2>
              </div>

              <div className="bg-white p-5 rounded-3xl ring-1 ring-slate-200">
                <p>Team Name</p>
                <h2 className="text-2xl font-bold">
                  {dashboard.teamName}
                </h2>
              </div>

            </div>


            {/* Tournaments */}
            <div className="bg-white p-6 rounded-3xl ring-1 ring-slate-200">

              <h2 className="text-xl font-bold mb-4">
                My Tournaments
              </h2>

              {dashboard.tournaments.map((t) => (

                <div
                  key={t.tournamentId}
                  className="border p-4 rounded-xl mb-4"
                >

                  <h3 className="text-lg font-bold">
                    {t.tournamentName}
                  </h3>

                  <p>Balance: {t.teamBalance ?? 0}</p>
                  <p>Players Bought: {t.playersBought ?? 0}</p>

                  <p>
                    Auction Status:
                    {t.auction?.status ?? "No Auction"}
                  </p>

                  <p>
                    Player:
                    {t.auction?.currentPlayer?.playerName ?? "-"}
                  </p>

                  <p>
                    Current Bid:
                    {t.auction?.currentPlayer?.currentBid ?? 0}
                  </p>

                  <button
                    onClick={() => navigate("/CreateAuction")}
                    className="mt-3 bg-yellow-500 text-white px-4 py-2 rounded"
                  >
                    Auction Room
                  </button>

                </div>

              ))}

            </div>

          </>
        )}

      </div>
    </div>
  );
}