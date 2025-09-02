import HeroCarousel, { type Slide } from "@/components/layout/HeroCarousel";

const slides: Slide[] = [
  {
    title: "Explore high-quality public data",
    text: "Curated and ready to use — for individuals, institutions, and businesses.",
    img: "/images/slide1.jpg",
    cta: { label: "Browse datasets", href: "/browse" },
    overlayClassName: "bg-gradient-to-b from-black/40 via-black/30 to-black/20"
  },
  {
    title: "Free & open",
    text: "Compare, scrutinize, and build — without barriers.",
    img: "/images/slide2.jpg",
    cta: { label: "Start exploring", href: "/browse" },
    overlayClassName: "bg-black/35"
  },
  {
    title: "An ecosystem of facts",
    text: "Reliable data as the foundation for progress and accountability.",
    img: "/images/slide3.jpg",
    cta: { label: "See featured", href: "/browse" },
    overlayClassName: "bg-gradient-to-t from-black/40 via-black/25 to-transparent"
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-0 sm:px-0">
      <div className="px-4 sm:px-6 py-4">
        <HeroCarousel slides={slides} />
      </div>
    </main>
  );
}

