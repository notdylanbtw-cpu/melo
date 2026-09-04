const key = (userId: string) => `melo-2fa:${userId}`;

export function hasTwoFactorOk(userId: string) {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(key(userId)) === "1";
  } catch {
    return false;
  }
}

export function markTwoFactorOk(userId: string) {
  try {
    sessionStorage.setItem(key(userId), "1");
  } catch {
    /* ignore */
  }
}
