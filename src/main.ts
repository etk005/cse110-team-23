
import Konva from "konva";
import type { ScreenSwitcher, Screen } from "./types.ts";
import { MenuScreenController } from "./screens/MenuScreen/MenuScreenController.ts";
import { GameScreenController } from "./screens/GameScreen/GameScreenController.ts";
import { ResultsScreenController } from "./screens/ResultsScreen/ResultsScreenController.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "./constants.ts";

class App implements ScreenSwitcher {
    private stage: Konva.Stage;
    private layer: Konva.Layer;

    private menuController: MenuScreenController;
    private gameController: GameScreenController;
    private resultsController: ResultsScreenController;

    constructor(container: string) {
        this.stage = new Konva.Stage({
            container,
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
        });

        this.layer = new Konva.Layer();
        this.stage.add(this.layer);

        this.menuController = new MenuScreenController(this);
        this.gameController = new GameScreenController(this);
        this.resultsController = new ResultsScreenController(this);

        this.layer.add(this.menuController.getView().getGroup());
        this.layer.add(this.gameController.getView().getGroup());
        this.layer.add(this.resultsController.getView().getGroup());

        this.layer.draw();
        this.menuController.show();
    }

    switchToScreen(screen: Screen): void {
        this.menuController.hide();
        this.gameController.hide();
        this.resultsController.hide();

        switch (screen.type) {
            case "menu":
                this.menuController.show();
                break;

            case "game":
                this.gameController.startGame();
                break;

            case "result":
                this.resultsController.showResults(screen.score);
                break;
        }
    }
}

new App("container");
