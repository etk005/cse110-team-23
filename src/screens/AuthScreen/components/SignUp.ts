import Konva from "konva";
import { CARD_HEIGHT, CARD_WIDTH } from "../constants";
import { EditableText } from "../../../components/EditableText";

export type SignUpConfig = Konva.GroupConfig & {
    onSignUp?: (email: string, password: string) => void;
    onSwitchToSignIn?: () => void;
};

export class SignUp extends Konva.Group {
    private errorText: Konva.Text;

    constructor({ onSignUp, onSwitchToSignIn, ...options }: SignUpConfig = {}) {
        super({
            ...options,
            offsetX: CARD_WIDTH / 2,
            offsetY: CARD_HEIGHT / 2
        });

        const card = new Konva.Rect({
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            fill: "white",
        });
        this.add(card);

        const email = new EditableText({
            text: "email@email.com",
            fontSize: 30,
            offsetX: -10,
            offsetY: -10,
            width: 300
        });
        this.add(email);

        const password = new EditableText({
            text: "password",
            fontSize: 30,
            offsetX: -10,
            offsetY: -60,
            width: 300
        });
        this.add(password);

        const submitGroup = new Konva.Group({
            offsetX: -10,
            offsetY: -110
        });
        this.add(submitGroup);
        submitGroup.on("click", () => {
            onSignUp?.(email.text(), password.text());
        });

        const submitRect = new Konva.Rect({
            width: 95,
            height: 32,
            fill: "white",
            stroke: "red"
        });
        submitGroup.add(submitRect);

        const submitText = new Konva.Text({
            text: "sign up",
            fontSize: 30
        });
        submitGroup.add(submitText);

        const switchGroup = new Konva.Group({
            offsetX: -118,
            offsetY: -110
        });
        this.add(switchGroup);
        switchGroup.on("click", () => {
            onSwitchToSignIn?.();
        });

        const switchRect = new Konva.Rect({
            width: 215,
            height: 32,
            fill: "white",
            stroke: "red"
        });
        switchGroup.add(switchRect);

        const switchText = new Konva.Text({
            text: "switch to sign in",
            fontSize: 30
        });
        switchGroup.add(switchText);
        
        this.errorText = new Konva.Text({
            fontSize: 20,
            fill: "red",
            offsetX: -10,
            offsetY: -160
        });
        this.add(this.errorText);
    }

    setError(error: string) {
        this.errorText.text(error);
    }
}