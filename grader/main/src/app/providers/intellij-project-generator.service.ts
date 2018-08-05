import {Injectable} from '@angular/core';
import {DirectoryConfigService} from './directory-config.service';

declare let mainProcess: any;

@Injectable()
export class IntellijProjectGeneratorService {


    JUNIT_4_IML_CONTENTS = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<module type="JAVA_MODULE" version="4">\n' +
        '  <component name="NewModuleRootManager" inherit-compiler-output="true">\n' +
        '    <exclude-output />\n' +
        '    <content url="file://$MODULE_DIR$">\n' +
        '      <sourceFolder url="file://$MODULE_DIR$/src" isTestSource="false" />\n' +
        '    </content>\n' +
        '    <orderEntry type="inheritedJdk" />\n' +
        '    <orderEntry type="sourceFolder" forTests="false" />\n' +
        '    <orderEntry type="module-library">\n' +
        '      <library name="JUnit4">\n' +
        '        <CLASSES>\n' +
        '          <root url="jar://$APPLICATION_HOME_DIR$/lib/junit-4.12.jar!/" />\n' +
        '          <root url="jar://$APPLICATION_HOME_DIR$/lib/hamcrest-core-1.3.jar!/" />\n' +
        '        </CLASSES>\n' +
        '        <JAVADOC />\n' +
        '        <SOURCES />\n' +
        '      </library>\n' +
        '    </orderEntry>\n' +
        '  </component>\n' +
        '</module>';

    JUNIT_5_IML_CONTENTS = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<module type="JAVA_MODULE" version="4">\n' +
        '  <component name="NewModuleRootManager" inherit-compiler-output="true">\n' +
        '    <exclude-output />\n' +
        '    <content url="file://$MODULE_DIR$">\n' +
        '      <sourceFolder url="file://$MODULE_DIR$/src" isTestSource="false" />\n' +
        '    </content>\n' +
        '    <orderEntry type="inheritedJdk" />\n' +
        '    <orderEntry type="sourceFolder" forTests="false" />\n' +
        '    <orderEntry type="module-library">\n' +
        '      <library name="JUnit5">\n' +
        '        <CLASSES>\n' +
        '          <root url="jar://$APPLICATION_HOME_DIR$/plugins/junit/lib/junit-jupiter-api-5.0.0-RC2.jar!/" />\n' +
        '          <root url="jar://$APPLICATION_HOME_DIR$/plugins/junit/lib/opentest4j-1.0.0-RC1.jar!/" />\n' +
        '        </CLASSES>\n' +
        '        <JAVADOC />\n' +
        '        <SOURCES />\n' +
        '      </library>\n' +
        '    </orderEntry>\n' +
        '  </component>\n' +
        '</module>';

    COMPILER_FILE_CONTENTS = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<project version="4">\n' +
        '  <component name="CompilerConfiguration">\n' +
        '    <resourceExtensions />\n' +
        '    <wildcardResourcePatterns>\n' +
        '      <entry name="!?*.java" />\n' +
        '      <entry name="!?*.form" />\n' +
        '      <entry name="!?*.class" />\n' +
        '      <entry name="!?*.groovy" />\n' +
        '      <entry name="!?*.scala" />\n' +
        '      <entry name="!?*.flex" />\n' +
        '      <entry name="!?*.kt" />\n' +
        '      <entry name="!?*.clj" />\n' +
        '      <entry name="!?*.aj" />\n' +
        '    </wildcardResourcePatterns>\n' +
        '    <annotationProcessing>\n' +
        '      <profile default="true" name="Default" enabled="false">\n' +
        '        <processorPath useClasspath="true" />\n' +
        '      </profile>\n' +
        '    </annotationProcessing>\n' +
        '  </component>\n' +
        '</project>';

    ENCODINGS_FILE_CONTENT = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<project version="4">\n' +
        '  <component name="Encoding">\n' +
        '    <file url="PROJECT" charset="UTF-8" />\n' +
        '  </component>\n' +
        '</project>';

    MODULES_FILE_CONTENT = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<project version="4">\n' +
        '  <component name="NewModuleRootManager" inherit-compiler-output="true">\n' +
        '    <exclude-output />\n' +
        '    <content url="file://$MODULE_DIR$">\n' +
        '      <sourceFolder url="file://$MODULE_DIR$/src" isTestSource="false" />\n' +
        '    </content>\n' +
        '    <orderEntry type="inheritedJdk" />\n' +
        '    <orderEntry type="sourceFolder" forTests="false" />\n' +
        '  </component>\n' +
        '  <component name="ProjectModuleManager">\n' +
        '    <modules>\n' +
        '      <module fileurl="file://$PROJECT_DIR$/.idea/SUBMISSION_DIRECTORY.iml" filepath="$PROJECT_DIR$/.idea/SUBMISSION_DIRECTORY.iml" />\n' +
        '    </modules>\n' +
        '  </component>\n' +
        '</project>';

