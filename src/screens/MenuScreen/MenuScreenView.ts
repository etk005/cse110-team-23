import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, COLORS, MENU_SCREEN_CONSTANTS } from "../../constants.ts";

export class MenuScreenView implements View {
    private group: Konva.Group;

    /**
     * @param onStartClick      Called when START GAME is clicked
     * @param onRiskRewardClick Called when RISK / REWARD is clicked
     */

    // , onDieMiniGameClick?: () => void
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

        // Risk/Reward minigame button, directly below Start.
        // It reuses the Start button's positions and the whole group is shifted
        // down by 1.3 button heights, leaving a small gap between the two.
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
        // Center the text on x by shifting it left by half its width
        riskRewardText.offsetX(riskRewardText.width() / 2);
        riskRewardGroup.add(riskRewardText);
        riskRewardGroup.on("click tap", onRiskRewardClick);
        this.group.add(riskRewardGroup);

        // // added DieMiniGame here
        // const dieMiniGameOffset = c.BUTTON_HEIGHT * 1.3 * 3;
        // if (onDieMiniGameClick) {
        // const dieMiniGameGroup = new Konva.Group({ y: dieMiniGameOffset });
        // dieMiniGameGroup.add(new Konva.Rect({
        //     x: (STAGE_WIDTH - c.BUTTON_WIDTH) / 2,
        //     y: c.BUTTON_Y,
        //     width: c.BUTTON_WIDTH,
        //     height: c.BUTTON_HEIGHT,
        //     fill: COLORS.button,
        //     cornerRadius: c.BUTTON_RADIUS,
        //     stroke: COLORS.buttonDark,
        //     strokeWidth: c.BUTTON_STROKE,
        // }));
        // const dieMiniGameText = new Konva.Text({
        //     x: STAGE_WIDTH / 2,
        //     y: c.BUTTON_TEXT_Y,
        //     text: "DIE MINIGAME",
        //     fontSize: c.BUTTON_FONT_SIZE,
        //     fontFamily: "Arial",
        //     fill: COLORS.text,
        //     align: "center",
        // });
        // dieMiniGameText.offsetX(dieMiniGameText.width() / 2);
        // dieMiniGameGroup.add(dieMiniGameText);
        // dieMiniGameGroup.on("click tap", onDieMiniGameClick);
        // this.group.add(dieMiniGameGroup);
        
        // }

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
        const signOutText = new Konva.Text({
            x: STAGE_WIDTH / 2,
            y: c.BUTTON_TEXT_Y,
            text: "SIGN OUT",
            fontSize: c.BUTTON_FONT_SIZE,
            fontFamily: "Arial",
            fill: COLORS.text,
            align: "center",
        });
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
