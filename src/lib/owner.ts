import { safeStorage } from "./safe-storage";

export const OWNER_USERNAME = "Ghostinfinite01";
export const OWNER_PASSWORD = "Ghost2436$$";
export const OWNER_SESSION_KEY = "cof_owner_session";
export const OWNER_USERNAME_KEY = "cof_owner_username";
export const OWNER_PASSWORD_KEY = "cof_owner_password";

export function isOwnerSession(): boolean {
  if (typeof window === "undefined") return false;
  return safeStorage.getItem(OWNER_SESSION_KEY) === "true";
}

export function ownerLogin(username: string, password: string): boolean {
  const ok = username === OWNER_USERNAME && password === OWNER_PASSWORD;
  if (ok && typeof window !== "undefined") {
    safeStorage.setItem(OWNER_SESSION_KEY, "true");
    safeStorage.setItem(OWNER_USERNAME_KEY, username);
    safeStorage.setItem(OWNER_PASSWORD_KEY, password);
  }
  return ok;
}

export function getOwnerCredentials() {
  if (typeof window === "undefined") return { username: OWNER_USERNAME, password: OWNER_PASSWORD };
  return {
    username: safeStorage.getItem(OWNER_USERNAME_KEY) || OWNER_USERNAME,
    password: safeStorage.getItem(OWNER_PASSWORD_KEY) || OWNER_PASSWORD,
  };
}

export function ownerLogout() {
  if (typeof window !== "undefined") {
    safeStorage.removeItem(OWNER_SESSION_KEY);
    safeStorage.removeItem(OWNER_USERNAME_KEY);
    safeStorage.removeItem(OWNER_PASSWORD_KEY);
  }
}
