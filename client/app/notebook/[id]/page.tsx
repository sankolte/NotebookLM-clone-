"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { apiFetch, Notebook, Source, ChatMessage, Artifact, AI_MODELS } from "@/lib/api-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Sparkles,
  Trash2,
  FileText,
  Globe,
  SendHorizontal,
  Play,
  Pause,
  Volume2,
  Bookmark,
  FileUp,
  Share2,
  Edit3,
  Bot,
  CheckCircle2,
  Cpu,
  ChevronDown,
  FileCode,
  Video,
} from "lucide-react";

export default function NotebookWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const notebookId = resolvedParams.id;
  const router = useRouter();

  const { data: sessionData } = authClient.useSession();

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(true);

  // Sources State
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [sourceType, setSourceType] = useState<"TEXT" | "URL" | "PDF" | "MARKDOWN" | "YT_TRANSCRIPT">("TEXT");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceContent, setSourceContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [addingSource, setAddingSource] = useState(false);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Artifacts State
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [createNoteOpen, setCreateNoteOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [creatingNote, setCreatingNote] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  // Audio Overview Player State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Edit Notebook & AI Model State
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAiModel, setEditAiModel] = useState("gpt-4o-mini");

  const loadNotebookDetails = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; notebook: Notebook }>(`/api/notebooks/${notebookId}`);
      setNotebook(res.notebook);
      setMessages(res.notebook.messages || []);
      setArtifacts(res.notebook.artifacts || []);
      setEditTitle(res.notebook.title);
      setEditDesc(res.notebook.description || "");
      setEditAiModel(res.notebook.aiModel || "gpt-4o-mini");
    } catch (err: any) {
      toast.error(err.message || "Failed to load notebook");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (notebookId) {
      loadNotebookDetails();
    }
  }, [notebookId]);

  // Handle Switch AI Model directly from Header
  const handleSwitchAiModel = async (modelId: string) => {
    try {
      const res = await apiFetch<{ success: boolean; notebook: Notebook }>(`/api/notebooks/${notebookId}`, {
        method: "PATCH",
        data: { aiModel: modelId },
      });
      toast.success(`Switched AI Model to ${AI_MODELS.find((m) => m.id === modelId)?.name}`);
      setNotebook((prev) => (prev ? { ...prev, aiModel: res.notebook.aiModel } : prev));
      setEditAiModel(res.notebook.aiModel || modelId);
    } catch (err: any) {
      toast.error(err.message || "Failed to switch AI model");
    }
  };

  // Handle Add Source
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTitle.trim()) return;

    setAddingSource(true);
    try {
      const res = await apiFetch<{ success: boolean; source: Source }>(`/api/notebooks/${notebookId}/sources`, {
        data: {
          title: sourceTitle,
          type: sourceType,
          content: sourceType === "TEXT" ? sourceContent : undefined,
          fileUrl: sourceType === "URL" ? sourceUrl : undefined,
        },
      });
      toast.success("Source added!");
      setNotebook((prev) => (prev ? { ...prev, sources: [res.source, ...(prev.sources || [])] } : prev));
      setSourceTitle("");
      setSourceContent("");
      setSourceUrl("");
      setAddSourceOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to add source");
    } finally {
      setAddingSource(false);
    }
  };

  // Handle Delete Source
  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm("Are you sure you want to delete this source?")) return;
    try {
      await apiFetch(`/api/notebooks/${notebookId}/sources/${sourceId}`, { method: "DELETE" });
      toast.success("Source deleted");
      setNotebook((prev) => (prev ? { ...prev, sources: (prev.sources || []).filter((s) => s.id !== sourceId) } : prev));
      if (selectedSource?.id === sourceId) setSelectedSource(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete source");
    }
  };

  // Handle Send Chat Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim() || sendingMsg) return;

    const userMsgTemp: ChatMessage = {
      id: `temp-${Date.now()}`,
      notebookId,
      role: "USER",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsgTemp]);
    if (!textToSend) setChatInput("");
    setSendingMsg(true);

    try {
      const res = await apiFetch<{ success: boolean; userMessage: ChatMessage; assistantMessage?: ChatMessage }>(
        `/api/notebooks/${notebookId}/messages`,
        {
          data: {
            content: text,
            role: "USER",
          },
        }
      );

      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.id.startsWith("temp-"));
        return res.assistantMessage ? [...filtered, res.userMessage, res.assistantMessage] : [...filtered, res.userMessage];
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSendingMsg(false);
    }
  };

  // Handle Save Note / Artifact
  const handleCreateArtifact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    setCreatingNote(true);
    try {
      const res = await apiFetch<{ success: boolean; artifact: Artifact }>(`/api/notebooks/${notebookId}/artifacts`, {
        data: {
          title: noteTitle,
          content: noteContent,
          type: "NOTE",
        },
      });
      toast.success("Studio note saved!");
      setArtifacts((prev) => [res.artifact, ...prev]);
      setNoteTitle("");
      setNoteContent("");
      setCreateNoteOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save note");
    } finally {
      setCreatingNote(false);
    }
  };

  // Handle Delete Artifact
  const handleDeleteArtifact = async (artifactId: string) => {
    try {
      await apiFetch(`/api/notebooks/${notebookId}/artifacts/${artifactId}`, { method: "DELETE" });
      toast.success("Artifact deleted");
      setArtifacts((prev) => prev.filter((a) => a.id !== artifactId));
      if (selectedArtifact?.id === artifactId) setSelectedArtifact(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete artifact");
    }
  };

  // Handle Update Notebook
  const handleUpdateNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch<{ success: boolean; notebook: Notebook }>(`/api/notebooks/${notebookId}`, {
        method: "PATCH",
        data: {
          title: editTitle,
          description: editDesc,
          aiModel: editAiModel,
        },
      });
      toast.success("Notebook updated");
      setNotebook((prev) =>
        prev
          ? {
              ...prev,
              title: res.notebook.title,
              description: res.notebook.description,
              aiModel: res.notebook.aiModel,
            }
          : prev
      );
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update notebook");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <Sparkles className="w-6 h-6 animate-spin text-blue-500" />
          <span>Loading notebook workspace...</span>
        </div>
      </div>
    );
  }

  if (!notebook) return null;

  const currentModelInfo = AI_MODELS.find((m) => m.id === (notebook.aiModel || "gpt-4o-mini")) || AI_MODELS[1];

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950 px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-sm text-white max-w-[200px] sm:max-w-[300px] truncate">{notebook.title}</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditOpen(true)}
              className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Model Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs text-zinc-200 flex items-center gap-2 px-3 rounded-full cursor-pointer transition-colors outline-none">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium">{currentModelInfo.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {currentModelInfo.provider}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-zinc-800 text-white">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-zinc-400 font-semibold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-400" /> Select AI Model
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                {AI_MODELS.map((m) => (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() => handleSwitchAiModel(m.id)}
                    className={`flex items-center justify-between text-xs cursor-pointer py-2 ${
                      (notebook.aiModel || "gpt-4o-mini") === m.id ? "bg-blue-600/20 text-blue-400 font-semibold" : "hover:bg-zinc-900"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span>{m.name}</span>
                      <span className="text-[10px] text-zinc-500">{m.badge}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {m.provider}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 hidden sm:inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> {(notebook.sources || []).length} Sources Connected
          </span>
          <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-400 hover:text-white">
            <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share
          </Button>
        </div>
      </header>

      {/* Main 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* PANEL 1: SOURCES (Left Column - 280px to 320px) */}
        <aside className="w-80 border-r border-zinc-800/80 bg-zinc-950 flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <h2 className="font-semibold text-sm text-white">Sources</h2>
              <span className="text-xs text-zinc-500">({(notebook.sources || []).length})</span>
            </div>
            <Button
              size="sm"
              onClick={() => setAddSourceOpen(true)}
              className="h-8 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Source
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {(notebook.sources || []).length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-zinc-800 rounded-xl">
                <FileText className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                <p className="text-xs text-zinc-400 font-medium">No sources added yet</p>
                <p className="text-[11px] text-zinc-500 mt-1">Add text notes, URLs, or PDFs to ground your AI answers.</p>
                <Button
                  size="sm"
                  onClick={() => setAddSourceOpen(true)}
                  className="mt-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs text-white"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Source
                </Button>
              </div>
            ) : (
              notebook.sources?.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSource(s)}
                  className="group relative p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700/80 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {s.type === "URL" ? (
                        <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : s.type === "YT_TRANSCRIPT" ? (
                        <Video className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : s.type === "MARKDOWN" ? (
                        <FileCode className="w-4 h-4 text-purple-400 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                      <span className="font-medium text-xs text-white truncate">{s.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSource(s.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  {s.content && <p className="text-[11px] text-zinc-500 line-clamp-2">{s.content}</p>}
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                    <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* PANEL 2: CHAT & GROUNDED SYNTHESIS (Center Column - Flex 1) */}
        <main className="flex-1 bg-zinc-950 flex flex-col overflow-hidden">
          {/* Prompt Chips Bar */}
          <div className="p-3 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-medium shrink-0 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Quick Prompts:
              </span>
              <button
                onClick={() => handleSendMessage("Summarize the key findings across all connected sources.")}
                className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs shrink-0 transition-colors"
              >
                ✨ Summarize sources
              </button>
              <button
                onClick={() => handleSendMessage("Create a comprehensive study guide with questions and key terms.")}
                className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs shrink-0 transition-colors"
              >
                📝 Create Study Guide
              </button>
              <button
                onClick={() => handleSendMessage("Generate a structured outline of the material.")}
                className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs shrink-0 transition-colors"
              >
                📋 Generate Outline
              </button>
            </div>

            <div className="text-[11px] text-zinc-400 flex items-center gap-1 shrink-0 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800">
              <Cpu className="w-3 h-3 text-blue-400" /> {currentModelInfo.name}
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
                <div className="p-4 rounded-full bg-gradient-to-tr from-blue-600/20 to-purple-600/20 border border-blue-500/20 text-blue-400">
                  <Bot className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-white">Ask anything about your sources</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  NotebookLM synthesizes information strictly from your connected sources using <strong className="text-blue-400">{currentModelInfo.name}</strong>. Add PDFs, web links, or text notes to get grounded answers.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${m.role === "USER" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "ASSISTANT" && (
                    <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                      m.role === "USER"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.sources && Array.isArray(m.sources) && m.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-zinc-800 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-zinc-400 font-semibold">Citations:</span>
                        {m.sources.map((src: any, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full"
                          >
                            📄 {src.title || "Source"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {m.role === "USER" && (
                    <div className="w-7 h-7 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0 font-bold text-xs">
                      U
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Bottom Chat Input */}
          <div className="p-4 border-t border-zinc-800/80 bg-zinc-950 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center"
            >
              <Input
                type="text"
                placeholder={`Ask ${currentModelInfo.name} a question about your sources...`}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={sendingMsg}
                className="bg-zinc-900 border-zinc-800 text-white pr-12 py-3 h-12 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-xs placeholder:text-zinc-500"
              />
              <Button
                type="submit"
                disabled={!chatInput.trim() || sendingMsg}
                size="icon"
                className="absolute right-2 h-8 w-8 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
              >
                <SendHorizontal className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </main>

        {/* PANEL 3: STUDIO & ARTIFACTS (Right Column - 300px to 340px) */}
        <aside className="w-80 border-l border-zinc-800/80 bg-zinc-950 flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-purple-400" />
              <h2 className="font-semibold text-sm text-white">Studio</h2>
            </div>
            <Button
              size="sm"
              onClick={() => setCreateNoteOpen(true)}
              className="h-8 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium px-3 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Note
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Audio Overview Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/30 via-zinc-900 to-zinc-900 border border-purple-500/20 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Audio Overview
                </span>
                <span className="text-[10px] text-zinc-500">11:42</span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Deep Dive Podcast</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Two AI hosts discuss key concepts from your sources.</p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button
                  size="icon"
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className="h-9 w-9 rounded-full bg-purple-600 hover:bg-purple-500 text-white shrink-0 shadow-md shadow-purple-600/30"
                >
                  {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </Button>
                <div className="flex-1 flex items-center gap-1 h-6 px-2 bg-zinc-950/60 rounded-lg border border-purple-500/20">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <div className="flex-1 flex items-end gap-0.5 h-3">
                    {[40, 70, 30, 90, 50, 80, 40, 100, 60, 30, 75, 45].map((height, i) => (
                      <span
                        key={i}
                        style={{ height: isPlayingAudio ? `${height}%` : "30%" }}
                        className={`w-1 rounded-full transition-all duration-300 ${
                          isPlayingAudio ? "bg-purple-400 animate-pulse" : "bg-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Studio Notes & Artifacts List */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-400 px-1">Saved Notes & Outlines ({artifacts.length})</h4>
              {artifacts.length === 0 ? (
                <div className="text-center py-8 px-3 border border-dashed border-zinc-800 rounded-xl">
                  <Bookmark className="w-6 h-6 mx-auto text-zinc-600 mb-1" />
                  <p className="text-xs text-zinc-500">No notes saved yet</p>
                </div>
              ) : (
                artifacts.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedArtifact(a)}
                    className="group p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-purple-500/30 cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white truncate">{a.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteArtifact(a.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-2">{a.content}</p>
                    <span className="text-[10px] text-zinc-500 block pt-1">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Add Source Dialog */}
      <Dialog open={addSourceOpen} onOpenChange={setAddSourceOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Source to Notebook</DialogTitle>
          </DialogHeader>

          <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as any)} className="w-full mt-2">
            <TabsList className="grid grid-cols-5 bg-zinc-900 border border-zinc-800 text-[11px]">
              <TabsTrigger value="TEXT">Text</TabsTrigger>
              <TabsTrigger value="URL">Web Link</TabsTrigger>
              <TabsTrigger value="MARKDOWN">Markdown</TabsTrigger>
              <TabsTrigger value="YT_TRANSCRIPT">YouTube</TabsTrigger>
              <TabsTrigger value="PDF">PDF</TabsTrigger>
            </TabsList>

            <form onSubmit={handleAddSource} className="space-y-3 pt-3">
              <div>
                <label className="text-xs font-medium text-zinc-400">Source Title *</label>
                <Input
                  type="text"
                  placeholder="e.g. Lecture Notes / Video Title"
                  value={sourceTitle}
                  onChange={(e) => setSourceTitle(e.target.value)}
                  required
                  className="bg-zinc-900 border-zinc-800 text-white mt-1 text-xs"
                />
              </div>

              <TabsContent value="TEXT" className="m-0 pt-2">
                <label className="text-xs font-medium text-zinc-400">Raw Text Content</label>
                <Textarea
                  placeholder="Paste raw text, research notes, or article content..."
                  value={sourceContent}
                  onChange={(e) => setSourceContent(e.target.value)}
                  rows={4}
                  className="bg-zinc-900 border-zinc-800 text-white mt-1 resize-none text-xs"
                />
              </TabsContent>

              <TabsContent value="URL" className="m-0 pt-2">
                <label className="text-xs font-medium text-zinc-400">Web Link URL</label>
                <Input
                  type="url"
                  placeholder="https://wikipedia.org/wiki/..."
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white mt-1 text-xs"
                />
              </TabsContent>

              <TabsContent value="MARKDOWN" className="m-0 pt-2">
                <label className="text-xs font-medium text-zinc-400">Markdown Document (.md)</label>
                <Textarea
                  placeholder="# Document Title\n\nPaste markdown content with headers, lists, code blocks..."
                  value={sourceContent}
                  onChange={(e) => setSourceContent(e.target.value)}
                  rows={5}
                  className="bg-zinc-900 border-zinc-800 text-white mt-1 resize-none text-xs font-mono"
                />
              </TabsContent>

              <TabsContent value="YT_TRANSCRIPT" className="m-0 pt-2">
                <label className="text-xs font-medium text-zinc-400">YouTube Video URL or Transcript</label>
                <Input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white mt-1 text-xs mb-2"
                />
                <Textarea
                  placeholder="Paste video transcript text (optional)..."
                  value={sourceContent}
                  onChange={(e) => setSourceContent(e.target.value)}
                  rows={3}
                  className="bg-zinc-900 border-zinc-800 text-white resize-none text-xs"
                />
              </TabsContent>

              <TabsContent value="PDF" className="m-0 pt-2">
                <div className="border border-dashed border-zinc-800 rounded-xl p-6 text-center bg-zinc-900/40">
                  <FileUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-white">Click or drag PDF to upload</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Supports PDF, Markdown, and TXT files up to 25MB</p>
                </div>
              </TabsContent>

              <DialogFooter className="pt-3">
                <Button type="button" variant="ghost" onClick={() => setAddSourceOpen(false)} className="text-zinc-400">
                  Cancel
                </Button>
                <Button type="submit" disabled={addingSource} className="bg-blue-600 hover:bg-blue-500 text-white text-xs">
                  {addingSource ? "Adding..." : "Add Source"}
                </Button>
              </DialogFooter>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={createNoteOpen} onOpenChange={setCreateNoteOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Studio Note</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateArtifact} className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-zinc-400">Note Title *</label>
              <Input
                type="text"
                placeholder="Key Insights / Action Items"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-800 text-white mt-1 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400">Note Content *</label>
              <Textarea
                placeholder="Write your note or saved synthesis here..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={5}
                required
                className="bg-zinc-900 border-zinc-800 text-white mt-1 resize-none text-xs"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setCreateNoteOpen(false)} className="text-zinc-400">
                Cancel
              </Button>
              <Button type="submit" disabled={creatingNote} className="bg-purple-600 hover:bg-purple-500 text-white text-xs">
                {creatingNote ? "Saving..." : "Save Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Notebook Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Notebook</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateNotebook} className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-zinc-400">Title</label>
              <Input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white mt-1 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400">Description</label>
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="bg-zinc-900 border-zinc-800 text-white mt-1 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5 mb-1">
                <Cpu className="w-3.5 h-3.5 text-blue-400" /> Select AI Model
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {AI_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setEditAiModel(m.id)}
                    className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      editAiModel === m.id
                        ? "bg-blue-600/20 border-blue-500 ring-1 ring-blue-500 text-white"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <span className="font-semibold text-xs text-white">{m.name}</span>
                    <span className="text-[9px] text-zinc-500">{m.badge}</span>
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} className="text-zinc-400">
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-xs">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Source Detail Modal */}
      <Dialog open={!!selectedSource} onOpenChange={(o) => !o && setSelectedSource(null)}>
        {selectedSource && (
          <DialogContent className="sm:max-w-xl bg-zinc-950 text-white border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" /> {selectedSource.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>Type: {selectedSource.type}</span>
                <span>•</span>
                <span>Added {new Date(selectedSource.createdAt).toLocaleString()}</span>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 max-h-80 overflow-y-auto text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {selectedSource.content || selectedSource.fileUrl || "No raw text content available."}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
