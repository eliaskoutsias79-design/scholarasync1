import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gumkggajfcoopaapouyh.supabase.co";
const supabaseAnonKey = "sb_publishable_teC1t_ingdrblpC39-OJAw_EfIFkm-y";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
