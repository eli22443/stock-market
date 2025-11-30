"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [search_querry, setSearchQuerry] = useState("");
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const symbol = search_querry.trim().toUpperCase();
    if (symbol) {
      router.push(`/quote/${symbol}`);
      setSearchQuerry("");
    }
  };

  return (
    <form
      className="search-form  flex justify-end my-6 "
      onSubmit={handleSubmit}
    >
      <div className=" mr-24">
        <input
          className="search-input border border-blue-700 rounded-md px-2 py-1"
          type="text"
          name="search"
          value={search_querry}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setSearchQuerry(event.target.value)
          }
          placeholder="search for stocks..."
        ></input>
        <button
          className="search-btn border border-blue-700 rounded-md px-2 py-1 text-blue-700 hover:text-blue-500 ml-4"
          type="submit"
        >
          Search
        </button>
      </div>
    </form>
  );
}
