import { ScreenController, type ScreenSwitcher, type View } from "../../types";
import { AuthScreenModel } from "./AuthScreenModel";
import { AuthScreenView } from "./AuthScreenView";

export class AuthScreenController extends ScreenController {
    model: AuthScreenModel;
    view: AuthScreenView;

    constructor(private screenSwitcher: ScreenSwitcher) {
        super();
        this.model = new AuthScreenModel();
        this.view = new AuthScreenView({
            onSignIn: async (email, password) => {
                await this.model.signIn(email, password);
                screenSwitcher.switchToScreen({ type: "menu" });
            },
            onSignUp: async (email, password) => {
                await this.model.signUp(email, password);
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