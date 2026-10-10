"use client";
import { createContext, useContext } from "react";
export type SiteMode = "normal" | "hidden";
export const ModeContext = createContext<{ mode: SiteMode; activated: boolean; refresh: () => void }>({ mode: "normal", activated: false, refresh: () => {} });
export function useSiteMode() { return useContext(ModeContext); }
