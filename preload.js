const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI',{
    onCreate: (callback) => ipcRenderer.on("create", callback),
    checkWindowDestroy: (count) => ipcRenderer.invoke('checkWindowDestroy', count),
    setIgnoreMouseEvents: (data) => ipcRenderer.invoke('setIgnoreMouseEvents', data)
});
