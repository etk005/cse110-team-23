export interface Question {
    prompt: string;
    options: string[];
    correctIndex: number;
}

export class DieMiniGameScreenModel {
    private currentIndex = 0;
    private score = 0;
    private isFinished = false;

    // Hardcoded 5 questions - you can customize these text strings easily!
    private questions: Question[] = [
        {
            prompt: "Question 1: What is the standard starting risk card count?",
            options: ["3 Cards", "5 Cards", "7 Cards", "10 Cards"],
            correctIndex: 2, // 7 Cards
        },
        {
            prompt: "Question 2: What framework is used to render this UI?",
            options: ["React", "Konva.js", "Vue", "Angular"],
            correctIndex: 1, // Konva.js
        },
        {
            prompt: "Question 3: Which design pattern separates logic from visuals here?",
            options: ["MVC (Model-View-Controller)", "Singleton", "Factory", "Observer only"],
            correctIndex: 0,
        },
        {
            prompt: "Question 4: By what night must sprint features be merged?",
            options: ["Friday night", "Sunday night", "Monday night", "Tuesday night"],
            correctIndex: 2, // Monday night
        },
        {
            prompt: "Question 5: What is the primary goal of this 5-hour crunch?",
            options: ["Build a working MVP", "Rewrite the engine", "Add multiplayer", "Do nothing"],
            correctIndex: 0,
        },
    ];

    constructor() {
        this.start();
    }

    start(): void {
        this.currentIndex = 0;
        this.score = 0;
        this.isFinished = false;
    }

    getCurrentQuestion(): Question | null {
        const q = this.questions[this.currentIndex];
        if (this.isFinished || !q) {
            return null;
        }
        return q;
    }

    answerCurrentQuestion(selectedOptionIndex: number): boolean {
        const q = this.getCurrentQuestion();
        if (!q) return false;

        const correct = selectedOptionIndex === q.correctIndex;
        if (correct) {
            this.score += 10;
        }

        this.currentIndex++;
        if (this.currentIndex >= this.questions.length) {
            this.isFinished = true;
        }
        return correct;
    }

    getScore(): number {
        return this.score;
    }

    getProgressText(): string {
        return `Question ${Math.min(this.currentIndex + 1, this.questions.length)} of ${this.questions.length}`;
    }

    isGameOver(): boolean {
        return this.isFinished;
    }
}