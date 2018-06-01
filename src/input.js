const vscode = require('vscode')
const util = require('./util')
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

function selectMany(items, prompt) {
    return vscode.window.showQuickPick(items, {
        ignoreFocusOut: true,
        placeHolder: prompt,
        canPickMany:true
    })
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

module.exports = {
    input,
    inputSrc,
    select,
    selectMany
}
