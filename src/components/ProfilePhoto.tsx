import { useState } from "react";
import { Mascot } from "./Character";

/**
 * Dominic's portrait.
 *
 * Looks for a real headshot in `public/images/`, trying common names.
 * Until a photo exists it gracefully falls back to the illustrated mascot
 * so the layout never breaks.
 */
const CANDIDATES = [
  "images/dominic.jpg",
  "images/profile.jpg",
  "images/me.jpg",
  "images/photo.jpg",
];

interface ProfilePhotoProps {
  className?: string;
  alt?: string;
}

export default function ProfilePhoto({
  className = "",
  alt = "Dominic Torres",
}: ProfilePhotoProps) {
  const [index, setIndex] = useState(0);

  if (index >= CANDIDATES.length) {
    return (
      <div className={`grid place-items-center bg-gradient-to-b from-accent-tint to-paper dark:from-accent/15 dark:to-[#0E1726] ${className}`}>
        <Mascot pose="standing" looking="center" className="w-2/3 max-w-[220px]" ariaLabel="Dominic — drop your photo in public/images/profile.jpg" />
      </div>
    );
  }

  return (
    <img
      src={CANDIDATES[index]}
      alt={alt}
      loading="eager"
      className={`object-cover object-top ${className}`}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
