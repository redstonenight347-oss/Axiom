import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ChatClient } from "./ChatClient";

interface ChatsPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function ChatsPage({ searchParams }: ChatsPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth");
  }

  const { id } = await searchParams;

  return <ChatClient initialChatId={id ?? null} />;
}
