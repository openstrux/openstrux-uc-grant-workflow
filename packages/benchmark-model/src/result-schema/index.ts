import { z } from "zod";

export const BenchmarkResultSchema = z.object({
  timestamp: z.string().datetime(),
  path: z.enum(["direct", "openstrux"]),
  llm: z.string().optional(),
  generatedFileCount: z.number().int().nonnegative().optional(),
  totalLines: z.number().int().nonnegative().optional(),
  tokenCount: z.number().int().nonnegative().optional(),
  executionTimeMs: z.number().nonnegative().optional(),
  manualTestResults: z.string().optional(),
  repairNeeded: z.boolean().optional(),
  resultNote: z.string().optional(),
  feedback: z.string().optional(),
});

export type BenchmarkResult = z.infer<typeof BenchmarkResultSchema>;
