export function getCallerFile (depth = 1) {
  let originalFunc = Error.prepareStackTrace;

  let callerFile: string | undefined;
  try {
    const err = new Error();
    let currentFile: string;

    Error.prepareStackTrace = function (err, stack) { return stack; };

    currentFile = (err.stack as any).shift().getFileName();

    while ((err.stack as any).length) {
      callerFile = (err.stack as any).shift().getFileName();

      if (currentFile !== callerFile && --depth === 0) break;
    }
  } catch (e) {
  }

  Error.prepareStackTrace = originalFunc;

  return callerFile!;
}