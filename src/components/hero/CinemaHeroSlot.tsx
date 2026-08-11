import CinemaHeroFallback from "@/components/hero/CinemaHeroFallback";
import CinemaHeroLazyGate from "@/components/hero/CinemaHeroLazyGate";

export default function CinemaHeroSlot() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
      <div className="relative aspect-[4/3] w-full">
        <CinemaHeroFallback embedded className="absolute inset-0" />
        <CinemaHeroLazyGate className="absolute inset-0" />
      </div>
    </div>
  );
}
