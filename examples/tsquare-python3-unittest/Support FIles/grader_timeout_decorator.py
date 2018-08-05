import traceback
from multiprocessing import Queue
import sys
import threading
from multiprocessing.pool import TimeoutError


def timeout(max_time):
    def timeout(func):
        def wrapper(*args, **kwargs):
            my_queue = Queue()

            def enqueue_function():
                try:  # Try adding the results of the function call
                    my_queue.put(func(*args, **kwargs))
                    # my_queue.put("success")
                except BaseException:
                    # If it fails, enqueue the exception instead
                    exc_info = sys.exc_info()
                    my_queue.put((exc_info[0], exc_info[1], ''.join(traceback.format_tb(exc_info[2]))))

            thread = threading.Thread(target=enqueue_function)
            thread.setDaemon(True)
            thread.start()
            thread.join(max_time)

            if thread.isAlive():
                raise TimeoutError("Test timed out after " + str(max_time) + " seconds")

            output = my_queue.get_nowait()
            # Reraise if an exception occured
            if isinstance(output, tuple) and type(output[0]) is type and isinstance(output[0](),
                                                                                    BaseException):
                raise BaseException(output[2])
            else:  # return the results otherwise
                return output

        return wrapper

    # Return the timeout decorator
    return timeout
