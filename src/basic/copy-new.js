const vscode = require('vscode');
const util = require('../util')
const fs = require('fs-extra');
const path = require('path')
const input = require('../input')

//获取语言包
const langPack = util.loadLanguagePack('basic')



async function handle(filePath){
    let fileBuffer = fs.readFileSync(filePath)
    let newFilePath = await vscode.window.showInputBox({
        prompt: langPack.inputNewFilePath,
        ignoreFocusOut:true,
        placeHolder: langPack.inputNewFilePath,
        value: filePath + ".bak",
        valueSelection: [filePath.length, filePath.length + ".bak".length],
        validateInput: v => {
            if(!path.isAbsolute(v)){
                return langPack.needAbsolutePath;
            }
            return undefined
        }
    })
    if (newFilePath==undefined) return undefined
    util.generateFiles(newFilePath, fileBuffer);
}

exports.disposable = vscode.commands.registerCommand('new-file-by-type.copy-new-file', function (args) {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    if (!args) {
        let fsPath = util.sourceInfo().sourceFilePath
        if(!fsPath){
            vscode.window.showErrorMessage(langPack.needOpenFile);
        } else {
            handle(fsPath)
        }
        return
        
    }
    let fsPath = args.fsPath
    if (!fs.statSync(fsPath).isFile()) {
        vscode.window.showErrorMessage(langPack.cannotDir);
        return 
    }
    handle(fsPath)

});
