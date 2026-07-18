"use client";

import { usePathname } from "next/navigation";

export default function BackgroundImage() {
  const pathname = usePathname();

  // Hide background on chat pages
  if (pathname.startsWith("/chats")) {
    return (
      <img
        src="/background_logo.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-1 h-full w-full object-cover object-center opacity-10 brightness-70 contrast-75"
      />
    );
  }

  return (
    <img
      src="/background_logo.png"
      alt=""
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-1 h-full w-full object-cover object-center opacity-40 brightness-70 contrast-75"
    />
  );
}
