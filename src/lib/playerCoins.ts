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