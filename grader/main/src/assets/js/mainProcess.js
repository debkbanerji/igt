const {ipcRenderer, remote, webFrame, shell, session} = require('electron');
let dictionary = remote.require('dictionary-en-us');
let spell;

dictionary(function (err, dict) {
    if (err) {
        throw err;
    }

    spell = remote.require('nspell')(dict);

});

webFrame.setSpellCheckProvider('en-US', true, {
    spellCheck(text) {
        return spell.correct(text);
    }
});

let mainProcess = {};

mainProcess.getFilePath = function () {
    return ipcRenderer.sendSync('getFilePath');
};

mainProcess.getDirectoryPath = function () {
    return ipcRenderer.sendSync('getDirectoryPath');
};

mainProcess.readFile = function (path, parentPath) {
    return ipcRenderer.sendSync('readFile', path, parentPath);
};

mainProcess.writeToFile = function (path, fileContents, parentPath) {
    return ipcRenderer.sendSync('writeToFile', path, fileContents, parentPath);
};

mainProcess.deleteFile = function (path, parentPath) {
    return ipcRenderer.sendSync('deleteFile', path, parentPath);
};

mainProcess.makeDir = function (path, parentPath) {
    return ipcRenderer.sendSync('makeDir', path, parentPath);
};

mainProcess.clearDir = function (path, parentPath) {
    return ipcRenderer.sendSync('clearDir', path, parentPath);
};

mainProcess.exists = function (path, parentPath) {
    return ipcRenderer.sendSync('exists', path, parentPath);
};

mainProcess.isDir = function (path, parentPath) {
    return ipcRenderer.sendSync('isDir', path, parentPath);
};

mainProcess.listFiles = function (path, parentPath) {
    return ipcRenderer.sendSync('listFiles', path, parentPath);
};

mainProcess.openDevTools = function () {
    return ipcRenderer.sendSync('openDevTools');
};

mainProcess.join = function (parentPath, childPath) {
    return ipcRenderer.sendSync('join', parentPath, childPath);
};

mainProcess.copy = function (source, destination, parentPath) {
    return ipcRenderer.sendSync('copy', source, destination, parentPath);
};

mainProcess.unzip = function (source, destination, parentPath) {
    return ipcRenderer.sendSync('unzip', source, destination, parentPath);
};

mainProcess.runJavaJunit4GradingAgent = function (javaVersion, targetDirectory, testClass, javaCommand, javaCompilerCommand, checkstylePath, outputFilepath, studentFiles) {
    return ipcRenderer.sendSync('runJavaGradingJar', 'java-' + javaVersion + '-junit-4-runner-1.0.jar', targetDirectory, testClass, -1, javaCommand, javaCompilerCommand, checkstylePath, outputFilepath, studentFiles);
};


mainProcess.runJavaJunit5GradingAgent = function (javaVersion, targetDirectory, testClass, javaCommand, javaCompilerCommand, checkstylePath, outputFilepath, studentFiles) {
    return ipcRenderer.sendSync('runJavaGradingJar', 'java-' + javaVersion + '-junit-5-runner-1.0.jar', targetDirectory, testClass, -1, javaCommand, javaCompilerCommand, checkstylePath, outputFilepath, studentFiles);
};

mainProcess.runJavaOutputGradingAgent = function (javaVersion, targetDirectory, mainClass, mainClassTimeout, javaCommand, javaCompilerCommand, checkstylePath, outputFilepath, studentFiles) {
    return ipcRenderer.sendSync('runJavaGradingJar', 'java-' + javaVersion + '-output-runner-1.0.jar', targetDirectory, mainClass, mainClassTimeout, javaCommand, javaCompilerCommand, checkstylePath, outputFilepath, studentFiles);
};

mainProcess.runPython3UnitTestGradingAgent = function (targetDirectory, agentFile, python3Command, agentOutputFilePath) {
    return ipcRenderer.sendSync('runPython3UnitTestGradingAgent', targetDirectory, agentFile, python3Command, agentOutputFilePath);
};

mainProcess.runPython3OutputGradingAgent = function (targetDirectory, mainFile, python3Command, agentOutputFilePath) {
    return ipcRenderer.sendSync('runPython3OutputGradingAgent', targetDirectory, mainFile, python3Command, agentOutputFilePath);
};

mainProcess.runIDEScript = function (projectScript, projectPath) {
    return ipcRenderer.sendSync('runIDEScript', projectScript, projectPath);
};

mainProcess.getOutputFilePath = function (fileName) {
    return ipcRenderer.sendSync('getOutputFilePath', fileName);
};

mainProcess.openDevTools = function () {
    return ipcRenderer.sendSync('openDevTools');
};

mainProcess.killGrader = function () {
    return ipcRenderer.sendSync('killGrader');
};

mainProcess.openExternal = function (link) {
    console.log('opening ' + link);
    shell.openExternal(link);
};

mainProcess.writeCookie = function (cookieName, cookieValue) {
    ipcRenderer.sendSync('writeCookie', cookieName, cookieValue);
};

mainProcess.readCookie = function (cookieName) {
    return ipcRenderer.sendSync('readCookie', cookieName)
};

mainProcess.deleteCookie = function (cookieName) {
    ipcRenderer.sendSync('deleteCookie', cookieName);
};

mainProcess.getAssetsPath = function (cookieName) {
    return ipcRenderer.sendSync('getAssetsPath', cookieName);
};

module.exports.mainProcess = mainProcess;
