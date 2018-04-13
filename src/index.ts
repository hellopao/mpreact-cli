import * as fs from "fs-extra";
import * as path from "path";
import * as chokidar from "chokidar";
import chalk from "chalk";

import Compiler from "./build";

export async function build(options: { src: string; dist: string; root?: string; watch?: boolean; ignores?: string[]; watchIgnore?: RegExp }) {
    const cwd = process.cwd();
    let src = path.join(cwd, options.src), dist = path.join(cwd, options.dist);
    if (path.relative(cwd, options.src) == options.src) {
        src = options.src;
    }
    if (path.relative(cwd, options.dist) == options.dist) {
        dist = options.dist;
    }
    const compiler = new Compiler(src, dist, options.root || path.join(src, "../"));

    try {
        await compiler.build();
    } catch (err) {
    }

    if (options.watch) {
        let watched = false;
        chokidar.watch(options.src, { ignored: options.watchIgnore })
            .on('ready', () => {
                console.log(chalk.yellow(`######## 正在监控目录${src} ########\n`));
                watched = true;
            })
            .on('all', (event, file) => {
                if (['change', 'add', 'unlink'].indexOf(event) !== -1 && watched) {
                    console.log(chalk.yellow(`检测到 ${file} ${event}，正在编译相关文件\n`));
                    compiler.rebuild(path.resolve(file).replace(/\\/g, '/'));
                }
            });
    }

}

export async function init(project: string, dist: string, language: string = "ts") {
    try {
        language = language == "js" ? "js" : "ts";
        await fs.copy(path.join(__dirname, `../assets/examples/${language}`), path.join(dist, `/${project}`));
        process.stdout.write(`项目${project}初始化完成`)
    } catch (err) {
        process.stderr.write(`项目${project}初始化失败, ${err.message}`);
    }
}

if (!module.parent) {
    const args = process.argv;
    build({
        src: args[4],
        dist: args[6],
        root: args[8],
        watch: true
    })
}
