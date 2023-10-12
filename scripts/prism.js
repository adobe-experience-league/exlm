/* PrismJS 1.29.0
https://prismjs.com/download.html#themes=prism-tomorrow&languages=markup+css+clike+javascript+abap+abnf+actionscript+al+antlr4+apacheconf+apl+applescript+arduino+arff+armasm+arturo+asciidoc+aspnet+asm6502+autoit+awk+bash+basic+batch+bbcode+c+csharp+cpp+cfscript+chaiscript+cil+cilkc+cilkcpp+cobol+coffeescript+csp+css-extras+csv+cypher+d+dart+diff+django+dns-zone-file+docker+ebnf+editorconfig+eiffel+elixir+erlang+gap+gettext+git+linker-script+go+go-module+gradle+graphql+haml+handlebars+haskell+haxe+hcl+hlsl+http+hpkp+hsts+icon+icu-message-format+ignore+inform7+j+java+javadoc+javadoclike+javastacktrace+jsdoc+js-extras+json+json5+jsonp+jsstacktrace+js-templates+julia+keepalived+keyman+kotlin+latex+latte+lisp+livescript+llvm+log+lua+makefile+markdown+markup-templating+matlab+maxscript+mongodb+nginx+nix+objectivec+odin+parser+pascal+perl+php+phpdoc+php-extras+powerquery+powershell+properties+pug+puppet+pure+python+qml+qore+r+jsx+tsx+reason+regex+rego+ruby+rust+sas+sass+scss+scala+shell-session+sml+sqf+sql+squirrel+stan+iecst+swift+systemd+t4-templating+t4-cs+t4-vb+tap+tcl+textile+toml+twig+typescript+typoscript+uri+v+vbnet+velocity+verilog+vhdl+vim+visual-basic+warpscript+wasm+web-idl+wgsl+wiki+wolfram+wren+xeora+xml-doc+yaml&plugins=line-highlight+line-numbers+toolbar+copy-to-clipboard */
var _self =
    'undefined' != typeof window
      ? window
      : 'undefined' != typeof WorkerGlobalScope &&
        self instanceof WorkerGlobalScope
      ? self
      : {},
  Prism = (function (e) {
    var n = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i,
      t = 0,
      r = {},
      a = {
        manual: e.Prism && e.Prism.manual,
        disableWorkerMessageHandler:
          e.Prism && e.Prism.disableWorkerMessageHandler,
        util: {
          encode: function e(n) {
            return n instanceof i
              ? new i(n.type, e(n.content), n.alias)
              : Array.isArray(n)
              ? n.map(e)
              : n
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/\u00a0/g, ' ');
          },
          type: function (e) {
            return Object.prototype.toString.call(e).slice(8, -1);
          },
          objId: function (e) {
            return (
              e.__id ||
                Object.defineProperty(e, '__id', {
                  value: ++t,
                }),
              e.__id
            );
          },
          clone: function e(n, t) {
            var r, i;
            switch (((t = t || {}), a.util.type(n))) {
              case 'Object':
                if (((i = a.util.objId(n)), t[i])) return t[i];
                for (var l in ((r = {}), (t[i] = r), n))
                  n.hasOwnProperty(l) && (r[l] = e(n[l], t));
                return r;
              case 'Array':
                return (
                  (i = a.util.objId(n)),
                  t[i]
                    ? t[i]
                    : ((r = []),
                      (t[i] = r),
                      n.forEach(function (n, a) {
                        r[a] = e(n, t);
                      }),
                      r)
                );
              default:
                return n;
            }
          },
          getLanguage: function (e) {
            for (; e; ) {
              var t = n.exec(e.className);
              if (t) return t[1].toLowerCase();
              e = e.parentElement;
            }
            return 'none';
          },
          setLanguage: function (e, t) {
            (e.className = e.className.replace(RegExp(n, 'gi'), '')),
              e.classList.add('language-' + t);
          },
          currentScript: function () {
            if ('undefined' == typeof document) return null;
            if ('currentScript' in document) return document.currentScript;
            try {
              throw new Error();
            } catch (r) {
              var e = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(r.stack) ||
                [])[1];
              if (e) {
                var n = document.getElementsByTagName('script');
                for (var t in n) if (n[t].src == e) return n[t];
              }
              return null;
            }
          },
          isActive: function (e, n, t) {
            for (var r = 'no-' + n; e; ) {
              var a = e.classList;
              if (a.contains(n)) return !0;
              if (a.contains(r)) return !1;
              e = e.parentElement;
            }
            return !!t;
          },
        },
        languages: {
          plain: r,
          plaintext: r,
          text: r,
          txt: r,
          extend: function (e, n) {
            var t = a.util.clone(a.languages[e]);
            for (var r in n) t[r] = n[r];
            return t;
          },
          insertBefore: function (e, n, t, r) {
            var i = (r = r || a.languages)[e],
              l = {};
            for (var o in i)
              if (i.hasOwnProperty(o)) {
                if (o == n)
                  for (var s in t) t.hasOwnProperty(s) && (l[s] = t[s]);
                t.hasOwnProperty(o) || (l[o] = i[o]);
              }
            var u = r[e];
            return (
              (r[e] = l),
              a.languages.DFS(a.languages, function (n, t) {
                t === u && n != e && (this[n] = l);
              }),
              l
            );
          },
          DFS: function e(n, t, r, i) {
            i = i || {};
            var l = a.util.objId;
            for (var o in n)
              if (n.hasOwnProperty(o)) {
                t.call(n, o, n[o], r || o);
                var s = n[o],
                  u = a.util.type(s);
                'Object' !== u || i[l(s)]
                  ? 'Array' !== u || i[l(s)] || ((i[l(s)] = !0), e(s, t, o, i))
                  : ((i[l(s)] = !0), e(s, t, null, i));
              }
          },
        },
        plugins: {},
        highlightAll: function (e, n) {
          a.highlightAllUnder(document, e, n);
        },
        highlightAllUnder: function (e, n, t) {
          var r = {
            callback: t,
            container: e,
            selector:
              'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code',
          };
          a.hooks.run('before-highlightall', r),
            (r.elements = Array.prototype.slice.apply(
              r.container.querySelectorAll(r.selector),
            )),
            a.hooks.run('before-all-elements-highlight', r);
          for (var i, l = 0; (i = r.elements[l++]); )
            a.highlightElement(i, !0 === n, r.callback);
        },
        highlightElement: function (n, t, r) {
          var i = a.util.getLanguage(n),
            l = a.languages[i];
          a.util.setLanguage(n, i);
          var o = n.parentElement;
          o && 'pre' === o.nodeName.toLowerCase() && a.util.setLanguage(o, i);
          var s = {
            element: n,
            language: i,
            grammar: l,
            code: n.textContent,
          };
          function u(e) {
            (s.highlightedCode = e),
              a.hooks.run('before-insert', s),
              (s.element.innerHTML = s.highlightedCode),
              a.hooks.run('after-highlight', s),
              a.hooks.run('complete', s),
              r && r.call(s.element);
          }
          if (
            (a.hooks.run('before-sanity-check', s),
            (o = s.element.parentElement) &&
              'pre' === o.nodeName.toLowerCase() &&
              !o.hasAttribute('tabindex') &&
              o.setAttribute('tabindex', '0'),
            !s.code)
          )
            return a.hooks.run('complete', s), void (r && r.call(s.element));
          if ((a.hooks.run('before-highlight', s), s.grammar))
            if (t && e.Worker) {
              var c = new Worker(a.filename);
              (c.onmessage = function (e) {
                u(e.data);
              }),
                c.postMessage(
                  JSON.stringify({
                    language: s.language,
                    code: s.code,
                    immediateClose: !0,
                  }),
                );
            } else u(a.highlight(s.code, s.grammar, s.language));
          else u(a.util.encode(s.code));
        },
        highlight: function (e, n, t) {
          var r = {
            code: e,
            grammar: n,
            language: t,
          };
          if ((a.hooks.run('before-tokenize', r), !r.grammar))
            throw new Error(
              'The language "' + r.language + '" has no grammar.',
            );
          return (
            (r.tokens = a.tokenize(r.code, r.grammar)),
            a.hooks.run('after-tokenize', r),
            i.stringify(a.util.encode(r.tokens), r.language)
          );
        },
        tokenize: function (e, n) {
          var t = n.rest;
          if (t) {
            for (var r in t) n[r] = t[r];
            delete n.rest;
          }
          var a = new s();
          return (
            u(a, a.head, e),
            o(e, a, n, a.head, 0),
            (function (e) {
              for (var n = [], t = e.head.next; t !== e.tail; )
                n.push(t.value), (t = t.next);
              return n;
            })(a)
          );
        },
        hooks: {
          all: {},
          add: function (e, n) {
            var t = a.hooks.all;
            (t[e] = t[e] || []), t[e].push(n);
          },
          run: function (e, n) {
            var t = a.hooks.all[e];
            if (t && t.length) for (var r, i = 0; (r = t[i++]); ) r(n);
          },
        },
        Token: i,
      };
    function i(e, n, t, r) {
      (this.type = e),
        (this.content = n),
        (this.alias = t),
        (this.length = 0 | (r || '').length);
    }
    function l(e, n, t, r) {
      e.lastIndex = n;
      var a = e.exec(t);
      if (a && r && a[1]) {
        var i = a[1].length;
        (a.index += i), (a[0] = a[0].slice(i));
      }
      return a;
    }
    function o(e, n, t, r, s, g) {
      for (var f in t)
        if (t.hasOwnProperty(f) && t[f]) {
          var h = t[f];
          h = Array.isArray(h) ? h : [h];
          for (var d = 0; d < h.length; ++d) {
            if (g && g.cause == f + ',' + d) return;
            var v = h[d],
              p = v.inside,
              m = !!v.lookbehind,
              y = !!v.greedy,
              k = v.alias;
            if (y && !v.pattern.global) {
              var x = v.pattern.toString().match(/[imsuy]*$/)[0];
              v.pattern = RegExp(v.pattern.source, x + 'g');
            }
            for (
              var b = v.pattern || v, w = r.next, A = s;
              w !== n.tail && !(g && A >= g.reach);
              A += w.value.length, w = w.next
            ) {
              var E = w.value;
              if (n.length > e.length) return;
              if (!(E instanceof i)) {
                var P,
                  L = 1;
                if (y) {
                  if (!(P = l(b, A, e, m)) || P.index >= e.length) break;
                  var S = P.index,
                    O = P.index + P[0].length,
                    j = A;
                  for (j += w.value.length; S >= j; )
                    j += (w = w.next).value.length;
                  if (((A = j -= w.value.length), w.value instanceof i))
                    continue;
                  for (
                    var C = w;
                    C !== n.tail && (j < O || 'string' == typeof C.value);
                    C = C.next
                  )
                    L++, (j += C.value.length);
                  L--, (E = e.slice(A, j)), (P.index -= A);
                } else if (!(P = l(b, 0, E, m))) continue;
                S = P.index;
                var N = P[0],
                  _ = E.slice(0, S),
                  M = E.slice(S + N.length),
                  W = A + E.length;
                g && W > g.reach && (g.reach = W);
                var z = w.prev;
                if (
                  (_ && ((z = u(n, z, _)), (A += _.length)),
                  c(n, z, L),
                  (w = u(n, z, new i(f, p ? a.tokenize(N, p) : N, k, N))),
                  M && u(n, w, M),
                  L > 1)
                ) {
                  var I = {
                    cause: f + ',' + d,
                    reach: W,
                  };
                  o(e, n, t, w.prev, A, I),
                    g && I.reach > g.reach && (g.reach = I.reach);
                }
              }
            }
          }
        }
    }
    function s() {
      var e = {
          value: null,
          prev: null,
          next: null,
        },
        n = {
          value: null,
          prev: e,
          next: null,
        };
      (e.next = n), (this.head = e), (this.tail = n), (this.length = 0);
    }
    function u(e, n, t) {
      var r = n.next,
        a = {
          value: t,
          prev: n,
          next: r,
        };
      return (n.next = a), (r.prev = a), e.length++, a;
    }
    function c(e, n, t) {
      for (var r = n.next, a = 0; a < t && r !== e.tail; a++) r = r.next;
      (n.next = r), (r.prev = n), (e.length -= a);
    }
    if (
      ((e.Prism = a),
      (i.stringify = function e(n, t) {
        if ('string' == typeof n) return n;
        if (Array.isArray(n)) {
          var r = '';
          return (
            n.forEach(function (n) {
              r += e(n, t);
            }),
            r
          );
        }
        var i = {
            type: n.type,
            content: e(n.content, t),
            tag: 'span',
            classes: ['token', n.type],
            attributes: {},
            language: t,
          },
          l = n.alias;
        l &&
          (Array.isArray(l)
            ? Array.prototype.push.apply(i.classes, l)
            : i.classes.push(l)),
          a.hooks.run('wrap', i);
        var o = '';
        for (var s in i.attributes)
          o +=
            ' ' +
            s +
            '="' +
            (i.attributes[s] || '').replace(/"/g, '&quot;') +
            '"';
        return (
          '<' +
          i.tag +
          ' class="' +
          i.classes.join(' ') +
          '"' +
          o +
          '>' +
          i.content +
          '</' +
          i.tag +
          '>'
        );
      }),
      !e.document)
    )
      return e.addEventListener
        ? (a.disableWorkerMessageHandler ||
            e.addEventListener(
              'message',
              function (n) {
                var t = JSON.parse(n.data),
                  r = t.language,
                  i = t.code,
                  l = t.immediateClose;
                e.postMessage(a.highlight(i, a.languages[r], r)),
                  l && e.close();
              },
              !1,
            ),
          a)
        : a;
    var g = a.util.currentScript();
    function f() {
      a.manual || a.highlightAll();
    }
    if (
      (g &&
        ((a.filename = g.src),
        g.hasAttribute('data-manual') && (a.manual = !0)),
      !a.manual)
    ) {
      var h = document.readyState;
      'loading' === h || ('interactive' === h && g && g.defer)
        ? document.addEventListener('DOMContentLoaded', f)
        : window.requestAnimationFrame
        ? window.requestAnimationFrame(f)
        : window.setTimeout(f, 16);
    }
    return a;
  })(_self);
'undefined' != typeof module && module.exports && (module.exports = Prism),
  'undefined' != typeof global && (global.Prism = Prism);
(Prism.languages.markup = {
  comment: {
    pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
    greedy: !0,
  },
  prolog: {
    pattern: /<\?[\s\S]+?\?>/,
    greedy: !0,
  },
  doctype: {
    pattern:
      /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
    greedy: !0,
    inside: {
      'internal-subset': {
        pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
        lookbehind: !0,
        greedy: !0,
        inside: null,
      },
      string: {
        pattern: /"[^"]*"|'[^']*'/,
        greedy: !0,
      },
      punctuation: /^<!|>$|[[\]]/,
      'doctype-tag': /^DOCTYPE/i,
      name: /[^\s<>'"]+/,
    },
  },
  cdata: {
    pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
    greedy: !0,
  },
  tag: {
    pattern:
      /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
    greedy: !0,
    inside: {
      tag: {
        pattern: /^<\/?[^\s>\/]+/,
        inside: {
          punctuation: /^<\/?/,
          namespace: /^[^\s>\/:]+:/,
        },
      },
      'special-attr': [],
      'attr-value': {
        pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
        inside: {
          punctuation: [
            {
              pattern: /^=/,
              alias: 'attr-equals',
            },
            {
              pattern: /^(\s*)["']|["']$/,
              lookbehind: !0,
            },
          ],
        },
      },
      punctuation: /\/?>/,
      'attr-name': {
        pattern: /[^\s>\/]+/,
        inside: {
          namespace: /^[^\s>\/:]+:/,
        },
      },
    },
  },
  entity: [
    {
      pattern: /&[\da-z]{1,8};/i,
      alias: 'named-entity',
    },
    /&#x?[\da-f]{1,8};/i,
  ],
}),
  (Prism.languages.markup.tag.inside['attr-value'].inside.entity =
    Prism.languages.markup.entity),
  (Prism.languages.markup.doctype.inside['internal-subset'].inside =
    Prism.languages.markup),
  Prism.hooks.add('wrap', function (a) {
    'entity' === a.type &&
      (a.attributes.title = a.content.replace(/&amp;/, '&'));
  }),
  Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
    value: function (a, e) {
      var s = {};
      (s['language-' + e] = {
        pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
        lookbehind: !0,
        inside: Prism.languages[e],
      }),
        (s.cdata = /^<!\[CDATA\[|\]\]>$/i);
      var t = {
        'included-cdata': {
          pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
          inside: s,
        },
      };
      t['language-' + e] = {
        pattern: /[\s\S]+/,
        inside: Prism.languages[e],
      };
      var n = {};
      (n[a] = {
        pattern: RegExp(
          '(<__[^>]*>)(?:<!\\[CDATA\\[(?:[^\\]]|\\](?!\\]>))*\\]\\]>|(?!<!\\[CDATA\\[)[^])*?(?=</__>)'.replace(
            /__/g,
            function () {
              return a;
            },
          ),
          'i',
        ),
        lookbehind: !0,
        greedy: !0,
        inside: t,
      }),
        Prism.languages.insertBefore('markup', 'cdata', n);
    },
  }),
  Object.defineProperty(Prism.languages.markup.tag, 'addAttribute', {
    value: function (a, e) {
      Prism.languages.markup.tag.inside['special-attr'].push({
        pattern: RegExp(
          '(^|["\'\\s])(?:' +
            a +
            ')\\s*=\\s*(?:"[^"]*"|\'[^\']*\'|[^\\s\'">=]+(?=[\\s>]))',
          'i',
        ),
        lookbehind: !0,
        inside: {
          'attr-name': /^[^\s=]+/,
          'attr-value': {
            pattern: /=[\s\S]+/,
            inside: {
              value: {
                pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
                lookbehind: !0,
                alias: [e, 'language-' + e],
                inside: Prism.languages[e],
              },
              punctuation: [
                {
                  pattern: /^=/,
                  alias: 'attr-equals',
                },
                /"|'/,
              ],
            },
          },
        },
      });
    },
  }),
  (Prism.languages.html = Prism.languages.markup),
  (Prism.languages.mathml = Prism.languages.markup),
  (Prism.languages.svg = Prism.languages.markup),
  (Prism.languages.xml = Prism.languages.extend('markup', {})),
  (Prism.languages.ssml = Prism.languages.xml),
  (Prism.languages.atom = Prism.languages.xml),
  (Prism.languages.rss = Prism.languages.xml);
!(function (s) {
  var e =
    /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;
  (s.languages.css = {
    comment: /\/\*[\s\S]*?\*\//,
    atrule: {
      pattern: RegExp(
        '@[\\w-](?:[^;{\\s"\']|\\s+(?!\\s)|' +
          e.source +
          ')*?(?:;|(?=\\s*\\{))',
      ),
      inside: {
        rule: /^@[\w-]+/,
        'selector-function-argument': {
          pattern:
            /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
          lookbehind: !0,
          alias: 'selector',
        },
        keyword: {
          pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
          lookbehind: !0,
        },
      },
    },
    url: {
      pattern: RegExp(
        '\\burl\\((?:' + e.source + '|(?:[^\\\\\r\n()"\']|\\\\[^])*)\\)',
        'i',
      ),
      greedy: !0,
      inside: {
        function: /^url/i,
        punctuation: /^\(|\)$/,
        string: {
          pattern: RegExp('^' + e.source + '$'),
          alias: 'url',
        },
      },
    },
    selector: {
      pattern: RegExp(
        '(^|[{}\\s])[^{}\\s](?:[^{};"\'\\s]|\\s+(?![\\s{])|' +
          e.source +
          ')*(?=\\s*\\{)',
      ),
      lookbehind: !0,
    },
    string: {
      pattern: e,
      greedy: !0,
    },
    property: {
      pattern:
        /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
      lookbehind: !0,
    },
    important: /!important\b/i,
    function: {
      pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
      lookbehind: !0,
    },
    punctuation: /[(){};:,]/,
  }),
    (s.languages.css.atrule.inside.rest = s.languages.css);
  var t = s.languages.markup;
  t && (t.tag.addInlined('style', 'css'), t.tag.addAttribute('style', 'css'));
})(Prism);
Prism.languages.clike = {
  comment: [
    {
      pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
      lookbehind: !0,
      greedy: !0,
    },
    {
      pattern: /(^|[^\\:])\/\/.*/,
      lookbehind: !0,
      greedy: !0,
    },
  ],
  string: {
    pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: !0,
  },
  'class-name': {
    pattern:
      /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
    lookbehind: !0,
    inside: {
      punctuation: /[.\\]/,
    },
  },
  keyword:
    /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
  boolean: /\b(?:false|true)\b/,
  function: /\b\w+(?=\()/,
  number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
  operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
  punctuation: /[{}[\];(),.:]/,
};
(Prism.languages.javascript = Prism.languages.extend('clike', {
  'class-name': [
    Prism.languages.clike['class-name'],
    {
      pattern:
        /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
      lookbehind: !0,
    },
  ],
  keyword: [
    {
      pattern: /((?:^|\})\s*)catch\b/,
      lookbehind: !0,
    },
    {
      pattern:
        /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
      lookbehind: !0,
    },
  ],
  function:
    /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
  number: {
    pattern: RegExp(
      '(^|[^\\w$])(?:NaN|Infinity|0[bB][01]+(?:_[01]+)*n?|0[oO][0-7]+(?:_[0-7]+)*n?|0[xX][\\dA-Fa-f]+(?:_[\\dA-Fa-f]+)*n?|\\d+(?:_\\d+)*n|(?:\\d+(?:_\\d+)*(?:\\.(?:\\d+(?:_\\d+)*)?)?|\\.\\d+(?:_\\d+)*)(?:[Ee][+-]?\\d+(?:_\\d+)*)?)(?![\\w$])',
    ),
    lookbehind: !0,
  },
  operator:
    /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/,
})),
  (Prism.languages.javascript['class-name'][0].pattern =
    /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/),
  Prism.languages.insertBefore('javascript', 'keyword', {
    regex: {
      pattern: RegExp(
        '((?:^|[^$\\w\\xA0-\\uFFFF."\'\\])\\s]|\\b(?:return|yield))\\s*)/(?:(?:\\[(?:[^\\]\\\\\r\n]|\\\\.)*\\]|\\\\.|[^/\\\\\\[\r\n])+/[dgimyus]{0,7}|(?:\\[(?:[^[\\]\\\\\r\n]|\\\\.|\\[(?:[^[\\]\\\\\r\n]|\\\\.|\\[(?:[^[\\]\\\\\r\n]|\\\\.)*\\])*\\])*\\]|\\\\.|[^/\\\\\\[\r\n])+/[dgimyus]{0,7}v[dgimyus]{0,7})(?=(?:\\s|/\\*(?:[^*]|\\*(?!/))*\\*/)*(?:$|[\r\n,.;:})\\]]|//))',
      ),
      lookbehind: !0,
      greedy: !0,
      inside: {
        'regex-source': {
          pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
          lookbehind: !0,
          alias: 'language-regex',
          inside: Prism.languages.regex,
        },
        'regex-delimiter': /^\/|\/$/,
        'regex-flags': /^[a-z]+$/,
      },
    },
    'function-variable': {
      pattern:
        /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
      alias: 'function',
    },
    parameter: [
      {
        pattern:
          /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
        lookbehind: !0,
        inside: Prism.languages.javascript,
      },
      {
        pattern:
          /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
        lookbehind: !0,
        inside: Prism.languages.javascript,
      },
      {
        pattern:
          /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
        lookbehind: !0,
        inside: Prism.languages.javascript,
      },
      {
        pattern:
          /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
        lookbehind: !0,
        inside: Prism.languages.javascript,
      },
    ],
    constant: /\b[A-Z](?:[A-Z_]|\dx?)*\b/,
  }),
  Prism.languages.insertBefore('javascript', 'string', {
    hashbang: {
      pattern: /^#!.*/,
      greedy: !0,
      alias: 'comment',
    },
    'template-string': {
      pattern:
        /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
      greedy: !0,
      inside: {
        'template-punctuation': {
          pattern: /^`|`$/,
          alias: 'string',
        },
        interpolation: {
          pattern:
            /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
          lookbehind: !0,
          inside: {
            'interpolation-punctuation': {
              pattern: /^\$\{|\}$/,
              alias: 'punctuation',
            },
            rest: Prism.languages.javascript,
          },
        },
        string: /[\s\S]+/,
      },
    },
    'string-property': {
      pattern:
        /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
      lookbehind: !0,
      greedy: !0,
      alias: 'property',
    },
  }),
  Prism.languages.insertBefore('javascript', 'operator', {
    'literal-property': {
      pattern:
        /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
      lookbehind: !0,
      alias: 'property',
    },
  }),
  Prism.languages.markup &&
    (Prism.languages.markup.tag.addInlined('script', 'javascript'),
    Prism.languages.markup.tag.addAttribute(
      'on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)',
      'javascript',
    )),
  (Prism.languages.js = Prism.languages.javascript);
Prism.languages.abap = {
  comment: /^\*.*/m,
  string: /(`|')(?:\\.|(?!\1)[^\\\r\n])*\1/,
  'string-template': {
    pattern: /([|}])(?:\\.|[^\\|{\r\n])*(?=[|{])/,
    lookbehind: !0,
    alias: 'string',
  },
  'eol-comment': {
    pattern: /(^|\s)".*/m,
    lookbehind: !0,
    alias: 'comment',
  },
  keyword: {
    pattern:
      /(\s|\.|^)(?:\*-INPUT|\?TO|ABAP-SOURCE|ABBREVIATED|ABS|ABSTRACT|ACCEPT|ACCEPTING|ACCESSPOLICY|ACCORDING|ACOS|ACTIVATION|ACTUAL|ADD|ADD-CORRESPONDING|ADJACENT|AFTER|ALIAS|ALIASES|ALIGN|ALL|ALLOCATE|ALPHA|ANALYSIS|ANALYZER|AND|ANY|APPEND|APPENDAGE|APPENDING|APPLICATION|ARCHIVE|AREA|ARITHMETIC|AS|ASCENDING|ASIN|ASPECT|ASSERT|ASSIGN|ASSIGNED|ASSIGNING|ASSOCIATION|ASYNCHRONOUS|AT|ATAN|ATTRIBUTES|AUTHORITY|AUTHORITY-CHECK|AVG|BACK|BACKGROUND|BACKUP|BACKWARD|BADI|BASE|BEFORE|BEGIN|BETWEEN|BIG|BINARY|BINDING|BIT|BIT-AND|BIT-NOT|BIT-OR|BIT-XOR|BLACK|BLANK|BLANKS|BLOB|BLOCK|BLOCKS|BLUE|BOUND|BOUNDARIES|BOUNDS|BOXED|BREAK-POINT|BT|BUFFER|BY|BYPASSING|BYTE|BYTE-CA|BYTE-CN|BYTE-CO|BYTE-CS|BYTE-NA|BYTE-NS|BYTE-ORDER|C|CA|CALL|CALLING|CASE|CAST|CASTING|CATCH|CEIL|CENTER|CENTERED|CHAIN|CHAIN-INPUT|CHAIN-REQUEST|CHANGE|CHANGING|CHANNELS|CHAR-TO-HEX|CHARACTER|CHARLEN|CHECK|CHECKBOX|CIRCULAR|CI_|CLASS|CLASS-CODING|CLASS-DATA|CLASS-EVENTS|CLASS-METHODS|CLASS-POOL|CLEANUP|CLEAR|CLIENT|CLOB|CLOCK|CLOSE|CN|CNT|CO|COALESCE|CODE|CODING|COLLECT|COLOR|COLUMN|COLUMNS|COL_BACKGROUND|COL_GROUP|COL_HEADING|COL_KEY|COL_NEGATIVE|COL_NORMAL|COL_POSITIVE|COL_TOTAL|COMMENT|COMMENTS|COMMIT|COMMON|COMMUNICATION|COMPARING|COMPONENT|COMPONENTS|COMPRESSION|COMPUTE|CONCAT|CONCATENATE|COND|CONDENSE|CONDITION|CONNECT|CONNECTION|CONSTANTS|CONTEXT|CONTEXTS|CONTINUE|CONTROL|CONTROLS|CONV|CONVERSION|CONVERT|COPIES|COPY|CORRESPONDING|COS|COSH|COUNT|COUNTRY|COVER|CP|CPI|CREATE|CREATING|CRITICAL|CS|CURRENCY|CURRENCY_CONVERSION|CURRENT|CURSOR|CURSOR-SELECTION|CUSTOMER|CUSTOMER-FUNCTION|DANGEROUS|DATA|DATABASE|DATAINFO|DATASET|DATE|DAYLIGHT|DBMAXLEN|DD\/MM\/YY|DD\/MM\/YYYY|DDMMYY|DEALLOCATE|DECIMALS|DECIMAL_SHIFT|DECLARATIONS|DEEP|DEFAULT|DEFERRED|DEFINE|DEFINING|DEFINITION|DELETE|DELETING|DEMAND|DEPARTMENT|DESCENDING|DESCRIBE|DESTINATION|DETAIL|DIALOG|DIRECTORY|DISCONNECT|DISPLAY|DISPLAY-MODE|DISTANCE|DISTINCT|DIV|DIVIDE|DIVIDE-CORRESPONDING|DIVISION|DO|DUMMY|DUPLICATE|DUPLICATES|DURATION|DURING|DYNAMIC|DYNPRO|E|EACH|EDIT|EDITOR-CALL|ELSE|ELSEIF|EMPTY|ENABLED|ENABLING|ENCODING|END|END-ENHANCEMENT-SECTION|END-LINES|END-OF-DEFINITION|END-OF-FILE|END-OF-PAGE|END-OF-SELECTION|ENDAT|ENDCASE|ENDCATCH|ENDCHAIN|ENDCLASS|ENDDO|ENDENHANCEMENT|ENDEXEC|ENDFOR|ENDFORM|ENDFUNCTION|ENDIAN|ENDIF|ENDING|ENDINTERFACE|ENDLOOP|ENDMETHOD|ENDMODULE|ENDON|ENDPROVIDE|ENDSELECT|ENDTRY|ENDWHILE|ENGINEERING|ENHANCEMENT|ENHANCEMENT-POINT|ENHANCEMENT-SECTION|ENHANCEMENTS|ENTRIES|ENTRY|ENVIRONMENT|EQ|EQUAL|EQUIV|ERRORMESSAGE|ERRORS|ESCAPE|ESCAPING|EVENT|EVENTS|EXACT|EXCEPT|EXCEPTION|EXCEPTION-TABLE|EXCEPTIONS|EXCLUDE|EXCLUDING|EXEC|EXECUTE|EXISTS|EXIT|EXIT-COMMAND|EXP|EXPAND|EXPANDING|EXPIRATION|EXPLICIT|EXPONENT|EXPORT|EXPORTING|EXTEND|EXTENDED|EXTENSION|EXTRACT|FAIL|FETCH|FIELD|FIELD-GROUPS|FIELD-SYMBOL|FIELD-SYMBOLS|FIELDS|FILE|FILTER|FILTER-TABLE|FILTERS|FINAL|FIND|FIRST|FIRST-LINE|FIXED-POINT|FKEQ|FKGE|FLOOR|FLUSH|FONT|FOR|FORM|FORMAT|FORWARD|FOUND|FRAC|FRAME|FRAMES|FREE|FRIENDS|FROM|FUNCTION|FUNCTION-POOL|FUNCTIONALITY|FURTHER|GAPS|GE|GENERATE|GET|GIVING|GKEQ|GKGE|GLOBAL|GRANT|GREATER|GREEN|GROUP|GROUPS|GT|HANDLE|HANDLER|HARMLESS|HASHED|HAVING|HDB|HEAD-LINES|HEADER|HEADERS|HEADING|HELP-ID|HELP-REQUEST|HIDE|HIGH|HINT|HOLD|HOTSPOT|I|ICON|ID|IDENTIFICATION|IDENTIFIER|IDS|IF|IGNORE|IGNORING|IMMEDIATELY|IMPLEMENTATION|IMPLEMENTATIONS|IMPLEMENTED|IMPLICIT|IMPORT|IMPORTING|IN|INACTIVE|INCL|INCLUDE|INCLUDES|INCLUDING|INCREMENT|INDEX|INDEX-LINE|INFOTYPES|INHERITING|INIT|INITIAL|INITIALIZATION|INNER|INOUT|INPUT|INSERT|INSTANCES|INTENSIFIED|INTERFACE|INTERFACE-POOL|INTERFACES|INTERNAL|INTERVALS|INTO|INVERSE|INVERTED-DATE|IS|ISO|ITERATOR|ITNO|JOB|JOIN|KEEP|KEEPING|KERNEL|KEY|KEYS|KEYWORDS|KIND|LANGUAGE|LAST|LATE|LAYOUT|LE|LEADING|LEAVE|LEFT|LEFT-JUSTIFIED|LEFTPLUS|LEFTSPACE|LEGACY|LENGTH|LESS|LET|LEVEL|LEVELS|LIKE|LINE|LINE-COUNT|LINE-SELECTION|LINE-SIZE|LINEFEED|LINES|LIST|LIST-PROCESSING|LISTBOX|LITTLE|LLANG|LOAD|LOAD-OF-PROGRAM|LOB|LOCAL|LOCALE|LOCATOR|LOG|LOG-POINT|LOG10|LOGFILE|LOGICAL|LONG|LOOP|LOW|LOWER|LPAD|LPI|LT|M|MAIL|MAIN|MAJOR-ID|MAPPING|MARGIN|MARK|MASK|MATCH|MATCHCODE|MAX|MAXIMUM|MEDIUM|MEMBERS|MEMORY|MESH|MESSAGE|MESSAGE-ID|MESSAGES|MESSAGING|METHOD|METHODS|MIN|MINIMUM|MINOR-ID|MM\/DD\/YY|MM\/DD\/YYYY|MMDDYY|MOD|MODE|MODIF|MODIFIER|MODIFY|MODULE|MOVE|MOVE-CORRESPONDING|MULTIPLY|MULTIPLY-CORRESPONDING|NA|NAME|NAMETAB|NATIVE|NB|NE|NESTED|NESTING|NEW|NEW-LINE|NEW-PAGE|NEW-SECTION|NEXT|NO|NO-DISPLAY|NO-EXTENSION|NO-GAP|NO-GAPS|NO-GROUPING|NO-HEADING|NO-SCROLLING|NO-SIGN|NO-TITLE|NO-TOPOFPAGE|NO-ZERO|NODE|NODES|NON-UNICODE|NON-UNIQUE|NOT|NP|NS|NULL|NUMBER|NUMOFCHAR|O|OBJECT|OBJECTS|OBLIGATORY|OCCURRENCE|OCCURRENCES|OCCURS|OF|OFF|OFFSET|OLE|ON|ONLY|OPEN|OPTION|OPTIONAL|OPTIONS|OR|ORDER|OTHER|OTHERS|OUT|OUTER|OUTPUT|OUTPUT-LENGTH|OVERFLOW|OVERLAY|PACK|PACKAGE|PAD|PADDING|PAGE|PAGES|PARAMETER|PARAMETER-TABLE|PARAMETERS|PART|PARTIALLY|PATTERN|PERCENTAGE|PERFORM|PERFORMING|PERSON|PF|PF-STATUS|PINK|PLACES|POOL|POSITION|POS_HIGH|POS_LOW|PRAGMAS|PRECOMPILED|PREFERRED|PRESERVING|PRIMARY|PRINT|PRINT-CONTROL|PRIORITY|PRIVATE|PROCEDURE|PROCESS|PROGRAM|PROPERTY|PROTECTED|PROVIDE|PUBLIC|PUSHBUTTON|PUT|QUEUE-ONLY|QUICKINFO|RADIOBUTTON|RAISE|RAISING|RANGE|RANGES|RAW|READ|READ-ONLY|READER|RECEIVE|RECEIVED|RECEIVER|RECEIVING|RED|REDEFINITION|REDUCE|REDUCED|REF|REFERENCE|REFRESH|REGEX|REJECT|REMOTE|RENAMING|REPLACE|REPLACEMENT|REPLACING|REPORT|REQUEST|REQUESTED|RESERVE|RESET|RESOLUTION|RESPECTING|RESPONSIBLE|RESULT|RESULTS|RESUMABLE|RESUME|RETRY|RETURN|RETURNCODE|RETURNING|RIGHT|RIGHT-JUSTIFIED|RIGHTPLUS|RIGHTSPACE|RISK|RMC_COMMUNICATION_FAILURE|RMC_INVALID_STATUS|RMC_SYSTEM_FAILURE|ROLE|ROLLBACK|ROUND|ROWS|RTTI|RUN|SAP|SAP-SPOOL|SAVING|SCALE_PRESERVING|SCALE_PRESERVING_SCIENTIFIC|SCAN|SCIENTIFIC|SCIENTIFIC_WITH_LEADING_ZERO|SCREEN|SCROLL|SCROLL-BOUNDARY|SCROLLING|SEARCH|SECONDARY|SECONDS|SECTION|SELECT|SELECT-OPTIONS|SELECTION|SELECTION-SCREEN|SELECTION-SET|SELECTION-SETS|SELECTION-TABLE|SELECTIONS|SELECTOR|SEND|SEPARATE|SEPARATED|SET|SHARED|SHIFT|SHORT|SHORTDUMP-ID|SIGN|SIGN_AS_POSTFIX|SIMPLE|SIN|SINGLE|SINH|SIZE|SKIP|SKIPPING|SMART|SOME|SORT|SORTABLE|SORTED|SOURCE|SPACE|SPECIFIED|SPLIT|SPOOL|SPOTS|SQL|SQLSCRIPT|SQRT|STABLE|STAMP|STANDARD|START-OF-SELECTION|STARTING|STATE|STATEMENT|STATEMENTS|STATIC|STATICS|STATUSINFO|STEP-LOOP|STOP|STRLEN|STRUCTURE|STRUCTURES|STYLE|SUBKEY|SUBMATCHES|SUBMIT|SUBROUTINE|SUBSCREEN|SUBSTRING|SUBTRACT|SUBTRACT-CORRESPONDING|SUFFIX|SUM|SUMMARY|SUMMING|SUPPLIED|SUPPLY|SUPPRESS|SWITCH|SWITCHSTATES|SYMBOL|SYNCPOINTS|SYNTAX|SYNTAX-CHECK|SYNTAX-TRACE|SYSTEM-CALL|SYSTEM-EXCEPTIONS|SYSTEM-EXIT|TAB|TABBED|TABLE|TABLES|TABLEVIEW|TABSTRIP|TAN|TANH|TARGET|TASK|TASKS|TEST|TESTING|TEXT|TEXTPOOL|THEN|THROW|TIME|TIMES|TIMESTAMP|TIMEZONE|TITLE|TITLE-LINES|TITLEBAR|TO|TOKENIZATION|TOKENS|TOP-LINES|TOP-OF-PAGE|TRACE-FILE|TRACE-TABLE|TRAILING|TRANSACTION|TRANSFER|TRANSFORMATION|TRANSLATE|TRANSPORTING|TRMAC|TRUNC|TRUNCATE|TRUNCATION|TRY|TYPE|TYPE-POOL|TYPE-POOLS|TYPES|ULINE|UNASSIGN|UNDER|UNICODE|UNION|UNIQUE|UNIT|UNIT_CONVERSION|UNIX|UNPACK|UNTIL|UNWIND|UP|UPDATE|UPPER|USER|USER-COMMAND|USING|UTF-8|VALID|VALUE|VALUE-REQUEST|VALUES|VARY|VARYING|VERIFICATION-MESSAGE|VERSION|VIA|VIEW|VISIBLE|WAIT|WARNING|WHEN|WHENEVER|WHERE|WHILE|WIDTH|WINDOW|WINDOWS|WITH|WITH-HEADING|WITH-TITLE|WITHOUT|WORD|WORK|WRITE|WRITER|X|XML|XOR|XSD|XSTRLEN|YELLOW|YES|YYMMDD|Z|ZERO|ZONE)(?![\w-])/i,
    lookbehind: !0,
  },
  number: /\b\d+\b/,
  operator: {
    pattern: /(\s)(?:\*\*?|<[=>]?|>=?|\?=|[-+\/=])(?=\s)/,
    lookbehind: !0,
  },
  'string-operator': {
    pattern: /(\s)&&?(?=\s)/,
    lookbehind: !0,
    alias: 'keyword',
  },
  'token-operator': [
    {
      pattern: /(\w)(?:->?|=>|[~|{}])(?=\w)/,
      lookbehind: !0,
      alias: 'punctuation',
    },
    {
      pattern: /[|{}]/,
      alias: 'punctuation',
    },
  ],
  punctuation: /[,.:()]/,
};
!(function (n) {
  var i =
    '(?:ALPHA|BIT|CHAR|CR|CRLF|CTL|DIGIT|DQUOTE|HEXDIG|HTAB|LF|LWSP|OCTET|SP|VCHAR|WSP)';
  n.languages.abnf = {
    comment: /;.*/,
    string: {
      pattern: /(?:%[is])?"[^"\n\r]*"/,
      greedy: !0,
      inside: {
        punctuation: /^%[is]/,
      },
    },
    range: {
      pattern: /%(?:b[01]+-[01]+|d\d+-\d+|x[A-F\d]+-[A-F\d]+)/i,
      alias: 'number',
    },
    terminal: {
      pattern:
        /%(?:b[01]+(?:\.[01]+)*|d\d+(?:\.\d+)*|x[A-F\d]+(?:\.[A-F\d]+)*)/i,
      alias: 'number',
    },
    repetition: {
      pattern: /(^|[^\w-])(?:\d*\*\d*|\d+)/,
      lookbehind: !0,
      alias: 'operator',
    },
    definition: {
      pattern: /(^[ \t]*)(?:[a-z][\w-]*|<[^<>\r\n]*>)(?=\s*=)/m,
      lookbehind: !0,
      alias: 'keyword',
      inside: {
        punctuation: /<|>/,
      },
    },
    'core-rule': {
      pattern: RegExp('(?:(^|[^<\\w-])' + i + '|<' + i + '>)(?![\\w-])', 'i'),
      lookbehind: !0,
      alias: ['rule', 'constant'],
      inside: {
        punctuation: /<|>/,
      },
    },
    rule: {
      pattern: /(^|[^<\w-])[a-z][\w-]*|<[^<>\r\n]*>/i,
      lookbehind: !0,
      inside: {
        punctuation: /<|>/,
      },
    },
    operator: /=\/?|\//,
    punctuation: /[()\[\]]/,
  };
})(Prism);
(Prism.languages.actionscript = Prism.languages.extend('javascript', {
  keyword:
    /\b(?:as|break|case|catch|class|const|default|delete|do|dynamic|each|else|extends|final|finally|for|function|get|if|implements|import|in|include|instanceof|interface|internal|is|namespace|native|new|null|override|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|use|var|void|while|with)\b/,
  operator: /\+\+|--|(?:[+\-*\/%^]|&&?|\|\|?|<<?|>>?>?|[!=]=?)=?|[~?@]/,
})),
  (Prism.languages.actionscript['class-name'].alias = 'function'),
  delete Prism.languages.actionscript.parameter,
  delete Prism.languages.actionscript['literal-property'],
  Prism.languages.markup &&
    Prism.languages.insertBefore('actionscript', 'string', {
      xml: {
        pattern:
          /(^|[^.])<\/?\w+(?:\s+[^\s>\/=]+=("|')(?:\\[\s\S]|(?!\2)[^\\])*\2)*\s*\/?>/,
        lookbehind: !0,
        inside: Prism.languages.markup,
      },
    });
Prism.languages.al = {
  comment: /\/\/.*|\/\*[\s\S]*?\*\//,
  string: {
    pattern: /'(?:''|[^'\r\n])*'(?!')|"(?:""|[^"\r\n])*"(?!")/,
    greedy: !0,
  },
  function: {
    pattern:
      /(\b(?:event|procedure|trigger)\s+|(?:^|[^.])\.\s*)[a-z_]\w*(?=\s*\()/i,
    lookbehind: !0,
  },
  keyword: [
    /\b(?:array|asserterror|begin|break|case|do|downto|else|end|event|exit|for|foreach|function|if|implements|in|indataset|interface|internal|local|of|procedure|program|protected|repeat|runonclient|securityfiltering|suppressdispose|temporary|then|to|trigger|until|var|while|with|withevents)\b/i,
    /\b(?:action|actions|addafter|addbefore|addfirst|addlast|area|assembly|chartpart|codeunit|column|controladdin|cuegroup|customizes|dataitem|dataset|dotnet|elements|enum|enumextension|extends|field|fieldattribute|fieldelement|fieldgroup|fieldgroups|fields|filter|fixed|grid|group|key|keys|label|labels|layout|modify|moveafter|movebefore|movefirst|movelast|page|pagecustomization|pageextension|part|profile|query|repeater|report|requestpage|schema|separator|systempart|table|tableelement|tableextension|textattribute|textelement|type|usercontrol|value|xmlport)\b/i,
  ],
  number:
    /\b(?:0x[\da-f]+|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(?:F|LL?|U(?:LL?)?)?\b/i,
  boolean: /\b(?:false|true)\b/i,
  variable: /\b(?:Curr(?:FieldNo|Page|Report)|x?Rec|RequestOptionsPage)\b/,
  'class-name':
    /\b(?:automation|biginteger|bigtext|blob|boolean|byte|char|clienttype|code|completiontriggererrorlevel|connectiontype|database|dataclassification|datascope|date|dateformula|datetime|decimal|defaultlayout|dialog|dictionary|dotnetassembly|dotnettypedeclaration|duration|errorinfo|errortype|executioncontext|executionmode|fieldclass|fieldref|fieldtype|file|filterpagebuilder|guid|httpclient|httpcontent|httpheaders|httprequestmessage|httpresponsemessage|instream|integer|joker|jsonarray|jsonobject|jsontoken|jsonvalue|keyref|list|moduledependencyinfo|moduleinfo|none|notification|notificationscope|objecttype|option|outstream|pageresult|record|recordid|recordref|reportformat|securityfilter|sessionsettings|tableconnectiontype|tablefilter|testaction|testfield|testfilterfield|testpage|testpermissions|testrequestpage|text|textbuilder|textconst|textencoding|time|transactionmodel|transactiontype|variant|verbosity|version|view|views|webserviceactioncontext|webserviceactionresultcode|xmlattribute|xmlattributecollection|xmlcdata|xmlcomment|xmldeclaration|xmldocument|xmldocumenttype|xmlelement|xmlnamespacemanager|xmlnametable|xmlnode|xmlnodelist|xmlprocessinginstruction|xmlreadoptions|xmltext|xmlwriteoptions)\b/i,
  operator: /\.\.|:[=:]|[-+*/]=?|<>|[<>]=?|=|\b(?:and|div|mod|not|or|xor)\b/i,
  punctuation: /[()\[\]{}:.;,]/,
};
(Prism.languages.antlr4 = {
  comment: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
  string: {
    pattern: /'(?:\\.|[^\\'\r\n])*'/,
    greedy: !0,
  },
  'character-class': {
    pattern: /\[(?:\\.|[^\\\]\r\n])*\]/,
    greedy: !0,
    alias: 'regex',
    inside: {
      range: {
        pattern: /([^[]|(?:^|[^\\])(?:\\\\)*\\\[)-(?!\])/,
        lookbehind: !0,
        alias: 'punctuation',
      },
      escape:
        /\\(?:u(?:[a-fA-F\d]{4}|\{[a-fA-F\d]+\})|[pP]\{[=\w-]+\}|[^\r\nupP])/,
      punctuation: /[\[\]]/,
    },
  },
  action: {
    pattern: /\{(?:[^{}]|\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*\}/,
    greedy: !0,
    inside: {
      content: {
        pattern: /(\{)[\s\S]+(?=\})/,
        lookbehind: !0,
      },
      punctuation: /[{}]/,
    },
  },
  command: {
    pattern:
      /(->\s*(?!\s))(?:\s*(?:,\s*)?\b[a-z]\w*(?:\s*\([^()\r\n]*\))?)+(?=\s*;)/i,
    lookbehind: !0,
    inside: {
      function: /\b\w+(?=\s*(?:[,(]|$))/,
      punctuation: /[,()]/,
    },
  },
  annotation: {
    pattern: /@\w+(?:::\w+)*/,
    alias: 'keyword',
  },
  label: {
    pattern: /#[ \t]*\w+/,
    alias: 'punctuation',
  },
  keyword:
    /\b(?:catch|channels|finally|fragment|grammar|import|lexer|locals|mode|options|parser|returns|throws|tokens)\b/,
  definition: [
    {
      pattern: /\b[a-z]\w*(?=\s*:)/,
      alias: ['rule', 'class-name'],
    },
    {
      pattern: /\b[A-Z]\w*(?=\s*:)/,
      alias: ['token', 'constant'],
    },
  ],
  constant: /\b[A-Z][A-Z_]*\b/,
  operator: /\.\.|->|[|~]|[*+?]\??/,
  punctuation: /[;:()=]/,
}),
  (Prism.languages.g4 = Prism.languages.antlr4);
Prism.languages.apacheconf = {
  comment: /#.*/,
  'directive-inline': {
    pattern:
      /(^[\t ]*)\b(?:AcceptFilter|AcceptPathInfo|AccessFileName|Action|Add(?:Alt|AltByEncoding|AltByType|Charset|DefaultCharset|Description|Encoding|Handler|Icon|IconByEncoding|IconByType|InputFilter|Language|ModuleInfo|OutputFilter|OutputFilterByType|Type)|Alias|AliasMatch|Allow(?:CONNECT|EncodedSlashes|Methods|Override|OverrideList)?|Anonymous(?:_LogEmail|_MustGiveEmail|_NoUserID|_VerifyEmail)?|AsyncRequestWorkerFactor|Auth(?:BasicAuthoritative|BasicFake|BasicProvider|BasicUseDigestAlgorithm|DBDUserPWQuery|DBDUserRealmQuery|DBMGroupFile|DBMType|DBMUserFile|Digest(?:Algorithm|Domain|NonceLifetime|Provider|Qop|ShmemSize)|Form(?:Authoritative|Body|DisableNoStore|FakeBasicAuth|Location|LoginRequiredLocation|LoginSuccessLocation|LogoutLocation|Method|Mimetype|Password|Provider|SitePassphrase|Size|Username)|GroupFile|LDAP(?:AuthorizePrefix|BindAuthoritative|BindDN|BindPassword|CharsetConfig|CompareAsUser|CompareDNOnServer|DereferenceAliases|GroupAttribute|GroupAttributeIsDN|InitialBindAsUser|InitialBindPattern|MaxSubGroupDepth|RemoteUserAttribute|RemoteUserIsDN|SearchAsUser|SubGroupAttribute|SubGroupClass|Url)|Merging|Name|nCache(?:Context|Enable|ProvideFor|SOCache|Timeout)|nzFcgiCheckAuthnProvider|nzFcgiDefineProvider|Type|UserFile|zDBDLoginToReferer|zDBDQuery|zDBDRedirectQuery|zDBMType|zSendForbiddenOnFailure)|BalancerGrowth|BalancerInherit|BalancerMember|BalancerPersist|BrowserMatch|BrowserMatchNoCase|BufferedLogs|BufferSize|Cache(?:DefaultExpire|DetailHeader|DirLength|DirLevels|Disable|Enable|File|Header|IgnoreCacheControl|IgnoreHeaders|IgnoreNoLastMod|IgnoreQueryString|IgnoreURLSessionIdentifiers|KeyBaseURL|LastModifiedFactor|Lock|LockMaxAge|LockPath|MaxExpire|MaxFileSize|MinExpire|MinFileSize|NegotiatedDocs|QuickHandler|ReadSize|ReadTime|Root|Socache(?:MaxSize|MaxTime|MinTime|ReadSize|ReadTime)?|StaleOnError|StoreExpired|StoreNoStore|StorePrivate)|CGIDScriptTimeout|CGIMapExtension|CharsetDefault|CharsetOptions|CharsetSourceEnc|CheckCaseOnly|CheckSpelling|ChrootDir|ContentDigest|CookieDomain|CookieExpires|CookieName|CookieStyle|CookieTracking|CoreDumpDirectory|CustomLog|Dav|DavDepthInfinity|DavGenericLockDB|DavLockDB|DavMinTimeout|DBDExptime|DBDInitSQL|DBDKeep|DBDMax|DBDMin|DBDParams|DBDPersist|DBDPrepareSQL|DBDriver|DefaultIcon|DefaultLanguage|DefaultRuntimeDir|DefaultType|Define|Deflate(?:BufferSize|CompressionLevel|FilterNote|InflateLimitRequestBody|InflateRatio(?:Burst|Limit)|MemLevel|WindowSize)|Deny|DirectoryCheckHandler|DirectoryIndex|DirectoryIndexRedirect|DirectorySlash|DocumentRoot|DTracePrivileges|DumpIOInput|DumpIOOutput|EnableExceptionHook|EnableMMAP|EnableSendfile|Error|ErrorDocument|ErrorLog|ErrorLogFormat|Example|ExpiresActive|ExpiresByType|ExpiresDefault|ExtendedStatus|ExtFilterDefine|ExtFilterOptions|FallbackResource|FileETag|FilterChain|FilterDeclare|FilterProtocol|FilterProvider|FilterTrace|ForceLanguagePriority|ForceType|ForensicLog|GprofDir|GracefulShutdownTimeout|Group|Header|HeaderName|Heartbeat(?:Address|Listen|MaxServers|Storage)|HostnameLookups|IdentityCheck|IdentityCheckTimeout|ImapBase|ImapDefault|ImapMenu|Include|IncludeOptional|Index(?:HeadInsert|Ignore|IgnoreReset|Options|OrderDefault|StyleSheet)|InputSed|ISAPI(?:AppendLogToErrors|AppendLogToQuery|CacheFile|FakeAsync|LogNotSupported|ReadAheadBuffer)|KeepAlive|KeepAliveTimeout|KeptBodySize|LanguagePriority|LDAP(?:CacheEntries|CacheTTL|ConnectionPoolTTL|ConnectionTimeout|LibraryDebug|OpCacheEntries|OpCacheTTL|ReferralHopLimit|Referrals|Retries|RetryDelay|SharedCacheFile|SharedCacheSize|Timeout|TrustedClientCert|TrustedGlobalCert|TrustedMode|VerifyServerCert)|Limit(?:InternalRecursion|Request(?:Body|Fields|FieldSize|Line)|XMLRequestBody)|Listen|ListenBackLog|LoadFile|LoadModule|LogFormat|LogLevel|LogMessage|LuaAuthzProvider|LuaCodeCache|Lua(?:Hook(?:AccessChecker|AuthChecker|CheckUserID|Fixups|InsertFilter|Log|MapToStorage|TranslateName|TypeChecker)|Inherit|InputFilter|MapHandler|OutputFilter|PackageCPath|PackagePath|QuickHandler|Root|Scope)|Max(?:ConnectionsPerChild|KeepAliveRequests|MemFree|RangeOverlaps|RangeReversals|Ranges|RequestWorkers|SpareServers|SpareThreads|Threads)|MergeTrailers|MetaDir|MetaFiles|MetaSuffix|MimeMagicFile|MinSpareServers|MinSpareThreads|MMapFile|ModemStandard|ModMimeUsePathInfo|MultiviewsMatch|Mutex|NameVirtualHost|NoProxy|NWSSLTrustedCerts|NWSSLUpgradeable|Options|Order|OutputSed|PassEnv|PidFile|PrivilegesMode|Protocol|ProtocolEcho|Proxy(?:AddHeaders|BadHeader|Block|Domain|ErrorOverride|ExpressDBMFile|ExpressDBMType|ExpressEnable|FtpDirCharset|FtpEscapeWildcards|FtpListOnWildcard|HTML(?:BufSize|CharsetOut|DocType|Enable|Events|Extended|Fixups|Interp|Links|Meta|StripComments|URLMap)|IOBufferSize|MaxForwards|Pass(?:Inherit|InterpolateEnv|Match|Reverse|ReverseCookieDomain|ReverseCookiePath)?|PreserveHost|ReceiveBufferSize|Remote|RemoteMatch|Requests|SCGIInternalRedirect|SCGISendfile|Set|SourceAddress|Status|Timeout|Via)|ReadmeName|ReceiveBufferSize|Redirect|RedirectMatch|RedirectPermanent|RedirectTemp|ReflectorHeader|RemoteIP(?:Header|InternalProxy|InternalProxyList|ProxiesHeader|TrustedProxy|TrustedProxyList)|RemoveCharset|RemoveEncoding|RemoveHandler|RemoveInputFilter|RemoveLanguage|RemoveOutputFilter|RemoveType|RequestHeader|RequestReadTimeout|Require|Rewrite(?:Base|Cond|Engine|Map|Options|Rule)|RLimitCPU|RLimitMEM|RLimitNPROC|Satisfy|ScoreBoardFile|Script(?:Alias|AliasMatch|InterpreterSource|Log|LogBuffer|LogLength|Sock)?|SecureListen|SeeRequestTail|SendBufferSize|Server(?:Admin|Alias|Limit|Name|Path|Root|Signature|Tokens)|Session(?:Cookie(?:Name|Name2|Remove)|Crypto(?:Cipher|Driver|Passphrase|PassphraseFile)|DBD(?:CookieName|CookieName2|CookieRemove|DeleteLabel|InsertLabel|PerUser|SelectLabel|UpdateLabel)|Env|Exclude|Header|Include|MaxAge)?|SetEnv|SetEnvIf|SetEnvIfExpr|SetEnvIfNoCase|SetHandler|SetInputFilter|SetOutputFilter|SSIEndTag|SSIErrorMsg|SSIETag|SSILastModified|SSILegacyExprParser|SSIStartTag|SSITimeFormat|SSIUndefinedEcho|SSL(?:CACertificateFile|CACertificatePath|CADNRequestFile|CADNRequestPath|CARevocationCheck|CARevocationFile|CARevocationPath|CertificateChainFile|CertificateFile|CertificateKeyFile|CipherSuite|Compression|CryptoDevice|Engine|FIPS|HonorCipherOrder|InsecureRenegotiation|OCSP(?:DefaultResponder|Enable|OverrideResponder|ResponderTimeout|ResponseMaxAge|ResponseTimeSkew|UseRequestNonce)|OpenSSLConfCmd|Options|PassPhraseDialog|Protocol|Proxy(?:CACertificateFile|CACertificatePath|CARevocation(?:Check|File|Path)|CheckPeer(?:CN|Expire|Name)|CipherSuite|Engine|MachineCertificate(?:ChainFile|File|Path)|Protocol|Verify|VerifyDepth)|RandomSeed|RenegBufferSize|Require|RequireSSL|Session(?:Cache|CacheTimeout|TicketKeyFile|Tickets)|SRPUnknownUserSeed|SRPVerifierFile|Stapling(?:Cache|ErrorCacheTimeout|FakeTryLater|ForceURL|ResponderTimeout|ResponseMaxAge|ResponseTimeSkew|ReturnResponderErrors|StandardCacheTimeout)|StrictSNIVHostCheck|UserName|UseStapling|VerifyClient|VerifyDepth)|StartServers|StartThreads|Substitute|Suexec|SuexecUserGroup|ThreadLimit|ThreadsPerChild|ThreadStackSize|TimeOut|TraceEnable|TransferLog|TypesConfig|UnDefine|UndefMacro|UnsetEnv|Use|UseCanonicalName|UseCanonicalPhysicalPort|User|UserDir|VHostCGIMode|VHostCGIPrivs|VHostGroup|VHostPrivs|VHostSecure|VHostUser|Virtual(?:DocumentRoot|ScriptAlias)(?:IP)?|WatchdogInterval|XBitHack|xml2EncAlias|xml2EncDefault|xml2StartParse)\b/im,
    lookbehind: !0,
    alias: 'property',
  },
  'directive-block': {
    pattern:
      /<\/?\b(?:Auth[nz]ProviderAlias|Directory|DirectoryMatch|Else|ElseIf|Files|FilesMatch|If|IfDefine|IfModule|IfVersion|Limit|LimitExcept|Location|LocationMatch|Macro|Proxy|Require(?:All|Any|None)|VirtualHost)\b.*>/i,
    inside: {
      'directive-block': {
        pattern: /^<\/?\w+/,
        inside: {
          punctuation: /^<\/?/,
        },
        alias: 'tag',
      },
      'directive-block-parameter': {
        pattern: /.*[^>]/,
        inside: {
          punctuation: /:/,
          string: {
            pattern: /("|').*\1/,
            inside: {
              variable: /[$%]\{?(?:\w\.?[-+:]?)+\}?/,
            },
          },
        },
        alias: 'attr-value',
      },
      punctuation: />/,
    },
    alias: 'tag',
  },
  'directive-flags': {
    pattern: /\[(?:[\w=],?)+\]/,
    alias: 'keyword',
  },
  string: {
    pattern: /("|').*\1/,
    inside: {
      variable: /[$%]\{?(?:\w\.?[-+:]?)+\}?/,
    },
  },
  variable: /[$%]\{?(?:\w\.?[-+:]?)+\}?/,
  regex: /\^?.*\$|\^.*\$?/,
};
Prism.languages.apl = {
  comment: /(?:⍝|#[! ]).*$/m,
  string: {
    pattern: /'(?:[^'\r\n]|'')*'/,
    greedy: !0,
  },
  number:
    /¯?(?:\d*\.?\b\d+(?:e[+¯]?\d+)?|¯|∞)(?:j¯?(?:(?:\d+(?:\.\d+)?|\.\d+)(?:e[+¯]?\d+)?|¯|∞))?/i,
  statement: /:[A-Z][a-z][A-Za-z]*\b/,
  'system-function': {
    pattern: /⎕[A-Z]+/i,
    alias: 'function',
  },
  constant: /[⍬⌾#⎕⍞]/,
  function: /[-+×÷⌈⌊∣|⍳⍸?*⍟○!⌹<≤=>≥≠≡≢∊⍷∪∩~∨∧⍱⍲⍴,⍪⌽⊖⍉↑↓⊂⊃⊆⊇⌷⍋⍒⊤⊥⍕⍎⊣⊢⍁⍂≈⍯↗¤→]/,
  'monadic-operator': {
    pattern: /[\\\/⌿⍀¨⍨⌶&∥]/,
    alias: 'operator',
  },
  'dyadic-operator': {
    pattern: /[.⍣⍠⍤∘⌸@⌺⍥]/,
    alias: 'operator',
  },
  assignment: {
    pattern: /←/,
    alias: 'keyword',
  },
  punctuation: /[\[;\]()◇⋄]/,
  dfn: {
    pattern: /[{}⍺⍵⍶⍹∇⍫:]/,
    alias: 'builtin',
  },
};
Prism.languages.applescript = {
  comment: [
    /\(\*(?:\(\*(?:[^*]|\*(?!\)))*\*\)|(?!\(\*)[\s\S])*?\*\)/,
    /--.+/,
    /#.+/,
  ],
  string: /"(?:\\.|[^"\\\r\n])*"/,
  number: /(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e-?\d+)?\b/i,
  operator: [
    /[&=≠≤≥*+\-\/÷^]|[<>]=?/,
    /\b(?:(?:begin|end|start)s? with|(?:contains?|(?:does not|doesn't) contain)|(?:is|isn't|is not) (?:contained by|in)|(?:(?:is|isn't|is not) )?(?:greater|less) than(?: or equal)?(?: to)?|(?:comes|(?:does not|doesn't) come) (?:after|before)|(?:is|isn't|is not) equal(?: to)?|(?:(?:does not|doesn't) equal|equal to|equals|is not|isn't)|(?:a )?(?:ref(?: to)?|reference to)|(?:and|as|div|mod|not|or))\b/,
  ],
  keyword:
    /\b(?:about|above|after|against|apart from|around|aside from|at|back|before|beginning|behind|below|beneath|beside|between|but|by|considering|continue|copy|does|eighth|else|end|equal|error|every|exit|false|fifth|first|for|fourth|from|front|get|given|global|if|ignoring|in|instead of|into|is|it|its|last|local|me|middle|my|ninth|of|on|onto|out of|over|prop|property|put|repeat|return|returning|second|set|seventh|since|sixth|some|tell|tenth|that|the|then|third|through|thru|timeout|times|to|transaction|true|try|until|where|while|whose|with|without)\b/,
  'class-name':
    /\b(?:POSIX file|RGB color|alias|application|boolean|centimeters|centimetres|class|constant|cubic centimeters|cubic centimetres|cubic feet|cubic inches|cubic meters|cubic metres|cubic yards|date|degrees Celsius|degrees Fahrenheit|degrees Kelvin|feet|file|gallons|grams|inches|integer|kilograms|kilometers|kilometres|list|liters|litres|meters|metres|miles|number|ounces|pounds|quarts|real|record|reference|script|square feet|square kilometers|square kilometres|square meters|square metres|square miles|square yards|text|yards)\b/,
  punctuation: /[{}():,¬«»《》]/,
};
(Prism.languages.c = Prism.languages.extend('clike', {
  comment: {
    pattern:
      /\/\/(?:[^\r\n\\]|\\(?:\r\n?|\n|(?![\r\n])))*|\/\*[\s\S]*?(?:\*\/|$)/,
    greedy: !0,
  },
  string: {
    pattern: /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,
    greedy: !0,
  },
  'class-name': {
    pattern:
      /(\b(?:enum|struct)\s+(?:__attribute__\s*\(\([\s\S]*?\)\)\s*)?)\w+|\b[a-z]\w*_t\b/,
    lookbehind: !0,
  },
  keyword:
    /\b(?:_Alignas|_Alignof|_Atomic|_Bool|_Complex|_Generic|_Imaginary|_Noreturn|_Static_assert|_Thread_local|__attribute__|asm|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|typeof|union|unsigned|void|volatile|while)\b/,
  function: /\b[a-z_]\w*(?=\s*\()/i,
  number:
    /(?:\b0x(?:[\da-f]+(?:\.[\da-f]*)?|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?)[ful]{0,4}/i,
  operator: />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?/,
})),
  Prism.languages.insertBefore('c', 'string', {
    char: {
      pattern: /'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n]){0,32}'/,
      greedy: !0,
    },
  }),
  Prism.languages.insertBefore('c', 'string', {
    macro: {
      pattern:
        /(^[\t ]*)#\s*[a-z](?:[^\r\n\\/]|\/(?!\*)|\/\*(?:[^*]|\*(?!\/))*\*\/|\\(?:\r\n|[\s\S]))*/im,
      lookbehind: !0,
      greedy: !0,
      alias: 'property',
      inside: {
        string: [
          {
            pattern: /^(#\s*include\s*)<[^>]+>/,
            lookbehind: !0,
          },
          Prism.languages.c.string,
        ],
        char: Prism.languages.c.char,
        comment: Prism.languages.c.comment,
        'macro-name': [
          {
            pattern: /(^#\s*define\s+)\w+\b(?!\()/i,
            lookbehind: !0,
          },
          {
            pattern: /(^#\s*define\s+)\w+\b(?=\()/i,
            lookbehind: !0,
            alias: 'function',
          },
        ],
        directive: {
          pattern: /^(#\s*)[a-z]+/,
          lookbehind: !0,
          alias: 'keyword',
        },
        'directive-hash': /^#/,
        punctuation: /##|\\(?=[\r\n])/,
        expression: {
          pattern: /\S[\s\S]*/,
          inside: Prism.languages.c,
        },
      },
    },
  }),
  Prism.languages.insertBefore('c', 'function', {
    constant:
      /\b(?:EOF|NULL|SEEK_CUR|SEEK_END|SEEK_SET|__DATE__|__FILE__|__LINE__|__TIMESTAMP__|__TIME__|__func__|stderr|stdin|stdout)\b/,
  }),
  delete Prism.languages.c.boolean;
!(function (e) {
  var t =
      /\b(?:alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|char8_t|class|co_await|co_return|co_yield|compl|concept|const|const_cast|consteval|constexpr|constinit|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|final|float|for|friend|goto|if|import|inline|int|int16_t|int32_t|int64_t|int8_t|long|module|mutable|namespace|new|noexcept|nullptr|operator|override|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|uint16_t|uint32_t|uint64_t|uint8_t|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/,
    n = '\\b(?!<keyword>)\\w+(?:\\s*\\.\\s*\\w+)*\\b'.replace(
      /<keyword>/g,
      function () {
        return t.source;
      },
    );
  (e.languages.cpp = e.languages.extend('c', {
    'class-name': [
      {
        pattern: RegExp(
          '(\\b(?:class|concept|enum|struct|typename)\\s+)(?!<keyword>)\\w+'.replace(
            /<keyword>/g,
            function () {
              return t.source;
            },
          ),
        ),
        lookbehind: !0,
      },
      /\b[A-Z]\w*(?=\s*::\s*\w+\s*\()/,
      /\b[A-Z_]\w*(?=\s*::\s*~\w+\s*\()/i,
      /\b\w+(?=\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>\s*::\s*\w+\s*\()/,
    ],
    keyword: t,
    number: {
      pattern:
        /(?:\b0b[01']+|\b0x(?:[\da-f']+(?:\.[\da-f']*)?|\.[\da-f']+)(?:p[+-]?[\d']+)?|(?:\b[\d']+(?:\.[\d']*)?|\B\.[\d']+)(?:e[+-]?[\d']+)?)[ful]{0,4}/i,
      greedy: !0,
    },
    operator:
      />>=?|<<=?|->|--|\+\+|&&|\|\||[?:~]|<=>|[-+*/%&|^!=<>]=?|\b(?:and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/,
    boolean: /\b(?:false|true)\b/,
  })),
    e.languages.insertBefore('cpp', 'string', {
      module: {
        pattern: RegExp(
          '(\\b(?:import|module)\\s+)(?:"(?:\\\\(?:\r\n|[^])|[^"\\\\\r\n])*"|<[^<>\r\n]*>|' +
            '<mod-name>(?:\\s*:\\s*<mod-name>)?|:\\s*<mod-name>'.replace(
              /<mod-name>/g,
              function () {
                return n;
              },
            ) +
            ')',
        ),
        lookbehind: !0,
        greedy: !0,
        inside: {
          string: /^[<"][\s\S]+/,
          operator: /:/,
          punctuation: /\./,
        },
      },
      'raw-string': {
        pattern: /R"([^()\\ ]{0,16})\([\s\S]*?\)\1"/,
        alias: 'string',
        greedy: !0,
      },
    }),
    e.languages.insertBefore('cpp', 'keyword', {
      'generic-function': {
        pattern: /\b(?!operator\b)[a-z_]\w*\s*<(?:[^<>]|<[^<>]*>)*>(?=\s*\()/i,
        inside: {
          function: /^\w+/,
          generic: {
            pattern: /<[\s\S]+/,
            alias: 'class-name',
            inside: e.languages.cpp,
          },
        },
      },
    }),
    e.languages.insertBefore('cpp', 'operator', {
      'double-colon': {
        pattern: /::/,
        alias: 'punctuation',
      },
    }),
    e.languages.insertBefore('cpp', 'class-name', {
      'base-clause': {
        pattern:
          /(\b(?:class|struct)\s+\w+\s*:\s*)[^;{}"'\s]+(?:\s+[^;{}"'\s]+)*(?=\s*[;{])/,
        lookbehind: !0,
        greedy: !0,
        inside: e.languages.extend('cpp', {}),
      },
    }),
    e.languages.insertBefore(
      'inside',
      'double-colon',
      {
        'class-name': /\b[a-z_]\w*\b(?!\s*::)/i,
      },
      e.languages.cpp['base-clause'],
    );
})(Prism);
(Prism.languages.arduino = Prism.languages.extend('cpp', {
  keyword:
    /\b(?:String|array|bool|boolean|break|byte|case|catch|continue|default|do|double|else|finally|for|function|goto|if|in|instanceof|int|integer|long|loop|new|null|return|setup|string|switch|throw|try|void|while|word)\b/,
  constant:
    /\b(?:ANALOG_MESSAGE|DEFAULT|DIGITAL_MESSAGE|EXTERNAL|FIRMATA_STRING|HIGH|INPUT|INPUT_PULLUP|INTERNAL|INTERNAL1V1|INTERNAL2V56|LED_BUILTIN|LOW|OUTPUT|REPORT_ANALOG|REPORT_DIGITAL|SET_PIN_MODE|SYSEX_START|SYSTEM_RESET)\b/,
  builtin:
    /\b(?:Audio|BSSID|Bridge|Client|Console|EEPROM|Esplora|EsploraTFT|Ethernet|EthernetClient|EthernetServer|EthernetUDP|File|FileIO|FileSystem|Firmata|GPRS|GSM|GSMBand|GSMClient|GSMModem|GSMPIN|GSMScanner|GSMServer|GSMVoiceCall|GSM_SMS|HttpClient|IPAddress|IRread|Keyboard|KeyboardController|LiquidCrystal|LiquidCrystal_I2C|Mailbox|Mouse|MouseController|PImage|Process|RSSI|RobotControl|RobotMotor|SD|SPI|SSID|Scheduler|Serial|Server|Servo|SoftwareSerial|Stepper|Stream|TFT|Task|USBHost|WiFi|WiFiClient|WiFiServer|WiFiUDP|Wire|YunClient|YunServer|abs|addParameter|analogRead|analogReadResolution|analogReference|analogWrite|analogWriteResolution|answerCall|attach|attachGPRS|attachInterrupt|attached|autoscroll|available|background|beep|begin|beginPacket|beginSD|beginSMS|beginSpeaker|beginTFT|beginTransmission|beginWrite|bit|bitClear|bitRead|bitSet|bitWrite|blink|blinkVersion|buffer|changePIN|checkPIN|checkPUK|checkReg|circle|cityNameRead|cityNameWrite|clear|clearScreen|click|close|compassRead|config|connect|connected|constrain|cos|countryNameRead|countryNameWrite|createChar|cursor|debugPrint|delay|delayMicroseconds|detach|detachInterrupt|digitalRead|digitalWrite|disconnect|display|displayLogos|drawBMP|drawCompass|encryptionType|end|endPacket|endSMS|endTransmission|endWrite|exists|exitValue|fill|find|findUntil|flush|gatewayIP|get|getAsynchronously|getBand|getButton|getCurrentCarrier|getIMEI|getKey|getModifiers|getOemKey|getPINUsed|getResult|getSignalStrength|getSocket|getVoiceCallStatus|getXChange|getYChange|hangCall|height|highByte|home|image|interrupts|isActionDone|isDirectory|isListening|isPIN|isPressed|isValid|keyPressed|keyReleased|keyboardRead|knobRead|leftToRight|line|lineFollowConfig|listen|listenOnLocalhost|loadImage|localIP|lowByte|macAddress|maintain|map|max|messageAvailable|micros|millis|min|mkdir|motorsStop|motorsWrite|mouseDragged|mouseMoved|mousePressed|mouseReleased|move|noAutoscroll|noBlink|noBuffer|noCursor|noDisplay|noFill|noInterrupts|noListenOnLocalhost|noStroke|noTone|onReceive|onRequest|open|openNextFile|overflow|parseCommand|parseFloat|parseInt|parsePacket|pauseMode|peek|pinMode|playFile|playMelody|point|pointTo|position|pow|prepare|press|print|printFirmwareVersion|printVersion|println|process|processInput|pulseIn|put|random|randomSeed|read|readAccelerometer|readBlue|readButton|readBytes|readBytesUntil|readGreen|readJoystickButton|readJoystickSwitch|readJoystickX|readJoystickY|readLightSensor|readMessage|readMicrophone|readNetworks|readRed|readSlider|readString|readStringUntil|readTemperature|ready|rect|release|releaseAll|remoteIP|remoteNumber|remotePort|remove|requestFrom|retrieveCallingNumber|rewindDirectory|rightToLeft|rmdir|robotNameRead|robotNameWrite|run|runAsynchronously|runShellCommand|runShellCommandAsynchronously|running|scanNetworks|scrollDisplayLeft|scrollDisplayRight|seek|sendAnalog|sendDigitalPortPair|sendDigitalPorts|sendString|sendSysex|serialEvent|setBand|setBitOrder|setClockDivider|setCursor|setDNS|setDataMode|setFirmwareVersion|setMode|setPINUsed|setSpeed|setTextSize|setTimeout|shiftIn|shiftOut|shutdown|sin|size|sqrt|startLoop|step|stop|stroke|subnetMask|switchPIN|tan|tempoWrite|text|tone|transfer|tuneWrite|turn|updateIR|userNameRead|userNameWrite|voiceCall|waitContinue|width|write|writeBlue|writeGreen|writeJSON|writeMessage|writeMicroseconds|writeRGB|writeRed|yield)\b/,
})),
  (Prism.languages.ino = Prism.languages.arduino);
Prism.languages.arff = {
  comment: /%.*/,
  string: {
    pattern: /(["'])(?:\\.|(?!\1)[^\\\r\n])*\1/,
    greedy: !0,
  },
  keyword: /@(?:attribute|data|end|relation)\b/i,
  number: /\b\d+(?:\.\d+)?\b/,
  punctuation: /[{},]/,
};
(Prism.languages.armasm = {
  comment: {
    pattern: /;.*/,
    greedy: !0,
  },
  string: {
    pattern: /"(?:[^"\r\n]|"")*"/,
    greedy: !0,
    inside: {
      variable: {
        pattern: /((?:^|[^$])(?:\${2})*)\$\w+/,
        lookbehind: !0,
      },
    },
  },
  char: {
    pattern: /'(?:[^'\r\n]{0,4}|'')'/,
    greedy: !0,
  },
  'version-symbol': {
    pattern: /\|[\w@]+\|/,
    greedy: !0,
    alias: 'property',
  },
  boolean: /\b(?:FALSE|TRUE)\b/,
  directive: {
    pattern:
      /\b(?:ALIAS|ALIGN|AREA|ARM|ASSERT|ATTR|CN|CODE|CODE16|CODE32|COMMON|CP|DATA|DCB|DCD|DCDO|DCDU|DCFD|DCFDU|DCI|DCQ|DCQU|DCW|DCWU|DN|ELIF|ELSE|END|ENDFUNC|ENDIF|ENDP|ENTRY|EQU|EXPORT|EXPORTAS|EXTERN|FIELD|FILL|FN|FUNCTION|GBLA|GBLL|GBLS|GET|GLOBAL|IF|IMPORT|INCBIN|INCLUDE|INFO|KEEP|LCLA|LCLL|LCLS|LTORG|MACRO|MAP|MEND|MEXIT|NOFP|OPT|PRESERVE8|PROC|QN|READONLY|RELOC|REQUIRE|REQUIRE8|RLIST|ROUT|SETA|SETL|SETS|SN|SPACE|SUBT|THUMB|THUMBX|TTL|WEND|WHILE)\b/,
    alias: 'property',
  },
  instruction: {
    pattern:
      /((?:^|(?:^|[^\\])(?:\r\n?|\n))[ \t]*(?:(?:[A-Z][A-Z0-9_]*[a-z]\w*|[a-z]\w*|\d+)[ \t]+)?)\b[A-Z.]+\b/,
    lookbehind: !0,
    alias: 'keyword',
  },
  variable: /\$\w+/,
  number:
    /(?:\b[2-9]_\d+|(?:\b\d+(?:\.\d+)?|\B\.\d+)(?:e-?\d+)?|\b0(?:[fd]_|x)[0-9a-f]+|&[0-9a-f]+)\b/i,
  register: {
    pattern: /\b(?:r\d|lr)\b/,
    alias: 'symbol',
  },
  operator: /<>|<<|>>|&&|\|\||[=!<>/]=?|[+\-*%#?&|^]|:[A-Z]+:/,
  punctuation: /[()[\],]/,
}),
  (Prism.languages['arm-asm'] = Prism.languages.armasm);
!(function (e) {
  var a = function (a, t) {
    return {
      pattern: RegExp('\\{!(?:' + (t || a) + ')$[^]*\\}', 'm'),
      greedy: !0,
      inside: {
        embedded: {
          pattern: /(^\{!\w+\b)[\s\S]+(?=\}$)/,
          lookbehind: !0,
          alias: 'language-' + a,
          inside: e.languages[a],
        },
        string: /[\s\S]+/,
      },
    };
  };
  (e.languages.arturo = {
    comment: {
      pattern: /;.*/,
      greedy: !0,
    },
    character: {
      pattern: /`.`/,
      alias: 'char',
      greedy: !0,
    },
    number: {
      pattern: /\b\d+(?:\.\d+(?:\.\d+(?:-[\w+-]+)?)?)?\b/,
    },
    string: {
      pattern: /"(?:[^"\\\r\n]|\\.)*"/,
      greedy: !0,
    },
    regex: {
      pattern: /\{\/.*?\/\}/,
      greedy: !0,
    },
    'html-string': a('html'),
    'css-string': a('css'),
    'js-string': a('js'),
    'md-string': a('md'),
    'sql-string': a('sql'),
    'sh-string': a('shell', 'sh'),
    multistring: {
      pattern: /».*|\{:[\s\S]*?:\}|\{[\s\S]*?\}|^-{6}$[\s\S]*/m,
      alias: 'string',
      greedy: !0,
    },
    label: {
      pattern: /\w+\b\??:/,
      alias: 'property',
    },
    literal: {
      pattern: /'(?:\w+\b\??:?)/,
      alias: 'constant',
    },
    type: {
      pattern: /:(?:\w+\b\??:?)/,
      alias: 'class-name',
    },
    color: /#\w+/,
    predicate: {
      pattern:
        /\b(?:all|and|any|ascii|attr|attribute|attributeLabel|binary|block|char|contains|database|date|dictionary|empty|equal|even|every|exists|false|floating|function|greater|greaterOrEqual|if|in|inline|integer|is|key|label|leap|less|lessOrEqual|literal|logical|lower|nand|negative|nor|not|notEqual|null|numeric|odd|or|path|pathLabel|positive|prefix|prime|regex|same|set|some|sorted|standalone|string|subset|suffix|superset|symbol|symbolLiteral|true|try|type|unless|upper|when|whitespace|word|xnor|xor|zero)\?/,
      alias: 'keyword',
    },
    'builtin-function': {
      pattern:
        /\b(?:abs|acos|acosh|acsec|acsech|actan|actanh|add|after|alert|alias|and|angle|append|arg|args|arity|array|as|asec|asech|asin|asinh|atan|atan2|atanh|attr|attrs|average|before|benchmark|blend|break|call|capitalize|case|ceil|chop|clear|clip|close|color|combine|conj|continue|copy|cos|cosh|crc|csec|csech|ctan|ctanh|cursor|darken|dec|decode|define|delete|desaturate|deviation|dialog|dictionary|difference|digest|digits|div|do|download|drop|dup|e|else|empty|encode|ensure|env|escape|execute|exit|exp|extend|extract|factors|fdiv|filter|first|flatten|floor|fold|from|function|gamma|gcd|get|goto|hash|hypot|if|inc|indent|index|infinity|info|input|insert|inspect|intersection|invert|jaro|join|keys|kurtosis|last|let|levenshtein|lighten|list|ln|log|loop|lower|mail|map|match|max|median|min|mod|module|mul|nand|neg|new|nor|normalize|not|now|null|open|or|outdent|pad|palette|panic|path|pause|permissions|permutate|pi|pop|popup|pow|powerset|powmod|prefix|print|prints|process|product|query|random|range|read|relative|remove|rename|render|repeat|replace|request|return|reverse|round|sample|saturate|script|sec|sech|select|serve|set|shl|shr|shuffle|sin|sinh|size|skewness|slice|sort|spin|split|sqrt|squeeze|stack|strip|sub|suffix|sum|switch|symbols|symlink|sys|take|tan|tanh|terminal|terminate|to|truncate|try|type|unclip|union|unique|unless|until|unzip|upper|values|var|variance|volume|webview|while|with|wordwrap|write|xnor|xor|zip)\b/,
      alias: 'keyword',
    },
    sugar: {
      pattern: /->|=>|\||::/,
      alias: 'operator',
    },
    punctuation: /[()[\],]/,
    symbol: {
      pattern: /<:|-:|ø|@|#|\+|\||\*|\$|---|-|%|\/|\.\.|\^|~|=|<|>|\\/,
    },
    boolean: {
      pattern: /\b(?:false|maybe|true)\b/,
    },
  }),
    (e.languages.art = e.languages.arturo);
})(Prism);
!(function (t) {
  var n = {
      pattern:
        /(^[ \t]*)\[(?!\[)(?:(["'$`])(?:(?!\2)[^\\]|\\.)*\2|\[(?:[^\[\]\\]|\\.)*\]|[^\[\]\\"'$`]|\\.)*\]/m,
      lookbehind: !0,
      inside: {
        quoted: {
          pattern: /([$`])(?:(?!\1)[^\\]|\\.)*\1/,
          inside: {
            punctuation: /^[$`]|[$`]$/,
          },
        },
        interpreted: {
          pattern: /'(?:[^'\\]|\\.)*'/,
          inside: {
            punctuation: /^'|'$/,
          },
        },
        string: /"(?:[^"\\]|\\.)*"/,
        variable: /\w+(?==)/,
        punctuation: /^\[|\]$|,/,
        operator: /=/,
        'attr-value': /(?!^\s+$).+/,
      },
    },
    i = (t.languages.asciidoc = {
      'comment-block': {
        pattern: /^(\/{4,})$[\s\S]*?^\1/m,
        alias: 'comment',
      },
      table: {
        pattern: /^\|={3,}(?:(?:\r?\n|\r(?!\n)).*)*?(?:\r?\n|\r)\|={3,}$/m,
        inside: {
          specifiers: {
            pattern:
              /(?:(?:(?:\d+(?:\.\d+)?|\.\d+)[+*](?:[<^>](?:\.[<^>])?|\.[<^>])?|[<^>](?:\.[<^>])?|\.[<^>])[a-z]*|[a-z]+)(?=\|)/,
            alias: 'attr-value',
          },
          punctuation: {
            pattern: /(^|[^\\])[|!]=*/,
            lookbehind: !0,
          },
        },
      },
      'passthrough-block': {
        pattern: /^(\+{4,})$[\s\S]*?^\1$/m,
        inside: {
          punctuation: /^\++|\++$/,
        },
      },
      'literal-block': {
        pattern: /^(-{4,}|\.{4,})$[\s\S]*?^\1$/m,
        inside: {
          punctuation: /^(?:-+|\.+)|(?:-+|\.+)$/,
        },
      },
      'other-block': {
        pattern: /^(--|\*{4,}|_{4,}|={4,})$[\s\S]*?^\1$/m,
        inside: {
          punctuation: /^(?:-+|\*+|_+|=+)|(?:-+|\*+|_+|=+)$/,
        },
      },
      'list-punctuation': {
        pattern:
          /(^[ \t]*)(?:-|\*{1,5}|\.{1,5}|(?:[a-z]|\d+)\.|[xvi]+\))(?= )/im,
        lookbehind: !0,
        alias: 'punctuation',
      },
      'list-label': {
        pattern: /(^[ \t]*)[a-z\d].+(?::{2,4}|;;)(?=\s)/im,
        lookbehind: !0,
        alias: 'symbol',
      },
      'indented-block': {
        pattern: /((\r?\n|\r)\2)([ \t]+)\S.*(?:(?:\r?\n|\r)\3.+)*(?=\2{2}|$)/,
        lookbehind: !0,
      },
      comment: /^\/\/.*/m,
      title: {
        pattern:
          /^.+(?:\r?\n|\r)(?:={3,}|-{3,}|~{3,}|\^{3,}|\+{3,})$|^={1,5} .+|^\.(?![\s.]).*/m,
        alias: 'important',
        inside: {
          punctuation: /^(?:\.|=+)|(?:=+|-+|~+|\^+|\++)$/,
        },
      },
      'attribute-entry': {
        pattern: /^:[^:\r\n]+:(?: .*?(?: \+(?:\r?\n|\r).*?)*)?$/m,
        alias: 'tag',
      },
      attributes: n,
      hr: {
        pattern: /^'{3,}$/m,
        alias: 'punctuation',
      },
      'page-break': {
        pattern: /^<{3,}$/m,
        alias: 'punctuation',
      },
      admonition: {
        pattern: /^(?:CAUTION|IMPORTANT|NOTE|TIP|WARNING):/m,
        alias: 'keyword',
      },
      callout: [
        {
          pattern: /(^[ \t]*)<?\d*>/m,
          lookbehind: !0,
          alias: 'symbol',
        },
        {
          pattern: /<\d+>/,
          alias: 'symbol',
        },
      ],
      macro: {
        pattern:
          /\b[a-z\d][a-z\d-]*::?(?:[^\s\[\]]*\[(?:[^\]\\"']|(["'])(?:(?!\1)[^\\]|\\.)*\1|\\.)*\])/,
        inside: {
          function: /^[a-z\d-]+(?=:)/,
          punctuation: /^::?/,
          attributes: {
            pattern: /(?:\[(?:[^\]\\"']|(["'])(?:(?!\1)[^\\]|\\.)*\1|\\.)*\])/,
            inside: n.inside,
          },
        },
      },
      inline: {
        pattern:
          /(^|[^\\])(?:(?:\B\[(?:[^\]\\"']|(["'])(?:(?!\2)[^\\]|\\.)*\2|\\.)*\])?(?:\b_(?!\s)(?: _|[^_\\\r\n]|\\.)+(?:(?:\r?\n|\r)(?: _|[^_\\\r\n]|\\.)+)*_\b|\B``(?!\s).+?(?:(?:\r?\n|\r).+?)*''\B|\B`(?!\s)(?:[^`'\s]|\s+\S)+['`]\B|\B(['*+#])(?!\s)(?: \3|(?!\3)[^\\\r\n]|\\.)+(?:(?:\r?\n|\r)(?: \3|(?!\3)[^\\\r\n]|\\.)+)*\3\B)|(?:\[(?:[^\]\\"']|(["'])(?:(?!\4)[^\\]|\\.)*\4|\\.)*\])?(?:(__|\*\*|\+\+\+?|##|\$\$|[~^]).+?(?:(?:\r?\n|\r).+?)*\5|\{[^}\r\n]+\}|\[\[\[?.+?(?:(?:\r?\n|\r).+?)*\]?\]\]|<<.+?(?:(?:\r?\n|\r).+?)*>>|\(\(\(?.+?(?:(?:\r?\n|\r).+?)*\)?\)\)))/m,
        lookbehind: !0,
        inside: {
          attributes: n,
          url: {
            pattern: /^(?:\[\[\[?.+?\]?\]\]|<<.+?>>)$/,
            inside: {
              punctuation: /^(?:\[\[\[?|<<)|(?:\]\]\]?|>>)$/,
            },
          },
          'attribute-ref': {
            pattern: /^\{.+\}$/,
            inside: {
              variable: {
                pattern: /(^\{)[a-z\d,+_-]+/,
                lookbehind: !0,
              },
              operator: /^[=?!#%@$]|!(?=[:}])/,
              punctuation: /^\{|\}$|::?/,
            },
          },
          italic: {
            pattern: /^(['_])[\s\S]+\1$/,
            inside: {
              punctuation: /^(?:''?|__?)|(?:''?|__?)$/,
            },
          },
          bold: {
            pattern: /^\*[\s\S]+\*$/,
            inside: {
              punctuation: /^\*\*?|\*\*?$/,
            },
          },
          punctuation:
            /^(?:``?|\+{1,3}|##?|\$\$|[~^]|\(\(\(?)|(?:''?|\+{1,3}|##?|\$\$|[~^`]|\)?\)\))$/,
        },
      },
      replacement: {
        pattern: /\((?:C|R|TM)\)/,
        alias: 'builtin',
      },
      entity: /&#?[\da-z]{1,8};/i,
      'line-continuation': {
        pattern: /(^| )\+$/m,
        lookbehind: !0,
        alias: 'punctuation',
      },
    });
  function e(t) {
    for (var n = {}, e = 0, a = (t = t.split(' ')).length; e < a; e++)
      n[t[e]] = i[t[e]];
    return n;
  }
  (n.inside.interpreted.inside.rest = e('macro inline replacement entity')),
    (i['passthrough-block'].inside.rest = e('macro')),
    (i['literal-block'].inside.rest = e('callout')),
    (i.table.inside.rest = e(
      'comment-block passthrough-block literal-block other-block list-punctuation indented-block comment title attribute-entry attributes hr page-break admonition list-label callout macro inline replacement entity line-continuation',
    )),
    (i['other-block'].inside.rest = e(
      'table list-punctuation indented-block comment attribute-entry attributes hr page-break admonition list-label macro inline replacement entity line-continuation',
    )),
    (i.title.inside.rest = e('macro inline replacement entity')),
    t.hooks.add('wrap', function (t) {
      'entity' === t.type &&
        (t.attributes.title = t.content.replace(/&amp;/, '&'));
    }),
    (t.languages.adoc = t.languages.asciidoc);
})(Prism);
!(function (e) {
  function n(e, n) {
    return e.replace(/<<(\d+)>>/g, function (e, s) {
      return '(?:' + n[+s] + ')';
    });
  }
  function s(e, s, a) {
    return RegExp(n(e, s), a || '');
  }
  function a(e, n) {
    for (var s = 0; s < n; s++)
      e = e.replace(/<<self>>/g, function () {
        return '(?:' + e + ')';
      });
    return e.replace(/<<self>>/g, '[^\\s\\S]');
  }
  var t =
      'bool byte char decimal double dynamic float int long object sbyte short string uint ulong ushort var void',
    r = 'class enum interface record struct',
    i =
      'add alias and ascending async await by descending from(?=\\s*(?:\\w|$)) get global group into init(?=\\s*;) join let nameof not notnull on or orderby partial remove select set unmanaged value when where with(?=\\s*{)',
    o =
      'abstract as base break case catch checked const continue default delegate do else event explicit extern finally fixed for foreach goto if implicit in internal is lock namespace new null operator out override params private protected public readonly ref return sealed sizeof stackalloc static switch this throw try typeof unchecked unsafe using virtual volatile while yield';
  function l(e) {
    return '\\b(?:' + e.trim().replace(/ /g, '|') + ')\\b';
  }
  var d = l(r),
    p = RegExp(l(t + ' ' + r + ' ' + i + ' ' + o)),
    c = l(r + ' ' + i + ' ' + o),
    u = l(t + ' ' + r + ' ' + o),
    g = a('<(?:[^<>;=+\\-*/%&|^]|<<self>>)*>', 2),
    b = a('\\((?:[^()]|<<self>>)*\\)', 2),
    h = '@?\\b[A-Za-z_]\\w*\\b',
    f = n('<<0>>(?:\\s*<<1>>)?', [h, g]),
    m = n('(?!<<0>>)<<1>>(?:\\s*\\.\\s*<<1>>)*', [c, f]),
    k = '\\[\\s*(?:,\\s*)*\\]',
    y = n('<<0>>(?:\\s*(?:\\?\\s*)?<<1>>)*(?:\\s*\\?)?', [m, k]),
    w = n('[^,()<>[\\];=+\\-*/%&|^]|<<0>>|<<1>>|<<2>>', [g, b, k]),
    v = n('\\(<<0>>+(?:,<<0>>+)+\\)', [w]),
    x = n('(?:<<0>>|<<1>>)(?:\\s*(?:\\?\\s*)?<<2>>)*(?:\\s*\\?)?', [v, m, k]),
    $ = {
      keyword: p,
      punctuation: /[<>()?,.:[\]]/,
    },
    _ = "'(?:[^\r\n'\\\\]|\\\\.|\\\\[Uux][\\da-fA-F]{1,8})'",
    B = '"(?:\\\\.|[^\\\\"\r\n])*"';
  (e.languages.csharp = e.languages.extend('clike', {
    string: [
      {
        pattern: s('(^|[^$\\\\])<<0>>', ['@"(?:""|\\\\[^]|[^\\\\"])*"(?!")']),
        lookbehind: !0,
        greedy: !0,
      },
      {
        pattern: s('(^|[^@$\\\\])<<0>>', [B]),
        lookbehind: !0,
        greedy: !0,
      },
    ],
    'class-name': [
      {
        pattern: s('(\\busing\\s+static\\s+)<<0>>(?=\\s*;)', [m]),
        lookbehind: !0,
        inside: $,
      },
      {
        pattern: s('(\\busing\\s+<<0>>\\s*=\\s*)<<1>>(?=\\s*;)', [h, x]),
        lookbehind: !0,
        inside: $,
      },
      {
        pattern: s('(\\busing\\s+)<<0>>(?=\\s*=)', [h]),
        lookbehind: !0,
      },
      {
        pattern: s('(\\b<<0>>\\s+)<<1>>', [d, f]),
        lookbehind: !0,
        inside: $,
      },
      {
        pattern: s('(\\bcatch\\s*\\(\\s*)<<0>>', [m]),
        lookbehind: !0,
        inside: $,
      },
      {
        pattern: s('(\\bwhere\\s+)<<0>>', [h]),
        lookbehind: !0,
      },
      {
        pattern: s('(\\b(?:is(?:\\s+not)?|as)\\s+)<<0>>', [y]),
        lookbehind: !0,
        inside: $,
      },
      {
        pattern: s(
          '\\b<<0>>(?=\\s+(?!<<1>>|with\\s*\\{)<<2>>(?:\\s*[=,;:{)\\]]|\\s+(?:in|when)\\b))',
          [x, u, h],
        ),
        inside: $,
      },
    ],
    keyword: p,
    number:
      /(?:\b0(?:x[\da-f_]*[\da-f]|b[01_]*[01])|(?:\B\.\d+(?:_+\d+)*|\b\d+(?:_+\d+)*(?:\.\d+(?:_+\d+)*)?)(?:e[-+]?\d+(?:_+\d+)*)?)(?:[dflmu]|lu|ul)?\b/i,
    operator: />>=?|<<=?|[-=]>|([-+&|])\1|~|\?\?=?|[-+*/%&|^!=<>]=?/,
    punctuation: /\?\.?|::|[{}[\];(),.:]/,
  })),
    e.languages.insertBefore('csharp', 'number', {
      range: {
        pattern: /\.\./,
        alias: 'operator',
      },
    }),
    e.languages.insertBefore('csharp', 'punctuation', {
      'named-parameter': {
        pattern: s('([(,]\\s*)<<0>>(?=\\s*:)', [h]),
        lookbehind: !0,
        alias: 'punctuation',
      },
    }),
    e.languages.insertBefore('csharp', 'class-name', {
      namespace: {
        pattern: s(
          '(\\b(?:namespace|using)\\s+)<<0>>(?:\\s*\\.\\s*<<0>>)*(?=\\s*[;{])',
          [h],
        ),
        lookbehind: !0,
        inside: {
          punctuation: /\./,
        },
      },
      'type-expression': {
        pattern: s(
          '(\\b(?:default|sizeof|typeof)\\s*\\(\\s*(?!\\s))(?:[^()\\s]|\\s(?!\\s)|<<0>>)*(?=\\s*\\))',
          [b],
        ),
        lookbehind: !0,
        alias: 'class-name',
        inside: $,
      },
      'return-type': {
        pattern: s(
          '<<0>>(?=\\s+(?:<<1>>\\s*(?:=>|[({]|\\.\\s*this\\s*\\[)|this\\s*\\[))',
          [x, m],
        ),
        inside: $,
        alias: 'class-name',
      },
      'constructor-invocation': {
        pattern: s('(\\bnew\\s+)<<0>>(?=\\s*[[({])', [x]),
        lookbehind: !0,
        inside: $,
        alias: 'class-name',
      },
      'generic-method': {
        pattern: s('<<0>>\\s*<<1>>(?=\\s*\\()', [h, g]),
        inside: {
          function: s('^<<0>>', [h]),
          generic: {
            pattern: RegExp(g),
            alias: 'class-name',
            inside: $,
          },
        },
      },
      'type-list': {
        pattern: s(
          '\\b((?:<<0>>\\s+<<1>>|record\\s+<<1>>\\s*<<5>>|where\\s+<<2>>)\\s*:\\s*)(?:<<3>>|<<4>>|<<1>>\\s*<<5>>|<<6>>)(?:\\s*,\\s*(?:<<3>>|<<4>>|<<6>>))*(?=\\s*(?:where|[{;]|=>|$))',
          [d, f, h, x, p.source, b, '\\bnew\\s*\\(\\s*\\)'],
        ),
        lookbehind: !0,
        inside: {
          'record-arguments': {
            pattern: s('(^(?!new\\s*\\()<<0>>\\s*)<<1>>', [f, b]),
            lookbehind: !0,
            greedy: !0,
            inside: e.languages.csharp,
          },
          keyword: p,
          'class-name': {
            pattern: RegExp(x),
            greedy: !0,
            inside: $,
          },
          punctuation: /[,()]/,
        },
      },
      preprocessor: {
        pattern: /(^[\t ]*)#.*/m,
        lookbehind: !0,
        alias: 'property',
        inside: {
          directive: {
            pattern:
              /(#)\b(?:define|elif|else|endif|endregion|error|if|line|nullable|pragma|region|undef|warning)\b/,
            lookbehind: !0,
            alias: 'keyword',
          },
        },
      },
    });
  var E = B + '|' + _,
    R = n('/(?![*/])|//[^\r\n]*[\r\n]|/\\*(?:[^*]|\\*(?!/))*\\*/|<<0>>', [E]),
    z = a(n('[^"\'/()]|<<0>>|\\(<<self>>*\\)', [R]), 2),
    S =
      '\\b(?:assembly|event|field|method|module|param|property|return|type)\\b',
    j = n('<<0>>(?:\\s*\\(<<1>>*\\))?', [m, z]);
  e.languages.insertBefore('csharp', 'class-name', {
    attribute: {
      pattern: s(
        '((?:^|[^\\s\\w>)?])\\s*\\[\\s*)(?:<<0>>\\s*:\\s*)?<<1>>(?:\\s*,\\s*<<1>>)*(?=\\s*\\])',
        [S, j],
      ),
      lookbehind: !0,
      greedy: !0,
      inside: {
        target: {
          pattern: s('^<<0>>(?=\\s*:)', [S]),
          alias: 'keyword',
        },
        'attribute-arguments': {
          pattern: s('\\(<<0>>*\\)', [z]),
          inside: e.languages.csharp,
        },
        'class-name': {
          pattern: RegExp(m),
          inside: {
            punctuation: /\./,
          },
        },
        punctuation: /[:,]/,
      },
    },
  });
  var A = ':[^}\r\n]+',
    F = a(n('[^"\'/()]|<<0>>|\\(<<self>>*\\)', [R]), 2),
    P = n('\\{(?!\\{)(?:(?![}:])<<0>>)*<<1>>?\\}', [F, A]),
    U = a(
      n('[^"\'/()]|/(?!\\*)|/\\*(?:[^*]|\\*(?!/))*\\*/|<<0>>|\\(<<self>>*\\)', [
        E,
      ]),
      2,
    ),
    Z = n('\\{(?!\\{)(?:(?![}:])<<0>>)*<<1>>?\\}', [U, A]);
  function q(n, a) {
    return {
      interpolation: {
        pattern: s('((?:^|[^{])(?:\\{\\{)*)<<0>>', [n]),
        lookbehind: !0,
        inside: {
          'format-string': {
            pattern: s('(^\\{(?:(?![}:])<<0>>)*)<<1>>(?=\\}$)', [a, A]),
            lookbehind: !0,
            inside: {
              punctuation: /^:/,
            },
          },
          punctuation: /^\{|\}$/,
          expression: {
            pattern: /[\s\S]+/,
            alias: 'language-csharp',
            inside: e.languages.csharp,
          },
        },
      },
      string: /[\s\S]+/,
    };
  }
  e.languages.insertBefore('csharp', 'string', {
    'interpolation-string': [
      {
        pattern: s(
          '(^|[^\\\\])(?:\\$@|@\\$)"(?:""|\\\\[^]|\\{\\{|<<0>>|[^\\\\{"])*"',
          [P],
        ),
        lookbehind: !0,
        greedy: !0,
        inside: q(P, F),
      },
      {
        pattern: s('(^|[^@\\\\])\\$"(?:\\\\.|\\{\\{|<<0>>|[^\\\\"{])*"', [Z]),
        lookbehind: !0,
        greedy: !0,
        inside: q(Z, U),
      },
    ],
    char: {
      pattern: RegExp(_),
      greedy: !0,
    },
  }),
    (e.languages.dotnet = e.languages.cs = e.languages.csharp);
})(Prism);
(Prism.languages.aspnet = Prism.languages.extend('markup', {
  'page-directive': {
    pattern: /<%\s*@.*%>/,
    alias: 'tag',
    inside: {
      'page-directive': {
        pattern:
          /<%\s*@\s*(?:Assembly|Control|Implements|Import|Master(?:Type)?|OutputCache|Page|PreviousPageType|Reference|Register)?|%>/i,
        alias: 'tag',
      },
      rest: Prism.languages.markup.tag.inside,
    },
  },
  directive: {
    pattern: /<%.*%>/,
    alias: 'tag',
    inside: {
      directive: {
        pattern: /<%\s*?[$=%#:]{0,2}|%>/,
        alias: 'tag',
      },
      rest: Prism.languages.csharp,
    },
  },
})),
  (Prism.languages.aspnet.tag.pattern =
    /<(?!%)\/?[^\s>\/]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+))?)*\s*\/?>/),
  Prism.languages.insertBefore(
    'inside',
    'punctuation',
    {
      directive: Prism.languages.aspnet.directive,
    },
    Prism.languages.aspnet.tag.inside['attr-value'],
  ),
  Prism.languages.insertBefore('aspnet', 'comment', {
    'asp-comment': {
      pattern: /<%--[\s\S]*?--%>/,
      alias: ['asp', 'comment'],
    },
  }),
  Prism.languages.insertBefore(
    'aspnet',
    Prism.languages.javascript ? 'script' : 'tag',
    {
      'asp-script': {
        pattern:
          /(<script(?=.*runat=['"]?server\b)[^>]*>)[\s\S]*?(?=<\/script>)/i,
        lookbehind: !0,
        alias: ['asp', 'script'],
        inside: Prism.languages.csharp || {},
      },
    },
  );
Prism.languages.asm6502 = {
  comment: /;.*/,
  directive: {
    pattern: /\.\w+(?= )/,
    alias: 'property',
  },
  string: /(["'`])(?:\\.|(?!\1)[^\\\r\n])*\1/,
  'op-code': {
    pattern:
      /\b(?:ADC|AND|ASL|BCC|BCS|BEQ|BIT|BMI|BNE|BPL|BRK|BVC|BVS|CLC|CLD|CLI|CLV|CMP|CPX|CPY|DEC|DEX|DEY|EOR|INC|INX|INY|JMP|JSR|LDA|LDX|LDY|LSR|NOP|ORA|PHA|PHP|PLA|PLP|ROL|ROR|RTI|RTS|SBC|SEC|SED|SEI|STA|STX|STY|TAX|TAY|TSX|TXA|TXS|TYA|adc|and|asl|bcc|bcs|beq|bit|bmi|bne|bpl|brk|bvc|bvs|clc|cld|cli|clv|cmp|cpx|cpy|dec|dex|dey|eor|inc|inx|iny|jmp|jsr|lda|ldx|ldy|lsr|nop|ora|pha|php|pla|plp|rol|ror|rti|rts|sbc|sec|sed|sei|sta|stx|sty|tax|tay|tsx|txa|txs|tya)\b/,
    alias: 'keyword',
  },
  'hex-number': {
    pattern: /#?\$[\da-f]{1,4}\b/i,
    alias: 'number',
  },
  'binary-number': {
    pattern: /#?%[01]+\b/,
    alias: 'number',
  },
  'decimal-number': {
    pattern: /#?\b\d+\b/,
    alias: 'number',
  },
  register: {
    pattern: /\b[xya]\b/i,
    alias: 'variable',
  },
  punctuation: /[(),:]/,
};
Prism.languages.autoit = {
  comment: [
    /;.*/,
    {
      pattern:
        /(^[\t ]*)#(?:comments-start|cs)[\s\S]*?^[ \t]*#(?:ce|comments-end)/m,
      lookbehind: !0,
    },
  ],
  url: {
    pattern: /(^[\t ]*#include\s+)(?:<[^\r\n>]+>|"[^\r\n"]+")/m,
    lookbehind: !0,
  },
  string: {
    pattern: /(["'])(?:\1\1|(?!\1)[^\r\n])*\1/,
    greedy: !0,
    inside: {
      variable: /([%$@])\w+\1/,
    },
  },
  directive: {
    pattern: /(^[\t ]*)#[\w-]+/m,
    lookbehind: !0,
    alias: 'keyword',
  },
  function: /\b\w+(?=\()/,
  variable: /[$@]\w+/,
  keyword:
    /\b(?:Case|Const|Continue(?:Case|Loop)|Default|Dim|Do|Else(?:If)?|End(?:Func|If|Select|Switch|With)|Enum|Exit(?:Loop)?|For|Func|Global|If|In|Local|Next|Null|ReDim|Select|Static|Step|Switch|Then|To|Until|Volatile|WEnd|While|With)\b/i,
  number: /\b(?:0x[\da-f]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/i,
  boolean: /\b(?:False|True)\b/i,
  operator: /<[=>]?|[-+*\/=&>]=?|[?^]|\b(?:And|Not|Or)\b/i,
  punctuation: /[\[\]().,:]/,
};
(Prism.languages.awk = {
  hashbang: {
    pattern: /^#!.*/,
    greedy: !0,
    alias: 'comment',
  },
  comment: {
    pattern: /#.*/,
    greedy: !0,
  },
  string: {
    pattern: /(^|[^\\])"(?:[^\\"\r\n]|\\.)*"/,
    lookbehind: !0,
    greedy: !0,
  },
  regex: {
    pattern: /((?:^|[^\w\s)])\s*)\/(?:[^\/\\\r\n]|\\.)*\//,
    lookbehind: !0,
    greedy: !0,
  },
  variable: /\$\w+/,
  keyword:
    /\b(?:BEGIN|BEGINFILE|END|ENDFILE|break|case|continue|default|delete|do|else|exit|for|function|getline|if|in|next|nextfile|printf?|return|switch|while)\b|@(?:include|load)\b/,
  function: /\b[a-z_]\w*(?=\s*\()/i,
  number: /\b(?:\d+(?:\.\d+)?(?:e[+-]?\d+)?|0x[a-fA-F0-9]+)\b/,
  operator: /--|\+\+|!?~|>&|>>|<<|(?:\*\*|[<>!=+\-*/%^])=?|&&|\|[|&]|[?:]/,
  punctuation: /[()[\]{},;]/,
}),
  (Prism.languages.gawk = Prism.languages.awk);
!(function (e) {
  var t =
      '\\b(?:BASH|BASHOPTS|BASH_ALIASES|BASH_ARGC|BASH_ARGV|BASH_CMDS|BASH_COMPLETION_COMPAT_DIR|BASH_LINENO|BASH_REMATCH|BASH_SOURCE|BASH_VERSINFO|BASH_VERSION|COLORTERM|COLUMNS|COMP_WORDBREAKS|DBUS_SESSION_BUS_ADDRESS|DEFAULTS_PATH|DESKTOP_SESSION|DIRSTACK|DISPLAY|EUID|GDMSESSION|GDM_LANG|GNOME_KEYRING_CONTROL|GNOME_KEYRING_PID|GPG_AGENT_INFO|GROUPS|HISTCONTROL|HISTFILE|HISTFILESIZE|HISTSIZE|HOME|HOSTNAME|HOSTTYPE|IFS|INSTANCE|JOB|LANG|LANGUAGE|LC_ADDRESS|LC_ALL|LC_IDENTIFICATION|LC_MEASUREMENT|LC_MONETARY|LC_NAME|LC_NUMERIC|LC_PAPER|LC_TELEPHONE|LC_TIME|LESSCLOSE|LESSOPEN|LINES|LOGNAME|LS_COLORS|MACHTYPE|MAILCHECK|MANDATORY_PATH|NO_AT_BRIDGE|OLDPWD|OPTERR|OPTIND|ORBIT_SOCKETDIR|OSTYPE|PAPERSIZE|PATH|PIPESTATUS|PPID|PS1|PS2|PS3|PS4|PWD|RANDOM|REPLY|SECONDS|SELINUX_INIT|SESSION|SESSIONTYPE|SESSION_MANAGER|SHELL|SHELLOPTS|SHLVL|SSH_AUTH_SOCK|TERM|UID|UPSTART_EVENTS|UPSTART_INSTANCE|UPSTART_JOB|UPSTART_SESSION|USER|WINDOWID|XAUTHORITY|XDG_CONFIG_DIRS|XDG_CURRENT_DESKTOP|XDG_DATA_DIRS|XDG_GREETER_DATA_DIR|XDG_MENU_PREFIX|XDG_RUNTIME_DIR|XDG_SEAT|XDG_SEAT_PATH|XDG_SESSION_DESKTOP|XDG_SESSION_ID|XDG_SESSION_PATH|XDG_SESSION_TYPE|XDG_VTNR|XMODIFIERS)\\b',
    a = {
      pattern: /(^(["']?)\w+\2)[ \t]+\S.*/,
      lookbehind: !0,
      alias: 'punctuation',
      inside: null,
    },
    n = {
      bash: a,
      environment: {
        pattern: RegExp('\\$' + t),
        alias: 'constant',
      },
      variable: [
        {
          pattern: /\$?\(\([\s\S]+?\)\)/,
          greedy: !0,
          inside: {
            variable: [
              {
                pattern: /(^\$\(\([\s\S]+)\)\)/,
                lookbehind: !0,
              },
              /^\$\(\(/,
            ],
            number:
              /\b0x[\dA-Fa-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:[Ee]-?\d+)?/,
            operator:
              /--|\+\+|\*\*=?|<<=?|>>=?|&&|\|\||[=!+\-*/%<>^&|]=?|[?~:]/,
            punctuation: /\(\(?|\)\)?|,|;/,
          },
        },
        {
          pattern: /\$\((?:\([^)]+\)|[^()])+\)|`[^`]+`/,
          greedy: !0,
          inside: {
            variable: /^\$\(|^`|\)$|`$/,
          },
        },
        {
          pattern: /\$\{[^}]+\}/,
          greedy: !0,
          inside: {
            operator: /:[-=?+]?|[!\/]|##?|%%?|\^\^?|,,?/,
            punctuation: /[\[\]]/,
            environment: {
              pattern: RegExp('(\\{)' + t),
              lookbehind: !0,
              alias: 'constant',
            },
          },
        },
        /\$(?:\w+|[#?*!@$])/,
      ],
      entity:
        /\\(?:[abceEfnrtv\\"]|O?[0-7]{1,3}|U[0-9a-fA-F]{8}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{1,2})/,
    };
  (e.languages.bash = {
    shebang: {
      pattern: /^#!\s*\/.*/,
      alias: 'important',
    },
    comment: {
      pattern: /(^|[^"{\\$])#.*/,
      lookbehind: !0,
    },
    'function-name': [
      {
        pattern: /(\bfunction\s+)[\w-]+(?=(?:\s*\(?:\s*\))?\s*\{)/,
        lookbehind: !0,
        alias: 'function',
      },
      {
        pattern: /\b[\w-]+(?=\s*\(\s*\)\s*\{)/,
        alias: 'function',
      },
    ],
    'for-or-select': {
      pattern: /(\b(?:for|select)\s+)\w+(?=\s+in\s)/,
      alias: 'variable',
      lookbehind: !0,
    },
    'assign-left': {
      pattern: /(^|[\s;|&]|[<>]\()\w+(?:\.\w+)*(?=\+?=)/,
      inside: {
        environment: {
          pattern: RegExp('(^|[\\s;|&]|[<>]\\()' + t),
          lookbehind: !0,
          alias: 'constant',
        },
      },
      alias: 'variable',
      lookbehind: !0,
    },
    parameter: {
      pattern: /(^|\s)-{1,2}(?:\w+:[+-]?)?\w+(?:\.\w+)*(?=[=\s]|$)/,
      alias: 'variable',
      lookbehind: !0,
    },
    string: [
      {
        pattern: /((?:^|[^<])<<-?\s*)(\w+)\s[\s\S]*?(?:\r?\n|\r)\2/,
        lookbehind: !0,
        greedy: !0,
        inside: n,
      },
      {
        pattern: /((?:^|[^<])<<-?\s*)(["'])(\w+)\2\s[\s\S]*?(?:\r?\n|\r)\3/,
        lookbehind: !0,
        greedy: !0,
        inside: {
          bash: a,
        },
      },
      {
        pattern:
          /(^|[^\\](?:\\\\)*)"(?:\\[\s\S]|\$\([^)]+\)|\$(?!\()|`[^`]+`|[^"\\`$])*"/,
        lookbehind: !0,
        greedy: !0,
        inside: n,
      },
      {
        pattern: /(^|[^$\\])'[^']*'/,
        lookbehind: !0,
        greedy: !0,
      },
      {
        pattern: /\$'(?:[^'\\]|\\[\s\S])*'/,
        greedy: !0,
        inside: {
          entity: n.entity,
        },
      },
    ],
    environment: {
      pattern: RegExp('\\$?' + t),
      alias: 'constant',
    },
    variable: n.variable,
    function: {
      pattern:
        /(^|[\s;|&]|[<>]\()(?:add|apropos|apt|apt-cache|apt-get|aptitude|aspell|automysqlbackup|awk|basename|bash|bc|bconsole|bg|bzip2|cal|cargo|cat|cfdisk|chgrp|chkconfig|chmod|chown|chroot|cksum|clear|cmp|column|comm|composer|cp|cron|crontab|csplit|curl|cut|date|dc|dd|ddrescue|debootstrap|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|docker|docker-compose|du|egrep|eject|env|ethtool|expand|expect|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|git|gparted|grep|groupadd|groupdel|groupmod|groups|grub-mkconfig|gzip|halt|head|hg|history|host|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|ip|java|jobs|join|kill|killall|less|link|ln|locate|logname|logrotate|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|lynx|make|man|mc|mdadm|mkconfig|mkdir|mke2fs|mkfifo|mkfs|mkisofs|mknod|mkswap|mmv|more|most|mount|mtools|mtr|mutt|mv|nano|nc|netstat|nice|nl|node|nohup|notify-send|npm|nslookup|op|open|parted|passwd|paste|pathchk|ping|pkill|pnpm|podman|podman-compose|popd|pr|printcap|printenv|ps|pushd|pv|quota|quotacheck|quotactl|ram|rar|rcp|reboot|remsync|rename|renice|rev|rm|rmdir|rpm|rsync|scp|screen|sdiff|sed|sendmail|seq|service|sftp|sh|shellcheck|shuf|shutdown|sleep|slocate|sort|split|ssh|stat|strace|su|sudo|sum|suspend|swapon|sync|sysctl|tac|tail|tar|tee|time|timeout|top|touch|tr|traceroute|tsort|tty|umount|uname|unexpand|uniq|units|unrar|unshar|unzip|update-grub|uptime|useradd|userdel|usermod|users|uudecode|uuencode|v|vcpkg|vdir|vi|vim|virsh|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yarn|yes|zenity|zip|zsh|zypper)(?=$|[)\s;|&])/,
      lookbehind: !0,
    },
    keyword: {
      pattern:
        /(^|[\s;|&]|[<>]\()(?:case|do|done|elif|else|esac|fi|for|function|if|in|select|then|until|while)(?=$|[)\s;|&])/,
      lookbehind: !0,
    },
    builtin: {
      pattern:
        /(^|[\s;|&]|[<>]\()(?:\.|:|alias|bind|break|builtin|caller|cd|command|continue|declare|echo|enable|eval|exec|exit|export|getopts|hash|help|let|local|logout|mapfile|printf|pwd|read|readarray|readonly|return|set|shift|shopt|source|test|times|trap|type|typeset|ulimit|umask|unalias|unset)(?=$|[)\s;|&])/,
      lookbehind: !0,
      alias: 'class-name',
    },
    boolean: {
      pattern: /(^|[\s;|&]|[<>]\()(?:false|true)(?=$|[)\s;|&])/,
      lookbehind: !0,
    },
    'file-descriptor': {
      pattern: /\B&\d\b/,
      alias: 'important',
    },
    operator: {
      pattern:
        /\d?<>|>\||\+=|=[=~]?|!=?|<<[<-]?|[&\d]?>>|\d[<>]&?|[<>][&=]?|&[>&]?|\|[&|]?/,
      inside: {
        'file-descriptor': {
          pattern: /^\d/,
          alias: 'important',
        },
      },
    },
    punctuation: /\$?\(\(?|\)\)?|\.\.|[{}[\];\\]/,
    number: {
      pattern: /(^|\s)(?:[1-9]\d*|0)(?:[.,]\d+)?\b/,
      lookbehind: !0,
    },
  }),
    (a.inside = e.languages.bash);
  for (
    var s = [
        'comment',
        'function-name',
        'for-or-select',
        'assign-left',
        'parameter',
        'string',
        'environment',
        'function',
        'keyword',
        'builtin',
        'boolean',
        'file-descriptor',
        'operator',
        'punctuation',
        'number',
      ],
      o = n.variable[1].inside,
      i = 0;
    i < s.length;
    i++
  )
    o[s[i]] = e.languages.bash[s[i]];
  (e.languages.sh = e.languages.bash), (e.languages.shell = e.languages.bash);
})(Prism);
Prism.languages.basic = {
  comment: {
    pattern: /(?:!|REM\b).+/i,
    inside: {
      keyword: /^REM/i,
    },
  },
  string: {
    pattern: /"(?:""|[!#$%&'()*,\/:;<=>?^\w +\-.])*"/,
    greedy: !0,
  },
  number: /(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:E[+-]?\d+)?/i,
  keyword:
    /\b(?:AS|BEEP|BLOAD|BSAVE|CALL(?: ABSOLUTE)?|CASE|CHAIN|CHDIR|CLEAR|CLOSE|CLS|COM|COMMON|CONST|DATA|DECLARE|DEF(?: FN| SEG|DBL|INT|LNG|SNG|STR)|DIM|DO|DOUBLE|ELSE|ELSEIF|END|ENVIRON|ERASE|ERROR|EXIT|FIELD|FILES|FOR|FUNCTION|GET|GOSUB|GOTO|IF|INPUT|INTEGER|IOCTL|KEY|KILL|LINE INPUT|LOCATE|LOCK|LONG|LOOP|LSET|MKDIR|NAME|NEXT|OFF|ON(?: COM| ERROR| KEY| TIMER)?|OPEN|OPTION BASE|OUT|POKE|PUT|READ|REDIM|REM|RESTORE|RESUME|RETURN|RMDIR|RSET|RUN|SELECT CASE|SHARED|SHELL|SINGLE|SLEEP|STATIC|STEP|STOP|STRING|SUB|SWAP|SYSTEM|THEN|TIMER|TO|TROFF|TRON|TYPE|UNLOCK|UNTIL|USING|VIEW PRINT|WAIT|WEND|WHILE|WRITE)(?:\$|\b)/i,
  function:
    /\b(?:ABS|ACCESS|ACOS|ANGLE|AREA|ARITHMETIC|ARRAY|ASIN|ASK|AT|ATN|BASE|BEGIN|BREAK|CAUSE|CEIL|CHR|CLIP|COLLATE|COLOR|CON|COS|COSH|COT|CSC|DATE|DATUM|DEBUG|DECIMAL|DEF|DEG|DEGREES|DELETE|DET|DEVICE|DISPLAY|DOT|ELAPSED|EPS|ERASABLE|EXLINE|EXP|EXTERNAL|EXTYPE|FILETYPE|FIXED|FP|GO|GRAPH|HANDLER|IDN|IMAGE|IN|INT|INTERNAL|IP|IS|KEYED|LBOUND|LCASE|LEFT|LEN|LENGTH|LET|LINE|LINES|LOG|LOG10|LOG2|LTRIM|MARGIN|MAT|MAX|MAXNUM|MID|MIN|MISSING|MOD|NATIVE|NUL|NUMERIC|OF|OPTION|ORD|ORGANIZATION|OUTIN|OUTPUT|PI|POINT|POINTER|POINTS|POS|PRINT|PROGRAM|PROMPT|RAD|RADIANS|RANDOMIZE|RECORD|RECSIZE|RECTYPE|RELATIVE|REMAINDER|REPEAT|REST|RETRY|REWRITE|RIGHT|RND|ROUND|RTRIM|SAME|SEC|SELECT|SEQUENTIAL|SET|SETTER|SGN|SIN|SINH|SIZE|SKIP|SQR|STANDARD|STATUS|STR|STREAM|STYLE|TAB|TAN|TANH|TEMPLATE|TEXT|THERE|TIME|TIMEOUT|TRACE|TRANSFORM|TRUNCATE|UBOUND|UCASE|USE|VAL|VARIABLE|VIEWPORT|WHEN|WINDOW|WITH|ZER|ZONEWIDTH)(?:\$|\b)/i,
  operator: /<[=>]?|>=?|[+\-*\/^=&]|\b(?:AND|EQV|IMP|NOT|OR|XOR)\b/i,
  punctuation: /[,;:()]/,
};
!(function (e) {
  var r = /%%?[~:\w]+%?|!\S+!/,
    t = {
      pattern: /\/[a-z?]+(?=[ :]|$):?|-[a-z]\b|--[a-z-]+\b/im,
      alias: 'attr-name',
      inside: {
        punctuation: /:/,
      },
    },
    n = /"(?:[\\"]"|[^"])*"(?!")/,
    i = /(?:\b|-)\d+\b/;
  e.languages.batch = {
    comment: [
      /^::.*/m,
      {
        pattern: /((?:^|[&(])[ \t]*)rem\b(?:[^^&)\r\n]|\^(?:\r\n|[\s\S]))*/im,
        lookbehind: !0,
      },
    ],
    label: {
      pattern: /^:.*/m,
      alias: 'property',
    },
    command: [
      {
        pattern:
          /((?:^|[&(])[ \t]*)for(?: \/[a-z?](?:[ :](?:"[^"]*"|[^\s"/]\S*))?)* \S+ in \([^)]+\) do/im,
        lookbehind: !0,
        inside: {
          keyword: /\b(?:do|in)\b|^for\b/i,
          string: n,
          parameter: t,
          variable: r,
          number: i,
          punctuation: /[()',]/,
        },
      },
      {
        pattern:
          /((?:^|[&(])[ \t]*)if(?: \/[a-z?](?:[ :](?:"[^"]*"|[^\s"/]\S*))?)* (?:not )?(?:cmdextversion \d+|defined \w+|errorlevel \d+|exist \S+|(?:"[^"]*"|(?!")(?:(?!==)\S)+)?(?:==| (?:equ|geq|gtr|leq|lss|neq) )(?:"[^"]*"|[^\s"]\S*))/im,
        lookbehind: !0,
        inside: {
          keyword: /\b(?:cmdextversion|defined|errorlevel|exist|not)\b|^if\b/i,
          string: n,
          parameter: t,
          variable: r,
          number: i,
          operator: /\^|==|\b(?:equ|geq|gtr|leq|lss|neq)\b/i,
        },
      },
      {
        pattern: /((?:^|[&()])[ \t]*)else\b/im,
        lookbehind: !0,
        inside: {
          keyword: /^else\b/i,
        },
      },
      {
        pattern:
          /((?:^|[&(])[ \t]*)set(?: \/[a-z](?:[ :](?:"[^"]*"|[^\s"/]\S*))?)* (?:[^^&)\r\n]|\^(?:\r\n|[\s\S]))*/im,
        lookbehind: !0,
        inside: {
          keyword: /^set\b/i,
          string: n,
          parameter: t,
          variable: [r, /\w+(?=(?:[*\/%+\-&^|]|<<|>>)?=)/],
          number: i,
          operator: /[*\/%+\-&^|]=?|<<=?|>>=?|[!~_=]/,
          punctuation: /[()',]/,
        },
      },
      {
        pattern:
          /((?:^|[&(])[ \t]*@?)\w+\b(?:"(?:[\\"]"|[^"])*"(?!")|[^"^&)\r\n]|\^(?:\r\n|[\s\S]))*/m,
        lookbehind: !0,
        inside: {
          keyword: /^\w+\b/,
          string: n,
          parameter: t,
          label: {
            pattern: /(^\s*):\S+/m,
            lookbehind: !0,
            alias: 'property',
          },
          variable: r,
          number: i,
          operator: /\^/,
        },
      },
    ],
    operator: /[&@]/,
    punctuation: /[()']/,
  };
})(Prism);
(Prism.languages.bbcode = {
  tag: {
    pattern:
      /\[\/?[^\s=\]]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'"\]=]+))?(?:\s+[^\s=\]]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'"\]=]+))*\s*\]/,
    inside: {
      tag: {
        pattern: /^\[\/?[^\s=\]]+/,
        inside: {
          punctuation: /^\[\/?/,
        },
      },
      'attr-value': {
        pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'"\]=]+)/,
        inside: {
          punctuation: [
            /^=/,
            {
              pattern: /^(\s*)["']|["']$/,
              lookbehind: !0,
            },
          ],
        },
      },
      punctuation: /\]/,
      'attr-name': /[^\s=\]]+/,
    },
  },
}),
  (Prism.languages.shortcode = Prism.languages.bbcode);
(Prism.languages.cfscript = Prism.languages.extend('clike', {
  comment: [
    {
      pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
      lookbehind: !0,
      inside: {
        annotation: {
          pattern: /(?:^|[^.])@[\w\.]+/,
          alias: 'punctuation',
        },
      },
    },
    {
      pattern: /(^|[^\\:])\/\/.*/,
      lookbehind: !0,
      greedy: !0,
    },
  ],
  keyword:
    /\b(?:abstract|break|catch|component|continue|default|do|else|extends|final|finally|for|function|if|in|include|package|private|property|public|remote|required|rethrow|return|static|switch|throw|try|var|while|xml)\b(?!\s*=)/,
  operator: [
    /\+\+|--|&&|\|\||::|=>|[!=]==|[-+*/%&|^!=<>]=?|\?(?:\.|:)?|:/,
    /\b(?:and|contains|eq|equal|eqv|gt|gte|imp|is|lt|lte|mod|not|or|xor)\b/,
  ],
  scope: {
    pattern:
      /\b(?:application|arguments|cgi|client|cookie|local|session|super|this|variables)\b/,
    alias: 'global',
  },
  type: {
    pattern:
      /\b(?:any|array|binary|boolean|date|guid|numeric|query|string|struct|uuid|void|xml)\b/,
    alias: 'builtin',
  },
})),
  Prism.languages.insertBefore('cfscript', 'keyword', {
    'function-variable': {
      pattern:
        /[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
      alias: 'function',
    },
  }),
  delete Prism.languages.cfscript['class-name'],
  (Prism.languages.cfc = Prism.languages.cfscript);
(Prism.languages.chaiscript = Prism.languages.extend('clike', {
  string: {
    pattern: /(^|[^\\])'(?:[^'\\]|\\[\s\S])*'/,
    lookbehind: !0,
    greedy: !0,
  },
  'class-name': [
    {
      pattern: /(\bclass\s+)\w+/,
      lookbehind: !0,
    },
    {
      pattern: /(\b(?:attr|def)\s+)\w+(?=\s*::)/,
      lookbehind: !0,
    },
  ],
  keyword:
    /\b(?:attr|auto|break|case|catch|class|continue|def|default|else|finally|for|fun|global|if|return|switch|this|try|var|while)\b/,
  number: [Prism.languages.cpp.number, /\b(?:Infinity|NaN)\b/],
  operator:
    />>=?|<<=?|\|\||&&|:[:=]?|--|\+\+|[=!<>+\-*/%|&^]=?|[?~]|`[^`\r\n]{1,4}`/,
})),
  Prism.languages.insertBefore('chaiscript', 'operator', {
    'parameter-type': {
      pattern: /([,(]\s*)\w+(?=\s+\w)/,
      lookbehind: !0,
      alias: 'class-name',
    },
  }),
  Prism.languages.insertBefore('chaiscript', 'string', {
    'string-interpolation': {
      pattern:
        /(^|[^\\])"(?:[^"$\\]|\\[\s\S]|\$(?!\{)|\$\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*"/,
      lookbehind: !0,
      greedy: !0,
      inside: {
        interpolation: {
          pattern:
            /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/,
          lookbehind: !0,
          inside: {
            'interpolation-expression': {
              pattern: /(^\$\{)[\s\S]+(?=\}$)/,
              lookbehind: !0,
              inside: Prism.languages.chaiscript,
            },
            'interpolation-punctuation': {
              pattern: /^\$\{|\}$/,
              alias: 'punctuation',
            },
          },
        },
        string: /[\s\S]+/,
      },
    },
  });
Prism.languages.cil = {
  comment: /\/\/.*/,
  string: {
    pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: !0,
  },
  directive: {
    pattern: /(^|\W)\.[a-z]+(?=\s)/,
    lookbehind: !0,
    alias: 'class-name',
  },
  variable: /\[[\w\.]+\]/,
  keyword:
    /\b(?:abstract|ansi|assembly|auto|autochar|beforefieldinit|bool|bstr|byvalstr|catch|char|cil|class|currency|date|decimal|default|enum|error|explicit|extends|extern|famandassem|family|famorassem|final(?:ly)?|float32|float64|hidebysig|u?int(?:8|16|32|64)?|iant|idispatch|implements|import|initonly|instance|interface|iunknown|literal|lpstr|lpstruct|lptstr|lpwstr|managed|method|native(?:Type)?|nested|newslot|object(?:ref)?|pinvokeimpl|private|privatescope|public|reqsecobj|rtspecialname|runtime|sealed|sequential|serializable|specialname|static|string|struct|syschar|tbstr|unicode|unmanagedexp|unsigned|value(?:type)?|variant|virtual|void)\b/,
  function:
    /\b(?:(?:constrained|no|readonly|tail|unaligned|volatile)\.)?(?:conv\.(?:[iu][1248]?|ovf\.[iu][1248]?(?:\.un)?|r\.un|r4|r8)|ldc\.(?:i4(?:\.\d+|\.[mM]1|\.s)?|i8|r4|r8)|ldelem(?:\.[iu][1248]?|\.r[48]|\.ref|a)?|ldind\.(?:[iu][1248]?|r[48]|ref)|stelem\.?(?:i[1248]?|r[48]|ref)?|stind\.(?:i[1248]?|r[48]|ref)?|end(?:fault|filter|finally)|ldarg(?:\.[0-3s]|a(?:\.s)?)?|ldloc(?:\.\d+|\.s)?|sub(?:\.ovf(?:\.un)?)?|mul(?:\.ovf(?:\.un)?)?|add(?:\.ovf(?:\.un)?)?|stloc(?:\.[0-3s])?|refany(?:type|val)|blt(?:\.un)?(?:\.s)?|ble(?:\.un)?(?:\.s)?|bgt(?:\.un)?(?:\.s)?|bge(?:\.un)?(?:\.s)?|unbox(?:\.any)?|init(?:blk|obj)|call(?:i|virt)?|brfalse(?:\.s)?|bne\.un(?:\.s)?|ldloca(?:\.s)?|brzero(?:\.s)?|brtrue(?:\.s)?|brnull(?:\.s)?|brinst(?:\.s)?|starg(?:\.s)?|leave(?:\.s)?|shr(?:\.un)?|rem(?:\.un)?|div(?:\.un)?|clt(?:\.un)?|alignment|castclass|ldvirtftn|beq(?:\.s)?|ckfinite|ldsflda|ldtoken|localloc|mkrefany|rethrow|cgt\.un|arglist|switch|stsfld|sizeof|newobj|newarr|ldsfld|ldnull|ldflda|isinst|throw|stobj|stfld|ldstr|ldobj|ldlen|ldftn|ldfld|cpobj|cpblk|break|br\.s|xor|shl|ret|pop|not|nop|neg|jmp|dup|cgt|ceq|box|and|or|br)\b/,
  boolean: /\b(?:false|true)\b/,
  number: /\b-?(?:0x[0-9a-f]+|\d+)(?:\.[0-9a-f]+)?\b/i,
  punctuation: /[{}[\];(),:=]|IL_[0-9A-Za-z]+/,
};
(Prism.languages.cilkc = Prism.languages.insertBefore('c', 'function', {
  'parallel-keyword': {
    pattern: /\bcilk_(?:for|reducer|s(?:cope|pawn|ync))\b/,
    alias: 'keyword',
  },
})),
  (Prism.languages['cilk-c'] = Prism.languages.cilkc);
(Prism.languages.cilkcpp = Prism.languages.insertBefore('cpp', 'function', {
  'parallel-keyword': {
    pattern: /\bcilk_(?:for|reducer|s(?:cope|pawn|ync))\b/,
    alias: 'keyword',
  },
})),
  (Prism.languages['cilk-cpp'] = Prism.languages.cilkcpp),
  (Prism.languages.cilk = Prism.languages.cilkcpp);
Prism.languages.cobol = {
  comment: {
    pattern: /\*>.*|(^[ \t]*)\*.*/m,
    lookbehind: !0,
    greedy: !0,
  },
  string: {
    pattern: /[xzgn]?(?:"(?:[^\r\n"]|"")*"(?!")|'(?:[^\r\n']|'')*'(?!'))/i,
    greedy: !0,
  },
  level: {
    pattern: /(^[ \t]*)\d+\b/m,
    lookbehind: !0,
    greedy: !0,
    alias: 'number',
  },
  'class-name': {
    pattern:
      /(\bpic(?:ture)?\s+)(?:(?:[-\w$/,:*+<>]|\.(?!\s|$))(?:\(\d+\))?)+/i,
    lookbehind: !0,
    inside: {
      number: {
        pattern: /(\()\d+/,
        lookbehind: !0,
      },
      punctuation: /[()]/,
    },
  },
  keyword: {
    pattern:
      /(^|[^\w-])(?:ABORT|ACCEPT|ACCESS|ADD|ADDRESS|ADVANCING|AFTER|ALIGNED|ALL|ALPHABET|ALPHABETIC|ALPHABETIC-LOWER|ALPHABETIC-UPPER|ALPHANUMERIC|ALPHANUMERIC-EDITED|ALSO|ALTER|ALTERNATE|ANY|ARE|AREA|AREAS|AS|ASCENDING|ASCII|ASSIGN|ASSOCIATED-DATA|ASSOCIATED-DATA-LENGTH|AT|ATTRIBUTE|AUTHOR|AUTO|AUTO-SKIP|BACKGROUND-COLOR|BACKGROUND-COLOUR|BASIS|BEEP|BEFORE|BEGINNING|BELL|BINARY|BIT|BLANK|BLINK|BLOCK|BOTTOM|BOUNDS|BY|BYFUNCTION|BYTITLE|CALL|CANCEL|CAPABLE|CCSVERSION|CD|CF|CH|CHAINING|CHANGED|CHANNEL|CHARACTER|CHARACTERS|CLASS|CLASS-ID|CLOCK-UNITS|CLOSE|CLOSE-DISPOSITION|COBOL|CODE|CODE-SET|COL|COLLATING|COLUMN|COM-REG|COMMA|COMMITMENT|COMMON|COMMUNICATION|COMP|COMP-1|COMP-2|COMP-3|COMP-4|COMP-5|COMPUTATIONAL|COMPUTATIONAL-1|COMPUTATIONAL-2|COMPUTATIONAL-3|COMPUTATIONAL-4|COMPUTATIONAL-5|COMPUTE|CONFIGURATION|CONTAINS|CONTENT|CONTINUE|CONTROL|CONTROL-POINT|CONTROLS|CONVENTION|CONVERTING|COPY|CORR|CORRESPONDING|COUNT|CRUNCH|CURRENCY|CURSOR|DATA|DATA-BASE|DATE|DATE-COMPILED|DATE-WRITTEN|DAY|DAY-OF-WEEK|DBCS|DE|DEBUG-CONTENTS|DEBUG-ITEM|DEBUG-LINE|DEBUG-NAME|DEBUG-SUB-1|DEBUG-SUB-2|DEBUG-SUB-3|DEBUGGING|DECIMAL-POINT|DECLARATIVES|DEFAULT|DEFAULT-DISPLAY|DEFINITION|DELETE|DELIMITED|DELIMITER|DEPENDING|DESCENDING|DESTINATION|DETAIL|DFHRESP|DFHVALUE|DISABLE|DISK|DISPLAY|DISPLAY-1|DIVIDE|DIVISION|DONTCARE|DOUBLE|DOWN|DUPLICATES|DYNAMIC|EBCDIC|EGCS|EGI|ELSE|EMI|EMPTY-CHECK|ENABLE|END|END-ACCEPT|END-ADD|END-CALL|END-COMPUTE|END-DELETE|END-DIVIDE|END-EVALUATE|END-IF|END-MULTIPLY|END-OF-PAGE|END-PERFORM|END-READ|END-RECEIVE|END-RETURN|END-REWRITE|END-SEARCH|END-START|END-STRING|END-SUBTRACT|END-UNSTRING|END-WRITE|ENDING|ENTER|ENTRY|ENTRY-PROCEDURE|ENVIRONMENT|EOL|EOP|EOS|ERASE|ERROR|ESCAPE|ESI|EVALUATE|EVENT|EVERY|EXCEPTION|EXCLUSIVE|EXHIBIT|EXIT|EXPORT|EXTEND|EXTENDED|EXTERNAL|FD|FILE|FILE-CONTROL|FILLER|FINAL|FIRST|FOOTING|FOR|FOREGROUND-COLOR|FOREGROUND-COLOUR|FROM|FULL|FUNCTION|FUNCTION-POINTER|FUNCTIONNAME|GENERATE|GIVING|GLOBAL|GO|GOBACK|GRID|GROUP|HEADING|HIGH-VALUE|HIGH-VALUES|HIGHLIGHT|I-O|I-O-CONTROL|ID|IDENTIFICATION|IF|IMPLICIT|IMPORT|IN|INDEX|INDEXED|INDICATE|INITIAL|INITIALIZE|INITIATE|INPUT|INPUT-OUTPUT|INSPECT|INSTALLATION|INTEGER|INTO|INVALID|INVOKE|IS|JUST|JUSTIFIED|KANJI|KEPT|KEY|KEYBOARD|LABEL|LANGUAGE|LAST|LB|LD|LEADING|LEFT|LEFTLINE|LENGTH|LENGTH-CHECK|LIBACCESS|LIBPARAMETER|LIBRARY|LIMIT|LIMITS|LINAGE|LINAGE-COUNTER|LINE|LINE-COUNTER|LINES|LINKAGE|LIST|LOCAL|LOCAL-STORAGE|LOCK|LONG-DATE|LONG-TIME|LOW-VALUE|LOW-VALUES|LOWER|LOWLIGHT|MEMORY|MERGE|MESSAGE|MMDDYYYY|MODE|MODULES|MORE-LABELS|MOVE|MULTIPLE|MULTIPLY|NAMED|NATIONAL|NATIONAL-EDITED|NATIVE|NEGATIVE|NETWORK|NEXT|NO|NO-ECHO|NULL|NULLS|NUMBER|NUMERIC|NUMERIC-DATE|NUMERIC-EDITED|NUMERIC-TIME|OBJECT-COMPUTER|OCCURS|ODT|OF|OFF|OMITTED|ON|OPEN|OPTIONAL|ORDER|ORDERLY|ORGANIZATION|OTHER|OUTPUT|OVERFLOW|OVERLINE|OWN|PACKED-DECIMAL|PADDING|PAGE|PAGE-COUNTER|PASSWORD|PERFORM|PF|PH|PIC|PICTURE|PLUS|POINTER|PORT|POSITION|POSITIVE|PRINTER|PRINTING|PRIVATE|PROCEDURE|PROCEDURE-POINTER|PROCEDURES|PROCEED|PROCESS|PROGRAM|PROGRAM-ID|PROGRAM-LIBRARY|PROMPT|PURGE|QUEUE|QUOTE|QUOTES|RANDOM|RD|READ|READER|REAL|RECEIVE|RECEIVED|RECORD|RECORDING|RECORDS|RECURSIVE|REDEFINES|REEL|REF|REFERENCE|REFERENCES|RELATIVE|RELEASE|REMAINDER|REMARKS|REMOTE|REMOVAL|REMOVE|RENAMES|REPLACE|REPLACING|REPORT|REPORTING|REPORTS|REQUIRED|RERUN|RESERVE|RESET|RETURN|RETURN-CODE|RETURNING|REVERSE-VIDEO|REVERSED|REWIND|REWRITE|RF|RH|RIGHT|ROUNDED|RUN|SAME|SAVE|SCREEN|SD|SEARCH|SECTION|SECURE|SECURITY|SEGMENT|SEGMENT-LIMIT|SELECT|SEND|SENTENCE|SEPARATE|SEQUENCE|SEQUENTIAL|SET|SHARED|SHAREDBYALL|SHAREDBYRUNUNIT|SHARING|SHIFT-IN|SHIFT-OUT|SHORT-DATE|SIGN|SIZE|SORT|SORT-CONTROL|SORT-CORE-SIZE|SORT-FILE-SIZE|SORT-MERGE|SORT-MESSAGE|SORT-MODE-SIZE|SORT-RETURN|SOURCE|SOURCE-COMPUTER|SPACE|SPACES|SPECIAL-NAMES|STANDARD|STANDARD-1|STANDARD-2|START|STATUS|STOP|STRING|SUB-QUEUE-1|SUB-QUEUE-2|SUB-QUEUE-3|SUBTRACT|SUM|SUPPRESS|SYMBOL|SYMBOLIC|SYNC|SYNCHRONIZED|TABLE|TALLY|TALLYING|TAPE|TASK|TERMINAL|TERMINATE|TEST|TEXT|THEN|THREAD|THREAD-LOCAL|THROUGH|THRU|TIME|TIMER|TIMES|TITLE|TO|TODAYS-DATE|TODAYS-NAME|TOP|TRAILING|TRUNCATED|TYPE|TYPEDEF|UNDERLINE|UNIT|UNSTRING|UNTIL|UP|UPON|USAGE|USE|USING|VALUE|VALUES|VARYING|VIRTUAL|WAIT|WHEN|WHEN-COMPILED|WITH|WORDS|WORKING-STORAGE|WRITE|YEAR|YYYYDDD|YYYYMMDD|ZERO-FILL|ZEROES|ZEROS)(?![\w-])/i,
    lookbehind: !0,
  },
  boolean: {
    pattern: /(^|[^\w-])(?:false|true)(?![\w-])/i,
    lookbehind: !0,
  },
  number: {
    pattern:
      /(^|[^\w-])(?:[+-]?(?:(?:\d+(?:[.,]\d+)?|[.,]\d+)(?:e[+-]?\d+)?|zero))(?![\w-])/i,
    lookbehind: !0,
  },
  operator: [
    /<>|[<>]=?|[=+*/&]/,
    {
      pattern: /(^|[^\w-])(?:-|and|equal|greater|less|not|or|than)(?![\w-])/i,
      lookbehind: !0,
    },
  ],
  punctuation: /[.:,()]/,
};
!(function (e) {
  var t = /#(?!\{).+/,
    n = {
      pattern: /#\{[^}]+\}/,
      alias: 'variable',
    };
  (e.languages.coffeescript = e.languages.extend('javascript', {
    comment: t,
    string: [
      {
        pattern: /'(?:\\[\s\S]|[^\\'])*'/,
        greedy: !0,
      },
      {
        pattern: /"(?:\\[\s\S]|[^\\"])*"/,
        greedy: !0,
        inside: {
          interpolation: n,
        },
      },
    ],
    keyword:
      /\b(?:and|break|by|catch|class|continue|debugger|delete|do|each|else|extend|extends|false|finally|for|if|in|instanceof|is|isnt|let|loop|namespace|new|no|not|null|of|off|on|or|own|return|super|switch|then|this|throw|true|try|typeof|undefined|unless|until|when|while|window|with|yes|yield)\b/,
    'class-member': {
      pattern: /@(?!\d)\w+/,
      alias: 'variable',
    },
  })),
    e.languages.insertBefore('coffeescript', 'comment', {
      'multiline-comment': {
        pattern: /###[\s\S]+?###/,
        alias: 'comment',
      },
      'block-regex': {
        pattern: /\/{3}[\s\S]*?\/{3}/,
        alias: 'regex',
        inside: {
          comment: t,
          interpolation: n,
        },
      },
    }),
    e.languages.insertBefore('coffeescript', 'string', {
      'inline-javascript': {
        pattern: /`(?:\\[\s\S]|[^\\`])*`/,
        inside: {
          delimiter: {
            pattern: /^`|`$/,
            alias: 'punctuation',
          },
          script: {
            pattern: /[\s\S]+/,
            alias: 'language-javascript',
            inside: e.languages.javascript,
          },
        },
      },
      'multiline-string': [
        {
          pattern: /'''[\s\S]*?'''/,
          greedy: !0,
          alias: 'string',
        },
        {
          pattern: /"""[\s\S]*?"""/,
          greedy: !0,
          alias: 'string',
          inside: {
            interpolation: n,
          },
        },
      ],
    }),
    e.languages.insertBefore('coffeescript', 'keyword', {
      property: /(?!\d)\w+(?=\s*:(?!:))/,
    }),
    delete e.languages.coffeescript['template-string'],
    (e.languages.coffee = e.languages.coffeescript);
})(Prism);
!(function (e) {
  function n(e) {
    return RegExp('([ \t])(?:' + e + ')(?=[\\s;]|$)', 'i');
  }
  e.languages.csp = {
    directive: {
      pattern:
        /(^|[\s;])(?:base-uri|block-all-mixed-content|(?:child|connect|default|font|frame|img|manifest|media|object|prefetch|script|style|worker)-src|disown-opener|form-action|frame-(?:ancestors|options)|input-protection(?:-(?:clip|selectors))?|navigate-to|plugin-types|policy-uri|referrer|reflected-xss|report-(?:to|uri)|require-sri-for|sandbox|(?:script|style)-src-(?:attr|elem)|upgrade-insecure-requests)(?=[\s;]|$)/i,
      lookbehind: !0,
      alias: 'property',
    },
    scheme: {
      pattern: n('[a-z][a-z0-9.+-]*:'),
      lookbehind: !0,
    },
    none: {
      pattern: n("'none'"),
      lookbehind: !0,
      alias: 'keyword',
    },
    nonce: {
      pattern: n("'nonce-[-+/\\w=]+'"),
      lookbehind: !0,
      alias: 'number',
    },
    hash: {
      pattern: n("'sha(?:256|384|512)-[-+/\\w=]+'"),
      lookbehind: !0,
      alias: 'number',
    },
    host: {
      pattern: n(
        "[a-z][a-z0-9.+-]*://[^\\s;,']*|\\*[^\\s;,']*|[a-z0-9-]+(?:\\.[a-z0-9-]+)+(?::[\\d*]+)?(?:/[^\\s;,']*)?",
      ),
      lookbehind: !0,
      alias: 'url',
      inside: {
        important: /\*/,
      },
    },
    keyword: [
      {
        pattern: n("'unsafe-[a-z-]+'"),
        lookbehind: !0,
        alias: 'unsafe',
      },
      {
        pattern: n("'[a-z-]+'"),
        lookbehind: !0,
        alias: 'safe',
      },
    ],
    punctuation: /;/,
  };
})(Prism);
!(function (e) {
  var a,
    n = /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/;
  (e.languages.css.selector = {
    pattern: e.languages.css.selector.pattern,
    lookbehind: !0,
    inside: (a = {
      'pseudo-element':
        /:(?:after|before|first-letter|first-line|selection)|::[-\w]+/,
      'pseudo-class': /:[-\w]+/,
      class: /\.[-\w]+/,
      id: /#[-\w]+/,
      attribute: {
        pattern: RegExp('\\[(?:[^[\\]"\']|' + n.source + ')*\\]'),
        greedy: !0,
        inside: {
          punctuation: /^\[|\]$/,
          'case-sensitivity': {
            pattern: /(\s)[si]$/i,
            lookbehind: !0,
            alias: 'keyword',
          },
          namespace: {
            pattern: /^(\s*)(?:(?!\s)[-*\w\xA0-\uFFFF])*\|(?!=)/,
            lookbehind: !0,
            inside: {
              punctuation: /\|$/,
            },
          },
          'attr-name': {
            pattern: /^(\s*)(?:(?!\s)[-\w\xA0-\uFFFF])+/,
            lookbehind: !0,
          },
          'attr-value': [
            n,
            {
              pattern: /(=\s*)(?:(?!\s)[-\w\xA0-\uFFFF])+(?=\s*$)/,
              lookbehind: !0,
            },
          ],
          operator: /[|~*^$]?=/,
        },
      },
      'n-th': [
        {
          pattern: /(\(\s*)[+-]?\d*[\dn](?:\s*[+-]\s*\d+)?(?=\s*\))/,
          lookbehind: !0,
          inside: {
            number: /[\dn]+/,
            operator: /[+-]/,
          },
        },
        {
          pattern: /(\(\s*)(?:even|odd)(?=\s*\))/i,
          lookbehind: !0,
        },
      ],
      combinator: />|\+|~|\|\|/,
      punctuation: /[(),]/,
    }),
  }),
    (e.languages.css.atrule.inside['selector-function-argument'].inside = a),
    e.languages.insertBefore('css', 'property', {
      variable: {
        pattern:
          /(^|[^-\w\xA0-\uFFFF])--(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*/i,
        lookbehind: !0,
      },
    });
  var r = {
      pattern: /(\b\d+)(?:%|[a-z]+(?![\w-]))/,
      lookbehind: !0,
    },
    i = {
      pattern: /(^|[^\w.-])-?(?:\d+(?:\.\d+)?|\.\d+)/,
      lookbehind: !0,
    };
  e.languages.insertBefore('css', 'function', {
    operator: {
      pattern: /(\s)[+\-*\/](?=\s)/,
      lookbehind: !0,
    },
    hexcode: {
      pattern: /\B#[\da-f]{3,8}\b/i,
      alias: 'color',
    },
    color: [
      {
        pattern:
          /(^|[^\w-])(?:AliceBlue|AntiqueWhite|Aqua|Aquamarine|Azure|Beige|Bisque|Black|BlanchedAlmond|Blue|BlueViolet|Brown|BurlyWood|CadetBlue|Chartreuse|Chocolate|Coral|CornflowerBlue|Cornsilk|Crimson|Cyan|DarkBlue|DarkCyan|DarkGoldenRod|DarkGr[ae]y|DarkGreen|DarkKhaki|DarkMagenta|DarkOliveGreen|DarkOrange|DarkOrchid|DarkRed|DarkSalmon|DarkSeaGreen|DarkSlateBlue|DarkSlateGr[ae]y|DarkTurquoise|DarkViolet|DeepPink|DeepSkyBlue|DimGr[ae]y|DodgerBlue|FireBrick|FloralWhite|ForestGreen|Fuchsia|Gainsboro|GhostWhite|Gold|GoldenRod|Gr[ae]y|Green|GreenYellow|HoneyDew|HotPink|IndianRed|Indigo|Ivory|Khaki|Lavender|LavenderBlush|LawnGreen|LemonChiffon|LightBlue|LightCoral|LightCyan|LightGoldenRodYellow|LightGr[ae]y|LightGreen|LightPink|LightSalmon|LightSeaGreen|LightSkyBlue|LightSlateGr[ae]y|LightSteelBlue|LightYellow|Lime|LimeGreen|Linen|Magenta|Maroon|MediumAquaMarine|MediumBlue|MediumOrchid|MediumPurple|MediumSeaGreen|MediumSlateBlue|MediumSpringGreen|MediumTurquoise|MediumVioletRed|MidnightBlue|MintCream|MistyRose|Moccasin|NavajoWhite|Navy|OldLace|Olive|OliveDrab|Orange|OrangeRed|Orchid|PaleGoldenRod|PaleGreen|PaleTurquoise|PaleVioletRed|PapayaWhip|PeachPuff|Peru|Pink|Plum|PowderBlue|Purple|RebeccaPurple|Red|RosyBrown|RoyalBlue|SaddleBrown|Salmon|SandyBrown|SeaGreen|SeaShell|Sienna|Silver|SkyBlue|SlateBlue|SlateGr[ae]y|Snow|SpringGreen|SteelBlue|Tan|Teal|Thistle|Tomato|Transparent|Turquoise|Violet|Wheat|White|WhiteSmoke|Yellow|YellowGreen)(?![\w-])/i,
        lookbehind: !0,
      },
      {
        pattern:
          /\b(?:hsl|rgb)\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*\)\B|\b(?:hsl|rgb)a\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*(?:0|0?\.\d+|1)\s*\)\B/i,
        inside: {
          unit: r,
          number: i,
          function: /[\w-]+(?=\()/,
          punctuation: /[(),]/,
        },
      },
    ],
    entity: /\\[\da-f]{1,8}/i,
    unit: r,
    number: i,
  });
})(Prism);
Prism.languages.csv = {
  value: /[^\r\n,"]+|"(?:[^"]|"")*"(?!")/,
  punctuation: /,/,
};
Prism.languages.cypher = {
  comment: /\/\/.*/,
  string: {
    pattern: /"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*'/,
    greedy: !0,
  },
  'class-name': {
    pattern: /(:\s*)(?:\w+|`(?:[^`\\\r\n])*`)(?=\s*[{):])/,
    lookbehind: !0,
    greedy: !0,
  },
  relationship: {
    pattern:
      /(-\[\s*(?:\w+\s*|`(?:[^`\\\r\n])*`\s*)?:\s*|\|\s*:\s*)(?:\w+|`(?:[^`\\\r\n])*`)/,
    lookbehind: !0,
    greedy: !0,
    alias: 'property',
  },
  identifier: {
    pattern: /`(?:[^`\\\r\n])*`/,
    greedy: !0,
  },
  variable: /\$\w+/,
  keyword:
    /\b(?:ADD|ALL|AND|AS|ASC|ASCENDING|ASSERT|BY|CALL|CASE|COMMIT|CONSTRAINT|CONTAINS|CREATE|CSV|DELETE|DESC|DESCENDING|DETACH|DISTINCT|DO|DROP|ELSE|END|ENDS|EXISTS|FOR|FOREACH|IN|INDEX|IS|JOIN|KEY|LIMIT|LOAD|MANDATORY|MATCH|MERGE|NODE|NOT|OF|ON|OPTIONAL|OR|ORDER(?=\s+BY)|PERIODIC|REMOVE|REQUIRE|RETURN|SCALAR|SCAN|SET|SKIP|START|STARTS|THEN|UNION|UNIQUE|UNWIND|USING|WHEN|WHERE|WITH|XOR|YIELD)\b/i,
  function: /\b\w+\b(?=\s*\()/,
  boolean: /\b(?:false|null|true)\b/i,
  number: /\b(?:0x[\da-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/,
  operator: /:|<--?|--?>?|<>|=~?|[<>]=?|[+*/%^|]|\.\.\.?/,
  punctuation: /[()[\]{},;.]/,
};
(Prism.languages.d = Prism.languages.extend('clike', {
  comment: [
    {
      pattern: /^\s*#!.+/,
      greedy: !0,
    },
    {
      pattern: RegExp(
        '(^|[^\\\\])(?:' +
          [
            '/\\+(?:/\\+(?:[^+]|\\+(?!/))*\\+/|(?!/\\+)[^])*?\\+/',
            '//.*',
            '/\\*[^]*?\\*/',
          ].join('|') +
          ')',
      ),
      lookbehind: !0,
      greedy: !0,
    },
  ],
  string: [
    {
      pattern: RegExp(
        [
          '\\b[rx]"(?:\\\\[^]|[^\\\\"])*"[cwd]?',
          '\\bq"(?:\\[[^]*?\\]|\\([^]*?\\)|<[^]*?>|\\{[^]*?\\})"',
          '\\bq"((?!\\d)\\w+)$[^]*?^\\1"',
          '\\bq"(.)[^]*?\\2"',
          '(["`])(?:\\\\[^]|(?!\\3)[^\\\\])*\\3[cwd]?',
        ].join('|'),
        'm',
      ),
      greedy: !0,
    },
    {
      pattern: /\bq\{(?:\{[^{}]*\}|[^{}])*\}/,
      greedy: !0,
      alias: 'token-string',
    },
  ],
  keyword:
    /\$|\b(?:__(?:(?:DATE|EOF|FILE|FUNCTION|LINE|MODULE|PRETTY_FUNCTION|TIMESTAMP|TIME|VENDOR|VERSION)__|gshared|parameters|traits|vector)|abstract|alias|align|asm|assert|auto|body|bool|break|byte|case|cast|catch|cdouble|cent|cfloat|char|class|const|continue|creal|dchar|debug|default|delegate|delete|deprecated|do|double|dstring|else|enum|export|extern|false|final|finally|float|for|foreach|foreach_reverse|function|goto|idouble|if|ifloat|immutable|import|inout|int|interface|invariant|ireal|lazy|long|macro|mixin|module|new|nothrow|null|out|override|package|pragma|private|protected|ptrdiff_t|public|pure|real|ref|return|scope|shared|short|size_t|static|string|struct|super|switch|synchronized|template|this|throw|true|try|typedef|typeid|typeof|ubyte|ucent|uint|ulong|union|unittest|ushort|version|void|volatile|wchar|while|with|wstring)\b/,
  number: [
    /\b0x\.?[a-f\d_]+(?:(?!\.\.)\.[a-f\d_]*)?(?:p[+-]?[a-f\d_]+)?[ulfi]{0,4}/i,
    {
      pattern:
        /((?:\.\.)?)(?:\b0b\.?|\b|\.)\d[\d_]*(?:(?!\.\.)\.[\d_]*)?(?:e[+-]?\d[\d_]*)?[ulfi]{0,4}/i,
      lookbehind: !0,
    },
  ],
  operator:
    /\|[|=]?|&[&=]?|\+[+=]?|-[-=]?|\.?\.\.|=[>=]?|!(?:i[ns]\b|<>?=?|>=?|=)?|\bi[ns]\b|(?:<[<>]?|>>?>?|\^\^|[*\/%^~])=?/,
})),
  Prism.languages.insertBefore('d', 'string', {
    char: /'(?:\\(?:\W|\w+)|[^\\])'/,
  }),
  Prism.languages.insertBefore('d', 'keyword', {
    property: /\B@\w*/,
  }),
  Prism.languages.insertBefore('d', 'function', {
    register: {
      pattern:
        /\b(?:[ABCD][LHX]|E?(?:BP|DI|SI|SP)|[BS]PL|[ECSDGF]S|CR[0234]|[DS]IL|DR[012367]|E[ABCD]X|X?MM[0-7]|R(?:1[0-5]|[89])[BWD]?|R[ABCD]X|R[BS]P|R[DS]I|TR[3-7]|XMM(?:1[0-5]|[89])|YMM(?:1[0-5]|\d))\b|\bST(?:\([0-7]\)|\b)/,
      alias: 'variable',
    },
  });
!(function (e) {
  var a = [
      /\b(?:async|sync|yield)\*/,
      /\b(?:abstract|assert|async|await|break|case|catch|class|const|continue|covariant|default|deferred|do|dynamic|else|enum|export|extends|extension|external|factory|final|finally|for|get|hide|if|implements|import|in|interface|library|mixin|new|null|on|operator|part|rethrow|return|set|show|static|super|switch|sync|this|throw|try|typedef|var|void|while|with|yield)\b/,
    ],
    n = '(^|[^\\w.])(?:[a-z]\\w*\\s*\\.\\s*)*(?:[A-Z]\\w*\\s*\\.\\s*)*',
    s = {
      pattern: RegExp(n + '[A-Z](?:[\\d_A-Z]*[a-z]\\w*)?\\b'),
      lookbehind: !0,
      inside: {
        namespace: {
          pattern: /^[a-z]\w*(?:\s*\.\s*[a-z]\w*)*(?:\s*\.)?/,
          inside: {
            punctuation: /\./,
          },
        },
      },
    };
  (e.languages.dart = e.languages.extend('clike', {
    'class-name': [
      s,
      {
        pattern: RegExp(n + '[A-Z]\\w*(?=\\s+\\w+\\s*[;,=()])'),
        lookbehind: !0,
        inside: s.inside,
      },
    ],
    keyword: a,
    operator:
      /\bis!|\b(?:as|is)\b|\+\+|--|&&|\|\||<<=?|>>=?|~(?:\/=?)?|[+\-*\/%&^|=!<>]=?|\?/,
  })),
    e.languages.insertBefore('dart', 'string', {
      'string-literal': {
        pattern:
          /r?(?:("""|''')[\s\S]*?\1|(["'])(?:\\.|(?!\2)[^\\\r\n])*\2(?!\2))/,
        greedy: !0,
        inside: {
          interpolation: {
            pattern:
              /((?:^|[^\\])(?:\\{2})*)\$(?:\w+|\{(?:[^{}]|\{[^{}]*\})*\})/,
            lookbehind: !0,
            inside: {
              punctuation: /^\$\{?|\}$/,
              expression: {
                pattern: /[\s\S]+/,
                inside: e.languages.dart,
              },
            },
          },
          string: /[\s\S]+/,
        },
      },
      string: void 0,
    }),
    e.languages.insertBefore('dart', 'class-name', {
      metadata: {
        pattern: /@\w+/,
        alias: 'function',
      },
    }),
    e.languages.insertBefore('dart', 'class-name', {
      generics: {
        pattern:
          /<(?:[\w\s,.&?]|<(?:[\w\s,.&?]|<(?:[\w\s,.&?]|<[\w\s,.&?]*>)*>)*>)*>/,
        inside: {
          'class-name': s,
          keyword: a,
          punctuation: /[<>(),.:]/,
          operator: /[?&|]/,
        },
      },
    });
})(Prism);
!(function (e) {
  e.languages.diff = {
    coord: [/^(?:\*{3}|-{3}|\+{3}).*$/m, /^@@.*@@$/m, /^\d.*$/m],
  };
  var n = {
    'deleted-sign': '-',
    'deleted-arrow': '<',
    'inserted-sign': '+',
    'inserted-arrow': '>',
    unchanged: ' ',
    diff: '!',
  };
  Object.keys(n).forEach(function (a) {
    var i = n[a],
      r = [];
    /^\w+$/.test(a) || r.push(/\w+/.exec(a)[0]),
      'diff' === a && r.push('bold'),
      (e.languages.diff[a] = {
        pattern: RegExp('^(?:[' + i + '].*(?:\r\n?|\n|(?![\\s\\S])))+', 'm'),
        alias: r,
        inside: {
          line: {
            pattern: /(.)(?=[\s\S]).*(?:\r\n?|\n)?/,
            lookbehind: !0,
          },
          prefix: {
            pattern: /[\s\S]/,
            alias: /\w+/.exec(a)[0],
          },
        },
      });
  }),
    Object.defineProperty(e.languages.diff, 'PREFIXES', {
      value: n,
    });
})(Prism);
!(function (e) {
  function n(e, n) {
    return '___' + e.toUpperCase() + n + '___';
  }
  Object.defineProperties((e.languages['markup-templating'] = {}), {
    buildPlaceholders: {
      value: function (t, a, r, o) {
        if (t.language === a) {
          var c = (t.tokenStack = []);
          (t.code = t.code.replace(r, function (e) {
            if ('function' == typeof o && !o(e)) return e;
            for (var r, i = c.length; -1 !== t.code.indexOf((r = n(a, i))); )
              ++i;
            return (c[i] = e), r;
          })),
            (t.grammar = e.languages.markup);
        }
      },
    },
    tokenizePlaceholders: {
      value: function (t, a) {
        if (t.language === a && t.tokenStack) {
          t.grammar = e.languages[a];
          var r = 0,
            o = Object.keys(t.tokenStack);
          !(function c(i) {
            for (var u = 0; u < i.length && !(r >= o.length); u++) {
              var g = i[u];
              if (
                'string' == typeof g ||
                (g.content && 'string' == typeof g.content)
              ) {
                var l = o[r],
                  s = t.tokenStack[l],
                  f = 'string' == typeof g ? g : g.content,
                  p = n(a, l),
                  k = f.indexOf(p);
                if (k > -1) {
                  ++r;
                  var m = f.substring(0, k),
                    d = new e.Token(
                      a,
                      e.tokenize(s, t.grammar),
                      'language-' + a,
                      s,
                    ),
                    h = f.substring(k + p.length),
                    v = [];
                  m && v.push.apply(v, c([m])),
                    v.push(d),
                    h && v.push.apply(v, c([h])),
                    'string' == typeof g
                      ? i.splice.apply(i, [u, 1].concat(v))
                      : (g.content = v);
                }
              } else g.content && c(g.content);
            }
            return i;
          })(t.tokens);
        }
      },
    },
  });
})(Prism);
!(function (e) {
  e.languages.django = {
    comment: /^\{#[\s\S]*?#\}$/,
    tag: {
      pattern: /(^\{%[+-]?\s*)\w+/,
      lookbehind: !0,
      alias: 'keyword',
    },
    delimiter: {
      pattern: /^\{[{%][+-]?|[+-]?[}%]\}$/,
      alias: 'punctuation',
    },
    string: {
      pattern: /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/,
      greedy: !0,
    },
    filter: {
      pattern: /(\|)\w+/,
      lookbehind: !0,
      alias: 'function',
    },
    test: {
      pattern: /(\bis\s+(?:not\s+)?)(?!not\b)\w+/,
      lookbehind: !0,
      alias: 'function',
    },
    function: /\b[a-z_]\w+(?=\s*\()/i,
    keyword:
      /\b(?:and|as|by|else|for|if|import|in|is|loop|not|or|recursive|with|without)\b/,
    operator: /[-+%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
    number: /\b\d+(?:\.\d+)?\b/,
    boolean: /[Ff]alse|[Nn]one|[Tt]rue/,
    variable: /\b\w+\b/,
    punctuation: /[{}[\](),.:;]/,
  };
  var n = /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}|\{#[\s\S]*?#\}/g,
    o = e.languages['markup-templating'];
  e.hooks.add('before-tokenize', function (e) {
    o.buildPlaceholders(e, 'django', n);
  }),
    e.hooks.add('after-tokenize', function (e) {
      o.tokenizePlaceholders(e, 'django');
    }),
    (e.languages.jinja2 = e.languages.django),
    e.hooks.add('before-tokenize', function (e) {
      o.buildPlaceholders(e, 'jinja2', n);
    }),
    e.hooks.add('after-tokenize', function (e) {
      o.tokenizePlaceholders(e, 'jinja2');
    });
})(Prism);
(Prism.languages['dns-zone-file'] = {
  comment: /;.*/,
  string: {
    pattern: /"(?:\\.|[^"\\\r\n])*"/,
    greedy: !0,
  },
  variable: [
    {
      pattern: /(^\$ORIGIN[ \t]+)\S+/m,
      lookbehind: !0,
    },
    {
      pattern: /(^|\s)@(?=\s|$)/,
      lookbehind: !0,
    },
  ],
  keyword: /^\$(?:INCLUDE|ORIGIN|TTL)(?=\s|$)/m,
  class: {
    pattern: /(^|\s)(?:CH|CS|HS|IN)(?=\s|$)/,
    lookbehind: !0,
    alias: 'keyword',
  },
  type: {
    pattern:
      /(^|\s)(?:A|A6|AAAA|AFSDB|APL|ATMA|CAA|CDNSKEY|CDS|CERT|CNAME|DHCID|DLV|DNAME|DNSKEY|DS|EID|GID|GPOS|HINFO|HIP|IPSECKEY|ISDN|KEY|KX|LOC|MAILA|MAILB|MB|MD|MF|MG|MINFO|MR|MX|NAPTR|NB|NBSTAT|NIMLOC|NINFO|NS|NSAP|NSAP-PTR|NSEC|NSEC3|NSEC3PARAM|NULL|NXT|OPENPGPKEY|PTR|PX|RKEY|RP|RRSIG|RT|SIG|SINK|SMIMEA|SOA|SPF|SRV|SSHFP|TA|TKEY|TLSA|TSIG|TXT|UID|UINFO|UNSPEC|URI|WKS|X25)(?=\s|$)/,
    lookbehind: !0,
    alias: 'keyword',
  },
  punctuation: /[()]/,
}),
  (Prism.languages['dns-zone'] = Prism.languages['dns-zone-file']);
!(function (e) {
  var n = '(?:[ \t]+(?![ \t])(?:<SP_BS>)?|<SP_BS>)'.replace(
      /<SP_BS>/g,
      function () {
        return '\\\\[\r\n](?:\\s|\\\\[\r\n]|#.*(?!.))*(?![\\s#]|\\\\[\r\n])';
      },
    ),
    r =
      '"(?:[^"\\\\\r\n]|\\\\(?:\r\n|[^]))*"|\'(?:[^\'\\\\\r\n]|\\\\(?:\r\n|[^]))*\'',
    t = '--[\\w-]+=(?:<STR>|(?!["\'])(?:[^\\s\\\\]|\\\\.)+)'.replace(
      /<STR>/g,
      function () {
        return r;
      },
    ),
    o = {
      pattern: RegExp(r),
      greedy: !0,
    },
    i = {
      pattern: /(^[ \t]*)#.*/m,
      lookbehind: !0,
      greedy: !0,
    };
  function a(e, r) {
    return (
      (e = e
        .replace(/<OPT>/g, function () {
          return t;
        })
        .replace(/<SP>/g, function () {
          return n;
        })),
      RegExp(e, r)
    );
  }
  (e.languages.docker = {
    instruction: {
      pattern:
        /(^[ \t]*)(?:ADD|ARG|CMD|COPY|ENTRYPOINT|ENV|EXPOSE|FROM|HEALTHCHECK|LABEL|MAINTAINER|ONBUILD|RUN|SHELL|STOPSIGNAL|USER|VOLUME|WORKDIR)(?=\s)(?:\\.|[^\r\n\\])*(?:\\$(?:\s|#.*$)*(?![\s#])(?:\\.|[^\r\n\\])*)*/im,
      lookbehind: !0,
      greedy: !0,
      inside: {
        options: {
          pattern: a('(^(?:ONBUILD<SP>)?\\w+<SP>)<OPT>(?:<SP><OPT>)*', 'i'),
          lookbehind: !0,
          greedy: !0,
          inside: {
            property: {
              pattern: /(^|\s)--[\w-]+/,
              lookbehind: !0,
            },
            string: [
              o,
              {
                pattern: /(=)(?!["'])(?:[^\s\\]|\\.)+/,
                lookbehind: !0,
              },
            ],
            operator: /\\$/m,
            punctuation: /=/,
          },
        },
        keyword: [
          {
            pattern: a(
              '(^(?:ONBUILD<SP>)?HEALTHCHECK<SP>(?:<OPT><SP>)*)(?:CMD|NONE)\\b',
              'i',
            ),
            lookbehind: !0,
            greedy: !0,
          },
          {
            pattern: a(
              '(^(?:ONBUILD<SP>)?FROM<SP>(?:<OPT><SP>)*(?!--)[^ \t\\\\]+<SP>)AS',
              'i',
            ),
            lookbehind: !0,
            greedy: !0,
          },
          {
            pattern: a('(^ONBUILD<SP>)\\w+', 'i'),
            lookbehind: !0,
            greedy: !0,
          },
          {
            pattern: /^\w+/,
            greedy: !0,
          },
        ],
        comment: i,
        string: o,
        variable: /\$(?:\w+|\{[^{}"'\\]*\})/,
        operator: /\\$/m,
      },
    },
    comment: i,
  }),
    (e.languages.dockerfile = e.languages.docker);
})(Prism);
Prism.languages.ebnf = {
  comment: /\(\*[\s\S]*?\*\)/,
  string: {
    pattern: /"[^"\r\n]*"|'[^'\r\n]*'/,
    greedy: !0,
  },
  special: {
    pattern: /\?[^?\r\n]*\?/,
    greedy: !0,
    alias: 'class-name',
  },
  definition: {
    pattern: /^([\t ]*)[a-z]\w*(?:[ \t]+[a-z]\w*)*(?=\s*=)/im,
    lookbehind: !0,
    alias: ['rule', 'keyword'],
  },
  rule: /\b[a-z]\w*(?:[ \t]+[a-z]\w*)*\b/i,
  punctuation: /\([:/]|[:/]\)|[.,;()[\]{}]/,
  operator: /[-=|*/!]/,
};
Prism.languages.editorconfig = {
  comment: /[;#].*/,
  section: {
    pattern: /(^[ \t]*)\[.+\]/m,
    lookbehind: !0,
    alias: 'selector',
    inside: {
      regex: /\\\\[\[\]{},!?.*]/,
      operator: /[!?]|\.\.|\*{1,2}/,
      punctuation: /[\[\]{},]/,
    },
  },
  key: {
    pattern: /(^[ \t]*)[^\s=]+(?=[ \t]*=)/m,
    lookbehind: !0,
    alias: 'attr-name',
  },
  value: {
    pattern: /=.*/,
    alias: 'attr-value',
    inside: {
      punctuation: /^=/,
    },
  },
};
Prism.languages.eiffel = {
  comment: /--.*/,
  string: [
    {
      pattern: /"([^[]*)\[[\s\S]*?\]\1"/,
      greedy: !0,
    },
    {
      pattern: /"([^{]*)\{[\s\S]*?\}\1"/,
      greedy: !0,
    },
    {
      pattern: /"(?:%(?:(?!\n)\s)*\n\s*%|%\S|[^%"\r\n])*"/,
      greedy: !0,
    },
  ],
  char: /'(?:%.|[^%'\r\n])+'/,
  keyword:
    /\b(?:across|agent|alias|all|and|as|assign|attached|attribute|check|class|convert|create|Current|debug|deferred|detachable|do|else|elseif|end|ensure|expanded|export|external|feature|from|frozen|if|implies|inherit|inspect|invariant|like|local|loop|not|note|obsolete|old|once|or|Precursor|redefine|rename|require|rescue|Result|retry|select|separate|some|then|undefine|until|variant|Void|when|xor)\b/i,
  boolean: /\b(?:False|True)\b/i,
  'class-name': /\b[A-Z][\dA-Z_]*\b/,
  number: [
    /\b0[xcb][\da-f](?:_*[\da-f])*\b/i,
    /(?:\b\d(?:_*\d)*)?\.(?:(?:\d(?:_*\d)*)?e[+-]?)?\d(?:_*\d)*\b|\b\d(?:_*\d)*\b\.?/i,
  ],
  punctuation: /:=|<<|>>|\(\||\|\)|->|\.(?=\w)|[{}[\];(),:?]/,
  operator: /\\\\|\|\.\.\||\.\.|\/[~\/=]?|[><]=?|[-+*^=~]/,
};
(Prism.languages.elixir = {
  doc: {
    pattern:
      /@(?:doc|moduledoc)\s+(?:("""|''')[\s\S]*?\1|("|')(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2)/,
    inside: {
      attribute: /^@\w+/,
      string: /['"][\s\S]+/,
    },
  },
  comment: {
    pattern: /#.*/,
    greedy: !0,
  },
  regex: {
    pattern:
      /~[rR](?:("""|''')(?:\\[\s\S]|(?!\1)[^\\])+\1|([\/|"'])(?:\\.|(?!\2)[^\\\r\n])+\2|\((?:\\.|[^\\)\r\n])+\)|\[(?:\\.|[^\\\]\r\n])+\]|\{(?:\\.|[^\\}\r\n])+\}|<(?:\\.|[^\\>\r\n])+>)[uismxfr]*/,
    greedy: !0,
  },
  string: [
    {
      pattern:
        /~[cCsSwW](?:("""|''')(?:\\[\s\S]|(?!\1)[^\\])+\1|([\/|"'])(?:\\.|(?!\2)[^\\\r\n])+\2|\((?:\\.|[^\\)\r\n])+\)|\[(?:\\.|[^\\\]\r\n])+\]|\{(?:\\.|#\{[^}]+\}|#(?!\{)|[^#\\}\r\n])+\}|<(?:\\.|[^\\>\r\n])+>)[csa]?/,
      greedy: !0,
      inside: {},
    },
    {
      pattern: /("""|''')[\s\S]*?\1/,
      greedy: !0,
      inside: {},
    },
    {
      pattern: /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
      greedy: !0,
      inside: {},
    },
  ],
  atom: {
    pattern: /(^|[^:]):\w+/,
    lookbehind: !0,
    alias: 'symbol',
  },
  module: {
    pattern: /\b[A-Z]\w*\b/,
    alias: 'class-name',
  },
  'attr-name': /\b\w+\??:(?!:)/,
  argument: {
    pattern: /(^|[^&])&\d+/,
    lookbehind: !0,
    alias: 'variable',
  },
  attribute: {
    pattern: /@\w+/,
    alias: 'variable',
  },
  function: /\b[_a-zA-Z]\w*[?!]?(?:(?=\s*(?:\.\s*)?\()|(?=\/\d))/,
  number: /\b(?:0[box][a-f\d_]+|\d[\d_]*)(?:\.[\d_]+)?(?:e[+-]?[\d_]+)?\b/i,
  keyword:
    /\b(?:after|alias|and|case|catch|cond|def(?:callback|delegate|exception|impl|macro|module|n|np|p|protocol|struct)?|do|else|end|fn|for|if|import|not|or|quote|raise|require|rescue|try|unless|unquote|use|when)\b/,
  boolean: /\b(?:false|nil|true)\b/,
  operator: [
    /\bin\b|&&?|\|[|>]?|\\\\|::|\.\.\.?|\+\+?|-[->]?|<[-=>]|>=|!==?|\B!|=(?:==?|[>~])?|[*\/^]/,
    {
      pattern: /([^<])<(?!<)/,
      lookbehind: !0,
    },
    {
      pattern: /([^>])>(?!>)/,
      lookbehind: !0,
    },
  ],
  punctuation: /<<|>>|[.,%\[\]{}()]/,
}),
  Prism.languages.elixir.string.forEach(function (e) {
    e.inside = {
      interpolation: {
        pattern: /#\{[^}]+\}/,
        inside: {
          delimiter: {
            pattern: /^#\{|\}$/,
            alias: 'punctuation',
          },
          rest: Prism.languages.elixir,
        },
      },
    };
  });
Prism.languages.erlang = {
  comment: /%.+/,
  string: {
    pattern: /"(?:\\.|[^\\"\r\n])*"/,
    greedy: !0,
  },
  'quoted-function': {
    pattern: /'(?:\\.|[^\\'\r\n])+'(?=\()/,
    alias: 'function',
  },
  'quoted-atom': {
    pattern: /'(?:\\.|[^\\'\r\n])+'/,
    alias: 'atom',
  },
  boolean: /\b(?:false|true)\b/,
  keyword: /\b(?:after|begin|case|catch|end|fun|if|of|receive|try|when)\b/,
  number: [
    /\$\\?./,
    /\b\d+#[a-z0-9]+/i,
    /(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
  ],
  function: /\b[a-z][\w@]*(?=\()/,
  variable: {
    pattern: /(^|[^@])(?:\b|\?)[A-Z_][\w@]*/,
    lookbehind: !0,
  },
  operator: [
    /[=\/<>:]=|=[:\/]=|\+\+?|--?|[=*\/!]|\b(?:and|andalso|band|bnot|bor|bsl|bsr|bxor|div|not|or|orelse|rem|xor)\b/,
    {
      pattern: /(^|[^<])<(?!<)/,
      lookbehind: !0,
    },
    {
      pattern: /(^|[^>])>(?!>)/,
      lookbehind: !0,
    },
  ],
  atom: /\b[a-z][\w@]*/,
  punctuation: /[()[\]{}:;,.#|]|<<|>>/,
};
(Prism.languages.gap = {
  shell: {
    pattern: /^gap>[\s\S]*?(?=^gap>|$(?![\s\S]))/m,
    greedy: !0,
    inside: {
      gap: {
        pattern: /^(gap>).+(?:(?:\r(?:\n|(?!\n))|\n)>.*)*/,
        lookbehind: !0,
        inside: null,
      },
      punctuation: /^gap>/,
    },
  },
  comment: {
    pattern: /#.*/,
    greedy: !0,
  },
  string: {
    pattern:
      /(^|[^\\'"])(?:'(?:[^\r\n\\']|\\.){1,10}'|"(?:[^\r\n\\"]|\\.)*"(?!")|"""[\s\S]*?""")/,
    lookbehind: !0,
    greedy: !0,
    inside: {
      continuation: {
        pattern: /([\r\n])>/,
        lookbehind: !0,
        alias: 'punctuation',
      },
    },
  },
  keyword:
    /\b(?:Assert|Info|IsBound|QUIT|TryNextMethod|Unbind|and|atomic|break|continue|do|elif|else|end|fi|for|function|if|in|local|mod|not|od|or|quit|readonly|readwrite|rec|repeat|return|then|until|while)\b/,
  boolean: /\b(?:false|true)\b/,
  function: /\b[a-z_]\w*(?=\s*\()/i,
  number: {
    pattern:
      /(^|[^\w.]|\.\.)(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?(?:_[a-z]?)?(?=$|[^\w.]|\.\.)/,
    lookbehind: !0,
  },
  continuation: {
    pattern: /([\r\n])>/,
    lookbehind: !0,
    alias: 'punctuation',
  },
  operator: /->|[-+*/^~=!]|<>|[<>]=?|:=|\.\./,
  punctuation: /[()[\]{},;.:]/,
}),
  (Prism.languages.gap.shell.inside.gap.inside = Prism.languages.gap);
(Prism.languages.gettext = {
  comment: [
    {
      pattern: /# .*/,
      greedy: !0,
      alias: 'translator-comment',
    },
    {
      pattern: /#\..*/,
      greedy: !0,
      alias: 'extracted-comment',
    },
    {
      pattern: /#:.*/,
      greedy: !0,
      alias: 'reference-comment',
    },
    {
      pattern: /#,.*/,
      greedy: !0,
      alias: 'flag-comment',
    },
    {
      pattern: /#\|.*/,
      greedy: !0,
      alias: 'previously-untranslated-comment',
    },
    {
      pattern: /#.*/,
      greedy: !0,
    },
  ],
  string: {
    pattern: /(^|[^\\])"(?:[^"\\]|\\.)*"/,
    lookbehind: !0,
    greedy: !0,
  },
  keyword: /^msg(?:ctxt|id|id_plural|str)\b/m,
  number: /\b\d+\b/,
  punctuation: /[\[\]]/,
}),
  (Prism.languages.po = Prism.languages.gettext);
Prism.languages.git = {
  comment: /^#.*/m,
  deleted: /^[-–].*/m,
  inserted: /^\+.*/m,
  string: /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/,
  command: {
    pattern: /^.*\$ git .*$/m,
    inside: {
      parameter: /\s--?\w+/,
    },
  },
  coord: /^@@.*@@$/m,
  'commit-sha1': /^commit \w{40}$/m,
};
(Prism.languages['linker-script'] = {
  comment: {
    pattern: /(^|\s)\/\*[\s\S]*?(?:$|\*\/)/,
    lookbehind: !0,
    greedy: !0,
  },
  identifier: {
    pattern: /"[^"\r\n]*"/,
    greedy: !0,
  },
  'location-counter': {
    pattern: /\B\.\B/,
    alias: 'important',
  },
  section: {
    pattern: /(^|[^\w*])\.\w+\b/,
    lookbehind: !0,
    alias: 'keyword',
  },
  function: /\b[A-Z][A-Z_]*(?=\s*\()/,
  number: /\b(?:0[xX][a-fA-F0-9]+|\d+)[KM]?\b/,
  operator: />>=?|<<=?|->|\+\+|--|&&|\|\||::|[?:~]|[-+*/%&|^!=<>]=?/,
  punctuation: /[(){},;]/,
}),
  (Prism.languages.ld = Prism.languages['linker-script']);
(Prism.languages.go = Prism.languages.extend('clike', {
  string: {
    pattern: /(^|[^\\])"(?:\\.|[^"\\\r\n])*"|`[^`]*`/,
    lookbehind: !0,
    greedy: !0,
  },
  keyword:
    /\b(?:break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go(?:to)?|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/,
  boolean: /\b(?:_|false|iota|nil|true)\b/,
  number: [
    /\b0(?:b[01_]+|o[0-7_]+)i?\b/i,
    /\b0x(?:[a-f\d_]+(?:\.[a-f\d_]*)?|\.[a-f\d_]+)(?:p[+-]?\d+(?:_\d+)*)?i?(?!\w)/i,
    /(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.\d[\d_]*)(?:e[+-]?[\d_]+)?i?(?!\w)/i,
  ],
  operator:
    /[*\/%^!=]=?|\+[=+]?|-[=-]?|\|[=|]?|&(?:=|&|\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\.\.\./,
  builtin:
    /\b(?:append|bool|byte|cap|close|complex|complex(?:64|128)|copy|delete|error|float(?:32|64)|u?int(?:8|16|32|64)?|imag|len|make|new|panic|print(?:ln)?|real|recover|rune|string|uintptr)\b/,
})),
  Prism.languages.insertBefore('go', 'string', {
    char: {
      pattern: /'(?:\\.|[^'\\\r\n]){0,10}'/,
      greedy: !0,
    },
  }),
  delete Prism.languages.go['class-name'];
Prism.languages['go-mod'] = Prism.languages['go-module'] = {
  comment: {
    pattern: /\/\/.*/,
    greedy: !0,
  },
  version: {
    pattern: /(^|[\s()[\],])v\d+\.\d+\.\d+(?:[+-][-+.\w]*)?(?![^\s()[\],])/,
    lookbehind: !0,
    alias: 'number',
  },
  'go-version': {
    pattern: /((?:^|\s)go\s+)\d+(?:\.\d+){1,2}/,
    lookbehind: !0,
    alias: 'number',
  },
  keyword: {
    pattern: /^([ \t]*)(?:exclude|go|module|replace|require|retract)\b/m,
    lookbehind: !0,
  },
  operator: /=>/,
  punctuation: /[()[\],]/,
};
!(function (e) {
  var n = {
    pattern: /((?:^|[^\\$])(?:\\{2})*)\$(?:\w+|\{[^{}]*\})/,
    lookbehind: !0,
    inside: {
      'interpolation-punctuation': {
        pattern: /^\$\{?|\}$/,
        alias: 'punctuation',
      },
      expression: {
        pattern: /[\s\S]+/,
        inside: null,
      },
    },
  };
  (e.languages.gradle = e.languages.extend('clike', {
    string: {
      pattern: /'''(?:[^\\]|\\[\s\S])*?'''|'(?:\\.|[^\\'\r\n])*'/,
      greedy: !0,
    },
    keyword:
      /\b(?:apply|def|dependencies|else|if|implementation|import|plugin|plugins|project|repositories|repository|sourceSets|tasks|val)\b/,
    number:
      /\b(?:0b[01_]+|0x[\da-f_]+(?:\.[\da-f_p\-]+)?|[\d_]+(?:\.[\d_]+)?(?:e[+-]?\d+)?)[glidf]?\b/i,
    operator: {
      pattern:
        /(^|[^.])(?:~|==?~?|\?[.:]?|\*(?:[.=]|\*=?)?|\.[@&]|\.\.<|\.\.(?!\.)|-[-=>]?|\+[+=]?|!=?|<(?:<=?|=>?)?|>(?:>>?=?|=)?|&[&=]?|\|[|=]?|\/=?|\^=?|%=?)/,
      lookbehind: !0,
    },
    punctuation: /\.+|[{}[\];(),:$]/,
  })),
    e.languages.insertBefore('gradle', 'string', {
      shebang: {
        pattern: /#!.+/,
        alias: 'comment',
        greedy: !0,
      },
      'interpolation-string': {
        pattern:
          /"""(?:[^\\]|\\[\s\S])*?"""|(["/])(?:\\.|(?!\1)[^\\\r\n])*\1|\$\/(?:[^/$]|\$(?:[/$]|(?![/$]))|\/(?!\$))*\/\$/,
        greedy: !0,
        inside: {
          interpolation: n,
          string: /[\s\S]+/,
        },
      },
    }),
    e.languages.insertBefore('gradle', 'punctuation', {
      'spock-block': /\b(?:and|cleanup|expect|given|setup|then|when|where):/,
    }),
    e.languages.insertBefore('gradle', 'function', {
      annotation: {
        pattern: /(^|[^.])@\w+/,
        lookbehind: !0,
        alias: 'punctuation',
      },
    }),
    (n.inside.expression.inside = e.languages.gradle);
})(Prism);
(Prism.languages.graphql = {
  comment: /#.*/,
  description: {
    pattern: /(?:"""(?:[^"]|(?!""")")*"""|"(?:\\.|[^\\"\r\n])*")(?=\s*[a-z_])/i,
    greedy: !0,
    alias: 'string',
    inside: {
      'language-markdown': {
        pattern: /(^"(?:"")?)(?!\1)[\s\S]+(?=\1$)/,
        lookbehind: !0,
        inside: Prism.languages.markdown,
      },
    },
  },
  string: {
    pattern: /"""(?:[^"]|(?!""")")*"""|"(?:\\.|[^\\"\r\n])*"/,
    greedy: !0,
  },
  number: /(?:\B-|\b)\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
  boolean: /\b(?:false|true)\b/,
  variable: /\$[a-z_]\w*/i,
  directive: {
    pattern: /@[a-z_]\w*/i,
    alias: 'function',
  },
  'attr-name': {
    pattern: /\b[a-z_]\w*(?=\s*(?:\((?:[^()"]|"(?:\\.|[^\\"\r\n])*")*\))?:)/i,
    greedy: !0,
  },
  'atom-input': {
    pattern: /\b[A-Z]\w*Input\b/,
    alias: 'class-name',
  },
  scalar: /\b(?:Boolean|Float|ID|Int|String)\b/,
  constant: /\b[A-Z][A-Z_\d]*\b/,
  'class-name': {
    pattern:
      /(\b(?:enum|implements|interface|on|scalar|type|union)\s+|&\s*|:\s*|\[)[A-Z_]\w*/,
    lookbehind: !0,
  },
  fragment: {
    pattern: /(\bfragment\s+|\.{3}\s*(?!on\b))[a-zA-Z_]\w*/,
    lookbehind: !0,
    alias: 'function',
  },
  'definition-mutation': {
    pattern: /(\bmutation\s+)[a-zA-Z_]\w*/,
    lookbehind: !0,
    alias: 'function',
  },
  'definition-query': {
    pattern: /(\bquery\s+)[a-zA-Z_]\w*/,
    lookbehind: !0,
    alias: 'function',
  },
  keyword:
    /\b(?:directive|enum|extend|fragment|implements|input|interface|mutation|on|query|repeatable|scalar|schema|subscription|type|union)\b/,
  operator: /[!=|&]|\.{3}/,
  'property-query': /\w+(?=\s*\()/,
  object: /\w+(?=\s*\{)/,
  punctuation: /[!(){}\[\]:=,]/,
  property: /\w+/,
}),
  Prism.hooks.add('after-tokenize', function (n) {
    if ('graphql' === n.language)
      for (
        var t = n.tokens.filter(function (n) {
            return (
              'string' != typeof n &&
              'comment' !== n.type &&
              'scalar' !== n.type
            );
          }),
          e = 0;
        e < t.length;

      ) {
        var a = t[e++];
        if ('keyword' === a.type && 'mutation' === a.content) {
          var r = [];
          if (
            c(['definition-mutation', 'punctuation']) &&
            '(' === l(1).content
          ) {
            e += 2;
            var i = f(/^\($/, /^\)$/);
            if (-1 === i) continue;
            for (; e < i; e++) {
              var o = l(0);
              'variable' === o.type &&
                (b(o, 'variable-input'), r.push(o.content));
            }
            e = i + 1;
          }
          if (
            c(['punctuation', 'property-query']) &&
            '{' === l(0).content &&
            (e++, b(l(0), 'property-mutation'), r.length > 0)
          ) {
            var s = f(/^\{$/, /^\}$/);
            if (-1 === s) continue;
            for (var u = e; u < s; u++) {
              var p = t[u];
              'variable' === p.type &&
                r.indexOf(p.content) >= 0 &&
                b(p, 'variable-input');
            }
          }
        }
      }
    function l(n) {
      return t[e + n];
    }
    function c(n, t) {
      t = t || 0;
      for (var e = 0; e < n.length; e++) {
        var a = l(e + t);
        if (!a || a.type !== n[e]) return !1;
      }
      return !0;
    }
    function f(n, a) {
      for (var r = 1, i = e; i < t.length; i++) {
        var o = t[i],
          s = o.content;
        if ('punctuation' === o.type && 'string' == typeof s)
          if (n.test(s)) r++;
          else if (a.test(s) && 0 == --r) return i;
      }
      return -1;
    }
    function b(n, t) {
      var e = n.alias;
      e ? Array.isArray(e) || (n.alias = e = [e]) : (n.alias = e = []),
        e.push(t);
    }
  });
!(function (e) {
  (e.languages.ruby = e.languages.extend('clike', {
    comment: {
      pattern: /#.*|^=begin\s[\s\S]*?^=end/m,
      greedy: !0,
    },
    'class-name': {
      pattern:
        /(\b(?:class|module)\s+|\bcatch\s+\()[\w.\\]+|\b[A-Z_]\w*(?=\s*\.\s*new\b)/,
      lookbehind: !0,
      inside: {
        punctuation: /[.\\]/,
      },
    },
    keyword:
      /\b(?:BEGIN|END|alias|and|begin|break|case|class|def|define_method|defined|do|each|else|elsif|end|ensure|extend|for|if|in|include|module|new|next|nil|not|or|prepend|private|protected|public|raise|redo|require|rescue|retry|return|self|super|then|throw|undef|unless|until|when|while|yield)\b/,
    operator:
      /\.{2,3}|&\.|===|<?=>|[!=]?~|(?:&&|\|\||<<|>>|\*\*|[+\-*/%<>!^&|=])=?|[?:]/,
    punctuation: /[(){}[\].,;]/,
  })),
    e.languages.insertBefore('ruby', 'operator', {
      'double-colon': {
        pattern: /::/,
        alias: 'punctuation',
      },
    });
  var n = {
    pattern: /((?:^|[^\\])(?:\\{2})*)#\{(?:[^{}]|\{[^{}]*\})*\}/,
    lookbehind: !0,
    inside: {
      content: {
        pattern: /^(#\{)[\s\S]+(?=\}$)/,
        lookbehind: !0,
        inside: e.languages.ruby,
      },
      delimiter: {
        pattern: /^#\{|\}$/,
        alias: 'punctuation',
      },
    },
  };
  delete e.languages.ruby.function;
  var t =
      '(?:' +
      [
        '([^a-zA-Z0-9\\s{(\\[<=])(?:(?!\\1)[^\\\\]|\\\\[^])*\\1',
        '\\((?:[^()\\\\]|\\\\[^]|\\((?:[^()\\\\]|\\\\[^])*\\))*\\)',
        '\\{(?:[^{}\\\\]|\\\\[^]|\\{(?:[^{}\\\\]|\\\\[^])*\\})*\\}',
        '\\[(?:[^\\[\\]\\\\]|\\\\[^]|\\[(?:[^\\[\\]\\\\]|\\\\[^])*\\])*\\]',
        '<(?:[^<>\\\\]|\\\\[^]|<(?:[^<>\\\\]|\\\\[^])*>)*>',
      ].join('|') +
      ')',
    i =
      '(?:"(?:\\\\.|[^"\\\\\r\n])*"|(?:\\b[a-zA-Z_]\\w*|[^\\s\0-\\x7F]+)[?!]?|\\$.)';
  e.languages.insertBefore('ruby', 'keyword', {
    'regex-literal': [
      {
        pattern: RegExp('%r' + t + '[egimnosux]{0,6}'),
        greedy: !0,
        inside: {
          interpolation: n,
          regex: /[\s\S]+/,
        },
      },
      {
        pattern:
          /(^|[^/])\/(?!\/)(?:\[[^\r\n\]]+\]|\\.|[^[/\\\r\n])+\/[egimnosux]{0,6}(?=\s*(?:$|[\r\n,.;})#]))/,
        lookbehind: !0,
        greedy: !0,
        inside: {
          interpolation: n,
          regex: /[\s\S]+/,
        },
      },
    ],
    variable: /[@$]+[a-zA-Z_]\w*(?:[?!]|\b)/,
    symbol: [
      {
        pattern: RegExp('(^|[^:]):' + i),
        lookbehind: !0,
        greedy: !0,
      },
      {
        pattern: RegExp('([\r\n{(,][ \t]*)' + i + '(?=:(?!:))'),
        lookbehind: !0,
        greedy: !0,
      },
    ],
    'method-definition': {
      pattern: /(\bdef\s+)\w+(?:\s*\.\s*\w+)?/,
      lookbehind: !0,
      inside: {
        function: /\b\w+$/,
        keyword: /^self\b/,
        'class-name': /^\w+/,
        punctuation: /\./,
      },
    },
  }),
    e.languages.insertBefore('ruby', 'string', {
      'string-literal': [
        {
          pattern: RegExp('%[qQiIwWs]?' + t),
          greedy: !0,
          inside: {
            interpolation: n,
            string: /[\s\S]+/,
          },
        },
        {
          pattern:
            /("|')(?:#\{[^}]+\}|#(?!\{)|\\(?:\r\n|[\s\S])|(?!\1)[^\\#\r\n])*\1/,
          greedy: !0,
          inside: {
            interpolation: n,
            string: /[\s\S]+/,
          },
        },
        {
          pattern: /<<[-~]?([a-z_]\w*)[\r\n](?:.*[\r\n])*?[\t ]*\1/i,
          alias: 'heredoc-string',
          greedy: !0,
          inside: {
            delimiter: {
              pattern: /^<<[-~]?[a-z_]\w*|\b[a-z_]\w*$/i,
              inside: {
                symbol: /\b\w+/,
                punctuation: /^<<[-~]?/,
              },
            },
            interpolation: n,
            string: /[\s\S]+/,
          },
        },
        {
          pattern: /<<[-~]?'([a-z_]\w*)'[\r\n](?:.*[\r\n])*?[\t ]*\1/i,
          alias: 'heredoc-string',
          greedy: !0,
          inside: {
            delimiter: {
              pattern: /^<<[-~]?'[a-z_]\w*'|\b[a-z_]\w*$/i,
              inside: {
                symbol: /\b\w+/,
                punctuation: /^<<[-~]?'|'$/,
              },
            },
            string: /[\s\S]+/,
          },
        },
      ],
      'command-literal': [
        {
          pattern: RegExp('%x' + t),
          greedy: !0,
          inside: {
            interpolation: n,
            command: {
              pattern: /[\s\S]+/,
              alias: 'string',
            },
          },
        },
        {
          pattern: /`(?:#\{[^}]+\}|#(?!\{)|\\(?:\r\n|[\s\S])|[^\\`#\r\n])*`/,
          greedy: !0,
          inside: {
            interpolation: n,
            command: {
              pattern: /[\s\S]+/,
              alias: 'string',
            },
          },
        },
      ],
    }),
    delete e.languages.ruby.string,
    e.languages.insertBefore('ruby', 'number', {
      builtin:
        /\b(?:Array|Bignum|Binding|Class|Continuation|Dir|Exception|FalseClass|File|Fixnum|Float|Hash|IO|Integer|MatchData|Method|Module|NilClass|Numeric|Object|Proc|Range|Regexp|Stat|String|Struct|Symbol|TMS|Thread|ThreadGroup|Time|TrueClass)\b/,
      constant: /\b[A-Z][A-Z0-9_]*(?:[?!]|\b)/,
    }),
    (e.languages.rb = e.languages.ruby);
})(Prism);
!(function (n) {
  n.languages.haml = {
    'multiline-comment': {
      pattern: /((?:^|\r?\n|\r)([\t ]*))(?:\/|-#).*(?:(?:\r?\n|\r)\2[\t ].+)*/,
      lookbehind: !0,
      alias: 'comment',
    },
    'multiline-code': [
      {
        pattern:
          /((?:^|\r?\n|\r)([\t ]*)(?:[~-]|[&!]?=)).*,[\t ]*(?:(?:\r?\n|\r)\2[\t ].*,[\t ]*)*(?:(?:\r?\n|\r)\2[\t ].+)/,
        lookbehind: !0,
        inside: n.languages.ruby,
      },
      {
        pattern:
          /((?:^|\r?\n|\r)([\t ]*)(?:[~-]|[&!]?=)).*\|[\t ]*(?:(?:\r?\n|\r)\2[\t ].*\|[\t ]*)*/,
        lookbehind: !0,
        inside: n.languages.ruby,
      },
    ],
    filter: {
      pattern:
        /((?:^|\r?\n|\r)([\t ]*)):[\w-]+(?:(?:\r?\n|\r)(?:\2[\t ].+|\s*?(?=\r?\n|\r)))+/,
      lookbehind: !0,
      inside: {
        'filter-name': {
          pattern: /^:[\w-]+/,
          alias: 'symbol',
        },
      },
    },
    markup: {
      pattern: /((?:^|\r?\n|\r)[\t ]*)<.+/,
      lookbehind: !0,
      inside: n.languages.markup,
    },
    doctype: {
      pattern: /((?:^|\r?\n|\r)[\t ]*)!!!(?: .+)?/,
      lookbehind: !0,
    },
    tag: {
      pattern:
        /((?:^|\r?\n|\r)[\t ]*)[%.#][\w\-#.]*[\w\-](?:\([^)]+\)|\{(?:\{[^}]+\}|[^{}])+\}|\[[^\]]+\])*[\/<>]*/,
      lookbehind: !0,
      inside: {
        attributes: [
          {
            pattern: /(^|[^#])\{(?:\{[^}]+\}|[^{}])+\}/,
            lookbehind: !0,
            inside: n.languages.ruby,
          },
          {
            pattern: /\([^)]+\)/,
            inside: {
              'attr-value': {
                pattern: /(=\s*)(?:"(?:\\.|[^\\"\r\n])*"|[^)\s]+)/,
                lookbehind: !0,
              },
              'attr-name': /[\w:-]+(?=\s*!?=|\s*[,)])/,
              punctuation: /[=(),]/,
            },
          },
          {
            pattern: /\[[^\]]+\]/,
            inside: n.languages.ruby,
          },
        ],
        punctuation: /[<>]/,
      },
    },
    code: {
      pattern: /((?:^|\r?\n|\r)[\t ]*(?:[~-]|[&!]?=)).+/,
      lookbehind: !0,
      inside: n.languages.ruby,
    },
    interpolation: {
      pattern: /#\{[^}]+\}/,
      inside: {
        delimiter: {
          pattern: /^#\{|\}$/,
          alias: 'punctuation',
        },
        ruby: {
          pattern: /[\s\S]+/,
          inside: n.languages.ruby,
        },
      },
    },
    punctuation: {
      pattern: /((?:^|\r?\n|\r)[\t ]*)[~=\-&!]+/,
      lookbehind: !0,
    },
  };
  for (
    var e = [
        'css',
        {
          filter: 'coffee',
          language: 'coffeescript',
        },
        'erb',
        'javascript',
        'less',
        'markdown',
        'ruby',
        'scss',
        'textile',
      ],
      t = {},
      r = 0,
      a = e.length;
    r < a;
    r++
  ) {
    var i = e[r];
    (i =
      'string' == typeof i
        ? {
            filter: i,
            language: i,
          }
        : i),
      n.languages[i.language] &&
        (t['filter-' + i.filter] = {
          pattern: RegExp(
            '((?:^|\\r?\\n|\\r)([\\t ]*)):{{filter_name}}(?:(?:\\r?\\n|\\r)(?:\\2[\\t ].+|\\s*?(?=\\r?\\n|\\r)))+'.replace(
              '{{filter_name}}',
              function () {
                return i.filter;
              },
            ),
          ),
          lookbehind: !0,
          inside: {
            'filter-name': {
              pattern: /^:[\w-]+/,
              alias: 'symbol',
            },
            text: {
              pattern: /[\s\S]+/,
              alias: [i.language, 'language-' + i.language],
              inside: n.languages[i.language],
            },
          },
        });
  }
  n.languages.insertBefore('haml', 'filter', t);
})(Prism);
!(function (a) {
  (a.languages.handlebars = {
    comment: /\{\{![\s\S]*?\}\}/,
    delimiter: {
      pattern: /^\{\{\{?|\}\}\}?$/,
      alias: 'punctuation',
    },
    string: /(["'])(?:\\.|(?!\1)[^\\\r\n])*\1/,
    number: /\b0x[\dA-Fa-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:[Ee][+-]?\d+)?/,
    boolean: /\b(?:false|true)\b/,
    block: {
      pattern: /^(\s*(?:~\s*)?)[#\/]\S+?(?=\s*(?:~\s*)?$|\s)/,
      lookbehind: !0,
      alias: 'keyword',
    },
    brackets: {
      pattern: /\[[^\]]+\]/,
      inside: {
        punctuation: /\[|\]/,
        variable: /[\s\S]+/,
      },
    },
    punctuation: /[!"#%&':()*+,.\/;<=>@\[\\\]^`{|}~]/,
    variable: /[^!"#%&'()*+,\/;<=>@\[\\\]^`{|}~\s]+/,
  }),
    a.hooks.add('before-tokenize', function (e) {
      a.languages['markup-templating'].buildPlaceholders(
        e,
        'handlebars',
        /\{\{\{[\s\S]+?\}\}\}|\{\{[\s\S]+?\}\}/g,
      );
    }),
    a.hooks.add('after-tokenize', function (e) {
      a.languages['markup-templating'].tokenizePlaceholders(e, 'handlebars');
    }),
    (a.languages.hbs = a.languages.handlebars),
    (a.languages.mustache = a.languages.handlebars);
})(Prism);
(Prism.languages.haskell = {
  comment: {
    pattern:
      /(^|[^-!#$%*+=?&@|~.:<>^\\\/])(?:--(?:(?=.)[^-!#$%*+=?&@|~.:<>^\\\/].*|$)|\{-[\s\S]*?-\})/m,
    lookbehind: !0,
  },
  char: {
    pattern:
      /'(?:[^\\']|\\(?:[abfnrtv\\"'&]|\^[A-Z@[\]^_]|ACK|BEL|BS|CAN|CR|DC1|DC2|DC3|DC4|DEL|DLE|EM|ENQ|EOT|ESC|ETB|ETX|FF|FS|GS|HT|LF|NAK|NUL|RS|SI|SO|SOH|SP|STX|SUB|SYN|US|VT|\d+|o[0-7]+|x[0-9a-fA-F]+))'/,
    alias: 'string',
  },
  string: {
    pattern: /"(?:[^\\"]|\\(?:\S|\s+\\))*"/,
    greedy: !0,
  },
  keyword:
    /\b(?:case|class|data|deriving|do|else|if|in|infixl|infixr|instance|let|module|newtype|of|primitive|then|type|where)\b/,
  'import-statement': {
    pattern:
      /(^[\t ]*)import\s+(?:qualified\s+)?(?:[A-Z][\w']*)(?:\.[A-Z][\w']*)*(?:\s+as\s+(?:[A-Z][\w']*)(?:\.[A-Z][\w']*)*)?(?:\s+hiding\b)?/m,
    lookbehind: !0,
    inside: {
      keyword: /\b(?:as|hiding|import|qualified)\b/,
      punctuation: /\./,
    },
  },
  builtin:
    /\b(?:abs|acos|acosh|all|and|any|appendFile|approxRational|asTypeOf|asin|asinh|atan|atan2|atanh|basicIORun|break|catch|ceiling|chr|compare|concat|concatMap|const|cos|cosh|curry|cycle|decodeFloat|denominator|digitToInt|div|divMod|drop|dropWhile|either|elem|encodeFloat|enumFrom|enumFromThen|enumFromThenTo|enumFromTo|error|even|exp|exponent|fail|filter|flip|floatDigits|floatRadix|floatRange|floor|fmap|foldl|foldl1|foldr|foldr1|fromDouble|fromEnum|fromInt|fromInteger|fromIntegral|fromRational|fst|gcd|getChar|getContents|getLine|group|head|id|inRange|index|init|intToDigit|interact|ioError|isAlpha|isAlphaNum|isAscii|isControl|isDenormalized|isDigit|isHexDigit|isIEEE|isInfinite|isLower|isNaN|isNegativeZero|isOctDigit|isPrint|isSpace|isUpper|iterate|last|lcm|length|lex|lexDigits|lexLitChar|lines|log|logBase|lookup|map|mapM|mapM_|max|maxBound|maximum|maybe|min|minBound|minimum|mod|negate|not|notElem|null|numerator|odd|or|ord|otherwise|pack|pi|pred|primExitWith|print|product|properFraction|putChar|putStr|putStrLn|quot|quotRem|range|rangeSize|read|readDec|readFile|readFloat|readHex|readIO|readInt|readList|readLitChar|readLn|readOct|readParen|readSigned|reads|readsPrec|realToFrac|recip|rem|repeat|replicate|return|reverse|round|scaleFloat|scanl|scanl1|scanr|scanr1|seq|sequence|sequence_|show|showChar|showInt|showList|showLitChar|showParen|showSigned|showString|shows|showsPrec|significand|signum|sin|sinh|snd|sort|span|splitAt|sqrt|subtract|succ|sum|tail|take|takeWhile|tan|tanh|threadToIOResult|toEnum|toInt|toInteger|toLower|toRational|toUpper|truncate|uncurry|undefined|unlines|until|unwords|unzip|unzip3|userError|words|writeFile|zip|zip3|zipWith|zipWith3)\b/,
  number: /\b(?:\d+(?:\.\d+)?(?:e[+-]?\d+)?|0o[0-7]+|0x[0-9a-f]+)\b/i,
  operator: [
    {
      pattern: /`(?:[A-Z][\w']*\.)*[_a-z][\w']*`/,
      greedy: !0,
    },
    {
      pattern: /(\s)\.(?=\s)/,
      lookbehind: !0,
    },
    /[-!#$%*+=?&@|~:<>^\\\/][-!#$%*+=?&@|~.:<>^\\\/]*|\.[-!#$%*+=?&@|~.:<>^\\\/]+/,
  ],
  hvariable: {
    pattern: /\b(?:[A-Z][\w']*\.)*[_a-z][\w']*/,
    inside: {
      punctuation: /\./,
    },
  },
  constant: {
    pattern: /\b(?:[A-Z][\w']*\.)*[A-Z][\w']*/,
    inside: {
      punctuation: /\./,
    },
  },
  punctuation: /[{}[\];(),.:]/,
}),
  (Prism.languages.hs = Prism.languages.haskell);
(Prism.languages.haxe = Prism.languages.extend('clike', {
  string: {
    pattern: /"(?:[^"\\]|\\[\s\S])*"/,
    greedy: !0,
  },
  'class-name': [
    {
      pattern:
        /(\b(?:abstract|class|enum|extends|implements|interface|new|typedef)\s+)[A-Z_]\w*/,
      lookbehind: !0,
    },
    /\b[A-Z]\w*/,
  ],
  keyword:
    /\bthis\b|\b(?:abstract|as|break|case|cast|catch|class|continue|default|do|dynamic|else|enum|extends|extern|final|for|from|function|if|implements|import|in|inline|interface|macro|new|null|operator|overload|override|package|private|public|return|static|super|switch|throw|to|try|typedef|untyped|using|var|while)(?!\.)\b/,
  function: {
    pattern: /\b[a-z_]\w*(?=\s*(?:<[^<>]*>\s*)?\()/i,
    greedy: !0,
  },
  operator: /\.{3}|\+\+|--|&&|\|\||->|=>|(?:<<?|>{1,3}|[-+*/%!=&|^])=?|[?:~]/,
})),
  Prism.languages.insertBefore('haxe', 'string', {
    'string-interpolation': {
      pattern: /'(?:[^'\\]|\\[\s\S])*'/,
      greedy: !0,
      inside: {
        interpolation: {
          pattern: /(^|[^\\])\$(?:\w+|\{[^{}]+\})/,
          lookbehind: !0,
          inside: {
            'interpolation-punctuation': {
              pattern: /^\$\{?|\}$/,
              alias: 'punctuation',
            },
            expression: {
              pattern: /[\s\S]+/,
              inside: Prism.languages.haxe,
            },
          },
        },
        string: /[\s\S]+/,
      },
    },
  }),
  Prism.languages.insertBefore('haxe', 'class-name', {
    regex: {
      pattern: /~\/(?:[^\/\\\r\n]|\\.)+\/[a-z]*/,
      greedy: !0,
      inside: {
        'regex-flags': /\b[a-z]+$/,
        'regex-source': {
          pattern: /^(~\/)[\s\S]+(?=\/$)/,
          lookbehind: !0,
          alias: 'language-regex',
          inside: Prism.languages.regex,
        },
        'regex-delimiter': /^~\/|\/$/,
      },
    },
  }),
  Prism.languages.insertBefore('haxe', 'keyword', {
    preprocessor: {
      pattern: /#(?:else|elseif|end|if)\b.*/,
      alias: 'property',
    },
    metadata: {
      pattern: /@:?[\w.]+/,
      alias: 'symbol',
    },
    reification: {
      pattern: /\$(?:\w+|(?=\{))/,
      alias: 'important',
    },
  });
Prism.languages.hcl = {
  comment: /(?:\/\/|#).*|\/\*[\s\S]*?(?:\*\/|$)/,
  heredoc: {
    pattern: /<<-?(\w+\b)[\s\S]*?^[ \t]*\1/m,
    greedy: !0,
    alias: 'string',
  },
  keyword: [
    {
      pattern:
        /(?:data|resource)\s+(?:"(?:\\[\s\S]|[^\\"])*")(?=\s+"[\w-]+"\s+\{)/i,
      inside: {
        type: {
          pattern: /(resource|data|\s+)(?:"(?:\\[\s\S]|[^\\"])*")/i,
          lookbehind: !0,
          alias: 'variable',
        },
      },
    },
    {
      pattern:
        /(?:backend|module|output|provider|provisioner|variable)\s+(?:[\w-]+|"(?:\\[\s\S]|[^\\"])*")\s+(?=\{)/i,
      inside: {
        type: {
          pattern:
            /(backend|module|output|provider|provisioner|variable)\s+(?:[\w-]+|"(?:\\[\s\S]|[^\\"])*")\s+/i,
          lookbehind: !0,
          alias: 'variable',
        },
      },
    },
    /[\w-]+(?=\s+\{)/,
  ],
  property: [/[-\w\.]+(?=\s*=(?!=))/, /"(?:\\[\s\S]|[^\\"])+"(?=\s*[:=])/],
  string: {
    pattern:
      /"(?:[^\\$"]|\\[\s\S]|\$(?:(?=")|\$+(?!\$)|[^"${])|\$\{(?:[^{}"]|"(?:[^\\"]|\\[\s\S])*")*\})*"/,
    greedy: !0,
    inside: {
      interpolation: {
        pattern: /(^|[^$])\$\{(?:[^{}"]|"(?:[^\\"]|\\[\s\S])*")*\}/,
        lookbehind: !0,
        inside: {
          type: {
            pattern:
              /(\b(?:count|data|local|module|path|self|terraform|var)\b\.)[\w\*]+/i,
            lookbehind: !0,
            alias: 'variable',
          },
          keyword: /\b(?:count|data|local|module|path|self|terraform|var)\b/i,
          function: /\w+(?=\()/,
          string: {
            pattern: /"(?:\\[\s\S]|[^\\"])*"/,
            greedy: !0,
          },
          number: /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?(?:e[+-]?\d+)?/i,
          punctuation: /[!\$#%&'()*+,.\/;<=>@\[\\\]^`{|}~?:]/,
        },
      },
    },
  },
  number: /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?(?:e[+-]?\d+)?/i,
  boolean: /\b(?:false|true)\b/i,
  punctuation: /[=\[\]{}]/,
};
Prism.languages.hlsl = Prism.languages.extend('c', {
  'class-name': [
    Prism.languages.c['class-name'],
    /\b(?:AppendStructuredBuffer|BlendState|Buffer|ByteAddressBuffer|CompileShader|ComputeShader|ConsumeStructuredBuffer|DepthStencilState|DepthStencilView|DomainShader|GeometryShader|Hullshader|InputPatch|LineStream|OutputPatch|PixelShader|PointStream|RWBuffer|RWByteAddressBuffer|RWStructuredBuffer|RWTexture(?:1D|1DArray|2D|2DArray|3D)|RasterizerState|RenderTargetView|SamplerComparisonState|SamplerState|StructuredBuffer|Texture(?:1D|1DArray|2D|2DArray|2DMS|2DMSArray|3D|Cube|CubeArray)|TriangleStream|VertexShader)\b/,
  ],
  keyword: [
    /\b(?:asm|asm_fragment|auto|break|case|catch|cbuffer|centroid|char|class|column_major|compile|compile_fragment|const|const_cast|continue|default|delete|discard|do|dynamic_cast|else|enum|explicit|export|extern|for|friend|fxgroup|goto|groupshared|if|in|inline|inout|interface|line|lineadj|linear|long|matrix|mutable|namespace|new|nointerpolation|noperspective|operator|out|packoffset|pass|pixelfragment|point|precise|private|protected|public|register|reinterpret_cast|return|row_major|sample|sampler|shared|short|signed|sizeof|snorm|stateblock|stateblock_state|static|static_cast|string|struct|switch|tbuffer|technique|technique10|technique11|template|texture|this|throw|triangle|triangleadj|try|typedef|typename|uniform|union|unorm|unsigned|using|vector|vertexfragment|virtual|void|volatile|while)\b/,
    /\b(?:bool|double|dword|float|half|int|min(?:10float|12int|16(?:float|int|uint))|uint)(?:[1-4](?:x[1-4])?)?\b/,
  ],
  number:
    /(?:(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:[eE][+-]?\d+)?|\b0x[\da-fA-F]+)[fFhHlLuU]?\b/,
  boolean: /\b(?:false|true)\b/,
});
!(function (t) {
  function a(t) {
    return RegExp('(^(?:' + t + '):[ \t]*(?![ \t]))[^]+', 'i');
  }
  t.languages.http = {
    'request-line': {
      pattern:
        /^(?:CONNECT|DELETE|GET|HEAD|OPTIONS|PATCH|POST|PRI|PUT|SEARCH|TRACE)\s(?:https?:\/\/|\/)\S*\sHTTP\/[\d.]+/m,
      inside: {
        method: {
          pattern: /^[A-Z]+\b/,
          alias: 'property',
        },
        'request-target': {
          pattern: /^(\s)(?:https?:\/\/|\/)\S*(?=\s)/,
          lookbehind: !0,
          alias: 'url',
          inside: t.languages.uri,
        },
        'http-version': {
          pattern: /^(\s)HTTP\/[\d.]+/,
          lookbehind: !0,
          alias: 'property',
        },
      },
    },
    'response-status': {
      pattern: /^HTTP\/[\d.]+ \d+ .+/m,
      inside: {
        'http-version': {
          pattern: /^HTTP\/[\d.]+/,
          alias: 'property',
        },
        'status-code': {
          pattern: /^(\s)\d+(?=\s)/,
          lookbehind: !0,
          alias: 'number',
        },
        'reason-phrase': {
          pattern: /^(\s).+/,
          lookbehind: !0,
          alias: 'string',
        },
      },
    },
    header: {
      pattern: /^[\w-]+:.+(?:(?:\r\n?|\n)[ \t].+)*/m,
      inside: {
        'header-value': [
          {
            pattern: a('Content-Security-Policy'),
            lookbehind: !0,
            alias: ['csp', 'languages-csp'],
            inside: t.languages.csp,
          },
          {
            pattern: a('Public-Key-Pins(?:-Report-Only)?'),
            lookbehind: !0,
            alias: ['hpkp', 'languages-hpkp'],
            inside: t.languages.hpkp,
          },
          {
            pattern: a('Strict-Transport-Security'),
            lookbehind: !0,
            alias: ['hsts', 'languages-hsts'],
            inside: t.languages.hsts,
          },
          {
            pattern: a('[^:]+'),
            lookbehind: !0,
          },
        ],
        'header-name': {
          pattern: /^[^:]+/,
          alias: 'keyword',
        },
        punctuation: /^:/,
      },
    },
  };
  var e,
    n = t.languages,
    s = {
      'application/javascript': n.javascript,
      'application/json': n.json || n.javascript,
      'application/xml': n.xml,
      'text/xml': n.xml,
      'text/html': n.html,
      'text/css': n.css,
      'text/plain': n.plain,
    },
    i = {
      'application/json': !0,
      'application/xml': !0,
    };
  function r(t) {
    var a = t.replace(/^[a-z]+\//, '');
    return '(?:' + t + '|\\w+/(?:[\\w.-]+\\+)+' + a + '(?![+\\w.-]))';
  }
  for (var p in s)
    if (s[p]) {
      e = e || {};
      var l = i[p] ? r(p) : p;
      e[p.replace(/\//g, '-')] = {
        pattern: RegExp(
          '(content-type:\\s*' +
            l +
            '(?:(?:\r\n?|\n)[\\w-].*)*(?:\r(?:\n|(?!\n))|\n))[^ \t\\w-][^]*',
          'i',
        ),
        lookbehind: !0,
        inside: s[p],
      };
    }
  e && t.languages.insertBefore('http', 'header', e);
})(Prism);
Prism.languages.hpkp = {
  directive: {
    pattern:
      /\b(?:includeSubDomains|max-age|pin-sha256|preload|report-to|report-uri|strict)(?=[\s;=]|$)/i,
    alias: 'property',
  },
  operator: /=/,
  punctuation: /;/,
};
Prism.languages.hsts = {
  directive: {
    pattern: /\b(?:includeSubDomains|max-age|preload)(?=[\s;=]|$)/i,
    alias: 'property',
  },
  operator: /=/,
  punctuation: /;/,
};
Prism.languages.icon = {
  comment: /#.*/,
  string: {
    pattern: /(["'])(?:(?!\1)[^\\\r\n_]|\\.|_(?!\1)(?:\r\n|[\s\S]))*\1/,
    greedy: !0,
  },
  number: /\b(?:\d+r[a-z\d]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b|\.\d+\b/i,
  'builtin-keyword': {
    pattern:
      /&(?:allocated|ascii|clock|collections|cset|current|date|dateline|digits|dump|e|error(?:number|text|value)?|errout|fail|features|file|host|input|lcase|letters|level|line|main|null|output|phi|pi|pos|progname|random|regions|source|storage|subject|time|trace|ucase|version)\b/,
    alias: 'variable',
  },
  directive: {
    pattern: /\$\w+/,
    alias: 'builtin',
  },
  keyword:
    /\b(?:break|by|case|create|default|do|else|end|every|fail|global|if|initial|invocable|link|local|next|not|of|procedure|record|repeat|return|static|suspend|then|to|until|while)\b/,
  function: /\b(?!\d)\w+(?=\s*[({]|\s*!\s*\[)/,
  operator:
    /[+-]:(?!=)|(?:[\/?@^%&]|\+\+?|--?|==?=?|~==?=?|\*\*?|\|\|\|?|<(?:->?|<?=?)|>>?=?)(?::=)?|:(?:=:?)?|[!.\\|~]/,
  punctuation: /[\[\](){},;]/,
};
!(function (e) {
  function t(e, s) {
    return s <= 0
      ? '[]'
      : e.replace(/<SELF>/g, function () {
          return t(e, s - 1);
        });
  }
  var s = /'[{}:=,](?:[^']|'')*'(?!')/,
    n = {
      pattern: /''/,
      greedy: !0,
      alias: 'operator',
    },
    r = {
      pattern: s,
      greedy: !0,
      inside: {
        escape: n,
      },
    },
    a = t(
      "\\{(?:[^{}']|'(?![{},'])|''|<STR>|<SELF>)*\\}".replace(
        /<STR>/g,
        function () {
          return s.source;
        },
      ),
      8,
    ),
    i = {
      pattern: RegExp(a),
      inside: {
        message: {
          pattern: /^(\{)[\s\S]+(?=\}$)/,
          lookbehind: !0,
          inside: null,
        },
        'message-delimiter': {
          pattern: /./,
          alias: 'punctuation',
        },
      },
    };
  (e.languages['icu-message-format'] = {
    argument: {
      pattern: RegExp(a),
      greedy: !0,
      inside: {
        content: {
          pattern: /^(\{)[\s\S]+(?=\}$)/,
          lookbehind: !0,
          inside: {
            'argument-name': {
              pattern: /^(\s*)[^{}:=,\s]+/,
              lookbehind: !0,
            },
            'choice-style': {
              pattern: /^(\s*,\s*choice\s*,\s*)\S(?:[\s\S]*\S)?/,
              lookbehind: !0,
              inside: {
                punctuation: /\|/,
                range: {
                  pattern: /^(\s*)[+-]?(?:\d+(?:\.\d*)?|\u221e)\s*[<#\u2264]/,
                  lookbehind: !0,
                  inside: {
                    operator: /[<#\u2264]/,
                    number: /\S+/,
                  },
                },
                rest: null,
              },
            },
            'plural-style': {
              pattern:
                /^(\s*,\s*(?:plural|selectordinal)\s*,\s*)\S(?:[\s\S]*\S)?/,
              lookbehind: !0,
              inside: {
                offset: /^offset:\s*\d+/,
                'nested-message': i,
                selector: {
                  pattern: /=\d+|[^{}:=,\s]+/,
                  inside: {
                    keyword: /^(?:few|many|one|other|two|zero)$/,
                  },
                },
              },
            },
            'select-style': {
              pattern: /^(\s*,\s*select\s*,\s*)\S(?:[\s\S]*\S)?/,
              lookbehind: !0,
              inside: {
                'nested-message': i,
                selector: {
                  pattern: /[^{}:=,\s]+/,
                  inside: {
                    keyword: /^other$/,
                  },
                },
              },
            },
            keyword: /\b(?:choice|plural|select|selectordinal)\b/,
            'arg-type': {
              pattern: /\b(?:date|duration|number|ordinal|spellout|time)\b/,
              alias: 'keyword',
            },
            'arg-skeleton': {
              pattern: /(,\s*)::[^{}:=,\s]+/,
              lookbehind: !0,
            },
            'arg-style': {
              pattern:
                /(,\s*)(?:currency|full|integer|long|medium|percent|short)(?=\s*$)/,
              lookbehind: !0,
            },
            'arg-style-text': {
              pattern: RegExp(
                '(^\\s*,\\s*(?=\\S))' +
                  t("(?:[^{}']|'[^']*'|\\{(?:<SELF>)?\\})+", 8) +
                  '$',
              ),
              lookbehind: !0,
              alias: 'string',
            },
            punctuation: /,/,
          },
        },
        'argument-delimiter': {
          pattern: /./,
          alias: 'operator',
        },
      },
    },
    escape: n,
    string: r,
  }),
    (i.inside.message.inside = e.languages['icu-message-format']),
    (e.languages['icu-message-format'].argument.inside.content.inside[
      'choice-style'
    ].inside.rest = e.languages['icu-message-format']);
})(Prism);
!(function (n) {
  (n.languages.ignore = {
    comment: /^#.*/m,
    entry: {
      pattern: /\S(?:.*(?:(?:\\ )|\S))?/,
      alias: 'string',
      inside: {
        operator: /^!|\*\*?|\?/,
        regex: {
          pattern: /(^|[^\\])\[[^\[\]]*\]/,
          lookbehind: !0,
        },
        punctuation: /\//,
      },
    },
  }),
    (n.languages.gitignore = n.languages.ignore),
    (n.languages.hgignore = n.languages.ignore),
    (n.languages.npmignore = n.languages.ignore);
})(Prism);
(Prism.languages.inform7 = {
  string: {
    pattern: /"[^"]*"/,
    inside: {
      substitution: {
        pattern: /\[[^\[\]]+\]/,
        inside: {
          delimiter: {
            pattern: /\[|\]/,
            alias: 'punctuation',
          },
        },
      },
    },
  },
  comment: {
    pattern: /\[[^\[\]]+\]/,
    greedy: !0,
  },
  title: {
    pattern: /^[ \t]*(?:book|chapter|part(?! of)|section|table|volume)\b.+/im,
    alias: 'important',
  },
  number: {
    pattern:
      /(^|[^-])(?:\b\d+(?:\.\d+)?(?:\^\d+)?(?:(?!\d)\w+)?|\b(?:eight|eleven|five|four|nine|one|seven|six|ten|three|twelve|two))\b(?!-)/i,
    lookbehind: !0,
  },
  verb: {
    pattern:
      /(^|[^-])\b(?:answering|applying to|are|asking|attacking|be(?:ing)?|burning|buying|called|carries|carry(?! out)|carrying|climbing|closing|conceal(?:ing|s)?|consulting|contain(?:ing|s)?|cutting|drinking|dropping|eating|enclos(?:es?|ing)|entering|examining|exiting|getting|giving|going|ha(?:s|ve|ving)|hold(?:ing|s)?|impl(?:ies|y)|incorporat(?:es?|ing)|inserting|is|jumping|kissing|listening|locking|looking|mean(?:ing|s)?|opening|provid(?:es?|ing)|pulling|pushing|putting|relat(?:es?|ing)|removing|searching|see(?:ing|s)?|setting|showing|singing|sleeping|smelling|squeezing|support(?:ing|s)?|swearing|switching|taking|tasting|telling|thinking|throwing|touching|turning|tying|unlock(?:ing|s)?|var(?:ies|y|ying)|waiting|waking|waving|wear(?:ing|s)?)\b(?!-)/i,
    lookbehind: !0,
    alias: 'operator',
  },
  keyword: {
    pattern:
      /(^|[^-])\b(?:after|before|carry out|check|continue the action|definition(?= *:)|do nothing|else|end (?:if|the story|unless)|every turn|if|include|instead(?: of)?|let|move|no|now|otherwise|repeat|report|resume the story|rule for|running through|say(?:ing)?|stop the action|test|try(?:ing)?|understand|unless|use|when|while|yes)\b(?!-)/i,
    lookbehind: !0,
  },
  property: {
    pattern:
      /(^|[^-])\b(?:adjacent(?! to)|carried|closed|concealed|contained|dark|described|edible|empty|enclosed|enterable|even|female|fixed in place|full|handled|held|improper-named|incorporated|inedible|invisible|lighted|lit|lock(?:able|ed)|male|marked for listing|mentioned|negative|neuter|non-(?:empty|full|recurring)|odd|opaque|open(?:able)?|plural-named|portable|positive|privately-named|proper-named|provided|publically-named|pushable between rooms|recurring|related|rubbing|scenery|seen|singular-named|supported|swinging|switch(?:able|ed(?: off| on)?)|touch(?:able|ed)|transparent|unconcealed|undescribed|unlit|unlocked|unmarked for listing|unmentioned|unopenable|untouchable|unvisited|variable|visible|visited|wearable|worn)\b(?!-)/i,
    lookbehind: !0,
    alias: 'symbol',
  },
  position: {
    pattern:
      /(^|[^-])\b(?:above|adjacent to|back side of|below|between|down|east|everywhere|front side|here|in|inside(?: from)?|north(?:east|west)?|nowhere|on(?: top of)?|other side|outside(?: from)?|parts? of|regionally in|south(?:east|west)?|through|up|west|within)\b(?!-)/i,
    lookbehind: !0,
    alias: 'keyword',
  },
  type: {
    pattern:
      /(^|[^-])\b(?:actions?|activit(?:ies|y)|actors?|animals?|backdrops?|containers?|devices?|directions?|doors?|holders?|kinds?|lists?|m[ae]n|nobody|nothing|nouns?|numbers?|objects?|people|persons?|player(?:'s holdall)?|regions?|relations?|rooms?|rule(?:book)?s?|scenes?|someone|something|supporters?|tables?|texts?|things?|time|vehicles?|wom[ae]n)\b(?!-)/i,
    lookbehind: !0,
    alias: 'variable',
  },
  punctuation: /[.,:;(){}]/,
}),
  (Prism.languages.inform7.string.inside.substitution.inside.rest =
    Prism.languages.inform7),
  (Prism.languages.inform7.string.inside.substitution.inside.rest.text = {
    pattern: /\S(?:\s*\S)*/,
    alias: 'comment',
  });
Prism.languages.j = {
  comment: {
    pattern: /\bNB\..*/,
    greedy: !0,
  },
  string: {
    pattern: /'(?:''|[^'\r\n])*'/,
    greedy: !0,
  },
  keyword:
    /\b(?:(?:CR|LF|adverb|conjunction|def|define|dyad|monad|noun|verb)\b|(?:assert|break|case|catch[dt]?|continue|do|else|elseif|end|fcase|for|for_\w+|goto_\w+|if|label_\w+|return|select|throw|try|while|whilst)\.)/,
  verb: {
    pattern:
      /(?!\^:|;\.|[=!][.:])(?:\{(?:\.|::?)?|p(?:\.\.?|:)|[=!\]]|[<>+*\-%$|,#][.:]?|[?^]\.?|[;\[]:?|[~}"i][.:]|[ACeEIjLor]\.|(?:[_\/\\qsux]|_?\d):)/,
    alias: 'keyword',
  },
  number:
    /\b_?(?:(?!\d:)\d+(?:\.\d+)?(?:(?:ad|ar|[ejpx])_?\d+(?:\.\d+)?)*(?:b_?[\da-z]+(?:\.[\da-z]+)?)?|_\b(?!\.))/,
  adverb: {
    pattern: /[~}]|[\/\\]\.?|[bfM]\.|t[.:]/,
    alias: 'builtin',
  },
  operator: /[=a][.:]|_\./,
  conjunction: {
    pattern: /&(?:\.:?|:)?|[.:@][.:]?|[!D][.:]|[;dHT]\.|`:?|[\^LS]:|"/,
    alias: 'variable',
  },
  punctuation: /[()]/,
};
!(function (e) {
  var n =
      /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|non-sealed|null|open|opens|package|permits|private|protected|provides|public|record(?!\s*[(){}[\]<>=%~.:,;?+\-*/&|^])|requires|return|sealed|short|static|strictfp|super|switch|synchronized|this|throw|throws|to|transient|transitive|try|uses|var|void|volatile|while|with|yield)\b/,
    t = '(?:[a-z]\\w*\\s*\\.\\s*)*(?:[A-Z]\\w*\\s*\\.\\s*)*',
    s = {
      pattern: RegExp('(^|[^\\w.])' + t + '[A-Z](?:[\\d_A-Z]*[a-z]\\w*)?\\b'),
      lookbehind: !0,
      inside: {
        namespace: {
          pattern: /^[a-z]\w*(?:\s*\.\s*[a-z]\w*)*(?:\s*\.)?/,
          inside: {
            punctuation: /\./,
          },
        },
        punctuation: /\./,
      },
    };
  (e.languages.java = e.languages.extend('clike', {
    string: {
      pattern: /(^|[^\\])"(?:\\.|[^"\\\r\n])*"/,
      lookbehind: !0,
      greedy: !0,
    },
    'class-name': [
      s,
      {
        pattern: RegExp(
          '(^|[^\\w.])' +
            t +
            '[A-Z]\\w*(?=\\s+\\w+\\s*[;,=()]|\\s*(?:\\[[\\s,]*\\]\\s*)?::\\s*new\\b)',
        ),
        lookbehind: !0,
        inside: s.inside,
      },
      {
        pattern: RegExp(
          '(\\b(?:class|enum|extends|implements|instanceof|interface|new|record|throws)\\s+)' +
            t +
            '[A-Z]\\w*\\b',
        ),
        lookbehind: !0,
        inside: s.inside,
      },
    ],
    keyword: n,
    function: [
      e.languages.clike.function,
      {
        pattern: /(::\s*)[a-z_]\w*/,
        lookbehind: !0,
      },
    ],
    number:
      /\b0b[01][01_]*L?\b|\b0x(?:\.[\da-f_p+-]+|[\da-f_]+(?:\.[\da-f_p+-]+)?)\b|(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.\d[\d_]*)(?:e[+-]?\d[\d_]*)?[dfl]?/i,
    operator: {
      pattern:
        /(^|[^.])(?:<<=?|>>>?=?|->|--|\+\+|&&|\|\||::|[?:~]|[-+*/%&|^!=<>]=?)/m,
      lookbehind: !0,
    },
    constant: /\b[A-Z][A-Z_\d]+\b/,
  })),
    e.languages.insertBefore('java', 'string', {
      'triple-quoted-string': {
        pattern: /"""[ \t]*[\r\n](?:(?:"|"")?(?:\\.|[^"\\]))*"""/,
        greedy: !0,
        alias: 'string',
      },
      char: {
        pattern: /'(?:\\.|[^'\\\r\n]){1,6}'/,
        greedy: !0,
      },
    }),
    e.languages.insertBefore('java', 'class-name', {
      annotation: {
        pattern: /(^|[^.])@\w+(?:\s*\.\s*\w+)*/,
        lookbehind: !0,
        alias: 'punctuation',
      },
      generics: {
        pattern:
          /<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&))*>)*>)*>)*>/,
        inside: {
          'class-name': s,
          keyword: n,
          punctuation: /[<>(),.:]/,
          operator: /[?&|]/,
        },
      },
      import: [
        {
          pattern: RegExp('(\\bimport\\s+)' + t + '(?:[A-Z]\\w*|\\*)(?=\\s*;)'),
          lookbehind: !0,
          inside: {
            namespace: s.inside.namespace,
            punctuation: /\./,
            operator: /\*/,
            'class-name': /\w+/,
          },
        },
        {
          pattern: RegExp(
            '(\\bimport\\s+static\\s+)' + t + '(?:\\w+|\\*)(?=\\s*;)',
          ),
          lookbehind: !0,
          alias: 'static',
          inside: {
            namespace: s.inside.namespace,
            static: /\b\w+$/,
            punctuation: /\./,
            operator: /\*/,
            'class-name': /\w+/,
          },
        },
      ],
      namespace: {
        pattern: RegExp(
          '(\\b(?:exports|import(?:\\s+static)?|module|open|opens|package|provides|requires|to|transitive|uses|with)\\s+)(?!<keyword>)[a-z]\\w*(?:\\.[a-z]\\w*)*\\.?'.replace(
            /<keyword>/g,
            function () {
              return n.source;
            },
          ),
        ),
        lookbehind: !0,
        inside: {
          punctuation: /\./,
        },
      },
    });
})(Prism);
!(function (e) {
  var a = /\/\*[\s\S]*?\*\/|\/\/.*|#(?!\[).*/,
    t = [
      {
        pattern: /\b(?:false|true)\b/i,
        alias: 'boolean',
      },
      {
        pattern: /(::\s*)\b[a-z_]\w*\b(?!\s*\()/i,
        greedy: !0,
        lookbehind: !0,
      },
      {
        pattern: /(\b(?:case|const)\s+)\b[a-z_]\w*(?=\s*[;=])/i,
        greedy: !0,
        lookbehind: !0,
      },
      /\b(?:null)\b/i,
      /\b[A-Z_][A-Z0-9_]*\b(?!\s*\()/,
    ],
    i =
      /\b0b[01]+(?:_[01]+)*\b|\b0o[0-7]+(?:_[0-7]+)*\b|\b0x[\da-f]+(?:_[\da-f]+)*\b|(?:\b\d+(?:_\d+)*\.?(?:\d+(?:_\d+)*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
    n =
      /<?=>|\?\?=?|\.{3}|\??->|[!=]=?=?|::|\*\*=?|--|\+\+|&&|\|\||<<|>>|[?~]|[/^|%*&<>.+-]=?/,
    s = /[{}\[\](),:;]/;
  e.languages.php = {
    delimiter: {
      pattern: /\?>$|^<\?(?:php(?=\s)|=)?/i,
      alias: 'important',
    },
    comment: a,
    variable: /\$+(?:\w+\b|(?=\{))/,
    package: {
      pattern:
        /(namespace\s+|use\s+(?:function\s+)?)(?:\\?\b[a-z_]\w*)+\b(?!\\)/i,
      lookbehind: !0,
      inside: {
        punctuation: /\\/,
      },
    },
    'class-name-definition': {
      pattern: /(\b(?:class|enum|interface|trait)\s+)\b[a-z_]\w*(?!\\)\b/i,
      lookbehind: !0,
      alias: 'class-name',
    },
    'function-definition': {
      pattern: /(\bfunction\s+)[a-z_]\w*(?=\s*\()/i,
      lookbehind: !0,
      alias: 'function',
    },
    keyword: [
      {
        pattern:
          /(\(\s*)\b(?:array|bool|boolean|float|int|integer|object|string)\b(?=\s*\))/i,
        alias: 'type-casting',
        greedy: !0,
        lookbehind: !0,
      },
      {
        pattern:
          /([(,?]\s*)\b(?:array(?!\s*\()|bool|callable|(?:false|null)(?=\s*\|)|float|int|iterable|mixed|object|self|static|string)\b(?=\s*\$)/i,
        alias: 'type-hint',
        greedy: !0,
        lookbehind: !0,
      },
      {
        pattern:
          /(\)\s*:\s*(?:\?\s*)?)\b(?:array(?!\s*\()|bool|callable|(?:false|null)(?=\s*\|)|float|int|iterable|mixed|never|object|self|static|string|void)\b/i,
        alias: 'return-type',
        greedy: !0,
        lookbehind: !0,
      },
      {
        pattern:
          /\b(?:array(?!\s*\()|bool|float|int|iterable|mixed|object|string|void)\b/i,
        alias: 'type-declaration',
        greedy: !0,
      },
      {
        pattern: /(\|\s*)(?:false|null)\b|\b(?:false|null)(?=\s*\|)/i,
        alias: 'type-declaration',
        greedy: !0,
        lookbehind: !0,
      },
      {
        pattern: /\b(?:parent|self|static)(?=\s*::)/i,
        alias: 'static-context',
        greedy: !0,
      },
      {
        pattern: /(\byield\s+)from\b/i,
        lookbehind: !0,
      },
      /\bclass\b/i,
      {
        pattern:
          /((?:^|[^\s>:]|(?:^|[^-])>|(?:^|[^:]):)\s*)\b(?:abstract|and|array|as|break|callable|case|catch|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|enum|eval|exit|extends|final|finally|fn|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|match|namespace|never|new|or|parent|print|private|protected|public|readonly|require|require_once|return|self|static|switch|throw|trait|try|unset|use|var|while|xor|yield|__halt_compiler)\b/i,
        lookbehind: !0,
      },
    ],
    'argument-name': {
      pattern: /([(,]\s*)\b[a-z_]\w*(?=\s*:(?!:))/i,
      lookbehind: !0,
    },
    'class-name': [
      {
        pattern:
          /(\b(?:extends|implements|instanceof|new(?!\s+self|\s+static))\s+|\bcatch\s*\()\b[a-z_]\w*(?!\\)\b/i,
        greedy: !0,
        lookbehind: !0,
      },
      {
        pattern: /(\|\s*)\b[a-z_]\w*(?!\\)\b/i,
        greedy: !0,
        lookbehind: !0,
      },
      {
        pattern: /\b[a-z_]\w*(?!\\)\b(?=\s*\|)/i,
        greedy: !0,
      },
      {
        pattern: /(\|\s*)(?:\\?\b[a-z_]\w*)+\b/i,
        alias: 'class-name-fully-qualified',
        greedy: !0,
        lookbehind: !0,
        inside: {
          punctuation: /\\/,
        },
      },
      {
        pattern: /(?:\\?\b[a-z_]\w*)+\b(?=\s*\|)/i,
        alias: 'class-name-fully-qualified',
        greedy: !0,
        inside: {
          punctuation: /\\/,
        },
      },
      {
        pattern:
          /(\b(?:extends|implements|instanceof|new(?!\s+self\b|\s+static\b))\s+|\bcatch\s*\()(?:\\?\b[a-z_]\w*)+\b(?!\\)/i,
        alias: 'class-name-fully-qualified',
        greedy: !0,
        lookbehind: !0,
        inside: {
          punctuation: /\\/,
        },
      },
      {
        pattern: /\b[a-z_]\w*(?=\s*\$)/i,
        alias: 'type-declaration',
        greedy: !0,
      },
      {
        pattern: /(?:\\?\b[a-z_]\w*)+(?=\s*\$)/i,
        alias: ['class-name-fully-qualified', 'type-declaration'],
        greedy: !0,
        inside: {
          punctuation: /\\/,
        },
      },
      {
        pattern: /\b[a-z_]\w*(?=\s*::)/i,
        alias: 'static-context',
        greedy: !0,
      },
      {
        pattern: /(?:\\?\b[a-z_]\w*)+(?=\s*::)/i,
        alias: ['class-name-fully-qualified', 'static-context'],
        greedy: !0,
        inside: {
          punctuation: /\\/,
        },
      },
      {
        pattern: /([(,?]\s*)[a-z_]\w*(?=\s*\$)/i,
        alias: 'type-hint',
        greedy: !0,
        lookbehind: !0,
      },
      {
        pattern: /([(,?]\s*)(?:\\?\b[a-z_]\w*)+(?=\s*\$)/i,
        alias: ['class-name-fully-qualified', 'type-hint'],
        greedy: !0,
        lookbehind: !0,
        inside: {
          punctuation: /\\/,
        },
      },
      {
        pattern: /(\)\s*:\s*(?:\?\s*)?)\b[a-z_]\w*(?!\\)\b/i,
        alias: 'return-type',
        greedy: !0,
        lookbehind: !0,
      },
      {
        pattern: /(\)\s*:\s*(?:\?\s*)?)(?:\\?\b[a-z_]\w*)+\b(?!\\)/i,
        alias: ['class-name-fully-qualified', 'return-type'],
        greedy: !0,
        lookbehind: !0,
        inside: {
          punctuation: /\\/,
        },
      },
    ],
    constant: t,
    function: {
      pattern: /(^|[^\\\w])\\?[a-z_](?:[\w\\]*\w)?(?=\s*\()/i,
      lookbehind: !0,
      inside: {
        punctuation: /\\/,
      },
    },
    property: {
      pattern: /(->\s*)\w+/,
      lookbehind: !0,
    },
    number: i,
    operator: n,
    punctuation: s,
  };
  var l = {
      pattern:
        /\{\$(?:\{(?:\{[^{}]+\}|[^{}]+)\}|[^{}])+\}|(^|[^\\{])\$+(?:\w+(?:\[[^\r\n\[\]]+\]|->\w+)?)/,
      lookbehind: !0,
      inside: e.languages.php,
    },
    r = [
      {
        pattern: /<<<'([^']+)'[\r\n](?:.*[\r\n])*?\1;/,
        alias: 'nowdoc-string',
        greedy: !0,
        inside: {
          delimiter: {
            pattern: /^<<<'[^']+'|[a-z_]\w*;$/i,
            alias: 'symbol',
            inside: {
              punctuation: /^<<<'?|[';]$/,
            },
          },
        },
      },
      {
        pattern:
          /<<<(?:"([^"]+)"[\r\n](?:.*[\r\n])*?\1;|([a-z_]\w*)[\r\n](?:.*[\r\n])*?\2;)/i,
        alias: 'heredoc-string',
        greedy: !0,
        inside: {
          delimiter: {
            pattern: /^<<<(?:"[^"]+"|[a-z_]\w*)|[a-z_]\w*;$/i,
            alias: 'symbol',
            inside: {
              punctuation: /^<<<"?|[";]$/,
            },
          },
          interpolation: l,
        },
      },
      {
        pattern: /`(?:\\[\s\S]|[^\\`])*`/,
        alias: 'backtick-quoted-string',
        greedy: !0,
      },
      {
        pattern: /'(?:\\[\s\S]|[^\\'])*'/,
        alias: 'single-quoted-string',
        greedy: !0,
      },
      {
        pattern: /"(?:\\[\s\S]|[^\\"])*"/,
        alias: 'double-quoted-string',
        greedy: !0,
        inside: {
          interpolation: l,
        },
      },
    ];
  e.languages.insertBefore('php', 'variable', {
    string: r,
    attribute: {
      pattern:
        /#\[(?:[^"'\/#]|\/(?![*/])|\/\/.*$|#(?!\[).*$|\/\*(?:[^*]|\*(?!\/))*\*\/|"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*')+\](?=\s*[a-z$#])/im,
      greedy: !0,
      inside: {
        'attribute-content': {
          pattern: /^(#\[)[\s\S]+(?=\]$)/,
          lookbehind: !0,
          inside: {
            comment: a,
            string: r,
            'attribute-class-name': [
              {
                pattern: /([^:]|^)\b[a-z_]\w*(?!\\)\b/i,
                alias: 'class-name',
                greedy: !0,
                lookbehind: !0,
              },
              {
                pattern: /([^:]|^)(?:\\?\b[a-z_]\w*)+/i,
                alias: ['class-name', 'class-name-fully-qualified'],
                greedy: !0,
                lookbehind: !0,
                inside: {
                  punctuation: /\\/,
                },
              },
            ],
            constant: t,
            number: i,
            operator: n,
            punctuation: s,
          },
        },
        delimiter: {
          pattern: /^#\[|\]$/,
          alias: 'punctuation',
        },
      },
    },
  }),
    e.hooks.add('before-tokenize', function (a) {
      /<\?/.test(a.code) &&
        e.languages['markup-templating'].buildPlaceholders(
          a,
          'php',
          /<\?(?:[^"'/#]|\/(?![*/])|("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|(?:\/\/|#(?!\[))(?:[^?\n\r]|\?(?!>))*(?=$|\?>|[\r\n])|#\[|\/\*(?:[^*]|\*(?!\/))*(?:\*\/|$))*?(?:\?>|$)/g,
        );
    }),
    e.hooks.add('after-tokenize', function (a) {
      e.languages['markup-templating'].tokenizePlaceholders(a, 'php');
    });
})(Prism);
!(function (a) {
  var e = (a.languages.javadoclike = {
    parameter: {
      pattern: /(^[\t ]*(?:\/{3}|\*|\/\*\*)\s*@(?:arg|arguments|param)\s+)\w+/m,
      lookbehind: !0,
    },
    keyword: {
      pattern: /(^[\t ]*(?:\/{3}|\*|\/\*\*)\s*|\{)@[a-z][a-zA-Z-]+\b/m,
      lookbehind: !0,
    },
    punctuation: /[{}]/,
  });
  Object.defineProperty(e, 'addSupport', {
    value: function (e, n) {
      'string' == typeof e && (e = [e]),
        e.forEach(function (e) {
          !(function (e, n) {
            var t = 'doc-comment',
              r = a.languages[e];
            if (r) {
              var o = r[t];
              if (
                (o ||
                  (o = (r = a.languages.insertBefore(e, 'comment', {
                    'doc-comment': {
                      pattern: /(^|[^\\])\/\*\*[^/][\s\S]*?(?:\*\/|$)/,
                      lookbehind: !0,
                      alias: 'comment',
                    },
                  }))[t]),
                o instanceof RegExp &&
                  (o = r[t] =
                    {
                      pattern: o,
                    }),
                Array.isArray(o))
              )
                for (var i = 0, s = o.length; i < s; i++)
                  o[i] instanceof RegExp &&
                    (o[i] = {
                      pattern: o[i],
                    }),
                    n(o[i]);
              else n(o);
            }
          })(e, function (a) {
            a.inside || (a.inside = {}), (a.inside.rest = n);
          });
        });
    },
  }),
    e.addSupport(['java', 'javascript', 'php'], e);
})(Prism);
!(function (a) {
  var e = /(^(?:[\t ]*(?:\*\s*)*))[^*\s].*$/m,
    n =
      '(?:\\b[a-zA-Z]\\w+\\s*\\.\\s*)*\\b[A-Z]\\w*(?:\\s*<mem>)?|<mem>'.replace(
        /<mem>/g,
        function () {
          return '#\\s*\\w+(?:\\s*\\([^()]*\\))?';
        },
      );
  (a.languages.javadoc = a.languages.extend('javadoclike', {})),
    a.languages.insertBefore('javadoc', 'keyword', {
      reference: {
        pattern: RegExp(
          '(@(?:exception|link|linkplain|see|throws|value)\\s+(?:\\*\\s*)?)(?:' +
            n +
            ')',
        ),
        lookbehind: !0,
        inside: {
          function: {
            pattern: /(#\s*)\w+(?=\s*\()/,
            lookbehind: !0,
          },
          field: {
            pattern: /(#\s*)\w+/,
            lookbehind: !0,
          },
          namespace: {
            pattern: /\b(?:[a-z]\w*\s*\.\s*)+/,
            inside: {
              punctuation: /\./,
            },
          },
          'class-name': /\b[A-Z]\w*/,
          keyword: a.languages.java.keyword,
          punctuation: /[#()[\],.]/,
        },
      },
      'class-name': {
        pattern: /(@param\s+)<[A-Z]\w*>/,
        lookbehind: !0,
        inside: {
          punctuation: /[.<>]/,
        },
      },
      'code-section': [
        {
          pattern:
            /(\{@code\s+(?!\s))(?:[^\s{}]|\s+(?![\s}])|\{(?:[^{}]|\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*\})+(?=\s*\})/,
          lookbehind: !0,
          inside: {
            code: {
              pattern: e,
              lookbehind: !0,
              inside: a.languages.java,
              alias: 'language-java',
            },
          },
        },
        {
          pattern:
            /(<(code|pre|tt)>(?!<code>)\s*)\S(?:\S|\s+\S)*?(?=\s*<\/\2>)/,
          lookbehind: !0,
          inside: {
            line: {
              pattern: e,
              lookbehind: !0,
              inside: {
                tag: a.languages.markup.tag,
                entity: a.languages.markup.entity,
                code: {
                  pattern: /.+/,
                  inside: a.languages.java,
                  alias: 'language-java',
                },
              },
            },
          },
        },
      ],
      tag: a.languages.markup.tag,
      entity: a.languages.markup.entity,
    }),
    a.languages.javadoclike.addSupport('java', a.languages.javadoc);
})(Prism);
Prism.languages.javastacktrace = {
  summary: {
    pattern:
      /^([\t ]*)(?:(?:Caused by:|Suppressed:|Exception in thread "[^"]*")[\t ]+)?[\w$.]+(?::.*)?$/m,
    lookbehind: !0,
    inside: {
      keyword: {
        pattern:
          /^([\t ]*)(?:(?:Caused by|Suppressed)(?=:)|Exception in thread)/m,
        lookbehind: !0,
      },
      string: {
        pattern: /^(\s*)"[^"]*"/,
        lookbehind: !0,
      },
      exceptions: {
        pattern: /^(:?\s*)[\w$.]+(?=:|$)/,
        lookbehind: !0,
        inside: {
          'class-name': /[\w$]+$/,
          namespace: /\b[a-z]\w*\b/,
          punctuation: /\./,
        },
      },
      message: {
        pattern: /(:\s*)\S.*/,
        lookbehind: !0,
        alias: 'string',
      },
      punctuation: /:/,
    },
  },
  'stack-frame': {
    pattern: /^([\t ]*)at (?:[\w$./]|@[\w$.+-]*\/)+(?:<init>)?\([^()]*\)/m,
    lookbehind: !0,
    inside: {
      keyword: {
        pattern: /^(\s*)at(?= )/,
        lookbehind: !0,
      },
      source: [
        {
          pattern: /(\()\w+\.\w+:\d+(?=\))/,
          lookbehind: !0,
          inside: {
            file: /^\w+\.\w+/,
            punctuation: /:/,
            'line-number': {
              pattern: /\b\d+\b/,
              alias: 'number',
            },
          },
        },
        {
          pattern: /(\()[^()]*(?=\))/,
          lookbehind: !0,
          inside: {
            keyword: /^(?:Native Method|Unknown Source)$/,
          },
        },
      ],
      'class-name': /[\w$]+(?=\.(?:<init>|[\w$]+)\()/,
      function: /(?:<init>|[\w$]+)(?=\()/,
      'class-loader': {
        pattern: /(\s)[a-z]\w*(?:\.[a-z]\w*)*(?=\/[\w@$.]*\/)/,
        lookbehind: !0,
        alias: 'namespace',
        inside: {
          punctuation: /\./,
        },
      },
      module: {
        pattern: /([\s/])[a-z]\w*(?:\.[a-z]\w*)*(?:@[\w$.+-]*)?(?=\/)/,
        lookbehind: !0,
        inside: {
          version: {
            pattern: /(@)[\s\S]+/,
            lookbehind: !0,
            alias: 'number',
          },
          punctuation: /[@.]/,
        },
      },
      namespace: {
        pattern: /(?:\b[a-z]\w*\.)+/,
        inside: {
          punctuation: /\./,
        },
      },
      punctuation: /[()/.]/,
    },
  },
  more: {
    pattern: /^([\t ]*)\.{3} \d+ [a-z]+(?: [a-z]+)*/m,
    lookbehind: !0,
    inside: {
      punctuation: /\.{3}/,
      number: /\d+/,
      keyword: /\b[a-z]+(?: [a-z]+)*\b/,
    },
  },
};
!(function (e) {
  (e.languages.typescript = e.languages.extend('javascript', {
    'class-name': {
      pattern:
        /(\b(?:class|extends|implements|instanceof|interface|new|type)\s+)(?!keyof\b)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?:\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/,
      lookbehind: !0,
      greedy: !0,
      inside: null,
    },
    builtin:
      /\b(?:Array|Function|Promise|any|boolean|console|never|number|string|symbol|unknown)\b/,
  })),
    e.languages.typescript.keyword.push(
      /\b(?:abstract|declare|is|keyof|readonly|require)\b/,
      /\b(?:asserts|infer|interface|module|namespace|type)\b(?=\s*(?:[{_$a-zA-Z\xA0-\uFFFF]|$))/,
      /\btype\b(?=\s*(?:[\{*]|$))/,
    ),
    delete e.languages.typescript.parameter,
    delete e.languages.typescript['literal-property'];
  var s = e.languages.extend('typescript', {});
  delete s['class-name'],
    (e.languages.typescript['class-name'].inside = s),
    e.languages.insertBefore('typescript', 'function', {
      decorator: {
        pattern: /@[$\w\xA0-\uFFFF]+/,
        inside: {
          at: {
            pattern: /^@/,
            alias: 'operator',
          },
          function: /^[\s\S]+/,
        },
      },
      'generic-function': {
        pattern:
          /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>(?=\s*\()/,
        greedy: !0,
        inside: {
          function: /^#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*/,
          generic: {
            pattern: /<[\s\S]+/,
            alias: 'class-name',
            inside: s,
          },
        },
      },
    }),
    (e.languages.ts = e.languages.typescript);
})(Prism);
!(function (e) {
  var a = e.languages.javascript,
    n = '\\{(?:[^{}]|\\{(?:[^{}]|\\{[^{}]*\\})*\\})+\\}',
    t = '(@(?:arg|argument|param|property)\\s+(?:' + n + '\\s+)?)';
  (e.languages.jsdoc = e.languages.extend('javadoclike', {
    parameter: {
      pattern: RegExp(t + '(?:(?!\\s)[$\\w\\xA0-\\uFFFF.])+(?=\\s|$)'),
      lookbehind: !0,
      inside: {
        punctuation: /\./,
      },
    },
  })),
    e.languages.insertBefore('jsdoc', 'keyword', {
      'optional-parameter': {
        pattern: RegExp(
          t + '\\[(?:(?!\\s)[$\\w\\xA0-\\uFFFF.])+(?:=[^[\\]]+)?\\](?=\\s|$)',
        ),
        lookbehind: !0,
        inside: {
          parameter: {
            pattern: /(^\[)[$\w\xA0-\uFFFF\.]+/,
            lookbehind: !0,
            inside: {
              punctuation: /\./,
            },
          },
          code: {
            pattern: /(=)[\s\S]*(?=\]$)/,
            lookbehind: !0,
            inside: a,
            alias: 'language-javascript',
          },
          punctuation: /[=[\]]/,
        },
      },
      'class-name': [
        {
          pattern: RegExp(
            '(@(?:augments|class|extends|interface|memberof!?|template|this|typedef)\\s+(?:<TYPE>\\s+)?)[A-Z]\\w*(?:\\.[A-Z]\\w*)*'.replace(
              /<TYPE>/g,
              function () {
                return n;
              },
            ),
          ),
          lookbehind: !0,
          inside: {
            punctuation: /\./,
          },
        },
        {
          pattern: RegExp('(@[a-z]+\\s+)' + n),
          lookbehind: !0,
          inside: {
            string: a.string,
            number: a.number,
            boolean: a.boolean,
            keyword: e.languages.typescript.keyword,
            operator: /=>|\.\.\.|[&|?:*]/,
            punctuation: /[.,;=<>{}()[\]]/,
          },
        },
      ],
      example: {
        pattern:
          /(@example\s+(?!\s))(?:[^@\s]|\s+(?!\s))+?(?=\s*(?:\*\s*)?(?:@\w|\*\/))/,
        lookbehind: !0,
        inside: {
          code: {
            pattern: /^([\t ]*(?:\*\s*)?)\S.*$/m,
            lookbehind: !0,
            inside: a,
            alias: 'language-javascript',
          },
        },
      },
    }),
    e.languages.javadoclike.addSupport('javascript', e.languages.jsdoc);
})(Prism);
!(function (a) {
  function e(a, e) {
    return RegExp(
      a.replace(/<ID>/g, function () {
        return '(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*';
      }),
      e,
    );
  }
  a.languages.insertBefore('javascript', 'function-variable', {
    'method-variable': {
      pattern: RegExp(
        '(\\.\\s*)' +
          a.languages.javascript['function-variable'].pattern.source,
      ),
      lookbehind: !0,
      alias: ['function-variable', 'method', 'function', 'property-access'],
    },
  }),
    a.languages.insertBefore('javascript', 'function', {
      method: {
        pattern: RegExp('(\\.\\s*)' + a.languages.javascript.function.source),
        lookbehind: !0,
        alias: ['function', 'property-access'],
      },
    }),
    a.languages.insertBefore('javascript', 'constant', {
      'known-class-name': [
        {
          pattern:
            /\b(?:(?:Float(?:32|64)|(?:Int|Uint)(?:8|16|32)|Uint8Clamped)?Array|ArrayBuffer|BigInt|Boolean|DataView|Date|Error|Function|Intl|JSON|(?:Weak)?(?:Map|Set)|Math|Number|Object|Promise|Proxy|Reflect|RegExp|String|Symbol|WebAssembly)\b/,
          alias: 'class-name',
        },
        {
          pattern: /\b(?:[A-Z]\w*)Error\b/,
          alias: 'class-name',
        },
      ],
    }),
    a.languages.insertBefore('javascript', 'keyword', {
      imports: {
        pattern: e(
          '(\\bimport\\b\\s*)(?:<ID>(?:\\s*,\\s*(?:\\*\\s*as\\s+<ID>|\\{[^{}]*\\}))?|\\*\\s*as\\s+<ID>|\\{[^{}]*\\})(?=\\s*\\bfrom\\b)',
        ),
        lookbehind: !0,
        inside: a.languages.javascript,
      },
      exports: {
        pattern: e(
          '(\\bexport\\b\\s*)(?:\\*(?:\\s*as\\s+<ID>)?(?=\\s*\\bfrom\\b)|\\{[^{}]*\\})',
        ),
        lookbehind: !0,
        inside: a.languages.javascript,
      },
    }),
    a.languages.javascript.keyword.unshift(
      {
        pattern: /\b(?:as|default|export|from|import)\b/,
        alias: 'module',
      },
      {
        pattern:
          /\b(?:await|break|catch|continue|do|else|finally|for|if|return|switch|throw|try|while|yield)\b/,
        alias: 'control-flow',
      },
      {
        pattern: /\bnull\b/,
        alias: ['null', 'nil'],
      },
      {
        pattern: /\bundefined\b/,
        alias: 'nil',
      },
    ),
    a.languages.insertBefore('javascript', 'operator', {
      spread: {
        pattern: /\.{3}/,
        alias: 'operator',
      },
      arrow: {
        pattern: /=>/,
        alias: 'operator',
      },
    }),
    a.languages.insertBefore('javascript', 'punctuation', {
      'property-access': {
        pattern: e('(\\.\\s*)#?<ID>'),
        lookbehind: !0,
      },
      'maybe-class-name': {
        pattern: /(^|[^$\w\xA0-\uFFFF])[A-Z][$\w\xA0-\uFFFF]+/,
        lookbehind: !0,
      },
      dom: {
        pattern:
          /\b(?:document|(?:local|session)Storage|location|navigator|performance|window)\b/,
        alias: 'variable',
      },
      console: {
        pattern: /\bconsole(?=\s*\.)/,
        alias: 'class-name',
      },
    });
  for (
    var t = [
        'function',
        'function-variable',
        'method',
        'method-variable',
        'property-access',
      ],
      r = 0;
    r < t.length;
    r++
  ) {
    var n = t[r],
      s = a.languages.javascript[n];
    'RegExp' === a.util.type(s) &&
      (s = a.languages.javascript[n] =
        {
          pattern: s,
        });
    var o = s.inside || {};
    (s.inside = o), (o['maybe-class-name'] = /^[A-Z][\s\S]*/);
  }
})(Prism);
(Prism.languages.json = {
  property: {
    pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
    lookbehind: !0,
    greedy: !0,
  },
  string: {
    pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
    lookbehind: !0,
    greedy: !0,
  },
  comment: {
    pattern: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
    greedy: !0,
  },
  number: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
  punctuation: /[{}[\],]/,
  operator: /:/,
  boolean: /\b(?:false|true)\b/,
  null: {
    pattern: /\bnull\b/,
    alias: 'keyword',
  },
}),
  (Prism.languages.webmanifest = Prism.languages.json);
!(function (n) {
  var e = /("|')(?:\\(?:\r\n?|\n|.)|(?!\1)[^\\\r\n])*\1/;
  n.languages.json5 = n.languages.extend('json', {
    property: [
      {
        pattern: RegExp(e.source + '(?=\\s*:)'),
        greedy: !0,
      },
      {
        pattern:
          /(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/,
        alias: 'unquoted',
      },
    ],
    string: {
      pattern: e,
      greedy: !0,
    },
    number:
      /[+-]?\b(?:NaN|Infinity|0x[a-fA-F\d]+)\b|[+-]?(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:[eE][+-]?\d+\b)?/,
  });
})(Prism);
(Prism.languages.jsonp = Prism.languages.extend('json', {
  punctuation: /[{}[\]();,.]/,
})),
  Prism.languages.insertBefore('jsonp', 'punctuation', {
    function: /(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*\()/,
  });
Prism.languages.jsstacktrace = {
  'error-message': {
    pattern: /^\S.*/m,
    alias: 'string',
  },
  'stack-frame': {
    pattern: /(^[ \t]+)at[ \t].*/m,
    lookbehind: !0,
    inside: {
      'not-my-code': {
        pattern:
          /^at[ \t]+(?!\s)(?:node\.js|<unknown>|.*(?:node_modules|\(<anonymous>\)|\(<unknown>|<anonymous>$|\(internal\/|\(node\.js)).*/m,
        alias: 'comment',
      },
      filename: {
        pattern: /(\bat\s+(?!\s)|\()(?:[a-zA-Z]:)?[^():]+(?=:)/,
        lookbehind: !0,
        alias: 'url',
      },
      function: {
        pattern:
          /(\bat\s+(?:new\s+)?)(?!\s)[_$a-zA-Z\xA0-\uFFFF<][.$\w\xA0-\uFFFF<>]*/,
        lookbehind: !0,
        inside: {
          punctuation: /\./,
        },
      },
      punctuation: /[()]/,
      keyword: /\b(?:at|new)\b/,
      alias: {
        pattern: /\[(?:as\s+)?(?!\s)[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\]/,
        alias: 'variable',
      },
      'line-number': {
        pattern: /:\d+(?::\d+)?\b/,
        alias: 'number',
        inside: {
          punctuation: /:/,
        },
      },
    },
  },
};
!(function (e) {
  var t = e.languages.javascript['template-string'],
    n = t.pattern.source,
    r = t.inside.interpolation,
    a = r.inside['interpolation-punctuation'],
    i = r.pattern.source;
  function o(t, r) {
    if (e.languages[t])
      return {
        pattern: RegExp('((?:' + r + ')\\s*)' + n),
        lookbehind: !0,
        greedy: !0,
        inside: {
          'template-punctuation': {
            pattern: /^`|`$/,
            alias: 'string',
          },
          'embedded-code': {
            pattern: /[\s\S]+/,
            alias: t,
          },
        },
      };
  }
  function s(e, t) {
    return '___' + t.toUpperCase() + '_' + e + '___';
  }
  function p(t, n, r) {
    var a = {
      code: t,
      grammar: n,
      language: r,
    };
    return (
      e.hooks.run('before-tokenize', a),
      (a.tokens = e.tokenize(a.code, a.grammar)),
      e.hooks.run('after-tokenize', a),
      a.tokens
    );
  }
  function l(t) {
    var n = {};
    n['interpolation-punctuation'] = a;
    var i = e.tokenize(t, n);
    if (3 === i.length) {
      var o = [1, 1];
      o.push.apply(o, p(i[1], e.languages.javascript, 'javascript')),
        i.splice.apply(i, o);
    }
    return new e.Token('interpolation', i, r.alias, t);
  }
  function g(t, n, r) {
    var a = e.tokenize(t, {
        interpolation: {
          pattern: RegExp(i),
          lookbehind: !0,
        },
      }),
      o = 0,
      g = {},
      u = p(
        a
          .map(function (e) {
            if ('string' == typeof e) return e;
            for (var n, a = e.content; -1 !== t.indexOf((n = s(o++, r))); );
            return (g[n] = a), n;
          })
          .join(''),
        n,
        r,
      ),
      c = Object.keys(g);
    return (
      (o = 0),
      (function e(t) {
        for (var n = 0; n < t.length; n++) {
          if (o >= c.length) return;
          var r = t[n];
          if ('string' == typeof r || 'string' == typeof r.content) {
            var a = c[o],
              i = 'string' == typeof r ? r : r.content,
              s = i.indexOf(a);
            if (-1 !== s) {
              ++o;
              var p = i.substring(0, s),
                u = l(g[a]),
                f = i.substring(s + a.length),
                y = [];
              if ((p && y.push(p), y.push(u), f)) {
                var v = [f];
                e(v), y.push.apply(y, v);
              }
              'string' == typeof r
                ? (t.splice.apply(t, [n, 1].concat(y)), (n += y.length - 1))
                : (r.content = y);
            }
          } else {
            var d = r.content;
            Array.isArray(d) ? e(d) : e([d]);
          }
        }
      })(u),
      new e.Token(r, u, 'language-' + r, t)
    );
  }
  e.languages.javascript['template-string'] = [
    o(
      'css',
      '\\b(?:styled(?:\\([^)]*\\))?(?:\\s*\\.\\s*\\w+(?:\\([^)]*\\))*)*|css(?:\\s*\\.\\s*(?:global|resolve))?|createGlobalStyle|keyframes)',
    ),
    o('html', '\\bhtml|\\.\\s*(?:inner|outer)HTML\\s*\\+?='),
    o('svg', '\\bsvg'),
    o('markdown', '\\b(?:markdown|md)'),
    o('graphql', '\\b(?:gql|graphql(?:\\s*\\.\\s*experimental)?)'),
    o('sql', '\\bsql'),
    t,
  ].filter(Boolean);
  var u = {
    javascript: !0,
    js: !0,
    typescript: !0,
    ts: !0,
    jsx: !0,
    tsx: !0,
  };
  function c(e) {
    return 'string' == typeof e
      ? e
      : Array.isArray(e)
      ? e.map(c).join('')
      : c(e.content);
  }
  e.hooks.add('after-tokenize', function (t) {
    t.language in u &&
      (function t(n) {
        for (var r = 0, a = n.length; r < a; r++) {
          var i = n[r];
          if ('string' != typeof i) {
            var o = i.content;
            if (Array.isArray(o))
              if ('template-string' === i.type) {
                var s = o[1];
                if (
                  3 === o.length &&
                  'string' != typeof s &&
                  'embedded-code' === s.type
                ) {
                  var p = c(s),
                    l = s.alias,
                    u = Array.isArray(l) ? l[0] : l,
                    f = e.languages[u];
                  if (!f) continue;
                  o[1] = g(p, f, u);
                }
              } else t(o);
            else 'string' != typeof o && t([o]);
          }
        }
      })(t.tokens);
  });
})(Prism);
Prism.languages.julia = {
  comment: {
    pattern:
      /(^|[^\\])(?:#=(?:[^#=]|=(?!#)|#(?!=)|#=(?:[^#=]|=(?!#)|#(?!=))*=#)*=#|#.*)/,
    lookbehind: !0,
  },
  regex: {
    pattern: /r"(?:\\.|[^"\\\r\n])*"[imsx]{0,4}/,
    greedy: !0,
  },
  string: {
    pattern:
      /"""[\s\S]+?"""|(?:\b\w+)?"(?:\\.|[^"\\\r\n])*"|`(?:[^\\`\r\n]|\\.)*`/,
    greedy: !0,
  },
  char: {
    pattern: /(^|[^\w'])'(?:\\[^\r\n][^'\r\n]*|[^\\\r\n])'/,
    lookbehind: !0,
    greedy: !0,
  },
  keyword:
    /\b(?:abstract|baremodule|begin|bitstype|break|catch|ccall|const|continue|do|else|elseif|end|export|finally|for|function|global|if|immutable|import|importall|in|let|local|macro|module|print|println|quote|return|struct|try|type|typealias|using|while)\b/,
  boolean: /\b(?:false|true)\b/,
  number:
    /(?:\b(?=\d)|\B(?=\.))(?:0[box])?(?:[\da-f]+(?:_[\da-f]+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[efp][+-]?\d+(?:_\d+)*)?j?/i,
  operator:
    /&&|\|\||[-+*^%÷⊻&$\\]=?|\/[\/=]?|!=?=?|\|[=>]?|<(?:<=?|[=:|])?|>(?:=|>>?=?)?|==?=?|[~≠≤≥'√∛]/,
  punctuation: /::?|[{}[\]();,.?]/,
  constant: /\b(?:(?:Inf|NaN)(?:16|32|64)?|im|pi)\b|[πℯ]/,
};
Prism.languages.keepalived = {
  comment: {
    pattern: /[#!].*/,
    greedy: !0,
  },
  string: {
    pattern:
      /(^|[^\\])(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/,
    lookbehind: !0,
    greedy: !0,
  },
  ip: {
    pattern: RegExp(
      '\\b(?:(?:(?:[\\da-f]{1,4}:){7}[\\da-f]{1,4}|(?:[\\da-f]{1,4}:){6}:[\\da-f]{1,4}|(?:[\\da-f]{1,4}:){5}:(?:[\\da-f]{1,4}:)?[\\da-f]{1,4}|(?:[\\da-f]{1,4}:){4}:(?:[\\da-f]{1,4}:){0,2}[\\da-f]{1,4}|(?:[\\da-f]{1,4}:){3}:(?:[\\da-f]{1,4}:){0,3}[\\da-f]{1,4}|(?:[\\da-f]{1,4}:){2}:(?:[\\da-f]{1,4}:){0,4}[\\da-f]{1,4}|(?:[\\da-f]{1,4}:){6}<ipv4>|(?:[\\da-f]{1,4}:){0,5}:<ipv4>|::(?:[\\da-f]{1,4}:){0,5}<ipv4>|[\\da-f]{1,4}::(?:[\\da-f]{1,4}:){0,5}[\\da-f]{1,4}|::(?:[\\da-f]{1,4}:){0,6}[\\da-f]{1,4}|(?:[\\da-f]{1,4}:){1,7}:)(?:/\\d{1,3})?|<ipv4>(?:/\\d{1,2})?)\\b'.replace(
        /<ipv4>/g,
        function () {
          return '(?:(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d))';
        },
      ),
      'i',
    ),
    alias: 'number',
  },
  path: {
    pattern:
      /(\s)\/(?:[^\/\s]+\/)*[^\/\s]*|\b[a-zA-Z]:\\(?:[^\\\s]+\\)*[^\\\s]*/,
    lookbehind: !0,
    alias: 'string',
  },
  variable: /\$\{?\w+\}?/,
  email: {
    pattern: /[\w-]+@[\w-]+(?:\.[\w-]{2,3}){1,2}/,
    alias: 'string',
  },
  'conditional-configuration': {
    pattern: /@\^?[\w-]+/,
    alias: 'variable',
  },
  operator: /=/,
  property:
    /\b(?:BFD_CHECK|DNS_CHECK|FILE_CHECK|HTTP_GET|MISC_CHECK|NAME|PING_CHECK|SCRIPTS|SMTP_CHECK|SSL|SSL_GET|TCP_CHECK|UDP_CHECK|accept|advert_int|alpha|auth_pass|auth_type|authentication|bfd_cpu_affinity|bfd_instance|bfd_no_swap|bfd_priority|bfd_process_name|bfd_rlimit_rttime|bfd_rt_priority|bind_if|bind_port|bindto|ca|certificate|check_unicast_src|checker|checker_cpu_affinity|checker_log_all_failures|checker_no_swap|checker_priority|checker_rlimit_rttime|checker_rt_priority|child_wait_time|connect_ip|connect_port|connect_timeout|dbus_service_name|debug|default_interface|delay|delay_before_retry|delay_loop|digest|dont_track_primary|dynamic|dynamic_interfaces|enable_(?:dbus|script_security|sni|snmp_checker|snmp_rfc|snmp_rfcv2|snmp_rfcv3|snmp_vrrp|traps)|end|fall|fast_recovery|file|flag-[123]|fork_delay|full_command|fwmark|garp_group|garp_interval|garp_lower_prio_delay|garp_lower_prio_repeat|garp_master_delay|garp_master_refresh|garp_master_refresh_repeat|garp_master_repeat|global_defs|global_tracking|gna_interval|group|ha_suspend|hashed|helo_name|higher_prio_send_advert|hoplimit|http_protocol|hysteresis|idle_tx|include|inhibit_on_failure|init_fail|init_file|instance|interface|interfaces|interval|ip_family|ipvs_process_name|keepalived.conf|kernel_rx_buf_size|key|linkbeat_interfaces|linkbeat_use_polling|log_all_failures|log_unknown_vrids|lower_prio_no_advert|lthreshold|lvs_flush|lvs_flush_onstop|lvs_method|lvs_netlink_cmd_rcv_bufs|lvs_netlink_cmd_rcv_bufs_force|lvs_netlink_monitor_rcv_bufs|lvs_netlink_monitor_rcv_bufs_force|lvs_notify_fifo|lvs_notify_fifo_script|lvs_sched|lvs_sync_daemon|max_auto_priority|max_hops|mcast_src_ip|mh-fallback|mh-port|min_auto_priority_delay|min_rx|min_tx|misc_dynamic|misc_path|misc_timeout|multiplier|name|namespace_with_ipsets|native_ipv6|neighbor_ip|net_namespace|net_namespace_ipvs|nftables|nftables_counters|nftables_ifindex|nftables_priority|no_accept|no_checker_emails|no_email_faults|nopreempt|notification_email|notification_email_from|notify|notify_backup|notify_deleted|notify_down|notify_fault|notify_fifo|notify_fifo_script|notify_master|notify_master_rx_lower_pri|notify_priority_changes|notify_stop|notify_up|old_unicast_checksum|omega|ops|param_match|passive|password|path|persistence_engine|persistence_granularity|persistence_timeout|preempt|preempt_delay|priority|process|process_monitor_rcv_bufs|process_monitor_rcv_bufs_force|process_name|process_names|promote_secondaries|protocol|proxy_arp|proxy_arp_pvlan|quorum|quorum_down|quorum_max|quorum_up|random_seed|real_server|regex|regex_max_offset|regex_min_offset|regex_no_match|regex_options|regex_stack|reload_repeat|reload_time_file|require_reply|retry|rise|router_id|rs_init_notifies|script|script_user|sh-fallback|sh-port|shutdown_script|shutdown_script_timeout|skip_check_adv_addr|smtp_alert|smtp_alert_checker|smtp_alert_vrrp|smtp_connect_timeout|smtp_helo_name|smtp_server|snmp_socket|sorry_server|sorry_server_inhibit|sorry_server_lvs_method|source_ip|start|startup_script|startup_script_timeout|state|static_ipaddress|static_routes|static_rules|status_code|step|strict_mode|sync_group_tracking_weight|terminate_delay|timeout|track_bfd|track_file|track_group|track_interface|track_process|track_script|track_src_ip|ttl|type|umask|unicast_peer|unicast_src_ip|unicast_ttl|url|use_ipvlan|use_pid_dir|use_vmac|user|uthreshold|val[123]|version|virtual_ipaddress|virtual_ipaddress_excluded|virtual_router_id|virtual_routes|virtual_rules|virtual_server|virtual_server_group|virtualhost|vmac_xmit_base|vrrp|vrrp_(?:check_unicast_src|cpu_affinity|garp_interval|garp_lower_prio_delay|garp_lower_prio_repeat|garp_master_delay|garp_master_refresh|garp_master_refresh_repeat|garp_master_repeat|gna_interval|higher_prio_send_advert|instance|ipsets|iptables|lower_prio_no_advert|mcast_group4|mcast_group6|min_garp|netlink_cmd_rcv_bufs|netlink_cmd_rcv_bufs_force|netlink_monitor_rcv_bufs|netlink_monitor_rcv_bufs_force|no_swap|notify_fifo|notify_fifo_script|notify_priority_changes|priority|process_name|rlimit_rttime|rt_priority|rx_bufs_multiplier|rx_bufs_policy|script|skip_check_adv_addr|startup_delay|strict|sync_group|track_process|version)|warmup|weight)\b/,
  constant:
    /\b(?:A|AAAA|AH|BACKUP|CNAME|DR|MASTER|MX|NAT|NS|PASS|SCTP|SOA|TCP|TUN|TXT|UDP|dh|fo|lblc|lblcr|lc|mh|nq|ovf|rr|sed|sh|wlc|wrr)\b/,
  number: {
    pattern: /(^|[^\w.-])-?\d+(?:\.\d+)?/,
    lookbehind: !0,
  },
  boolean: /\b(?:false|no|off|on|true|yes)\b/,
  punctuation: /[\{\}]/,
};
Prism.languages.keyman = {
  comment: {
    pattern: /\bc .*/i,
    greedy: !0,
  },
  string: {
    pattern: /"[^"\r\n]*"|'[^'\r\n]*'/,
    greedy: !0,
  },
  'virtual-key': {
    pattern:
      /\[\s*(?:(?:ALT|CAPS|CTRL|LALT|LCTRL|NCAPS|RALT|RCTRL|SHIFT)\s+)*(?:[TKU]_[\w?]+|[A-E]\d\d?|"[^"\r\n]*"|'[^'\r\n]*')\s*\]/i,
    greedy: !0,
    alias: 'function',
  },
  'header-keyword': {
    pattern: /&\w+/,
    alias: 'bold',
  },
  'header-statement': {
    pattern:
      /\b(?:bitmap|bitmaps|caps always off|caps on only|copyright|hotkey|language|layout|message|name|shift frees caps|version)\b/i,
    alias: 'bold',
  },
  'rule-keyword': {
    pattern:
      /\b(?:any|baselayout|beep|call|context|deadkey|dk|if|index|layer|notany|nul|outs|platform|reset|return|save|set|store|use)\b/i,
    alias: 'keyword',
  },
  'structural-keyword': {
    pattern:
      /\b(?:ansi|begin|group|match|newcontext|nomatch|postkeystroke|readonly|unicode|using keys)\b/i,
    alias: 'keyword',
  },
  'compile-target': {
    pattern: /\$(?:keyman|keymanonly|keymanweb|kmfl|weaver):/i,
    alias: 'property',
  },
  number: /\b(?:U\+[\dA-F]+|d\d+|x[\da-f]+|\d+)\b/i,
  operator: /[+>\\$]|\.\./,
  punctuation: /[()=,]/,
};
!(function (n) {
  (n.languages.kotlin = n.languages.extend('clike', {
    keyword: {
      pattern:
        /(^|[^.])\b(?:abstract|actual|annotation|as|break|by|catch|class|companion|const|constructor|continue|crossinline|data|do|dynamic|else|enum|expect|external|final|finally|for|fun|get|if|import|in|infix|init|inline|inner|interface|internal|is|lateinit|noinline|null|object|open|operator|out|override|package|private|protected|public|reified|return|sealed|set|super|suspend|tailrec|this|throw|to|try|typealias|val|var|vararg|when|where|while)\b/,
      lookbehind: !0,
    },
    function: [
      {
        pattern: /(?:`[^\r\n`]+`|\b\w+)(?=\s*\()/,
        greedy: !0,
      },
      {
        pattern: /(\.)(?:`[^\r\n`]+`|\w+)(?=\s*\{)/,
        lookbehind: !0,
        greedy: !0,
      },
    ],
    number:
      /\b(?:0[xX][\da-fA-F]+(?:_[\da-fA-F]+)*|0[bB][01]+(?:_[01]+)*|\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[eE][+-]?\d+(?:_\d+)*)?[fFL]?)\b/,
    operator:
      /\+[+=]?|-[-=>]?|==?=?|!(?:!|==?)?|[\/*%<>]=?|[?:]:?|\.\.|&&|\|\||\b(?:and|inv|or|shl|shr|ushr|xor)\b/,
  })),
    delete n.languages.kotlin['class-name'];
  var e = {
    'interpolation-punctuation': {
      pattern: /^\$\{?|\}$/,
      alias: 'punctuation',
    },
    expression: {
      pattern: /[\s\S]+/,
      inside: n.languages.kotlin,
    },
  };
  n.languages.insertBefore('kotlin', 'string', {
    'string-literal': [
      {
        pattern: /"""(?:[^$]|\$(?:(?!\{)|\{[^{}]*\}))*?"""/,
        alias: 'multiline',
        inside: {
          interpolation: {
            pattern: /\$(?:[a-z_]\w*|\{[^{}]*\})/i,
            inside: e,
          },
          string: /[\s\S]+/,
        },
      },
      {
        pattern: /"(?:[^"\\\r\n$]|\\.|\$(?:(?!\{)|\{[^{}]*\}))*"/,
        alias: 'singleline',
        inside: {
          interpolation: {
            pattern: /((?:^|[^\\])(?:\\{2})*)\$(?:[a-z_]\w*|\{[^{}]*\})/i,
            lookbehind: !0,
            inside: e,
          },
          string: /[\s\S]+/,
        },
      },
    ],
    char: {
      pattern: /'(?:[^'\\\r\n]|\\(?:.|u[a-fA-F0-9]{0,4}))'/,
      greedy: !0,
    },
  }),
    delete n.languages.kotlin.string,
    n.languages.insertBefore('kotlin', 'keyword', {
      annotation: {
        pattern: /\B@(?:\w+:)?(?:[A-Z]\w*|\[[^\]]+\])/,
        alias: 'builtin',
      },
    }),
    n.languages.insertBefore('kotlin', 'function', {
      label: {
        pattern: /\b\w+@|@\w+\b/,
        alias: 'symbol',
      },
    }),
    (n.languages.kt = n.languages.kotlin),
    (n.languages.kts = n.languages.kotlin);
})(Prism);
!(function (a) {
  var e = /\\(?:[^a-z()[\]]|[a-z*]+)/i,
    n = {
      'equation-command': {
        pattern: e,
        alias: 'regex',
      },
    };
  (a.languages.latex = {
    comment: /%.*/,
    cdata: {
      pattern:
        /(\\begin\{((?:lstlisting|verbatim)\*?)\})[\s\S]*?(?=\\end\{\2\})/,
      lookbehind: !0,
    },
    equation: [
      {
        pattern:
          /\$\$(?:\\[\s\S]|[^\\$])+\$\$|\$(?:\\[\s\S]|[^\\$])+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/,
        inside: n,
        alias: 'string',
      },
      {
        pattern:
          /(\\begin\{((?:align|eqnarray|equation|gather|math|multline)\*?)\})[\s\S]*?(?=\\end\{\2\})/,
        lookbehind: !0,
        inside: n,
        alias: 'string',
      },
    ],
    keyword: {
      pattern:
        /(\\(?:begin|cite|documentclass|end|label|ref|usepackage)(?:\[[^\]]+\])?\{)[^}]+(?=\})/,
      lookbehind: !0,
    },
    url: {
      pattern: /(\\url\{)[^}]+(?=\})/,
      lookbehind: !0,
    },
    headline: {
      pattern:
        /(\\(?:chapter|frametitle|paragraph|part|section|subparagraph|subsection|subsubparagraph|subsubsection|subsubsubparagraph)\*?(?:\[[^\]]+\])?\{)[^}]+(?=\})/,
      lookbehind: !0,
      alias: 'class-name',
    },
    function: {
      pattern: e,
      alias: 'selector',
    },
    punctuation: /[[\]{}&]/,
  }),
    (a.languages.tex = a.languages.latex),
    (a.languages.context = a.languages.latex);
})(Prism);
!(function (a) {
  a.languages.latte = {
    comment: /^\{\*[\s\S]*/,
    'latte-tag': {
      pattern: /(^\{(?:\/(?=[a-z]))?)(?:[=_]|[a-z]\w*\b(?!\())/i,
      lookbehind: !0,
      alias: 'important',
    },
    delimiter: {
      pattern: /^\{\/?|\}$/,
      alias: 'punctuation',
    },
    php: {
      pattern: /\S(?:[\s\S]*\S)?/,
      alias: 'language-php',
      inside: a.languages.php,
    },
  };
  var t = a.languages.extend('markup', {});
  a.languages.insertBefore(
    'inside',
    'attr-value',
    {
      'n-attr': {
        pattern: /n:[\w-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+))?/,
        inside: {
          'attr-name': {
            pattern: /^[^\s=]+/,
            alias: 'important',
          },
          'attr-value': {
            pattern: /=[\s\S]+/,
            inside: {
              punctuation: [
                /^=/,
                {
                  pattern: /^(\s*)["']|["']$/,
                  lookbehind: !0,
                },
              ],
              php: {
                pattern: /\S(?:[\s\S]*\S)?/,
                inside: a.languages.php,
              },
            },
          },
        },
      },
    },
    t.tag,
  ),
    a.hooks.add('before-tokenize', function (e) {
      'latte' === e.language &&
        (a.languages['markup-templating'].buildPlaceholders(
          e,
          'latte',
          /\{\*[\s\S]*?\*\}|\{[^'"\s{}*](?:[^"'/{}]|\/(?![*/])|("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|\/\*(?:[^*]|\*(?!\/))*\*\/)*\}/g,
        ),
        (e.grammar = t));
    }),
    a.hooks.add('after-tokenize', function (t) {
      a.languages['markup-templating'].tokenizePlaceholders(t, 'latte');
    });
})(Prism);
!(function (e) {
  function n(e) {
    return RegExp('(\\()(?:' + e + ')(?=[\\s\\)])');
  }
  function a(e) {
    return RegExp('([\\s([])(?:' + e + ')(?=[\\s)])');
  }
  var t = '(?!\\d)[-+*/~!@$%^=<>{}\\w]+',
    r = '(\\()',
    i =
      '(?:[^()]|\\((?:[^()]|\\((?:[^()]|\\((?:[^()]|\\((?:[^()]|\\([^()]*\\))*\\))*\\))*\\))*\\))*',
    s = {
      heading: {
        pattern: /;;;.*/,
        alias: ['comment', 'title'],
      },
      comment: /;.*/,
      string: {
        pattern: /"(?:[^"\\]|\\.)*"/,
        greedy: !0,
        inside: {
          argument: /[-A-Z]+(?=[.,\s])/,
          symbol: RegExp('`' + t + "'"),
        },
      },
      'quoted-symbol': {
        pattern: RegExp("#?'" + t),
        alias: ['variable', 'symbol'],
      },
      'lisp-property': {
        pattern: RegExp(':' + t),
        alias: 'property',
      },
      splice: {
        pattern: RegExp(',@?' + t),
        alias: ['symbol', 'variable'],
      },
      keyword: [
        {
          pattern: RegExp(
            '(\\()(?:and|(?:cl-)?letf|cl-loop|cond|cons|error|if|(?:lexical-)?let\\*?|message|not|null|or|provide|require|setq|unless|use-package|when|while)(?=\\s)',
          ),
          lookbehind: !0,
        },
        {
          pattern: RegExp(
            '(\\()(?:append|by|collect|concat|do|finally|for|in|return)(?=\\s)',
          ),
          lookbehind: !0,
        },
      ],
      declare: {
        pattern: n('declare'),
        lookbehind: !0,
        alias: 'keyword',
      },
      interactive: {
        pattern: n('interactive'),
        lookbehind: !0,
        alias: 'keyword',
      },
      boolean: {
        pattern: a('nil|t'),
        lookbehind: !0,
      },
      number: {
        pattern: a('[-+]?\\d+(?:\\.\\d*)?'),
        lookbehind: !0,
      },
      defvar: {
        pattern: RegExp('(\\()def(?:const|custom|group|var)\\s+' + t),
        lookbehind: !0,
        inside: {
          keyword: /^def[a-z]+/,
          variable: RegExp(t),
        },
      },
      defun: {
        pattern: RegExp(
          '(\\()(?:cl-)?(?:defmacro|defun\\*?)\\s+' + t + '\\s+\\(' + i + '\\)',
        ),
        lookbehind: !0,
        greedy: !0,
        inside: {
          keyword: /^(?:cl-)?def\S+/,
          arguments: null,
          function: {
            pattern: RegExp('(^\\s)' + t),
            lookbehind: !0,
          },
          punctuation: /[()]/,
        },
      },
      lambda: {
        pattern: RegExp(
          '(\\()lambda\\s+\\(\\s*(?:&?' + t + '(?:\\s+&?' + t + ')*\\s*)?\\)',
        ),
        lookbehind: !0,
        greedy: !0,
        inside: {
          keyword: /^lambda/,
          arguments: null,
          punctuation: /[()]/,
        },
      },
      car: {
        pattern: RegExp(r + t),
        lookbehind: !0,
      },
      punctuation: [
        /(?:['`,]?\(|[)\[\]])/,
        {
          pattern: /(\s)\.(?=\s)/,
          lookbehind: !0,
        },
      ],
    },
    l = {
      'lisp-marker': RegExp('&(?!\\d)[-+*/~!@$%^=<>{}\\w]+'),
      varform: {
        pattern: RegExp('\\(' + t + '\\s+(?=\\S)' + i + '\\)'),
        inside: s,
      },
      argument: {
        pattern: RegExp('(^|[\\s(])' + t),
        lookbehind: !0,
        alias: 'variable',
      },
      rest: s,
    },
    o = '\\S+(?:\\s+\\S+)*',
    p = {
      pattern: RegExp(r + i + '(?=\\))'),
      lookbehind: !0,
      inside: {
        'rest-vars': {
          pattern: RegExp('&(?:body|rest)\\s+' + o),
          inside: l,
        },
        'other-marker-vars': {
          pattern: RegExp('&(?:aux|optional)\\s+' + o),
          inside: l,
        },
        keys: {
          pattern: RegExp('&key\\s+' + o + '(?:\\s+&allow-other-keys)?'),
          inside: l,
        },
        argument: {
          pattern: RegExp(t),
          alias: 'variable',
        },
        punctuation: /[()]/,
      },
    };
  (s.lambda.inside.arguments = p),
    (s.defun.inside.arguments = e.util.clone(p)),
    (s.defun.inside.arguments.inside.sublist = p),
    (e.languages.lisp = s),
    (e.languages.elisp = s),
    (e.languages.emacs = s),
    (e.languages['emacs-lisp'] = s);
})(Prism);
(Prism.languages.livescript = {
  comment: [
    {
      pattern: /(^|[^\\])\/\*[\s\S]*?\*\//,
      lookbehind: !0,
    },
    {
      pattern: /(^|[^\\])#.*/,
      lookbehind: !0,
    },
  ],
  'interpolated-string': {
    pattern: /(^|[^"])("""|")(?:\\[\s\S]|(?!\2)[^\\])*\2(?!")/,
    lookbehind: !0,
    greedy: !0,
    inside: {
      variable: {
        pattern: /(^|[^\\])#[a-z_](?:-?[a-z]|[\d_])*/m,
        lookbehind: !0,
      },
      interpolation: {
        pattern: /(^|[^\\])#\{[^}]+\}/m,
        lookbehind: !0,
        inside: {
          'interpolation-punctuation': {
            pattern: /^#\{|\}$/,
            alias: 'variable',
          },
        },
      },
      string: /[\s\S]+/,
    },
  },
  string: [
    {
      pattern: /('''|')(?:\\[\s\S]|(?!\1)[^\\])*\1/,
      greedy: !0,
    },
    {
      pattern: /<\[[\s\S]*?\]>/,
      greedy: !0,
    },
    /\\[^\s,;\])}]+/,
  ],
  regex: [
    {
      pattern: /\/\/(?:\[[^\r\n\]]*\]|\\.|(?!\/\/)[^\\\[])+\/\/[gimyu]{0,5}/,
      greedy: !0,
      inside: {
        comment: {
          pattern: /(^|[^\\])#.*/,
          lookbehind: !0,
        },
      },
    },
    {
      pattern: /\/(?:\[[^\r\n\]]*\]|\\.|[^/\\\r\n\[])+\/[gimyu]{0,5}/,
      greedy: !0,
    },
  ],
  keyword: {
    pattern:
      /(^|(?!-).)\b(?:break|case|catch|class|const|continue|default|do|else|extends|fallthrough|finally|for(?: ever)?|function|if|implements|it|let|loop|new|null|otherwise|own|return|super|switch|that|then|this|throw|try|unless|until|var|void|when|while|yield)(?!-)\b/m,
    lookbehind: !0,
  },
  'keyword-operator': {
    pattern:
      /(^|[^-])\b(?:(?:delete|require|typeof)!|(?:and|by|delete|export|from|import(?: all)?|in|instanceof|is(?: not|nt)?|not|of|or|til|to|typeof|with|xor)(?!-)\b)/m,
    lookbehind: !0,
    alias: 'operator',
  },
  boolean: {
    pattern: /(^|[^-])\b(?:false|no|off|on|true|yes)(?!-)\b/m,
    lookbehind: !0,
  },
  argument: {
    pattern: /(^|(?!\.&\.)[^&])&(?!&)\d*/m,
    lookbehind: !0,
    alias: 'variable',
  },
  number: /\b(?:\d+~[\da-z]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[a-z]\w*)?)/i,
  identifier: /[a-z_](?:-?[a-z]|[\d_])*/i,
  operator: [
    {
      pattern: /( )\.(?= )/,
      lookbehind: !0,
    },
    /\.(?:[=~]|\.\.?)|\.(?:[&|^]|<<|>>>?)\.|:(?:=|:=?)|&&|\|[|>]|<(?:<<?<?|--?!?|~~?!?|[|=?])?|>[>=?]?|-(?:->?|>)?|\+\+?|@@?|%%?|\*\*?|!(?:~?=|--?>|~?~>)?|~(?:~?>|=)?|==?|\^\^?|[\/?]/,
  ],
  punctuation: /[(){}\[\]|.,:;`]/,
}),
  (Prism.languages.livescript[
    'interpolated-string'
  ].inside.interpolation.inside.rest = Prism.languages.livescript);
!(function (a) {
  a.languages.llvm = {
    comment: /;.*/,
    string: {
      pattern: /"[^"]*"/,
      greedy: !0,
    },
    boolean: /\b(?:false|true)\b/,
    variable: /[%@!#](?:(?!\d)(?:[-$.\w]|\\[a-f\d]{2})+|\d+)/i,
    label: /(?!\d)(?:[-$.\w]|\\[a-f\d]{2})+:/i,
    type: {
      pattern:
        /\b(?:double|float|fp128|half|i[1-9]\d*|label|metadata|ppc_fp128|token|void|x86_fp80|x86_mmx)\b/,
      alias: 'class-name',
    },
    keyword: /\b[a-z_][a-z_0-9]*\b/,
    number:
      /[+-]?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b0x[\dA-Fa-f]+\b|\b0xK[\dA-Fa-f]{20}\b|\b0x[ML][\dA-Fa-f]{32}\b|\b0xH[\dA-Fa-f]{4}\b/,
    punctuation: /[{}[\];(),.!*=<>]/,
  };
})(Prism);
Prism.languages.log = {
  string: {
    pattern: /"(?:[^"\\\r\n]|\\.)*"|'(?![st] | \w)(?:[^'\\\r\n]|\\.)*'/,
    greedy: !0,
  },
  exception: {
    pattern:
      /(^|[^\w.])[a-z][\w.]*(?:Error|Exception):.*(?:(?:\r\n?|\n)[ \t]*(?:at[ \t].+|\.{3}.*|Caused by:.*))+(?:(?:\r\n?|\n)[ \t]*\.\.\. .*)?/,
    lookbehind: !0,
    greedy: !0,
    alias: ['javastacktrace', 'language-javastacktrace'],
    inside: Prism.languages.javastacktrace || {
      keyword: /\bat\b/,
      function: /[a-z_][\w$]*(?=\()/,
      punctuation: /[.:()]/,
    },
  },
  level: [
    {
      pattern:
        /\b(?:ALERT|CRIT|CRITICAL|EMERG|EMERGENCY|ERR|ERROR|FAILURE|FATAL|SEVERE)\b/,
      alias: ['error', 'important'],
    },
    {
      pattern: /\b(?:WARN|WARNING|WRN)\b/,
      alias: ['warning', 'important'],
    },
    {
      pattern: /\b(?:DISPLAY|INF|INFO|NOTICE|STATUS)\b/,
      alias: ['info', 'keyword'],
    },
    {
      pattern: /\b(?:DBG|DEBUG|FINE)\b/,
      alias: ['debug', 'keyword'],
    },
    {
      pattern: /\b(?:FINER|FINEST|TRACE|TRC|VERBOSE|VRB)\b/,
      alias: ['trace', 'comment'],
    },
  ],
  property: {
    pattern:
      /((?:^|[\]|])[ \t]*)[a-z_](?:[\w-]|\b\/\b)*(?:[. ]\(?\w(?:[\w-]|\b\/\b)*\)?)*:(?=\s)/im,
    lookbehind: !0,
  },
  separator: {
    pattern: /(^|[^-+])-{3,}|={3,}|\*{3,}|- - /m,
    lookbehind: !0,
    alias: 'comment',
  },
  url: /\b(?:file|ftp|https?):\/\/[^\s|,;'"]*[^\s|,;'">.]/,
  email: {
    pattern: /(^|\s)[-\w+.]+@[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+(?=\s)/,
    lookbehind: !0,
    alias: 'url',
  },
  'ip-address': {
    pattern: /\b(?:\d{1,3}(?:\.\d{1,3}){3})\b/,
    alias: 'constant',
  },
  'mac-address': {
    pattern: /\b[a-f0-9]{2}(?::[a-f0-9]{2}){5}\b/i,
    alias: 'constant',
  },
  domain: {
    pattern:
      /(^|\s)[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*\.[a-z][a-z0-9-]+(?=\s)/,
    lookbehind: !0,
    alias: 'constant',
  },
  uuid: {
    pattern:
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
    alias: 'constant',
  },
  hash: {
    pattern: /\b(?:[a-f0-9]{32}){1,2}\b/i,
    alias: 'constant',
  },
  'file-path': {
    pattern:
      /\b[a-z]:[\\/][^\s|,;:(){}\[\]"']+|(^|[\s:\[\](>|])\.{0,2}\/\w[^\s|,;:(){}\[\]"']*/i,
    lookbehind: !0,
    greedy: !0,
    alias: 'string',
  },
  date: {
    pattern: RegExp(
      '\\b\\d{4}[-/]\\d{2}[-/]\\d{2}(?:T(?=\\d{1,2}:)|(?=\\s\\d{1,2}:))|\\b\\d{1,4}[-/ ](?:\\d{1,2}|Apr|Aug|Dec|Feb|Jan|Jul|Jun|Mar|May|Nov|Oct|Sep)[-/ ]\\d{2,4}T?\\b|\\b(?:(?:Fri|Mon|Sat|Sun|Thu|Tue|Wed)(?:\\s{1,2}(?:Apr|Aug|Dec|Feb|Jan|Jul|Jun|Mar|May|Nov|Oct|Sep))?|Apr|Aug|Dec|Feb|Jan|Jul|Jun|Mar|May|Nov|Oct|Sep)\\s{1,2}\\d{1,2}\\b',
      'i',
    ),
    alias: 'number',
  },
  time: {
    pattern:
      /\b\d{1,2}:\d{1,2}:\d{1,2}(?:[.,:]\d+)?(?:\s?[+-]\d{2}:?\d{2}|Z)?\b/,
    alias: 'number',
  },
  boolean: /\b(?:false|null|true)\b/i,
  number: {
    pattern:
      /(^|[^.\w])(?:0x[a-f0-9]+|0o[0-7]+|0b[01]+|v?\d[\da-f]*(?:\.\d+)*(?:e[+-]?\d+)?[a-z]{0,3}\b)\b(?!\.\w)/i,
    lookbehind: !0,
  },
  operator: /[;:?<=>~/@!$%&+\-|^(){}*#]/,
  punctuation: /[\[\].,]/,
};
Prism.languages.lua = {
  comment: /^#!.+|--(?:\[(=*)\[[\s\S]*?\]\1\]|.*)/m,
  string: {
    pattern:
      /(["'])(?:(?!\1)[^\\\r\n]|\\z(?:\r\n|\s)|\\(?:\r\n|[^z]))*\1|\[(=*)\[[\s\S]*?\]\2\]/,
    greedy: !0,
  },
  number:
    /\b0x[a-f\d]+(?:\.[a-f\d]*)?(?:p[+-]?\d+)?\b|\b\d+(?:\.\B|(?:\.\d*)?(?:e[+-]?\d+)?\b)|\B\.\d+(?:e[+-]?\d+)?\b/i,
  keyword:
    /\b(?:and|break|do|else|elseif|end|false|for|function|goto|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/,
  function: /(?!\d)\w+(?=\s*(?:[({]))/,
  operator: [
    /[-+*%^&|#]|\/\/?|<[<=]?|>[>=]?|[=~]=?/,
    {
      pattern: /(^|[^.])\.\.(?!\.)/,
      lookbehind: !0,
    },
  ],
  punctuation: /[\[\](){},;]|\.+|:+/,
};
Prism.languages.makefile = {
  comment: {
    pattern: /(^|[^\\])#(?:\\(?:\r\n|[\s\S])|[^\\\r\n])*/,
    lookbehind: !0,
  },
  string: {
    pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: !0,
  },
  'builtin-target': {
    pattern: /\.[A-Z][^:#=\s]+(?=\s*:(?!=))/,
    alias: 'builtin',
  },
  target: {
    pattern: /^(?:[^:=\s]|[ \t]+(?![\s:]))+(?=\s*:(?!=))/m,
    alias: 'symbol',
    inside: {
      variable: /\$+(?:(?!\$)[^(){}:#=\s]+|(?=[({]))/,
    },
  },
  variable: /\$+(?:(?!\$)[^(){}:#=\s]+|\([@*%<^+?][DF]\)|(?=[({]))/,
  keyword:
    /-include\b|\b(?:define|else|endef|endif|export|ifn?def|ifn?eq|include|override|private|sinclude|undefine|unexport|vpath)\b/,
  function: {
    pattern:
      /(\()(?:abspath|addsuffix|and|basename|call|dir|error|eval|file|filter(?:-out)?|findstring|firstword|flavor|foreach|guile|if|info|join|lastword|load|notdir|or|origin|patsubst|realpath|shell|sort|strip|subst|suffix|value|warning|wildcard|word(?:list|s)?)(?=[ \t])/,
    lookbehind: !0,
  },
  operator: /(?:::|[?:+!])?=|[|@]/,
  punctuation: /[:;(){}]/,
};
!(function (n) {
  function e(n) {
    return (
      (n = n.replace(/<inner>/g, function () {
        return '(?:\\\\.|[^\\\\\n\r]|(?:\n|\r\n?)(?![\r\n]))';
      })),
      RegExp('((?:^|[^\\\\])(?:\\\\{2})*)(?:' + n + ')')
    );
  }
  var t = '(?:\\\\.|``(?:[^`\r\n]|`(?!`))+``|`[^`\r\n]+`|[^\\\\|\r\n`])+',
    a = '\\|?__(?:\\|__)+\\|?(?:(?:\n|\r\n?)|(?![^]))'.replace(
      /__/g,
      function () {
        return t;
      },
    ),
    i =
      '\\|?[ \t]*:?-{3,}:?[ \t]*(?:\\|[ \t]*:?-{3,}:?[ \t]*)+\\|?(?:\n|\r\n?)';
  (n.languages.markdown = n.languages.extend('markup', {})),
    n.languages.insertBefore('markdown', 'prolog', {
      'front-matter-block': {
        pattern: /(^(?:\s*[\r\n])?)---(?!.)[\s\S]*?[\r\n]---(?!.)/,
        lookbehind: !0,
        greedy: !0,
        inside: {
          punctuation: /^---|---$/,
          'front-matter': {
            pattern: /\S+(?:\s+\S+)*/,
            alias: ['yaml', 'language-yaml'],
            inside: n.languages.yaml,
          },
        },
      },
      blockquote: {
        pattern: /^>(?:[\t ]*>)*/m,
        alias: 'punctuation',
      },
      table: {
        pattern: RegExp('^' + a + i + '(?:' + a + ')*', 'm'),
        inside: {
          'table-data-rows': {
            pattern: RegExp('^(' + a + i + ')(?:' + a + ')*$'),
            lookbehind: !0,
            inside: {
              'table-data': {
                pattern: RegExp(t),
                inside: n.languages.markdown,
              },
              punctuation: /\|/,
            },
          },
          'table-line': {
            pattern: RegExp('^(' + a + ')' + i + '$'),
            lookbehind: !0,
            inside: {
              punctuation: /\||:?-{3,}:?/,
            },
          },
          'table-header-row': {
            pattern: RegExp('^' + a + '$'),
            inside: {
              'table-header': {
                pattern: RegExp(t),
                alias: 'important',
                inside: n.languages.markdown,
              },
              punctuation: /\|/,
            },
          },
        },
      },
      code: [
        {
          pattern:
            /((?:^|\n)[ \t]*\n|(?:^|\r\n?)[ \t]*\r\n?)(?: {4}|\t).+(?:(?:\n|\r\n?)(?: {4}|\t).+)*/,
          lookbehind: !0,
          alias: 'keyword',
        },
        {
          pattern: /^```[\s\S]*?^```$/m,
          greedy: !0,
          inside: {
            'code-block': {
              pattern: /^(```.*(?:\n|\r\n?))[\s\S]+?(?=(?:\n|\r\n?)^```$)/m,
              lookbehind: !0,
            },
            'code-language': {
              pattern: /^(```).+/,
              lookbehind: !0,
            },
            punctuation: /```/,
          },
        },
      ],
      title: [
        {
          pattern: /\S.*(?:\n|\r\n?)(?:==+|--+)(?=[ \t]*$)/m,
          alias: 'important',
          inside: {
            punctuation: /==+$|--+$/,
          },
        },
        {
          pattern: /(^\s*)#.+/m,
          lookbehind: !0,
          alias: 'important',
          inside: {
            punctuation: /^#+|#+$/,
          },
        },
      ],
      hr: {
        pattern: /(^\s*)([*-])(?:[\t ]*\2){2,}(?=\s*$)/m,
        lookbehind: !0,
        alias: 'punctuation',
      },
      list: {
        pattern: /(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m,
        lookbehind: !0,
        alias: 'punctuation',
      },
      'url-reference': {
        pattern:
          /!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,
        inside: {
          variable: {
            pattern: /^(!?\[)[^\]]+/,
            lookbehind: !0,
          },
          string:
            /(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/,
          punctuation: /^[\[\]!:]|[<>]/,
        },
        alias: 'url',
      },
      bold: {
        pattern: e(
          '\\b__(?:(?!_)<inner>|_(?:(?!_)<inner>)+_)+__\\b|\\*\\*(?:(?!\\*)<inner>|\\*(?:(?!\\*)<inner>)+\\*)+\\*\\*',
        ),
        lookbehind: !0,
        greedy: !0,
        inside: {
          content: {
            pattern: /(^..)[\s\S]+(?=..$)/,
            lookbehind: !0,
            inside: {},
          },
          punctuation: /\*\*|__/,
        },
      },
      italic: {
        pattern: e(
          '\\b_(?:(?!_)<inner>|__(?:(?!_)<inner>)+__)+_\\b|\\*(?:(?!\\*)<inner>|\\*\\*(?:(?!\\*)<inner>)+\\*\\*)+\\*',
        ),
        lookbehind: !0,
        greedy: !0,
        inside: {
          content: {
            pattern: /(^.)[\s\S]+(?=.$)/,
            lookbehind: !0,
            inside: {},
          },
          punctuation: /[*_]/,
        },
      },
      strike: {
        pattern: e('(~~?)(?:(?!~)<inner>)+\\2'),
        lookbehind: !0,
        greedy: !0,
        inside: {
          content: {
            pattern: /(^~~?)[\s\S]+(?=\1$)/,
            lookbehind: !0,
            inside: {},
          },
          punctuation: /~~?/,
        },
      },
      'code-snippet': {
        pattern:
          /(^|[^\\`])(?:``[^`\r\n]+(?:`[^`\r\n]+)*``(?!`)|`[^`\r\n]+`(?!`))/,
        lookbehind: !0,
        greedy: !0,
        alias: ['code', 'keyword'],
      },
      url: {
        pattern: e(
          '!?\\[(?:(?!\\])<inner>)+\\](?:\\([^\\s)]+(?:[\t ]+"(?:\\\\.|[^"\\\\])*")?\\)|[ \t]?\\[(?:(?!\\])<inner>)+\\])',
        ),
        lookbehind: !0,
        greedy: !0,
        inside: {
          operator: /^!/,
          content: {
            pattern: /(^\[)[^\]]+(?=\])/,
            lookbehind: !0,
            inside: {},
          },
          variable: {
            pattern: /(^\][ \t]?\[)[^\]]+(?=\]$)/,
            lookbehind: !0,
          },
          url: {
            pattern: /(^\]\()[^\s)]+/,
            lookbehind: !0,
          },
          string: {
            pattern: /(^[ \t]+)"(?:\\.|[^"\\])*"(?=\)$)/,
            lookbehind: !0,
          },
        },
      },
    }),
    ['url', 'bold', 'italic', 'strike'].forEach(function (e) {
      ['url', 'bold', 'italic', 'strike', 'code-snippet'].forEach(function (t) {
        e !== t &&
          (n.languages.markdown[e].inside.content.inside[t] =
            n.languages.markdown[t]);
      });
    }),
    n.hooks.add('after-tokenize', function (n) {
      ('markdown' !== n.language && 'md' !== n.language) ||
        (function n(e) {
          if (e && 'string' != typeof e)
            for (var t = 0, a = e.length; t < a; t++) {
              var i = e[t];
              if ('code' === i.type) {
                var r = i.content[1],
                  o = i.content[3];
                if (
                  r &&
                  o &&
                  'code-language' === r.type &&
                  'code-block' === o.type &&
                  'string' == typeof r.content
                ) {
                  var l = r.content
                      .replace(/\b#/g, 'sharp')
                      .replace(/\b\+\+/g, 'pp'),
                    s =
                      'language-' +
                      (l = (/[a-z][\w-]*/i.exec(l) || [''])[0].toLowerCase());
                  o.alias
                    ? 'string' == typeof o.alias
                      ? (o.alias = [o.alias, s])
                      : o.alias.push(s)
                    : (o.alias = [s]);
                }
              } else n(i.content);
            }
        })(n.tokens);
    }),
    n.hooks.add('wrap', function (e) {
      if ('code-block' === e.type) {
        for (var t = '', a = 0, i = e.classes.length; a < i; a++) {
          var s = e.classes[a],
            d = /language-(.+)/.exec(s);
          if (d) {
            t = d[1];
            break;
          }
        }
        var p = n.languages[t];
        if (p)
          e.content = n.highlight(
            e.content
              .replace(r, '')
              .replace(/&(\w{1,8}|#x?[\da-f]{1,8});/gi, function (n, e) {
                var t;
                return '#' === (e = e.toLowerCase())[0]
                  ? ((t =
                      'x' === e[1]
                        ? parseInt(e.slice(2), 16)
                        : Number(e.slice(1))),
                    l(t))
                  : o[e] || n;
              }),
            p,
            t,
          );
        else if (t && 'none' !== t && n.plugins.autoloader) {
          var u =
            'md-' +
            new Date().valueOf() +
            '-' +
            Math.floor(1e16 * Math.random());
          (e.attributes.id = u),
            n.plugins.autoloader.loadLanguages(t, function () {
              var e = document.getElementById(u);
              e &&
                (e.innerHTML = n.highlight(e.textContent, n.languages[t], t));
            });
        }
      }
    });
  var r = RegExp(n.languages.markup.tag.pattern.source, 'gi'),
    o = {
      amp: '&',
      lt: '<',
      gt: '>',
      quot: '"',
    },
    l = String.fromCodePoint || String.fromCharCode;
  n.languages.md = n.languages.markdown;
})(Prism);
Prism.languages.matlab = {
  comment: [/%\{[\s\S]*?\}%/, /%.+/],
  string: {
    pattern: /\B'(?:''|[^'\r\n])*'/,
    greedy: !0,
  },
  number: /(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:[eE][+-]?\d+)?(?:[ij])?|\b[ij]\b/,
  keyword:
    /\b(?:NaN|break|case|catch|continue|else|elseif|end|for|function|if|inf|otherwise|parfor|pause|pi|return|switch|try|while)\b/,
  function: /\b(?!\d)\w+(?=\s*\()/,
  operator: /\.?[*^\/\\']|[+\-:@]|[<>=~]=?|&&?|\|\|?/,
  punctuation: /\.{3}|[.,;\[\](){}!]/,
};
!(function (t) {
  var e =
    /\b(?:about|and|animate|as|at|attributes|by|case|catch|collect|continue|coordsys|do|else|exit|fn|for|from|function|global|if|in|local|macroscript|mapped|max|not|of|off|on|or|parameters|persistent|plugin|rcmenu|return|rollout|set|struct|then|throw|to|tool|try|undo|utility|when|where|while|with)\b/i;
  t.languages.maxscript = {
    comment: {
      pattern: /\/\*[\s\S]*?(?:\*\/|$)|--.*/,
      greedy: !0,
    },
    string: {
      pattern: /(^|[^"\\@])(?:"(?:[^"\\]|\\[\s\S])*"|@"[^"]*")/,
      lookbehind: !0,
      greedy: !0,
    },
    path: {
      pattern: /\$(?:[\w/\\.*?]|'[^']*')*/,
      greedy: !0,
      alias: 'string',
    },
    'function-call': {
      pattern: RegExp(
        '((?:^|[;=<>+\\-*/^({\\[]|\\b(?:and|by|case|catch|collect|do|else|if|in|not|or|return|then|to|try|where|while|with)\\b)[ \t]*)(?!' +
          e.source +
          ')[a-z_]\\w*\\b(?=[ \t]*(?:(?!' +
          e.source +
          ')[a-z_]|\\d|-\\.?\\d|[({\'"$@#?]))',
        'im',
      ),
      lookbehind: !0,
      greedy: !0,
      alias: 'function',
    },
    'function-definition': {
      pattern: /(\b(?:fn|function)\s+)\w+\b/i,
      lookbehind: !0,
      alias: 'function',
    },
    argument: {
      pattern: /\b[a-z_]\w*(?=:)/i,
      alias: 'attr-name',
    },
    keyword: e,
    boolean: /\b(?:false|true)\b/,
    time: {
      pattern:
        /(^|[^\w.])(?:(?:(?:\d+(?:\.\d*)?|\.\d+)(?:[eEdD][+-]\d+|[LP])?[msft])+|\d+:\d+(?:\.\d*)?)(?![\w.:])/,
      lookbehind: !0,
      alias: 'number',
    },
    number: [
      {
        pattern:
          /(^|[^\w.])(?:(?:\d+(?:\.\d*)?|\.\d+)(?:[eEdD][+-]\d+|[LP])?|0x[a-fA-F0-9]+)(?![\w.:])/,
        lookbehind: !0,
      },
      /\b(?:e|pi)\b/,
    ],
    constant: /\b(?:dontcollect|ok|silentValue|undefined|unsupplied)\b/,
    color: {
      pattern: /\b(?:black|blue|brown|gray|green|orange|red|white|yellow)\b/i,
      alias: 'constant',
    },
    operator: /[-+*/<>=!]=?|[&^?]|#(?!\()/,
    punctuation: /[()\[\]{}.:,;]|#(?=\()|\\$/m,
  };
})(Prism);
!(function ($) {
  var e = [
      '$eq',
      '$gt',
      '$gte',
      '$in',
      '$lt',
      '$lte',
      '$ne',
      '$nin',
      '$and',
      '$not',
      '$nor',
      '$or',
      '$exists',
      '$type',
      '$expr',
      '$jsonSchema',
      '$mod',
      '$regex',
      '$text',
      '$where',
      '$geoIntersects',
      '$geoWithin',
      '$near',
      '$nearSphere',
      '$all',
      '$elemMatch',
      '$size',
      '$bitsAllClear',
      '$bitsAllSet',
      '$bitsAnyClear',
      '$bitsAnySet',
      '$comment',
      '$elemMatch',
      '$meta',
      '$slice',
      '$currentDate',
      '$inc',
      '$min',
      '$max',
      '$mul',
      '$rename',
      '$set',
      '$setOnInsert',
      '$unset',
      '$addToSet',
      '$pop',
      '$pull',
      '$push',
      '$pullAll',
      '$each',
      '$position',
      '$slice',
      '$sort',
      '$bit',
      '$addFields',
      '$bucket',
      '$bucketAuto',
      '$collStats',
      '$count',
      '$currentOp',
      '$facet',
      '$geoNear',
      '$graphLookup',
      '$group',
      '$indexStats',
      '$limit',
      '$listLocalSessions',
      '$listSessions',
      '$lookup',
      '$match',
      '$merge',
      '$out',
      '$planCacheStats',
      '$project',
      '$redact',
      '$replaceRoot',
      '$replaceWith',
      '$sample',
      '$set',
      '$skip',
      '$sort',
      '$sortByCount',
      '$unionWith',
      '$unset',
      '$unwind',
      '$setWindowFields',
      '$abs',
      '$accumulator',
      '$acos',
      '$acosh',
      '$add',
      '$addToSet',
      '$allElementsTrue',
      '$and',
      '$anyElementTrue',
      '$arrayElemAt',
      '$arrayToObject',
      '$asin',
      '$asinh',
      '$atan',
      '$atan2',
      '$atanh',
      '$avg',
      '$binarySize',
      '$bsonSize',
      '$ceil',
      '$cmp',
      '$concat',
      '$concatArrays',
      '$cond',
      '$convert',
      '$cos',
      '$dateFromParts',
      '$dateToParts',
      '$dateFromString',
      '$dateToString',
      '$dayOfMonth',
      '$dayOfWeek',
      '$dayOfYear',
      '$degreesToRadians',
      '$divide',
      '$eq',
      '$exp',
      '$filter',
      '$first',
      '$floor',
      '$function',
      '$gt',
      '$gte',
      '$hour',
      '$ifNull',
      '$in',
      '$indexOfArray',
      '$indexOfBytes',
      '$indexOfCP',
      '$isArray',
      '$isNumber',
      '$isoDayOfWeek',
      '$isoWeek',
      '$isoWeekYear',
      '$last',
      '$last',
      '$let',
      '$literal',
      '$ln',
      '$log',
      '$log10',
      '$lt',
      '$lte',
      '$ltrim',
      '$map',
      '$max',
      '$mergeObjects',
      '$meta',
      '$min',
      '$millisecond',
      '$minute',
      '$mod',
      '$month',
      '$multiply',
      '$ne',
      '$not',
      '$objectToArray',
      '$or',
      '$pow',
      '$push',
      '$radiansToDegrees',
      '$range',
      '$reduce',
      '$regexFind',
      '$regexFindAll',
      '$regexMatch',
      '$replaceOne',
      '$replaceAll',
      '$reverseArray',
      '$round',
      '$rtrim',
      '$second',
      '$setDifference',
      '$setEquals',
      '$setIntersection',
      '$setIsSubset',
      '$setUnion',
      '$size',
      '$sin',
      '$slice',
      '$split',
      '$sqrt',
      '$stdDevPop',
      '$stdDevSamp',
      '$strcasecmp',
      '$strLenBytes',
      '$strLenCP',
      '$substr',
      '$substrBytes',
      '$substrCP',
      '$subtract',
      '$sum',
      '$switch',
      '$tan',
      '$toBool',
      '$toDate',
      '$toDecimal',
      '$toDouble',
      '$toInt',
      '$toLong',
      '$toObjectId',
      '$toString',
      '$toLower',
      '$toUpper',
      '$trim',
      '$trunc',
      '$type',
      '$week',
      '$year',
      '$zip',
      '$count',
      '$dateAdd',
      '$dateDiff',
      '$dateSubtract',
      '$dateTrunc',
      '$getField',
      '$rand',
      '$sampleRate',
      '$setField',
      '$unsetField',
      '$comment',
      '$explain',
      '$hint',
      '$max',
      '$maxTimeMS',
      '$min',
      '$orderby',
      '$query',
      '$returnKey',
      '$showDiskLoc',
      '$natural',
    ],
    t =
      '(?:' +
      (e = e.map(function ($) {
        return $.replace('$', '\\$');
      })).join('|') +
      ')\\b';
  ($.languages.mongodb = $.languages.extend('javascript', {})),
    $.languages.insertBefore('mongodb', 'string', {
      property: {
        pattern:
          /(?:(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)(?=\s*:)/,
        greedy: !0,
        inside: {
          keyword: RegExp('^([\'"])?' + t + '(?:\\1)?$'),
        },
      },
    }),
    ($.languages.mongodb.string.inside = {
      url: {
        pattern:
          /https?:\/\/[-\w@:%.+~#=]{1,256}\.[a-z0-9()]{1,6}\b[-\w()@:%+.~#?&/=]*/i,
        greedy: !0,
      },
      entity: {
        pattern:
          /\b(?:(?:[01]?\d\d?|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d\d?|2[0-4]\d|25[0-5])\b/,
        greedy: !0,
      },
    }),
    $.languages.insertBefore('mongodb', 'constant', {
      builtin: {
        pattern: RegExp(
          '\\b(?:' +
            [
              'ObjectId',
              'Code',
              'BinData',
              'DBRef',
              'Timestamp',
              'NumberLong',
              'NumberDecimal',
              'MaxKey',
              'MinKey',
              'RegExp',
              'ISODate',
              'UUID',
            ].join('|') +
            ')\\b',
        ),
        alias: 'keyword',
      },
    });
})(Prism);
!(function (e) {
  var n = /\$(?:\w[a-z\d]*(?:_[^\x00-\x1F\s"'\\()$]*)?|\{[^}\s"'\\]+\})/i;
  e.languages.nginx = {
    comment: {
      pattern: /(^|[\s{};])#.*/,
      lookbehind: !0,
      greedy: !0,
    },
    directive: {
      pattern:
        /(^|\s)\w(?:[^;{}"'\\\s]|\\.|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\s+(?:#.*(?!.)|(?![#\s])))*?(?=\s*[;{])/,
      lookbehind: !0,
      greedy: !0,
      inside: {
        string: {
          pattern:
            /((?:^|[^\\])(?:\\\\)*)(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/,
          lookbehind: !0,
          greedy: !0,
          inside: {
            escape: {
              pattern: /\\["'\\nrt]/,
              alias: 'entity',
            },
            variable: n,
          },
        },
        comment: {
          pattern: /(\s)#.*/,
          lookbehind: !0,
          greedy: !0,
        },
        keyword: {
          pattern: /^\S+/,
          greedy: !0,
        },
        boolean: {
          pattern: /(\s)(?:off|on)(?!\S)/,
          lookbehind: !0,
        },
        number: {
          pattern: /(\s)\d+[a-z]*(?!\S)/i,
          lookbehind: !0,
        },
        variable: n,
      },
    },
    punctuation: /[{};]/,
  };
})(Prism);
(Prism.languages.nix = {
  comment: {
    pattern: /\/\*[\s\S]*?\*\/|#.*/,
    greedy: !0,
  },
  string: {
    pattern: /"(?:[^"\\]|\\[\s\S])*"|''(?:(?!'')[\s\S]|''(?:'|\\|\$\{))*''/,
    greedy: !0,
    inside: {
      interpolation: {
        pattern: /(^|(?:^|(?!'').)[^\\])\$\{(?:[^{}]|\{[^}]*\})*\}/,
        lookbehind: !0,
        inside: null,
      },
    },
  },
  url: [
    /\b(?:[a-z]{3,7}:\/\/)[\w\-+%~\/.:#=?&]+/,
    {
      pattern:
        /([^\/])(?:[\w\-+%~.:#=?&]*(?!\/\/)[\w\-+%~\/.:#=?&])?(?!\/\/)\/[\w\-+%~\/.:#=?&]*/,
      lookbehind: !0,
    },
  ],
  antiquotation: {
    pattern: /\$(?=\{)/,
    alias: 'important',
  },
  number: /\b\d+\b/,
  keyword: /\b(?:assert|builtins|else|if|in|inherit|let|null|or|then|with)\b/,
  function:
    /\b(?:abort|add|all|any|attrNames|attrValues|baseNameOf|compareVersions|concatLists|currentSystem|deepSeq|derivation|dirOf|div|elem(?:At)?|fetch(?:Tarball|url)|filter(?:Source)?|fromJSON|genList|getAttr|getEnv|hasAttr|hashString|head|import|intersectAttrs|is(?:Attrs|Bool|Function|Int|List|Null|String)|length|lessThan|listToAttrs|map|mul|parseDrvName|pathExists|read(?:Dir|File)|removeAttrs|replaceStrings|seq|sort|stringLength|sub(?:string)?|tail|throw|to(?:File|JSON|Path|String|XML)|trace|typeOf)\b|\bfoldl'\B/,
  boolean: /\b(?:false|true)\b/,
  operator: /[=!<>]=?|\+\+?|\|\||&&|\/\/|->?|[?@]/,
  punctuation: /[{}()[\].,:;]/,
}),
  (Prism.languages.nix.string.inside.interpolation.inside =
    Prism.languages.nix);
(Prism.languages.objectivec = Prism.languages.extend('c', {
  string: {
    pattern: /@?"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,
    greedy: !0,
  },
  keyword:
    /\b(?:asm|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|in|inline|int|long|register|return|self|short|signed|sizeof|static|struct|super|switch|typedef|typeof|union|unsigned|void|volatile|while)\b|(?:@interface|@end|@implementation|@protocol|@class|@public|@protected|@private|@property|@try|@catch|@finally|@throw|@synthesize|@dynamic|@selector)\b/,
  operator: /-[->]?|\+\+?|!=?|<<?=?|>>?=?|==?|&&?|\|\|?|[~^%?*\/@]/,
})),
  delete Prism.languages.objectivec['class-name'],
  (Prism.languages.objc = Prism.languages.objectivec);
!(function (e) {
  var t =
    /\\(?:["'\\abefnrtv]|0[0-7]{2}|U[\dA-Fa-f]{6}|u[\dA-Fa-f]{4}|x[\dA-Fa-f]{2})/;
  e.languages.odin = {
    comment: [
      {
        pattern:
          /\/\*(?:[^/*]|\/(?!\*)|\*(?!\/)|\/\*(?:\*(?!\/)|[^*])*(?:\*\/|$))*(?:\*\/|$)/,
        greedy: !0,
      },
      {
        pattern: /#![^\n\r]*/,
        greedy: !0,
      },
      {
        pattern: /\/\/[^\n\r]*/,
        greedy: !0,
      },
    ],
    char: {
      pattern: /'(?:\\(?:.|[0Uux][0-9A-Fa-f]{1,6})|[^\n\r'\\])'/,
      greedy: !0,
      inside: {
        symbol: t,
      },
    },
    string: [
      {
        pattern: /`[^`]*`/,
        greedy: !0,
      },
      {
        pattern: /"(?:\\.|[^\n\r"\\])*"/,
        greedy: !0,
        inside: {
          symbol: t,
        },
      },
    ],
    directive: {
      pattern: /#\w+/,
      alias: 'property',
    },
    number:
      /\b0(?:b[01_]+|d[\d_]+|h_*(?:(?:(?:[\dA-Fa-f]_*){8}){1,2}|(?:[\dA-Fa-f]_*){4})|o[0-7_]+|x[\dA-F_a-f]+|z[\dAB_ab]+)\b|(?:\b\d+(?:\.(?!\.)\d*)?|\B\.\d+)(?:[Ee][+-]?\d*)?[ijk]?(?!\w)/,
    discard: {
      pattern: /\b_\b/,
      alias: 'keyword',
    },
    'procedure-definition': {
      pattern: /\b\w+(?=[ \t]*(?::\s*){2}proc\b)/,
      alias: 'function',
    },
    keyword:
      /\b(?:asm|auto_cast|bit_set|break|case|cast|context|continue|defer|distinct|do|dynamic|else|enum|fallthrough|for|foreign|if|import|in|map|matrix|not_in|or_else|or_return|package|proc|return|struct|switch|transmute|typeid|union|using|when|where)\b/,
    'procedure-name': {
      pattern: /\b\w+(?=[ \t]*\()/,
      alias: 'function',
    },
    boolean: /\b(?:false|nil|true)\b/,
    'constant-parameter-sign': {
      pattern: /\$/,
      alias: 'important',
    },
    undefined: {
      pattern: /---/,
      alias: 'operator',
    },
    arrow: {
      pattern: /->/,
      alias: 'punctuation',
    },
    operator: /\+\+|--|\.\.[<=]?|(?:&~|[-!*+/=~]|[%&<>|]{1,2})=?|[?^]/,
    punctuation: /[(),.:;@\[\]{}]/,
  };
})(Prism);
!(function (e) {
  var n = (e.languages.parser = e.languages.extend('markup', {
    keyword: {
      pattern:
        /(^|[^^])(?:\^(?:case|eval|for|if|switch|throw)\b|@(?:BASE|CLASS|GET(?:_DEFAULT)?|OPTIONS|SET_DEFAULT|USE)\b)/,
      lookbehind: !0,
    },
    variable: {
      pattern: /(^|[^^])\B\$(?:\w+|(?=[.{]))(?:(?:\.|::?)\w+)*(?:\.|::?)?/,
      lookbehind: !0,
      inside: {
        punctuation: /\.|:+/,
      },
    },
    function: {
      pattern: /(^|[^^])\B[@^]\w+(?:(?:\.|::?)\w+)*(?:\.|::?)?/,
      lookbehind: !0,
      inside: {
        keyword: {
          pattern: /(^@)(?:GET_|SET_)/,
          lookbehind: !0,
        },
        punctuation: /\.|:+/,
      },
    },
    escape: {
      pattern: /\^(?:[$^;@()\[\]{}"':]|#[a-f\d]*)/i,
      alias: 'builtin',
    },
    punctuation: /[\[\](){};]/,
  }));
  (n = e.languages.insertBefore('parser', 'keyword', {
    'parser-comment': {
      pattern: /(\s)#.*/,
      lookbehind: !0,
      alias: 'comment',
    },
    expression: {
      pattern: /(^|[^^])\((?:[^()]|\((?:[^()]|\((?:[^()])*\))*\))*\)/,
      greedy: !0,
      lookbehind: !0,
      inside: {
        string: {
          pattern: /(^|[^^])(["'])(?:(?!\2)[^^]|\^[\s\S])*\2/,
          lookbehind: !0,
        },
        keyword: n.keyword,
        variable: n.variable,
        function: n.function,
        boolean: /\b(?:false|true)\b/,
        number: /\b(?:0x[a-f\d]+|\d+(?:\.\d*)?(?:e[+-]?\d+)?)\b/i,
        escape: n.escape,
        operator:
          /[~+*\/\\%]|!(?:\|\|?|=)?|&&?|\|\|?|==|<[<=]?|>[>=]?|-[fd]?|\b(?:def|eq|ge|gt|in|is|le|lt|ne)\b/,
        punctuation: n.punctuation,
      },
    },
  })),
    e.languages.insertBefore(
      'inside',
      'punctuation',
      {
        expression: n.expression,
        keyword: n.keyword,
        variable: n.variable,
        function: n.function,
        escape: n.escape,
        'parser-punctuation': {
          pattern: n.punctuation,
          alias: 'punctuation',
        },
      },
      n.tag.inside['attr-value'],
    );
})(Prism);
(Prism.languages.pascal = {
  directive: {
    pattern: /\{\$[\s\S]*?\}/,
    greedy: !0,
    alias: ['marco', 'property'],
  },
  comment: {
    pattern: /\(\*[\s\S]*?\*\)|\{[\s\S]*?\}|\/\/.*/,
    greedy: !0,
  },
  string: {
    pattern: /(?:'(?:''|[^'\r\n])*'(?!')|#[&$%]?[a-f\d]+)+|\^[a-z]/i,
    greedy: !0,
  },
  asm: {
    pattern: /(\basm\b)[\s\S]+?(?=\bend\s*[;[])/i,
    lookbehind: !0,
    greedy: !0,
    inside: null,
  },
  keyword: [
    {
      pattern:
        /(^|[^&])\b(?:absolute|array|asm|begin|case|const|constructor|destructor|do|downto|else|end|file|for|function|goto|if|implementation|inherited|inline|interface|label|nil|object|of|operator|packed|procedure|program|record|reintroduce|repeat|self|set|string|then|to|type|unit|until|uses|var|while|with)\b/i,
      lookbehind: !0,
    },
    {
      pattern: /(^|[^&])\b(?:dispose|exit|false|new|true)\b/i,
      lookbehind: !0,
    },
    {
      pattern:
        /(^|[^&])\b(?:class|dispinterface|except|exports|finalization|finally|initialization|inline|library|on|out|packed|property|raise|resourcestring|threadvar|try)\b/i,
      lookbehind: !0,
    },
    {
      pattern:
        /(^|[^&])\b(?:absolute|abstract|alias|assembler|bitpacked|break|cdecl|continue|cppdecl|cvar|default|deprecated|dynamic|enumerator|experimental|export|external|far|far16|forward|generic|helper|implements|index|interrupt|iochecks|local|message|name|near|nodefault|noreturn|nostackframe|oldfpccall|otherwise|overload|override|pascal|platform|private|protected|public|published|read|register|reintroduce|result|safecall|saveregisters|softfloat|specialize|static|stdcall|stored|strict|unaligned|unimplemented|varargs|virtual|write)\b/i,
      lookbehind: !0,
    },
  ],
  number: [/(?:[&%]\d+|\$[a-f\d]+)/i, /\b\d+(?:\.\d+)?(?:e[+-]?\d+)?/i],
  operator: [
    /\.\.|\*\*|:=|<[<=>]?|>[>=]?|[+\-*\/]=?|[@^=]/,
    {
      pattern:
        /(^|[^&])\b(?:and|as|div|exclude|in|include|is|mod|not|or|shl|shr|xor)\b/,
      lookbehind: !0,
    },
  ],
  punctuation: /\(\.|\.\)|[()\[\]:;,.]/,
}),
  (Prism.languages.pascal.asm.inside = Prism.languages.extend('pascal', {
    asm: void 0,
    keyword: void 0,
    operator: void 0,
  })),
  (Prism.languages.objectpascal = Prism.languages.pascal);
!(function (e) {
  var n =
    '(?:\\((?:[^()\\\\]|\\\\[^])*\\)|\\{(?:[^{}\\\\]|\\\\[^])*\\}|\\[(?:[^[\\]\\\\]|\\\\[^])*\\]|<(?:[^<>\\\\]|\\\\[^])*>)';
  e.languages.perl = {
    comment: [
      {
        pattern: /(^\s*)=\w[\s\S]*?=cut.*/m,
        lookbehind: !0,
        greedy: !0,
      },
      {
        pattern: /(^|[^\\$])#.*/,
        lookbehind: !0,
        greedy: !0,
      },
    ],
    string: [
      {
        pattern: RegExp(
          '\\b(?:q|qq|qw|qx)(?![a-zA-Z0-9])\\s*(?:' +
            [
              '([^a-zA-Z0-9\\s{(\\[<])(?:(?!\\1)[^\\\\]|\\\\[^])*\\1',
              '([a-zA-Z0-9])(?:(?!\\2)[^\\\\]|\\\\[^])*\\2',
              n,
            ].join('|') +
            ')',
        ),
        greedy: !0,
      },
      {
        pattern: /("|`)(?:(?!\1)[^\\]|\\[\s\S])*\1/,
        greedy: !0,
      },
      {
        pattern: /'(?:[^'\\\r\n]|\\.)*'/,
        greedy: !0,
      },
    ],
    regex: [
      {
        pattern: RegExp(
          '\\b(?:m|qr)(?![a-zA-Z0-9])\\s*(?:' +
            [
              '([^a-zA-Z0-9\\s{(\\[<])(?:(?!\\1)[^\\\\]|\\\\[^])*\\1',
              '([a-zA-Z0-9])(?:(?!\\2)[^\\\\]|\\\\[^])*\\2',
              n,
            ].join('|') +
            ')[msixpodualngc]*',
        ),
        greedy: !0,
      },
      {
        pattern: RegExp(
          '(^|[^-])\\b(?:s|tr|y)(?![a-zA-Z0-9])\\s*(?:' +
            [
              '([^a-zA-Z0-9\\s{(\\[<])(?:(?!\\2)[^\\\\]|\\\\[^])*\\2(?:(?!\\2)[^\\\\]|\\\\[^])*\\2',
              '([a-zA-Z0-9])(?:(?!\\3)[^\\\\]|\\\\[^])*\\3(?:(?!\\3)[^\\\\]|\\\\[^])*\\3',
              n + '\\s*' + n,
            ].join('|') +
            ')[msixpodualngcer]*',
        ),
        lookbehind: !0,
        greedy: !0,
      },
      {
        pattern:
          /\/(?:[^\/\\\r\n]|\\.)*\/[msixpodualngc]*(?=\s*(?:$|[\r\n,.;})&|\-+*~<>!?^]|(?:and|cmp|eq|ge|gt|le|lt|ne|not|or|x|xor)\b))/,
        greedy: !0,
      },
    ],
    variable: [
      /[&*$@%]\{\^[A-Z]+\}/,
      /[&*$@%]\^[A-Z_]/,
      /[&*$@%]#?(?=\{)/,
      /[&*$@%]#?(?:(?:::)*'?(?!\d)[\w$]+(?![\w$]))+(?:::)*/,
      /[&*$@%]\d+/,
      /(?!%=)[$@%][!"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~]/,
    ],
    filehandle: {
      pattern: /<(?![<=])\S*?>|\b_\b/,
      alias: 'symbol',
    },
    'v-string': {
      pattern: /v\d+(?:\.\d+)*|\d+(?:\.\d+){2,}/,
      alias: 'string',
    },
    function: {
      pattern: /(\bsub[ \t]+)\w+/,
      lookbehind: !0,
    },
    keyword:
      /\b(?:any|break|continue|default|delete|die|do|else|elsif|eval|for|foreach|given|goto|if|last|local|my|next|our|package|print|redo|require|return|say|state|sub|switch|undef|unless|until|use|when|while)\b/,
    number:
      /\b(?:0x[\dA-Fa-f](?:_?[\dA-Fa-f])*|0b[01](?:_?[01])*|(?:(?:\d(?:_?\d)*)?\.)?\d(?:_?\d)*(?:[Ee][+-]?\d+)?)\b/,
    operator:
      /-[rwxoRWXOezsfdlpSbctugkTBMAC]\b|\+[+=]?|-[-=>]?|\*\*?=?|\/\/?=?|=[=~>]?|~[~=]?|\|\|?=?|&&?=?|<(?:=>?|<=?)?|>>?=?|![~=]?|[%^]=?|\.(?:=|\.\.?)?|[\\?]|\bx(?:=|\b)|\b(?:and|cmp|eq|ge|gt|le|lt|ne|not|or|xor)\b/,
    punctuation: /[{}[\];(),:]/,
  };
})(Prism);
!(function (a) {
  var e = '(?:\\b[a-zA-Z]\\w*|[|\\\\[\\]])+';
  (a.languages.phpdoc = a.languages.extend('javadoclike', {
    parameter: {
      pattern: RegExp(
        '(@(?:global|param|property(?:-read|-write)?|var)\\s+(?:' +
          e +
          '\\s+)?)\\$\\w+',
      ),
      lookbehind: !0,
    },
  })),
    a.languages.insertBefore('phpdoc', 'keyword', {
      'class-name': [
        {
          pattern: RegExp(
            '(@(?:global|package|param|property(?:-read|-write)?|return|subpackage|throws|var)\\s+)' +
              e,
          ),
          lookbehind: !0,
          inside: {
            keyword:
              /\b(?:array|bool|boolean|callback|double|false|float|int|integer|mixed|null|object|resource|self|string|true|void)\b/,
            punctuation: /[|\\[\]()]/,
          },
        },
      ],
    }),
    a.languages.javadoclike.addSupport('php', a.languages.phpdoc);
})(Prism);
Prism.languages.insertBefore('php', 'variable', {
  this: {
    pattern: /\$this\b/,
    alias: 'keyword',
  },
  global:
    /\$(?:GLOBALS|HTTP_RAW_POST_DATA|_(?:COOKIE|ENV|FILES|GET|POST|REQUEST|SERVER|SESSION)|argc|argv|http_response_header|php_errormsg)\b/,
  scope: {
    pattern: /\b[\w\\]+::/,
    inside: {
      keyword: /\b(?:parent|self|static)\b/,
      punctuation: /::|\\/,
    },
  },
});
(Prism.languages.powerquery = {
  comment: {
    pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/,
    lookbehind: !0,
    greedy: !0,
  },
  'quoted-identifier': {
    pattern: /#"(?:[^"\r\n]|"")*"(?!")/,
    greedy: !0,
  },
  string: {
    pattern: /(?:#!)?"(?:[^"\r\n]|"")*"(?!")/,
    greedy: !0,
  },
  constant: [
    /\bDay\.(?:Friday|Monday|Saturday|Sunday|Thursday|Tuesday|Wednesday)\b/,
    /\bTraceLevel\.(?:Critical|Error|Information|Verbose|Warning)\b/,
    /\bOccurrence\.(?:All|First|Last)\b/,
    /\bOrder\.(?:Ascending|Descending)\b/,
    /\bRoundingMode\.(?:AwayFromZero|Down|ToEven|TowardZero|Up)\b/,
    /\bMissingField\.(?:Error|Ignore|UseNull)\b/,
    /\bQuoteStyle\.(?:Csv|None)\b/,
    /\bJoinKind\.(?:FullOuter|Inner|LeftAnti|LeftOuter|RightAnti|RightOuter)\b/,
    /\bGroupKind\.(?:Global|Local)\b/,
    /\bExtraValues\.(?:Error|Ignore|List)\b/,
    /\bJoinAlgorithm\.(?:Dynamic|LeftHash|LeftIndex|PairwiseHash|RightHash|RightIndex|SortMerge)\b/,
    /\bJoinSide\.(?:Left|Right)\b/,
    /\bPrecision\.(?:Decimal|Double)\b/,
    /\bRelativePosition\.From(?:End|Start)\b/,
    /\bTextEncoding\.(?:Ascii|BigEndianUnicode|Unicode|Utf16|Utf8|Windows)\b/,
    /\b(?:Any|Binary|Date|DateTime|DateTimeZone|Duration|Function|Int16|Int32|Int64|Int8|List|Logical|None|Number|Record|Table|Text|Time)\.Type\b/,
    /\bnull\b/,
  ],
  boolean: /\b(?:false|true)\b/,
  keyword:
    /\b(?:and|as|each|else|error|if|in|is|let|meta|not|nullable|optional|or|otherwise|section|shared|then|try|type)\b|#(?:binary|date|datetime|datetimezone|duration|infinity|nan|sections|shared|table|time)\b/,
  function: {
    pattern: /(^|[^#\w.])[a-z_][\w.]*(?=\s*\()/i,
    lookbehind: !0,
  },
  'data-type': {
    pattern:
      /\b(?:any|anynonnull|binary|date|datetime|datetimezone|duration|function|list|logical|none|number|record|table|text|time)\b/,
    alias: 'class-name',
  },
  number: {
    pattern:
      /\b0x[\da-f]+\b|(?:[+-]?(?:\b\d+\.)?\b\d+|[+-]\.\d+|(^|[^.])\B\.\d+)(?:e[+-]?\d+)?\b/i,
    lookbehind: !0,
  },
  operator: /[-+*\/&?@^]|<(?:=>?|>)?|>=?|=>?|\.\.\.?/,
  punctuation: /[,;\[\](){}]/,
}),
  (Prism.languages.pq = Prism.languages.powerquery),
  (Prism.languages.mscript = Prism.languages.powerquery);
!(function (e) {
  var i = (e.languages.powershell = {
    comment: [
      {
        pattern: /(^|[^`])<#[\s\S]*?#>/,
        lookbehind: !0,
      },
      {
        pattern: /(^|[^`])#.*/,
        lookbehind: !0,
      },
    ],
    string: [
      {
        pattern: /"(?:`[\s\S]|[^`"])*"/,
        greedy: !0,
        inside: null,
      },
      {
        pattern: /'(?:[^']|'')*'/,
        greedy: !0,
      },
    ],
    namespace: /\[[a-z](?:\[(?:\[[^\]]*\]|[^\[\]])*\]|[^\[\]])*\]/i,
    boolean: /\$(?:false|true)\b/i,
    variable: /\$\w+\b/,
    function: [
      /\b(?:Add|Approve|Assert|Backup|Block|Checkpoint|Clear|Close|Compare|Complete|Compress|Confirm|Connect|Convert|ConvertFrom|ConvertTo|Copy|Debug|Deny|Disable|Disconnect|Dismount|Edit|Enable|Enter|Exit|Expand|Export|Find|ForEach|Format|Get|Grant|Group|Hide|Import|Initialize|Install|Invoke|Join|Limit|Lock|Measure|Merge|Move|New|Open|Optimize|Out|Ping|Pop|Protect|Publish|Push|Read|Receive|Redo|Register|Remove|Rename|Repair|Request|Reset|Resize|Resolve|Restart|Restore|Resume|Revoke|Save|Search|Select|Send|Set|Show|Skip|Sort|Split|Start|Step|Stop|Submit|Suspend|Switch|Sync|Tee|Test|Trace|Unblock|Undo|Uninstall|Unlock|Unprotect|Unpublish|Unregister|Update|Use|Wait|Watch|Where|Write)-[a-z]+\b/i,
      /\b(?:ac|cat|chdir|clc|cli|clp|clv|compare|copy|cp|cpi|cpp|cvpa|dbp|del|diff|dir|ebp|echo|epal|epcsv|epsn|erase|fc|fl|ft|fw|gal|gbp|gc|gci|gcs|gdr|gi|gl|gm|gp|gps|group|gsv|gu|gv|gwmi|iex|ii|ipal|ipcsv|ipsn|irm|iwmi|iwr|kill|lp|ls|measure|mi|mount|move|mp|mv|nal|ndr|ni|nv|ogv|popd|ps|pushd|pwd|rbp|rd|rdr|ren|ri|rm|rmdir|rni|rnp|rp|rv|rvpa|rwmi|sal|saps|sasv|sbp|sc|select|set|shcm|si|sl|sleep|sls|sort|sp|spps|spsv|start|sv|swmi|tee|trcm|type|write)\b/i,
    ],
    keyword:
      /\b(?:Begin|Break|Catch|Class|Continue|Data|Define|Do|DynamicParam|Else|ElseIf|End|Exit|Filter|Finally|For|ForEach|From|Function|If|InlineScript|Parallel|Param|Process|Return|Sequence|Switch|Throw|Trap|Try|Until|Using|Var|While|Workflow)\b/i,
    operator: {
      pattern:
        /(^|\W)(?:!|-(?:b?(?:and|x?or)|as|(?:Not)?(?:Contains|In|Like|Match)|eq|ge|gt|is(?:Not)?|Join|le|lt|ne|not|Replace|sh[lr])\b|-[-=]?|\+[+=]?|[*\/%]=?)/i,
      lookbehind: !0,
    },
    punctuation: /[|{}[\];(),.]/,
  });
  i.string[0].inside = {
    function: {
      pattern: /(^|[^`])\$\((?:\$\([^\r\n()]*\)|(?!\$\()[^\r\n)])*\)/,
      lookbehind: !0,
      inside: i,
    },
    boolean: i.boolean,
    variable: i.variable,
  };
})(Prism);
Prism.languages.properties = {
  comment: /^[ \t]*[#!].*$/m,
  value: {
    pattern:
      /(^[ \t]*(?:\\(?:\r\n|[\s\S])|[^\\\s:=])+(?: *[=:] *(?! )| ))(?:\\(?:\r\n|[\s\S])|[^\\\r\n])+/m,
    lookbehind: !0,
    alias: 'attr-value',
  },
  key: {
    pattern: /^[ \t]*(?:\\(?:\r\n|[\s\S])|[^\\\s:=])+(?= *[=:]| )/m,
    alias: 'attr-name',
  },
  punctuation: /[=:]/,
};
!(function (e) {
  e.languages.pug = {
    comment: {
      pattern: /(^([\t ]*))\/\/.*(?:(?:\r?\n|\r)\2[\t ].+)*/m,
      lookbehind: !0,
    },
    'multiline-script': {
      pattern:
        /(^([\t ]*)script\b.*\.[\t ]*)(?:(?:\r?\n|\r(?!\n))(?:\2[\t ].+|\s*?(?=\r?\n|\r)))+/m,
      lookbehind: !0,
      inside: e.languages.javascript,
    },
    filter: {
      pattern:
        /(^([\t ]*)):.+(?:(?:\r?\n|\r(?!\n))(?:\2[\t ].+|\s*?(?=\r?\n|\r)))+/m,
      lookbehind: !0,
      inside: {
        'filter-name': {
          pattern: /^:[\w-]+/,
          alias: 'variable',
        },
        text: /\S[\s\S]*/,
      },
    },
    'multiline-plain-text': {
      pattern:
        /(^([\t ]*)[\w\-#.]+\.[\t ]*)(?:(?:\r?\n|\r(?!\n))(?:\2[\t ].+|\s*?(?=\r?\n|\r)))+/m,
      lookbehind: !0,
    },
    markup: {
      pattern: /(^[\t ]*)<.+/m,
      lookbehind: !0,
      inside: e.languages.markup,
    },
    doctype: {
      pattern: /((?:^|\n)[\t ]*)doctype(?: .+)?/,
      lookbehind: !0,
    },
    'flow-control': {
      pattern:
        /(^[\t ]*)(?:case|default|each|else|if|unless|when|while)\b(?: .+)?/m,
      lookbehind: !0,
      inside: {
        each: {
          pattern: /^each .+? in\b/,
          inside: {
            keyword: /\b(?:each|in)\b/,
            punctuation: /,/,
          },
        },
        branch: {
          pattern: /^(?:case|default|else|if|unless|when|while)\b/,
          alias: 'keyword',
        },
        rest: e.languages.javascript,
      },
    },
    keyword: {
      pattern: /(^[\t ]*)(?:append|block|extends|include|prepend)\b.+/m,
      lookbehind: !0,
    },
    mixin: [
      {
        pattern: /(^[\t ]*)mixin .+/m,
        lookbehind: !0,
        inside: {
          keyword: /^mixin/,
          function: /\w+(?=\s*\(|\s*$)/,
          punctuation: /[(),.]/,
        },
      },
      {
        pattern: /(^[\t ]*)\+.+/m,
        lookbehind: !0,
        inside: {
          name: {
            pattern: /^\+\w+/,
            alias: 'function',
          },
          rest: e.languages.javascript,
        },
      },
    ],
    script: {
      pattern: /(^[\t ]*script(?:(?:&[^(]+)?\([^)]+\))*[\t ]).+/m,
      lookbehind: !0,
      inside: e.languages.javascript,
    },
    'plain-text': {
      pattern:
        /(^[\t ]*(?!-)[\w\-#.]*[\w\-](?:(?:&[^(]+)?\([^)]+\))*\/?[\t ]).+/m,
      lookbehind: !0,
    },
    tag: {
      pattern: /(^[\t ]*)(?!-)[\w\-#.]*[\w\-](?:(?:&[^(]+)?\([^)]+\))*\/?:?/m,
      lookbehind: !0,
      inside: {
        attributes: [
          {
            pattern: /&[^(]+\([^)]+\)/,
            inside: e.languages.javascript,
          },
          {
            pattern: /\([^)]+\)/,
            inside: {
              'attr-value': {
                pattern: /(=\s*(?!\s))(?:\{[^}]*\}|[^,)\r\n]+)/,
                lookbehind: !0,
                inside: e.languages.javascript,
              },
              'attr-name': /[\w-]+(?=\s*!?=|\s*[,)])/,
              punctuation: /[!=(),]+/,
            },
          },
        ],
        punctuation: /:/,
        'attr-id': /#[\w\-]+/,
        'attr-class': /\.[\w\-]+/,
      },
    },
    code: [
      {
        pattern: /(^[\t ]*(?:-|!?=)).+/m,
        lookbehind: !0,
        inside: e.languages.javascript,
      },
    ],
    punctuation: /[.\-!=|]+/,
  };
  for (
    var t = [
        {
          filter: 'atpl',
          language: 'twig',
        },
        {
          filter: 'coffee',
          language: 'coffeescript',
        },
        'ejs',
        'handlebars',
        'less',
        'livescript',
        'markdown',
        {
          filter: 'sass',
          language: 'scss',
        },
        'stylus',
      ],
      n = {},
      a = 0,
      i = t.length;
    a < i;
    a++
  ) {
    var r = t[a];
    (r =
      'string' == typeof r
        ? {
            filter: r,
            language: r,
          }
        : r),
      e.languages[r.language] &&
        (n['filter-' + r.filter] = {
          pattern: RegExp(
            '(^([\t ]*)):<filter_name>(?:(?:\r?\n|\r(?!\n))(?:\\2[\t ].+|\\s*?(?=\r?\n|\r)))+'.replace(
              '<filter_name>',
              function () {
                return r.filter;
              },
            ),
            'm',
          ),
          lookbehind: !0,
          inside: {
            'filter-name': {
              pattern: /^:[\w-]+/,
              alias: 'variable',
            },
            text: {
              pattern: /\S[\s\S]*/,
              alias: [r.language, 'language-' + r.language],
              inside: e.languages[r.language],
            },
          },
        });
  }
  e.languages.insertBefore('pug', 'filter', n);
})(Prism);
!(function (e) {
  e.languages.puppet = {
    heredoc: [
      {
        pattern:
          /(@\("([^"\r\n\/):]+)"(?:\/[nrts$uL]*)?\).*(?:\r?\n|\r))(?:.*(?:\r?\n|\r(?!\n)))*?[ \t]*(?:\|[ \t]*)?(?:-[ \t]*)?\2/,
        lookbehind: !0,
        alias: 'string',
        inside: {
          punctuation: /(?=\S).*\S(?= *$)/,
        },
      },
      {
        pattern:
          /(@\(([^"\r\n\/):]+)(?:\/[nrts$uL]*)?\).*(?:\r?\n|\r))(?:.*(?:\r?\n|\r(?!\n)))*?[ \t]*(?:\|[ \t]*)?(?:-[ \t]*)?\2/,
        lookbehind: !0,
        greedy: !0,
        alias: 'string',
        inside: {
          punctuation: /(?=\S).*\S(?= *$)/,
        },
      },
      {
        pattern: /@\("?(?:[^"\r\n\/):]+)"?(?:\/[nrts$uL]*)?\)/,
        alias: 'string',
        inside: {
          punctuation: {
            pattern: /(\().+?(?=\))/,
            lookbehind: !0,
          },
        },
      },
    ],
    'multiline-comment': {
      pattern: /(^|[^\\])\/\*[\s\S]*?\*\//,
      lookbehind: !0,
      greedy: !0,
      alias: 'comment',
    },
    regex: {
      pattern:
        /((?:\bnode\s+|[~=\(\[\{,]\s*|[=+]>\s*|^\s*))\/(?:[^\/\\]|\\[\s\S])+\/(?:[imx]+\b|\B)/,
      lookbehind: !0,
      greedy: !0,
      inside: {
        'extended-regex': {
          pattern: /^\/(?:[^\/\\]|\\[\s\S])+\/[im]*x[im]*$/,
          inside: {
            comment: /#.*/,
          },
        },
      },
    },
    comment: {
      pattern: /(^|[^\\])#.*/,
      lookbehind: !0,
      greedy: !0,
    },
    string: {
      pattern:
        /(["'])(?:\$\{(?:[^'"}]|(["'])(?:(?!\2)[^\\]|\\[\s\S])*\2)+\}|\$(?!\{)|(?!\1)[^\\$]|\\[\s\S])*\1/,
      greedy: !0,
      inside: {
        'double-quoted': {
          pattern: /^"[\s\S]*"$/,
          inside: {},
        },
      },
    },
    variable: {
      pattern: /\$(?:::)?\w+(?:::\w+)*/,
      inside: {
        punctuation: /::/,
      },
    },
    'attr-name': /(?:\b\w+|\*)(?=\s*=>)/,
    function: [
      {
        pattern: /(\.)(?!\d)\w+/,
        lookbehind: !0,
      },
      /\b(?:contain|debug|err|fail|include|info|notice|realize|require|tag|warning)\b|\b(?!\d)\w+(?=\()/,
    ],
    number: /\b(?:0x[a-f\d]+|\d+(?:\.\d+)?(?:e-?\d+)?)\b/i,
    boolean: /\b(?:false|true)\b/,
    keyword:
      /\b(?:application|attr|case|class|consumes|default|define|else|elsif|function|if|import|inherits|node|private|produces|type|undef|unless)\b/,
    datatype: {
      pattern:
        /\b(?:Any|Array|Boolean|Callable|Catalogentry|Class|Collection|Data|Default|Enum|Float|Hash|Integer|NotUndef|Numeric|Optional|Pattern|Regexp|Resource|Runtime|Scalar|String|Struct|Tuple|Type|Undef|Variant)\b/,
      alias: 'symbol',
    },
    operator:
      /=[=~>]?|![=~]?|<(?:<\|?|[=~|-])?|>[>=]?|->?|~>|\|>?>?|[*\/%+?]|\b(?:and|in|or)\b/,
    punctuation: /[\[\]{}().,;]|:+/,
  };
  var n = [
    {
      pattern:
        /(^|[^\\])\$\{(?:[^'"{}]|\{[^}]*\}|(["'])(?:(?!\2)[^\\]|\\[\s\S])*\2)+\}/,
      lookbehind: !0,
      inside: {
        'short-variable': {
          pattern: /(^\$\{)(?!\w+\()(?:::)?\w+(?:::\w+)*/,
          lookbehind: !0,
          alias: 'variable',
          inside: {
            punctuation: /::/,
          },
        },
        delimiter: {
          pattern: /^\$/,
          alias: 'variable',
        },
        rest: e.languages.puppet,
      },
    },
    {
      pattern: /(^|[^\\])\$(?:::)?\w+(?:::\w+)*/,
      lookbehind: !0,
      alias: 'variable',
      inside: {
        punctuation: /::/,
      },
    },
  ];
  (e.languages.puppet.heredoc[0].inside.interpolation = n),
    (e.languages.puppet.string.inside['double-quoted'].inside.interpolation =
      n);
})(Prism);
!(function (e) {
  (e.languages.pure = {
    comment: [
      {
        pattern: /(^|[^\\])\/\*[\s\S]*?\*\//,
        lookbehind: !0,
      },
      {
        pattern: /(^|[^\\:])\/\/.*/,
        lookbehind: !0,
      },
      /#!.+/,
    ],
    'inline-lang': {
      pattern: /%<[\s\S]+?%>/,
      greedy: !0,
      inside: {
        lang: {
          pattern: /(^%< *)-\*-.+?-\*-/,
          lookbehind: !0,
          alias: 'comment',
        },
        delimiter: {
          pattern: /^%<.*|%>$/,
          alias: 'punctuation',
        },
      },
    },
    string: {
      pattern: /"(?:\\.|[^"\\\r\n])*"/,
      greedy: !0,
    },
    number: {
      pattern:
        /((?:\.\.)?)(?:\b(?:inf|nan)\b|\b0x[\da-f]+|(?:\b(?:0b)?\d+(?:\.\d+)?|\B\.\d+)(?:e[+-]?\d+)?L?)/i,
      lookbehind: !0,
    },
    keyword:
      /\b(?:NULL|ans|break|bt|case|catch|cd|clear|const|def|del|dump|else|end|exit|extern|false|force|help|if|infix[lr]?|interface|let|ls|mem|namespace|nonfix|of|otherwise|outfix|override|postfix|prefix|private|public|pwd|quit|run|save|show|stats|then|throw|trace|true|type|underride|using|when|with)\b/,
    function:
      /\b(?:abs|add_(?:addr|constdef|(?:fundef|interface|macdef|typedef)(?:_at)?|vardef)|all|any|applp?|arity|bigintp?|blob(?:_crc|_size|p)?|boolp?|byte_c?string(?:_pointer)?|byte_(?:matrix|pointer)|calloc|cat|catmap|ceil|char[ps]?|check_ptrtag|chr|clear_sentry|clearsym|closurep?|cmatrixp?|cols?|colcat(?:map)?|colmap|colrev|colvector(?:p|seq)?|complex(?:_float_(?:matrix|pointer)|_matrix(?:_view)?|_pointer|p)?|conj|cookedp?|cst|cstring(?:_(?:dup|list|vector))?|curry3?|cyclen?|del_(?:constdef|fundef|interface|macdef|typedef|vardef)|delete|diag(?:mat)?|dim|dmatrixp?|do|double(?:_matrix(?:_view)?|_pointer|p)?|dowith3?|drop|dropwhile|eval(?:cmd)?|exactp|filter|fix|fixity|flip|float(?:_matrix|_pointer)|floor|fold[lr]1?|frac|free|funp?|functionp?|gcd|get(?:_(?:byte|constdef|double|float|fundef|int(?:64)?|interface(?:_typedef)?|long|macdef|pointer|ptrtag|sentry|short|string|typedef|vardef))?|globsym|hash|head|id|im|imatrixp?|index|inexactp|infp|init|insert|int(?:_matrix(?:_view)?|_pointer|p)?|int64_(?:matrix|pointer)|integerp?|iteraten?|iterwhile|join|keys?|lambdap?|last(?:err(?:pos)?)?|lcd|list[2p]?|listmap|make_ptrtag|malloc|map|matcat|matrixp?|max|member|min|nanp|nargs|nmatrixp?|null|numberp?|ord|pack(?:ed)?|pointer(?:_cast|_tag|_type|p)?|pow|pred|ptrtag|put(?:_(?:byte|double|float|int(?:64)?|long|pointer|short|string))?|rationalp?|re|realp?|realloc|recordp?|redim|reduce(?:_with)?|refp?|repeatn?|reverse|rlistp?|round|rows?|rowcat(?:map)?|rowmap|rowrev|rowvector(?:p|seq)?|same|scan[lr]1?|sentry|sgn|short_(?:matrix|pointer)|slice|smatrixp?|sort|split|str|strcat|stream|stride|string(?:_(?:dup|list|vector)|p)?|subdiag(?:mat)?|submat|subseq2?|substr|succ|supdiag(?:mat)?|symbolp?|tail|take|takewhile|thunkp?|transpose|trunc|tuplep?|typep|ubyte|uint(?:64)?|ulong|uncurry3?|unref|unzip3?|update|ushort|vals?|varp?|vector(?:p|seq)?|void|zip3?|zipwith3?)\b/,
    special: {
      pattern: /\b__[a-z]+__\b/i,
      alias: 'builtin',
    },
    operator:
      /(?:[!"#$%&'*+,\-.\/:<=>?@\\^`|~\u00a1-\u00bf\u00d7-\u00f7\u20d0-\u2bff]|\b_+\b)+|\b(?:and|div|mod|not|or)\b/,
    punctuation: /[(){}\[\];,|]/,
  }),
    [
      'c',
      {
        lang: 'c++',
        alias: 'cpp',
      },
      'fortran',
    ].forEach(function (t) {
      var a = t;
      if (
        ('string' != typeof t && ((a = t.alias), (t = t.lang)), e.languages[a])
      ) {
        var r = {};
        (r['inline-lang-' + a] = {
          pattern: RegExp(
            '%< *-\\*- *<lang>\\d* *-\\*-[^]+?%>'.replace(
              '<lang>',
              t.replace(/([.+*?\/\\(){}\[\]])/g, '\\$1'),
            ),
            'i',
          ),
          inside: e.util.clone(e.languages.pure['inline-lang'].inside),
        }),
          (r['inline-lang-' + a].inside.rest = e.util.clone(e.languages[a])),
          e.languages.insertBefore('pure', 'inline-lang', r);
      }
    }),
    e.languages.c &&
      (e.languages.pure['inline-lang'].inside.rest = e.util.clone(
        e.languages.c,
      ));
})(Prism);
(Prism.languages.python = {
  comment: {
    pattern: /(^|[^\\])#.*/,
    lookbehind: !0,
    greedy: !0,
  },
  'string-interpolation': {
    pattern:
      /(?:f|fr|rf)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,
    greedy: !0,
    inside: {
      interpolation: {
        pattern:
          /((?:^|[^{])(?:\{\{)*)\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}]|\{(?!\{)(?:[^{}])+\})+\})+\}/,
        lookbehind: !0,
        inside: {
          'format-spec': {
            pattern: /(:)[^:(){}]+(?=\}$)/,
            lookbehind: !0,
          },
          'conversion-option': {
            pattern: /![sra](?=[:}]$)/,
            alias: 'punctuation',
          },
          rest: null,
        },
      },
      string: /[\s\S]+/,
    },
  },
  'triple-quoted-string': {
    pattern: /(?:[rub]|br|rb)?("""|''')[\s\S]*?\1/i,
    greedy: !0,
    alias: 'string',
  },
  string: {
    pattern: /(?:[rub]|br|rb)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,
    greedy: !0,
  },
  function: {
    pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,
    lookbehind: !0,
  },
  'class-name': {
    pattern: /(\bclass\s+)\w+/i,
    lookbehind: !0,
  },
  decorator: {
    pattern: /(^[\t ]*)@\w+(?:\.\w+)*/m,
    lookbehind: !0,
    alias: ['annotation', 'punctuation'],
    inside: {
      punctuation: /\./,
    },
  },
  keyword:
    /\b(?:_(?=\s*:)|and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|match|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,
  builtin:
    /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,
  boolean: /\b(?:False|None|True)\b/,
  number:
    /\b0(?:b(?:_?[01])+|o(?:_?[0-7])+|x(?:_?[a-f0-9])+)\b|(?:\b\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\B\.\d+(?:_\d+)*)(?:e[+-]?\d+(?:_\d+)*)?j?(?!\w)/i,
  operator: /[-+%=]=?|!=|:=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
  punctuation: /[{}[\];(),.:]/,
}),
  (Prism.languages.python[
    'string-interpolation'
  ].inside.interpolation.inside.rest = Prism.languages.python),
  (Prism.languages.py = Prism.languages.python);
!(function (e) {
  for (
    var r =
        '(?:[^\\\\()[\\]{}"\'/]|<string>|/(?![*/])|<comment>|\\(<expr>*\\)|\\[<expr>*\\]|\\{<expr>*\\}|\\\\[^])'
          .replace(/<string>/g, function () {
            return '"(?:\\\\.|[^\\\\"\r\n])*"|\'(?:\\\\.|[^\\\\\'\r\n])*\'';
          })
          .replace(/<comment>/g, function () {
            return '//.*(?!.)|/\\*(?:[^*]|\\*(?!/))*\\*/';
          }),
      t = 0;
    t < 2;
    t++
  )
    r = r.replace(/<expr>/g, function () {
      return r;
    });
  (r = r.replace(/<expr>/g, '[^\\s\\S]')),
    (e.languages.qml = {
      comment: {
        pattern: /\/\/.*|\/\*[\s\S]*?\*\//,
        greedy: !0,
      },
      'javascript-function': {
        pattern: RegExp(
          '((?:^|;)[ \t]*)function\\s+(?!\\s)[_$a-zA-Z\\xA0-\\uFFFF](?:(?!\\s)[$\\w\\xA0-\\uFFFF])*\\s*\\(<js>*\\)\\s*\\{<js>*\\}'.replace(
            /<js>/g,
            function () {
              return r;
            },
          ),
          'm',
        ),
        lookbehind: !0,
        greedy: !0,
        alias: 'language-javascript',
        inside: e.languages.javascript,
      },
      'class-name': {
        pattern: /((?:^|[:;])[ \t]*)(?!\d)\w+(?=[ \t]*\{|[ \t]+on\b)/m,
        lookbehind: !0,
      },
      property: [
        {
          pattern: /((?:^|[;{])[ \t]*)(?!\d)\w+(?:\.\w+)*(?=[ \t]*:)/m,
          lookbehind: !0,
        },
        {
          pattern:
            /((?:^|[;{])[ \t]*)property[ \t]+(?!\d)\w+(?:\.\w+)*[ \t]+(?!\d)\w+(?:\.\w+)*(?=[ \t]*:)/m,
          lookbehind: !0,
          inside: {
            keyword: /^property/,
            property: /\w+(?:\.\w+)*/,
          },
        },
      ],
      'javascript-expression': {
        pattern: RegExp(
          '(:[ \t]*)(?![\\s;}[])(?:(?!$|[;}])<js>)+'.replace(
            /<js>/g,
            function () {
              return r;
            },
          ),
          'm',
        ),
        lookbehind: !0,
        greedy: !0,
        alias: 'language-javascript',
        inside: e.languages.javascript,
      },
      string: {
        pattern: /"(?:\\.|[^\\"\r\n])*"/,
        greedy: !0,
      },
      keyword: /\b(?:as|import|on)\b/,
      punctuation: /[{}[\]:;,]/,
    });
})(Prism);
Prism.languages.qore = Prism.languages.extend('clike', {
  comment: {
    pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:\/\/|#).*)/,
    lookbehind: !0,
  },
  string: {
    pattern: /("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/,
    greedy: !0,
  },
  keyword:
    /\b(?:abstract|any|assert|binary|bool|boolean|break|byte|case|catch|char|class|code|const|continue|data|default|do|double|else|enum|extends|final|finally|float|for|goto|hash|if|implements|import|inherits|instanceof|int|interface|long|my|native|new|nothing|null|object|our|own|private|reference|rethrow|return|short|soft(?:bool|date|float|int|list|number|string)|static|strictfp|string|sub|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while)\b/,
  boolean: /\b(?:false|true)\b/i,
  function: /\$?\b(?!\d)\w+(?=\()/,
  number:
    /\b(?:0b[01]+|0x(?:[\da-f]*\.)?[\da-fp\-]+|(?:\d+(?:\.\d+)?|\.\d+)(?:e\d+)?[df]|(?:\d+(?:\.\d+)?|\.\d+))\b/i,
  operator: {
    pattern:
      /(^|[^.])(?:\+[+=]?|-[-=]?|[!=](?:==?|~)?|>>?=?|<(?:=>?|<=?)?|&[&=]?|\|[|=]?|[*\/%^]=?|[~?])/,
    lookbehind: !0,
  },
  variable: /\$(?!\d)\w+\b/,
});
Prism.languages.r = {
  comment: /#.*/,
  string: {
    pattern: /(['"])(?:\\.|(?!\1)[^\\\r\n])*\1/,
    greedy: !0,
  },
  'percent-operator': {
    pattern: /%[^%\s]*%/,
    alias: 'operator',
  },
  boolean: /\b(?:FALSE|TRUE)\b/,
  ellipsis: /\.\.(?:\.|\d+)/,
  number: [
    /\b(?:Inf|NaN)\b/,
    /(?:\b0x[\dA-Fa-f]+(?:\.\d*)?|\b\d+(?:\.\d*)?|\B\.\d+)(?:[EePp][+-]?\d+)?[iL]?/,
  ],
  keyword:
    /\b(?:NA|NA_character_|NA_complex_|NA_integer_|NA_real_|NULL|break|else|for|function|if|in|next|repeat|while)\b/,
  operator: /->?>?|<(?:=|<?-)?|[>=!]=?|::?|&&?|\|\|?|[+*\/^$@~]/,
  punctuation: /[(){}\[\],;]/,
};
!(function (t) {
  var n = t.util.clone(t.languages.javascript),
    e = '(?:\\{<S>*\\.{3}(?:[^{}]|<BRACES>)*\\})';
  function a(t, n) {
    return (
      (t = t
        .replace(/<S>/g, function () {
          return '(?:\\s|//.*(?!.)|/\\*(?:[^*]|\\*(?!/))\\*/)';
        })
        .replace(/<BRACES>/g, function () {
          return '(?:\\{(?:\\{(?:\\{[^{}]*\\}|[^{}])*\\}|[^{}])*\\})';
        })
        .replace(/<SPREAD>/g, function () {
          return e;
        })),
      RegExp(t, n)
    );
  }
  (e = a(e).source),
    (t.languages.jsx = t.languages.extend('markup', n)),
    (t.languages.jsx.tag.pattern = a(
      '</?(?:[\\w.:-]+(?:<S>+(?:[\\w.:$-]+(?:=(?:"(?:\\\\[^]|[^\\\\"])*"|\'(?:\\\\[^]|[^\\\\\'])*\'|[^\\s{\'"/>=]+|<BRACES>))?|<SPREAD>))*<S>*/?)?>',
    )),
    (t.languages.jsx.tag.inside.tag.pattern = /^<\/?[^\s>\/]*/),
    (t.languages.jsx.tag.inside['attr-value'].pattern =
      /=(?!\{)(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s'">]+)/),
    (t.languages.jsx.tag.inside.tag.inside['class-name'] =
      /^[A-Z]\w*(?:\.[A-Z]\w*)*$/),
    (t.languages.jsx.tag.inside.comment = n.comment),
    t.languages.insertBefore(
      'inside',
      'attr-name',
      {
        spread: {
          pattern: a('<SPREAD>'),
          inside: t.languages.jsx,
        },
      },
      t.languages.jsx.tag,
    ),
    t.languages.insertBefore(
      'inside',
      'special-attr',
      {
        script: {
          pattern: a('=<BRACES>'),
          alias: 'language-javascript',
          inside: {
            'script-punctuation': {
              pattern: /^=(?=\{)/,
              alias: 'punctuation',
            },
            rest: t.languages.jsx,
          },
        },
      },
      t.languages.jsx.tag,
    );
  var s = function (t) {
      return t
        ? 'string' == typeof t
          ? t
          : 'string' == typeof t.content
          ? t.content
          : t.content.map(s).join('')
        : '';
    },
    g = function (n) {
      for (var e = [], a = 0; a < n.length; a++) {
        var o = n[a],
          i = !1;
        if (
          ('string' != typeof o &&
            ('tag' === o.type && o.content[0] && 'tag' === o.content[0].type
              ? '</' === o.content[0].content[0].content
                ? e.length > 0 &&
                  e[e.length - 1].tagName === s(o.content[0].content[1]) &&
                  e.pop()
                : '/>' === o.content[o.content.length - 1].content ||
                  e.push({
                    tagName: s(o.content[0].content[1]),
                    openedBraces: 0,
                  })
              : e.length > 0 && 'punctuation' === o.type && '{' === o.content
              ? e[e.length - 1].openedBraces++
              : e.length > 0 &&
                e[e.length - 1].openedBraces > 0 &&
                'punctuation' === o.type &&
                '}' === o.content
              ? e[e.length - 1].openedBraces--
              : (i = !0)),
          (i || 'string' == typeof o) &&
            e.length > 0 &&
            0 === e[e.length - 1].openedBraces)
        ) {
          var r = s(o);
          a < n.length - 1 &&
            ('string' == typeof n[a + 1] || 'plain-text' === n[a + 1].type) &&
            ((r += s(n[a + 1])), n.splice(a + 1, 1)),
            a > 0 &&
              ('string' == typeof n[a - 1] || 'plain-text' === n[a - 1].type) &&
              ((r = s(n[a - 1]) + r), n.splice(a - 1, 1), a--),
            (n[a] = new t.Token('plain-text', r, null, r));
        }
        o.content && 'string' != typeof o.content && g(o.content);
      }
    };
  t.hooks.add('after-tokenize', function (t) {
    ('jsx' !== t.language && 'tsx' !== t.language) || g(t.tokens);
  });
})(Prism);
!(function (e) {
  var a = e.util.clone(e.languages.typescript);
  (e.languages.tsx = e.languages.extend('jsx', a)),
    delete e.languages.tsx.parameter,
    delete e.languages.tsx['literal-property'];
  var t = e.languages.tsx.tag;
  (t.pattern = RegExp(
    '(^|[^\\w$]|(?=</))(?:' + t.pattern.source + ')',
    t.pattern.flags,
  )),
    (t.lookbehind = !0);
})(Prism);
(Prism.languages.reason = Prism.languages.extend('clike', {
  string: {
    pattern: /"(?:\\(?:\r\n|[\s\S])|[^\\\r\n"])*"/,
    greedy: !0,
  },
  'class-name': /\b[A-Z]\w*/,
  keyword:
    /\b(?:and|as|assert|begin|class|constraint|do|done|downto|else|end|exception|external|for|fun|function|functor|if|in|include|inherit|initializer|lazy|let|method|module|mutable|new|nonrec|object|of|open|or|private|rec|sig|struct|switch|then|to|try|type|val|virtual|when|while|with)\b/,
  operator:
    /\.{3}|:[:=]|\|>|->|=(?:==?|>)?|<=?|>=?|[|^?'#!~`]|[+\-*\/]\.?|\b(?:asr|land|lor|lsl|lsr|lxor|mod)\b/,
})),
  Prism.languages.insertBefore('reason', 'class-name', {
    char: {
      pattern: /'(?:\\x[\da-f]{2}|\\o[0-3][0-7][0-7]|\\\d{3}|\\.|[^'\\\r\n])'/,
      greedy: !0,
    },
    constructor: /\b[A-Z]\w*\b(?!\s*\.)/,
    label: {
      pattern: /\b[a-z]\w*(?=::)/,
      alias: 'symbol',
    },
  }),
  delete Prism.languages.reason.function;
!(function (a) {
  var e = {
      pattern: /\\[\\(){}[\]^$+*?|.]/,
      alias: 'escape',
    },
    n =
      /\\(?:x[\da-fA-F]{2}|u[\da-fA-F]{4}|u\{[\da-fA-F]+\}|0[0-7]{0,2}|[123][0-7]{2}|c[a-zA-Z]|.)/,
    t = '(?:[^\\\\-]|' + n.source + ')',
    s = RegExp(t + '-' + t),
    i = {
      pattern: /(<|')[^<>']+(?=[>']$)/,
      lookbehind: !0,
      alias: 'variable',
    };
  a.languages.regex = {
    'char-class': {
      pattern: /((?:^|[^\\])(?:\\\\)*)\[(?:[^\\\]]|\\[\s\S])*\]/,
      lookbehind: !0,
      inside: {
        'char-class-negation': {
          pattern: /(^\[)\^/,
          lookbehind: !0,
          alias: 'operator',
        },
        'char-class-punctuation': {
          pattern: /^\[|\]$/,
          alias: 'punctuation',
        },
        range: {
          pattern: s,
          inside: {
            escape: n,
            'range-punctuation': {
              pattern: /-/,
              alias: 'operator',
            },
          },
        },
        'special-escape': e,
        'char-set': {
          pattern: /\\[wsd]|\\p\{[^{}]+\}/i,
          alias: 'class-name',
        },
        escape: n,
      },
    },
    'special-escape': e,
    'char-set': {
      pattern: /\.|\\[wsd]|\\p\{[^{}]+\}/i,
      alias: 'class-name',
    },
    backreference: [
      {
        pattern: /\\(?![123][0-7]{2})[1-9]/,
        alias: 'keyword',
      },
      {
        pattern: /\\k<[^<>']+>/,
        alias: 'keyword',
        inside: {
          'group-name': i,
        },
      },
    ],
    anchor: {
      pattern: /[$^]|\\[ABbGZz]/,
      alias: 'function',
    },
    escape: n,
    group: [
      {
        pattern:
          /\((?:\?(?:<[^<>']+>|'[^<>']+'|[>:]|<?[=!]|[idmnsuxU]+(?:-[idmnsuxU]+)?:?))?/,
        alias: 'punctuation',
        inside: {
          'group-name': i,
        },
      },
      {
        pattern: /\)/,
        alias: 'punctuation',
      },
    ],
    quantifier: {
      pattern: /(?:[+*?]|\{\d+(?:,\d*)?\})[?+]?/,
      alias: 'number',
    },
    alternation: {
      pattern: /\|/,
      alias: 'keyword',
    },
  };
})(Prism);
Prism.languages.rego = {
  comment: /#.*/,
  property: {
    pattern:
      /(^|[^\\.])(?:"(?:\\.|[^\\"\r\n])*"|`[^`]*`|\b[a-z_]\w*\b)(?=\s*:(?!=))/i,
    lookbehind: !0,
    greedy: !0,
  },
  string: {
    pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"|`[^`]*`/,
    lookbehind: !0,
    greedy: !0,
  },
  keyword:
    /\b(?:as|default|else|import|not|null|package|set(?=\s*\()|some|with)\b/,
  boolean: /\b(?:false|true)\b/,
  function: {
    pattern: /\b[a-z_]\w*\b(?:\s*\.\s*\b[a-z_]\w*\b)*(?=\s*\()/i,
    inside: {
      namespace: /\b\w+\b(?=\s*\.)/,
      punctuation: /\./,
    },
  },
  number: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
  operator: /[-+*/%|&]|[<>:=]=?|!=|\b_\b/,
  punctuation: /[,;.\[\]{}()]/,
};
!(function (e) {
  for (var a = '/\\*(?:[^*/]|\\*(?!/)|/(?!\\*)|<self>)*\\*/', t = 0; t < 2; t++)
    a = a.replace(/<self>/g, function () {
      return a;
    });
  (a = a.replace(/<self>/g, function () {
    return '[^\\s\\S]';
  })),
    (e.languages.rust = {
      comment: [
        {
          pattern: RegExp('(^|[^\\\\])' + a),
          lookbehind: !0,
          greedy: !0,
        },
        {
          pattern: /(^|[^\\:])\/\/.*/,
          lookbehind: !0,
          greedy: !0,
        },
      ],
      string: {
        pattern: /b?"(?:\\[\s\S]|[^\\"])*"|b?r(#*)"(?:[^"]|"(?!\1))*"\1/,
        greedy: !0,
      },
      char: {
        pattern:
          /b?'(?:\\(?:x[0-7][\da-fA-F]|u\{(?:[\da-fA-F]_*){1,6}\}|.)|[^\\\r\n\t'])'/,
        greedy: !0,
      },
      attribute: {
        pattern: /#!?\[(?:[^\[\]"]|"(?:\\[\s\S]|[^\\"])*")*\]/,
        greedy: !0,
        alias: 'attr-name',
        inside: {
          string: null,
        },
      },
      'closure-params': {
        pattern: /([=(,:]\s*|\bmove\s*)\|[^|]*\||\|[^|]*\|(?=\s*(?:\{|->))/,
        lookbehind: !0,
        greedy: !0,
        inside: {
          'closure-punctuation': {
            pattern: /^\||\|$/,
            alias: 'punctuation',
          },
          rest: null,
        },
      },
      'lifetime-annotation': {
        pattern: /'\w+/,
        alias: 'symbol',
      },
      'fragment-specifier': {
        pattern: /(\$\w+:)[a-z]+/,
        lookbehind: !0,
        alias: 'punctuation',
      },
      variable: /\$\w+/,
      'function-definition': {
        pattern: /(\bfn\s+)\w+/,
        lookbehind: !0,
        alias: 'function',
      },
      'type-definition': {
        pattern: /(\b(?:enum|struct|trait|type|union)\s+)\w+/,
        lookbehind: !0,
        alias: 'class-name',
      },
      'module-declaration': [
        {
          pattern: /(\b(?:crate|mod)\s+)[a-z][a-z_\d]*/,
          lookbehind: !0,
          alias: 'namespace',
        },
        {
          pattern:
            /(\b(?:crate|self|super)\s*)::\s*[a-z][a-z_\d]*\b(?:\s*::(?:\s*[a-z][a-z_\d]*\s*::)*)?/,
          lookbehind: !0,
          alias: 'namespace',
          inside: {
            punctuation: /::/,
          },
        },
      ],
      keyword: [
        /\b(?:Self|abstract|as|async|await|become|box|break|const|continue|crate|do|dyn|else|enum|extern|final|fn|for|if|impl|in|let|loop|macro|match|mod|move|mut|override|priv|pub|ref|return|self|static|struct|super|trait|try|type|typeof|union|unsafe|unsized|use|virtual|where|while|yield)\b/,
        /\b(?:bool|char|f(?:32|64)|[ui](?:8|16|32|64|128|size)|str)\b/,
      ],
      function: /\b[a-z_]\w*(?=\s*(?:::\s*<|\())/,
      macro: {
        pattern: /\b\w+!/,
        alias: 'property',
      },
      constant: /\b[A-Z_][A-Z_\d]+\b/,
      'class-name': /\b[A-Z]\w*\b/,
      namespace: {
        pattern: /(?:\b[a-z][a-z_\d]*\s*::\s*)*\b[a-z][a-z_\d]*\s*::(?!\s*<)/,
        inside: {
          punctuation: /::/,
        },
      },
      number:
        /\b(?:0x[\dA-Fa-f](?:_?[\dA-Fa-f])*|0o[0-7](?:_?[0-7])*|0b[01](?:_?[01])*|(?:(?:\d(?:_?\d)*)?\.)?\d(?:_?\d)*(?:[Ee][+-]?\d+)?)(?:_?(?:f32|f64|[iu](?:8|16|32|64|size)?))?\b/,
      boolean: /\b(?:false|true)\b/,
      punctuation: /->|\.\.=|\.{1,3}|::|[{}[\];(),:]/,
      operator: /[-+*\/%!^]=?|=[=>]?|&[&=]?|\|[|=]?|<<?=?|>>?=?|[@?]/,
    }),
    (e.languages.rust['closure-params'].inside.rest = e.languages.rust),
    (e.languages.rust.attribute.inside.string = e.languages.rust.string);
})(Prism);
!(function (e) {
  var t = '(?:"(?:""|[^"])*"(?!")|\'(?:\'\'|[^\'])*\'(?!\'))',
    a = /\b(?:\d[\da-f]*x|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/i,
    n = {
      pattern: RegExp(t + '[bx]'),
      alias: 'number',
    },
    i = {
      pattern: /&[a-z_]\w*/i,
    },
    r = {
      pattern:
        /((?:^|\s|=|\())%(?:ABORT|BY|CMS|COPY|DISPLAY|DO|ELSE|END|EVAL|GLOBAL|GO|GOTO|IF|INC|INCLUDE|INDEX|INPUT|KTRIM|LENGTH|LET|LIST|LOCAL|PUT|QKTRIM|QSCAN|QSUBSTR|QSYSFUNC|QUPCASE|RETURN|RUN|SCAN|SUBSTR|SUPERQ|SYMDEL|SYMEXIST|SYMGLOBL|SYMLOCAL|SYSCALL|SYSEVALF|SYSEXEC|SYSFUNC|SYSGET|SYSRPUT|THEN|TO|TSO|UNQUOTE|UNTIL|UPCASE|WHILE|WINDOW)\b/i,
      lookbehind: !0,
      alias: 'keyword',
    },
    s = {
      pattern: /(^|\s)(?:proc\s+\w+|data(?!=)|quit|run)\b/i,
      alias: 'keyword',
      lookbehind: !0,
    },
    o = [
      /\/\*[\s\S]*?\*\//,
      {
        pattern: /(^[ \t]*|;\s*)\*[^;]*;/m,
        lookbehind: !0,
      },
    ],
    l = {
      pattern: RegExp(t),
      greedy: !0,
    },
    c = /[$%@.(){}\[\];,\\]/,
    d = {
      pattern: /%?\b\w+(?=\()/,
      alias: 'keyword',
    },
    p = {
      function: d,
      'arg-value': {
        pattern: /(=\s*)[A-Z\.]+/i,
        lookbehind: !0,
      },
      operator: /=/,
      'macro-variable': i,
      arg: {
        pattern: /[A-Z]+/i,
        alias: 'keyword',
      },
      number: a,
      'numeric-constant': n,
      punctuation: c,
      string: l,
    },
    u = {
      pattern: /\b(?:format|put)\b=?[\w'$.]+/i,
      inside: {
        keyword: /^(?:format|put)(?==)/i,
        equals: /=/,
        format: {
          pattern: /(?:\w|\$\d)+\.\d?/,
          alias: 'number',
        },
      },
    },
    m = {
      pattern: /\b(?:format|put)\s+[\w']+(?:\s+[$.\w]+)+(?=;)/i,
      inside: {
        keyword: /^(?:format|put)/i,
        format: {
          pattern: /[\w$]+\.\d?/,
          alias: 'number',
        },
      },
    },
    b = {
      pattern:
        /((?:^|\s)=?)(?:catname|checkpoint execute_always|dm|endsas|filename|footnote|%include|libname|%list|lock|missing|options|page|resetline|%run|sasfile|skip|sysecho|title\d?)\b/i,
      lookbehind: !0,
      alias: 'keyword',
    },
    g = {
      pattern: /(^|\s)(?:submit(?:\s+(?:load|norun|parseonly))?|endsubmit)\b/i,
      lookbehind: !0,
      alias: 'keyword',
    },
    k =
      'aStore|accessControl|aggregation|audio|autotune|bayesianNetClassifier|bioMedImage|boolRule|builtins|cardinality|cdm|clustering|conditionalRandomFields|configuration|copula|countreg|dataDiscovery|dataPreprocess|dataSciencePilot|dataStep|decisionTree|deduplication|deepLearn|deepNeural|deepRnn|ds2|ecm|entityRes|espCluster|explainModel|factmac|fastKnn|fcmpact|fedSql|freqTab|gVarCluster|gam|gleam|graphSemiSupLearn|hiddenMarkovModel|hyperGroup|ica|image|iml|kernalPca|langModel|ldaTopic|loadStreams|mbc|mixed|mlTools|modelPublishing|network|neuralNet|nmf|nonParametricBayes|nonlinear|optNetwork|optimization|panel|pca|percentile|phreg|pls|qkb|qlim|quantreg|recommend|regression|reinforcementLearn|robustPca|ruleMining|sampling|sandwich|sccasl|search(?:Analytics)?|sentimentAnalysis|sequence|session(?:Prop)?|severity|simSystem|simple|smartData|sparkEmbeddedProcess|sparseML|spatialreg|spc|stabilityMonitoring|svDataDescription|svm|table|text(?:Filters|Frequency|Mining|Parse|Rule(?:Develop|Score)|Topic|Util)|timeData|transpose|tsInfo|tsReconcile|uniTimeSeries|varReduce',
    y = {
      pattern: RegExp(
        '(^|\\s)(?:action\\s+)?(?:<act>)\\.[a-z]+\\b[^;]+'.replace(
          /<act>/g,
          function () {
            return k;
          },
        ),
        'i',
      ),
      lookbehind: !0,
      inside: {
        keyword: RegExp(
          '(?:<act>)\\.[a-z]+\\b'.replace(/<act>/g, function () {
            return k;
          }),
          'i',
        ),
        action: {
          pattern: /(?:action)/i,
          alias: 'keyword',
        },
        comment: o,
        function: d,
        'arg-value': p['arg-value'],
        operator: p.operator,
        argument: p.arg,
        number: a,
        'numeric-constant': n,
        punctuation: c,
        string: l,
      },
    },
    S = {
      pattern:
        /((?:^|\s)=?)(?:after|analysis|and|array|barchart|barwidth|begingraph|by|call|cas|cbarline|cfill|class(?:lev)?|close|column|computed?|contains|continue|data(?==)|define|delete|describe|document|do\s+over|do|dol|drop|dul|else|end(?:comp|source)?|entryTitle|eval(?:uate)?|exec(?:ute)?|exit|file(?:name)?|fill(?:attrs)?|flist|fnc|function(?:list)?|global|goto|group(?:by)?|headline|headskip|histogram|if|infile|keep|keylabel|keyword|label|layout|leave|legendlabel|length|libname|loadactionset|merge|midpoints|_?null_|name|noobs|nowd|ods|options|or|otherwise|out(?:put)?|over(?:lay)?|plot|print|put|raise|ranexp|rannor|rbreak|retain|return|select|session|sessref|set|source|statgraph|sum|summarize|table|temp|terminate|then\s+do|then|title\d?|to|var|when|where|xaxisopts|y2axisopts|yaxisopts)\b/i,
      lookbehind: !0,
    };
  e.languages.sas = {
    datalines: {
      pattern: /^([ \t]*)(?:cards|(?:data)?lines);[\s\S]+?^[ \t]*;/im,
      lookbehind: !0,
      alias: 'string',
      inside: {
        keyword: {
          pattern: /^(?:cards|(?:data)?lines)/i,
        },
        punctuation: /;/,
      },
    },
    'proc-sql': {
      pattern:
        /(^proc\s+(?:fed)?sql(?:\s+[\w|=]+)?;)[\s\S]+?(?=^(?:proc\s+\w+|data|quit|run);|(?![\s\S]))/im,
      lookbehind: !0,
      inside: {
        sql: {
          pattern: RegExp(
            '^[ \t]*(?:select|alter\\s+table|(?:create|describe|drop)\\s+(?:index|table(?:\\s+constraints)?|view)|create\\s+unique\\s+index|insert\\s+into|update)(?:<str>|[^;"\'])+;'.replace(
              /<str>/g,
              function () {
                return t;
              },
            ),
            'im',
          ),
          alias: 'language-sql',
          inside: e.languages.sql,
        },
        'global-statements': b,
        'sql-statements': {
          pattern:
            /(^|\s)(?:disconnect\s+from|begin|commit|exec(?:ute)?|reset|rollback|validate)\b/i,
          lookbehind: !0,
          alias: 'keyword',
        },
        number: a,
        'numeric-constant': n,
        punctuation: c,
        string: l,
      },
    },
    'proc-groovy': {
      pattern:
        /(^proc\s+groovy(?:\s+[\w|=]+)?;)[\s\S]+?(?=^(?:proc\s+\w+|data|quit|run);|(?![\s\S]))/im,
      lookbehind: !0,
      inside: {
        comment: o,
        groovy: {
          pattern: RegExp(
            '(^[ \t]*submit(?:\\s+(?:load|norun|parseonly))?)(?:<str>|[^"\'])+?(?=endsubmit;)'.replace(
              /<str>/g,
              function () {
                return t;
              },
            ),
            'im',
          ),
          lookbehind: !0,
          alias: 'language-groovy',
          inside: e.languages.groovy,
        },
        keyword: S,
        'submit-statement': g,
        'global-statements': b,
        number: a,
        'numeric-constant': n,
        punctuation: c,
        string: l,
      },
    },
    'proc-lua': {
      pattern:
        /(^proc\s+lua(?:\s+[\w|=]+)?;)[\s\S]+?(?=^(?:proc\s+\w+|data|quit|run);|(?![\s\S]))/im,
      lookbehind: !0,
      inside: {
        comment: o,
        lua: {
          pattern: RegExp(
            '(^[ \t]*submit(?:\\s+(?:load|norun|parseonly))?)(?:<str>|[^"\'])+?(?=endsubmit;)'.replace(
              /<str>/g,
              function () {
                return t;
              },
            ),
            'im',
          ),
          lookbehind: !0,
          alias: 'language-lua',
          inside: e.languages.lua,
        },
        keyword: S,
        'submit-statement': g,
        'global-statements': b,
        number: a,
        'numeric-constant': n,
        punctuation: c,
        string: l,
      },
    },
    'proc-cas': {
      pattern:
        /(^proc\s+cas(?:\s+[\w|=]+)?;)[\s\S]+?(?=^(?:proc\s+\w+|quit|data);|(?![\s\S]))/im,
      lookbehind: !0,
      inside: {
        comment: o,
        'statement-var': {
          pattern: /((?:^|\s)=?)saveresult\s[^;]+/im,
          lookbehind: !0,
          inside: {
            statement: {
              pattern: /^saveresult\s+\S+/i,
              inside: {
                keyword: /^(?:saveresult)/i,
              },
            },
            rest: p,
          },
        },
        'cas-actions': y,
        statement: {
          pattern: /((?:^|\s)=?)(?:default|(?:un)?set|on|output|upload)[^;]+/im,
          lookbehind: !0,
          inside: p,
        },
        step: s,
        keyword: S,
        function: d,
        format: u,
        altformat: m,
        'global-statements': b,
        number: a,
        'numeric-constant': n,
        punctuation: c,
        string: l,
      },
    },
    'proc-args': {
      pattern: RegExp(
        '(^proc\\s+\\w+\\s+)(?!\\s)(?:[^;"\']|<str>)+;'.replace(
          /<str>/g,
          function () {
            return t;
          },
        ),
        'im',
      ),
      lookbehind: !0,
      inside: p,
    },
    'macro-keyword': r,
    'macro-variable': i,
    'macro-string-functions': {
      pattern:
        /((?:^|\s|=))%(?:BQUOTE|NRBQUOTE|NRQUOTE|NRSTR|QUOTE|STR)\(.*?(?:[^%]\))/i,
      lookbehind: !0,
      inside: {
        function: {
          pattern: /%(?:BQUOTE|NRBQUOTE|NRQUOTE|NRSTR|QUOTE|STR)/i,
          alias: 'keyword',
        },
        'macro-keyword': r,
        'macro-variable': i,
        'escaped-char': {
          pattern: /%['"()<>=¬^~;,#]/,
        },
        punctuation: c,
      },
    },
    'macro-declaration': {
      pattern: /^%macro[^;]+(?=;)/im,
      inside: {
        keyword: /%macro/i,
      },
    },
    'macro-end': {
      pattern: /^%mend[^;]+(?=;)/im,
      inside: {
        keyword: /%mend/i,
      },
    },
    macro: {
      pattern: /%_\w+(?=\()/,
      alias: 'keyword',
    },
    input: {
      pattern: /\binput\s[-\w\s/*.$&]+;/i,
      inside: {
        input: {
          alias: 'keyword',
          pattern: /^input/i,
        },
        comment: o,
        number: a,
        'numeric-constant': n,
      },
    },
    'options-args': {
      pattern: /(^options)[-'"|/\\<>*+=:()\w\s]*(?=;)/im,
      lookbehind: !0,
      inside: p,
    },
    'cas-actions': y,
    comment: o,
    function: d,
    format: u,
    altformat: m,
    'numeric-constant': n,
    datetime: {
      pattern: RegExp(t + '(?:dt?|t)'),
      alias: 'number',
    },
    string: l,
    step: s,
    keyword: S,
    'operator-keyword': {
      pattern: /\b(?:eq|ge|gt|in|le|lt|ne|not)\b/i,
      alias: 'operator',
    },
    number: a,
    operator: /\*\*?|\|\|?|!!?|¦¦?|<[>=]?|>[<=]?|[-+\/=&]|[~¬^]=?/,
    punctuation: c,
  };
})(Prism);
!(function (e) {
  (e.languages.sass = e.languages.extend('css', {
    comment: {
      pattern: /^([ \t]*)\/[\/*].*(?:(?:\r?\n|\r)\1[ \t].+)*/m,
      lookbehind: !0,
      greedy: !0,
    },
  })),
    e.languages.insertBefore('sass', 'atrule', {
      'atrule-line': {
        pattern: /^(?:[ \t]*)[@+=].+/m,
        greedy: !0,
        inside: {
          atrule: /(?:@[\w-]+|[+=])/,
        },
      },
    }),
    delete e.languages.sass.atrule;
  var r = /\$[-\w]+|#\{\$[-\w]+\}/,
    t = [
      /[+*\/%]|[=!]=|<=?|>=?|\b(?:and|not|or)\b/,
      {
        pattern: /(\s)-(?=\s)/,
        lookbehind: !0,
      },
    ];
  e.languages.insertBefore('sass', 'property', {
    'variable-line': {
      pattern: /^[ \t]*\$.+/m,
      greedy: !0,
      inside: {
        punctuation: /:/,
        variable: r,
        operator: t,
      },
    },
    'property-line': {
      pattern: /^[ \t]*(?:[^:\s]+ *:.*|:[^:\s].*)/m,
      greedy: !0,
      inside: {
        property: [
          /[^:\s]+(?=\s*:)/,
          {
            pattern: /(:)[^:\s]+/,
            lookbehind: !0,
          },
        ],
        punctuation: /:/,
        variable: r,
        operator: t,
        important: e.languages.sass.important,
      },
    },
  }),
    delete e.languages.sass.property,
    delete e.languages.sass.important,
    e.languages.insertBefore('sass', 'punctuation', {
      selector: {
        pattern:
          /^([ \t]*)\S(?:,[^,\r\n]+|[^,\r\n]*)(?:,[^,\r\n]+)*(?:,(?:\r?\n|\r)\1[ \t]+\S(?:,[^,\r\n]+|[^,\r\n]*)(?:,[^,\r\n]+)*)*/m,
        lookbehind: !0,
        greedy: !0,
      },
    });
})(Prism);
(Prism.languages.scss = Prism.languages.extend('css', {
  comment: {
    pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/,
    lookbehind: !0,
  },
  atrule: {
    pattern: /@[\w-](?:\([^()]+\)|[^()\s]|\s+(?!\s))*?(?=\s+[{;])/,
    inside: {
      rule: /@[\w-]+/,
    },
  },
  url: /(?:[-a-z]+-)?url(?=\()/i,
  selector: {
    pattern:
      /(?=\S)[^@;{}()]?(?:[^@;{}()\s]|\s+(?!\s)|#\{\$[-\w]+\})+(?=\s*\{(?:\}|\s|[^}][^:{}]*[:{][^}]))/,
    inside: {
      parent: {
        pattern: /&/,
        alias: 'important',
      },
      placeholder: /%[-\w]+/,
      variable: /\$[-\w]+|#\{\$[-\w]+\}/,
    },
  },
  property: {
    pattern: /(?:[-\w]|\$[-\w]|#\{\$[-\w]+\})+(?=\s*:)/,
    inside: {
      variable: /\$[-\w]+|#\{\$[-\w]+\}/,
    },
  },
})),
  Prism.languages.insertBefore('scss', 'atrule', {
    keyword: [
      /@(?:content|debug|each|else(?: if)?|extend|for|forward|function|if|import|include|mixin|return|use|warn|while)\b/i,
      {
        pattern: /( )(?:from|through)(?= )/,
        lookbehind: !0,
      },
    ],
  }),
  Prism.languages.insertBefore('scss', 'important', {
    variable: /\$[-\w]+|#\{\$[-\w]+\}/,
  }),
  Prism.languages.insertBefore('scss', 'function', {
    'module-modifier': {
      pattern: /\b(?:as|hide|show|with)\b/i,
      alias: 'keyword',
    },
    placeholder: {
      pattern: /%[-\w]+/,
      alias: 'selector',
    },
    statement: {
      pattern: /\B!(?:default|optional)\b/i,
      alias: 'keyword',
    },
    boolean: /\b(?:false|true)\b/,
    null: {
      pattern: /\bnull\b/,
      alias: 'keyword',
    },
    operator: {
      pattern: /(\s)(?:[-+*\/%]|[=!]=|<=?|>=?|and|not|or)(?=\s)/,
      lookbehind: !0,
    },
  }),
  (Prism.languages.scss.atrule.inside.rest = Prism.languages.scss);
(Prism.languages.scala = Prism.languages.extend('java', {
  'triple-quoted-string': {
    pattern: /"""[\s\S]*?"""/,
    greedy: !0,
    alias: 'string',
  },
  string: {
    pattern: /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/,
    greedy: !0,
  },
  keyword:
    /<-|=>|\b(?:abstract|case|catch|class|def|derives|do|else|enum|extends|extension|final|finally|for|forSome|given|if|implicit|import|infix|inline|lazy|match|new|null|object|opaque|open|override|package|private|protected|return|sealed|self|super|this|throw|trait|transparent|try|type|using|val|var|while|with|yield)\b/,
  number:
    /\b0x(?:[\da-f]*\.)?[\da-f]+|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e\d+)?[dfl]?/i,
  builtin:
    /\b(?:Any|AnyRef|AnyVal|Boolean|Byte|Char|Double|Float|Int|Long|Nothing|Short|String|Unit)\b/,
  symbol: /'[^\d\s\\]\w*/,
})),
  Prism.languages.insertBefore('scala', 'triple-quoted-string', {
    'string-interpolation': {
      pattern:
        /\b[a-z]\w*(?:"""(?:[^$]|\$(?:[^{]|\{(?:[^{}]|\{[^{}]*\})*\}))*?"""|"(?:[^$"\r\n]|\$(?:[^{]|\{(?:[^{}]|\{[^{}]*\})*\}))*")/i,
      greedy: !0,
      inside: {
        id: {
          pattern: /^\w+/,
          greedy: !0,
          alias: 'function',
        },
        escape: {
          pattern: /\\\$"|\$[$"]/,
          greedy: !0,
          alias: 'symbol',
        },
        interpolation: {
          pattern: /\$(?:\w+|\{(?:[^{}]|\{[^{}]*\})*\})/,
          greedy: !0,
          inside: {
            punctuation: /^\$\{?|\}$/,
            expression: {
              pattern: /[\s\S]+/,
              inside: Prism.languages.scala,
            },
          },
        },
        string: /[\s\S]+/,
      },
    },
  }),
  delete Prism.languages.scala['class-name'],
  delete Prism.languages.scala.function,
  delete Prism.languages.scala.constant;
!(function (s) {
  var n = [
    '"(?:\\\\[^]|\\$\\([^)]+\\)|\\$(?!\\()|`[^`]+`|[^"\\\\`$])*"',
    "'[^']*'",
    "\\$'(?:[^'\\\\]|\\\\[^])*'",
    '<<-?\\s*(["\']?)(\\w+)\\1\\s[^]*?[\r\n]\\2',
  ].join('|');
  (s.languages['shell-session'] = {
    command: {
      pattern: RegExp(
        '^(?:[^\\s@:$#%*!/\\\\]+@[^\r\n@:$#%*!/\\\\]+(?::[^\0-\\x1F$#%*?"<>:;|]+)?|[/~.][^\0-\\x1F$#%*?"<>@:;|]*)?[$#%](?=\\s)' +
          "(?:[^\\\\\r\n \t'\"<$]|[ \t](?:(?!#)|#.*$)|\\\\(?:[^\r]|\r\n?)|\\$(?!')|<(?!<)|<<str>>)+".replace(
            /<<str>>/g,
            function () {
              return n;
            },
          ),
        'm',
      ),
      greedy: !0,
      inside: {
        info: {
          pattern: /^[^#$%]+/,
          alias: 'punctuation',
          inside: {
            user: /^[^\s@:$#%*!/\\]+@[^\r\n@:$#%*!/\\]+/,
            punctuation: /:/,
            path: /[\s\S]+/,
          },
        },
        bash: {
          pattern: /(^[$#%]\s*)\S[\s\S]*/,
          lookbehind: !0,
          alias: 'language-bash',
          inside: s.languages.bash,
        },
        'shell-symbol': {
          pattern: /^[$#%]/,
          alias: 'important',
        },
      },
    },
    output: /.(?:.*(?:[\r\n]|.$))*/,
  }),
    (s.languages['sh-session'] = s.languages.shellsession =
      s.languages['shell-session']);
})(Prism);
!(function (e) {
  var n =
    /\b(?:abstype|and|andalso|as|case|datatype|do|else|end|eqtype|exception|fn|fun|functor|handle|if|in|include|infix|infixr|let|local|nonfix|of|op|open|orelse|raise|rec|sharing|sig|signature|struct|structure|then|type|val|where|while|with|withtype)\b/i;
  (e.languages.sml = {
    comment:
      /\(\*(?:[^*(]|\*(?!\))|\((?!\*)|\(\*(?:[^*(]|\*(?!\))|\((?!\*))*\*\))*\*\)/,
    string: {
      pattern: /#?"(?:[^"\\]|\\.)*"/,
      greedy: !0,
    },
    'class-name': [
      {
        pattern: RegExp(
          '((?:^|[^:]):\\s*)<TERMINAL>(?:\\s*(?:(?:\\*|->)\\s*<TERMINAL>|,\\s*<TERMINAL>(?:(?=<NOT-LAST>)|(?!<NOT-LAST>)\\s+<LONG-ID>)))*'
            .replace(/<NOT-LAST>/g, function () {
              return '\\s*(?:[*,]|->)';
            })
            .replace(/<TERMINAL>/g, function () {
              return "(?:'[\\w']*|<LONG-ID>|\\((?:[^()]|\\([^()]*\\))*\\)|\\{(?:[^{}]|\\{[^{}]*\\})*\\})(?:\\s+<LONG-ID>)*";
            })
            .replace(/<LONG-ID>/g, function () {
              return "(?!<KEYWORD>)[a-z\\d_][\\w'.]*";
            })
            .replace(/<KEYWORD>/g, function () {
              return n.source;
            }),
          'i',
        ),
        lookbehind: !0,
        greedy: !0,
        inside: null,
      },
      {
        pattern:
          /((?:^|[^\w'])(?:datatype|exception|functor|signature|structure|type)\s+)[a-z_][\w'.]*/i,
        lookbehind: !0,
      },
    ],
    function: {
      pattern: /((?:^|[^\w'])fun\s+)[a-z_][\w'.]*/i,
      lookbehind: !0,
    },
    keyword: n,
    variable: {
      pattern: /(^|[^\w'])'[\w']*/,
      lookbehind: !0,
    },
    number: /~?\b(?:\d+(?:\.\d+)?(?:e~?\d+)?|0x[\da-f]+)\b/i,
    word: {
      pattern: /\b0w(?:\d+|x[\da-f]+)\b/i,
      alias: 'constant',
    },
    boolean: /\b(?:false|true)\b/i,
    operator: /\.\.\.|:[>=:]|=>?|->|[<>]=?|[!+\-*/^#|@~]/,
    punctuation: /[(){}\[\].:,;]/,
  }),
    (e.languages.sml['class-name'][0].inside = e.languages.sml),
    (e.languages.smlnj = e.languages.sml);
})(Prism);
(Prism.languages.sqf = Prism.languages.extend('clike', {
  string: {
    pattern: /"(?:(?:"")?[^"])*"(?!")|'(?:[^'])*'/,
    greedy: !0,
  },
  keyword:
    /\b(?:breakOut|breakTo|call|case|catch|default|do|echo|else|execFSM|execVM|exitWith|for|forEach|forEachMember|forEachMemberAgent|forEachMemberTeam|from|goto|if|nil|preprocessFile|preprocessFileLineNumbers|private|scopeName|spawn|step|switch|then|throw|to|try|while|with)\b/i,
  boolean: /\b(?:false|true)\b/i,
  function:
    /\b(?:abs|accTime|acos|action|actionIDs|actionKeys|actionKeysImages|actionKeysNames|actionKeysNamesArray|actionName|actionParams|activateAddons|activatedAddons|activateKey|add3DENConnection|add3DENEventHandler|add3DENLayer|addAction|addBackpack|addBackpackCargo|addBackpackCargoGlobal|addBackpackGlobal|addCamShake|addCuratorAddons|addCuratorCameraArea|addCuratorEditableObjects|addCuratorEditingArea|addCuratorPoints|addEditorObject|addEventHandler|addForce|addForceGeneratorRTD|addGoggles|addGroupIcon|addHandgunItem|addHeadgear|addItem|addItemCargo|addItemCargoGlobal|addItemPool|addItemToBackpack|addItemToUniform|addItemToVest|addLiveStats|addMagazine|addMagazineAmmoCargo|addMagazineCargo|addMagazineCargoGlobal|addMagazineGlobal|addMagazinePool|addMagazines|addMagazineTurret|addMenu|addMenuItem|addMissionEventHandler|addMPEventHandler|addMusicEventHandler|addOwnedMine|addPlayerScores|addPrimaryWeaponItem|addPublicVariableEventHandler|addRating|addResources|addScore|addScoreSide|addSecondaryWeaponItem|addSwitchableUnit|addTeamMember|addToRemainsCollector|addTorque|addUniform|addVehicle|addVest|addWaypoint|addWeapon|addWeaponCargo|addWeaponCargoGlobal|addWeaponGlobal|addWeaponItem|addWeaponPool|addWeaponTurret|admin|agent|agents|AGLToASL|aimedAtTarget|aimPos|airDensityCurveRTD|airDensityRTD|airplaneThrottle|airportSide|AISFinishHeal|alive|all3DENEntities|allAirports|allControls|allCurators|allCutLayers|allDead|allDeadMen|allDisplays|allGroups|allMapMarkers|allMines|allMissionObjects|allow3DMode|allowCrewInImmobile|allowCuratorLogicIgnoreAreas|allowDamage|allowDammage|allowFileOperations|allowFleeing|allowGetIn|allowSprint|allPlayers|allSimpleObjects|allSites|allTurrets|allUnits|allUnitsUAV|allVariables|ammo|ammoOnPylon|animate|animateBay|animateDoor|animatePylon|animateSource|animationNames|animationPhase|animationSourcePhase|animationState|append|apply|armoryPoints|arrayIntersect|asin|ASLToAGL|ASLToATL|assert|assignAsCargo|assignAsCargoIndex|assignAsCommander|assignAsDriver|assignAsGunner|assignAsTurret|assignCurator|assignedCargo|assignedCommander|assignedDriver|assignedGunner|assignedItems|assignedTarget|assignedTeam|assignedVehicle|assignedVehicleRole|assignItem|assignTeam|assignToAirport|atan|atan2|atg|ATLToASL|attachedObject|attachedObjects|attachedTo|attachObject|attachTo|attackEnabled|backpack|backpackCargo|backpackContainer|backpackItems|backpackMagazines|backpackSpaceFor|behaviour|benchmark|binocular|blufor|boundingBox|boundingBoxReal|boundingCenter|briefingName|buildingExit|buildingPos|buldozer_EnableRoadDiag|buldozer_IsEnabledRoadDiag|buldozer_LoadNewRoads|buldozer_reloadOperMap|buttonAction|buttonSetAction|cadetMode|callExtension|camCommand|camCommit|camCommitPrepared|camCommitted|camConstuctionSetParams|camCreate|camDestroy|cameraEffect|cameraEffectEnableHUD|cameraInterest|cameraOn|cameraView|campaignConfigFile|camPreload|camPreloaded|camPrepareBank|camPrepareDir|camPrepareDive|camPrepareFocus|camPrepareFov|camPrepareFovRange|camPreparePos|camPrepareRelPos|camPrepareTarget|camSetBank|camSetDir|camSetDive|camSetFocus|camSetFov|camSetFovRange|camSetPos|camSetRelPos|camSetTarget|camTarget|camUseNVG|canAdd|canAddItemToBackpack|canAddItemToUniform|canAddItemToVest|cancelSimpleTaskDestination|canFire|canMove|canSlingLoad|canStand|canSuspend|canTriggerDynamicSimulation|canUnloadInCombat|canVehicleCargo|captive|captiveNum|cbChecked|cbSetChecked|ceil|channelEnabled|cheatsEnabled|checkAIFeature|checkVisibility|civilian|className|clear3DENAttribute|clear3DENInventory|clearAllItemsFromBackpack|clearBackpackCargo|clearBackpackCargoGlobal|clearForcesRTD|clearGroupIcons|clearItemCargo|clearItemCargoGlobal|clearItemPool|clearMagazineCargo|clearMagazineCargoGlobal|clearMagazinePool|clearOverlay|clearRadio|clearVehicleInit|clearWeaponCargo|clearWeaponCargoGlobal|clearWeaponPool|clientOwner|closeDialog|closeDisplay|closeOverlay|collapseObjectTree|collect3DENHistory|collectiveRTD|combatMode|commandArtilleryFire|commandChat|commander|commandFire|commandFollow|commandFSM|commandGetOut|commandingMenu|commandMove|commandRadio|commandStop|commandSuppressiveFire|commandTarget|commandWatch|comment|commitOverlay|compile|compileFinal|completedFSM|composeText|configClasses|configFile|configHierarchy|configName|configNull|configProperties|configSourceAddonList|configSourceMod|configSourceModList|confirmSensorTarget|connectTerminalToUAV|controlNull|controlsGroupCtrl|copyFromClipboard|copyToClipboard|copyWaypoints|cos|count|countEnemy|countFriendly|countSide|countType|countUnknown|create3DENComposition|create3DENEntity|createAgent|createCenter|createDialog|createDiaryLink|createDiaryRecord|createDiarySubject|createDisplay|createGearDialog|createGroup|createGuardedPoint|createLocation|createMarker|createMarkerLocal|createMenu|createMine|createMissionDisplay|createMPCampaignDisplay|createSimpleObject|createSimpleTask|createSite|createSoundSource|createTask|createTeam|createTrigger|createUnit|createVehicle|createVehicleCrew|createVehicleLocal|crew|ctAddHeader|ctAddRow|ctClear|ctCurSel|ctData|ctFindHeaderRows|ctFindRowHeader|ctHeaderControls|ctHeaderCount|ctRemoveHeaders|ctRemoveRows|ctrlActivate|ctrlAddEventHandler|ctrlAngle|ctrlAutoScrollDelay|ctrlAutoScrollRewind|ctrlAutoScrollSpeed|ctrlChecked|ctrlClassName|ctrlCommit|ctrlCommitted|ctrlCreate|ctrlDelete|ctrlEnable|ctrlEnabled|ctrlFade|ctrlHTMLLoaded|ctrlIDC|ctrlIDD|ctrlMapAnimAdd|ctrlMapAnimClear|ctrlMapAnimCommit|ctrlMapAnimDone|ctrlMapCursor|ctrlMapMouseOver|ctrlMapScale|ctrlMapScreenToWorld|ctrlMapWorldToScreen|ctrlModel|ctrlModelDirAndUp|ctrlModelScale|ctrlParent|ctrlParentControlsGroup|ctrlPosition|ctrlRemoveAllEventHandlers|ctrlRemoveEventHandler|ctrlScale|ctrlSetActiveColor|ctrlSetAngle|ctrlSetAutoScrollDelay|ctrlSetAutoScrollRewind|ctrlSetAutoScrollSpeed|ctrlSetBackgroundColor|ctrlSetChecked|ctrlSetDisabledColor|ctrlSetEventHandler|ctrlSetFade|ctrlSetFocus|ctrlSetFont|ctrlSetFontH1|ctrlSetFontH1B|ctrlSetFontH2|ctrlSetFontH2B|ctrlSetFontH3|ctrlSetFontH3B|ctrlSetFontH4|ctrlSetFontH4B|ctrlSetFontH5|ctrlSetFontH5B|ctrlSetFontH6|ctrlSetFontH6B|ctrlSetFontHeight|ctrlSetFontHeightH1|ctrlSetFontHeightH2|ctrlSetFontHeightH3|ctrlSetFontHeightH4|ctrlSetFontHeightH5|ctrlSetFontHeightH6|ctrlSetFontHeightSecondary|ctrlSetFontP|ctrlSetFontPB|ctrlSetFontSecondary|ctrlSetForegroundColor|ctrlSetModel|ctrlSetModelDirAndUp|ctrlSetModelScale|ctrlSetPixelPrecision|ctrlSetPosition|ctrlSetScale|ctrlSetStructuredText|ctrlSetText|ctrlSetTextColor|ctrlSetTextColorSecondary|ctrlSetTextSecondary|ctrlSetTooltip|ctrlSetTooltipColorBox|ctrlSetTooltipColorShade|ctrlSetTooltipColorText|ctrlShow|ctrlShown|ctrlText|ctrlTextHeight|ctrlTextSecondary|ctrlTextWidth|ctrlType|ctrlVisible|ctRowControls|ctRowCount|ctSetCurSel|ctSetData|ctSetHeaderTemplate|ctSetRowTemplate|ctSetValue|ctValue|curatorAddons|curatorCamera|curatorCameraArea|curatorCameraAreaCeiling|curatorCoef|curatorEditableObjects|curatorEditingArea|curatorEditingAreaType|curatorMouseOver|curatorPoints|curatorRegisteredObjects|curatorSelected|curatorWaypointCost|current3DENOperation|currentChannel|currentCommand|currentMagazine|currentMagazineDetail|currentMagazineDetailTurret|currentMagazineTurret|currentMuzzle|currentNamespace|currentTask|currentTasks|currentThrowable|currentVisionMode|currentWaypoint|currentWeapon|currentWeaponMode|currentWeaponTurret|currentZeroing|cursorObject|cursorTarget|customChat|customRadio|cutFadeOut|cutObj|cutRsc|cutText|damage|date|dateToNumber|daytime|deActivateKey|debriefingText|debugFSM|debugLog|deg|delete3DENEntities|deleteAt|deleteCenter|deleteCollection|deleteEditorObject|deleteGroup|deleteGroupWhenEmpty|deleteIdentity|deleteLocation|deleteMarker|deleteMarkerLocal|deleteRange|deleteResources|deleteSite|deleteStatus|deleteTeam|deleteVehicle|deleteVehicleCrew|deleteWaypoint|detach|detectedMines|diag_activeMissionFSMs|diag_activeScripts|diag_activeSQFScripts|diag_activeSQSScripts|diag_captureFrame|diag_captureFrameToFile|diag_captureSlowFrame|diag_codePerformance|diag_drawMode|diag_dynamicSimulationEnd|diag_enable|diag_enabled|diag_fps|diag_fpsMin|diag_frameNo|diag_lightNewLoad|diag_list|diag_log|diag_logSlowFrame|diag_mergeConfigFile|diag_recordTurretLimits|diag_setLightNew|diag_tickTime|diag_toggle|dialog|diarySubjectExists|didJIP|didJIPOwner|difficulty|difficultyEnabled|difficultyEnabledRTD|difficultyOption|direction|directSay|disableAI|disableCollisionWith|disableConversation|disableDebriefingStats|disableMapIndicators|disableNVGEquipment|disableRemoteSensors|disableSerialization|disableTIEquipment|disableUAVConnectability|disableUserInput|displayAddEventHandler|displayCtrl|displayNull|displayParent|displayRemoveAllEventHandlers|displayRemoveEventHandler|displaySetEventHandler|dissolveTeam|distance|distance2D|distanceSqr|distributionRegion|do3DENAction|doArtilleryFire|doFire|doFollow|doFSM|doGetOut|doMove|doorPhase|doStop|doSuppressiveFire|doTarget|doWatch|drawArrow|drawEllipse|drawIcon|drawIcon3D|drawLine|drawLine3D|drawLink|drawLocation|drawPolygon|drawRectangle|drawTriangle|driver|drop|dynamicSimulationDistance|dynamicSimulationDistanceCoef|dynamicSimulationEnabled|dynamicSimulationSystemEnabled|east|edit3DENMissionAttributes|editObject|editorSetEventHandler|effectiveCommander|emptyPositions|enableAI|enableAIFeature|enableAimPrecision|enableAttack|enableAudioFeature|enableAutoStartUpRTD|enableAutoTrimRTD|enableCamShake|enableCaustics|enableChannel|enableCollisionWith|enableCopilot|enableDebriefingStats|enableDiagLegend|enableDynamicSimulation|enableDynamicSimulationSystem|enableEndDialog|enableEngineArtillery|enableEnvironment|enableFatigue|enableGunLights|enableInfoPanelComponent|enableIRLasers|enableMimics|enablePersonTurret|enableRadio|enableReload|enableRopeAttach|enableSatNormalOnDetail|enableSaving|enableSentences|enableSimulation|enableSimulationGlobal|enableStamina|enableStressDamage|enableTeamSwitch|enableTraffic|enableUAVConnectability|enableUAVWaypoints|enableVehicleCargo|enableVehicleSensor|enableWeaponDisassembly|endl|endLoadingScreen|endMission|engineOn|enginesIsOnRTD|enginesPowerRTD|enginesRpmRTD|enginesTorqueRTD|entities|environmentEnabled|estimatedEndServerTime|estimatedTimeLeft|evalObjectArgument|everyBackpack|everyContainer|exec|execEditorScript|exp|expectedDestination|exportJIPMessages|eyeDirection|eyePos|face|faction|fadeMusic|fadeRadio|fadeSound|fadeSpeech|failMission|fillWeaponsFromPool|find|findCover|findDisplay|findEditorObject|findEmptyPosition|findEmptyPositionReady|findIf|findNearestEnemy|finishMissionInit|finite|fire|fireAtTarget|firstBackpack|flag|flagAnimationPhase|flagOwner|flagSide|flagTexture|fleeing|floor|flyInHeight|flyInHeightASL|fog|fogForecast|fogParams|forceAddUniform|forceAtPositionRTD|forcedMap|forceEnd|forceFlagTexture|forceFollowRoad|forceGeneratorRTD|forceMap|forceRespawn|forceSpeed|forceWalk|forceWeaponFire|forceWeatherChange|forgetTarget|format|formation|formationDirection|formationLeader|formationMembers|formationPosition|formationTask|formatText|formLeader|freeLook|fromEditor|fuel|fullCrew|gearIDCAmmoCount|gearSlotAmmoCount|gearSlotData|get3DENActionState|get3DENAttribute|get3DENCamera|get3DENConnections|get3DENEntity|get3DENEntityID|get3DENGrid|get3DENIconsVisible|get3DENLayerEntities|get3DENLinesVisible|get3DENMissionAttribute|get3DENMouseOver|get3DENSelected|getAimingCoef|getAllEnvSoundControllers|getAllHitPointsDamage|getAllOwnedMines|getAllSoundControllers|getAmmoCargo|getAnimAimPrecision|getAnimSpeedCoef|getArray|getArtilleryAmmo|getArtilleryComputerSettings|getArtilleryETA|getAssignedCuratorLogic|getAssignedCuratorUnit|getBackpackCargo|getBleedingRemaining|getBurningValue|getCameraViewDirection|getCargoIndex|getCenterOfMass|getClientState|getClientStateNumber|getCompatiblePylonMagazines|getConnectedUAV|getContainerMaxLoad|getCursorObjectParams|getCustomAimCoef|getDammage|getDescription|getDir|getDirVisual|getDLCAssetsUsage|getDLCAssetsUsageByName|getDLCs|getDLCUsageTime|getEditorCamera|getEditorMode|getEditorObjectScope|getElevationOffset|getEngineTargetRpmRTD|getEnvSoundController|getFatigue|getFieldManualStartPage|getForcedFlagTexture|getFriend|getFSMVariable|getFuelCargo|getGroupIcon|getGroupIconParams|getGroupIcons|getHideFrom|getHit|getHitIndex|getHitPointDamage|getItemCargo|getMagazineCargo|getMarkerColor|getMarkerPos|getMarkerSize|getMarkerType|getMass|getMissionConfig|getMissionConfigValue|getMissionDLCs|getMissionLayerEntities|getMissionLayers|getModelInfo|getMousePosition|getMusicPlayedTime|getNumber|getObjectArgument|getObjectChildren|getObjectDLC|getObjectMaterials|getObjectProxy|getObjectTextures|getObjectType|getObjectViewDistance|getOxygenRemaining|getPersonUsedDLCs|getPilotCameraDirection|getPilotCameraPosition|getPilotCameraRotation|getPilotCameraTarget|getPlateNumber|getPlayerChannel|getPlayerScores|getPlayerUID|getPlayerUIDOld|getPos|getPosASL|getPosASLVisual|getPosASLW|getPosATL|getPosATLVisual|getPosVisual|getPosWorld|getPylonMagazines|getRelDir|getRelPos|getRemoteSensorsDisabled|getRepairCargo|getResolution|getRotorBrakeRTD|getShadowDistance|getShotParents|getSlingLoad|getSoundController|getSoundControllerResult|getSpeed|getStamina|getStatValue|getSuppression|getTerrainGrid|getTerrainHeightASL|getText|getTotalDLCUsageTime|getTrimOffsetRTD|getUnitLoadout|getUnitTrait|getUserMFDText|getUserMFDValue|getVariable|getVehicleCargo|getWeaponCargo|getWeaponSway|getWingsOrientationRTD|getWingsPositionRTD|getWPPos|glanceAt|globalChat|globalRadio|goggles|group|groupChat|groupFromNetId|groupIconSelectable|groupIconsVisible|groupId|groupOwner|groupRadio|groupSelectedUnits|groupSelectUnit|grpNull|gunner|gusts|halt|handgunItems|handgunMagazine|handgunWeapon|handsHit|hasInterface|hasPilotCamera|hasWeapon|hcAllGroups|hcGroupParams|hcLeader|hcRemoveAllGroups|hcRemoveGroup|hcSelected|hcSelectGroup|hcSetGroup|hcShowBar|hcShownBar|headgear|hideBody|hideObject|hideObjectGlobal|hideSelection|hint|hintC|hintCadet|hintSilent|hmd|hostMission|htmlLoad|HUDMovementLevels|humidity|image|importAllGroups|importance|in|inArea|inAreaArray|incapacitatedState|independent|inflame|inflamed|infoPanel|infoPanelComponentEnabled|infoPanelComponents|infoPanels|inGameUISetEventHandler|inheritsFrom|initAmbientLife|inPolygon|inputAction|inRangeOfArtillery|insertEditorObject|intersect|is3DEN|is3DENMultiplayer|isAbleToBreathe|isAgent|isAimPrecisionEnabled|isArray|isAutoHoverOn|isAutonomous|isAutoStartUpEnabledRTD|isAutotest|isAutoTrimOnRTD|isBleeding|isBurning|isClass|isCollisionLightOn|isCopilotEnabled|isDamageAllowed|isDedicated|isDLCAvailable|isEngineOn|isEqualTo|isEqualType|isEqualTypeAll|isEqualTypeAny|isEqualTypeArray|isEqualTypeParams|isFilePatchingEnabled|isFlashlightOn|isFlatEmpty|isForcedWalk|isFormationLeader|isGroupDeletedWhenEmpty|isHidden|isInRemainsCollector|isInstructorFigureEnabled|isIRLaserOn|isKeyActive|isKindOf|isLaserOn|isLightOn|isLocalized|isManualFire|isMarkedForCollection|isMultiplayer|isMultiplayerSolo|isNil|isNull|isNumber|isObjectHidden|isObjectRTD|isOnRoad|isPipEnabled|isPlayer|isRealTime|isRemoteExecuted|isRemoteExecutedJIP|isServer|isShowing3DIcons|isSimpleObject|isSprintAllowed|isStaminaEnabled|isSteamMission|isStreamFriendlyUIEnabled|isStressDamageEnabled|isText|isTouchingGround|isTurnedOut|isTutHintsEnabled|isUAVConnectable|isUAVConnected|isUIContext|isUniformAllowed|isVehicleCargo|isVehicleRadarOn|isVehicleSensorEnabled|isWalking|isWeaponDeployed|isWeaponRested|itemCargo|items|itemsWithMagazines|join|joinAs|joinAsSilent|joinSilent|joinString|kbAddDatabase|kbAddDatabaseTargets|kbAddTopic|kbHasTopic|kbReact|kbRemoveTopic|kbTell|kbWasSaid|keyImage|keyName|knowsAbout|land|landAt|landResult|language|laserTarget|lbAdd|lbClear|lbColor|lbColorRight|lbCurSel|lbData|lbDelete|lbIsSelected|lbPicture|lbPictureRight|lbSelection|lbSetColor|lbSetColorRight|lbSetCurSel|lbSetData|lbSetPicture|lbSetPictureColor|lbSetPictureColorDisabled|lbSetPictureColorSelected|lbSetPictureRight|lbSetPictureRightColor|lbSetPictureRightColorDisabled|lbSetPictureRightColorSelected|lbSetSelectColor|lbSetSelectColorRight|lbSetSelected|lbSetText|lbSetTextRight|lbSetTooltip|lbSetValue|lbSize|lbSort|lbSortByValue|lbText|lbTextRight|lbValue|leader|leaderboardDeInit|leaderboardGetRows|leaderboardInit|leaderboardRequestRowsFriends|leaderboardRequestRowsGlobal|leaderboardRequestRowsGlobalAroundUser|leaderboardsRequestUploadScore|leaderboardsRequestUploadScoreKeepBest|leaderboardState|leaveVehicle|libraryCredits|libraryDisclaimers|lifeState|lightAttachObject|lightDetachObject|lightIsOn|lightnings|limitSpeed|linearConversion|lineBreak|lineIntersects|lineIntersectsObjs|lineIntersectsSurfaces|lineIntersectsWith|linkItem|list|listObjects|listRemoteTargets|listVehicleSensors|ln|lnbAddArray|lnbAddColumn|lnbAddRow|lnbClear|lnbColor|lnbColorRight|lnbCurSelRow|lnbData|lnbDeleteColumn|lnbDeleteRow|lnbGetColumnsPosition|lnbPicture|lnbPictureRight|lnbSetColor|lnbSetColorRight|lnbSetColumnsPos|lnbSetCurSelRow|lnbSetData|lnbSetPicture|lnbSetPictureColor|lnbSetPictureColorRight|lnbSetPictureColorSelected|lnbSetPictureColorSelectedRight|lnbSetPictureRight|lnbSetText|lnbSetTextRight|lnbSetValue|lnbSize|lnbSort|lnbSortByValue|lnbText|lnbTextRight|lnbValue|load|loadAbs|loadBackpack|loadFile|loadGame|loadIdentity|loadMagazine|loadOverlay|loadStatus|loadUniform|loadVest|local|localize|locationNull|locationPosition|lock|lockCameraTo|lockCargo|lockDriver|locked|lockedCargo|lockedDriver|lockedTurret|lockIdentity|lockTurret|lockWP|log|logEntities|logNetwork|logNetworkTerminate|lookAt|lookAtPos|magazineCargo|magazines|magazinesAllTurrets|magazinesAmmo|magazinesAmmoCargo|magazinesAmmoFull|magazinesDetail|magazinesDetailBackpack|magazinesDetailUniform|magazinesDetailVest|magazinesTurret|magazineTurretAmmo|mapAnimAdd|mapAnimClear|mapAnimCommit|mapAnimDone|mapCenterOnCamera|mapGridPosition|markAsFinishedOnSteam|markerAlpha|markerBrush|markerColor|markerDir|markerPos|markerShape|markerSize|markerText|markerType|max|members|menuAction|menuAdd|menuChecked|menuClear|menuCollapse|menuData|menuDelete|menuEnable|menuEnabled|menuExpand|menuHover|menuPicture|menuSetAction|menuSetCheck|menuSetData|menuSetPicture|menuSetValue|menuShortcut|menuShortcutText|menuSize|menuSort|menuText|menuURL|menuValue|min|mineActive|mineDetectedBy|missionConfigFile|missionDifficulty|missionName|missionNamespace|missionStart|missionVersion|modelToWorld|modelToWorldVisual|modelToWorldVisualWorld|modelToWorldWorld|modParams|moonIntensity|moonPhase|morale|move|move3DENCamera|moveInAny|moveInCargo|moveInCommander|moveInDriver|moveInGunner|moveInTurret|moveObjectToEnd|moveOut|moveTime|moveTo|moveToCompleted|moveToFailed|musicVolume|name|nameSound|nearEntities|nearestBuilding|nearestLocation|nearestLocations|nearestLocationWithDubbing|nearestObject|nearestObjects|nearestTerrainObjects|nearObjects|nearObjectsReady|nearRoads|nearSupplies|nearTargets|needReload|netId|netObjNull|newOverlay|nextMenuItemIndex|nextWeatherChange|nMenuItems|numberOfEnginesRTD|numberToDate|objectCurators|objectFromNetId|objectParent|objNull|objStatus|onBriefingGear|onBriefingGroup|onBriefingNotes|onBriefingPlan|onBriefingTeamSwitch|onCommandModeChanged|onDoubleClick|onEachFrame|onGroupIconClick|onGroupIconOverEnter|onGroupIconOverLeave|onHCGroupSelectionChanged|onMapSingleClick|onPlayerConnected|onPlayerDisconnected|onPreloadFinished|onPreloadStarted|onShowNewObject|onTeamSwitch|openCuratorInterface|openDLCPage|openDSInterface|openMap|openSteamApp|openYoutubeVideo|opfor|orderGetIn|overcast|overcastForecast|owner|param|params|parseNumber|parseSimpleArray|parseText|parsingNamespace|particlesQuality|pi|pickWeaponPool|pitch|pixelGrid|pixelGridBase|pixelGridNoUIScale|pixelH|pixelW|playableSlotsNumber|playableUnits|playAction|playActionNow|player|playerRespawnTime|playerSide|playersNumber|playGesture|playMission|playMove|playMoveNow|playMusic|playScriptedMission|playSound|playSound3D|position|positionCameraToWorld|posScreenToWorld|posWorldToScreen|ppEffectAdjust|ppEffectCommit|ppEffectCommitted|ppEffectCreate|ppEffectDestroy|ppEffectEnable|ppEffectEnabled|ppEffectForceInNVG|precision|preloadCamera|preloadObject|preloadSound|preloadTitleObj|preloadTitleRsc|primaryWeapon|primaryWeaponItems|primaryWeaponMagazine|priority|processDiaryLink|processInitCommands|productVersion|profileName|profileNamespace|profileNameSteam|progressLoadingScreen|progressPosition|progressSetPosition|publicVariable|publicVariableClient|publicVariableServer|pushBack|pushBackUnique|putWeaponPool|queryItemsPool|queryMagazinePool|queryWeaponPool|rad|radioChannelAdd|radioChannelCreate|radioChannelRemove|radioChannelSetCallSign|radioChannelSetLabel|radioVolume|rain|rainbow|random|rank|rankId|rating|rectangular|registeredTasks|registerTask|reload|reloadEnabled|remoteControl|remoteExec|remoteExecCall|remoteExecutedOwner|remove3DENConnection|remove3DENEventHandler|remove3DENLayer|removeAction|removeAll3DENEventHandlers|removeAllActions|removeAllAssignedItems|removeAllContainers|removeAllCuratorAddons|removeAllCuratorCameraAreas|removeAllCuratorEditingAreas|removeAllEventHandlers|removeAllHandgunItems|removeAllItems|removeAllItemsWithMagazines|removeAllMissionEventHandlers|removeAllMPEventHandlers|removeAllMusicEventHandlers|removeAllOwnedMines|removeAllPrimaryWeaponItems|removeAllWeapons|removeBackpack|removeBackpackGlobal|removeCuratorAddons|removeCuratorCameraArea|removeCuratorEditableObjects|removeCuratorEditingArea|removeDrawIcon|removeDrawLinks|removeEventHandler|removeFromRemainsCollector|removeGoggles|removeGroupIcon|removeHandgunItem|removeHeadgear|removeItem|removeItemFromBackpack|removeItemFromUniform|removeItemFromVest|removeItems|removeMagazine|removeMagazineGlobal|removeMagazines|removeMagazinesTurret|removeMagazineTurret|removeMenuItem|removeMissionEventHandler|removeMPEventHandler|removeMusicEventHandler|removeOwnedMine|removePrimaryWeaponItem|removeSecondaryWeaponItem|removeSimpleTask|removeSwitchableUnit|removeTeamMember|removeUniform|removeVest|removeWeapon|removeWeaponAttachmentCargo|removeWeaponCargo|removeWeaponGlobal|removeWeaponTurret|reportRemoteTarget|requiredVersion|resetCamShake|resetSubgroupDirection|resistance|resize|resources|respawnVehicle|restartEditorCamera|reveal|revealMine|reverse|reversedMouseY|roadAt|roadsConnectedTo|roleDescription|ropeAttachedObjects|ropeAttachedTo|ropeAttachEnabled|ropeAttachTo|ropeCreate|ropeCut|ropeDestroy|ropeDetach|ropeEndPosition|ropeLength|ropes|ropeUnwind|ropeUnwound|rotorsForcesRTD|rotorsRpmRTD|round|runInitScript|safeZoneH|safeZoneW|safeZoneWAbs|safeZoneX|safeZoneXAbs|safeZoneY|save3DENInventory|saveGame|saveIdentity|saveJoysticks|saveOverlay|saveProfileNamespace|saveStatus|saveVar|savingEnabled|say|say2D|say3D|score|scoreSide|screenshot|screenToWorld|scriptDone|scriptName|scriptNull|scudState|secondaryWeapon|secondaryWeaponItems|secondaryWeaponMagazine|select|selectBestPlaces|selectDiarySubject|selectedEditorObjects|selectEditorObject|selectionNames|selectionPosition|selectLeader|selectMax|selectMin|selectNoPlayer|selectPlayer|selectRandom|selectRandomWeighted|selectWeapon|selectWeaponTurret|sendAUMessage|sendSimpleCommand|sendTask|sendTaskResult|sendUDPMessage|serverCommand|serverCommandAvailable|serverCommandExecutable|serverName|serverTime|set|set3DENAttribute|set3DENAttributes|set3DENGrid|set3DENIconsVisible|set3DENLayer|set3DENLinesVisible|set3DENLogicType|set3DENMissionAttribute|set3DENMissionAttributes|set3DENModelsVisible|set3DENObjectType|set3DENSelected|setAccTime|setActualCollectiveRTD|setAirplaneThrottle|setAirportSide|setAmmo|setAmmoCargo|setAmmoOnPylon|setAnimSpeedCoef|setAperture|setApertureNew|setArmoryPoints|setAttributes|setAutonomous|setBehaviour|setBleedingRemaining|setBrakesRTD|setCameraInterest|setCamShakeDefParams|setCamShakeParams|setCamUseTI|setCaptive|setCenterOfMass|setCollisionLight|setCombatMode|setCompassOscillation|setConvoySeparation|setCuratorCameraAreaCeiling|setCuratorCoef|setCuratorEditingAreaType|setCuratorWaypointCost|setCurrentChannel|setCurrentTask|setCurrentWaypoint|setCustomAimCoef|setCustomWeightRTD|setDamage|setDammage|setDate|setDebriefingText|setDefaultCamera|setDestination|setDetailMapBlendPars|setDir|setDirection|setDrawIcon|setDriveOnPath|setDropInterval|setDynamicSimulationDistance|setDynamicSimulationDistanceCoef|setEditorMode|setEditorObjectScope|setEffectCondition|setEngineRpmRTD|setFace|setFaceAnimation|setFatigue|setFeatureType|setFlagAnimationPhase|setFlagOwner|setFlagSide|setFlagTexture|setFog|setForceGeneratorRTD|setFormation|setFormationTask|setFormDir|setFriend|setFromEditor|setFSMVariable|setFuel|setFuelCargo|setGroupIcon|setGroupIconParams|setGroupIconsSelectable|setGroupIconsVisible|setGroupId|setGroupIdGlobal|setGroupOwner|setGusts|setHideBehind|setHit|setHitIndex|setHitPointDamage|setHorizonParallaxCoef|setHUDMovementLevels|setIdentity|setImportance|setInfoPanel|setLeader|setLightAmbient|setLightAttenuation|setLightBrightness|setLightColor|setLightDayLight|setLightFlareMaxDistance|setLightFlareSize|setLightIntensity|setLightnings|setLightUseFlare|setLocalWindParams|setMagazineTurretAmmo|setMarkerAlpha|setMarkerAlphaLocal|setMarkerBrush|setMarkerBrushLocal|setMarkerColor|setMarkerColorLocal|setMarkerDir|setMarkerDirLocal|setMarkerPos|setMarkerPosLocal|setMarkerShape|setMarkerShapeLocal|setMarkerSize|setMarkerSizeLocal|setMarkerText|setMarkerTextLocal|setMarkerType|setMarkerTypeLocal|setMass|setMimic|setMousePosition|setMusicEffect|setMusicEventHandler|setName|setNameSound|setObjectArguments|setObjectMaterial|setObjectMaterialGlobal|setObjectProxy|setObjectTexture|setObjectTextureGlobal|setObjectViewDistance|setOvercast|setOwner|setOxygenRemaining|setParticleCircle|setParticleClass|setParticleFire|setParticleParams|setParticleRandom|setPilotCameraDirection|setPilotCameraRotation|setPilotCameraTarget|setPilotLight|setPiPEffect|setPitch|setPlateNumber|setPlayable|setPlayerRespawnTime|setPos|setPosASL|setPosASL2|setPosASLW|setPosATL|setPosition|setPosWorld|setPylonLoadOut|setPylonsPriority|setRadioMsg|setRain|setRainbow|setRandomLip|setRank|setRectangular|setRepairCargo|setRotorBrakeRTD|setShadowDistance|setShotParents|setSide|setSimpleTaskAlwaysVisible|setSimpleTaskCustomData|setSimpleTaskDescription|setSimpleTaskDestination|setSimpleTaskTarget|setSimpleTaskType|setSimulWeatherLayers|setSize|setSkill|setSlingLoad|setSoundEffect|setSpeaker|setSpeech|setSpeedMode|setStamina|setStaminaScheme|setStatValue|setSuppression|setSystemOfUnits|setTargetAge|setTaskMarkerOffset|setTaskResult|setTaskState|setTerrainGrid|setText|setTimeMultiplier|setTitleEffect|setToneMapping|setToneMappingParams|setTrafficDensity|setTrafficDistance|setTrafficGap|setTrafficSpeed|setTriggerActivation|setTriggerArea|setTriggerStatements|setTriggerText|setTriggerTimeout|setTriggerType|setType|setUnconscious|setUnitAbility|setUnitLoadout|setUnitPos|setUnitPosWeak|setUnitRank|setUnitRecoilCoefficient|setUnitTrait|setUnloadInCombat|setUserActionText|setUserMFDText|setUserMFDValue|setVariable|setVectorDir|setVectorDirAndUp|setVectorUp|setVehicleAmmo|setVehicleAmmoDef|setVehicleArmor|setVehicleCargo|setVehicleId|setVehicleInit|setVehicleLock|setVehiclePosition|setVehicleRadar|setVehicleReceiveRemoteTargets|setVehicleReportOwnPosition|setVehicleReportRemoteTargets|setVehicleTIPars|setVehicleVarName|setVelocity|setVelocityModelSpace|setVelocityTransformation|setViewDistance|setVisibleIfTreeCollapsed|setWantedRpmRTD|setWaves|setWaypointBehaviour|setWaypointCombatMode|setWaypointCompletionRadius|setWaypointDescription|setWaypointForceBehaviour|setWaypointFormation|setWaypointHousePosition|setWaypointLoiterRadius|setWaypointLoiterType|setWaypointName|setWaypointPosition|setWaypointScript|setWaypointSpeed|setWaypointStatements|setWaypointTimeout|setWaypointType|setWaypointVisible|setWeaponReloadingTime|setWind|setWindDir|setWindForce|setWindStr|setWingForceScaleRTD|setWPPos|show3DIcons|showChat|showCinemaBorder|showCommandingMenu|showCompass|showCuratorCompass|showGPS|showHUD|showLegend|showMap|shownArtilleryComputer|shownChat|shownCompass|shownCuratorCompass|showNewEditorObject|shownGPS|shownHUD|shownMap|shownPad|shownRadio|shownScoretable|shownUAVFeed|shownWarrant|shownWatch|showPad|showRadio|showScoretable|showSubtitles|showUAVFeed|showWarrant|showWatch|showWaypoint|showWaypoints|side|sideAmbientLife|sideChat|sideEmpty|sideEnemy|sideFriendly|sideLogic|sideRadio|sideUnknown|simpleTasks|simulationEnabled|simulCloudDensity|simulCloudOcclusion|simulInClouds|simulWeatherSync|sin|size|sizeOf|skill|skillFinal|skipTime|sleep|sliderPosition|sliderRange|sliderSetPosition|sliderSetRange|sliderSetSpeed|sliderSpeed|slingLoadAssistantShown|soldierMagazines|someAmmo|sort|soundVolume|speaker|speed|speedMode|splitString|sqrt|squadParams|stance|startLoadingScreen|stop|stopEngineRTD|stopped|str|sunOrMoon|supportInfo|suppressFor|surfaceIsWater|surfaceNormal|surfaceType|swimInDepth|switchableUnits|switchAction|switchCamera|switchGesture|switchLight|switchMove|synchronizedObjects|synchronizedTriggers|synchronizedWaypoints|synchronizeObjectsAdd|synchronizeObjectsRemove|synchronizeTrigger|synchronizeWaypoint|systemChat|systemOfUnits|tan|targetKnowledge|targets|targetsAggregate|targetsQuery|taskAlwaysVisible|taskChildren|taskCompleted|taskCustomData|taskDescription|taskDestination|taskHint|taskMarkerOffset|taskNull|taskParent|taskResult|taskState|taskType|teamMember|teamMemberNull|teamName|teams|teamSwitch|teamSwitchEnabled|teamType|terminate|terrainIntersect|terrainIntersectASL|terrainIntersectAtASL|text|textLog|textLogFormat|tg|time|timeMultiplier|titleCut|titleFadeOut|titleObj|titleRsc|titleText|toArray|toFixed|toLower|toString|toUpper|triggerActivated|triggerActivation|triggerArea|triggerAttachedVehicle|triggerAttachObject|triggerAttachVehicle|triggerDynamicSimulation|triggerStatements|triggerText|triggerTimeout|triggerTimeoutCurrent|triggerType|turretLocal|turretOwner|turretUnit|tvAdd|tvClear|tvCollapse|tvCollapseAll|tvCount|tvCurSel|tvData|tvDelete|tvExpand|tvExpandAll|tvPicture|tvPictureRight|tvSetColor|tvSetCurSel|tvSetData|tvSetPicture|tvSetPictureColor|tvSetPictureColorDisabled|tvSetPictureColorSelected|tvSetPictureRight|tvSetPictureRightColor|tvSetPictureRightColorDisabled|tvSetPictureRightColorSelected|tvSetSelectColor|tvSetText|tvSetTooltip|tvSetValue|tvSort|tvSortByValue|tvText|tvTooltip|tvValue|type|typeName|typeOf|UAVControl|uiNamespace|uiSleep|unassignCurator|unassignItem|unassignTeam|unassignVehicle|underwater|uniform|uniformContainer|uniformItems|uniformMagazines|unitAddons|unitAimPosition|unitAimPositionVisual|unitBackpack|unitIsUAV|unitPos|unitReady|unitRecoilCoefficient|units|unitsBelowHeight|unlinkItem|unlockAchievement|unregisterTask|updateDrawIcon|updateMenuItem|updateObjectTree|useAIOperMapObstructionTest|useAISteeringComponent|useAudioTimeForMoves|userInputDisabled|vectorAdd|vectorCos|vectorCrossProduct|vectorDiff|vectorDir|vectorDirVisual|vectorDistance|vectorDistanceSqr|vectorDotProduct|vectorFromTo|vectorMagnitude|vectorMagnitudeSqr|vectorModelToWorld|vectorModelToWorldVisual|vectorMultiply|vectorNormalized|vectorUp|vectorUpVisual|vectorWorldToModel|vectorWorldToModelVisual|vehicle|vehicleCargoEnabled|vehicleChat|vehicleRadio|vehicleReceiveRemoteTargets|vehicleReportOwnPosition|vehicleReportRemoteTargets|vehicles|vehicleVarName|velocity|velocityModelSpace|verifySignature|vest|vestContainer|vestItems|vestMagazines|viewDistance|visibleCompass|visibleGPS|visibleMap|visiblePosition|visiblePositionASL|visibleScoretable|visibleWatch|waitUntil|waves|waypointAttachedObject|waypointAttachedVehicle|waypointAttachObject|waypointAttachVehicle|waypointBehaviour|waypointCombatMode|waypointCompletionRadius|waypointDescription|waypointForceBehaviour|waypointFormation|waypointHousePosition|waypointLoiterRadius|waypointLoiterType|waypointName|waypointPosition|waypoints|waypointScript|waypointsEnabledUAV|waypointShow|waypointSpeed|waypointStatements|waypointTimeout|waypointTimeoutCurrent|waypointType|waypointVisible|weaponAccessories|weaponAccessoriesCargo|weaponCargo|weaponDirection|weaponInertia|weaponLowered|weapons|weaponsItems|weaponsItemsCargo|weaponState|weaponsTurret|weightRTD|west|WFSideText|wind|windDir|windRTD|windStr|wingsForcesRTD|worldName|worldSize|worldToModel|worldToModelVisual|worldToScreen)\b/i,
  number: /(?:\$|\b0x)[\da-f]+\b|(?:\B\.\d+|\b\d+(?:\.\d+)?)(?:e[+-]?\d+)?\b/i,
  operator: /##|>>|&&|\|\||[!=<>]=?|[-+*/%#^]|\b(?:and|mod|not|or)\b/i,
  'magic-variable': {
    pattern:
      /\b(?:this|thisList|thisTrigger|_exception|_fnc_scriptName|_fnc_scriptNameParent|_forEachIndex|_this|_thisEventHandler|_thisFSM|_thisScript|_x)\b/i,
    alias: 'keyword',
  },
  constant: /\bDIK(?:_[a-z\d]+)+\b/i,
})),
  Prism.languages.insertBefore('sqf', 'string', {
    macro: {
      pattern: /(^[ \t]*)#[a-z](?:[^\r\n\\]|\\(?:\r\n|[\s\S]))*/im,
      lookbehind: !0,
      greedy: !0,
      alias: 'property',
      inside: {
        directive: {
          pattern: /#[a-z]+\b/i,
          alias: 'keyword',
        },
        comment: Prism.languages.sqf.comment,
      },
    },
  }),
  delete Prism.languages.sqf['class-name'];
Prism.languages.sql = {
  comment: {
    pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#).*)/,
    lookbehind: !0,
  },
  variable: [
    {
      pattern: /@(["'`])(?:\\[\s\S]|(?!\1)[^\\])+\1/,
      greedy: !0,
    },
    /@[\w.$]+/,
  ],
  string: {
    pattern: /(^|[^@\\])("|')(?:\\[\s\S]|(?!\2)[^\\]|\2\2)*\2/,
    greedy: !0,
    lookbehind: !0,
  },
  identifier: {
    pattern: /(^|[^@\\])`(?:\\[\s\S]|[^`\\]|``)*`/,
    greedy: !0,
    lookbehind: !0,
    inside: {
      punctuation: /^`|`$/,
    },
  },
  function:
    /\b(?:AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\s*\()/i,
  keyword:
    /\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR(?:ACTER|SET)?|CHECK(?:POINT)?|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMNS?|COMMENT|COMMIT(?:TED)?|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS(?:TABLE)?|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|CYCLE|DATA(?:BASES?)?|DATE(?:TIME)?|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE|ELSE(?:IF)?|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY(?:COL|_INSERT)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|KEYS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|LOOP|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL|NATURAL|NCHAR|NEXT|NO|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READS?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT(?:ABLE)?|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURN(?:ING|S)?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SECOND|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|START(?:ING)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED|TEXT(?:SIZE)?|THEN|TIME(?:STAMP)?|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?|YEAR)\b/i,
  boolean: /\b(?:FALSE|NULL|TRUE)\b/i,
  number: /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?|\B\.\d+\b/i,
  operator:
    /[-+*\/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|DIV|ILIKE|IN|IS|LIKE|NOT|OR|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/i,
  punctuation: /[;[\]()`,.]/,
};
(Prism.languages.squirrel = Prism.languages.extend('clike', {
  comment: [
    Prism.languages.clike.comment[0],
    {
      pattern: /(^|[^\\:])(?:\/\/|#).*/,
      lookbehind: !0,
      greedy: !0,
    },
  ],
  string: {
    pattern: /(^|[^\\"'@])(?:@"(?:[^"]|"")*"(?!")|"(?:[^\\\r\n"]|\\.)*")/,
    lookbehind: !0,
    greedy: !0,
  },
  'class-name': {
    pattern: /(\b(?:class|enum|extends|instanceof)\s+)\w+(?:\.\w+)*/,
    lookbehind: !0,
    inside: {
      punctuation: /\./,
    },
  },
  keyword:
    /\b(?:__FILE__|__LINE__|base|break|case|catch|class|clone|const|constructor|continue|default|delete|else|enum|extends|for|foreach|function|if|in|instanceof|local|null|resume|return|static|switch|this|throw|try|typeof|while|yield)\b/,
  number: /\b(?:0x[0-9a-fA-F]+|\d+(?:\.(?:\d+|[eE][+-]?\d+))?)\b/,
  operator: /\+\+|--|<=>|<[-<]|>>>?|&&?|\|\|?|[-+*/%!=<>]=?|[~^]|::?/,
  punctuation: /[(){}\[\],;.]/,
})),
  Prism.languages.insertBefore('squirrel', 'string', {
    char: {
      pattern: /(^|[^\\"'])'(?:[^\\']|\\(?:[xuU][0-9a-fA-F]{0,8}|[\s\S]))'/,
      lookbehind: !0,
      greedy: !0,
    },
  }),
  Prism.languages.insertBefore('squirrel', 'operator', {
    'attribute-punctuation': {
      pattern: /<\/|\/>/,
      alias: 'important',
    },
    lambda: {
      pattern: /@(?=\()/,
      alias: 'operator',
    },
  });
!(function (e) {
  var r =
    /\b(?:algebra_solver|algebra_solver_newton|integrate_1d|integrate_ode|integrate_ode_bdf|integrate_ode_rk45|map_rect|ode_(?:adams|bdf|ckrk|rk45)(?:_tol)?|ode_adjoint_tol_ctl|reduce_sum|reduce_sum_static)\b/;
  (e.languages.stan = {
    comment: /\/\/.*|\/\*[\s\S]*?\*\/|#(?!include).*/,
    string: {
      pattern: /"[\x20\x21\x23-\x5B\x5D-\x7E]*"/,
      greedy: !0,
    },
    directive: {
      pattern: /^([ \t]*)#include\b.*/m,
      lookbehind: !0,
      alias: 'property',
    },
    'function-arg': {
      pattern: RegExp('(' + r.source + '\\s*\\(\\s*)[a-zA-Z]\\w*'),
      lookbehind: !0,
      alias: 'function',
    },
    constraint: {
      pattern: /(\b(?:int|matrix|real|row_vector|vector)\s*)<[^<>]*>/,
      lookbehind: !0,
      inside: {
        expression: {
          pattern: /(=\s*)\S(?:\S|\s+(?!\s))*?(?=\s*(?:>$|,\s*\w+\s*=))/,
          lookbehind: !0,
          inside: null,
        },
        property: /\b[a-z]\w*(?=\s*=)/i,
        operator: /=/,
        punctuation: /^<|>$|,/,
      },
    },
    keyword: [
      {
        pattern:
          /\bdata(?=\s*\{)|\b(?:functions|generated|model|parameters|quantities|transformed)\b/,
        alias: 'program-block',
      },
      /\b(?:array|break|cholesky_factor_corr|cholesky_factor_cov|complex|continue|corr_matrix|cov_matrix|data|else|for|if|in|increment_log_prob|int|matrix|ordered|positive_ordered|print|real|reject|return|row_vector|simplex|target|unit_vector|vector|void|while)\b/,
      r,
    ],
    function: /\b[a-z]\w*(?=\s*\()/i,
    number:
      /(?:\b\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\B\.\d+(?:_\d+)*)(?:E[+-]?\d+(?:_\d+)*)?i?(?!\w)/i,
    boolean: /\b(?:false|true)\b/,
    operator: /<-|\.[*/]=?|\|\|?|&&|[!=<>+\-*/]=?|['^%~?:]/,
    punctuation: /[()\[\]{},;]/,
  }),
    (e.languages.stan.constraint.inside.expression.inside = e.languages.stan);
})(Prism);
Prism.languages.iecst = {
  comment: [
    {
      pattern:
        /(^|[^\\])(?:\/\*[\s\S]*?(?:\*\/|$)|\(\*[\s\S]*?(?:\*\)|$)|\{[\s\S]*?(?:\}|$))/,
      lookbehind: !0,
      greedy: !0,
    },
    {
      pattern: /(^|[^\\:])\/\/.*/,
      lookbehind: !0,
      greedy: !0,
    },
  ],
  string: {
    pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: !0,
  },
  keyword: [
    /\b(?:END_)?(?:PROGRAM|CONFIGURATION|INTERFACE|FUNCTION_BLOCK|FUNCTION|ACTION|TRANSITION|TYPE|STRUCT|(?:INITIAL_)?STEP|NAMESPACE|LIBRARY|CHANNEL|FOLDER|RESOURCE|VAR_(?:ACCESS|CONFIG|EXTERNAL|GLOBAL|INPUT|IN_OUT|OUTPUT|TEMP)|VAR|METHOD|PROPERTY)\b/i,
    /\b(?:AT|BY|(?:END_)?(?:CASE|FOR|IF|REPEAT|WHILE)|CONSTANT|CONTINUE|DO|ELSE|ELSIF|EXIT|EXTENDS|FROM|GET|GOTO|IMPLEMENTS|JMP|NON_RETAIN|OF|PRIVATE|PROTECTED|PUBLIC|RETAIN|RETURN|SET|TASK|THEN|TO|UNTIL|USING|WITH|__CATCH|__ENDTRY|__FINALLY|__TRY)\b/,
  ],
  'class-name':
    /\b(?:ANY|ARRAY|BOOL|BYTE|U?(?:D|L|S)?INT|(?:D|L)?WORD|DATE(?:_AND_TIME)?|DT|L?REAL|POINTER|STRING|TIME(?:_OF_DAY)?|TOD)\b/,
  address: {
    pattern: /%[IQM][XBWDL][\d.]*|%[IQ][\d.]*/,
    alias: 'symbol',
  },
  number:
    /\b(?:16#[\da-f]+|2#[01_]+|0x[\da-f]+)\b|\b(?:D|DT|T|TOD)#[\d_shmd:]*|\b[A-Z]*#[\d.,_]*|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
  boolean: /\b(?:FALSE|NULL|TRUE)\b/,
  operator:
    /S?R?:?=>?|&&?|\*\*?|<[=>]?|>=?|[-:^/+#]|\b(?:AND|EQ|EXPT|GE|GT|LE|LT|MOD|NE|NOT|OR|XOR)\b/,
  function: /\b[a-z_]\w*(?=\s*\()/i,
  punctuation: /[()[\].,;]/,
};
(Prism.languages.swift = {
  comment: {
    pattern:
      /(^|[^\\:])(?:\/\/.*|\/\*(?:[^/*]|\/(?!\*)|\*(?!\/)|\/\*(?:[^*]|\*(?!\/))*\*\/)*\*\/)/,
    lookbehind: !0,
    greedy: !0,
  },
  'string-literal': [
    {
      pattern: RegExp(
        '(^|[^"#])(?:"(?:\\\\(?:\\((?:[^()]|\\([^()]*\\))*\\)|\r\n|[^(])|[^\\\\\r\n"])*"|"""(?:\\\\(?:\\((?:[^()]|\\([^()]*\\))*\\)|[^(])|[^\\\\"]|"(?!""))*""")(?!["#])',
      ),
      lookbehind: !0,
      greedy: !0,
      inside: {
        interpolation: {
          pattern: /(\\\()(?:[^()]|\([^()]*\))*(?=\))/,
          lookbehind: !0,
          inside: null,
        },
        'interpolation-punctuation': {
          pattern: /^\)|\\\($/,
          alias: 'punctuation',
        },
        punctuation: /\\(?=[\r\n])/,
        string: /[\s\S]+/,
      },
    },
    {
      pattern: RegExp(
        '(^|[^"#])(#+)(?:"(?:\\\\(?:#+\\((?:[^()]|\\([^()]*\\))*\\)|\r\n|[^#])|[^\\\\\r\n])*?"|"""(?:\\\\(?:#+\\((?:[^()]|\\([^()]*\\))*\\)|[^#])|[^\\\\])*?""")\\2',
      ),
      lookbehind: !0,
      greedy: !0,
      inside: {
        interpolation: {
          pattern: /(\\#+\()(?:[^()]|\([^()]*\))*(?=\))/,
          lookbehind: !0,
          inside: null,
        },
        'interpolation-punctuation': {
          pattern: /^\)|\\#+\($/,
          alias: 'punctuation',
        },
        string: /[\s\S]+/,
      },
    },
  ],
  directive: {
    pattern: RegExp(
      '#(?:(?:elseif|if)\\b(?:[ \t]*(?:![ \t]*)?(?:\\b\\w+\\b(?:[ \t]*\\((?:[^()]|\\([^()]*\\))*\\))?|\\((?:[^()]|\\([^()]*\\))*\\))(?:[ \t]*(?:&&|\\|\\|))?)+|(?:else|endif)\\b)',
    ),
    alias: 'property',
    inside: {
      'directive-name': /^#\w+/,
      boolean: /\b(?:false|true)\b/,
      number: /\b\d+(?:\.\d+)*\b/,
      operator: /!|&&|\|\||[<>]=?/,
      punctuation: /[(),]/,
    },
  },
  literal: {
    pattern:
      /#(?:colorLiteral|column|dsohandle|file(?:ID|Literal|Path)?|function|imageLiteral|line)\b/,
    alias: 'constant',
  },
  'other-directive': {
    pattern: /#\w+\b/,
    alias: 'property',
  },
  attribute: {
    pattern: /@\w+/,
    alias: 'atrule',
  },
  'function-definition': {
    pattern: /(\bfunc\s+)\w+/,
    lookbehind: !0,
    alias: 'function',
  },
  label: {
    pattern:
      /\b(break|continue)\s+\w+|\b[a-zA-Z_]\w*(?=\s*:\s*(?:for|repeat|while)\b)/,
    lookbehind: !0,
    alias: 'important',
  },
  keyword:
    /\b(?:Any|Protocol|Self|Type|actor|as|assignment|associatedtype|associativity|async|await|break|case|catch|class|continue|convenience|default|defer|deinit|didSet|do|dynamic|else|enum|extension|fallthrough|fileprivate|final|for|func|get|guard|higherThan|if|import|in|indirect|infix|init|inout|internal|is|isolated|lazy|left|let|lowerThan|mutating|none|nonisolated|nonmutating|open|operator|optional|override|postfix|precedencegroup|prefix|private|protocol|public|repeat|required|rethrows|return|right|safe|self|set|some|static|struct|subscript|super|switch|throw|throws|try|typealias|unowned|unsafe|var|weak|where|while|willSet)\b/,
  boolean: /\b(?:false|true)\b/,
  nil: {
    pattern: /\bnil\b/,
    alias: 'constant',
  },
  'short-argument': /\$\d+\b/,
  omit: {
    pattern: /\b_\b/,
    alias: 'keyword',
  },
  number:
    /\b(?:[\d_]+(?:\.[\de_]+)?|0x[a-f0-9_]+(?:\.[a-f0-9p_]+)?|0b[01_]+|0o[0-7_]+)\b/i,
  'class-name': /\b[A-Z](?:[A-Z_\d]*[a-z]\w*)?\b/,
  function: /\b[a-z_]\w*(?=\s*\()/i,
  constant: /\b(?:[A-Z_]{2,}|k[A-Z][A-Za-z_]+)\b/,
  operator: /[-+*/%=!<>&|^~?]+|\.[.\-+*/%=!<>&|^~?]+/,
  punctuation: /[{}[\]();,.:\\]/,
}),
  Prism.languages.swift['string-literal'].forEach(function (e) {
    e.inside.interpolation.inside = Prism.languages.swift;
  });
!(function (e) {
  var t = {
      pattern: /^[;#].*/m,
      greedy: !0,
    },
    n = '"(?:[^\r\n"\\\\]|\\\\(?:[^\r]|\r\n?))*"(?!\\S)';
  e.languages.systemd = {
    comment: t,
    section: {
      pattern: /^\[[^\n\r\[\]]*\](?=[ \t]*$)/m,
      greedy: !0,
      inside: {
        punctuation: /^\[|\]$/,
        'section-name': {
          pattern: /[\s\S]+/,
          alias: 'selector',
        },
      },
    },
    key: {
      pattern: /^[^\s=]+(?=[ \t]*=)/m,
      greedy: !0,
      alias: 'attr-name',
    },
    value: {
      pattern: RegExp(
        '(=[ \t]*(?!\\s))(?:' +
          n +
          '|(?=[^"\r\n]))(?:[^\\s\\\\]|[ \t]+(?:(?![ \t"])|' +
          n +
          ')|\\\\[\r\n]+(?:[#;].*[\r\n]+)*(?![#;]))*',
      ),
      lookbehind: !0,
      greedy: !0,
      alias: 'attr-value',
      inside: {
        comment: t,
        quoted: {
          pattern: RegExp('(^|\\s)' + n),
          lookbehind: !0,
          greedy: !0,
        },
        punctuation: /\\$/m,
        boolean: {
          pattern: /^(?:false|no|off|on|true|yes)$/,
          greedy: !0,
        },
      },
    },
    punctuation: /=/,
  };
})(Prism);
!(function (e) {
  function t(e, t, a) {
    return {
      pattern: RegExp('<#' + e + '[\\s\\S]*?#>'),
      alias: 'block',
      inside: {
        delimiter: {
          pattern: RegExp('^<#' + e + '|#>$'),
          alias: 'important',
        },
        content: {
          pattern: /[\s\S]+/,
          inside: t,
          alias: a,
        },
      },
    };
  }
  e.languages['t4-templating'] = Object.defineProperty({}, 'createT4', {
    value: function (a) {
      var n = e.languages[a],
        i = 'language-' + a;
      return {
        block: {
          pattern: /<#[\s\S]+?#>/,
          inside: {
            directive: t('@', {
              'attr-value': {
                pattern: /=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+)/,
                inside: {
                  punctuation: /^=|^["']|["']$/,
                },
              },
              keyword: /\b\w+(?=\s)/,
              'attr-name': /\b\w+/,
            }),
            expression: t('=', n, i),
            'class-feature': t('\\+', n, i),
            standard: t('', n, i),
          },
        },
      };
    },
  });
})(Prism);
Prism.languages.t4 = Prism.languages['t4-cs'] =
  Prism.languages['t4-templating'].createT4('csharp');
Prism.languages.vbnet = Prism.languages.extend('basic', {
  comment: [
    {
      pattern: /(?:!|REM\b).+/i,
      inside: {
        keyword: /^REM/i,
      },
    },
    {
      pattern: /(^|[^\\:])'.*/,
      lookbehind: !0,
      greedy: !0,
    },
  ],
  string: {
    pattern: /(^|[^"])"(?:""|[^"])*"(?!")/,
    lookbehind: !0,
    greedy: !0,
  },
  keyword:
    /(?:\b(?:ADDHANDLER|ADDRESSOF|ALIAS|AND|ANDALSO|AS|BEEP|BLOAD|BOOLEAN|BSAVE|BYREF|BYTE|BYVAL|CALL(?: ABSOLUTE)?|CASE|CATCH|CBOOL|CBYTE|CCHAR|CDATE|CDBL|CDEC|CHAIN|CHAR|CHDIR|CINT|CLASS|CLEAR|CLNG|CLOSE|CLS|COBJ|COM|COMMON|CONST|CONTINUE|CSBYTE|CSHORT|CSNG|CSTR|CTYPE|CUINT|CULNG|CUSHORT|DATA|DATE|DECIMAL|DECLARE|DEF(?: FN| SEG|DBL|INT|LNG|SNG|STR)|DEFAULT|DELEGATE|DIM|DIRECTCAST|DO|DOUBLE|ELSE|ELSEIF|END|ENUM|ENVIRON|ERASE|ERROR|EVENT|EXIT|FALSE|FIELD|FILES|FINALLY|FOR(?: EACH)?|FRIEND|FUNCTION|GET|GETTYPE|GETXMLNAMESPACE|GLOBAL|GOSUB|GOTO|HANDLES|IF|IMPLEMENTS|IMPORTS|IN|INHERITS|INPUT|INTEGER|INTERFACE|IOCTL|IS|ISNOT|KEY|KILL|LET|LIB|LIKE|LINE INPUT|LOCATE|LOCK|LONG|LOOP|LSET|ME|MKDIR|MOD|MODULE|MUSTINHERIT|MUSTOVERRIDE|MYBASE|MYCLASS|NAME|NAMESPACE|NARROWING|NEW|NEXT|NOT|NOTHING|NOTINHERITABLE|NOTOVERRIDABLE|OBJECT|OF|OFF|ON(?: COM| ERROR| KEY| TIMER)?|OPEN|OPERATOR|OPTION(?: BASE)?|OPTIONAL|OR|ORELSE|OUT|OVERLOADS|OVERRIDABLE|OVERRIDES|PARAMARRAY|PARTIAL|POKE|PRIVATE|PROPERTY|PROTECTED|PUBLIC|PUT|RAISEEVENT|READ|READONLY|REDIM|REM|REMOVEHANDLER|RESTORE|RESUME|RETURN|RMDIR|RSET|RUN|SBYTE|SELECT(?: CASE)?|SET|SHADOWS|SHARED|SHELL|SHORT|SINGLE|SLEEP|STATIC|STEP|STOP|STRING|STRUCTURE|SUB|SWAP|SYNCLOCK|SYSTEM|THEN|THROW|TIMER|TO|TROFF|TRON|TRUE|TRY|TRYCAST|TYPE|TYPEOF|UINTEGER|ULONG|UNLOCK|UNTIL|USHORT|USING|VIEW PRINT|WAIT|WEND|WHEN|WHILE|WIDENING|WITH|WITHEVENTS|WRITE|WRITEONLY|XOR)|\B(?:#CONST|#ELSE|#ELSEIF|#END|#IF))(?:\$|\b)/i,
  punctuation: /[,;:(){}]/,
});
Prism.languages['t4-vb'] = Prism.languages['t4-templating'].createT4('vbnet');
!(function (e) {
  var n = /[*&][^\s[\]{},]+/,
    r =
      /!(?:<[\w\-%#;/?:@&=+$,.!~*'()[\]]+>|(?:[a-zA-Z\d-]*!)?[\w\-%#;/?:@&=+$.~*'()]+)?/,
    t =
      '(?:' +
      r.source +
      '(?:[ \t]+' +
      n.source +
      ')?|' +
      n.source +
      '(?:[ \t]+' +
      r.source +
      ')?)',
    a =
      '(?:[^\\s\\x00-\\x08\\x0e-\\x1f!"#%&\'*,\\-:>?@[\\]`{|}\\x7f-\\x84\\x86-\\x9f\\ud800-\\udfff\\ufffe\\uffff]|[?:-]<PLAIN>)(?:[ \t]*(?:(?![#:])<PLAIN>|:<PLAIN>))*'.replace(
        /<PLAIN>/g,
        function () {
          return '[^\\s\\x00-\\x08\\x0e-\\x1f,[\\]{}\\x7f-\\x84\\x86-\\x9f\\ud800-\\udfff\\ufffe\\uffff]';
        },
      ),
    d = '"(?:[^"\\\\\r\n]|\\\\.)*"|\'(?:[^\'\\\\\r\n]|\\\\.)*\'';
  function o(e, n) {
    n = (n || '').replace(/m/g, '') + 'm';
    var r =
      '([:\\-,[{]\\s*(?:\\s<<prop>>[ \t]+)?)(?:<<value>>)(?=[ \t]*(?:$|,|\\]|\\}|(?:[\r\n]\\s*)?#))'
        .replace(/<<prop>>/g, function () {
          return t;
        })
        .replace(/<<value>>/g, function () {
          return e;
        });
    return RegExp(r, n);
  }
  (e.languages.yaml = {
    scalar: {
      pattern: RegExp(
        '([\\-:]\\s*(?:\\s<<prop>>[ \t]+)?[|>])[ \t]*(?:((?:\r?\n|\r)[ \t]+)\\S[^\r\n]*(?:\\2[^\r\n]+)*)'.replace(
          /<<prop>>/g,
          function () {
            return t;
          },
        ),
      ),
      lookbehind: !0,
      alias: 'string',
    },
    comment: /#.*/,
    key: {
      pattern: RegExp(
        '((?:^|[:\\-,[{\r\n?])[ \t]*(?:<<prop>>[ \t]+)?)<<key>>(?=\\s*:\\s)'
          .replace(/<<prop>>/g, function () {
            return t;
          })
          .replace(/<<key>>/g, function () {
            return '(?:' + a + '|' + d + ')';
          }),
      ),
      lookbehind: !0,
      greedy: !0,
      alias: 'atrule',
    },
    directive: {
      pattern: /(^[ \t]*)%.+/m,
      lookbehind: !0,
      alias: 'important',
    },
    datetime: {
      pattern: o(
        '\\d{4}-\\d\\d?-\\d\\d?(?:[tT]|[ \t]+)\\d\\d?:\\d{2}:\\d{2}(?:\\.\\d*)?(?:[ \t]*(?:Z|[-+]\\d\\d?(?::\\d{2})?))?|\\d{4}-\\d{2}-\\d{2}|\\d\\d?:\\d{2}(?::\\d{2}(?:\\.\\d*)?)?',
      ),
      lookbehind: !0,
      alias: 'number',
    },
    boolean: {
      pattern: o('false|true', 'i'),
      lookbehind: !0,
      alias: 'important',
    },
    null: {
      pattern: o('null|~', 'i'),
      lookbehind: !0,
      alias: 'important',
    },
    string: {
      pattern: o(d),
      lookbehind: !0,
      greedy: !0,
    },
    number: {
      pattern: o(
        '[+-]?(?:0x[\\da-f]+|0o[0-7]+|(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:e[+-]?\\d+)?|\\.inf|\\.nan)',
        'i',
      ),
      lookbehind: !0,
    },
    tag: r,
    important: n,
    punctuation: /---|[:[\]{}\-,|>?]|\.\.\./,
  }),
    (e.languages.yml = e.languages.yaml);
})(Prism);
Prism.languages.tap = {
  fail: /not ok[^#{\n\r]*/,
  pass: /ok[^#{\n\r]*/,
  pragma: /pragma [+-][a-z]+/,
  bailout: /bail out!.*/i,
  version: /TAP version \d+/i,
  plan: /\b\d+\.\.\d+(?: +#.*)?/,
  subtest: {
    pattern: /# Subtest(?:: .*)?/,
    greedy: !0,
  },
  punctuation: /[{}]/,
  directive: /#.*/,
  yamlish: {
    pattern: /(^[ \t]*)---[\s\S]*?[\r\n][ \t]*\.\.\.$/m,
    lookbehind: !0,
    inside: Prism.languages.yaml,
    alias: 'language-yaml',
  },
};
Prism.languages.tcl = {
  comment: {
    pattern: /(^|[^\\])#.*/,
    lookbehind: !0,
  },
  string: {
    pattern: /"(?:[^"\\\r\n]|\\(?:\r\n|[\s\S]))*"/,
    greedy: !0,
  },
  variable: [
    {
      pattern: /(\$)(?:::)?(?:[a-zA-Z0-9]+::)*\w+/,
      lookbehind: !0,
    },
    {
      pattern: /(\$)\{[^}]+\}/,
      lookbehind: !0,
    },
    {
      pattern: /(^[\t ]*set[ \t]+)(?:::)?(?:[a-zA-Z0-9]+::)*\w+/m,
      lookbehind: !0,
    },
  ],
  function: {
    pattern: /(^[\t ]*proc[ \t]+)\S+/m,
    lookbehind: !0,
  },
  builtin: [
    {
      pattern:
        /(^[\t ]*)(?:break|class|continue|error|eval|exit|for|foreach|if|proc|return|switch|while)\b/m,
      lookbehind: !0,
    },
    /\b(?:else|elseif)\b/,
  ],
  scope: {
    pattern: /(^[\t ]*)(?:global|upvar|variable)\b/m,
    lookbehind: !0,
    alias: 'constant',
  },
  keyword: {
    pattern:
      /(^[\t ]*|\[)(?:Safe_Base|Tcl|after|append|apply|array|auto_(?:execok|import|load|mkindex|qualify|reset)|automkindex_old|bgerror|binary|catch|cd|chan|clock|close|concat|dde|dict|encoding|eof|exec|expr|fblocked|fconfigure|fcopy|file(?:event|name)?|flush|gets|glob|history|http|incr|info|interp|join|lappend|lassign|lindex|linsert|list|llength|load|lrange|lrepeat|lreplace|lreverse|lsearch|lset|lsort|math(?:func|op)|memory|msgcat|namespace|open|package|parray|pid|pkg_mkIndex|platform|puts|pwd|re_syntax|read|refchan|regexp|registry|regsub|rename|scan|seek|set|socket|source|split|string|subst|tcl(?:_endOfWord|_findLibrary|startOf(?:Next|Previous)Word|test|vars|wordBreak(?:After|Before))|tell|time|tm|trace|unknown|unload|unset|update|uplevel|vwait)\b/m,
    lookbehind: !0,
  },
  operator:
    /!=?|\*\*?|==|&&?|\|\|?|<[=<]?|>[=>]?|[-+~\/%?^]|\b(?:eq|in|ne|ni)\b/,
  punctuation: /[{}()\[\]]/,
};
!(function (n) {
  function e(n, e) {
    return RegExp(
      n
        .replace(/<MOD>/g, function () {
          return '(?:\\([^|()\n]+\\)|\\[[^\\]\n]+\\]|\\{[^}\n]+\\})';
        })
        .replace(/<PAR>/g, function () {
          return '(?:\\)|\\((?![^|()\n]+\\)))';
        }),
      e || '',
    );
  }
  var i = {
      css: {
        pattern: /\{[^{}]+\}/,
        inside: {
          rest: n.languages.css,
        },
      },
      'class-id': {
        pattern: /(\()[^()]+(?=\))/,
        lookbehind: !0,
        alias: 'attr-value',
      },
      lang: {
        pattern: /(\[)[^\[\]]+(?=\])/,
        lookbehind: !0,
        alias: 'attr-value',
      },
      punctuation: /[\\\/]\d+|\S/,
    },
    t = (n.languages.textile = n.languages.extend('markup', {
      phrase: {
        pattern: /(^|\r|\n)\S[\s\S]*?(?=$|\r?\n\r?\n|\r\r)/,
        lookbehind: !0,
        inside: {
          'block-tag': {
            pattern: e('^[a-z]\\w*(?:<MOD>|<PAR>|[<>=])*\\.'),
            inside: {
              modifier: {
                pattern: e('(^[a-z]\\w*)(?:<MOD>|<PAR>|[<>=])+(?=\\.)'),
                lookbehind: !0,
                inside: i,
              },
              tag: /^[a-z]\w*/,
              punctuation: /\.$/,
            },
          },
          list: {
            pattern: e('^[*#]+<MOD>*\\s+\\S.*', 'm'),
            inside: {
              modifier: {
                pattern: e('(^[*#]+)<MOD>+'),
                lookbehind: !0,
                inside: i,
              },
              punctuation: /^[*#]+/,
            },
          },
          table: {
            pattern: e(
              '^(?:(?:<MOD>|<PAR>|[<>=^~])+\\.\\s*)?(?:\\|(?:(?:<MOD>|<PAR>|[<>=^~_]|[\\\\/]\\d+)+\\.|(?!(?:<MOD>|<PAR>|[<>=^~_]|[\\\\/]\\d+)+\\.))[^|]*)+\\|',
              'm',
            ),
            inside: {
              modifier: {
                pattern: e(
                  '(^|\\|(?:\r?\n|\r)?)(?:<MOD>|<PAR>|[<>=^~_]|[\\\\/]\\d+)+(?=\\.)',
                ),
                lookbehind: !0,
                inside: i,
              },
              punctuation: /\||^\./,
            },
          },
          inline: {
            pattern: e(
              '(^|[^a-zA-Z\\d])(\\*\\*|__|\\?\\?|[*_%@+\\-^~])<MOD>*.+?\\2(?![a-zA-Z\\d])',
            ),
            lookbehind: !0,
            inside: {
              bold: {
                pattern: e('(^(\\*\\*?)<MOD>*).+?(?=\\2)'),
                lookbehind: !0,
              },
              italic: {
                pattern: e('(^(__?)<MOD>*).+?(?=\\2)'),
                lookbehind: !0,
              },
              cite: {
                pattern: e('(^\\?\\?<MOD>*).+?(?=\\?\\?)'),
                lookbehind: !0,
                alias: 'string',
              },
              code: {
                pattern: e('(^@<MOD>*).+?(?=@)'),
                lookbehind: !0,
                alias: 'keyword',
              },
              inserted: {
                pattern: e('(^\\+<MOD>*).+?(?=\\+)'),
                lookbehind: !0,
              },
              deleted: {
                pattern: e('(^-<MOD>*).+?(?=-)'),
                lookbehind: !0,
              },
              span: {
                pattern: e('(^%<MOD>*).+?(?=%)'),
                lookbehind: !0,
              },
              modifier: {
                pattern: e('(^\\*\\*|__|\\?\\?|[*_%@+\\-^~])<MOD>+'),
                lookbehind: !0,
                inside: i,
              },
              punctuation: /[*_%?@+\-^~]+/,
            },
          },
          'link-ref': {
            pattern: /^\[[^\]]+\]\S+$/m,
            inside: {
              string: {
                pattern: /(^\[)[^\]]+(?=\])/,
                lookbehind: !0,
              },
              url: {
                pattern: /(^\])\S+$/,
                lookbehind: !0,
              },
              punctuation: /[\[\]]/,
            },
          },
          link: {
            pattern: e('"<MOD>*[^"]+":.+?(?=[^\\w/]?(?:\\s|$))'),
            inside: {
              text: {
                pattern: e('(^"<MOD>*)[^"]+(?=")'),
                lookbehind: !0,
              },
              modifier: {
                pattern: e('(^")<MOD>+'),
                lookbehind: !0,
                inside: i,
              },
              url: {
                pattern: /(:).+/,
                lookbehind: !0,
              },
              punctuation: /[":]/,
            },
          },
          image: {
            pattern: e(
              '!(?:<MOD>|<PAR>|[<>=])*(?![<>=])[^!\\s()]+(?:\\([^)]+\\))?!(?::.+?(?=[^\\w/]?(?:\\s|$)))?',
            ),
            inside: {
              source: {
                pattern: e(
                  '(^!(?:<MOD>|<PAR>|[<>=])*)(?![<>=])[^!\\s()]+(?:\\([^)]+\\))?(?=!)',
                ),
                lookbehind: !0,
                alias: 'url',
              },
              modifier: {
                pattern: e('(^!)(?:<MOD>|<PAR>|[<>=])+'),
                lookbehind: !0,
                inside: i,
              },
              url: {
                pattern: /(:).+/,
                lookbehind: !0,
              },
              punctuation: /[!:]/,
            },
          },
          footnote: {
            pattern: /\b\[\d+\]/,
            alias: 'comment',
            inside: {
              punctuation: /\[|\]/,
            },
          },
          acronym: {
            pattern: /\b[A-Z\d]+\([^)]+\)/,
            inside: {
              comment: {
                pattern: /(\()[^()]+(?=\))/,
                lookbehind: !0,
              },
              punctuation: /[()]/,
            },
          },
          mark: {
            pattern: /\b\((?:C|R|TM)\)/,
            alias: 'comment',
            inside: {
              punctuation: /[()]/,
            },
          },
        },
      },
    })),
    a = t.phrase.inside,
    o = {
      inline: a.inline,
      link: a.link,
      image: a.image,
      footnote: a.footnote,
      acronym: a.acronym,
      mark: a.mark,
    };
  t.tag.pattern =
    /<\/?(?!\d)[a-z0-9]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+))?)*\s*\/?>/i;
  var r = a.inline.inside;
  (r.bold.inside = o),
    (r.italic.inside = o),
    (r.inserted.inside = o),
    (r.deleted.inside = o),
    (r.span.inside = o);
  var d = a.table.inside;
  (d.inline = o.inline),
    (d.link = o.link),
    (d.image = o.image),
    (d.footnote = o.footnote),
    (d.acronym = o.acronym),
    (d.mark = o.mark);
})(Prism);
!(function (e) {
  function n(e) {
    return e.replace(/__/g, function () {
      return '(?:[\\w-]+|\'[^\'\n\r]*\'|"(?:\\\\.|[^\\\\"\r\n])*")';
    });
  }
  e.languages.toml = {
    comment: {
      pattern: /#.*/,
      greedy: !0,
    },
    table: {
      pattern: RegExp(
        n('(^[\t ]*\\[\\s*(?:\\[\\s*)?)__(?:\\s*\\.\\s*__)*(?=\\s*\\])'),
        'm',
      ),
      lookbehind: !0,
      greedy: !0,
      alias: 'class-name',
    },
    key: {
      pattern: RegExp(
        n('(^[\t ]*|[{,]\\s*)__(?:\\s*\\.\\s*__)*(?=\\s*=)'),
        'm',
      ),
      lookbehind: !0,
      greedy: !0,
      alias: 'property',
    },
    string: {
      pattern:
        /"""(?:\\[\s\S]|[^\\])*?"""|'''[\s\S]*?'''|'[^'\n\r]*'|"(?:\\.|[^\\"\r\n])*"/,
      greedy: !0,
    },
    date: [
      {
        pattern:
          /\b\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?\b/i,
        alias: 'number',
      },
      {
        pattern: /\b\d{2}:\d{2}:\d{2}(?:\.\d+)?\b/,
        alias: 'number',
      },
    ],
    number:
      /(?:\b0(?:x[\da-zA-Z]+(?:_[\da-zA-Z]+)*|o[0-7]+(?:_[0-7]+)*|b[10]+(?:_[10]+)*))\b|[-+]?\b\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[eE][+-]?\d+(?:_\d+)*)?\b|[-+]?\b(?:inf|nan)\b/,
    boolean: /\b(?:false|true)\b/,
    punctuation: /[.,=[\]{}]/,
  };
})(Prism);
(Prism.languages.twig = {
  comment: /^\{#[\s\S]*?#\}$/,
  'tag-name': {
    pattern: /(^\{%-?\s*)\w+/,
    lookbehind: !0,
    alias: 'keyword',
  },
  delimiter: {
    pattern: /^\{[{%]-?|-?[%}]\}$/,
    alias: 'punctuation',
  },
  string: {
    pattern: /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/,
    inside: {
      punctuation: /^['"]|['"]$/,
    },
  },
  keyword: /\b(?:even|if|odd)\b/,
  boolean: /\b(?:false|null|true)\b/,
  number: /\b0x[\dA-Fa-f]+|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:[Ee][-+]?\d+)?/,
  operator: [
    {
      pattern:
        /(\s)(?:and|b-and|b-or|b-xor|ends with|in|is|matches|not|or|same as|starts with)(?=\s)/,
      lookbehind: !0,
    },
    /[=<>]=?|!=|\*\*?|\/\/?|\?:?|[-+~%|]/,
  ],
  punctuation: /[()\[\]{}:.,]/,
}),
  Prism.hooks.add('before-tokenize', function (e) {
    'twig' === e.language &&
      Prism.languages['markup-templating'].buildPlaceholders(
        e,
        'twig',
        /\{(?:#[\s\S]*?#|%[\s\S]*?%|\{[\s\S]*?\})\}/g,
      );
  }),
  Prism.hooks.add('after-tokenize', function (e) {
    Prism.languages['markup-templating'].tokenizePlaceholders(e, 'twig');
  });
!(function (E) {
  var n =
    /\b(?:ACT|ACTIFSUB|CARRAY|CASE|CLEARGIF|COA|COA_INT|CONSTANTS|CONTENT|CUR|EDITPANEL|EFFECT|EXT|FILE|FLUIDTEMPLATE|FORM|FRAME|FRAMESET|GIFBUILDER|GMENU|GMENU_FOLDOUT|GMENU_LAYERS|GP|HMENU|HRULER|HTML|IENV|IFSUB|IMAGE|IMGMENU|IMGMENUITEM|IMGTEXT|IMG_RESOURCE|INCLUDE_TYPOSCRIPT|JSMENU|JSMENUITEM|LLL|LOAD_REGISTER|NO|PAGE|RECORDS|RESTORE_REGISTER|TEMPLATE|TEXT|TMENU|TMENUITEM|TMENU_LAYERS|USER|USER_INT|_GIFBUILDER|global|globalString|globalVar)\b/;
  (E.languages.typoscript = {
    comment: [
      {
        pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
        lookbehind: !0,
      },
      {
        pattern: /(^|[^\\:= \t]|(?:^|[^= \t])[ \t]+)\/\/.*/,
        lookbehind: !0,
        greedy: !0,
      },
      {
        pattern: /(^|[^"'])#.*/,
        lookbehind: !0,
        greedy: !0,
      },
    ],
    function: [
      {
        pattern:
          /<INCLUDE_TYPOSCRIPT:\s*source\s*=\s*(?:"[^"\r\n]*"|'[^'\r\n]*')\s*>/,
        inside: {
          string: {
            pattern: /"[^"\r\n]*"|'[^'\r\n]*'/,
            inside: {
              keyword: n,
            },
          },
          keyword: {
            pattern: /INCLUDE_TYPOSCRIPT/,
          },
        },
      },
      {
        pattern: /@import\s*(?:"[^"\r\n]*"|'[^'\r\n]*')/,
        inside: {
          string: /"[^"\r\n]*"|'[^'\r\n]*'/,
        },
      },
    ],
    string: {
      pattern: /^([^=]*=[< ]?)(?:(?!\]\n).)*/,
      lookbehind: !0,
      inside: {
        function: /\{\$.*\}/,
        keyword: n,
        number: /^\d+$/,
        punctuation: /[,|:]/,
      },
    },
    keyword: n,
    number: {
      pattern: /\b\d+\s*[.{=]/,
      inside: {
        operator: /[.{=]/,
      },
    },
    tag: {
      pattern: /\.?[-\w\\]+\.?/,
      inside: {
        punctuation: /\./,
      },
    },
    punctuation: /[{}[\];(),.:|]/,
    operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
  }),
    (E.languages.tsconfig = E.languages.typoscript);
})(Prism);
(Prism.languages.uri = {
  scheme: {
    pattern: /^[a-z][a-z0-9+.-]*:/im,
    greedy: !0,
    inside: {
      'scheme-delimiter': /:$/,
    },
  },
  fragment: {
    pattern: /#[\w\-.~!$&'()*+,;=%:@/?]*/,
    inside: {
      'fragment-delimiter': /^#/,
    },
  },
  query: {
    pattern: /\?[\w\-.~!$&'()*+,;=%:@/?]*/,
    inside: {
      'query-delimiter': {
        pattern: /^\?/,
        greedy: !0,
      },
      'pair-delimiter': /[&;]/,
      pair: {
        pattern: /^[^=][\s\S]*/,
        inside: {
          key: /^[^=]+/,
          value: {
            pattern: /(^=)[\s\S]+/,
            lookbehind: !0,
          },
        },
      },
    },
  },
  authority: {
    pattern: RegExp(
      "^//(?:[\\w\\-.~!$&'()*+,;=%:]*@)?(?:\\[(?:[0-9a-fA-F:.]{2,48}|v[0-9a-fA-F]+\\.[\\w\\-.~!$&'()*+,;=]+)\\]|[\\w\\-.~!$&'()*+,;=%]*)(?::\\d*)?",
      'm',
    ),
    inside: {
      'authority-delimiter': /^\/\//,
      'user-info-segment': {
        pattern: /^[\w\-.~!$&'()*+,;=%:]*@/,
        inside: {
          'user-info-delimiter': /@$/,
          'user-info': /^[\w\-.~!$&'()*+,;=%:]+/,
        },
      },
      'port-segment': {
        pattern: /:\d*$/,
        inside: {
          'port-delimiter': /^:/,
          port: /^\d+/,
        },
      },
      host: {
        pattern: /[\s\S]+/,
        inside: {
          'ip-literal': {
            pattern: /^\[[\s\S]+\]$/,
            inside: {
              'ip-literal-delimiter': /^\[|\]$/,
              'ipv-future': /^v[\s\S]+/,
              'ipv6-address': /^[\s\S]+/,
            },
          },
          'ipv4-address':
            /^(?:(?:[03-9]\d?|[12]\d{0,2})\.){3}(?:[03-9]\d?|[12]\d{0,2})$/,
        },
      },
    },
  },
  path: {
    pattern: /^[\w\-.~!$&'()*+,;=%:@/]+/m,
    inside: {
      'path-separator': /\//,
    },
  },
}),
  (Prism.languages.url = Prism.languages.uri);
!(function (e) {
  var n = {
    pattern: /[\s\S]+/,
    inside: null,
  };
  (e.languages.v = e.languages.extend('clike', {
    string: {
      pattern: /r?(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
      alias: 'quoted-string',
      greedy: !0,
      inside: {
        interpolation: {
          pattern:
            /((?:^|[^\\])(?:\\{2})*)\$(?:\{[^{}]*\}|\w+(?:\.\w+(?:\([^\(\)]*\))?|\[[^\[\]]+\])*)/,
          lookbehind: !0,
          inside: {
            'interpolation-variable': {
              pattern: /^\$\w[\s\S]*$/,
              alias: 'variable',
            },
            'interpolation-punctuation': {
              pattern: /^\$\{|\}$/,
              alias: 'punctuation',
            },
            'interpolation-expression': n,
          },
        },
      },
    },
    'class-name': {
      pattern: /(\b(?:enum|interface|struct|type)\s+)(?:C\.)?\w+/,
      lookbehind: !0,
    },
    keyword:
      /(?:\b(?:__global|as|asm|assert|atomic|break|chan|const|continue|defer|else|embed|enum|fn|for|go(?:to)?|if|import|in|interface|is|lock|match|module|mut|none|or|pub|return|rlock|select|shared|sizeof|static|struct|type(?:of)?|union|unsafe)|\$(?:else|for|if)|#(?:flag|include))\b/,
    number:
      /\b(?:0x[a-f\d]+(?:_[a-f\d]+)*|0b[01]+(?:_[01]+)*|0o[0-7]+(?:_[0-7]+)*|\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?)\b/i,
    operator:
      /~|\?|[*\/%^!=]=?|\+[=+]?|-[=-]?|\|[=|]?|&(?:=|&|\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\.\.\.?/,
    builtin:
      /\b(?:any(?:_float|_int)?|bool|byte(?:ptr)?|charptr|f(?:32|64)|i(?:8|16|64|128|nt)|rune|size_t|string|u(?:16|32|64|128)|voidptr)\b/,
  })),
    (n.inside = e.languages.v),
    e.languages.insertBefore('v', 'string', {
      char: {
        pattern: /`(?:\\`|\\?[^`]{1,2})`/,
        alias: 'rune',
      },
    }),
    e.languages.insertBefore('v', 'operator', {
      attribute: {
        pattern:
          /(^[\t ]*)\[(?:deprecated|direct_array_access|flag|inline|live|ref_only|typedef|unsafe_fn|windows_stdcall)\]/m,
        lookbehind: !0,
        alias: 'annotation',
        inside: {
          punctuation: /[\[\]]/,
          keyword: /\w+/,
        },
      },
      generic: {
        pattern: /<\w+>(?=\s*[\)\{])/,
        inside: {
          punctuation: /[<>]/,
          'class-name': /\w+/,
        },
      },
    }),
    e.languages.insertBefore('v', 'function', {
      'generic-function': {
        pattern: /\b\w+\s*<\w+>(?=\()/,
        inside: {
          function: /^\w+/,
          generic: {
            pattern: /<\w+>/,
            inside: e.languages.v.generic.inside,
          },
        },
      },
    });
})(Prism);
!(function (e) {
  e.languages.velocity = e.languages.extend('markup', {});
  var n = {
    variable: {
      pattern:
        /(^|[^\\](?:\\\\)*)\$!?(?:[a-z][\w-]*(?:\([^)]*\))?(?:\.[a-z][\w-]*(?:\([^)]*\))?|\[[^\]]+\])*|\{[^}]+\})/i,
      lookbehind: !0,
      inside: {},
    },
    string: {
      pattern: /"[^"]*"|'[^']*'/,
      greedy: !0,
    },
    number: /\b\d+\b/,
    boolean: /\b(?:false|true)\b/,
    operator: /[=!<>]=?|[+*/%-]|&&|\|\||\.\.|\b(?:eq|g[et]|l[et]|n(?:e|ot))\b/,
    punctuation: /[(){}[\]:,.]/,
  };
  (n.variable.inside = {
    string: n.string,
    function: {
      pattern: /([^\w-])[a-z][\w-]*(?=\()/,
      lookbehind: !0,
    },
    number: n.number,
    boolean: n.boolean,
    punctuation: n.punctuation,
  }),
    e.languages.insertBefore('velocity', 'comment', {
      unparsed: {
        pattern: /(^|[^\\])#\[\[[\s\S]*?\]\]#/,
        lookbehind: !0,
        greedy: !0,
        inside: {
          punctuation: /^#\[\[|\]\]#$/,
        },
      },
      'velocity-comment': [
        {
          pattern: /(^|[^\\])#\*[\s\S]*?\*#/,
          lookbehind: !0,
          greedy: !0,
          alias: 'comment',
        },
        {
          pattern: /(^|[^\\])##.*/,
          lookbehind: !0,
          greedy: !0,
          alias: 'comment',
        },
      ],
      directive: {
        pattern:
          /(^|[^\\](?:\\\\)*)#@?(?:[a-z][\w-]*|\{[a-z][\w-]*\})(?:\s*\((?:[^()]|\([^()]*\))*\))?/i,
        lookbehind: !0,
        inside: {
          keyword: {
            pattern: /^#@?(?:[a-z][\w-]*|\{[a-z][\w-]*\})|\bin\b/,
            inside: {
              punctuation: /[{}]/,
            },
          },
          rest: n,
        },
      },
      variable: n.variable,
    }),
    (e.languages.velocity.tag.inside['attr-value'].inside.rest =
      e.languages.velocity);
})(Prism);
Prism.languages.verilog = {
  comment: {
    pattern: /\/\/.*|\/\*[\s\S]*?\*\//,
    greedy: !0,
  },
  string: {
    pattern: /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,
    greedy: !0,
  },
  'kernel-function': {
    pattern: /\B\$\w+\b/,
    alias: 'property',
  },
  constant: /\B`\w+\b/,
  function: /\b\w+(?=\()/,
  keyword:
    /\b(?:alias|and|assert|assign|assume|automatic|before|begin|bind|bins|binsof|bit|break|buf|bufif0|bufif1|byte|case|casex|casez|cell|chandle|class|clocking|cmos|config|const|constraint|context|continue|cover|covergroup|coverpoint|cross|deassign|default|defparam|design|disable|dist|do|edge|else|end|endcase|endclass|endclocking|endconfig|endfunction|endgenerate|endgroup|endinterface|endmodule|endpackage|endprimitive|endprogram|endproperty|endsequence|endspecify|endtable|endtask|enum|event|expect|export|extends|extern|final|first_match|for|force|foreach|forever|fork|forkjoin|function|generate|genvar|highz0|highz1|if|iff|ifnone|ignore_bins|illegal_bins|import|incdir|include|initial|inout|input|inside|instance|int|integer|interface|intersect|join|join_any|join_none|large|liblist|library|local|localparam|logic|longint|macromodule|matches|medium|modport|module|nand|negedge|new|nmos|nor|noshowcancelled|not|notif0|notif1|null|or|output|package|packed|parameter|pmos|posedge|primitive|priority|program|property|protected|pull0|pull1|pulldown|pullup|pulsestyle_ondetect|pulsestyle_onevent|pure|rand|randc|randcase|randsequence|rcmos|real|realtime|ref|reg|release|repeat|return|rnmos|rpmos|rtran|rtranif0|rtranif1|scalared|sequence|shortint|shortreal|showcancelled|signed|small|solve|specify|specparam|static|string|strong0|strong1|struct|super|supply0|supply1|table|tagged|task|this|throughout|time|timeprecision|timeunit|tran|tranif0|tranif1|tri|tri0|tri1|triand|trior|trireg|type|typedef|union|unique|unsigned|use|uwire|var|vectored|virtual|void|wait|wait_order|wand|weak0|weak1|while|wildcard|wire|with|within|wor|xnor|xor)\b/,
  important: /\b(?:always|always_comb|always_ff|always_latch)\b(?: *@)?/,
  number:
    /\B##?\d+|(?:\b\d+)?'[odbh] ?[\da-fzx_?]+|\b(?:\d*[._])?\d+(?:e[-+]?\d+)?/i,
  operator: /[-+{}^~%*\/?=!<>&|]+/,
  punctuation: /[[\];(),.:]/,
};
Prism.languages.vhdl = {
  comment: /--.+/,
  'vhdl-vectors': {
    pattern: /\b[oxb]"[\da-f_]+"|"[01uxzwlh-]+"/i,
    alias: 'number',
  },
  'quoted-function': {
    pattern: /"\S+?"(?=\()/,
    alias: 'function',
  },
  string: /"(?:[^\\"\r\n]|\\(?:\r\n|[\s\S]))*"/,
  attribute: {
    pattern: /\b'\w+/,
    alias: 'attr-name',
  },
  keyword:
    /\b(?:access|after|alias|all|architecture|array|assert|attribute|begin|block|body|buffer|bus|case|component|configuration|constant|disconnect|downto|else|elsif|end|entity|exit|file|for|function|generate|generic|group|guarded|if|impure|in|inertial|inout|is|label|library|linkage|literal|loop|map|new|next|null|of|on|open|others|out|package|port|postponed|private|procedure|process|pure|range|record|register|reject|report|return|select|severity|shared|signal|subtype|then|to|transport|type|unaffected|units|until|use|variable|view|wait|when|while|with)\b/i,
  boolean: /\b(?:false|true)\b/i,
  function: /\w+(?=\()/,
  number: /'[01uxzwlh-]'|\b(?:\d+#[\da-f_.]+#|\d[\d_.]*)(?:e[-+]?\d+)?/i,
  operator:
    /[<>]=?|:=|[-+*/&=]|\b(?:abs|and|mod|nand|nor|not|or|rem|rol|ror|sla|sll|sra|srl|xnor|xor)\b/i,
  punctuation: /[{}[\];(),.:]/,
};
Prism.languages.vim = {
  string: /"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\r\n]|'')*'/,
  comment: /".*/,
  function: /\b\w+(?=\()/,
  keyword:
    /\b(?:N|Next|P|Print|X|XMLent|XMLns|ab|abbreviate|abc|abclear|abo|aboveleft|al|all|ar|arga|argadd|argd|argdelete|argdo|arge|argedit|argg|argglobal|argl|arglocal|args|argu|argument|as|ascii|b|bN|bNext|ba|bad|badd|ball|bd|bdelete|be|bel|belowright|bf|bfirst|bl|blast|bm|bmodified|bn|bnext|bo|botright|bp|bprevious|br|brea|break|breaka|breakadd|breakd|breakdel|breakl|breaklist|brewind|bro|browse|bufdo|buffer|buffers|bun|bunload|bw|bwipeout|c|cN|cNext|cNfcNfile|ca|cabbrev|cabc|cabclear|cad|caddb|caddbuffer|caddexpr|caddf|caddfile|cal|call|cat|catch|cb|cbuffer|cc|ccl|cclose|cd|ce|center|cex|cexpr|cf|cfile|cfir|cfirst|cg|cgetb|cgetbuffer|cgete|cgetexpr|cgetfile|change|changes|chd|chdir|che|checkpath|checkt|checktime|cl|cla|clast|clist|clo|close|cmapc|cmapclear|cn|cnew|cnewer|cnext|cnf|cnfile|cnorea|cnoreabbrev|co|col|colder|colo|colorscheme|comc|comclear|comp|compiler|con|conf|confirm|continue|cope|copen|copy|cp|cpf|cpfile|cprevious|cq|cquit|cr|crewind|cu|cuna|cunabbrev|cunmap|cw|cwindow|d|debugg|debuggreedy|delc|delcommand|delete|delf|delfunction|delm|delmarks|di|diffg|diffget|diffoff|diffpatch|diffpu|diffput|diffsplit|diffthis|diffu|diffupdate|dig|digraphs|display|dj|djump|dl|dlist|dr|drop|ds|dsearch|dsp|dsplit|e|earlier|echoe|echoerr|echom|echomsg|echon|edit|el|else|elsei|elseif|em|emenu|en|endf|endfo|endfor|endfun|endfunction|endif|endt|endtry|endw|endwhile|ene|enew|ex|exi|exit|exu|exusage|f|file|files|filetype|fin|fina|finally|find|fini|finish|fir|first|fix|fixdel|fo|fold|foldc|foldclose|foldd|folddoc|folddoclosed|folddoopen|foldo|foldopen|for|fu|fun|function|go|goto|gr|grep|grepa|grepadd|h|ha|hardcopy|help|helpf|helpfind|helpg|helpgrep|helpt|helptags|hid|hide|his|history|ia|iabbrev|iabc|iabclear|if|ij|ijump|il|ilist|imapc|imapclear|in|inorea|inoreabbrev|isearch|isp|isplit|iu|iuna|iunabbrev|iunmap|j|join|ju|jumps|k|kee|keepalt|keepj|keepjumps|keepmarks|l|lN|lNext|lNf|lNfile|la|lad|laddb|laddbuffer|laddexpr|laddf|laddfile|lan|language|last|later|lb|lbuffer|lc|lcd|lch|lchdir|lcl|lclose|left|lefta|leftabove|let|lex|lexpr|lf|lfile|lfir|lfirst|lg|lgetb|lgetbuffer|lgete|lgetexpr|lgetfile|lgr|lgrep|lgrepa|lgrepadd|lh|lhelpgrep|list|ll|lla|llast|lli|llist|lm|lmak|lmake|lmap|lmapc|lmapclear|ln|lne|lnew|lnewer|lnext|lnf|lnfile|lnoremap|lo|loadview|loc|lockmarks|lockv|lockvar|lol|lolder|lop|lopen|lp|lpf|lpfile|lprevious|lr|lrewind|ls|lt|ltag|lu|lunmap|lv|lvimgrep|lvimgrepa|lvimgrepadd|lw|lwindow|m|ma|mak|make|mark|marks|mat|match|menut|menutranslate|mk|mkexrc|mks|mksession|mksp|mkspell|mkv|mkvie|mkview|mkvimrc|mod|mode|move|mz|mzf|mzfile|mzscheme|n|nbkey|new|next|nmapc|nmapclear|noh|nohlsearch|norea|noreabbrev|nu|number|nun|nunmap|o|omapc|omapclear|on|only|open|opt|options|ou|ounmap|p|pc|pclose|pe|ped|pedit|perl|perld|perldo|po|pop|popu|popup|pp|ppop|pre|preserve|prev|previous|print|prof|profd|profdel|profile|promptf|promptfind|promptr|promptrepl|ps|psearch|ptN|ptNext|pta|ptag|ptf|ptfirst|ptj|ptjump|ptl|ptlast|ptn|ptnext|ptp|ptprevious|ptr|ptrewind|pts|ptselect|pu|put|pw|pwd|py|pyf|pyfile|python|q|qa|qall|quit|quita|quitall|r|read|rec|recover|red|redi|redir|redo|redr|redraw|redraws|redrawstatus|reg|registers|res|resize|ret|retab|retu|return|rew|rewind|ri|right|rightb|rightbelow|ru|rub|ruby|rubyd|rubydo|rubyf|rubyfile|runtime|rv|rviminfo|sN|sNext|sa|sal|sall|san|sandbox|sargument|sav|saveas|sb|sbN|sbNext|sba|sball|sbf|sbfirst|sbl|sblast|sbm|sbmodified|sbn|sbnext|sbp|sbprevious|sbr|sbrewind|sbuffer|scrip|scripte|scriptencoding|scriptnames|se|set|setf|setfiletype|setg|setglobal|setl|setlocal|sf|sfind|sfir|sfirst|sh|shell|sign|sil|silent|sim|simalt|sl|sla|slast|sleep|sm|smagic|smap|smapc|smapclear|sme|smenu|sn|snext|sni|sniff|sno|snomagic|snor|snoremap|snoreme|snoremenu|so|sor|sort|source|sp|spe|spelld|spelldump|spellgood|spelli|spellinfo|spellr|spellrepall|spellu|spellundo|spellw|spellwrong|split|spr|sprevious|sre|srewind|st|sta|stag|star|startg|startgreplace|startinsert|startr|startreplace|stj|stjump|stop|stopi|stopinsert|sts|stselect|sun|sunhide|sunm|sunmap|sus|suspend|sv|sview|syncbind|t|tN|tNext|ta|tab|tabN|tabNext|tabc|tabclose|tabd|tabdo|tabe|tabedit|tabf|tabfind|tabfir|tabfirst|tabl|tablast|tabm|tabmove|tabn|tabnew|tabnext|tabo|tabonly|tabp|tabprevious|tabr|tabrewind|tabs|tag|tags|tc|tcl|tcld|tcldo|tclf|tclfile|te|tearoff|tf|tfirst|th|throw|tj|tjump|tl|tlast|tm|tmenu|tn|tnext|to|topleft|tp|tprevious|tr|trewind|try|ts|tselect|tu|tunmenu|u|una|unabbreviate|undo|undoj|undojoin|undol|undolist|unh|unhide|unlet|unlo|unlockvar|unm|unmap|up|update|ve|verb|verbose|version|vert|vertical|vi|vie|view|vim|vimgrep|vimgrepa|vimgrepadd|visual|viu|viusage|vmapc|vmapclear|vne|vnew|vs|vsplit|vu|vunmap|w|wN|wNext|wa|wall|wh|while|win|winc|wincmd|windo|winp|winpos|winsize|wn|wnext|wp|wprevious|wq|wqa|wqall|write|ws|wsverb|wv|wviminfo|x|xa|xall|xit|xm|xmap|xmapc|xmapclear|xme|xmenu|xn|xnoremap|xnoreme|xnoremenu|xu|xunmap|y|yank)\b/,
  builtin:
    /\b(?:acd|ai|akm|aleph|allowrevins|altkeymap|ambiwidth|ambw|anti|antialias|arab|arabic|arabicshape|ari|arshape|autochdir|autocmd|autoindent|autoread|autowrite|autowriteall|aw|awa|background|backspace|backup|backupcopy|backupdir|backupext|backupskip|balloondelay|ballooneval|balloonexpr|bdir|bdlay|beval|bex|bexpr|bg|bh|bin|binary|biosk|bioskey|bk|bkc|bomb|breakat|brk|browsedir|bs|bsdir|bsk|bt|bufhidden|buflisted|buftype|casemap|ccv|cdpath|cedit|cfu|ch|charconvert|ci|cin|cindent|cink|cinkeys|cino|cinoptions|cinw|cinwords|clipboard|cmdheight|cmdwinheight|cmp|cms|columns|com|comments|commentstring|compatible|complete|completefunc|completeopt|consk|conskey|copyindent|cot|cpo|cpoptions|cpt|cscopepathcomp|cscopeprg|cscopequickfix|cscopetag|cscopetagorder|cscopeverbose|cspc|csprg|csqf|cst|csto|csverb|cuc|cul|cursorcolumn|cursorline|cwh|debug|deco|def|define|delcombine|dex|dg|dict|dictionary|diff|diffexpr|diffopt|digraph|dip|dir|directory|dy|ea|ead|eadirection|eb|ed|edcompatible|ef|efm|ei|ek|enc|encoding|endofline|eol|ep|equalalways|equalprg|errorbells|errorfile|errorformat|esckeys|et|eventignore|expandtab|exrc|fcl|fcs|fdc|fde|fdi|fdl|fdls|fdm|fdn|fdo|fdt|fen|fenc|fencs|fex|ff|ffs|fileencoding|fileencodings|fileformat|fileformats|fillchars|fk|fkmap|flp|fml|fmr|foldcolumn|foldenable|foldexpr|foldignore|foldlevel|foldlevelstart|foldmarker|foldmethod|foldminlines|foldnestmax|foldtext|formatexpr|formatlistpat|formatoptions|formatprg|fp|fs|fsync|ft|gcr|gd|gdefault|gfm|gfn|gfs|gfw|ghr|gp|grepformat|grepprg|gtl|gtt|guicursor|guifont|guifontset|guifontwide|guiheadroom|guioptions|guipty|guitablabel|guitabtooltip|helpfile|helpheight|helplang|hf|hh|hi|hidden|highlight|hk|hkmap|hkmapp|hkp|hl|hlg|hls|hlsearch|ic|icon|iconstring|ignorecase|im|imactivatekey|imak|imc|imcmdline|imd|imdisable|imi|iminsert|ims|imsearch|inc|include|includeexpr|incsearch|inde|indentexpr|indentkeys|indk|inex|inf|infercase|insertmode|invacd|invai|invakm|invallowrevins|invaltkeymap|invanti|invantialias|invar|invarab|invarabic|invarabicshape|invari|invarshape|invautochdir|invautoindent|invautoread|invautowrite|invautowriteall|invaw|invawa|invbackup|invballooneval|invbeval|invbin|invbinary|invbiosk|invbioskey|invbk|invbl|invbomb|invbuflisted|invcf|invci|invcin|invcindent|invcompatible|invconfirm|invconsk|invconskey|invcopyindent|invcp|invcscopetag|invcscopeverbose|invcst|invcsverb|invcuc|invcul|invcursorcolumn|invcursorline|invdeco|invdelcombine|invdg|invdiff|invdigraph|invdisable|invea|inveb|inved|invedcompatible|invek|invendofline|inveol|invequalalways|inverrorbells|invesckeys|invet|invex|invexpandtab|invexrc|invfen|invfk|invfkmap|invfoldenable|invgd|invgdefault|invguipty|invhid|invhidden|invhk|invhkmap|invhkmapp|invhkp|invhls|invhlsearch|invic|invicon|invignorecase|invim|invimc|invimcmdline|invimd|invincsearch|invinf|invinfercase|invinsertmode|invis|invjoinspaces|invjs|invlazyredraw|invlbr|invlinebreak|invlisp|invlist|invloadplugins|invlpl|invlz|invma|invmacatsui|invmagic|invmh|invml|invmod|invmodeline|invmodifiable|invmodified|invmore|invmousef|invmousefocus|invmousehide|invnu|invnumber|invodev|invopendevice|invpaste|invpi|invpreserveindent|invpreviewwindow|invprompt|invpvw|invreadonly|invremap|invrestorescreen|invrevins|invri|invrightleft|invrightleftcmd|invrl|invrlc|invro|invrs|invru|invruler|invsb|invsc|invscb|invscrollbind|invscs|invsecure|invsft|invshellslash|invshelltemp|invshiftround|invshortname|invshowcmd|invshowfulltag|invshowmatch|invshowmode|invsi|invsm|invsmartcase|invsmartindent|invsmarttab|invsmd|invsn|invsol|invspell|invsplitbelow|invsplitright|invspr|invsr|invssl|invsta|invstartofline|invstmp|invswapfile|invswf|invta|invtagbsearch|invtagrelative|invtagstack|invtbi|invtbidi|invtbs|invtermbidi|invterse|invtextauto|invtextmode|invtf|invtgst|invtildeop|invtimeout|invtitle|invto|invtop|invtr|invttimeout|invttybuiltin|invttyfast|invtx|invvb|invvisualbell|invwa|invwarn|invwb|invweirdinvert|invwfh|invwfw|invwildmenu|invwinfixheight|invwinfixwidth|invwiv|invwmnu|invwrap|invwrapscan|invwrite|invwriteany|invwritebackup|invws|isf|isfname|isi|isident|isk|iskeyword|isprint|joinspaces|js|key|keymap|keymodel|keywordprg|km|kmp|kp|langmap|langmenu|laststatus|lazyredraw|lbr|lcs|linebreak|lines|linespace|lisp|lispwords|listchars|loadplugins|lpl|lsp|lz|macatsui|magic|makeef|makeprg|matchpairs|matchtime|maxcombine|maxfuncdepth|maxmapdepth|maxmem|maxmempattern|maxmemtot|mco|mef|menuitems|mfd|mh|mis|mkspellmem|ml|mls|mm|mmd|mmp|mmt|modeline|modelines|modifiable|modified|more|mouse|mousef|mousefocus|mousehide|mousem|mousemodel|mouses|mouseshape|mouset|mousetime|mp|mps|msm|mzq|mzquantum|nf|noacd|noai|noakm|noallowrevins|noaltkeymap|noanti|noantialias|noar|noarab|noarabic|noarabicshape|noari|noarshape|noautochdir|noautoindent|noautoread|noautowrite|noautowriteall|noaw|noawa|nobackup|noballooneval|nobeval|nobin|nobinary|nobiosk|nobioskey|nobk|nobl|nobomb|nobuflisted|nocf|noci|nocin|nocindent|nocompatible|noconfirm|noconsk|noconskey|nocopyindent|nocp|nocscopetag|nocscopeverbose|nocst|nocsverb|nocuc|nocul|nocursorcolumn|nocursorline|nodeco|nodelcombine|nodg|nodiff|nodigraph|nodisable|noea|noeb|noed|noedcompatible|noek|noendofline|noeol|noequalalways|noerrorbells|noesckeys|noet|noex|noexpandtab|noexrc|nofen|nofk|nofkmap|nofoldenable|nogd|nogdefault|noguipty|nohid|nohidden|nohk|nohkmap|nohkmapp|nohkp|nohls|noic|noicon|noignorecase|noim|noimc|noimcmdline|noimd|noincsearch|noinf|noinfercase|noinsertmode|nois|nojoinspaces|nojs|nolazyredraw|nolbr|nolinebreak|nolisp|nolist|noloadplugins|nolpl|nolz|noma|nomacatsui|nomagic|nomh|noml|nomod|nomodeline|nomodifiable|nomodified|nomore|nomousef|nomousefocus|nomousehide|nonu|nonumber|noodev|noopendevice|nopaste|nopi|nopreserveindent|nopreviewwindow|noprompt|nopvw|noreadonly|noremap|norestorescreen|norevins|nori|norightleft|norightleftcmd|norl|norlc|noro|nors|noru|noruler|nosb|nosc|noscb|noscrollbind|noscs|nosecure|nosft|noshellslash|noshelltemp|noshiftround|noshortname|noshowcmd|noshowfulltag|noshowmatch|noshowmode|nosi|nosm|nosmartcase|nosmartindent|nosmarttab|nosmd|nosn|nosol|nospell|nosplitbelow|nosplitright|nospr|nosr|nossl|nosta|nostartofline|nostmp|noswapfile|noswf|nota|notagbsearch|notagrelative|notagstack|notbi|notbidi|notbs|notermbidi|noterse|notextauto|notextmode|notf|notgst|notildeop|notimeout|notitle|noto|notop|notr|nottimeout|nottybuiltin|nottyfast|notx|novb|novisualbell|nowa|nowarn|nowb|noweirdinvert|nowfh|nowfw|nowildmenu|nowinfixheight|nowinfixwidth|nowiv|nowmnu|nowrap|nowrapscan|nowrite|nowriteany|nowritebackup|nows|nrformats|numberwidth|nuw|odev|oft|ofu|omnifunc|opendevice|operatorfunc|opfunc|osfiletype|pa|para|paragraphs|paste|pastetoggle|patchexpr|patchmode|path|pdev|penc|pex|pexpr|pfn|ph|pheader|pi|pm|pmbcs|pmbfn|popt|preserveindent|previewheight|previewwindow|printdevice|printencoding|printexpr|printfont|printheader|printmbcharset|printmbfont|printoptions|prompt|pt|pumheight|pvh|pvw|qe|quoteescape|readonly|remap|report|restorescreen|revins|rightleft|rightleftcmd|rl|rlc|ro|rs|rtp|ruf|ruler|rulerformat|runtimepath|sbo|sc|scb|scr|scroll|scrollbind|scrolljump|scrolloff|scrollopt|scs|sect|sections|secure|sel|selection|selectmode|sessionoptions|sft|shcf|shellcmdflag|shellpipe|shellquote|shellredir|shellslash|shelltemp|shelltype|shellxquote|shiftround|shiftwidth|shm|shortmess|shortname|showbreak|showcmd|showfulltag|showmatch|showmode|showtabline|shq|si|sidescroll|sidescrolloff|siso|sj|slm|smartcase|smartindent|smarttab|smc|smd|softtabstop|sol|spc|spell|spellcapcheck|spellfile|spelllang|spellsuggest|spf|spl|splitbelow|splitright|sps|sr|srr|ss|ssl|ssop|stal|startofline|statusline|stl|stmp|su|sua|suffixes|suffixesadd|sw|swapfile|swapsync|swb|swf|switchbuf|sws|sxq|syn|synmaxcol|syntax|t_AB|t_AF|t_AL|t_CS|t_CV|t_Ce|t_Co|t_Cs|t_DL|t_EI|t_F1|t_F2|t_F3|t_F4|t_F5|t_F6|t_F7|t_F8|t_F9|t_IE|t_IS|t_K1|t_K3|t_K4|t_K5|t_K6|t_K7|t_K8|t_K9|t_KA|t_KB|t_KC|t_KD|t_KE|t_KF|t_KG|t_KH|t_KI|t_KJ|t_KK|t_KL|t_RI|t_RV|t_SI|t_Sb|t_Sf|t_WP|t_WS|t_ZH|t_ZR|t_al|t_bc|t_cd|t_ce|t_cl|t_cm|t_cs|t_da|t_db|t_dl|t_fs|t_k1|t_k2|t_k3|t_k4|t_k5|t_k6|t_k7|t_k8|t_k9|t_kB|t_kD|t_kI|t_kN|t_kP|t_kb|t_kd|t_ke|t_kh|t_kl|t_kr|t_ks|t_ku|t_le|t_mb|t_md|t_me|t_mr|t_ms|t_nd|t_op|t_se|t_so|t_sr|t_te|t_ti|t_ts|t_ue|t_us|t_ut|t_vb|t_ve|t_vi|t_vs|t_xs|tabline|tabpagemax|tabstop|tagbsearch|taglength|tagrelative|tagstack|tal|tb|tbi|tbidi|tbis|tbs|tenc|term|termbidi|termencoding|terse|textauto|textmode|textwidth|tgst|thesaurus|tildeop|timeout|timeoutlen|title|titlelen|titleold|titlestring|toolbar|toolbariconsize|top|tpm|tsl|tsr|ttimeout|ttimeoutlen|ttm|tty|ttybuiltin|ttyfast|ttym|ttymouse|ttyscroll|ttytype|tw|tx|uc|ul|undolevels|updatecount|updatetime|ut|vb|vbs|vdir|verbosefile|vfile|viewdir|viewoptions|viminfo|virtualedit|visualbell|vop|wak|warn|wb|wc|wcm|wd|weirdinvert|wfh|wfw|whichwrap|wi|wig|wildchar|wildcharm|wildignore|wildmenu|wildmode|wildoptions|wim|winaltkeys|window|winfixheight|winfixwidth|winheight|winminheight|winminwidth|winwidth|wiv|wiw|wm|wmh|wmnu|wmw|wop|wrap|wrapmargin|wrapscan|writeany|writebackup|writedelay|ww)\b/,
  number: /\b(?:0x[\da-f]+|\d+(?:\.\d+)?)\b/i,
  operator:
    /\|\||&&|[-+.]=?|[=!](?:[=~][#?]?)?|[<>]=?[#?]?|[*\/%?]|\b(?:is(?:not)?)\b/,
  punctuation: /[{}[\](),;:]/,
};
(Prism.languages['visual-basic'] = {
  comment: {
    pattern: /(?:['‘’]|REM\b)(?:[^\r\n_]|_(?:\r\n?|\n)?)*/i,
    inside: {
      keyword: /^REM/i,
    },
  },
  directive: {
    pattern:
      /#(?:Const|Else|ElseIf|End|ExternalChecksum|ExternalSource|If|Region)(?:\b_[ \t]*(?:\r\n?|\n)|.)+/i,
    alias: 'property',
    greedy: !0,
  },
  string: {
    pattern: /\$?["“”](?:["“”]{2}|[^"“”])*["“”]C?/i,
    greedy: !0,
  },
  date: {
    pattern:
      /#[ \t]*(?:\d+([/-])\d+\1\d+(?:[ \t]+(?:\d+[ \t]*(?:AM|PM)|\d+:\d+(?::\d+)?(?:[ \t]*(?:AM|PM))?))?|\d+[ \t]*(?:AM|PM)|\d+:\d+(?::\d+)?(?:[ \t]*(?:AM|PM))?)[ \t]*#/i,
    alias: 'number',
  },
  number:
    /(?:(?:\b\d+(?:\.\d+)?|\.\d+)(?:E[+-]?\d+)?|&[HO][\dA-F]+)(?:[FRD]|U?[ILS])?/i,
  boolean: /\b(?:False|Nothing|True)\b/i,
  keyword:
    /\b(?:AddHandler|AddressOf|Alias|And(?:Also)?|As|Boolean|ByRef|Byte|ByVal|Call|Case|Catch|C(?:Bool|Byte|Char|Date|Dbl|Dec|Int|Lng|Obj|SByte|Short|Sng|Str|Type|UInt|ULng|UShort)|Char|Class|Const|Continue|Currency|Date|Decimal|Declare|Default|Delegate|Dim|DirectCast|Do|Double|Each|Else(?:If)?|End(?:If)?|Enum|Erase|Error|Event|Exit|Finally|For|Friend|Function|Get(?:Type|XMLNamespace)?|Global|GoSub|GoTo|Handles|If|Implements|Imports|In|Inherits|Integer|Interface|Is|IsNot|Let|Lib|Like|Long|Loop|Me|Mod|Module|Must(?:Inherit|Override)|My(?:Base|Class)|Namespace|Narrowing|New|Next|Not(?:Inheritable|Overridable)?|Object|Of|On|Operator|Option(?:al)?|Or(?:Else)?|Out|Overloads|Overridable|Overrides|ParamArray|Partial|Private|Property|Protected|Public|RaiseEvent|ReadOnly|ReDim|RemoveHandler|Resume|Return|SByte|Select|Set|Shadows|Shared|short|Single|Static|Step|Stop|String|Structure|Sub|SyncLock|Then|Throw|To|Try|TryCast|Type|TypeOf|U(?:Integer|Long|Short)|Until|Using|Variant|Wend|When|While|Widening|With(?:Events)?|WriteOnly|Xor)\b/i,
  operator: /[+\-*/\\^<=>&#@$%!]|\b_(?=[ \t]*[\r\n])/,
  punctuation: /[{}().,:?]/,
}),
  (Prism.languages.vb = Prism.languages['visual-basic']),
  (Prism.languages.vba = Prism.languages['visual-basic']);
Prism.languages.warpscript = {
  comment: /#.*|\/\/.*|\/\*[\s\S]*?\*\//,
  string: {
    pattern:
      /"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*'|<'(?:[^\\']|'(?!>)|\\.)*'>/,
    greedy: !0,
  },
  variable: /\$\S+/,
  macro: {
    pattern: /@\S+/,
    alias: 'property',
  },
  keyword:
    /\b(?:BREAK|CHECKMACRO|CONTINUE|CUDF|DEFINED|DEFINEDMACRO|EVAL|FAIL|FOR|FOREACH|FORSTEP|IFT|IFTE|MSGFAIL|NRETURN|RETHROW|RETURN|SWITCH|TRY|UDF|UNTIL|WHILE)\b/,
  number:
    /[+-]?\b(?:NaN|Infinity|\d+(?:\.\d*)?(?:[Ee][+-]?\d+)?|0x[\da-fA-F]+|0b[01]+)\b/,
  boolean: /\b(?:F|T|false|true)\b/,
  punctuation: /<%|%>|[{}[\]()]/,
  operator:
    /==|&&?|\|\|?|\*\*?|>>>?|<<|[<>!~]=?|[-/%^]|\+!?|\b(?:AND|NOT|OR)\b/,
};
Prism.languages.wasm = {
  comment: [
    /\(;[\s\S]*?;\)/,
    {
      pattern: /;;.*/,
      greedy: !0,
    },
  ],
  string: {
    pattern: /"(?:\\[\s\S]|[^"\\])*"/,
    greedy: !0,
  },
  keyword: [
    {
      pattern: /\b(?:align|offset)=/,
      inside: {
        operator: /=/,
      },
    },
    {
      pattern:
        /\b(?:(?:f32|f64|i32|i64)(?:\.(?:abs|add|and|ceil|clz|const|convert_[su]\/i(?:32|64)|copysign|ctz|demote\/f64|div(?:_[su])?|eqz?|extend_[su]\/i32|floor|ge(?:_[su])?|gt(?:_[su])?|le(?:_[su])?|load(?:(?:8|16|32)_[su])?|lt(?:_[su])?|max|min|mul|neg?|nearest|or|popcnt|promote\/f32|reinterpret\/[fi](?:32|64)|rem_[su]|rot[lr]|shl|shr_[su]|sqrt|store(?:8|16|32)?|sub|trunc(?:_[su]\/f(?:32|64))?|wrap\/i64|xor))?|memory\.(?:grow|size))\b/,
      inside: {
        punctuation: /\./,
      },
    },
    /\b(?:anyfunc|block|br(?:_if|_table)?|call(?:_indirect)?|data|drop|elem|else|end|export|func|get_(?:global|local)|global|if|import|local|loop|memory|module|mut|nop|offset|param|result|return|select|set_(?:global|local)|start|table|tee_local|then|type|unreachable)\b/,
  ],
  variable: /\$[\w!#$%&'*+\-./:<=>?@\\^`|~]+/,
  number:
    /[+-]?\b(?:\d(?:_?\d)*(?:\.\d(?:_?\d)*)?(?:[eE][+-]?\d(?:_?\d)*)?|0x[\da-fA-F](?:_?[\da-fA-F])*(?:\.[\da-fA-F](?:_?[\da-fA-D])*)?(?:[pP][+-]?\d(?:_?\d)*)?)\b|\binf\b|\bnan(?::0x[\da-fA-F](?:_?[\da-fA-D])*)?\b/,
  punctuation: /[()]/,
};
!(function (e) {
  var n = '(?:\\B-|\\b_|\\b)[A-Za-z][\\w-]*(?![\\w-])',
    t =
      '(?:\\b(?:unsigned\\s+)?long\\s+long(?![\\w-])|\\b(?:unrestricted|unsigned)\\s+[a-z]+(?![\\w-])|(?!(?:unrestricted|unsigned)\\b)' +
      n +
      '(?:\\s*<(?:[^<>]|<[^<>]*>)*>)?)(?:\\s*\\?)?',
    i = {};
  for (var r in ((e.languages['web-idl'] = {
    comment: {
      pattern: /\/\/.*|\/\*[\s\S]*?\*\//,
      greedy: !0,
    },
    string: {
      pattern: /"[^"]*"/,
      greedy: !0,
    },
    namespace: {
      pattern: RegExp('(\\bnamespace\\s+)' + n),
      lookbehind: !0,
    },
    'class-name': [
      {
        pattern:
          /(^|[^\w-])(?:iterable|maplike|setlike)\s*<(?:[^<>]|<[^<>]*>)*>/,
        lookbehind: !0,
        inside: i,
      },
      {
        pattern: RegExp(
          '(\\b(?:attribute|const|deleter|getter|optional|setter)\\s+)' + t,
        ),
        lookbehind: !0,
        inside: i,
      },
      {
        pattern: RegExp('(\\bcallback\\s+' + n + '\\s*=\\s*)' + t),
        lookbehind: !0,
        inside: i,
      },
      {
        pattern: RegExp('(\\btypedef\\b\\s*)' + t),
        lookbehind: !0,
        inside: i,
      },
      {
        pattern: RegExp(
          '(\\b(?:callback|dictionary|enum|interface(?:\\s+mixin)?)\\s+)(?!(?:interface|mixin)\\b)' +
            n,
        ),
        lookbehind: !0,
      },
      {
        pattern: RegExp('(:\\s*)' + n),
        lookbehind: !0,
      },
      RegExp(n + '(?=\\s+(?:implements|includes)\\b)'),
      {
        pattern: RegExp('(\\b(?:implements|includes)\\s+)' + n),
        lookbehind: !0,
      },
      {
        pattern: RegExp(t + '(?=\\s*(?:\\.{3}\\s*)?' + n + '\\s*[(),;=])'),
        inside: i,
      },
    ],
    builtin:
      /\b(?:ArrayBuffer|BigInt64Array|BigUint64Array|ByteString|DOMString|DataView|Float32Array|Float64Array|FrozenArray|Int16Array|Int32Array|Int8Array|ObservableArray|Promise|USVString|Uint16Array|Uint32Array|Uint8Array|Uint8ClampedArray)\b/,
    keyword: [
      /\b(?:async|attribute|callback|const|constructor|deleter|dictionary|enum|getter|implements|includes|inherit|interface|mixin|namespace|null|optional|or|partial|readonly|required|setter|static|stringifier|typedef|unrestricted)\b/,
      /\b(?:any|bigint|boolean|byte|double|float|iterable|long|maplike|object|octet|record|sequence|setlike|short|symbol|undefined|unsigned|void)\b/,
    ],
    boolean: /\b(?:false|true)\b/,
    number: {
      pattern:
        /(^|[^\w-])-?(?:0x[0-9a-f]+|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|NaN|Infinity)(?![\w-])/i,
      lookbehind: !0,
    },
    operator: /\.{3}|[=:?<>-]/,
    punctuation: /[(){}[\].,;]/,
  }),
  e.languages['web-idl']))
    'class-name' !== r && (i[r] = e.languages['web-idl'][r]);
  e.languages.webidl = e.languages['web-idl'];
})(Prism);
Prism.languages.wgsl = {
  comment: {
    pattern: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
    greedy: !0,
  },
  'builtin-attribute': {
    pattern: /(@)builtin\(.*?\)/,
    lookbehind: !0,
    inside: {
      attribute: {
        pattern: /^builtin/,
        alias: 'attr-name',
      },
      punctuation: /[(),]/,
      'built-in-values': {
        pattern:
          /\b(?:frag_depth|front_facing|global_invocation_id|instance_index|local_invocation_id|local_invocation_index|num_workgroups|position|sample_index|sample_mask|vertex_index|workgroup_id)\b/,
        alias: 'attr-value',
      },
    },
  },
  attributes: {
    pattern:
      /(@)(?:align|binding|compute|const|fragment|group|id|interpolate|invariant|location|size|vertex|workgroup_size)/i,
    lookbehind: !0,
    alias: 'attr-name',
  },
  functions: {
    pattern: /\b(fn\s+)[_a-zA-Z]\w*(?=[(<])/,
    lookbehind: !0,
    alias: 'function',
  },
  keyword:
    /\b(?:bitcast|break|case|const|continue|continuing|default|discard|else|enable|fallthrough|fn|for|function|if|let|loop|private|return|storage|struct|switch|type|uniform|var|while|workgroup)\b/,
  builtin:
    /\b(?:abs|acos|acosh|all|any|array|asin|asinh|atan|atan2|atanh|atomic|atomicAdd|atomicAnd|atomicCompareExchangeWeak|atomicExchange|atomicLoad|atomicMax|atomicMin|atomicOr|atomicStore|atomicSub|atomicXor|bool|ceil|clamp|cos|cosh|countLeadingZeros|countOneBits|countTrailingZeros|cross|degrees|determinant|distance|dot|dpdx|dpdxCoarse|dpdxFine|dpdy|dpdyCoarse|dpdyFine|exp|exp2|extractBits|f32|f64|faceForward|firstLeadingBit|floor|fma|fract|frexp|fwidth|fwidthCoarse|fwidthFine|i32|i64|insertBits|inverseSqrt|ldexp|length|log|log2|mat[2-4]x[2-4]|max|min|mix|modf|normalize|override|pack2x16float|pack2x16snorm|pack2x16unorm|pack4x8snorm|pack4x8unorm|pow|ptr|quantizeToF16|radians|reflect|refract|reverseBits|round|sampler|sampler_comparison|select|shiftLeft|shiftRight|sign|sin|sinh|smoothstep|sqrt|staticAssert|step|storageBarrier|tan|tanh|textureDimensions|textureGather|textureGatherCompare|textureLoad|textureNumLayers|textureNumLevels|textureNumSamples|textureSample|textureSampleBias|textureSampleCompare|textureSampleCompareLevel|textureSampleGrad|textureSampleLevel|textureStore|texture_1d|texture_2d|texture_2d_array|texture_3d|texture_cube|texture_cube_array|texture_depth_2d|texture_depth_2d_array|texture_depth_cube|texture_depth_cube_array|texture_depth_multisampled_2d|texture_multisampled_2d|texture_storage_1d|texture_storage_2d|texture_storage_2d_array|texture_storage_3d|transpose|trunc|u32|u64|unpack2x16float|unpack2x16snorm|unpack2x16unorm|unpack4x8snorm|unpack4x8unorm|vec[2-4]|workgroupBarrier)\b/,
  'function-calls': {
    pattern: /\b[_a-z]\w*(?=\()/i,
    alias: 'function',
  },
  'class-name': /\b(?:[A-Z][A-Za-z0-9]*)\b/,
  'bool-literal': {
    pattern: /\b(?:false|true)\b/,
    alias: 'boolean',
  },
  'hex-int-literal': {
    pattern: /\b0[xX][0-9a-fA-F]+[iu]?\b(?![.pP])/,
    alias: 'number',
  },
  'hex-float-literal': {
    pattern: /\b0[xX][0-9a-fA-F]*(?:\.[0-9a-fA-F]*)?(?:[pP][+-]?\d+[fh]?)?/,
    alias: 'number',
  },
  'decimal-float-literal': [
    {
      pattern: /\d*\.\d+(?:[eE](?:\+|-)?\d+)?[fh]?/,
      alias: 'number',
    },
    {
      pattern: /\d+\.\d*(?:[eE](?:\+|-)?\d+)?[fh]?/,
      alias: 'number',
    },
    {
      pattern: /\d+[eE](?:\+|-)?\d+[fh]?/,
      alias: 'number',
    },
    {
      pattern: /\b\d+[fh]\b/,
      alias: 'number',
    },
  ],
  'int-literal': {
    pattern: /\b\d+[iu]?\b/,
    alias: 'number',
  },
  operator: [
    {
      pattern: /(?:\^|~|\|(?!\|)|\|\||&&|<<|>>|!)(?!=)/,
    },
    {
      pattern: /&(?![&=])/,
    },
    {
      pattern: /(?:\+=|-=|\*=|\/=|%=|\^=|&=|\|=|<<=|>>=)/,
    },
    {
      pattern: /(^|[^<>=!])=(?![=>])/,
      lookbehind: !0,
    },
    {
      pattern: /(?:==|!=|<=|\+\+|--|(^|[^=])>=)/,
      lookbehind: !0,
    },
    {
      pattern: /(?:(?:[+%]|(?:\*(?!\w)))(?!=))|(?:-(?!>))|(?:\/(?!\/))/,
    },
    {
      pattern: /->/,
    },
  ],
  punctuation: /[@(){}[\],;<>:.]/,
};
(Prism.languages.wiki = Prism.languages.extend('markup', {
  'block-comment': {
    pattern: /(^|[^\\])\/\*[\s\S]*?\*\//,
    lookbehind: !0,
    alias: 'comment',
  },
  heading: {
    pattern: /^(=+)[^=\r\n].*?\1/m,
    inside: {
      punctuation: /^=+|=+$/,
      important: /.+/,
    },
  },
  emphasis: {
    pattern: /('{2,5}).+?\1/,
    inside: {
      'bold-italic': {
        pattern: /(''''').+?(?=\1)/,
        lookbehind: !0,
        alias: ['bold', 'italic'],
      },
      bold: {
        pattern: /(''')[^'](?:.*?[^'])?(?=\1)/,
        lookbehind: !0,
      },
      italic: {
        pattern: /('')[^'](?:.*?[^'])?(?=\1)/,
        lookbehind: !0,
      },
      punctuation: /^''+|''+$/,
    },
  },
  hr: {
    pattern: /^-{4,}/m,
    alias: 'punctuation',
  },
  url: [
    /ISBN +(?:97[89][ -]?)?(?:\d[ -]?){9}[\dx]\b|(?:PMID|RFC) +\d+/i,
    /\[\[.+?\]\]|\[.+?\]/,
  ],
  variable: [/__[A-Z]+__/, /\{{3}.+?\}{3}/, /\{\{.+?\}\}/],
  symbol: [/^#redirect/im, /~{3,5}/],
  'table-tag': {
    pattern: /((?:^|[|!])[|!])[^|\r\n]+\|(?!\|)/m,
    lookbehind: !0,
    inside: {
      'table-bar': {
        pattern: /\|$/,
        alias: 'punctuation',
      },
      rest: Prism.languages.markup.tag.inside,
    },
  },
  punctuation: /^(?:\{\||\|\}|\|-|[*#:;!|])|\|\||!!/m,
})),
  Prism.languages.insertBefore('wiki', 'tag', {
    nowiki: {
      pattern: /<(nowiki|pre|source)\b[^>]*>[\s\S]*?<\/\1>/i,
      inside: {
        tag: {
          pattern: /<(?:nowiki|pre|source)\b[^>]*>|<\/(?:nowiki|pre|source)>/i,
          inside: Prism.languages.markup.tag.inside,
        },
      },
    },
  });
(Prism.languages.wolfram = {
  comment: /\(\*(?:\(\*(?:[^*]|\*(?!\)))*\*\)|(?!\(\*)[\s\S])*?\*\)/,
  string: {
    pattern: /"(?:\\.|[^"\\\r\n])*"/,
    greedy: !0,
  },
  keyword:
    /\b(?:Abs|AbsArg|Accuracy|Block|Do|For|Function|If|Manipulate|Module|Nest|NestList|None|Return|Switch|Table|Which|While)\b/,
  context: {
    pattern: /\b\w+`+\w*/,
    alias: 'class-name',
  },
  blank: {
    pattern: /\b\w+_\b/,
    alias: 'regex',
  },
  'global-variable': {
    pattern: /\$\w+/,
    alias: 'variable',
  },
  boolean: /\b(?:False|True)\b/,
  number:
    /(?:\b(?=\d)|\B(?=\.))(?:0[bo])?(?:(?:\d|0x[\da-f])[\da-f]*(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?j?\b/i,
  operator:
    /\/\.|;|=\.|\^=|\^:=|:=|<<|>>|<\||\|>|:>|\|->|->|<-|@@@|@@|@|\/@|=!=|===|==|=|\+|-|\[\/-+%=\]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
  punctuation: /[{}[\];(),.:]/,
}),
  (Prism.languages.mathematica = Prism.languages.wolfram),
  (Prism.languages.wl = Prism.languages.wolfram),
  (Prism.languages.nb = Prism.languages.wolfram);
(Prism.languages.wren = {
  comment: [
    {
      pattern:
        /\/\*(?:[^*/]|\*(?!\/)|\/(?!\*)|\/\*(?:[^*/]|\*(?!\/)|\/(?!\*)|\/\*(?:[^*/]|\*(?!\/)|\/(?!\*))*\*\/)*\*\/)*\*\//,
      greedy: !0,
    },
    {
      pattern: /(^|[^\\:])\/\/.*/,
      lookbehind: !0,
      greedy: !0,
    },
  ],
  'triple-quoted-string': {
    pattern: /"""[\s\S]*?"""/,
    greedy: !0,
    alias: 'string',
  },
  'string-literal': null,
  hashbang: {
    pattern: /^#!\/.+/,
    greedy: !0,
    alias: 'comment',
  },
  attribute: {
    pattern: /#!?[ \t\u3000]*\w+/,
    alias: 'keyword',
  },
  'class-name': [
    {
      pattern: /(\bclass\s+)\w+/,
      lookbehind: !0,
    },
    /\b[A-Z][a-z\d_]*\b/,
  ],
  constant: /\b[A-Z][A-Z\d_]*\b/,
  null: {
    pattern: /\bnull\b/,
    alias: 'keyword',
  },
  keyword:
    /\b(?:as|break|class|construct|continue|else|for|foreign|if|import|in|is|return|static|super|this|var|while)\b/,
  boolean: /\b(?:false|true)\b/,
  number: /\b(?:0x[\da-f]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/i,
  function: /\b[a-z_]\w*(?=\s*[({])/i,
  operator: /<<|>>|[=!<>]=?|&&|\|\||[-+*/%~^&|?:]|\.{2,3}/,
  punctuation: /[\[\](){}.,;]/,
}),
  (Prism.languages.wren['string-literal'] = {
    pattern:
      /(^|[^\\"])"(?:[^\\"%]|\\[\s\S]|%(?!\()|%\((?:[^()]|\((?:[^()]|\([^)]*\))*\))*\))*"/,
    lookbehind: !0,
    greedy: !0,
    inside: {
      interpolation: {
        pattern:
          /((?:^|[^\\])(?:\\{2})*)%\((?:[^()]|\((?:[^()]|\([^)]*\))*\))*\)/,
        lookbehind: !0,
        inside: {
          expression: {
            pattern: /^(%\()[\s\S]+(?=\)$)/,
            lookbehind: !0,
            inside: Prism.languages.wren,
          },
          'interpolation-punctuation': {
            pattern: /^%\(|\)$/,
            alias: 'punctuation',
          },
        },
      },
      string: /[\s\S]+/,
    },
  });
!(function (n) {
  (n.languages.xeora = n.languages.extend('markup', {
    constant: {
      pattern: /\$(?:DomainContents|PageRenderDuration)\$/,
      inside: {
        punctuation: {
          pattern: /\$/,
        },
      },
    },
    variable: {
      pattern: /\$@?(?:#+|[-+*~=^])?[\w.]+\$/,
      inside: {
        punctuation: {
          pattern: /[$.]/,
        },
        operator: {
          pattern: /#+|[-+*~=^@]/,
        },
      },
    },
    'function-inline': {
      pattern:
        /\$F:[-\w.]+\?[-\w.]+(?:,(?:(?:@[-#]*\w+\.[\w+.]\.*)*\|)*(?:(?:[\w+]|[-#*.~^]+[\w+]|=\S)(?:[^$=]|=+[^=])*=*|(?:@[-#]*\w+\.[\w+.]\.*)+(?:(?:[\w+]|[-#*~^][-#*.~^]*[\w+]|=\S)(?:[^$=]|=+[^=])*=*)?)?)?\$/,
      inside: {
        variable: {
          pattern: /(?:[,|])@?(?:#+|[-+*~=^])?[\w.]+/,
          inside: {
            punctuation: {
              pattern: /[,.|]/,
            },
            operator: {
              pattern: /#+|[-+*~=^@]/,
            },
          },
        },
        punctuation: {
          pattern: /\$\w:|[$:?.,|]/,
        },
      },
      alias: 'function',
    },
    'function-block': {
      pattern:
        /\$XF:\{[-\w.]+\?[-\w.]+(?:,(?:(?:@[-#]*\w+\.[\w+.]\.*)*\|)*(?:(?:[\w+]|[-#*.~^]+[\w+]|=\S)(?:[^$=]|=+[^=])*=*|(?:@[-#]*\w+\.[\w+.]\.*)+(?:(?:[\w+]|[-#*~^][-#*.~^]*[\w+]|=\S)(?:[^$=]|=+[^=])*=*)?)?)?\}:XF\$/,
      inside: {
        punctuation: {
          pattern: /[$:{}?.,|]/,
        },
      },
      alias: 'function',
    },
    'directive-inline': {
      pattern: /\$\w(?:#\d+\+?)?(?:\[[-\w.]+\])?:[-\/\w.]+\$/,
      inside: {
        punctuation: {
          pattern: /\$(?:\w:|C(?:\[|#\d))?|[:{[\]]/,
          inside: {
            tag: {
              pattern: /#\d/,
            },
          },
        },
      },
      alias: 'function',
    },
    'directive-block-open': {
      pattern:
        /\$\w+:\{|\$\w(?:#\d+\+?)?(?:\[[-\w.]+\])?:[-\w.]+:\{(?:![A-Z]+)?/,
      inside: {
        punctuation: {
          pattern: /\$(?:\w:|C(?:\[|#\d))?|[:{[\]]/,
          inside: {
            tag: {
              pattern: /#\d/,
            },
          },
        },
        attribute: {
          pattern: /![A-Z]+$/,
          inside: {
            punctuation: {
              pattern: /!/,
            },
          },
          alias: 'keyword',
        },
      },
      alias: 'function',
    },
    'directive-block-separator': {
      pattern: /\}:[-\w.]+:\{/,
      inside: {
        punctuation: {
          pattern: /[:{}]/,
        },
      },
      alias: 'function',
    },
    'directive-block-close': {
      pattern: /\}:[-\w.]+\$/,
      inside: {
        punctuation: {
          pattern: /[:{}$]/,
        },
      },
      alias: 'function',
    },
  })),
    n.languages.insertBefore(
      'inside',
      'punctuation',
      {
        variable: n.languages.xeora['function-inline'].inside.variable,
      },
      n.languages.xeora['function-block'],
    ),
    (n.languages.xeoracube = n.languages.xeora);
})(Prism);
!(function (a) {
  function e(e, n) {
    a.languages[e] &&
      a.languages.insertBefore(e, 'comment', {
        'doc-comment': n,
      });
  }
  var n = a.languages.markup.tag,
    t = {
      pattern: /\/\/\/.*/,
      greedy: !0,
      alias: 'comment',
      inside: {
        tag: n,
      },
    },
    g = {
      pattern: /'''.*/,
      greedy: !0,
      alias: 'comment',
      inside: {
        tag: n,
      },
    };
  e('csharp', t), e('fsharp', t), e('vbnet', g);
})(Prism);
!(function () {
  if (
    'undefined' != typeof Prism &&
    'undefined' != typeof document &&
    document.querySelector
  ) {
    var e,
      t = 'line-numbers',
      i = 'linkable-line-numbers',
      n = /\n(?!$)/g,
      r = !0;
    Prism.plugins.lineHighlight = {
      highlightLines: function (o, u, c) {
        var h = (u =
            'string' == typeof u ? u : o.getAttribute('data-line') || '')
            .replace(/\s+/g, '')
            .split(',')
            .filter(Boolean),
          d = +o.getAttribute('data-line-offset') || 0,
          f = (
            (function () {
              if (void 0 === e) {
                var t = document.createElement('div');
                (t.style.fontSize = '13px'),
                  (t.style.lineHeight = '1.5'),
                  (t.style.padding = '0'),
                  (t.style.border = '0'),
                  (t.innerHTML = '&nbsp;<br />&nbsp;'),
                  document.body.appendChild(t),
                  (e = 38 === t.offsetHeight),
                  document.body.removeChild(t);
              }
              return e;
            })()
              ? parseInt
              : parseFloat
          )(getComputedStyle(o).lineHeight),
          p = Prism.util.isActive(o, t),
          g = o.querySelector('code'),
          m = p ? o : g || o,
          v = [],
          y = g.textContent.match(n),
          b = y ? y.length + 1 : 1,
          A =
            g && m != g
              ? (function (e, t) {
                  var i = getComputedStyle(e),
                    n = getComputedStyle(t);
                  function r(e) {
                    return +e.substr(0, e.length - 2);
                  }
                  return (
                    t.offsetTop +
                    r(n.borderTopWidth) +
                    r(n.paddingTop) -
                    r(i.paddingTop)
                  );
                })(o, g)
              : 0;
        h.forEach(function (e) {
          var t = e.split('-'),
            i = +t[0],
            n = +t[1] || i;
          if (!((n = Math.min(b + d, n)) < i)) {
            var r =
              o.querySelector('.line-highlight[data-range="' + e + '"]') ||
              document.createElement('div');
            if (
              (v.push(function () {
                r.setAttribute('aria-hidden', 'true'),
                  r.setAttribute('data-range', e),
                  (r.className = (c || '') + ' line-highlight');
              }),
              p && Prism.plugins.lineNumbers)
            ) {
              var s = Prism.plugins.lineNumbers.getLine(o, i),
                l = Prism.plugins.lineNumbers.getLine(o, n);
              if (s) {
                var a = s.offsetTop + A + 'px';
                v.push(function () {
                  r.style.top = a;
                });
              }
              if (l) {
                var u = l.offsetTop - s.offsetTop + l.offsetHeight + 'px';
                v.push(function () {
                  r.style.height = u;
                });
              }
            } else
              v.push(function () {
                r.setAttribute('data-start', String(i)),
                  n > i && r.setAttribute('data-end', String(n)),
                  (r.style.top = (i - d - 1) * f + A + 'px'),
                  (r.textContent = new Array(n - i + 2).join(' \n'));
              });
            v.push(function () {
              r.style.width = o.scrollWidth + 'px';
            }),
              v.push(function () {
                m.appendChild(r);
              });
          }
        });
        var P = o.id;
        if (p && Prism.util.isActive(o, i) && P) {
          l(o, i) ||
            v.push(function () {
              o.classList.add(i);
            });
          var E = parseInt(o.getAttribute('data-start') || '1');
          s('.line-numbers-rows > span', o).forEach(function (e, t) {
            var i = t + E;
            e.onclick = function () {
              var e = P + '.' + i;
              (r = !1),
                (location.hash = e),
                setTimeout(function () {
                  r = !0;
                }, 1);
            };
          });
        }
        return function () {
          v.forEach(a);
        };
      },
    };
    var o = 0;
    Prism.hooks.add('before-sanity-check', function (e) {
      var t = e.element.parentElement;
      if (u(t)) {
        var i = 0;
        s('.line-highlight', t).forEach(function (e) {
          (i += e.textContent.length), e.parentNode.removeChild(e);
        }),
          i &&
            /^(?: \n)+$/.test(e.code.slice(-i)) &&
            (e.code = e.code.slice(0, -i));
      }
    }),
      Prism.hooks.add('complete', function e(i) {
        var n = i.element.parentElement;
        if (u(n)) {
          clearTimeout(o);
          var r = Prism.plugins.lineNumbers,
            s = i.plugins && i.plugins.lineNumbers;
          l(n, t) && r && !s
            ? Prism.hooks.add('line-numbers', e)
            : (Prism.plugins.lineHighlight.highlightLines(n)(),
              (o = setTimeout(c, 1)));
        }
      }),
      window.addEventListener('hashchange', c),
      window.addEventListener('resize', function () {
        s('pre')
          .filter(u)
          .map(function (e) {
            return Prism.plugins.lineHighlight.highlightLines(e);
          })
          .forEach(a);
      });
  }
  function s(e, t) {
    return Array.prototype.slice.call((t || document).querySelectorAll(e));
  }
  function l(e, t) {
    return e.classList.contains(t);
  }
  function a(e) {
    e();
  }
  function u(e) {
    return !!(
      e &&
      /pre/i.test(e.nodeName) &&
      (e.hasAttribute('data-line') || (e.id && Prism.util.isActive(e, i)))
    );
  }
  function c() {
    var e = location.hash.slice(1);
    s('.temporary.line-highlight').forEach(function (e) {
      e.parentNode.removeChild(e);
    });
    var t = (e.match(/\.([\d,-]+)$/) || [, ''])[1];
    if (t && !document.getElementById(e)) {
      var i = e.slice(0, e.lastIndexOf('.')),
        n = document.getElementById(i);
      n &&
        (n.hasAttribute('data-line') || n.setAttribute('data-line', ''),
        Prism.plugins.lineHighlight.highlightLines(n, t, 'temporary ')(),
        r &&
          document.querySelector('.temporary.line-highlight').scrollIntoView());
    }
  }
})();
!(function () {
  if ('undefined' != typeof Prism && 'undefined' != typeof document) {
    var e = 'line-numbers',
      n = /\n(?!$)/g,
      t = (Prism.plugins.lineNumbers = {
        getLine: function (n, t) {
          if ('PRE' === n.tagName && n.classList.contains(e)) {
            var i = n.querySelector('.line-numbers-rows');
            if (i) {
              var r = parseInt(n.getAttribute('data-start'), 10) || 1,
                s = r + (i.children.length - 1);
              t < r && (t = r), t > s && (t = s);
              var l = t - r;
              return i.children[l];
            }
          }
        },
        resize: function (e) {
          r([e]);
        },
        assumeViewportIndependence: !0,
      }),
      i = void 0;
    window.addEventListener('resize', function () {
      (t.assumeViewportIndependence && i === window.innerWidth) ||
        ((i = window.innerWidth),
        r(
          Array.prototype.slice.call(
            document.querySelectorAll('pre.line-numbers'),
          ),
        ));
    }),
      Prism.hooks.add('complete', function (t) {
        if (t.code) {
          var i = t.element,
            s = i.parentNode;
          if (
            s &&
            /pre/i.test(s.nodeName) &&
            !i.querySelector('.line-numbers-rows') &&
            Prism.util.isActive(i, e)
          ) {
            i.classList.remove(e), s.classList.add(e);
            var l,
              o = t.code.match(n),
              a = o ? o.length + 1 : 1,
              u = new Array(a + 1).join('<span></span>');
            (l = document.createElement('span')).setAttribute(
              'aria-hidden',
              'true',
            ),
              (l.className = 'line-numbers-rows'),
              (l.innerHTML = u),
              s.hasAttribute('data-start') &&
                (s.style.counterReset =
                  'linenumber ' +
                  (parseInt(s.getAttribute('data-start'), 10) - 1)),
              t.element.appendChild(l),
              r([s]),
              Prism.hooks.run('line-numbers', t);
          }
        }
      }),
      Prism.hooks.add('line-numbers', function (e) {
        (e.plugins = e.plugins || {}), (e.plugins.lineNumbers = !0);
      });
  }
  function r(e) {
    if (
      0 !=
      (e = e.filter(function (e) {
        var n,
          t = ((n = e),
          n
            ? window.getComputedStyle
              ? getComputedStyle(n)
              : n.currentStyle || null
            : null)['white-space'];
        return 'pre-wrap' === t || 'pre-line' === t;
      })).length
    ) {
      var t = e
        .map(function (e) {
          var t = e.querySelector('code'),
            i = e.querySelector('.line-numbers-rows');
          if (t && i) {
            var r = e.querySelector('.line-numbers-sizer'),
              s = t.textContent.split(n);
            r ||
              (((r = document.createElement('span')).className =
                'line-numbers-sizer'),
              t.appendChild(r)),
              (r.innerHTML = '0'),
              (r.style.display = 'block');
            var l = r.getBoundingClientRect().height;
            return (
              (r.innerHTML = ''),
              {
                element: e,
                lines: s,
                lineHeights: [],
                oneLinerHeight: l,
                sizer: r,
              }
            );
          }
        })
        .filter(Boolean);
      t.forEach(function (e) {
        var n = e.sizer,
          t = e.lines,
          i = e.lineHeights,
          r = e.oneLinerHeight;
        (i[t.length - 1] = void 0),
          t.forEach(function (e, t) {
            if (e && e.length > 1) {
              var s = n.appendChild(document.createElement('span'));
              (s.style.display = 'block'), (s.textContent = e);
            } else i[t] = r;
          });
      }),
        t.forEach(function (e) {
          for (
            var n = e.sizer, t = e.lineHeights, i = 0, r = 0;
            r < t.length;
            r++
          )
            void 0 === t[r] &&
              (t[r] = n.children[i++].getBoundingClientRect().height);
        }),
        t.forEach(function (e) {
          var n = e.sizer,
            t = e.element.querySelector('.line-numbers-rows');
          (n.style.display = 'none'),
            (n.innerHTML = ''),
            e.lineHeights.forEach(function (e, n) {
              t.children[n].style.height = e + 'px';
            });
        });
    }
  }
})();
!(function () {
  if ('undefined' != typeof Prism && 'undefined' != typeof document) {
    var e = [],
      t = {},
      n = function () {};
    Prism.plugins.toolbar = {};
    var a = (Prism.plugins.toolbar.registerButton = function (n, a) {
        var r;
        (r =
          'function' == typeof a
            ? a
            : function (e) {
                var t;
                return (
                  'function' == typeof a.onClick
                    ? (((t = document.createElement('button')).type = 'button'),
                      t.addEventListener('click', function () {
                        a.onClick.call(this, e);
                      }))
                    : 'string' == typeof a.url
                    ? ((t = document.createElement('a')).href = a.url)
                    : (t = document.createElement('span')),
                  a.className && t.classList.add(a.className),
                  (t.textContent = a.text),
                  t
                );
              }),
          n in t
            ? console.warn(
                'There is a button with the key "' +
                  n +
                  '" registered already.',
              )
            : e.push((t[n] = r));
      }),
      r = (Prism.plugins.toolbar.hook = function (a) {
        var r = a.element.parentNode;
        if (
          r &&
          /pre/i.test(r.nodeName) &&
          !r.parentNode.classList.contains('code-toolbar')
        ) {
          var o = document.createElement('div');
          o.classList.add('code-toolbar'),
            r.parentNode.insertBefore(o, r),
            o.appendChild(r);
          var i = document.createElement('div');
          i.classList.add('toolbar');
          var l = e,
            d = (function (e) {
              for (; e; ) {
                var t = e.getAttribute('data-toolbar-order');
                if (null != t)
                  return (t = t.trim()).length ? t.split(/\s*,\s*/g) : [];
                e = e.parentElement;
              }
            })(a.element);
          d &&
            (l = d.map(function (e) {
              return t[e] || n;
            })),
            l.forEach(function (e) {
              var t = e(a);
              if (t) {
                var n = document.createElement('div');
                n.classList.add('toolbar-item'),
                  n.appendChild(t),
                  i.appendChild(n);
              }
            }),
            o.appendChild(i);
        }
      });
    a('label', function (e) {
      var t = e.element.parentNode;
      if (t && /pre/i.test(t.nodeName) && t.hasAttribute('data-label')) {
        var n,
          a,
          r = t.getAttribute('data-label');
        try {
          a = document.querySelector('template#' + r);
        } catch (e) {}
        return (
          a
            ? (n = a.content)
            : (t.hasAttribute('data-url')
                ? ((n = document.createElement('a')).href =
                    t.getAttribute('data-url'))
                : (n = document.createElement('span')),
              (n.textContent = r)),
          n
        );
      }
    }),
      Prism.hooks.add('complete', r);
  }
})();
!(function () {
  function t(t) {
    var e = document.createElement('textarea');
    (e.value = t.getText()),
      (e.style.top = '0'),
      (e.style.left = '0'),
      (e.style.position = 'fixed'),
      document.body.appendChild(e),
      e.focus(),
      e.select();
    try {
      var o = document.execCommand('copy');
      setTimeout(function () {
        o ? t.success() : t.error();
      }, 1);
    } catch (e) {
      setTimeout(function () {
        t.error(e);
      }, 1);
    }
    document.body.removeChild(e);
  }
  'undefined' != typeof Prism &&
    'undefined' != typeof document &&
    (Prism.plugins.toolbar
      ? Prism.plugins.toolbar.registerButton('copy-to-clipboard', function (e) {
          var o = e.element,
            n = (function (t) {
              var e = {
                copy: 'Copy',
                'copy-error': 'Press Ctrl+C to copy',
                'copy-success': 'Copied!',
                'copy-timeout': 5e3,
              };
              for (var o in e) {
                for (
                  var n = 'data-prismjs-' + o, c = t;
                  c && !c.hasAttribute(n);

                )
                  c = c.parentElement;
                c && (e[o] = c.getAttribute(n));
              }
              return e;
            })(o),
            c = document.createElement('button');
          (c.className = 'copy-to-clipboard-button'),
            c.setAttribute('type', 'button');
          var r = document.createElement('span');
          return (
            c.appendChild(r),
            u('copy'),
            (function (e, o) {
              e.addEventListener('click', function () {
                !(function (e) {
                  navigator.clipboard
                    ? navigator.clipboard
                        .writeText(e.getText())
                        .then(e.success, function () {
                          t(e);
                        })
                    : t(e);
                })(o);
              });
            })(c, {
              getText: function () {
                return o.textContent;
              },
              success: function () {
                u('copy-success'), i();
              },
              error: function () {
                u('copy-error'),
                  setTimeout(function () {
                    !(function (t) {
                      window.getSelection().selectAllChildren(t);
                    })(o);
                  }, 1),
                  i();
              },
            }),
            c
          );
          function i() {
            setTimeout(function () {
              u('copy');
            }, n['copy-timeout']);
          }
          function u(t) {
            (r.textContent = n[t]), c.setAttribute('data-copy-state', t);
          }
        })
      : console.warn('Copy to Clipboard plugin loaded before Toolbar plugin.'));
})();

function prismInitialize() {
  const codeBlocks = document.querySelectorAll('pre code') || {};
  if (codeBlocks.length > 0) {
    Prism.plugins.toolbar.registerButton('toggle-wrap', function (env) {
      var button = document.createElement('button');
      return (
        (button.textContent = 'Toggle Text Wrapping'),
        button.addEventListener('click', function () {
          return (
            env.element.parentNode.classList.toggle('code-wrap'),
            Prism.highlightElement(env.element),
            !1
          );
        }),
        button
      );
    });
    for (const codeBlock of codeBlocks) Prism.highlightElement(codeBlock);
  }
}

prismInitialize();
