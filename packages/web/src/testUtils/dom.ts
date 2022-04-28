export function getElementText(container: HTMLElement, selector: string) {
  return container.querySelector(selector)?.textContent?.trim();
}
