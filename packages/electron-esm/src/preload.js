import { contextBridge, ipcRenderer } from 'electron';

const validChannels = ['increase-window-size', 'decrease-window-size', 'show-open-dialog'];

const invoke = (channel, ...data) =>
  validChannels.includes(channel) ? ipcRenderer.invoke(channel, data) : Promise.reject();

contextBridge.exposeInMainWorld('api', {
  invoke,
});
