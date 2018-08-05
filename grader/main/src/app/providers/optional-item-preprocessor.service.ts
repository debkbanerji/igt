import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class OptionalItemPreprocessorService {

    applyHintKeyOptionalItems(graderData: any, graderConfig: any) {
        graderData.optionalRubricItems.forEach(function (item) {
            const hintKey = item.hintKey;
            if (hintKey === 'checkstyle') {
                if (graderData.checkstyle) {
                    item.numApplications = Math.min(
                        item.maxApplications, graderData.checkstyle.pointsLost
                    );
                }
            } else if (hintKey === 'encapsulationViolation') {
                if (graderData.compile
                    && graderData.declaredJavaEntities
                    && graderConfig.javaHintHelpers
                    && graderData.declaredJavaEntities.fields
                    && graderData.declaredJavaEntities.methods) {
                    const nonPrivateEntities = [];
                    const fields = graderData.declaredJavaEntities.fields;
                    const methods = graderData.declaredJavaEntities.methods;
                    const expectedPublicMethods = graderConfig.javaHintHelpers.expectedPublicMethods || {};
                    Object.keys(fields).forEach(function (file) {
                        fields[file].forEach(function (field) {
                            // Note: We're assuming all fields should be private, using getters and setters if necessary
                            if (!field.isPrivate) {
                                nonPrivateEntities.push(field.name);
                            }
                        })
                    });
                    Object.keys(methods).forEach(function (file) {
                        methods[file].forEach(function (method) {
                            // If the method is non public, and is not parth of the expected methods
                            if (!method.isPrivate && expectedPublicMethods[file].indexOf(method.name) < 0) {
                                nonPrivateEntities.push(method.name);
                            }
                        })
                    });
                    item.numApplications = Math.min(nonPrivateEntities.length, item.maxApplications);
                    if (nonPrivateEntities.length > 0) {
                        item.comments = [
                            "Found " + nonPrivateEntities.length + " unexpected"
                            + " non private fields/methods: " + nonPrivateEntities.join(', ')
                        ]; // Overwriting comments just in case this is called multiple times
                    }
                }
            } else if (hintKey === 'additionalInstanceVariables') {
                if (graderData.compile
                    && graderData.declaredJavaEntities
                    && graderConfig.javaHintHelpers
                    && graderData.declaredJavaEntities.fields
                    && graderData.declaredJavaEntities.methods) {
                    const additionalInstanceVariables = [];
                    const fields = graderData.declaredJavaEntities.fields;
                    const expectedPrivateFields = graderConfig.javaHintHelpers.expectedPrivateFields || {};
                    Object.keys(fields).forEach(function (file) {
                        fields[file].forEach(function (field) {
                            if (expectedPrivateFields[file].indexOf(field.name) < 0) {
                                additionalInstanceVariables.push(field.name);
                            }
                        })
                    });
                    item.numApplications = Math.min(additionalInstanceVariables.length, item.maxApplications);
                    if (additionalInstanceVariables.length > 0) {
                        item.comments = [
                            "Found " + additionalInstanceVariables.length + " unexpected"
                            + " fields: " + additionalInstanceVariables.join(', ')
                        ]; // Overwriting comments just in case this is called multiple times
                    }
                }
            } else if (hintKey === 'nonCompile') {
                if (graderData.compile && !graderData.compile.success) {
                    // graderData.comments = ['Unfortunately, your submission did not compile. In the future, please be sure to redownload your code after submission and make sure that it compiles and runs as expected.'];
                    // Overwriting comments just in case this is called multiple times
                    item.numApplications = 1;
                    graderData.unresolvedRubricItems.forEach(function (unresolvedItem) {
                        if (!unresolvedItem.isTest) {
                            graderData.skippedRubricItems.push(unresolvedItem);
                        }
                        // if the item is a test, just get rid of it, since it wasn't even run
                    });
                    // Skip every regular rubric item
                    graderData.unresolvedRubricItems = [];
                    graderData.done = true;
                }
            } else if (hintKey === 'nonSubmit') {
                if (graderData.missingSubmissionFiles) {
                    // graderData.comments = ['Missing one or more submission files'];
                    // Overwriting comments just in case this is called multiple times
                    item.numApplications = 1;
                    graderData.unresolvedRubricItems.forEach(function (unresolvedItem) {
                        if (!unresolvedItem.isTest) {
                            graderData.skippedRubricItems.push(unresolvedItem);
                        }
                        // if the item is a test, just get rid of it, since it wasn't even run
                    });
                    // Skip every regular rubric item
                    graderData.unresolvedRubricItems = [];
                    graderData.done = true;
                }
            } else if (hintKey === 'syntaxError') {
                if (graderData.errorOutput) {
                    // graderData.comments = ['Could not run submitted code due to syntax error'];
                    // Overwriting comments just in case this is called multiple times
                    item.numApplications = 1;
                    graderData.unresolvedRubricItems.forEach(function (unresolvedItem) {
                        if (!unresolvedItem.isTest) {
                            graderData.skippedRubricItems.push(unresolvedItem);
                        }
                        // if the item is a test, just get rid of it, since it wasn't even run
                    });
                    // Skip every regular rubric item
                    graderData.unresolvedRubricItems = [];
                    graderData.done = true;
                }
            }
        });
        return graderData;
    }
}
