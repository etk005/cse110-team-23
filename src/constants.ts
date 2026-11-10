/**
 * Logical canvas size. The stage scales the whole drawing to fit the window.
 *
 * Every position and size below is a simple fraction of the stage:
 *   W / 5   = one fifth of the width         H / 2 = half the height
 *   W * 2/3 = two thirds of the width        H / 7 = one seventh of the height
 * x positions and widths use W; y positions, heights and font sizes use H.
 * Change STAGE_WIDTH / STAGE_HEIGHT and everything moves and resizes with it.
 */
export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

const W = STAGE_WIDTH;
const H = STAGE_HEIGHT;

// card.png is 360x432, but the card itself only fills part of it; the rest is
// transparent padding. These numbers were measured from the file (image pixels).
const CARD_IMAGE_WIDTH = 360;
const CARD_IMAGE_HEIGHT = 432;
const CARD_VISIBLE_LEFT = 68;
const CARD_VISIBLE_RIGHT = 292; // exclusive
const CARD_VISIBLE_BOTTOM = 371; // exclusive
const CARD_VISIBLE_HEIGHT_PX = 310;

// In Figma the visible card is about 311px tall in a 900px-tall frame, so it
// takes up the same share of the stage height here.
const CARD_VISIBLE_HEIGHT = H * (311 / 900);
const CARD_SCALE = CARD_VISIBLE_HEIGHT / CARD_VISIBLE_HEIGHT_PX;

// Size to draw the whole image at (padding included).
const CARD_HEIGHT = CARD_IMAGE_HEIGHT * CARD_SCALE;
const CARD_WIDTH = CARD_IMAGE_WIDTH * CARD_SCALE;

const LOGO_HEIGHT = H / 16;
const LOGO_WIDTH = LOGO_HEIGHT * (166 / 36); // Brand.png aspect ratio
const LOGO_X = W / 80;

// The card's bottom edge lines up with the bottom of this row.
const QUESTION_Y = H / 1.8;
const QUESTION_FONT_SIZE = H / 26;

// The card sits under the logo, centered on it, with its bottom edge level with
// the bottom of the question row. Images are positioned by their top-left
// corner, and card.png has transparent padding, so we line up the VISIBLE card
// and work out where the picture's corner has to go.

// Horizontal: the visible card's center should land on the logo's center.
const LOGO_CENTER_X = LOGO_X + LOGO_WIDTH / 2;
const VISIBLE_CARD_CENTER_IN_IMAGE =
    ((CARD_VISIBLE_LEFT + CARD_VISIBLE_RIGHT) / 2) * CARD_SCALE;
const CARD_X = LOGO_CENTER_X - VISIBLE_CARD_CENTER_IN_IMAGE;

// Vertical: the visible card's bottom edge should land on the question row's bottom.
const QUESTION_BOTTOM_Y = QUESTION_Y + QUESTION_FONT_SIZE;
const VISIBLE_CARD_BOTTOM_IN_IMAGE = CARD_VISIBLE_BOTTOM * CARD_SCALE;
const CARD_Y = QUESTION_BOTTOM_Y - VISIBLE_CARD_BOTTOM_IN_IMAGE;

const RIGHT_COLUMN_X = W / 5; // smaller = panels move left
const RIGHT_COLUMN_WIDTH = (W * 2) / 3; // smaller = narrower panels

// Right-column panels are stacked: each starts where the one above ends,
// plus a gap, so changing one height moves the panels below it.
const PANEL_GAP = H / 60;

const INFO_PANEL_Y = H / 7;
const INFO_PANEL_HEIGHT = H / 5;
const PROBABILITY_PANEL_Y = INFO_PANEL_Y + INFO_PANEL_HEIGHT + PANEL_GAP;
const PROBABILITY_PANEL_HEIGHT = (H * 7) / 30;
const GUESS_PANEL_Y = PROBABILITY_PANEL_Y + PROBABILITY_PANEL_HEIGHT + PANEL_GAP;
const GUESS_PANEL_HEIGHT = H / 6;

