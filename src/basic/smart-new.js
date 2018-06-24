const vscode = require('vscode');
const util = require('../util')
const path = require('path')
const fs = require('fs-extra');
const input = require('../input')

//获取语言包
const langPack = util.loadLanguagePack('basic')

//自动扫描目录，并载入相关模块
const handlers = util.loadNewHandler()


async function handle(fsPath){
    //找到文件所在目录
    let srcDirPath;
    let suffix; 
    if (fs.statSync(fsPath).isFile()){
        srcDirPath = path.dirname(fsPath)
        suffix = util.fileSuffix(fsPath)
    } else {
        srcDirPath = fsPath
    }

    let configuration = util.getConfiguration()
    let {
        handler,
        subType,
        indent,
        snippet
    } = await input.inputProjectAndSubType(configuration, handlers, srcDirPath, suffix)

    const newFileData = await handler.inputFileInfo({
            srcDirPath,
            subType
        },
        configuration.comments, {
            indent,
            snippet
        })
    if (!newFileData) return

    const {
        targetPath,
        code
    } = newFileData

    util.generateFiles(targetPath, code, snippet)

}

exports.disposable = vscode.commands.registerCommand('new-file-by-type.smart-new-file', function (args) {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    if (!args) {
        let fsPath = util.sourceInfo().sourceFilePath
        if(!fsPath){
            vscode.window.showErrorMessage(langPack.needOpenFileOrPath);
        } else {
            handle(fsPath)
        }
        return 
        
    }
    let fsPath = args.fsPath
    handle(fsPath)

});