    MISC_FILE_CONTENT = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<project version="4">\n' +
        '  <component name="EntryPointsManager">\n' +
        '    <entry_points version="2.0" />\n' +
        '  </component>\n' +
        '  <component name="MavenImportPreferences">\n' +
        '    <option name="generalSettings">\n' +
        '      <MavenGeneralSettings>\n' +
        '        <option name="mavenHome" value="Bundled (Maven 3)" />\n' +
        '      </MavenGeneralSettings>\n' +
        '    </option>\n' +
        '  </component>\n' +
        '  <component name="ProjectLevelVcsManager" settingsEditedManually="false">\n' +
        '    <OptionsSetting value="true" id="Add" />\n' +
        '    <OptionsSetting value="true" id="Remove" />\n' +
        '    <OptionsSetting value="true" id="Checkout" />\n' +
        '    <OptionsSetting value="true" id="Update" />\n' +
        '    <OptionsSetting value="true" id="Status" />\n' +
        '    <OptionsSetting value="true" id="Edit" />\n' +
        '    <ConfirmationsSetting value="0" id="Add" />\n' +
        '    <ConfirmationsSetting value="0" id="Remove" />\n' +
        '  </component>\n' +
        '  <component name="ProjectRootManager" version="2" languageLevel="JDK_1_8" default="true" assert-keyword="true" jdk-15="true" project-jdk-name="1.8" project-jdk-type="JavaSDK">\n' +
        '    <output url="file://$PROJECT_DIR$/out" />\n' +
        '  </component>\n' +
        '</project>';

    public generateProject = function (graderConfig: any,
                                       submissionDirectory: string,
                                       graderBaseDirectory: any,
                                       targetFolder: string) {
        const component = this;

        if (mainProcess.exists(targetFolder)) {
            throw new Error('Project already exists');
        }
        mainProcess.makeDir(targetFolder);

        const srcPath = mainProcess.join(targetFolder, 'src');
        mainProcess.makeDir(srcPath);


        const submissionsDirectoryPath = mainProcess.join(graderBaseDirectory, component.directoryConfig.GRADER_SUBMISSIONS);
        const studentFilesDirectory = mainProcess.join(submissionsDirectoryPath, submissionDirectory);
        mainProcess.listFiles(studentFilesDirectory).filter(file => {
            return file !== component.directoryConfig.GRADER_DATA_FILE_NAME
                && file !== component.directoryConfig.TSQUARE_TIMESTAMP_FILE;
        }).forEach(function (file) {
            const source = mainProcess.join(studentFilesDirectory, file);
            const destination = mainProcess.join(srcPath, file);
            mainProcess.copy(source, destination);
        });

        const supportFilesDirectory = mainProcess.join(graderBaseDirectory, component.directoryConfig.GRADER_SUPPORT_FILES);
        graderConfig.supportFiles.forEach(function (file) {
            const source = mainProcess.join(supportFilesDirectory, file);
            const destination = mainProcess.join(srcPath, file);
            mainProcess.copy(source, destination);
        });

        const ideaFolderPath = mainProcess.join(targetFolder, '.idea');
        mainProcess.makeDir(ideaFolderPath);

        const ideaImlPath = mainProcess.join(ideaFolderPath, submissionDirectory + '.iml');
        if (graderConfig.junitVersion === 4) {
            mainProcess.writeToFile(ideaImlPath, component.JUNIT_4_IML_CONTENTS);
        } else if (graderConfig.junitVersion === 5) {
            mainProcess.writeToFile(ideaImlPath, component.JUNIT_5_IML_CONTENTS);
        }

        const compilerFilePath = mainProcess.join(ideaFolderPath, 'compiler.xml');
        mainProcess.writeToFile(compilerFilePath, component.COMPILER_FILE_CONTENTS);

        const encodingsFilePath = mainProcess.join(ideaFolderPath, 'encodings.xml');
        mainProcess.writeToFile(encodingsFilePath, component.ENCODINGS_FILE_CONTENT);


        const modulesFilePath = mainProcess.join(ideaFolderPath, 'modules.xml');
        mainProcess.writeToFile(modulesFilePath, component.MODULES_FILE_CONTENT.replace('SUBMISSION_DIRECTORY', submissionDirectory)
            .replace('SUBMISSION_DIRECTORY', submissionDirectory));


        const miscFilePath = mainProcess.join(ideaFolderPath, 'misc.xml');
        mainProcess.writeToFile(miscFilePath, component.MISC_FILE_CONTENT);

        return targetFolder;
    };


    constructor(private directoryConfig: DirectoryConfigService) {
    }
}
