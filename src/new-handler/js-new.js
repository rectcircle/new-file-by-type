const {
    input,
    inputSmartSrc,
    selectMany
} = require('../input')
const util = require('../util')

const langPack = util.loadLanguagePack('js')

const JS_TYPES = ['None', 'JQuery', 'Node-Module', 'ES6-Module', 'React', 'Vue']

//渲染模板
function renderTemplate(inputs, comments, tempName) {
    const templateName = `js/${tempName}`
    return util.render(templateName, Object.assign({
        comments
    }, inputs))
}

//选择需要引入的内容
function getImportList(projectDir, srcPath) {
    let p
    if(srcPath.indexOf('/')==-1){
        p = util.pathResolve(projectDir, srcPath)
    } else {
        p = util.pathResolve(projectDir, srcPath.substr(0, srcPath.indexOf('/')))
    }
    let reg = new RegExp(/\.js$/i)

    let items = util.traverseDir(p, (subPath, isFile) => {
        return isFile && reg.test(subPath)
    }, p)

    return items.map(v=>{
        let rp = util.pathRelative(util.pathResolve(projectDir, srcPath), v)
        if(!rp.startsWith('.')){
            rp = './'+rp
        }
        return rp.substr(0, rp.length-3)
    })
}

async function inputFileInfo({ //工作空间
        srcDirPath, //用户选择的绝对路径
        subType, //用户输入的子类型
    }, comments, //注释相关的信息
    { //配置
        indent //缩进字符串
    }) {
    if (JS_TYPES[0] == subType || JS_TYPES[1] == subType) { //None || JQuery

        //输入文件名
        let fileName = await input('main', langPack.inputName)
        if (!fileName) return undefined

        //渲染
        let code = renderTemplate({
            indent,
            fileName,
        }, comments, `JS-${subType}`)
        let targetPath = util.pathResolve(srcDirPath, `${fileName}.js`)
        return {
            targetPath,
            code
        }
        //Node-Module || ES6-Module
        //React || Vue
    } else if (JS_TYPES[2] == subType ||
        JS_TYPES[3] == subType ||
        JS_TYPES[4] == subType ||
        JS_TYPES[5] == subType) {

        //输入文件名
        let fileName = await input('main', langPack.inputName)
        if (!fileName) return undefined

        //渲染
        let code = renderTemplate({
            indent,
            fileName,
            importInfos:[]
        }, comments, `JS-${subType}`)
        let targetPath = util.pathResolve(srcDirPath, `${fileName}.js`)
        return {
            targetPath,
            code
        }

    }
}

async function handle({ //工作空间
        sourceDirPath, //当前打开的文件所在目录的路径
        projectDir, //项目目录
        subType, //用户输入的子类型
    },
    comments, //注释相关的信息
    { //配置
        indent //缩进字符串
    }
) {

    if (JS_TYPES[0] == subType || JS_TYPES[1] == subType) { //None || JQuery
        //输入源文件路径
        const srcPath = await inputSmartSrc(projectDir, sourceDirPath ,"js")
        if (srcPath == undefined) return undefined

        //输入文件名
        let fileName = await input('main', langPack.inputName)
        if (!fileName) return undefined

        //渲染
        let code = renderTemplate({
                        indent,
                        fileName,
        }, comments, `JS-${subType}`)
        let targetPath = util.pathResolve(projectDir, srcPath, `${fileName}.js`)
        return {
            targetPath,
            code
        }
    //Node-Module || ES6-Module
    //React || Vue
    } else if (JS_TYPES[2] == subType ||
        JS_TYPES[3] == subType || 
        JS_TYPES[4] == subType ||
        JS_TYPES[5] == subType) { 
        //输入源文件路径
        const srcPath = await inputSmartSrc(projectDir, sourceDirPath, "src")
        if (srcPath == undefined) return undefined

        //输入文件名
        let fileName = await input('main', langPack.inputName)
        if (!fileName) return undefined

        //获取引入信息
        let importList = await selectMany(
            getImportList(projectDir, srcPath),
            langPack.inputImportList)
        let importInfos = importList.map(v=>{
            return [util.pathBasename(v), v]
        })

        //渲染
        let code = renderTemplate({
            indent,
            fileName,
            importInfos
        }, comments, `JS-${subType}`)
        let targetPath = util.pathResolve(projectDir, srcPath, `${fileName}.js`)
        return {
            targetPath,
            code
        }
    
    }
}

module.exports = {
    key: "JavaScript",
    suffix: ['js'],
    subTypes: JS_TYPES,
    handle: handle,
    inputFileInfo
}




