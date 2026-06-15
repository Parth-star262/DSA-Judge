const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const COMPILE_TIMEOUT_MS = 60_000;
const RUN_TIMEOUT_MS = 3_000;

const LANGUAGE_IDS = {
  cpp: 1,
  java: 2,
  python: 3,
  javascript: 4,
};

const runCommand = (command, args, options = {}) =>
  new Promise((resolve) => {
    let child;
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const startedAt = process.hrtime.bigint();
    let resolved = false;

    const safeResolve = (val) => {
      if (resolved) return;
      resolved = true;
      resolve(val);
    };

    const timer = setTimeout(() => {
      timedOut = true;
      if (child) {
        console.log(`[runCommand] Process timeout reached for ${command}. Killing pid: ${child.pid}`);
        child.kill('SIGKILL');
      }
      safeResolve({
        code: 1,
        stdout,
        stderr: stderr + `\nProcess timed out after ${options.timeoutMs || RUN_TIMEOUT_MS}ms.`,
        timedOut: true,
        timeSeconds: Number(process.hrtime.bigint() - startedAt) / 1e9,
      });
    }, options.timeoutMs || RUN_TIMEOUT_MS);

    console.log(
      "[runCommand] launching:",
      command,
      args.join(" ")
    );

    try {
      child = spawn(command, args, {
        cwd: options.cwd,
        shell: false,
        stdio: 'pipe',
      });
      console.log(
        "[runCommand] pid:",
        child.pid
      );
    } catch (err) {
      console.error(`[runCommand] Synchronous spawn error for ${command}:`, err);
      clearTimeout(timer);
      return safeResolve({
        code: 1,
        stdout,
        stderr: stderr + err.message,
        timedOut,
        timeSeconds: 0,
      });
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      console.error(
        "[runCommand] error:",
        err
      );
      clearTimeout(timer);
      const elapsedNs = process.hrtime.bigint() - startedAt;
      safeResolve({
        code: 1,
        stdout,
        stderr: stderr + err.message,
        timedOut,
        timeSeconds: Number(elapsedNs) / 1e9,
      });
    });

    child.on('close', (code) => {
      console.log(
        "[runCommand] closed:",
        code
      );
      clearTimeout(timer);
      const elapsedNs = process.hrtime.bigint() - startedAt;
      safeResolve({
        code: code ?? 1,
        stdout,
        stderr,
        timedOut,
        timeSeconds: Number(elapsedNs) / 1e9,
      });
    });

    if (typeof options.stdin === 'string') {
      child.stdin.write(options.stdin);
    }
    child.stdin.end();
  });

const executeCpp = async (workDir, code, stdin) => {
  try {
    console.log("[executeCpp] ENTER");
    console.log(`[executeCpp] Source code length (chars): ${code.length}`);
    console.log(`[executeCpp] Current COMPILE_TIMEOUT_MS: ${COMPILE_TIMEOUT_MS}ms`);

    const sourceFile = path.join(workDir, 'main.cpp');
    const binaryFile = path.join(workDir, process.platform === 'win32' ? 'main.exe' : 'main');

    console.log("[executeCpp] Writing source");
    await fs.writeFile(sourceFile, code, 'utf8');
    console.log("[executeCpp] Source written");

    console.log(`[executeCpp] Written source file to ${sourceFile}. Total chars: ${code.length}`);
    console.log(`[executeCpp] Exact main.cpp source:\n${code}\n[executeCpp] --- End of main.cpp ---`);

    console.log("[executeCpp] Starting g++ compile");
    const compile = await runCommand('g++', ['-std=c++17', '-O2', sourceFile, '-o', binaryFile], {
      cwd: workDir,
      timeoutMs: COMPILE_TIMEOUT_MS,
    });

    console.log("[executeCpp] Compile completed");
    console.log(JSON.stringify(compile, null, 2));

    if (compile.timedOut) {
      console.error(`[executeCpp] Compilation timed out after ${COMPILE_TIMEOUT_MS}ms`);
      return {
        statusId: 6,
        statusDesc: 'Compilation Error',
        stdout: '',
        stderr: `Compilation timed out after ${COMPILE_TIMEOUT_MS}ms. Render free-tier CPU limit may have throttled the compiler.`,
        time: 0,
      };
    }

    if (compile.code !== 0) {
      return {
        statusId: 6,
        statusDesc: 'Compilation Error',
        stdout: '',
        stderr: (compile.stderr || 'Compilation failed').trim(),
        time: 0,
      };
    }

    const run = await runCommand(binaryFile, [], { cwd: workDir, stdin, timeoutMs: RUN_TIMEOUT_MS });
    if (run.timedOut) {
      return { statusId: 5, statusDesc: 'Time Limit Exceeded', stdout: run.stdout.trim(), stderr: '', time: run.timeSeconds };
    }
    return {
      statusId: run.code === 0 ? 3 : 11,
      statusDesc: run.code === 0 ? 'Accepted' : 'Runtime Error',
      stdout: run.stdout.trim(),
      stderr: run.stderr.trim(),
      time: run.timeSeconds,
    };
  } catch (err) {
    console.error(
      "[executeCpp] FATAL ERROR",
      err,
      err.stack
    );
    return {
      statusId: 6,
      statusDesc: "Compilation Error",
      stderr: String(err)
    };
  }
};

