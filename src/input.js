const vscode = require('vscode')
const util = require('./util')
const path = require('path')
const snippetHandler = require('./snippet-handler')

const langPack = util.loadLanguagePack('basic')

function input(defaultValue, prompt, validateInput) {
    return vscode.window.showInputBox({
        prompt: prompt,
        ignoreFocusOut:true,
        value:defaultValue,
        placeHolder:prompt,
        validateInput: validateInput
    });
}

function select(items, prompt) {
    return vscode.window.showQuickPick(items,{
        ignoreFocusOut:true,
        placeHolder: prompt
    })
}

/**
 * 弹出多选框
 * @param {string[]} items 选项
 * @param {string} prompt 提示信息
 * @returns {Thenable<string[] | undefined>} 
 */
function selectMany(items, prompt) {
    if(!items || items.length==0){
        return Promise.resolve([])
    }
    return vscode.window.showQuickPick(items, {
        ignoreFocusOut: true,
        placeHolder: prompt,
        canPickMany:true
    })
}

/**
 * 
 * 如果sourceDirPath为undefined或者sourceDirPath不是projectDir前缀
 *      搜索projectDir子目录中第一个为src的目录， 搜不到直接使用defaultSrc
 * 否则
 *      直接使用sourceDirPath代表的相对路径
 * 
 * @param {string} projectDir 用户选择的项目目录
 * @param {string} sourceDirPath 用户打开文件的所在目录
 * @param {string} defaultSrc 无法推测将使用这个默认值
 */
function inputSmartSrc(projectDir, sourceDirPath, defaultSrc=undefined) {

    if (sourceDirPath && sourceDirPath.startsWith(projectDir)){
        return inputSrc(path.relative(projectDir, sourceDirPath))
    }
    let suggestPath = util.traverseDir(projectDir, (subPath, isFile) => {
        return (!isFile) && subPath.endsWith("src")
    })
    if (suggestPath.length==0){
        return inputSrc(defaultSrc)
    }
    return inputSrc(suggestPath[0])
}

function inputSrc(defaultSrc) {
    return vscode.window.showInputBox({
        value: defaultSrc,
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
}

function getIndent(indents, needKey) {
    for (let key in indents) {
        if (key.toUpperCase() == needKey.toUpperCase() && typeof (indents[key]) == "number") {
            return indents[key]
        }
    }
    return -1
}

/**
 * 让用户选择选择项目类型和子类型
 * @param {*} configuration 
 * @param {*} handlers 
 * @param {*} sourceDirPath 
 * @param {*} sourceFileSuffix 
 */
async function inputProjectAndSubType(configuration, handlers, sourceDirPath, sourceFileSuffix) {
    const snippets = configuration.snippets

    //将Snippets 的 category 加入处理器
    const handleKeysSet = new Set([...Object.keys(handlers), ...Object.keys(snippets)])

    const handleKeys = [...handleKeysSet]
    handleKeys.sort();

    //将匹配的类型放在首位
    if (sourceFileSuffix) {
        util.insertToFirst(handleKeys, v => {
            if (sourceFileSuffix.toUpperCase() == v.toUpperCase()) {
                return true;
            }
            if (handlers[v]) {
                for (let s of handlers[v].suffix) {
                    if (sourceFileSuffix.toUpperCase() == s.toUpperCase()) {
                        return true;
                    }
                }
            } else if (snippets[v]) {
                for (let s of snippets[v]) {
                    if (sourceFileSuffix.toUpperCase() == s.suffix.toUpperCase()) {
                        return true;
                    }
                }
            }

            return false;
        })
    }

    //input:获取用户选择的项目类型
    const projectType = await select(handleKeys, langPack.inputType)

    if (!projectType) return undefined

    let handler = handlers[projectType]
    if (!handler) {
        handler = snippetHandler
    }

    //缩进类型处理
    const {
        defaultIndent,
        indents
    } = configuration;
    let insertSpace = defaultIndent; //默认空格数目
    let indent; //缩进字符串

    let tmpIndent = getIndent(indents, projectType)
    if (tmpIndent != -1) insertSpace = tmpIndent



    //input:用户选择用户子类型
    const subTypes = [...handler.subTypes];
    if (snippets[projectType]) {
        subTypes.push(...snippets[projectType].map(v => v.name))
    }
    const subType = await vscode.window.showQuickPick(
        subTypes, {
            ignoreFocusOut: true,
            placeHolder: util.sprintf(langPack.inputSubtype, projectType)
        }
    )
    if (!subType) return undefined


    //第二次处理缩进类型
    tmpIndent = getIndent(indents, subType)
    if (tmpIndent != -1) insertSpace = tmpIndent

    //最终生成字符串
    if (insertSpace <= 0) {
        indent = '\t'
    } else {
        indent = Array(insertSpace).fill(' ').join('')
    }

    const snippet = snippets[projectType] && snippets[projectType].find(s => s.name == subType)
    if (snippet) { //用户选择的是snippets类型
        handler = snippetHandler
    }
    return {handler, subType, indent, snippet}
}

module.exports = {
    input,
    inputSrc,
    inputSmartSrc,
    inputProjectAndSubType,
    select,
    selectMany
}
