import {Injectable} from '@angular/core';
import {DirectoryConfigService} from "./directory-config.service";
import {OptionalItemPreprocessorService} from "./optional-item-preprocessor.service";
import {CookieService} from "./cookie.service";

declare let mainProcess: any;

@Injectable({
    providedIn: 'root'
})
export class AgentRunnerService {
    directoryConfig: DirectoryConfigService;
    optionalItemPreprocessorService: OptionalItemPreprocessorService;
    cookieService: CookieService;

    constructor(directoryConfig: DirectoryConfigService,
                optionalItemPreprocessorService: OptionalItemPreprocessorService,
                cookieService: CookieService) {
        this.directoryConfig = directoryConfig;
        this.optionalItemPreprocessorService = optionalItemPreprocessorService;
        this.cookieService = cookieService;
    }

    runAgent(graderDataDirectory: string, submissionDirectory: string) {
        const allSubmissionsDirectory = mainProcess.join(graderDataDirectory, this.directoryConfig.GRADER_SUBMISSIONS);
        const supportFilesPath = mainProcess.join(graderDataDirectory, this.directoryConfig.GRADER_SUPPORT_FILES);
        const graderConfigPath = mainProcess.join(supportFilesPath, this.directoryConfig.GRADER_CONFIG_NAME);
        const fullSubmissionDirectory = mainProcess.join(allSubmissionsDirectory, submissionDirectory);
        const graderConfig = JSON.parse(mainProcess.readFile(graderConfigPath));
        const tempDir = mainProcess.join(fullSubmissionDirectory, this.directoryConfig.TEMP_DIR_NAME);
        if (!mainProcess.exists(tempDir)) {
            mainProcess.makeDir(tempDir);
        } else {
            mainProcess.clearDir(tempDir);
        }

        const studentFiles = mainProcess.listFiles(fullSubmissionDirectory).filter(name => name !== this.directoryConfig.TEMP_DIR_NAME);
        for (let j = 0; j < studentFiles.length; j++) {
            const fileToCopy = studentFiles[j];
            const source = mainProcess.join(fullSubmissionDirectory, fileToCopy);
            const destination = mainProcess.join(tempDir, fileToCopy);
            mainProcess.copy(source, destination)
        }

        // copy over support files, overwriting when necessary
        for (let i = 0; i < graderConfig.supportFiles.length; i++) {
            const supportFileName = graderConfig.supportFiles[i];
            const sourceFile = mainProcess.join(supportFilesPath, supportFileName);
            const destinationFile = mainProcess.join(tempDir, supportFileName);
            mainProcess.copy(sourceFile, destinationFile)
        }

        if (graderConfig.checkstyleFileName) {
            const checkstylePath = mainProcess.join(supportFilesPath, graderConfig.checkstyleFileName);
            mainProcess.copy(checkstylePath, mainProcess.join(tempDir, graderConfig.checkstyleFileName))
        }

        let agentOutput;
        if (graderConfig.language === 'java8' || graderConfig.language === 'java10') {
            let javaVersion = 0;
            if (graderConfig.language === 'java8') {
                javaVersion = 8;
            } else if (graderConfig.language === 'java10') {
                javaVersion = 10;
            }
            if (graderConfig.gradingStyle === 'tests') {
                agentOutput = this.runJavaAgent(graderConfig, javaVersion, tempDir, true, graderConfig.junitVersion);
            } else {
                agentOutput = this.runJavaAgent(graderConfig, javaVersion, tempDir, false, -1);
            }
        } else if (graderConfig.language === 'python3') {
            if (graderConfig.gradingStyle === 'tests') {
                agentOutput = this.runPython3Agent(graderConfig, tempDir, true);
            } else {
                agentOutput = this.runPython3Agent(graderConfig, tempDir, false);
            }
        } else {
            throw new Error('Unrecognized language');
        }
        mainProcess.clearDir(tempDir);

        // Now integrate the results into the initialized grader data
        const graderDataPath = mainProcess.join(fullSubmissionDirectory, this.directoryConfig.GRADER_DATA_FILE_NAME);
        let graderData = JSON.parse(mainProcess.readFile(graderDataPath));

        if (agentOutput.checkstyle) {
            graderData.checkstyle = agentOutput.checkstyle;
        }

        if (graderConfig.language === 'java8' || graderConfig.language === 'java10') {
            graderData.compile = agentOutput.compile;
            graderData.declaredJavaEntities = {
                fields: agentOutput.declaredFields,
                methods: agentOutput.declaredMethods,
            }
        }

        if (graderConfig.language === 'python3') {
            if (agentOutput.errorOutput) {
                graderData.errorOutput = agentOutput.errorOutput;
            }
            if (agentOutput.tests && agentOutput.tests.failureOutput) {
                graderData.failureOutput = agentOutput.tests.failureOutput;
            }
            if (agentOutput.tests && agentOutput.tests.printedOutput) {
                graderData.printedOutput = agentOutput.tests.printedOutput;
            }
        }


        if (graderConfig.gradingStyle === 'tests') {
            const testReferenceData = JSON.parse(
                mainProcess.readFile(
                    mainProcess.join(
                        graderDataDirectory,
                        this.directoryConfig.TEST_DATA_FILE_NAME
                    )
                )
            );

            graderData.testPointsLost = 0;
            let shouldIntegrateTestData = false;
            if (graderConfig.language === 'java8' || graderConfig.language === 'java10') {
                shouldIntegrateTestData = graderData.compile.success;
            } else if (graderConfig.language === 'python3') {
                shouldIntegrateTestData = !agentOutput.errorOutput;
            }
            if (shouldIntegrateTestData) {
                graderData.testOutput = agentOutput.tests.output;
                const allTestNames = Object.keys(testReferenceData.currentTests);
                for (let i = 0; i < allTestNames.length; i++) {
                    const testName = allTestNames[i];
                    const rawTestData = testReferenceData.currentTests[testName];
                    let testData = {
                        name: testName,
                        description: rawTestData.description,
                        author: rawTestData.author,
                        contactLink: rawTestData.contactLink,
                        notes: rawTestData.notes,
                        expectedException: rawTestData.expectedException,
                        points: (rawTestData.points > 0) ? -1 * rawTestData.points : rawTestData.points,
                        type: 'boolean',
                        version: rawTestData.latestVersion,
                        oldVersions: rawTestData.versions,
                        isTest: true
                    };
                    if (agentOutput.tests.failures.indexOf(testName) > -1) {
                        if (rawTestData.autoApplyText) {
                            graderData.appliedRubricItems.push({
                                points: testData.points,
                                comment: rawTestData.autoApplyText,
                                items: [testData]
                            });
                        } else {
                            graderData.unresolvedRubricItems.push(testData);
                        }
                        graderData.testPointsLost += testData.points;
                    } else {
                        graderData.skippedRubricItems.push(testData);
                    }
                }
            }
        } else if (graderConfig.gradingStyle === 'output') {
            // Output is different for java versus python
            if (graderConfig.language === 'java8' || graderConfig.language === 'java10') {
                graderData.printedOutput = agentOutput.output;
            } else if (graderConfig.language === 'python3') {
                graderData.printedOutput = agentOutput.printedOutput;
            }
        }

        // Rerunning this to capture checkstyle output, etc.
        graderData = this.optionalItemPreprocessorService.applyHintKeyOptionalItems(graderData, graderConfig);

        mainProcess.writeToFile(graderDataPath, JSON.stringify(graderData));
    }


