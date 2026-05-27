const { app, BrowserWindow, shell, ipcMain, utilityProcess, screen, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const crypto = require("crypto");
const net = require("net");

// ── JWT secret ────────────────────────────────────────────────────────────────

function getOrCreateJwtSecret() {
  const secretPath = path.join(app.getPath("userData"), "jwt.secret");
  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, "utf8").trim();
  }
  const secret = crypto.randomBytes(48).toString("hex");
  fs.writeFileSync(secretPath, secret, { mode: 0o600 });
  return secret;
}

// ── Free port finder ──────────────────────────────────────────────────────────

function findFreePort(preferred) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => {
      const fallback = net.createServer();
      fallback.unref();
      fallback.listen(0, "127.0.0.1", () => {
        const { port } = fallback.address();
        fallback.close(() => resolve(port));
      });
    });
    server.listen(preferred, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

// ── Wait for TCP port ─────────────────────────────────────────────────────────

function waitForPort(port, timeout) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout;
    function attempt() {
      const sock = net.connect({ port, host: "127.0.0.1" });
      sock.on("connect", () => { sock.destroy(); resolve(); });
      sock.on("error", () => {
        if (Date.now() > deadline) return reject(new Error("Backend did not start in time"));
        setTimeout(attempt, 200);
      });
    }
    attempt();
  });
}

// ── Database path (supports user-customisable location) ───────────────────────

/**
 * Returns the SQLite database file path.
 *
 * Priority:
 *   1. User's saved preference  → userData/storage.json { dbDir: "/path/..." }
 *   2. Default                  → userData/lumo.db
 */
function getDbPath() {
  const prefPath = path.join(app.getPath("userData"), "storage.json");
  if (fs.existsSync(prefPath)) {
    try {
      const prefs = JSON.parse(fs.readFileSync(prefPath, "utf8"));
      if (prefs.dbDir && typeof prefs.dbDir === "string") {
        return path.join(prefs.dbDir, "lumo.db");
      }
    } catch {
      // Malformed prefs — fall through to default
    }
  }
  return path.join(app.getPath("userData"), "lumo.db");
}

function saveDbDirPref(dbDir) {
  const prefPath = path.join(app.getPath("userData"), "storage.json");
  fs.writeFileSync(prefPath, JSON.stringify({ dbDir }), { encoding: "utf8", mode: 0o600 });
}

// ── Backend process ───────────────────────────────────────────────────────────

let backendProcess = null;
let apiPort = 47291;

