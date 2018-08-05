import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {FileInterfaceService} from '../providers/file-interface.service';
import {Router} from '@angular/router';
import {InitializeDirectoryService} from '../providers/initialize-directory.service';

@Component({
    selector: 'app-patch-tests',
    templateUrl: './patch-tests.component.html',
    styleUrls: ['./patch-tests.component.css']
})
export class PatchTestsComponent implements OnInit {

    public showLoading: boolean;
    public finishedPatching: boolean;
    public loadingText: string;
    public timeText: string;
    public progressBarValue: number;
    public errorText: string;
    public loadingTimestamp: any;

    constructor(private router: Router,
                private fileInterface: FileInterfaceService,
                private initializerService: InitializeDirectoryService,) {
    }

    ngOnInit() {
    }

    public listSubmissions = function () {
        const component = this;
        component.router.navigate(['home', 'none']);
    };

    // public patchTests = function () {
    //     const component = this;
    //     const shouldUpdateTests = component.initializerService.updateTestFile();
    //     if (shouldUpdateTests) {
    //         component.showLoading = true;
    //         component.loadingText = 'Updated Tests File';
    //         component.runAgent();
    //     }
    // };

    // Process the submissions
    processSubmissions() {
        this.showLoading = true;
        const submissions = this.initializerService.getSubmissionsList();
        const component = this;
        component.loadingTimestamp = Date.now();
        setTimeout(component.runTest, 0, submissions, 0, component);
    }

    runTest(submissions, testNumber, component) {
        if (testNumber >= submissions.length) {
            component.showLoading = false;

            const date = new Date(Date.now() - component.loadingTimestamp);
            const m = date.getMinutes();
            const s = date.getSeconds();
            component.timeText = 'Updated ' + submissions.length + ' submissions in ' + m + ' minutes and ' + s + ' seconds.';
            component.finishedPatching = true;
            component.ref.detectChanges();
        } else {
            const submission = submissions[testNumber];
            component.loadingText = 'Updating submission ' + (testNumber + 1) + ' of ' + submissions.length + ': ' + submission;
            component.progressBarValue = (100.0 * testNumber) / submissions.length;
            component.ref.detectChanges();
            component.initializerService.runUpdatedTests(submission);
            const millisecondsToWait = 800;
            setTimeout(function () {
                component.runTest(submissions, testNumber + 1, component);
            }, millisecondsToWait);
        }
    }
}
