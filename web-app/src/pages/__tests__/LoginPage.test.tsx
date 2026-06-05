import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginPage } from "../LoginPage";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/components/AuthShell", () => ({
  AuthShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/OAuthButton", () => ({
  OAuthButton: () => null,
}));

vi.mock("@/i18n/useT", () => ({
  useT: () => (key: string) => key,
}));

const mockSignIn = vi.fn();
const mockNavigate = vi.fn();
let mockLoading = false;

vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: () => ({ signIn: mockSignIn, loading: mockLoading }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup() {
  render(<LoginPage />);
}

function getEmailInput() {
  return screen.getByLabelText("auth.email") as HTMLInputElement;
}

function getPasswordInput() {
  return screen.getByLabelText("auth.password") as HTMLInputElement;
}

function getSubmitBtn() {
  return screen.getByRole("button", { name: /auth\.login\.btn|…/ });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn.mockResolvedValue(undefined);
    mockLoading = false;
  });

  it("renders email and password fields", () => {
    setup();
    expect(getEmailInput()).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
  });

  it("renders the sign-in button", () => {
    setup();
    expect(screen.getByRole("button", { name: "auth.login.btn" })).toBeInTheDocument();
  });

  it("disables the submit button while loading", () => {
    mockLoading = true;
    setup();
    expect(screen.getByRole("button", { name: "…" })).toBeDisabled();
  });

  it("calls signIn with the typed credentials on submit", async () => {
    setup();
    fireEvent.change(getEmailInput(), { target: { value: "user@example.com" } });
    fireEvent.change(getPasswordInput(), { target: { value: "secret123" } });
    fireEvent.click(getSubmitBtn());
    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith("user@example.com", "secret123"),
    );
  });

  it("navigates to /today on successful sign-in", async () => {
    setup();
    fireEvent.click(getSubmitBtn());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/today"));
  });

  it("does not navigate when signIn throws", async () => {
    mockSignIn.mockRejectedValueOnce(new Error("Invalid credentials"));
    setup();
    fireEvent.click(getSubmitBtn());
    await waitFor(() => expect(mockSignIn).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("renders no inline error element after a failed sign-in", async () => {
    mockSignIn.mockRejectedValueOnce(new Error("Bad password"));
    setup();
    fireEvent.click(getSubmitBtn());
    await waitFor(() => expect(mockSignIn).toHaveBeenCalled());
    // No inline error box — errors go exclusively through ToastStack
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(document.querySelector("[data-error]")).toBeNull();
  });
});
