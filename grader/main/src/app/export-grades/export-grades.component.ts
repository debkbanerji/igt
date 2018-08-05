import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FileInterfaceService} from '../providers/file-interface.service';
import {MatSnackBar} from '@angular/material';
import {DataSource} from "@angular/cdk/table";
import {merge, Observable, BehaviorSubject} from 'rxjs';
import {map} from 'rxjs/operators'
import {CookieService} from "../providers/cookie.service";

declare let Clipboard: any;
declare let mainProcess: any;
declare let particlesJS: any;

@Component({
    selector: 'app-export-grades',
    templateUrl: './export-grades.component.html',
    styleUrls: ['./export-grades.component.css']
})
export class ExportGradesComponent implements OnInit {

    public totalDoneSubmissions: number;
    public totalNotDoneSubmissions: number;
    public maxPoints: number;
    public doneCSVString: string;
    public allCSVString: string;
    public shouldIncludeNotDone: boolean;
    public graderSettings: any;

    public searchSubmissionsInput: any;
    public submissionsStatData: any;
    public submissionsBehaviorSubject: BehaviorSubject<any[]>;
    public filteredSubmissionsStatData: any;
    public submissionsStatDataSource: SubmissionsDataSource | null;
    public submissionsStatsColumns = ['directoryName', 'points', 'comments'];


    public static getCSVSafeString(data: string) {
        return '"' + data.replace(/"/g, '\'').replace(/[\r\n]/g, ' ') + '"';
    }

    constructor(private router: Router,
                public fileInterface: FileInterfaceService,
                public snackBar: MatSnackBar,
                private cookieService: CookieService) {
        this.router = router;
        const submissionsStatResult = this.fileInterface.getExportableSubmissions();
        this.submissionsStatData = submissionsStatResult.submissionsStats;
        this.totalDoneSubmissions = submissionsStatResult.totalDoneSubmissions;
        this.totalNotDoneSubmissions = submissionsStatResult.totalNotDoneSubmissions;
        this.maxPoints = submissionsStatResult.maxPoints;
        this.graderSettings = cookieService.getGraderSettings();
    }

    ngOnInit() {
        this.filteredSubmissionsStatData = this.submissionsStatData;
        this.submissionsBehaviorSubject = new BehaviorSubject<any[]>(this.filteredSubmissionsStatData);
        this.submissionsStatDataSource = new SubmissionsDataSource(this.submissionsBehaviorSubject);
        this.assignSubmissionsCopy();

        const component = this;
        const clipboard = new Clipboard('.clipboard-btn');
        clipboard.on('success', function (e) {
            component.showMessage('Copied to clipboard', null);
            e.clearSelection();
        });
        clipboard.on('error', function (e) {
            component.showMessage('Could not copy to clipboard', null);
        });
        this.doneCSVString = this.getCSV(false);
        this.allCSVString = this.getCSV(true);
        if (this.graderSettings.enableParticles) {
            particlesJS.load('particles-js-target', 'assets/json/particlesjs-config.json', function () {
            });
        }
    }


    public listSubmissions = function () {
        const component = this;
        component.router.navigate(['home', 'none']);
    };

    public gradeSubmission = function (directory) {
        const component = this;
        component.router.navigate(['grade-submission', directory]);
    };

    assignSubmissionsCopy() {
        this.filteredSubmissionsStatData = Object.assign([], this.submissionsStatData);
    }

    filterSubmissionsItem(value) {
        if (!value) {
            this.assignSubmissionsCopy(); // when nothing has been typed
        }
        this.filteredSubmissionsStatData = Object.assign([], this.submissionsStatData).filter(
            item => (item.directoryName).toLowerCase().indexOf(value.toLowerCase()) > -1
        );
        this.submissionsBehaviorSubject.next(this.filteredSubmissionsStatData);
    }

    private showMessage(message: string, timeout) {
        this.snackBar.open(message, null, {
            duration: timeout || 1500
        });
    }

    public getCSV(includeeNotDone: boolean) {
        const rowSet = [];
        const headers = [];
        headers.push('Directory');
        headers.push('Points');
        headers.push('Comments');
        rowSet.push(headers.join());
        for (let i = 0; i < this.submissionsStatData.length; i++) {
            const submission = this.submissionsStatData[i];
            const directory = submission.directoryName;
            if (submission.done) {
                const row = [];
                row.push(ExportGradesComponent.getCSVSafeString(directory));
                row.push(submission.points);
                row.push(ExportGradesComponent.getCSVSafeString(submission.comments));
                rowSet.push(row.join());
            } else if (includeeNotDone) {
                const row = [];
                row.push(ExportGradesComponent.getCSVSafeString(directory));
                row.push(ExportGradesComponent.getCSVSafeString('Not Graded Yet'));
                row.push(ExportGradesComponent.getCSVSafeString('Not Graded Yet'));
                rowSet.push(row.join());
            }
        }
        return rowSet.join('\n');
    }

    public exportDoneSubmissionsCSV = function () {
        const component = this;
        const exportLocation = component.getFileSaveLocation();
        if (exportLocation) {
            const writeResult = mainProcess.writeToFile(exportLocation,
                (component.shouldIncludeNotDone ? component.allCSVString : component.doneCSVString));
            if (writeResult) {
                component.showMessage('Successfully saved grades to ' + exportLocation, null);
            } else {
                component.showMessage('Could not write to ' + exportLocation, null);
            }
        }
    };

    public getFileSaveLocation = function () {
        const component = this;
        const defaultOutputPath = mainProcess.join(component.fileInterface.getTargetDirectory(), 'grades.csv');
        return mainProcess.getOutputFilePath(defaultOutputPath);
    };
}

export class SubmissionsDataSource extends DataSource<any> {

    constructor(private behaviorSubject: BehaviorSubject<any[]>) {
        super();
    }


    connect(): Observable<any[]> {
        const displayDataChanges = [
            this.behaviorSubject,
        ];

        return merge(...displayDataChanges).pipe(map(() => {
            return this.behaviorSubject.getValue();
        }));
    }

    disconnect() {
    }
}
