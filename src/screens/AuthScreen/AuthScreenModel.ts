import { supabase } from "../../lib/supabase";

export class AuthScreenModel {
    async signIn(email: string, password: string) {
        const result = await supabase.auth.signInWithPassword({ email, password });
    }

    async signUp(email: string, password: string) {
        const result = await supabase.auth.signUp({ email, password });
    }
}