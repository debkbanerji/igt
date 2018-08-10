/*
 * This file has been adapted from code written by Siddu Duddikunta <siddu@siddu.me>
 * and contributors for the old CS 1332 autograder, distributed under the GNU General
 * Public License <http://www.gnu.org/licenses/>
 */

//import org.antlr.v4.runtime.ANTLRInputStream;
//import org.antlr.v4.runtime.CommonTokenStream;
//import org.antlr.v4.runtime.ParserRuleContext;
//import org.antlr.v4.runtime.tree.ParseTreeWalker;
//import org.antlr.v4.runtime.tree.pattern.ParseTreeMatch;
//import org.antlr.v4.runtime.tree.pattern.ParseTreePattern;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.DefaultParser;
import org.apache.commons.cli.HelpFormatter;
import org.apache.commons.cli.Options;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintStream;
import java.io.ByteArrayOutputStream;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.concurrent.*;
import java.util.concurrent.TimeUnit;
import java.lang.reflect.InvocationTargetException;

public class Main {

    private static int TIMEOUT_SECONDS = 5;

//    private static class TestPointValueListener extends Java8BaseListener {
////        private Java8Parser parser;
//        private HashMap<String, Double> values;
//
//        public TestPointValueListener(Java8Parser parser) {
//            this.parser = parser;
//            values = new HashMap<>();
//        }
//
//        @Override
//        public void enterMethodDeclaration(Java8Parser.MethodDeclarationContext ctx) {
//            super.enterMethodDeclaration(ctx);
//
//            String xpath = "//expressionStatement";
//            ParseTreePattern p = parser.compileParseTreePattern("points += <expression>;",
//                    Java8Parser.RULE_expressionStatement);
//            List<ParseTreeMatch> matches = p.findAll(ctx, xpath);
//            for (ParseTreeMatch m : matches) {
//                values.put(ctx.methodHeader().methodDeclarator().Identifier().getText(),
//                        Double.parseDouble(m.get("expression").getText()));
//            }
//        }
//    }

