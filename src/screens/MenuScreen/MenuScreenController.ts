import { supabase } from "../../lib/supabase.ts";

import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { MenuScreenView } from "./MenuScreenView.ts";

export class MenuScreenController extends ScreenController {
    private view: MenuScreenView;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.view = new MenuScreenView(

            () screenSwitcher.switchToScreen({ type: "levels" }),
            () screenSwitcher.switchToScreen({ type: "riskReward" }),
            () screenSwitcher.switchToScreen({ type: "dieMiniGame" }) // <--- Triggers your new minigame

            () this.handleStartClick(),
            // Risk/Reward button goes straight to the minigame
            () this.screenSwitcher.switchToScreen({ type: "riskReward" }),
            () {
                supabase.auth.signOut();
                this.screenSwitcher.switchToScreen({ type: "auth" });
            }

        );
    }

    getView(): MenuScreenView {
        return this.view;
    }
}