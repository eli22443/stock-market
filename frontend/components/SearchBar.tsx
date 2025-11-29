"use client";

import { ChangeEvent, FormEvent, useState } from "react";

export default function SearchBar() {
  const [search_querry, setSearchQuerry] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    alert("Searched value: " + search_querry);
    setSearchQuerry("");
    // move to page info
  };

  return (
    <form
      className="search-form flex justify-center my-6 "
      onSubmit={handleSubmit}
    >
      <input
        className="search-input"
        type="text"
        name="search"
        value={search_querry}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          setSearchQuerry(event.target.value)
        }
        placeholder="search for stocks..."
      ></input>
      <button className="search-btn" type="submit">
        Search
      </button>
    </form>
  );
}
