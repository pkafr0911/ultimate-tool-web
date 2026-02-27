import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Card, Col, Row, Segmented, Switch, Tooltip } from 'antd';

// ─── Key definition ────────────────────────────────────────────────────────
interface KeyDef {
  code: string;
  label: string;
  subLabel?: string; // top label (e.g. shift symbol)
  width?: number;
  height?: number;
}

type KeyRow = KeyDef[];

// ─── Layout computation ────────────────────────────────────────────────────
const KEY_SIZE = 48;
const KEY_GAP = 4;
const CELL = KEY_SIZE + KEY_GAP; // 52

interface RenderedKey {
  code: string;
  label: string;
  subLabel?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function computeKeyPositions(layout: KeyRow[]) {
  const keys: RenderedKey[] = [];
  let maxX = 0;

  layout.forEach((row, ri) => {
    let x = 0;
    const y = ri * CELL;

    row.forEach((kd) => {
      if (kd.code.startsWith('_gap')) {
        x += (kd.width ?? 1) * CELL;
        return;
      }
      const wu = kd.width ?? 1;
      const hu = kd.height ?? 1;
      const w = wu * CELL - KEY_GAP;
      const h = hu * CELL - KEY_GAP;
      keys.push({ code: kd.code, label: kd.label, subLabel: kd.subLabel, x, y, w, h });
      x += wu * CELL;
    });

    maxX = Math.max(maxX, x - KEY_GAP);
  });

  return { keys, width: maxX, height: layout.length * CELL - KEY_GAP };
}

const WIN_DESKTOP_LAYOUT: KeyRow[] = [
  // Function row — gaps tuned so PrtSc/ScrLk/Pause align with Ins/Home/PgUp
  [
    { code: 'Escape', label: 'Esc' },
    { code: '_gap1', label: '', width: 1 },
    { code: 'F1', label: 'F1' },
    { code: 'F2', label: 'F2' },
    { code: 'F3', label: 'F3' },
    { code: 'F4', label: 'F4' },
    { code: '_gap2', label: '', width: 0.5 },
    { code: 'F5', label: 'F5' },
    { code: 'F6', label: 'F6' },
    { code: 'F7', label: 'F7' },
    { code: 'F8', label: 'F8' },
    { code: '_gap3', label: '', width: 0.5 },
    { code: 'F9', label: 'F9' },
    { code: 'F10', label: 'F10' },
    { code: 'F11', label: 'F11' },
    { code: 'F12', label: 'F12' },
    { code: '_gap4', label: '', width: 0.25 },
    { code: 'PrintScreen', label: 'PrtSc' },
    { code: 'ScrollLock', label: 'ScrLk' },
    { code: 'Pause', label: 'Pause' },
  ],
  // Number row
  [
    { code: 'Backquote', label: '`', subLabel: '~' },
    { code: 'Digit1', label: '1', subLabel: '!' },
    { code: 'Digit2', label: '2', subLabel: '@' },
    { code: 'Digit3', label: '3', subLabel: '#' },
    { code: 'Digit4', label: '4', subLabel: '$' },
    { code: 'Digit5', label: '5', subLabel: '%' },
    { code: 'Digit6', label: '6', subLabel: '^' },
    { code: 'Digit7', label: '7', subLabel: '&' },
    { code: 'Digit8', label: '8', subLabel: '*' },
    { code: 'Digit9', label: '9', subLabel: '(' },
    { code: 'Digit0', label: '0', subLabel: ')' },
    { code: 'Minus', label: '-', subLabel: '_' },
    { code: 'Equal', label: '=', subLabel: '+' },
    { code: 'Backspace', label: 'Backspace', width: 2 },
    { code: '_gap5', label: '', width: 0.25 },
    { code: 'Insert', label: 'Ins' },
    { code: 'Home', label: 'Home' },
    { code: 'PageUp', label: 'PgUp' },
    { code: '_gap6', label: '', width: 0.25 },
    { code: 'NumLock', label: 'Num' },
    { code: 'NumpadDivide', label: '/' },
    { code: 'NumpadMultiply', label: '*' },
    { code: 'NumpadSubtract', label: '-' },
  ],
  // QWERTY row
  [
    { code: 'Tab', label: 'Tab', width: 1.5 },
    { code: 'KeyQ', label: 'Q' },
    { code: 'KeyW', label: 'W' },
    { code: 'KeyE', label: 'E' },
    { code: 'KeyR', label: 'R' },
    { code: 'KeyT', label: 'T' },
    { code: 'KeyY', label: 'Y' },
    { code: 'KeyU', label: 'U' },
    { code: 'KeyI', label: 'I' },
    { code: 'KeyO', label: 'O' },
    { code: 'KeyP', label: 'P' },
    { code: 'BracketLeft', label: '[', subLabel: '{' },
    { code: 'BracketRight', label: ']', subLabel: '}' },
    { code: 'Backslash', label: '\\', subLabel: '|', width: 1.5 },
    { code: '_gap7', label: '', width: 0.25 },
    { code: 'Delete', label: 'Del' },
    { code: 'End', label: 'End' },
    { code: 'PageDown', label: 'PgDn' },
    { code: '_gap8', label: '', width: 0.25 },
    { code: 'Numpad7', label: '7' },
    { code: 'Numpad8', label: '8' },
    { code: 'Numpad9', label: '9' },
    { code: 'NumpadAdd', label: '+', height: 2 },
  ],
  // Home row
  [
    { code: 'CapsLock', label: 'Caps', width: 1.75 },
    { code: 'KeyA', label: 'A' },
    { code: 'KeyS', label: 'S' },
    { code: 'KeyD', label: 'D' },
    { code: 'KeyF', label: 'F' },
    { code: 'KeyG', label: 'G' },
    { code: 'KeyH', label: 'H' },
    { code: 'KeyJ', label: 'J' },
    { code: 'KeyK', label: 'K' },
    { code: 'KeyL', label: 'L' },
    { code: 'Semicolon', label: ';', subLabel: ':' },
    { code: 'Quote', label: "'", subLabel: '"' },
    { code: 'Enter', label: 'Enter', width: 2.25 },
    { code: '_gap9', label: '', width: 3.5 },
    { code: 'Numpad4', label: '4' },
    { code: 'Numpad5', label: '5' },
    { code: 'Numpad6', label: '6' },
  ],
  // Shift row
  [
    { code: 'ShiftLeft', label: 'Shift', width: 2.25 },
    { code: 'KeyZ', label: 'Z' },
    { code: 'KeyX', label: 'X' },
    { code: 'KeyC', label: 'C' },
    { code: 'KeyV', label: 'V' },
    { code: 'KeyB', label: 'B' },
    { code: 'KeyN', label: 'N' },
    { code: 'KeyM', label: 'M' },
    { code: 'Comma', label: ',', subLabel: '<' },
    { code: 'Period', label: '.', subLabel: '>' },
    { code: 'Slash', label: '/', subLabel: '?' },
    { code: 'ShiftRight', label: 'Shift', width: 2.75 },
    { code: '_gap10', label: '', width: 1.25 },
    { code: 'ArrowUp', label: '↑' },
    { code: '_gap11', label: '', width: 1.25 },
    { code: 'Numpad1', label: '1' },
    { code: 'Numpad2', label: '2' },
    { code: 'Numpad3', label: '3' },
    { code: 'NumpadEnter', label: 'Ent', height: 2 },
  ],
  // Bottom row
  [
    { code: 'ControlLeft', label: 'Ctrl', width: 1.25 },
    { code: 'MetaLeft', label: 'Win', width: 1.25 },
    { code: 'AltLeft', label: 'Alt', width: 1.25 },
    { code: 'Space', label: '', width: 6.25 },
    { code: 'AltRight', label: 'Alt', width: 1.25 },
    { code: 'MetaRight', label: 'Win', width: 1.25 },
    { code: 'ContextMenu', label: 'Menu', width: 1.25 },
    { code: 'ControlRight', label: 'Ctrl', width: 1.25 },
    { code: '_gap12', label: '', width: 0.25 },
    { code: 'ArrowLeft', label: '←' },
    { code: 'ArrowDown', label: '↓' },
    { code: 'ArrowRight', label: '→' },
    { code: '_gap13', label: '', width: 0.25 },
    { code: 'Numpad0', label: '0', width: 2 },
    { code: 'NumpadDecimal', label: '.' },
  ],
];

const MAC_DESKTOP_LAYOUT: KeyRow[] = [
  [
    { code: 'Escape', label: 'Esc' },
    { code: '_gap1', label: '', width: 1 },
    { code: 'F1', label: 'F1' },
    { code: 'F2', label: 'F2' },
    { code: 'F3', label: 'F3' },
    { code: 'F4', label: 'F4' },
    { code: '_gap2', label: '', width: 0.5 },
    { code: 'F5', label: 'F5' },
    { code: 'F6', label: 'F6' },
    { code: 'F7', label: 'F7' },
    { code: 'F8', label: 'F8' },
    { code: '_gap3', label: '', width: 0.5 },
    { code: 'F9', label: 'F9' },
    { code: 'F10', label: 'F10' },
    { code: 'F11', label: 'F11' },
    { code: 'F12', label: 'F12' },
  ],
  [
    { code: 'Backquote', label: '`', subLabel: '~' },
    { code: 'Digit1', label: '1', subLabel: '!' },
    { code: 'Digit2', label: '2', subLabel: '@' },
    { code: 'Digit3', label: '3', subLabel: '#' },
    { code: 'Digit4', label: '4', subLabel: '$' },
    { code: 'Digit5', label: '5', subLabel: '%' },
    { code: 'Digit6', label: '6', subLabel: '^' },
    { code: 'Digit7', label: '7', subLabel: '&' },
    { code: 'Digit8', label: '8', subLabel: '*' },
    { code: 'Digit9', label: '9', subLabel: '(' },
    { code: 'Digit0', label: '0', subLabel: ')' },
    { code: 'Minus', label: '-', subLabel: '_' },
    { code: 'Equal', label: '=', subLabel: '+' },
    { code: 'Backspace', label: 'Delete', width: 1.5 },
  ],
  [
    { code: 'Tab', label: 'Tab', width: 1.5 },
    { code: 'KeyQ', label: 'Q' },
    { code: 'KeyW', label: 'W' },
    { code: 'KeyE', label: 'E' },
    { code: 'KeyR', label: 'R' },
    { code: 'KeyT', label: 'T' },
    { code: 'KeyY', label: 'Y' },
    { code: 'KeyU', label: 'U' },
    { code: 'KeyI', label: 'I' },
    { code: 'KeyO', label: 'O' },
    { code: 'KeyP', label: 'P' },
    { code: 'BracketLeft', label: '[', subLabel: '{' },
    { code: 'BracketRight', label: ']', subLabel: '}' },
    { code: 'Backslash', label: '\\', subLabel: '|', width: 1.5 },
  ],
  [
    { code: 'CapsLock', label: 'Caps', width: 1.75 },
    { code: 'KeyA', label: 'A' },
    { code: 'KeyS', label: 'S' },
    { code: 'KeyD', label: 'D' },
    { code: 'KeyF', label: 'F' },
    { code: 'KeyG', label: 'G' },
    { code: 'KeyH', label: 'H' },
    { code: 'KeyJ', label: 'J' },
    { code: 'KeyK', label: 'K' },
    { code: 'KeyL', label: 'L' },
    { code: 'Semicolon', label: ';', subLabel: ':' },
    { code: 'Quote', label: "'", subLabel: '"' },
    { code: 'Enter', label: 'Return', width: 2.25 },
  ],
  [
    { code: 'ShiftLeft', label: 'Shift', width: 2.25 },
    { code: 'KeyZ', label: 'Z' },
    { code: 'KeyX', label: 'X' },
    { code: 'KeyC', label: 'C' },
    { code: 'KeyV', label: 'V' },
    { code: 'KeyB', label: 'B' },
    { code: 'KeyN', label: 'N' },
    { code: 'KeyM', label: 'M' },
    { code: 'Comma', label: ',', subLabel: '<' },
    { code: 'Period', label: '.', subLabel: '>' },
    { code: 'Slash', label: '/', subLabel: '?' },
    { code: 'ShiftRight', label: 'Shift', width: 2.75 },
  ],
  [
    { code: 'Fn', label: 'Fn', width: 1 },
    { code: 'ControlLeft', label: '⌃', width: 1.25 },
    { code: 'AltLeft', label: '⌥', width: 1.25 },
    { code: 'MetaLeft', label: '⌘', width: 1.5 },
    { code: 'Space', label: '', width: 5 },
    { code: 'MetaRight', label: '⌘', width: 1.5 },
    { code: 'AltRight', label: '⌥', width: 1.25 },
    { code: 'ArrowLeft', label: '←' },
    { code: 'ArrowDown', label: '↓' },
    { code: 'ArrowUp', label: '↑' },
    { code: 'ArrowRight', label: '→' },
  ],
];

// ─── 80% TKL layout (no numpad) ────────────────────────────────────────────
const WIN_TKL_LAYOUT: KeyRow[] = [
  // Function row
  [
    { code: 'Escape', label: 'Esc' },
    { code: '_gap1', label: '', width: 1 },
    { code: 'F1', label: 'F1' },
    { code: 'F2', label: 'F2' },
    { code: 'F3', label: 'F3' },
    { code: 'F4', label: 'F4' },
    { code: '_gap2', label: '', width: 0.5 },
    { code: 'F5', label: 'F5' },
    { code: 'F6', label: 'F6' },
    { code: 'F7', label: 'F7' },
    { code: 'F8', label: 'F8' },
    { code: '_gap3', label: '', width: 0.5 },
    { code: 'F9', label: 'F9' },
    { code: 'F10', label: 'F10' },
    { code: 'F11', label: 'F11' },
    { code: 'F12', label: 'F12' },
    { code: '_gap4', label: '', width: 0.25 },
    { code: 'PrintScreen', label: 'PrtSc' },
    { code: 'ScrollLock', label: 'ScrLk' },
    { code: 'Pause', label: 'Pause' },
  ],
  [
    { code: 'Backquote', label: '`', subLabel: '~' },
    { code: 'Digit1', label: '1', subLabel: '!' },
    { code: 'Digit2', label: '2', subLabel: '@' },
    { code: 'Digit3', label: '3', subLabel: '#' },
    { code: 'Digit4', label: '4', subLabel: '$' },
    { code: 'Digit5', label: '5', subLabel: '%' },
    { code: 'Digit6', label: '6', subLabel: '^' },
    { code: 'Digit7', label: '7', subLabel: '&' },
    { code: 'Digit8', label: '8', subLabel: '*' },
    { code: 'Digit9', label: '9', subLabel: '(' },
    { code: 'Digit0', label: '0', subLabel: ')' },
    { code: 'Minus', label: '-', subLabel: '_' },
    { code: 'Equal', label: '=', subLabel: '+' },
    { code: 'Backspace', label: 'Backspace', width: 2 },
    { code: '_gap5', label: '', width: 0.25 },
    { code: 'Insert', label: 'Ins' },
    { code: 'Home', label: 'Home' },
    { code: 'PageUp', label: 'PgUp' },
  ],
  [
    { code: 'Tab', label: 'Tab', width: 1.5 },
    { code: 'KeyQ', label: 'Q' },
    { code: 'KeyW', label: 'W' },
    { code: 'KeyE', label: 'E' },
    { code: 'KeyR', label: 'R' },
    { code: 'KeyT', label: 'T' },
    { code: 'KeyY', label: 'Y' },
    { code: 'KeyU', label: 'U' },
    { code: 'KeyI', label: 'I' },
    { code: 'KeyO', label: 'O' },
    { code: 'KeyP', label: 'P' },
    { code: 'BracketLeft', label: '[', subLabel: '{' },
    { code: 'BracketRight', label: ']', subLabel: '}' },
    { code: 'Backslash', label: '\\', subLabel: '|', width: 1.5 },
    { code: '_gap7', label: '', width: 0.25 },
    { code: 'Delete', label: 'Del' },
    { code: 'End', label: 'End' },
    { code: 'PageDown', label: 'PgDn' },
  ],
  [
    { code: 'CapsLock', label: 'Caps', width: 1.75 },
    { code: 'KeyA', label: 'A' },
    { code: 'KeyS', label: 'S' },
    { code: 'KeyD', label: 'D' },
    { code: 'KeyF', label: 'F' },
    { code: 'KeyG', label: 'G' },
    { code: 'KeyH', label: 'H' },
    { code: 'KeyJ', label: 'J' },
    { code: 'KeyK', label: 'K' },
    { code: 'KeyL', label: 'L' },
    { code: 'Semicolon', label: ';', subLabel: ':' },
    { code: 'Quote', label: "'", subLabel: '"' },
    { code: 'Enter', label: 'Enter', width: 2.25 },
  ],
  [
    { code: 'ShiftLeft', label: 'Shift', width: 2.25 },
    { code: 'KeyZ', label: 'Z' },
    { code: 'KeyX', label: 'X' },
    { code: 'KeyC', label: 'C' },
    { code: 'KeyV', label: 'V' },
    { code: 'KeyB', label: 'B' },
    { code: 'KeyN', label: 'N' },
    { code: 'KeyM', label: 'M' },
    { code: 'Comma', label: ',', subLabel: '<' },
    { code: 'Period', label: '.', subLabel: '>' },
    { code: 'Slash', label: '/', subLabel: '?' },
    { code: 'ShiftRight', label: 'Shift', width: 2.75 },
    { code: '_gap10', label: '', width: 1.25 },
    { code: 'ArrowUp', label: '↑' },
  ],
  [
    { code: 'ControlLeft', label: 'Ctrl', width: 1.25 },
    { code: 'MetaLeft', label: 'Win', width: 1.25 },
    { code: 'AltLeft', label: 'Alt', width: 1.25 },
    { code: 'Space', label: '', width: 6.25 },
    { code: 'AltRight', label: 'Alt', width: 1.25 },
    { code: 'MetaRight', label: 'Win', width: 1.25 },
    { code: 'ContextMenu', label: 'Menu', width: 1.25 },
    { code: 'ControlRight', label: 'Ctrl', width: 1.25 },
    { code: '_gap12', label: '', width: 0.25 },
    { code: 'ArrowLeft', label: '←' },
    { code: 'ArrowDown', label: '↓' },
    { code: 'ArrowRight', label: '→' },
  ],
];

// ─── 60% compact layout (no F-row, no nav, no numpad) ──────────────────────
const WIN_60_LAYOUT: KeyRow[] = [
  [
    { code: 'Backquote', label: '`', subLabel: '~' },
    { code: 'Digit1', label: '1', subLabel: '!' },
    { code: 'Digit2', label: '2', subLabel: '@' },
    { code: 'Digit3', label: '3', subLabel: '#' },
    { code: 'Digit4', label: '4', subLabel: '$' },
    { code: 'Digit5', label: '5', subLabel: '%' },
    { code: 'Digit6', label: '6', subLabel: '^' },
    { code: 'Digit7', label: '7', subLabel: '&' },
    { code: 'Digit8', label: '8', subLabel: '*' },
    { code: 'Digit9', label: '9', subLabel: '(' },
    { code: 'Digit0', label: '0', subLabel: ')' },
    { code: 'Minus', label: '-', subLabel: '_' },
    { code: 'Equal', label: '=', subLabel: '+' },
    { code: 'Backspace', label: 'Backspace', width: 2 },
  ],
  [
    { code: 'Tab', label: 'Tab', width: 1.5 },
    { code: 'KeyQ', label: 'Q' },
    { code: 'KeyW', label: 'W' },
    { code: 'KeyE', label: 'E' },
    { code: 'KeyR', label: 'R' },
    { code: 'KeyT', label: 'T' },
    { code: 'KeyY', label: 'Y' },
    { code: 'KeyU', label: 'U' },
    { code: 'KeyI', label: 'I' },
    { code: 'KeyO', label: 'O' },
    { code: 'KeyP', label: 'P' },
    { code: 'BracketLeft', label: '[', subLabel: '{' },
    { code: 'BracketRight', label: ']', subLabel: '}' },
    { code: 'Backslash', label: '\\', subLabel: '|', width: 1.5 },
  ],
  [
    { code: 'CapsLock', label: 'Caps', width: 1.75 },
    { code: 'KeyA', label: 'A' },
    { code: 'KeyS', label: 'S' },
    { code: 'KeyD', label: 'D' },
    { code: 'KeyF', label: 'F' },
    { code: 'KeyG', label: 'G' },
    { code: 'KeyH', label: 'H' },
    { code: 'KeyJ', label: 'J' },
    { code: 'KeyK', label: 'K' },
    { code: 'KeyL', label: 'L' },
    { code: 'Semicolon', label: ';', subLabel: ':' },
    { code: 'Quote', label: "'", subLabel: '"' },
    { code: 'Enter', label: 'Enter', width: 2.25 },
  ],
  [
    { code: 'ShiftLeft', label: 'Shift', width: 2.25 },
    { code: 'KeyZ', label: 'Z' },
    { code: 'KeyX', label: 'X' },
    { code: 'KeyC', label: 'C' },
    { code: 'KeyV', label: 'V' },
    { code: 'KeyB', label: 'B' },
    { code: 'KeyN', label: 'N' },
    { code: 'KeyM', label: 'M' },
    { code: 'Comma', label: ',', subLabel: '<' },
    { code: 'Period', label: '.', subLabel: '>' },
    { code: 'Slash', label: '/', subLabel: '?' },
    { code: 'ShiftRight', label: 'Shift', width: 2.75 },
  ],
  [
    { code: 'ControlLeft', label: 'Ctrl', width: 1.25 },
    { code: 'MetaLeft', label: 'Win', width: 1.25 },
    { code: 'AltLeft', label: 'Alt', width: 1.25 },
    { code: 'Space', label: '', width: 6.25 },
    { code: 'AltRight', label: 'Alt', width: 1.25 },
    { code: 'MetaRight', label: 'Win', width: 1.25 },
    { code: 'ContextMenu', label: 'Menu', width: 1.25 },
    { code: 'ControlRight', label: 'Ctrl', width: 1.25 },
  ],
];

const MAC_60_LAYOUT: KeyRow[] = [
  [
    { code: 'Backquote', label: '`', subLabel: '~' },
    { code: 'Digit1', label: '1', subLabel: '!' },
    { code: 'Digit2', label: '2', subLabel: '@' },
    { code: 'Digit3', label: '3', subLabel: '#' },
    { code: 'Digit4', label: '4', subLabel: '$' },
    { code: 'Digit5', label: '5', subLabel: '%' },
    { code: 'Digit6', label: '6', subLabel: '^' },
    { code: 'Digit7', label: '7', subLabel: '&' },
    { code: 'Digit8', label: '8', subLabel: '*' },
    { code: 'Digit9', label: '9', subLabel: '(' },
    { code: 'Digit0', label: '0', subLabel: ')' },
    { code: 'Minus', label: '-', subLabel: '_' },
    { code: 'Equal', label: '=', subLabel: '+' },
    { code: 'Backspace', label: 'Delete', width: 1.5 },
  ],
  [
    { code: 'Tab', label: 'Tab', width: 1.5 },
    { code: 'KeyQ', label: 'Q' },
    { code: 'KeyW', label: 'W' },
    { code: 'KeyE', label: 'E' },
    { code: 'KeyR', label: 'R' },
    { code: 'KeyT', label: 'T' },
    { code: 'KeyY', label: 'Y' },
    { code: 'KeyU', label: 'U' },
    { code: 'KeyI', label: 'I' },
    { code: 'KeyO', label: 'O' },
    { code: 'KeyP', label: 'P' },
    { code: 'BracketLeft', label: '[', subLabel: '{' },
    { code: 'BracketRight', label: ']', subLabel: '}' },
    { code: 'Backslash', label: '\\', subLabel: '|', width: 1.5 },
  ],
  [
    { code: 'CapsLock', label: 'Caps', width: 1.75 },
    { code: 'KeyA', label: 'A' },
    { code: 'KeyS', label: 'S' },
    { code: 'KeyD', label: 'D' },
    { code: 'KeyF', label: 'F' },
    { code: 'KeyG', label: 'G' },
    { code: 'KeyH', label: 'H' },
    { code: 'KeyJ', label: 'J' },
    { code: 'KeyK', label: 'K' },
    { code: 'KeyL', label: 'L' },
    { code: 'Semicolon', label: ';', subLabel: ':' },
    { code: 'Quote', label: "'", subLabel: '"' },
    { code: 'Enter', label: 'Return', width: 2.25 },
  ],
  [
    { code: 'ShiftLeft', label: 'Shift', width: 2.25 },
    { code: 'KeyZ', label: 'Z' },
    { code: 'KeyX', label: 'X' },
    { code: 'KeyC', label: 'C' },
    { code: 'KeyV', label: 'V' },
    { code: 'KeyB', label: 'B' },
    { code: 'KeyN', label: 'N' },
    { code: 'KeyM', label: 'M' },
    { code: 'Comma', label: ',', subLabel: '<' },
    { code: 'Period', label: '.', subLabel: '>' },
    { code: 'Slash', label: '/', subLabel: '?' },
    { code: 'ShiftRight', label: 'Shift', width: 2.75 },
  ],
  [
    { code: 'Fn', label: 'Fn', width: 1 },
    { code: 'ControlLeft', label: '⌃', width: 1.25 },
    { code: 'AltLeft', label: '⌥', width: 1.25 },
    { code: 'MetaLeft', label: '⌘', width: 1.5 },
    { code: 'Space', label: '', width: 5 },
    { code: 'MetaRight', label: '⌘', width: 1.5 },
    { code: 'AltRight', label: '⌥', width: 1.25 },
  ],
];

function getLayout(os: string | number, size: string | number): KeyRow[] {
  if (os === 'Mac') {
    return size === '60%' ? MAC_60_LAYOUT : MAC_DESKTOP_LAYOUT;
  }
  if (size === '60%') return WIN_60_LAYOUT;
  if (size === '80%') return WIN_TKL_LAYOUT;
  return WIN_DESKTOP_LAYOUT;
}

// Performance history
const PERF_HISTORY_SIZE = 60;

const KeyboardTest: React.FC = () => {
  // Settings
  const [layoutSize, setLayoutSize] = useState<string | number>('100%');
  const [osType, setOsType] = useState<string | number>('Windows');
  const [kbType, setKbType] = useState<string | number>('Desktop');
  const [soundOn, setSoundOn] = useState(true);

  // Key tracking
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [totalPresses, setTotalPresses] = useState(0);
  const [keyCounts, setKeyCounts] = useState<Record<string, number>>({});
  const [lastKeyCode, setLastKeyCode] = useState<string>('-');
  const [lastInterval, setLastInterval] = useState<string>('-');
  const [typedText, setTypedText] = useState('');

  // Performance
  const [cps, setCps] = useState(0);
  const [apm, setApm] = useState(0);
  const [perfHistory, setPerfHistory] = useState<number[]>(new Array(PERF_HISTORY_SIZE).fill(0));
  const pressTimestamps = useRef<number[]>([]);
  const lastPressTime = useRef<number>(0);
  const perfCanvasRef = useRef<HTMLCanvasElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sound effect
  const playClickSound = useCallback(() => {
    if (!soundOn) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800 + Math.random() * 400;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // ignore
    }
  }, [soundOn]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const code = e.code;
      const now = performance.now();

      if (lastPressTime.current > 0) {
        setLastInterval(`${(now - lastPressTime.current).toFixed(1)} ms`);
      }
      lastPressTime.current = now;
      pressTimestamps.current.push(now);

      setActiveKeys((prev) => new Set(prev).add(code));
      setPressedKeys((prev) => new Set(prev).add(code));
      setTotalPresses((c) => c + 1);
      setKeyCounts((prev) => ({ ...prev, [code]: (prev[code] || 0) + 1 }));
      setLastKeyCode(code);

      // Append printable chars to typed text
      if (e.key.length === 1) {
        setTypedText((prev) => prev + e.key);
      } else if (e.key === 'Backspace') {
        setTypedText((prev) => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        setTypedText((prev) => prev + '\n');
      }

      playClickSound();
    },
    [playClickSound],
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    setActiveKeys((prev) => {
      const next = new Set(prev);
      next.delete(e.code);
      return next;
    });
  }, []);

  // Attach listeners
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('keydown', handleKeyDown);
    el.addEventListener('keyup', handleKeyUp);
    return () => {
      el.removeEventListener('keydown', handleKeyDown);
      el.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // CPS / APM + perf history (every second)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now();
      const oneSecAgo = now - 1000;
      const sixtySecAgo = now - 60000;
      const recentPresses = pressTimestamps.current.filter((t) => t > oneSecAgo).length;
      const minutePresses = pressTimestamps.current.filter((t) => t > sixtySecAgo).length;
      setCps(recentPresses);
      setApm(minutePresses);
      setPerfHistory((prev) => [...prev.slice(1), recentPresses]);
      pressTimestamps.current = pressTimestamps.current.filter((t) => t > sixtySecAgo);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Draw performance chart
  useEffect(() => {
    const canvas = perfCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const maxVal = Math.max(...perfHistory, 5);

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Bars
    const barWidth = w / PERF_HISTORY_SIZE - 1;
    perfHistory.forEach((val, i) => {
      const barH = (val / maxVal) * (h - 4);
      const x = i * (barWidth + 1);
      const gradient = ctx.createLinearGradient(x, h - barH, x, h);
      gradient.addColorStop(0, '#4096ff');
      gradient.addColorStop(1, '#1677ff');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, h - barH, barWidth, barH);
    });
  }, [perfHistory]);

  const handleReset = () => {
    setPressedKeys(new Set());
    setActiveKeys(new Set());
    setTotalPresses(0);
    setKeyCounts({});
    setLastKeyCode('-');
    setLastInterval('-');
    setTypedText('');
    setCps(0);
    setApm(0);
    setPerfHistory(new Array(PERF_HISTORY_SIZE).fill(0));
    pressTimestamps.current = [];
    lastPressTime.current = 0;
    containerRef.current?.focus();
  };

  const getKeyClass = (code: string) => {
    if (activeKeys.has(code)) return 'kb-key kb-key--active';
    if (pressedKeys.has(code)) return 'kb-key kb-key--pressed';
    return 'kb-key';
  };

  const layout = useMemo(() => getLayout(osType, layoutSize), [osType, layoutSize]);
  const layoutInfo = useMemo(() => computeKeyPositions(layout), [layout]);
  const totalKeys = layout.flat().filter((k) => !k.code.startsWith('_gap')).length;

  // Most pressed key
  const mostPressed =
    Object.keys(keyCounts).length > 0
      ? Object.entries(keyCounts).reduce((a, b) => (b[1] > a[1] ? b : a))
      : null;

  // Estimated scan rate
  const scanRate = lastInterval !== '-' ? `${Math.round(1000 / parseFloat(lastInterval))} Hz` : '-';

  return (
    <div className="keyboard-test" ref={containerRef} tabIndex={0} style={{ outline: 'none' }}>
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="kb-toolbar">
        <div className="kb-toolbar-group">
          <span className="kb-toolbar-label">LAYOUT SIZE</span>
          <Segmented
            size="small"
            value={layoutSize}
            onChange={setLayoutSize}
            options={['100%', '80%', '60%']}
          />
        </div>
        <div className="kb-toolbar-group">
          <span className="kb-toolbar-label">OS</span>
          <Segmented
            size="small"
            value={osType}
            onChange={setOsType}
            options={['Windows', 'Mac']}
          />
        </div>
        <div className="kb-toolbar-group">
          <span className="kb-toolbar-label">TYPE</span>
          <Segmented
            size="small"
            value={kbType}
            onChange={setKbType}
            options={['Desktop', 'Laptop']}
          />
        </div>
        <div className="kb-toolbar-group">
          <span className="kb-toolbar-label">SOUND</span>
          <Switch
            checked={soundOn}
            onChange={setSoundOn}
            checkedChildren="On"
            unCheckedChildren="Off"
            size="small"
          />
        </div>
        <div className="kb-toolbar-group">
          <span className="kb-toolbar-label">ACTION</span>
          <button className="kb-reset-btn" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      {/* ── Input Area ──────────────────────────────────────────── */}
      <div className="kb-input-area">
        <div className="kb-input-text">
          {typedText || <span className="kb-input-placeholder">Start typing...</span>}
          <span className="kb-input-cursor" />
        </div>
        <Badge
          count={`${pressedKeys.size} keys`}
          showZero
          style={{
            backgroundColor: pressedKeys.size === totalKeys ? '#52c41a' : '#1677ff',
            fontSize: 12,
          }}
        />
      </div>

      {/* ── Keyboard Layout ─────────────────────────────────────── */}
      <div
        className="kb-layout"
        style={{
          width: layoutInfo.width + 36,
          height: layoutInfo.height + 36,
        }}
      >
        {layoutInfo.keys.map((rk) => {
          const count = keyCounts[rk.code] || 0;
          return (
            <div
              key={rk.code}
              className={getKeyClass(rk.code)}
              style={{
                position: 'absolute',
                left: rk.x + 18,
                top: rk.y + 18,
                width: rk.w,
                height: rk.h,
              }}
              title={`${rk.code} (${count})`}
            >
              {rk.subLabel && <span className="kb-key-sub">{rk.subLabel}</span>}
              <span className="kb-key-label">{rk.label}</span>
              {count > 0 && <span className="kb-key-count">{count}</span>}
            </div>
          );
        })}
      </div>

      {/* ── Bottom: Stats + Performance Monitor ─────────────────── */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="Stats" size="small" className="kb-stats-card">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="kb-stat-item">
                  <div className="kb-stat-label">Active Keys</div>
                  <div className="kb-stat-value kb-stat-value--blue">{activeKeys.size}</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="kb-stat-item">
                  <div className="kb-stat-label">Total Presses</div>
                  <div className="kb-stat-value">{totalPresses}</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="kb-stat-item">
                  <div className="kb-stat-label">Most Pressed</div>
                  <div className="kb-stat-value">
                    {mostPressed ? `${mostPressed[0]} (${mostPressed[1]})` : '-'}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="kb-stat-item">
                  <div className="kb-stat-label">Last Key Code</div>
                  <div className="kb-stat-value">{lastKeyCode}</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="kb-stat-item">
                  <div className="kb-stat-label">Est. Scan Rate</div>
                  <div className="kb-stat-value">{scanRate}</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="kb-stat-item">
                  <div className="kb-stat-label">Last Interval</div>
                  <div className="kb-stat-value">{lastInterval}</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Performance Monitor"
            size="small"
            className="kb-perf-card"
            extra={
              <div className="kb-perf-badges">
                <Tooltip title="Characters Per Second — keys pressed in the last 1 second">
                  <div className="kb-perf-badge">
                    <span className="kb-perf-badge-label">CPS</span>
                    <span className="kb-perf-badge-value">{cps}</span>
                  </div>
                </Tooltip>
                <Tooltip title="Actions Per Minute — total key presses in the last 60 seconds">
                  <div className="kb-perf-badge">
                    <span className="kb-perf-badge-label">APM</span>
                    <span className="kb-perf-badge-value">{apm}</span>
                  </div>
                </Tooltip>
              </div>
            }
          >
            <canvas ref={perfCanvasRef} width={600} height={120} className="kb-perf-canvas" />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default KeyboardTest;
