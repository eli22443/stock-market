import { redirect } from "next/navigation";

export default function Stocks() {
  /**
   * navigate to default page most-active in /stocks
   */

  redirect("/stocks/most-active");

  return null; // or a loading spinner
}
