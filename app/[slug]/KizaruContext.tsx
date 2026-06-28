"use client";

import { createContext, useContext } from "react";

export const KizaruPendingContext = createContext(false);

export function useKizaruPending() {
  return useContext(KizaruPendingContext);
}
