import {Injectable} from '@angular/core';
import {DirectoryConfigService} from './directory-config.service';
import {IntellijProjectGeneratorService} from './intellij-project-generator.service';
import {GenerateSummaryService} from "./generate-summary.service";
import {CookieService} from "./cookie.service";
import {PycharmProjectGeneratorService} from "./pycharm-project-generator.service";
import {main} from "@angular/compiler-cli/src/main";

declare let mainProcess: any;

@Injectable()
export class FileInterfaceService {

    public graderBaseDirectory: string;
    public submissionsDirectory: string;
    public supportFilesDirectory: string;
    public autocompleteDirectory: string;
    public targetDirectory: string;

    public graderConfig: any;
    public testData: any;
    public graderSettings: any;
    public isDarkTheme: boolean;

    public compiledLanguage: boolean;

    public submissionList: any; // List of submission names

    constructor(private directoryConfig: DirectoryConfigService,
                private intellijProjectGeneratorService: IntellijProjectGeneratorService,
                private pycharmProjectGeneratorService: PycharmProjectGeneratorService,
                private generateSummaryService: GenerateSummaryService,
                private cookieService: CookieService
    ) {
        this.graderSettings = cookieService.getGraderSettings();
        this.isDarkTheme = this.graderSettings ? this.graderSettings.isDarkTheme : false;
    }

    public initialize(targetDirectory) {
        this.targetDirectory = targetDirectory;
        this.graderBaseDirectory = mainProcess.join(targetDirectory, this.directoryConfig.GRADER_DATA_FOLDER_NAME);
        this.submissionsDirectory = mainProcess.join(this.graderBaseDirectory, this.directoryConfig.GRADER_SUBMISSIONS);
        this.supportFilesDirectory = mainProcess.join(this.graderBaseDirectory, this.directoryConfig.GRADER_SUPPORT_FILES);
        this.autocompleteDirectory = mainProcess.join(this.graderBaseDirectory, this.directoryConfig.AUTOCOMPLETE_FILE_NAME);
        const graderConfigPath = mainProcess.join(this.supportFilesDirectory, this.directoryConfig.GRADER_CONFIG_NAME);
        this.graderConfig = JSON.parse(mainProcess.readFile(graderConfigPath));
        if (this.graderConfig.gradingStyle === 'tests') {
            const testDataPath = mainProcess.join(this.graderBaseDirectory, this.directoryConfig.TEST_DATA_FILE_NAME);
            this.testData = JSON.parse(mainProcess.readFile(testDataPath));
        }
        this.initializeSubmissionList();
    }

    public getTargetDirectory = function () {
        return this.targetDirectory;
    };

    public getDirectoryGraderConfig(targetDirectory) {
        const graderBaseDirectory = mainProcess.join(targetDirectory, this.directoryConfig.GRADER_DATA_FOLDER_NAME);
        const supportFilesDirectory = mainProcess.join(graderBaseDirectory, this.directoryConfig.GRADER_SUPPORT_FILES);
        const graderConfigPath = mainProcess.join(supportFilesDirectory, this.directoryConfig.GRADER_CONFIG_NAME);
        return JSON.parse(mainProcess.readFile(graderConfigPath));
    }

    public writeDirectoryGraderConfig(targetDirectory, graderConfig) {
        const graderBaseDirectory = mainProcess.join(targetDirectory, this.directoryConfig.GRADER_DATA_FOLDER_NAME);
        const supportFilesDirectory = mainProcess.join(graderBaseDirectory, this.directoryConfig.GRADER_SUPPORT_FILES);
        const graderConfigPath = mainProcess.join(supportFilesDirectory, this.directoryConfig.GRADER_CONFIG_NAME);
        mainProcess.writeToFile(graderConfigPath, JSON.stringify(graderConfig));
    }

    public getGraderConfig() {
        return this.graderConfig;
    }

    public getTestData() {
        return this.testData;
    }

