import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BackButton from "../components/BackButton";

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

// Image Upload Modal Component
const ImageUploadModal: React.FC<{
  playerId: string;
  playerName: string;
  onClose: () => void;
  onUploadSuccess: (imageUrl: string) => void;
}> = ({ playerId, playerName, onClose, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Please upload a valid image file (JPEG, PNG, GIF, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size should be less than 5MB");
      return;
    }

    setUploadError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
  if (!selectedFile) {
    setUploadError("Please select an image first");
    return;
  }

  try {
    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    console.log("Uploading for player ID:", playerId);
    console.log("File name:", selectedFile.name);

    const res = await fetch(
      `https://just-encouragement-production-671d.up.railway.app/project/api/players/image/${playerId}`,
      {
        method: "POST",
        body: formData,
      }
    );

    console.log("Response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Upload failed: ${res.status} - ${errorText}`);
    }

    // Check content type to determine response format
    const contentType = res.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      // If JSON, parse it
      const data = await res.json();
      onUploadSuccess(data.imageUrl || data.url || data.fileUrl);
    } else {
      // If not JSON (like image binary), create a blob URL
      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);
      onUploadSuccess(imageUrl);
    }
    
    onClose();
  } catch (err: any) {
    setUploadError(err?.message || "Failed to upload image");
    console.error("Error uploading image:", err);
  } finally {
    setIsUploading(false);
  }
};

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div 
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Upload Image for {playerName}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-slate-100"
          >
            <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image Preview */}
        {previewUrl && (
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="h-32 w-32 rounded-lg border-2 border-slate-200 object-contain p-2"
              />
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {uploadError && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            <div className="font-medium mb-1">Upload failed:</div>
            <div className="break-words">{uploadError}</div>
          </div>
        )}

        {/* File Input */}
        <div className="mb-4">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="imageUpload"
          />
          <label
            htmlFor="imageUpload"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-4 hover:border-blue-400 hover:bg-blue-50"
          >
            <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-slate-600">
              {selectedFile ? selectedFile.name : "Click to select image"}
            </span>
          </label>
          <p className="text-xs text-slate-500 mt-1 text-center">
            Supports: JPEG, PNG, GIF, WebP (Max 5MB)
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : (
              "Upload Image"
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
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
  const [viewingImage, setViewingImage] = useState<{
    url: string;
    playerName: string;
  } | null>(null);
  const [uploadModal, setUploadModal] = useState<{
    playerId: string;
    playerName: string;
  } | null>(null);
  
  // API states
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Check where the component is accessed from
  const isFromHome = location.state?.from === "home";

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

  /* ===================== POST API ===================== */
  const createPlayer = async (playerData: PlayerData) => {
    try {
      setLoading(true);
      setApiError(null);

      // Map your form data to API expected format
      const apiPlayer = {
        name: playerData.playerName,
        position: playerData.playerPosition,
        basePrice: 1000000, // Default base price
        imageUrl: "" // Start with empty image URL
      };

      const res = await fetch(
        "https://just-encouragement-production-671d.up.railway.app/project/api/players",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiPlayer),
        }
      );

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`API failed: ${res.status} - ${errorData}`);
      }

      const newPlayer: ApiPlayer = await res.json();
      
      // Map back to your PlayerData format and update state
      const mappedPlayer: PlayerData = {
        id: String(newPlayer.id),
        playerName: newPlayer.name,
        playerPosition: newPlayer.position,
        playerCountry: playerData.playerCountry, // Keep from form
        playerImage: null, // No image initially
      };

      setPlayers(prev => [...prev, mappedPlayer]);
      
      // Clear form on success
      setFormData(emptyPlayer);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return newPlayer;
    } catch (err: any) {
      setApiError(err?.message || "Failed to create player");
      console.error("Error creating player:", err);
      throw err;
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

  const startEdit = (player: PlayerData) => {
    // Only allow editing if from Login
    if (isFromHome) return;
    setEditingId(player.id);
    setFormData(player);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(emptyPlayer);
  };

  const deletePlayer = (id: string) => {
    // Only allow deleting if from Login
    if (isFromHome) return;
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) cancelEdit();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.playerName ||
      !formData.playerPosition ||
      !formData.playerCountry
    ) {
      alert("Please fill all fields.");
      return;
    }

    try {
      if (isEditing) {
        // For now, keep local update for edit
        setPlayers((prev) =>
          prev.map((p) => (p.id === editingId ? { ...formData } : p))
        );
        cancelEdit();
      } else {
        // Check if ID exists locally first (optional)
        const exists = players.some((p) => p.id === formData.id);
        if (exists && formData.id) {
          alert("This ID already exists. Use another ID or leave ID field empty.");
          return;
        }

        // Create via API
        await createPlayer(formData);
      }
    } catch (error) {
      // Error already handled in createPlayer
    }
  };

  // Handle successful image upload
  const handleImageUploadSuccess = (playerId: string, imageUrl: string) => {
    setPlayers(prev =>
      prev.map(p =>
        p.id === playerId ? { ...p, playerImage: imageUrl } : p
      )
    );
  };

  // Open image in modal
  const openImageModal = (imageUrl: string, playerName: string) => {
    setViewingImage({ url: imageUrl, playerName });
  };

  // Close image modal
  const closeImageModal = () => {
    setViewingImage(null);
  };

  // Open upload modal
  const openUploadModal = (playerId: string, playerName: string) => {
    setUploadModal({ playerId, playerName });
  };

  // Close upload modal
  const closeUploadModal = () => {
    setUploadModal(null);
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
      {/* Image View Modal */}
      {viewingImage && (
        <ImageModal
          imageUrl={viewingImage.url}
          playerName={viewingImage.playerName}
          onClose={closeImageModal}
        />
      )}

      {/* Image Upload Modal */}
      {uploadModal && (
        <ImageUploadModal
          playerId={uploadModal.playerId}
          playerName={uploadModal.playerName}
          onClose={closeUploadModal}
          onUploadSuccess={(imageUrl) => {
            handleImageUploadSuccess(uploadModal.playerId, imageUrl);
          }}
        />
      )}

      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl space-y-6">

          {/* Top Bar with Back Button and Refresh */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
           <BackButton />

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

                  {/* Player ID - Optional now, as API generates it */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-slate-700">ID (Optional)</label>
                    <input
                      type="text"
                      name="id"
                      value={formData.id}
                      onChange={handleChange}
                      placeholder="Auto-generated"
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
                    <label className="text-sm font-medium text-slate-700">Player Name *</label>
                    <input
                      type="text"
                      name="playerName"
                      value={formData.playerName}
                      onChange={handleChange}
                      placeholder="Enter player name"
                      className="w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      required
                    />
                  </div>

                  {/* Player Position */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-slate-700">Position *</label>
                    <input
                      type="text"
                      name="playerPosition"
                      value={formData.playerPosition}
                      onChange={handleChange}
                      placeholder="e.g., Striker, Midfielder"
                      className="w-48 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      required
                    />
                  </div>

                  {/* Player Country */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-slate-700">Country *</label>
                    <input
                      type="text"
                      name="playerCountry"
                      value={formData.playerCountry}
                      onChange={handleChange}
                      placeholder="e.g., Brazil, India"
                      className="w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      required
                    />
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
                                <button
                                  disabled
                                  className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed"
                                >
                                  Upload Image
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
                                <button
                                  type="button"
                                  onClick={() => openUploadModal(p.id, p.playerName)}
                                  disabled={loading}
                                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Upload Image
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