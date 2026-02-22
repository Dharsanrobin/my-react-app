import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Tour {
  id: string;
  tourName: string;
  createdAt: string;
  status: 'active' | 'completed' | 'upcoming';
  teamsCount?: number;
  matchesCount?: number;
  selectedMembers?: Member[];
  isGenerated?: boolean;
}

interface Member {
  id: string;
  name: string;
  email: string;
  teamName: string;
}

interface Match {
  id: string;
  team1: Member;
  team2: Member;
  tournamentId: string;
  status?: 'pending' | 'completed';
  score?: string;
}

interface ApiTournament {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

// Delete Confirmation Modal Component
const DeleteConfirmationModal: React.FC<{
  tour: Tour;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}> = ({ tour, onClose, onConfirm, isDeleting = false }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 mb-4 mx-auto">
          <svg className="h-6 w-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold text-slate-900 text-center mb-2">
          Delete Tournament
        </h3>
        
        <p className="text-sm text-slate-500 text-center mb-6">
          Are you sure you want to delete <span className="font-semibold text-slate-700">"{tour.tourName}"</span>? 
          This action cannot be undone.
        </p>

        <div className="bg-rose-50 rounded-xl p-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-rose-700">Tournament Name:</span>
              <span className="font-medium text-rose-900">{tour.tourName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-rose-700">Status:</span>
              <span className="font-medium text-rose-900 capitalize">{tour.status}</span>
            </div>
            {tour.selectedMembers && (
              <div className="flex justify-between text-sm">
                <span className="text-rose-700">Members:</span>
                <span className="font-medium text-rose-900">{tour.selectedMembers.length}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 font-semibold"
          >
            {isDeleting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </span>
            ) : (
              'Delete Tournament'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Generated Tournament View Component
const GeneratedTournamentView: React.FC<{
  tour: Tour;
  onClose: () => void;
}> = ({ tour, onClose }) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [scoreA, setScoreA] = useState<string>('');
  const [scoreB, setScoreB] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, [tour.id]);

const fetchMatches = async () => {
  setLoading(true);
  setError(null);
  try {
    const cleanTourId = tour.id.replace('#', '');
    console.log('Fetching matches for tournament:', cleanTourId);
    
    const response = await fetch(
      `https://just-encouragement-production-671d.up.railway.app/project/api/tournaments/${cleanTourId}/matches`,
      {
        headers: {
          'accept': '*/*'
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('Matches fetched:', data);
      
      // Ensure we have an array
      const matchesArray = Array.isArray(data) ? data : [];
      setMatches(matchesArray);
      
      // Also save to localStorage as backup
      localStorage.setItem(`matches_${tour.id}`, JSON.stringify(matchesArray));
    } else {
      const errorText = await response.text();
      console.error('Failed to fetch matches:', response.status, errorText);
      
      // Try to parse error message
      try {
        const errorData = JSON.parse(errorText);
        setError(errorData.message || `Failed to load matches (Status: ${response.status})`);
      } catch {
        setError(`Failed to load matches (Status: ${response.status})`);
      }
    }
  } catch (error) {
    console.error('Error fetching matches:', error);
    setError('Network error. Please check your connection.');
    
    // Fallback to localStorage
    const savedMatches = localStorage.getItem(`matches_${tour.id}`);
    if (savedMatches) {
      try {
        const parsedMatches = JSON.parse(savedMatches);
        setMatches(parsedMatches);
        setError(null); // Clear error if we have local data
      } catch (e) {
        console.error('Error parsing saved matches:', e);
      }
    }
  } finally {
    setLoading(false);
  }
};

  const handleAddScore = (match: any) => {
    setSelectedMatch(match);
    setScoreA(match.scoreA?.toString() || '');
    setScoreB(match.scoreB?.toString() || '');
  };

const handleSubmitScore = async () => {
  if (!selectedMatch || !scoreA.trim() || !scoreB.trim()) return;

  setIsSubmitting(true);
  setError(null);
  
  try {
    const cleanTourId = tour.id.replace('#', '');
    const matchId = selectedMatch.matchId;
    
    const payload = {
      scoreA: parseInt(scoreA),
      scoreB: parseInt(scoreB)
    };
    
    console.log('Submitting score:', {
      url: `https://just-encouragement-production-671d.up.railway.app/project/api/tournaments/${cleanTourId}/matches/${matchId}/score`,
      payload: payload
    });

    const response = await fetch(
      `https://just-encouragement-production-671d.up.railway.app/project/api/tournaments/${cleanTourId}/matches/${matchId}/score`,
      {
        method: 'PUT',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    console.log('Response status:', response.status);
    
    // Try to get response body for error details
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    console.log('Response data:', responseData);

    if (response.ok) {
      // Success - update local state
      const updatedMatches = matches.map(m =>
        m.matchId === selectedMatch.matchId
          ? {
              ...m,
              scoreA: parseInt(scoreA),
              scoreB: parseInt(scoreB),
              status: 'COMPLETED'
            }
          : m
      );
      
      setMatches(updatedMatches);
      localStorage.setItem(`matches_${tour.id}`, JSON.stringify(updatedMatches));
      
      // Close modal and reset
      setSelectedMatch(null);
      setScoreA('');
      setScoreB('');
      setError(null);
      
      console.log('Score updated successfully!');
      
      // Refresh matches to get latest data
      fetchMatches();
    } else {
      // Handle specific error status codes
      if (response.status === 404) {
        setError('Match not found. Please refresh and try again.');
      } else if (response.status === 400) {
        setError('Invalid score values. Please check and try again.');
      } else if (response.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(`Failed to update score (Status: ${response.status}). Please try again.`);
      }
    }
    
  } catch (error) {
    console.error('Error updating score:', error);
    setError('Network error. Please check your connection and try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  const handleCloseModal = () => {
    setSelectedMatch(null);
    setScoreA('');
    setScoreB('');
  };

  if (!tour.selectedMembers || tour.selectedMembers.length < 2) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Cannot View Tournament</h3>
          <p className="text-slate-600 mb-6">Need at least 2 members to view matches.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Separate matches by completion status
  const matchesWithScore = matches.filter(m => m.scoreA > 0 || m.scoreB > 0);
  const matchesWithoutScore = matches.filter(m => m.scoreA === 0 && m.scoreB === 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                {tour.tourName} - Tournament Matches
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Total Matches: {matches.length} | Completed: {matchesWithScore.length} | Pending: {matchesWithoutScore.length}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-slate-100"
            >
              <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Players ({tour.selectedMembers.length})</h4>
          <div className="flex flex-wrap gap-2">
            {tour.selectedMembers.map((member, index) => (
              <span
                key={member.id}
                className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
              >
                {index + 1}. {member.name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-rose-600 mb-4">{error}</p>
              <button
                onClick={fetchMatches}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending Matches Section */}
              {matchesWithoutScore.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                    Pending Matches
                  </h4>
                  <div className="grid gap-4">
                    {matchesWithoutScore.map((match, index) => (
                      <div
                        key={match.matchId}
                        className="flex flex-col p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <span className="text-sm font-medium text-slate-400 w-12">
                              #{index + 1}
                            </span>
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex-1 text-right">
                                <span className="font-medium text-slate-900">{match.teamAName}</span>
                              </div>
                              
                              <div className="px-3 py-1 bg-slate-100 rounded-full">
                                <span className="text-sm font-semibold text-slate-700">VS</span>
                              </div>
                              
                              <div className="flex-1 text-left">
                                <span className="font-medium text-slate-900">{match.teamBName}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleAddScore(match)}
                            className="ml-4 rounded-full bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                          >
                            Add Score
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Matches Section */}
              {matchesWithScore.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                    Completed Matches
                  </h4>
                  <div className="grid gap-4">
                    {matchesWithScore.map((match, index) => (
                      <div
                        key={match.matchId}
                        className="flex flex-col p-4 rounded-xl border border-green-200 bg-green-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <span className="text-sm font-medium text-slate-400 w-12">
                              #{index + 1}
                            </span>
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex-1 text-right">
                                <span className="font-medium text-slate-900">{match.teamAName}</span>
                              </div>
                              
                              <div className="px-4 py-2 bg-white rounded-lg shadow-sm">
                                <span className="text-sm font-bold text-green-700">
                                  {match.scoreA} - {match.scoreB}
                                </span>
                              </div>
                              
                              <div className="flex-1 text-left">
                                <span className="font-medium text-slate-900">{match.teamBName}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleAddScore(match)}
                            className="ml-4 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                          >
                            Edit Score
                          </button>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-green-200 flex justify-between items-center">
                          <span className="text-xs text-green-700 flex items-center gap-1">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Match Completed
                          </span>
                          <span className="text-xs text-slate-500">
                            Status: {match.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-between">
          <button
            onClick={fetchMatches}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>

      {/* Score Input Modal */}
     {/* Score Input Modal */}
{selectedMatch && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
    <div className="bg-white rounded-2xl max-w-md w-full p-6">
      <h3 className="text-xl font-semibold text-slate-900 mb-4">
        {selectedMatch.scoreA > 0 || selectedMatch.scoreB > 0 ? 'Edit Score' : 'Add Score'}
      </h3>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl">
          <div className="flex items-start gap-2">
            <svg className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-rose-600">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  handleSubmitScore();
                }}
                className="mt-2 text-xs font-semibold text-rose-700 hover:text-rose-800"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <p className="font-semibold text-slate-900">{selectedMatch.teamAName}</p>
          </div>
          <div className="px-4">
            <span className="text-sm font-semibold text-slate-400">VS</span>
          </div>
          <div className="text-center flex-1">
            <p className="font-semibold text-slate-900">{selectedMatch.teamBName}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {selectedMatch.teamAName}'s Score
            </label>
            <input
              type="number"
              value={scoreA}
              onChange={(e) => setScoreA(e.target.value)}
              min="0"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg font-semibold focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
              placeholder="0"
              autoFocus
              disabled={isSubmitting}
            />
          </div>
          <div className="text-sm font-semibold text-slate-400">-</div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {selectedMatch.teamBName}'s Score
            </label>
            <input
              type="number"
              value={scoreB}
              onChange={(e) => setScoreB(e.target.value)}
              min="0"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg font-semibold focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
              placeholder="0"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCloseModal}
          className="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmitScore}
          disabled={!scoreA.trim() || !scoreB.trim() || isSubmitting}
          className="flex-1 px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 font-semibold"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            'Save Score'
          )}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

// Generate Tournament Confirmation Modal
const GenerateTournamentModal: React.FC<{
  tour: Tour;
  onClose: () => void;
  onConfirm: () => void;
  isGenerating?: boolean;
}> = ({ tour, onClose, onConfirm, isGenerating = false }) => {
  const totalMatches = tour.selectedMembers ? 
    (tour.selectedMembers.length * (tour.selectedMembers.length - 1)) / 2 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          Generate Tournament
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Are you sure you want to generate the tournament with the selected players?
        </p>

        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Tournament Name:</span>
              <span className="font-medium text-slate-900">{tour.tourName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Players:</span>
              <span className="font-medium text-slate-900">{tour.selectedMembers?.length || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Matches:</span>
              <span className="font-medium text-slate-900">{totalMatches}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Format:</span>
              <span className="font-medium text-slate-900">Round Robin (1vs1 all)</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isGenerating}
            className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              'Generate Tournament'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Member Selection Modal Component
const MemberSelectionModal: React.FC<{
  tour: Tour;
  onClose: () => void;
  onSave: (tourId: string, selectedMembers: Member[]) => void;
  isAddingMembers?: boolean;
}> = ({ tour, onClose, onSave, isAddingMembers = false }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>(tour.selectedMembers || []);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "https://just-encouragement-production-671d.up.railway.app/project/api/members",
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setMembers(data);
        }
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const toggleMember = (member: Member) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m.id === member.id);
      if (isSelected) {
        return prev.filter(m => m.id !== member.id);
      } else {
        return [...prev, member];
      }
    });
    setSelectAll(false);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers);
    }
    setSelectAll(!selectAll);
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.teamName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    onSave(tour.id, selectedMembers);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Select Members for {tour.tourName}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Choose members to participate in this tournament
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-slate-100"
            >
              <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-4 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search members by name, email or team..."
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
            <svg
              className="absolute left-3 top-3 h-4 w-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectAll && filteredMembers.length === selectedMembers.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Select All</span>
                </div>
                <span className="text-xs text-slate-500">
                  {selectedMembers.length} of {members.length} selected
                </span>
              </div>

              <div className="space-y-2">
                {filteredMembers.map((member) => {
                  const isSelected = selectedMembers.some(m => m.id === member.id);
                  return (
                    <div
                      key={member.id}
                      onClick={() => toggleMember(member)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-medium text-slate-900">{member.name}</p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {member.teamName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredMembers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-500">No members found</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-600">
              <span className="font-semibold">{selectedMembers.length}</span> member{selectedMembers.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={selectedMembers.length === 0 || isAddingMembers}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingMembers ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </span>
                ) : (
                  `Add ${selectedMembers.length} Member${selectedMembers.length !== 1 ? 's' : ''} to Tournament`
                )}
              </button>
            </div>
          </div>

          {selectedMembers.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-medium text-slate-500 mb-2">Selected members:</p>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.slice(0, 5).map(m => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
                  >
                    {m.name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMembers(prev => prev.filter(mem => mem.id !== m.id));
                        setSelectAll(false);
                      }}
                      className="hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedMembers.length > 5 && (
                  <span className="text-xs text-slate-500">
                    +{selectedMembers.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main CreateTour Component
const CreateTour: React.FC = () => {
  const navigate = useNavigate();
  const [tourName, setTourName] = useState('');
  const [tours, setTours] = useState<Tour[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<Tour | null>(null);
  
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [tourToGenerate, setTourToGenerate] = useState<Tour | null>(null);
  const [viewingTour, setViewingTour] = useState<Tour | null>(null);

  const mapApiStatus = (apiStatus: string): Tour['status'] => {
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

  useEffect(() => {
    const fetchTours = async () => {
      try {
        setIsLoading(true);
        
        const savedTours = localStorage.getItem('tours');
        if (savedTours) {
          try {
            const parsedTours = JSON.parse(savedTours);
            setTours(parsedTours);
          } catch (error) {
            console.error('Error loading tours from localStorage:', error);
          }
        }
        
        const response = await fetch(
          "https://just-encouragement-production-671d.up.railway.app/project/api/tournaments/tournamentTeams",
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const apiTours: ApiTournament[] = await response.json();
          
          const convertedTours: Tour[] = apiTours.map(apiTour => ({
            id: apiTour.id.toString(),
            tourName: apiTour.name,
            createdAt: apiTour.startDate || new Date().toISOString(),
            status: mapApiStatus(apiTour.status),
            teamsCount: 0,
            matchesCount: 0,
            selectedMembers: [],
            isGenerated: false
          }));
          
          setTours(currentTours => {
            const latestLocalTours = localStorage.getItem('tours');
            let localTours: Tour[] = [];
            if (latestLocalTours) {
              try {
                localTours = JSON.parse(latestLocalTours);
              } catch (error) {
                console.error('Error parsing localStorage tours:', error);
              }
            }
            
            const existingTours = localTours.length > 0 ? localTours : currentTours;
            
            const mergedTours: Tour[] = convertedTours.map(apiTour => {
              const existingTour = existingTours.find(t => t.id === apiTour.id);
              if (existingTour) {
                return { 
                  ...apiTour, 
                  selectedMembers: existingTour.selectedMembers || [],
                  teamsCount: existingTour.selectedMembers?.length || 0,
                  status: existingTour.selectedMembers && existingTour.selectedMembers.length > 0 ? 'active' : apiTour.status,
                  isGenerated: existingTour.isGenerated || false
                };
              }
              return { ...apiTour, selectedMembers: [], isGenerated: false };
            });
            
            const localTourIds = new Set(mergedTours.map(t => t.id));
            const additionalLocalTours: Tour[] = existingTours.filter(t => !localTourIds.has(t.id));
            
            const finalTours: Tour[] = [...mergedTours, ...additionalLocalTours];
            
            localStorage.setItem('tours', JSON.stringify(finalTours));
            
            return finalTours;
          });
        }
      } catch (error) {
        console.error('Error fetching tours:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTours();
  }, []);

  useEffect(() => {
    if (tours.length > 0) {
      localStorage.setItem('tours', JSON.stringify(tours));
    }
  }, [tours]);

  useEffect(() => {
    if (apiError || successMessage) {
      const timer = setTimeout(() => {
        setApiError(null);
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [apiError, successMessage]);

  const handleCreateTour = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tourName.trim()) {
      setError('Please enter a tour name');
      return;
    }

    setIsCreating(true);
    setError(null);
    setApiError(null);
    setSuccessMessage(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const tourData = {
        name: tourName.trim(),
        startDate: today,
        endDate: today,
        status: 'UPCOMING'
      };

      const response = await fetch(
        "https://just-encouragement-production-671d.up.railway.app/project/api/tournaments",
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(tourData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      const newTour: Tour = {
        id: result.id?.toString() || Date.now().toString(),
        tourName: tourName.trim(),
        createdAt: today,
        status: 'upcoming',
        teamsCount: 0,
        matchesCount: 0,
        selectedMembers: [],
        isGenerated: false
      };

      const updatedTours = [newTour, ...tours];
      setTours(updatedTours);
      setTourName('');
      setSuccessMessage('Tournament created successfully!');

    } catch (err: any) {
      console.error('Error creating tour:', err);
      setApiError('Unable to connect to server. Saving locally only.');
      
      const offlineTour: Tour = {
        id: Date.now().toString(),
        tourName: tourName.trim(),
        createdAt: new Date().toISOString(),
        status: 'upcoming',
        teamsCount: 0,
        matchesCount: 0,
        selectedMembers: [],
        isGenerated: false
      };
      
      const updatedTours = [offlineTour, ...tours];
      setTours(updatedTours);
      setTourName('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTour = async (id: string) => {
    setDeletingId(id);
    setApiError(null);
    setSuccessMessage(null);

    try {
      const cleanTourId = id.replace('#', '');
      
      console.log(`Deleting tournament with ID: ${cleanTourId}`);

      const response = await fetch(
        `https://just-encouragement-production-671d.up.railway.app/project/api/tournaments/${cleanTourId}?id=${cleanTourId}`,
        {
          method: 'DELETE',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
        console.log('Delete API Response:', result);
      } else {
        result = await response.text();
        console.log('Delete API Response:', result);
      }

      const updatedTours = tours.filter(t => t.id !== id);
      setTours(updatedTours);
      localStorage.setItem('tours', JSON.stringify(updatedTours));
      
      localStorage.removeItem(`matches_${id}`);
      
      if (editingId === id) {
        setEditingId(null);
        setEditName('');
      }
      
      setSuccessMessage('Tournament deleted successfully!');
      setTourToDelete(null);
      
    } catch (error) {
      console.error('Error deleting tournament:', error);
      setApiError('Failed to delete tournament from server. Removing locally only.');
      
      const updatedTours = tours.filter(t => t.id !== id);
      setTours(updatedTours);
      localStorage.setItem('tours', JSON.stringify(updatedTours));
      localStorage.removeItem(`matches_${id}`);
      
      if (editingId === id) {
        setEditingId(null);
        setEditName('');
      }
      setTourToDelete(null);
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (tour: Tour) => {
    setEditingId(tour.id);
    setEditName(tour.tourName);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) {
      alert('Tour name cannot be empty');
      return;
    }

    setIsUpdating(true);
    setApiError(null);
    
    try {
      const cleanTourId = id.replace('#', '');
      
      console.log(`Updating tournament ${cleanTourId} with name: ${editName.trim()}`);

      const currentTour = tours.find(t => t.id === id);
      
      const updateData = {
        name: editName.trim(),
        ...(currentTour?.createdAt && { startDate: currentTour.createdAt.split('T')[0] }),
        ...(currentTour?.createdAt && { endDate: currentTour.createdAt.split('T')[0] }),
        status: currentTour?.status?.toUpperCase() || 'UPCOMING'
      };

      const response = await fetch(
        `https://just-encouragement-production-671d.up.railway.app/project/api/tournaments/${cleanTourId}?id=${cleanTourId}&name=${encodeURIComponent(editName.trim())}`,
        {
          method: 'PUT',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      console.log('Update response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
        console.log('Update API Response:', result);
      } else {
        result = await response.text();
        console.log('Update API Response:', result);
      }

      const updatedTours = tours.map(t =>
        t.id === id ? { ...t, tourName: editName.trim() } : t
      );
      
      setTours(updatedTours);
      localStorage.setItem('tours', JSON.stringify(updatedTours));
      
      setSuccessMessage('Tournament updated successfully!');
      cancelEdit();
      
    } catch (error) {
      console.error('Error updating tournament:', error);
      
      setApiError('Failed to sync with server, but changes saved locally');
      
      const updatedTours = tours.map(t =>
        t.id === id ? { ...t, tourName: editName.trim() } : t
      );
      
      setTours(updatedTours);
      localStorage.setItem('tours', JSON.stringify(updatedTours));
      
      cancelEdit();
    } finally {
      setIsUpdating(false);
    }
  };

  const updateTourStatus = (id: string, newStatus: Tour['status']) => {
    const updatedTours = tours.map(t =>
      t.id === id ? { ...t, status: newStatus } : t
    );
    
    setTours(updatedTours);
    localStorage.setItem('tours', JSON.stringify(updatedTours));
  };

  const handleSaveMembers = async (tourId: string, selectedMembers: Member[]) => {
    try {
      setIsAddingMembers(true);
      
      const cleanTourId = tourId.replace('#', '');
      const teamIds = selectedMembers.map(member => member.id);
      
      if (teamIds.length === 0) {
        setApiError('No team IDs found for selected members');
        setIsAddingMembers(false);
        return;
      }

      const requestBody = {
        teamIds: teamIds
      };

      const response = await fetch(
        `https://just-encouragement-production-671d.up.railway.app/project/api/tournaments/${cleanTourId}/teams`,
        {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        if (teamIds.every(id => !isNaN(Number(id)))) {
          console.log('Retrying with numeric IDs...');
          const numericBody = {
            teamIds: teamIds.map(id => Number(id))
          };
          
          const retryResponse = await fetch(
            `https://just-encouragement-production-671d.up.railway.app/project/api/tournaments/${cleanTourId}/teams`,
            {
              method: 'POST',
              headers: {
                'accept': '*/*',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(numericBody),
            }
          );
          
          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const updatedTours = tours.map(t =>
        t.id === tourId
          ? {
              ...t,
              selectedMembers,
              teamsCount: selectedMembers.length,
              status: selectedMembers.length > 0 ? 'active' : t.status
            }
          : t
      );
      
      localStorage.setItem('tours', JSON.stringify(updatedTours));
      setTours(updatedTours);
      
      setSuccessMessage('Members added successfully!');
      setApiError(null);
      setSelectedTour(null);
      
    } catch (error) {
      console.error('Error adding members:', error);
      
      setApiError('Failed to sync with server, but members saved locally');
      
      const updatedTours = tours.map(t =>
        t.id === tourId
          ? {
              ...t,
              selectedMembers,
              teamsCount: selectedMembers.length,
              status: selectedMembers.length > 0 ? 'active' : t.status
            }
          : t
      );
      
      localStorage.setItem('tours', JSON.stringify(updatedTours));
      setTours(updatedTours);
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleGenerateTournament = async () => {
    if (!tourToGenerate) return;
    
    setIsGenerating(true);
    
    try {
      const cleanTourId = tourToGenerate.id.replace('#', '');
      
      const response = await fetch(
        `https://just-encouragement-production-671d.up.railway.app/project/api/tournaments/${cleanTourId}/generate-matches`,
        {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const matches = generateMatches(tourToGenerate.selectedMembers || [], tourToGenerate.id);
      localStorage.setItem(`matches_${tourToGenerate.id}`, JSON.stringify(matches));

      const updatedTours = tours.map(t =>
        t.id === tourToGenerate.id
          ? { ...t, isGenerated: true, status: 'active' as const }
          : t
      );
      
      localStorage.setItem('tours', JSON.stringify(updatedTours));
      setTours(updatedTours);

      setSuccessMessage('Tournament generated successfully!');
      setTourToGenerate(null);
      setViewingTour({ ...tourToGenerate, isGenerated: true });
      
    } catch (error) {
      console.error('Error generating tournament:', error);
      setApiError('Failed to generate tournament. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMatches = (members: Member[], tournamentId: string): Match[] => {
    const matches: Match[] = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        matches.push({
          id: `${tournamentId}_${i}_${j}`,
          team1: members[i],
          team2: members[j],
          tournamentId: tournamentId,
          status: 'pending'
        });
      }
    }
    return matches;
  };

  const openMemberModal = (tour: Tour, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTour(tour);
  };

  const openGenerateModal = (tour: Tour, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tour.selectedMembers || tour.selectedMembers.length < 2) {
      setApiError('Need at least 2 members to generate tournament');
      return;
    }
    setTourToGenerate(tour);
  };

  const openViewTournament = (tour: Tour, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewingTour(tour);
  };

  const openDeleteModal = (tour: Tour, e: React.MouseEvent) => {
    e.stopPropagation();
    setTourToDelete(tour);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: Tour['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 ring-1 ring-green-200';
      case 'completed':
        return 'bg-slate-50 text-slate-700 ring-1 ring-slate-200';
      case 'upcoming':
        return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 ring-1 ring-slate-200';
    }
  };

  const filteredTours = tours.filter(tour => {
    if (filterStatus === 'all') return true;
    return tour.status === filterStatus;
  });

  const totalTours = tours.length;
  const activeTours = tours.filter(t => t.status === 'active').length;
  const upcomingTours = tours.filter(t => t.status === 'upcoming').length;
  const completedTours = tours.filter(t => t.status === 'completed').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-600">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Delete Confirmation Modal */}
        {tourToDelete && (
          <DeleteConfirmationModal
            tour={tourToDelete}
            onClose={() => setTourToDelete(null)}
            onConfirm={() => handleDeleteTour(tourToDelete.id)}
            isDeleting={deletingId === tourToDelete.id}
          />
        )}
        
        {selectedTour && (
          <MemberSelectionModal
            tour={selectedTour}
            onClose={() => setSelectedTour(null)}
            onSave={handleSaveMembers}
            isAddingMembers={isAddingMembers}
          />
        )}

        {tourToGenerate && (
          <GenerateTournamentModal
            tour={tourToGenerate}
            onClose={() => setTourToGenerate(null)}
            onConfirm={handleGenerateTournament}
            isGenerating={isGenerating}
          />
        )}

        {viewingTour && (
          <GeneratedTournamentView
            tour={viewingTour}
            onClose={() => setViewingTour(null)}
          />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200 w-fit"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Create Tour
          </h1>
          
          <div className="w-20 hidden sm:block"></div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Create New Tour
          </h2>
          
          <form onSubmit={handleCreateTour} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={tourName}
                onChange={(e) => setTourName(e.target.value)}
                placeholder="Enter tour name (e.g., Summer Championship 2024)"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                disabled={isCreating}
              />
              {error && (
                <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isCreating || !tourName.trim()}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Tour'
              )}
            </button>
          </form>

          {apiError && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <p className="text-sm text-rose-600 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {apiError}
              </p>
            </div>
          )}

          {successMessage && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-600 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {successMessage}
              </p>
            </div>
          )}
        </div>

        {tours.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">Total Tours</p>
              <p className="text-2xl font-semibold text-slate-900">{totalTours}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">Active</p>
              <p className="text-2xl font-semibold text-green-600">{activeTours}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">Upcoming</p>
              <p className="text-2xl font-semibold text-blue-600">{upcomingTours}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">Completed</p>
              <p className="text-2xl font-semibold text-slate-600">{completedTours}</p>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Tours List
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                {filteredTours.length} {filteredTours.length === 1 ? 'tour' : 'tours'}
              </span>
            </div>

            <div className="flex gap-2">
              {['all', 'upcoming', 'active', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                    filterStatus === status
                      ? status === 'all' ? 'bg-slate-800 text-white' :
                        status === 'active' ? 'bg-green-600 text-white' :
                        status === 'upcoming' ? 'bg-blue-600 text-white' :
                        'bg-slate-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {filteredTours.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <svg
                  className="h-8 w-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <p className="text-sm text-slate-600">
                {tours.length === 0 
                  ? 'No tours created yet.' 
                  : `No ${filterStatus !== 'all' ? filterStatus : ''} tours found.`}
              </p>
              {tours.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Create your first tour using the form above
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTours.map((tour) => (
                <div
                  key={tour.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
                >
                  {editingId === tour.id ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                        autoFocus
                        disabled={isUpdating}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(tour.id)}
                          disabled={isUpdating}
                          className="flex-1 sm:flex-none rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {isUpdating ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={isUpdating}
                          className="flex-1 sm:flex-none rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-semibold text-slate-900">
                            {tour.tourName}
                          </span>
                          <select
                            value={tour.status}
                            onChange={(e) => updateTourStatus(tour.id, e.target.value as Tour['status'])}
                            className={`text-xs rounded-full px-2 py-1 font-medium border-0 ${getStatusColor(tour.status)}`}
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                          </select>
                          {tour.isGenerated && (
                            <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-200">
                              Generated
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                          <span className="text-xs text-slate-500">
                            📅 {formatDate(tour.createdAt)}
                          </span>
                          <span className="text-xs text-slate-400 hidden sm:inline">•</span>
                          <span className="text-xs text-slate-500">
                            🏆 ID: #{tour.id.slice(-4)}
                          </span>
                          {tour.selectedMembers && tour.selectedMembers.length > 0 && (
                            <>
                              <span className="text-xs text-slate-400 hidden sm:inline">•</span>
                              <span className="text-xs text-slate-500">
                                👥 {tour.selectedMembers.length} member{tour.selectedMembers.length !== 1 ? 's' : ''}
                              </span>
                            </>
                          )}
                        </div>

                        {tour.selectedMembers && tour.selectedMembers.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {tour.selectedMembers.slice(0, 3).map(m => (
                              <span
                                key={m.id}
                                className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200"
                              >
                                {m.name}
                              </span>
                            ))}
                            {tour.selectedMembers.length > 3 && (
                              <span className="text-xs text-slate-500">
                                +{tour.selectedMembers.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(tour)}
                          disabled={isUpdating}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => openDeleteModal(tour, e)}
                          disabled={deletingId === tour.id}
                          className={`rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 ${
                            deletingId === tour.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {deletingId === tour.id ? (
                            <span className="flex items-center gap-1">
                              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Deleting...
                            </span>
                          ) : (
                            'Delete'
                          )}
                        </button>
                        <button
                          onClick={(e) => openMemberModal(tour, e)}
                          disabled={tour.isGenerated}
                          className={`rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold ${
                            tour.isGenerated
                              ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                          }`}
                        >
                          Add Members
                        </button>
                        {tour.isGenerated ? (
                          <button
                            onClick={(e) => openViewTournament(tour, e)}
                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                          >
                            View
                          </button>
                        ) : (
                          <button
                            onClick={(e) => openGenerateModal(tour, e)}
                            disabled={!tour.selectedMembers || tour.selectedMembers.length < 2}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                              tour.selectedMembers && tour.selectedMembers.length >= 2
                                ? 'border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
                                : 'border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            Generate
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTour;