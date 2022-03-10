var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { gt } from 'semver';
export class LocalApp {
    constructor(params) {
        this.params = params;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const localVersion = JSON.parse(yield this.readFile('local_version.json'));
                if (localVersion) {
                    this.currentLocalVersion = localVersion.version || null;
                    this.currentLocalBuildNumber = localVersion.build || null;
                }
            }
            catch (e) { }
        });
    }
    checkNewVersionExists() {
        return __awaiter(this, void 0, void 0, function* () {
            let localVersion, localBuildNumber, isLocalInstaled;
            if (this.currentLocalVersion && gt(this.currentLocalVersion, this.params.currentVersion)) {
                localVersion = this.currentLocalVersion;
                localBuildNumber = this.currentLocalBuildNumber;
                isLocalInstaled = true;
            }
            else {
                localVersion = this.params.currentVersion;
                localBuildNumber = this.params.currentBuildNumber;
                isLocalInstaled = false;
            }
            try {
                const onlineVersionFile = JSON.parse((yield this.getFile(this.params.versionFileUrl)).toString());
                const lastVersion = onlineVersionFile[0];
                if (!lastVersion) {
                    throw new Error('Nenhuma versão existente online!');
                }
                if (gt(lastVersion.version, localVersion)) {
                    yield this.installVersion(lastVersion, false);
                    localVersion = lastVersion.version;
                    isLocalInstaled = true;
                }
                else if (gt(lastVersion.version, localVersion) && lastVersion.build > localBuildNumber) {
                    yield this.installVersion(lastVersion, true);
                    localVersion = lastVersion.version;
                    isLocalInstaled = true;
                }
            }
            catch (e) {
                console.error('Erro ao identificar a versão online, continuando usando a versão mais atual instalada.');
                console.error(e);
            }
            if (isLocalInstaled) {
                this.runVersion(localVersion);
                return true;
            }
            return false;
        });
    }
    installVersion(version, replace) {
        return __awaiter(this, void 0, void 0, function* () {
            if (replace) {
                yield this.removeDirectory(version.version);
            }
            yield this.createDirectory(version.version);
            yield this.copyFileFromWeb(version.url, `./temp.zip`);
            yield this.extractZip('temp.zip', version.version);
            yield this.saveFile('local_version.json', JSON.stringify(version));
        });
    }
    copyFileFromWeb(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Iniciando copia de ${from} para ${to}`);
            const file = yield this.getFile(from);
            yield this.saveFile(to, file);
        });
    }
    getFile(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(path);
            if (response.ok) {
                const blob = yield response.blob();
                return blob;
            }
            else {
                throw new Error(response.statusText);
            }
        });
    }
    runVersion(version) {
        return __awaiter(this, void 0, void 0, function* () {
            window.LocalApp.navigateToUrl(yield this.getURI(`${version}/index.html`));
        });
    }
    saveFile(filePath, fileContent) {
        return new Promise((resolve, reject) => {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, (fs) => {
                fs.root.getFile(filePath, { create: true, exclusive: false }, (fileEntry) => __awaiter(this, void 0, void 0, function* () {
                    yield this.writeFile(fileEntry, fileContent);
                    resolve(null);
                }), (err) => {
                    reject(err);
                });
            }, (err) => {
                reject(err);
            });
        });
    }
    createDirectory(dirEntry) {
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
    writeFile(fileEntry, data) {
        return new Promise((resolve, reject) => {
            fileEntry.createWriter(function (fileWriter) {
                fileWriter.onwriteend = function () {
                    resolve(null);
                };
                fileWriter.onerror = function (e) {
                    reject(e);
                };
                fileWriter.write(data);
            });
        });
    }
    readFile(filePath) {
        return new Promise((resolve, reject) => {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
                fs.root.getFile(filePath, { create: false, exclusive: false }, function (fileEntry) {
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
    getURI(filePath) {
        return new Promise((resolve, reject) => {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
                fs.root.getFile(filePath, { create: false, exclusive: false }, function (fileEntry) {
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
    extractZip(zipFile, destFolder) {
        return new Promise((resolve, reject) => {
            var sourcePath = cordova.file.dataDirectory + 'files/' + zipFile;
            var destPath = cordova.file.dataDirectory + 'files/' + destFolder;
            this.debug(`extraindo arquivo ${sourcePath} no diretorio ${destPath}`);
            window.JJzip.unzip(sourcePath, { target: destPath }, function (data) {
                resolve(data);
            }, function (error) {
                reject(error);
            });
        });
    }
    listDir(path) {
        return new Promise((resolve, reject) => {
            var sourcePath = cordova.file.dataDirectory + 'files/' + path;
            this.debug(`listando diretorio ${sourcePath}`);
            window.resolveLocalFileSystemURL(sourcePath, (fileSystem) => {
                var reader = fileSystem.createReader();
                reader.readEntries((entries) => { resolve(entries); }, (err) => { reject(err); });
            }, (err) => { reject(err); });
        });
    }
    removeDirectory(path) {
        return new Promise((resolve, reject) => {
            var sourcePath = cordova.file.dataDirectory + 'files/' + path;
            this.debug(`removendo diretorio ${sourcePath}`);
            window.resolveLocalFileSystemURL(sourcePath, (fileSystem) => {
                fileSystem.removeRecursively(() => resolve(), (err) => reject(err));
            }, (err) => { reject(err); });
        });
    }
    log(...args) {
        console.log(args);
    }
    debug(...args) {
        if (this.params.debug) {
            console.debug(args);
        }
    }
    error(...args) {
        console.error(args);
    }
}
