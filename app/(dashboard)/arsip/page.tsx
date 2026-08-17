"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  getArchiveViewAction,
  createFolderAction,
  renameFolderAction,
  deleteFolderAction,
  uploadFileAction,
  renameFileAction,
  deleteFileAction,
  type FolderItem,
  type FileItem,
} from "@/lib/archive-actions";
import { FolderIcon, PaperclipIcon, PlusIcon, TrashIcon, PencilIcon } from "@/components/ui/icons";
import { getCache, setCache } from "@/lib/cache-store";
import { formatDateTime } from "@/lib/format";
import { combineClassNames } from "@/lib/utils";

export default function ArchivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folder");

  const cacheKey = `archive-view-${folderId ?? "root"}`;
  const cachedView = getCache<{ folders: FolderItem[]; files: FileItem[]; path: { id: string; name: string }[] }>(cacheKey);

  const [folders, setFolders] = useState<FolderItem[]>(cachedView?.folders ?? []);
  const [files, setFiles] = useState<FileItem[]>(cachedView?.files ?? []);
  const [path, setPath] = useState<{ id: string; name: string }[]>(cachedView?.path ?? []);
  const [isLoading, setIsLoading] = useState(!cachedView);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [fileName, setFileName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [fileType, setFileType] = useState("");

  const [folderToRename, setFolderToRename] = useState<FolderItem | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [fileToRename, setFileToRename] = useState<FileItem | null>(null);
  const [renameFileValue, setRenameFileValue] = useState("");

  const [itemToDelete, setItemToDelete] = useState<{ type: "folder" | "file"; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(() => {
    getArchiveViewAction(folderId)
      .then((result) => {
        setCache(cacheKey, result);
        setFolders(result.folders);
        setFiles(result.files);
        setPath(result.path);
      })
      .catch((error) => {
        showError(error instanceof Error ? error.message : "Gagal memuat arsip.");
      })
      .finally(() => setIsLoading(false));
  }, [folderId, cacheKey, showError]);

  useEffect(() => {
    load();
  }, [load]);

  const openFolder = (id: string) => {
    router.push(`/arsip?folder=${id}`);
  };

  const goToRoot = () => {
    router.push("/arsip");
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      showError("Nama folder wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    const result = await createFolderAction({ name: folderName.trim(), parentId: folderId });
    setIsSubmitting(false);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    showSuccess("Folder dibuat.");
    setIsFolderModalOpen(false);
    setFolderName("");
    load();
  };

  const handleConfirmRenameFolder = async () => {
    if (!folderToRename) return;
    setIsSubmitting(true);
    const result = await renameFolderAction(folderToRename.id, renameValue);
    setIsSubmitting(false);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    showSuccess("Folder diganti namanya.");
    setFolderToRename(null);
    setRenameValue("");
    load();
  };

  const handleUploadFile = async () => {
    if (!fileName.trim()) {
      showError("Nama file wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    const result = await uploadFileAction({
      folderId,
      fileName: fileName.trim(),
      filePath: filePath.trim() || null,
      fileType: fileType.trim() || null,
    });
    setIsSubmitting(false);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    showSuccess("File diunggah.");
    setIsFileModalOpen(false);
    setFileName("");
    setFilePath("");
    setFileType("");
    load();
  };

  const handleConfirmRenameFile = async () => {
    if (!fileToRename) return;
    setIsSubmitting(true);
    const result = await renameFileAction(fileToRename.id, renameFileValue);
    setIsSubmitting(false);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    showSuccess("File diganti namanya.");
    setFileToRename(null);
    setRenameFileValue("");
    load();
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const result =
      itemToDelete.type === "folder"
        ? await deleteFolderAction(itemToDelete.id)
        : await deleteFileAction(itemToDelete.id);
    setIsDeleting(false);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    showSuccess(`${itemToDelete.type === "folder" ? "Folder" : "File"} dihapus.`);
    setItemToDelete(null);
    load();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Arsip"
        description="Kelola dokumen organisasi dalam folder."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsFileModalOpen(true)}>
              <PaperclipIcon className="h-4 w-4" />
              Upload File
            </Button>
            <Button onClick={() => setIsFolderModalOpen(true)}>
              <PlusIcon className="h-4 w-4" />
              Buat Folder
            </Button>
          </div>
        }
      />

      {path.length > 0 || folderId ? (
        <nav aria-label="Breadcrumb arsip" className="mb-5 flex flex-wrap items-center gap-1 text-sm">
          <button
            type="button"
            onClick={goToRoot}
            className={combineClassNames(
              "inline-flex items-center gap-1 font-medium transition-colors",
              path.length > 0 ? "text-muted hover:text-primary" : "text-foreground"
            )}
          >
            <FolderIcon className="h-4 w-4" />
            Arsip
          </button>
          {path.map((item) => (
            <span key={item.id} className="flex items-center gap-1">
              <span className="text-muted">/</span>
              <button
                type="button"
                onClick={() => openFolder(item.id)}
                className="font-medium text-muted transition-colors hover:text-primary"
              >
                {item.name}
              </button>
            </span>
          ))}
        </nav>
      ) : null}

      {folders.length > 0 || files.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {folders.map((folder) => (
            <Card key={folder.id} className="flex flex-col p-5">
              <button
                type="button"
                onClick={() => openFolder(folder.id)}
                className="flex items-center gap-3 text-left"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <FolderIcon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">{folder.name}</span>
                  <span className="block text-xs text-muted">{folder.fileCount} file</span>
                </span>
              </button>
              <div className="mt-4 flex justify-end gap-1 border-t border-border pt-3">
                <Button
                  variant="ghost"
                  size="small"
                  aria-label={`Ubah nama folder ${folder.name}`}
                  onClick={() => {
                    setFolderToRename(folder);
                    setRenameValue(folder.name);
                  }}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  aria-label={`Hapus folder ${folder.name}`}
                  className="text-danger hover:bg-danger-soft hover:text-danger"
                  onClick={() => setItemToDelete({ type: "folder", id: folder.id, name: folder.name })}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}

          {files.map((file) => (
            <Card key={file.id} className="flex flex-col p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background text-muted">
                  <PaperclipIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{file.fileName}</p>
                  <p className="text-xs text-muted">
                    {file.fileType ?? "file"}
                    {file.fileSize ? ` · ${Math.round(file.fileSize / 1024)} KB` : ""}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted">Diunggah {formatDateTime(file.uploadedAt)}</p>
              <div className="mt-4 flex justify-end gap-1 border-t border-border pt-3">
                {file.filePath ? (
                  <Button size="small" variant="secondary" onClick={() => window.open(file.filePath!, "_blank")}>
                    Buka
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="small"
                  aria-label={`Ubah nama file ${file.fileName}`}
                  onClick={() => {
                    setFileToRename(file);
                    setRenameFileValue(file.fileName);
                  }}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  aria-label={`Hapus file ${file.fileName}`}
                  className="text-danger hover:bg-danger-soft hover:text-danger"
                  onClick={() => setItemToDelete({ type: "file", id: file.id, name: file.fileName })}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<FolderIcon className="h-6 w-6" />}
            title={folderId ? "Folder kosong" : "Belum ada arsip"}
            description={
              folderId
                ? "Folder ini belum memiliki file atau sub-folder."
                : "Buat folder atau unggah file untuk mulai menyimpan dokumen."
            }
            action={
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setIsFileModalOpen(true)}>
                  <PaperclipIcon className="h-4 w-4" />
                  Upload File
                </Button>
                <Button onClick={() => setIsFolderModalOpen(true)}>
                  <PlusIcon className="h-4 w-4" />
                  Buat Folder
                </Button>
              </div>
            }
          />
        </Card>
      )}

      <Modal
        open={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        title="Buat Folder"
        description={path.length > 0 ? `Buat folder di dalam "${path[path.length - 1].name}".` : "Buat folder di arsip utama."}
      >
        <div className="flex flex-col gap-5">
          <Input
            id="folder-name"
            label="Nama Folder"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="mis. Surat 2026"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsFolderModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateFolder} isLoading={isSubmitting}>
              Buat Folder
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        title="Upload File"
        description="Daftarkan dokumen ke arsip."
      >
        <div className="flex flex-col gap-5">
          <Input
            id="file-name"
            label="Nama File"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="mis. Laporan Kegiatan.docx"
            autoFocus
          />
          <Input
            id="file-type"
            label="Jenis File (opsional)"
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            placeholder="mis. PDF, DOCX"
          />
          <Input
            id="file-path"
            label="Lokasi / URL File (opsional)"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="https://... / path penyimpanan"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsFileModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUploadFile} isLoading={isSubmitting}>
              Upload
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={folderToRename !== null}
        onClose={() => setFolderToRename(null)}
        title="Ubah Nama Folder"
      >
        <div className="flex flex-col gap-5">
          <Input
            id="folder-rename"
            label="Nama Folder"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setFolderToRename(null)}>
              Batal
            </Button>
            <Button onClick={handleConfirmRenameFolder} isLoading={isSubmitting}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={fileToRename !== null}
        onClose={() => setFileToRename(null)}
        title="Ubah Nama File"
      >
        <div className="flex flex-col gap-5">
          <Input
            id="file-rename"
            label="Nama File"
            value={renameFileValue}
            onChange={(e) => setRenameFileValue(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setFileToRename(null)}>
              Batal
            </Button>
            <Button onClick={handleConfirmRenameFile} isLoading={isSubmitting}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={itemToDelete !== null}
        title={itemToDelete?.type === "folder" ? "Hapus Folder" : "Hapus File"}
        message={
          itemToDelete
            ? itemToDelete.type === "folder"
              ? `Anda yakin ingin menghapus folder "${itemToDelete.name}" beserta isinya?`
              : `Anda yakin ingin menghapus file "${itemToDelete.name}"?`
            : ""
        }
        confirmLabel={itemToDelete?.type === "folder" ? "Hapus Folder" : "Hapus File"}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
