import * as path from "path";
import * as fs from "fs-extra";

import App from "./scripts/app";
import Page from "./scripts/page";
import Component from "./scripts/component";
import CommonModule from "./scripts/commonModule";
import { logger } from "../utils/decorators";

import * as config from "../config";

export default class ScriptModule {

    constructor(public file: string, public type: config.FileModuleType, public options: config.CompileOptions) {
    }

    async transform() {
        switch (this.type) {
            case config.FileModuleType.APP:
                await this.transformApp();
                break;
            case config.FileModuleType.PAGE:
                await this.transformPage();
                break;
            case config.FileModuleType.COMPONENT:
                await this.transformComponent();
                break;
            case config.FileModuleType.COMMON_MODULE:
                await this.transformCommonModule();
                break;
            default:
                break;
        }

    }

    @logger('编译app文件', ctx => ctx.file)
    private async transformApp() {
        const app = new App(this.file, this.options);
        app.transform();
    }

    @logger('编译page文件', ctx => ctx.file)
    private async transformPage() {
        const page = new Page(this.file, this.options);
        page.transform();
    }

    @logger('编译component文件', ctx => ctx.file)
    private async transformComponent() {
        const component = new Component(this.file, this.options);
        component.transform();
    }

    @logger('编译common module文件', ctx => ctx.file)
    private async transformCommonModule() {
        const commonModule = new CommonModule(this.file, this.options);
        commonModule.transform();
    }

}