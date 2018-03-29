import * as path from "path";
import * as fs from "fs-extra";

import { logger } from "../utils/decorators";
import Css from "./styles/css";
import Scss from "./styles/scss";
import Less from "./styles/less";

import * as config from "../config";

export default class StyleModule {

    constructor(public file: string, public parent: string, public options: config.CompileOptions) {
    }

    async transform() {
        const extname = path.extname(this.file);
        switch (extname) {
            case ".css":
                await this.transformCss();
                break;
            case ".scss":
                await this.transformScss();
                break;
            case ".less":
                await this.transformLess();
            default:
                await this.transformCss();
                break;
        }
    }

    @logger('编译css文件', ctx => ctx.file)
    private async transformCss() {
        const css = new Css(this.file, this.parent, this.options);
        await css.transform();
    }

    @logger('编译scss文件', ctx => ctx.file)
    private async transformScss() {
        const scss = new Scss(this.file, this.parent, this.options);
        await scss.transform();
    }

    @logger('编译less文件', ctx => ctx.file)
    private async transformLess() {
        const less = new Less(this.file, this.parent, this.options);
        await less.transform();
    }

}