import Konva from "konva";
import AuthController from "./components/auth/controller";

class App {
  constructor(container: string) {
    const stage = new Konva.Stage({
      container,
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    const auth = new AuthController();
    const authGroup = auth.getView().getGroup();
    authGroup.x(stage.width() / 2 - 250);
    authGroup.y(stage.height() / 2 - 250);
    layer.add(authGroup);
  }
}

new App("app");
