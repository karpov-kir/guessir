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
