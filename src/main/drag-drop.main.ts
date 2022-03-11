import { Event, ipcMain } from 'electron';
import { Torrent } from './lib/torrent-parser'

export function initDragDrop() {
  ipcMain.handle('openTorrent', async (ev: Event, fPath: string) => {
    let f = new Torrent();
    await f.readFromFile(fPath);
    return f.fileTree;
  })
}
