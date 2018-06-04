const vscode = require('vscode')
const path = require('path')
const fs = require('fs-extra')
const template = require('art-template')
const sprintf = require('sprintf-js').sprintf

/**
 * 根据文件名返回正在编辑文件的后缀
 */
function getSourceFileSuffix(filePath) {
    if(!filePath) return undefined
    const extname = path.extname(filePath)
    if(extname == ""){
        return undefined
    }
    return extname.substring(1)
}

/**
 * 获取正在编辑的源文件与工作空间的信息
 */
function sourceInfo(){
    const activeEditor = vscode.window.activeTextEditor;
    const document = activeEditor && activeEditor.document;
    const sourceFilePath = document && document.fileName;
    const sourceDirPath = sourceFilePath && path.dirname(sourceFilePath)
    const sourceFileSuffix = getSourceFileSuffix(sourceFilePath);
    let workspaceDirs = undefined;
    if (vscode.workspace.workspaceFolders) {
        workspaceDirs = vscode.workspace.workspaceFolders.map(wf => wf.uri.fsPath)
    }


    return {sourceFilePath, sourceDirPath, sourceFileSuffix,workspaceDirs}
}

/**
 * 将将匹配的元素与数组的第一项交换
 * @param {Array} arr 需要处理的数组
 * @param {Function} cb function(value):boolean 匹配元素
 */
function swapWithFirst(arr, cb) {
    for(let i=0; i<arr.length; i++){
        if(cb(arr[i])){
            [arr[0], arr[i]] = [arr[i], arr[0]]
            break;
        }
    }
}

function insertToFirst(arr, cb) {
    for (let i = 0; i < arr.length; i++) {
        if (cb(arr[i])) {
            let tmp = arr[i];
            for(let j=i-1; j>=0; j--){
                arr[j+1] = arr[j];
            }
            arr[0] = tmp;
        }
    }
}


function render(templateName, inputs) {
    var view = require(`./template/${templateName}.art`);
    let code = view(inputs)
    // const ret = template(path.join(__dirname, './template/Java/Class.art')
    //     , inputs)
    return code;
}

/**
 * 创建文件，当文件存在时，覆盖
 * @param {string} path 文件绝对路径
 * @param {string} code 要想文件中写入的内容，为undefined时，创建空文件或者不处理
 */
function createFile(path, code) {
    if(code){ //存在
        fs.removeSync(path) //若存在删除文件
        fs.createFileSync(path); //创建文件
        fs.appendFileSync(path, code); //向文件中写入内容
    } else {
        fs.ensureFile(path)
    }
}


function createDir(path) {
    fs.ensureDirSync(path)
}

function loadNewHandler(){
    const handlers = {}
    const dir = fs.readdirSync(path.join(__dirname,'./new-handler'))
    for(let fileName of dir){
        const handler = require(path.join(__dirname, `./new-handler/${fileName}`))
        handlers[handler.key] =handler
    }
    return handlers
}

function loadLanguagePack(name) {
    const la = vscode.env.language
    let locale = 'en'
    if(la.toUpperCase()=='ZH-CN'){
        locale = 'zh-cn'
    }
    return require(path.join(__dirname, `./i18n/${locale}/${name}.js`))
}

function traverseDir(p, cb, relativeDir = "") {
    if(!fs.existsSync(p)) return []

    let pa = fs.readdirSync(p);
    let items = []
    for (let ele of pa) {
        let subPath = path.resolve(p, ele)
        let subRelativeDir
        if (relativeDir == "") {
            subRelativeDir = ele
        } else {
            subRelativeDir = `${relativeDir}/${ele}`
        }
        if (fs.statSync(subPath).isFile()) {
            if (cb(subRelativeDir)) {
                items.push(subRelativeDir)
            }
        } else {
            items.push(...traverseDir(subPath, cb, subRelativeDir));
        }
    }
    return items
}

module.exports = {
    swapWithFirst,
    insertToFirst,
    sourceInfo,
    render,
    createFile,
    createDir,
    loadLanguagePack,
    loadNewHandler,
    sprintf,
    pathResolve:path.resolve,
    traverseDir
}
