import * as path from "path";
import * as fs from "fs-extra";
import * as less from "less";

import * as config from "../../config";

export default class Less {
    constructor(public file: string, public parent: string, public options: config.CompileOptions) {
    }

    async compile(file: string) {
        const code = await fs.readFile(file, 'utf8');
        return new Promise((resolve, reject) => {
            less.render(code, { filename: file,}, function (err, result) {
                if (err) {
                    return reject(err)
                }
                resolve(result.css);
            });
        })
    }

    async transform() {
        const extname = path.extname(this.file);
        const dist = path.join(this.options.dist, path.dirname(path.relative(this.options.src, this.parent)));
        const file = `${path.basename(this.parent).replace(new RegExp(`${path.extname(this.parent)}$`), '')}.wxss`;

        const res = await this.compile(this.file);
        await fs.outputFile(path.join(dist, file), res)
    }

}