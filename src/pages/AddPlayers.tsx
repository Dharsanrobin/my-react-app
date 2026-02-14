import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface PlayerData {
  id: string;
  playerName: string;
  playerPosition: string;
  playerCountry: string;
  playerImage: string | null;
}

// API Player type (from backend)
type ApiPlayer = {
  id: number;
  name: string;
  position: string;
  basePrice: number;
  imageUrl: string;
};

const emptyPlayer: PlayerData = {
  id: "",
  playerName: "",
  playerPosition: "",
  playerCountry: "",
  playerImage: null,
};

// Modal Component for Full Image View
const ImageModal: React.FC<{
  imageUrl: string | null;
  playerName: string;
  onClose: () => void;
}> = ({ imageUrl, playerName, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div 
        className="relative max-w-4xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Image Container */}
        <div className="rounded-xl bg-white p-2 shadow-2xl">
          <img
            src={imageUrl}
            alt={playerName}
            className="max-h-[80vh] w-full rounded-lg object-contain"
          />
          
          {/* Player Info */}
          <div className="mt-2 text-center">
            <p className="text-sm font-medium text-slate-700">{playerName}</p>
          </div>
        </div>

        {/* Download Button */}
        <div className="mt-4 flex justify-center">
          <a
            href={imageUrl}
            download={`${playerName.replace(/\s+/g, "_")}_image.png`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Image
          </a>
        </div>
      </div>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
};

export default function AddPlayers() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<PlayerData>(emptyPlayer);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingImage, setViewingImage] = useState<{
    url: string;
    playerName: string;
  } | null>(null);
  
  // API states
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Check where the component is accessed from
  const isFromHome = location.state?.from === "home";
  // const isFromLogin = location.state?.from === "login" || !isFromHome; // Default to login mode if no state

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  /* ===================== GET API ===================== */
  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setApiError(null);

      const res = await fetch(
        "https://just-encouragement-production-671d.up.railway.app/project/api/players",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error(`API failed: ${res.status}`);
      }

      const data: ApiPlayer[] = await res.json();

      // Map API data to your PlayerData format
      const mappedPlayers: PlayerData[] = data.map((player) => ({
        id: String(player.id),
        playerName: player.name,
        playerPosition: player.position,
        playerCountry: "", // API doesn't have country, default to empty string
        playerImage: player.imageUrl || null,
      }));

      setPlayers(mappedPlayers);
      
      // Also save to localStorage as backup
      localStorage.setItem("players", JSON.stringify(mappedPlayers));
      
    } catch (err: any) {
      setApiError(err?.message || "Failed to load players from API");
      console.error("Error fetching players:", err);
      
      // Fallback to localStorage if API fails
      const savedPlayers = localStorage.getItem("players");
      if (savedPlayers) {
        try {
          setPlayers(JSON.parse(savedPlayers));
        } catch (error) {
          console.error("Error loading players from localStorage:", error);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch players on component mount
  useEffect(() => {
    fetchPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save players to localStorage whenever players change (as backup)
  useEffect(() => {
    if (players.length > 0) {
      localStorage.setItem("players", JSON.stringify(players));
    }
  }, [players]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPEG, PNG, GIF, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        playerImage: reader.result as string,
      }));
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert("Error uploading image");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      playerImage: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startEdit = (player: PlayerData) => {
    // Only allow editing if from Login
    if (isFromHome) return;
    setEditingId(player.id);
    setFormData(player);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(emptyPlayer);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const deletePlayer = (id: string) => {
    // Only allow deleting if from Login
    if (isFromHome) return;
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) cancelEdit();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.id ||
      !formData.playerName ||
      !formData.playerPosition ||
      !formData.playerCountry
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (isEditing) {
      setPlayers((prev) =>
        prev.map((p) => (p.id === editingId ? { ...formData } : p))
      );
      cancelEdit();
      return;
    }

    const exists = players.some((p) => p.id === formData.id);
    if (exists) {
      alert("This ID already exists. Use another ID.");
      return;
    }

    setPlayers((prev) => [...prev, formData]);
    setFormData(emptyPlayer);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Open image in modal
  const openImageModal = (imageUrl: string, playerName: string) => {
    setViewingImage({ url: imageUrl, playerName });
  };

  // Close image modal
  const closeImageModal = () => {
    setViewingImage(null);
  };

  // Handle Escape key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && viewingImage) {
        closeImageModal();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [viewingImage]);

  return (
    <>
      {/* Image Modal */}
      {viewingImage && (
        <ImageModal
          imageUrl={viewingImage.url}
          playerName={viewingImage.playerName}
          onClose={closeImageModal}
        />
      )}

      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl space-y-6">

          {/* Top Bar with Back Button and Refresh */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              ← Back
            </button>

            <div className="flex items-center gap-3">
              {/* Access Mode Badge */}
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${isFromHome ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
                {isFromHome ? "View Mode" : "Edit Mode"}
              </span>

              {/* Refresh Button */}
              <button
                onClick={fetchPlayers}
                disabled={loading}
                className={[
                  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm ring-1",
                  loading
                    ? "cursor-not-allowed bg-slate-100 text-slate-400 ring-slate-200"
                    : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100",
                  "focus:outline-none focus:ring-4 focus:ring-slate-200",
                ].join(" ")}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  "↻ Refresh"
                )}
              </button>
            </div>
          </div>

          {/* API Error Message */}
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

          {/* Only show Add Player Form if NOT from Home (i.e., from Login) */}
          {!isFromHome && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  {isEditing ? "Edit Player" : "Add Player"}
                </h2>

                {isEditing && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                    Editing Mode
                  </span>
                )}
              </div>

              <form onSubmit={handleSubmit} className="mt-5">
                <div className="flex flex-wrap items-end gap-4">

                  {/* Player ID */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-slate-700">ID</label>
                    <input
                      type="text"
                      name="id"
                      value={formData.id}
                      onChange={handleChange}
                      placeholder="Enter ID"
                      disabled={isEditing}
                      className={[
                        "w-24 rounded-xl border px-3 py-2 text-slate-900 shadow-sm outline-none",
                        "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
                        isEditing ? "cursor-not-allowed bg-slate-100" : "bg-white",
                      ].join(" ")}
                    />
                  </div>

                  {/* Player Name */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-slate-700">Player Name</label>
                    <input
                      type="text"
                      name="playerName"
                      value={formData.playerName}
                      onChange={handleChange}
                      placeholder="Enter player name"
                      className="w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />
                  </div>

                  {/* Player Position */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-slate-700">Position</label>
                    <input
                      type="text"
                      name="playerPosition"
                      value={formData.playerPosition}
                      onChange={handleChange}
                      placeholder="e.g., Striker, Midfielder"
                      className="w-48 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />
                  </div>

                  {/* Player Country */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-slate-700">Country</label>
                    <input
                      type="text"
                      name="playerCountry"
                      value={formData.playerCountry}
                      onChange={handleChange}
                      placeholder="e.g., Brazil, India"
                      className="w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />
                  </div>

                  {/* Player Image Upload */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-slate-700">Player Image</label>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="playerImage"
                        />
                        <label
                          htmlFor="playerImage"
                          className={[
                            "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 shadow-sm transition-colors",
                            "border-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100",
                            isUploading ? "bg-slate-100 cursor-wait" : "bg-white",
                          ].join(" ")}
                        >
                          {isUploading ? (
                            <>
                              <svg className="animate-spin h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="text-sm text-slate-600">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="h-5 w-5 text-slate-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="text-sm text-slate-700">Upload</span>
                            </>
                          )}
                        </label>
                      </div>
                      
                      {formData.playerImage && (
                        <div className="relative group">
                          <div 
                            className="h-12 w-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                            onClick={() => openImageModal(formData.playerImage!, formData.playerName || "Player")}
                          >
                            <img
                              src={formData.playerImage}
                              alt="Player preview"
                              className="h-full w-full object-contain p-1"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center h-5 w-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 shadow-sm"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className={[
                        "rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-sm",
                        isEditing
                          ? "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-100"
                          : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-100",
                        "focus:outline-none focus:ring-4",
                        loading && "opacity-50 cursor-not-allowed",
                      ].join(" ")}
                    >
                      {loading ? "Processing..." : (isEditing ? "Update Player" : "Add Player")}
                    </button>

                    {isEditing && (
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={loading}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Players Table - Always visible */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Players List
              </h2>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                  {players.length} {players.length === 1 ? 'player' : 'players'}
                </span>
                {isFromHome && (
                  <span className="text-xs text-slate-500">
                    View-only mode
                  </span>
                )}
              </div>
            </div>

            {loading && players.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin h-8 w-8 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm text-slate-600">
                    Loading players from API...
                  </p>
                </div>
              </div>
            ) : players.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-slate-600">No players found.</p>
                {isFromHome ? (
                  <p className="text-xs text-slate-500 mt-1">
                    Players will appear here when added from Login → Add Players
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">
                    Add your first player using the form above
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="py-3 pr-4 font-medium">ID</th>
                      <th className="py-3 pr-4 font-medium">Name</th>
                      <th className="py-3 pr-4 font-medium">Position</th>
                      <th className="py-3 pr-4 font-medium">Country</th>
                      <th className="py-3 pr-4 font-medium">Image</th>
                      <th className="py-3 pr-0 text-right font-medium">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {players.map((p) => (
                      <tr key={p.id} className="text-slate-800 hover:bg-slate-50">
                        <td className="py-3 pr-4 font-medium">#{p.id}</td>
                        <td className="py-3 pr-4">{p.playerName}</td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                            {p.playerPosition}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                            <span>🌍</span>
                            {p.playerCountry || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="relative group">
                            {p.playerImage ? (
                              <div 
                                className="h-10 w-10 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 cursor-pointer hover:border-blue-400 transition-all shadow-sm"
                                onClick={() => openImageModal(p.playerImage!, p.playerName)}
                              >
                                <img
                                  src={p.playerImage}
                                  alt={p.playerName}
                                  className="h-full w-full object-contain p-1"
                                />
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                                No img
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 pr-0">
                          <div className="flex justify-end gap-2">
                            {isFromHome ? (
                              // Disabled buttons for Home view
                              <>
                                <button
                                  disabled
                                  className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed"
                                >
                                  Edit
                                </button>
                                <button
                                  disabled
                                  className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed"
                                >
                                  Delete
                                </button>
                              </>
                            ) : (
                              // Enabled buttons for Login view
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEdit(p)}
                                  disabled={loading}
                                  className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deletePlayer(p.id)}
                                  disabled={loading}
                                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 focus:outline-none focus:ring-4 focus:ring-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}


