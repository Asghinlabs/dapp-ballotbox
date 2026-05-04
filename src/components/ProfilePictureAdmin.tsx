import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ALLOWED_TYPES,
  MAX_BYTES,
  SIZE_LABEL,
  SIZE_PX,
  clearProfilePicture,
  getProfilePicture,
  setProfilePicture,
  type ProfileSize,
} from "@/lib/profile-picture";

export function ProfilePictureAdmin() {
  const [src, setSrc] = useState<string | null>(null);
  const [size, setSize] = useState<ProfileSize>("md");
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cur = getProfilePicture();
    setSrc(cur.src);
    setSize(cur.size);
  }, []);

  const handleFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Unsupported format. Use JPG, PNG, or GIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image is too large. Maximum size is 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(typeof reader.result === "string" ? reader.result : null);
      setDirty(true);
    };
    reader.onerror = () => toast.error("Failed to read image file");
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setProfilePicture({ src, size });
    setDirty(false);
    toast.success("Profile picture settings saved");
  };

  const handleRemove = () => {
    setSrc(null);
    setSize("md");
    clearProfilePicture();
    if (fileRef.current) fileRef.current.value = "";
    setDirty(false);
    toast.info("Reverted to default avatar");
  };

  const px = SIZE_PX[size];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="glass rounded-2xl p-6">
        <h2 className="mb-4 font-display text-lg font-bold">Profile Picture Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs text-muted-foreground">Upload picture (JPG, PNG, GIF — max 2MB)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/gif"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs text-muted-foreground">Picture size</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(SIZE_PX) as ProfileSize[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSize(s);
                    setDirty(true);
                  }}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    size === s
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  {SIZE_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={handleSave} disabled={!dirty} className="gradient-primary border-0 text-primary-foreground">
              Save
            </Button>
            <Button variant="outline" onClick={handleRemove} className="border-destructive/40 text-destructive hover:bg-destructive/10">
              Remove Picture
            </Button>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="mb-4 font-display text-lg font-bold">Live Preview</h2>
        <div className="flex flex-col items-center justify-center gap-4 py-6">
          <div
            className="overflow-hidden rounded-full border-2 border-primary/40 shadow-lg"
            style={{ width: px, height: px }}
          >
            {src ? (
              <img src={src} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center font-display font-bold text-primary-foreground gradient-primary"
                style={{ fontSize: Math.round(px * 0.4) }}
              >
                AG
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{SIZE_LABEL[size]}</p>
        </div>
      </div>
    </div>
  );
}
