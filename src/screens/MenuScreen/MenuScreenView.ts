import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, COLORS, MENU_SCREEN_CONSTANTS } from "../../constants.ts";

export class MenuScreenView implements View {
    private group: Konva.Group;

    /**
     * @param onStartClick        Called when START GAME is clicked
     * @param onRiskRewardClick   Called when RISK / REWARD is clicked
     * @param onDieMiniGameClick  Called when DIE MINIGAME is clicked
     */

    constructor(
        onStartClick: () => void, 
        onRiskRewardClick: () => void,
        onDieMiniGameClick: () => void
    ) {
        this.group = new Konva.Group({ visible: true });

    constructor(onStartClick: () => void, onRiskRewardClick: () => void, onSignOutClick: () => void) {
        this.group = new Konva.Group({ visible: false });

        const c = MENU_SCREEN_CONSTANTS;

        const title = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: c.TITLE_Y,
            text: "PROBABILITY GAME",
            fontSize: c.TITLE_FONT_SIZE,
            fontFamily: "Arial",
            fill: COLORS.text,
            align: "center",
        });

        title.offsetX(title.width() / 2);
        this.group.add(title);

        const subtitle = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: c.SUBTITLE_Y,
            text: "Learn probability through cards and strategy",
            fontSize: c.SUBTITLE_FONT_SIZE,
            fontFamily: "Arial",
            fill: COLORS.accent,
            align: "center",
        });

        subtitle.offsetX(subtitle.width() / 2);
        this.group.add(subtitle);

        const startButtonGroup = new Konva.Group();

        const startButton = new Konva.Rect({
            x: (STAGE_WIDTH - c.BUTTON_WIDTH) / 2,
            y: c.BUTTON_Y,
            width: c.BUTTON_WIDTH,
            height: c.BUTTON_HEIGHT,
            fill: COLORS.button,
            cornerRadius: c.BUTTON_RADIUS,
            stroke: COLORS.buttonDark,
            strokeWidth: c.BUTTON_STROKE,
        });

        const startText = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: c.BUTTON_TEXT_Y,
            text: "START GAME",
            fontSize: c.BUTTON_FONT_SIZE,
            fontFamily: "Arial",
            fill: COLORS.text,
            align: "center",
        });

        startText.offsetX(startText.width() / 2);

        startButtonGroup.add(startButton);
        startButtonGroup.add(startText);
        startButtonGroup.on("click tap", onStartClick);

        this.group.add(startButtonGroup);

        // Risk/Reward minigame button
        const rrOffsetY = c.BUTTON_HEIGHT * 1.3;
        const riskRewardGroup = new Konva.Group({ y: rrOffsetY });
        riskRewardGroup.add(new Konva.Rect({
            x: (STAGE_WIDTH - c.BUTTON_WIDTH) / 2,
            y: c.BUTTON_Y,
            width: c.BUTTON_WIDTH,
            height: c.BUTTON_HEIGHT,
            fill: COLORS.button,
            cornerRadius: c.BUTTON_RADIUS,
            stroke: COLORS.buttonDark,
            strokeWidth: c.BUTTON_STROKE,
        }));
        const riskRewardText = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: c.BUTTON_TEXT_Y,
            text: "RISK / REWARD",
            fontSize: c.BUTTON_FONT_SIZE,
            fontFamily: "Arial",
            fill: COLORS.text,
            align: "center",
        });
        riskRewardText.offsetX(riskRewardText.width() / 2);
        riskRewardGroup.add(riskRewardText);
        riskRewardGroup.on("click tap", onRiskRewardClick);
        this.group.add(riskRewardGroup);

        // Die Minigame button (shifted down by 2.6 button heights)
        const dieOffsetY = c.BUTTON_HEIGHT * 2.6;
        const dieGroup = new Konva.Group({ y: dieOffsetY });
        dieGroup.add(new Konva.Rect({

        const signOutOffset = c.BUTTON_HEIGHT * 1.3 * 2;
        const signOutGroup = new Konva.Group({ y: signOutOffset });
        signOutGroup.add(new Konva.Rect({

            x: (STAGE_WIDTH - c.BUTTON_WIDTH) / 2,
            y: c.BUTTON_Y,
            width: c.BUTTON_WIDTH,
            height: c.BUTTON_HEIGHT,
            fill: COLORS.button,
            cornerRadius: c.BUTTON_RADIUS,
            stroke: COLORS.buttonDark,
            strokeWidth: c.BUTTON_STROKE,
        }));

        const dieText = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: c.BUTTON_TEXT_Y,
            text: "DIE MINIGAME",

        const signOutText = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: c.BUTTON_TEXT_Y,
            text: "SIGN OUT",

            fontSize: c.BUTTON_FONT_SIZE,
            fontFamily: "Arial",
            fill: COLORS.text,
            align: "center",
        });

        dieText.offsetX(dieText.width() / 2);
        dieGroup.add(dieText);
        dieGroup.on("click tap", onDieMiniGameClick);
        this.group.add(dieGroup);

        // Center the text on x by shifting it left by half its width
        signOutText.offsetX(signOutText.width() / 2);
        signOutGroup.add(signOutText);
        signOutGroup.on("click tap", onSignOutClick);
        this.group.add(signOutGroup);

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
