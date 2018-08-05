const electronInstaller = require('electron-winstaller');
const {execSync} = require('child_process');
const pjson = require('./package.json');

let command = 'rcedit.exe \"../release-builds/igt-win32-x64/igt.exe\" --set-icon \"src/favicon.ico\" --set-version-string \"FileDescription\" \"IGT\" --set-version-string \"ProductName\" \"IGT\" --set-version-string \"CompanyName\" \"Deb Banerji\" --set-version-string \"LegalCopyright\" \"Copyright Deb Banerji 2017\"';
execSync(command);

resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: '../release-builds/igt-win32-x64',
    outputDirectory: '../installers/windows-64',
    authors: 'Deb Banerji',
    exe: 'igt.exe',
    version: pjson.version
});

resultPromise.then(() => console.log("Successfully Created Installer!"), (e) => console.log(`No dice: ${e.message}`));

