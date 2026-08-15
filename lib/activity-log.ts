import "server-only";
import { prisma } from "@/lib/prisma";

export type ActivityInput = {
  action: string;
  entityType: string;
  entityId?: string;
  description?: string;
};

export async function createActivityLog(
  userId: string | null,
  action: string,
  entityType: string,
  entityId?: string,
  description?: string
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        description,
      },
    });
  } catch {
    // Jangan biarkan logging mengganggu operasi utama
  }
}

export async function logActivity(userId: string | null, input: ActivityInput): Promise<void> {
  await createActivityLog(
    userId,
    input.action,
    input.entityType,
    input.entityId,
    input.description
  );
}
