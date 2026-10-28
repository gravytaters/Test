/* Where the inventory lives.
   "shared": one inventory for every device, in the Hub's Supabase project, opened with the Hub passcode.
   "local":  each browser keeps its own inventory (no internet needed). */
window.GNH_CONFIG = {
  mode: "shared",
  supabaseUrl: "https://dyhhepkwevvgjwujrqnf.supabase.co",
  // publishable key: safe to be public; the database only answers requests that carry the Hub passcode
  supabaseKey: "sb_publishable_PcXP8Qi9kD6-tiVXqRLmLg_wtN67RTq",
};
