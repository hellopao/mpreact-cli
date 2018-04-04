import * as fs from "fs-extra";
import * as path from "path";
import * as chokidar from "chokidar";

import Compiler from "./build";

export async function build(options: { src: string; dist: string; watch?: boolean; ignores?: string[]; watchIgnore?: RegExp }) {
    const cwd = process.cwd();
    const compiler = new Compiler(path.join(cwd, options.src), path.join(cwd, options.dist), cwd);

    try {
        await compiler.build();
    } catch (err) {
    }

    if (options.watch) {
        let watched = false;
        chokidar.watch(options.src, { ignored: options.watchIgnore })
            .on('ready', () => {
                process.stdout.write(`正在监控目录${options.src} ^_^\n`);
                watched = true;
            })
            .on('all', (event, file) => {
                if (['change', 'add', 'unlink'].indexOf(event) !== -1 && watched) {
                    process.stdout.write(`检测到${file}变动: ${event}，重新编译\n`);
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

// build({
//     src: "./test/src/component",
//     dist: "./test/dist/component",
//     watch: true
// })
