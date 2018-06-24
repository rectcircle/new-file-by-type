// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// const vscode = require('vscode');

const New = require('./basic/new')
const smartNew = require('./basic/smart-new')
const copyNew = require('./basic/copy-new')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    context.subscriptions.push(New.disposable);
    context.subscriptions.push(smartNew.disposable);
    context.subscriptions.push(copyNew.disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;