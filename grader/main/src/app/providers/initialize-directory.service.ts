import {Injectable} from '@angular/core';
import {DirectoryConfigService} from './directory-config.service';
import {InitialDataCreatorService} from "./initial-data-creator.service";

const ZIPPED_FILE_REGEX = new RegExp('\\.((zip)|(tar)|(gz))');

declare let mainProcess: any;
declare let spell: any;

@Injectable()
export class InitializeDirectoryService {

    public graderBaseDirectory: string;
    private submissionsDirectory: string;
    public loadingText: string;

    private graderConfig: any;
    private directoryConfig: DirectoryConfigService;
    private initialDataCreatorService: InitialDataCreatorService;


    constructor(directoryConfig: DirectoryConfigService,
                initialDataCreatorService: InitialDataCreatorService,) {
        this.directoryConfig = directoryConfig;
        this.initialDataCreatorService = initialDataCreatorService;
    }

    setSubmissionsDirectory(submissionsDirectory: string) {
        this.submissionsDirectory = submissionsDirectory;
        this.graderBaseDirectory = mainProcess.join(submissionsDirectory, this.directoryConfig.GRADER_DATA_FOLDER_NAME);
    }

    // Note: This method does not run Tests
    initializeGradingDirectory(supportFilesPath) {
        if (!this.submissionsDirectory) {
            throw new Error('Submissions Directory not set');
        }
        mainProcess.makeDir(this.directoryConfig.GRADER_DATA_FOLDER_NAME, this.submissionsDirectory);
        this.graderBaseDirectory = mainProcess.join(this.submissionsDirectory, this.directoryConfig.GRADER_DATA_FOLDER_NAME);

        let configString: string;
        configString = mainProcess.readFile(this.directoryConfig.GRADER_CONFIG_NAME, supportFilesPath);
        const config = JSON.parse(configString);
        config.graderName = 'Deb';
        configString = JSON.stringify(config);

        const graderSupportFilesPath = mainProcess.join(this.graderBaseDirectory, this.directoryConfig.GRADER_SUPPORT_FILES);
        mainProcess.makeDir(graderSupportFilesPath);
        mainProcess.writeToFile(mainProcess.join(graderSupportFilesPath, this.directoryConfig.GRADER_CONFIG_NAME), configString);
        // Copy over support files
        let supportFiles: Array<string>;
        supportFiles = config.supportFiles;
        for (let i = 0; i < supportFiles.length; i++) {
            const supportFile = supportFiles[i];
            spell.add(supportFile.split('.java')[0]);
            const sourceFile = mainProcess.join(supportFilesPath, supportFile);
            const destinationFile = mainProcess.join(graderSupportFilesPath, supportFile);
            mainProcess.copy(sourceFile, destinationFile)
        }

        if (config.checkstyleFileName) {
            const checkstylePath = mainProcess.join(supportFilesPath, config.checkstyleFileName);
            mainProcess.copy(checkstylePath, mainProcess.join(graderSupportFilesPath, config.checkstyleFileName))
        }

        // read grader config - this would have been copied over as a source file
        this.readGraderConfig();

        // not necessary to create copy of java-java-checkstyle.xml
        // mainProcess.copy(mainProcess.getCheckstylePath(), mainProcess.join(graderSupportFilesPath, this.CHECKSTYLE_FILE_NAME))

        // extract submission data
        if (config.submissionStyle === 'tsquare') {
            this.extractTsquareSubmissions();
        } else if (config.submissionStyle === 'canvas') {
            this.extractCanvasSubmissions();
        } else if (config.submissionStyle === 'zip') {
            this.extractPlainZipSubmissions();
        } else if (config.submissionStyle === 'canvasZip') {
            this.extractCanvasZipSubmissions();
        } else {
            throw new Error('submissionStyle must be one of the following: tsquare, canvas, zip, canvasZip');
        }

        if (config.gradingStyle === 'tests') {

        }

        const allSubmissionsDir = mainProcess.join(this.graderBaseDirectory, this.directoryConfig.GRADER_SUBMISSIONS);
        const submissionDirs = mainProcess.listFiles(allSubmissionsDir);
        for (let i = 0; i < submissionDirs.length; i++) {
            const submissionDir = submissionDirs[i];
            this.initialDataCreatorService.createInitialSubmissionData(this.graderBaseDirectory, submissionDir);
        }

        this.createAutocompleteFile();

        // if the current grading style uses tests
        if (config.gradingStyle === 'tests') {

            // Mark each submission directory to tell the grader no tests have been run on this directory yet
            for (let i = 0; i < submissionDirs.length; i++) {
                const targetFilePath = mainProcess.join(mainProcess.join(allSubmissionsDir, submissionDirs[i]), this.directoryConfig.NO_AGENT_RUN_MARKER);
                mainProcess.writeToFile(targetFilePath, 'This file helps the autograder know that tests have not been run on this directory. Don\'t removeit or bad stuff might happen');
            }

            // Now we generate information about the tests
            // Write empty data to the test info file and then 'patch in' the actual info
            const testInfoString = JSON.stringify({
                currentTests: {},
                oldTests: {},
                totalCurrentPoints: 0
            });
            const testInfoFilePath = mainProcess.join(this.graderBaseDirectory, this.directoryConfig.TEST_DATA_FILE_NAME);
            mainProcess.writeToFile(testInfoFilePath, testInfoString);

            let parsedTestData;
            if (config.language === 'java8' || config.language === 'java10') {
                if (config.junitVersion === 4 || config.junitVersion === 5) {
                    const junitFileName = this.graderConfig.testClassName + '.java';
                    const junitFilePath = mainProcess.join(graderSupportFilesPath, junitFileName);
                    const junitFileContents: string = mainProcess.readFile(junitFilePath);
                    parsedTestData = this.getJunit4TestData(junitFileContents);
                } else {
                    throw new Error('unrecognized JUnit version');
                }
            } else if (config.language === 'python3') {
                const testFileName = this.graderConfig.testFileName;
                const testFilePath = mainProcess.join(graderSupportFilesPath, testFileName);
                const testFileContents: string = mainProcess.readFile(testFilePath);
                parsedTestData = this.getPython3TestData(testFileContents);
            } else {
                throw new Error('unrecognized language');
            }

            this.updateTestInfo(parsedTestData, testInfoFilePath);
        } else if (config.gradingStyle === 'output') {
            // Mark each submission directory to tell the grader no tests have been run on this directory yet
            for (let i = 0; i < submissionDirs.length; i++) {
                const targetFilePath = mainProcess.join(mainProcess.join(allSubmissionsDir, submissionDirs[i]), this.directoryConfig.NO_AGENT_RUN_MARKER);
                mainProcess.writeToFile(targetFilePath, 'This file helps the autograder know that the code has not been run for this directory. Don\'t remove it or bad stuff might happen');
            }
        } else {
            throw new Error('interactive grading style not currently supported');
        }
    }