export const GAME_SCREEN_CONSTANTS = {
    MARGIN: W / 32,
    HEADER_Y: H / 30,

    LOGO_HEIGHT,
    LOGO_WIDTH,
    LOGO_X,
    LOGO_Y: H / 45,

    QUESTION_Y,
    QUESTION_FONT_SIZE,

    CARD_X,
    CARD_Y,
    CARD_HEIGHT,
    CARD_WIDTH,

    LEFT_COLUMN_X: W / 32,
    RIGHT_COLUMN_X,
    RIGHT_COLUMN_WIDTH,

    // Panels (shared by every panel; offsets are measured from the panel's top-left)
    PANEL_RADIUS: H / 65,
    PANEL_PADDING: H / 65,
    PANEL_FILL: "#fffdf4",
    PANEL_TEXT: "#07451c",
    PANEL_TITLE_FONT_SIZE: H / 50,
    PANEL_BODY_Y: H / 18, // first line of text, below the title
    PANEL_BODY_FONT_SIZE: H / 54,
    PANEL_HINT_FONT_SIZE: H / 68,
    PANEL_HINT_GAP: H / 75,
    PANEL_HINT_TEXT: "#6b6b5e",
    PANEL_ROW_Y: H / 10, // the input + Submit row

    REMAINING_PANEL_Y: CARD_Y + CARD_HEIGHT + H / 36,
    REMAINING_PANEL_WIDTH: (W * 2) / 7,
    REMAINING_PANEL_HEIGHT: H / 7,

    INFO_PANEL_Y,
    INFO_PANEL_HEIGHT,
    PROBABILITY_PANEL_Y,
    PROBABILITY_PANEL_HEIGHT,
    GUESS_PANEL_Y,
    GUESS_PANEL_HEIGHT,

    // Answer input row
    INPUT_WIDTH: (W * 3) / 10,
    INPUT_PADDING_X: W / 100,
    SUBMIT_WIDTH: W / 12,
    FEEDBACK_FONT_SIZE: H / 45,

    FOOTER_Y: (H * 9) / 10,

    STATS_X: (W * 3) / 4,
    STATS_Y_STRIKES: H / 25,
    STATS_Y_PROGRESS: H / 12,
    STATS_FONT_SIZE: H / 34,

    // Button sizes. The views center each row, so only sizes and gaps live here.
    BUTTON_HEIGHT: H / 18,
    BUTTON_FONT_SIZE: H / 43,
    BUTTON_RADIUS: H / 75,
    BUTTON_STROKE: H / 200,
    MENU_BUTTON_WIDTH: W / 8,
    NEXT_BUTTON_WIDTH: W / 7,
    FOOTER_BUTTON_GAP: W / 50,
};

const MENU_BUTTON_Y = H / 2;
const MENU_BUTTON_HEIGHT = H / 10;
const MENU_BUTTON_FONT_SIZE = H / 25;

export const MENU_SCREEN_CONSTANTS = {
    TITLE_Y: H / 4,
    TITLE_FONT_SIZE: H / 14,
    SUBTITLE_Y: H / 3,
    SUBTITLE_FONT_SIZE: H / 30,

    BUTTON_WIDTH: W / 4,
    BUTTON_HEIGHT: MENU_BUTTON_HEIGHT,
    BUTTON_Y: MENU_BUTTON_Y,
    BUTTON_RADIUS: W / 80,
    BUTTON_STROKE: H / 150,
    BUTTON_FONT_SIZE: MENU_BUTTON_FONT_SIZE,
    // vertically centered inside the button
    BUTTON_TEXT_Y: MENU_BUTTON_Y + MENU_BUTTON_HEIGHT / 2 - MENU_BUTTON_FONT_SIZE / 2,
};

const RESULTS_BUTTON_WIDTH = (W * 3) / 16;
const RESULTS_BUTTON_GAP = W / 16;
// the two buttons are centered as a pair
const RESULTS_PLAY_AGAIN_X = (W - 2 * RESULTS_BUTTON_WIDTH - RESULTS_BUTTON_GAP) / 2;

export const RESULTS_SCREEN_CONSTANTS = {
    TEXT_X: W / 8,
    TEXT_WIDTH: (W * 3) / 4,
    TITLE_Y: H / 4,
    TITLE_FONT_SIZE: H / 15,
    SCORE_Y: H / 2.5,
    SCORE_FONT_SIZE: H / 24,

    BUTTON_Y: (H * 7) / 12,
    PLAY_AGAIN_X: RESULTS_PLAY_AGAIN_X,
    MENU_X: RESULTS_PLAY_AGAIN_X + RESULTS_BUTTON_WIDTH + RESULTS_BUTTON_GAP,
    BUTTON_WIDTH: RESULTS_BUTTON_WIDTH,
    BUTTON_HEIGHT: H / 11,
    BUTTON_RADIUS: W / 80,
    BUTTON_FONT_SIZE: H / 33,
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

export const STARTING_CHIPS = 10; // number of chips the player starts with

export const COST_OF_CLUE = 3; // number of chips each clue costs