import {AfterViewInit, Component, OnInit} from '@angular/core';
import {FileInterfaceService} from '../providers/file-interface.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from "rxjs/internal/Subscription";
import {CookieService} from "../providers/cookie.service";
import {MatDialog} from "@angular/material";
import {RunAgentConfirmationDialogComponent} from "../dialogs/run-agent-confirmation-dialog/run-agent-confirmation-dialog.component";
import {InitializeDirectoryService} from "../providers/initialize-directory.service";
import {DirectoryConfigService} from "../providers/directory-config.service";
import {AgentRunnerService} from "../providers/agent-runner.service";
import {OptionalItemPreprocessorService} from "../providers/optional-item-preprocessor.service";

declare let mainProcess: any;
declare let particlesJS: any;

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {

    public submissionsDirectory: string;
    public submissionList: any;
    public filteredSubmissionList: any;
    private paramSubscription: Subscription;
    public targetSubmission: string;
    public searchName: string;
    private graderSettings: any;
    public showDetails: boolean = false;
    public graderConfig: any;
    public numDoneSubmissions: number;

    public numTestRunSubmissions: number;
    public testResultsMap: any;
    public testStatsPanelOpened = false;
    public testStatSortOptions = {
        'nameAsc': 'Name (ascending)',
        'nameDesc': 'Name (descending)',
        'successRateAsc': 'Success Rate (ascending)',
        'successRateDesc': 'Success Rate (descending)'
    };
    public testStatsSelectedSortCriteria: string;
    public sortedTestStatList = null;

    public finalScoreAverage: number;
    public mainRubricItemAverage: number;
    public optionalRubricItemAverage: number;
    public pointAdjustmentAverage: number;

    public doneFinalScoreAverage: number;
    public doneMainRubricItemAverage: number;
    public doneOptionalRubricItemAverage: number;
    public donePointAdjustmentAverage: number;

    public includeNotDoneForPointStats: boolean = false;

    public notRunSubmissionList: any;
    public isCurrentlyRunningSubmissions: boolean = false;
    public currentlyRunningSubmissionIndex: number = -1;

    public min = Math.min;

    constructor(private router: Router,
                public fileInterface: FileInterfaceService,
                private route: ActivatedRoute,
                private cookieService: CookieService,
                public dialog: MatDialog,
                private initializeDirectoryService: InitializeDirectoryService,
                private directoryConfigService: DirectoryConfigService,
                private agentRunnerService: AgentRunnerService,
                private optionalItemPreprocessorService: OptionalItemPreprocessorService
    ) {
        this.paramSubscription = this.route.params.subscribe(params => {
            if (params.submission !== 'none') {
                // this.gradeSubmission(params.submission);
                this.targetSubmission = params.submission
            }
        });
        this.graderSettings = cookieService.getGraderSettings();
        this.graderConfig = fileInterface.graderConfig;
        this.submissionsDirectory = fileInterface.targetDirectory;
    }

    ngOnInit() {
        this.refreshList();
        // this.totalJunitPoints = this.fileInterface.getJunitData();
        if (this.graderSettings.enableParticles) {
            particlesJS.load('particles-js-target', 'assets/json/particlesjs-config.json', function () {
            });
        }
    }

    refreshList() {
        this.submissionList = this.fileInterface.getPreviewSubmissionsList();
        this.assignSubmissionListCopy();
        this.notRunSubmissionList = this.submissionList.filter(
            submission => !submission.agentRun
        );
        this.numDoneSubmissions = this.submissionList.filter(
            submission => submission.done
        ).length;
        if (this.graderConfig.gradingStyle === 'tests') {
            this.numTestRunSubmissions = 0;
            this.testResultsMap = {};
            this.submissionList.forEach(submission => {
                if (submission.testData) {
                    this.numTestRunSubmissions++;
                    Object.keys(submission.testData).forEach(testName => {
                        if (!this.testResultsMap[testName]) {
                            this.testResultsMap[testName] = {
                                successes: 0,
                                failures: 0
                            }
                        }
                        if (submission.testData[testName] === 'success') {
                            this.testResultsMap[testName].successes++;
                        } else {
                            this.testResultsMap[testName].failures++;
                        }
                    });
                }
            });
            this.sortTestNameList('nameAsc');
        }
        this.generatePointStats();
    }

    generatePointStats() {
        this.finalScoreAverage = 0;
        this.mainRubricItemAverage = 0;
        this.optionalRubricItemAverage = 0;
        this.pointAdjustmentAverage = 0;

        this.doneFinalScoreAverage = 0;
        this.doneMainRubricItemAverage = 0;
        this.doneOptionalRubricItemAverage = 0;
        this.donePointAdjustmentAverage = 0;

        this.submissionList.forEach(submission => {
            this.finalScoreAverage += submission.finalScore;
            this.mainRubricItemAverage += submission.appliedRubricItemPoints;
            this.optionalRubricItemAverage += submission.optionalRubricItemPoints;
            this.pointAdjustmentAverage += submission.pointAdjustmentItemPoints;

            if (submission.done) {
                this.doneFinalScoreAverage += submission.finalScore;
                this.doneMainRubricItemAverage += submission.appliedRubricItemPoints;
                this.doneOptionalRubricItemAverage += submission.optionalRubricItemPoints;
                this.donePointAdjustmentAverage += submission.pointAdjustmentItemPoints;
            }
        });

        this.finalScoreAverage = this.finalScoreAverage / this.submissionList.length;
        this.mainRubricItemAverage = this.mainRubricItemAverage / this.submissionList.length;
        this.optionalRubricItemAverage = this.optionalRubricItemAverage / this.submissionList.length;
        this.pointAdjustmentAverage = this.pointAdjustmentAverage / this.submissionList.length;

        this.doneFinalScoreAverage = this.doneFinalScoreAverage / (this.numDoneSubmissions || 1);
        this.doneMainRubricItemAverage = this.doneMainRubricItemAverage / (this.numDoneSubmissions || 1);
        this.doneOptionalRubricItemAverage = this.doneOptionalRubricItemAverage / (this.numDoneSubmissions || 1);
        this.donePointAdjustmentAverage = this.donePointAdjustmentAverage / (this.numDoneSubmissions || 1);
    }

    sortTestNameList(comparatorName: string) {
        const component = this;
        const testNames = Object.keys(this.testResultsMap);
        if (comparatorName === 'nameAsc') {
            testNames.sort(function (a, b) {
                return a.localeCompare(b);
            });
        } else if (comparatorName === 'nameDesc') {
            testNames.sort(function (a, b) {
                return b.localeCompare(a);
            })
        } else if (comparatorName === 'successRateAsc') {
            testNames.sort(function (a, b) {
                return component.testResultsMap[a].successes - component.testResultsMap[b].successes;
            })
        } else if (comparatorName === 'successRateDesc') {
            testNames.sort(function (a, b) {
                return component.testResultsMap[b].successes - component.testResultsMap[a].successes;
            })
        }
        this.sortedTestStatList = testNames;
    }

    ngAfterViewInit() {
        if (this.targetSubmission) {
            this.gradeSubmission(this.targetSubmission);
        }
    }

    runAgentForAllNotRunSubmissions() {
        const component: HomeComponent = this;
        component.testStatsPanelOpened = false;
        const dialogRef = this.dialog.open(RunAgentConfirmationDialogComponent, {
            data: {
                'title': 'Run code for ' + component.notRunSubmissionList.length + (component.notRunSubmissionList.length === 1 ? ' submission' : ' submissions'),
                'info': 'This will run code for ' + (component.notRunSubmissionList.length === 1 ? 'the unprocessed submission' : ('each of the ' + component.notRunSubmissionList.length + ' unprocessed submissions')) + ', so the code doesn\'t have to be run when opening ' + (component.notRunSubmissionList.length === 1 ? 'the ' : 'each ') + 'submission for the first time. This may take some time, depending on how long your ' + (this.graderConfig.gradingStyle === 'tests' ? 'test' : 'main') + ' class takes to run.',
                'warningInfo': 'WARNING: Exiting the grader while a directory is being processed may corrupt the directory',
                'cancelText': 'Cancel',
                'acceptText': 'Run code for ' + component.notRunSubmissionList.length + (component.notRunSubmissionList.length === 1 ? ' submission' : ' submissions')
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                component.isCurrentlyRunningSubmissions = true;
                component.currentlyRunningSubmissionIndex = 0;
                component.runAgentFromIndex(component.notRunSubmissionList, 0, component);
            }
        });
    }

    runAgentFromIndex(submissionList: Array<any>, index: number, component: HomeComponent) {
        component.currentlyRunningSubmissionIndex = index;
        if (index >= submissionList.length) {
            setTimeout(() => {
                component.refreshList();
                component.isCurrentlyRunningSubmissions = false;
            }, 250); // wait a second before doing this so loading bar can animate to completion
        } else {
            const submission = submissionList[index];
            const allSubmissionsDirectory = mainProcess.join(this.initializeDirectoryService.graderBaseDirectory, this.directoryConfigService.GRADER_SUBMISSIONS);
            const fullDirectoryName = mainProcess.join(allSubmissionsDirectory, submission.directoryName);
            const mustProcessMarker = mainProcess.join(fullDirectoryName, this.directoryConfigService.NO_AGENT_RUN_MARKER);
            const graderDataFilePath = mainProcess.join(fullDirectoryName, this.directoryConfigService.GRADER_DATA_FILE_NAME);
            let submissionGraderData = JSON.parse(mainProcess.readFile(graderDataFilePath));
            if (!submission.missingSubmissionFiles) {
                setTimeout(() => {
                    component.agentRunnerService.runAgent(this.initializeDirectoryService.graderBaseDirectory, submission.directoryName);
                    mainProcess.deleteFile(mustProcessMarker);
                    component.runAgentFromIndex(submissionList, index + 1, component);
                }, 1000);
            } else {
                submissionGraderData = component.optionalItemPreprocessorService.applyHintKeyOptionalItems(submissionGraderData, component.graderConfig);
                mainProcess.deleteFile(mustProcessMarker);
                mainProcess.writeToFile(graderDataFilePath, JSON.stringify(submissionGraderData));
                component.runAgentFromIndex(submissionList, index + 1, component);
            }
        }
    }

    public gradeSubmission(directory) {
        this.router.navigate(['open-submission', directory]);
    }

    public selectSubmission() {
        this.router.navigate(['']);
    }

    public updateTests() {
        this.router.navigate(['patch-tests']);
    }

    public exportGrades() {
        this.router.navigate(['export-grades']);
    }

    assignSubmissionListCopy() {
        this.filteredSubmissionList = Object.assign([], this.submissionList);
    }

    filterItem(value) {
        if (!value) {
            this.assignSubmissionListCopy(); // when nothing has been typed
        }
        this.filteredSubmissionList = Object.assign([], this.submissionList).filter(
            item => item.directoryName.toLowerCase().indexOf(value.toLowerCase()) > -1
        )
    }

}
