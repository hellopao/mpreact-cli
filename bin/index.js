#!/usr/bin/env node

const path = require("path");
const fs = require('fs-extra');
const program = require("commander");
const compile = require("../lib");
const cwd = process.cwd();

program
    .command('build')
    .description('编译项目')
    .option('-s, --src <src>', '源码目录')
    .option('-d, --dist <dist>', '编译文件目录')
    .option('-i, --ignores <ignores>', '需要排除的文件或目录')
    .option('-w, --watch', '监控模式')
    .action((options) => {
        if (!options.src || !options.dist) {
            process.stderr.write('构建失败：源码目录和编译文件目录必须指定\n');
            return;
        }
        if (!fs.pathExistsSync(options.src)) {
            process.stderr.write('构建失败：源码目录必须存在\n');
            return;
        }
        compile.build(options);
    });

program
    .command('init <project>')
    .option("-l, --language <language>", "基础语言，ts or js")
    .description('初始化项目')
    .action((project, options) => {
        compile.init(project, process.cwd(), options.language);
    })
    .on('--help', function () {
        console.log('  Examples:');
        console.log();
        console.log('    $ mpreact-cli init example -l ts');
        console.log();
    });

program.parse(process.argv);
// display help by default
if (!process.argv.slice(2).length) {
    program.outputHelp();
}