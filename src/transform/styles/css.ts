import * as path from "path";
import * as fs from "fs-extra";

import * as config from "../../config";

export default class Css {
    constructor(public file: string, public parents: string[], public options: config.CompileOptions) {
    }

    async getImports() {
        const code = await this.getFileCode(this.file);
        return code.replace(/\s*@import\s+(['"])([^'"]+)\1/g, (str, quote, dep) => {

            return str;
        });
    }

    private async getFileCode(file: string) {
        return fs.readFile(file, 'utf8');
    }

    async transform() {
        const extname = path.extname(this.file);
        for (let parent of this.parents) {
            const parentExtname = path.extname(parent);
            const dist = path.join(this.options.dist, path.dirname(path.relative(this.options.src, parent)));

            let file;
            if (config.APP_ENTRY_EXTNAMES.includes(parentExtname)) {
                file = `${path.basename(parent).replace(new RegExp(`${parentExtname}$`), '')}.wxss`;
            } else {
                file = `${path.basename(this.file, extname)}.wxss`;
            }
            let code = await this.getFileCode(this.file);
            code = code.replace(/\s*@import\s+(['"])([^'"]+)\1/g, (str, quote, dep) => {
                const parent = path.join(dist, file);
                const src = path.join(path.dirname(this.file), dep);
                dep = path.relative(path.dirname(parent), path.join(this.options.dist, path.relative(this.options.src, src)));
                return `@import "${dep.replace(/\\/g, '/')}"`;
            });
            await fs.outputFile(path.join(dist, file), code);
        }
    }

}
