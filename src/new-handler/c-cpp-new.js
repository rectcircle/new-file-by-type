const {input, select, inputSrc} = require('../input')
const util = require('../util')
const langPack = util.loadLanguagePack('c-cpp')

const C_CPP_TYPES = ["Class", "Header&Source", "Header", "Source"]

//渲染模板
function renderTemplate(inputs, comments, tempName) {
    const templateName = `c-cpp/${tempName}`
    return util.render(templateName, Object.assign({
        comments
    }, inputs))
}

async function handle(
    { //工作空间
        sourceDirPath, //当前打开的文件所在目录的路径
        projectDir, //项目目录
        subType, //用户输入的子类型
    }, 
    comments, //注释相关的信息
    { //配置
        indent //缩进字符串
    }
) {
    //输入源文件路径
    const srcPath = await inputSrc()
    if (srcPath==undefined) return undefined

    //输入文件名
    let fileName;
    if (C_CPP_TYPES[0] == subType) {
        fileName = await input('ClassName', util.sprintf(langPack.inputName, langPack.class))
    } else {
        fileName = await input('FileName', util.sprintf(langPack.inputName, langPack.file))
    }
    if(!fileName) return undefined

    //输入文件后缀
    let fileSuffix;
    if (subType == C_CPP_TYPES[1] || subType == C_CPP_TYPES[3]){
        const items = ['C', 'C++']
        fileSuffix = await select(items, langPack.inputSuffix)
        if (fileSuffix==undefined) return

        if (fileSuffix == items[0]){
            fileSuffix = 'c'
        } else if (fileSuffix == items[1]){
            fileSuffix = 'cpp'
        }
    }

    let targetPath=[], code=[];
    const inputs = {fileName, indent};
    if (C_CPP_TYPES[0] == subType){ //Class
        code.push(renderTemplate(inputs, comments, 'ClassHeader'))
        code.push(renderTemplate(inputs, comments, 'ClassSource'))
        targetPath.push(util.pathResolve(projectDir, srcPath, `${fileName}.h`))
        targetPath.push(util.pathResolve(projectDir, srcPath, `${fileName}.cpp`))
    } else if (C_CPP_TYPES[1] == subType) { //Header&Source
        code.push(renderTemplate(inputs, comments, `${fileSuffix}Header`))
        code.push(renderTemplate(inputs, comments, `Source`))
        targetPath.push(util.pathResolve(projectDir, srcPath, `${fileName}.h`))
        targetPath.push(util.pathResolve(projectDir, srcPath, `${fileName}.${fileSuffix}`))
    } else if (C_CPP_TYPES[2] == subType) { //Header
        code.push(renderTemplate(inputs, comments, 'Header'))
        targetPath.push(util.pathResolve(projectDir, srcPath, `${fileName}.h`))
    } else if (C_CPP_TYPES[3] == subType) { //Source
        code.push(renderTemplate(inputs, comments, 'Source'))
        targetPath.push(util.pathResolve(projectDir, srcPath, `${fileName}.${fileSuffix}`))
    }
    return {targetPath, code}

}

module.exports = {
    key: "C/C++",
    subTypes: C_CPP_TYPES,
    handle: handle
}