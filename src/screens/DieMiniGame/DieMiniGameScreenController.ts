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
            // onMenuClick: returns to menu anytime
            () => {
                screenSwitcher.switchToScreen({ type: "menu" });
            },
            // onAnswerClick:
            (selectedIndex: number) => {
                this.model.answerCurrentQuestion(selectedIndex);
                
                // Always update view so if it's game over, 
                // it draws the "Minigame Complete" summary screen!
                this.updateView();

                // Optional: If you want the menu button to work 
                // when game is over, the existing Menu button already does this.
            }
        );
        
    }

    public startGame(): void {
        this.model.resetGame();
        this.updateView();
        this.show();
    }

    private updateView(): void {
        const question = this.model.getCurrentQuestion();
        const currentNum = this.model.getCurrentQuestionNumber();
        const total = this.model.getTotalQuestions();
        
        this.view.renderGame(
            `Question ${currentNum} of ${total}`, 
            this.model.getScore(), 
            question
        );
    }

    getView(): DieMiniGameScreenView {
        return this.view;
    }
}