/* pixel.js — pixel-art rendering: 3×5 bitmap font + procedural pixel character. */
(function () {
  'use strict';
  const VR = window.VR;

  /* ---------- 3×5 bitmap font (uppercase, digits, symbols) ---------- */
  const FONT = {
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['###', '..#', '###', '#..', '###'],
    '3': ['###', '..#', '###', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '..#', '..#', '..#'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
    'A': ['.#.', '#.#', '###', '#.#', '#.#'],
    'B': ['##.', '#.#', '##.', '#.#', '##.'],
    'C': ['.##', '#..', '#..', '#..', '.##'],
    'D': ['##.', '#.#', '#.#', '#.#', '##.'],
    'E': ['###', '#..', '##.', '#..', '###'],
    'F': ['###', '#..', '##.', '#..', '#..'],
    'G': ['.##', '#..', '#.#', '#.#', '.##'],
    'H': ['#.#', '#.#', '###', '#.#', '#.#'],
    'I': ['###', '.#.', '.#.', '.#.', '###'],
    'J': ['..#', '..#', '..#', '#.#', '.#.'],
    'K': ['#.#', '#.#', '##.', '#.#', '#.#'],
    'L': ['#..', '#..', '#..', '#..', '###'],
    'M': ['#.#', '###', '#.#', '#.#', '#.#'],
    'N': ['#.#', '##.', '#.#', '#.#', '#.#'],
    'O': ['.#.', '#.#', '#.#', '#.#', '.#.'],
    'P': ['##.', '#.#', '##.', '#..', '#..'],
    'Q': ['.#.', '#.#', '#.#', '.#.', '.##'],
    'R': ['##.', '#.#', '##.', '#.#', '#.#'],
    'S': ['.##', '#..', '.#.', '..#', '##.'],
    'T': ['###', '.#.', '.#.', '.#.', '.#.'],
    'U': ['#.#', '#.#', '#.#', '#.#', '###'],
    'V': ['#.#', '#.#', '#.#', '#.#', '.#.'],
    'W': ['#.#', '#.#', '#.#', '###', '#.#'],
    'X': ['#.#', '#.#', '.#.', '#.#', '#.#'],
    'Y': ['#.#', '#.#', '.#.', '.#.', '.#.'],
    'Z': ['###', '..#', '.#.', '#..', '###'],
    ':': ['...', '.#.', '...', '.#.', '...'],
    '/': ['..#', '.#.', '.#.', '.#.', '#..'],
    '-': ['...', '...', '###', '...', '...'],
    '!': ['#.', '#.', '#.', '..', '#.'],
    '+': ['.#.', '.#.', '###', '.#.', '.#.'],
    '%': ['#.#', '..#', '.#.', '#..', '#.#'],
    '?': ['###', '..#', '.#.', '..#', '..#'],
    '<': ['..#', '.#.', '#..', '.#.', '..#'],
    '>': ['#..', '.#.', '..#', '.#.', '#..'],
    '*': ['#.#', '.#.', '###', '.#.', '#.#'],
    '=': ['...', '###', '...', '###', '...'],
    '.': ['...', '...', '...', '...', '#..'],
    ',': ['...', '...', '...', '.#.', '#..'],
    '(': ['.#.', '#..', '#..', '#..', '.#.'],
    ')': ['#..', '.#.', '.#.', '.#.', '#..'],
    ' ': ['...', '...', '...', '...', '...']
  };

  /**
   * Draw a string with the bitmap font. Current transform is used; x,y = baseline top-left.
   * scale = pixel size. Returns the drawn width in world units.
   */
  function text(ctx, str, x, y, color, scale, align) {
    scale = scale || 3;
    align = align || 'left';
    const s = String(str).toUpperCase();
    let w = 0;
    for (const ch of s) w += 4 * scale;
    w -= scale;
    let ox = x;
    if (align === 'center') ox = x - w / 2;
    else if (align === 'right') ox = x - w;
    ctx.save();
    ctx.fillStyle = color;
    for (const ch of s) {
      const glyph = FONT[ch] || FONT[' '];
      for (let r = 0; r < 5; r++) {
        const row = glyph[r];
        for (let c = 0; c < row.length; c++) {
          if (row[c] === '#') ctx.fillRect(ox + c * scale, y + r * scale, scale, scale);
        }
      }
      ox += 4 * scale;
    }
    ctx.restore();
    return w;
  }

  /* ---------- ear styles (top rows of the character sprite) ---------- */
  // E = outer ear, I = pink inner ear, H = head fur
  const HAIR_STYLES = {
    0: [
      '..EE.....EE..',   // long upright ears
      '..EIE...EIE..',
      '..EIE...EIE..',
      '..EIE...EIE..',
      '...EEE.EEE...'
    ],
    1: [
      '.EEE.....EEE.',   // lop ears (floppy, angled out)
      '.EIE.....EIE.',
      '..EIE...EIE..',
      '..EEE...EEE..',
      '...EE...EE...'
    ],
    2: [
      '..EEE...EEE..',   // short stubby ears
      '..EIE...EIE..',
      '...EEE.EEE...',
      '....HHHHH....',
      '....HHHHH....'
    ]
  };

  /**
   * Draw the pixel rabbit at the current transform origin, facing +x.
   * app: {ears, hair, face, outfit, belt, glow} colors. style: ear style id. ps: pixel size.
   */
  function character(ctx, app, style, ps) {
    style = style || 0;
    ps = ps || 2.4;
    const rows = HAIR_STYLES[style] || HAIR_STYLES[0];
    const BODY = [
      '..HHHHHHHHH..',   // forehead
      '.HHHdHHHdHH..',   // eyes (symmetrical, cols 4 & 8)
      '.HHfffffffH..',   // cheeks
      '.HHfNNNffH...',   // nose (centered, cols 5-6)
      '.HHffttffH...',   // buck teeth
      '.HHHHHHHHHH..',   // chin
      '..OOOOOOOOO..',   // tunic
      '.TOOBBBBBOO..',   // tail + belt
      '.TOOOOOOOOO..',   // tail + skirt
      '.TOOOOOOOOO..',   // tail + skirt
      '..SSS..SSS...',   // feet
      '..SSS..SSS...'    // feet
    ];
    const W = 13;
    // center the sprite on the current origin (top-left is the draw anchor by default)
    ctx.save();
    ctx.translate(-W * ps / 2, -(rows.length + BODY.length) * ps / 2);
    const colors = {
      'E': app.ears || '#a06bff',
      'I': '#f9a8c8',                 // pink inner ear
      'H': app.hair || '#e8c566',
      'f': app.face || '#f2c9a0',
      'N': '#e0607a',                 // nose
      't': '#fff6e8',                 // teeth
      'd': '#2a1c12',                 // eyes
      'O': app.outfit || '#7a3b2e',
      'B': app.belt || '#5a2a1e',
      'S': app.face || '#f2c9a0',     // paws
      'T': app.face || '#f2c9a0'      // fluffy tail
    };
    // drop shadow
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000000';
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < W; c++) {
        if (rows[r][c] !== '.') ctx.fillRect((c + 0.5) * ps, (r + 1) * ps, ps, ps);
      }
    }
    for (let r = 0; r < BODY.length; r++) {
      for (let c = 0; c < W; c++) {
        if (BODY[r][c] !== '.') ctx.fillRect((c + 0.5) * ps, (rows.length + r + 1) * ps, ps, ps);
      }
    }
    ctx.restore();
    // sprite
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < W; c++) {
        const ch = rows[r][c];
        if (ch !== '.') {
          ctx.fillStyle = colors[ch] || app.hair;
          ctx.fillRect(c * ps, r * ps, ps, ps);
        }
      }
    }
    for (let r = 0; r < BODY.length; r++) {
      for (let c = 0; c < W; c++) {
        const ch = BODY[r][c];
        if (ch !== '.') {
          ctx.fillStyle = colors[ch] || app.outfit;
          ctx.fillRect(c * ps, (rows.length + r) * ps, ps, ps);
        }
      }
    }
    // dagger in the right hand, pointing +x
    ctx.fillStyle = '#cfd6dd';
    ctx.fillRect(11 * ps, (rows.length + 7) * ps, 4 * ps, ps);
    ctx.fillStyle = app.belt || '#5a2a1e';
    ctx.fillRect(11 * ps, (rows.length + 7) * ps, ps, ps);
    ctx.restore();
  }

  /** Draw a pixel coin (gold). x,y = center. */
  function coin(ctx, x, y, r) {
    ctx.fillStyle = '#3d2a10';
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = '#ffcf4d';
    ctx.fillRect(x - r + 1, y - r + 1, r * 2 - 2, r * 2 - 2);
    ctx.fillStyle = '#ffe9a3';
    ctx.fillRect(x - 2, y - r + 1, r, r * 2 - 2);
    ctx.fillStyle = '#b8860b';
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }

  /** Small item icons drawn with rects at pixel scale. s = cell size. */
  function icon(ctx, name, x, y, s) {
    ctx.save();
    switch (name) {
      case 'potion':
        ctx.fillStyle = '#3a9d5f';
        ctx.fillRect(x + s * 0.35, y, s * 0.3, s * 0.25);            // neck
        ctx.fillStyle = '#2f7ad6';
        ctx.fillRect(x + s * 0.15, y + s * 0.25, s * 0.7, s * 0.55); // body
        ctx.fillStyle = '#8fd0ff';
        ctx.fillRect(x + s * 0.25, y + s * 0.32, s * 0.2, s * 0.4);  // shine
        ctx.fillStyle = '#1d4d8f';
        ctx.fillRect(x + s * 0.15, y + s * 0.25, s * 0.7, s * 0.08); // cork line
        break;
      case 'bomb':
        ctx.fillStyle = '#222222';
        ctx.fillRect(x + s * 0.2, y + s * 0.2, s * 0.6, s * 0.6);    // body
        ctx.fillStyle = '#555555';
        ctx.fillRect(x + s * 0.28, y + s * 0.28, s * 0.18, s * 0.18);
        ctx.fillStyle = '#8a6a3a';
        ctx.fillRect(x + s * 0.45, y + s * 0.05, s * 0.12, s * 0.2);  // fuse
        ctx.fillStyle = '#ffb84d';
        ctx.fillRect(x + s * 0.42, y, s * 0.18, s * 0.08);            // spark
        break;
      case 'key':
        ctx.fillStyle = '#ffcf4d';
        ctx.fillRect(x + s * 0.1, y + s * 0.4, s * 0.6, s * 0.15);    // shaft
        ctx.fillRect(x + s * 0.1, y + s * 0.15, s * 0.22, s * 0.4);   // ring
        ctx.fillRect(x + s * 0.1, y + s * 0.15, s * 0.08, s * 0.14);
        ctx.fillRect(x + s * 0.7, y + s * 0.4, s * 0.2, s * 0.15);
        ctx.fillRect(x + s * 0.8, y + s * 0.55, s * 0.1, s * 0.12);
        ctx.fillRect(x + s * 0.72, y + s * 0.62, s * 0.1, s * 0.12);
        break;
      case 'skull':
        ctx.fillStyle = '#cfd6dd';
        ctx.fillRect(x + s * 0.15, y + s * 0.1, s * 0.7, s * 0.62);
        ctx.fillRect(x + s * 0.32, y + s * 0.72, s * 0.36, s * 0.16);
        ctx.fillStyle = '#2a1c12';
        ctx.fillRect(x + s * 0.27, y + s * 0.25, s * 0.14, s * 0.16);
        ctx.fillRect(x + s * 0.59, y + s * 0.25, s * 0.14, s * 0.16);
        ctx.fillRect(x + s * 0.45, y + s * 0.55, s * 0.1, s * 0.1);
        break;
      case 'nova':
        ctx.fillStyle = '#4d9fff';
        ctx.fillRect(x + s * 0.2, y + s * 0.2, s * 0.6, s * 0.6);
        ctx.fillStyle = '#8fd0ff';
        ctx.fillRect(x + s * 0.35, y + s * 0.35, s * 0.3, s * 0.3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + s * 0.42, y + s * 0.42, s * 0.16, s * 0.16);
        ctx.fillStyle = '#4d9fff';
        ctx.fillRect(x + s * 0.05, y + s * 0.05, s * 0.12, s * 0.12);
        ctx.fillRect(x + s * 0.83, y + s * 0.05, s * 0.12, s * 0.12);
        ctx.fillRect(x + s * 0.05, y + s * 0.83, s * 0.12, s * 0.12);
        ctx.fillRect(x + s * 0.83, y + s * 0.83, s * 0.12, s * 0.12);
        break;
      case 'gem':
        ctx.fillStyle = '#a06bff';
        ctx.beginPath();
        ctx.moveTo(x + s * 0.5, y);
        ctx.lineTo(x + s, y + s * 0.5);
        ctx.lineTo(x + s * 0.5, y + s);
        ctx.lineTo(x, y + s * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#d9bfff';
        ctx.fillRect(x + s * 0.5, y + s * 0.15, s * 0.14, s * 0.2);
        break;
      case 'chest':
        ctx.fillStyle = '#7a4a22';
        ctx.fillRect(x + s * 0.1, y + s * 0.35, s * 0.8, s * 0.5);
        ctx.fillStyle = '#8f5c2c';
        ctx.fillRect(x + s * 0.1, y + s * 0.3, s * 0.8, s * 0.12);
        ctx.fillStyle = '#c8a84a';
        ctx.fillRect(x + s * 0.1, y + s * 0.4, s * 0.8, s * 0.08);
        ctx.fillRect(x + s * 0.1, y + s * 0.72, s * 0.8, s * 0.08);
        ctx.fillRect(x + s * 0.45, y + s * 0.38, s * 0.1, s * 0.38);
        break;
    }
    ctx.restore();
  }

  VR.pixel = { text, character, coin, icon, HAIR_STYLES };
})();
