import { sourceRepository, SourceRepository } from "../repositories/source.repository.js";
import { notebookRepository, NotebookRepository } from "../repositories/notebook.repository.js";
import { ExpressError } from "../utils/express-error.js";
import type { SourceType, SourceStatus } from "@prisma/client";

export class SourceService {
  constructor(
    private repo: SourceRepository = sourceRepository,
    private notebookRepo: NotebookRepository = notebookRepository
  ) {}

  private async verifyNotebookOwnership(notebookId: string, userId: string) {
    const notebook = await this.notebookRepo.findByIdAndUserId(notebookId, userId);
    if (!notebook) {
      throw new ExpressError(404, "Notebook not found");
    }
    return notebook;
  }

  async getSourcesByNotebookId(notebookId: string, userId: string) {
    await this.verifyNotebookOwnership(notebookId, userId);
    return await this.repo.findByNotebookId(notebookId);
  }

  async getSourceById(id: string, notebookId: string, userId: string) {
    await this.verifyNotebookOwnership(notebookId, userId);
    const source = await this.repo.findById(id, notebookId);
    if (!source) {
      throw new ExpressError(404, "Source not found");
    }
    return source;
  }

  async addSource(notebookId: string, userId: string, data: { title: string; type: SourceType; content?: string; summary?: string; fileUrl?: string }) {
    await this.verifyNotebookOwnership(notebookId, userId);
    return await this.repo.create(notebookId, data);
  }

  async updateSource(id: string, notebookId: string, userId: string, data: { title?: string; type?: SourceType; content?: string; summary?: string; fileUrl?: string; status?: SourceStatus }) {
    await this.verifyNotebookOwnership(notebookId, userId);
    await this.getSourceById(id, notebookId, userId);
    return await this.repo.update(id, notebookId, data);
  }

  async deleteSource(id: string, notebookId: string, userId: string) {
    await this.verifyNotebookOwnership(notebookId, userId);
    await this.getSourceById(id, notebookId, userId);
    return await this.repo.delete(id, notebookId);
  }
}

export const sourceService = new SourceService();
