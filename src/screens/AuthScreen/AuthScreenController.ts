import { supabase } from "../../lib/supabase";
import { ScreenController, type ScreenSwitcher, type View } from "../../types";
import { AuthScreenView } from "./AuthScreenView";

export class AuthScreenController extends ScreenController {
    view: AuthScreenView;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.view = new AuthScreenView({
            onSignIn: async (email, password) => {
                const result = await supabase.auth.signInWithPassword({ email, password });
                if (result.data.user === null) {
                    this.view.setError(result.error?.message ?? "unknown error");
                } else {
                    screenSwitcher.switchToScreen({ type: "menu" });
                }
            },
            onSignUp: async (email, password) => {
                const result = await supabase.auth.signUp({ email, password });
                if (result.data.user === null) {
                    this.view.setError(result.error?.message ?? "unknown error");
                } else {
                    screenSwitcher.switchToScreen({ type: "menu" });
                }
            }
        });
    }
    
    show(): void {
        this.view.show();
    }

    hide(): void {
        this.view.hide();
    }

    getView(): View {
        return this.view;
    }
}