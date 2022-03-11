export function readableSize(bytes: number, digits = 3) {
  const unit = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let length = String(bytes).length;
  // Hint: 1023 -> 1.023KB, factor=1.
  let factor = Math.floor((length - 1) / 3);
  // scalar = bytes/1024^factor
  return `${(bytes / (1024 ** factor)).toPrecision(factor ? digits : length)}${unit[factor]}`;
}
