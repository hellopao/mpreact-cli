import * as vm from "vm";

import Transformer from "./";

export default class App extends Transformer {

    async createConfigFile() {
        const config = this.getModuleConfig();
        this.createFile(JSON.stringify(config), 'json');
    }

    async createScriptFile() {
        const code = this.getScriptCode();
        this.createFile(code, 'js');
    }

    getScriptCode() {
        const ctor = this.getModuleConstructor();
        let code = this.transpileTsCode();
        code += `
            App({
                onLaunch(options) {
                    this.options = options;
                    const app = new ${ctor}(this, options);
                    app.mounted();
                }
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