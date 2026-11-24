(function () {
    "use strict";

    const SUPABASE_URL =
        "https://dfepopppcggzecdxexeh.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_rRy6HQBsLmQokJ6j1c-THg_8f16xaxF";

    if (!window.supabase?.createClient) {
        console.error("Supabase library is not loaded.");
        return;
    }

    if (window.EnglishFlowDB) return;

    window.EnglishFlowDB = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storageKey: "englishflow-auth"
            }
        }
    );
})();
