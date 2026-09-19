import { useStorage } from "./react-context.js";

export function useFiles() {
  const { files, loading, error, refreshFiles, deleteFile } = useStorage();
  return { files, loading, error, refreshFiles, deleteFile };
}

export function useFileUpload() {
  const { uploadFile, quota } = useStorage();
  return { uploadFile, quota };
}
