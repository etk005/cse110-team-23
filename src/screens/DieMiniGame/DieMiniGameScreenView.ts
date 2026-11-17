import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT, COLORS, RISK_REWARD_SCREEN_CONSTANTS } from "../../constants.ts";
import type { Question } from "./DieMiniGameScreenModel.ts";

const c = RISK_REWARD_SCREEN_CONSTANTS;

export class DieMiniGameScreenView implements View {
    private group: Konva.Group;
    private content: Konva.Group;

    constructor(
        onMenuClick: () => void,
        private onAnswerClick: (index: number) => void
    ) {
        this.group = new Konva.Group({ visible: false });

        // Background
        this.group.add(new Konva.Rect({
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: COLORS.background,
        }));

        this.group.add(this.createTitle());
        this.group.add(this.createMenuButton(onMenuClick));

        this.content = new Konva.Group();
        this.group.add(this.content);
    }

    private createMenuButton(onClick: () => void): Konva.Group {
        const button = new Konva.Group({
            x: STAGE_WIDTH - c.MENU_BUTTON_MARGIN - c.MENU_BUTTON_WIDTH,
            y: STAGE_HEIGHT - c.MENU_BUTTON_MARGIN - c.MENU_BUTTON_HEIGHT,
        });
        button.add(new Konva.Rect({
            width: c.MENU_BUTTON_WIDTH,
            height: c.MENU_BUTTON_HEIGHT,
            fill: COLORS.button,
            stroke: COLORS.buttonDark,
            strokeWidth: c.MENU_BUTTON_STROKE,
            cornerRadius: c.MENU_BUTTON_RADIUS,
        }));
        button.add(new Konva.Text({
            width: c.MENU_BUTTON_WIDTH,
            height: c.MENU_BUTTON_HEIGHT,
            text: "Menu",
            fontSize: c.MENU_BUTTON_FONT_SIZE,
            fill: COLORS.text,
            align: "center",
            verticalAlign: "middle",
        }));

        button.on("click tap", onClick);
        button.on("mouseenter", () => {
            const stage = button.getStage();
            if (stage) stage.container().style.cursor = "pointer";
        });
        button.on("mouseleave", () => {
            const stage = button.getStage();
            if (stage) stage.container().style.cursor = "default";
        });
        return button;
    }

    private createTitle(): Konva.Group {
        const title = new Konva.Group({ y: c.TITLE_Y });
        const node = new Konva.Text({
            text: "Dice Minigame Challenge",
            fontSize: c.TITLE_FONT_SIZE,
            fontFamily: "Georgia",
            fontStyle: "bold",
            fill: COLORS.accent,
        });
        title.add(node);
        title.x((STAGE_WIDTH - node.width()) / 2);
        return title;
    }

    renderGame(progress: string, score: number, question: Question | null): void {
        this.content.destroyChildren();

        // Stats Panel (Progress & Score)
        const panelY = c.STATS_PANEL_Y;
        this.content.add(new Konva.Rect({
            x: c.LEFT_X,
            y: panelY,
            width: c.LEFT_WIDTH,
            height: 80,
            fill: c.PANEL_FILL,
            stroke: c.PANEL_STROKE,
            strokeWidth: 2,
            cornerRadius: c.PANEL_RADIUS,
        }));

        this.content.add(new Konva.Text({
            x: c.LEFT_X + 20,
            y: panelY + 15,
            text: progress,
            fontSize: 16,
            fontFamily: "Arial",
            fill: COLORS.text,
        }));

        this.content.add(new Konva.Text({
            x: c.LEFT_X + 20,
            y: panelY + 45,
            text: `Score: ${score}`,
            fontSize: 20,
            fontFamily: "Arial",
            fontStyle: "bold",
            fill: COLORS.accent,
        }));

        // Question or Finished State
        const boxY = panelY + 100;
        if (!question) {
            // Finished State
            let message = "Minigame Complete!";
            if (score === 5) message = "Perfect Score! Dice Master! 🎲";
            else if (score >= 3) message = "Great Job! Probability Pro!";
            else message = "Good Effort! Try Again!";

            this.content.add(new Konva.Text({
                x: c.LEFT_X,
                y: boxY + 50,
                width: c.LEFT_WIDTH,
                text: `${message}\nFinal Score: ${score} / 5`,
                fontSize: 22,
                fontFamily: "Arial",
                fontStyle: "bold",
                fill: COLORS.text,
                align: "center",
            }));
            this.group.getLayer()?.draw();
            return;
        }

        // Question Prompt Box
        this.content.add(new Konva.Rect({
            x: c.LEFT_X,
            y: boxY,
            width: c.LEFT_WIDTH,
            height: 70,
            fill: c.CARD_FILL,
            stroke: c.CARD_STROKE,
            strokeWidth: 2,
            cornerRadius: c.RADIUS,
        }));

        this.content.add(new Konva.Text({
            x: c.LEFT_X + 15,
            y: boxY + 15,
            width: c.LEFT_WIDTH - 30,
            text: question.question,
            fontSize: 16,
            fontFamily: "Arial",
            fontStyle: "bold",
            fill: COLORS.background,
        }));

        // Option Buttons
        let optY = boxY + 90;
        question.options.forEach((optionText, index) => {
            const btnGroup = new Konva.Group({
                x: c.LEFT_X,
                y: optY,
            });

            btnGroup.add(new Konva.Rect({
                width: c.LEFT_WIDTH,
                height: 50,
                fill: c.CARD_FILL,
                stroke: c.CARD_STROKE,
                strokeWidth: 1,
                cornerRadius: c.RADIUS,
            }));

            btnGroup.add(new Konva.Text({
                x: 20,
                y: 16,
                text: `${index + 1}. ${optionText}`,
                fontSize: 16,
                fontFamily: "Arial",
                fill: COLORS.background,
            }));

            btnGroup.on("click tap", () => this.onAnswerClick(index));
            btnGroup.on("mouseenter", () => {
                const stage = btnGroup.getStage();
                if (stage) stage.container().style.cursor = "pointer";
            });
            btnGroup.on("mouseleave", () => {
                const stage = btnGroup.getStage();
                if (stage) stage.container().style.cursor = "default";
            });

            this.content.add(btnGroup);
            optY += 65;
        });

        this.group.getLayer()?.draw();
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