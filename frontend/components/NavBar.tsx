"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";
import { Home, Newspaper, TrendingUp, Globe } from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/stocks", label: "Stocks", icon: TrendingUp },
  { href: "/world-indices", label: "World Indices", icon: Globe },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="navbar border-r pr-4 py-4 min-h-screen">
      <div className="navbar-links flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-2",
                isActive && "bg-primary/10 hover:bg-primary/20"
              )}
            >
              <Link href={item.href}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
