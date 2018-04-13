import * as path from "path";
import * as vm from "vm";
import * as glob from "glob";
import * as fs from "fs-extra";
import * as ts from "typescript";
import * as rollup from "rollup";
import * as dependencyTree from "dependency-tree";
import * as typescript from "rollup-plugin-typescript";
import Project, { SourceFile } from "ts-simple-ast";

import { logger } from "./utils/decorators";
import ScriptModule from "./transform/script";
import StyleModule from "./transform/style";

import * as config from "./config";

interface DepNode {
    [id: string]: DepNode | {};
}

export default class Compiler {

    compileOptions: config.CompileOptions;

    appFile: string;

    fileModules: config.IFileModule[];

    bundledDependencies: Array<string> = [];

    constructor(public src: string, public dist: string, public root: string) {
        this.compileOptions = {
            src, dist, root, vendors: "vendors"
        }
    }

    public async build() {
        this.appFile = await this.getAppFile();
        this.fileModules = await this.getFileModules();
        await this.transform();
    }

    @logger('编译变动文件')
    public async rebuild(file: string) {
        const fileModules = await this.getFileModules();
        const fileModule = fileModules.find(item => item.id === file);
        // 变动的是小程序模块文件
        if (fileModule) {
            const getDeps = (fileModule: config.IFileModule) => {
                const deps = [];
                const dependencies = fileModule.dependencies
                    .filter(item => item.includes(this.normalizeFile(this.src)))

                if (dependencies.length > 0) {
                    dependencies.forEach(id => {
                        const dependency = fileModules.find(item => item.id === id && this.normalizeFile(item.parent) == this.normalizeFile(fileModule.id));
                        if (dependency) {
                            deps.push(...getDeps(dependency))
                        }
                    })
                } else {
                    deps.push(fileModule)
                }
                return deps;
            }

            // 变动文件及其依赖
            const modules = [fileModule, ...getDeps(fileModule)];

            await Promise.all(
                modules.map(fileModule => {
                    let moduleTransformer;
                    if (fileModule.type !== config.FileModuleType.STYLESHEET) {
                        moduleTransformer = new ScriptModule(fileModule.id, fileModule.type, this.compileOptions);
                    } else {
                        moduleTransformer = new StyleModule(fileModule.id, fileModule.parent, this.compileOptions);
                    }
                    return moduleTransformer.transform();
                })
            )
        } else {
            await this.bundleAssets();
        }
    }

    private async transform() {
        await Promise.all([
            ...this.fileModules.map(fileModule => {
                let moduleTransformer;
                if (fileModule.type !== config.FileModuleType.STYLESHEET) {
                    moduleTransformer = new ScriptModule(fileModule.id, fileModule.type, this.compileOptions);
                } else {
                    moduleTransformer = new StyleModule(fileModule.id, fileModule.parent, this.compileOptions);
                }
                return moduleTransformer.transform();
            }),
            this.packTslib(),
            this.bundleAssets()
        ]);
    }

    private async getProjectFiles() {
        return new Promise<string[]>((resolve, reject) => {
            glob(`${this.src}/**/*.*`, (err, files) => {
                if (err) { return reject(err) }
                resolve(files.map(item => this.normalizeFile(item)));
            })
        });
    }

    @logger("打包其他文件")
    async bundleAssets() {
        const fileModules = this.fileModules.map(item => item.id);
        const files = await this.getProjectFiles();

        await Promise.all(files.filter(item => {
            return !fileModules.includes(item) && path.basename(item) !== "tsconfig.json" && !config.APP_ENTRY_EXTNAMES.includes(path.extname(item));
        }).map(item => {
            return fs.copy(item, path.join(this.dist, path.relative(this.src, item)))
        }))
    }

