'use strict'

const { app, ipcMain, screen, BrowserWindow } = require('electron');
const path = require("path");

let config = {
    targetWindow: null,
    width: 300,
    height: 80,
    style: {
        fontSize: 17,
        iconSize: 50
    },
    padding: {
        x: 40,
        y: 30
    }
};
let window = null;
let display = null;

app.whenReady().then(() => {
    ipcMain.handle('checkWindowDestroy', checkWindowDestroy);
    ipcMain.handle('setIgnoreMouseEvents', (event, data) => {
        if(window !== null){
            if(data === true) window.setIgnoreMouseEvents(true, {forward: true});
            else window.setIgnoreMouseEvents(false);
        }
    });
});

const setConfig = (_config) => {
    Object.assign(config, _config)
}

const create = async ({title = "", message = "", icon= "", background = "#34495e", color = "#fff", duration = 5000}) => {
    await createWindow();
    window.webContents.send("create", {
        title: title,
        message: message,
        duration: duration,
        icon: icon,
        background: background,
        color: color,
        height: config.height,
        style: config.style
    })
}

const success = async (title, message, duration) => {
    await create({
        title: title,
        message: message,
        duration: duration,
        icon: path.join(__dirname, "icons", "success.png"),
        background: "#2ecc71"
    });
}

const warning = async (title, message, duration) => {
    await create({
        title: title,
        message: message,
        duration: duration,
        icon: path.join(__dirname, "icons", "warning.png"),
        background: "#f39c12"
    });
}

const error = async (title, message, duration) => {
    await create({
        title: title,
        message: message,
        duration: duration,
        icon: path.join(__dirname, "icons", "error.png"),
        background: "#e74c3c"
    });
}

const info = async (title, message, duration) => {
     await create({
        title: title,
        message: message,
        duration: duration,
        icon: path.join(__dirname, "icons", "info.png"),
        background: "#3498db"
    });
}

const createWindow = async () => {
    if(display === null)
        setDisplay();

    if(window === null){
        let _x = (display.workArea.x + display.workAreaSize.width) - config.width;
        _x -= config.padding.x;
        let _y = config.padding.y;
        let _h = (display.workArea.y + display.workAreaSize.height) - (config.padding.y * 2)

        window = new BrowserWindow({
            width: config.width + config.padding.x,
            height: _h,
            x: _x,
            y: _y,
            frame: false,
            resizable: false,
            maximizable: false,
            minimizable: false,
            transparent: true,
            skipTaskbar: true,
            alwaysOnTop: true,
            focusable: false,
            show: false,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js')
            }
        });
        window.setIgnoreMouseEvents(true, {forward: true});
        await window.loadFile(path.join(__dirname, 'index.html'));
        await new Promise(resolve => {
            window.once('ready-to-show', async () => {
                window.show();
                await delay(200);
                resolve();
            });
        });
    }
}

const checkWindowDestroy = async (event, count) => {
    if(count === 0){
        window.destroy();
        window = null;
        display = null;
    }
}

const setDisplay = () => {
    if(config.targetWindow !== null){
        const _winBounds = config.targetWindow.getBounds();
        display = screen.getDisplayNearestPoint({x: _winBounds.x, y: _winBounds.y});
    }else
        display = screen.getPrimaryDisplay();
}

function delay(amount){
    return new Promise(resolve => {
        setTimeout(resolve, amount);
    });
}

module.exports.setConfig = setConfig;
module.exports.create = create;
module.exports.success = success;
module.exports.warning = warning;
module.exports.error = error;
module.exports.info = info;
