"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StocksMenu() {
  const pathname = usePathname();
  const categories = ["most-active", "trending", "gainers", "losers"];
  const titles = ["Most Active", "Trending now", "Top Gainers", "Top Losers"];

  return (
    <nav className="menu border-blue-600 border-t border-b my-6 py-1 ">
      <div className="menu-links flex flex-row ">
        {categories.map((category, index) => (
          <Link
            key={index}
            href={`/stocks/${category}`}
            className={`nav-link px-2 hover:bg-sky-100 hover:text-blue-600 ${
              pathname === `/stocks/${category}` ? "font-bold" : ""
            }`}
          >
            {titles[index]}
          </Link>
        ))}
      </div>
    </nav>
  );
}
