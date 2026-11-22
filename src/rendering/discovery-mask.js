export class DiscoveryMask {
  update(field) {
    if (this.field !== field) {
      this.field = field;
      this.canvas = document.createElement('canvas');
      this.canvas.width = field.columns;
      this.canvas.height = field.rows;
      this.context = this.canvas.getContext('2d');
      this.pixels = this.context.createImageData(field.columns, field.rows);
      this.version = -1;
    }
    if (this.version === field.version) return false;
    const data = this.pixels.data;
    for (const index of field.active)
      data[index * 4 + 3] = Math.round(255 * field.levels[index]);
    this.context.putImageData(this.pixels, 0, 0);
    this.version = field.version;
    return true;
  }

  apply(context) {
    context.globalCompositeOperation = 'destination-in';
    context.drawImage(
      this.canvas,
      0,
      0,
      context.canvas.width,
      context.canvas.height,
    );
    context.globalCompositeOperation = 'source-over';
  }
}
