import {supabase} from "./supabase.ts";

export async function loadCoins(userId: string): Promise<number>{
    const {data, error} = await supabase
    .from("player_resources")
    .select("coins")
    .eq("user_id",userId)
    .single();
    if (error) { 
        throw error;
    }
    return data.coins;
}
export async function saveCoins(previousBalance: number, nextBalance: number): Promise<number>{
    const {data: {user}, error: authError} = await supabase.auth.getUser();
    if (authError) {
        throw authError;
    }
    if(!user) {
        throw new Error("Sign in to save coins");
    }
    const {data, error} = await supabase
    .from("player_resources")
    .update({coins: nextBalance})
    .eq("user_id", user.id)
    .eq("coins", previousBalance)
    .select("coins")
    .single();
    if (error) {
        throw error;
    }
    return data.coins;
}
