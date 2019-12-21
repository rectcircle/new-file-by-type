
/* toSource by Marcello Bastea-Forte - zlib license */
/* modify and fix bug from https://github.com/marcello3d/node-tosource */
export function toSource (object: any, filter: Function | undefined, indent: string | undefined, startingIndent: string | undefined) {
  var seen: any[] = [];
  return walk(object, filter, indent === undefined ? '  ' : (indent || ''), startingIndent || '', seen);

  function walk (object: any, filter: Function | undefined, indent: string, currentIndent: string, seen: any[]):any {
    var nextIndent = currentIndent + indent;
    object = filter ? filter(object) : object;

    switch (typeof object) {
      case 'string':
        return JSON.stringify(object);
      case 'boolean':
      case 'number':
      case 'undefined':
        return '' + object;
      case 'function':
        return object.toString();
    }

    if (object === null) {
      return 'null';
    }
    if (object instanceof RegExp) {
      return stringifyRegExp(object);
    }
    if (object instanceof Date) {
      return 'new Date(' + object.getTime() + ')';
    }

    var seenIndex = seen.indexOf(object) + 1;
    if (seenIndex > 0) {
      return '{$circularReference:' + seenIndex + '}';
    }
    seen.push(object);

    function join(elements: any[]) {
      return '\n' + nextIndent + elements.join(',\n' + nextIndent) + '\n' + nextIndent.substr(indent.length);
    }

    if (Array.isArray(object)) {
      return object.length === 0 ? '[]' : '[' + join(object.map(function (element) {
        return walk(element, filter, indent, nextIndent, seen.slice());
      })) + ']';
    }
    var keys = Object.keys(object);
    return keys.length ? '{' + join(keys.map(function (key) {
      return (legalKey(key) ? key : JSON.stringify(key)) + ':' + walk(object[key], filter, indent, nextIndent, seen.slice());
    })) + '}' : '{}';
  }
}

var KEYWORD_REGEXP = /^(abstract|boolean|break|byte|case|catch|char|class|const|continue|debugger|default|delete|do|double|else|enum|export|extends|false|final|finally|float|for|function|goto|if|implements|import|in|instanceof|int|interface|long|native|new|null|package|private|protected|public|return|short|static|super|switch|synchronized|this|throw|throws|transient|true|try|typeof|undefined|var|void|volatile|while|with)$/;

function legalKey (string: string) {
  return /^[a-z_$][0-9a-z_$]*$/gi.test(string) && !KEYWORD_REGEXP.test(string);
}

// Node.js 0.10 doesn't escape slashes in re.toString() or re.source
// when they were not escaped initially.
// Here we check if the workaround is needed once and for all,
// then apply it only for non-escaped slashes.
var isRegExpEscaped = (new RegExp('/')).source === '\\/';

function stringifyRegExp (re: RegExp) {
  if (isRegExpEscaped) {
    return re.toString();
  }
  var source = re.source.replace(/\//g, function (found, offset, str) {
    if (offset === 0 || str[offset - 1] !== '\\') {
      return '\\/';
    }
    return '/';
  });
  var flags = (re.global && 'g' || '') + (re.ignoreCase && 'i' || '') + (re.multiline && 'm' || '');
  return '/' + source + '/' + flags;
}
