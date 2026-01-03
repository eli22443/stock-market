import { createClient } from "@/lib/supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    console.log("Failed getting user data");
    return;
  }
  // console.log(user);

  return (
    <div className="dashboard-page px-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {/* Dashboard content will go here. */}
      <p>Hello {user.user_metadata.full_name || "there"}!</p>
    </div>
  );
}
