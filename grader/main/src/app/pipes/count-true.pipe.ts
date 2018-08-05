import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'countTrue',
    pure: false
})
export class CountTruePipe implements PipeTransform {

    transform(input: any, args?: any): any {
        const keys = Object.keys(input);
        let result = 0;
        keys.forEach((val) => {
            if (input[val]) {
                result++;
            }
        });
        return result;
    }

}