    /**
     * Extracts submissions when they are in the format provided by Tsquare - expecting "submissionStyle": "tsquare" in grader config
     */
    private extractTsquareSubmissions() {
        const graderSubmissionsFilesPath = mainProcess.join(this.graderBaseDirectory, this.directoryConfig.GRADER_SUBMISSIONS);
        mainProcess.makeDir(graderSubmissionsFilesPath);

        let submissions: Array<string>;
        submissions = mainProcess.listFiles(this.submissionsDirectory).filter(
            submission => submission !== this.directoryConfig.GRADER_DATA_FOLDER_NAME && submission !== this.directoryConfig.IDE_PROJECTS_DIRECTORY);
        for (let i = 0; i < submissions.length; i++) {
            const submission = submissions[i];
            const submissionPath = mainProcess.join(this.submissionsDirectory, submission);
            if (mainProcess.isDir(submissionPath) && !(submission === this.directoryConfig.GRADER_CONFIG_NAME)) {
                const submissionAttachmentsDir = mainProcess.join(submissionPath, this.directoryConfig.SUBMISSION_ATTACHMENTS_FOLDER);
                const studentFilesPath = mainProcess.join(graderSubmissionsFilesPath, submission);
                mainProcess.makeDir(studentFilesPath);

                // let submissionFiles = this.graderConfig.studentFiles;
                let submissionFiles = mainProcess.listFiles(submissionAttachmentsDir);
                for (let j = 0; j < submissionFiles.length; j++) {
                    const fileToCopy = submissionFiles[j];
                    const source = mainProcess.join(submissionAttachmentsDir, fileToCopy);
                    const destination = mainProcess.join(studentFilesPath, fileToCopy);
                    if (mainProcess.exists(source)) {
                        mainProcess.copy(source, destination)
                    }
                }
                // Copy over Tsquare timestamp
                const source = mainProcess.join(submissionPath, this.directoryConfig.TSQUARE_TIMESTAMP_FILE);
                const destination = mainProcess.join(studentFilesPath, this.directoryConfig.TSQUARE_TIMESTAMP_FILE);
                if (mainProcess.exists(source)) {
                    mainProcess.copy(source, destination)
                }
            }
        }
    }

