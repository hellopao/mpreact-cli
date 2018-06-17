import * as path from "path";
import * as fs from "fs-extra";
import * as sass from "sass";

import * as config from "../../config";

export default class Scss {

    imports: string[] = [];

    constructor(public file: string, public parents: string[], public options: config.CompileOptions) {
    }

    compile(file: string) {
        try {
            // renderSync() is more than twice as fast as render()
            const res = sass.renderSync({
                file,
                importer: (url: string, prev: string, done) => {
                    this.imports.push(url);
                    done({
                        file: url,
                        contents: ``,
                    })
                }
            });
            return res.css.toString();
        } catch (err) {
            console.error('编译scss文件 %s 失败 %j', file, err);
            return err;
        }
    }

    async transform() {
        const extname = path.extname(this.file);
        for (let parent of this.parents) {
            const parentExtname = path.extname(parent)
            const dist = path.join(this.options.dist, path.dirname(path.relative(this.options.src, parent)));
            let file;
            if (config.APP_ENTRY_EXTNAMES.includes(parentExtname)) {
                file = `${path.basename(parent).replace(new RegExp(`${parentExtname}$`), '')}.wxss`;
            } else {
                file = `${path.basename(this.file, extname)}.wxss`;
            }

            const res = this.compile(this.file);
            const imports = this.imports.map(item => {
                const file = path.join(path.dirname(this.file), item);
                return `@import "${this.normalizePath(path.relative(dist, path.join(this.options.dist, path.relative(this.options.src, file)))).replace(/\.scss$/, '.wxss')}";`
            })
            await fs.outputFile(path.join(dist, file), `${imports.join(';')}${res}`)
        }
    }

    private normalizePath(file) {
        return path.normalize(file).replace(/\\/g, '/')
    }
}