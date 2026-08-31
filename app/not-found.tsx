import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <Image src="/logo.png" alt="" width={96} height={105} className="h-12 w-auto dark:invert" />
      <h1 className="font-heading text-3xl tracking-wide uppercase">Nie ma takiej strony</h1>
      <p className="text-sm text-muted-foreground">
        Wróć do planu i wybierz dzień treningowy.
      </p>
      <Button nativeButton={false} render={<Link href="/" />}>
        Plan
      </Button>
    </div>
  );
}
