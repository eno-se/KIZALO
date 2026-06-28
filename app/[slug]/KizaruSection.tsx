"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import KizaruButton from "./KizaruButton";
import PwaInstallPrompt from "./PwaInstallPrompt";
import { KizaruPendingContext } from "./KizaruContext";

type Props = {
  creatorId: string;
  slug: string;
  alreadyKizared: boolean;
  isLoggedIn: boolean;
  streakDays: number;
  isOwner: boolean;
  showKizaruButton: boolean;
  children?: React.ReactNode;
};

export default function KizaruSection({
  creatorId,
  slug,
  alreadyKizared,
  isLoggedIn,
  streakDays,
  isOwner,
  showKizaruButton,
  children,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [pwaTriggered, setPwaTriggered] = useState(false);
  const router = useRouter();

  const handleKizaruDone = () => {
    setPwaTriggered(true);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <KizaruPendingContext.Provider value={isPending}>
      {!isOwner && showKizaruButton && (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 pt-4">
          <div className="max-w-lg mx-auto flex justify-center">
            <KizaruButton
              creatorId={creatorId}
              slug={slug}
              alreadyKizared={alreadyKizared}
              isLoggedIn={isLoggedIn}
              streakDays={streakDays}
              onKizaruDone={handleKizaruDone}
            />
          </div>
        </div>
      )}

      {children}

      <PwaInstallPrompt triggered={pwaTriggered} />
    </KizaruPendingContext.Provider>
  );
}
