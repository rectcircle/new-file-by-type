# Change Log

All notable changes to the "new-file-by-type-v1" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.0.1] - 2010-12-21

### Changed

* Fix 缩减包大小，从扩展包中去除无用图片资源

## [1.0.0] - 2019-12-21

### Add

* Python类型项目
* Go类型项目
* 添加系列附加功能
  * 拷贝当前文件
  * 删除当前文件
  * 移动当前文件
  * 创建目录
  * 选择路径...
  * 打开工作空间...(使用自定义路径选择器)
* 支持常见资源搜索
* 支持翻译功能
* 添加扩展版本更新弹窗
* 模板引擎支持创建模拟调试代码
* 支持显示最近使用的

### Changed

* 完全重写本扩展
* 使用TypeScript代替JavaScript作为主要开发语言
* 优化交互、UI、国际化、配置机制
* 自定义路径输入交互
* 摒弃硬编码，完全基于配置的模板
* 放弃artTemplate模板引擎，自定义基于eval的全功能JavaScript的模板引擎
* 新的配置逻辑，更细粒度的配置

### Removed

* 完全废弃就的配置Key

## 0.1.0

* 添加src目录自动扫描（根据打开的文件和文件所在目录）
* 菜单国际化
* 优化Java工作区多项目创建文件
* 优化重构代码逻辑
* 添加右键菜单创建文件`在当前目录创建文件`
* 添加`创建该文件副本`命令
* 整理README
* 去除预览版标志

### 0.0.9

* `BSD-2-Clause`添加许可证标题：`BSD 2-Clause License`
* 添加Scala项目文件的创建

### 0.0.8

* 添加许可证模板文件创建

### 0.0.7

* 根据普通文件，根据后缀添加默认文件名
* 优化项目选择排序机制

### 0.0.6

* 添加普通文件的创建，支持选择常见后缀和自定义后缀
* 添加TypeScript类型文件创建

### 0.0.6

* 添加普通文件的创建，支持选择常见后缀和自定义后缀
* 添加TypeScript类型文件创建### 0.0.6

### 0.0.5

* 在Web中添加Sass和Less
* 从Web中删除TS（TypeScript）和JS
* 添加项目分类JavaScript
* 所有通过Snippet方式实现的模板，添加说明

### 0.0.4

* 修复C/C++英文提示缺失问题
* 完善Web类型文件的创建
* 添加代码注释的描述信息默认为：`Copyright (c) $year $author`

### 0.0.3

* 更改C/C++代码风格
* 修复C/C++缩进失效问题
* 完成基本的CSS和JS文件的创建

### 0.0.2

* 完成基本C/C++文件类型支持

### 0.0.1

首次发布

* 支持Java项目文件的创建
* 支持通过自定义Snippet的方式创建各种类型文件

[Unreleased]: https://github.com/rectcircle/new-file-by-type/compare/v0.1.0...HEAD
