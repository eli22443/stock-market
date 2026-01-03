"use client";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signout } from "@/services/auth-actions";

export default function LoginLogoutButton() {
  // use contex for user session
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [user]);

  if (user) {
    return (
      <Button
        className="border-2 border-indigo-600"
        onClick={() => {
          signout();
          setUser(null);
        }}
      >
        Log out
      </Button>
    );
  }

  return (
    <Button
      className="border-2 border-indigo-600"
      onClick={() => {
        router.push("/login");
      }}
    >
      Login
    </Button>
  );
}
