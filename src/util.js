const vscode = require('vscode')
const path = require('path')
const fs = require('fs-extra')
const os = require('os')
const template = require('art-template')
const moment = require('moment')
const sprintf = require('sprintf-js').sprintf

//获取语言包
const langPack = loadLanguagePack('basic')

/**
 * 根据文件名返回正在编辑文件的后缀，不包括`.`
 */
function fileSuffix(filePath) {
    if (!filePath) return undefined
    const extname = path.extname(filePath)
    if (extname == "") {
        return undefined
    }
    return extname.substring(1)
}

/**
 * 获取正在编辑的源文件与工作空间的信息
 */
function sourceInfo() {
    const activeEditor = vscode.window.activeTextEditor;
    const document = activeEditor && activeEditor.document;
    const sourceFilePath = document && document.fileName;
    const sourceDirPath = sourceFilePath && path.dirname(sourceFilePath)
    const sourceFileSuffix = fileSuffix(sourceFilePath);
    let workspaceDirs = undefined;
    if (vscode.workspace.workspaceFolders) {
        workspaceDirs = vscode.workspace.workspaceFolders.map(wf => wf.uri.fsPath)
    }


    return {
        sourceFilePath,
        sourceDirPath,
        sourceFileSuffix,
        workspaceDirs
    }
}

/**
 * 将将匹配的元素与数组的第一项交换
 * @param {Array} arr 需要处理的数组
 * @param {Function} cb function(value):boolean 匹配元素
 */
function swapWithFirst(arr, cb) {
    for (let i = 0; i < arr.length; i++) {
        if (cb(arr[i])) {
            [arr[0], arr[i]] = [arr[i], arr[0]]
            break;
        }
    }
}

