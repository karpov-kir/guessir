type OnEnterOptions = {
  /**
   * Flips `checked` before the callback runs, for a checkbox. A browser toggles a checkbox only on
   * Space, so Enter alone leaves the state unchanged.
   */
  toggleChecked?: boolean;
};

export const onEnter = (
  element: HTMLInputElement,
  callback: (event: Event) => void,
  options: OnEnterOptions = {},
) => {
  element.addEventListener("keypress", (event) => {
    if (event.key !== "Enter" && event.key !== "NumpadEnter") {
      return;
    }

    if (options.toggleChecked) {
      element.checked = !element.checked;
    }

    callback(event);
  });
};

export const onChangeAndEnter = (
  element: HTMLInputElement,
  callback: (event: Event) => void,
  options: OnEnterOptions = {},
) => {
  element.addEventListener("change", (event) => {
    callback(event);
  });

  onEnter(element, callback, options);
};

/**
 * Returns the element that `selector` finds under `root`. Throws when there is none, or when it is
 * not an instance of `type`. A renderer whose markup lost or changed an element then fails where it
 * reads it.
 */
export function requireElement<T extends Element>({
  root,
  selector,
  type,
}: {
  root: ParentNode;
  selector: string;
  type: new () => T;
}): T {
  const element = root.querySelector(selector);

  if (!(element instanceof type)) {
    throw new TypeError(`Expected an instance of ${type.name} at "${selector}"`);
  }

  return element;
}
