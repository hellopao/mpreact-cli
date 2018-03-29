import * as path from "path";
import * as fs from "fs-extra";
import * as ts from "typescript";
import Project, { ScriptTarget, SourceFile, SyntaxKind, PropertyNamedNode } from "ts-simple-ast";

import * as config from "../../config";

export default abstract class Transformer {

    sourceFile: SourceFile;

    abstract async createConfigFile(): Promise<void>;
    abstract async createScriptFile(): Promise<void>;

    abstract getModuleConfig(): object;

    constructor(public file: string, public options: config.CompileOptions) {
        this.initParser();
    }

    private initParser() {
        const project = new Project({
            compilerOptions: {
                allowJs: true,
                module: ts.ModuleKind.ESNext,
                target: ts.ScriptTarget.ES5,
                jsx: ts.JsxEmit.Preserve,
                importHelpers: true
            },
        });
        this.sourceFile = project.addExistingSourceFile(this.file);
    }

    async transform() {
        await this.createConfigFile();
        await this.createScriptFile()
    }

    getModuleConstructor() {
        return this.sourceFile.getClasses()[0].getName();
    }

    /**
     * 编译ts内容
     */
    transpileTsCode() {
        const sourceFile = this.sourceFile;

        sourceFile.getImportDeclarations().forEach(item => {
            const specifier = item.getModuleSpecifier();
            if (!/^\./.test(specifier)) {
                item.setModuleSpecifier(this.getVendorPath(this.file, specifier))
            }
            if (config.STYLE_MODULE_EXTNAMES.includes(path.extname(specifier))) {
                item.remove();
            }
        });
        const moduleCtor = sourceFile.getClasses()[0];
        moduleCtor.getDecorators().forEach(decorator => {
            if (["AppConfig", "PageConfig"].includes(decorator.getName())) {
                decorator.remove();
            }
        });

        const members = moduleCtor.getMembers();
        for (let member of members) {
            if (member.getKind() === SyntaxKind.PropertyDeclaration) {
                const name = (member as PropertyNamedNode).getName();
                if (name == "template") {
                    const children = member.getChildren();
                    const isJsx = children.some(child => {
                        return child.getKind() == SyntaxKind.JsxElement || child.getChildren().some(subChild => subChild.getKind() == SyntaxKind.JsxElement)
                    })
                    if (isJsx) {
                        member.remove();
                    }
                }
            }
        }

        const emitOutput = sourceFile.getEmitOutput();

        let code;
        if (this.isJs()) {
            code = ts.transpileModule(sourceFile.getText(), {
                compilerOptions: {
                    allowJs: true,
                    module: ts.ModuleKind.ESNext,
                    target: ts.ScriptTarget.ES5,
                    jsx: ts.JsxEmit.Preserve,
                    importHelpers: true
                }
            }).outputText
        } else {
            code = emitOutput.getOutputFiles()[0].getText();
        }
        return code.replace(/"tslib"/, `"${this.getVendorPath(this.file, 'tslib')}"`);
    }

    async getDependComponents() {
        const components = {};
        const sourceFile = this.sourceFile;
        sourceFile.getImportDeclarations().forEach(item => {
            const specifier = item.getModuleSpecifier();
            if (/^\./.test(specifier)) {
                const file = item.getModuleSpecifierSourceFile();
                if (file && config.COMPONENT_ENTRY_EXTNAMES.includes(path.extname(file.getFilePath()))) {
                    const name = item.getDefaultImport().getText();
                    components[name] = specifier;
                }
            }
        });
        return components;
    }

    getJsxTemplate() {
        const sourceFile = this.sourceFile;
        const moduleCtor = sourceFile.getClasses()[0];

        let template;
        const members = moduleCtor.getMembers();
        // TODO
        for (let member of members) {
            if (member.getKind() === SyntaxKind.PropertyDeclaration) {
                const name = (member as PropertyNamedNode).getName();
                if (name == "template") {
                    const children = member.getChildren();
                    children.forEach(child => {
                        if (child.getKind() == SyntaxKind.JsxElement) {
                            template = child.getText();
                        } else {
                            child.getChildren().forEach(subChild => {
                                if (subChild.getKind() == SyntaxKind.JsxElement) {
                                    template = subChild.getText();
                                }
                            })
                        }
                    })
                }
            }
        }

        return template;
    }

    getVendorPath(file: string, module: string) {
        const target = path.relative(path.dirname(file), path.join(this.options.src, `/vendors/${module}/index`));
        return path.normalize(target).replace(/\\/g, '/')
    }

    async createFile(code: string, extname: string) {
        const file = this.getTargetFile(this.file, extname);
        await fs.outputFile(file, code);
    }

    private getTargetFile(file: string, ext: string) {
        const extname = path.extname(file);
        return path.join(this.options.dist, path.relative(this.options.src, file)).replace(new RegExp(`${extname}$`), `.${ext}`);
    }

    isJs() {
        return /\.jsx?$/.test(this.file);
    }
}