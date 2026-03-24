import { vi, beforeEach } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { PrismaClient } from "@prisma/client";

// Mock @prisma/client at the module level so all service imports get the mock.
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}));

export const mockPrisma = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(mockPrisma);
});
