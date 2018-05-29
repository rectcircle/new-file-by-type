const vscode = require('vscode');
const util = require('../util')
const os = require('os')
const path = require('path')
const fs = require('fs-extra');
const sprintf = require('sprintf-js').sprintf;

const langPack = util.loadLanguagePack('Java')

function getRelativeSrcPath(projectDir, sourceDirPath){
    const srcPaths = ["src/main/java", "src/test/java", "src"]
    //用户选择的项目目录为：正在编辑的文件所在目录
    if (sourceDirPath && sourceDirPath.startsWith(projectDir)) { 
        for (let i = 0; i < srcPaths.length; i++) {
            if (sourceDirPath.match(srcPaths[i]) != null) {
                return srcPaths[i];
            }
        }
    } else { //else 探测文件系统
        for (let i = 0; i < srcPaths.length; i++) {
            let p = path.resolve(projectDir, srcPaths[i])
            if (fs.existsSync(p)) {
                return srcPaths[i];
            }
        }
    }
    return undefined
}

function getPackageName(projectDir, sourceDirPath) {
    const relativeSrcPath = getRelativeSrcPath(projectDir, sourceDirPath)

    if (sourceDirPath && sourceDirPath.startsWith(projectDir) && sourceDirPath.length != projectDir.length) {
        return sourceDirPath
            .substr(path.resolve(projectDir, relativeSrcPath).length + 1)
            .replace(/[\\|\/]/g, ".")
    } else {
        return undefined
    }
}
//.relativeSrcPath, inputs.package, inputs.t
function createTargetPath(projectDir, {
    relativeSrcPath,
    packageName,
    name,
    javaType
}) {
    if (javaType == "Package"){
        name = "package-info"
    }
    let targetPath = path.resolve(projectDir, relativeSrcPath);
    if (packageName) {
        targetPath = path.resolve(targetPath, packageName.replace(/\./g, "/"));
    }
    targetPath = path.resolve(targetPath, name + ".java");
    return targetPath;
}

function validatePackage(value) {
    if (value == "" ||
        new RegExp(/^[a-zA-Z][a-zA-Z_\.]*[a-zA-Z]$/).test(value) ||
        new RegExp(/^[a-zA-Z]+$/).test(value)) {
        return undefined
    } else {
        return langPack.validatePackage
    }
}

//渲染模板
function renderTemplate(inputs, comments) {

    const templateName = `Java/${inputs.javaType}`
    
    return util.render(templateName, Object.assign({comments}, inputs))
}

const JAVA_TYPES = ["Class", "Interface", "Enum", "Annotation", "JUnitTestCase", "Package"];


/**
 * 需要返回创建文件的相对与项目目录的路径和处理好的模板代码
 * 返回对象为：{targetPath, code}
 */
 async function handle ({ //工作空间
            sourceDirPath, //当前打开的文件所在目录的路径
            projectDir, //项目目录
            subType, //用户输入的子类型
        }, comments, //注释相关的信息
        { //配置
            indent //缩进字符串
        }) { 
    const inputs = {
        javaType: subType, //"Class",
        name: "ClassName", //类型为Package-Info则不存在
        projectDir, //项目目录
        relativeSrcPath: getRelativeSrcPath(projectDir, sourceDirPath), //源代码目录（相对于项目目录）
        packageName: getPackageName(projectDir, sourceDirPath), //包名
        indent: indent
    };

    // 输入源代码路径（相对于项目目录）
    inputs.relativeSrcPath = await vscode.window.showInputBox({
        value: inputs.relativeSrcPath ? inputs.relativeSrcPath:"src/main/java",
        ignoreFocusOut:true,
        placeHolder: langPack.inputSrcDir,
        prompt: langPack.inputSrcDirPrompt,
        validateInput:v => {
            if(v.startsWith('/')){
                return langPack.needRelativePath;
            }
            return undefined
        }
    })
    if (inputs.relativeSrcPath==undefined) return undefined

    //输入包名
    inputs.packageName = await vscode.window.showInputBox({
        placeHolder: langPack.inputPackageName,
        prompt: langPack.inputPackageName,
        validateInput: validatePackage,
        ignoreFocusOut:true, //失去焦点不关闭
        value: inputs.packageName ? inputs.packageName : "com." + os.userInfo().username

    })
    if(inputs.packageName==undefined) return undefined

    //如果是Package类型，直接生成代码
    if (inputs.javaType == "Package") {
        return {
            targetPath: createTargetPath(projectDir, inputs),
            code: renderTemplate(inputs, comments)
        }
    }

    //输入类型名（"Class", "Interface", "Enum", "Annotation", "JUnitTestCase"）
    inputs.name = await vscode.window.showInputBox({
        placeHolder: sprintf(langPack.inputTpyeName, inputs.javaType),
        prompt: sprintf(langPack.inputTpyeName, inputs.javaType),
        value: `${inputs.javaType}Name`,
        ignoreFocusOut: true, //失去焦点不关闭
    })
    if (!inputs.name) return undefined

    return {
        targetPath: createTargetPath(projectDir, inputs),
        code:renderTemplate(inputs,comments)
    }
}

module.exports ={
    key:"Java",
    subTypes:JAVA_TYPES,
    handle:handle
}