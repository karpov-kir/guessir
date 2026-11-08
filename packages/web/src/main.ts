/* v8 ignore start */

import { boot } from './boot';
import { initThemeToggle } from './utils/theme';

initThemeToggle({ button: document.getElementById('theme-toggle') as HTMLButtonElement });
void boot(document.body);

/* v8 ignore stop */
