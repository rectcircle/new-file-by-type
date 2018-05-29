const vscode = require('vscode');
const util = require('./util')
const path = require('path')

const langPack = util.loadLanguagePack('Snippet')

function createTargetPath(projectDir, relativeSrcPath, filename, suffix){
    if(!suffix || suffix==""){
        return path.resolve(projectDir, relativeSrcPath, filename)
    }
    return path.resolve(projectDir, relativeSrcPath, `${filename}.${suffix}`)
}

/**
 * 需要返回创建文件的相对与项目目录的路径和处理好的模板代码
 * 返回对象为：{targetPath, code}
 */
async function handle({ //工作空间
        projectDir, //项目目录
    }, comments, //注释相关的信息
    { //配置
        snippet //snippet对象
    }) {

    // 输入源代码路径（相对于项目目录）
    const relativeSrcPath = await vscode.window.showInputBox({
        value: snippet.defaultSrc ? snippet.defaultSrc: "src",
        ignoreFocusOut: true,
        placeHolder: langPack.inputSrcDir,
        prompt: langPack.inputSrcDir,
        validateInput: v => {
            if (v.startsWith('/')) {
                return langPack.needRelativePath;
            }
            return undefined
        }
    })
    if(relativeSrcPath==undefined) return undefined

    // 输入文件名
    const filename = await vscode.window.showInputBox({
        value: snippet.defaultFilename ? snippet.defaultFilename:"filename",
        ignoreFocusOut: true,
        placeHolder: langPack.inputFilename,
        prompt: langPack.inputFilename,
        validateInput: v => {
            if (v=="") {
                return langPack.notEmptyString;
            } else if(v.startsWith('/')){
                return langPack.notSlashes
            }
            return undefined
        }
    })
    if(!filename) return undefined

    return {
        targetPath: createTargetPath(projectDir, relativeSrcPath, filename, snippet.suffix),
        code: undefined
    }
}

module.exports = {
    key: "Snippet",
    subTypes:[],
    handle: handle
}