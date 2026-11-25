---
version: alpha
colors:
  background: "#07451c"
  button: "#b62335"
  button-dark: "#9f3039"
  text: "#fffdf4"
  accent: "#f1c653"
typography:
  sans:
    fontFamily: "Arial, sans-serif"
omitted:
  - section: spacing
    reason: "Stage-relative geometry is maintained in src/constants.ts."
  - section: rounded
    reason: "Component radii are maintained in src/constants.ts."
components:
  menu: {}
  game: {}
---

# Probability Game Design

## Overview

This English-language educational card game helps players practice conditional probability.
Preserve its card-table identity and keep questions, clues, and hint costs easy to understand.
The current task temporarily disables authentication and opens the main menu directly.

## Colors

The green table, red buttons, cream text, and gold accents come from `COLORS` in `src/constants.ts`.
That file owns runtime colors; this document mirrors them and does not generate code.

## Typography

Keep the existing Arial canvas labels and stage-relative type sizes.
Use clear text labels for game actions and resource values.

## Layout

`src/constants.ts` owns the 1920 by 1080 logical stage and component geometry.
`App.fitStageToViewport()` in `src/main.ts` scales the stage uniformly to fit the viewport.
`index.html` owns the surrounding green background and centers the canvas.

## Components

`App.switchToScreen()` owns navigation and delegates visibility to screen controllers.
The menu retains Start Game and Risk / Reward in their existing positions.
While authentication is disabled, omit Sign Out and route authentication destinations to the menu.
Keep the authentication files available for restoration without initializing Supabase during normal play.

## Do's and Don'ts

- Reuse the existing screen controllers, canvas components, and constants.
- Keep coins and scores shared through `PlayerResources` during the session.
- Do not require a backend connection to start the game while authentication is disabled.
