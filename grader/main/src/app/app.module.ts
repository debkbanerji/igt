import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

// Angular Material Imports
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatSortModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatExpansionModule, MatDialogModule
} from '@angular/material';
import 'hammerjs';


import {AppComponent} from './app.component';
import {SelectSubmissionsComponent} from './select-submissions/select-submissions.component';
import {InitializeDirectoryService} from './providers/initialize-directory.service';
import {DirectoryConfigService} from './providers/directory-config.service';
import {HomeComponent} from './home/home.component';
import {FileInterfaceService} from './providers/file-interface.service';
import {GradeSubmissionComponent} from './grade-submission/grade-submission.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CountTruePipe} from './pipes/count-true.pipe';
import {KeysPipe} from './pipes/keys.pipe';
import {IntellijProjectGeneratorService} from './providers/intellij-project-generator.service';
import {ExportGradesComponent} from './export-grades/export-grades.component';
import {PatchTestsComponent} from './patch-tests/patch-tests.component';
import {CdkTableModule} from "@angular/cdk/table";
import {AgentRunnerService} from "./providers/agent-runner.service";
import {OpenSubmissionComponent} from './open-submission/open-submission.component';
import {GenerateSummaryService} from "./providers/generate-summary.service";
import {OptionalItemCommentBoxComponent} from './optional-item-comment-box/optional-item-comment-box.component';
import {SettingsComponent} from './settings/settings.component';
import {PycharmProjectGeneratorService} from "./providers/pycharm-project-generator.service";
import {RunAgentConfirmationDialogComponent} from "./dialogs/run-agent-confirmation-dialog/run-agent-confirmation-dialog.component";

const routes: Routes = [ // Array of all routes - modify when adding routes
    {path: '', component: SelectSubmissionsComponent}, // Default route
    {path: 'home/:submission', component: HomeComponent},
    {path: 'open-submission/:directory', component: OpenSubmissionComponent},
    {path: 'grade-submission/:directory', component: GradeSubmissionComponent},
    {path: 'export-grades', component: ExportGradesComponent},
    {path: 'patch-tests', component: PatchTestsComponent},
    {path: 'settings', component: SettingsComponent}
];

@NgModule({
    declarations: [
        AppComponent,
        SelectSubmissionsComponent,
        HomeComponent,
        GradeSubmissionComponent,
        CountTruePipe,
        KeysPipe,
        ExportGradesComponent,
        PatchTestsComponent,
        OpenSubmissionComponent,
        OptionalItemCommentBoxComponent,
        SettingsComponent,
        RunAgentConfirmationDialogComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatInputModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatCardModule,
        MatExpansionModule,
        MatChipsModule,
        MatTooltipModule,
        MatToolbarModule,
        MatSidenavModule,
        MatTabsModule,
        MatSlideToggleModule,
        MatCheckboxModule,
        MatSnackBarModule,
        MatInputModule,
        MatTableModule,
        MatSortModule,
        MatSelectModule,
        MatDialogModule,
        CdkTableModule,
        RouterModule.forRoot(routes)
    ],
    entryComponents: [
        RunAgentConfirmationDialogComponent,
    ],
    providers: [InitializeDirectoryService,
        DirectoryConfigService,
        FileInterfaceService,
        IntellijProjectGeneratorService,
        PycharmProjectGeneratorService,
        AgentRunnerService,
        GenerateSummaryService],
    bootstrap: [AppComponent]
})
export class AppModule {
}
