import { type MessageBoxOptions, contextBridge, ipcRenderer } from "electron";
import { ElectronTabStoreIpcApi } from "./stores/tabs/common";
import { ElectronThemeStoreIpcApi } from "./stores/themes/common";
import { ElectronSettingsStoreIpcApi } from "./stores/settings/common";

ipcRenderer.invoke("get-whatsapp-preload-path").then((preloadPath) => {
  contextBridge.exposeInMainWorld("whatsappPreloadPath", preloadPath);
});

const electronTabStoreIpcApi: ElectronTabStoreIpcApi = {
  getStore: async () => await ipcRenderer.invoke("tab-store-get"),
  set: async (key, value) =>
    await ipcRenderer.invoke("tab-store-set", key, value),
};

const electronThemeStoreIpcApi: ElectronThemeStoreIpcApi = {
  getStore: async () => await ipcRenderer.invoke("theme-store-get"),
  setThemes: async (themes) =>
    ipcRenderer.invoke("theme-store-set", "themes", themes),
};

const electronSettingsStoreIpcApi: ElectronSettingsStoreIpcApi = {
  getStore: async () => await ipcRenderer.invoke("settings-store-get"),
  setSettings: async (settings) =>
    ipcRenderer.invoke("settings-store-set", "settings", settings),
};

const toggleNotifications = async (enabled: boolean, partition: string) => {
  await ipcRenderer.invoke("toggle-notifications", enabled, partition);
};

contextBridge.exposeInMainWorld("electronTabStore", electronTabStoreIpcApi);
contextBridge.exposeInMainWorld("electronThemeStore", electronThemeStoreIpcApi);
contextBridge.exposeInMainWorld(
  "electronSettingsStore",
  electronSettingsStoreIpcApi
);
contextBridge.exposeInMainWorld("toggleNotifications", toggleNotifications);

contextBridge.exposeInMainWorld("electronIPCHandlers", {
  onOpenSettings: (callback: () => void) =>
    ipcRenderer.on("open-settings", callback),
  onEditActiveTab: (callback: () => void) =>
    ipcRenderer.on("edit-active-tab", callback),
  onCloseActiveTab: (callback: () => void) =>
    ipcRenderer.on("close-active-tab", callback),
  onOpenTabDevTools: (callback: () => void) =>
    ipcRenderer.on("open-tab-devtools", callback),
  onAddNewTab: (callback: () => void) =>
    ipcRenderer.on("add-new-tab", callback),
  onRestoreTab: (callback: () => void) =>
    ipcRenderer.on("restore-tab", callback),
  onOpenWhatsappLink: (callback: (url: string) => void) =>
    ipcRenderer.on("open-whatsapp-link", (_, url) => callback(url)),
});

contextBridge.exposeInMainWorld(
  "showMessageBox",
  (options: MessageBoxOptions) => {
    return ipcRenderer.invoke("show-message-box", options);
  }
);
