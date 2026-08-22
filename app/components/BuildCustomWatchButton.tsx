"use client";

import { useRouter } from "next/navigation";
import { LiquidMetalButton } from "./LiquidMetalButton";

export function BuildCustomWatchButton() {
  const router = useRouter();
  return (
    <LiquidMetalButton
      label="Build Your Custom Watch"
      onClick={() => router.push("/try-out")}
    />
  );
}
