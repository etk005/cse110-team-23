
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { GameScreenModel } from "./GameScreenModel.ts";
import { GameScreenView } from "./GameScreenView.ts";

export class GameScreenController extends ScreenController {
    private model: GameScreenModel;
    private view: GameScreenView;
    private screenSwitcher: ScreenSwitcher;

    constructor(screenSwitcher: ScreenSwitcher) {
        super();

        this.screenSwitcher = screenSwitcher;
        this.model = new GameScreenModel();

        this.view = new GameScreenView(
            (answer) => this.handleAnswer(answer),
            () => this.screenSwitcher.switchToScreen({ type: "menu" }),
            () => this.handleNext()
        );
    }

    startGame(): void {
        this.model.reset();
        this.updateView();
        this.show();
    }

    private handleAnswer(answer: string): void {
        if (this.model.isWaitingForNext()) {
            return;
        }

        const correct = this.model.submitAnswer(answer);
        const state = this.model.getState();

        if (correct) {
            this.updateView(
                "Correct! Great job!",
                true
            );
        } else if (state.status === "lost") {
            this.showResults();
        } else {
            this.updateView(
                "Incorrect! Try again."
            );
        }
    }

    private handleNext(): void {
        if (!this.model.isWaitingForNext()) {
            return;
        }

        const state = this.model.getState();

        if (state.status === "won") {
            this.showResults();
            return;
        }

        this.model.nextQuestion();
        this.updateView();
    }

    private showResults(): void {
        this.screenSwitcher.switchToScreen({
            type: "result",
            score: this.model.getState().questionsAnswered,
        });
    }

    private updateView(
        feedback = "",
        showNext = false
    ): void {
        this.view.render(
            this.model.getState(),
            this.model.getAnswerOptions(),
            feedback,
            showNext
        );
    }

    getView(): GameScreenView {
        return this.view;
    }
}
