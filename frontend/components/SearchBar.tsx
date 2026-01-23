"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

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
    <form className="search-form flex justify-end w-full" onSubmit={handleSubmit}>
      <div className="flex gap-2 items-center w-full sm:w-auto">
        <Input
          type="text"
          name="search"
          value={search_querry}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setSearchQuerry(event.target.value)
          }
          placeholder="Search stocks..."
          className="w-full sm:w-64"
        />
        <Button type="submit" className="flex-shrink-0">Search</Button>
      </div>
    </form>
  );
}
