
import { supabase } from "../../lib/supabase.ts";
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { MenuScreenView } from "./MenuScreenView.ts";
import { PlayerResources } from "../../game/playerResources.ts";

/** 
 * Controls the main menu screen and routes the Start button to the game. 
 * */
export class MenuScreenController extends ScreenController {
    private view: MenuScreenView;
    private screenSwitcher: ScreenSwitcher;

    constructor(screenSwitcher: ScreenSwitcher, private resources: PlayerResources) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.view = new MenuScreenView(
            () => this.handleStartClick(),
            // Risk/Reward button goes straight to the minigame
            () => this.screenSwitcher.switchToScreen({ type: "riskReward" }),
            async () => {
                this.resources.reset();
                await supabase.auth.signOut();
                this.screenSwitcher.switchToScreen({ type: "auth" });
            },
            () => this.screenSwitcher.switchToScreen({ type: "dieMiniGame" })
        );
        this.refreshCoins();
        this.resources.onChange(this.refreshCoins.bind(this));

    }
    private refreshCoins(): void{
        this.view.updateCoins(this.resources.getCoins());
    }

    private handleStartClick(): void {
        this.screenSwitcher.switchToScreen({ type: "levels" });
    }

    getView(): MenuScreenView {
        return this.view;
    }
}
