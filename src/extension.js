// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// const vscode = require('vscode');

const javaNew = require('./new-handler/java-new')
const New = require('./basic/new')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    //Java
    context.subscriptions.push(javaNew.disposable);
    context.subscriptions.push(New.disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;