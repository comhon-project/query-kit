import { registerClasses } from "./ClassManager";
import { registerIcons } from "./IconManager";
import { registerComponents } from "./InputManager";


export default {
    install: (app, options) => {
        if (!options) {
            return;
        }
        if (options.icons) {
            registerIcons(options.icons);
        }
        if (options.classes) {
            registerClasses(options.classes);
        }
        if (options.inputs) {
            registerComponents(options.inputs);
        }
    }
}