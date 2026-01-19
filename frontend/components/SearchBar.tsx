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
    <form className="search-form flex justify-end" onSubmit={handleSubmit}>
      <div className="flex gap-2 items-center">
        <Input
          type="text"
          name="search"
          value={search_querry}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setSearchQuerry(event.target.value)
          }
          placeholder="Search for stocks..."
          className="w-64"
        />
        <Button type="submit">Search</Button>
      </div>
    </form>
  );
}
