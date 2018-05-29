const vscode = require('vscode');
const util = require('../util')
const os = require('os')
const fs = require('fs-extra');
const moment = require('moment')
const sprintf = require('sprintf-js').sprintf;
const snippetHandler = require('../snippet-handler')
const snippetTemplate = require('../snippet-template')

//加载配置
const configuration = {
    //获取配置：使用tab还是空格？
    defaultIndent: vscode.workspace.getConfiguration("new-file-by-type.template").get("defaultIndent"),
    indents: vscode.workspace.getConfiguration("new-file-by-type.template").get("indents"),
    snippets: vscode.workspace.getConfiguration("new-file-by-type").get("snippets")
}
configuration.snippets.push(...snippetTemplate)


//TODO:添加JS,HTML,CSS;C/C++;GO;Python;Shell;Go;Scala;XML;JSON;
//TODO:C, C++, Java, JavaScript, PHP, Python, Perl, Perl 6, Ruby, Go, Lua, Groovy, PowerShell, BAT / CMD, BASH / SH, F# Script, F#(.NET Core), C# Script, C#(.NET Core), VBScript, TypeScript, CoffeeScript, Scala, Swift, Julia, Crystal, OCaml Script, R, AppleScript, Elixir, Visual Basic.NET, Clojure, Haxe, Objective - C, Rust, Racket, AutoHotkey, AutoIt, Kotlin, Dart, Free Pascal, Haskell, Nim, D

//自动扫描目录，并载入相关模块
const handlers = util.loadNewHandler()
//获取语言包
const langPack = util.loadLanguagePack('basic')

async function inputProjectType(handleKeys) {
    return await vscode.window.showQuickPick( //选择类型
        handleKeys, {
            placeHolder: langPack.inputType,
            ignoreFocusOut:true
        }
    )
}

//选择项目目录
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

async function getUserInput(sourceInfo, comments, configuration) {
    const {
        sourceDirPath, //当前打开的文件所在目录的路径
        sourceFileSuffix, //当前打开文件的后缀
    } = sourceInfo

    //整理Snippets配置
    const snippets = {};
    for (let snippet of configuration.snippets){
        let category = snippet.category
        if (!category) {
            category = "Snippet"
        } 
        if (!snippets[category]) {
            snippets[category] = [snippet];
        } else {
            snippets[category].push(snippet)
        }
    }
    //将Snippets 的 category 加入处理器
    const handleKeysSet = new Set([...Object.keys(handlers), ...Object.keys(snippets)])

    const handleKeys = [...handleKeysSet]
    handleKeys.sort();

    //将匹配的类型放在首位
    if (sourceFileSuffix) {
        util.swapWithFirst(handleKeys, v => sourceFileSuffix.toUpperCase() == v.toUpperCase())
    }

    //input:获取用户选择的项目类型
    const projectType = await inputProjectType(handleKeys)
    if(!projectType) return undefined

    let handler = handlers[projectType]
    if (!handler){
        handler = snippetHandler
    }

    //缩进类型处理
    const {defaultIndent, indents} = configuration;
    let insertSpace = defaultIndent;
    for (let key in indents) {
        if (key.toUpperCase() == projectType.toUpperCase() && typeof (indents[key]) == "number") {
            insertSpace = indents[key]
        }
    }
    let indent;
    if(insertSpace <= 0){
        indent = '\t'
    } else {
        indent = Array(insertSpace).fill(' ').join('')
    }
    
    //input:用户选择用户子类型
    const subTypes = [...handler.subTypes];
    if (snippets[projectType]){
        subTypes.push(...snippets[projectType].map(v=>v.name))
    }
    const subType = await vscode.window.showQuickPick(
        subTypes, {
            ignoreFocusOut:true,
            placeHolder: sprintf(langPack.inputSubtype, projectType)
        }
    )
    if (!subType) return undefined

    const snippet = snippets[projectType].find(s => s.name == subType)
    if (snippet) { //用户选择的是snippets类型
        handler = snippetHandler
    }
    
    //获取用户选择的项目目录
    const projectDir = await inputProjectDir(sourceInfo)
    if(!projectDir) return undefined

    //调用类型处理函数
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
    //获取用户代码注释的配置
    const commentsConfig = vscode.workspace.getConfiguration("new-file-by-type.code-comments");
    //注释相关配置
    const comments = {
        enable: commentsConfig.get("enable"),
        author: commentsConfig.get("author"),
        date:undefined,
        dateFarmat: commentsConfig.get("date-farmat"),
        version: commentsConfig.get("version"),
        items: commentsConfig.get("items"),
    }
    if (comments.author==null){
        comments.author = os.userInfo().username
    }
    comments.date = moment().format(comments.dateFarmat)

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

    const yesOrNo = ['No', 'Yes'];

    //如果文件已存在
    if(fs.existsSync(targetPath)){
        const yn = await vscode.window.showQuickPick(yesOrNo,{
            ignoreFocusOut:true,
            placeHolder: langPack.coverTip
        })

        if (!yn || yn == yesOrNo[0]) { //退出，或者选择No，不覆盖
            return 
        }
    }

    //创建文件
    util.createFile(targetPath, code);
    //打开文件
    const textDocument = await vscode.workspace.openTextDocument(targetPath)
    await vscode.window.showTextDocument(textDocument, vscode.ViewColumn.Active)

    //Snippet需要特殊处理
    if (snippet) {
        // 删除原有内容
        const activeEditor = vscode.window.activeTextEditor;
        await activeEditor.edit(editBuilder => {
            editBuilder.delete(new vscode.Range(textDocument.lineAt(0).range.start, textDocument.lineAt(textDocument.lineCount-1).range.end))
        })
        // 向编辑器中添加一个Snippet
        activeEditor.insertSnippet(new vscode.SnippetString(snippet.body.join("\n")))
    }

}

exports.disposable = vscode.commands.registerCommand('new-file-by-type.new', function () {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    // vscode.window.showInformationMessage('Hello World!');
    handle()
});
