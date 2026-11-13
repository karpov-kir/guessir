/**
 * Returns the inline SVG with the attributes every icon shares, plus `className`. The icon files
 * hold only shapes and stroke width. The `.icon` class in
 * `src/entrypoints/page/styles/components.css` sets the size and the text colour.
 */
export function icon(svg: string, className?: string) {
  const classes = className ? `icon ${className}` : "icon";

  return svg.replace("<svg", `<svg class="${classes}" aria-hidden="true" focusable="false"`);
}
