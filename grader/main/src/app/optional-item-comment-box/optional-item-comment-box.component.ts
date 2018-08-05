import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {Observable} from "rxjs/index";
import {map, startWith} from "rxjs/operators";
import {FileInterfaceService} from "../providers/file-interface.service";
// import {DirectoryConfigService} from "../providers/directory-config.service";

@Component({
    selector: 'app-optional-item-comment-box',
    templateUrl: './optional-item-comment-box.component.html',
    styleUrls: ['./optional-item-comment-box.component.css']
})
export class OptionalItemCommentBoxComponent implements OnInit {

    public commentGroup = new FormGroup({
        comment: new FormControl()
    });
    public filteredCommentOptions: Observable<string[]>;
    public autocompleteData: any;

    constructor(private fileInterface: FileInterfaceService) {
        this.autocompleteData = this.fileInterface.getAutocompleteData();
    }

    ngOnInit() {
        this.filteredCommentOptions = this.commentGroup.controls['comment'].valueChanges
            .pipe(
                startWith(''),
                map(val => val ? this.filterCommentTexts(val.toString()) : this.autocompleteData.optionalRubricItemTexts.slice())
            );
    }

    filterCommentTexts(val: string): string[] {
        return this.autocompleteData.optionalRubricItemTexts.filter(option => new RegExp(`^${val}`, 'gi').test(option));
    }

    @Output('update')
    change: EventEmitter<string> = new EventEmitter<string>();

    applyComment() {
        const component = this;
        const comment = component.commentGroup.value.comment || '';
        if (comment && comment !== '') {
            component.change.emit(comment);
            component.commentGroup.reset();
        }
    }

    public contains(arr, val) {
        return arr.indexOf(val) > -1;
    }
}
