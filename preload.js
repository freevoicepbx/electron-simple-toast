const { contextBridge, ipcRenderer } = require('electron');
// White-listed channels.
const ipc = {
    'render': {
        // From render to main.
        'send': [
            
        ],
        // From main to render.
        'receive': [
            'message:update', // Here is your channel name
            "notify:hide"
        ],
        // From render to main and back again.
        'sendReceive': []
    }
};
contextBridge.exposeInMainWorld('electronAPI',{
    onCreate: (callback) => ipcRenderer.on("create", callback),
    onClose: (callback) => ipcRenderer.on("notify:hide", callback),
    checkWindowDestroy: (count) => ipcRenderer.invoke('checkWindowDestroy', count),
    //setIgnoreMouseEvents: (data) => ipcRenderer.invoke('setIgnoreMouseEvents', data),
    windowClick: (data) => ipcRenderer.invoke('windowClick', data),
    windowHeight: (data) => ipcRenderer.invoke('windowHeight', data),
    // From render to main.
    send: (channel, args) => {
        let validChannels = ipc.render.send;
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, args);
        }
    },
    // From main to render.
    receive: (channel, listener) => {
        let validChannels = ipc.render.receive;
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender`.
            ipcRenderer.on(channel, (event, ...args) => listener(...args));
        }
    },
    // From render to main and back again.
    invoke: (channel, args) => {
        let validChannels = ipc.render.sendReceive;
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, args);
        }
    }
});
