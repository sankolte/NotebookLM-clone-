import { notebookRepository, NotebookRepository } from "../repositories/notebook.repository.js";
import { ExpressError } from "../utils/express-error.js";
import type { SourceType } from "@prisma/client";

export class NotebookService {
  constructor(private repo: NotebookRepository = notebookRepository) {}

  async getUserNotebooks(userId: string) {
    return await this.repo.findAllByUserId(userId);
  }

  async getNotebookById(id: string, userId: string) {
    const notebook = await this.repo.findByIdAndUserId(id, userId);
    if (!notebook) {
      throw new ExpressError(404, "Notebook not found");
    }
    return notebook;
  }

  async createNotebook(userId: string, data: { title: string; description?: string; icon?: string; color?: string; aiModel?: string }) {
    return await this.repo.create(userId, data);
  }

  async updateNotebook(id: string, userId: string, data: { title?: string; description?: string | null; icon?: string; color?: string; aiModel?: string }) {
    await this.getNotebookById(id, userId); // verify ownership
    return await this.repo.update(id, userId, data);
  }

  async deleteNotebook(id: string, userId: string) {
    await this.getNotebookById(id, userId); // verify ownership
    return await this.repo.delete(id, userId);
  }

  // Sources
  async addSource(notebookId: string, userId: string, data: { title: string; type: SourceType; content?: string; summary?: string; fileUrl?: string }) {
    await this.getNotebookById(notebookId, userId);
    return await this.repo.addSource(notebookId, data);
  }

  async deleteSource(sourceId: string, notebookId: string, userId: string) {
    await this.getNotebookById(notebookId, userId);
    return await this.repo.deleteSource(sourceId, notebookId);
  }

  // Chat
  async addChatMessage(notebookId: string, userId: string, data: { role: "USER" | "ASSISTANT"; content: string; sources?: any }) {
    const notebook = await this.getNotebookById(notebookId, userId);
    const userMessage = await this.repo.addMessage(notebookId, data);

    // If message is from user, generate simulated AI response using notebook's active AI model
    if (data.role === "USER") {
      const activeModel = notebook.aiModel || "gpt-4o-mini";
      const sourceTitles = notebook.sources.map((s) => s.title).join(", ");

      const aiResponseContent = notebook.sources.length > 0
        ? `[Powered by ${activeModel}] Based on your sources (${sourceTitles || "uploaded materials"}): Here is a synthesis regarding "${data.content}".`
        : `[Powered by ${activeModel}] Ready to analyze! Add some sources (PDFs, web links, markdown, or text notes) to this notebook so I can provide grounded answers.`;

      const assistantMessage = await this.repo.addMessage(notebookId, {
        role: "ASSISTANT",
        content: aiResponseContent,
        sources: notebook.sources.map((s) => ({ id: s.id, title: s.title })),
      });

      return { userMessage, assistantMessage };
    }

    return { userMessage };
  }

  // Artifacts
  async createArtifact(notebookId: string, userId: string, data: { title: string; type: "NOTE" | "AUDIO_OVERVIEW" | "SUMMARY" | "STUDY_GUIDE" | "OUTLINE"; content: string }) {
    await this.getNotebookById(notebookId, userId);
    return await this.repo.createArtifact(notebookId, data);
  }

  async deleteArtifact(artifactId: string, notebookId: string, userId: string) {
    await this.getNotebookById(notebookId, userId);
    return await this.repo.deleteArtifact(artifactId, notebookId);
  }
}

export const notebookService = new NotebookService();
