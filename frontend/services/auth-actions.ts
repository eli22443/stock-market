"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const login = async (formData: FormData) => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth
    .signInWithPassword({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    })
    .catch((e) => {
      return { data: null, error: e };
    });
  if (error) {
    console.log("Error login in (user does not exist probably):\n", error.code);
    // redirect("/error");
    return;
  }
  // console.log(data);
  redirect("/dashboard");
};

export const signup = async (formData: FormData) => {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirm_password = formData.get("confirm-password") as string;

  if (password.length < 8) {
    // Show error: "Passwords is less than 8 characters"
    console.log("Passwords is less than 8 characters");
    return;
  }

  if (password !== confirm_password) {
    // Show error: "Passwords don't match"
    console.log("Passwords don't match");
    return;
  }
  const { data, error } = await supabase.auth
    .signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })
    .catch((e) => {
      return { data: { user: null, session: null }, error: e };
    });
  if (error) {
    console.log("Error login in:\n", error);
    // redirect("/error");
    return;
  }
  if (!data.user) {
    console.log("User signup failed.");
    return;
  }
  console.log(data);

  // No email confirmation required
  // A database trigger creates the profile row automatically
  // const profile = await supabase
  //   .from("profiles")
  //   .update({ username: fullName })
  //   .eq("id", data.user.id);

  // console.log(profile);

  if (!data.session) {
    // Email confirmation required
    // Show message: "Please check your email"
  } else {
    redirect("/dashboard");
  }
};

export const signout = async () => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.log(error);
    // redirect("/error");
    return;
  }

  redirect("/logout");
};
