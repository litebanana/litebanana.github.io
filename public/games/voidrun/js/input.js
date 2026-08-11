/* input.js — keyboard + mouse state. */
(function () {
  'use strict';
  const VR = window.VR;

  const input = {
    keys: new Set(),        // held keys (event.code)
    pressed: new Set(),     // pressed this frame
    released: new Set(),    // released this frame
    mouseX: 0, mouseY: 0,   // client coords
    worldX: 0, worldY: 0,   // world coords (updated by game)
    down: false,            // LMB held
    clicked: false,         // LMB pressed this frame
    rmb: false,
    wheel: 0,

    init(canvas) {
      window.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
        this.keys.add(e.code);
        this.pressed.add(e.code);
      });
      window.addEventListener('keyup', (e) => {
        this.keys.delete(e.code);
        this.released.add(e.code);
      });
      window.addEventListener('blur', () => { this.keys.clear(); this.down = false; });

      canvas.addEventListener('mousemove', (e) => {
        this.mouseX = e.clientX; this.mouseY = e.clientY;
      });
      canvas.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (e.button === 0) { this.down = true; this.clicked = true; }
        if (e.button === 2) this.rmb = true;
      });
      window.addEventListener('mouseup', (e) => {
        if (e.button === 0) this.down = false;
        if (e.button === 2) this.rmb = false;
      });
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      canvas.addEventListener('wheel', (e) => { this.wheel += e.deltaY > 0 ? 1 : -1; });
    },

    /** Called once at the END of each frame (after input was consumed). */
    endFrame() { this.pressed.clear(); this.released.clear(); this.clicked = false; this.wheel = 0; },
    held(code) { return this.keys.has(code); },
    wasPressed(code) { return this.pressed.has(code); },
    wasReleased(code) { return this.released.has(code); }
  };

  VR.input = input;
})();