    @logger("解析项目模块")
    private async getFileModules(): Promise<config.IFileModule[]> {
        const pageFiles = await this.getPageFiles();
        let modules: config.IFileModule[] = [];

        await Promise.all([this.appFile, ...pageFiles].map(input => {
            return rollup.rollup({
                input,
                plugins: [
                    typescript({ typescript: ts, jsx: "react", include: ["*.ts+(|x)", "**/*.ts+(|x)", "*.js+(|x)", "**/*.js+(|x)"].map(item => path.join(this.compileOptions.src, item)) }),
                    {
                        name: 'style',
                        transform(code, id: string) {
                            if (config.STYLE_MODULE_EXTNAMES.includes(path.extname(id))) {
                                return '';
                            }
                        }
                    },
                ],
                onwarn: (warning: rollup.RollupWarning) => {
                    if (warning.code == "UNRESOLVED_IMPORT") {
                        this.handleNodeModule(warning.source)
                        return;
                    }
                },
            }).then((bundle: rollup.OutputChunk) => {
                const bundleModules = bundle.modules.filter(item => item.id !== config.TS_HELPER_KEY);
                modules.push(
                    ...bundleModules.map(item => {
                        const dependencies = item.dependencies.filter(item => item !== config.TS_HELPER_KEY);
                        const parent = bundleModules.find(module => module.dependencies.includes(item.id));
                        return {
                            id: this.normalizeFile(item.id),
                            dependencies: dependencies.map(item => this.normalizeFile(item)),
                            parent: parent ? parent.id : input,
                            type: this.getModuleType(item.id, input)
                        }
                    }).reverse()
                );
            })
        }));

        const styles = modules.filter(item => config.STYLE_MODULE_EXTNAMES.includes(path.extname(item.id)))
        const getStyleDeps = (parent: string, node: DepNode) => {
            const deps = [];
            const children = Object.keys(node);
            if (children.length > 0) {
                children.forEach(child => {
                    deps.push({
                        id: this.normalizeFile(child),
                        parent: this.normalizeFile(parent)
                    })
                    if (Object.keys(node[child]).length > 0) {
                        deps.push(...getStyleDeps(child, node[child]))
                    }
                })
            }
            return deps;
        };

        styles.forEach(item => {
            const type = path.extname(item.id) === '.less' ? 'less' : 'sass';
            const tree = dependencyTree({
                filename: item.id,
                directory: this.root
            }, { type });

            modules.push(...getStyleDeps(item.id, tree[item.id] || tree[path.normalize(item.id)]).map(item => {
                return {
                    ...item,
                    type: config.FileModuleType.STYLESHEET,
                    dependencies: []
                }
            }))
        });

        return Array.from(new Set(modules));
    }

    handleNodeModule(source: string) {
        if (!/^\./.test(source) && !this.bundledDependencies.includes(source)) {
            this.bundleNodeModule(source);
            this.bundledDependencies.push(source)
        }
    }

    @logger('打包第三方模块')
    async bundleNodeModule(source: string) {
        const file = path.join(this.root, `/node_modules/${source}/package.json`);
        const pkg = await fs.readJSON(file);
        const res = await rollup.rollup({
            input: path.join(path.dirname(file), pkg.main),
            onwarn: () => { }
        });
        res.write({
            file: path.join(this.dist, `/${this.compileOptions.vendors}/${source}/index.js`),
            format: "cjs"
        });
    }

    @logger('打包tslib')
    async packTslib() {
        await fs.copy(path.join(__dirname, "../assets/tslib.es6.js"), path.join(this.dist, `/${this.compileOptions.vendors}/tslib/index.js`))
    }

    private getModuleType(file: string, base: string) {
        if (file == this.appFile) {
            return config.FileModuleType.APP;
        }
        if (file == base) {
            return config.FileModuleType.PAGE;
        }
        const extname = path.extname(file);
        if (config.COMPONENT_ENTRY_EXTNAMES.includes(extname)) {
            return config.FileModuleType.COMPONENT;
        } else if (config.STYLE_MODULE_EXTNAMES.includes(extname)) {
            return config.FileModuleType.STYLESHEET;
        }
        return config.FileModuleType.COMMON_MODULE;
    }

    private getAppConfig(): { pages: string[] } {
        const project = new Project();
        const sourceFile = project.addExistingSourceFile(this.appFile);
        const classDeclaration = sourceFile.getClasses()[0];
        const decorators = classDeclaration.getDecorators();
        const config = decorators.find(item => item.getName() == "AppConfig").getArguments()[0];
        return vm.runInThisContext(`config = ${config.getText()}`);
    }

    private normalizeFile(file: string) {
        return path.normalize(file).replace(/\\/g, '/');
    }

    async getAppFile() {
        return this.resolveFile(`${path.join(this.src, '/app')}`, config.APP_ENTRY_EXTNAMES);
    }

    private async resolveFile(basename: string, extnames: Array<string>) {
        let file;
        for (let ext of config.APP_ENTRY_EXTNAMES) {
            file = `${basename}${ext}`;
            const isExist = await fs.pathExists(file);
            if (isExist) {
                break;
            } else {
                file = null;
            }
        }
        return file;
    }

    private async getPageFiles() {
        const files = [];
        const pages = this.getAppConfig().pages;
        for (let page of pages) {
            const file = await this.resolveFile(path.join(this.src, `/${page}`), config.PAGE_ENTRY_EXTNAMES);
            files.push(file)
        }
        return files;
    }

    private async getFileCode(file: string) {
        return fs.readFile(file, 'utf8');
    }

}
