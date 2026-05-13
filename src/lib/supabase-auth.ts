import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function getSupabaseAuth() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Read all sb-* cookies and pass them to the client
  const allCookies = cookieStore.getAll();

  const supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        cookie: allCookies.map((c) => `${c.name}=${c.value}`).join("; "),
      },
    },
  });

  return supabase;
}

export async function getAuthUser() {
  const supabase = await getSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