    /**
     * Extracts submissions when they are in each their own zip file - expecting "submissionStyle": "zip" in grader config
     */
    private extractPlainZipSubmissions() {
        const graderSubmissionsFilesPath = mainProcess.join(this.graderBaseDirectory, this.directoryConfig.GRADER_SUBMISSIONS);
        mainProcess.makeDir(graderSubmissionsFilesPath);

        let submissions: Array<string>;
        submissions = mainProcess.listFiles(this.submissionsDirectory).filter(
            submission => submission !== this.directoryConfig.GRADER_DATA_FOLDER_NAME
                && submission !== this.directoryConfig.IDE_PROJECTS_DIRECTORY
                && submission !== this.directoryConfig.GRADER_CONFIG_NAME
                && ZIPPED_FILE_REGEX.test(submission));
        const submissionNameMap = {};
        submissions.forEach(submission => {
            submissionNameMap[submission] = submission.split(ZIPPED_FILE_REGEX)[0];
        });
        this.extractZippedSubmissionsUsingMap(submissionNameMap, graderSubmissionsFilesPath);
    }

    /**
     * Extracts submissions when they are in each their own zip file - expecting "submissionStyle": "canvasZip" in grader config
     */
    private extractCanvasZipSubmissions() {
        const graderSubmissionsFilesPath = mainProcess.join(this.graderBaseDirectory, this.directoryConfig.GRADER_SUBMISSIONS);
        mainProcess.makeDir(graderSubmissionsFilesPath);

        let possibleSubmissions: Array<string> = mainProcess.listFiles(this.submissionsDirectory).filter(
            submission => submission !== this.directoryConfig.GRADER_DATA_FOLDER_NAME
                && submission !== this.directoryConfig.IDE_PROJECTS_DIRECTORY
                && submission !== this.directoryConfig.GRADER_CONFIG_NAME
                && ZIPPED_FILE_REGEX.test(submission));
        const submissionVersionNameMap = {};

        possibleSubmissions.forEach(possibleSubmission => {
                if (ZIPPED_FILE_REGEX.test(possibleSubmission)) {
                    const dotSplit = possibleSubmission.split('.');
                    const fileNameWithoutExtension = dotSplit[0];
                    let extension = '';
                    for (let i = 1; i < dotSplit.length; i++) { // multiple time to account for tar.gz
                        extension = extension + '.' + dotSplit[i];
                    }

                    let version = 0;
                    const dashSplit = fileNameWithoutExtension.split('-');
                    if (/-\d*$/.test(fileNameWithoutExtension)) {
                        version = Number(dashSplit[dashSplit.length - 1]);
                        dashSplit.pop();
                    }
                    const targetFileName = dashSplit.join('-');
                    if (!submissionVersionNameMap[targetFileName]) {
                        submissionVersionNameMap[targetFileName] = {}
                    }
                    submissionVersionNameMap[targetFileName][version] = possibleSubmission;
                }
            }
        );

        const submissionNameMap = {};

        Object.keys(submissionVersionNameMap).forEach(targetFileName => {
            const versions = Object.keys(submissionVersionNameMap[targetFileName]);
            versions.sort(function (a, b) {
                return Number(b) - Number(a)
            });
            submissionNameMap[submissionVersionNameMap[targetFileName][versions[0]]] = targetFileName;
        });

        this.extractZippedSubmissionsUsingMap(submissionNameMap, graderSubmissionsFilesPath);
    }

    private extractZippedSubmissionsUsingMap(submissionNameMap, graderSubmissionsFilesPath) {
        Object.keys(submissionNameMap).forEach((submission) => {
            const submissionPath = mainProcess.join(this.submissionsDirectory, submission);
            const targetFolderName = submissionNameMap[submission];
            const targetPath = mainProcess.join(graderSubmissionsFilesPath, targetFolderName);
            mainProcess.unzip(submissionPath, targetPath);

            // check if we need to unpack from a folder
            const unzippedFiles = mainProcess.listFiles(targetPath);
            if (unzippedFiles.length === 1 && mainProcess.isDir(mainProcess.join(targetPath, unzippedFiles[0]))) {
                const unzippedDirectory = mainProcess.join(targetPath, unzippedFiles[0]);
                if (mainProcess.isDir(unzippedDirectory)) {
                    mainProcess.listFiles(unzippedDirectory).forEach(file => {
                        // WARNING - DOES NOT COPY DEEPER THAN A SINGLE DIRECTORY
                        if (!mainProcess.isDir(mainProcess.join(unzippedDirectory, file))) {
                            mainProcess.copy(
                                mainProcess.join(unzippedDirectory, file),
                                mainProcess.join(targetPath, file)
                            );
                        }
                    })
                }
                mainProcess.clearDir(unzippedDirectory);
            }
        });
    }

