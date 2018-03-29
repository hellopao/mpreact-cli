import * as path from "path";
import * as fs from "fs-extra";

import * as config from "../../config";

export default class Css {
    constructor(public file: string, public parent: string, public options: config.CompileOptions) {
    }

    async transform() {
        const extname = path.extname(this.file);
        const parentExtname = path.extname(this.parent);
        const dist = path.join(this.options.dist, path.dirname(path.relative(this.options.src, this.parent)));

        let file;
        if (config.APP_ENTRY_EXTNAMES.includes(parentExtname)) {
            file = `${path.basename(this.parent).replace(new RegExp(`${parentExtname}$`), '')}.wxss`;
        }  else {
            file = `${path.basename(this.file, extname)}.wxss`;
        }
        await fs.copy(this.file, path.join(dist, file));
    }

}