"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";

const categories = [
  { slug: "most-active", label: "Most Active" },
  { slug: "trending", label: "Trending Now" },
  { slug: "gainers", label: "Top Gainers" },
  { slug: "losers", label: "Top Losers" },
];

export default function StocksMenu() {
  const pathname = usePathname();

  return (
    <nav className="menu mb-6">
      <div className="flex items-center gap-1 border-b overflow-x-auto scrollbar-hide">
        {categories.map((category) => {
          const href = `/stocks/${category.slug}`;
          const isActive = pathname === href;

          return (
            <Button
              key={category.slug}
              asChild
              variant="ghost"
              className={cn(
                "rounded-none border-b-2 border-transparent -mb-px whitespace-nowrap flex-shrink-0",
                isActive
                  ? "border-primary bg-transparent font-semibold text-primary"
                  : "hover:bg-muted/50"
              )}
            >
              <Link href={href}>{category.label}</Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