    /**
     * Extracts submissions when they are in the format provided by Canvas - expecting "submissionStyle": "canvas" in grader config
     *
     * Note that this does not each student to have zipped their files, so all the files are dumped in a single folder - because Canvas is irritating that way
     *
     * Examples of Canvas submissions can be found in the examples directory
     */
    private extractCanvasSubmissions() {
        const graderSubmissionsFilesPath = mainProcess.join(this.graderBaseDirectory, this.directoryConfig.GRADER_SUBMISSIONS);
        mainProcess.makeDir(graderSubmissionsFilesPath);

        const expectedSubmissionFiles = this.graderConfig.studentFiles;
        const allSubmittedFiles: Array<string> = mainProcess.listFiles(this.submissionsDirectory).filter(
            submission => submission !== this.directoryConfig.GRADER_DATA_FOLDER_NAME && submission !== this.directoryConfig.IDE_PROJECTS_DIRECTORY);

        const studentNames = this.getCanvasStudentNames(allSubmittedFiles, expectedSubmissionFiles);

        const fileData = {};
        studentNames.forEach(name => fileData[name] = []);

        allSubmittedFiles.forEach(file => {
            studentNames.forEach(studentName => {
                if (file.includes(studentName)) {
                    const submittedFileData = this.getCanvasFileData(file, studentName);
                    const version = submittedFileData.version;
                    const copyAsName = submittedFileData.toCopyFileName;
                    if (!fileData[studentName][copyAsName]) {
                        fileData[studentName][copyAsName] = []; // Array of versions
                    }
                    fileData[studentName][copyAsName].push({
                        version: version,
                        originalName: file,
                        copyAsName: copyAsName
                    });
                }
            })
        });

        Object.keys(fileData).forEach(studentName => {
            const submissionPath = mainProcess.join(graderSubmissionsFilesPath, studentName);
            mainProcess.makeDir(submissionPath);
            Object.keys(fileData[studentName]).forEach(fileName => {
                const fileVersionsArray = fileData[studentName][fileName];
                fileVersionsArray.sort((a, b) => {
                    return b.version - a.version;
                });
                const targetFile = fileVersionsArray[0];
                const sourcePath = mainProcess.join(this.submissionsDirectory, targetFile.originalName);
                const destinationPath = mainProcess.join(submissionPath, targetFile.copyAsName);
                mainProcess.copy(sourcePath, destinationPath);
            });
        });
    }

    private getCanvasFileData(file, studentName) {
        const fileNameWithoutstudent = file.split(studentName)[1];
        const fileNameWithoutStudentSplit = fileNameWithoutstudent.split('.');
        const extension = fileNameWithoutStudentSplit[1];
        const fileNameWithJunk = fileNameWithoutStudentSplit[0];
        const underscoreSplit = fileNameWithJunk.split('_');
        underscoreSplit.shift();
        underscoreSplit.shift();
        const fileNameWithoutExtension = underscoreSplit.join('_');
        let version = 0;
        const dashSplit = fileNameWithoutExtension.split('-');
        if (/-\d*$/.test(fileNameWithoutExtension)) {
            version = Number(dashSplit[dashSplit.length - 1]);
            dashSplit.pop();
        }
        const basicFileName = dashSplit.join('-');
        const toCopyFileName = basicFileName + '.' + extension;
        return {version, toCopyFileName};
    }

    /**
     * Infers the student names with canvas ids based on the submitted files
     */
    private getCanvasStudentNames(submittedFiles: Array<string>, expectedSubmissionFiles: Array<string>) {
        const notStudentNameRegexes = expectedSubmissionFiles.map(fileName => {
                const fileNameComponents = fileName.split('.');
                return RegExp('_[^_]*_' + fileNameComponents[0] + '(|(-(\\d*)))\\.' + fileNameComponents[1]);
            }
        );
        const studentNames = [];
        submittedFiles.forEach(file => {
            notStudentNameRegexes.forEach(regex => {
                if (regex.test(file)) {
                    const name = file.split(regex)[0];
                    if (studentNames.indexOf(name) < 0) {
                        studentNames.push(name);
                    }
                }
            });
        });
        return studentNames;
    }

