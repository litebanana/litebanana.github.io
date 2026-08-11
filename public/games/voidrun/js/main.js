/* main.js — bootstrap and main loop. */
(function () {
  'use strict';
  const VR = window.VR;

  window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game');

    VR.save.load();
    VR.input.init(canvas);
    VR.game.init(canvas);
    VR.ui.init();

    // Audio requires a user gesture in most browsers.
    let audioReady = false;
    const initAudio = () => {
      if (audioReady) return;
      audioReady = true;
      VR.audio.init();
      const state = VR.game.state;
      if (state === 'playing') {
        VR.audio.setMusic(VR.game.boss && !VR.game.boss.dead ? 'boss' : 'combat');
      } else {
        VR.audio.setMusic('menu');
      }
      window.removeEventListener('pointerdown', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
    window.addEventListener('pointerdown', initAudio);
    window.addEventListener('keydown', initAudio);

    VR.ui.showMenu();

    // --- headless dev screens: open index.html#customize / #autotest ---
    if (location.hash === '#customize') {
      VR.ui.showCustomize();
    } else if (location.hash === '#autotest') {
      VR.saveData.tutorialDone = true;
      setTimeout(() => {
        VR.game.newRun('pulse');
        VR.game.player.godMode = true;
        VR.game.player.x = 720; VR.game.player.y = 450;
        for (let i = 0; i < 8; i++) {
          const def = VR.data.enemies[i % VR.data.enemies.length];
          const e = VR.spawnEnemy(def, 1000 + (i % 4) * 90, 240 + Math.floor(i / 4) * 260, { hpMult: 1, dmgMult: 1 });
          VR.game.enemies.push(e);
        }
        VR.input.mouseX = 1000; VR.input.mouseY = 450;
        VR.input.down = true;
        VR.input.keys.add('KeyD');
      }, 400);
    }

    let last = performance.now();
    const loop = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      VR.game.frame(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    window.addEventListener('resize', () => VR.game.resize());

    // auto-pause when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && VR.game.state === 'playing') VR.game.togglePause();
    });
  });
})();
