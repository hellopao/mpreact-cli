import * as path from "path";
import * as vm from "vm";
import * as glob from "fast-glob";
import * as fs from "fs-extra";
import Project from "ts-simple-ast";
import { cruise } from "dependency-cruiser";

import { logger } from "./utils/decorators";
import ScriptModule from "./transform/script";
import StyleModule from "./transform/style";

import * as config from "./config";

export default class Compiler {

    compileOptions: config.CompileOptions;

    appFile: string;

    pageFiles: string[];

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
        const modulesTree = {}, prevModulesTree = {};
        fileModules.forEach(item => {
            modulesTree[item.id] = item;
        });
        this.fileModules.forEach(item => {
            prevModulesTree[item.id] = item;
        });
        let fileModule = fileModules.find(item => this.normalizeFile(item.id) === this.normalizeFile(file));
        // 变动的是小程序模块文件
        if (fileModule) {
            function getParents(item) {
                const parents = [];
                if (item.parents.length > 0) {
                    item.parents.forEach(parent => {
                        if (parent !== fileModule.id) {
                            parents.push(...getParents(modulesTree[parent]))
                        }
                    })
                } else {
                    if (!parents.includes(item.id)) {
                        parents.push(item);
                    }
                }
                return parents;
            }

            const modules = [];

            if (config.STYLE_MODULE_EXTNAMES.includes(path.extname(fileModule.id))) {
                // 引用变动模块的模块
                modules.push(...getParents(fileModule));
            }

            // 变动模块引用的模块
            fileModules.forEach(item => {
                if (item.parents.includes(fileModule.id) && config.STYLE_MODULE_EXTNAMES.includes(path.extname(item.id))) {
                    modules.push(item);
                }
            });

            return this.transformModules(modules.concat(fileModule));
        } else {
            return this.bundleAssets();
        }
    }

    @logger('编译项目')
    private async transform() {
        await this.transformModules(this.fileModules);
        return Promise.all([
            this.packTslib(),
            this.bundleAssets()
        ])
    }

    private async transformModules(modules: config.IFileModule[]) {
        // return Promise.all(
        //     modules.map((fileModule: config.IFileModule) => {
        //         let moduleTransformer: ScriptModule | StyleModule;
        //         if (fileModule.type !== config.FileModuleType.STYLESHEET) {
        //             moduleTransformer = new ScriptModule(fileModule, this.compileOptions);
        //         } else {
        //             moduleTransformer = new StyleModule(fileModule.id, fileModule.parents, this.compileOptions);
        //         }
        //         return moduleTransformer.transform()
        //     })
        // )
        for (let fileModule of modules) {
            let moduleTransformer: ScriptModule | StyleModule;
            if (fileModule.type !== config.FileModuleType.STYLESHEET) {
                moduleTransformer = new ScriptModule(fileModule, this.compileOptions);
            } else {
                moduleTransformer = new StyleModule(fileModule.id, fileModule.parents, this.compileOptions);
            }
            await moduleTransformer.transform()
        }
    }

    @logger("打包其他文件")
    async bundleAssets() {
        const fileModules = this.fileModules.map(item => item.id);
        const files = await glob<string>(`${this.src}/**/*.*`);

        return Promise.all(files.filter(item => {
            return !fileModules.includes(item)
                && path.basename(item) !== "tsconfig.json"
                && !config.STYLE_MODULE_EXTNAMES.includes(path.extname(item))
                && !config.APP_ENTRY_EXTNAMES.includes(path.extname(item));
        }).map(item => {
            return fs.copy(item, path.join(this.dist, path.relative(this.src, item)))
        }))
    }

    @logger("解析项目模块")
    private async getFileModules(): Promise<config.IFileModule[]> {
        this.pageFiles = await this.getPageFiles();

        const { dependencies } = cruise([this.appFile, ...this.pageFiles].map(item => path.relative(this.root, item)), {
            //@ts-ignore
            baseDir: this.root
        })

        const modules = [];

        dependencies.forEach(item => {
            const parents = dependencies.filter(mod => mod.dependencies.map(dep => dep.resolved).includes(item.source));

            if (this.isNpmModule(item.source)) {
                if (parents.every(item => !this.isNpmModule(item.source))) {
                    modules.push({
                        id: item.source,
                        dependencies: item.dependencies,
                        parents: parents || [],
                        type: config.FileModuleType.NPM_MODULE
                    });
                }
                return;
            }
            const input = path.join(this.root, item.source);
            modules.push({
                id: input,
                dependencies: item.dependencies.map(dep => {
                    if (dep.dependencyTypes.includes('npm')) {
                        return dep.resolved;
                    }
                    return path.join(this.root, dep.resolved)
                }),
                parents: parents.length > 0 ? parents.map(item => path.join(this.root, item.source)) : [],
                type: this.getModuleType(input)
            })
        })

        return modules;
    }

    @logger('打包tslib')
    async packTslib() {
        return fs.copy(path.join(__dirname, "../assets/tslib.es6.js"), path.join(this.dist, `/${this.compileOptions.vendors}/tslib/index.js`))
    }

    private getModuleType(file: string) {
        if (file == this.appFile) {
            return config.FileModuleType.APP;
        }
        if (this.pageFiles.includes(file)) {
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

    private isNpmModule(id: string) {
        return id.includes('node_modules') || !/\..*$/.test(id)
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
