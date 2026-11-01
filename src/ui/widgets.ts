import Konva from "konva";
import { GAME_SCREEN_CONSTANTS } from "../constants.ts";

const c = GAME_SCREEN_CONSTANTS;

export function addPanel(
    parent: Konva.Group,
    x: number,
    y: number,
    w: number,
    h: number,
    title: string
): Konva.Group {
    const panel = new Konva.Group({ x, y });
    panel.add(new Konva.Rect({
        width: w,
        height: h,
        fill: c.PANEL_FILL,
        cornerRadius: c.PANEL_RADIUS,
    }));
    panel.add(new Konva.Text({
        x: c.PANEL_PADDING,
        y: c.PANEL_PADDING,
        text: title,
        fontSize: c.PANEL_TITLE_FONT_SIZE,
        fontFamily: "Georgia, serif",
        fill: c.PANEL_TEXT,
    }));
    parent.add(panel);
    return panel;
}