    public getPreviewSubmissionsList() {
        const result = [];
        const submissionDirectories = mainProcess.listFiles(this.submissionsDirectory);
        for (let i = 0; i < submissionDirectories.length; i++) {
            const submissionDirectoryName = submissionDirectories[i];
            if (submissionDirectoryName !== this.directoryConfig.IDE_PROJECTS_DIRECTORY) {
                let submissionPreview = this.getSubmissionPreview(submissionDirectoryName);
                result.push(submissionPreview)
            }
        }
        return result;
    }

    private getSubmissionPreview(submissionDirectoryName) {
        const submissionDirectoryPath = mainProcess.join(this.submissionsDirectory, submissionDirectoryName);
        let submission: any;
        submission = {
            directoryName: submissionDirectoryName,
        };
        submission.compiledLanguage = this.graderConfig.language === 'java8';
        const graderDataPath = mainProcess.join(submissionDirectoryPath, this.directoryConfig.GRADER_DATA_FILE_NAME);
        const graderDataString = mainProcess.readFile(graderDataPath);
        const graderData = JSON.parse(graderDataString);
        submission.lastGradedTime = graderData.lastGradedTime;
        submission.missingSubmissionFiles = graderData.missingSubmissionFiles;
        const agentNotRunMarker = mainProcess.join(submissionDirectoryPath, this.directoryConfig.NO_AGENT_RUN_MARKER);
        if (mainProcess.exists(agentNotRunMarker)) {
            submission.agentRun = false;
        } else {
            submission.agentRun = true;
            submission.done = graderData.done;
            if (!submission.missingSubmissionFiles) {
                if (submission.compiledLanguage) {
                    submission.successfulCompile = graderData.compile.success
                }
            }
            if (this.graderConfig.gradingStyle === 'tests'
                && !graderData.missingSubmissionFiles
                && !graderData.errorOutput
                && (graderData.compile ? graderData.compile.success : true)) {
                const testNames = Object.keys(this.getTestData().currentTests);
                const successfulTests = [];
                (graderData.skippedRubricItems || []).forEach((item) => {
                    if (item.isTest) {
                        successfulTests.push(item.name);
                    }
                });
                let testData = {};
                testNames.sort().forEach((testName) => {
                    testData[testName] = successfulTests.indexOf(testName) < 0 ? 'failure' : 'success';
                });
                submission.testData = testData;
            }
            submission.appliedRubricItemPoints = this.generateSummaryService.getAppliedRubricItemPoints(graderData);
            submission.optionalRubricItemPoints = this.generateSummaryService.getOptionalRubricItemPoints(graderData);
            submission.pointAdjustmentItemPoints = this.generateSummaryService.getPointAdjustmentItemPoints(graderData);
            submission.finalScore = this.generateSummaryService.getFinalScore(graderData, this.graderConfig);
        }
        return submission;
    }

    public getGraderData(submissionDirectory) {
        const submissionDirectoryPath = mainProcess.join(this.submissionsDirectory, submissionDirectory);
        const graderDataPath = mainProcess.join(submissionDirectoryPath, this.directoryConfig.GRADER_DATA_FILE_NAME);
        return JSON.parse(mainProcess.readFile(graderDataPath));
    }

    public writeGraderData(submissionDirectory, graderData) {
        this.setSubmissionDoneStatusForList(submissionDirectory, graderData.done);
        const submissionDirectoryPath = mainProcess.join(this.submissionsDirectory, submissionDirectory);
        const graderDataPath = mainProcess.join(submissionDirectoryPath, this.directoryConfig.GRADER_DATA_FILE_NAME);
        mainProcess.writeToFile(graderDataPath, JSON.stringify(graderData));
    }

    public getAutocompleteData() {
        const autocompleteFilePath = mainProcess.join(this.graderBaseDirectory, this.directoryConfig.AUTOCOMPLETE_FILE_NAME);
        return JSON.parse(mainProcess.readFile(autocompleteFilePath));
    }

    public writeAutocompleteData(autocompleteData) {
        const autocompleteFilePath = mainProcess.join(this.graderBaseDirectory, this.directoryConfig.AUTOCOMPLETE_FILE_NAME);
        mainProcess.writeToFile(autocompleteFilePath, JSON.stringify(autocompleteData));
    }