    private updateTestInfo(latestTestData: any, testInfoPath): void {
        const oldTestInfo = JSON.parse(mainProcess.readFile(testInfoPath));
        const outdatedCurrentTests = oldTestInfo.currentTests;
        const outdatedOldTests = oldTestInfo.oldTests;
        const newCurrentTestNames = Object.keys(latestTestData);
        const updatedCurrentTests = {};
        const updatedOldTests = {};
        let updatedTotalCurrentPoints = 0;
        for (let i = 0; i < newCurrentTestNames.length; i++) {
            const testName = newCurrentTestNames[i];
            const newTestData = latestTestData[testName];
            newTestData['version'] = newTestData['version'] || 0; // Default test version is 0
            updatedTotalCurrentPoints += newTestData['points'];
            if (!outdatedCurrentTests[testName]) {
                updatedCurrentTests[testName] = {
                    points: newTestData['points'],
                    latestVersion: newTestData['version'],
                    author: newTestData['author'],
                    contactLink: newTestData['contactLink'],
                    autoApplyText: newTestData['autoApplyText'],
                    notes: newTestData['notes'],
                    expectedException: newTestData['expectedException'],
                    versions: [
                        newTestData['version']
                    ]
                }
            } else {
                const versionsArray = outdatedCurrentTests[testName]['versions'];
                updatedCurrentTests[testName] = {
                    points: newTestData['points'],
                    latestVersion: newTestData['version'],
                    author: newTestData['author'],
                    contactLink: newTestData['contactLink'],
                    autoApplyText: newTestData['autoApplyText'],
                    notes: newTestData['notes'],
                    expectedException: newTestData['expectedException'],
                    versions: versionsArray.concat(versionsArray.indexOf(newTestData['points']) >= 0 ? [] : [
                        newTestData['version']
                    ])
                }
            }
        }

        // create list of old tests
        const outdatedCurrentTestsNames = Object.keys(outdatedCurrentTests);
        for (let i = 0; i < outdatedCurrentTestsNames.length; i++) {
            const testName = outdatedCurrentTestsNames[i];
            if (!updatedCurrentTests[testName]) {
                updatedOldTests[testName] = outdatedCurrentTests[testName];
            }
        }
        const outdatedOldTestsNames = Object.keys(outdatedOldTests);
        for (let i = 0; i < outdatedOldTestsNames.length; i++) {
            const testName = outdatedOldTestsNames[i];
            if (!updatedCurrentTests[testName]) {
                updatedOldTests[testName] = outdatedOldTests[testName];
            }
        }


        const updatedTestInfoString = JSON.stringify({
            currentTests: updatedCurrentTests,
            oldTests: updatedOldTests,
            totalCurrentPoints: updatedTotalCurrentPoints
        });

        const testInfoFilePath = mainProcess.join(this.graderBaseDirectory, this.directoryConfig.TEST_DATA_FILE_NAME);
        mainProcess.writeToFile(testInfoFilePath, updatedTestInfoString);
    }

    private getJunit4TestData(fileContents: string): any {
        const tests = {};
        // Regular expression to match test header - good luck figuring this one out
        const testRegex = /(( *)\/\*\*( *)([\r\n]+))(( *)\*(.*)([\r\n]+))*(( *)\*\/( *)([\r\n]+))( *)@Test(.*)([\r\n]*)(.*)\)/gim;
        const testMatches = fileContents.match(testRegex);
        for (let i = 0; i < testMatches.length; i++) {
            const testData = {};
            const testMatch = testMatches[i];

            // Get test name and expected exception (if it exists)
            const testMatchComponents = testMatch.split(/[\r\n]/gim);
            for (let j = 0; j < testMatchComponents.length; j++) {
                const component = testMatchComponents[j];
                if (j === testMatchComponents.length - 1) {
                    const testSignature = component.split(' ')[component.split(' ').length - 1];
                    testData['name'] = testSignature.split('(')[0];
                }
                const exceptionRegex = /expected( *)=( *)(.*)\.class/gi;
                const exceptionMatches = component.match(exceptionRegex);
                if (exceptionMatches && exceptionMatches.length > 0) {
                    const exceptionLine = exceptionMatches[exceptionMatches.length - 1];
                    const exceptionName = exceptionLine.match(/((\w)*)\.class/gi)[0];
                    testData['expectedException'] = exceptionName.split('.class')[0];
                }
            }

            // get test properties from docblock
            const propertyRegex = /@(points|version|author|contactLink|autoApplyText|notes)(.*)([\r|\n]* *\* [^@].*)*/gim;
            const propertyMatches = testMatch.match(propertyRegex);
            for (let j = 0; j < propertyMatches.length; j++) {
                const propertyMatch = propertyMatches[j].replace(/ *[\r|\n]* *\* */gim, ' ');
                const tag = propertyMatch.match(/@(points|version|author|contactLink|autoApplyText|notes) /gim)[0].replace('@', '').replace(' ', '');
                let tagVal: any = propertyMatch.split(/@(points|version|author|contactLink|autoApplyText|notes) /gim)[2];
                if (tag === 'points' || tag === 'version') {
                    tagVal = Number(tagVal);
                }
                testData[tag] = tagVal;
            }
            tests[testData['name']] = testData;
            delete testData['name'];
        }

