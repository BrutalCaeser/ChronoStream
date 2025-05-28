import Link from "next/link";
import { MainNav } from "@/components/layout/main-nav";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react"; // ChronoStream Icon

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <Video className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">ChronoStream</span>
        </Link>
        <MainNav className="mx-6" />
        {/* Future user profile / auth button can go here */}
        {/* <div className="flex items-center space-x-2">
          <Button variant="outline">Login</Button>
        </div> */}
      </div>
    </header>
  );
}
