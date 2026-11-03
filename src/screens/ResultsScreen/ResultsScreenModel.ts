
import type { Screen } from "../../types.ts";

type ResultState = Extract<Screen, { type: "result" }>;

/** Holds end-of-level result state for the results screen. */
export class ResultsScreenModel {
    private result: ResultState = {
        type: "result",
        score: 0,
        status: "lost",
        levelId: 1,
        questionsRequired: 1,
        hiddenCard: null,
    };

    setResult(result: ResultState): void {
        this.result = result;
    }

    getScore(): number {
        return this.result.score;
    }

    isWin(): boolean {
        return this.result.status === "won";
    }

    getResult(): ResultState {
        return this.result;
    }
}
