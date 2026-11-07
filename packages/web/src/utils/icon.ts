/**
 * Returns an inline icon's SVG with the attributes every icon shares. The icon files hold only their shapes and
 * stroke width; `.icon` in styles.css gives them their size and draws them in the text colour.
 */
export function icon(svg: string, className?: string) {
  const classes = className ? `icon ${className}` : 'icon';

  return svg.replace('<svg', `<svg class="${classes}" aria-hidden="true" focusable="false"`);
}
