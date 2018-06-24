const vscode = require('vscode');
const util = require('../util')
const input = require('../input')

//国际化：获取语言包
const langPack = util.loadLanguagePack('basic')

//TODO:添加GO;Python;Shell;Go;Scala;XML;JSON;
//TODO:PHP, Python, Perl, Perl 6, Ruby, Go, Lua, Groovy, PowerShell, BAT / CMD, BASH / SH, F# Script, F#(.NET Core), C# Script, C#(.NET Core), VBScript, TypeScript, CoffeeScript, Scala, Swift, Julia, Crystal, OCaml Script, R, AppleScript, Elixir, Visual Basic.NET, Clojure, Haxe, Objective - C, Rust, Racket, AutoHotkey, AutoIt, Kotlin, Dart, Free Pascal, Haskell, Nim, D

//自动扫描目录，并载入相关模块
const handlers = util.loadNewHandler()


/**
 * 选择项目目录
 */
async function inputProjectDir({
    sourceFilePath, //当前打开的文件路径
    workspaceDirs //当前工作空间打开的文件夹
}) {
    if (sourceFilePath) { //有文件在编辑器打开
        util.swapWithFirst(workspaceDirs, v => sourceFilePath.startsWith(v))
    }
    return await vscode.window.showQuickPick(workspaceDirs, {
        ignoreFocusOut: true,
        placeHolder: langPack.inputProjectDir,
    })
}

/**
 * 向工作区添加一个文件夹
 */
async function openProjectDir() {
    const uris = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        openLabel: langPack.mustOpenProjectDir,
        canSelectMany: false
    })
    if(!uris) return
    const projectDir = uris[0].fsPath

    util.createDir(projectDir)
    vscode.workspace.updateWorkspaceFolders(
        vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0,
        null, {
            uri: vscode.Uri.file(projectDir)
        })
    return
}

/**
 * 获取询问用户，并获取用户输入
 */
async function getUserInput(sourceInfo, comments, configuration) {
    const {
        sourceDirPath, //当前打开的文件所在目录的路径
        sourceFileSuffix, //当前打开文件的后缀
    } = sourceInfo

    //获得用户选择的项目类型和子类型
    let projectAndSubType = await input.inputProjectAndSubType(configuration, handlers, sourceDirPath, sourceFileSuffix)

    if (projectAndSubType==undefined)  return undefined

    let {
        handler,
        subType,
        indent,
        snippet
    } = projectAndSubType;

    //获取用户选择的项目目录
    const projectDir = await inputProjectDir(sourceInfo)
    if(!projectDir) return undefined

    //调用处理函数，针对用户选择的类型做处理
    const newFileData = await handler.handle({projectDir, sourceDirPath, subType},comments,{indent, snippet})
    if(!newFileData) return undefined

    return {
        targetPath:newFileData.targetPath,
        code: newFileData.code,
        snippet
    }
}

async function handle(){
    //获取工作空间相关信息
    const sourceInfo = util.sourceInfo();

    //获取配置
    let configuration = util.getConfiguration()
    let comments = configuration.comments

    //如果用户的工作空间没有打开任何项目目录
    if (!sourceInfo.workspaceDirs || sourceInfo.workspaceDirs.length == 0) {
        //打开工作空间
        return openProjectDir()
    }

    //获取用户输入生成的目标路径，代码
    const newFileData = await getUserInput(sourceInfo, comments, configuration)
    if (!newFileData) return

    const {
        targetPath,
        code,
        snippet
    } = newFileData

    await util.generateFiles(targetPath, code, snippet)

}

exports.disposable = vscode.commands.registerCommand('new-file-by-type.new', function () {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    // vscode.window.showInformationMessage('Hello World!');
    handle()
});
