import { useEffect, useState } from "react";
import { getProfilePicture, onProfilePictureChange, SIZE_PX, type ProfilePicture } from "@/lib/profile-picture";

export function AboutProject() {
  const [pic, setPic] = useState<ProfilePicture>({ src: null, size: "md" });

  useEffect(() => {
    setPic(getProfilePicture());
    return onProfilePictureChange(() => setPic(getProfilePicture()));
  }, []);

  const px = SIZE_PX[pic.size];

  return (
    <section
      className="mb-12 rounded-2xl border border-primary/20 p-6 sm:p-8"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklab, var(--primary) 10%, transparent), color-mix(in oklab, var(--accent) 8%, transparent))",
      }}
    >
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div
          className="shrink-0 overflow-hidden rounded-full border-2 border-primary/40 shadow-lg"
          style={{ width: px, height: px }}
        >
          {pic.src ? (
            <img src={pic.src} alt="Author profile" className="h-full w-full object-cover" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center font-display font-bold text-primary-foreground gradient-primary"
              style={{ fontSize: Math.round(px * 0.4) }}
            >
              AG
            </div>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">About This Project</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            This DApp was developed as my final-year dissertation project for the HTTC Computer Science
            Department at the University of Bamenda. It demonstrates a blockchain-based voting system where
            votes are recorded immutably on the Ethereum Sepolia testnet, ensuring transparency, security,
            and auditability. The system uses smart contracts to enforce one-person-one-vote rules and
            allows voters to verify their votes on-chain.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">🔗 Blockchain Verified</span>
            <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">🛡️ Tamper-Proof</span>
            <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">👁️ Transparent</span>
          </div>

          <p className="mt-4 text-sm italic text-muted-foreground sm:text-right">
            — AYEMELONG SELOBIE GHISLAIN
          </p>
        </div>
      </div>
    </section>
  );
}
