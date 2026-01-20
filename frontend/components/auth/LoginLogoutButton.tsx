"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginLogoutButton() {
  const auth = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Show loading state while checking auth
  if (auth?.loading) {
    return (
      <Button disabled>
        Loading...
      </Button>
    );
  }

  // Show logout button if user is authenticated
  if (auth?.user) {
    return (
      <Button
        variant={"logout"}
        onClick={async () => {
          setLoading(true);
          try {
            await auth?.signOut();
            // Router push happens in signOut
          } catch (error) {
            console.error("Logout error:", error);
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading}
      >
        {loading ? "Logging out..." : "Log out"}
      </Button>
    );
  }

  // Show login button if user is not authenticated
  return (
    <Button
      variant={"login"}
      onClick={() => {
        router.push("/login");
      }}
    >
      Login
    </Button>
  );
}
