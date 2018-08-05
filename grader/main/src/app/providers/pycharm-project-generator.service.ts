import { Injectable } from '@angular/core';
import {DirectoryConfigService} from "./directory-config.service";

declare let mainProcess: any;

@Injectable({
  providedIn: 'root'
})
export class PycharmProjectGeneratorService {

    public generateProject = function (graderConfig: any,
                                       submissionDirectory: string,
                                       graderBaseDirectory: any,
                                       targetFolder: string) {
        const component = this;

        if (mainProcess.exists(targetFolder)) {
            throw new Error('Project already exists');
        }
        mainProcess.makeDir(targetFolder);

        const submissionsDirectoryPath = mainProcess.join(graderBaseDirectory, component.directoryConfig.GRADER_SUBMISSIONS);
        const studentFilesDirectory = mainProcess.join(submissionsDirectoryPath, submissionDirectory);
        mainProcess.listFiles(studentFilesDirectory).filter(file => {
            return file !== component.directoryConfig.GRADER_DATA_FILE_NAME
                && file !== component.directoryConfig.TSQUARE_TIMESTAMP_FILE;
        }).forEach(function (file) {
            const source = mainProcess.join(studentFilesDirectory, file);
            const destination = mainProcess.join(targetFolder, file);
            mainProcess.copy(source, destination);
        });

        const supportFilesDirectory = mainProcess.join(graderBaseDirectory, component.directoryConfig.GRADER_SUPPORT_FILES);
        graderConfig.supportFiles.forEach(function (file) {
            const source = mainProcess.join(supportFilesDirectory, file);
            const destination = mainProcess.join(targetFolder, file);
            mainProcess.copy(source, destination);
        });

        return targetFolder;
    };

    constructor(private directoryConfig: DirectoryConfigService) {
    }
}

