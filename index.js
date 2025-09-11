'use strict'

const { app, ipcMain, screen, BrowserWindow } = require('electron');
const path = require("path");

let config = {
    targetWindow: null,
    width: 375,
    height: 80,
    style: {
        fontSize: 17,
        iconSize: 32
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
    ipcMain.handle('windowClick', windowClick);
    ipcMain.handle('windowHeight', windowHeight);
    ipcMain.handle('notify:hide', notifyHide);
    /*ipcMain.handle('setIgnoreMouseEvents', (event, data) => {
        console.log('setIgnoreMouseEvents',data);
        if(window !== null){
            if(data === true) window.setIgnoreMouseEvents(true, {forward: true});
            else window.setIgnoreMouseEvents(false);
        }
    });*/
});

const setConfig = (_config) => {
    Object.assign(config, _config)
}

const create = async function ({ id = "", title = "", message = "", icon = "", background = "#34495e", color = "#fff", duration = 5000, position = 'auto' }) {
    await createWindow(position);
    console.log('toast create', position);
    window.webContents.send("create", {
        id: id,
        title: title,
        message: message,
        duration: duration,
        icon: icon,
        background: background,
        color: color,
        height: config.height,
        style: config.style
    });
    //if(!app.isPackaged){
    //    window.webContents.openDevTools();
    //}
}
const close = async ({ id = "" }) => {
    if (window) {
        window.webContents.send("close", {
            id: id
        });
    }
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

const createWindow = async (position) => {
    if (display === null)
        setDisplay();

    if (window === null) {
        console.log('new toast win', position);
        let _y = 20;
        let _x = 20;
        if (position != 'default') {
            if (!display) {
                console.log('toast createWindow no display using basic 20x20');
            } else {
                console.log('toast createWindow got display');
                _x = (display.workArea.x + display.workAreaSize.width) - config.width;
                _x -= config.padding.x;
                _y = config.padding.y;
                //let _h = (display.workArea.y + display.workAreaSize.height) - (config.padding.y * 2)
                console.log(`toast createWindow got display.workArea.x:${display.workArea.x} display.workArea.y:${display.workArea.y} display.workAreaSize.width:${display.workAreaSize.width} display.workAreaSize.height:${display.workAreaSize.height}`);
            }
        }
        console.log('toast createWindow', _x, _y);
        window = new BrowserWindow({
            width: config.width,
            height: 0,
            //useContentSize: true,
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
        if (config.targetWindow) {
            config.targetWindow.on('close', function () {
                console.log('close notify window');
                if (window) {
                    window.destroy();
                }
            })
        }
        await window.loadFile(path.join(__dirname, 'index.html'));
        await new Promise(resolve => {
            window.once('ready-to-show', async () => {
                window.show();
                resolve();
            });
        });
    } else if (window.webContents.isLoading()) {
        await delayUntil(() => !window.webContents.isLoading(), 100);
    } else if (window !== null) {
        console.log('update toast win', position);
        let _y = 20;
        let _x = 20;
        if (position != 'default') {
            if (!display) {
                console.log('toast update no display using basic 20x20');
            } else {
                console.log('toast updateWindow got display');
                _x = (display.workArea.x + display.workAreaSize.width) - config.width;
                _x -= config.padding.x;
                _y = config.padding.y;
                //let _h = (display.workArea.y + display.workAreaSize.height) - (config.padding.y * 2)
                console.log(`toast update got display.workArea.x:${display.workArea.x} display.workArea.y:${display.workArea.y} display.workAreaSize.width:${display.workAreaSize.width} display.workAreaSize.height:${display.workAreaSize.height}`);
            }
        }
        console.log('toast updateWindow', _x, _y);
        window.setPosition(_x, _y);
    }
}

const checkWindowDestroy = async (event, count) => {
    if (count === 0) {
        window.destroy();
        window = null;
        display = null;
    }
}

const windowClick = async (event, data) => {
    console.log('windowClick', data, config);
    if (config.targetWindow !== null) {
        console.log('Send windowClick')
        config.targetWindow.webContents.send('notify:click', data);
        if (config.targetWindow.isMinimized())
            config.targetWindow.restore();

        config.targetWindow.setAlwaysOnTop(true);
        config.targetWindow.setAlwaysOnTop(false);
        config.targetWindow.focus();
    }
}

const notifyHide = async (event, data) => {
    console.log('notifyHide', data, config);
    if (window !== null) {
        console.log('Send notifyHide')
        window.webContents.send('notify:hide', data);
    }
}

const windowHeight = async (event, data) => {
    console.log('windowHeight', data, config);
    if (config.targetWindow !== null) {
        console.log('Got windowHeight', data);
        window.setSize(375, parseInt(data));
        window.setContentSize(375, parseInt(data));
    }
}

const setDisplay = () => {
    if (config.targetWindow !== null) {
        const _winBounds = config.targetWindow.getBounds();
        display = screen.getDisplayNearestPoint({ x: _winBounds.x, y: _winBounds.y });
        if (!display) {
            display = screen.getPrimaryDisplay();
        }
    } else {
        display = screen.getPrimaryDisplay();
    }
}

function delay(amount) {
    return new Promise(resolve => {
        setTimeout(resolve, amount);
    });
}

function delayUntil(condition, interval) {
    return new Promise((resolve) => {
        const checkCondition = setInterval(() => {
            if (condition()) {
                clearInterval(checkCondition);
                resolve();
            }
        }, interval);
    });
}

module.exports.setConfig = setConfig;
module.exports.create = create;
module.exports.success = success;
module.exports.warning = warning;
module.exports.error = error;
module.exports.info = info;
