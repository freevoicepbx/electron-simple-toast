const { app, BrowserWindow, ipcMain, safeStorage, shell, dialog, Menu, MenuItem, Tray, nativeImage, autoUpdater, systemPreferences, powerMonitor } = require('electron');
const Store = require('electron-store');
const path = require('node:path');
const url = require('node:url');
const log = require('electron-log/main');
var os = require('os');
const toast = require("electron-simple-toast");

const electronDl = require('electron-dl');

// Attempt to acquire a single instance lock
const gotTheLock = app.requestSingleInstanceLock();
var desktopNotification;

if (require('electron-squirrel-startup')) return;
if (!gotTheLock) {
    // Quit the app if a second instance is detected
    app.quit();
} else {

    //console.log('logFile', log.transports.file.getFile())
    log.initialize();
    log.level = 'silly';
    const store = new Store();
    let mainWin = null;
    let chatWin = null;
    const createWindow = () => {
        const win = new BrowserWindow({
            width: 800,
            height: 600,
            minWidth: 450,
            minHeight: 550,
            icon: (os.platform() == 'linux' ? 'icon.png' : null),
            webPreferences: {
                backgroundThrottling: false,
                preload: path.join(__dirname, 'preload.js')
            }
        });
        toast.setConfig({
            targetWindow: win
        });
        if (!app.isPackaged) {
            win.webContents.openDevTools();
            log.transports.console.level = 'silly';
        } else {

        }
        win.webContents.on('will-navigate', (event, params) => {
            console.log('Main Window Prevent Navigate', event, params);
            //only allow navigate for logout
            if (!event.url.endsWith('index.html#logout')) {
                event.preventDefault();
            }
        });
        //custom context menu
        win.webContents.on('context-menu', (event, params) => {
            const menu = new Menu()
            log.info(params);
            if (params.editFlags.canUndo === true || params.editFlags.canRedo === true) {
                if (params.editFlags.canUndo === true) {
                    menu.append(new MenuItem({
                        label: 'Undo',
                        role: 'undo'
                    }));
                }
                if (params.editFlags.canRedo === true) {
                    menu.append(new MenuItem({
                        label: 'Redo',
                        role: 'redo'
                    }));
                }
                menu.append(new MenuItem({
                    type: 'separator',
                }))
            }
            if (params.dictionarySuggestions && params.dictionarySuggestions.length > 0) {
                // Add each spelling suggestion
                for (const suggestion of params.dictionarySuggestions) {
                    menu.append(new MenuItem({
                        label: suggestion,
                        click: () => win.webContents.replaceMisspelling(suggestion)
                    }))
                }
                menu.append(new MenuItem({
                    type: 'separator',
                }))
                // Allow users to add the misspelled word to the dictionary
                if (params.misspelledWord) {
                    menu.append(
                        new MenuItem({
                            label: 'Add to dictionary',
                            click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
                        })
                    )
                }
            }
            if (params.selectionText && params.selectionText != '') {
                menu.append(new MenuItem({
                    type: 'separator',
                }))
                menu.append(new MenuItem({
                    label: 'Copy',
                    role: 'copy'
                }))
            }
            if (params.isEditable === true) {
                menu.append(new MenuItem({
                    label: 'Cut',
                    role: 'cut'
                }))
                menu.append(new MenuItem({
                    label: 'Paste',
                    role: 'paste'
                }))
                menu.append(new MenuItem({
                    label: 'Paste as plain text',
                    role: 'pasteAndMatchStyle'
                }))
            }

            if (params.editFlags.canSelectAll === true) {
                menu.append(new MenuItem({
                    label: 'Select all',
                    role: 'selectAll'
                }))
            }
            menu.popup()
        });

        win.webContents.setWindowOpenHandler(({ url, frameName }) => {
            //check url content type
            //TODO add better downloads
            if (frameName == 'chatwin') {
                return {
                    action: 'allow',
                    overrideBrowserWindowOptions: {
                        //parent:mainWin
                        accessibleTitle: 'chatwin',
                        webPreferences: {
                            backgroundThrottling: false,
                            preload: path.join(__dirname, 'preload.js')
                        }
                    }
                }
            }
            log.info('WindowOpenHandler ', url);
            shell.openExternal(url);
            return { action: 'deny' };
        });
        win.webContents.on('did-create-window', (bwin, winp) => {
            console.log('did-opemn-wni', bwin.id);
            if (winp.frameName == 'chatwin') {
                chatWin = bwin;
                chatWin.on('close', () => {
                    delete chatWin;
                });
                //custom context menu
                chatWin.webContents.on('context-menu', (event, params) => {
                    const menu = new Menu()
                    log.info(params);
                    if (params.editFlags.canUndo === true || params.editFlags.canRedo === true) {
                        if (params.editFlags.canUndo === true) {
                            menu.append(new MenuItem({
                                label: 'Undo',
                                role: 'undo'
                            }));
                        }
                        if (params.editFlags.canRedo === true) {
                            menu.append(new MenuItem({
                                label: 'Redo',
                                role: 'redo'
                            }));
                        }
                        menu.append(new MenuItem({
                            type: 'separator',
                        }))
                    }
                    if (params.dictionarySuggestions && params.dictionarySuggestions.length > 0) {
                        // Add each spelling suggestion
                        for (const suggestion of params.dictionarySuggestions) {
                            menu.append(new MenuItem({
                                label: suggestion,
                                click: () => chatWin.webContents.replaceMisspelling(suggestion)
                            }))
                        }
                        menu.append(new MenuItem({
                            type: 'separator',
                        }))
                        // Allow users to add the misspelled word to the dictionary
                        if (params.misspelledWord) {
                            menu.append(
                                new MenuItem({
                                    label: 'Add to dictionary',
                                    click: () => chatWin.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
                                })
                            )
                        }
                    }
                    if (params.selectionText && params.selectionText != '') {
                        menu.append(new MenuItem({
                            type: 'separator',
                        }))
                        menu.append(new MenuItem({
                            label: 'Copy',
                            role: 'copy'
                        }))
                    }
                    if (params.isEditable === true) {
                        menu.append(new MenuItem({
                            label: 'Cut',
                            role: 'cut'
                        }))
                        menu.append(new MenuItem({
                            label: 'Paste',
                            role: 'paste'
                        }))
                        menu.append(new MenuItem({
                            label: 'Paste as plain text',
                            role: 'pasteAndMatchStyle'
                        }))
                    }

                    if (params.editFlags.canSelectAll === true) {
                        menu.append(new MenuItem({
                            label: 'Select all',
                            role: 'selectAll'
                        }))
                    }
                    menu.popup()
                });

            }
        });

        win.webContents.on('unresponsive', async () => {
            const { response } = await dialog.showMessageBox({
                message: 'Freevoice has become unresponsive',
                title: 'Attempt to forcefully reload the app?',
                buttons: ['OK', 'Cancel'],
                cancelId: 1
            })
            if (response === 0) {
                win.webContents.forcefullyCrashRenderer()
                win.webContents.reload()
            }
        });

        win.loadFile('index.html')
        app.on('second-instance', (event, commandLine, workingDirectory) => {
            // Focus on the existing window if it's minimized
            if (win) {
                if (win.isMinimized()) win.restore();
                win.focus();
            }
        });
        return win;
    }

    app.whenReady().then(() => {
        log.info('app.whenReady');
        mainWin = createWindow();
        //Tray
        const trayicon = nativeImage.createFromPath('tray.png')
        var tray = new Tray(trayicon)

        if (app.setAsDefaultProtocolClient('tel')) {
            log.info('Set tel:// handler');
        } else {
            log.info('Not Set tel:// handler');
        }

        /*const contextMenu = Menu.buildFromTemplate([
            { label: 'Item 1', type: 'radio' },
            { label: 'Item 2', type: 'radio' },
            { label: 'Item 3', type: 'radio', checked: true },
            { label: 'Item 4', type: 'radio' }
        ])
        tray.setContextMenu(contextMenu);*/

        tray.setToolTip('Freevoice Call Center Portal');

        tray.on('click', function () {
            console.log('tray clicked');
            if (mainWin.isMinimized()) {
                mainWin.restore();
            }
            mainWin.setAlwaysOnTop(true);
            mainWin.setAlwaysOnTop(false);

            mainWin.focus();
        })

        const { updateElectronApp, UpdateSourceType } = require('update-freevoice-app');
        var updateConfig = getSavedUpdateConfig();
        var savedAppCfg = getSavedConfig();
        if (updateConfig.remotelog == 1) {
            log.transports.remote.level = 'silly';
            log.transports.remote.url = 'https://www.freevoiceusa.com/fv_api/app_log.php';
            log.transports.remote.client = { app: app.getVersion(), subdomain: savedAppCfg.subdomain, user: savedAppCfg.user };
            log.info('App Ready');
            setTimeout(function () {
                log.transports.remote.level = false;
            }, (3600 * 8) * 1000);
        }
        if (updateConfig && updateConfig.multi == 1) {
            console.log('app.releaseSingleInstanceLock');
            app.releaseSingleInstanceLock();
        }
        if (updateConfig && updateConfig.disabled == 1) {
            console.log('auto updates disabled returnging');
            return;
        }
        updateElectronApp({
            updateSource: {
                type: UpdateSourceType.StaticStorage,
                baseUrl: `https://www.freevoiceusa.com/misc/fv-user/${(updateConfig && updateConfig.channel && updateConfig.channel != '' ? updateConfig.channel + '/' : '')}${process.platform}/${process.arch}`
            }
        }).then(function (autoUpdater) {
            console.log('got autoupdater', autoUpdater);
            if (autoUpdater) {
                console.log('autoUpdater set events')
                autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
                    log.info(event, releaseNotes, releaseName);
                    mainWin.webContents.send('updater:downloaded', 'Update downloaded');
                })
                autoUpdater.on('error', (event, releaseNotes, releaseName) => {
                    log.info(event, releaseNotes, releaseName);
                })
                ipcMain.handle('updater:quitinstall', () => { return autoUpdater.quitAndInstall() });
            }
        })

    })

    app.on('ready', () => {
        console.log('on ready')
        ipcMain.handle('config:save', (e, f, g) => { saveConfig(e, f, g) });
        ipcMain.handle('config:get', () => { return getSavedConfig() });
        ipcMain.handle('title:set', (e, f) => { return setTitle(e, f) });
        ipcMain.handle('update:save', (e, f, g) => { saveUpdateConfig(e, f, g) });
        ipcMain.handle('update:get', () => { return getSavedUpdateConfig() });
        ipcMain.handle('config:appinfo', () => { return getAppInfo() });
        ipcMain.handle('notify:show', (event, notifyOpts) => { return notifyShow(event, notifyOpts, mainWin) });
        ipcMain.handle('notify:click', (event, notifyOpts) => { return notifyClick(event, notifyOpts, mainWin) });
        ipcMain.handle('chatwin:focus', (event) => { return chatWinFocus(event) });
        ipcMain.handle('system:idle', (event, notifyOpts) => { return systemIdle(event, notifyOpts, mainWin) });
        ipcMain.handle('system:mic', (event) => { return getMediaAccessStatus(event, mainWin) });
    });

    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
        // Prevent having error
        event.preventDefault()
        // and continue
        callback(true)
    });

    app.on('open-url', (url) => {
        console.log('open-url', url);
    });


    function saveConfig(e, f, g) {
        var ucfg = getSavedConfig();
        console.log('savep', f);
        if (Array.isArray(ucfg) && ucfg.length > 0) {
            console.log('save arr', f);
            var fi = ucfg.findIndex(uc => uc.subdomain == f.subdomain && uc.user == f.user);
            if (fi !== -1) {
                console.log('save arr inx', fi);
                ucfg[fi] = { user: f.user, password: f.password, subdomain: f.subdomain };
            } else {
                console.log('save arr noi');
                ucfg.push({ user: f.user, password: f.password, subdomain: f.subdomain });
            }
        } else {
            console.log('save arr coi');
            ucfg = [{ user: f.user, password: f.password, subdomain: f.subdomain }];
        }
        console.log('save', ucfg);
        var str = JSON.stringify(ucfg);
        store.set('savedConfig', JSON.stringify(Buffer.from(safeStorage.encryptString(str)).toJSON()));
    }

    function getSavedConfig() {
        try {
            var ucfg = JSON.parse(safeStorage.decryptString(Buffer.from(JSON.parse(store.get('savedConfig')))));
            if (Array.isArray(ucfg)) {
                return ucfg;
            } else if (typeof (ucfg) == "object") {
                return [ucfg];
            } else {
                return [];
            }
        } catch (e) {
            return [];
        }
    }
    function saveUpdateConfig(e, f, g) {
        var str = JSON.stringify(f);
        store.set('savedUpdateConfig', JSON.stringify(Buffer.from(safeStorage.encryptString(str)).toJSON()));
    }

    function getSavedUpdateConfig() {
        try {
            return JSON.parse(safeStorage.decryptString(Buffer.from(JSON.parse(store.get('savedUpdateConfig')))));
        } catch (e) {
            return {};
        }
    }
    function getAppInfo() {
        try {
            var os_type = 'UnknownOS';
            if (os.type() == 'Windows_NT') {
                os_type = 'Windows';
            } else if (os.type() == 'Darwin') {
                os_type = 'MacOS';
            } else if (os.type() == 'Linux') {
                os_type = 'Linux';
            }
            return {
                version: app.getVersion(),
                channel: (getSavedUpdateConfig().channel ? getSavedUpdateConfig().channel : ''),
                os_type: os_type,
                os_release: os.release()
            }
        } catch (e) {
            return {};
        }
    }
    function systemIdle(e, secs) {
        secs = parseInt(secs);
        try {
            return {
                state: powerMonitor.getSystemIdleState(secs),
                time: powerMonitor.getSystemIdleTime()
            }
        } catch (e) {
            return {};
        }
    }
    function notifyShow(event, notifyOpts, mainWin) {
        console.log('notifyShow',notifyOpts, mainWin);
        try {
            toast.create(notifyOpts);
        } catch (e) {
            console.error(e);
        }
    }
    function notifyClick(event, notifyOpts, mainWin) {
        console.log('notifyClick', notifyOpts, mainWin);
        mainWin.webContents.send('notify:click', notifyOpts);
        mainWin.show();
        mainWin.moveTop();
    }
    function setTitle(event, title) {
        mainWin.setTitle(title);
    }
    function getMediaAccessStatus() {
        if (os.platform() == 'linux') {
            return 'granted';
        }
        return systemPreferences.getMediaAccessStatus('microphone');
    }
    function chatWinFocus(event) {
        /*var windows = BrowserWindow.getAllWindows();
        //we only have two windows
        windows.forEach(function(w){
            console.log(Object.getOwnPropertyNames(w.webContents),w.accessibleTitle);
        })*/
        //chatWin = windows.find((wo)=>wo.accessibleTitle=='chatwin');
        console.log('chatWinFocus', chatWin);
        if (chatWin) {
            chatWin.show();
            chatWin.moveTop();
            chatWin.focus();
        }
    }
}