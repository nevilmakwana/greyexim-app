"use client";

import dynamic from "next/dynamic";

const MobileBottomNav = dynamic(() => import("app/components/MobileBottomNav"), {
  ssr: false,
});

export default function ClientMobileBottomNav() {
  return <MobileBottomNav />;
}
