import * as path from "path";
import * as fs from "fs-extra";
import * as sass from "sass";

import * as config from "../../config";

export default class Scss {

    imports: string[] = [];

    constructor(public file: string, public parent: string, public options: config.CompileOptions) {
    }

    async compile(file: string) {
        return new Promise((resolve, reject) => {
            sass.render({
                file,
                importer: (url: string, prev: string, done) => {
                    this.imports.push(url);
                    done({
                        file: url,
                        contents: ``,
                    })
                }
            }, function (err, result) {
                if (err) {
                    return reject(err)
                }
                resolve(result.css.toString());
            });
        })
    }

    async transform() {
        const extname = path.extname(this.file);
        const parentExtname = path.extname(this.parent)
        const dist = path.join(this.options.dist, path.dirname(path.relative(this.options.src, this.parent)));
        let file;
        if (config.APP_ENTRY_EXTNAMES.includes(parentExtname)) {
            file = `${path.basename(this.parent).replace(new RegExp(`${parentExtname}$`), '')}.wxss`;
        }  else {
            file = `${path.basename(this.file, extname)}.wxss`;
        }

        const res = await this.compile(this.file);
        const imports = this.imports.map(item => {
            const file = path.join(path.dirname(this.file), item);
            return `@import "${this.normalizePath(path.relative(dist, path.join(this.options.dist, path.relative(this.options.src, file)))).replace(/\.scss$/, '.wxss')}";`
        })
        await fs.outputFile(path.join(dist, file), `${imports.join(';')}${res}`)
    }

    private normalizePath(file) {
        return path.normalize(file).replace(/\\/g, '/')
    }
}