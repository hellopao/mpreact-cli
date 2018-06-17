import * as vm from "vm";

import Transformer from "./";

export default class App extends Transformer {

    async createConfigFile() {
        const config = this.getModuleConfig();
        return this.createFile(JSON.stringify(config), 'json');
    }

    async createScriptFile() {
        const code = this.getScriptCode();
        return this.createFile(code, 'js');
    }

    getLifeCycleHandlers() {
        const classDeclaration = this.sourceFile.getClasses()[0];
        const methods = (classDeclaration.getMethods()||[]).map(item => item.getName());
        return methods.filter(item => ["onShow", "onHide", "onError", "onPageNotFound"].includes(item))
    }

    getScriptCode() {
        const ctor = this.getModuleConstructor();
        const lifeCycleHandlers = this.getLifeCycleHandlers();
        let lifeCycles = ``;
        lifeCycleHandlers.forEach(item => {
            lifeCycles += 
                `${item}: function() {
                    this._component[${item}] && this._component[${item}]();
                },`
        })
        let code = this.transpileTsCode();
        code += `
            App({
                onLaunch(options) {
                    this.options = options;
                    const app = new ${ctor}(this, options);
                    app.mounted();
                },
                ${lifeCycles}
            })
        `;
        return code;
    }

    getModuleConfig(): { pages: string[] } {
        const classDeclaration = this.sourceFile.getClasses()[0];
        const decorators = classDeclaration.getDecorators();
        const config = decorators.find(item => item.getName() == "AppConfig").getArguments()[0];
        return vm.runInThisContext(`config = ${config.getText()}`);
    }

}