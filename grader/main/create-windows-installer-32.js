const electronInstaller = require('electron-winstaller');
const {execSync} = require('child_process');

let command = 'rcedit.exe \"../release-builds/igt-win32-ia32/igt.exe\" --set-icon \"src/favicon.ico\" --set-version-string \"FileDescription\" \"IGT\" --set-version-string \"ProductName\" \"IGT\" --set-version-string \"CompanyName\" \"Deb Banerji\" --set-version-string \"LegalCopyright\" \"Copyright Deb Banerji 2017\"';
execSync(command);

resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: '../release-builds/igt-win32-ia32',
    outputDirectory: '../installers/windows-32',
    authors: 'Deb Banerji',
    exe: 'igt.exe'
});

resultPromise.then(() => console.log("Successfully Created Installer!"), (e) => console.log(`No dice: ${e.message}`));
