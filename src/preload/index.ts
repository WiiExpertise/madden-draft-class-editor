import { contextBridge, ipcRenderer } from 'electron';

export type Channels = 'open-file-dialog' | 'parse-draft-class' | 'save-draft-class';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: Channels, ...args: unknown[]) => {
      if (channel === 'open-file-dialog') {
        return ipcRenderer.invoke(channel);
      }
      if (channel === 'parse-draft-class') {
        return ipcRenderer.invoke(channel, args[0]);
      }
      if (channel === 'save-draft-class') {
        return ipcRenderer.invoke(channel, args[0]);
      }
      throw new Error(`Unsupported channel: ${channel}`);
    },
  },
});
