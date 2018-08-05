import {InitializeDirectoryService} from '../providers/initialize-directory.service';
import {DirectoryConfigService} from '../providers/directory-config.service';
import {FileInterfaceService} from '../providers/file-interface.service';
import {environment} from '../../environments/environment';
import {ChangeDetectorRef, Component, OnInit} from "@angular/core";
import {Router} from "@angular/router";
import {CookieService} from "../providers/cookie.service";

declare let mainProcess: any;
declare let spell: any;
declare let particlesJS: any;

@Component({
    selector: 'app-select-submissions',
    templateUrl: './select-submissions.component.html',
    styleUrls: ['./select-submissions.component.css']
})
export class SelectSubmissionsComponent implements OnInit {

    public graderVersion: string = environment.VERSION;
    private NO_DIRECTORY_SELECTED_TEXT = 'No directory selected';

    public loadingText: string;
    public showLoading: boolean;
    public progressBarValue;
    public timeText: string;
    public loadingTimestamp: number;

    public submissionDirText: string;
    public submissionDir;

    public supportFileDir: string;
    public supportFileDirText: string;

    public graderFolderExists: boolean;
    public graderConfigExists: boolean;
    public initializedGradingDirectory: boolean;
    public canStartGrading: boolean;

    public graderConfig: any;

    public graderSettings: any;

    constructor(public initializerService: InitializeDirectoryService,
                private ref: ChangeDetectorRef,
                private directoryConfig: DirectoryConfigService,
                private router: Router,
                private fileInterface: FileInterfaceService,
                private cookieService: CookieService) {
    }

    ngOnInit() {
        this.graderSettings = {}; // so template doesn't freak out
        if (!this.cookieService.graderSettingsExists()) {
            this.openSettings();
        } else {
            this.initializePage();
            this.graderSettings = this.cookieService.getGraderSettings();
            if (this.graderSettings.enableParticles) {
                particlesJS.load('particles-js-target', 'assets/json/particlesjs-config.json', function () {
                });
            }
        }
    }

    public initializePage() {
        this.submissionDirText = this.NO_DIRECTORY_SELECTED_TEXT;
        this.submissionDir = null;
        this.supportFileDirText = this.NO_DIRECTORY_SELECTED_TEXT;
        this.supportFileDir = null;
        this.graderFolderExists = false;
        this.loadingText = null;
        this.timeText = null;
        this.showLoading = false;
        this.progressBarValue = 0;
        this.graderFolderExists = false;
        this.graderConfigExists = false;
        this.initializedGradingDirectory = false;
        this.canStartGrading = false;
    }

    selectSubmissionsDirectory() {
        this.canStartGrading = false;
        this.showLoading = false;
        this.submissionDir = mainProcess.getDirectoryPath();
        if (this.submissionDir) {
            this.initializerService.setSubmissionsDirectory(this.submissionDir);
            this.submissionDirText = this.submissionDir;
            this.graderFolderExists = mainProcess.exists(this.directoryConfig.GRADER_DATA_FOLDER_NAME, this.submissionDir);
            if (this.graderFolderExists) {
                this.canStartGrading = true;
                this.initializedGradingDirectory = true;
                this.graderConfig = this.fileInterface.getDirectoryGraderConfig(this.submissionDir);
                const dictItems = this.graderConfig.dictionaryItems || [];
                dictItems.forEach((item) => {
                    spell.add(item);
                });
            }
        } else {
            this.submissionDirText = this.NO_DIRECTORY_SELECTED_TEXT;
        }
    }

    selectSupportFileDirectory() {
        this.canStartGrading = false;
        this.showLoading = false;
        this.supportFileDir = mainProcess.getDirectoryPath();
        if (this.supportFileDir) {
            this.supportFileDirText = this.supportFileDir;
            this.graderConfigExists = mainProcess.exists(this.directoryConfig.GRADER_CONFIG_NAME, this.supportFileDir);
            if (this.graderConfigExists) {
                // initialize grader
                this.showLoading = true;
                try {
                    this.initializerService.initializeGradingDirectory(this.supportFileDir);
                    this.initializerService.readGraderConfig();
                    this.graderConfig = this.fileInterface.getDirectoryGraderConfig(this.submissionDir);
                    this.initializedGradingDirectory = true;
                    if (this.graderConfig.gradingStyle === 'tests' || this.graderConfig.gradingStyle === 'output') {
                        this.fileInterface.writeDirectoryGraderConfig(this.submissionDir, this.graderConfig);
                        this.canStartGrading = true;
                    } else {
                        alert('NOT IMPLEMENTED - grading style must be either \'tests\' or \'output\'');
                    }
                    const component = this;
                    setTimeout(function () {
                        component.showLoading = false;
                    }, 1000); // Small timeout to emphasize initialization isn't instant
                } catch (err) {
                    mainProcess.openDevTools();
                    console.log(err);
                    this.supportFileDirText = String(err) +
                        '\nPlease delete the ' + this.directoryConfig.GRADER_DATA_FOLDER_NAME + ' folder and fix the issues';
                    this.showLoading = false;
                }
            } else {
                this.supportFileDirText = this.directoryConfig.GRADER_CONFIG_NAME + ' not found in ' + this.supportFileDir;
            }
        } else {
            this.supportFileDirText = this.NO_DIRECTORY_SELECTED_TEXT;
        }
    }

    startGrading() {
        this.listSubmissions();
    }

    private listSubmissions() {
        // this.fileInterface.writeDirectoryGraderConfig(this.submissionDir, this.graderConfig);
        this.fileInterface.initialize(this.submissionDir);
        this.router.navigate(['home', 'none']);
    }

    public openSettings() {
        this.router.navigate(['settings']);
    }

    public openDevTools() {
        mainProcess.openDevTools();
    }

    public saveGraderSettings() {
        this.cookieService.setGraderSettings(this.graderSettings);
    }

    public openContactLink() {
        mainProcess.openExternal('mailto:debkbanerji@gmail.com');
    }

    public openSourceCodeLink() {
        mainProcess.openExternal('https://github.com/debkbanerji/igt');
    }
}
