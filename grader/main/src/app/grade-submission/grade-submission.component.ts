import {FileInterfaceService} from '../providers/file-interface.service';
import {Subscription} from "rxjs/internal/Subscription";
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators'
import {AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {MatSnackBar} from "@angular/material";
import {FormControl, FormGroup} from "@angular/forms";
import {GenerateSummaryService} from "../providers/generate-summary.service";
import {CookieService} from "../providers/cookie.service";

declare let Prism: any;
declare let Mark: any;
declare let Clipboard: any;
declare let mainProcess: any;
declare let particlesJS: any;

@Component({
    selector: 'app-grade-submission',
    templateUrl: './grade-submission.component.html',
    styleUrls: ['./grade-submission.component.css']
})
export class GradeSubmissionComponent implements OnInit, OnDestroy, AfterViewInit {

    private paramSubscription: Subscription;
    public directoryName: string;
    public graderData: any;

    public supportFiles: any;
    public testsFile: any;
    public submittedFiles: any;
    public activeFile: string;

    public compiledLanguage: boolean = false;
    public successfulCompile: boolean;

    public compilerOutput: string = null;
    public testOutput: string = null;
    public printedOutput: string = null;
    public errorOutput: string = null;
    public failureStacktraces: string = null;
    public checkstyleOutput: string = null;

    public graderConfig: any;

    public isFirstSubmission: boolean;
    public isLastSubmission: boolean;

    public autocompleteData: any;
    public additionalCommentGroup = new FormGroup({
        comment: new FormControl()
    });
    public rubricItemGroup = new FormGroup({
        comment: new FormControl()
    });
    public pointAdjustmentGroup = new FormGroup({
        comment: new FormControl(),
        points: new FormControl()
    });
    public filteredAdditionalCommentOptions: Observable<string[]>;
    public filteredRubricCommentOptions: Observable<string[]>;
    public filteredPointAdjustmentOptions: Observable<string[]>;

    public toApplyIndices: Array<number>;

    public totalAppliedRubricItemPoints: number = 0;
    public totalOptionalRubricItemPoints: number = 0;
    public totalPointAdjustmentPoints: number = 0;
    public finalScore: number = 0;
    public graderSummary: string = '';

    public optionalRubricItemRegexPreviewData = {};

    public searchMarkInstance: any;
    public searchMarks: any;
    public searchMarkIndex: any;
    public searchText = '';
    public searchForRegex = false;
    public matchedFile: any;
    public matchesText: string;

    public SEARCH_TAG = 'search-result';
    public INVALID_REGEX_TEXT = 'Invalid regex';

    public showUnresolvedTestMetadata: boolean = true;

    // Optional Tsquare timestamp data
    public submittedTimestamp: Date;
    public deadlineTimestamp: Date;

    public IDEProjectPath: string;
    public IDEScript: string;
    public Math = Math;

    public graderSettings: any; // settings that persist between different assignments

    private ALREADY_DONE_MESSAGE = 'Mark as not done to edit submission';

    constructor(private router: Router,
                public fileInterface: FileInterfaceService,
                private route: ActivatedRoute,
                public snackBar: MatSnackBar,
                private chRef: ChangeDetectorRef,
                private cookieService: CookieService,
                private generateSummaryService: GenerateSummaryService) {
    }

    ngOnInit() {
        const component = this;
        component.graderSettings = component.cookieService.getGraderSettings();
        this.paramSubscription = this.route.params.subscribe(params => {
            this.directoryName = params.directory;
            this.graderConfig = this.fileInterface.getGraderConfig();
            this.graderData = this.fileInterface.getGraderData(this.directoryName);
            this.autocompleteData = this.fileInterface.getAutocompleteData();
            if (this.graderConfig.gradingStyle === 'tests') {
                if (this.graderConfig.language === 'java8' || this.graderConfig.language === 'java10') {
                    this.testsFile = this.fileInterface.getJavaTestsFile();
                } else if (this.graderConfig.language === 'python3') {
                    this.testsFile = this.fileInterface.getPythonTestsFile();
                }
            }
            this.supportFiles = this.fileInterface.getSupportFiles().filter(file => {
                return !this.testsFile || (file.name !== this.testsFile.name)
            });
            this.submittedFiles = this.fileInterface.getSubmittedFiles(this.directoryName);
            if (this.submittedFiles.length > 0) {
                this.activeFile = this.submittedFiles[0].name;
            }
            this.compiledLanguage = (this.graderConfig.language === 'java8' || this.graderConfig.language === 'java10');
            if (this.compiledLanguage) {
                if (this.graderData.compile) {
                    if (this.graderData.checkstyle) {
                        this.checkstyleOutput = this.graderData.checkstyle.output || '';
                    }
                    this.compilerOutput = this.graderData.compile.output || '';
                    this.successfulCompile = this.graderData.compile.success;
                    if (this.successfulCompile) {
                        if (this.graderConfig.gradingStyle === 'tests') {
                            this.testOutput = this.graderData.testOutput;
                        } else if (this.graderConfig.gradingStyle === 'output') {
                            this.printedOutput = this.graderData.printedOutput || '';
                        }
                    } else {
                        if (this.graderConfig.gradingStyle === 'tests') {
                            this.testOutput = 'No tests run as submission did not compile';
                        }
                    }
                } else {
                    this.compilerOutput = 'Unable to compile due to one or more missing submission files';
                }
            } else if (this.graderConfig.language === 'python3') {
                if (this.graderData.errorOutput) {
                    this.errorOutput = this.graderData.errorOutput || '';
                }
                if (this.graderConfig.gradingStyle === 'tests') {
                    this.failureStacktraces = this.graderData.failureOutput || '';
                }
                this.printedOutput = this.graderData.printedOutput || '';
                if (this.printedOutput && this.printedOutput.length === 1) {
                    this.printedOutput = this.printedOutput[0];
                }
                if (this.failureStacktraces && this.failureStacktraces.length === 1) {
                    this.failureStacktraces = this.failureStacktraces[0];
                }
            }
            this.isFirstSubmission = this.fileInterface.isFirstSubmission(this.directoryName);
            this.isLastSubmission = this.fileInterface.isLastSubmission(this.directoryName);

            this.toApplyIndices = [];

            this.searchMarkIndex = -1;
            this.matchesText = '';

            this.filteredAdditionalCommentOptions = this.additionalCommentGroup.controls['comment'].valueChanges
                .pipe(
                    startWith(''),
                    map(val => val ? this.filterAdditionalCommentTexts(val.toString()) : this.autocompleteData.additionalCommentTexts.slice())
                );

            this.filteredRubricCommentOptions = this.rubricItemGroup.controls['comment'].valueChanges
                .pipe(
                    startWith(''),
                    map(val => val ? this.filterRubricCommentTexts(val.toString()) : this.autocompleteData.rubricItemTexts.slice())
                );

            this.filteredPointAdjustmentOptions = this.pointAdjustmentGroup.controls['comment'].valueChanges
                .pipe(
                    startWith(''),
                    map(val => val ? this.filterPointAdjustmentCommentTexts(val.toString()) : this.autocompleteData.pointAdjustmentTexts.slice())
                );

            this.saveChanges(); // To generate summary

            const clipboard = new Clipboard('.clipboard-btn');
            clipboard.on('success', function (e) {
                component.showMessage('Copied to clipboard', null);
                e.clearSelection();
            });
            clipboard.on('error', function (e) {
                console.log('Clipboard error: ' + e.toString());
                component.showMessage('Could not copy to clipboard', null);
            });

            this.IDEProjectPath = this.fileInterface.getIDEProjectPath(this.directoryName);
            if (this.graderConfig.language === 'java8' || this.graderConfig.language === 'java10') {
                this.IDEScript = this.graderSettings.intellijScript;
            } else if (this.graderConfig.language === 'python3') {
                this.IDEScript = this.graderSettings.pycharmScript;
            }

            if (this.graderData.submissionStyle === 'tsquare') {
                if (this.graderData.timestamp && this.graderConfig.dueTimestamp_UTC_YYYYMMDDHHmmssmmm) {
                    const submissionString = String(this.graderData.timestamp);
                    this.submittedTimestamp = new Date(
                        Number(submissionString.slice(0, 4)),
                        Number(submissionString.slice(4, 6)) - 1,
                        Number(submissionString.slice(6, 8)),
                        Number(submissionString.slice(8, 10)),
                        Number(submissionString.slice(10, 12)),
                        Number(submissionString.slice(12, 14)),
                        Number(submissionString.slice(14, 17))
                    );
                    this.submittedTimestamp.setTime(this.submittedTimestamp.getTime() -
                        this.submittedTimestamp.getTimezoneOffset() * 60 * 1000);
                    const deadlineString = String(this.graderConfig.dueTimestamp_UTC_YYYYMMDDHHmmssmmm);
                    this.deadlineTimestamp = new Date(
                        Number(deadlineString.slice(0, 4)),
                        Number(deadlineString.slice(4, 6)) - 1,
                        Number(deadlineString.slice(6, 8)),
                        Number(deadlineString.slice(8, 10)),
                        Number(deadlineString.slice(10, 12)),
                        Number(deadlineString.slice(12, 14)),
                        Number(deadlineString.slice(14, 17))
                    );
                    this.deadlineTimestamp.setTime(this.deadlineTimestamp.getTime() - this.deadlineTimestamp.getTimezoneOffset() * 60 * 1000)
                }
            }

            component.initializeRegexes();
        });

        if (component.graderSettings.enableParticles) {
            particlesJS.load('particles-js-target', 'assets/json/particlesjs-config.json', function () {
            });
        }
    }

    ngOnDestroy(): void {
        this.paramSubscription.unsubscribe()
    }


    ngAfterViewInit(): void {
        // Run Prism syntax highlighting on the current page
        Prism.highlightAll();
    }

    filterAdditionalCommentTexts(val: string): string[] {
        return this.autocompleteData.additionalCommentTexts.filter(option => new RegExp(`^${val}`, 'gi').test(option));
    }

    filterRubricCommentTexts(val: string): string[] {
        return this.autocompleteData.rubricItemTexts.filter(option => new RegExp(`^${val}`, 'gi').test(option));
    }

    filterPointAdjustmentCommentTexts(val: string): string[] {
        return this.autocompleteData.pointAdjustmentTexts.filter(option => new RegExp(`^${val}`, 'gi').test(option));
    }

    toggleSelectUnresolvedRubricItemforApplying(event, index: number) {
        if (event.checked) {
            this.toApplyIndices.push(index);
        } else {
            this.toApplyIndices = this.removeItem(this.toApplyIndices, index);
        }
    }

    skipUnresolvedRubricItem(index) {
        if (this.graderData.done) {
            this.showMessage(this.ALREADY_DONE_MESSAGE, null);
        } else {
            this.graderData.skippedRubricItems.unshift(this.graderData.unresolvedRubricItems[index]);
            this.removeAtIndex(this.graderData.unresolvedRubricItems, index);
            this.saveChanges();
        }
    }

    unresolveIgnoredRubricItem(index) {
        if (this.graderData.done) {
            this.showMessage(this.ALREADY_DONE_MESSAGE, null);
        } else {
            this.graderData.unresolvedRubricItems.push(this.graderData.skippedRubricItems[index]);
            this.removeAtIndex(this.graderData.skippedRubricItems, index);
            this.saveChanges();
        }
    }

    applyRubricItems() {
        const component = this;
        if (component.graderData.done) {
            this.showMessage(this.ALREADY_DONE_MESSAGE, null);
        } else {
            const comment = component.rubricItemGroup.value.comment || '';
            if (comment && comment !== '' && component.toApplyIndices.length > 0) {
                component.rubricItemGroup.reset();
                if (!component.contains(component.autocompleteData.rubricItemTexts, comment)) {
                    component.autocompleteData.rubricItemTexts.push(comment);
                }
                const appliedItem = {
                    points: 0,
                    comment: comment,
                    items: []
                };
                component.toApplyIndices.forEach(function (index) {
                    const item = component.graderData.unresolvedRubricItems[index];
                    appliedItem.items.push(item);
                    appliedItem.points += item.points;
                });
                component.graderData.unresolvedRubricItems = component.removeIndices(
                    component.graderData.unresolvedRubricItems,
                    component.toApplyIndices);
                component.graderData.appliedRubricItems.push(appliedItem);
                component.toApplyIndices = [];
                component.saveChanges();
            }
        }
    }

    moveAppliedUp(i: number) {
        const component = this;
        if (component.graderData.done) {
            this.showMessage(this.ALREADY_DONE_MESSAGE, null);
        } else {
            component.switchElements(component.graderData.appliedRubricItems, i, i - 1);
            component.saveChanges();
        }
    }

    moveAppliedDown(i: number) {
        const component = this;
        if (component.graderData.done) {
            this.showMessage(this.ALREADY_DONE_MESSAGE, null);
        } else {
            component.switchElements(component.graderData.appliedRubricItems, i, i + 1);
            component.saveChanges();
        }
    }

    unapply(i: number) {
        const component = this;
        if (component.graderData.done) {
            this.showMessage(this.ALREADY_DONE_MESSAGE, null);
        } else {
            const item = component.graderData.appliedRubricItems[i];
            item.items.forEach(function (item) {
                component.graderData.unresolvedRubricItems.push(item);
            });
            component.removeAtIndex(component.graderData.appliedRubricItems, i);
            component.saveChanges();
        }
    }

    toggleOptionalRubricItem(event: any, i: number) {
        const item = this.graderData.optionalRubricItems[i];
        if (event.checked) {
            item.numApplications = 1;
        } else {
            item.numApplications = 0;
        }
        this.saveChanges();
    }

    setOptionalRubricItemCount(event: any, i: number) {
        let item = this.graderData.optionalRubricItems[i];
        let value = event.target.valueAsNumber;
        if (value < 0) {
            value = 0;
        } else if (value > item.maxApplications) {
            value = item.maxApplications;
        }
        item.numApplications = value;
        this.saveChanges();
    }

    addPointAdjustmentItem() {
        const component = this;
        if (component.graderData.done) {
            this.showMessage(this.ALREADY_DONE_MESSAGE, null);
        } else {
            const comment = component.pointAdjustmentGroup.value.comment || '';
            const points = component.pointAdjustmentGroup.value.points;
            if (comment !== '' && points) {
                component.pointAdjustmentGroup.reset();
                component.graderData.pointAdjustmentItems.push({
                    comment: comment,
                    points: points
                });
                if (!component.contains(component.autocompleteData.pointAdjustmentTexts, comment)) {
                    component.autocompleteData.pointAdjustmentTexts.push(comment);
                }
                component.saveChanges();
            }
        }
    };

    public movePointAdjustmentItemUp = function (i) {
        const component = this;
        if (component.graderData.done) {
            component.showMessage(component.ALREADY_DONE_MESSAGE, null);
        } else {
            component.switchElements(component.graderData.pointAdjustmentItems, i, i - 1);
            component.saveChanges();
        }
    };

    public movePointAdjustmentItemDown = function (i) {
        const component = this;
        if (component.graderData.done) {
            component.showMessage(component.ALREADY_DONE_MESSAGE, null);
        } else {
            component.switchElements(component.graderData.pointAdjustmentItems, i, i + 1);
            component.saveChanges();
        }
    };

    public removePointAdjustmentItem = function (i) {
        const component = this;
        if (component.graderData.done) {
            component.showMessage(component.ALREADY_DONE_MESSAGE, null);
        } else {
            component.graderData.pointAdjustmentItems.splice(i, 1);
            component.saveChanges();
        }
    };

    addAdditionalComment() {
        const component = this;
        if (component.graderData.done) {
            this.showMessage(this.ALREADY_DONE_MESSAGE, null);
        } else {
            const comment = component.additionalCommentGroup.value.comment || '';
            if (comment && comment !== '') {
                component.additionalCommentGroup.reset();
                if (!component.contains(component.graderData.comments, comment)) {
                    component.graderData.comments.push(comment);
                }
                if (!component.contains(component.autocompleteData.additionalCommentTexts, comment)) {
                    component.autocompleteData.additionalCommentTexts.push(comment);
                }
                component.saveChanges();
            }
        }
    };

    public moveAdditionalCommentUp = function (i) {
        const component = this;
        if (component.graderData.done) {
            component.showMessage(component.ALREADY_DONE_MESSAGE, null);
        } else {
            component.switchElements(component.graderData.comments, i, i - 1);
            component.saveChanges();
        }
    };

    public moveAdditionalCommentDown = function (i) {
        const component = this;
        if (component.graderData.done) {
            component.showMessage(component.ALREADY_DONE_MESSAGE, null);
        } else {
            component.switchElements(component.graderData.comments, i, i + 1);
            component.saveChanges();
        }
    };

    public removeAdditionalComment = function (i) {
        const component = this;
        if (component.graderData.done) {
            component.showMessage(component.ALREADY_DONE_MESSAGE, null);
        } else {
            component.graderData.comments.splice(i, 1);
            component.saveChanges();
        }
    };

    public addOptionalItemComment = function (comment: string, item: any) {
        const component = this;
        if (component.graderData.done) {
            component.showMessage(component.ALREADY_DONE_MESSAGE, null);
        } else {
            if (!component.contains(item.comments, comment)) {
                if (!component.contains(item.comments, comment)) {
                    item.comments.push(comment);
                }
                if (!component.contains(component.autocompleteData.optionalRubricItemTexts, comment)) {
                    component.autocompleteData.optionalRubricItemTexts.push(comment);
                }
                component.saveChanges();
            }
        }
    };

    public moveOptionalItemCommentUp = function (item, i) {
        const component = this;
        if (component.graderData.done) {
            component.showMessage(component.ALREADY_DONE_MESSAGE, null);
        } else {
            component.switchElements(item.comments, i, i - 1);
            component.saveChanges();
        }
    };

    public moveOptionalItemCommentDown = function (item, i) {
        const component = this;
        if (component.graderData.done) {
            component.showMessage(component.ALREADY_DONE_MESSAGE, null);
        } else {
            component.switchElements(item.comments, i, i + 1);
            component.saveChanges();
        }
    };

    public removeOptionalItemComment = function (item, i) {
        const component = this;
        if (component.graderData.done) {
            component.showMessage(component.ALREADY_DONE_MESSAGE, null);
        } else {
            item.comments.splice(i, 1);
            component.saveChanges();
        }
    };

    public onOptionalItemPanelExpansionStateChanged = function (item, panelExpanded: boolean) {
        const component = this;
        item.panelExpanded = panelExpanded;
        component.saveChanges();
    };

    searchForText = function () {
        const component = this;
        if (component.searchText && component.searchText !== '') {
            component.clearSearchForText();
            const context = document.querySelector('.searchable');
            component.searchMarkInstance = new Mark(context);
            if (component.searchForRegex) {
                try {
                    const regex = RegExp(component.searchText, 'i');
                    component.searchMarkInstance.markRegExp(regex, {'element': component.SEARCH_TAG});
                } catch (e) {
                    component.matchesText = component.INVALID_REGEX_TEXT;
                }
            } else {
                component.searchMarkInstance.mark(component.searchText, {'element': component.SEARCH_TAG});
            }
            let searchTag: any;
            searchTag = component.SEARCH_TAG;
            component.searchMarks = Array.from(document.getElementsByTagName(searchTag));
            component.searchMarks.forEach((mark) => {
                mark.style['color'] = 'blue';
            });
            if (component.searchMarks.length > 0) {
                component.searchMarkIndex = 0;
                component.selectElementText(component.searchMarks[0], window);
                component.searchMarks[0].scrollIntoView();
            }
            if (component.matchesText !== component.INVALID_REGEX_TEXT) {
                if (component.searchMarks.length === 0) {
                    component.matchesText = 'No Matches';
                } else {
                    component.matchesText = 'Match 1 of ' + component.searchMarks.length;
                }
            }
            component.matchedFile = component.activeFile;
        }
    };

    public clearSearchForText = function () {
        const component = this;
        if (component.searchMarkInstance) {
            component.searchMarkInstance.unmark();
            component.searchMarkInstance = null;
            component.matchesText = '';
            component.searchMarkIndex = -1;
            component.searchMarks = [];
        }
    };

    public goToNextMatch = function () {
        const component = this;
        component.viewFile(component.matchedFile);
        component.searchMarkIndex = (component.searchMarkIndex + 1) % component.searchMarks.length;
        const toScroll = component.searchMarks[component.searchMarkIndex];
        component.selectElementText(toScroll, window);
        toScroll.scrollIntoView();
        component.matchesText = 'Match ' + (component.searchMarkIndex + 1) + ' of ' + component.searchMarks.length;
    };

    public goToPreviousMatch = function () {
        const component = this;
        component.viewFile(component.matchedFile);
        component.searchMarkIndex = component.searchMarkIndex <= 0 ? component.searchMarks.length - 1 : component.searchMarkIndex - 1;
        const toScroll = component.searchMarks[component.searchMarkIndex];
        component.selectElementText(toScroll, window);
        toScroll.scrollIntoView();
        component.matchesText = 'Match ' + (component.searchMarkIndex + 1) + ' of ' + component.searchMarks.length;
    };

    public switchElements = function (arr, i1, i2) {
        const temp = arr[i1];
        arr[i1] = arr[i2];
        arr[i2] = temp;
    };

    public goToLine(lineNumber, file) {
        this.viewFile(file);
        const lineTag = 'jump-to-line';
        lineNumber--;
        const context = document.querySelector('.searchable');
        const lineMarkInstance = new Mark(context);
        lineMarkInstance.markRegExp(/[\n]/gim, {'element': lineTag});
        const marks = document.getElementsByTagName(lineTag);
        if (marks.length > 0) {
            marks[lineNumber].scrollIntoView();
            this.selectElementText(marks[lineNumber], window);
        }
        lineMarkInstance.unmark();
    }

    public viewFile(fileName) {
        this.activeFile = fileName;
        this.chRef.detectChanges();
    }

    openContactLink(link: string) {
        mainProcess.openExternal(link);
    }

    initializeRegexes() {
        const component = this;
        const rubricItems = component.graderData.unresolvedRubricItems;
        rubricItems.forEach(function (item) {
            const goodRegexes = item.goodRegexes || [];
            const badRegexes = item.badRegexes || [];
            const allRegexes = (item.regexes || []).concat(goodRegexes).concat(badRegexes);
            if (allRegexes.length > 0) {
                const regexMatches = {};
                component.submittedFiles.forEach(function (file) {
                    const fileRegexMatches = [];
                    const lines = file.contents.split(/[\n]/gim);
                    lines.forEach(function (line, index) {
                        let match = null;
                        allRegexes.forEach(function (regex) {
                            try {
                                const compiledRegex = RegExp(regex, 'i');
                                if (compiledRegex.test(line)) {
                                    let type = 'neutral';
                                    if (component.contains(goodRegexes, regex)) {
                                        type = 'good';
                                    }
                                    if (component.contains(badRegexes, regex)) {
                                        type = 'bad';
                                    }
                                    match = {
                                        lineNumber: index + 1,
                                        line: line,
                                        type: type
                                    };
                                }
                            } catch (e) {
                                console.error('Could not compile regex ' + regex + ': ' + e.toString())
                            }
                        });
                        if (match) {
                            fileRegexMatches.push(match);
                        }
                    });
                    if (fileRegexMatches.length > 0) {
                        regexMatches[file.name] = fileRegexMatches;
                    }
                });
                if (Object.keys(regexMatches).length > 0) {
                    item.regexMatches = regexMatches;
                }
            }
        });

        const optionalRubricItems = component.graderData.optionalRubricItems;
        optionalRubricItems.forEach(function (item) {
            const goodRegexes = item.goodRegexes || [];
            const badRegexes = item.badRegexes || [];
            const allRegexes = (item.regexes || []).concat(goodRegexes).concat(badRegexes);
            if (allRegexes.length > 0) {
                const regexMatches = {};
                component.submittedFiles.forEach(function (file) {
                    const fileRegexMatches = [];
                    const lines = file.contents.split(/[\n]/gim);
                    lines.forEach(function (line, index) {
                        let match = null;
                        allRegexes.forEach(function (regex) {
                            try {
                                const compiledRegex = RegExp(regex, 'i');
                                if (compiledRegex.test(line)) {
                                    let type = 'neutral';
                                    if (component.contains(goodRegexes, regex)) {
                                        type = 'good';
                                    }
                                    if (component.contains(badRegexes, regex)) {
                                        type = 'bad';
                                    }
                                    match = {
                                        lineNumber: index + 1,
                                        line: line,
                                        type: type
                                    };
                                }
                            } catch (e) {
                                console.error('Could not compile regex ' + regex + ': ' + e.toString())
                            }
                        });
                        if (match) {
                            fileRegexMatches.push(match);
                        }
                    });
                    if (fileRegexMatches.length > 0) {
                        regexMatches[file.name] = fileRegexMatches;
                    }
                });
                if (Object.keys(regexMatches).length > 0) {
                    item.regexMatches = regexMatches;
                }
            }
        });

        this.graderData.optionalRubricItems.forEach((item, index) => {
            this.optionalRubricItemRegexPreviewData[index] = {
                good: 0,
                bad: 0,
                neutral: 0
            };
            if (item.regexMatches) {
                Object.keys(item.regexMatches).forEach(file => {
                    if (item.regexMatches[file]) {
                        item.regexMatches[file].forEach(match => {
                            this.optionalRubricItemRegexPreviewData[index][match.type]++;
                        })
                    }
                });
            }
        });

        this.saveChanges();
    }

    public goToPreviousSubmission() {
        this.router.navigate(['open-submission', this.fileInterface.getPreviousSubmission(this.directoryName)]);
    }

    public goToNextSubmission() {
        this.router.navigate(['open-submission', this.fileInterface.getNextSubmission(this.directoryName)])
    }

    public goToNextUngradedSubmission() {
        const nextUngradedSubmission = this.fileInterface.getNextUngradedSubmission(this.directoryName);
        if (nextUngradedSubmission) {
            if (nextUngradedSubmission === this.directoryName) {
                this.showMessage('This is the last ungraded submission', null);
            } else {
                this.router.navigate(['open-submission', nextUngradedSubmission]);
            }
        } else {
            this.goHome();
        }
    }

    public setDoneStatus(status) {
        if (status && this.graderData.unresolvedRubricItems.length > 0) {
            this.showMessage('Please resolve all main rubric items before marking as done', 3000);
        } else {
            this.graderData.done = status;
            this.graderData.graderName = this.graderConfig.graderName;
            this.saveChanges();
        }
    }

    public saveChanges() {
        try {
            this.graderData.lastGradedTime = new Date().getTime();
            this.totalAppliedRubricItemPoints = this.generateSummaryService.getAppliedRubricItemPoints(this.graderData);
            this.totalOptionalRubricItemPoints = this.generateSummaryService.getOptionalRubricItemPoints(this.graderData);
            this.totalPointAdjustmentPoints = this.generateSummaryService.getPointAdjustmentItemPoints(this.graderData);
            this.graderSummary = this.generateSummaryService.generateSummary(this.graderData, this.graderConfig, this.graderSettings.graderName);
            this.finalScore = this.generateSummaryService.getFinalScore(this.graderData, this.graderConfig);
            this.fileInterface.writeGraderData(this.directoryName, this.graderData);
            this.fileInterface.writeAutocompleteData(this.autocompleteData);
        } catch (err) {
            this.showMessage('Unable to save changes: ' + err.message, null);
        }
    }

    private showMessage(message: string, timeout) {
        this.snackBar.open(message, null, {
            duration: timeout || 1500
        });
    }

    public goHome() {
        this.router.navigate(['home', 'none']);
    }

    public viewStatistics() {
        this.router.navigate(['view-statistics']);
    }

    selectElementText = function (el, win) {
        win = win || window;
        const doc = win.document;
        let sel: any;
        let range: any;
        if (win.getSelection && doc.createRange) {
            sel = win.getSelection();
            range = doc.createRange();
            range.selectNodeContents(el);
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (doc.body.createTextRange) {
            range = doc.body.createTextRange();
            range.moveToElementText(el);
            range.select();
        }
    };

    public populateErrorComment = function (exception) {
        const errorPlaceholder = 'Expected ' + exception + ' when ';
        const applyCommentTextarea: any = document.getElementById('apply-comment');
        applyCommentTextarea.value = errorPlaceholder;
    };

    public contains(arr, val) {
        return arr.indexOf(val) > -1;
    }

    public deepEquals(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    }

    public removeItem(arr, item) {
        return this.removeAtIndex(arr, arr.indexOf(item));
    }

    public removeAtIndex(arr, index) {
        arr.splice(index, 1);
        return arr
    }

    public removeIndices(arr, indexArr) {
        const sortedIndexArray = indexArr.sort(function (a, b) {
            return a - b;
        });
        for (let i = sortedIndexArray.length - 1; i >= 0; i--) {
            arr = this.removeAtIndex(arr, sortedIndexArray[i]);
        }
        return arr;
    }

    public generateIDEProject = function () {
        const component = this;
        component.IDEProjectPath = component.fileInterface.generateIDEProject(component.directoryName);
    };

    public openIDEProject = function () {
        const component = this;
        let IDEScriptPath;
        if (component.graderConfig.language === 'java8' || component.graderConfig.language === 'java10') {
            IDEScriptPath = component.graderSettings.intellijScript;
        } else if (component.graderConfig.language === 'python3') {
            IDEScriptPath = component.graderSettings.pycharmScript;
        }
        const command = component.fileInterface.openIDEProject(component.IDEProjectPath, IDEScriptPath);
        component.showMessage('Running ' + command, null);
    };
}
