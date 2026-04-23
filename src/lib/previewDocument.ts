function escapeForStyleBlock(css: string): string {
  return css.split('</' + 'style').join('<' + '\\' + '/style');
}

function escapeForScriptBlock(js: string): string {
  return js.split('</' + 'script').join('<' + '\\' + '/script');
}

const CONSOLE_BRIDGE = `
<script>
(function () {
  function send(level) {
    return function () {
      try {
        var args = Array.prototype.slice.call(arguments).map(function (a) {
          if (a === null) return 'null';
          if (a === undefined) return 'undefined';
          if (typeof a === 'object') {
            try { return JSON.stringify(a); } catch (e) { return String(a); }
          }
          return String(a);
        });
        if (window.parent) {
          window.parent.postMessage({ type: 'jsc-console', level: level, payload: args }, '*');
        }
      } catch (e) {}
    };
  }
  if (window.console) {
    console.log = send('log');
    console.info = send('info');
    console.warn = send('warn');
    console.error = send('error');
  }
  window.addEventListener('error', function (e) {
    try {
      window.parent.postMessage(
        { type: 'jsc-console', level: 'error', payload: [e.message || 'Error'] },
        '*'
      );
    } catch (err) {}
  });
  window.addEventListener('unhandledrejection', function (e) {
    try {
      var reason = e.reason && (e.reason.message || String(e.reason));
      window.parent.postMessage(
        { type: 'jsc-console', level: 'error', payload: [reason || 'Unhandled rejection'] },
        '*'
      );
    } catch (err) {}
  });
})();
</script>
`.trim();

/**
 * Merges three playground files into a single srcDoc-safe HTML document for the preview iframe.
 */
export function buildPreviewDocument(html: string, css: string, js: string): string {
  let out = html
    .replace(/<link[^>]*href=['"]\s*style\.css\s*['"][^>]*\/?>/gi, '')
    .replace(/<link[^>]*href=['"]\s*\.\/style\.css\s*['"][^>]*\/?>/gi, '');

  out = out.replace(
    new RegExp(
      '<script[^>]*src=[\'"]\\s*script\\.js\\s*[\'"][^>]*>\\s*</' + 'script>',
      'gi'
    ),
    ''
  );
  out = out.replace(
    new RegExp(
      '<script[^>]*src=[\'"]\\s*\\.\\/script\\.js\\s*[\'"][^>]*>\\s*</' + 'script>',
      'gi'
    ),
    ''
  );

  const styleTag = `<style>${escapeForStyleBlock(css)}</style>`;
  const safeJs = escapeForScriptBlock(js);
  const useModule = /^\s*import[\s'"]/m.test(safeJs.trim());
  const userScript = useModule
    ? '<script type="module">\n' + safeJs + '\n' + '<' + '/script>'
    : '<script>\n' + safeJs + '\n' + '<' + '/script>';
  const bridgeAndUser = CONSOLE_BRIDGE + userScript;

  if (out.includes('</head>')) {
    out = out.replace('</head>', `${styleTag}\n</head>`);
  } else {
    out = `${styleTag}\n` + out;
  }

  if (out.includes('</body>')) {
    out = out.replace('</body>', `${bridgeAndUser}\n</body>`);
  } else {
    out = out + '\n' + bridgeAndUser;
  }

  return out;
}
