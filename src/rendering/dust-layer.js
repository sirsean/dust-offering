// Rasterize actual subpixel disks into one transparent layer. Thousands of
// individual drawImage calls are expensive even when their sprites are tiny.
// Every grain keeps its own position, radius and colour; this is only a renderer.
export class DustLayer {
  constructor(width, height, scale, radius, colors) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.context = this.canvas.getContext('2d');
    this.pixels = this.context.createImageData(width, height);
    this.scale = scale;
    this.colors = colors.map((color) =>
      [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16)),
    );
    this.kernels = [];
    const r = radius * scale;
    const reach = Math.ceil(r);
    // Eight subpixel positions per axis keep slow motion smooth. Supersampling
    // measures circular coverage once on resize, never inside the grain loop.
    for (let py = 0; py < 8; py++)
      for (let px = 0; px < 8; px++) {
        const kernel = [];
        for (let y = -reach; y <= reach; y++)
          for (let x = -reach; x <= reach; x++) {
            let covered = 0;
            for (let sy = 0; sy < 8; sy++)
              for (let sx = 0; sx < 8; sx++) {
                const dx = x + (sx + 0.5) / 8 - px / 8;
                const dy = y + (sy + 0.5) / 8 - py / 8;
                if (dx * dx + dy * dy <= r * r) covered++;
              }
            if (covered) kernel.push(x, y, covered / 64);
          }
        this.kernels.push(kernel);
      }
  }

  draw(grains, destination) {
    const { data, width, height } = this.pixels;
    data.fill(0);
    for (const grain of grains) {
      const x = grain.x * this.scale,
        y = grain.y * this.scale;
      const ix = Math.floor(x),
        iy = Math.floor(y);
      const kernel =
        this.kernels[Math.floor((y - iy) * 8) * 8 + Math.floor((x - ix) * 8)];
      const color = this.colors[grain.id % this.colors.length];
      for (let i = 0; i < kernel.length; i += 3) {
        const cx = ix + kernel[i],
          cy = iy + kernel[i + 1];
        if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
        const pixel = (cy * width + cx) * 4,
          alpha = kernel[i + 2];
        const underneath = (data[pixel + 3] / 255) * (1 - alpha);
        const total = alpha + underneath;
        if (underneath === 0) {
          data[pixel] = color[0];
          data[pixel + 1] = color[1];
          data[pixel + 2] = color[2];
        } else {
          data[pixel] = (color[0] * alpha + data[pixel] * underneath) / total;
          data[pixel + 1] =
            (color[1] * alpha + data[pixel + 1] * underneath) / total;
          data[pixel + 2] =
            (color[2] * alpha + data[pixel + 2] * underneath) / total;
        }
        data[pixel + 3] = Math.round(total * 255);
      }
    }
    this.context.putImageData(this.pixels, 0, 0);
    destination.drawImage(this.canvas, 0, 0);
  }
}
