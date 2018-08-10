/*
 * This file has been adapted from code written by Siddu Duddikunta <siddu@siddu.me>
 * and contributors for the old CS 1332 autograder, distributed under the GNU General
 * Public License <http://www.gnu.org/licenses/>
 */

import java.lang.reflect.ReflectPermission;
import java.io.File;
import java.io.FilePermission;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.PropertyPermission;
import java.util.Set;
import java.security.Permission;

public class MainClassSecurityManager extends SecurityManager {

    private static File directory;

    private static final ToggleSecurityManagerPermission TOGGLE_PERMISSION = new ToggleSecurityManagerPermission();
    ThreadLocal<Boolean> enabledFlag = null;

    public MainClassSecurityManager(File classDirectory) {
        directory = classDirectory;

        enabledFlag = new ThreadLocal<Boolean>() {

            @Override
            protected Boolean initialValue() {
                return false; // Initially, it's always disabled
            }

            @Override
            public void set(Boolean value) {
                if (!value) { // Only check if someone is trying to disable it
                    SecurityManager securityManager = System.getSecurityManager();
                    if (securityManager != null) {
                        securityManager.checkPermission(TOGGLE_PERMISSION);
                    }
                }
                super.set(value);
            }
        };
    }

    @Override
    public void checkPermission(Permission perm) {

        if (shouldCheck(perm)) {
            if (perm instanceof FilePermission) {
            /*
             * Allow reading files.
             */
                if (perm.getActions().equals("read")) {
                    return; // approved, short-circuit before throwing
                }
            }

            if (perm instanceof ReflectPermission) {
                return; // allow reflection for tests
            }

            // JUnit needs all sorts of permissions for reflective magic
            boolean internal = true;
            for (StackTraceElement elem : Thread.currentThread().getStackTrace()) {
                if (internal) { // all trace elements thus far must have been internal
                    if (elem.getClassName().startsWith("org.junit.")) {
                        return;
                    }
                }
                if (!elem.getClassName().startsWith("sun.") &&
                        !elem.getClassName().startsWith("java.") &&
                        !elem.getClassName().equals("JUnitSecurityManager")) {
                    internal = false;
                }
            }

            if (perm instanceof PropertyPermission) {
                PropertyPermission p = (PropertyPermission) perm;
                if (p.getActions().equals("read")) {
                    return;
                }
            }

            throw new SecurityException("Permission denied: " + perm);
        }
    }

    @Override
    public void checkPermission(Permission perm, Object context) {
        checkPermission(perm);
    }

    private boolean shouldCheck(Permission permission) {
        return isEnabled() || permission instanceof ToggleSecurityManagerPermission;
    }

    public void enable() {
        enabledFlag.set(true);
    }

    public boolean isEnabled() {
        return enabledFlag.get();
    }

}
