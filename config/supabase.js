// const { createClient } = require("@supabase/supabase-js");

// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_ANON_KEY
// );

// module.exports = supabase;
console.log("SUPABASE CONFIG FILE LOADED");
const { createClient } = require("@supabase/supabase-js");

console.log("URL:", process.env.SUPABASE_URL);
console.log("KEY:", process.env.SUPABASE_ANON_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

console.log("CLIENT:", supabase);
console.log("EXPORTING:", supabase);
module.exports = supabase;