import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { ArrowUpIcon } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-wrap items-center gap-2 md:flex-row">
      <Button variant="outline">Button</Button>
      <Button variant="outline" size="icon" aria-label="Submit">
        <ArrowUpIcon />
      </Button>
      <SignedOut>
        <SignInButton />
        <SignUpButton>
          <button className="rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
            Sign Up
          </button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}