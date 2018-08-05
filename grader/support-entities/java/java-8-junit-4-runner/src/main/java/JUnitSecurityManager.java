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

public class JUnitSecurityManager extends SecurityManager {

    private static File directory;

    public JUnitSecurityManager(File classDirectory) {
        directory = classDirectory;
    }

    @Override
    public void checkPermission(Permission perm) {
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

    @Override
    public void checkPermission(Permission perm, Object context) {
        checkPermission(perm);
    }
}
