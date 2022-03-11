import { ipcMain, app, BrowserWindow, Event, ipcRenderer } from "electron";
import { exposeEvents } from "./expose-events";

export const windowEventNames = ['maximize', 'minimize', 'unmaximize'] as const; // both event and command
export type WindowEventNames = typeof windowEventNames[number];
const channelEvent = 'windowEvents';
const channelControl = 'windowControl';

// Exposed in preload
export const windowEvents = {
  ...exposeEvents<typeof windowEventNames>(windowEventNames, channelEvent),
};

export const windowControls = Object.fromEntries(
  windowEventNames.map(action => [
      action,
      function() {
        ipcRenderer.postMessage(channelControl, action);
      }
    ]
  )
) as Record<WindowEventNames, () => void>;

// Called in main
export function initWindowControls(win: BrowserWindow) {
  // send event when happens
  for (let eventName of windowEventNames) {
    win.on(eventName as any, function(_ev: Event) {
      win.webContents.send(channelEvent, eventName);
    })
  }
  // init command handlers
  ipcMain.on(channelControl, (_event: Event, message: WindowEventNames) => {
    switch (message) {
      case 'maximize':   win.maximize();   break;
      case 'unmaximize': win.unmaximize(); break;
      case 'minimize':   win.minimize();   break;
      default:
        break;
    }
  });
}


type Handler = (ev: Event, message: string) => void;
function handle<T extends (ev: Event, ...args:any[]) => void>() {
  //
}

handle<Handler>();

