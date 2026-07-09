import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 50 },
    { duration: "2m", target: 100 },
    { duration: "2m", target: 100 },
  ],
};

export default function () {
  const res = http.get("https://api.stock-market-seven-delta.app/health");

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  sleep(0.2);
}
