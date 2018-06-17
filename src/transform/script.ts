import * as path from "path";
import * as fs from "fs-extra";
import * as rollup from "rollup";
import * as commonjs from "rollup-plugin-commonjs";
import * as resolve from "rollup-plugin-node-resolve";

import App from "./scripts/app";
import Page from "./scripts/page";
import Component from "./scripts/component";
import CommonModule from "./scripts/commonModule";
import { logger } from "../utils/decorators";

import * as config from "../config";

export default class ScriptModule {

    file: string;
    type: config.FileModuleType;

    constructor(public fileModule: config.IFileModule, public options: config.CompileOptions) {
        this.file = fileModule.id;
        this.type = fileModule.type;
    }

    async transform() {
        switch (this.type) {
            case config.FileModuleType.APP:
                return this.transformApp();
            case config.FileModuleType.PAGE:
                return this.transformPage();
            case config.FileModuleType.COMPONENT:
                return this.transformComponent();
            case config.FileModuleType.COMMON_MODULE:
                return this.transformCommonModule();
            case config.FileModuleType.NPM_MODULE:
                return this.transformNpmModule();
        }

    }

    @logger('编译app文件', ctx => ctx.file)
    private async transformApp() {
        const app = new App(this.file, this.options);
        return app.transform();
    }

    @logger('编译page文件', ctx => ctx.file)
    private async transformPage() {
        const page = new Page(this.file, this.options);
        return page.transform();
    }

    @logger('编译component文件', ctx => ctx.file)
    private async transformComponent() {
        const component = new Component(this.file, this.options);
        return component.transform();
    }

    @logger('编译common module文件', ctx => ctx.file)
    private async transformCommonModule() {
        const commonModule = new CommonModule(this.file, this.options);
        return commonModule.transform();
    }

    @logger('打包npm模块', ctx => ctx.file)
    private async transformNpmModule() {
        const dirs = this.file.split(/[\\\/]/g);
        const name = dirs.find((_, index) => dirs[index - 1] == 'node_modules');

        const dist = path.join(this.options.dist, `/${this.options.vendors}/${name}/index.js`);
        if (this.fileModule.dependencies.length === 0) {
            return fs.copy(path.join(this.options.root, this.file), dist)
        } else {
            const file = path.join(this.options.root, `/node_modules/${name}/package.json`);
            const pkg = await fs.readJSON(file);
            const bundle = await rollup.rollup({
                input: path.join(path.dirname(file), pkg.main || 'index.js'),
                plugins: [resolve(), commonjs()],
                onwarn: () => { }
            });
            const { code } = await (bundle as rollup.OutputChunk).generate({
                format: "cjs"
            });
            try {
                return fs.outputFile(dist, code)
            } catch (err) {
                console.log(err)
                return err
            }
        }
    }
}
