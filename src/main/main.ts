import { app, BrowserWindow, Event, ipcMain, screen, session, } from 'electron';
import path from 'path';
import { initDragDrop } from './drag-drop.main';
import { initWindowControls } from './window-control';

function createWindow () {
  let mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    show: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      zoomFactor: screen.getPrimaryDisplay()?.scaleFactor || 1,
    }
  });
  if (!app.isPackaged && process.env.NODE_ENV !== 'production') {
    const rendererPort = process.argv[2];
    mainWindow.loadURL(`http://localhost:${rendererPort}`);
    openDevTools(mainWindow)
    mainWindow.focus();
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'renderer', 'index.html'));
    // openDevTools(mainWindow)
  }
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  initWindowControls(mainWindow);
  initDragDrop();
  mainWindow.focus();
  console.log('After load');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', function () {
  app.quit()
});

ipcMain.on('message', (event, message) => {
  console.log(message);
})

const vueDevTools = path.join(process.env['LOCALAPPDATA'] ?? '', 'Google/Chrome/User Data/Default/Extensions/nhdogjmejiglipccpnnnanhbledajbpd/6.0.13_0');
function openDevTools(win: BrowserWindow) {
  // win.webContents.openDevTools({detached: true});
  win.webContents.openDevTools({mode: 'detach'});
  app.whenReady().then(() => {
    session.defaultSession.loadExtension(vueDevTools);
  });
}
