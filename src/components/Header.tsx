import { SearchBar } from "./SearchBar";

export function Header() {
  return (
    <div className="w-full flex p-3 fixed top-0 shadow-sm bg-white">
      <div className="flex-1" />
      <div className="flex-1" />
      <SearchBar />
    </div>
  );
}
