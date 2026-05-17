const { app, BrowserWindow, shell, ipcMain } = require("electron");
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

// ── Find node.exe ─────────────────────────────────────────────────────────────

function findNodeExe() {
  // Try paths where Node.js is commonly installed on Windows
  const candidates = [
    // Bundled alongside Electron binary (some setups)
    path.join(path.dirname(process.execPath), "node.exe"),
    // Common install locations
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "nodejs", "node.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Programs", "nodejs", "node.exe"),
    path.join(process.env.LOCALAPPDATA || "", "nvm", "current", "node.exe"),
  ];

  // Also try resolving from PATH
  const pathDirs = (process.env.PATH || "").split(path.delimiter);
  for (const dir of pathDirs) {
    candidates.push(path.join(dir, "node.exe"), path.join(dir, "node"));
  }

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  // Fallback: hope 'node' is in PATH
  return "node";
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

// ── Backend process ───────────────────────────────────────────────────────────

let backendProcess = null;
let apiPort = 47291;

async function startBackend() {
  apiPort = await findFreePort(47291);
  const dbPath = path.join(app.getPath("userData"), "lumo.db");
  const jwtSecret = getOrCreateJwtSecret();

  const env = {
    ...process.env,
    LUMO_PORT: String(apiPort),
    LUMO_DB_PATH: dbPath,
    LUMO_JWT_SECRET: jwtSecret,
  };

  if (app.isPackaged) {
    // ── Packaged: spawn with system Node.js or embedded node in Electron ──────
    const backendEntry = path.join(process.resourcesPath, "backend", "bundle.cjs");
    const nodeExe = findNodeExe();

    backendProcess = spawn(nodeExe, [backendEntry], { env, stdio: "pipe" });
    backendProcess.stdout.on("data", (d) => process.stdout.write("[backend] " + d));
    backendProcess.stderr.on("data", (d) => process.stderr.write("[backend] " + d));
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
