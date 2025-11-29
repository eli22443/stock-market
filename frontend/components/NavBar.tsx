import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="navbar">
      {/* <div className="navbar-brand">
        <Link to="/">Stock App</Link>
      </div> */}
      <div className="navbar-links flex flex-col ">
        <Link href="/" className="nav-link mx-2">
          Overview
        </Link>
        <Link href="/stocks" className="nav-link mx-2">
          Stocks
        </Link>
      </div>
    </nav>
  );
}
