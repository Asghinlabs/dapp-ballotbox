# Plan: About section, footer update, stats bar, profile picture controls, live election

## 1. Footer update (`src/routes/index.tsx`)

Replace the current footer text "ChainVote · Sepolia Testnet" with:

- Line 1: `© 2026 AYEMELONG SELOBIE GHISLAIN — HTTC, Department of Computer Science, University of Bamenda`
- Line 2: `Contract: 0x4C462Ebd0238964D26cd0CF1591956956BE78486` (linked to Sepolia Etherscan, monospace, muted)

The Force Sepolia toggle stays below.

Note: there is no existing contract-address line in the footer today. I'll add it as part of this change so the footer ends up with the requested copyright line and a contract address line beneath it.

## 2. New `ProfilePictureSettings` helpers (`src/lib/profile-picture.ts`)

Small shared module:

- `getProfilePicture()` → `{ src: string | null, size: 'sm' | 'md' | 'lg' }` from `localStorage` key `aboutProfilePicture` (JSON).
- `setProfilePicture(src, size)` and `clearProfilePicture()`.
- `SIZE_PX = { sm: 80, md: 120, lg: 160 }`.
- Default size: `md`. Default picture: `null` → render initials `AG` placeholder.

Storage shape: `{ src: "data:image/...;base64,...", size: "md" }`. Stored as Base64 data URL. Validation: max 2 MB, types `image/jpeg|png|gif`.

## 3. `AboutProject` component (`src/components/AboutProject.tsx`)

New component rendered on the home page between the wallet/connect block and the elections sections (and after the new stats bar — see step 4). Layout:

- Container: rounded-2xl, gradient background (subtle primary→accent), padding 24 px.
- Two-column on `sm:` and up (picture left, text right). Stacked & centered on mobile.
- Picture: circle, 2 px primary border, size from saved setting (default 120 px). Falls back to initials "AG" on a gradient circle when no picture is set.
- Heading: "About This Project".
- Description: the dissertation paragraph from the request.
- Three pill tags: 🔗 Blockchain Verified · 🛡️ Tamper-Proof · 👁️ Transparent.
- Signature line: `— AYEMELONG SELOBIE GHISLAIN`, italic, right-aligned on desktop.
- Reads from `getProfilePicture()` on mount and listens for a `profile-picture-updated` window event so admin edits reflect live.

## 4. Stats bar on home page (`src/routes/index.tsx`)

Add a small 3-column stats strip just under the connect/welcome card, before `AboutProject`:

```text
[ Active: N ] [ Upcoming: N ] [ Completed: N ]
```

Uses the existing `activeElections`, `upcomingElections`, `endedElections` arrays. Glass card style, color-coded (green/yellow/red) consistent with status badges.

## 5. Admin "Profile Picture Settings" tab (`src/routes/admin.tsx`)

Add a new tab `profile` to the existing tab strip. Renders a new component `ProfilePictureAdmin`.

`src/components/ProfilePictureAdmin.tsx`:

- File `<input type="file" accept="image/jpeg,image/png,image/gif">` + "Upload Picture" button.
- Validates type and 2 MB max; toasts on failure.
- Reads file as Base64 via `FileReader`.
- Three radio buttons / segmented control: Small (80) · Medium (120) · Large (160). Default Medium.
- Live preview circle using current selection.
- "Remove Picture" → clears stored image, reverts to `AG` placeholder.
- "Save" → writes to localStorage and dispatches `profile-picture-updated` event so the home page updates without reload.
- Whole tab guarded by existing `isAdmin` check (already enforced at the page level).

## 6. Create the live election

Use the existing admin "Create" flow on-chain (this requires an admin wallet transaction; cannot be done from code). I'll call this out in the delivery message: after the build is live, the admin (you) opens Admin → Create with these values prefilled is not possible automatically, so I'll instead document the exact inputs to paste:

- Title: `Departmental Representative Election 2026`
- Description: `Vote for your next departmental representative. Blockchain-secured voting demonstration.`
- Start: today (now + 1 min)
- End: +7 days
- Candidates: Alice Nkem, Brian Tita, Carol Mbarga (with provided descriptions)
- Then click **Start** on the new election row.

Optionally I can add a one-click "Seed demo election" button in the admin Create tab that prefills these fields (still requires admin to sign the txs). I'll include that button.

## 7. Home page render order (final)

1. Hero (title + description)
2. Connect card OR connected card
3. Stats bar (Active / Upcoming / Completed)
4. AboutProject section
5. Active / Upcoming / Ended election sections
6. Footer (new copyright + contract line)

## Files touched

- `src/routes/index.tsx` — footer text, stats bar, render `<AboutProject />`.
- `src/routes/admin.tsx` — new `profile` tab + "Seed demo election" button in Create tab.
- `src/components/AboutProject.tsx` — new.
- `src/components/ProfilePictureAdmin.tsx` — new.
- `src/lib/profile-picture.ts` — new.

No changes to `web3-context`, contract code, voting flow, or wallet logic.