    private runJavaAgent(graderConfig: any, javaVersion: number, targetDir: string, isTest: boolean, junitVersion: number): any {
        const agentOutputFilePath = mainProcess.join(targetDir, this.directoryConfig.AGENT_OUTPUT_FILE_NAME);

        let checkStylePath = 'none';

        if (graderConfig.checkstyleFileName) {
            checkStylePath = mainProcess.join(targetDir, graderConfig.checkstyleFileName);
        }

        const settings = this.cookieService.getGraderSettings();

        if (isTest) {
            if (junitVersion === 4) {
                mainProcess.runJavaJunit4GradingAgent(
                    javaVersion,
                    targetDir,
                    graderConfig.testClassName,
                    settings.javaCommand,
                    settings.javaCompilerCommand,
                    checkStylePath,
                    agentOutputFilePath,
                    graderConfig.studentFiles);
            } else if (junitVersion === 5) {
                mainProcess.runJavaJunit5GradingAgent(
                    javaVersion,
                    targetDir,
                    graderConfig.testClassName,
                    settings.javaCommand,
                    settings.javaCompilerCommand,
                    checkStylePath,
                    agentOutputFilePath,
                    graderConfig.studentFiles);
            } else {
                throw new Error('Unrecognized JUnit Version: ' + junitVersion);
            }
        } else if (!isTest) {
            mainProcess.runJavaOutputGradingAgent(
                javaVersion,
                targetDir,
                graderConfig.mainClassName,
                settings.javaCommand,
                settings.javaCompilerCommand,
                checkStylePath,
                agentOutputFilePath,
                graderConfig.studentFiles);
        } else {
            throw new Error('Haven\'t implemented anything else yet');
        }

        const text = mainProcess.readFile(agentOutputFilePath);
        return JSON.parse(text);
    }

    private runPython3Agent(graderConfig: any, targetDir: string, isTest: boolean): any {
        const agentOutputFilePath = mainProcess.join(targetDir, this.directoryConfig.AGENT_OUTPUT_FILE_NAME);

        const settings = this.cookieService.getGraderSettings();

        if (isTest) {

            // Copy over required test entities
            const helperFileDirectory = mainProcess.join(mainProcess.getAssetsPath(), this.directoryConfig.PYTHON3_HELPER_FILE_DIRECTORY);
            [
                this.directoryConfig.PYTHON3_TEST_RUNNER_AGENT,
                this.directoryConfig.PYTHON3_CI_UNIT_TEST_CLASS
            ].forEach(filename => {
                const source = mainProcess.join(helperFileDirectory, filename);
                const dest = mainProcess.join(targetDir, filename);
                mainProcess.copy(source, dest);
            });

            // Copy over test class wrapper
            const moduleName = graderConfig.testFileName.replace('.py', '');
            mainProcess.writeToFile(
                mainProcess.join(
                    targetDir,
                    this.directoryConfig.PYTHON3_TEST_CLASS_WRAPPER
                ),
                [
                    'import ',
                    moduleName,
                    '\n\n\n',
                    'test_class = ',
                    moduleName,
                    '.',
                    graderConfig.testClassName,
                    '\n'
                ].join('')
            );

            mainProcess.runPython3UnitTestGradingAgent(
                targetDir,
                this.directoryConfig.PYTHON3_TEST_RUNNER_AGENT,
                settings.python3Command,
                agentOutputFilePath);
        } else {
            mainProcess.runPython3OutputGradingAgent(
                targetDir,
                graderConfig.mainFileName,
                settings.python3Command,
                agentOutputFilePath);
        }

        const text = mainProcess.readFile(agentOutputFilePath);
        return JSON.parse(text);
    }
}
