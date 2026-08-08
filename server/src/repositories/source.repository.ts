import { prisma } from "../lib/prisma.js";
import { handlePrismaError } from "../utils/prisma-error.js";
import type { SourceType, SourceStatus } from "@prisma/client";

export class SourceRepository {
  async findByNotebookId(notebookId: string) {
    try {
      return await prisma.source.findMany({
        where: { notebookId },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findById(id: string, notebookId: string) {
    try {
      return await prisma.source.findFirst({
        where: { id, notebookId },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async create(notebookId: string, data: { title: string; type: SourceType; content?: string; summary?: string; fileUrl?: string }) {
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

  async update(id: string, notebookId: string, data: { title?: string; type?: SourceType; content?: string; summary?: string; fileUrl?: string; status?: SourceStatus }) {
    try {
      return await prisma.source.update({
        where: { id, notebookId },
        data,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(id: string, notebookId: string) {
    try {
      return await prisma.source.delete({
        where: { id, notebookId },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const sourceRepository = new SourceRepository();
