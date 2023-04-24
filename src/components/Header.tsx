import Link from "next/link";
import { SearchBar } from "./SearchBar";

export function Header() {
  return (
    <div className="w-full flex p-3 fixed top-0 shadow-sm bg-white">
      <div className="flex-1 flex items-center pl-3">
        <Link href="/">
          <h1 className="text-bold text-xl">Sangwan Jeon&apos;s Blog</h1>
        </Link>
      </div>
      <div className="flex-1" />
      <SearchBar />
    </div>
  );
}
