/*
 * This file has been adapted from code written by Siddu Duddikunta <siddu@siddu.me>
 * and contributors for the old CS 1332 autograder, distributed under the GNU General
 * Public License <http://www.gnu.org/licenses/>
 */

import org.apache.commons.cli.*;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.junit.platform.launcher.Launcher;
import org.junit.platform.launcher.LauncherDiscoveryRequest;
import org.junit.platform.launcher.core.LauncherDiscoveryRequestBuilder;
import org.junit.platform.launcher.core.LauncherFactory;
import org.junit.platform.launcher.listeners.SummaryGeneratingListener;
import org.junit.platform.launcher.listeners.TestExecutionSummary;

import java.io.*;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.ArrayList;
import java.util.List;

import static org.junit.platform.engine.discovery.DiscoverySelectors.selectClass;

public class Main {
    public static void main(String[] args) throws Exception {
        /*
        Command Line Arguments:
        args[0]: Path to target directory
        args[1]: Test class (without .java extension) - Ex: EpicTests
        args[2]: path to checkstyle file
        args[3]: Java compiler command - Ex: javac
        args[4]: path to checkstyle file, or 'none' if checkstyle audit does not need to be run
        Remaining args: student files
         */
        Options options = new Options();
        options.addOption("h", "help", false, "print help");
        CommandLineParser cmdLineParser = new DefaultParser();
        CommandLine cmd = cmdLineParser.parse(options, args);
        if (cmd.hasOption("help")) {
            HelpFormatter formatter = new HelpFormatter();
            formatter.printHelp("java -jar agent.jar [OPTION]... directory testClassName checkstyleConfigPath", options);
            System.exit(0);
        }


        args = cmd.getArgs();
        if (args.length < 5) {
            System.err.println("error: expected at least three positional arguments; try --help");
            System.exit(1);
        }

        JSONObject result = new JSONObject();
        PrintStream sysOut = System.out;
        System.setOut(new PrintStream(new OutputStream() {
            @Override
            public void write(int b) {
            }
        }));
        try {
//            if (cmd.hasOption("s")) {
//                return;
//            }

            File directory = new File(args[0]);
            String[] dirlist = directory.list();
            List<String> javaFiles = new ArrayList<>();
            List<String> checkstyleFiles = new ArrayList<>();
            for (String s : dirlist) {
                if (s.endsWith(".java")) {
                    javaFiles.add(s);
                    if (!s.equals(args[1] + ".java")) {
                        checkstyleFiles.add(s);
                    }
                }
            }

            List<String> compileCommand = new ArrayList<>();
            compileCommand.add(args[3]);
            compileCommand.add("-Xlint:unchecked");
            compileCommand.add("-cp");
            compileCommand.add(System.getProperty("java.class.path") + File.pathSeparator + ".");
            compileCommand.addAll(javaFiles);
            Process compileProcess = new ProcessBuilder()
                    .command(compileCommand)
                    .directory(directory)
                    .redirectErrorStream(true)
                    .start();
            StringBuilder compileOutput = new StringBuilder("");
            BufferedReader br = new BufferedReader(new InputStreamReader(compileProcess.getInputStream()));
            String input;
            while ((input = br.readLine()) != null) {
                compileOutput.append(input);
                compileOutput.append('\n');
            }

            int rc = compileProcess.waitFor();
            JSONObject compileResults = new JSONObject();
            compileResults.put("success", rc == 0);
            compileResults.put("output", compileOutput.toString());
            result.put("compile", compileResults);

            if (rc != 0) {
                sysOut.println(result.toJSONString());
                return;
            }

            if (!args[4].equals("none")) {
                List<String> checkstyleCommand = new ArrayList<>();
                checkstyleCommand.add(args[2]);
                checkstyleCommand.add("-cp");
                checkstyleCommand.add(System.getProperty("java.class.path") + File.pathSeparator + ".");
                checkstyleCommand.add("com.puppycrawl.tools.checkstyle.Main"); // className
                checkstyleCommand.add("-c");
                checkstyleCommand.add(args[4]);
                checkstyleCommand.addAll(checkstyleFiles);
                Process checkstyleProcess = new ProcessBuilder()
                        .command(checkstyleCommand)
                        .directory(directory)
                        .redirectErrorStream(true)
                        .start();
                StringBuilder checkstyleOutput = new StringBuilder();
                br = new BufferedReader(new InputStreamReader(checkstyleProcess.getInputStream()));
                int pointsLost = 0;
                while ((input = br.readLine()) != null) {
                    checkstyleOutput.append(input);
                    checkstyleOutput.append('\n');
                    if (!input.equals("Starting audit...") && !input.equals("Audit done.") && !input.startsWith("Checkstyle ends with")) {
                        pointsLost++;
                    }
                }

                checkstyleProcess.waitFor();
                JSONObject checkstyle = new JSONObject();
                checkstyle.put("pointsLost", pointsLost);
                checkstyle.put("output", checkstyleOutput.toString());
                result.put("checkstyle", checkstyle);
            }

            // we need to create our ClassLoader before dropping permissions
            ClassLoader classLoader = new URLClassLoader(new URL[]{directory.toURI().toURL()});

            JSONObject declaredFieldsObject = new JSONObject();
            JSONObject declaredMethodsObject = new JSONObject();
            for (int i = 5; i < args.length; i++) {
                Class fieldsTestClass = classLoader.loadClass(args[i]);
                Field[] declaredFields = fieldsTestClass.getDeclaredFields();
                JSONArray fieldsArray = new JSONArray();
                for (Field declaredField : declaredFields) {
                    int foundMods = declaredField.getModifiers();
                    JSONObject fieldJSON = new JSONObject();
                    fieldJSON.put("name", declaredField.getName());
                    fieldJSON.put("isPrivate", Modifier.isPrivate(declaredField.getModifiers()));
                    fieldsArray.add(fieldJSON);
                }
                declaredFieldsObject.put(args[i] + ".java", fieldsArray);
                Method[] declaredMethods = fieldsTestClass.getDeclaredMethods();
                JSONArray methodsArray = new JSONArray();
                for (Method declaredMethod : declaredMethods) {
                    int foundMods = declaredMethod.getModifiers();
                    JSONObject methodJSON = new JSONObject();
                    methodJSON.put("name", declaredMethod.getName());
                    methodJSON.put("isPrivate", Modifier.isPrivate(declaredMethod.getModifiers()));
                    methodsArray.add(methodJSON);
                }
                declaredMethodsObject.put(args[i] + ".java", methodsArray);
            }
            result.put("declaredMethods", declaredMethodsObject);
            result.put("declaredFields", declaredFieldsObject);

            // now drop all unnecessary permissions to run JUnit
            System.setSecurityManager(new JUnitSecurityManager(directory));

            // === BEGIN UNTRUSTED CODE === //
            Class testClass = classLoader.loadClass(args[1]);
            LauncherDiscoveryRequest request = LauncherDiscoveryRequestBuilder.request()
                    .selectors(
                            selectClass(testClass)
                    )
                    .build();
            Launcher launcher = LauncherFactory.create();
            SummaryGeneratingListener listener = new SummaryGeneratingListener();
            launcher.registerTestExecutionListeners(listener);
            launcher.execute(request);
            TestExecutionSummary summary = listener.getSummary();
            // === END UNTRUSTED CODE === //

            List<TestExecutionSummary.Failure> failures = summary.getFailures();

            JSONObject jUnit = new JSONObject();
            JSONArray jUnitFailures = new JSONArray();
            StringBuilder jUnitTestOutput = new StringBuilder("");
            for (int i = 0; i < failures.size(); i++) {
                TestExecutionSummary.Failure f = failures.get(i);
                // chopping of parentheses using split
                String testDisplayName = f.getTestIdentifier().getDisplayName().split("\\(")[0];
                jUnitFailures.add(testDisplayName);

                jUnitTestOutput.append(i + 1).append(") ").append(testDisplayName).append('\n');
                StringWriter sw = new StringWriter();
                f.getException().printStackTrace(new PrintWriter(sw));
                String exceptionAsString = sw.toString();
                jUnitTestOutput.append(exceptionAsString).append('\n');
            }
            jUnit.put("failures", jUnitFailures);
            jUnit.put("output", jUnitTestOutput.toString());
            result.put("tests", jUnit);
            sysOut.println(result.toJSONString());
            System.exit(0);
        } catch (Exception e) {
            result.put("agentErrorMessage", e.getMessage());
            sysOut.println(result.toJSONString());
            System.exit(0);
        }
    }
}
