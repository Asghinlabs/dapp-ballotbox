export type ProfileSize = "sm" | "md" | "lg";

export const SIZE_PX: Record<ProfileSize, number> = {
  sm: 80,
  md: 120,
  lg: 160,
};

export const SIZE_LABEL: Record<ProfileSize, string> = {
  sm: "Small (80px)",
  md: "Medium (120px)",
  lg: "Large (160px)",
};

export const MAX_BYTES = 2 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/gif"];

const KEY = "aboutProfilePicture";
const EVENT = "profile-picture-updated";

export interface ProfilePicture {
  src: string | null;
  size: ProfileSize;
}

export function getProfilePicture(): ProfilePicture {
  if (typeof window === "undefined") return { src: null, size: "md" };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { src: null, size: "md" };
    const parsed = JSON.parse(raw);
    const size: ProfileSize = parsed?.size === "sm" || parsed?.size === "lg" ? parsed.size : "md";
    const src = typeof parsed?.src === "string" ? parsed.src : null;
    return { src, size };
  } catch {
    return { src: null, size: "md" };
  }
}

export function setProfilePicture(value: ProfilePicture) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {}
}

export function clearProfilePicture() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {}
}

export function onProfilePictureChange(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
