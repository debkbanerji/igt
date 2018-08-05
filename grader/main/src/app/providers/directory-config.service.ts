import {Injectable} from '@angular/core';

@Injectable()
export class DirectoryConfigService {


    public SUBMISSION_ATTACHMENTS_FOLDER = 'Submission attachment(s)';

    public GRADER_DATA_FOLDER_NAME = '.igt_data';
    public GRADER_CONFIG_NAME = 'igt_config.json';

    public GRADER_SUPPORT_FILES = 'support_files';
    public GRADER_SUBMISSIONS = 'submissions';

    public AGENT_OUTPUT_FILE_NAME = 'agent_output.json';
    public GRADER_DATA_FILE_NAME = 'grader_data.json';
    public TEMP_DIR_NAME = 'temp';

    public AUTOCOMPLETE_FILE_NAME = 'autocomplete_data.json';
    public TEST_DATA_FILE_NAME = 'test_data.json';

    public TSQUARE_TIMESTAMP_FILE = 'timestamp.txt';

    public PYTHON3_HELPER_FILE_DIRECTORY = 'python3';
    public PYTHON3_TEST_RUNNER_AGENT = 'test_runner_agent.py';
    public PYTHON3_CI_UNIT_TEST_CLASS = 'ciunittest.py';
    public PYTHON3_TEST_CLASS_WRAPPER = 'test_class_wrapper.py';

    public IDE_PROJECTS_DIRECTORY = 'Generated Projects';

    public NO_AGENT_RUN_MARKER = 'NO_AGENT_RUN.txt';
    public STAGED_FOR_BACKGROUND_RUN_MARKER = 'STAGED_FOR_BACKGROUND_RUN.txt';

    public PRISM_EXTENSION_MAP = {
        java: 'language-java',
        md: 'language-markdown',
        py: 'language-python'
    };

    constructor() {
    }

}
