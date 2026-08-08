import { prisma } from "../lib/prisma.js";
import { handlePrismaError } from "../utils/prisma-error.js";
import type { Prisma, SourceType, SourceStatus } from "@prisma/client";

export class NotebookRepository {
  async findAllByUserId(userId: string) {
    try {
      return await prisma.notebook.findMany({
        where: { userId },
        include: {
          _count: {
            select: {
              sources: true,
              messages: true,
              artifacts: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findByIdAndUserId(id: string, userId: string) {
    try {
      return await prisma.notebook.findFirst({
        where: { id, userId },
        include: {
          sources: {
            orderBy: { createdAt: "desc" },
          },
          messages: {
            orderBy: { createdAt: "asc" },
          },
          artifacts: {
            orderBy: { createdAt: "desc" },
          },
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async create(userId: string, data: { title: string; description?: string; icon?: string; color?: string; aiModel?: string }) {
    try {
      return await prisma.notebook.create({
        data: {
          ...data,
          userId,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(id: string, userId: string, data: { title?: string; description?: string | null; icon?: string; color?: string; aiModel?: string }) {
    try {
      return await prisma.notebook.update({
        where: { id, userId },
        data,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(id: string, userId: string) {
    try {
      return await prisma.notebook.delete({
        where: { id, userId },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  // Source DB methods
  async addSource(notebookId: string, data: { title: string; type: SourceType; content?: string; summary?: string; fileUrl?: string }) {
    try {
      return await prisma.source.create({
        data: {
          ...data,
          notebookId,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateSource(sourceId: string, notebookId: string, data: { title?: string; type?: SourceType; content?: string; summary?: string; fileUrl?: string; status?: SourceStatus }) {
    try {
      return await prisma.source.update({
        where: { id: sourceId, notebookId },
        data,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async deleteSource(sourceId: string, notebookId: string) {
    try {
      return await prisma.source.delete({
        where: { id: sourceId, notebookId },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  // Chat Message DB methods
  async addMessage(notebookId: string, data: { role: "USER" | "ASSISTANT"; content: string; sources?: any }) {
    try {
      return await prisma.chatMessage.create({
        data: {
          ...data,
          notebookId,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  // Artifact DB methods
  async createArtifact(notebookId: string, data: { title: string; type: "NOTE" | "AUDIO_OVERVIEW" | "SUMMARY" | "STUDY_GUIDE" | "OUTLINE"; content: string }) {
    try {
      return await prisma.artifact.create({
        data: {
          ...data,
          notebookId,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async deleteArtifact(artifactId: string, notebookId: string) {
    try {
      return await prisma.artifact.delete({
        where: { id: artifactId, notebookId },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  // Chunk DB methods for RAG
  async createChunks(chunksData: Array<{ notebookId: string; sourceId: string; chunkIndex: number; content: string; tokenCount?: number; embedding?: number[]; metadata?: any }>) {
    try {
      return await prisma.chunk.createMany({
        data: chunksData,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findChunksByNotebookId(notebookId: string) {
    try {
      return await prisma.chunk.findMany({
        where: { notebookId },
        orderBy: { chunkIndex: "asc" },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const notebookRepository = new NotebookRepository();
