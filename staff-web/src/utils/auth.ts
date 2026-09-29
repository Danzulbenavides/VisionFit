export interface StoredUser {
  _id?: string;
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

// This website is for STAFF accounts only
export const ALLOWED_ROLES = ["STAFF"];

export const getStoredUser = (): StoredUser | null => {
  const raw = sessionStorage.getItem("staffUser");

  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
};

export const getRole = (): string => getStoredUser()?.role ?? "";
