import { beforeAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { PlayerResources } from "../game/playerResources.ts";

const LOCAL_SUPABASE_URL = "http://127.0.0.1:54321";
const LOCAL_SUPABASE_KEY = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

describe("Supabase Local Development - End-to-End Integration", () => {
    let localAvailable = false;

    beforeAll(async () => {
        try {
            const res = await fetch(`${LOCAL_SUPABASE_URL}/auth/v1/health`, {
                headers: { apikey: LOCAL_SUPABASE_KEY },
            });
            localAvailable = res.ok;
        } catch {
            localAvailable = false;
        }
    });

    it("interacts with local Supabase instance to auto-create, load, spend, and earn coins", async (ctx) => {
        if (!localAvailable) {
            ctx.skip();
            return;
        }

        const client = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_KEY);

        // 1. Sign up a unique test user in the local database
        const randomId = Math.random().toString(36).substring(2, 10);
        const email = `testuser_${randomId}@example.com`;
        const password = "TestPassword123!";

        const { data: authData, error: authError } = await client.auth.signUp({
            email,
            password,
        });

        expect(authError).toBeNull();
        expect(authData.user).toBeDefined();
        const userId = authData.user!.id;

        // 2. Instantiate PlayerResources with the authenticated client
        const resources = new PlayerResources(10, client);

        // 3. Load user resources - trigger on auth.users should have created the row with 10 coins
        const loadedCoins = await resources.load(userId);
        expect(loadedCoins).toBe(10);
        expect(resources.getCoins()).toBe(10);

        // 4. Spend 4 coins
        const spendSuccess = await resources.spendCoins(4);
        expect(spendSuccess).toBe(true);
        expect(resources.getCoins()).toBe(6);

        // 5. Verify database directly reflects the new balance
        const { data: dbAfterSpend } = await client
            .from("player_resources")
            .select("coins")
            .eq("user_id", userId)
            .single();
        expect(dbAfterSpend?.coins).toBe(6);

        // 6. Earn 8 coins
        await resources.earnCoins(8);
        expect(resources.getCoins()).toBe(14);

        // 7. Verify database directly reflects the earned balance
        const { data: dbAfterEarn } = await client
            .from("player_resources")
            .select("coins")
            .eq("user_id", userId)
            .single();
        expect(dbAfterEarn?.coins).toBe(14);

        // 8. Load in a fresh PlayerResources instance to confirm persistent state
        const freshResources = new PlayerResources(10, client);
        await freshResources.load(userId);
        expect(freshResources.getCoins()).toBe(14);
    });
});
