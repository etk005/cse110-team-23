import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { DieMiniGameScreenModel } from "./DieMiniGameScreenModel.ts";
import { DieMiniGameScreenView } from "./DieMiniGameScreenView.ts";

export class DieMiniGameScreenController extends ScreenController {
    private model: DieMiniGameScreenModel;
    private view: DieMiniGameScreenView;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.model = new DieMiniGameScreenModel();
        this.view = new DieMiniGameScreenView(
            () => screenSwitcher.switchToScreen({ type: "menu" }),
            (optionIndex) => this.handleAnswer(optionIndex)
        );
    }

    private handleAnswer(optionIndex: number): void {
        this.model.answerCurrentQuestion(optionIndex);
        this.renderView();
    }

    private renderView(): void {
        this.view.renderGame(
            this.model.getProgressText(),
            this.model.getScore(),
            this.model.getCurrentQuestion()
        );
    }

    startGame(): void {
        this.model.start();
        this.renderView();
        this.show();
    }

    getModel(): DieMiniGameScreenModel {
        return this.model;
    }

    getView(): DieMiniGameScreenView {
        return this.view;
    }
}