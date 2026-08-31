import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
};

export function Logo({ className, markClassName, showWordmark = true }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/logo.png"
        alt=""
        width={419}
        height={459}
        className={cn("h-8 w-auto object-contain dark:invert", markClassName)}
        priority
      />
      {showWordmark ? (
        <span className="font-heading text-lg leading-none tracking-wide uppercase">
          Training APP
        </span>
      ) : (
        <span className="sr-only">Training APP</span>
      )}
    </span>
  );
}
