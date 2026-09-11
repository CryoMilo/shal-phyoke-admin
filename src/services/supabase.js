import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
	import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey =
	import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseKey);
