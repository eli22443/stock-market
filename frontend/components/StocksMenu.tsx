"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StocksMenu() {
  const pathname = usePathname();

  return (
    <nav className="menu border-blue-600 border-t border-b my-6 py-1 ">
      <div className="menu-links flex flex-row ">
        <Link
          href="/stocks/most-active"
          className={`nav-link px-2 hover:bg-sky-100 hover:text-blue-600 ${
            pathname === "/stocks/most-active" ? "font-bold" : ""
          }`}
        >
          Most Active
        </Link>
        <Link
          href="/stocks/trending"
          className={`nav-link px-2 hover:bg-sky-100 hover:text-blue-600 ${
            pathname === "/stocks/trending" ? "font-bold" : ""
          }`}
        >
          Trending
        </Link>
      </div>
    </nav>
  );
}
