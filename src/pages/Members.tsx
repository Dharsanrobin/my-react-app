import React, { useMemo, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface FormData {
  id: string;
  name: string;
  email: string;
  teamName: string;
}

type ApiMember = {
  id: number | string;
  name: string;
  email: string;
  teamName: string;
};

const emptyForm: FormData = { id: "", name: "", email: "", teamName: "" };

export default function Members() {
  const navigate = useNavigate();
  const location = useLocation();

  // Check where the component is accessed from
  const isFromHome = location.state?.from === "home";
  // const isFromLogin = location.state?.from === "login" || !isFromHome; // Default to login mode if no state

  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [users, setUsers] = useState<FormData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<FormData | null>(null);

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  /* ===================== GET API ===================== */
  const fetchMembers = async () => {
    const controller = new AbortController();
    try {
      setLoading(true);
      setApiError(null);

      const res = await fetch(
        "https://just-encouragement-production-671d.up.railway.app/project/api/members",
        { method: "GET", signal: controller.signal }
      );

      if (!res.ok) {
        throw new Error(`API failed: ${res.status}`);
      }

      const data: ApiMember[] = await res.json();

      const mapped: FormData[] = (data || []).map((m) => ({
        id: String(m.id),
        name: m.name ?? "",
        email: m.email ?? "",
        teamName: m.teamName ?? "",
      }));

      setUsers(mapped);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setApiError(err?.message || "Failed to load members");
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===================== POST API ===================== */
  const createMember = async (payload: Omit<FormData, "id">) => {
    try {
      setLoading(true);
      setApiError(null);

      const res = await fetch(
        "https://just-encouragement-production-671d.up.railway.app/project/api/members",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`POST failed: ${res.status} ${text}`);
      }

      const created: ApiMember = await res.json();

      setUsers((prev) => [
        ...prev,
        {
          id: String(created.id),
          name: created.name,
          email: created.email,
          teamName: created.teamName,
        },
      ]);

      setFormData(emptyForm);
    } catch (err: any) {
      setApiError(err?.message || "Failed to create member");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== DELETE API ===================== */
  const deleteUser = async (id: string) => {
    // Only allow deleting if from Login
    if (isFromHome) return;
    
    try {
      setLoading(true);
      setApiError(null);

      const res = await fetch(
         `https://just-encouragement-production-671d.up.railway.app/project/api/members/${id}?id=${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`DELETE failed: ${res.status} ${text}`);
      }

      // If DELETE successful, remove from local state and reorder IDs
      setUsers((prev) => {
        const filtered = prev.filter((u) => u.id !== id);
        const reordered = filtered.map((user, index) => ({
          ...user,
          id: String(index + 1)
        }));
        return reordered;
      });
      
      if (editingId === id) cancelEdit();
      
    } catch (err: any) {
      setApiError(err?.message || "Failed to delete member");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  /* ===================== DELETE CONFIRMATION ===================== */
  const confirmDelete = (user: FormData) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  /* ===================== UPDATE API ===================== */
  const updateMember = async (id: string, payload: Omit<FormData, "id">) => {
    // Only allow editing if from Login
    if (isFromHome) return;
    
    try {
      setLoading(true);
      setApiError(null);

      // Build URL with query parameters exactly like your API pattern
      const queryParams = new URLSearchParams({
        id: id,
        name: payload.name,
        email: payload.email,
        teamName: payload.teamName,
      }).toString();

      const url = `https://just-encouragement-production-671d.up.railway.app/project/api/members/${id}?${queryParams}`;
      
      console.log("Updating with URL:", url); // For debugging

      const res = await fetch(url, {
        method: "PUT", // Using PUT method
        headers: {
          "Content-Type": "application/json",
        },
        // No body since data is in URL query parameters
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`UPDATE failed: ${res.status} ${text}`);
      }

      // Try to parse response if JSON, but don't fail if no response body
      let updatedData = { id, ...payload };
      try {
        const responseData = await res.json();
        updatedData = responseData;
      } catch {
        // Use payload data if no JSON response
      }

      // Update local state with the new values
      setUsers((prev) =>
        prev.map((u) => 
          u.id === id 
            ? { 
                id: String(updatedData.id),
                name: updatedData.name,
                email: updatedData.email,
                teamName: updatedData.teamName,
              } 
            : u
        )
      );

      cancelEdit();
      
    } catch (err: any) {
      setApiError(err?.message || "Failed to update member");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== FORM ===================== */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const startEdit = (user: FormData) => {
    // Only allow editing if from Login
    if (isFromHome) return;
    setEditingId(user.id);
    setFormData(user);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.teamName) {
      alert("Please fill all fields.");
      return;
    }

    // EDIT with API
    if (isEditing) {
      await updateMember(editingId!, {
        name: formData.name,
        email: formData.email,
        teamName: formData.teamName,
      });
      return;
    }

    // CREATE (POST API)
    await createMember({
      name: formData.name,
      email: formData.email,
      teamName: formData.teamName,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Delete Confirmation Modal */}
        {showDeleteModal && userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
              <div className="flex items-center gap-3 text-rose-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-semibold">Delete Member</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-slate-700">
                  Are you sure you want to delete <span className="font-semibold">{userToDelete.name}</span>?
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  ID: #{userToDelete.id} • Email: {userToDelete.email} • Team: {userToDelete.teamName}
                </p>
                <p className="text-xs text-rose-600 mt-3">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-100 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Yes, Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Actions */}
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

            <button
              onClick={fetchMembers}
              disabled={loading}
              className={[
                "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm ring-1",
                loading
                  ? "cursor-not-allowed bg-slate-100 text-slate-400 ring-slate-200"
                  : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100",
                "focus:outline-none focus:ring-4 focus:ring-slate-200",
              ].join(" ")}
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>
        </div>

        {/* API Error */}
        {apiError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {apiError}
          </div>
        )}

        {/* Add/Edit User Card - Only show if from Login */}
        {!isFromHome && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {isEditing ? "Edit User" : "Add User"}
              </h2>

              {isEditing && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                  Editing Mode
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-5">
              <div className="flex flex-wrap items-end gap-4">

                {/* ID Field - Different display for edit vs create */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-slate-700">ID</label>
                  {isEditing ? (
                    <div className="w-28 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-slate-900 font-medium shadow-sm">
                      {formData.id || "Auto-generated"}
                    </div>
                  ) : (
                    <input
                      type="text"
                      name="id"
                      value={formData.id}
                      onChange={handleChange}
                      disabled={true}
                      placeholder="Auto-generated"
                      className="w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 shadow-sm outline-none cursor-not-allowed"
                    />
                  )}
                 
                </div>

                {/* Name */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-slate-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter name"
                    required
                    className="w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                    className="w-56 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                {/* Team */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-slate-700">Team</label>
                  <input
                    type="text"
                    name="teamName"
                    value={formData.teamName}
                    onChange={handleChange}
                    placeholder="Enter team name"
                    required
                    className="w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
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
                    {loading ? "Processing..." : (isEditing ? "Update Member" : "Add Member")}
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

        {/* Members List */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Members List
            </h2>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                {users.length} {users.length === 1 ? 'member' : 'members'}
              </span>
              {isFromHome && (
                <span className="text-xs text-slate-500">
                  View-only mode
                </span>
              )}
            </div>
          </div>

          {loading && users.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-6 text-center">
              <p className="text-sm text-slate-600">
                Loading members from API...
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-6 text-center">
              <p className="text-sm text-slate-600">No members found.</p>
              {isFromHome ? (
                <p className="text-xs text-slate-500 mt-1">
                  Members will appear here when added from Login → Members
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">
                  Add your first member using the form above
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
                    <th className="py-3 pr-4 font-medium">Email</th>
                    <th className="py-3 pr-4 font-medium">Team</th>
                    <th className="py-3 pr-0 text-right font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {users.map((u) => (
                    <tr key={u.id} className="text-slate-800 hover:bg-slate-50">
                      <td className="py-3 pr-4 font-medium">#{u.id}</td>
                      <td className="py-3 pr-4">{u.name}</td>
                      <td className="py-3 pr-4">{u.email}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {u.teamName}
                        </span>
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
                                onClick={() => startEdit(u)}
                                disabled={loading}
                                className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => confirmDelete(u)}
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

              {isFromHome && (
                <p className="mt-3 text-xs text-slate-500">
                  Note: Add/Edit/Delete functions are disabled in View Mode. 
                  Use Login → Members for full management.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}