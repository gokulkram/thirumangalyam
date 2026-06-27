"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users, Plus, Pencil, Trash2, X, Save, Loader2,
  ChevronDown, ChevronRight, Check,
} from "lucide-react";
import { Card, Input, Button, Badge } from "@/components/ui";

interface CommunityData {
  _id: string;
  name: string;
  subCommunities: string[];
  isActive: boolean;
}

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // holds the id being saved
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Expanded rows
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Add new community form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState("");

  // Inline edit community name
  const [editNameId, setEditNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const editNameRef = useRef<HTMLInputElement>(null);

  // Add sub-community
  const [addSubId, setAddSubId] = useState<string | null>(null);
  const [newSubValue, setNewSubValue] = useState("");
  const addSubRef = useRef<HTMLInputElement>(null);

  // Edit individual sub-community  — key: `${communityId}::${subName}`
  const [editSubKey, setEditSubKey] = useState<string | null>(null);
  const [editSubValue, setEditSubValue] = useState("");
  const editSubRef = useRef<HTMLInputElement>(null);

  // ─── Data ───────────────────────────────────────────────────
  const fetchCommunities = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/communities");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCommunities(data.communities || []);
    } catch {
      flash("Failed to load communities", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCommunities(); }, [fetchCommunities]);

  useEffect(() => { editNameRef.current?.focus(); }, [editNameId]);
  useEffect(() => { addSubRef.current?.focus(); }, [addSubId]);
  useEffect(() => { editSubRef.current?.focus(); }, [editSubKey]);

  // ─── Helpers ─────────────────────────────────────────────────
  const flash = (msg: string, type: "success" | "error") => {
    if (type === "success") { setSuccess(msg); setError(""); }
    else { setError(msg); setSuccess(""); }
    setTimeout(() => { setSuccess(""); setError(""); }, 3000);
  };

  const putCommunity = async (id: string, patch: Partial<{ name: string; subCommunities: string[]; isActive: boolean }>) => {
    const res = await fetch("/api/admin/communities", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || "Failed to update");
    }
  };

  // ─── Community CRUD ──────────────────────────────────────────
  const handleAddCommunity = async () => {
    if (!newCommunityName.trim()) return;
    setSaving("new");
    try {
      const res = await fetch("/api/admin/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCommunityName.trim(), subCommunities: [] }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to create");
      }
      setNewCommunityName("");
      setShowAddForm(false);
      flash("Community created", "success");
      fetchCommunities();
    } catch (err: any) {
      flash(err.message, "error");
    } finally {
      setSaving(null);
    }
  };

  const handleSaveName = async (community: CommunityData) => {
    const trimmed = editNameValue.trim();
    if (!trimmed || trimmed === community.name) { setEditNameId(null); return; }
    setSaving(community._id);
    try {
      await putCommunity(community._id, { name: trimmed });
      flash("Name updated", "success");
      fetchCommunities();
    } catch (err: any) {
      flash(err.message, "error");
    } finally {
      setSaving(null);
      setEditNameId(null);
    }
  };

  const handleDeleteCommunity = async (community: CommunityData) => {
    if (!confirm(`Delete "${community.name}" and all its sub-communities?`)) return;
    try {
      const res = await fetch("/api/admin/communities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: community._id }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      flash("Community deleted", "success");
      fetchCommunities();
    } catch (err: any) {
      flash(err.message, "error");
    }
  };

  const handleToggleActive = async (community: CommunityData) => {
    try {
      await putCommunity(community._id, { isActive: !community.isActive });
      fetchCommunities();
    } catch {}
  };

  // ─── Sub-community CRUD ──────────────────────────────────────
  const handleAddSub = async (community: CommunityData) => {
    const trimmed = newSubValue.trim();
    if (!trimmed) return;
    if (community.subCommunities.includes(trimmed)) {
      flash(`"${trimmed}" already exists`, "error");
      return;
    }
    setSaving(`sub-add-${community._id}`);
    try {
      await putCommunity(community._id, {
        subCommunities: [...community.subCommunities, trimmed],
      });
      setAddSubId(null);
      setNewSubValue("");
      flash("Sub-community added", "success");
      fetchCommunities();
    } catch (err: any) {
      flash(err.message, "error");
    } finally {
      setSaving(null);
    }
  };

  const handleSaveSub = async (community: CommunityData, oldName: string) => {
    const trimmed = editSubValue.trim();
    setEditSubKey(null);
    setEditSubValue("");
    if (!trimmed || trimmed === oldName) return;
    if (community.subCommunities.includes(trimmed)) {
      flash(`"${trimmed}" already exists`, "error");
      return;
    }
    setSaving(`sub-edit-${community._id}`);
    try {
      await putCommunity(community._id, {
        subCommunities: community.subCommunities.map((s) => (s === oldName ? trimmed : s)),
      });
      flash("Sub-community updated", "success");
      fetchCommunities();
    } catch (err: any) {
      flash(err.message, "error");
    } finally {
      setSaving(null);
    }
  };

  const handleRemoveSub = async (community: CommunityData, subName: string) => {
    setSaving(`sub-remove-${community._id}-${subName}`);
    try {
      await putCommunity(community._id, {
        subCommunities: community.subCommunities.filter((s) => s !== subName),
      });
      flash(`"${subName}" removed`, "success");
      fetchCommunities();
    } catch (err: any) {
      flash(err.message, "error");
    } finally {
      setSaving(null);
    }
  };

  // ─── UI helpers ──────────────────────────────────────────────
  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Render ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Communities</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {communities.length} communities · click a row to manage sub-communities
          </p>
        </div>
        <Button
          size="sm"
          className="bg-rose-600 hover:bg-rose-700"
          onClick={() => { setShowAddForm((v) => !v); setNewCommunityName(""); }}
        >
          <Plus className="h-4 w-4" />
          Add Community
        </Button>
      </div>

      {/* Flash messages */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{success}</div>
      )}

      {/* Add community form */}
      {showAddForm && (
        <Card variant="flat" padding="lg" className="border-rose-200 bg-rose-50/40">
          <p className="text-sm font-semibold text-neutral-700 mb-3">New Community</p>
          <div className="flex items-center gap-3 max-w-md">
            <Input
              placeholder="Community name, e.g. Brahmin - Iyer"
              value={newCommunityName}
              onChange={(e) => setNewCommunityName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddCommunity(); }}
              className="flex-1"
            />
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 shrink-0"
              disabled={saving === "new" || !newCommunityName.trim()}
              onClick={handleAddCommunity}
            >
              {saving === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Create
            </Button>
            <Button size="sm" variant="ghost" className="shrink-0"
              onClick={() => { setShowAddForm(false); setNewCommunityName(""); }}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Community list */}
      <div className="space-y-2">
        {communities.map((community) => {
          const isExpanded = expanded.has(community._id);
          const isEditingName = editNameId === community._id;

          return (
            <Card key={community._id} variant="flat" padding="md" className="overflow-hidden">

              {/* ── Community header row ── */}
              <div className="flex items-center gap-3">

                {/* Expand toggle */}
                <button
                  onClick={() => toggleExpand(community._id)}
                  className="text-neutral-400 hover:text-neutral-600 shrink-0"
                >
                  {isExpanded
                    ? <ChevronDown className="h-4 w-4" />
                    : <ChevronRight className="h-4 w-4" />}
                </button>

                {/* Community name — normal or inline edit */}
                {isEditingName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      ref={editNameRef}
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName(community);
                        if (e.key === "Escape") setEditNameId(null);
                      }}
                      className="flex-1 rounded-md border border-rose-300 bg-white px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                    <button
                      onClick={() => handleSaveName(community)}
                      disabled={saving === community._id}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                      {saving === community._id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => setEditNameId(null)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:bg-neutral-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex-1 flex items-center gap-2 cursor-pointer min-w-0"
                    onClick={() => toggleExpand(community._id)}
                  >
                    <span className="text-base font-semibold text-neutral-900 truncate">
                      {community.name}
                    </span>
                    <Badge variant={community.isActive ? "success" : "outline"} size="sm">
                      {community.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-xs text-neutral-400 shrink-0">
                      {community.subCommunities.length} subs
                    </span>
                  </div>
                )}

                {/* Action buttons (only when not editing name) */}
                {!isEditingName && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleActive(community)}
                      className="px-2 py-1 text-xs font-medium rounded-md hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700"
                    >
                      {community.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      title="Edit community name"
                      onClick={() => { setEditNameId(community._id); setEditNameValue(community.name); }}
                      className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-rose-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      title="Delete community"
                      onClick={() => handleDeleteCommunity(community)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-neutral-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* ── Expanded: sub-communities ── */}
              {isExpanded && (
                <div className="mt-4 ml-7 space-y-3">

                  {/* Sub-community tags */}
                  {community.subCommunities.length === 0 ? (
                    <p className="text-sm text-neutral-400 italic">No sub-communities yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {community.subCommunities.map((sub) => {
                        const key = `${community._id}::${sub}`;
                        const isEditingSub = editSubKey === key;
                        const isRemoving = saving === `sub-remove-${community._id}-${sub}`;

                        if (isEditingSub) {
                          return (
                            <span key={sub} className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-0.5">
                              <input
                                ref={editSubRef}
                                value={editSubValue}
                                onChange={(e) => setEditSubValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveSub(community, sub);
                                  if (e.key === "Escape") { setEditSubKey(null); setEditSubValue(""); }
                                }}
                                className="w-36 bg-transparent text-sm font-medium text-rose-800 focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveSub(community, sub)}
                                className="text-rose-600 hover:text-rose-800"
                                title="Save"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => { setEditSubKey(null); setEditSubValue(""); }}
                                className="text-neutral-400 hover:text-neutral-600"
                                title="Cancel"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          );
                        }

                        return (
                          <span
                            key={sub}
                            className="group inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1 text-sm text-neutral-700 hover:bg-neutral-200 transition-colors"
                          >
                            <span>{sub}</span>
                            {/* Edit sub button */}
                            <button
                              title={`Edit "${sub}"`}
                              onClick={() => { setEditSubKey(key); setEditSubValue(sub); }}
                              className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-600 transition-opacity"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            {/* Remove sub button */}
                            <button
                              title={`Remove "${sub}"`}
                              onClick={() => handleRemoveSub(community, sub)}
                              disabled={isRemoving}
                              className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-opacity disabled:opacity-50"
                            >
                              {isRemoving
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <X className="h-3 w-3" />}
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Add sub-community */}
                  {addSubId === community._id ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={addSubRef}
                        value={newSubValue}
                        onChange={(e) => setNewSubValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddSub(community);
                          if (e.key === "Escape") { setAddSubId(null); setNewSubValue(""); }
                        }}
                        placeholder="Sub-community name"
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 w-56"
                      />
                      <button
                        onClick={() => handleAddSub(community)}
                        disabled={saving === `sub-add-${community._id}` || !newSubValue.trim()}
                        className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                      >
                        {saving === `sub-add-${community._id}`
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Check className="h-3.5 w-3.5" />}
                        Add
                      </button>
                      <button
                        onClick={() => { setAddSubId(null); setNewSubValue(""); }}
                        className="flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddSubId(community._id); setNewSubValue(""); setEditSubKey(null); }}
                      className="flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Sub-Community
                    </button>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {communities.length === 0 && (
        <Card variant="flat" padding="lg" className="text-center py-16">
          <Users className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-neutral-700">No Communities</h2>
          <p className="text-sm text-neutral-500 mt-1">Click "Add Community" to get started.</p>
        </Card>
      )}
    </div>
  );
}
