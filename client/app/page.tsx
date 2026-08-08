"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { apiFetch, Notebook, AI_MODELS } from "@/lib/api-client";
import { AuthDialog } from "@/components/auth-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Search,
  Sparkles,
  Trash2,
  FileText,
  MessageSquare,
  Bookmark,
  LogOut,
  User as UserIcon,
  BrainCircuit,
  Zap,
  FolderKanban,
  Cpu,
} from "lucide-react";

const COLOR_OPTIONS = ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#6366f1"];
const ICON_OPTIONS = [
  { id: "book", label: "Book", icon: BookOpen },
  { id: "brain", label: "Brain", icon: BrainCircuit },
  { id: "zap", label: "Zap", icon: Zap },
  { id: "project", label: "Project", icon: FolderKanban },
];

export default function Dashboard() {
  const { data: sessionData, isPending: sessionPending } = authClient.useSession();
  const user = sessionData?.user;

  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // New Notebook Form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);
  const [newIcon, setNewIcon] = useState("book");
  const [newAiModel, setNewAiModel] = useState<string>("gpt-4o-mini");
  const [creating, setCreating] = useState(false);

  const fetchNotebooks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; notebooks: Notebook[] }>("/api/notebooks");
      setNotebooks(res.notebooks || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load notebooks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotebooks();
    } else {
      setNotebooks([]);
    }
  }, [user]);

  const handleCreateNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      await apiFetch("/api/notebooks", {
        data: {
          title: newTitle,
          description: newDesc,
          color: newColor,
          icon: newIcon,
          aiModel: newAiModel,
        },
      });
      toast.success("Notebook created successfully!");
      setNewTitle("");
      setNewDesc("");
      setCreateDialogOpen(false);
      fetchNotebooks();
    } catch (err: any) {
      toast.error(err.message || "Failed to create notebook");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteNotebook = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await apiFetch(`/api/notebooks/${id}`, { method: "DELETE" });
      toast.success("Notebook deleted");
      setNotebooks((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete notebook");
    }
  };

  const filteredNotebooks = notebooks.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.description && n.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              NotebookLM Workspace
            </h1>
            <p className="text-xs text-zinc-500">AI-Powered Research & Synthesis</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {sessionPending ? (
            <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800/80 px-3 py-1.5 rounded-full">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <span className="text-xs font-medium text-zinc-300 max-w-[120px] truncate">{user.name || user.email}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => authClient.signOut()}
                title="Sign Out"
                className="h-6 w-6 text-zinc-400 hover:text-red-400 hover:bg-transparent"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setAuthDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-full px-5"
            >
              <UserIcon className="w-4 h-4 mr-2" /> Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800/80 p-8 shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Sparkles className="w-3.5 h-3.5" /> OpenAI & Multi-Model Grounded Synthesis
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Personalized Notebooks & Knowledge Base
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Upload PDFs, articles, and notes. Choose your preferred AI Model (GPT-4o, GPT-4o Mini, o3-mini, Gemini, Sonnet) to analyze and generate grounded insights.
              </p>
            </div>
            <Button
              onClick={() => {
                if (!user) setAuthDialogOpen(true);
                else setCreateDialogOpen(true);
              }}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-xl shadow-blue-600/20 rounded-2xl px-6 py-6"
            >
              <Plus className="w-5 h-5 mr-2" /> Create New Notebook
            </Button>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search your notebooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white pl-10 pr-4 py-2 rounded-xl focus:ring-blue-500 focus:border-blue-500 placeholder:text-zinc-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Showing {filteredNotebooks.length} Notebooks</span>
          </div>
        </div>

        {/* Notebook Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 animate-pulse p-6" />
            ))}
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl text-center">
            <div className="p-4 rounded-full bg-blue-500/10 text-blue-400 mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Welcome to NotebookLM</h3>
            <p className="text-zinc-400 text-sm max-w-md mb-6">
              Sign in or create an account to start creating notebooks, adding sources, and chatting with your documents.
            </p>
            <Button onClick={() => setAuthDialogOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6">
              Sign In to Get Started
            </Button>
          </div>
        ) : filteredNotebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl text-center">
            <div className="p-4 rounded-full bg-zinc-800 text-zinc-400 mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Notebooks Found</h3>
            <p className="text-zinc-400 text-sm max-w-md mb-6">
              {searchQuery ? "No notebooks match your search criteria." : "Create your first notebook to get started!"}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white">
              <Plus className="w-4 h-4 mr-2" /> Create Notebook
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotebooks.map((nb) => {
              const IconComp = ICON_OPTIONS.find((i) => i.id === nb.icon)?.icon || BookOpen;
              const modelInfo = AI_MODELS.find((m) => m.id === nb.aiModel) || AI_MODELS[1];

              return (
                <a
                  key={nb.id}
                  href={`/notebook/${nb.id}`}
                  className="group relative flex flex-col justify-between rounded-2xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700/80 p-6 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className="p-2.5 rounded-xl border border-white/10"
                        style={{ backgroundColor: `${nb.color || "#3b82f6"}20`, color: nb.color || "#3b82f6" }}
                      >
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium">
                          {modelInfo.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteNotebook(nb.id, nb.title, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                        {nb.title}
                      </h3>
                      <p className="text-zinc-400 text-xs mt-1 line-clamp-2 min-h-[32px]">
                        {nb.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> {nb._count?.sources || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> {nb._count?.messages || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-3.5 h-3.5" /> {nb._count?.artifacts || 0}
                      </span>
                    </div>
                    <span>{new Date(nb.updatedAt).toLocaleDateString()}</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </main>

      {/* Auth Dialog */}
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} onSuccess={fetchNotebooks} />

      {/* Create Notebook Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-zinc-950 text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" /> Create New Notebook
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateNotebook} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-zinc-400">Notebook Title *</label>
              <Input
                type="text"
                placeholder="e.g., Quantum Computing Research"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-800 text-white focus:ring-blue-500 focus:border-blue-500 mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400">Description (Optional)</label>
              <Textarea
                placeholder="Brief summary of what this workspace contains..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                className="bg-zinc-900 border-zinc-800 text-white focus:ring-blue-500 focus:border-blue-500 mt-1 resize-none text-sm"
              />
            </div>

            {/* AI Model Selection */}
            <div>
              <label className="text-xs font-semibold text-zinc-400 mb-1.5 block flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" /> Select AI Model
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {AI_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setNewAiModel(m.id)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      newAiModel === m.id
                        ? "bg-blue-600/20 border-blue-500 ring-1 ring-blue-500 text-white"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-xs text-white">{m.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{m.provider}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1">{m.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Icon</label>
              <div className="flex items-center gap-2">
                {ICON_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setNewIcon(opt.id)}
                      className={`p-2 rounded-xl border flex items-center gap-2 text-xs transition-all ${
                        newIcon === opt.id
                          ? "bg-blue-600/20 border-blue-500 text-blue-400"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Accent Color</label>
              <div className="flex items-center gap-3">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      newColor === color ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-950" : "opacity-80 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setCreateDialogOpen(false)} className="text-zinc-400">
                Cancel
              </Button>
              <Button type="submit" disabled={creating} className="bg-blue-600 hover:bg-blue-500 text-white font-medium">
                {creating ? "Creating..." : "Create Notebook"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
