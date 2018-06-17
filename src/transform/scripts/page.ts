import * as vm from "vm";

import Transformer from "./";
import * as jsxParser from "../lib/jsxParser";
import { logger } from "../../utils/decorators";

export default class Page extends Transformer {

    jsx: string;

    async transform() {
        await this.createWxmlFile();
        await super.transform();
    }

    async createConfigFile() {
        let config = this.getModuleConfig();
        const components = await this.getDependComponents();
        config = Object.assign({}, config, {
            usingComponents: components
        });
        return this.createFile(JSON.stringify(config), 'json');
    }

    async createScriptFile() {
        const code = this.getScriptCode();
        return this.createFile(code, 'js');
    }

    async createWxmlFile() {
        this.jsx = await this.getJsxTemplate();
        const wxml = this.getWxmlCode(this.jsx);
        return this.createFile(wxml, 'wxml');
    }

    getWxmlCode(jsx: string) {
        return jsxParser.parser(jsx, { props: ["state", "props"] });
    }

    getEventHandlers() {
        return jsxParser.getJsxEvents(this.jsx, { props: ["state", "props"] });
    }

    getLifeCycleHandlers() {
        const classDeclaration = this.sourceFile.getClasses()[0];
        const methods = (classDeclaration.getMethods()||[]).map(item => item.getName());
        return methods.filter(item => ['onShow', 'onReady', 'onHide', 'onUnload', 'onPullDownRefresh', 'onReachBottom', 'onShareAppMessage'].includes(item))
    }

    getScriptCode() {
        const ctor = this.getModuleConstructor();
        const lifeCycleHandlers = this.getLifeCycleHandlers();
        let code = this.transpileTsCode();
        const eventHandlers = this.getEventHandlers();
        let events = ``;
        // 有些事件不会触发
        eventHandlers.forEach(item => {
            events += `${item}: function(e){},`
        });
        lifeCycleHandlers.forEach(item => {
            events += `${item}: function(){
                this._page[${item}] && this._page[${item}]()
            },`
        })
        code += `
            Page({
                onLoad: function(options) {
                    const page = new ${ctor}(this, options);
                    this._page = page;

                    // 设置默认值
                    page.setState(page.state || {}, () => {
                        page.title && page.setTitle(page.title);
                        page.mounted && page.mounted();
                    });

                },
                ${events}
            })
        `;
        return code;
    }

    getModuleConfig() {
        try {
            const classDeclaration = this.sourceFile.getClasses()[0];
            const decorators = classDeclaration.getDecorators();
            const config = decorators.find(item => item.getName() == "PageConfig").getArguments()[0];
            return vm.runInThisContext(`config = ${config.getText()}`);
        } catch (err) {
            return {};
        }
    }

}
