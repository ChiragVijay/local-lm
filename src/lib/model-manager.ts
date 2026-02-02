import { db } from "./db";
import type { CatalogModel } from "./models/catalog";
import { getModelById } from "./models/catalog";

export interface DownloadProgress {
  modelId: string;
  downloaded: number;
  total: number;
  percentage: number;
  speed: number;
  eta: number;
  status: "idle" | "importing" | "complete" | "error";
  error?: string;
}

export type DownloadProgressCallback = (progress: DownloadProgress) => void;

class ModelManager {
  private progressCallbacks = new Map<string, Set<DownloadProgressCallback>>();

  async isModelDownloaded(modelId: string): Promise<boolean> {
    const model = await db.models.get(modelId);
    return model?.downloaded ?? false;
  }

  async getModelBlob(modelId: string): Promise<Blob | null> {
    const modelBlob = await db.modelBlobs.get(modelId);
    return modelBlob?.blob ?? null;
  }

  async getModelUrl(modelId: string): Promise<string | null> {
    const blob = await this.getModelBlob(modelId);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return null;
  }

  onProgress(modelId: string, callback: DownloadProgressCallback): () => void {
    if (!this.progressCallbacks.has(modelId)) {
      this.progressCallbacks.set(modelId, new Set());
    }
    this.progressCallbacks.get(modelId)!.add(callback);

    return () => {
      this.progressCallbacks.get(modelId)?.delete(callback);
    };
  }

  private emitProgress(progress: DownloadProgress) {
    this.progressCallbacks.get(progress.modelId)?.forEach((cb) => cb(progress));
  }

  async importModelFile(modelId: string, file: File): Promise<void> {
    const catalogModel = getModelById(modelId);
    if (!catalogModel) {
      throw new Error(`Model ${modelId} not found in catalog`);
    }

    await this.ensureModelRecord(catalogModel);

    this.emitProgress({
      modelId,
      downloaded: 0,
      total: file.size,
      percentage: 0,
      speed: 0,
      eta: 0,
      status: "importing",
    });

    try {
      await db.modelBlobs.put({ id: modelId, blob: file });

      await db.models.update(modelId, {
        downloaded: true,
        downloadProgress: 100,
        size: file.size,
      });

      this.emitProgress({
        modelId,
        downloaded: file.size,
        total: file.size,
        percentage: 100,
        speed: 0,
        eta: 0,
        status: "complete",
      });
    } catch (error) {
      this.emitProgress({
        modelId,
        downloaded: 0,
        total: file.size,
        percentage: 0,
        speed: 0,
        eta: 0,
        status: "error",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async importCustomModel(name: string, file: File): Promise<string> {
    const id = `custom-${crypto.randomUUID()}`;

    await db.models.add({
      id,
      name,
      engine: "mediapipe",
      size: file.size,
      quantization: "unknown",
      downloaded: true,
      downloadProgress: 100,
    });

    await db.modelBlobs.put({ id, blob: file });

    return id;
  }

  private async ensureModelRecord(catalogModel: CatalogModel) {
    const existing = await db.models.get(catalogModel.id);
    if (!existing) {
      await db.models.add({
        id: catalogModel.id,
        name: catalogModel.name,
        engine: catalogModel.engine,
        size: catalogModel.sizeBytes,
        quantization: catalogModel.quantization,
        downloaded: false,
        downloadProgress: 0,
      });
    }
  }

  async deleteModel(modelId: string): Promise<void> {
    await db.modelBlobs.delete(modelId);
    await db.models.update(modelId, { downloaded: false, downloadProgress: 0 });
  }

  async getDownloadedModels(): Promise<string[]> {
    const models = await db.models.where("downloaded").equals(1).toArray();
    return models.map((m) => m.id);
  }
}

export const modelManager = new ModelManager();
