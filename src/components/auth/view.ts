import Konva from "konva";
import EditableText from "../editable-text";

type OnSignUp = (email: string, password: string) => void;
type OnSignIn = (email: string, password: string) => void;
type OnSignOut = () => void;

export default class View {
  private group: Konva.Group;
  private userText: Konva.Text;

  constructor(onSignUp: OnSignUp, onSignIn: OnSignIn, onSignOut: OnSignOut) {
    const group = new Konva.Group();

    const box = new Konva.Rect({
      width: 500,
      height: 500,
      stroke: "black",
    });
    group.add(box);

    const email = new Konva.Group({
      width: 310,
      height: 20,
      offsetX: -box.width() / 2 + 155,
      offsetY: -box.height() / 2 + 40,
    });
    const emailBox = new Konva.Rect({
      width: 310,
      height: 20,
      stroke: "black",
    });
    email.add(emailBox);
    const emailText = new EditableText({
      width: 310,
      height: 20,
      text: "etk005@ucsd.edu",
      fontSize: 15,
      offsetX: -2,
      offsetY: -2,
    });
    emailText.on("dblclick dbltap", () => {
      emailText.focus();
    });
    email.add(emailText);
    group.add(email);

    const password = new Konva.Group({
      width: 310,
      height: 20,
      offsetX: -box.width() / 2 + 155,
      offsetY: -box.height() / 2 + 15,
    });
    const passwordBox = new Konva.Rect({
      width: 310,
      height: 20,
      stroke: "black",
    });
    password.add(passwordBox);
    const passwordText = new EditableText({
      width: 310,
      height: 20,
      text: "mypassword",
      fontSize: 15,
      offsetX: -2,
      offsetY: -2,
    });
    passwordText.on("dblclick dbltap", () => {
      passwordText.focus();
    });
    password.add(passwordText);
    group.add(password);

    const signUp = new Konva.Group({
      width: 100,
      height: 20,
      offsetX: -box.width() / 2 + 50,
      offsetY: -box.height() / 2 - 10,
    });
    const signUpBox = new Konva.Rect({
      width: 100,
      height: 20,
      stroke: "black",
    });
    signUpBox.on("click", () => {
      onSignUp(emailText.text(), passwordText.text());
    });
    signUp.add(signUpBox);
    const signUpText = new Konva.Text({
      text: "sign up",
      fontSize: 15,
      offsetX: -2,
      offsetY: -2,
    });
    signUp.add(signUpText);
    group.add(signUp);

    const signIn = new Konva.Group({
      width: 100,
      height: 20,
      offsetX: -box.width() / 2 + 155,
      offsetY: -box.height() / 2 - 10,
    });
    const signInBox = new Konva.Rect({
      width: 100,
      height: 20,
      stroke: "black",
    });
    signInBox.on("click", () => {
      onSignIn(emailText.text(), passwordText.text());
    });
    signIn.add(signInBox);
    const signInText = new Konva.Text({
      text: "sign in",
      fontSize: 15,
      offsetX: -2,
      offsetY: -2,
    });
    signIn.add(signInText);
    group.add(signIn);

    const signOut = new Konva.Group({
      width: 100,
      height: 20,
      offsetX: -box.width() / 2 - 55,
      offsetY: -box.height() / 2 - 10,
    });
    const signOutBox = new Konva.Rect({
      width: 100,
      height: 20,
      stroke: "black",
    });
    signOutBox.on("click", () => {
      onSignOut();
    });
    signOut.add(signOutBox);
    const signOutText = new Konva.Text({
      text: "sign out",
      fontSize: 15,
      offsetX: -2,
      offsetY: -2,
    });
    signOut.add(signOutText);
    group.add(signOut);

    const user = new Konva.Group({
      width: 310,
      height: 20,
      offsetX: -box.width() / 2 + 155,
      offsetY: -box.height() / 2 + 65,
    });
    const userText = new Konva.Text({
      fontSize: 15,
    });
    user.add(userText);
    group.add(user);

    this.group = group;
    this.userText = userText;
    this.setUser(undefined);
  }

  setUser(user: string | undefined): void {
    if (user === undefined) {
      this.userText.text("not signed in");
    } else {
      this.userText.text(`signed in as ${user}`);
    }
  }

  getGroup(): Konva.Group {
    return this.group;
  }
}
