import Konva from "konva";
import { CARD_HEIGHT, CARD_WIDTH } from "../constants";
import { EditableText } from "../../../components/EditableText";

export type SignInConfig = Konva.GroupConfig & {
    onSignIn?: (email: string, password: string) => void;
    onSwitchToSignUp?: () => void;
};

export class SignIn extends Konva.Group {
    constructor({ onSignIn, onSwitchToSignUp, ...options }: SignInConfig = {}) {
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
            text: "email",
            fontSize: 30,
            offsetX: -10,
            offsetY: -10
        });
        this.add(email);

        const password = new EditableText({
            text: "password",
            fontSize: 30,
            offsetX: -10,
            offsetY: -60
        });
        this.add(password);

        const submitGroup = new Konva.Group({
            offsetX: -10,
            offsetY: -110
        });
        this.add(submitGroup);
        submitGroup.on("click", () => {
            onSignIn?.(email.text(), password.text());
        });

        const submitRect = new Konva.Rect({
            width: 87,
            height: 32,
            fill: "white",
            stroke: "red"
        });
        submitGroup.add(submitRect);

        const submitText = new Konva.Text({
            text: "sign in",
            fontSize: 30
        });
        submitGroup.add(submitText);

        const switchGroup = new Konva.Group({
            offsetX: -110,
            offsetY: -110
        });
        this.add(switchGroup);
        switchGroup.on("click", () => {
            onSwitchToSignUp?.();
        });

        const switchRect = new Konva.Rect({
            width: 223,
            height: 32,
            fill: "white",
            stroke: "red"
        });
        switchGroup.add(switchRect);

        const switchText = new Konva.Text({
            text: "switch to sign up",
            fontSize: 30
        });
        switchGroup.add(switchText);
    }
}