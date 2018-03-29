import * as vm from "vm";

import Transformer from "./";
import * as jsxParser from "../lib/jsxParser";

export default class Page extends Transformer {

    async transform() {
        await this.createWxmlFile();
        await super.transform();
    }

    async createConfigFile() {
        const config = this.getModuleConfig();
        const components = await this.getDependComponents();
        Object.assign(config, {
            usingComponents: components
        });
        this.createFile(JSON.stringify(config), 'json');
    }

    async createScriptFile() {
        const code = this.getScriptCode();
        this.createFile(code, 'js');
    }

    async createWxmlFile() {
        const jsx = await this.getJsxTemplate();
        const wxml = this.getWxmlCode(jsx);
        this.createFile(wxml, 'wxml');
    }

    getWxmlCode(jsx: string) {
        return jsxParser.parser(jsx, { props: ["state", "props"] });
    }

    getScriptCode() {
        const ctor = this.getModuleConstructor();
        let code = this.transpileTsCode();
        code += `
            Page({
                onLoad: function(options) {
                    const page = new ${ctor}(this, options);

                    // 设置默认值
                    page.setState(page.defaultData || {}, () => {
                        page.title && page.setTitle(page.title);
                        page.mounted && page.mounted();
                    })
                }
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