const executeJava = async (workDir, code, stdin) => {
  const sourceFile = path.join(workDir, 'Main.java');
  await fs.writeFile(sourceFile, code, 'utf8');

  const compile = await runCommand('javac', [sourceFile], { cwd: workDir, timeoutMs: COMPILE_TIMEOUT_MS });
  if (compile.code !== 0) {
    return {
      statusId: 6,
      statusDesc: 'Compilation Error',
      stdout: '',
      stderr: (compile.stderr || 'Compilation failed').trim(),
      time: 0,
    };
  }

  const run = await runCommand('java', ['-cp', workDir, 'Main'], { cwd: workDir, stdin, timeoutMs: RUN_TIMEOUT_MS });
  if (run.timedOut) {
    return { statusId: 5, statusDesc: 'Time Limit Exceeded', stdout: run.stdout.trim(), stderr: '', time: run.timeSeconds };
  }
  return {
    statusId: run.code === 0 ? 3 : 11,
    statusDesc: run.code === 0 ? 'Accepted' : 'Runtime Error',
    stdout: run.stdout.trim(),
    stderr: run.stderr.trim(),
    time: run.timeSeconds,
  };
};

const executePython = async (workDir, code, stdin) => {
  const sourceFile = path.join(workDir, 'main.py');
  await fs.writeFile(sourceFile, code, 'utf8');

  const run = await runCommand('python', [sourceFile], { cwd: workDir, stdin, timeoutMs: RUN_TIMEOUT_MS });
  if (run.timedOut) {
    return { statusId: 5, statusDesc: 'Time Limit Exceeded', stdout: run.stdout.trim(), stderr: '', time: run.timeSeconds };
  }
  return {
    statusId: run.code === 0 ? 3 : 11,
    statusDesc: run.code === 0 ? 'Accepted' : 'Runtime Error',
    stdout: run.stdout.trim(),
    stderr: run.stderr.trim(),
    time: run.timeSeconds,
  };
};

const executeJavaScript = async (workDir, code, stdin) => {
  const sourceFile = path.join(workDir, 'main.js');
  await fs.writeFile(sourceFile, code, 'utf8');

  const run = await runCommand('node', [sourceFile], { cwd: workDir, stdin, timeoutMs: RUN_TIMEOUT_MS });
  if (run.timedOut) {
    return { statusId: 5, statusDesc: 'Time Limit Exceeded', stdout: run.stdout.trim(), stderr: '', time: run.timeSeconds };
  }
  return {
    statusId: run.code === 0 ? 3 : 11,
    statusDesc: run.code === 0 ? 'Accepted' : 'Runtime Error',
    stdout: run.stdout.trim(),
    stderr: run.stderr.trim(),
    time: run.timeSeconds,
  };
};

const executeCode = async (code, language, stdin) => {
  if (!LANGUAGE_IDS[language]) throw new Error('Unsupported language: ' + language);

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dsa-judge-'));
  try {
    if (language === 'cpp') return await executeCpp(workDir, code, stdin || '');
    if (language === 'java') return await executeJava(workDir, code, stdin || '');
    if (language === 'python') return await executePython(workDir, code, stdin || '');
    if (language === 'javascript') return await executeJavaScript(workDir, code, stdin || '');

    throw new Error('Unsupported language: ' + language);
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
};

module.exports = { executeCode, LANGUAGE_IDS };
