const SUPABASE_URL =
  "https://ecsgfzyeuliiszddhwrc.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_MYahpAT1RQVU4sEnfdOb3w_YZ3PWRZr";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );