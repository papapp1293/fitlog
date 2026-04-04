"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/register-sw";

export function SwRegistrar() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
