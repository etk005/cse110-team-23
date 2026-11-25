import { supabase } from "../../lib/supabase";
import { ScreenController, type ScreenSwitcher, type View } from "../../types";
import type { Loader } from "../LoadingScreen/LoadingScreenController";
import { AuthScreenView } from "./AuthScreenView";

export class AuthScreenController extends ScreenController {
    view: AuthScreenView;

    constructor(screenSwitcher: ScreenSwitcher, loadPlayer: Loader) {
        super();
        this.view = new AuthScreenView({
            onSignIn: async (email, password) => {
                const result = await supabase.auth.signInWithPassword({ email, password });
                if (result.data.user === null) {
                    this.view.setError(result.error?.message ?? "unknown error");
                } else {
                    screenSwitcher.switchToScreen({type:"loading",
                        loader: loadPlayer,
                    });
                }
            },
            onSignUp: async (email, password) => {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) {
                    this.view.setError(error.message);
                    return;
                }
                if (!data.session) {
                    this.view.showSignUpConfirmation();
                    return;
                }

                screenSwitcher.switchToScreen({ type: "loading", loader: loadPlayer });
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
