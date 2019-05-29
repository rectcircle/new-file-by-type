import * as fs from "fs";
import * as util from "util";
import * as path from "path";

export default {
	...fs,
	readFileAsync: util.promisify(fs.readFile),
	existsAsync: util.promisify(fs.exists),
	statAsync: util.promisify(fs.stat),
	readdirAsync: util.promisify(fs.readdir),
	writeFileAsync: util.promisify(fs.writeFile),
	mkdirAsync: util.promisify(fs.mkdir),
	unlinkAsync: util.promisify(fs.unlink),
	rmdirAsync: util.promisify(fs.rmdir),
	async rmdirRecursiveAsync(dirpath: string) {
		if (await this.existsAsync(dirpath)) {
			for (let subName of await this.readdirAsync(dirpath)) {
				let curPath = path.resolve(dirpath, subName);
				if ((await this.statAsync(curPath)).isDirectory()) {
					await this.rmdirRecursiveAsync(curPath); //递归删除文件夹
				} else {
					await this.unlinkAsync(curPath); //删除文件
				}
			}
			await this.rmdirAsync(dirpath);
		}
	},
	async mkdirRecursiveAsync(dirpath: string) {
		if (await this.existsAsync(dirpath)) {
			if (await this.statSync(dirpath).isDirectory()) {
				return;
			} else {
				throw new Error(`${dirpath} is not a directory`);
			}
		}
		await this.mkdirRecursiveAsync(path.dirname(dirpath));
		await this.mkdirAsync(dirpath);
	},
	async createOrClearFileAsync(filepath: string) {
		if (await this.existsAsync(filepath)) {
			if (!(await this.statAsync(filepath)).isFile()) {
				throw new Error(`path exists and not is a file: ${filepath}`);
			}
		} else {
			const dirpath = path.dirname(filepath);
			if (! await fs.existsSync(dirpath)) {
				await this.mkdirRecursiveAsync(dirpath);
			}
		}
		await this.writeFileAsync(filepath, '');
	},
	async copyAsync(src: string, dist: string) {
		const readStream = fs.createReadStream(src);
		readStream.pipe(fs.createWriteStream(dist));
		return new Promise((resolve => {
			readStream.on('end', () => {
				resolve();
			});
		}));
	},
	existsAndIsDirectorySync(path :string) {
		return this.existsSync(path) && this.statSync(path).isDirectory();
	},
	async existsAndIsDirectoryAsync (path: string) {
		return (await this.existsAsync(path)) && (await this.statAsync(path)).isDirectory();
	},
	existsAndIsFileSync(path: string) {
		return this.existsSync(path) && this.statSync(path).isFile();
	},
	async existsAndIsFileAsync(path: string) {
		return (await this.existsAsync(path)) && (await this.statAsync(path)).isFile();
	},
};