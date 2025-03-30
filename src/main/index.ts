import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { readDraftClass, writeDraftClass, DraftClass } from 'madden-draft-class-tools';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
};

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Draft Class Files', extensions: ['dc'] }],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('parse-draft-class', async (_, filePath: string) => {
  try {
    return await readDraftClass(filePath);
  } catch (error) {
    console.error('Error parsing draft class:', error);
    throw error;
  }
});

ipcMain.handle('save-draft-class', async (_, draftClass: DraftClass) => {
  try {
    const result = await dialog.showSaveDialog({
      filters: [{ name: 'Draft Class Files', extensions: ['dc'] }],
    });

    if (!result.canceled && result.filePath) {
      const buffer = writeDraftClass(draftClass);
      await fs.promises.writeFile(result.filePath, buffer);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving draft class:', error);
    throw error;
  }
});
