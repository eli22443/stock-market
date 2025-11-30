"use client";

import { useRouter } from "next/navigation";

export default function Stocks() {
  /**
   * navigate to default page most-active in /stocks
   */
  const router = useRouter();
  router.push(`/stocks/most-active`);
}
