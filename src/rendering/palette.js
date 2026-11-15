// CSS owns the palette for both the interface and the canvas. Read it when
// rebuilding cached artwork, never during particle stepping or per grain.
export function readPalette(canvas) {
  const style = getComputedStyle(canvas);
  const names = [
    'scene',
    'haze',
    'landFar',
    'landNear',
    'stoneRim',
    'stoneLit',
    'stoneMid',
    'stoneShade',
    'stoneDust',
    'stonePit',
    'grease',
    'ground',
    'groundEdge',
    'bowlFoot',
    'bowlLit',
    'bowlShade',
    'bowlRim',
    'bowlDust',
    'sand',
    'sandOchre',
    'sandLight',
    'mark',
    'text',
  ];
  const palette = {};
  for (const name of names) {
    const token = name.replace(
      /[A-Z]/g,
      (letter) => `-${letter.toLowerCase()}`,
    );
    palette[name] = style.getPropertyValue(`--${token}`).trim();
  }
  palette.greaseRGB = [1, 3, 5].map((offset) =>
    parseInt(palette.grease.slice(offset, offset + 2), 16),
  );
  return palette;
}
