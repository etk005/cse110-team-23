
/** Holds the final score for the completed or failed level. */
export class ResultsScreenModel {
    private score = 0;

    setScore(score: number): void {
        this.score = score;
    }

    getScore(): number {
        return this.score;
    }

    isWin(): boolean {
        return this.score >= 3;
    }
}