function insertToFirst(arr, cb) {
    for (let i = 0; i < arr.length; i++) {
        if (cb(arr[i])) {
            let tmp = arr[i];
            for (let j = i - 1; j >= 0; j--) {
                arr[j + 1] = arr[j];
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
    if (code) { //存在
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

function loadNewHandler() {
    const handlers = {}
    const dir = fs.readdirSync(path.join(__dirname, './new-handler'))
    for (let fileName of dir) {
        const handler = require(path.join(__dirname, `./new-handler/${fileName}`))
        handlers[handler.key] = handler
    }
    return handlers
}

function loadLanguagePack(name) {
    const la = vscode.env.language
    let locale = 'en'
    if (la.toUpperCase() == 'ZH-CN') {
        locale = 'zh-cn'
    }
    return require(path.join(__dirname, `./i18n/${locale}/${name}.js`))
}

/**
 * @param p {string} 遍历的根目录
 * @param cb {function(string, boolean):boolean} 判断是否选择该文件，function(subRelativeDir, isFile)
 * @param relativeDir {string} 相对路径
 * @param maxLevel {number} 遍历最大深度
 * @param level {number} 当前遍历的层次
 * 
 */
function traverseDir(p, cb, relativeDir = "", maxLevel = 3, level = 0) {
    if (!fs.existsSync(p)) return []

    if (level > maxLevel) return []

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
        if (cb(subRelativeDir, fs.statSync(subPath).isFile())) {
            items.push(subRelativeDir)
        }
        if (!fs.statSync(subPath).isFile()) {
            items.push(...traverseDir(subPath, cb, subRelativeDir, maxLevel, level + 1));
        }
    }
    return items
}

function getConfiguration() {
    //一些配置
    const snippetTemplate = require('./snippet-template')
    let configuration = {
        defaultIndent: vscode.workspace.getConfiguration("new-file-by-type.template").get("defaultIndent"),
        indents: vscode.workspace.getConfiguration("new-file-by-type.template").get("indents"),
        snippets: undefined,
        comments: undefined
    }
    //整理Snippets配置
    let snippets = [...vscode.workspace.getConfiguration("new-file-by-type").get("snippets")];
    snippets.push(...snippetTemplate)

    for (let i = 0; i < snippets.length; i++) {
        if (!snippets[i].name.includes(' (from Snippet)')){
            snippets[i].name += ' (from Snippet)'
        }
    }
    //整理Snippets配置
    const nowSnippets = {};
    for (let snippet of snippets) {
        let category = snippet.category
        if (!category) {
            category = "Snippet"
        }
        if (!nowSnippets[category]) {
            nowSnippets[category] = [snippet];
        } else {
            nowSnippets[category].push(snippet)
        }
    }
    configuration.snippets = nowSnippets


    //获取用户代码注释的配置
    const commentsConfig = vscode.workspace.getConfiguration("new-file-by-type.code-comments");

    const comments = {
        enable: commentsConfig.get("enable"),
        author: commentsConfig.get("author"),
        date: undefined,
        dateFarmat: commentsConfig.get("date-farmat"),
        version: commentsConfig.get("version"),
        items: commentsConfig.get("items"),
        description: commentsConfig.get("description")
    }

    if (comments.author == null) {
        comments.author = os.userInfo().username
    }
    if (comments.description == null) {
        comments.description = sprintf("Copyright (c) %d, %s. All rights reserved.", new Date().getFullYear(), comments.author)
    }

    comments.date = moment().format(comments.dateFarmat)
    configuration.comments = comments


    return configuration
}


async function generateFiles(targetPath,
    code,
    snippet) {

    async function needCreate(targetPath) {
        const yesOrNo = ['No', 'Yes'];

        //如果文件已存在
        if (fs.existsSync(targetPath)) {
            if(!fs.statSync(targetPath).isFile()){
                vscode.window.showErrorMessage( sprintf(langPack.pathNotFile, targetPath));
                return false;
            }
            const yn = await vscode.window.showQuickPick(yesOrNo, {
                ignoreFocusOut: true,
                placeHolder: sprintf(langPack.coverTip, targetPath)
            })

            if (!yn || yn == yesOrNo[0]) { //退出，或者选择No，不覆盖
                return false
            }
        }
        return true
    }

    function verifyPath(targetPath) {
        if(!path.isAbsolute(targetPath)){
            vscode.window.showErrorMessage(sprintf(langPack.verifyAbsolutePath, targetPath))
            return false;
        }
        return true;
    }

    //是否是数组
    if (targetPath instanceof Array) {
        //创建文件
        let textDocument;
        for (let i = 0; i < targetPath.length; i++) {
            //判断文件路径是否合法
            if (!verifyPath(targetPath[i])){
                continue
            }
            //判断是否需要创建文件
            if (!(await needCreate(targetPath[i]))) {
                continue
            }
            createFile(targetPath[i], code[i]);
            textDocument = await vscode.workspace.openTextDocument(targetPath[i])
        }
        //打开文件
        if (textDocument) {
            await vscode.window.showTextDocument(textDocument, vscode.ViewColumn.Active)
        }
    } else {
        //判断文件路径是否合法
        if (!verifyPath(targetPath)) {
            return
        }
        //判断是否需要创建文件
        if (!(await needCreate(targetPath))) {
            return
        }
        //创建文件
        createFile(targetPath, code);
        //打开文件
        const textDocument = await vscode.workspace.openTextDocument(targetPath)
        await vscode.window.showTextDocument(textDocument, vscode.ViewColumn.Active)

        //Snippet需要特殊处理
        if (snippet) {
            // 删除原有内容
            const activeEditor = vscode.window.activeTextEditor;
            await activeEditor.edit(editBuilder => {
                editBuilder.delete(new vscode.Range(textDocument.lineAt(0).range.start, textDocument.lineAt(textDocument.lineCount - 1).range.end))
            })
            // 向编辑器中添加一个Snippet
            activeEditor.insertSnippet(new vscode.SnippetString(snippet.body.join("\n")))
        }
    }
}

module.exports = {
    fileSuffix,
    swapWithFirst,
    insertToFirst,
    sourceInfo,
    render,
    createFile,
    generateFiles,
    createDir,
    loadLanguagePack,
    loadNewHandler,
    sprintf,
    pathResolve: path.resolve,
    pathRelative: path.relative,
    pathBasename: path.basename,
    traverseDir,
    getConfiguration
}
