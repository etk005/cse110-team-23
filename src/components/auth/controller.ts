import Model from "./model";
import View from "./view";

export default class Controller {
  private model: Model;
  private view: View;

  constructor() {
    this.model = new Model();
    this.view = new View(
      (email, password) => {
        this.model.signUp(email, password).then(() => {
          this.refreshUser();
        });
      },
      (email, password) => {
        this.model.signIn(email, password).then(() => {
          this.refreshUser();
        });
      },
      () => {
        this.model.signOut().then(() => {
          this.refreshUser();
        });
      },
    );
    this.refreshUser();
  }

  private async refreshUser(): Promise<void> {
    const user = await this.model.getUser();
    this.view.setUser(user);
  }

  getView(): View {
    return this.view;
  }
}
