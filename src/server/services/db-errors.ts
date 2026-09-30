import "server-only";
import { Prisma } from "@/generated/prisma/client";

// P2002: a unique constraint refused the write. P2025: the row a write
// targeted, with all its conditions, was not there.
export function hasPrismaCode(error: unknown, code: "P2002" | "P2025"): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}
