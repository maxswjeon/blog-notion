"use client";

import Search from "assets/icons/search.svg";

export function SearchBar() {
  return (
    <form className="w-[300px] m-auto shrink-1">
      <label
        htmlFor="default-search"
        className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
      >
        Search
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search />
        </div>
        <input
          type="search"
          id="default-search"
          className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 placeholder:text-ellipsis placeholder:overflow-hidden placeholder-shown:text-ellipsis focus:outline-none"
          placeholder="Search Posts, Tags, and Categories"
          required
        />
      </div>
    </form>
  );
}
