
/** Holds the outcome of the completed or failed level. */
export class ResultsScreenModel {
    private won = false;
    private points = 0;

    setResult(won: boolean, points: number): void {
        this.won = won;
        this.points = points;
    }

    getPoints(): number {
        return this.points;
    }

    isWin(): boolean {
        return this.won;
    }
}
