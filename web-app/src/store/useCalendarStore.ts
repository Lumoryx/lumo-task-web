import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";

export interface OutlookEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  isAllDay?: boolean;
}

interface CalendarStore {
  connected: boolean;
  userEmail: string | null;
  events: OutlookEvent[];
  loading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  fetchEvents: (startISO: string, endISO: string) => Promise<void>;
}

const CLIENT_ID = (import.meta as any).env?.VITE_MS_CLIENT_ID as string | undefined;
const SCOPES = ["Calendars.Read", "User.Read"];

let _msal: PublicClientApplication | null = null;
let _initialized = false;

async function ensureMsal(): Promise<PublicClientApplication> {
  if (!CLIENT_ID) throw new Error("VITE_MS_CLIENT_ID not configured");
  if (!_msal) {
    _msal = new PublicClientApplication({
      auth: {
        clientId: CLIENT_ID,
        authority: "https://login.microsoftonline.com/common",
        redirectUri: window.location.origin,
      },
      cache: { cacheLocation: "localStorage" },
    });
  }
  if (!_initialized) {
    await _msal.initialize();
    _initialized = true;
  }
  return _msal;
}

async function getToken(): Promise<string> {
  const msal = await ensureMsal();
  const accounts = msal.getAllAccounts();
  if (accounts.length === 0) throw new Error("No MSAL accounts — reconnect required");
  try {
    const r = await msal.acquireTokenSilent({ scopes: SCOPES, account: accounts[0] });
    return r.accessToken;
  } catch (e) {
    if (e instanceof InteractionRequiredAuthError) {
      const r = await msal.acquireTokenPopup({ scopes: SCOPES });
      return r.accessToken;
    }
    throw e;
  }
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      connected: false,
      userEmail: null,
      events: [],
      loading: false,
      error: null,

      async connect() {
        set({ loading: true, error: null });
        try {
          const msal = await ensureMsal();
          const result = await msal.loginPopup({ scopes: SCOPES });
          set({
            connected: true,
            userEmail: result.account?.username ?? null,
            loading: false,
          });
        } catch (e) {
          set({ loading: false, error: e instanceof Error ? e.message : String(e) });
          throw e;
        }
      },

      disconnect() {
        _msal = null;
        _initialized = false;
        set({ connected: false, userEmail: null, events: [], error: null });
      },

      async fetchEvents(startISO, endISO) {
        if (!get().connected) return;
        set({ loading: true, error: null });
        try {
          const token = await getToken();
          const url =
            `https://graph.microsoft.com/v1.0/me/calendarView` +
            `?startDateTime=${encodeURIComponent(startISO)}` +
            `&endDateTime=${encodeURIComponent(endISO)}` +
            `&$select=id,subject,start,end,location,isAllDay` +
            `&$orderby=start/dateTime` +
            `&$top=100`;
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error(`Graph API error ${res.status}`);
          const data = await res.json();
          set({ events: data.value ?? [], loading: false });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes("No MSAL accounts")) {
            set({ connected: false, loading: false, error: msg });
          } else {
            set({ loading: false, error: msg });
          }
        }
      },
    }),
    {
      name: "lumo-outlook",
      partialize: (s) => ({ connected: s.connected, userEmail: s.userEmail }),
    }
  )
);
