"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Button,
  Badge,
} from "@/components/ui";

interface CommunityData {
  _id: string;
  name: string;
  subCommunities: string[];
  isActive: boolean;
}

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSubCommunities, setNewSubCommunities] = useState("");

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSubCommunities, setEditSubCommunities] = useState("");

  // Expanded rows
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Add sub-community inline
  const [addSubId, setAddSubId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState("");

  const fetchCommunities = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/communities");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCommunities(data.communities || []);
    } catch (err) {
      setError("Failed to load communities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  const showMessage = (msg: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccess(msg);
      setError("");
    } else {
      setError(msg);
      setSuccess("");
    }
    setTimeout(() => { setSuccess(""); setError(""); }, 3000);
  };

  // CREATE
  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const subs = newSubCommunities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), subCommunities: subs }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create");
      }

      setNewName("");
      setNewSubCommunities("");
      setShowAddForm(false);
      showMessage("Community created successfully", "success");
      fetchCommunities();
    } catch (err: any) {
      showMessage(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // UPDATE
  const handleUpdate = async (id: string) => {
    setSaving(true);
    try {
      const subs = editSubCommunities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/communities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName.trim(), subCommunities: subs }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      setEditId(null);
      showMessage("Community updated successfully", "success");
      fetchCommunities();
    } catch (err: any) {
      showMessage(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // DELETE
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its sub-communities?`)) return;
    try {
      const res = await fetch("/api/admin/communities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      showMessage("Community deleted", "success");
      fetchCommunities();
    } catch (err: any) {
      showMessage(err.message, "error");
    }
  };

  // TOGGLE ACTIVE
  const handleToggleActive = async (community: CommunityData) => {
    try {
      await fetch("/api/admin/communities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: community._id, isActive: !community.isActive }),
      });
      fetchCommunities();
    } catch {}
  };

  // ADD SUB-COMMUNITY INLINE
  const handleAddSubCommunity = async (community: CommunityData) => {
    if (!newSubName.trim()) return;
    const updated = [...community.subCommunities, newSubName.trim()];
    try {
      await fetch("/api/admin/communities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: community._id, subCommunities: updated }),
      });
      setAddSubId(null);
      setNewSubName("");
      showMessage("Sub-community added", "success");
      fetchCommunities();
    } catch {}
  };

  // REMOVE SUB-COMMUNITY
  const handleRemoveSub = async (community: CommunityData, subName: string) => {
    const updated = community.subCommunities.filter((s) => s !== subName);
    try {
      await fetch("/api/admin/communities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: community._id, subCommunities: updated }),
      });
      showMessage(`"${subName}" removed`, "success");
      fetchCommunities();
    } catch {}
  };

  const startEdit = (c: CommunityData) => {
    setEditId(c._id);
    setEditName(c.name);
    setEditSubCommunities(c.subCommunities.join(", "));
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Communities</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage communities and sub-communities. {communities.length} total.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-rose-600 hover:bg-rose-700"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="h-4 w-4" />
          Add Community
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{success}</div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <Card variant="flat" padding="lg">
          <CardHeader>
            <CardTitle className="text-base">Add New Community</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-lg">
              <Input
                label="Community Name"
                placeholder="e.g., Brahmin - Iyer"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <div>
                <Input
                  label="Sub-Communities (comma-separated)"
                  placeholder="e.g., Vadama, Brahacharanam, Ashtasahasram"
                  value={newSubCommunities}
                  onChange={(e) => setNewSubCommunities(e.target.value)}
                />
                <p className="text-xs text-neutral-500 mt-1">Enter sub-communities separated by commas</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700"
                  disabled={saving || !newName.trim()}
                  onClick={handleAdd}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Create Community
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setShowAddForm(false); setNewName(""); setNewSubCommunities(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Communities List */}
      <div className="space-y-3">
        {communities.map((community) => (
          <Card key={community._id} variant="flat" padding="md">
            {editId === community._id ? (
              /* Edit Mode */
              <div className="space-y-4">
                <Input
                  label="Community Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <div>
                  <Input
                    label="Sub-Communities (comma-separated)"
                    value={editSubCommunities}
                    onChange={(e) => setEditSubCommunities(e.target.value)}
                  />
                  <p className="text-xs text-neutral-500 mt-1">Edit or add sub-communities separated by commas</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700"
                    disabled={saving}
                    onClick={() => handleUpdate(community._id)}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div>
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-2 cursor-pointer flex-1"
                    onClick={() => toggleExpand(community._id)}
                  >
                    {expanded.has(community._id) ? (
                      <ChevronDown className="h-4 w-4 text-neutral-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-neutral-400" />
                    )}
                    <h3 className="text-base font-semibold text-neutral-900">{community.name}</h3>
                    <Badge
                      variant={community.isActive ? "success" : "outline"}
                      size="sm"
                    >
                      {community.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-xs text-neutral-500">
                      {community.subCommunities.length} sub-communities
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(community)}
                      className="px-2 py-1 text-xs font-medium rounded-md hover:bg-neutral-100 text-neutral-600"
                    >
                      {community.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => startEdit(community)}
                      className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 hover:text-rose-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(community._id, community.name)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-neutral-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded: show sub-communities */}
                {expanded.has(community._id) && (
                  <div className="mt-3 ml-6 space-y-2">
                    {community.subCommunities.length === 0 ? (
                      <p className="text-sm text-neutral-400 italic">No sub-communities</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {community.subCommunities.map((sub) => (
                          <span
                            key={sub}
                            className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
                          >
                            {sub}
                            <button
                              onClick={() => handleRemoveSub(community, sub)}
                              className="text-neutral-400 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Add sub-community inline */}
                    {addSubId === community._id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          placeholder="New sub-community name"
                          value={newSubName}
                          onChange={(e) => setNewSubName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleAddSubCommunity(community); }}
                        />
                        <Button
                          size="sm"
                          className="bg-rose-600 hover:bg-rose-700 shrink-0"
                          onClick={() => handleAddSubCommunity(community)}
                          disabled={!newSubName.trim()}
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0"
                          onClick={() => { setAddSubId(null); setNewSubName(""); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddSubId(community._id)}
                        className="flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700 font-medium mt-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Sub-Community
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {communities.length === 0 && (
        <Card variant="flat" padding="lg" className="text-center py-12">
          <Users className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-neutral-700">No Communities</h2>
          <p className="text-sm text-neutral-500 mt-1">Click "Add Community" to get started.</p>
        </Card>
      )}
    </div>
  );
}
