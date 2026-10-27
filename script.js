const SUPABASE_URL = "https://oxyiaqomqvzmgrsagroc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_4A95N9DBr72t7DStUrOrHw__Jn9f_gz"

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPBASE_PUBLISHABLE_KEY
);

console.log("Supabase client initialised.")
