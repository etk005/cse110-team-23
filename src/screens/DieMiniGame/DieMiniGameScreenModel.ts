export interface Question {
    question: string;
    options: string[];
    correctIndex: number;
}

export class DieMiniGameScreenModel {
    private questions: Question[] = [
        {
            question: "What is the probability that a pair of dice add up to 7?",
            options: ["1/6", "1/12", "5/36", "1/9"],
            correctIndex: 0 // 1/6
        },
        {
            question: "What is the probability that a pair of dice add up to an even number?",
            options: ["1/3", "1/2", "1/4", "2/3"],
            correctIndex: 1 // 1/2
        },
        {
            question: "What is the probability that a pair of dice are both prime numbers?",
            options: ["1/6", "1/9", "1/4", "1/3"],
            correctIndex: 2 // 1/4
        },
        {
            question: "What is the probability where one die is a factor of the other?",
            options: ["5/18", "7/18", "4/9", "1/2"],
            correctIndex: 1 // 7/18
        },
        {
            question: "What is the probability that the absolute difference between a pair of dice is 2?",
            options: ["1/6", "1/9", "2/9", "5/36"],
            correctIndex: 2 // 2/9
        }
    ];

    private currentQuestionIndex = 0;
    private score = 0;

    constructor() {
        this.currentQuestionIndex = 0;
        this.score = 0;
    }

    public resetGame(): void {
        this.currentQuestionIndex = 0;
        this.score = 0;
    }

    public getCurrentQuestion(): Question | null {
        return this.questions[this.currentQuestionIndex] ?? null;
    }

    public getCurrentQuestionNumber(): number {
        return this.currentQuestionIndex + 1;
    }

    public answerCurrentQuestion(selectedIndex: number): boolean {
        const current = this.getCurrentQuestion();
        if (!current) return false;

        const isCorrect = selectedIndex === current.correctIndex;
        if (isCorrect) {
            this.score += 1;
        }

        this.currentQuestionIndex++;
        return isCorrect;
    }

    public isGameOver(): boolean {
        return this.currentQuestionIndex >= this.questions.length;
    }

    public getScore(): number {
        return this.score;
    }

    public getTotalQuestions(): number {
        return this.questions.length;
    }
}