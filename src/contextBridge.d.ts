import { type ElectronTabStoreIpcApi } from "./stores/tabs/common";

// Types for APIs exposed to the renderer process via contextBridge

declare global {
  interface Window {
    electronTabStore: ElectronTabStoreIpcApi;
  }
}
