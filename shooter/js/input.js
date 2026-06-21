import { SCALE } from './constants.js';

export const InputState = {
  keys: {},
  mouseX: 80,
  mouseY: 60,
  mouseDown: false,
  mouseClicked: false,
};

export function initInput(canvas) {
  window.addEventListener('keydown', e => {
    InputState.keys[e.key.toLowerCase()] = true;
    // prevent arrow keys from scrolling the page
    if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', e => {
    delete InputState.keys[e.key.toLowerCase()];
  });

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    InputState.mouseX = (e.clientX - rect.left) / SCALE;
    InputState.mouseY = (e.clientY - rect.top)  / SCALE;
  });

  canvas.addEventListener('mousedown', e => {
    if (e.button === 0) {
      InputState.mouseDown    = true;
      InputState.mouseClicked = true;
    }
  });

  canvas.addEventListener('mouseup', e => {
    if (e.button === 0) InputState.mouseDown = false;
  });

  // prevent context menu on right-click
  canvas.addEventListener('contextmenu', e => e.preventDefault());
}

export function clearFrameInput() {
  InputState.mouseClicked = false;
}
