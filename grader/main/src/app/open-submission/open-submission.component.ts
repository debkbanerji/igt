import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {Subscription} from "rxjs/internal/Subscription";
import {DirectoryConfigService} from "../providers/directory-config.service";
import {AgentRunnerService} from "../providers/agent-runner.service";
import {InitializeDirectoryService} from "../providers/initialize-directory.service";
import {OptionalItemPreprocessorService} from "../providers/optional-item-preprocessor.service";
import {CookieService} from "../providers/cookie.service";

declare let mainProcess: any;
declare let particlesJS: any;

@Component({
    selector: 'app-open-submission',
    templateUrl: './open-submission.component.html',
    styleUrls: ['./open-submission.component.css']
})
export class OpenSubmissionComponent implements OnInit, OnDestroy {
    paramSubscription: Subscription;
    directoryName: string;
    // processingStatusText: string;
    graderSettings: any;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private directoryConfigService: DirectoryConfigService,
        private agentRunnerService: AgentRunnerService,
        private initializeDirectoryService: InitializeDirectoryService,
        private optionalItemPreprocessorService: OptionalItemPreprocessorService,
        private cookieService: CookieService) {
        this.graderSettings = cookieService.getGraderSettings();
    }

    ngOnInit() {
        if (this.graderSettings.enableParticles) {
            particlesJS.load('particles-js-target', 'assets/json/particlesjs-config.json', function () {
            });
        }
        this.paramSubscription = this.route.params.subscribe(params => {
            this.directoryName = params.directory;
            const allSubmissionsDirectory = mainProcess.join(this.initializeDirectoryService.graderBaseDirectory, this.directoryConfigService.GRADER_SUBMISSIONS);
            const fullDirectoryName = mainProcess.join(allSubmissionsDirectory, this.directoryName);
            const mustRunTestsMarkerPath = mainProcess.join(fullDirectoryName, this.directoryConfigService.NO_AGENT_RUN_MARKER);
            const graderConfigPath = mainProcess.join(
                mainProcess.join(
                    this.initializeDirectoryService.graderBaseDirectory,
                    this.directoryConfigService.GRADER_SUPPORT_FILES),
                this.directoryConfigService.GRADER_CONFIG_NAME);
            const graderConfig = JSON.parse(
                mainProcess.readFile(graderConfigPath));
            const graderDataFilePath = mainProcess.join(fullDirectoryName, this.directoryConfigService.GRADER_DATA_FILE_NAME);
            let submissionGraderData = JSON.parse(mainProcess.readFile(graderDataFilePath));
            if (mainProcess.exists(mustRunTestsMarkerPath)) {
                if (!submissionGraderData.missingSubmissionFiles) {
                    // this.processingStatusText = 'Running Code...';
                    setTimeout(() => {
                        this.agentRunnerService.runAgent(this.initializeDirectoryService.graderBaseDirectory, this.directoryName);
                        mainProcess.deleteFile(mustRunTestsMarkerPath);
                        this.startGrading();
                    }, 1000);
                } else {
                    submissionGraderData = this.optionalItemPreprocessorService.applyHintKeyOptionalItems(submissionGraderData, graderConfig);
                    mainProcess.deleteFile(mustRunTestsMarkerPath);
                    mainProcess.writeToFile(graderDataFilePath, JSON.stringify(submissionGraderData));
                    this.startGrading();
                }
            } else {
                const backgroundMarkerPath = mainProcess.join(this.directoryName, this.directoryConfigService.NO_AGENT_RUN_MARKER);
                if (mainProcess.exists(backgroundMarkerPath)) {
                    // TODO: tell the user that this directory is staged for background running
                    this.router.navigate(['home', 'none']);
                } else {
                    this.startGrading();
                }
            }
        });
    }

    startGrading() {
        this.router.navigate(['grade-submission', this.directoryName]);
    }

    ngOnDestroy() {
        if (this.paramSubscription) {
            this.paramSubscription.unsubscribe();
        }
    }
}
