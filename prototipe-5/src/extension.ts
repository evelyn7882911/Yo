import * as vscode from 'vscode';
import { TreeEditorProvider } from './editorProvider';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(TreeEditorProvider.register(context));

  const newFileCmd = vscode.commands.registerCommand('hierarchicalFoldEditor.newFile', async () => {
    const wf = vscode.workspace.workspaceFolders;
    if (!wf) {
      vscode.window.showErrorMessage('Open a folder first');
      return;
    }
    const uri = await vscode.window.showSaveDialog({
      filters: { 'Tree Files': ['tree', 'hfd'] },
      defaultUri: vscode.Uri.joinPath(wf[0].uri, 'untitled.tree')
    });
    if (uri) {
      const template = `root\n  child1\n    grandchild\n  child2`;
      await vscode.workspace.fs.writeFile(uri, Buffer.from(template));
      await vscode.commands.executeCommand('vscode.open', uri);
    }
  });

  context.subscriptions.push(newFileCmd);
}