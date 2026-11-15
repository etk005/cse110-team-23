import Konva from "konva";
import type { View } from "../../types";
import { STAGE_HEIGHT, STAGE_WIDTH } from "../../constants";
import { SignIn } from "./components/SignIn";
import { SignUp } from "./components/SignUp";

export type AuthScreenViewConfig = {
    onSignIn: (email: string, password: string) => void;
    onSignUp: (email: string, password: string) => void;
};

export class AuthScreenView implements View {
    private group: Konva.Group;
    private signIn: SignIn;
    private signUp: SignUp;

    constructor({ onSignIn, onSignUp }: AuthScreenViewConfig) {
        this.group = new Konva.Group({
            visible: false,
            offsetX: -STAGE_WIDTH / 2,
            offsetY: -STAGE_HEIGHT / 2
        });
        this.signIn = new SignIn({
            visible: false,
            onSignIn,
            onSwitchToSignUp: () => {
                this.signIn.hide();
                this.signUp.show();
            }
        });
        this.signUp = new SignUp({
            visible: false,
            onSignUp,
            onSwitchToSignIn: () => {
                this.signUp.hide();
                this.signIn.show();
            }
        });
        this.group.add(this.signIn);
        this.group.add(this.signUp);
        this.signIn.show();
    }
    
    show(): void {
        this.group.show();
    }

    hide(): void {
        this.group.hide();
    }

    getGroup(): Konva.Group {
        return this.group;
    }
}