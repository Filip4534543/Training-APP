"use client";

import { useAppState } from "@/components/app-state-provider";
import { cn } from "@/lib/utils";

export function ProfileSwitcher() {
  const { state, profile, requestProfile } = useAppState();

  return (
    <div className="flex rounded-full bg-muted p-0.5">
      {state.profiles.map((item) => {
        const active = item.id === profile.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => requestProfile(item.id)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.name}
          </button>
        );
      })}
    </div>
  );
}
