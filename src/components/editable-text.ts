import Konva from "konva";

const HEIGHT_BUFFER = 1;

// https://konvajs.org/docs/sandbox/Editable_Text.html
export default class EditableText extends Konva.Text {
  private textarea: HTMLTextAreaElement;

  constructor(config?: Konva.TextConfig) {
    super(config);

    this.textarea = document.createElement("textarea");
    this.textarea.addEventListener("input", () => {
      this.text(this.textarea.value);
    });
    this.textarea.addEventListener("blur", () => {
      this.textarea.parentNode?.removeChild(this.textarea);
      this.show();
    });
    this.textarea.style.position = "absolute";
    this.textarea.style.border = "none";
    this.textarea.style.padding = "0px";
    this.textarea.style.margin = "0px";
    this.textarea.style.overflow = "hidden";
    this.textarea.style.background = "none";
    this.textarea.style.outline = "none";
    this.textarea.style.resize = "none";

    this.on("textChange", () => {
      this.refreshText();
      this.refreshSize();
    });
    this.on("xChange yChange dragmove", () => {
      this.refreshPosition();
    });
    this.on(
      "fontSizeChange lineHeightChange fontFamilyChange alignChange fillChange",
      () => {
        this.refreshTextStyle();
      },
    );
  }

  private refreshText(): void {
    this.textarea.value = this.text();
  }

  private refreshPosition(): void {
    const stage = this.getStage();
    if (stage === null) return;

    const absRect = stage.container().getBoundingClientRect();
    const relPos = this.getAbsoluteTransform().point({ x: 0, y: 0 });
    this.textarea.style.top = `${Math.round(absRect.top + relPos.y)}px`;
    this.textarea.style.left = `${Math.round(absRect.left + relPos.x)}px`;
  }

  private refreshSize(): void {
    this.textarea.style.width = `${this.width()}px`;
    this.textarea.style.height = `${this.height() + HEIGHT_BUFFER}px`;
  }

  private refreshTextStyle(): void {
    this.textarea.style.fontSize = `${this.fontSize()}px`;
    this.textarea.style.lineHeight = this.lineHeight().toString();
    this.textarea.style.fontFamily = this.fontFamily();
    this.textarea.style.textAlign = this.align();
    this.textarea.style.color = this.fill().toString();
  }

  focus(): void {
    this.refreshText();
    this.refreshPosition();
    this.refreshSize();
    this.refreshTextStyle();

    this.hide();

    document.body.appendChild(this.textarea);
    this.textarea.focus();
  }

  blur(): void {
    this.textarea.blur();
  }
}
