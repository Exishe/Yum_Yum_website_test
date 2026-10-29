"use client";

import { useState } from "react";
import { useAdminT } from "./AdminLang";

const MAX_SIDE = 2000;
const QUALITY = 0.88;

/**
 * Photo picker that shrinks large photos in the browser before the form is
 * sent. Phone photos are often 4–10 MB; Vercel refuses requests above 4.5 MB,
 * and the server re-encodes to 1600 px anyway.
 */
export function PhotoInput({ label, name = "imageFile" }: { label: string; name?: string }) {
  const t = useAdminT();
  const [note, setNote] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    setNote(null);
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
      if (scale === 1 && file.size < 1_500_000) {
        bitmap.close();
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", QUALITY));
      if (!blob) return;
      const smaller = new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
        type: "image/jpeg",
      });
      const dt = new DataTransfer();
      dt.items.add(smaller);
      input.files = dt.files;
      setNote(t("Photo prepared: {size} MB.", { size: (smaller.size / 1_048_576).toFixed(1) }));
    } catch {
      // Not a photo the browser can read: the server will say so on save.
    }
  }

  return (
    <label className="text-sm font-semibold">
      {label}
      <input
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={onChange}
        className="mt-1 block text-sm"
      />
      {note ? <span className="mt-1 block text-xs font-normal text-muted">{note}</span> : null}
    </label>
  );
}
