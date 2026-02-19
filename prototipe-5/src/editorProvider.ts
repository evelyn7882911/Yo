import * as vscode from 'vscode';

export class TreeEditorProvider implements vscode.CustomTextEditorProvider {
  private static readonly viewType = 'hierarchicalFoldEditor.treeEditor';

  constructor(private readonly context: vscode.ExtensionContext) {}

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      TreeEditorProvider.viewType,
      new TreeEditorProvider(context)
    );
  }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'out')]
    };

    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    const changeDocSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        webviewPanel.webview.postMessage({ type: 'update', content: document.getText() });
      }
    });

    webviewPanel.onDidDispose(() => changeDocSubscription.dispose());

    webviewPanel.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'ready':
          const config = vscode.workspace.getConfiguration('hierarchicalFoldEditor');
          webviewPanel.webview.postMessage({ type: 'update', content: document.getText() });
          webviewPanel.webview.postMessage({
            type: 'config',
            config: {
              indentSize: config.get('indentSize'),
              expandTab: config.get('expandTab'),
              lightHighlight: config.get('lightHighlight')
            }
          });
          break;
        case 'updateDocument':
          await this.updateDocument(document, message.content);
          break;
      }
    });
  }

  private async updateDocument(document: vscode.TextDocument, content: string) {
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(document.getText().length)
    );
    edit.replace(document.uri, fullRange, content);
    await vscode.workspace.applyEdit(edit);
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview', 'index.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'theme.css')
    );
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet">
  <title>Hierarchical Editor</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}