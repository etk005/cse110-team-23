
import Konva from "konva";
import type { View } from "../../types.ts";
import type { GameState } from "../../shared/types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT, COLORS } from "../../constants.ts";

export class GameScreenView implements View {
    private group: Konva.Group;
    private onAnswer: (answer: string) => void;
    private onMenu: () => void;
    private onNext: () => void;

    constructor(
        onAnswer: (answer: string) => void,
        onMenu: () => void,
        onNext: () => void
    ) {
        this.group = new Konva.Group({ visible: false });
        this.onAnswer = onAnswer;
        this.onMenu = onMenu;
        this.onNext = onNext;
    }

    render(
        state: GameState,
        options: string[],
        feedback = "",
        showNext = false
    ): void {
        this.group.destroyChildren();

        const background = new Konva.Rect({
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: COLORS.background,
        });

        this.group.add(background);

        // Header
        this.addText(
            "LEVEL 1: CARD PROBABILITY",
            40,
            30,
            28,
            COLORS.accent
        );

        this.addText(
            `Strikes: ${state.strikes}/${state.maxStrikes}`,
            580,
            35,
            18
        );

        this.addText(
            `Progress: ${state.questionsAnswered}/${state.questionsRequired}`,
            580,
            65,
            18
        );

        // Hidden card
        const card = new Konva.Rect({
            x: 350,
            y: 110,
            width: 100,
            height: 140,
            fill: COLORS.panel,
            stroke: COLORS.accent,
            strokeWidth: 3,
            cornerRadius: 10,
        });

        this.group.add(card);

        this.addCenteredText("?", 145, 65, COLORS.accent);

        // Clues
        const clue = state.knownInformation
            .map((info) => info.description)
            .join(" ");

        this.addCenteredText(
            clue,
            275,
            20,
            COLORS.accent
        );

        // Current question
        const question = state.currentQuestion?.text ?? "";

        this.addCenteredText(
            question,
            330,
            23,
            COLORS.text
        );

        // Answer buttons
        if (!showNext && state.status === "playing") {
            options.forEach((option, index) => {
                const x = 65 + index * 140;

                this.addButton(
                    option,
                    x,
                    405,
                    110,
                    () => this.onAnswer(option)
                );
            });
        }

        // Feedback message
        if (feedback) {
            const feedbackColor = showNext
                ? COLORS.accent
                : "#ffaaaa";

            this.addCenteredText(
                feedback,
                475,
                22,
                feedbackColor
            );
        }

        // Navigation buttons
        if (showNext) {
            const label = state.status === "won"
                ? "Finish Level"
                : "Next Question";

            this.addButton(
                label,
                410,
                530,
                180,
                this.onNext
            );

            this.addButton(
                "Menu",
                210,
                530,
                150,
                this.onMenu
            );
        } else {
            this.addButton(
                "Menu",
                325,
                530,
                150,
                this.onMenu
            );
        }

        this.group.getLayer()?.draw();
    }

    private addText(
        text: string,
        x: number,
        y: number,
        fontSize: number,
        color = COLORS.text
    ): void {
        const label = new Konva.Text({
            x,
            y,
            text,
            fontSize,
            fontFamily: "Arial",
            fill: color,
        });

        this.group.add(label);
    }

    private addCenteredText(
        text: string,
        y: number,
        fontSize: number,
        color = COLORS.text
    ): void {
        const label = new Konva.Text({
            x: 50,
            y,
            width: STAGE_WIDTH - 100,
            text,
            fontSize,
            fontFamily: "Arial",
            fill: color,
            align: "center",
        });

        this.group.add(label);
    }

    private addButton(
        label: string,
        x: number,
        y: number,
        width: number,
        onClick: () => void
    ): void {
        const buttonGroup = new Konva.Group({ x, y });

        const rectangle = new Konva.Rect({
            width,
            height: 50,
            fill: COLORS.button,
            stroke: COLORS.buttonDark,
            strokeWidth: 2,
            cornerRadius: 8,
        });

        const text = new Konva.Text({
            text: label,
            width,
            height: 50,
            align: "center",
            verticalAlign: "middle",
            fontSize: 19,
            fill: COLORS.text,
        });

        buttonGroup.add(rectangle, text);

        buttonGroup.on("click tap", onClick);

        buttonGroup.on("mouseenter", () => {
            document.body.style.cursor = "pointer";
        });

        buttonGroup.on("mouseleave", () => {
            document.body.style.cursor = "default";
        });

        this.group.add(buttonGroup);
    }

    show(): void {
        this.group.visible(true);
        this.group.getLayer()?.draw();
    }

    hide(): void {
        this.group.visible(false);
        this.group.getLayer()?.draw();
    }

    getGroup(): Konva.Group {
        return this.group;
    }
}
