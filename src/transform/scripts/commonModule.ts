import Transformer from "./";

export default class Module extends Transformer {

    
    async createConfigFile() {
        return Promise.resolve();
    }

    async createScriptFile() {
        const code = this.transpileTsCode();
        this.createFile(code, 'js');
    }

    getModuleConfig()  {
        return {}
    }

}
