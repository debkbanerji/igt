import {Component, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {CookieService} from "../../providers/cookie.service";

@Component({
    selector: 'app-confirmation-solution-dialog',
    templateUrl: './run-agent-confirmation-dialog.component.html'
})
export class RunAgentConfirmationDialogComponent {

    public graderSettings: any;

    constructor(
        public dialogRef: MatDialogRef<RunAgentConfirmationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        cookieService: CookieService) {
        this.graderSettings = cookieService.getGraderSettings();
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
