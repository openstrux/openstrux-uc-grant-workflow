import { z } from "zod";

export const ScorecardEntrySchema = z.object({
  runId: z.string(),
  path: z.enum(["direct", "openstrux"]),
  phase: z.string(),
  unitTestsPassed: z.number().int().nonnegative(),
  unitTestsTotal: z.number().int().nonnegative(),
  integrationTestsPassed: z.number().int().nonnegative(),
  integrationTestsTotal: z.number().int().nonnegative(),
  tscExitCode: z.number().int(),
  notes: z.string().optional(),
});

export type ScorecardEntry = z.infer<typeof ScorecardEntrySchema>;
