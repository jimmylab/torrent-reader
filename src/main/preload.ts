import { contextBridge, ipcMain, ipcRenderer } from 'electron';
import { windowEvents, windowControls } from './window-control';

contextBridge.exposeInMainWorld('windowEvents', windowEvents);
contextBridge.exposeInMainWorld('windowControls', windowControls);
contextBridge.exposeInMainWorld(
  'openTorrent',
(fPath: string) => ipcRenderer.invoke('openTorrent', fPath)
);
