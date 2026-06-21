import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from './constants.js';

export const InputState = {
  keys: {},
  mouseX: 80,
  mouseY: 60,
  mouseDown: false,
  mouseClicked: false,
  joystick: {
    active: false,
    dx: 0, dy: 0,
    baseX: 0, baseY: 0,
    knobX: 0, knobY: 0,
  },
};

const JOYSTICK_RADIUS = 20; // logical units

function toLogical(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return { x: LOGICAL_WIDTH / 2, y: LOGICAL_HEIGHT / 2 };
  return {
    x: (clientX - rect.left) / (rect.width  / LOGICAL_WIDTH),
    y: (clientY - rect.top)  / (rect.height / LOGICAL_HEIGHT),
  };
}

export function initInput(canvas) {
  window.addEventListener('keydown', e => {
    InputState.keys[e.key.toLowerCase()] = true;
    if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', e => {
    delete InputState.keys[e.key.toLowerCase()];
  });

  canvas.addEventListener('mousemove', e => {
    const p = toLogical(canvas, e.clientX, e.clientY);
    InputState.mouseX = p.x;
    InputState.mouseY = p.y;
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

  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // ── Touch controls ──────────────────────────────────────────────────────────
  let leftTouchId  = null;
  let rightTouchId = null;

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const pos = toLogical(canvas, touch.clientX, touch.clientY);
      InputState.mouseClicked = true; // any touch advances menu/UI screens
      if (pos.x < LOGICAL_WIDTH / 2 && leftTouchId === null) {
        leftTouchId = touch.identifier;
        InputState.joystick.active = true;
        InputState.joystick.dx     = 0;
        InputState.joystick.dy     = 0;
        InputState.joystick.baseX  = pos.x;
        InputState.joystick.baseY  = pos.y;
        InputState.joystick.knobX  = pos.x;
        InputState.joystick.knobY  = pos.y;
      } else if (pos.x >= LOGICAL_WIDTH / 2 && rightTouchId === null) {
        rightTouchId = touch.identifier;
        InputState.mouseX    = pos.x;
        InputState.mouseY    = pos.y;
        InputState.keys[' '] = true;
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const pos = toLogical(canvas, touch.clientX, touch.clientY);
      if (touch.identifier === leftTouchId) {
        const rawDx   = pos.x - InputState.joystick.baseX;
        const rawDy   = pos.y - InputState.joystick.baseY;
        const dist    = Math.hypot(rawDx, rawDy);
        const clamped = Math.min(dist, JOYSTICK_RADIUS);
        const angle   = Math.atan2(rawDy, rawDx);
        InputState.joystick.knobX = InputState.joystick.baseX + Math.cos(angle) * clamped;
        InputState.joystick.knobY = InputState.joystick.baseY + Math.sin(angle) * clamped;
        InputState.joystick.dx = dist > 0 ? Math.cos(angle) * (clamped / JOYSTICK_RADIUS) : 0;
        InputState.joystick.dy = dist > 0 ? Math.sin(angle) * (clamped / JOYSTICK_RADIUS) : 0;
      } else if (touch.identifier === rightTouchId) {
        InputState.mouseX = pos.x;
        InputState.mouseY = pos.y;
      }
    }
  }, { passive: false });

  function handleTouchEnd(e) {
    e.preventDefault();
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      if (touch.identifier === leftTouchId) {
        leftTouchId = null;
        InputState.joystick.active = false;
        InputState.joystick.dx     = 0;
        InputState.joystick.dy     = 0;
      } else if (touch.identifier === rightTouchId) {
        rightTouchId = null;
        delete InputState.keys[' '];
      }
    }
  }

  canvas.addEventListener('touchend',    handleTouchEnd, { passive: false });
  canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
}

export function clearFrameInput() {
  InputState.mouseClicked = false;
}
