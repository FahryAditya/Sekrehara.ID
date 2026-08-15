"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import type { FilePermissionType } from "./generated/prisma/enums";

export type FolderItem = {
  id: string;
  name: string;
  parentId: string | null;
  fileCount: number;
  createdAt: string;
};

export type FileItem = {
  id: string;
  fileName: string;
  filePath: string | null;
  fileSize: number | null;
  fileType: string | null;
  folderId: string | null;
  uploadedAt: string;
};

export type ArchiveViewResult = {
  folders: FolderItem[];
  files: FileItem[];
  path: { id: string; name: string }[];
};

export type ActionResult = { ok: true; id: string } | { error: string };

export async function getArchiveViewAction(folderId: string | null): Promise<ArchiveViewResult> {
  await requireUser();

  const [folders, files, path] = await Promise.all([
    prisma.folder.findMany({
      where: { parentId: folderId },
      orderBy: { name: "asc" },
      include: { _count: { select: { files: true } } },
    }),
    prisma.file.findMany({
      where: { folderId },
      orderBy: { uploadedAt: "desc" },
    }),
    buildPath(folderId),
  ]);

  return {
    folders: folders.map((f) => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      fileCount: f._count.files,
      createdAt: f.createdAt.toISOString(),
    })),
    files: files.map((f) => ({
      id: f.id,
      fileName: f.fileName,
      filePath: f.filePath,
      fileSize: f.fileSize,
      fileType: f.fileType,
      folderId: f.folderId,
      uploadedAt: f.uploadedAt.toISOString(),
    })),
    path,
  };
}

async function buildPath(folderId: string | null): Promise<{ id: string; name: string }[]> {
  const path: { id: string; name: string }[] = [];
  let currentId = folderId;

  while (currentId) {
    const folder = await prisma.folder.findUnique({ where: { id: currentId } });
    if (!folder) break;
    path.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }

  return path;
}

export type CreateFolderInput = {
  name: string;
  parentId?: string | null;
};

export async function createFolderAction(input: CreateFolderInput): Promise<ActionResult> {
  const session = await requirePermission("manage_archive");
  const name = input.name.trim();
  if (!name) return { error: "Nama folder wajib diisi." };

  const parentId = input.parentId || null;
  const dup = await prisma.folder.findFirst({ where: { name, parentId } });
  if (dup) return { error: "Folder dengan nama tersebut sudah ada di lokasi ini." };

  const folder = await prisma.folder.create({
    data: { name, parentId, createdById: session.id },
  });

  await createActivityLog(session.id, "CREATE", "FOLDER", folder.id, `Membuat folder ${name}`);
  return { ok: true, id: folder.id };
}

export async function renameFolderAction(
  id: string,
  name: string
): Promise<ActionResult> {
  const session = await requirePermission("manage_archive");
  const trimmed = name.trim();
  if (!trimmed) return { error: "Nama folder wajib diisi." };

  const folder = await prisma.folder.findUnique({ where: { id } });
  if (!folder) return { error: "Folder tidak ditemukan." };

  const dup = await prisma.folder.findFirst({
    where: { name: trimmed, parentId: folder.parentId, NOT: { id } },
  });
  if (dup) return { error: "Folder dengan nama tersebut sudah ada di lokasi ini." };

  await prisma.folder.update({ where: { id }, data: { name: trimmed } });
  await createActivityLog(session.id, "UPDATE", "FOLDER", id, `Mengganti nama folder menjadi ${trimmed}`);
  return { ok: true, id };
}

export async function deleteFolderAction(id: string): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_archive");
  const folder = await prisma.folder.findUnique({ where: { id } });
  if (!folder) return { error: "Folder tidak ditemukan." };

  await prisma.folder.delete({ where: { id } });
  await createActivityLog(session.id, "DELETE", "FOLDER", id, `Menghapus folder ${folder.name}`);
  return { ok: true };
}

export type UploadFileInput = {
  folderId?: string | null;
  fileName: string;
  filePath?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
};

export async function uploadFileAction(input: UploadFileInput): Promise<ActionResult> {
  const session = await requirePermission("manage_archive");
  const fileName = input.fileName.trim();
  if (!fileName) return { error: "Nama file wajib diisi." };

  const file = await prisma.file.create({
    data: {
      folderId: input.folderId || null,
      fileName,
      filePath: input.filePath?.trim() || null,
      fileSize: input.fileSize ?? null,
      fileType: input.fileType?.trim() || null,
      uploadedById: session.id,
    },
  });

  await createActivityLog(session.id, "UPLOAD", "FILE", file.id, `Mengunggah file ${fileName}`);
  return { ok: true, id: file.id };
}

export async function renameFileAction(id: string, fileName: string): Promise<ActionResult> {
  const session = await requirePermission("manage_archive");
  const trimmed = fileName.trim();
  if (!trimmed) return { error: "Nama file wajib diisi." };

  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) return { error: "File tidak ditemukan." };

  await prisma.file.update({ where: { id }, data: { fileName: trimmed } });
  await createActivityLog(session.id, "UPDATE", "FILE", id, `Mengganti nama file menjadi ${trimmed}`);
  return { ok: true, id };
}

export async function deleteFileAction(id: string): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_archive");
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) return { error: "File tidak ditemukan." };

  await prisma.file.delete({ where: { id } });
  await createActivityLog(session.id, "DELETE", "FILE", id, `Menghapus file ${file.fileName}`);
  return { ok: true };
}

export type FilePermissionInput = {
  fileId: string;
  userId?: string | null;
  sekbidId?: string | null;
  permissionType: FilePermissionType;
};

export async function setFilePermissionAction(
  input: FilePermissionInput
): Promise<ActionResult> {
  const session = await requirePermission("manage_archive");
  const file = await prisma.file.findUnique({ where: { id: input.fileId } });
  if (!file) return { error: "File tidak ditemukan." };

  if (!input.userId && !input.sekbidId) {
    return { error: "Pilih pengguna atau sekbid yang diberi akses." };
  }

  const existing = await prisma.filePermission.findFirst({
    where: { fileId: input.fileId, userId: input.userId ?? null, sekbidId: input.sekbidId ?? null },
  });

  let permission;
  if (existing) {
    permission = await prisma.filePermission.update({
      where: { id: existing.id },
      data: { permissionType: input.permissionType },
    });
  } else {
    permission = await prisma.filePermission.create({
      data: {
        fileId: input.fileId,
        userId: input.userId ?? null,
        sekbidId: input.sekbidId ?? null,
        permissionType: input.permissionType,
      },
    });
  }

  await createActivityLog(session.id, "UPDATE_PERMISSION", "FILE", input.fileId, "Mengatur izin akses file");
  return { ok: true, id: permission.id };
}

export async function listFilePermissionsAction(fileId: string) {
  await requireUser();
  const rows = await prisma.filePermission.findMany({
    where: { fileId },
    include: { user: true, sekbid: true },
  });
  return rows.map((p) => ({
    id: p.id,
    userId: p.userId,
    userName: p.user?.name ?? null,
    sekbidId: p.sekbidId,
    sekbidName: p.sekbid?.name ?? null,
    permissionType: p.permissionType as FilePermissionType,
  }));
}

export async function removeFilePermissionAction(
  permissionId: string
): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_archive");
  const permission = await prisma.filePermission.findUnique({ where: { id: permissionId } });
  if (!permission) return { error: "Izin akses tidak ditemukan." };

  await prisma.filePermission.delete({ where: { id: permissionId } });
  await createActivityLog(session.id, "REMOVE_PERMISSION", "FILE", permission.fileId, "Menghapus izin akses file");
  return { ok: true };
}
