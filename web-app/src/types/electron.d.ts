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
    };
  }
}

declare module "react" {
  interface CSSProperties {
    WebkitAppRegion?: "drag" | "no-drag";
  }
}
