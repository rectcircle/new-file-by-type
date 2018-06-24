const {
    input,
    select
} = require('../input')
const util = require('../util')
const os = require('os')

const langPack = util.loadLanguagePack('file')

const LICENSE_TYPES = [
    'Apache-2.0',
    'BSD-3-Clause',
    'BSD-2-Clause',
    'GPL-2.0',
    'GPL-3.0',
    'LGPL-2.0',
    'LGPL-2.1',
    'LGPL-3.0',
    'MIT',
    'MPL-2.0',
    'CDDL-1.0',
    'EPL-1.0',
    'The Unlicense'
]

// console.log(LICENSE_TYPES.map(v=>'  - [x] '+v).join('\n'))

async function inputFileInfo({ //工作空间
        srcDirPath, //用户选择的绝对路径
        subType, //用户输入的子类型
    }, comments, //注释相关的信息
    { //配置
        indent //缩进字符串
    }) {
     //选择文件名
     let fileName = 'UNLICENSE';
     if (subType != 'The Unlicense') {
         fileName = await select(['LICENSE', 'LICENSE.txt'], langPack.selectName);
         if (!fileName) return undefined
     }

     let year = new Date().getFullYear()
     let copyrightHolder = os.userInfo().username
     switch (subType) {
         case 'BSD-2-Clause':
         case 'BSD-3-Clause':
         case 'MIT':
             copyrightHolder = await input(copyrightHolder, langPack.inputCopyrightHolder)
             if (copyrightHolder == undefined) return undefined
             break;
         default:
             break;
     }

     let targetPath = util.pathResolve(srcDirPath, fileName)
     return {
         targetPath: targetPath,
         code: util.render(`license/${subType}`, {
             year,
             copyrightHolder
         })
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

    return await inputFileInfo({
            srcDirPath: util.pathResolve(projectDir),
            subType
        },
        comments, {
            indent
        }
    )
}

module.exports = {
    key: "LICENSE",
    suffix: [],
    subTypes: LICENSE_TYPES,
    handle: handle,
    inputFileInfo
}