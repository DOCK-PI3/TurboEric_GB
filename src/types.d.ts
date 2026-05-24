/// <reference types="vite/client" />

declare global {
  interface Window {
    /** Handle to a local directory mounted via the File System Access API */
    projectDirectoryHandle?: FileSystemDirectoryHandle;
  }
}

export {};
