# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A browser-based Pacman game with two rendering implementations: one using p5.js (canvas) and one using native SVG. There is no build step — open the HTML files directly in a browser or serve statically.

Live demo: https://juanka588.github.io/pacman/

## Running the Game

Open either HTML file directly in a browser (or via a local HTTP server):
- `index.html` — p5.js canvas version
- `flatSVG.html` — native SVG version

No build or install step is required to run. The `package.json` exists primarily to declare the `p5` dependency; `index.html` loads p5.js from a CDN instead, so `npm install` is not needed for development.

## Architecture

The codebase uses an **Adapter pattern** to decouple game logic from rendering. There are two layers:

### Core game logic (`pacman.js`, `GameEngine.js`)
- `Pacman` — position and movement, wall collision, pellet collection and scoring
- `Pellet` — point value
- `Cell` — grid cell with four directional walls and an optional pellet
- `MazeGenerator` — randomly places walls (probability 0.4), keeping adjacent cells consistent
- `GameEngine` — constructs the grid, runs `MazeGenerator`, and drives the game loop

`GameEngine` is renderer-agnostic: it receives factory functions (`pacmanCreator`, `pelletCreator`, `cellCreator`) and calls `pacman.draw()` / `cell.draw()` each frame — but it never knows what those draw methods do.

### Rendering adapters
Each renderer provides its own concrete adapter classes and a top-level game adapter:

| File | Adapters | Renderer |
|---|---|---|
| `index.js` | `PacmanAdapter`, `PelletAdapter`, `CellAdapter`, `P5GameAdapter` | p5.js canvas |
| `flatSVGAdapter.js` | `PacmanAdapter`, `PelletAdapter`, `CellAdapter`, `SVGGameAdapter` | Native SVG DOM |

Both files follow the same structure: adapter classes that wrap core objects, factory functions passed to `GameEngine`, and a setup/draw loop.

### SVG rendering details (`flatSVGAdapter.js`)
- SVG elements are created once and cached in `geometryRef`; subsequent frames mutate transforms rather than recreating elements
- Pacman is rendered as a stroked circle with a CSS `chomp` animation (stroke-dasharray) defined in `pacman-style.css`
- Left-facing movement uses `scale(-1,1)` mirroring instead of a 180° rotation to keep the chomp animation correct
- Helper functions at the bottom (`createCircle`, `createGroup`, `createLine`, `translateAndRotate`) wrap the SVG namespace API

### p5.js rendering details (`index.js`)
- Pacman is drawn imperatively each frame using `arc()` with an animated `closingAngle`
- Rotation for left movement uses `rotate(-3*PI/4)` combined with a sign flip on the eye position
- Grid cells draw a blue visited overlay (`fill(0, 0, 255, 80)`) on cells Pacman has passed through

### Coordinate system
The game map is a 2D array indexed `gameMap[x][y]` where `x` is the column and `y` is the row. Movement direction vectors are `{x, y}` with right = `{x:1, y:0}` and down = `{x:0, y:1}`. Screen pixel positions are computed as `gridIndex * cellSize` (default `size = 20`, grid 20×20 on a 400×400 canvas).
