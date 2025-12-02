"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="navbar border-r-2 px-1 border-r-indigo-500">
      <div className="navbar-links flex flex-col ">
        <Link
          href="/"
          className={`nav-link px-2 hover:bg-sky-100 hover:text-blue-600 ${
            pathname === "/" ? "font-bold" : ""
          }`}
        >
          Overview
        </Link>
        <Link
          href="/stocks"
          className={`nav-link px-2 hover:bg-sky-100 hover:text-blue-600 ${
            pathname.startsWith("/stocks") ? "font-bold" : ""
          }`}
        >
          Stocks
        </Link>
      </div>
    </nav>
  );
}
