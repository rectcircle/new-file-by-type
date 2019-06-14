# new-file-by-type

[![Version](https://vsmarketplacebadge.apphb.com/version/Rectcircle.new-file-by-type.svg)](https://marketplace.visualstudio.com/items?itemName=Rectcircle.new-file-by-type)


[中文版介绍](#中文版介绍)



<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=3 orderedList=false} -->

<!-- code_chunk_output -->

* [Features](#features)
* [Installation](#installation)
* [How to use](#how-to-use)
	* [Create a file anywhere in the workspace](#create-a-file-anywhere-in-the-workspace)
	* [Create a file in the specified directory](#create-a-file-in-the-specified-directory)
	* [Create a file by copy](#create-a-file-by-copy)
* [TODO List](#todo-list)
* [Extension Settings](#extension-settings)
* [Release Notes](#release-notes)
	* [0.0.1](#001)
	* [0.0.2](#002)
	* [0.0.3](#003)
	* [0.0.4](#004)
	* [0.0.5](#005)
	* [0.0.6](#006)
	* [0.0.7](#007)
	* [0.0.8](#008)
	* [0.0.9](#009)
	* [0.1.0](#010)
* [特性](#特性)
* [安装](#安装)
* [使用方式](#使用方式)
	* [在工作区的任意位置创建文件](#在工作区的任意位置创建文件)
	* [在指定目录创建文件](#在指定目录创建文件)
	* [通过拷贝创建文件](#通过拷贝创建文件)
* [计划列表](#计划列表)
* [扩展设置](#扩展设置)
* [发行说明](#发行说明)
	* [0.0.1](#001-1)
	* [0.0.2](#002-1)
	* [0.0.3](#003-1)
	* [0.0.4](#004-1)
	* [0.0.5](#005-1)
	* [0.0.6](#006-1)
	* [0.0.6](#006-2)
	* [0.0.7](#007-1)
	* [0.0.8](#008-1)
	* [0.0.9](#009-1)
	* [0.1.0](#010-1)

<!-- /code_chunk_output -->



**English README from Google Translation**

This is a VSCode user-friendly extension to create file extensions

The purpose of this extension is to make vscode create various types of files like IDEs and generate template code based on what the user fills.



## Features

* Create a file anywhere in the workspace
* Create a file in the specified directory
* Create a file by copy (create a copy based on an existing file)
* Supports both Chinese and English languages
* Support for creating code templates based on type
* Support automatic generation of file comments and configuration of various options
* Support code indentation configuration
* Support for creating files from custom Snippet mode


If no directory is open in the current workspace, select the directory and add the directory to the workspace

![Workspace add directory](images/zh_nodiropen.gif)

Create a Java Class file

![Create a Java Class file](images/zh_java_class.gif)

Create a file and fill it with Snippet

![Create Snippet file](images/zh_snippet.gif)


## Installation

Launch VS Code Quick Open (<kbd>Ctrl+P</kbd>), paste the following command, and press enter.
```
ext install Rectcircle.new-file-by-type
```

## How to use

### Create a file anywhere in the workspace
* Command panel
  * <kbd>Ctrl+Shift+P</kbd> Start command panel
  * input `New`
  * Select `New:New File By File or Project Type`
* Shortcut
  * <kbd>Ctrl+Alt+N</kbd>


### Create a file in the specified directory

**Command panel**

Note: In this way, the editor must open a file.

The location of the new file created is the directory where the file is currently open

* <kbd>Ctrl+Shift+P</kbd> Start command panel
* input `New`
* Select `New:Create a file in the current directory`

**Editor or Explorer right-click menu**

* Right mouse click
* Select `Create a file in the current directory`


### Create a file by copy

**Command panel**

Note: In this way, the editor must open a file.

The location of the new file created is the directory where the file is currently open

* <kbd>Ctrl+Shift+P</kbd> Start command panel
* input `New`
* Select `New:Create a copy of this file`

**Editor or Explorer right-click menu**

* Right mouse click
* Select `Create a copy of this file`


## TODO List

- [ ] GO
- [ ] Python
- [x] Scala
  - [x] App
  - [x] Class
  - [x] Object
  - [x] Trait
  - [x] Class&Object
  - [x] Trait&Object
  - [x] Package Object
  - [x] Scala Worksheet
  - [x] Scala Script
- [x] License
  - [x] Apache-2.0
  - [x] BSD-3-Clause
  - [x] BSD-2-Clause
  - [x] GPL-2.0
  - [x] GPL-3.0
  - [x] LGPL-2.0
  - [x] LGPL-2.1
  - [x] LGPL-3.0
  - [x] MIT
  - [x] MPL-2.0
  - [x] CDDL-1.0
  - [x] EPL-1.0
  - [x] The Unlicense
- [x] Ordinary file
- [x] TypeScript
  - [x] None
  - [x] Module
  - [x] React
  - [x] Angular
  - [x] Vue
- [x] JavaScript
  - [x] None
  - [x] JQuery
  - [x] Node-Module
  - [x] ES6-Module
  - [x] React
  - [x] Vue
- [x] Web
  - [x] HTML
  - [x] HTML5 (from Snippet)
  - [x] CSS (from Snippet)
  - [x] Less (from Snippet)
  - [x] Sass (from Snippet)
- [x] C/C++ project support
  - [x] Class (generate .cpp and .h)
  - [x] Two ordinary files (.c or .cpp and .h)
- [x] Customized Template via Custom Snippet
- [x] Java Project File Support
  - [x] Class
  - [x] Interface
  - [x] Enum
  - [x] Annotation
  - [x] JUnitTestCase
  - [x] Package (package-info file)


## Extension Settings


Code annotation configuration

* `new-file-by-type.code-comments.enable` Whether to enable document annotations, enabled by default
* `new-file-by-type.code-comments.author` Specifies the name of the author in the code comment of the newly created file. The default value is null, which means the user is logged in using the current operating system.
* `new-file-by-type.code-comments.description` The default description for adding code comments is:`Copyright (c) $year, $author. All rights reserved.`
* `new-file-by-type.code-comments.date-farmat` The format of the creation time in the configuration file comment. The default is `YYYY-MM-DD`, see http://momentjs.com/docs/#/displaying/
* `new-file-by-type.code-comments.version` creates the file's version number information (the value of @version), defaults to `0.0.1`
* `new-file-by-type.code-comments.items` specifies that the code comments for each item default to `["author", "date", "version"]`


Code template indent configuration

* `new-file-by-type.template.defaultIndent` specifies the indentation of the generated code. 0 means use the [tab] character. A value greater than zero indicates that the number of space characters is used. The default value is 0.
* `new-file-by-type.template.indents` According to the file type, specify the code indentation, will override the `new-file-by-type.template.defaultIndent` configuration default configuration see plug-in configuration

Use custom snippet to create a file configuration

```jsonc
"new-file-by-type.snippets":[
  {
    "category": "Web", //Classification, displayed in the first selector
    "name": "HTML5", //The name of the template, shown in the second selector
    "defaultFilename": "index", //Create a file's default file name
    "defaultSrc": "", //Create a file's default source directory
    "suffix": "html", //File extension
    "body": [ //vscode Snippet, to see https://code.visualstudio.com/docs/editor/userdefinedsnippets
      "<!DOCTYPE html>", "<html lang=\"${5:en}\">", "<head>", 
      "    <meta charset=\"UTF-8\">",
      "    <meta name=\"viewport\" content=\"width=${1:device-width}, initial-scale=${2:1.0}\">", 
      "    <meta http-equiv=\"X-UA-Compatible\" content=\"${3:ie=edge}\">", 
      "    <title>${4:Document}</title>", 
      "</head>", 
      "<body>", 
      "    $0",
      "</body>", 
      "</html>"]
  }
]
```


## Release Notes

### 0.0.1

* First release, support for the creation of Java project files
* Support for creating various types of files by customizing Snippet

### 0.0.2

* Basic C/C++ file type support


### 0.0.3

* Change C/C++ code style
* Fix C/C++ Indent Failure
* Complete the creation of basic CSS and JS files


### 0.0.4

* Fix missing C/C++ English prompts
* Improve the creation of Web type files
* The default description for adding code comments is:`Copyright (c) $year $author`


### 0.0.5

* Remove TS (TypeScript) and JS from the Web
* Add Item Category JavaScript
* All templates implemented via Snippet, add instructions

### 0.0.6

* Add ordinary file creation, support selection of common suffixes and custom suffixes
* Add a TypeScript type file to create

### 0.0.7

* `A File`, add the default file name based on the suffix
* Optimize project selection sorting mechanism


### 0.0.8

* Add license template file creation

### 0.0.9

* `BSD-2-Clause` Add License Title: `BSD 2-Clause License`
* Add Scala project file creation


### 0.1.0

* Add src directory to automatically scan (based on the open file and the directory where the file is located)
* Internationalization of menus
* Optimize Java workspace multiproject creation files 
* Optimize refactoring code logic
* Add the right-click menu to create a file `Create a file in the current directory` 
* Add `Create a copy of this file` command
* Organize README
* Remove the preview logo


=================================================


# 中文版介绍

这是一个VSCode的方便用户创建创建文件的扩展

这个扩展旨在使VSCode可以像IDE一样创建各种类型的文件，并根据用户填写的内容生成模板代码。


## 特性

* 在工作区的任意位置创建文件
* 在指定的目录创建文件
* 通过拷贝创建文件（根据现有文件创建副本）
* 支持中英两种语言
* 支持根据类型创建代码模板
* 支持自动生成文件注释，并可配置各个注释项
* 支持代码缩进方式的配置
* 支持自通过自定义Snippet方式创建文件

如果当前工作区没有目录打开，则选择目录，向工作区添加目录

![工作区添加目录](images/zh_nodiropen.gif)

创建Java Class文件

![创建Java Class文件](images/zh_java_class.gif)

创建文件并使用Snippet填充内容

![创建Snippet文件](images/zh_snippet.gif)


## 安装

运行VSCode快速打开面板（<kbd>Ctrl+P</kbd>），粘贴如下命令并按回车确认
```
ext install Rectcircle.new-file-by-type
```

## 使用方式

### 在工作区的任意位置创建文件

* 命令面板方式
  * <kbd>Ctrl+Shift+P</kbd> 启动命令面板
  * 输入`New`
  * 选择`New:根据文件或项目类型创建文件`
* 快捷键方式
  * 默认快捷键为 <kbd>Ctrl+Alt+N</kbd>

### 在指定目录创建文件

**命令面板方式**

注意此种方式，编辑器必须打开一个文件。

创建的新文件的位置为当前打开文件所在的目录

* <kbd>Ctrl+Shift+P</kbd> 启动命令面板
* 输入`New`
* 选择`New:在当前目录创建文件`

**编辑器或资源管理器右键菜单**
* 鼠标右击
* 选择`在当前目录创建文件`


### 通过拷贝创建文件

**命令面板方式**

注意此种方式，编辑器必须打开一个文件。

创建的新文件的位置为当前打开文件所在的目录

* <kbd>Ctrl+Shift+P</kbd> 启动命令面板
* 输入`New`
* 选择`New:创建该文件副本`

**编辑器或资源管理器右键菜单**

如果选中的是资源管理器的目录将报错

* 鼠标右击
* 选择`创建该文件副本`



## 计划列表

- [ ] GO
- [ ] Python
- [x] Scala
  - [x] App
  - [x] Class
  - [x] Object
  - [x] Trait
  - [x] Class&Object
  - [x] Trait&Object
  - [x] Package Object
  - [x] Scala Worksheet
  - [x] Scala Script
- [x] License
  - [x] Apache-2.0
  - [x] BSD-3-Clause
  - [x] BSD-2-Clause
  - [x] GPL-2.0
  - [x] GPL-3.0
  - [x] LGPL-2.0
  - [x] LGPL-2.1
  - [x] LGPL-3.0
  - [x] MIT
  - [x] MPL-2.0
  - [x] CDDL-1.0
  - [x] EPL-1.0
  - [x] The Unlicense
- [x] 普通文件
- [x] TypeScript
  - [x] None
  - [x] Module
  - [x] React
  - [x] Angular
  - [x] Vue
- [x] JavaScript
  - [x] None
  - [x] JQuery
  - [x] Node-Module
  - [x] ES6-Module
  - [x] React
  - [x] Vue
- [x] Web
  - [x] HTML
  - [x] HTML5 (from Snippet)
  - [x] CSS (from Snippet)
  - [x] Less (from Snippet)
  - [x] Sass (from Snippet)
- [x] C/C++项目支持
  - [x] Class（生成.cpp和.h）
  - [x] 普通的两种文件（.c或.cpp和.h）
- [x] 通过自定义Snippet方式实现自定义模板
- [x] Java项目文件的支持
  - [x] Class
  - [x] Interface
  - [x] Enum
  - [x] Annotation
  - [x] JUnitTestCase
  - [x] Package（package-info文件）


## 扩展设置

代码注释的配置

* `new-file-by-type.code-comments.enable` 是否启用生成文档注释功能，默认启用
* `new-file-by-type.code-comments.author` 指定新建文件的代码注释中的作者名，默认为null，代表使用当前操作系统登录用户名
* `new-file-by-type.code-comments.description` 添加代码注释的描述信息默认为：`Copyright (c) $year, $author. All rights reserved.`
* `new-file-by-type.code-comments.date-farmat` 配置文件注释中的创建时间的格式化形式，默认为 `YYYY-MM-DD`，更多参见 http://momentjs.cn/docs/#/displaying/
* `new-file-by-type.code-comments.version` 创建文件的版本号信息（@version的值），默认为 `0.0.1`
* `new-file-by-type.code-comments.items` 指定代码注释各个项目默认为`["author", "date", "version"]`


代码模板缩进配置

* `new-file-by-type.template.defaultIndent` 指定生成代码的缩进方式，0代表使用[tab]字符，大于零表示使用该数目的空格字符，默认为0
* `new-file-by-type.template.indents` 根据文件类型，指定代码缩进方式，将覆盖`new-file-by-type.template.defaultIndent`配置默认配置参见插件配置


使用自定义Snippet方式创建文件的配置
```jsonc
"new-file-by-type.snippets":[
  {
    "category": "Web", //分类，第一个选择器中展示
    "name": "HTML5", //该模板的名字，在第二个选择器中展示
    "defaultFilename": "index", //创建文件的默认文件名
    "defaultSrc": "", //创建文件的默认源代码目录
    "suffix": "html", //文件扩展名
    "body": [ //vscode Snippet 内容 参见https://code.visualstudio.com/docs/editor/userdefinedsnippets
      "<!DOCTYPE html>", "<html lang=\"${5:en}\">", "<head>", 
      "    <meta charset=\"UTF-8\">",
      "    <meta name=\"viewport\" content=\"width=${1:device-width}, initial-scale=${2:1.0}\">", 
      "    <meta http-equiv=\"X-UA-Compatible\" content=\"${3:ie=edge}\">", 
      "    <title>${4:Document}</title>", 
      "</head>", 
      "<body>", 
      "    $0",
      "</body>", 
      "</html>"]
  }
]
```


## 发行说明

### 0.0.1

首次发布
* 支持Java项目文件的创建
* 支持通过自定义Snippet的方式创建各种类型文件

### 0.0.2

* 完成基本C/C++文件类型支持

### 0.0.3

* 更改C/C++代码风格
* 修复C/C++缩进失效问题
* 完成基本的CSS和JS文件的创建


### 0.0.4

* 修复C/C++英文提示缺失问题
* 完善Web类型文件的创建
* 添加代码注释的描述信息默认为：`Copyright (c) $year $author`


### 0.0.5

* 在Web中添加Sass和Less
* 从Web中删除TS（TypeScript）和JS
* 添加项目分类JavaScript
* 所有通过Snippet方式实现的模板，添加说明


### 0.0.6

* 添加普通文件的创建，支持选择常见后缀和自定义后缀
* 添加TypeScript类型文件创建

### 0.0.6

* 添加普通文件的创建，支持选择常见后缀和自定义后缀
* 添加TypeScript类型文件创建### 0.0.6

### 0.0.7

* 根据普通文件，根据后缀添加默认文件名
* 优化项目选择排序机制


### 0.0.8

* 添加许可证模板文件创建

### 0.0.9

* `BSD-2-Clause`添加许可证标题：`BSD 2-Clause License`
* 添加Scala项目文件的创建

### 0.1.0

* 添加src目录自动扫描（根据打开的文件和文件所在目录） 
* 菜单国际化 
* 优化Java工作区多项目创建文件 
* 优化重构代码逻辑 
* 添加右键菜单创建文件`在当前目录创建文件` 
* 添加`创建该文件副本`命令 
* 整理README
* 去除预览版标志



