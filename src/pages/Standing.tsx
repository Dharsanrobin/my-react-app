import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Team {
  id: string;
  name: string;
  email: string;
  teamName: string;
}

interface Match {
  matchId: string;
  tournamentId: number;
  teamAId: number;
  teamBId: number;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  status: string;
}

interface TeamStanding {
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  winPercentage: number;
  standing: number;
}

// API Standing type (based on the actual API response)
interface ApiStandingResponse {
  id: number;
  name: string;
  teamName: string;
  played: number;
  win: number;
  loss: number;
  draw: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

interface Tournament {
  id: string;
  tourName: string;
  createdAt: string;
  status: 'active' | 'completed' | 'upcoming';
  selectedMembers?: Team[];
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  const cleanToken = token?.trim();
  return {
    "accept": "*/*",
    "Authorization": cleanToken ? `Bearer ${cleanToken}` : "",
    "Content-Type": "application/json",
  };
};

// Check if user is authenticated
const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

const Standing: React.FC = () => {
  const navigate = useNavigate();
  const { tournamentId } = useParams<{ tournamentId: string }>();
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournamentId || '');
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (apiError || successMessage) {
      const timer = setTimeout(() => {
        setApiError(null);
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [apiError, successMessage]);

  // Fetch all tournaments
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await fetch(
          "/project/api/tournaments",
          {
            method: 'GET',
            headers: getAuthHeaders(),
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("isAuth");
          navigate("/login");
          return;
        }

        if (response.ok) {
          const data = await response.json();
          const formattedTours: Tournament[] = data.map((tour: any) => ({
            id: tour.id.toString(),
            tourName: tour.name,
            createdAt: tour.startDate || new Date().toISOString(),
            status: mapApiStatus(tour.status),
            selectedMembers: []
          }));
          setTournaments(formattedTours);
        }
      } catch (error) {
        console.error('Error fetching tournaments:', error);
        setError('Failed to load tournaments');
      }
    };

    fetchTournaments();
  }, [navigate]);

  // Fetch tournament details and standings when tournament is selected
  useEffect(() => {
    if (selectedTournamentId) {
      fetchTournamentDetails(selectedTournamentId);
      fetchTournamentStandings(selectedTournamentId);
    } else {
      setSelectedTournament(null);
      setMatches([]);
      setStandings([]);
    }
  }, [selectedTournamentId]);

  // Fetch tournament details including members - UPDATED to handle 403 gracefully
  const fetchTournamentDetails = async (id: string) => {
    try {
      const cleanId = id.replace('#', '');
      
      // Get tournament basic info first
      const tournamentInfo = tournaments.find(t => t.id === id);
      
      // Try to get tournament teams, but don't show error if it fails
      let members: Team[] = [];
      try {
        const response = await fetch(
          `/project/api/tournaments/${cleanId}/teams`,
          {
            method: 'GET',
            headers: getAuthHeaders(),
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("isAuth");
          navigate("/login");
          return;
        }

        if (response.ok) {
          members = await response.json();
          console.log('Tournament members loaded:', members);
        } else if (response.status === 403) {
          // Silently ignore 403 - we don't need teams for standings
          console.log('Teams API returned 403 - this is expected, standings will still work');
        }
      } catch (error) {
        // Silently ignore team fetch errors
        console.log('Could not fetch teams, but standings will still work');
      }
      
      setSelectedTournament({
        id,
        tourName: tournamentInfo?.tourName || 'Unknown Tournament',
        createdAt: tournamentInfo?.createdAt || new Date().toISOString(),
        status: tournamentInfo?.status || 'upcoming',
        selectedMembers: members
      });

    } catch (error) {
      console.error('Error in tournament details:', error);
      // Don't set error state for this - standings still work
    }
  };

  // Fetch standings directly from the standings API
  const fetchTournamentStandings = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const cleanId = id.replace('#', '');
      
      const response = await fetch(
        `/project/api/tournaments/${cleanId}/standings`,
        {
          headers: getAuthHeaders()
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("isAuth");
        navigate("/login");
        return;
      }

      if (response.ok) {
        const data: ApiStandingResponse[] = await response.json();
        console.log('Raw standings data:', data);
        
        // Map API standings to your component's format
        const mappedStandings: TeamStanding[] = data.map((standing, index) => {
          // Calculate win percentage
          const winPercentage = standing.played > 0 
            ? (standing.win / standing.played) * 100 
            : 0;
            
          return {
            teamId: standing.id.toString(),
            teamName: standing.teamName || standing.name, // Use teamName if available, fallback to name
            matchesPlayed: standing.played || 0,
            wins: standing.win || 0,
            losses: standing.loss || 0,
            draws: standing.draw || 0,
            pointsFor: standing.goalsFor || 0,
            pointsAgainst: standing.goalsAgainst || 0,
            pointDifference: standing.goalDifference || 0,
            winPercentage: winPercentage,
            standing: index + 1 // Use index for ranking since API doesn't provide it
          };
        });

        console.log('Mapped standings:', mappedStandings);
        setStandings(mappedStandings);
        setSuccessMessage('Standings loaded successfully!');
      } else {
        const errorText = await response.text();
        setError(`Failed to load standings: ${response.status}`);
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching standings:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Keep the old method as fallback
  const fetchTournamentMatches = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const cleanId = id.replace('#', '');
      
      const response = await fetch(
        `/project/api/tournaments/${cleanId}/matches`,
        {
          headers: getAuthHeaders()
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("isAuth");
        navigate("/login");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const matchesArray = Array.isArray(data) ? data : [];
        setMatches(matchesArray);
        
        // Calculate standings from matches (fallback)
        calculateStandings(matchesArray);
      } else {
        setError('Failed to load matches');
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate standings from matches (fallback method)
  const calculateStandings = (matchesData: Match[]) => {
    if (!selectedTournament?.selectedMembers) return;

    const teamStats = new Map<string, TeamStanding>();

    // Initialize stats for each team
    selectedTournament.selectedMembers.forEach((team: Team) => {
      teamStats.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointDifference: 0,
        winPercentage: 0,
        standing: 0
      });
    });

    // Calculate stats from completed matches
    matchesData.forEach(match => {
      if (match.status === 'COMPLETED' && match.scoreA !== undefined && match.scoreB !== undefined) {
        const teamAId = match.teamAId.toString();
        const teamBId = match.teamBId.toString();
        
        const teamAStats = teamStats.get(teamAId);
        const teamBStats = teamStats.get(teamBId);

        if (teamAStats && teamBStats) {
          // Update matches played
          teamAStats.matchesPlayed++;
          teamBStats.matchesPlayed++;

          // Update points
          teamAStats.pointsFor += match.scoreA;
          teamAStats.pointsAgainst += match.scoreB;
          teamBStats.pointsFor += match.scoreB;
          teamBStats.pointsAgainst += match.scoreA;

          // Determine winner
          if (match.scoreA > match.scoreB) {
            teamAStats.wins++;
            teamBStats.losses++;
          } else if (match.scoreB > match.scoreA) {
            teamBStats.wins++;
            teamAStats.losses++;
          } else {
            teamAStats.draws++;
            teamBStats.draws++;
          }
        }
      }
    });

    // Calculate point differences and win percentages
    teamStats.forEach(stats => {
      stats.pointDifference = stats.pointsFor - stats.pointsAgainst;
      stats.winPercentage = stats.matchesPlayed > 0 
        ? (stats.wins / stats.matchesPlayed) * 100 
        : 0;
    });

    // Convert to array and sort by wins (primary) and point difference (secondary)
    const sortedStandings = Array.from(teamStats.values())
      .sort((a, b) => {
        // Sort by wins first
        if (b.wins !== a.wins) return b.wins - a.wins;
        // Then by point difference
        if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
        // Then by points scored
        return b.pointsFor - a.pointsFor;
      })
      .map((team, index) => ({
        ...team,
        standing: index + 1
      }));

    setStandings(sortedStandings);
  };

  const mapApiStatus = (apiStatus: string): Tournament['status'] => {
    switch (apiStatus?.toUpperCase()) {
      case 'ACTIVE':
        return 'active';
      case 'COMPLETED':
        return 'completed';
      case 'UPCOMING':
      default:
        return 'upcoming';
    }
  };

  // Updated: Only set the selected ID, don't navigate
  const handleTournamentSelect = (id: string) => {
    setSelectedTournamentId(id);
    // No navigation - just update state
  };

  const getWinRateColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 50) return 'text-blue-600';
    if (percentage >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMedalColor = (standing: number) => {
    switch (standing) {
      case 1:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'; // Gold
      case 2:
        return 'bg-gray-100 text-gray-700 border-gray-300'; // Silver
      case 3:
        return 'bg-orange-100 text-orange-700 border-orange-300'; // Bronze
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Tournament Standings
          </h1>
          
          <div className="w-20"></div>
        </div>

        {/* Error Message - Only show for critical errors, not teams 403 */}
        {apiError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {apiError}
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </div>
          </div>
        )}

        {/* Tournament Selector */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-slate-700">
              Select Tournament
            </label>
            <button
              onClick={() => selectedTournamentId && fetchTournamentStandings(selectedTournamentId)}
              disabled={!selectedTournamentId || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          <select
            value={selectedTournamentId}
            onChange={(e) => handleTournamentSelect(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Choose a tournament</option>
            {tournaments.map((tour) => (
              <option key={tour.id} value={tour.id}>
                {tour.tourName} - {formatDate(tour.createdAt)} ({tour.status})
              </option>
            ))}
          </select>
        </div>

        {/* Tournament Info & Standings - Only show when a tournament is selected */}
        {selectedTournament && (
          <div className="space-y-6">
            {/* Tournament Header */}
            <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">{selectedTournament.tourName}</h2>
              <div className="flex flex-wrap gap-4 text-sm">
                <span>📅 {formatDate(selectedTournament.createdAt)}</span>
                <span>•</span>
                <span className="capitalize">Status: {selectedTournament.status}</span>
                <span>•</span>
                <span>👥 {selectedTournament.selectedMembers?.length || 0} Teams</span>
                <span>•</span>
                <span>🎯 {matches.length} Matches</span>
              </div>
            </div>

            {/* Standings Table */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Tournament Standings</h3>
                <div className="text-sm text-slate-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-rose-600">{error}</p>
                  <button
                    onClick={() => fetchTournamentStandings(selectedTournamentId)}
                    className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : standings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-16">Rank</th>
                        <th className="py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Team</th>
                        <th className="py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">MP</th>
                        <th className="py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">W</th>
                        <th className="py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">L</th>
                        <th className="py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">D</th>
                        <th className="py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">PF</th>
                        <th className="py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">PA</th>
                        <th className="py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">PD</th>
                        <th className="py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Win %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {standings.map((team) => (
                        <tr key={team.teamId} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3">
                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-semibold ${getMedalColor(team.standing)}`}>
                              {team.standing}
                            </div>
                          </td>
                          <td className="py-3">
                            <div>
                              <p className="font-medium text-slate-900">{team.teamName}</p>
                              <p className="text-xs text-slate-500">ID: {team.teamId.slice(-4)}</p>
                            </div>
                          </td>
                          <td className="py-3 text-center font-medium">{team.matchesPlayed}</td>
                          <td className="py-3 text-center text-green-600 font-medium">{team.wins}</td>
                          <td className="py-3 text-center text-red-600 font-medium">{team.losses}</td>
                          <td className="py-3 text-center text-blue-600 font-medium">{team.draws}</td>
                          <td className="py-3 text-center font-medium">{team.pointsFor}</td>
                          <td className="py-3 text-center font-medium">{team.pointsAgainst}</td>
                          <td className={`py-3 text-center font-medium ${
                            team.pointDifference > 0 ? 'text-green-600' : 
                            team.pointDifference < 0 ? 'text-red-600' : 'text-slate-600'
                          }`}>
                            {team.pointDifference > 0 ? '+' : ''}{team.pointDifference}
                          </td>
                          <td className="py-3 text-center">
                            <span className={`font-semibold ${getWinRateColor(team.winPercentage)}`}>
                              {team.winPercentage.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-slate-600">No standings available</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Standings will appear once matches are completed
                  </p>
                </div>
              )}
            </div>

            {/* Team Stats Summary */}
            {standings.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Top Team Card */}
                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Top Team</p>
                      <p className="font-semibold text-slate-900">{standings[0]?.teamName}</p>
                      <p className="text-xs text-slate-500">{standings[0]?.wins} Wins</p>
                    </div>
                  </div>
                </div>

                {/* Highest Scorer Card */}
                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Highest Scorer</p>
                      <p className="font-semibold text-slate-900">
                        {standings.reduce((max, team) => team.pointsFor > max.pointsFor ? team : max).teamName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {standings.reduce((max, team) => team.pointsFor > max.pointsFor ? team : max).pointsFor} Points
                      </p>
                    </div>
                  </div>
                </div>

                {/* Best Defense Card */}
                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Best Defense</p>
                      <p className="font-semibold text-slate-900">
                        {standings.reduce((min, team) => team.pointsAgainst < min.pointsAgainst ? team : min).teamName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {standings.reduce((min, team) => team.pointsAgainst < min.pointsAgainst ? team : min).pointsAgainst} Against
                      </p>
                    </div>
                  </div>
                </div>

                {/* Best Point Difference Card */}
                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Best Point Difference</p>
                      <p className="font-semibold text-slate-900">
                        {standings.reduce((max, team) => team.pointDifference > max.pointDifference ? team : max).teamName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {standings.reduce((max, team) => team.pointDifference > max.pointDifference ? team : max).pointDifference > 0 ? '+' : ''}
                        {standings.reduce((max, team) => team.pointDifference > max.pointDifference ? team : max).pointDifference}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Show message when no tournament is selected */}
        {!selectedTournament && !loading && (
          <div className="rounded-2xl bg-white p-12 shadow-sm ring-1 ring-slate-200 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <svg className="h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Tournament Selected</h3>
            <p className="text-sm text-slate-500">Please select a tournament from the dropdown above to view standings.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Standing;