        return tests;
    }

    private getPython3TestData(fileContents: string): any {
        const tests = {};
        // Regular expression to match test header
        const testRegex = /(([ \t]*)def * test.*\(.*\)):([ \t]*)([\r\n]+)([ \t]*)("""(.|\r|\n)*?""")/gim;
        const testMatches = fileContents.match(testRegex);

        for (let i = 0; i < testMatches.length; i++) {
            const testData = {};
            const testMatch = testMatches[i];

            // Get test name
            const firstLine = testMatch.split(/[\r\n]/gim)[0];
            const defSplit = firstLine.split(/([ \t]*)def /);
            testData['name'] = defSplit[defSplit.length - 1].split('(')[0];

            // get test properties from docblock
            const propertyRegex = /:(points|version|author|contactLink|autoApplyText|notes):((.*)(([\r|\n]+)([ |\t]*)((?!(:|"| )).*))*)/gim;
            const propertyMatches = testMatch.match(propertyRegex);
            for (let j = 0; j < propertyMatches.length; j++) {
                const propertyMatch = propertyMatches[j].replace(/ *[\r|\n]* *\* */gim, ' ');
                const tag = propertyMatch.match(/:(points|version|author|contactLink|autoApplyText|notes): */gim)[0].replace(/:/g, '').replace(/ /g, '');
                let tagVal: any = propertyMatch.split(/:(points|version|author|contactLink|autoApplyText|notes): */gim)[2].replace(/([ \r\n\t])+/g, ' ').trim();
                if (tag === 'points' || tag === 'version') {
                    tagVal = Number(tagVal);
                }
                testData[tag] = tagVal;
            }
            tests[testData['name']] = testData;
            delete testData['name'];
        }
        return tests;
    }

    createAutocompleteFile() {
        let rubricItemTexts = [];
        let optionalRubricItemTexts = [];
        let additionalCommentTexts = [];
        if (this.graderConfig.autocomplete) {
            rubricItemTexts = this.graderConfig.autocomplete.commonRubricItemComments || [];
            optionalRubricItemTexts = this.graderConfig.autocomplete.commonOptionalRubricItemComments || [];
            additionalCommentTexts = this.graderConfig.autocomplete.commonAdditionalComments || [];
        }
        const result = {
            rubricItemTexts: rubricItemTexts,
            optionalRubricItemTexts: optionalRubricItemTexts,
            additionalCommentTexts: additionalCommentTexts,
            pointAdjustmentTexts: []
        };

        const resultString = JSON.stringify(result);
        const resultFilePath = mainProcess.join(this.graderBaseDirectory, this.directoryConfig.AUTOCOMPLETE_FILE_NAME);
        mainProcess.writeToFile(resultFilePath, resultString);
    }

    getSubmissionsList() {
        const graderSubmissionsFilesPath = mainProcess.join(this.graderBaseDirectory, this.directoryConfig.GRADER_SUBMISSIONS);
        return mainProcess.listFiles(graderSubmissionsFilesPath);
    }

    readGraderConfig() {
        const graderSupportFilesPath = mainProcess.join(this.graderBaseDirectory, this.directoryConfig.GRADER_SUPPORT_FILES);
        const graderConfigPath = mainProcess.join(graderSupportFilesPath, this.directoryConfig.GRADER_CONFIG_NAME);
        const configString = mainProcess.readFile(graderConfigPath);
        this.graderConfig = JSON.parse(configString);
    }
}
