export interface CatalogModel {
  id: string;
  name: string;
  family: string;
  size: string;
  sizeBytes: number;
  quantization: string;
  engine: "mediapipe";
  huggingFaceUrl: string;
  description?: string;
}

export const MODEL_CATALOG: CatalogModel[] = [
  {
    id: "gemma-3n-e2b-int4",
    name: "Gemma 3n E2B",
    family: "Google",
    size: "1.5 GB",
    sizeBytes: 1_610_612_736,
    quantization: "int4",
    engine: "mediapipe",
    huggingFaceUrl:
      "https://huggingface.co/google/gemma-3n-E2B-it-litert-lm/blob/main/gemma-3n-E2B-it-int4-Web.litertlm",
    description: "Smallest Gemma 3n variant, optimized for web",
  },
  {
    id: "gemma-3n-e4b-int4",
    name: "Gemma 3n E4B",
    family: "Google",
    size: "2.8 GB",
    sizeBytes: 3_006_477_107,
    quantization: "int4",
    engine: "mediapipe",
    huggingFaceUrl:
      "https://huggingface.co/google/gemma-3n-E4B-it-litert-lm/blob/main/gemma-3n-E4B-it-int4-Web.litertlm",
    description: "Larger Gemma 3n variant with better quality",
  },
  {
    id: "gemma-3-1b-int4",
    name: "Gemma 3 1B",
    family: "Google",
    size: "700 MB",
    sizeBytes: 734_003_200,
    quantization: "int4",
    engine: "mediapipe",
    huggingFaceUrl: "https://huggingface.co/litert-community/Gemma3-1B-IT/blob/main/gemma3-1b-it-int4-web.task",
    description: "Compact Gemma 3, good balance of speed and quality",
  },
  {
    id: "gemma-3-1b-int8",
    name: "Gemma 3 1B (int8)",
    family: "Google",
    size: "1.0 GB",
    sizeBytes: 1_060_372_480,
    quantization: "int8",
    engine: "mediapipe",
    huggingFaceUrl: "https://huggingface.co/litert-community/Gemma3-1B-IT/blob/main/gemma3-1b-it-int8-web.task",
    description: "Higher precision Gemma 3 1B",
  },
  {
    id: "gemma-3-1b-q4_0",
    name: "Gemma 3 1B (Q4_0)",
    family: "Google",
    size: "776 MB",
    sizeBytes: 813_694_976,
    quantization: "q4_0",
    engine: "mediapipe",
    huggingFaceUrl: "https://huggingface.co/litert-community/Gemma3-1B-IT/blob/main/gemma3-1b-it-q4_0-web.task",
    description: "QAT quantized Gemma 3 1B",
  },
];

export function getModelById(id: string): CatalogModel | undefined {
  return MODEL_CATALOG.find((m) => m.id === id);
}
