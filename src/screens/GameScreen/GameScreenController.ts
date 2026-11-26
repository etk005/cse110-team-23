import type { Card, HintKind, Level } from "../../shared/types.ts";
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { GameScreenModel } from "./GameScreenModel.ts";
import { GameScreenView } from "./GameScreenView.ts";
import { levelPoints } from "../../game/playerResources.ts";
import type { PlayerResources } from "../../game/playerResources.ts";
import { COST_OF_CLUE } from "../../constants.ts";
import { saveCoins } from "../../lib/playerCoins.ts";
import { CHIPS_PER_GUESS } from "../../game/rewardEngine.ts";

/** 
 * Coordinates the game screen: connects model state to view rendering and input callbacks. 
 * */
export class GameScreenController extends ScreenController {
    private model: GameScreenModel;
    private view: GameScreenView;
    private screenSwitcher: ScreenSwitcher;
    private resources: PlayerResources;

    constructor(screenSwitcher: ScreenSwitcher, resources: PlayerResources) {
        super();

        this.screenSwitcher = screenSwitcher;
        this.resources = resources;
        this.model = new GameScreenModel();

        this.view = new GameScreenView(
            (answer) => this.handleAnswer(answer),
            () => this.screenSwitcher.switchToScreen({ type: "menu" }),
            () => this.handleNext(),
            () => this.handleBuyInfo(),
            (kind) => this.handleChooseHint(kind),
            (guess) => this.handleGuess(guess)
        );

        // keep the coins/score readout current when rewards or purchases change them
        this.resources.onChange(() => this.updateResources());
        this.updateResources();
    }

    /** 
     * Resets the model and renders the initial game state. 
     * */
    startGame(): void {
        this.model.reset();
        this.updateView();
        this.show();
    }

    setLevel(level: Level): void {
        this.model.setLevel(level);
    }

    private handleAnswer(answer: string): void {
        if (this.model.isWaitingForNext()) {
            return;
        }

        const correct = this.model.submitAnswer(answer);
        const state = this.model.getState();

        if (correct) {
            this.updateView("Correct! Great job!", true);
        } else if (state.status === "lost") {
            this.showResults();
        } else {
            this.updateView("Incorrect! Try again.");
        }
    }

    private handleNext(): void {
        const state = this.model.getState();

        if (state.status === "won") {
            this.showResults();
            return;
        }

        if (!this.model.isWaitingForNext()) {
            return;
        }

        this.model.nextQuestion();
        this.updateView();
    }
    private handleBuyInfo(): void {
        const result = this.model.openHintMenu();
        this.updateView(this.getBuyInfoMessage(result));
    }

    private async handleChooseHint(kind: HintKind): Promise<void> {
        const state = this.model.getState();
        if (state.status != "playing" || this.model.isWaitingForNext()) {
            return;
        }
        let alreadyBought : boolean;
        if (kind === "cards") {
            alreadyBought = state.canViewRemainingCards;
        }
        else{
            alreadyBought = state.probabilityRange !== null;
        }
        // Check for an existing hint before charging coins.
        if (alreadyBought) {
            this.updateView("You already bought that hint.");
            return;
        }
        if (this.resources.getCoins() < COST_OF_CLUE) {
            this.updateView("Not enough coins!");
            return;
        }
        const previousBalance = this.resources.getCoins();
        let savedBalance: number;
        try{
        savedBalance = await saveCoins(previousBalance, previousBalance - COST_OF_CLUE);
        
        }
        catch (error) {
            console.error("Failed to save hint purchase", error);
            this.updateView("Could not buy hint. Please try again.");
            return;
        }
        this.resources.setCoins(savedBalance);
        const result = this.model.buyHint(kind);
        if (result !== "bought") {
            return;
        }
        this.updateView(this.getBuyInfoMessage(result));
        
        if (kind === "cards") {
            this.view.showRemainingCards(
                this.model.getState().remainingPossibleCards
            );
        }
        this.view.showCoinsSpent(COST_OF_CLUE);
    }

    private getBuyInfoMessage(result: string): string {
        switch (result) {
            case "opened":
                return "Choose a hint.";
            case "bought":
                return "Clue bought!";
            case "already_bought":
                return "You already bought that hint.";
            default:
                return "";
        }
    }
    

    /** Records the level's points, then opens the results screen. */
    private showResults(): void {
        const state = this.model.getState();
        const won = state.status === "won";
        const points = levelPoints(won, state.strikes);

        this.resources.recordLevelResult(state.levelId, points);

        this.screenSwitcher.switchToScreen({
            type: "result",
            won,
            points,
        });
    }

    private updateResources(): void {
        this.view.updateResources(
            this.resources.getCoins(),
            this.resources.getScore(),
            // what clearing the level would be worth right now
            levelPoints(true, this.model.getState().strikes)
        );
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

        // strikes change the level's points, so refresh the readout too
        this.updateResources();
    }

    getView(): GameScreenView {
        return this.view;
    }

    private handleGuess(card: Card) {
        if (this.model.isWaitingForNext()) {
            return;
        }
        const state = this.model.getState();
        if (state.hasGuessedThisQuestion) {
            this.updateView("Already guessed this question!");
            return;
        }
        let coins = this.resources.getCoins();
        if (coins < CHIPS_PER_GUESS) {
            this.updateView("Not enough coins!");
            return;
        }
        coins -= CHIPS_PER_GUESS;
        this.resources.setCoins(coins);
        this.view.showCoinsSpent(CHIPS_PER_GUESS);
        if (this.model.guessCard(card)) {
            coins += this.model.getReward();
            this.resources.setCoins(coins);
            this.updateView("You guessed it!", true);
        } else {
            this.updateView("Keep trying!");
        }
    }
}
