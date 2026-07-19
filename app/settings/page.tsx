import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth");
  }

  return (
    <SettingsClient
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      }}
    />
  );
}
