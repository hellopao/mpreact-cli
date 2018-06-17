import * as path from "path";
import * as fs from "fs-extra";

import { logger } from "../utils/decorators";
import Css from "./styles/css";
import Scss from "./styles/scss";
import Less from "./styles/less";

import * as config from "../config";

export default class StyleModule {

    constructor(public file: string, public parents: string[], public options: config.CompileOptions) {
        if (this.parents.every(item => config.STYLE_MODULE_EXTNAMES.includes(path.extname(item)))) {
            this.parents = [parents[0]];
        }
    }

    async transform() {
        const extname = path.extname(this.file);
        switch (extname) {
            case ".css":
                return this.transformCss();
            case ".scss":
                return this.transformScss();
            case ".less":
                return this.transformLess();
            default:
                return this.transformCss();
        }
    }

    @logger('编译css文件', ctx => ctx.file)
    private async transformCss() {
        const css = new Css(this.file, this.parents, this.options);
        return css.transform();
    }

    @logger('编译scss文件', ctx => ctx.file)
    private async transformScss() {
        const scss = new Scss(this.file, this.parents, this.options);
        return scss.transform();
    }

    @logger('编译less文件', ctx => ctx.file)
    private async transformLess() {
        const less = new Less(this.file, this.parents, this.options);
        return less.transform();
    }

}