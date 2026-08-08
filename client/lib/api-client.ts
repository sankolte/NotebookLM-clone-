const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8081";

interface FetchOptions extends RequestInit {
  data?: any;
}

export async function apiFetch<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { data, headers: customHeaders, ...customOptions } = options;

  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(customHeaders as Record<string, string>),
  };

  const config: RequestInit = {
    method: data ? "POST" : "GET",
    headers,
    credentials: "include", // Send session cookies to backend
    body: data ? JSON.stringify(data) : undefined,
    ...customOptions,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  let responseData: any;
  try {
    responseData = await response.json();
  } catch {
    responseData = null;
  }

  if (!response.ok) {
    const errorMsg = responseData?.message || responseData?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return responseData as T;
}

export const AI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", badge: "Most Capable" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", badge: "Fast & Lightweight" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI", badge: "High Precision" },
  { id: "o3-mini", name: "o3 Mini", provider: "OpenAI", badge: "Reasoning" },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", badge: "Creative Writing" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google", badge: "Long Context" },
] as const;

export interface Notebook {
  id: string;
  title: string;
  description?: string | null;
  icon?: string;
  color?: string;
  aiModel?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    sources: number;
    messages: number;
    artifacts: number;
  };
  sources?: Source[];
  messages?: ChatMessage[];
  artifacts?: Artifact[];
}

export interface Source {
  id: string;
  notebookId: string;
  title: string;
  type: "PDF" | "TEXT" | "URL" | "MARKDOWN" | "YT_TRANSCRIPT";
  content?: string;
  summary?: string;
  fileUrl?: string;
  status: "PROCESSING" | "READY" | "ERROR";
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  notebookId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources?: any;
  createdAt: string;
}

export interface Artifact {
  id: string;
  notebookId: string;
  title: string;
  type: "NOTE" | "AUDIO_OVERVIEW" | "SUMMARY" | "STUDY_GUIDE" | "OUTLINE";
  content: string;
  createdAt: string;
  updatedAt: string;
}
