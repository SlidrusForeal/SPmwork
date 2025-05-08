    // lib/supabaseAdmin.ts
    import { createClient } from '@supabase/supabase-js';

    const SUPABASE_URL         = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error('❌ Не заданы SUPABASE_SERVICE_ROLE_KEY или NEXT_PUBLIC_SUPABASE_URL');
    }

    export const supabaseAdmin = createClient(
    SUPABASE_URL,
    SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
    );
