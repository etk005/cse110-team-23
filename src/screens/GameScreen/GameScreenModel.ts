import type { GameState } from "../../shared/types.ts";
import { mockGameState } from "../../mocks/mockGameState.ts";

/** 
 * Manages game state for an active level. 
 * */
export class GameScreenModel {
    private state: GameState;
    private waitingForNext = false;

    constructor() {
        this.state = structuredClone(mockGameState);
    }

    /** 
     * Resets the game back to its initial mock state. 
     * */
    reset(): void {
        this.state = structuredClone(mockGameState);
        this.waitingForNext = false;
    }

    getState(): GameState {
        return this.state;
    }

    /** 
     * Returns the fixed set of fraction/decimal answer choices. 
     * */
    getAnswerOptions(): string[] {
        return ["0", "1/4", "1/2", "3/4", "1"];
    }

    /**
     * True after a correct answer has been submitted and before the
     * player clicks "Next Question" — blocks duplicate submissions.
     */
    isWaitingForNext(): boolean {
        return this.waitingForNext;
    }
}
