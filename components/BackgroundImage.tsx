"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";

export default function BackgroundImage() {
  const pathname = usePathname();

  // Hide background on chat pages
  if (pathname.startsWith("/chats") || pathname.startsWith("/settings")) {
    return (
      <Image
        src="/background_logo.png"
        alt=""
        aria-hidden="true"
        fill
        priority
        className="pointer-events-none fixed inset-0 z-1 object-cover object-center opacity-10 brightness-70 contrast-75"
      />
    );
  }

  return (
    <Image
      src="/background_logo.png"
      alt=""
      aria-hidden="true"
      fill
      priority
      className="pointer-events-none fixed inset-0 z-1 object-cover object-center opacity-40 brightness-70 contrast-75"
    />
  );
}
