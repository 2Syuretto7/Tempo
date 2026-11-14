import Link from "next/link";
import { Wordmark } from "@/components/ui/Logo";
import { signOutAction } from "../sign-in/actions";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="sticky top-0 z-30 h-[47px] md:h-[60px] bg-page flex items-center px-4 md:px-8">
        <Link href="/" aria-label="Tempo home">
          <Wordmark />
        </Link>
        <nav className="ml-6 md:ml-10 flex items-center gap-1 md:gap-4 text-[14px] font-medium" aria-label="Rooms">
          <Link href="/puzzles" className="h-8 px-2 inline-flex items-center text-meta hover:text-ink transition-colors">
            Puzzles
          </Link>
          <Link href="/train" className="h-8 px-2 inline-flex items-center text-meta hover:text-ink transition-colors">
            Train
          </Link>
        </nav>
        <form action={signOutAction} className="ml-auto">
          <button className="h-8 px-2 text-[14px] font-medium text-meta hover:text-ink transition-colors">Sign out</button>
        </form>
      </header>
      {children}
    </div>
  );
}
