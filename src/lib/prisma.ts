// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Prisma client singleton.
 *
 * The global pattern prevents hot-reload from spawning multiple connections
 * in development.  In tests, `@prisma/client` is mocked at the module level
 * so `new PrismaClient()` returns the test double.
 */
export const prisma: PrismaClient =
  global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
