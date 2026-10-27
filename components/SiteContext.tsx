"use client";

import { createContext, useContext } from "react";

export type SiteInfo = {
  /** Main phone, E.164 (+374…). */
  phone: string;
  phoneDisplay: string;
  /** Digits only, for wa.me links; null when there is no WhatsApp. */
  whatsapp: string | null;
  /** False while the WhatsApp number is a guess. */
  whatsappConfirmed: boolean;
  /** Show "example, to be discussed" next to values the client has not confirmed. */
  demoNotes: boolean;
};

const SiteContext = createContext<SiteInfo>({
  phone: "",
  phoneDisplay: "",
  whatsapp: null,
  whatsappConfirmed: false,
  demoNotes: false,
});

export function SiteProvider({ value, children }: { value: SiteInfo; children: React.ReactNode }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  return useContext(SiteContext);
}