async function startBackend() {
  apiPort = await findFreePort(47291);
  const dbPath = getDbPath();
  const jwtSecret = getOrCreateJwtSecret();

  const env = {
    ...process.env,
    LUMO_PORT: String(apiPort),
    LUMO_DB_PATH: dbPath,
    LUMO_JWT_SECRET: jwtSecret,
  };

  if (app.isPackaged) {
    // ── Packaged: use Electron's built-in Node.js via utilityProcess.fork() ───
    // This avoids requiring the user to have Node.js installed separately.
    const backendEntry = path.join(process.resourcesPath, "backend", "bundle.cjs");

    backendProcess = utilityProcess.fork(backendEntry, [], { env, stdio: "pipe" });
    backendProcess.stdout?.on("data", (d) => process.stdout.write("[backend] " + d));
    backendProcess.stderr?.on("data", (d) => process.stderr.write("[backend] " + d));
    backendProcess.on("exit", (code) => {
      if (code !== 0) console.error(`[backend] exited with code ${code}`);
    });
  } else {
    // ── Dev: use tsx with system Node.js ──────────────────────────────────────
    const distEntry = path.join(__dirname, "../../backend/dist/index.js");
    const tsxBin = path.join(__dirname, "../../backend/node_modules/.bin/tsx");
    const tsSrc = path.join(__dirname, "../../backend/src/index.ts");

    let cmd, args;
    if (fs.existsSync(distEntry)) {
      // prefer compiled dist if available
      cmd = process.execPath; // system node (not Electron when run via `electron .`)
      args = [distEntry];
      // In Electron dev (run as `electron .`), process.execPath IS the electron binary.
      // Fall through to tsx in that case:
      if (process.execPath.toLowerCase().includes("electron")) {
        cmd = fs.existsSync(tsxBin) ? tsxBin : "tsx";
        args = [tsSrc];
      }
    } else {
      cmd = fs.existsSync(tsxBin) ? tsxBin : "tsx";
      args = [tsSrc];
    }

    backendProcess = spawn(cmd, args, { env, stdio: "pipe" });
    backendProcess.stdout.on("data", (d) => process.stdout.write("[backend] " + d));
    backendProcess.stderr.on("data", (d) => process.stderr.write("[backend] " + d));
    backendProcess.on("exit", (code) => {
      if (code !== 0) console.error(`[backend] exited with code ${code}`);
    });
  }

  await waitForPort(apiPort, 15000);
}

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Lumo Task",
    backgroundColor: "#080b0a",
    frame: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  win.loadFile(path.join(__dirname, "../dist/index.html"));

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  ipcMain.on("win:minimize", () => win.minimize());
  ipcMain.on("win:maximize", () => {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.on("win:close", () => win.close());

  ipcMain.handle("get-api-port", () => apiPort);

  // ── Storage / database path IPC ───────────────────────────────────────────

  /** Returns the absolute path to lumo.db currently in use. */
  ipcMain.handle("db:getPath", () => getDbPath());

  /**
   * Opens a native folder-picker dialog.
   * Returns the selected folder path, or null if the user cancelled.
   */
  ipcMain.handle("db:chooseFolder", async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory", "createDirectory"],
      title: "Choose Lumo Database Location",
      buttonLabel: "Select Folder",
    });
    return result.canceled ? null : result.filePaths[0];
  });

  /**
   * Copies lumo.db to newDir, saves the path preference, then relaunches the app.
   * The copy is atomic from the user's perspective because the app restarts.
   */
  ipcMain.handle("db:moveTo", async (_event, newDir) => {
    if (!newDir || typeof newDir !== "string") return { ok: false, error: "Invalid path" };
    const currentDbPath = getDbPath();
    const newDbPath = path.join(newDir, "lumo.db");

    try {
      // Ensure destination directory exists
      fs.mkdirSync(newDir, { recursive: true });

      // Copy current DB to new location (keeps original as safety backup)
      fs.copyFileSync(currentDbPath, newDbPath);

      // Persist the new preference
      saveDbDirPref(newDir);

      // Relaunch so the backend starts with the new LUMO_DB_PATH
      app.relaunch();
      app.exit(0);
      return { ok: true };
    } catch (err) {
      console.error("[db:moveTo] failed:", err);
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  /** Reveals lumo.db in Finder / Explorer. */
  ipcMain.on("db:showInFolder", () => {
    shell.showItemInFolder(getDbPath());
  });

  // ── Pet focus compact mode ────────────────────────────────────────────────
  let savedBounds = null;
  ipcMain.on("win:enter-focus", () => {
    savedBounds = win.getBounds();
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    win.setMinimumSize(1, 1);
    win.setAlwaysOnTop(true, "floating");
    win.setSize(220, 300, true);
    win.setPosition(width - 240, height - 320);
  });
  ipcMain.on("win:exit-focus", () => {
    win.setAlwaysOnTop(false);
    win.setMinimumSize(900, 600);
    if (savedBounds) {
      win.setBounds(savedBounds, true);
      savedBounds = null;
    } else {
      win.setSize(1280, 800, true);
      win.center();
    }
  });
}

app.whenReady().then(async () => {
  try {
    await startBackend();
  } catch (err) {
    console.error("Failed to start backend:", err);
  }
  createWindow();
});

app.on("window-all-closed", () => {
  if (backendProcess) {
    try { backendProcess.kill(); } catch {}
  }
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
