/**
 * Returns the SVG element of an icon file, with the attributes every icon shares, plus
 * `className`. The icon files hold only shapes and stroke width. The `.icon` class in
 * `src/entrypoints/page/styles/components.css` sets the size and the text colour.
 */
export function icon(svg: string, className?: string): SVGSVGElement {
  const element = new DOMParser().parseFromString(svg, "image/svg+xml").documentElement;

  if (!(element instanceof SVGSVGElement)) {
    throw new TypeError("Expected an icon file that holds one <svg> element");
  }

  element.classList.add("icon", ...(className ? [className] : []));
  element.setAttribute("aria-hidden", "true");
  element.setAttribute("focusable", "false");

  return element;
}
