const electron = require('electron');
const {app, BrowserWindow, dialog, ipcMain, session} = electron;
const pathUtils = require('path');
const fs = require('fs');
const url = require('url');
const {spawn, exec} = require('child_process');
const decompress = require('decompress');

const COOKIE_URL_NAME = 'http://nonexistent-autograder-url-placeholder.com';

let basepath = app.getAppPath();
let jarPath = pathUtils.join(basepath, 'assets', 'jar');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow() {

    // Create the browser window.
    const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
    win = new BrowserWindow({
        width: width,
        height: height,
        icon: __dirname + '/assets/images/100_emoji.png',
        center: true
    });
    win.setMenu(null);
    win.maximize();

    // and load the index.html of the app.
    win.loadURL(url.format({
        pathname: pathUtils.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    // Open the DevTools.
    // win.webContents.openDevTools();

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('getFilePath', (event) => {
    let result;
    result = dialog.showOpenDialog({properties: ['openFile']});
    event.returnValue = result ? result[0] : null;
});


ipcMain.on('openDevTools', (event) => {
    // Open the DevTools.
    win.webContents.openDevTools();
    event.returnValue = true;
});

ipcMain.on('getDirectoryPath', (event) => {
    let result;
    result = dialog.showOpenDialog({properties: ['openDirectory']});
    event.returnValue = result ? result[0] : null;
});

ipcMain.on('readFile', (event, path, parentPath) => {
    if (parentPath) {
        path = pathUtils.join(parentPath, path)
    }
    try {
        let fileContents = fs.readFileSync(path, 'utf8');
        event.returnValue = fileContents || "Unable to read file " + (path || "null");
    } catch (err) {
        event.returnValue = "Error Reading File " + (path || "null");
    }
});

ipcMain.on('writeToFile', (event, path, fileContents, parentPath) => {
    if (parentPath) {
        path = pathUtils.join(parentPath, path)
    }
    try {
        fs.writeFileSync(path, fileContents);
        event.returnValue = true; // Successfully wrote to file
    } catch (err) {
        event.returnValue = false; // Could not write to file
    }
});

ipcMain.on('deleteFile', (event, path, parentPath) => {
    if (parentPath) {
        path = pathUtils.join(parentPath, path)
    }
    try {
        fs.unlinkSync(path);
        event.returnValue = true; // Successfully deleted file
    } catch (err) {
        event.returnValue = false; // Could not delete file
    }
});

ipcMain.on('exists', (event, path, parentPath) => {
    if (parentPath) {
        path = pathUtils.join(parentPath, path)
    }
    event.returnValue = fs.existsSync(path)
});

ipcMain.on('isDir', (event, path, parentPath) => {
    if (parentPath) {
        path = pathUtils.join(parentPath, path)
    }
    event.returnValue = fs.lstatSync(path).isDirectory()
});

ipcMain.on('join', (event, parentPath, childPath) => {
    event.returnValue = pathUtils.join(parentPath, childPath)
});

ipcMain.on('makeDir', (event, path, parentPath) => {
    if (parentPath) {
        path = pathUtils.join(parentPath, path)
    }
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
        event.returnValue = true; // Successfully made directory
    } else {
        event.returnValue = false; // Directory already exists
    }
});

ipcMain.on('copy', (event, source, destination, parentPath) => {
    if (parentPath) {
        source = pathUtils.join(parentPath, source);
        destination = pathUtils.join(parentPath, destination);
    }
    const fileContents = fs.readFileSync(source, 'utf8');
    fs.writeFileSync(destination, fileContents);
    event.returnValue = true;
});

ipcMain.on('unzip', (event, source, destination, parentPath) => {
    if (parentPath) {
        source = pathUtils.join(parentPath, source);
        destination = pathUtils.join(parentPath, destination);
    }
    decompress(source, destination).then(files => {
        event.returnValue = files;
    });
});

ipcMain.on('listFiles', (event, path, parentPath) => {
    if (parentPath) {
        path = pathUtils.join(parentPath, path)
    }
    event.returnValue = fs.readdirSync(path);
});

ipcMain.on('clearDir', (event, path, parentPath) => {
    if (parentPath) {
        path = pathUtils.join(parentPath, path)
    }
    deleteDirRecursively(path);
    // fs.readdirSync(path).forEach(function (file) {
    //     let curPath = pathUtils.join(path, file);
    //     fs.unlinkSync(curPath);
    // });
    // fs.rmdirSync(path);
    event.returnValue = true;
});

const deleteDirRecursively = function (path) {
    fs.readdirSync(path).forEach(file => {
        const filePath = pathUtils.join(path, file);
        if (fs.lstatSync(filePath).isDirectory()) {
            deleteDirRecursively(filePath)
        } else {
            fs.unlinkSync(filePath);
        }
    });
    fs.rmdirSync(path);
};

ipcMain.on('runJavaGradingJar', (event, jarName, targetDirectory, testOrMainClass, mainClassTimeout, javaCommand, javaCompilerCommand, checkstylePath, outputFilepath, studentFiles) => {
    let args = ['-jar', pathUtils.join(jarPath, jarName), targetDirectory, testOrMainClass, javaCommand, javaCompilerCommand, checkstylePath];
    if (mainClassTimeout >= 0) {
        args.splice(4, 0, mainClassTimeout);
    }
    studentFiles.forEach(function (file) {
        args.push(file.split(".java")[0])
    });
    for (let i = 0; i < args.length; i++) {
        // args[i] = args[i].replace(/ /g, '\\ ').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
        args[i] = '\"' + args[i] + '\"'

    }
    let output;
    const command = '"' + javaCommand + '" ' + args.join(' ');
    console.log('\nRunning command: ' + command);
    exec(command,
        {
            maxBuffer: 2000 * 1024
        },
        (error, stdout, stderr) => {
            if (error) {
                fs.writeFileSync(outputFilepath, output);
                dialog.showErrorBox('Error encountered while trying to run agent ', command + ':' + stderr + ' \ngrader may not have sufficient privileges; Please delete the hidden grader data folder and make sure the grader is able to run Java. If the problem persists, the grader may be unable to find Java. In this case, try running it from a terminal.');
                event.returnValue = error;
            }
            output = stdout;
            if (!output) {
                output = stderr;
            }
            fs.writeFileSync(outputFilepath, output);
            event.returnValue = output;
        });
});

ipcMain.on('runPython3UnitTestGradingAgent', (event, targetDirectory, agentFile, python3Command, agentOutputFilePath) => {
    let args = [];
    args.push(pathUtils.join(targetDirectory, agentFile));
    for (let i = 0; i < args.length; i++) {
        args[i] = '\"' + args[i] + '\"'
    }
    let output;
    const command = '"' + python3Command + '" ' + args.join(' ');
    console.log('\nRunning command: ' + command);
    exec(command,
        {
            maxBuffer: 2000 * 1024
        },
        (error, stdout, stderr) => {
            if (error) {
                // fs.writeFileSync(agentOutputFilePath, output);
                // dialog.showErrorBox('Error encountered while trying to run agent ', command + ':' + stderr + ' \ngrader may not have sufficient privileges; Please delete the hidden grader data folder and make sure the grader is able to run Java. If the problem persists, the grader may be unable to find Java. In this case, try running it from a terminal.');
                // event.returnValue = error;
                output = JSON.stringify({
                    errorOutput: error.toString()
                });
            } else {
                output = stdout;
                if (!output) {
                    output = JSON.stringify({
                        errorOutput: stderr.toString()
                    });
                }
            }
            fs.writeFileSync(agentOutputFilePath, output);
            event.returnValue = output;
        });
});

ipcMain.on('runPython3OutputGradingAgent', (event, targetDirectory, mainFile, python3Command, agentOutputFilePath) => {
    let args = [];
    args.push(pathUtils.join(targetDirectory, mainFile));
    for (let i = 0; i < args.length; i++) {
        args[i] = '\"' + args[i] + '\"'
    }
    let output;
    const command = '"' + python3Command + '" ' + args.join(' ');
    console.log('\nRunning command: ' + command);
    exec(command,
        {
            maxBuffer: 2000 * 1024,
        },
        (error, stdout, stderr) => {
            if (error) {
                // fs.writeFileSync(agentOutputFilePath, output);
                // dialog.showErrorBox('Error encountered while trying to run agent ', command + ':' + stderr + ' \ngrader may not have sufficient privileges; Please delete the hidden grader data folder and make sure the grader is able to run Java. If the problem persists, the grader may be unable to find Java. In this case, try running it from a terminal.');
                // event.returnValue = error;
                output = JSON.stringify({
                    errorOutput: error.toString(),
                    printedOutput: stdout || '',
                });
            } else {
                output = JSON.stringify({
                    printedOutput: stdout || '',
                    errorOutput: stderr || ''
                });
            }
            fs.writeFileSync(agentOutputFilePath, output);
            event.returnValue = output;
        });
});

ipcMain.on('runIDEScript', (event, ideScript, projectPath) => {
    let childProcess = spawn(ideScript, [projectPath], {
        detached: true,
        stdio: 'ignore'
    });
    let spawnargs = childProcess.spawnargs;
    for (let i = 0; i < spawnargs.length; i++) {
        spawnargs[i] = spawnargs[i].replace(/ /g, '\\ ').replace(/\(/g, '\\\(').replace(/\)/g, '\\\)')
    }
    event.returnValue = spawnargs.join(' ');
});

ipcMain.on('getOutputFilePath', (event, defaultFileName) => {
    const result = dialog.showSaveDialog({defaultPath: defaultFileName});
    if (result) {
        event.returnValue = result;
    } else {
        event.returnValue = false;
    }
});

ipcMain.on('openDexTools', (event) => {
    // Open the DevTools.
    win.webContents.openDevTools();
    event.returnValue = true;
});

ipcMain.on('readCookie', (event, cookieName) => {
    session.defaultSession.cookies.get({}, (error, cookies) => {
        let targetCookieVal = null;
        cookies.forEach(function (cookie) {
            if (cookie.name === cookieName) {
                targetCookieVal = cookie.value;
            }
        });
        event.returnValue = targetCookieVal;
    });
});

ipcMain.on('writeCookie', (event, cookieName, cookieValue) => {
    const date = new Date();
    const days = 365; // Expire in a year
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    session.defaultSession.cookies.set({
            url: COOKIE_URL_NAME,
            name: cookieName,
            value: cookieValue,
            expirationDate: date.getTime() / 1000
        },
        (error) => {
            if (error) {
                console.error(error);
            } else {
                event.returnValue = true;
            }
        }
    );
});

ipcMain.on('deleteCookie', (event, cookieName) => {
    session.defaultSession.cookies.set({
            url: COOKIE_URL_NAME,
            name: cookieName,
            value: '',
            expirationDate: 1
        },
        (error) => {
            if (error) {
                console.error(error);
            } else {
                event.returnValue = true;
            }
        }
    );
});

ipcMain.on('getAssetsPath', (event) => {
    event.returnValue = pathUtils.join(basepath, 'assets');
});
