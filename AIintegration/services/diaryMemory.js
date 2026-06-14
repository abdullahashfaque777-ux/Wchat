 const supabase = require("../../config/supabase");

async function getRecentEntries(userId) {

    try {

        const { data, error } = await supabase
            .from("diary_entries")
            .select("content")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(5);

        if (error) {

            console.error("Diary Memory Error:", error);

            return [];

        }

        if (!data || data.length === 0) {

            return [];

        }

        return data.map(entry => entry.content);

    }

    catch (err) {

        console.error("Diary Memory Exception:", err);

        return [];

    }

}

module.exports = {
    getRecentEntries
};