import Konva from "konva";

export function addPanel(
    parent: Konva.Group,
    x: number,
    y: number,
    w: number,
    h: number,
    title: string
): Konva.Group {
    const panel = new Konva.Group({x,y})
    panel.add(new Konva.Rect({
        width: w,
        height: h,
        fill: "#fffdf4",
        cornerRadius: 16,
    }));
    panel.add(new Konva.Text({
        x: 16,
        y: 16,
        text: title,
        fontSize: 22,
        fontFamily: "Georgia, serif",
        fill: "#07451c",
    }));
    parent.add(panel);
    return panel;
}