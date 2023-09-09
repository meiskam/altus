import { As, Dialog, Tabs } from "@kobalte/core";
import { OverrideComponentProps } from "@kobalte/utils";
import { Component, For, Show, createSignal, splitProps } from "solid-js";
import {
  addTab,
  removeTab,
  restoreTab,
  setTabActive,
  tabStore,
} from "../stores/tabs/solid";
import { Tab, getDefaultTab } from "../stores/tabs/common";
import CloseIcon from "../icons/CloseIcon";
import SettingsIcon from "../icons/SettingsIcon";
import TabEditDialog from "./TabEditDialog";
import { twJoin } from "tailwind-merge";
import { getSettingValue } from "../stores/settings/solid";
import { WebviewTag } from "electron";

interface TabComponentProps
  extends OverrideComponentProps<"div", Tabs.TabsTriggerOptions> {
  tab: Tab;
  setTabToEdit: (tab: Tab | null) => void;
  removeTab: (tab: Tab) => void;
}

const TabComponent: Component<TabComponentProps> = (props) => {
  const [{ tab }, rest] = splitProps(props, ["tab"]);

  return (
    <div
      class="group flex items-center gap-1.5 bg-zinc-800 px-3 py-1.5 text-white text-sm leading-4 ui-selected:bg-zinc-700 hover:bg-zinc-600 select-none"
      style={
        tab.config.color
          ? {
              background: tab.config.color,
            }
          : {}
      }
      {...rest}
    >
      <span>{tab.name}</span>
      <button
        class="flex items-center justify-center ml-0.5 w-6 h-6 hover:bg-zinc-800/50 rounded group-data-[selected]:hover:bg-zinc-800/50"
        onClick={(event) => {
          event.stopImmediatePropagation();
          event.stopPropagation();
          event.preventDefault();
          props.setTabToEdit(tab);
        }}
        tabIndex={(rest.tabIndex as number) + 1}
      >
        <SettingsIcon class="w-4 h-4" />
      </button>
      <button
        class="flex items-center justify-center w-6 h-6 hover:bg-zinc-800/50 rounded group-data-[selected]:hover:bg-zinc-800/50"
        onClick={(event) => {
          event.stopImmediatePropagation();
          event.preventDefault();
          props.removeTab(tab);
        }}
        tabIndex={(rest.tabIndex as number) + 1}
      >
        <CloseIcon class="w-5 h-5" />
      </button>
    </div>
  );
};

const TabsList: Component = () => {
  const [tabToEdit, setTabToEdit] = createSignal<Tab | null>(null);
  const canShowDialog = () => tabToEdit() !== null;

  const addNewTab = () => {
    addTab(getDefaultTab());
  };

  const removeTabWithPrompt = async (tab: Tab) => {
    const requiresPrompt = getSettingValue("tabClosePrompt");
    if (!requiresPrompt) {
      removeTab(tab);
      return;
    }
    const result = await window.showMessageBox({
      type: "question",
      buttons: ["OK", "Cancel"],
      title: "Close Tab",
      message: "Are you sure you want to close the tab?",
    });
    if (result.response === 0) {
      removeTab(tab);
    }
  };

  window.electronIPCHandlers.onNextTab(() => {
    const activeTabIndex = tabStore.tabs.findIndex(
      (tab) => tab.id === tabStore.selectedTabId
    );
    if (activeTabIndex === -1) return;
    const nextIndex = activeTabIndex + 1;
    if (nextIndex >= tabStore.tabs.length) {
      setTabActive(tabStore.tabs[0].id);
      return;
    }
    setTabActive(tabStore.tabs[nextIndex].id);
  });

  window.electronIPCHandlers.onPreviousTab(() => {
    const activeTabIndex = tabStore.tabs.findIndex(
      (tab) => tab.id === tabStore.selectedTabId
    );
    if (activeTabIndex === -1) return;
    const previousIndex = activeTabIndex - 1;
    if (previousIndex < 0) {
      setTabActive(tabStore.tabs[tabStore.tabs.length - 1].id);
      return;
    }
    setTabActive(tabStore.tabs[previousIndex].id);
  });

  window.electronIPCHandlers.onFirstTab(() => {
    const firstTab = tabStore.tabs[0];
    if (!firstTab) return;
    setTabActive(firstTab.id);
  });

  window.electronIPCHandlers.onLastTab(() => {
    const lastTab = tabStore.tabs[tabStore.tabs.length - 1];
    if (!lastTab) return;
    setTabActive(lastTab.id);
  });

  window.electronIPCHandlers.onOpenWhatsappLink((url) => {
    const activeWebview = document.querySelector(
      "webview"
    ) as WebviewTag | null;
    if (!activeWebview) return;
    activeWebview.src = url;
  });

  window.electronIPCHandlers.onOpenTabDevTools(() => {
    const activeWebview = document.querySelector(
      "webview"
    ) as WebviewTag | null;
    if (!activeWebview) return;
    activeWebview.openDevTools();
  });

  window.electronIPCHandlers.onEditActiveTab(() => {
    const activeTab = tabStore.tabs.find(
      (tab) => tab.id === tabStore.selectedTabId
    );
    if (!activeTab) return;
    setTabToEdit(activeTab);
  });

  window.electronIPCHandlers.onCloseActiveTab(() => {
    const activeTab = tabStore.tabs.find(
      (tab) => tab.id === tabStore.selectedTabId
    );
    if (!activeTab) return;
    removeTabWithPrompt(activeTab);
  });

  window.electronIPCHandlers.onAddNewTab(() => {
    addNewTab();
  });

  window.electronIPCHandlers.onRestoreTab(() => {
    restoreTab();
  });

  return (
    <>
      <Tabs.List
        class={twJoin(
          "bg-zinc-800 divide-x divide-zinc-700/20",
          getSettingValue("tabBar") ? "flex" : "hidden"
        )}
      >
        <For each={tabStore.tabs}>
          {(tab) => (
            <Tabs.Trigger value={tab.id} asChild>
              <As
                component={TabComponent}
                tab={tab}
                setTabToEdit={setTabToEdit}
                removeTab={removeTabWithPrompt}
              />
            </Tabs.Trigger>
          )}
        </For>
        <button
          class="group flex items-center gap-2.5 bg-zinc-800 px-3 py-2 text-white text-sm leading-4 ui-selected:bg-zinc-700 hover:bg-zinc-600 select-none"
          onClick={addNewTab}
        >
          <div class="sr-only">Add new tab</div>
          <CloseIcon class="w-4 h-4 rotate-45" />
        </button>
      </Tabs.List>
      <Dialog.Root
        open={canShowDialog()}
        onOpenChange={(open) => {
          if (!open) {
            setTabToEdit(null);
          }
        }}
      >
        <Show when={tabToEdit()}>
          {(tabToEdit) => (
            <TabEditDialog tabToEdit={tabToEdit} setTabToEdit={setTabToEdit} />
          )}
        </Show>
      </Dialog.Root>
    </>
  );
};

export default TabsList;
