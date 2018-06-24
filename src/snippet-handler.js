const {
    inputSrc
} = require('./input')
const vscode = require('vscode');
const util = require('./util')
const path = require('path')

const langPack = util.loadLanguagePack('Snippet')

function createTargetPath(srcDirPath, filename, suffix) {
    if (!suffix || suffix == "") {
        return path.resolve(srcDirPath, filename)
    }
    return path.resolve(srcDirPath, `${filename}.${suffix}`)
}

async function inputFileInfo({ //工作空间
        srcDirPath, //用户选择的绝对路径
        subType, //用户输入的子类型
    }, comments, //注释相关的信息
    { //配置
        indent, //缩进字符串
        snippet
    }) {

    // 输入文件名
    const filename = await vscode.window.showInputBox({
        value: snippet.defaultFilename ? snippet.defaultFilename : "filename",
        ignoreFocusOut: true,
        placeHolder: langPack.inputFilename,
        prompt: langPack.inputFilename,
        validateInput: v => {
            if (v == "") {
                return langPack.notEmptyString;
            } else if (v.startsWith('/')) {
                return langPack.notSlashes
            }
            return undefined
        }
    })
    if (!filename) return undefined

    return {
        targetPath: createTargetPath(srcDirPath, filename, snippet.suffix),
        code: undefined
    }
}

async function handle({ //工作空间
        sourceDirPath, //当前打开的文件所在目录的路径
        projectDir, //项目目录
        subType, //用户输入的子类型
    },
    comments, //注释相关的信息
    { //配置
        indent, //缩进字符串
        snippet
    }
) {
    // 输入源代码路径（相对于项目目录）
    const relativeSrcPath = await vscode.window.showInputBox({
        value: (snippet.defaultSrc ? snippet.defaultSrc : "src"),
        ignoreFocusOut: true,
        placeHolder: langPack.inputSrcDirPrompt,
        prompt: langPack.inputSrcDirPrompt,
        validateInput: v => {
            if (v.startsWith('/')) {
                return langPack.needRelativePath;
            }
            return undefined
        }
    })

    return await inputFileInfo({
            srcDirPath: util.pathResolve(projectDir, relativeSrcPath),
            subType
        },
        comments, {
            indent,
            snippet
        }
    )


}

module.exports = {
    key: "Snippet",
    subTypes:[],
    suffix: [],
    handle: handle,
    inputFileInfo
}