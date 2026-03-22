import { z } from "zod";

export const CompressionMetricsSchema = z.object({
  struxTokens: z.number().int().nonnegative(),
  baselineTokens: z.number().int().nonnegative(),
  compressionRatio: z.number().nonnegative(),
  date: z.string(),
});

export type CompressionMetrics = z.infer<typeof CompressionMetricsSchema>;
