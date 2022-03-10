/// <reference types="cordova-plugin-file" />
export interface LocalAppParams {
    currentVersion: string;
    currentBuildNumber: number;
    versionFileUrl: string;
    debug?: boolean;
}
export interface OnlineVersion {
    version: string;
    buildNumber: number;
    url: string;
}
declare global {
    interface Window {
        LocalApp: LocalApp;
    }
}
export declare class LocalApp {
    private params;
    private currentLocalVersion;
    private currentLocalBuildNumber;
    constructor(params: LocalAppParams);
    init(): Promise<void>;
    checkNewVersionExists(): Promise<boolean>;
    installVersion(version: OnlineVersion, replace: boolean): Promise<void>;
    copyFileFromWeb(from: string, to: string): Promise<void>;
    getFile(path: string): Promise<Blob>;
    runVersion(version: string): Promise<void>;
    saveFile(filePath: string, fileContent: any): Promise<null>;
    createDirectory(dirEntry: string): Promise<null>;
    writeFile(fileEntry: FileEntry, data: any): Promise<null>;
    readFile(filePath: string): Promise<any>;
    getURI(filePath: string): Promise<string>;
    extractZip(zipFile: string, destFolder: string): Promise<any>;
    listDir(path: string): Promise<Entry[]>;
    removeDirectory(path: string): Promise<void>;
    log(...args: any[]): void;
    debug(...args: any[]): void;
    error(...args: any[]): void;
}
//# sourceMappingURL=index.d.ts.map