    public static void main(String[] args) throws Exception {
        /*
        Command Line Arguments:
        args[0]: Path to target directory
        args[1]: Main class (without .java extension) - Ex: CodeRunner
        args[2]: Java command - Ex: java
        args[3]: Java compiler command - Ex: javac
        args[4]: path to checkstyle file, or 'none' if checkstyle audit does not need to be run
        Remaining args: student files
         */
        Options options = new Options();
        options
//                .addOption("p", "point-values", false, "run point value analysis")
//                .addOption("s", "skip-submission", false, "skip running student submission")
                .addOption("h", "help", false, "print help");
        CommandLineParser cmdLineParser = new DefaultParser();
        CommandLine cmd = cmdLineParser.parse(options, args);
        if (cmd.hasOption("help")) {
            HelpFormatter formatter = new HelpFormatter();
            formatter.printHelp("java -jar agent.jar [OPTION]... directory mainClassName java javac checkstyleConfigPath", options);
            System.exit(0);
        }

//        if (cmd.hasOption("s") && !cmd.hasOption("p")) {
//            System.err.println("error: -s specified, but -p not specified; try --help");
//            System.exit(1);
//        }

        args = cmd.getArgs();
        if (args.length < 5) {
            System.err.println("error: expected at least five positional arguments; try --help");
            System.exit(1);
        }

        JSONObject result = new JSONObject();
        PrintStream sysOut = System.out;
        System.setOut(new PrintStream(new OutputStream() {
            @Override
            public void write(int b) {
            }
        }));

        File directory = new File(args[0]);
        try {
//            if (cmd.hasOption("p")) {
//                String mainClassSourcePath = args[0] + File.separator + args[1] + ".java";
//                FileInputStream str = new FileInputStream(mainClassSourcePath);
//
//                Java8Lexer lexer = new Java8Lexer(new ANTLRInputStream(str));
//                CommonTokenStream tokens = new CommonTokenStream(lexer);
//                Java8Parser parser = new Java8Parser(tokens);
//                ParserRuleContext tree = parser.compilationUnit(); // parse
//
//                ParseTreeWalker walker = new ParseTreeWalker(); // create standard walker
//                TestPointValueListener extractor = new TestPointValueListener(parser);
//                walker.walk(extractor, tree); // initiate walk of tree with listener
//
//                JSONObject pointValues = new JSONObject();
//                for (String testName : extractor.values.keySet()) {
//                    pointValues.put(testName, extractor.values.get(testName));
//                }
//                result.put("point_values", pointValues);
//            }
//
//            if (cmd.hasOption("s")) {
//                return;
//            }

            String[] dirlist = directory.list();
            List<String> javaFiles = new ArrayList<>();
            List<String> checkstyleFiles = new ArrayList<>();
            for (String s : dirlist) {
                if (s.endsWith(".java")) {
                    javaFiles.add(s);
//                    if (!s.equals(args[1] + ".java")) {
                    checkstyleFiles.add(s);
//                    }
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
            StringBuilder compileOutput = new StringBuilder();
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
                for (int j = 0; j < declaredFields.length; j++) {
                    Field declaredField = declaredFields[j];
                    int foundMods = declaredField.getModifiers();
                    JSONObject fieldJSON = new JSONObject();
                    fieldJSON.put("name", declaredField.getName());
                    fieldJSON.put("isPrivate", Modifier.isPrivate(declaredField.getModifiers()));
                    fieldsArray.add(fieldJSON);
                }
                declaredFieldsObject.put(args[i] + ".java", fieldsArray);
                Method[] declaredMethods = fieldsTestClass.getDeclaredMethods();
                JSONArray methodsArray = new JSONArray();
                for (int j = 0; j < declaredMethods.length; j++) {
                    Method declaredMethod = declaredMethods[j];
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


            // Create a stream to hold the output
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PrintStream ps = new PrintStream(baos);
            // Save the old System.out
            PrintStream old = System.out;
            // Tell Java to use our special stream
            System.setOut(ps);

            MainClassSecurityManager mainClassSecurityManager = new MainClassSecurityManager(directory);

            // now drop all unnecessary permissions to run Main class
            System.setSecurityManager(mainClassSecurityManager);

            Class mainClass = classLoader.loadClass(args[1]);
            Method mainMethod = mainClass.getMethod("main", String[].class);

            runMethodInAnotherThread(mainClassSecurityManager, mainMethod, TIMEOUT_SECONDS, null);

            // Put things back
            // Note that the security manager should only be disabled for the other thread
            System.out.flush();
            System.setOut(old);
            String mainClassOutput = baos.toString();

            result.put("output", mainClassOutput);

        } catch (Exception e) {
            result.put("agentErrorMessage", e.getMessage());
            result.put("agentErrorStackTrace", StackTraceToString(e));
        } finally {
            sysOut.println(result.toJSONString());
            System.exit(0);
        }
    }

    public static String StackTraceToString(Throwable ex) {
        String result = ex.toString() + "\n";
        StackTraceElement[] trace = ex.getStackTrace();
        for (int i = 0; i < trace.length; i++) {
            result += trace[i].toString() + "\n";
        }
        return result;
    }

    public static void runMethodInAnotherThread(final MainClassSecurityManager securityManager, Method mainMethod, int timeoutSeconds, String[] params) throws Exception {

        Thread thread = new Thread(new Runnable() {

            @Override
            public void run() {
                System.setSecurityManager(securityManager);
                // only enable the security manager for this thread
                securityManager.enable();

                // === BEGIN UNTRUSTED CODE === //
                try {
                    ExecutorService executor = Executors.newSingleThreadExecutor();
                    Future<String> future = executor.submit(new MainTask(mainMethod, securityManager));

                    try {
                        System.out.println(future.get(timeoutSeconds, TimeUnit.SECONDS));
                    } catch (TimeoutException e) {
                        future.cancel(true);
                        System.out.println("\nCODE TIMED OUT AFTER " + timeoutSeconds + " SECONDS");
                    } catch (InterruptedException | ExecutionException e) {
                        System.out.println("\nEXCEPTION WHILE RUNNING CODE\n");
                        System.out.println(StackTraceToString(e));
                    }

                } catch (Exception e) {
                    System.out.println("\nEXCEPTION WHILE RUNNING CODE\n");
                    System.out.println(StackTraceToString(e));
                }
                // === END UNTRUSTED CODE === //
            }
        });
        thread.start();
        thread.join();
    }

    static class MainTask implements Callable<String> {

        private Method mainMethod;
        private MainClassSecurityManager securityManager;

        MainTask(Method mainMethod, final MainClassSecurityManager securityManager) {
            this.mainMethod = mainMethod;
            this.securityManager = securityManager;
        }

        @Override
        public String call() throws Exception {
//            System.setSecurityManager(securityManager);
            securityManager.enable();
            try {
                this.mainMethod.invoke(null, (Object) null);
            } catch (InvocationTargetException e) {
//                System.out.println("\n\nEXCEPTION IN MAIN METHOD RUNNER TASK\n");
//                System.out.println(StackTraceToString(e));
                System.out.println("\nEXCEPTION WHILE INVOKING MAIN METHOD\n");
                System.out.println(StackTraceToString(e.getCause()));
//                throw e;
            } catch (Exception e) {
                System.out.println("\nEXCEPTION IN MAIN METHOD RUNNER TASK\n");
                System.out.println(StackTraceToString(e));
//                throw e;
            }
            return "\n\nFINISHED RUNNING CODE";
        }
    }
}
