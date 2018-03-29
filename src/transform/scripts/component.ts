import * as vm from "vm";
import Project, {PropertyDeclaration, SyntaxKind} from "ts-simple-ast";

import Transformer from "./";
import * as jsxParser from "../lib/jsxParser";

export default class Component extends Transformer {

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

    getEventHandlers() {
        const jsx = this.getJsxTemplate();
        return jsxParser.getJsxEvents(jsx, { props: ["state", "props"] });
    }

    getScriptCode() {
        const ctor = this.getModuleConstructor();
        const props = this.getComponentProps();
        const eventHandlers = this.getEventHandlers();
        let code = this.transpileTsCode();
        let properties = '', events = '';
        Object.keys(props).forEach(item => {
            properties +=
            `${item}: {
                type: ${props[item].name},
                value: null,
                observer: function(val, oldVal) { this._onPropsChange('${item}', val, oldVal)}
            },`
        });
        eventHandlers.forEach(item => {
            events += 
            `${item}: function(e) {
                try {
                    this._component["${item}"] && this._component["${item}"](e);
                } catch (err) {
                }
                return false;
            },`
        })
        code += `
            Component({
                properties: {
                    ${properties}
                },
                attached: function(options) {
                    const component = new ${ctor}(this, options);
                    component.data && this.setData(component.data);
                    component.mounted && component.mounted();
                    this._component = component;
                },
                methods: {
                    ${events}
                    _onPropsChange: function(type, val, oldVal) {
                        type = type.charAt(0).toUpperCase() + type.slice(1);
                        try {
                            const observer = this._component['on' + type + 'Change'];
                            observer && observer(val, oldVal);
                        } catch (err) {
                        }
                    }  
                }
            })
        `
        return code;
    }

    getWxmlCode(jsx: string) {
        return jsxParser.parser(jsx, { props: ["state", "props"] });
    }

    getComponentProps() {
        if (this.isJs()) {
            const classDeclaration = this.sourceFile.getClasses()[0];
            const staticMembers = classDeclaration.getStaticMembers();
            let props;
            for (let member of staticMembers) {
                const expression = member.getLastChildByKind(SyntaxKind.ObjectLiteralExpression);
                if (expression && expression.getText()) {
                    props = vm.runInThisContext(`props = ${expression.getText()}`);
                }
            }
            return props || {};
        }
        const args = this.sourceFile.getClasses()[0].getExtends().getTypeArguments();

        const props = {};
        for (let prop of ((args[0] as any).getProperties() as PropertyDeclaration[])) {
            const name = prop.getNameNode().getText();
            const kind = prop.getTypeNode().getKindName();
            props[name] = {
                ArrayType: Array,
                StringKeyword: String,
                NumberKeyword: Number,
                BooleanKeyword: Boolean,
                TypeLiteral: Object,
                TypeReference: Object,
                ObjectKeyword: Object,
            }[kind] || Object;
        }
        return props;
    }

    getModuleConfig() {
        return {
            component: true
        }
    }

}