export const APP_ENTRY_EXTNAMES = [".ts", ".js", ".tsx", ".jsx"];

export const PAGE_ENTRY_EXTNAMES = [".tsx", ".jsx"];

export const COMPONENT_ENTRY_EXTNAMES = [".tsx", ".jsx"];

export const MODULE_ENTRY_EXTNAMES = [".ts", ".js"];

export const STYLE_MODULE_EXTNAMES = [".wxss", ".css", ".scss", ".less"];

export const TS_HELPER_KEY = `\0typescript-helpers`;

export const enum FileModuleType {
    APP,
    PAGE,
    COMPONENT,
    COMMON_MODULE,
    STYLESHEET
}

export interface IFileModule {
    id: string;
    dependencies: Array<string>;
    parent: string;
    type: FileModuleType
}

export interface CompileOptions {
    src: string;
    dist: string;
    vendors?: string;
    root?: string;
}