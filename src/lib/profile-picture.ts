import { supabase } from "@/integrations/supabase/client";

export type ProfileSize = "sm" | "md" | "lg";

export const SIZE_PX: Record<ProfileSize, number> = { sm: 80, md: 120, lg: 160 };
export const SIZE_LABEL: Record<ProfileSize, string> = {
  sm: "Small (80px)",
  md: "Medium (120px)",
  lg: "Large (160px)",
};

export const MAX_BYTES = 2 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/gif"];

const BUCKET = "profile-pictures";
const SETTINGS_KEY = "about_profile_picture";
const EVENT = "profile-picture-updated";

export interface ProfilePicture {
  src: string | null;
  size: ProfileSize;
}

interface SettingsValue {
  path: string | null;
  size: ProfileSize;
}

function pubUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Cache-bust so newly uploaded pictures show up immediately
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function fetchProfilePicture(): Promise<ProfilePicture> {
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();
    const v = (data?.value ?? null) as SettingsValue | null;
    if (!v) return { src: null, size: "md" };
    const size: ProfileSize = v.size === "sm" || v.size === "lg" ? v.size : "md";
    return { src: pubUrl(v.path), size };
  } catch {
    return { src: null, size: "md" };
  }
}

export async function uploadProfilePicture(file: File, size: ProfileSize): Promise<ProfilePicture> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `about/profile-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
  if (upErr) throw upErr;

  const { error: setErr } = await supabase
    .from("app_settings")
    .upsert({ key: SETTINGS_KEY, value: { path, size } as unknown as import("@/integrations/supabase/types").Json, updated_at: new Date().toISOString() });
  if (setErr) throw setErr;

  notifyChange();
  return { src: pubUrl(path), size };
}

export async function updateProfilePictureSize(size: ProfileSize): Promise<void> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();
  const cur = (data?.value ?? null) as SettingsValue | null;
  const next: SettingsValue = { path: cur?.path ?? null, size };
  await supabase.from("app_settings").upsert({
    key: SETTINGS_KEY,
    value: next,
    updated_at: new Date().toISOString(),
  });
  notifyChange();
}

export async function clearProfilePicture(): Promise<void> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();
  const cur = (data?.value ?? null) as SettingsValue | null;
  if (cur?.path) {
    await supabase.storage.from(BUCKET).remove([cur.path]);
  }
  await supabase.from("app_settings").upsert({
    key: SETTINGS_KEY,
    value: { path: null, size: "md" } as unknown as import("@/integrations/supabase/types").Json,
    updated_at: new Date().toISOString(),
  });
  notifyChange();
}

function notifyChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

export function onProfilePictureChange(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
