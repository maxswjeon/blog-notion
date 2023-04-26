import Link from "next/link";

import Search from "assets/icons/search.svg";

import metadata from "@/metadata.json";

export function Header() {
  return (
    <div className="w-full flex p-3 fixed top-0 shadow-sm bg-white">
      <div className="flex-2 flex items-center pl-3">
        <Link href="/">
          <h1 className="text-bold text-xl">{metadata.title}</h1>
        </Link>
      </div>
      <div className="flex-1 flex justify-end items-center">
        <div className="rounded-md shadow-md p-2">
          <Search />
        </div>
      </div>
    </div>
  );
}
