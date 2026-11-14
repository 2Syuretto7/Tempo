import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUserId, generatePassphrase, userExists } from "@/lib/auth";
import { Wordmark } from "@/components/ui/Logo";
import { AuthForms } from "./AuthForms";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  if ((await currentUserId()) !== null) redirect("/");
  const exists = await userExists();
  return (
    <main className="flex-1 flex flex-col">
      <header className="h-[60px] flex items-center px-4 md:px-8">
        <Wordmark />
      </header>
      <div className="flex-1 flex items-center justify-center px-4 pb-24">
        <div className="w-full max-w-[440px] fade-in">
          <AuthForms mode={exists ? "sign-in" : "sign-up"} suggestion={exists ? "" : generatePassphrase()} />
        </div>
      </div>
    </main>
  );
}