    public getExportableSubmissions() {
        const provider = this;
        const result = [];
        let totalDoneSubmissions = 0;
        let totalNotDoneSubmissions = 0;
        const submissionDirectories = mainProcess.listFiles(this.submissionsDirectory);
        for (let i = 0; i < submissionDirectories.length; i++) {
            const directory = submissionDirectories[i];
            if (directory !== provider.directoryConfig.IDE_PROJECTS_DIRECTORY) {
                const directoryPath = mainProcess.join(provider.submissionsDirectory, directory);
                const graderDataPath = mainProcess.join(directoryPath, provider.directoryConfig.GRADER_DATA_FILE_NAME);
                const graderDataString = mainProcess.readFile(graderDataPath);
                const graderData = JSON.parse(graderDataString);
                let submissionData;
                const sanitizedDirectoryName = directory.replace(/([ (),])/g, '');
                if (graderData.done) {
                    submissionData = {
                        done: graderData.done,
                        studentName: graderData.studentName,
                        directoryName: directory,
                        sanitizedDirectoryName: sanitizedDirectoryName,
                        points: this.generateSummaryService.getFinalScore(graderData, this.graderConfig),
                        comments: this.generateSummaryService.generateSummary(graderData,
                            this.graderConfig,
                            this.graderSettings.graderName)
                    };
                    totalDoneSubmissions++;
                } else {
                    submissionData = {
                        done: graderData.done,
                        studentName: graderData.studentName,
                        directoryName: directory,
                        sanitizedDirectoryName: sanitizedDirectoryName
                    };
                    totalNotDoneSubmissions++;
                }
                result.push(submissionData);
            }
        }
        return {
            submissionsStats: result,
            totalDoneSubmissions: totalDoneSubmissions,
            totalNotDoneSubmissions: totalNotDoneSubmissions,
            maxPoints: provider.graderConfig.maxPoints
        };
    }

    public getSupportFiles() {
        const result = [];
        const highlightClassMap = this.directoryConfig.PRISM_EXTENSION_MAP;
        for (let i = 0; i < this.graderConfig.supportFiles.length; i++) {
            const fileName = this.graderConfig.supportFiles[i].toString();
            // let isTestsFile = false;
            // if (this.graderConfig.language === 'java8') {
            //     isTestsFile = this.graderConfig.testClassName + '.java' !== fileName;
            // } else if (this.graderConfig.language === 'python3') {
            //     isTestsFile = this.graderConfig.testFileName === fileName;
            // }
            // console.log(fileName);
            // console.log(isTestsFile);
            // if (!isTestsFile) {
            const supportFilePath = mainProcess.join(this.supportFilesDirectory, fileName);
            let highlightClass;
            try {
                const split = fileName.split('.');
                const extension = split[split.length - 1];
                highlightClass = highlightClassMap[extension];
            } catch (err) {
                console.log('Could not find highlighting class for ' + fileName);
            }
            const fileData = {
                name: fileName,
                contents: mainProcess.readFile(supportFilePath),
                highlightClass: highlightClass
            };
            result.push(fileData);
            // }
        }
        return result;
    }

    public getJavaTestsFile() {
        const fileName = this.graderConfig.testClassName + '.java';
        const supportFilePath = mainProcess.join(this.supportFilesDirectory, fileName);
        return {
            name: fileName,
            contents: mainProcess.readFile(supportFilePath),
            highlightClass: 'language-java'
        };
    }

    public getPythonTestsFile() {
        const fileName = this.graderConfig.testFileName;
        const supportFilePath = mainProcess.join(this.supportFilesDirectory, fileName);
        return {
            name: fileName,
            contents: mainProcess.readFile(supportFilePath),
            highlightClass: 'language-python'
        };
    }

