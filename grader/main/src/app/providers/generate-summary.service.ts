import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class GenerateSummaryService {

    constructor() {
    }

    generateSummary(graderData: any, graderConfig: any, graderName: string): string {
        if (!graderData.done) {
            return 'Not Done Grading';
        }
        const result = [];
        result.push('Final Score: (');
        const finalScore = this.getFinalScore(graderData, graderConfig);
        result.push(finalScore);
        result.push('/');
        result.push(graderConfig.maxPoints);
        result.push(')');
        graderData.appliedRubricItems.forEach(function (item) {
            result.push(' \n[ ');
            result.push(item.points);
            result.push(' : ');
            result.push(item.comment);
            result.push(' ]');
        });
        graderData.optionalRubricItems.forEach(function (item) {
            if (item.numApplications > 0) {
                result.push(' \n[ ');
                result.push(item.points * item.numApplications);
                if ((item.numApplications > 1) && (Math.abs(item.points) > 1)) {
                    result.push(' = ');
                    result.push(item.points);
                    result.push(' x ');
                    result.push(item.numApplications);
                }
                result.push(' : ');
                result.push(item.name);
                const comments = item.comments;
                if (comments.length > 0) {
                    result.push(' | ');
                    result.push(comments.join(' | '));
                }
                result.push(' ]');
            }
        });
        graderData.pointAdjustmentItems.forEach(function (item) {
            result.push(' \n[ ');
            result.push(item.points);
            result.push(' : ');
            result.push(item.comment);
            result.push(' ]');
        });
        graderData.comments.forEach(function (comment) {
            result.push(' \n');
            result.push(comment)
        });
        let pointsComment;
        const belowMap = graderConfig.pointBasedComments.belowOrEqual;
        if (belowMap) {
            let lowest = graderConfig.maxPoints;
            Object.keys(belowMap).forEach(function (keyString) {
                const key = Number(keyString);
                if (finalScore <= key && key < lowest) {
                    lowest = key;
                    pointsComment = belowMap[key];
                }
            });
        }
        const aboveMap = graderConfig.pointBasedComments.aboveOrEqual;
        if (aboveMap) {
            let highest = 0;
            Object.keys(aboveMap).forEach(function (keyString) {
                const key = Number(keyString);
                if (finalScore >= key && key > highest) {
                    highest = key;
                    pointsComment = aboveMap[key];
                }
            });
        }
        if (pointsComment) {
            result.push(' \n');
            result.push(pointsComment);
        }
        result.push(' \n\n-');
        result.push(graderName);
        return result.join('');
    }

    getFinalScore(graderData: any, graderConfig: any): number {
        let result = graderConfig.basePoints;
        result += this.getAppliedRubricItemPoints(graderData);
        result += this.getOptionalRubricItemPoints(graderData);
        result += this.getPointAdjustmentItemPoints(graderData);
        result = Math.max(result, 0);
        result = Math.min(result, graderConfig.maxPoints);
        return result;
    }

    getAppliedRubricItemPoints(graderData: any): number {
        let totalPoints = 0;
        graderData.appliedRubricItems.forEach(function (item) {
            totalPoints += item.points;
        });
        return totalPoints;
    }

    getOptionalRubricItemPoints(graderData: any): number {
        let totalPoints = 0;
        graderData.optionalRubricItems.forEach(function (item) {
            totalPoints += item.numApplications * item.points;
        });
        return totalPoints;
    }

    getPointAdjustmentItemPoints(graderData: any): number {
        let totalPoints = 0;
        graderData.pointAdjustmentItems.forEach(function (item) {
            totalPoints += item.points;
        });
        return totalPoints;
    }
}
