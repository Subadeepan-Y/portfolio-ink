// Manim constants — direct port of manim/constants.py
// Frame dimensions match Manim CE defaults (16:9, frame_width=14.222..., frame_height=8).
export const PI = Math.PI;
export const TAU = Math.PI * 2;
export const DEGREES = TAU / 360;
export const ORIGIN = [0, 0, 0];
export const UP = [0, 1, 0];
export const DOWN = [0, -1, 0];
export const LEFT = [-1, 0, 0];
export const RIGHT = [1, 0, 0];
export const IN = [0, 0, -1];
export const OUT = [0, 0, 1];
export const X_AXIS = [1, 0, 0];
export const Y_AXIS = [0, 1, 0];
export const Z_AXIS = [0, 0, 1];
export const UL = [-1, 1, 0];
export const UR = [1, 1, 0];
export const DL = [-1, -1, 0];
export const DR = [1, -1, 0];
export const SMALL_BUFF = 0.1;
export const MED_SMALL_BUFF = 0.25;
export const MED_LARGE_BUFF = 0.5;
export const LARGE_BUFF = 1;
export const DEFAULT_FONT_SIZE = 48;
// Manim frame defaults
export const DEFAULT_FRAME_WIDTH = 14.222222222222221;
export const DEFAULT_FRAME_HEIGHT = 8.0;
export const DEFAULT_PIXEL_WIDTH = 1280;
export const DEFAULT_PIXEL_HEIGHT = 720;
export const DEFAULT_FRAME_RATE = 60;
export const DEFAULT_BACKGROUND_COLOR = "#333333";
// Directions for positioning (compass)
export const compassDirs = { UP, DOWN, LEFT, RIGHT, UL, UR, DL, DR, ORIGIN, IN, OUT };
//# sourceMappingURL=constants.js.map