export {};

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isElectron: true;
      getApiPort: () => Promise<number>;
      enterFocusMode: () => void;
      exitFocusMode: () => void;
      /** Returns the absolute path to lumo.db currently in use. */
      getDbPath: () => Promise<string>;
      /**
       * Opens a native folder-picker dialog.
       * Resolves to the selected folder path, or null if cancelled.
       */
      chooseDbFolder: () => Promise<string | null>;
      /**
       * Copies lumo.db to newDir, saves the preference, and relaunches the app.
       */
      moveDbTo: (newDir: string) => Promise<{ ok: boolean; error?: string }>;
      /** Reveals lumo.db in Finder / Explorer. */
      showDbInFolder: () => void;
    };
  }
}

declare module "react" {
  interface CSSProperties {
    WebkitAppRegion?: "drag" | "no-drag";
  }
}
