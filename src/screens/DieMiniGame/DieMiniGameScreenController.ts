import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { DieMiniGameScreenModel } from "./DieMiniGameScreenModel.ts";
import { DieMiniGameScreenView } from "./DieMiniGameScreenView.ts";

export class DieMiniGameScreenController extends ScreenController {
    private view: DieMiniGameScreenView;
    private model: DieMiniGameScreenModel;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();
        this.model = new DieMiniGameScreenModel();
        
        this.view = new (DieMiniGameScreenView as any)(
            (selectedIndex: number) => {
                this.model.answerCurrentQuestion(selectedIndex);
                if (this.model.isGameOver()) {
                    screenSwitcher.switchToScreen({ type: "menu" });
                } else {
                    this.updateView();
                }
            },
            () => {
                screenSwitcher.switchToScreen({ type: "menu" });
            }
        );
        
        this.updateView();
    }

    private updateView(): void {
        const question = this.model.getCurrentQuestion();
        this.view.renderGame(
            `Question`, 
            this.model.getScore(), 
            question
        );
    }

    getView(): DieMiniGameScreenView {
        return this.view;
    }
}