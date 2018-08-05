import {Injectable} from '@angular/core';
import {DirectoryConfigService} from "./directory-config.service";
import {OptionalItemPreprocessorService} from "./optional-item-preprocessor.service";

declare let mainProcess: any;

// Service to create the initial grader data for a given submission folder
@Injectable({
    providedIn: 'root'
})
export class InitialDataCreatorService {
    directoryConfig: DirectoryConfigService;
    optionalItemPreprocessorService: OptionalItemPreprocessorService;

    constructor(directoryConfig: DirectoryConfigService,
                optionalItemPreprocessorService: OptionalItemPreprocessorService) {
        this.directoryConfig = directoryConfig;
        this.optionalItemPreprocessorService = optionalItemPreprocessorService;

    }

    createInitialSubmissionData(graderDataDirectory: string, submissionDirectory: string) {
        const allSubmissionsDirectory = mainProcess.join(graderDataDirectory, this.directoryConfig.GRADER_SUBMISSIONS);
        const supportFilesPath = mainProcess.join(graderDataDirectory, this.directoryConfig.GRADER_SUPPORT_FILES);
        const graderConfigPath = mainProcess.join(supportFilesPath, this.directoryConfig.GRADER_CONFIG_NAME);
        const fullSubmissionDirectory = mainProcess.join(allSubmissionsDirectory, submissionDirectory);
        const graderConfig = JSON.parse(mainProcess.readFile(graderConfigPath));
        let graderData: any = {};
        const graderDataPath = mainProcess.join(fullSubmissionDirectory, this.directoryConfig.GRADER_DATA_FILE_NAME);
        if (mainProcess.exists(graderDataPath)) {
            return; // don't do anything
        }
        graderData.optionalRubricItems = graderConfig.optionalRubricItems.map(function (item) {
            return {
                name: item.name,
                points: item.points,
                notes: item.notes,
                author: item.author,
                contactLink: item.contactLink,
                regexes: item.regexes,
                badRegexes: item.badRegexes,
                goodRegexes: item.goodRegexes,
                hintKey: item.hintKey,
                maxApplications: item.maxApplications || 1,
                numApplications: 0,
                comments: [],
                panelExpanded: false
            }
        });
        graderData.comments = [];
        graderData.pointAdjustmentItems = [];
        graderData.done = false;
        graderData.submittedFiles = mainProcess.listFiles(fullSubmissionDirectory).filter(
            file => [this.directoryConfig.TSQUARE_TIMESTAMP_FILE].indexOf(file) < 0
        );
        let missingSubmissionFiles = false;
        const expectedFiles = graderConfig.studentFiles;
        for (let i = 0; i < expectedFiles.length; i++) {
            const file = expectedFiles[i];
            if (!mainProcess.exists(mainProcess.join(fullSubmissionDirectory, file))) {
                missingSubmissionFiles = true;
            }
        }
        graderData.missingSubmissionFiles = missingSubmissionFiles;
        const unresolvedRubricItems = [];
        const providedRubricItems = graderConfig.rubricItems || [];
        for (let i = 0; i < providedRubricItems.length; i++) {
            const providedItem = providedRubricItems[i];
            unresolvedRubricItems.push({
                name: providedItem.name,
                points: providedItem.points,
                notes: providedItem.notes,
                author: providedItem.author,
                contactLink: providedItem.contactLink,
                regexes: providedItem.regexes,
                badRegexes: providedItem.badRegexes,
                goodRegexes: providedItem.goodRegexes,
                isTest: false
            });
        }
        graderData.unresolvedRubricItems = unresolvedRubricItems;
        graderData.appliedRubricItems = [];
        graderData.skippedRubricItems = [];

        if (graderConfig.submissionStyle === 'tsquare') {
            const timestampSource = mainProcess.join(fullSubmissionDirectory, this.directoryConfig.TSQUARE_TIMESTAMP_FILE);
            if (mainProcess.exists(timestampSource)) {
                graderData.tsquareTimestamp = mainProcess.readFile(timestampSource)
            }
        }

        graderData = this.optionalItemPreprocessorService.applyHintKeyOptionalItems(graderData, graderConfig);

        mainProcess.writeToFile(graderDataPath, JSON.stringify(graderData));
    }
}
