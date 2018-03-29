import Transformer from "./";

export default class Module extends Transformer {

    
    async createConfigFile() {
        return Promise.resolve();
    }

    async createScriptFile() {
        return Promise.resolve();
    }

    getModuleConfig()  {
        return {}
    }

}