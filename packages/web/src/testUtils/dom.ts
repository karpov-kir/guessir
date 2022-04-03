export function getElementText(container: HTMLElement, selector: string) {
  const element = container.querySelector(selector) as HTMLElement | null;
  return element ? element.textContent?.trim() : undefined;
}
