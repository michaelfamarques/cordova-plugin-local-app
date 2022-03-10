import { gt } from 'semver';
/// <reference path="../www/index.d.ts" />
/// <reference types="cordova-plugin-file" />
/// <reference types="cordova" />

declare var cordova: Cordova;

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
    interface Window { LocalApp: LocalApp; }
}

export class LocalApp {

    private currentLocalVersion!: string;
    private currentLocalBuildNumber!: number;

    constructor(private params: LocalAppParams) { }

    async init() {
        try {
            const localVersion = JSON.parse(await this.readFile('local_version.json'));
            if (localVersion) {
                this.currentLocalVersion = localVersion.version || null;
                this.currentLocalBuildNumber = localVersion.build || null;
            }
        } catch (e) { }
    }

    async checkNewVersionExists(): Promise<boolean> {
        let localVersion: string, localBuildNumber: number, isLocalInstaled: boolean;
        if (this.currentLocalVersion && gt(this.currentLocalVersion, this.params.currentVersion)) {
            localVersion = this.currentLocalVersion;
            localBuildNumber = this.currentLocalBuildNumber;
            isLocalInstaled = true;
        } else {
            localVersion = this.params.currentVersion;
            localBuildNumber = this.params.currentBuildNumber;
            isLocalInstaled = false;
        }
        try {
            const onlineVersionFile = JSON.parse((await this.getFile(this.params.versionFileUrl)).toString());
            const lastVersion = onlineVersionFile[0];
            if (!lastVersion) {
                throw new Error('Nenhuma versão existente online!');
            }
            if (gt(lastVersion.version, localVersion)) {
                await this.installVersion(lastVersion, false);
                localVersion = lastVersion.version;
                isLocalInstaled = true;
            } else if (gt(lastVersion.version, localVersion) && lastVersion.build > localBuildNumber) {
                await this.installVersion(lastVersion, true);
                localVersion = lastVersion.version;
                isLocalInstaled = true;
            }
        } catch (e) {
            console.error('Erro ao identificar a versão online, continuando usando a versão mais atual instalada.');
            console.error(e);
        }
        if (isLocalInstaled) {
            this.runVersion(localVersion);
            return true;
        }

        return false;
    }

    async installVersion(version: OnlineVersion, replace: boolean) {
        if (replace) {
            await this.removeDirectory(version.version);
        }
        await this.createDirectory(version.version);
        await this.copyFileFromWeb(version.url, `./temp.zip`);
        await this.extractZip('temp.zip', version.version);
        await this.saveFile('local_version.json', JSON.stringify(version));
    }

    async copyFileFromWeb(from: string, to: string): Promise<void> {
        console.log(`Iniciando copia de ${from} para ${to}`);
        const file = await this.getFile(from);
        await this.saveFile(to, file);
    }

    async getFile(path: string): Promise<Blob> {
        const response = await fetch(path);
        if (response.ok) {
            const blob = await response.blob();
            return blob;
        } else {
            throw new Error(response.statusText);
        }
    }

    async runVersion(version: string): Promise<void> {
        (window as any).LocalApp.navigateToUrl(await this.getURI(`${version}/index.html`));
    }

    saveFile(filePath: string, fileContent: any): Promise<null> {
        return new Promise((resolve, reject) => {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, (fs: FileSystem) => {
                ((fs.root as any) as DirectoryEntry).getFile(filePath, { create: true, exclusive: false }, async (fileEntry: FileEntry) => {
                    await this.writeFile(fileEntry, fileContent);
                    resolve(null);
                }, (err) => {
                    reject(err);
                });
            }, (err) => {
                reject(err);
            });
        });
    }

    createDirectory(dirEntry: string): Promise<null> {
        return new Promise((resolve, reject) => {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
                fs.root.getDirectory(dirEntry, { create: true }, () => {
                    resolve(null);
                }, (err) => reject(err));
            }, (err) => {
                reject(err);
            });
        });
    }

    writeFile(fileEntry: FileEntry, data: any): Promise<null> {
        return new Promise((resolve, reject) => {
            fileEntry.createWriter(function (fileWriter) {
                fileWriter.onwriteend = function () {
                    resolve(null);
                };
                fileWriter.onerror = function (e: ProgressEvent<EventTarget>) {
                    reject(e);
                };
                fileWriter.write(data);
            });
        });
    }

    readFile(filePath: string): Promise<any> {
        return new Promise((resolve, reject) => {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
                ((fs.root as any) as DirectoryEntry).getFile(filePath, { create: false, exclusive: false }, function (fileEntry) {
                    fileEntry.file(function (file) {
                        var reader = new FileReader();
                        reader.onloadend = function () {
                            resolve(this.result);
                        };
                        reader.onerror = function (err) {
                            reject(err);
                        };
                        reader.readAsText(file);
                    }, (err) => reject(err));
                }, (err) => {
                    reject(err);
                });
            }, (err) => {
                reject(err);
            });
        });
    }

    getURI(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
                ((fs.root as any) as DirectoryEntry).getFile(filePath, { create: false, exclusive: false }, function (fileEntry) {
                    const uri = fileEntry.toURL();
                    resolve(uri);
                }, (err) => {
                    reject(err);
                });
            }, (err) => {
                reject(err);
            });
        });
    }

    extractZip(zipFile: string, destFolder: string): Promise<any> {
        return new Promise((resolve, reject) => {
            var sourcePath = cordova.file.dataDirectory + 'files/' + zipFile;
            var destPath = cordova.file.dataDirectory + 'files/' + destFolder;
            this.debug(`extraindo arquivo ${sourcePath} no diretorio ${destPath}`);
            (window as any).JJzip.unzip(sourcePath, { target: destPath }, function (data: any) {
                resolve(data);
            }, function (error: Error) {
                reject(error);
            });
        });
    }

    listDir(path: string): Promise<Entry[]> {
        return new Promise((resolve, reject) => {
            var sourcePath = cordova.file.dataDirectory + 'files/' + path;
            this.debug(`listando diretorio ${sourcePath}`);
            window.resolveLocalFileSystemURL(sourcePath, (fileSystem: Entry) => {
                var reader = (fileSystem as DirectoryEntry).createReader();
                reader.readEntries((entries) => { resolve(entries) }, (err) => { reject(err); });
            }, (err) => { reject(err); });
        });
    }

    removeDirectory(path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            var sourcePath = cordova.file.dataDirectory + 'files/' + path;
            this.debug(`removendo diretorio ${sourcePath}`);
            window.resolveLocalFileSystemURL(sourcePath, (fileSystem: Entry) => {
                (fileSystem as DirectoryEntry).removeRecursively(() => resolve(), (err) => reject(err));
            }, (err) => { reject(err); });
        });
    }

    log(...args: any[]) {
        console.log(args);
    }

    debug(...args: any[]) {
        if (this.params.debug) {
            console.debug(args);
        }
    }

    error(...args: any[]) {
        console.error(args);
    }

}