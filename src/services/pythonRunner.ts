// Lazy load Pyodide to avoid blocking app startup
let pyodideModule: typeof import("pyodide") | null = null;

async function loadPyodideModule() {
  if (!pyodideModule) {
    pyodideModule = await import("pyodide");
  }
  return pyodideModule;
}

import { logger } from "./logger";

class PythonRunner {
  private pyodide: any = null; // PyodideInterface
  private isInitializing = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.pyodide) {
      return;
    }

    if (this.isInitializing && this.initializationPromise) {
      return this.initializationPromise;
    }

    this.isInitializing = true;
    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      logger.log("system", "info", "Initializing Pyodide...");
      const pyodideModule = await loadPyodideModule();
      this.pyodide = await pyodideModule.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
      });

      // Set up basic environment
      this.pyodide.runPython(`
import sys
import io
from contextlib import redirect_stdout, redirect_stderr

class OutputCapture:
    def __init__(self):
        self.stdout = []
        self.stderr = []
    
    def write(self, s):
        if s:
            self.stdout.append(s)
    
    def flush(self):
        pass

capture = OutputCapture()
sys.stdout = capture
sys.stderr = capture
      `);

      logger.log("system", "info", "Pyodide initialized successfully");
    } catch (error) {
      logger.log("system", "error", "Failed to initialize Pyodide", { error });
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  async runCode(code: string): Promise<{ output: string; error: string; result: unknown }> {
    if (!this.pyodide) {
      await this.initialize();
    }

    if (!this.pyodide) {
      throw new Error("Pyodide not initialized");
    }

    try {
      // Clear previous output
      this.pyodide.runPython("capture.stdout = []; capture.stderr = []");

      // Run the code
      const result = this.pyodide.runPython(code);

      // Get captured output
      const stdout = this.pyodide.runPython("''.join(capture.stdout)");
      const stderr = this.pyodide.runPython("''.join(capture.stderr)");

      logger.log("system", "debug", "Python code executed", {
        codeLength: code.length,
        hasOutput: !!stdout,
        hasError: !!stderr,
      });

      return {
        output: stdout || "",
        error: stderr || "",
        result: result?.toJs ? result.toJs({ dict_converter: Object.fromEntries }) : result,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.log("system", "error", "Python execution error", { error: errorMsg });
      return {
        output: "",
        error: errorMsg,
        result: null,
      };
    }
  }

  async installPackage(packageName: string): Promise<void> {
    if (!this.pyodide) {
      await this.initialize();
    }

    if (!this.pyodide) {
      throw new Error("Pyodide not initialized");
    }

    try {
      await this.pyodide.loadPackage("micropip");
      await this.pyodide.runPythonAsync(`
import micropip
await micropip.install('${packageName}')
      `);
      logger.log("system", "info", "Python package installed", { package: packageName });
    } catch (error) {
      logger.log("system", "error", "Failed to install Python package", {
        package: packageName,
        error,
      });
      throw error;
    }
  }

  isReady(): boolean {
    return this.pyodide !== null;
  }
}

export const pythonRunner = new PythonRunner();

