import logoAsset from "@/assets/haidery-logo.png.asset.json";
import markAsset from "@/assets/haidery-mark.png.asset.json";

/** Full Haidery logo (mark + wordmark + tagline), used exactly as provided. */
export function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return <img src={logoAsset.url} alt="Haidery — Community first • Quality always" className={className} />;
}

/** Mark only (the H with orbit). */
export function LogoMark({ className = "h-8 w-auto" }: { className?: string }) {
  return <img src={markAsset.url} alt="Haidery" className={className} />;
}
