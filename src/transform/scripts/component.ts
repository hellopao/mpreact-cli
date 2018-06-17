import * as vm from "vm";
import Project, { PropertyDeclaration, SyntaxKind } from "ts-simple-ast";

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
        return this.createFile(JSON.stringify(config), 'json');
    }

    async createScriptFile() {
        const code = this.getScriptCode();
        return this.createFile(code, 'js');
    }

    async createWxmlFile() {
        const jsx = await this.getJsxTemplate();
        const wxml = this.getWxmlCode(jsx);
        return this.createFile(wxml, 'wxml');
    }

    getEventHandlers() {
        const jsx = this.getJsxTemplate();
        return jsxParser.getJsxEvents(jsx, { props: ["state", "props"] });
    }

    transformCustomEvents(props: any = {}) {
        const events = Object.keys(props).filter(item => props[item].name === 'Function');
        events.forEach(event => {
            const moduleCtor = this.sourceFile.getClasses()[0];
            const methods = moduleCtor.getMethods() || [];
            methods.forEach(item => {
                const expressions = item.getBody().getDescendantsOfKind(SyntaxKind.CallExpression);
                expressions.forEach(expression => {
                    try {
                        if (expression.getExpression().getText() === `this.props.${event}`) {
                            const pos = expression.getPos(), end = expression.getEnd(), args = expression.getArguments().map(item => item.getText());
                            expression.replaceWithText(
                                `this.component.triggerEvent("${event.replace(/^on/, '').toLowerCase()}", ${args.toString()})`)
                        }
                    } catch (err) {

                    }
                })
            })

        })
    }

    
    getLifeCycleHandlers() {
        const classDeclaration = this.sourceFile.getClasses()[0];
        const methods = (classDeclaration.getMethods()||[]).map(item => item.getName());
        return methods.filter(item => ["created", "ready", "moved", "detached"].includes(item))
    }

    getScriptCode() {
        const ctor = this.getModuleConstructor();
        const props = this.getComponentProps();
        const lifeCycleHandlers = this.getLifeCycleHandlers();
        const eventHandlers = this.getEventHandlers();
        this.transformCustomEvents(props);
        let code = this.transpileTsCode();
        let properties = '', events = '', lifeCycles = '';
        Object.keys(props).forEach(item => {
            let type, value;
            const prop = props[item];
            // types constructor
            if (typeof prop === "function") {
                type = prop.name;
                value = null;
            } else {
                type = (prop === undefined || prop === null) ? 'Object' : prop.constructor.name;
                value = JSON.stringify(prop);
            }

            if (type !== 'Function') {
                properties +=
                    `${item}: {
                    type: ${type},
                    value: ${value},
                    observer: function(val, oldVal) { this._onPropsChange('${item}', val, oldVal)}
                },`
            }
        });
        eventHandlers.forEach(item => {
            events +=
                `${item}: function(e) {
                try {
                    this._component["${item}"] && this._component["${item}"].bind(this._component)(e);
                } catch (err) {
                }
                return false;
            },`
        });
        lifeCycleHandlers.forEach(item => {
            lifeCycles += 
                `${item}: function() {
                    this._component[${item}] && this._component[${item}]();
                },`
        })
        code += `
            Component({
                properties: {
                    ${properties}
                },
                attached: function() {
                    const component = new ${ctor}(this);
                    this._component = component;
                    component.setState(component.state || {}, () => {
                        component.mounted && component.mounted();
                    });
                },
                ${lifeCycles}
                methods: {
                    ${events}
                    _onPropsChange: function(type, val, oldVal) {
                        try {
                            this._component.props[type] = val;
                            type = type.charAt(0).toUpperCase() + type.slice(1);
                            const observer = this._component['on' + type + 'Change'];
                            observer && observer.bind(this._component)(val, oldVal);
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
                FunctionType: Function,
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
