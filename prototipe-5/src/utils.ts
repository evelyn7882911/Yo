import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

export function highlightLine(text: string, language?: string, lightMode = false): React.ReactNode[] {
  if (lightMode || !language) {
    const tokens: React.ReactNode[] = [];
    const regex = /(".*?"|'.*?'|`.*?`|\/\/.*|\/\*[\s\S]*?\*\/|\b\d+\b|\b\w+\b|\S)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const token = match[0];
      const start = match.index;
      if (start > lastIndex) {
        tokens.push(<span key={lastIndex}>{text.slice(lastIndex, start)}</span>);
      }
      let className = '';
      if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) className = 'string';
      else if (token.startsWith('//') || token.startsWith('/*')) className = 'comment';
      else if (/^\d+$/.test(token)) className = 'number';
      else if (/^(function|const|let|var|if|else|for|while|return|import|export|class|extends|try|catch|finally|throw|switch|case|default|break|continue|typeof|instanceof|void|delete|await|async|yield|super|this|true|false|null|undefined)$/.test(token)) className = 'keyword';
      tokens.push(
        <span key={start} className={className}>
          {token}
        </span>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      tokens.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
    }
    return tokens;
  }

  try {
    const result = hljs.highlight(text, { language });
    return [<span key="0" dangerouslySetInnerHTML={{ __html: result.value }} />];
  } catch {
    return [<span key="0">{text}</span>];
  }
}