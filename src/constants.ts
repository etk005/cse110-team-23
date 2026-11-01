/**
 * Logical canvas size. Every position and size in the views is written in
 * these pixels; the stage scales the whole thing to fit the browser window.
 */
export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

// card.png is 360x432, but the card itself only fills part of it; the rest is
// transparent padding. These numbers were measured from the file.
const CARD_IMAGE_WIDTH = 360;
const CARD_IMAGE_HEIGHT = 432;
const CARD_VISIBLE_LEFT = 68;
const CARD_VISIBLE_RIGHT = 292; // exclusive
const CARD_VISIBLE_BOTTOM = 371; // exclusive
const CARD_VISIBLE_HEIGHT_PX = 310;

// In Figma the visible card is about 311px tall in a 900px-tall frame, so it
// takes up the same share of the stage height here.
const CARD_VISIBLE_HEIGHT = STAGE_HEIGHT * (311 / 900);
const CARD_SCALE = CARD_VISIBLE_HEIGHT / CARD_VISIBLE_HEIGHT_PX;

// Size to draw the whole image at (padding included).
const CARD_HEIGHT = CARD_IMAGE_HEIGHT * CARD_SCALE;
const CARD_WIDTH = CARD_IMAGE_WIDTH * CARD_SCALE;

const LOGO_HEIGHT = 65;
const LOGO_WIDTH = LOGO_HEIGHT * (166 / 36);
const LOGO_X = 24;

// The question text. The card's bottom edge lines up with the bottom of this row.
const QUESTION_Y = 594;
const QUESTION_FONT_SIZE = 41;

// Card sits under the logo, centered on it, bottom-aligned with the question.
// Position the image so the VISIBLE card (not the padding) is centered on the
// logo, with its bottom edge level with the bottom of the question text.
const CARD_X =
    LOGO_X +
    LOGO_WIDTH / 2 -
    ((CARD_VISIBLE_LEFT + CARD_VISIBLE_RIGHT) / 2) * CARD_SCALE;
const CARD_Y = QUESTION_Y + QUESTION_FONT_SIZE - CARD_VISIBLE_BOTTOM * CARD_SCALE;

const LEFT_COLUMN_X = 58;
const RIGHT_COLUMN_X = 384; // smaller = panels move left
const RIGHT_COLUMN_WIDTH = 1248; // smaller = narrower panels

export const GAME_SCREEN_CONSTANTS = {
    MARGIN: 58,
    HEADER_Y: 36,

    LOGO_HEIGHT,
    LOGO_WIDTH,
    LOGO_X,
    LOGO_Y: 24,

    QUESTION_Y,
    QUESTION_FONT_SIZE,

    CARD_X,
    CARD_Y,
    CARD_HEIGHT,
    CARD_WIDTH,

    LEFT_COLUMN_X,
    RIGHT_COLUMN_X,
    RIGHT_COLUMN_WIDTH,

    PANEL_RADIUS: 38,
    PANEL_PADDING: 38,
    PANEL_FILL: "#fffdf4",
    PANEL_TEXT: "#07451c",

    REMAINING_PANEL_Y: CARD_Y + CARD_HEIGHT + 29,
    REMAINING_PANEL_WIDTH: 528,
    REMAINING_PANEL_HEIGHT: 158,

    INFO_PANEL_Y: 162,
    INFO_PANEL_HEIGHT: 216,
    PROBABILITY_PANEL_Y: 396,
    PROBABILITY_PANEL_HEIGHT: 252,
    GUESS_PANEL_Y: 666,
    GUESS_PANEL_HEIGHT: 180,

    FOOTER_Y: 954,

    STATS_X: 1392,
    STATS_Y_STRIKES: 63,
    STATS_Y_PROGRESS: 117,

    // Button sizes. The views center each row, so only sizes and gaps live here.
    BUTTON_HEIGHT: 61,
    BUTTON_FONT_SIZE: 25,
    BUTTON_RADIUS: 14,
    MENU_BUTTON_WIDTH: 228,
    NEXT_BUTTON_WIDTH: 276,
    FOOTER_BUTTON_GAP: 38,
};

export const COLORS = {
    background: "#07451c",
    panel: "#b62335",
    button: "#b62335",
    buttonDark: "#9f3039",
    text: "#fffdf4",
    accent: "#f1c653",
    border: "#fffdf4",
};
