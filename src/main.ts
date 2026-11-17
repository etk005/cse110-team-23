
import Konva from "konva";
import type { ScreenSwitcher, Screen } from "./types.ts";
import { MenuScreenController } from "./screens/MenuScreen/MenuScreenController.ts";
import { GameScreenController } from "./screens/GameScreen/GameScreenController.ts";
import { ResultsScreenController } from "./screens/ResultsScreen/ResultsScreenController.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "./constants.ts";
import { LevelsScreenController } from "./screens/LevelsScreen/LevelsScreenController.ts";
import { LoadingScreenController } from "./screens/LoadingScreen/LoadingScreenController.ts";
import { PlayerResources } from "./game/playerResources.ts";
import { RiskRewardScreenController } from "./screens/RiskRewardScreen/RiskRewardScreenController.ts";
<<<<<<< HEAD
import { DieMiniGameScreenController } from "./screens/DieMiniGame/DieMiniGameScreenController.ts"; // <--- Added import
=======
import { AuthScreenController } from "./screens/AuthScreen/AuthScreenController.ts";
import { supabase } from "./lib/supabase.ts";
>>>>>>> 0bd511a29a3edc02017dbe0151e284c707f9a9b6

// Main application class that manages the screens and navigation
class App implements ScreenSwitcher {
    private stage: Konva.Stage;
    private layer: Konva.Layer;

    private menuController: MenuScreenController;
    private gameController: GameScreenController;
    private resultsController: ResultsScreenController;
    private levelsController: LevelsScreenController;
    private loadingController: LoadingScreenController;
    private riskRewardController: RiskRewardScreenController;
<<<<<<< HEAD
    private dieMiniGameController: DieMiniGameScreenController; // <--- Added controller property
=======
    private authController: AuthScreenController;
>>>>>>> 0bd511a29a3edc02017dbe0151e284c707f9a9b6

    constructor(container: string) {
        Konva.pixelRatio = window.devicePixelRatio;

        this.stage = new Konva.Stage({
            container,
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
        });

        this.layer = new Konva.Layer();
        this.stage.add(this.layer);

        const resources = new PlayerResources();

        // Initialize the screen controllers
        this.menuController = new MenuScreenController(this);
        this.gameController = new GameScreenController(this, resources);
        this.resultsController = new ResultsScreenController(this, resources);
        this.levelsController = new LevelsScreenController(this);
        this.loadingController = new LoadingScreenController(this);
<<<<<<< HEAD
        this.riskRewardController = new RiskRewardScreenController(this);
        this.dieMiniGameController = new DieMiniGameScreenController(this); // <--- Initialized
=======
        this.riskRewardController = new RiskRewardScreenController(this, resources);
        this.authController = new AuthScreenController(this);
>>>>>>> 0bd511a29a3edc02017dbe0151e284c707f9a9b6

        // Add all screen views to the same layer
        this.layer.add(this.menuController.getView().getGroup());
        this.layer.add(this.gameController.getView().getGroup());
        this.layer.add(this.resultsController.getView().getGroup());
        this.layer.add(this.levelsController.getView().getGroup());
        this.layer.add(this.loadingController.getView().getGroup());
        this.layer.add(this.riskRewardController.getView().getGroup());
<<<<<<< HEAD
        this.layer.add(this.dieMiniGameController.getView().getGroup()); // <--- Added view group
=======
        this.layer.add(this.authController.getView().getGroup());
>>>>>>> 0bd511a29a3edc02017dbe0151e284c707f9a9b6

        window.addEventListener("resize", () => this.fitStageToViewport());

        this.layer.draw();
        this.fitStageToViewport();
        this.switchToScreen({
            type: "loading",
            loader: async () => {
                const result = await supabase.auth.getUser();
                if (result.data.user === null) {
                    return { type: "auth" };
                } else {
                    return { type: "menu" };
                }
            }
        })
    }

    private fitStageToViewport(): void {
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;

        const scale = Math.min(
            viewportWidth / STAGE_WIDTH,
            viewportHeight / STAGE_HEIGHT
        );

        this.stage.width(STAGE_WIDTH * scale);
        this.stage.height(STAGE_HEIGHT * scale);
        this.stage.scale({ x: scale, y: scale });

        this.stage.batchDraw();
    }

    switchToScreen(screen: Screen): void {
        this.menuController.hide();
        this.gameController.hide();
        this.resultsController.hide();
        this.levelsController.hide();
        this.loadingController.hide();
        this.riskRewardController.hide();
<<<<<<< HEAD
        this.dieMiniGameController.hide(); // <--- Added hide
=======
        this.authController.hide();
>>>>>>> 0bd511a29a3edc02017dbe0151e284c707f9a9b6

        switch (screen.type) {
            case "menu":
                this.menuController.show();
                break;

            case "game":
                if (screen.level) {
                    this.gameController.setLevel(screen.level);
                }
                this.gameController.startGame();
                break;

            case "result":
                this.resultsController.showResults(screen.won, screen.points);
                break;

            case "levels":
                if (this.levelsController.isLoaded()) {
                    this.levelsController.show();
                } else {
                    this.levelsController.load();
                }
                break;

            case "riskReward":
                this.riskRewardController.startGame();
                break;

            case "dieMiniGame": // <--- Added case handler
                this.dieMiniGameController.startGame();
                break;

            case "loading":
                this.loadingController.wait(screen.loader);
                break;

            case "auth":
                this.authController.show();
                break;
        }
    }
}

new App("container");