    public getSubmittedFiles(submissionDirectory) {
        const result = [];
        const highlightClassMap = this.directoryConfig.PRISM_EXTENSION_MAP;
        const submissionDirectoryPath = mainProcess.join(this.submissionsDirectory, submissionDirectory);
        // let submittedFiles = this.graderConfig.studentFiles;
        const graderData = JSON.parse(mainProcess.readFile(mainProcess.join(submissionDirectoryPath, this.directoryConfig.GRADER_DATA_FILE_NAME)));
        let submittedFiles = graderData.submittedFiles;
        for (let i = 0; i < submittedFiles.length; i++) {
            const fileName = submittedFiles[i];
            const supportFilePath = mainProcess.join(submissionDirectoryPath, fileName);
            let highlightClass;
            try {
                const split = fileName.split('.');
                const extension = split[split.length - 1];
                highlightClass = highlightClassMap[extension];
            } catch (err) {
                console.log('Could not find highlighting class for ' + fileName);
            }
            const fileData = {
                name: fileName,
                contents: mainProcess.readFile(supportFilePath),
                highlightClass: highlightClass
            };
            result.push(fileData);
        }
        return result;
    }

    public generateIDEProject(submissionDirectory) {
        const IDEProjectDirectory = mainProcess.join(this.targetDirectory, this.directoryConfig.IDE_PROJECTS_DIRECTORY);
        if (!mainProcess.exists(IDEProjectDirectory)) {
            mainProcess.makeDir(IDEProjectDirectory);
        }
        const targetDirectory = mainProcess.join(IDEProjectDirectory, submissionDirectory);
        if (this.graderConfig.language === 'java8') {
            return this.intellijProjectGeneratorService.generateProject(
                this.graderConfig,
                submissionDirectory,
                this.graderBaseDirectory,
                targetDirectory);
        } else if (this.graderConfig.language === 'python3') {
            return this.pycharmProjectGeneratorService.generateProject(
                this.graderConfig,
                submissionDirectory,
                this.graderBaseDirectory,
                targetDirectory);
        }
    }

    public getIDEProjectPath(submissionDirectory) {
        const intellijProjectDirectory = mainProcess.join(this.targetDirectory, this.directoryConfig.IDE_PROJECTS_DIRECTORY);
        const targetDirectory = mainProcess.join(intellijProjectDirectory, submissionDirectory);
        if (mainProcess.exists(targetDirectory)) {
            return targetDirectory;
        }
        return null;
    }

    public openIDEProject = function (projectPath: string, IDEScriptPath: string) {
        return mainProcess.runIDEScript(IDEScriptPath, projectPath);
    };

    private initializeSubmissionList() {
        this.submissionList = [];
        const submissionDirectories = mainProcess.listFiles(this.submissionsDirectory);
        for (let i = 0; i < submissionDirectories.length; i++) {
            const submissionDirectoryName = submissionDirectories[i];
            const submissionDirectoryPath = mainProcess.join(this.submissionsDirectory, submissionDirectoryName);
            const graderDataPath = mainProcess.join(submissionDirectoryPath, this.directoryConfig.GRADER_DATA_FILE_NAME);
            const graderDataString = mainProcess.readFile(graderDataPath);
            const graderData = JSON.parse(graderDataString);
            this.submissionList.push(
                {
                    directoryName: submissionDirectoryName,
                    done: graderData.done
                }
            );
        }
    }

    public getSubmissionIndex(directoryName) {
        for (let i = 0; i < this.submissionList.length; i++) {
            if (this.submissionList[i].directoryName === directoryName) {
                return i;
            }
        }
        return -1;
    }

    public isFirstSubmission(directoryName): boolean {
        return this.getSubmissionIndex(directoryName) === 0;
    }

    public isLastSubmission(directoryName): boolean {
        return this.getSubmissionIndex(directoryName) === this.submissionList.length - 1;
    }

    public getNextSubmission(directoryName) {
        return this.submissionList[this.getSubmissionIndex(directoryName) + 1].directoryName;
    }

    public getPreviousSubmission(directoryName) {
        return this.submissionList[this.getSubmissionIndex(directoryName) - 1].directoryName;
    }

    public getNextUngradedSubmission(directoryName) {
        const submissionIndex = this.getSubmissionIndex(directoryName);
        for (let i = 0; i < this.submissionList.length; i++) {
            const targetIndex = (i + 1 + submissionIndex) % this.submissionList.length;
            if (!this.submissionList[targetIndex].done) {
                return this.submissionList[targetIndex].directoryName;
            }
        }
        return null;
    }

    public setSubmissionDoneStatusForList(directoryName, doneStatus) {
        this.submissionList[this.getSubmissionIndex(directoryName)].done = doneStatus;
    }
}
