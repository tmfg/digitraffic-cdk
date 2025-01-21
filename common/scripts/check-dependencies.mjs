#!/usr/bin/env node
import t from "node:process";
import e from "node:fs";
import n from "node:path";
import r from "os";
import i from "path";
import s from "util";
import o from "stream";
import a from "events";
import c, { promises as u } from "fs";
import { fileURLToPath as l } from "node:url";
import p from "node:fs/promises";
import f from "constants";
import h from "assert";
import d from "node:os";
import y from "node:tty";
var g = "undefined" != typeof globalThis
  ? globalThis
  : "undefined" != typeof window
  ? window
  : "undefined" != typeof global
  ? global
  : "undefined" != typeof self
  ? self
  : {};
function m(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default")
    ? t.default
    : t;
}
var _ = {}, S = {}, v = {};
Object.defineProperty(v, "__esModule", { value: !0 }),
  v.splitWhen = v.flatten = void 0,
  v.flatten = function (t) {
    return t.reduce((t, e) => [].concat(t, e), []);
  },
  v.splitWhen = function (t, e) {
    const n = [[]];
    let r = 0;
    for (const i of t) e(i) ? (r++, n[r] = []) : n[r].push(i);
    return n;
  };
var b = {};
Object.defineProperty(b, "__esModule", { value: !0 }),
  b.isEnoentCodeError = void 0,
  b.isEnoentCodeError = function (t) {
    return "ENOENT" === t.code;
  };
var E = {};
Object.defineProperty(E, "__esModule", { value: !0 }),
  E.createDirentFromStats = void 0;
let w = class {
  constructor(t, e) {
    this.name = t,
      this.isBlockDevice = e.isBlockDevice.bind(e),
      this.isCharacterDevice = e.isCharacterDevice.bind(e),
      this.isDirectory = e.isDirectory.bind(e),
      this.isFIFO = e.isFIFO.bind(e),
      this.isFile = e.isFile.bind(e),
      this.isSocket = e.isSocket.bind(e),
      this.isSymbolicLink = e.isSymbolicLink.bind(e);
  }
};
E.createDirentFromStats = function (t, e) {
  return new w(t, e);
};
var A = {};
Object.defineProperty(A, "__esModule", { value: !0 }),
  A.convertPosixPathToPattern =
    A.convertWindowsPathToPattern =
    A.convertPathToPattern =
    A.escapePosixPath =
    A.escapeWindowsPath =
    A.escape =
    A.removeLeadingDotSegment =
    A.makeAbsolute =
    A.unixify =
      void 0;
const R = i,
  P = "win32" === r.platform(),
  O = /(\\?)([()*?[\]{|}]|^!|[!+@](?=\()|\\(?![!()*+?@[\]{|}]))/g,
  k = /(\\?)([()[\]{}]|^!|[!+@](?=\())/g,
  x = /^\\\\([.?])/,
  C = /\\(?![!()+@[\]{}])/g;
function T(t) {
  return t.replace(k, "\\$2");
}
function L(t) {
  return t.replace(O, "\\$2");
}
function $(t) {
  return T(t).replace(x, "//$1").replace(C, "/");
}
function F(t) {
  return L(t);
}
A.unixify = function (t) {
  return t.replace(/\\/g, "/");
},
  A.makeAbsolute = function (t, e) {
    return R.resolve(t, e);
  },
  A.removeLeadingDotSegment = function (t) {
    if ("." === t.charAt(0)) {
      const e = t.charAt(1);
      if ("/" === e || "\\" === e) return t.slice(2);
    }
    return t;
  },
  A.escape = P ? T : L,
  A.escapeWindowsPath = T,
  A.escapePosixPath = L,
  A.convertPathToPattern = P ? $ : F,
  A.convertWindowsPathToPattern = $,
  A.convertPosixPathToPattern = F;
var D,
  N = {},
  M = function (t) {
    if ("string" != typeof t || "" === t) return !1;
    for (var e; e = /(\\).|([@?!+*]\(.*\))/g.exec(t);) {
      if (e[2]) return !0;
      t = t.slice(e.index + e[0].length);
    }
    return !1;
  },
  H = { "{": "}", "(": ")", "[": "]" },
  I = function (t) {
    if ("!" === t[0]) return !0;
    for (var e = 0, n = -2, r = -2, i = -2, s = -2, o = -2; e < t.length;) {
      if ("*" === t[e]) return !0;
      if ("?" === t[e + 1] && /[\].+)]/.test(t[e])) return !0;
      if (
        -1 !== r && "[" === t[e] && "]" !== t[e + 1] &&
        (r < e && (r = t.indexOf("]", e)), r > e)
      ) {
        if (-1 === o || o > r) return !0;
        if (-1 === (o = t.indexOf("\\", e)) || o > r) return !0;
      }
      if (
        -1 !== i && "{" === t[e] && "}" !== t[e + 1] &&
        (i = t.indexOf("}", e)) > e &&
        (-1 === (o = t.indexOf("\\", e)) || o > i)
      ) return !0;
      if (
        -1 !== s && "(" === t[e] && "?" === t[e + 1] &&
        /[:!=]/.test(t[e + 2]) && ")" !== t[e + 3] &&
        (s = t.indexOf(")", e)) > e &&
        (-1 === (o = t.indexOf("\\", e)) || o > s)
      ) return !0;
      if (
        -1 !== n && "(" === t[e] && "|" !== t[e + 1] &&
        (n < e && (n = t.indexOf("|", e)),
          -1 !== n && ")" !== t[n + 1] && (s = t.indexOf(")", n)) > n &&
          (-1 === (o = t.indexOf("\\", n)) || o > s))
      ) return !0;
      if ("\\" === t[e]) {
        var a = t[e + 1];
        e += 2;
        var c = H[a];
        if (c) {
          var u = t.indexOf(c, e);
          -1 !== u && (e = u + 1);
        }
        if ("!" === t[e]) return !0;
      } else e++;
    }
    return !1;
  },
  j = function (t) {
    if ("!" === t[0]) return !0;
    for (var e = 0; e < t.length;) {
      if (/[*?{}()[\]]/.test(t[e])) return !0;
      if ("\\" === t[e]) {
        var n = t[e + 1];
        e += 2;
        var r = H[n];
        if (r) {
          var i = t.indexOf(r, e);
          -1 !== i && (e = i + 1);
        }
        if ("!" === t[e]) return !0;
      } else e++;
    }
    return !1;
  },
  B = function (t, e) {
    if ("string" != typeof t || "" === t) return !1;
    if (M(t)) return !0;
    var n = I;
    return e && !1 === e.strict && (n = j), n(t);
  },
  G = i.posix.dirname,
  W = "win32" === r.platform(),
  U = /\\/g,
  K = /[\{\[].*[\}\]]$/,
  V = /(^|[^\\])([\{\[]|\([^\)]+$)/,
  Y = /\\([\!\*\?\|\[\]\(\)\{\}])/g,
  Q = {};
/*!
 * is-extglob <https://github.com/jonschlinkert/is-extglob>
 *
 * Copyright (c) 2014-2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */ (D = Q).isInteger = (t) =>
  "number" == typeof t
    ? Number.isInteger(t)
    : "string" == typeof t && "" !== t.trim() && Number.isInteger(Number(t)),
  D.find = (t, e) => t.nodes.find((t) => t.type === e),
  D.exceedsLimit = (t, e, n = 1, r) =>
    !1 !== r && !(!D.isInteger(t) || !D.isInteger(e)) &&
    (Number(e) - Number(t)) / Number(n) >= r,
  D.escapeNode = (t, e = 0, n) => {
    const r = t.nodes[e];
    r && (n && r.type === n || "open" === r.type || "close" === r.type) &&
      !0 !== r.escaped && (r.value = "\\" + r.value, r.escaped = !0);
  },
  D.encloseBrace = (t) =>
    !("brace" !== t.type || t.commas >> 0 + t.ranges || (t.invalid = !0, 0)),
  D.isInvalidBrace = (t) =>
    !("brace" !== t.type ||
      !0 !== t.invalid && !t.dollar &&
        (t.commas >> 0 + t.ranges && !0 === t.open && !0 === t.close ||
          (t.invalid = !0, 0))),
  D.isOpenOrClose = (t) =>
    "open" === t.type || "close" === t.type || !0 === t.open || !0 === t.close,
  D.reduce = (t) =>
    t.reduce(
      (
        t,
        e,
      ) => ("text" === e.type && t.push(e.value),
        "range" === e.type && (e.type = "text"),
        t),
      [],
    ),
  D.flatten = (...t) => {
    const e = [],
      n = (t) => {
        for (let r = 0; r < t.length; r++) {
          const i = t[r];
          Array.isArray(i) ? n(i) : void 0 !== i && e.push(i);
        }
        return e;
      };
    return n(t), e;
  };
const q = Q;
var X = (t, e = {}) => {
  const n = (t, r = {}) => {
    const i = e.escapeInvalid && q.isInvalidBrace(r),
      s = !0 === t.invalid && !0 === e.escapeInvalid;
    let o = "";
    if (t.value) {
      return (i || s) && q.isOpenOrClose(t) ? "\\" + t.value : t.value;
    }
    if (t.value) return t.value;
    if (t.nodes) { for (const e of t.nodes) o += n(e); }
    return o;
  };
  return n(t);
};
/*!
 * is-number <https://github.com/jonschlinkert/is-number>
 *
 * Copyright (c) 2014-present, Jon Schlinkert.
 * Released under the MIT License.
 */
/*!
 * to-regex-range <https://github.com/micromatch/to-regex-range>
 *
 * Copyright (c) 2015-present, Jon Schlinkert.
 * Released under the MIT License.
 */
const J = function (t) {
    return "number" == typeof t
      ? t - t == 0
      : "string" == typeof t && "" !== t.trim() &&
        (Number.isFinite ? Number.isFinite(+t) : isFinite(+t));
  },
  Z = (t, e, n) => {
    if (!1 === J(t)) {
      throw new TypeError(
        "toRegexRange: expected the first argument to be a number",
      );
    }
    if (void 0 === e || t === e) return String(t);
    if (!1 === J(e)) {
      throw new TypeError(
        "toRegexRange: expected the second argument to be a number.",
      );
    }
    let r = { relaxZeros: !0, ...n };
    "boolean" == typeof r.strictZeros && (r.relaxZeros = !1 === r.strictZeros);
    let i = t + ":" + e + "=" + String(r.relaxZeros) + String(r.shorthand) +
      String(r.capture) + String(r.wrap);
    if (Z.cache.hasOwnProperty(i)) return Z.cache[i].result;
    let s = Math.min(t, e), o = Math.max(t, e);
    if (1 === Math.abs(s - o)) {
      let n = t + "|" + e;
      return r.capture ? `(${n})` : !1 === r.wrap ? n : `(?:${n})`;
    }
    let a = ct(t) || ct(e), c = { min: t, max: e, a: s, b: o }, u = [], l = [];
    if (a && (c.isPadded = a, c.maxLen = String(c.max).length), s < 0) {
      l = tt(o < 0 ? Math.abs(o) : 1, Math.abs(s), c, r), s = c.a = 0;
    }
    return o >= 0 && (u = tt(s, o, c, r)),
      c.negatives = l,
      c.positives = u,
      c.result = function (t, e) {
        let n = et(t, e, "-", !1) || [],
          r = et(e, t, "", !1) || [],
          i = et(t, e, "-?", !0) || [];
        return n.concat(i).concat(r).join("|");
      }(l, u),
      !0 === r.capture
        ? c.result = `(${c.result})`
        : !1 !== r.wrap && u.length + l.length > 1 &&
          (c.result = `(?:${c.result})`),
      Z.cache[i] = c,
      c.result;
  };
function z(t, e, n) {
  if (t === e) return { pattern: t, count: [], digits: 0 };
  let r = function (t, e) {
      let n = [];
      for (let r = 0; r < t.length; r++) n.push([t[r], e[r]]);
      return n;
    }(t, e),
    i = r.length,
    s = "",
    o = 0;
  for (let t = 0; t < i; t++) {
    let [e, n] = r[t];
    e === n ? s += e : "0" !== e || "9" !== n ? s += at(e, n) : o++;
  }
  return o && (s += !0 === n.shorthand ? "\\d" : "[0-9]"),
    { pattern: s, count: [o], digits: i };
}
function tt(t, e, n, r) {
  let i,
    s = function (t, e) {
      let n = 1, r = 1, i = it(t, n), s = new Set([e]);
      for (; t <= i && i <= e;) s.add(i), n += 1, i = it(t, n);
      for (i = st(e + 1, r) - 1; t < i && i <= e;) {
        s.add(i), r += 1, i = st(e + 1, r) - 1;
      }
      return s = [...s], s.sort(nt), s;
    }(t, e),
    o = [],
    a = t;
  for (let t = 0; t < s.length; t++) {
    let e = s[t], c = z(String(a), String(e), r), u = "";
    n.isPadded || !i || i.pattern !== c.pattern
      ? (n.isPadded && (u = ut(e, n, r)),
        c.string = u + c.pattern + ot(c.count),
        o.push(c),
        a = e + 1,
        i = c)
      : (i.count.length > 1 && i.count.pop(),
        i.count.push(c.count[0]),
        i.string = i.pattern + ot(i.count),
        a = e + 1);
  }
  return o;
}
function et(t, e, n, r, i) {
  let s = [];
  for (let i of t) {
    let { string: t } = i;
    r || rt(e, "string", t) || s.push(n + t),
      r && rt(e, "string", t) && s.push(n + t);
  }
  return s;
}
function nt(t, e) {
  return t > e ? 1 : e > t ? -1 : 0;
}
function rt(t, e, n) {
  return t.some((t) => t[e] === n);
}
function it(t, e) {
  return Number(String(t).slice(0, -e) + "9".repeat(e));
}
function st(t, e) {
  return t - t % Math.pow(10, e);
}
function ot(t) {
  let [e = 0, n = ""] = t;
  return n || e > 1 ? `{${e + (n ? "," + n : "")}}` : "";
}
function at(t, e, n) {
  return `[${t}${e - t == 1 ? "" : "-"}${e}]`;
}
function ct(t) {
  return /^-?(0+)\d/.test(t);
}
function ut(t, e, n) {
  if (!e.isPadded) return t;
  let r = Math.abs(e.maxLen - String(t).length), i = !1 !== n.relaxZeros;
  switch (r) {
    case 0:
      return "";
    case 1:
      return i ? "0?" : "0";
    case 2:
      return i ? "0{0,2}" : "00";
    default:
      return i ? `0{0,${r}}` : `0{${r}}`;
  }
}
Z.cache = {}, Z.clearCache = () => Z.cache = {};
/*!
 * fill-range <https://github.com/jonschlinkert/fill-range>
 *
 * Copyright (c) 2014-present, Jon Schlinkert.
 * Licensed under the MIT License.
 */
const lt = s,
  pt = Z,
  ft = (t) => null !== t && "object" == typeof t && !Array.isArray(t),
  ht = (t) => "number" == typeof t || "string" == typeof t && "" !== t,
  dt = (t) => Number.isInteger(+t),
  yt = (t) => {
    let e = `${t}`, n = -1;
    if ("-" === e[0] && (e = e.slice(1)), "0" === e) return !1;
    for (; "0" === e[++n];);
    return n > 0;
  },
  gt = (t, e, n) => {
    if (e > 0) {
      let n = "-" === t[0] ? "-" : "";
      n && (t = t.slice(1)), t = n + t.padStart(n ? e - 1 : e, "0");
    }
    return !1 === n ? String(t) : t;
  },
  mt = (t, e) => {
    let n = "-" === t[0] ? "-" : "";
    for (n && (t = t.slice(1), e--); t.length < e;) t = "0" + t;
    return n ? "-" + t : t;
  },
  _t = (t, e, n, r) => {
    if (n) return pt(t, e, { wrap: !1, ...r });
    let i = String.fromCharCode(t);
    return t === e ? i : `[${i}-${String.fromCharCode(e)}]`;
  },
  St = (t, e, n) => {
    if (Array.isArray(t)) {
      let e = !0 === n.wrap, r = n.capture ? "" : "?:";
      return e ? `(${r}${t.join("|")})` : t.join("|");
    }
    return pt(t, e, n);
  },
  vt = (...t) => new RangeError("Invalid range arguments: " + lt.inspect(...t)),
  bt = (t, e, n) => {
    if (!0 === n.strictRanges) throw vt([t, e]);
    return [];
  },
  Et = (t, e, n = 1, r = {}) => {
    let i = Number(t), s = Number(e);
    if (!Number.isInteger(i) || !Number.isInteger(s)) {
      if (!0 === r.strictRanges) throw vt([t, e]);
      return [];
    }
    0 === i && (i = 0), 0 === s && (s = 0);
    let o = i > s, a = String(t), c = String(e), u = String(n);
    n = Math.max(Math.abs(n), 1);
    let l = yt(a) || yt(c) || yt(u),
      p = l ? Math.max(a.length, c.length, u.length) : 0,
      f = !1 === l &&
        !1 ===
          ((t, e, n) =>
            "string" == typeof t || "string" == typeof e || !0 === n.stringify)(
              t,
              e,
              r,
            ),
      h = r.transform || ((t) => (e) => !0 === t ? Number(e) : String(e))(f);
    if (r.toRegex && 1 === n) return _t(mt(t, p), mt(e, p), !0, r);
    let d = { negatives: [], positives: [] }, y = [], g = 0;
    for (; o ? i >= s : i <= s;) {
      !0 === r.toRegex && n > 1
        ? d[(m = i) < 0 ? "negatives" : "positives"].push(Math.abs(m))
        : y.push(gt(h(i, g), p, f)),
        i = o ? i - n : i + n,
        g++;
    }
    var m;
    return !0 === r.toRegex
      ? n > 1
        ? ((t, e, n) => {
          t.negatives.sort((t, e) => t < e ? -1 : t > e ? 1 : 0),
            t.positives.sort((t, e) => t < e ? -1 : t > e ? 1 : 0);
          let r, i = e.capture ? "" : "?:", s = "", o = "";
          return t.positives.length &&
            (s = t.positives.map((t) => mt(String(t), n)).join("|")),
            t.negatives.length &&
            (o = `-(${i}${
              t.negatives.map((t) => mt(String(t), n)).join("|")
            })`),
            r = s && o ? `${s}|${o}` : s || o,
            e.wrap ? `(${i}${r})` : r;
        })(d, r, p)
        : St(y, null, { wrap: !1, ...r })
      : y;
  },
  wt = (t, e, n, r = {}) => {
    if (null == e && ht(t)) return [t];
    if (!ht(t) || !ht(e)) return bt(t, e, r);
    if ("function" == typeof n) return wt(t, e, 1, { transform: n });
    if (ft(n)) return wt(t, e, 0, n);
    let i = { ...r };
    return !0 === i.capture && (i.wrap = !0),
      n = n || i.step || 1,
      dt(n)
        ? dt(t) && dt(e) ? Et(t, e, n, i) : ((t, e, n = 1, r = {}) => {
          if (!dt(t) && t.length > 1 || !dt(e) && e.length > 1) {
            return bt(
              t,
              e,
              r,
            );
          }
          let i = r.transform || ((t) => String.fromCharCode(t)),
            s = `${t}`.charCodeAt(0),
            o = `${e}`.charCodeAt(0),
            a = s > o,
            c = Math.min(s, o),
            u = Math.max(s, o);
          if (r.toRegex && 1 === n) return _t(c, u, !1, r);
          let l = [], p = 0;
          for (; a ? s >= o : s <= o;) {
            l.push(i(s, p)), s = a ? s - n : s + n, p++;
          }
          return !0 === r.toRegex ? St(l, null, { wrap: !1, options: r }) : l;
        })(t, e, Math.max(Math.abs(n), 1), i)
        : null == n || ft(n)
        ? wt(t, e, 1, n)
        : ((t, e) => {
          if (!0 === e.strictRanges) {
            throw new TypeError(`Expected step "${t}" to be a number`);
          }
          return [];
        })(n, i);
  };
const At = wt, Rt = Q;
var Pt = (t, e = {}) => {
  const n = (t, r = {}) => {
    const i = Rt.isInvalidBrace(r),
      s = !0 === t.invalid && !0 === e.escapeInvalid,
      o = !0 === i || !0 === s,
      a = !0 === e.escapeInvalid ? "\\" : "";
    let c = "";
    if (!0 === t.isOpen) return a + t.value;
    if (!0 === t.isClose) {
      return console.log("node.isClose", a, t.value), a + t.value;
    }
    if ("open" === t.type) return o ? a + t.value : "(";
    if ("close" === t.type) return o ? a + t.value : ")";
    if ("comma" === t.type) {
      return "comma" === t.prev.type ? "" : o ? t.value : "|";
    }
    if (t.value) return t.value;
    if (t.nodes && t.ranges > 0) {
      const n = Rt.reduce(t.nodes),
        r = At(...n, { ...e, wrap: !1, toRegex: !0, strictZeros: !0 });
      if (0 !== r.length) return n.length > 1 && r.length > 1 ? `(${r})` : r;
    }
    if (t.nodes) { for (const e of t.nodes) c += n(e, t); }
    return c;
  };
  return n(t);
};
const Ot = wt,
  kt = X,
  xt = Q,
  Ct = (t = "", e = "", n = !1) => {
    const r = [];
    if (t = [].concat(t), !(e = [].concat(e)).length) return t;
    if (!t.length) return n ? xt.flatten(e).map((t) => `{${t}}`) : e;
    for (const i of t) {
      if (Array.isArray(i)) { for (const t of i) r.push(Ct(t, e, n)); }
      else {for (let t of e) {
          !0 === n && "string" == typeof t && (t = `{${t}}`),
            r.push(Array.isArray(t) ? Ct(i, t, n) : i + t);
        }}
    }
    return xt.flatten(r);
  };
var Tt = (t, e = {}) => {
  const n = void 0 === e.rangeLimit ? 1e3 : e.rangeLimit,
    r = (t, i = {}) => {
      t.queue = [];
      let s = i, o = i.queue;
      for (; "brace" !== s.type && "root" !== s.type && s.parent;) {
        s = s.parent, o = s.queue;
      }
      if (t.invalid || t.dollar) return void o.push(Ct(o.pop(), kt(t, e)));
      if ("brace" === t.type && !0 !== t.invalid && 2 === t.nodes.length) {
        return void o.push(Ct(o.pop(), ["{}"]));
      }
      if (t.nodes && t.ranges > 0) {
        const r = xt.reduce(t.nodes);
        if (xt.exceedsLimit(...r, e.step, n)) {
          throw new RangeError(
            "expanded array length exceeds range limit. Use options.rangeLimit to increase or disable the limit.",
          );
        }
        let i = Ot(...r, e);
        return 0 === i.length && (i = kt(t, e)),
          o.push(Ct(o.pop(), i)),
          void (t.nodes = []);
      }
      const a = xt.encloseBrace(t);
      let c = t.queue, u = t;
      for (; "brace" !== u.type && "root" !== u.type && u.parent;) {
        u = u.parent, c = u.queue;
      }
      for (let e = 0; e < t.nodes.length; e++) {
        const n = t.nodes[e];
        "comma" !== n.type || "brace" !== t.type
          ? "close" !== n.type
            ? n.value && "open" !== n.type
              ? c.push(Ct(c.pop(), n.value))
              : n.nodes && r(n, t)
            : o.push(Ct(o.pop(), c, a))
          : (1 === e && c.push(""), c.push(""));
      }
      return c;
    };
  return xt.flatten(r(t));
};
const Lt = X,
  {
    MAX_LENGTH: $t,
    CHAR_BACKSLASH: Ft,
    CHAR_BACKTICK: Dt,
    CHAR_COMMA: Nt,
    CHAR_DOT: Mt,
    CHAR_LEFT_PARENTHESES: Ht,
    CHAR_RIGHT_PARENTHESES: It,
    CHAR_LEFT_CURLY_BRACE: jt,
    CHAR_RIGHT_CURLY_BRACE: Bt,
    CHAR_LEFT_SQUARE_BRACKET: Gt,
    CHAR_RIGHT_SQUARE_BRACKET: Wt,
    CHAR_DOUBLE_QUOTE: Ut,
    CHAR_SINGLE_QUOTE: Kt,
    CHAR_NO_BREAK_SPACE: Vt,
    CHAR_ZERO_WIDTH_NOBREAK_SPACE: Yt,
  } = {
    MAX_LENGTH: 1e4,
    CHAR_0: "0",
    CHAR_9: "9",
    CHAR_UPPERCASE_A: "A",
    CHAR_LOWERCASE_A: "a",
    CHAR_UPPERCASE_Z: "Z",
    CHAR_LOWERCASE_Z: "z",
    CHAR_LEFT_PARENTHESES: "(",
    CHAR_RIGHT_PARENTHESES: ")",
    CHAR_ASTERISK: "*",
    CHAR_AMPERSAND: "&",
    CHAR_AT: "@",
    CHAR_BACKSLASH: "\\",
    CHAR_BACKTICK: "`",
    CHAR_CARRIAGE_RETURN: "\r",
    CHAR_CIRCUMFLEX_ACCENT: "^",
    CHAR_COLON: ":",
    CHAR_COMMA: ",",
    CHAR_DOLLAR: "$",
    CHAR_DOT: ".",
    CHAR_DOUBLE_QUOTE: '"',
    CHAR_EQUAL: "=",
    CHAR_EXCLAMATION_MARK: "!",
    CHAR_FORM_FEED: "\f",
    CHAR_FORWARD_SLASH: "/",
    CHAR_HASH: "#",
    CHAR_HYPHEN_MINUS: "-",
    CHAR_LEFT_ANGLE_BRACKET: "<",
    CHAR_LEFT_CURLY_BRACE: "{",
    CHAR_LEFT_SQUARE_BRACKET: "[",
    CHAR_LINE_FEED: "\n",
    CHAR_NO_BREAK_SPACE: " ",
    CHAR_PERCENT: "%",
    CHAR_PLUS: "+",
    CHAR_QUESTION_MARK: "?",
    CHAR_RIGHT_ANGLE_BRACKET: ">",
    CHAR_RIGHT_CURLY_BRACE: "}",
    CHAR_RIGHT_SQUARE_BRACKET: "]",
    CHAR_SEMICOLON: ";",
    CHAR_SINGLE_QUOTE: "'",
    CHAR_SPACE: " ",
    CHAR_TAB: "\t",
    CHAR_UNDERSCORE: "_",
    CHAR_VERTICAL_LINE: "|",
    CHAR_ZERO_WIDTH_NOBREAK_SPACE: "\ufeff",
  };
var Qt = (t, e = {}) => {
  if ("string" != typeof t) throw new TypeError("Expected a string");
  const n = e || {},
    r = "number" == typeof n.maxLength ? Math.min($t, n.maxLength) : $t;
  if (t.length > r) {
    throw new SyntaxError(
      `Input length (${t.length}), exceeds max characters (${r})`,
    );
  }
  const i = { type: "root", input: t, nodes: [] }, s = [i];
  let o = i, a = i, c = 0;
  const u = t.length;
  let l, p = 0, f = 0;
  const h = () => t[p++],
    d = (t) => {
      if (
        "text" === t.type && "dot" === a.type && (a.type = "text"),
          !a || "text" !== a.type || "text" !== t.type
      ) return o.nodes.push(t), t.parent = o, t.prev = a, a = t, t;
      a.value += t.value;
    };
  for (d({ type: "bos" }); p < u;) {
    if (o = s[s.length - 1], l = h(), l !== Yt && l !== Vt) {
      if (l !== Ft) {
        if (l !== Wt) {
          if (l !== Gt) {
            if (l !== Ht) {
              if (l !== It) {
                if (l !== Ut && l !== Kt && l !== Dt) {
                  if (l !== jt) {
                    if (l !== Bt) {
                      if (l === Nt && f > 0) {
                        if (o.ranges > 0) {
                          o.ranges = 0;
                          const t = o.nodes.shift();
                          o.nodes = [t, { type: "text", value: Lt(o) }];
                        }
                        d({ type: "comma", value: l }), o.commas++;
                      } else if (l === Mt && f > 0 && 0 === o.commas) {
                        const t = o.nodes;
                        if (0 === f || 0 === t.length) {
                          d({ type: "text", value: l });
                          continue;
                        }
                        if ("dot" === a.type) {
                          if (
                            o.range = [],
                              a.value += l,
                              a.type = "range",
                              3 !== o.nodes.length && 5 !== o.nodes.length
                          ) {
                            o.invalid = !0, o.ranges = 0, a.type = "text";
                            continue;
                          }
                          o.ranges++, o.args = [];
                          continue;
                        }
                        if ("range" === a.type) {
                          t.pop();
                          const e = t[t.length - 1];
                          e.value += a.value + l, a = e, o.ranges--;
                          continue;
                        }
                        d({ type: "dot", value: l });
                      } else d({ type: "text", value: l });
                    } else {
                      if ("brace" !== o.type) {
                        d({ type: "text", value: l });
                        continue;
                      }
                      const t = "close";
                      o = s.pop(),
                        o.close = !0,
                        d({ type: t, value: l }),
                        f--,
                        o = s[s.length - 1];
                    }
                  } else {
                    f++;
                    const t = a.value && "$" === a.value.slice(-1) ||
                      !0 === o.dollar;
                    o = d({
                      type: "brace",
                      open: !0,
                      close: !1,
                      dollar: t,
                      depth: f,
                      commas: 0,
                      ranges: 0,
                      nodes: [],
                    }),
                      s.push(o),
                      d({ type: "open", value: l });
                  }
                } else {
                  const t = l;
                  let n;
                  for (!0 !== e.keepQuotes && (l = ""); p < u && (n = h());) {
                    if (n !== Ft) {
                      if (n === t) {
                        !0 === e.keepQuotes && (l += n);
                        break;
                      }
                      l += n;
                    } else l += n + h();
                  }
                  d({ type: "text", value: l });
                }
              } else {
                if ("paren" !== o.type) {
                  d({ type: "text", value: l });
                  continue;
                }
                o = s.pop(), d({ type: "text", value: l }), o = s[s.length - 1];
              }
            } else {o = d({ type: "paren", nodes: [] }),
                s.push(o),
                d({ type: "text", value: l });}
          } else {
            let t;
            for (c++; p < u && (t = h());) {
              if (l += t, t !== Gt) {
                if (t !== Ft) { if (t === Wt && (c--, 0 === c)) break; }
                else l += h();
              } else c++;
            }
            d({ type: "text", value: l });
          }
        } else d({ type: "text", value: "\\" + l });
      } else d({ type: "text", value: (e.keepEscaping ? l : "") + h() });
    }
  }
  do {
    if (o = s.pop(), "root" !== o.type) {
      o.nodes.forEach((t) => {
        t.nodes ||
          ("open" === t.type && (t.isOpen = !0),
            "close" === t.type && (t.isClose = !0),
            t.nodes || (t.type = "text"),
            t.invalid = !0);
      });
      const t = s[s.length - 1], e = t.nodes.indexOf(o);
      t.nodes.splice(e, 1, ...o.nodes);
    }
  } while (s.length > 0);
  return d({ type: "eos" }), i;
};
const qt = X,
  Xt = Pt,
  Jt = Tt,
  Zt = Qt,
  zt = (t, e = {}) => {
    let n = [];
    if (Array.isArray(t)) {
      for (const r of t) {
        const t = zt.create(r, e);
        Array.isArray(t) ? n.push(...t) : n.push(t);
      }
    } else n = [].concat(zt.create(t, e));
    return e && !0 === e.expand && !0 === e.nodupes && (n = [...new Set(n)]), n;
  };
zt.parse = (t, e = {}) => Zt(t, e),
  zt.stringify = (t, e = {}) =>
    qt("string" == typeof t ? zt.parse(t, e) : t, e),
  zt.compile = (
    t,
    e = {},
  ) => ("string" == typeof t && (t = zt.parse(t, e)), Xt(t, e)),
  zt.expand = (t, e = {}) => {
    "string" == typeof t && (t = zt.parse(t, e));
    let n = Jt(t, e);
    return !0 === e.noempty && (n = n.filter(Boolean)),
      !0 === e.nodupes && (n = [...new Set(n)]),
      n;
  },
  zt.create = (t, e = {}) =>
    "" === t || t.length < 3
      ? [t]
      : !0 !== e.expand
      ? zt.compile(t, e)
      : zt.expand(t, e);
var te = zt, ee = {};
const ne = i,
  re = "\\\\/",
  ie = `[^${re}]`,
  se = "\\.",
  oe = "\\/",
  ae = "[^/]",
  ce = `(?:${oe}|$)`,
  ue = `(?:^|${oe})`,
  le = `${se}{1,2}${ce}`,
  pe = {
    DOT_LITERAL: se,
    PLUS_LITERAL: "\\+",
    QMARK_LITERAL: "\\?",
    SLASH_LITERAL: oe,
    ONE_CHAR: "(?=.)",
    QMARK: ae,
    END_ANCHOR: ce,
    DOTS_SLASH: le,
    NO_DOT: `(?!${se})`,
    NO_DOTS: `(?!${ue}${le})`,
    NO_DOT_SLASH: `(?!${se}{0,1}${ce})`,
    NO_DOTS_SLASH: `(?!${le})`,
    QMARK_NO_DOT: `[^.${oe}]`,
    STAR: `${ae}*?`,
    START_ANCHOR: ue,
  },
  fe = {
    ...pe,
    SLASH_LITERAL: `[${re}]`,
    QMARK: ie,
    STAR: `${ie}*?`,
    DOTS_SLASH: `${se}{1,2}(?:[${re}]|$)`,
    NO_DOT: `(?!${se})`,
    NO_DOTS: `(?!(?:^|[${re}])${se}{1,2}(?:[${re}]|$))`,
    NO_DOT_SLASH: `(?!${se}{0,1}(?:[${re}]|$))`,
    NO_DOTS_SLASH: `(?!${se}{1,2}(?:[${re}]|$))`,
    QMARK_NO_DOT: `[^.${re}]`,
    START_ANCHOR: `(?:^|[${re}])`,
    END_ANCHOR: `(?:[${re}]|$)`,
  };
var he = {
  MAX_LENGTH: 65536,
  POSIX_REGEX_SOURCE: {
    alnum: "a-zA-Z0-9",
    alpha: "a-zA-Z",
    ascii: "\\x00-\\x7F",
    blank: " \\t",
    cntrl: "\\x00-\\x1F\\x7F",
    digit: "0-9",
    graph: "\\x21-\\x7E",
    lower: "a-z",
    print: "\\x20-\\x7E ",
    punct: "\\-!\"#$%&'()\\*+,./:;<=>?@[\\]^_`{|}~",
    space: " \\t\\r\\n\\v\\f",
    upper: "A-Z",
    word: "A-Za-z0-9_",
    xdigit: "A-Fa-f0-9",
  },
  REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
  REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
  REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
  REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
  REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
  REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,
  REPLACEMENTS: { "***": "*", "**/**": "**", "**/**/**": "**" },
  CHAR_0: 48,
  CHAR_9: 57,
  CHAR_UPPERCASE_A: 65,
  CHAR_LOWERCASE_A: 97,
  CHAR_UPPERCASE_Z: 90,
  CHAR_LOWERCASE_Z: 122,
  CHAR_LEFT_PARENTHESES: 40,
  CHAR_RIGHT_PARENTHESES: 41,
  CHAR_ASTERISK: 42,
  CHAR_AMPERSAND: 38,
  CHAR_AT: 64,
  CHAR_BACKWARD_SLASH: 92,
  CHAR_CARRIAGE_RETURN: 13,
  CHAR_CIRCUMFLEX_ACCENT: 94,
  CHAR_COLON: 58,
  CHAR_COMMA: 44,
  CHAR_DOT: 46,
  CHAR_DOUBLE_QUOTE: 34,
  CHAR_EQUAL: 61,
  CHAR_EXCLAMATION_MARK: 33,
  CHAR_FORM_FEED: 12,
  CHAR_FORWARD_SLASH: 47,
  CHAR_GRAVE_ACCENT: 96,
  CHAR_HASH: 35,
  CHAR_HYPHEN_MINUS: 45,
  CHAR_LEFT_ANGLE_BRACKET: 60,
  CHAR_LEFT_CURLY_BRACE: 123,
  CHAR_LEFT_SQUARE_BRACKET: 91,
  CHAR_LINE_FEED: 10,
  CHAR_NO_BREAK_SPACE: 160,
  CHAR_PERCENT: 37,
  CHAR_PLUS: 43,
  CHAR_QUESTION_MARK: 63,
  CHAR_RIGHT_ANGLE_BRACKET: 62,
  CHAR_RIGHT_CURLY_BRACE: 125,
  CHAR_RIGHT_SQUARE_BRACKET: 93,
  CHAR_SEMICOLON: 59,
  CHAR_SINGLE_QUOTE: 39,
  CHAR_SPACE: 32,
  CHAR_TAB: 9,
  CHAR_UNDERSCORE: 95,
  CHAR_VERTICAL_LINE: 124,
  CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279,
  SEP: ne.sep,
  extglobChars: (t) => ({
    "!": { type: "negate", open: "(?:(?!(?:", close: `))${t.STAR})` },
    "?": { type: "qmark", open: "(?:", close: ")?" },
    "+": { type: "plus", open: "(?:", close: ")+" },
    "*": { type: "star", open: "(?:", close: ")*" },
    "@": { type: "at", open: "(?:", close: ")" },
  }),
  globChars: (t) => !0 === t ? fe : pe,
};
!function (t) {
  const e = i,
    n = "win32" === process.platform,
    {
      REGEX_BACKSLASH: r,
      REGEX_REMOVE_BACKSLASH: s,
      REGEX_SPECIAL_CHARS: o,
      REGEX_SPECIAL_CHARS_GLOBAL: a,
    } = he;
  t.isObject = (t) => null !== t && "object" == typeof t && !Array.isArray(t),
    t.hasRegexChars = (t) => o.test(t),
    t.isRegexChar = (e) => 1 === e.length && t.hasRegexChars(e),
    t.escapeRegex = (t) => t.replace(a, "\\$1"),
    t.toPosixSlashes = (t) => t.replace(r, "/"),
    t.removeBackslashes = (t) => t.replace(s, (t) => "\\" === t ? "" : t),
    t.supportsLookbehinds = () => {
      const t = process.version.slice(1).split(".").map(Number);
      return 3 === t.length && t[0] >= 9 || 8 === t[0] && t[1] >= 10;
    },
    t.isWindows = (t) =>
      t && "boolean" == typeof t.windows
        ? t.windows
        : !0 === n || "\\" === e.sep,
    t.escapeLast = (e, n, r) => {
      const i = e.lastIndexOf(n, r);
      return -1 === i
        ? e
        : "\\" === e[i - 1]
        ? t.escapeLast(e, n, i - 1)
        : `${e.slice(0, i)}\\${e.slice(i)}`;
    },
    t.removePrefix = (t, e = {}) => {
      let n = t;
      return n.startsWith("./") && (n = n.slice(2), e.prefix = "./"), n;
    },
    t.wrapOutput = (t, e = {}, n = {}) => {
      let r = `${n.contains ? "" : "^"}(?:${t})${n.contains ? "" : "$"}`;
      return !0 === e.negated && (r = `(?:^(?!${r}).*$)`), r;
    };
}(ee);
const de = ee,
  {
    CHAR_ASTERISK: ye,
    CHAR_AT: ge,
    CHAR_BACKWARD_SLASH: me,
    CHAR_COMMA: _e,
    CHAR_DOT: Se,
    CHAR_EXCLAMATION_MARK: ve,
    CHAR_FORWARD_SLASH: be,
    CHAR_LEFT_CURLY_BRACE: Ee,
    CHAR_LEFT_PARENTHESES: we,
    CHAR_LEFT_SQUARE_BRACKET: Ae,
    CHAR_PLUS: Re,
    CHAR_QUESTION_MARK: Pe,
    CHAR_RIGHT_CURLY_BRACE: Oe,
    CHAR_RIGHT_PARENTHESES: ke,
    CHAR_RIGHT_SQUARE_BRACKET: xe,
  } = he,
  Ce = (t) => t === be || t === me,
  Te = (t) => {
    !0 !== t.isPrefix && (t.depth = t.isGlobstar ? 1 / 0 : 1);
  };
var Le = (t, e) => {
  const n = e || {},
    r = t.length - 1,
    i = !0 === n.parts || !0 === n.scanToEnd,
    s = [],
    o = [],
    a = [];
  let c,
    u,
    l = t,
    p = -1,
    f = 0,
    h = 0,
    d = !1,
    y = !1,
    g = !1,
    m = !1,
    _ = !1,
    S = !1,
    v = !1,
    b = !1,
    E = !1,
    w = !1,
    A = 0,
    R = { value: "", depth: 0, isGlob: !1 };
  const P = () => p >= r, O = () => (c = u, l.charCodeAt(++p));
  for (; p < r;) {
    let t;
    if (u = O(), u !== me) {
      if (!0 === S || u === Ee) {
        for (A++; !0 !== P() && (u = O());) {
          if (u !== me) {
            if (u !== Ee) {
              if (!0 !== S && u === Se && (u = O()) === Se) {
                if (
                  d = R.isBrace = !0, g = R.isGlob = !0, w = !0, !0 === i
                ) continue;
                break;
              }
              if (!0 !== S && u === _e) {
                if (
                  d = R.isBrace = !0, g = R.isGlob = !0, w = !0, !0 === i
                ) continue;
                break;
              }
              if (u === Oe && (A--, 0 === A)) {
                S = !1, d = R.isBrace = !0, w = !0;
                break;
              }
            } else A++;
          } else v = R.backslashes = !0, O();
        }
        if (!0 === i) continue;
        break;
      }
      if (u !== be) {
        if (!0 !== n.noext) {
          if (
            !0 === (u === Re || u === ge || u === ye || u === Pe || u === ve) &&
            l.charCodeAt(p + 1) === we
          ) {
            if (
              g = R.isGlob = !0,
                m = R.isExtglob = !0,
                w = !0,
                u === ve && p === f && (E = !0),
                !0 === i
            ) {
              for (; !0 !== P() && (u = O());) {
                if (u !== me) {
                  if (u === ke) {
                    g = R.isGlob = !0, w = !0;
                    break;
                  }
                } else v = R.backslashes = !0, u = O();
              }
              continue;
            }
            break;
          }
        }
        if (u === ye) {
          if (
            c === ye && (_ = R.isGlobstar = !0),
              g = R.isGlob = !0,
              w = !0,
              !0 === i
          ) continue;
          break;
        }
        if (u === Pe) {
          if (g = R.isGlob = !0, w = !0, !0 === i) continue;
          break;
        }
        if (u === Ae) {
          for (; !0 !== P() && (t = O());) {
            if (t !== me) {
              if (t === xe) {
                y = R.isBracket = !0, g = R.isGlob = !0, w = !0;
                break;
              }
            } else v = R.backslashes = !0, O();
          }
          if (!0 === i) continue;
          break;
        }
        if (!0 === n.nonegate || u !== ve || p !== f) {
          if (!0 !== n.noparen && u === we) {
            if (g = R.isGlob = !0, !0 === i) {
              for (; !0 !== P() && (u = O());) {
                if (u !== we) {
                  if (u === ke) {
                    w = !0;
                    break;
                  }
                } else v = R.backslashes = !0, u = O();
              }
              continue;
            }
            break;
          }
          if (!0 === g) {
            if (w = !0, !0 === i) continue;
            break;
          }
        } else b = R.negated = !0, f++;
      } else {
        if (
          s.push(p),
            o.push(R),
            R = { value: "", depth: 0, isGlob: !1 },
            !0 === w
        ) continue;
        if (c === Se && p === f + 1) {
          f += 2;
          continue;
        }
        h = p + 1;
      }
    } else v = R.backslashes = !0, u = O(), u === Ee && (S = !0);
  }
  !0 === n.noext && (m = !1, g = !1);
  let k = l, x = "", C = "";
  f > 0 && (x = l.slice(0, f), l = l.slice(f), h -= f),
    k && !0 === g && h > 0
      ? (k = l.slice(0, h), C = l.slice(h))
      : !0 === g
      ? (k = "", C = l)
      : k = l,
    k && "" !== k && "/" !== k && k !== l && Ce(k.charCodeAt(k.length - 1)) &&
    (k = k.slice(0, -1)),
    !0 === n.unescape &&
    (C && (C = de.removeBackslashes(C)),
      k && !0 === v && (k = de.removeBackslashes(k)));
  const T = {
    prefix: x,
    input: t,
    start: f,
    base: k,
    glob: C,
    isBrace: d,
    isBracket: y,
    isGlob: g,
    isExtglob: m,
    isGlobstar: _,
    negated: b,
    negatedExtglob: E,
  };
  if (
    !0 === n.tokens && (T.maxDepth = 0, Ce(u) || o.push(R), T.tokens = o),
      !0 === n.parts || !0 === n.tokens
  ) {
    let e;
    for (let r = 0; r < s.length; r++) {
      const i = e ? e + 1 : f, c = s[r], u = t.slice(i, c);
      n.tokens &&
      (0 === r && 0 !== f
        ? (o[r].isPrefix = !0, o[r].value = x)
        : o[r].value = u,
        Te(o[r]),
        T.maxDepth += o[r].depth),
        0 === r && "" === u || a.push(u),
        e = c;
    }
    if (e && e + 1 < t.length) {
      const r = t.slice(e + 1);
      a.push(r),
        n.tokens &&
        (o[o.length - 1].value = r,
          Te(o[o.length - 1]),
          T.maxDepth += o[o.length - 1].depth);
    }
    T.slashes = s, T.parts = a;
  }
  return T;
};
const $e = he,
  Fe = ee,
  {
    MAX_LENGTH: De,
    POSIX_REGEX_SOURCE: Ne,
    REGEX_NON_SPECIAL_CHARS: Me,
    REGEX_SPECIAL_CHARS_BACKREF: He,
    REPLACEMENTS: Ie,
  } = $e,
  je = (t, e) => {
    if ("function" == typeof e.expandRange) return e.expandRange(...t, e);
    t.sort();
    const n = `[${t.join("-")}]`;
    try {
      new RegExp(n);
    } catch (e) {
      return t.map((t) => Fe.escapeRegex(t)).join("..");
    }
    return n;
  },
  Be = (t, e) =>
    `Missing ${t}: "${e}" - use "\\\\${e}" to match literal characters`,
  Ge = (t, e) => {
    if ("string" != typeof t) throw new TypeError("Expected a string");
    t = Ie[t] || t;
    const n = { ...e },
      r = "number" == typeof n.maxLength ? Math.min(De, n.maxLength) : De;
    let i = t.length;
    if (i > r) {
      throw new SyntaxError(
        `Input length: ${i}, exceeds maximum allowed length: ${r}`,
      );
    }
    const s = { type: "bos", value: "", output: n.prepend || "" },
      o = [s],
      a = n.capture ? "" : "?:",
      c = Fe.isWindows(e),
      u = $e.globChars(c),
      l = $e.extglobChars(u),
      {
        DOT_LITERAL: p,
        PLUS_LITERAL: f,
        SLASH_LITERAL: h,
        ONE_CHAR: d,
        DOTS_SLASH: y,
        NO_DOT: g,
        NO_DOT_SLASH: m,
        NO_DOTS_SLASH: _,
        QMARK: S,
        QMARK_NO_DOT: v,
        STAR: b,
        START_ANCHOR: E,
      } = u,
      w = (t) => `(${a}(?:(?!${E}${t.dot ? y : p}).)*?)`,
      A = n.dot ? "" : g,
      R = n.dot ? S : v;
    let P = !0 === n.bash ? w(n) : b;
    n.capture && (P = `(${P})`),
      "boolean" == typeof n.noext && (n.noextglob = n.noext);
    const O = {
      input: t,
      index: -1,
      start: 0,
      dot: !0 === n.dot,
      consumed: "",
      output: "",
      prefix: "",
      backtrack: !1,
      negated: !1,
      brackets: 0,
      braces: 0,
      parens: 0,
      quotes: 0,
      globstar: !1,
      tokens: o,
    };
    t = Fe.removePrefix(t, O), i = t.length;
    const k = [], x = [], C = [];
    let T, L = s;
    const $ = () => O.index === i - 1,
      F = O.peek = (e = 1) => t[O.index + e],
      D = O.advance = () => t[++O.index] || "",
      N = () => t.slice(O.index + 1),
      M = (t = "", e = 0) => {
        O.consumed += t, O.index += e;
      },
      H = (t) => {
        O.output += null != t.output ? t.output : t.value, M(t.value);
      },
      I = () => {
        let t = 1;
        for (; "!" === F() && ("(" !== F(2) || "?" === F(3));) {
          D(), O.start++, t++;
        }
        return t % 2 != 0 && (O.negated = !0, O.start++, !0);
      },
      j = (t) => {
        O[t]++, C.push(t);
      },
      B = (t) => {
        O[t]--, C.pop();
      },
      G = (t) => {
        if ("globstar" === L.type) {
          const e = O.braces > 0 && ("comma" === t.type || "brace" === t.type),
            n = !0 === t.extglob ||
              k.length && ("pipe" === t.type || "paren" === t.type);
          "slash" === t.type || "paren" === t.type || e || n ||
            (O.output = O.output.slice(0, -L.output.length),
              L.type = "star",
              L.value = "*",
              L.output = P,
              O.output += L.output);
        }
        if (
          k.length && "paren" !== t.type && (k[k.length - 1].inner += t.value),
            (t.value || t.output) && H(t),
            L && "text" === L.type && "text" === t.type
        ) {
          return L.value += t.value,
            void (L.output = (L.output || "") + t.value);
        }
        t.prev = L, o.push(t), L = t;
      },
      W = (t, e) => {
        const r = { ...l[e], conditions: 1, inner: "" };
        r.prev = L, r.parens = O.parens, r.output = O.output;
        const i = (n.capture ? "(" : "") + r.open;
        j("parens"),
          G({ type: t, value: e, output: O.output ? "" : d }),
          G({ type: "paren", extglob: !0, value: D(), output: i }),
          k.push(r);
      },
      U = (t) => {
        let r, i = t.close + (n.capture ? ")" : "");
        if ("negate" === t.type) {
          let s = P;
          if (
            t.inner && t.inner.length > 1 && t.inner.includes("/") &&
            (s = w(n)),
              (s !== P || $() || /^\)+$/.test(N())) &&
              (i = t.close = `)$))${s}`),
              t.inner.includes("*") && (r = N()) && /^\.[^\\/.]+$/.test(r)
          ) {
            const n = Ge(r, { ...e, fastpaths: !1 }).output;
            i = t.close = `)${n})${s})`;
          }
          "bos" === t.prev.type && (O.negatedExtglob = !0);
        }
        G({ type: "paren", extglob: !0, value: T, output: i }), B("parens");
      };
    if (!1 !== n.fastpaths && !/(^[*!]|[/()[\]{}"])/.test(t)) {
      let r = !1,
        i = t.replace(
          He,
          (t, e, n, i, s, o) =>
            "\\" === i
              ? (r = !0, t)
              : "?" === i
              ? e
                ? e + i + (s ? S.repeat(s.length) : "")
                : 0 === o
                ? R + (s ? S.repeat(s.length) : "")
                : S.repeat(n.length)
              : "." === i
              ? p.repeat(n.length)
              : "*" === i
              ? e ? e + i + (s ? P : "") : P
              : e
              ? t
              : `\\${t}`,
        );
      return !0 === r &&
        (i = !0 === n.unescape ? i.replace(/\\/g, "") : i.replace(
          /\\+/g,
          (t) => t.length % 2 == 0 ? "\\\\" : t ? "\\" : "",
        )),
        i === t && !0 === n.contains
          ? (O.output = t, O)
          : (O.output = Fe.wrapOutput(i, O, e), O);
    }
    for (; !$();) {
      if (T = D(), "\0" === T) continue;
      if ("\\" === T) {
        const t = F();
        if ("/" === t && !0 !== n.bash) continue;
        if ("." === t || ";" === t) continue;
        if (!t) {
          T += "\\", G({ type: "text", value: T });
          continue;
        }
        const e = /^\\+/.exec(N());
        let r = 0;
        if (
          e && e[0].length > 2 &&
          (r = e[0].length, O.index += r, r % 2 != 0 && (T += "\\")),
            !0 === n.unescape ? T = D() : T += D(),
            0 === O.brackets
        ) {
          G({ type: "text", value: T });
          continue;
        }
      }
      if (
        O.brackets > 0 && ("]" !== T || "[" === L.value || "[^" === L.value)
      ) {
        if (!1 !== n.posix && ":" === T) {
          const t = L.value.slice(1);
          if (t.includes("[") && (L.posix = !0, t.includes(":"))) {
            const t = L.value.lastIndexOf("["),
              e = L.value.slice(0, t),
              n = L.value.slice(t + 2),
              r = Ne[n];
            if (r) {
              L.value = e + r,
                O.backtrack = !0,
                D(),
                s.output || 1 !== o.indexOf(L) || (s.output = d);
              continue;
            }
          }
        }
        ("[" === T && ":" !== F() || "-" === T && "]" === F()) &&
        (T = `\\${T}`),
          "]" !== T || "[" !== L.value && "[^" !== L.value || (T = `\\${T}`),
          !0 === n.posix && "!" === T && "[" === L.value && (T = "^"),
          L.value += T,
          H({ value: T });
        continue;
      }
      if (1 === O.quotes && '"' !== T) {
        T = Fe.escapeRegex(T), L.value += T, H({ value: T });
        continue;
      }
      if ('"' === T) {
        O.quotes = 1 === O.quotes ? 0 : 1,
          !0 === n.keepQuotes && G({ type: "text", value: T });
        continue;
      }
      if ("(" === T) {
        j("parens"), G({ type: "paren", value: T });
        continue;
      }
      if (")" === T) {
        if (0 === O.parens && !0 === n.strictBrackets) {
          throw new SyntaxError(Be("opening", "("));
        }
        const t = k[k.length - 1];
        if (t && O.parens === t.parens + 1) {
          U(k.pop());
          continue;
        }
        G({ type: "paren", value: T, output: O.parens ? ")" : "\\)" }),
          B("parens");
        continue;
      }
      if ("[" === T) {
        if (!0 !== n.nobracket && N().includes("]")) j("brackets");
        else {
          if (!0 !== n.nobracket && !0 === n.strictBrackets) {
            throw new SyntaxError(Be("closing", "]"));
          }
          T = `\\${T}`;
        }
        G({ type: "bracket", value: T });
        continue;
      }
      if ("]" === T) {
        if (
          !0 === n.nobracket ||
          L && "bracket" === L.type && 1 === L.value.length
        ) {
          G({ type: "text", value: T, output: `\\${T}` });
          continue;
        }
        if (0 === O.brackets) {
          if (!0 === n.strictBrackets) {
            throw new SyntaxError(Be("opening", "["));
          }
          G({ type: "text", value: T, output: `\\${T}` });
          continue;
        }
        B("brackets");
        const t = L.value.slice(1);
        if (
          !0 === L.posix || "^" !== t[0] || t.includes("/") || (T = `/${T}`),
            L.value += T,
            H({ value: T }),
            !1 === n.literalBrackets || Fe.hasRegexChars(t)
        ) continue;
        const e = Fe.escapeRegex(L.value);
        if (
          O.output = O.output.slice(0, -L.value.length),
            !0 === n.literalBrackets
        ) {
          O.output += e, L.value = e;
          continue;
        }
        L.value = `(${a}${e}|${L.value})`, O.output += L.value;
        continue;
      }
      if ("{" === T && !0 !== n.nobrace) {
        j("braces");
        const t = {
          type: "brace",
          value: T,
          output: "(",
          outputIndex: O.output.length,
          tokensIndex: O.tokens.length,
        };
        x.push(t), G(t);
        continue;
      }
      if ("}" === T) {
        const t = x[x.length - 1];
        if (!0 === n.nobrace || !t) {
          G({ type: "text", value: T, output: T });
          continue;
        }
        let e = ")";
        if (!0 === t.dots) {
          const t = o.slice(), r = [];
          for (
            let e = t.length - 1;
            e >= 0 && (o.pop(), "brace" !== t[e].type);
            e--
          ) "dots" !== t[e].type && r.unshift(t[e].value);
          e = je(r, n), O.backtrack = !0;
        }
        if (!0 !== t.comma && !0 !== t.dots) {
          const n = O.output.slice(0, t.outputIndex),
            r = O.tokens.slice(t.tokensIndex);
          t.value = t.output = "\\{", T = e = "\\}", O.output = n;
          for (const t of r) O.output += t.output || t.value;
        }
        G({ type: "brace", value: T, output: e }), B("braces"), x.pop();
        continue;
      }
      if ("|" === T) {
        k.length > 0 && k[k.length - 1].conditions++,
          G({ type: "text", value: T });
        continue;
      }
      if ("," === T) {
        let t = T;
        const e = x[x.length - 1];
        e && "braces" === C[C.length - 1] && (e.comma = !0, t = "|"),
          G({ type: "comma", value: T, output: t });
        continue;
      }
      if ("/" === T) {
        if ("dot" === L.type && O.index === O.start + 1) {
          O.start = O.index + 1, O.consumed = "", O.output = "", o.pop(), L = s;
          continue;
        }
        G({ type: "slash", value: T, output: h });
        continue;
      }
      if ("." === T) {
        if (O.braces > 0 && "dot" === L.type) {
          "." === L.value && (L.output = p);
          const t = x[x.length - 1];
          L.type = "dots", L.output += T, L.value += T, t.dots = !0;
          continue;
        }
        if (
          O.braces + O.parens === 0 && "bos" !== L.type && "slash" !== L.type
        ) {
          G({ type: "text", value: T, output: p });
          continue;
        }
        G({ type: "dot", value: T, output: p });
        continue;
      }
      if ("?" === T) {
        if (
          !(L && "(" === L.value) && !0 !== n.noextglob && "(" === F() &&
          "?" !== F(2)
        ) {
          W("qmark", T);
          continue;
        }
        if (L && "paren" === L.type) {
          const t = F();
          let e = T;
          if ("<" === t && !Fe.supportsLookbehinds()) {
            throw new Error(
              "Node.js v10 or higher is required for regex lookbehinds",
            );
          }
          ("(" === L.value && !/[!=<:]/.test(t) ||
            "<" === t && !/<([!=]|\w+>)/.test(N())) && (e = `\\${T}`),
            G({ type: "text", value: T, output: e });
          continue;
        }
        if (!0 !== n.dot && ("slash" === L.type || "bos" === L.type)) {
          G({ type: "qmark", value: T, output: v });
          continue;
        }
        G({ type: "qmark", value: T, output: S });
        continue;
      }
      if ("!" === T) {
        if (
          !0 !== n.noextglob && "(" === F() &&
          ("?" !== F(2) || !/[!=<:]/.test(F(3)))
        ) {
          W("negate", T);
          continue;
        }
        if (!0 !== n.nonegate && 0 === O.index) {
          I();
          continue;
        }
      }
      if ("+" === T) {
        if (!0 !== n.noextglob && "(" === F() && "?" !== F(2)) {
          W("plus", T);
          continue;
        }
        if (L && "(" === L.value || !1 === n.regex) {
          G({ type: "plus", value: T, output: f });
          continue;
        }
        if (
          L &&
            ("bracket" === L.type || "paren" === L.type ||
              "brace" === L.type) || O.parens > 0
        ) {
          G({ type: "plus", value: T });
          continue;
        }
        G({ type: "plus", value: f });
        continue;
      }
      if ("@" === T) {
        if (!0 !== n.noextglob && "(" === F() && "?" !== F(2)) {
          G({ type: "at", extglob: !0, value: T, output: "" });
          continue;
        }
        G({ type: "text", value: T });
        continue;
      }
      if ("*" !== T) {
        "$" !== T && "^" !== T || (T = `\\${T}`);
        const t = Me.exec(N());
        t && (T += t[0], O.index += t[0].length), G({ type: "text", value: T });
        continue;
      }
      if (L && ("globstar" === L.type || !0 === L.star)) {
        L.type = "star",
          L.star = !0,
          L.value += T,
          L.output = P,
          O.backtrack = !0,
          O.globstar = !0,
          M(T);
        continue;
      }
      let e = N();
      if (!0 !== n.noextglob && /^\([^?]/.test(e)) {
        W("star", T);
        continue;
      }
      if ("star" === L.type) {
        if (!0 === n.noglobstar) {
          M(T);
          continue;
        }
        const r = L.prev,
          i = r.prev,
          s = "slash" === r.type || "bos" === r.type,
          o = i && ("star" === i.type || "globstar" === i.type);
        if (!0 === n.bash && (!s || e[0] && "/" !== e[0])) {
          G({ type: "star", value: T, output: "" });
          continue;
        }
        const a = O.braces > 0 && ("comma" === r.type || "brace" === r.type),
          c = k.length && ("pipe" === r.type || "paren" === r.type);
        if (!s && "paren" !== r.type && !a && !c) {
          G({ type: "star", value: T, output: "" });
          continue;
        }
        for (; "/**" === e.slice(0, 3);) {
          const n = t[O.index + 4];
          if (n && "/" !== n) break;
          e = e.slice(3), M("/**", 3);
        }
        if ("bos" === r.type && $()) {
          L.type = "globstar",
            L.value += T,
            L.output = w(n),
            O.output = L.output,
            O.globstar = !0,
            M(T);
          continue;
        }
        if ("slash" === r.type && "bos" !== r.prev.type && !o && $()) {
          O.output = O.output.slice(0, -(r.output + L.output).length),
            r.output = `(?:${r.output}`,
            L.type = "globstar",
            L.output = w(n) + (n.strictSlashes ? ")" : "|$)"),
            L.value += T,
            O.globstar = !0,
            O.output += r.output + L.output,
            M(T);
          continue;
        }
        if ("slash" === r.type && "bos" !== r.prev.type && "/" === e[0]) {
          const t = void 0 !== e[1] ? "|$" : "";
          O.output = O.output.slice(0, -(r.output + L.output).length),
            r.output = `(?:${r.output}`,
            L.type = "globstar",
            L.output = `${w(n)}${h}|${h}${t})`,
            L.value += T,
            O.output += r.output + L.output,
            O.globstar = !0,
            M(T + D()),
            G({ type: "slash", value: "/", output: "" });
          continue;
        }
        if ("bos" === r.type && "/" === e[0]) {
          L.type = "globstar",
            L.value += T,
            L.output = `(?:^|${h}|${w(n)}${h})`,
            O.output = L.output,
            O.globstar = !0,
            M(T + D()),
            G({ type: "slash", value: "/", output: "" });
          continue;
        }
        O.output = O.output.slice(0, -L.output.length),
          L.type = "globstar",
          L.output = w(n),
          L.value += T,
          O.output += L.output,
          O.globstar = !0,
          M(T);
        continue;
      }
      const r = { type: "star", value: T, output: P };
      !0 !== n.bash
        ? !L || "bracket" !== L.type && "paren" !== L.type || !0 !== n.regex
          ? (O.index !== O.start && "slash" !== L.type && "dot" !== L.type ||
            ("dot" === L.type
              ? (O.output += m, L.output += m)
              : !0 === n.dot
              ? (O.output += _, L.output += _)
              : (O.output += A, L.output += A),
              "*" !== F() && (O.output += d, L.output += d)),
            G(r))
          : (r.output = T, G(r))
        : (r.output = ".*?",
          "bos" !== L.type && "slash" !== L.type || (r.output = A + r.output),
          G(r));
    }
    for (; O.brackets > 0;) {
      if (!0 === n.strictBrackets) throw new SyntaxError(Be("closing", "]"));
      O.output = Fe.escapeLast(O.output, "["), B("brackets");
    }
    for (; O.parens > 0;) {
      if (!0 === n.strictBrackets) throw new SyntaxError(Be("closing", ")"));
      O.output = Fe.escapeLast(O.output, "("), B("parens");
    }
    for (; O.braces > 0;) {
      if (!0 === n.strictBrackets) throw new SyntaxError(Be("closing", "}"));
      O.output = Fe.escapeLast(O.output, "{"), B("braces");
    }
    if (
      !0 === n.strictSlashes || "star" !== L.type && "bracket" !== L.type ||
      G({ type: "maybe_slash", value: "", output: `${h}?` }), !0 === O.backtrack
    ) {
      O.output = "";
      for (const t of O.tokens) {
        O.output += null != t.output ? t.output : t.value,
          t.suffix && (O.output += t.suffix);
      }
    }
    return O;
  };
Ge.fastpaths = (t, e) => {
  const n = { ...e },
    r = "number" == typeof n.maxLength ? Math.min(De, n.maxLength) : De,
    i = t.length;
  if (i > r) {
    throw new SyntaxError(
      `Input length: ${i}, exceeds maximum allowed length: ${r}`,
    );
  }
  t = Ie[t] || t;
  const s = Fe.isWindows(e),
    {
      DOT_LITERAL: o,
      SLASH_LITERAL: a,
      ONE_CHAR: c,
      DOTS_SLASH: u,
      NO_DOT: l,
      NO_DOTS: p,
      NO_DOTS_SLASH: f,
      STAR: h,
      START_ANCHOR: d,
    } = $e.globChars(s),
    y = n.dot ? p : l,
    g = n.dot ? f : l,
    m = n.capture ? "" : "?:";
  let _ = !0 === n.bash ? ".*?" : h;
  n.capture && (_ = `(${_})`);
  const S = (t) =>
      !0 === t.noglobstar ? _ : `(${m}(?:(?!${d}${t.dot ? u : o}).)*?)`,
    v = (t) => {
      switch (t) {
        case "*":
          return `${y}${c}${_}`;
        case ".*":
          return `${o}${c}${_}`;
        case "*.*":
          return `${y}${_}${o}${c}${_}`;
        case "*/*":
          return `${y}${_}${a}${c}${g}${_}`;
        case "**":
          return y + S(n);
        case "**/*":
          return `(?:${y}${S(n)}${a})?${g}${c}${_}`;
        case "**/*.*":
          return `(?:${y}${S(n)}${a})?${g}${_}${o}${c}${_}`;
        case "**/.*":
          return `(?:${y}${S(n)}${a})?${o}${c}${_}`;
        default: {
          const e = /^(.*?)\.(\w+)$/.exec(t);
          if (!e) return;
          const n = v(e[1]);
          if (!n) return;
          return n + o + e[2];
        }
      }
    },
    b = Fe.removePrefix(t, { negated: !1, prefix: "" });
  let E = v(b);
  return E && !0 !== n.strictSlashes && (E += `${a}?`), E;
};
const We = i,
  Ue = Le,
  Ke = Ge,
  Ve = ee,
  Ye = he,
  Qe = (t, e, n = !1) => {
    if (Array.isArray(t)) {
      const r = t.map((t) => Qe(t, e, n)),
        i = (t) => {
          for (const e of r) {
            const n = e(t);
            if (n) return n;
          }
          return !1;
        };
      return i;
    }
    const r = (i = t) && "object" == typeof i && !Array.isArray(i) &&
      t.tokens && t.input;
    var i;
    if ("" === t || "string" != typeof t && !r) {
      throw new TypeError("Expected pattern to be a non-empty string");
    }
    const s = e || {},
      o = Ve.isWindows(e),
      a = r ? Qe.compileRe(t, e) : Qe.makeRe(t, e, !1, !0),
      c = a.state;
    delete a.state;
    let u = () => !1;
    if (s.ignore) {
      const t = { ...e, ignore: null, onMatch: null, onResult: null };
      u = Qe(s.ignore, t, n);
    }
    const l = (n, r = !1) => {
      const { isMatch: i, match: l, output: p } = Qe.test(n, a, e, {
          glob: t,
          posix: o,
        }),
        f = {
          glob: t,
          state: c,
          regex: a,
          posix: o,
          input: n,
          output: p,
          match: l,
          isMatch: i,
        };
      return "function" == typeof s.onResult && s.onResult(f),
        !1 === i
          ? (f.isMatch = !1, !!r && f)
          : u(n)
          ? ("function" == typeof s.onIgnore && s.onIgnore(f),
            f.isMatch = !1,
            !!r && f)
          : ("function" == typeof s.onMatch && s.onMatch(f), !r || f);
    };
    return n && (l.state = c), l;
  };
Qe.test = (t, e, n, { glob: r, posix: i } = {}) => {
  if ("string" != typeof t) {
    throw new TypeError("Expected input to be a string");
  }
  if ("" === t) return { isMatch: !1, output: "" };
  const s = n || {}, o = s.format || (i ? Ve.toPosixSlashes : null);
  let a = t === r, c = a && o ? o(t) : t;
  return !1 === a && (c = o ? o(t) : t, a = c === r),
    !1 !== a && !0 !== s.capture ||
    (a = !0 === s.matchBase || !0 === s.basename
      ? Qe.matchBase(t, e, n, i)
      : e.exec(c)),
    { isMatch: Boolean(a), match: a, output: c };
},
  Qe.matchBase = (t, e, n, r = Ve.isWindows(n)) =>
    (e instanceof RegExp ? e : Qe.makeRe(e, n)).test(We.basename(t)),
  Qe.isMatch = (t, e, n) => Qe(e, n)(t),
  Qe.parse = (t, e) =>
    Array.isArray(t)
      ? t.map((t) => Qe.parse(t, e))
      : Ke(t, { ...e, fastpaths: !1 }),
  Qe.scan = (t, e) => Ue(t, e),
  Qe.compileRe = (t, e, n = !1, r = !1) => {
    if (!0 === n) return t.output;
    const i = e || {}, s = i.contains ? "" : "^", o = i.contains ? "" : "$";
    let a = `${s}(?:${t.output})${o}`;
    t && !0 === t.negated && (a = `^(?!${a}).*$`);
    const c = Qe.toRegex(a, e);
    return !0 === r && (c.state = t), c;
  },
  Qe.makeRe = (t, e = {}, n = !1, r = !1) => {
    if (!t || "string" != typeof t) {
      throw new TypeError("Expected a non-empty string");
    }
    let i = { negated: !1, fastpaths: !0 };
    return !1 === e.fastpaths || "." !== t[0] && "*" !== t[0] ||
      (i.output = Ke.fastpaths(t, e)),
      i.output || (i = Ke(t, e)),
      Qe.compileRe(i, e, n, r);
  },
  Qe.toRegex = (t, e) => {
    try {
      const n = e || {};
      return new RegExp(t, n.flags || (n.nocase ? "i" : ""));
    } catch (t) {
      if (e && !0 === e.debug) throw t;
      return /$^/;
    }
  },
  Qe.constants = Ye;
const qe = s,
  Xe = te,
  Je = Qe,
  Ze = ee,
  ze = (t) => "" === t || "./" === t,
  tn = (t, e, n) => {
    e = [].concat(e), t = [].concat(t);
    let r = new Set(),
      i = new Set(),
      s = new Set(),
      o = 0,
      a = (t) => {
        s.add(t.output), n && n.onResult && n.onResult(t);
      };
    for (let s = 0; s < e.length; s++) {
      let c = Je(String(e[s]), { ...n, onResult: a }, !0),
        u = c.state.negated || c.state.negatedExtglob;
      u && o++;
      for (let e of t) {
        let t = c(e, !0);
        (u ? !t.isMatch : t.isMatch) &&
          (u ? r.add(t.output) : (r.delete(t.output), i.add(t.output)));
      }
    }
    let c = (o === e.length ? [...s] : [...i]).filter((t) => !r.has(t));
    if (n && 0 === c.length) {
      if (!0 === n.failglob) {
        throw new Error(`No matches found for "${e.join(", ")}"`);
      }
      if (!0 === n.nonull || !0 === n.nullglob) {
        return n.unescape ? e.map((t) => t.replace(/\\/g, "")) : e;
      }
    }
    return c;
  };
tn.match = tn,
  tn.matcher = (t, e) => Je(t, e),
  tn.any = tn.isMatch = (t, e, n) => Je(e, n)(t),
  tn.not = (t, e, n = {}) => {
    e = [].concat(e).map(String);
    let r = new Set(),
      i = [],
      s = new Set(tn(t, e, {
        ...n,
        onResult: (t) => {
          n.onResult && n.onResult(t), i.push(t.output);
        },
      }));
    for (let t of i) s.has(t) || r.add(t);
    return [...r];
  },
  tn.contains = (t, e, n) => {
    if ("string" != typeof t) {
      throw new TypeError(`Expected a string: "${qe.inspect(t)}"`);
    }
    if (Array.isArray(e)) return e.some((e) => tn.contains(t, e, n));
    if ("string" == typeof e) {
      if (ze(t) || ze(e)) return !1;
      if (t.includes(e) || t.startsWith("./") && t.slice(2).includes(e)) {
        return !0;
      }
    }
    return tn.isMatch(t, e, { ...n, contains: !0 });
  },
  tn.matchKeys = (t, e, n) => {
    if (!Ze.isObject(t)) {
      throw new TypeError("Expected the first argument to be an object");
    }
    let r = tn(Object.keys(t), e, n), i = {};
    for (let e of r) i[e] = t[e];
    return i;
  },
  tn.some = (t, e, n) => {
    let r = [].concat(t);
    for (let t of [].concat(e)) {
      let e = Je(String(t), n);
      if (r.some((t) => e(t))) return !0;
    }
    return !1;
  },
  tn.every = (t, e, n) => {
    let r = [].concat(t);
    for (let t of [].concat(e)) {
      let e = Je(String(t), n);
      if (!r.every((t) => e(t))) return !1;
    }
    return !0;
  },
  tn.all = (t, e, n) => {
    if ("string" != typeof t) {
      throw new TypeError(`Expected a string: "${qe.inspect(t)}"`);
    }
    return [].concat(e).every((e) => Je(e, n)(t));
  },
  tn.capture = (t, e, n) => {
    let r = Ze.isWindows(n),
      i = Je.makeRe(String(t), { ...n, capture: !0 }).exec(
        r ? Ze.toPosixSlashes(e) : e,
      );
    if (i) return i.slice(1).map((t) => void 0 === t ? "" : t);
  },
  tn.makeRe = (...t) => Je.makeRe(...t),
  tn.scan = (...t) => Je.scan(...t),
  tn.parse = (t, e) => {
    let n = [];
    for (let r of [].concat(t || [])) {
      for (let t of Xe(String(r), e)) n.push(Je.parse(t, e));
    }
    return n;
  },
  tn.braces = (t, e) => {
    if ("string" != typeof t) throw new TypeError("Expected a string");
    return e && !0 === e.nobrace || !/\{.*\}/.test(t) ? [t] : Xe(t, e);
  },
  tn.braceExpand = (t, e) => {
    if ("string" != typeof t) throw new TypeError("Expected a string");
    return tn.braces(t, { ...e, expand: !0 });
  };
var en = tn;
Object.defineProperty(N, "__esModule", { value: !0 }),
  N.removeDuplicateSlashes =
    N.matchAny =
    N.convertPatternsToRe =
    N.makeRe =
    N.getPatternParts =
    N.expandBraceExpansion =
    N.expandPatternsWithBraceExpansion =
    N.isAffectDepthOfReadingPattern =
    N.endsWithSlashGlobStar =
    N.hasGlobStar =
    N.getBaseDirectory =
    N.isPatternRelatedToParentDirectory =
    N.getPatternsOutsideCurrentDirectory =
    N.getPatternsInsideCurrentDirectory =
    N.getPositivePatterns =
    N.getNegativePatterns =
    N.isPositivePattern =
    N.isNegativePattern =
    N.convertToNegativePattern =
    N.convertToPositivePattern =
    N.isDynamicPattern =
    N.isStaticPattern =
      void 0;
const nn = i,
  rn = function (t, e) {
    Object.assign({ flipBackslashes: !0 }, e).flipBackslashes && W &&
    t.indexOf("/") < 0 && (t = t.replace(U, "/")),
      K.test(t) && (t += "/"),
      t += "a";
    do {
      t = G(t);
    } while (B(t) || V.test(t));
    return t.replace(Y, "$1");
  },
  sn = en,
  on = "**",
  an = "\\",
  cn = /[*?]|^!/,
  un = /\[[^[]*]/,
  ln = /(?:^|[^!*+?@])\([^(]*\|[^|]*\)/,
  pn = /[!*+?@]\([^(]*\)/,
  fn = /,|\.\./,
  hn = /(?!^)\/{2,}/g;
function dn(t, e = {}) {
  return !yn(t, e);
}
function yn(t, e = {}) {
  return "" !== t &&
    (!(!1 !== e.caseSensitiveMatch && !t.includes(an)) ||
      (!!(cn.test(t) || un.test(t) || ln.test(t)) ||
        (!(!1 === e.extglob || !pn.test(t)) ||
          !(!1 === e.braceExpansion || !function (t) {
            const e = t.indexOf("{");
            if (-1 === e) return !1;
            const n = t.indexOf("}", e + 1);
            if (-1 === n) return !1;
            const r = t.slice(e, n);
            return fn.test(r);
          }(t)))));
}
function gn(t) {
  return t.startsWith("!") && "(" !== t[1];
}
function mn(t) {
  return !gn(t);
}
function _n(t) {
  return t.startsWith("..") || t.startsWith("./..");
}
function Sn(t) {
  return t.endsWith("/" + on);
}
function vn(t) {
  const e = sn.braces(t, { expand: !0, nodupes: !0, keepEscaping: !0 });
  return e.sort((t, e) => t.length - e.length), e.filter((t) => "" !== t);
}
function bn(t, e) {
  return sn.makeRe(t, e);
}
N.isStaticPattern = dn,
  N.isDynamicPattern = yn,
  N.convertToPositivePattern = function (t) {
    return gn(t) ? t.slice(1) : t;
  },
  N.convertToNegativePattern = function (t) {
    return "!" + t;
  },
  N.isNegativePattern = gn,
  N.isPositivePattern = mn,
  N.getNegativePatterns = function (t) {
    return t.filter(gn);
  },
  N.getPositivePatterns = function (t) {
    return t.filter(mn);
  },
  N.getPatternsInsideCurrentDirectory = function (t) {
    return t.filter((t) => !_n(t));
  },
  N.getPatternsOutsideCurrentDirectory = function (t) {
    return t.filter(_n);
  },
  N.isPatternRelatedToParentDirectory = _n,
  N.getBaseDirectory = function (t) {
    return rn(t, { flipBackslashes: !1 });
  },
  N.hasGlobStar = function (t) {
    return t.includes(on);
  },
  N.endsWithSlashGlobStar = Sn,
  N.isAffectDepthOfReadingPattern = function (t) {
    const e = nn.basename(t);
    return Sn(t) || dn(e);
  },
  N.expandPatternsWithBraceExpansion = function (t) {
    return t.reduce((t, e) => t.concat(vn(e)), []);
  },
  N.expandBraceExpansion = vn,
  N.getPatternParts = function (t, e) {
    let { parts: n } = sn.scan(
      t,
      Object.assign(Object.assign({}, e), { parts: !0 }),
    );
    return 0 === n.length && (n = [t]),
      n[0].startsWith("/") && (n[0] = n[0].slice(1), n.unshift("")),
      n;
  },
  N.makeRe = bn,
  N.convertPatternsToRe = function (t, e) {
    return t.map((t) => bn(t, e));
  },
  N.matchAny = function (t, e) {
    return e.some((e) => e.test(t));
  },
  N.removeDuplicateSlashes = function (t) {
    return t.replace(hn, "/");
  };
var En = {};
const wn = o.PassThrough, An = Array.prototype.slice;
var Rn = function () {
  const t = [], e = An.call(arguments);
  let n = !1, r = e[e.length - 1];
  r && !Array.isArray(r) && null == r.pipe ? e.pop() : r = {};
  const i = !1 !== r.end, s = !0 === r.pipeError;
  null == r.objectMode && (r.objectMode = !0);
  null == r.highWaterMark && (r.highWaterMark = 65536);
  const o = wn(r);
  function a() {
    for (let e = 0, n = arguments.length; e < n; e++) {
      t.push(Pn(arguments[e], r));
    }
    return c(), this;
  }
  function c() {
    if (n) return;
    n = !0;
    let e = t.shift();
    if (!e) return void process.nextTick(u);
    Array.isArray(e) || (e = [e]);
    let r = e.length + 1;
    function i() {
      --r > 0 || (n = !1, c());
    }
    function a(t) {
      function e() {
        t.removeListener("merge2UnpipeEnd", e),
          t.removeListener("end", e),
          s && t.removeListener("error", n),
          i();
      }
      function n(t) {
        o.emit("error", t);
      }
      if (t._readableState.endEmitted) return i();
      t.on("merge2UnpipeEnd", e),
        t.on("end", e),
        s && t.on("error", n),
        t.pipe(o, { end: !1 }),
        t.resume();
    }
    for (let t = 0; t < e.length; t++) a(e[t]);
    i();
  }
  function u() {
    n = !1, o.emit("queueDrain"), i && o.end();
  }
  o.setMaxListeners(0),
    o.add = a,
    o.on("unpipe", function (t) {
      t.emit("merge2UnpipeEnd");
    }),
    e.length && a.apply(null, e);
  return o;
};
function Pn(t, e) {
  if (Array.isArray(t)) {
    for (let n = 0, r = t.length; n < r; n++) t[n] = Pn(t[n], e);
  } else {
    if (
      !t._readableState && t.pipe && (t = t.pipe(wn(e))),
        !t._readableState || !t.pause || !t.pipe
    ) throw new Error("Only readable stream can be merged.");
    t.pause();
  }
  return t;
}
Object.defineProperty(En, "__esModule", { value: !0 }), En.merge = void 0;
const On = Rn;
function kn(t) {
  t.forEach((t) => t.emit("close"));
}
En.merge = function (t) {
  const e = On(t);
  return t.forEach((t) => {
    t.once("error", (t) => e.emit("error", t));
  }),
    e.once("close", () => kn(t)),
    e.once("end", () => kn(t)),
    e;
};
var xn = {};
Object.defineProperty(xn, "__esModule", { value: !0 }),
  xn.isEmpty = xn.isString = void 0,
  xn.isString = function (t) {
    return "string" == typeof t;
  },
  xn.isEmpty = function (t) {
    return "" === t;
  },
  Object.defineProperty(S, "__esModule", { value: !0 }),
  S.string =
    S.stream =
    S.pattern =
    S.path =
    S.fs =
    S.errno =
    S.array =
      void 0;
const Cn = v;
S.array = Cn;
const Tn = b;
S.errno = Tn;
const Ln = E;
S.fs = Ln;
const $n = A;
S.path = $n;
const Fn = N;
S.pattern = Fn;
const Dn = En;
S.stream = Dn;
const Nn = xn;
S.string = Nn,
  Object.defineProperty(_, "__esModule", { value: !0 }),
  _.convertPatternGroupToTask =
    _.convertPatternGroupsToTasks =
    _.groupPatternsByBaseDirectory =
    _.getNegativePatternsAsPositive =
    _.getPositivePatterns =
    _.convertPatternsToTasks =
    _.generate =
      void 0;
const Mn = S;
function Hn(t, e) {
  let n = t;
  return e.braceExpansion &&
    (n = Mn.pattern.expandPatternsWithBraceExpansion(n)),
    e.baseNameMatch && (n = n.map((t) => t.includes("/") ? t : `**/${t}`)),
    n.map((t) => Mn.pattern.removeDuplicateSlashes(t));
}
function In(t, e, n) {
  const r = [],
    i = Mn.pattern.getPatternsOutsideCurrentDirectory(t),
    s = Mn.pattern.getPatternsInsideCurrentDirectory(t),
    o = Gn(i),
    a = Gn(s);
  return r.push(...Wn(o, e, n)),
    "." in a ? r.push(Un(".", s, e, n)) : r.push(...Wn(a, e, n)),
    r;
}
function jn(t) {
  return Mn.pattern.getPositivePatterns(t);
}
function Bn(t, e) {
  return Mn.pattern.getNegativePatterns(t).concat(e).map(
    Mn.pattern.convertToPositivePattern,
  );
}
function Gn(t) {
  return t.reduce((t, e) => {
    const n = Mn.pattern.getBaseDirectory(e);
    return n in t ? t[n].push(e) : t[n] = [e], t;
  }, {});
}
function Wn(t, e, n) {
  return Object.keys(t).map((r) => Un(r, t[r], e, n));
}
function Un(t, e, n, r) {
  return {
    dynamic: r,
    positive: e,
    negative: n,
    base: t,
    patterns: [].concat(e, n.map(Mn.pattern.convertToNegativePattern)),
  };
}
_.generate = function (t, e) {
  const n = Hn(t, e),
    r = Hn(e.ignore, e),
    i = jn(n),
    s = Bn(n, r),
    o = i.filter((t) => Mn.pattern.isStaticPattern(t, e)),
    a = i.filter((t) => Mn.pattern.isDynamicPattern(t, e)),
    c = In(o, s, !1),
    u = In(a, s, !0);
  return c.concat(u);
},
  _.convertPatternsToTasks = In,
  _.getPositivePatterns = jn,
  _.getNegativePatternsAsPositive = Bn,
  _.groupPatternsByBaseDirectory = Gn,
  _.convertPatternGroupsToTasks = Wn,
  _.convertPatternGroupToTask = Un;
var Kn = {},
  Vn = {},
  Yn = {},
  Qn = {},
  qn = {},
  Xn = {},
  Jn = {},
  Zn = {},
  zn = {};
function tr(t, e) {
  t(e);
}
function er(t, e) {
  t(null, e);
}
Object.defineProperty(zn, "__esModule", { value: !0 }),
  zn.read = void 0,
  zn.read = function (t, e, n) {
    e.fs.lstat(t, (r, i) => {
      null === r
        ? i.isSymbolicLink() && e.followSymbolicLink
          ? e.fs.stat(t, (t, r) => {
            if (null !== t) {
              return e.throwErrorOnBrokenSymbolicLink
                ? void tr(n, t)
                : void er(n, i);
            }
            e.markSymbolicLink && (r.isSymbolicLink = () => !0), er(n, r);
          })
          : er(n, i)
        : tr(n, r);
    });
  };
var nr = {};
Object.defineProperty(nr, "__esModule", { value: !0 }),
  nr.read = void 0,
  nr.read = function (t, e) {
    const n = e.fs.lstatSync(t);
    if (!n.isSymbolicLink() || !e.followSymbolicLink) return n;
    try {
      const n = e.fs.statSync(t);
      return e.markSymbolicLink && (n.isSymbolicLink = () => !0), n;
    } catch (t) {
      if (!e.throwErrorOnBrokenSymbolicLink) return n;
      throw t;
    }
  };
var rr = {}, ir = {};
!function (t) {
  Object.defineProperty(t, "__esModule", { value: !0 }),
    t.createFileSystemAdapter = t.FILE_SYSTEM_ADAPTER = void 0;
  const e = c;
  t.FILE_SYSTEM_ADAPTER = {
    lstat: e.lstat,
    stat: e.stat,
    lstatSync: e.lstatSync,
    statSync: e.statSync,
  },
    t.createFileSystemAdapter = function (e) {
      return void 0 === e
        ? t.FILE_SYSTEM_ADAPTER
        : Object.assign(Object.assign({}, t.FILE_SYSTEM_ADAPTER), e);
    };
}(ir), Object.defineProperty(rr, "__esModule", { value: !0 });
const sr = ir;
rr.default = class {
  constructor(t = {}) {
    this._options = t,
      this.followSymbolicLink = this._getValue(
        this._options.followSymbolicLink,
        !0,
      ),
      this.fs = sr.createFileSystemAdapter(this._options.fs),
      this.markSymbolicLink = this._getValue(
        this._options.markSymbolicLink,
        !1,
      ),
      this.throwErrorOnBrokenSymbolicLink = this._getValue(
        this._options.throwErrorOnBrokenSymbolicLink,
        !0,
      );
  }
  _getValue(t, e) {
    return null != t ? t : e;
  }
},
  Object.defineProperty(Zn, "__esModule", { value: !0 }),
  Zn.statSync = Zn.stat = Zn.Settings = void 0;
const or = zn, ar = nr, cr = rr;
function ur(t = {}) {
  return t instanceof cr.default ? t : new cr.default(t);
}
/*! queue-microtask. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */ let lr;
Zn.Settings = cr.default,
  Zn.stat = function (t, e, n) {
    "function" != typeof e ? or.read(t, ur(e), n) : or.read(t, ur(), e);
  },
  Zn.statSync = function (t, e) {
    const n = ur(e);
    return ar.read(t, n);
  };
var pr = function (t, e) {
  let n, r, i, s = !0;
  Array.isArray(t)
    ? (n = [], r = t.length)
    : (i = Object.keys(t), n = {}, r = i.length);
  function o(t) {
    function r() {
      e && e(t, n), e = null;
    }
    s ? fr(r) : r();
  }
  function a(t, e, i) {
    n[t] = i, (0 == --r || e) && o(e);
  }
  r
    ? i
      ? i.forEach(function (e) {
        t[e](function (t, n) {
          a(e, t, n);
        });
      })
      : t.forEach(function (t, e) {
        t(function (t, n) {
          a(e, t, n);
        });
      })
    : o(null);
  s = !1;
};
/*! run-parallel. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */ const fr =
  "function" == typeof queueMicrotask
    ? queueMicrotask.bind("undefined" != typeof window ? window : g)
    : (t) =>
      (lr || (lr = Promise.resolve())).then(t).catch((t) =>
        setTimeout(() => {
          throw t;
        }, 0)
      );
var hr = {};
Object.defineProperty(hr, "__esModule", { value: !0 }),
  hr.IS_SUPPORT_READDIR_WITH_FILE_TYPES = void 0;
const dr = process.versions.node.split(".");
if (void 0 === dr[0] || void 0 === dr[1]) {
  throw new Error(
    `Unexpected behavior. The 'process.versions.node' variable has invalid value: ${process.versions.node}`,
  );
}
const yr = Number.parseInt(dr[0], 10),
  gr = Number.parseInt(dr[1], 10),
  mr = yr > 10,
  _r = 10 === yr && gr >= 10;
hr.IS_SUPPORT_READDIR_WITH_FILE_TYPES = mr || _r;
var Sr = {}, vr = {};
Object.defineProperty(vr, "__esModule", { value: !0 }),
  vr.createDirentFromStats = void 0;
class br {
  constructor(t, e) {
    this.name = t,
      this.isBlockDevice = e.isBlockDevice.bind(e),
      this.isCharacterDevice = e.isCharacterDevice.bind(e),
      this.isDirectory = e.isDirectory.bind(e),
      this.isFIFO = e.isFIFO.bind(e),
      this.isFile = e.isFile.bind(e),
      this.isSocket = e.isSocket.bind(e),
      this.isSymbolicLink = e.isSymbolicLink.bind(e);
  }
}
vr.createDirentFromStats = function (t, e) {
  return new br(t, e);
},
  Object.defineProperty(Sr, "__esModule", { value: !0 }),
  Sr.fs = void 0;
const Er = vr;
Sr.fs = Er;
var wr = {};
Object.defineProperty(wr, "__esModule", { value: !0 }),
  wr.joinPathSegments = void 0,
  wr.joinPathSegments = function (t, e, n) {
    return t.endsWith(n) ? t + e : t + n + e;
  },
  Object.defineProperty(Jn, "__esModule", { value: !0 }),
  Jn.readdir = Jn.readdirWithFileTypes = Jn.read = void 0;
const Ar = Zn, Rr = pr, Pr = hr, Or = Sr, kr = wr;
function xr(t, e, n) {
  e.fs.readdir(t, { withFileTypes: !0 }, (r, i) => {
    if (null !== r) return void Tr(n, r);
    const s = i.map(
      (n) => ({
        dirent: n,
        name: n.name,
        path: kr.joinPathSegments(t, n.name, e.pathSegmentSeparator),
      }),
    );
    if (!e.followSymbolicLinks) return void Lr(n, s);
    const o = s.map((t) =>
      function (t, e) {
        return (n) => {
          t.dirent.isSymbolicLink()
            ? e.fs.stat(t.path, (r, i) => {
              if (null !== r) {
                return e.throwErrorOnBrokenSymbolicLink
                  ? void n(r)
                  : void n(null, t);
              }
              t.dirent = Or.fs.createDirentFromStats(t.name, i), n(null, t);
            })
            : n(null, t);
        };
      }(t, e)
    );
    Rr(o, (t, e) => {
      null === t ? Lr(n, e) : Tr(n, t);
    });
  });
}
function Cr(t, e, n) {
  e.fs.readdir(t, (r, i) => {
    if (null !== r) return void Tr(n, r);
    const s = i.map((n) => {
      const r = kr.joinPathSegments(t, n, e.pathSegmentSeparator);
      return (t) => {
        Ar.stat(r, e.fsStatSettings, (i, s) => {
          if (null !== i) return void t(i);
          const o = {
            name: n,
            path: r,
            dirent: Or.fs.createDirentFromStats(n, s),
          };
          e.stats && (o.stats = s), t(null, o);
        });
      };
    });
    Rr(s, (t, e) => {
      null === t ? Lr(n, e) : Tr(n, t);
    });
  });
}
function Tr(t, e) {
  t(e);
}
function Lr(t, e) {
  t(null, e);
}
Jn.read = function (t, e, n) {
  e.stats || !Pr.IS_SUPPORT_READDIR_WITH_FILE_TYPES ? Cr(t, e, n) : xr(t, e, n);
},
  Jn.readdirWithFileTypes = xr,
  Jn.readdir = Cr;
var $r = {};
Object.defineProperty($r, "__esModule", { value: !0 }),
  $r.readdir = $r.readdirWithFileTypes = $r.read = void 0;
const Fr = Zn, Dr = hr, Nr = Sr, Mr = wr;
function Hr(t, e) {
  return e.fs.readdirSync(t, { withFileTypes: !0 }).map((n) => {
    const r = {
      dirent: n,
      name: n.name,
      path: Mr.joinPathSegments(t, n.name, e.pathSegmentSeparator),
    };
    if (r.dirent.isSymbolicLink() && e.followSymbolicLinks) {
      try {
        const t = e.fs.statSync(r.path);
        r.dirent = Nr.fs.createDirentFromStats(r.name, t);
      } catch (t) {
        if (e.throwErrorOnBrokenSymbolicLink) throw t;
      }
    }
    return r;
  });
}
function Ir(t, e) {
  return e.fs.readdirSync(t).map((n) => {
    const r = Mr.joinPathSegments(t, n, e.pathSegmentSeparator),
      i = Fr.statSync(r, e.fsStatSettings),
      s = { name: n, path: r, dirent: Nr.fs.createDirentFromStats(n, i) };
    return e.stats && (s.stats = i), s;
  });
}
$r.read = function (t, e) {
  return !e.stats && Dr.IS_SUPPORT_READDIR_WITH_FILE_TYPES
    ? Hr(t, e)
    : Ir(t, e);
},
  $r.readdirWithFileTypes = Hr,
  $r.readdir = Ir;
var jr = {}, Br = {};
!function (t) {
  Object.defineProperty(t, "__esModule", { value: !0 }),
    t.createFileSystemAdapter = t.FILE_SYSTEM_ADAPTER = void 0;
  const e = c;
  t.FILE_SYSTEM_ADAPTER = {
    lstat: e.lstat,
    stat: e.stat,
    lstatSync: e.lstatSync,
    statSync: e.statSync,
    readdir: e.readdir,
    readdirSync: e.readdirSync,
  },
    t.createFileSystemAdapter = function (e) {
      return void 0 === e
        ? t.FILE_SYSTEM_ADAPTER
        : Object.assign(Object.assign({}, t.FILE_SYSTEM_ADAPTER), e);
    };
}(Br), Object.defineProperty(jr, "__esModule", { value: !0 });
const Gr = i, Wr = Zn, Ur = Br;
jr.default = class {
  constructor(t = {}) {
    this._options = t,
      this.followSymbolicLinks = this._getValue(
        this._options.followSymbolicLinks,
        !1,
      ),
      this.fs = Ur.createFileSystemAdapter(this._options.fs),
      this.pathSegmentSeparator = this._getValue(
        this._options.pathSegmentSeparator,
        Gr.sep,
      ),
      this.stats = this._getValue(this._options.stats, !1),
      this.throwErrorOnBrokenSymbolicLink = this._getValue(
        this._options.throwErrorOnBrokenSymbolicLink,
        !0,
      ),
      this.fsStatSettings = new Wr.Settings({
        followSymbolicLink: this.followSymbolicLinks,
        fs: this.fs,
        throwErrorOnBrokenSymbolicLink: this.throwErrorOnBrokenSymbolicLink,
      });
  }
  _getValue(t, e) {
    return null != t ? t : e;
  }
},
  Object.defineProperty(Xn, "__esModule", { value: !0 }),
  Xn.Settings = Xn.scandirSync = Xn.scandir = void 0;
const Kr = Jn, Vr = $r, Yr = jr;
function Qr(t = {}) {
  return t instanceof Yr.default ? t : new Yr.default(t);
}
Xn.Settings = Yr.default,
  Xn.scandir = function (t, e, n) {
    "function" != typeof e ? Kr.read(t, Qr(e), n) : Kr.read(t, Qr(), e);
  },
  Xn.scandirSync = function (t, e) {
    const n = Qr(e);
    return Vr.read(t, n);
  };
var qr = { exports: {} };
var Xr = function (t) {
  var e = new t(), n = e;
  return {
    get: function () {
      var r = e;
      return r.next ? e = r.next : (e = new t(), n = e), r.next = null, r;
    },
    release: function (t) {
      n.next = t, n = t;
    },
  };
};
function Jr(t, e, n) {
  if ("function" == typeof t && (n = e, e = t, t = null), !(n >= 1)) {
    throw new Error("fastqueue concurrency must be equal to or greater than 1");
  }
  var r = Xr(zr),
    i = null,
    s = null,
    o = 0,
    a = null,
    c = {
      push: function (l, p) {
        var f = r.get();
        f.context = t,
          f.release = u,
          f.value = l,
          f.callback = p || Zr,
          f.errorHandler = a,
          o >= n || c.paused
            ? s ? (s.next = f, s = f) : (i = f, s = f, c.saturated())
            : (o++, e.call(t, f.value, f.worked));
      },
      drain: Zr,
      saturated: Zr,
      pause: function () {
        c.paused = !0;
      },
      paused: !1,
      get concurrency() {
        return n;
      },
      set concurrency(t) {
        if (!(t >= 1)) {
          throw new Error(
            "fastqueue concurrency must be equal to or greater than 1",
          );
        }
        if (n = t, !c.paused) { for (; i && o < n;) o++, u(); }
      },
      running: function () {
        return o;
      },
      resume: function () {
        if (!c.paused) return;
        if (c.paused = !1, null === i) return o++, void u();
        for (; i && o < n;) o++, u();
      },
      idle: function () {
        return 0 === o && 0 === c.length();
      },
      length: function () {
        var t = i, e = 0;
        for (; t;) t = t.next, e++;
        return e;
      },
      getQueue: function () {
        var t = i, e = [];
        for (; t;) e.push(t.value), t = t.next;
        return e;
      },
      unshift: function (l, p) {
        var f = r.get();
        f.context = t,
          f.release = u,
          f.value = l,
          f.callback = p || Zr,
          f.errorHandler = a,
          o >= n || c.paused
            ? i ? (f.next = i, i = f) : (i = f, s = f, c.saturated())
            : (o++, e.call(t, f.value, f.worked));
      },
      empty: Zr,
      kill: function () {
        i = null, s = null, c.drain = Zr;
      },
      killAndDrain: function () {
        i = null, s = null, c.drain(), c.drain = Zr;
      },
      error: function (t) {
        a = t;
      },
    };
  return c;
  function u(a) {
    a && r.release(a);
    var u = i;
    u && o <= n
      ? c.paused
        ? o--
        : (s === i && (s = null),
          i = u.next,
          u.next = null,
          e.call(t, u.value, u.worked),
          null === s && c.empty())
      : 0 == --o && c.drain();
  }
}
function Zr() {}
function zr() {
  this.value = null,
    this.callback = Zr,
    this.next = null,
    this.release = Zr,
    this.context = null,
    this.errorHandler = null;
  var t = this;
  this.worked = function (e, n) {
    var r = t.callback, i = t.errorHandler, s = t.value;
    t.value = null,
      t.callback = Zr,
      t.errorHandler && i(e, s),
      r.call(t.context, e, n),
      t.release(t);
  };
}
qr.exports = Jr,
  qr.exports.promise = function (t, e, n) {
    "function" == typeof t && (n = e, e = t, t = null);
    var r = Jr(t, function (t, n) {
        e.call(this, t).then(function (t) {
          n(null, t);
        }, n);
      }, n),
      i = r.push,
      s = r.unshift;
    return r.push = function (t) {
      var e = new Promise(function (e, n) {
        i(t, function (t, r) {
          t ? n(t) : e(r);
        });
      });
      return e.catch(Zr), e;
    },
      r.unshift = function (t) {
        var e = new Promise(function (e, n) {
          s(t, function (t, r) {
            t ? n(t) : e(r);
          });
        });
        return e.catch(Zr), e;
      },
      r.drained = function () {
        if (r.idle()) {
          return new Promise(function (t) {
            t();
          });
        }
        var t = r.drain;
        return new Promise(function (e) {
          r.drain = function () {
            t(), e();
          };
        });
      },
      r;
  };
var ti = qr.exports, ei = {};
Object.defineProperty(ei, "__esModule", { value: !0 }),
  ei.joinPathSegments =
    ei.replacePathSegmentSeparator =
    ei.isAppliedFilter =
    ei.isFatalError =
      void 0,
  ei.isFatalError = function (t, e) {
    return null === t.errorFilter || !t.errorFilter(e);
  },
  ei.isAppliedFilter = function (t, e) {
    return null === t || t(e);
  },
  ei.replacePathSegmentSeparator = function (t, e) {
    return t.split(/[/\\]/).join(e);
  },
  ei.joinPathSegments = function (t, e, n) {
    return "" === t ? e : t.endsWith(n) ? t + e : t + n + e;
  };
var ni = {};
Object.defineProperty(ni, "__esModule", { value: !0 });
const ri = ei;
ni.default = class {
  constructor(t, e) {
    this._root = t,
      this._settings = e,
      this._root = ri.replacePathSegmentSeparator(t, e.pathSegmentSeparator);
  }
}, Object.defineProperty(qn, "__esModule", { value: !0 });
const ii = a, si = Xn, oi = ti, ai = ei, ci = ni;
class ui extends ci.default {
  constructor(t, e) {
    super(t, e),
      this._settings = e,
      this._scandir = si.scandir,
      this._emitter = new ii.EventEmitter(),
      this._queue = oi(this._worker.bind(this), this._settings.concurrency),
      this._isFatalError = !1,
      this._isDestroyed = !1,
      this._queue.drain = () => {
        this._isFatalError || this._emitter.emit("end");
      };
  }
  read() {
    return this._isFatalError = !1,
      this._isDestroyed = !1,
      setImmediate(() => {
        this._pushToQueue(this._root, this._settings.basePath);
      }),
      this._emitter;
  }
  get isDestroyed() {
    return this._isDestroyed;
  }
  destroy() {
    if (this._isDestroyed) throw new Error("The reader is already destroyed");
    this._isDestroyed = !0, this._queue.killAndDrain();
  }
  onEntry(t) {
    this._emitter.on("entry", t);
  }
  onError(t) {
    this._emitter.once("error", t);
  }
  onEnd(t) {
    this._emitter.once("end", t);
  }
  _pushToQueue(t, e) {
    const n = { directory: t, base: e };
    this._queue.push(n, (t) => {
      null !== t && this._handleError(t);
    });
  }
  _worker(t, e) {
    this._scandir(t.directory, this._settings.fsScandirSettings, (n, r) => {
      if (null === n) {
        for (const e of r) this._handleEntry(e, t.base);
        e(null, void 0);
      } else e(n, void 0);
    });
  }
  _handleError(t) {
    !this._isDestroyed && ai.isFatalError(this._settings, t) &&
      (this._isFatalError = !0,
        this._isDestroyed = !0,
        this._emitter.emit("error", t));
  }
  _handleEntry(t, e) {
    if (this._isDestroyed || this._isFatalError) return;
    const n = t.path;
    void 0 !== e &&
    (t.path = ai.joinPathSegments(
      e,
      t.name,
      this._settings.pathSegmentSeparator,
    )),
      ai.isAppliedFilter(this._settings.entryFilter, t) && this._emitEntry(t),
      t.dirent.isDirectory() &&
      ai.isAppliedFilter(this._settings.deepFilter, t) &&
      this._pushToQueue(n, void 0 === e ? void 0 : t.path);
  }
  _emitEntry(t) {
    this._emitter.emit("entry", t);
  }
}
qn.default = ui, Object.defineProperty(Qn, "__esModule", { value: !0 });
const li = qn;
Qn.default = class {
  constructor(t, e) {
    this._root = t,
      this._settings = e,
      this._reader = new li.default(this._root, this._settings),
      this._storage = [];
  }
  read(t) {
    this._reader.onError((e) => {
      !function (t, e) {
        t(e);
      }(t, e);
    }),
      this._reader.onEntry((t) => {
        this._storage.push(t);
      }),
      this._reader.onEnd(() => {
        !function (t, e) {
          t(null, e);
        }(t, this._storage);
      }),
      this._reader.read();
  }
};
var pi = {};
Object.defineProperty(pi, "__esModule", { value: !0 });
const fi = o, hi = qn;
pi.default = class {
  constructor(t, e) {
    this._root = t,
      this._settings = e,
      this._reader = new hi.default(this._root, this._settings),
      this._stream = new fi.Readable({
        objectMode: !0,
        read: () => {},
        destroy: () => {
          this._reader.isDestroyed || this._reader.destroy();
        },
      });
  }
  read() {
    return this._reader.onError((t) => {
      this._stream.emit("error", t);
    }),
      this._reader.onEntry((t) => {
        this._stream.push(t);
      }),
      this._reader.onEnd(() => {
        this._stream.push(null);
      }),
      this._reader.read(),
      this._stream;
  }
};
var di = {}, yi = {};
Object.defineProperty(yi, "__esModule", { value: !0 });
const gi = Xn, mi = ei, _i = ni;
class Si extends _i.default {
  constructor() {
    super(...arguments),
      this._scandir = gi.scandirSync,
      this._storage = [],
      this._queue = new Set();
  }
  read() {
    return this._pushToQueue(this._root, this._settings.basePath),
      this._handleQueue(),
      this._storage;
  }
  _pushToQueue(t, e) {
    this._queue.add({ directory: t, base: e });
  }
  _handleQueue() {
    for (const t of this._queue.values()) {
      this._handleDirectory(t.directory, t.base);
    }
  }
  _handleDirectory(t, e) {
    try {
      const n = this._scandir(t, this._settings.fsScandirSettings);
      for (const t of n) this._handleEntry(t, e);
    } catch (t) {
      this._handleError(t);
    }
  }
  _handleError(t) {
    if (mi.isFatalError(this._settings, t)) throw t;
  }
  _handleEntry(t, e) {
    const n = t.path;
    void 0 !== e &&
    (t.path = mi.joinPathSegments(
      e,
      t.name,
      this._settings.pathSegmentSeparator,
    )),
      mi.isAppliedFilter(this._settings.entryFilter, t) &&
      this._pushToStorage(t),
      t.dirent.isDirectory() &&
      mi.isAppliedFilter(this._settings.deepFilter, t) &&
      this._pushToQueue(n, void 0 === e ? void 0 : t.path);
  }
  _pushToStorage(t) {
    this._storage.push(t);
  }
}
yi.default = Si, Object.defineProperty(di, "__esModule", { value: !0 });
const vi = yi;
di.default = class {
  constructor(t, e) {
    this._root = t,
      this._settings = e,
      this._reader = new vi.default(this._root, this._settings);
  }
  read() {
    return this._reader.read();
  }
};
var bi = {};
Object.defineProperty(bi, "__esModule", { value: !0 });
const Ei = i, wi = Xn;
bi.default = class {
  constructor(t = {}) {
    this._options = t,
      this.basePath = this._getValue(this._options.basePath, void 0),
      this.concurrency = this._getValue(
        this._options.concurrency,
        Number.POSITIVE_INFINITY,
      ),
      this.deepFilter = this._getValue(this._options.deepFilter, null),
      this.entryFilter = this._getValue(this._options.entryFilter, null),
      this.errorFilter = this._getValue(this._options.errorFilter, null),
      this.pathSegmentSeparator = this._getValue(
        this._options.pathSegmentSeparator,
        Ei.sep,
      ),
      this.fsScandirSettings = new wi.Settings({
        followSymbolicLinks: this._options.followSymbolicLinks,
        fs: this._options.fs,
        pathSegmentSeparator: this._options.pathSegmentSeparator,
        stats: this._options.stats,
        throwErrorOnBrokenSymbolicLink:
          this._options.throwErrorOnBrokenSymbolicLink,
      });
  }
  _getValue(t, e) {
    return null != t ? t : e;
  }
},
  Object.defineProperty(Yn, "__esModule", { value: !0 }),
  Yn.Settings =
    Yn.walkStream =
    Yn.walkSync =
    Yn.walk =
      void 0;
const Ai = Qn, Ri = pi, Pi = di, Oi = bi;
function ki(t = {}) {
  return t instanceof Oi.default ? t : new Oi.default(t);
}
Yn.Settings = Oi.default,
  Yn.walk = function (t, e, n) {
    "function" != typeof e
      ? new Ai.default(t, ki(e)).read(n)
      : new Ai.default(t, ki()).read(e);
  },
  Yn.walkSync = function (t, e) {
    const n = ki(e);
    return new Pi.default(t, n).read();
  },
  Yn.walkStream = function (t, e) {
    const n = ki(e);
    return new Ri.default(t, n).read();
  };
var xi = {};
Object.defineProperty(xi, "__esModule", { value: !0 });
const Ci = i, Ti = Zn, Li = S;
xi.default = class {
  constructor(t) {
    this._settings = t,
      this._fsStatSettings = new Ti.Settings({
        followSymbolicLink: this._settings.followSymbolicLinks,
        fs: this._settings.fs,
        throwErrorOnBrokenSymbolicLink: this._settings.followSymbolicLinks,
      });
  }
  _getFullEntryPath(t) {
    return Ci.resolve(this._settings.cwd, t);
  }
  _makeEntry(t, e) {
    const n = { name: e, path: e, dirent: Li.fs.createDirentFromStats(e, t) };
    return this._settings.stats && (n.stats = t), n;
  }
  _isFatalError(t) {
    return !Li.errno.isEnoentCodeError(t) && !this._settings.suppressErrors;
  }
};
var $i = {};
Object.defineProperty($i, "__esModule", { value: !0 });
const Fi = o, Di = Zn, Ni = Yn, Mi = xi;
class Hi extends Mi.default {
  constructor() {
    super(...arguments), this._walkStream = Ni.walkStream, this._stat = Di.stat;
  }
  dynamic(t, e) {
    return this._walkStream(t, e);
  }
  static(t, e) {
    const n = t.map(this._getFullEntryPath, this),
      r = new Fi.PassThrough({ objectMode: !0 });
    r._write = (i, s, o) =>
      this._getEntry(n[i], t[i], e).then((t) => {
        null !== t && e.entryFilter(t) && r.push(t),
          i === n.length - 1 && r.end(),
          o();
      }).catch(o);
    for (let t = 0; t < n.length; t++) r.write(t);
    return r;
  }
  _getEntry(t, e, n) {
    return this._getStat(t).then((t) => this._makeEntry(t, e)).catch((t) => {
      if (n.errorFilter(t)) return null;
      throw t;
    });
  }
  _getStat(t) {
    return new Promise((e, n) => {
      this._stat(t, this._fsStatSettings, (t, r) => null === t ? e(r) : n(t));
    });
  }
}
$i.default = Hi, Object.defineProperty(Vn, "__esModule", { value: !0 });
const Ii = Yn, ji = xi, Bi = $i;
class Gi extends ji.default {
  constructor() {
    super(...arguments),
      this._walkAsync = Ii.walk,
      this._readerStream = new Bi.default(this._settings);
  }
  dynamic(t, e) {
    return new Promise((n, r) => {
      this._walkAsync(t, e, (t, e) => {
        null === t ? n(e) : r(t);
      });
    });
  }
  async static(t, e) {
    const n = [], r = this._readerStream.static(t, e);
    return new Promise((t, e) => {
      r.once("error", e),
        r.on("data", (t) => n.push(t)),
        r.once("end", () => t(n));
    });
  }
}
Vn.default = Gi;
var Wi = {}, Ui = {}, Ki = {}, Vi = {};
Object.defineProperty(Vi, "__esModule", { value: !0 });
const Yi = S;
Vi.default = class {
  constructor(t, e, n) {
    this._patterns = t,
      this._settings = e,
      this._micromatchOptions = n,
      this._storage = [],
      this._fillStorage();
  }
  _fillStorage() {
    for (const t of this._patterns) {
      const e = this._getPatternSegments(t),
        n = this._splitSegmentsIntoSections(e);
      this._storage.push({
        complete: n.length <= 1,
        pattern: t,
        segments: e,
        sections: n,
      });
    }
  }
  _getPatternSegments(t) {
    return Yi.pattern.getPatternParts(t, this._micromatchOptions).map(
      (t) =>
        Yi.pattern.isDynamicPattern(t, this._settings)
          ? {
            dynamic: !0,
            pattern: t,
            patternRe: Yi.pattern.makeRe(t, this._micromatchOptions),
          }
          : { dynamic: !1, pattern: t },
    );
  }
  _splitSegmentsIntoSections(t) {
    return Yi.array.splitWhen(
      t,
      (t) => t.dynamic && Yi.pattern.hasGlobStar(t.pattern),
    );
  }
}, Object.defineProperty(Ki, "__esModule", { value: !0 });
const Qi = Vi;
class qi extends Qi.default {
  match(t) {
    const e = t.split("/"),
      n = e.length,
      r = this._storage.filter((t) => !t.complete || t.segments.length > n);
    for (const t of r) {
      const r = t.sections[0];
      if (!t.complete && n > r.length) return !0;
      if (
        e.every((e, n) => {
          const r = t.segments[n];
          return !(!r.dynamic || !r.patternRe.test(e)) ||
            !r.dynamic && r.pattern === e;
        })
      ) return !0;
    }
    return !1;
  }
}
Ki.default = qi, Object.defineProperty(Ui, "__esModule", { value: !0 });
const Xi = S, Ji = Ki;
Ui.default = class {
  constructor(t, e) {
    this._settings = t, this._micromatchOptions = e;
  }
  getFilter(t, e, n) {
    const r = this._getMatcher(e), i = this._getNegativePatternsRe(n);
    return (e) => this._filter(t, e, r, i);
  }
  _getMatcher(t) {
    return new Ji.default(t, this._settings, this._micromatchOptions);
  }
  _getNegativePatternsRe(t) {
    const e = t.filter(Xi.pattern.isAffectDepthOfReadingPattern);
    return Xi.pattern.convertPatternsToRe(e, this._micromatchOptions);
  }
  _filter(t, e, n, r) {
    if (this._isSkippedByDeep(t, e.path)) return !1;
    if (this._isSkippedSymbolicLink(e)) return !1;
    const i = Xi.path.removeLeadingDotSegment(e.path);
    return !this._isSkippedByPositivePatterns(i, n) &&
      this._isSkippedByNegativePatterns(i, r);
  }
  _isSkippedByDeep(t, e) {
    return this._settings.deep !== 1 / 0 &&
      this._getEntryLevel(t, e) >= this._settings.deep;
  }
  _getEntryLevel(t, e) {
    const n = e.split("/").length;
    if ("" === t) return n;
    return n - t.split("/").length;
  }
  _isSkippedSymbolicLink(t) {
    return !this._settings.followSymbolicLinks && t.dirent.isSymbolicLink();
  }
  _isSkippedByPositivePatterns(t, e) {
    return !this._settings.baseNameMatch && !e.match(t);
  }
  _isSkippedByNegativePatterns(t, e) {
    return !Xi.pattern.matchAny(t, e);
  }
};
var Zi = {};
Object.defineProperty(Zi, "__esModule", { value: !0 });
const zi = S;
Zi.default = class {
  constructor(t, e) {
    this._settings = t, this._micromatchOptions = e, this.index = new Map();
  }
  getFilter(t, e) {
    const n = zi.pattern.convertPatternsToRe(t, this._micromatchOptions),
      r = zi.pattern.convertPatternsToRe(
        e,
        Object.assign(Object.assign({}, this._micromatchOptions), { dot: !0 }),
      );
    return (t) => this._filter(t, n, r);
  }
  _filter(t, e, n) {
    const r = zi.path.removeLeadingDotSegment(t.path);
    if (this._settings.unique && this._isDuplicateEntry(r)) return !1;
    if (this._onlyFileFilter(t) || this._onlyDirectoryFilter(t)) return !1;
    if (this._isSkippedByAbsoluteNegativePatterns(r, n)) return !1;
    const i = t.dirent.isDirectory(),
      s = this._isMatchToPatterns(r, e, i) && !this._isMatchToPatterns(r, n, i);
    return this._settings.unique && s && this._createIndexRecord(r), s;
  }
  _isDuplicateEntry(t) {
    return this.index.has(t);
  }
  _createIndexRecord(t) {
    this.index.set(t, void 0);
  }
  _onlyFileFilter(t) {
    return this._settings.onlyFiles && !t.dirent.isFile();
  }
  _onlyDirectoryFilter(t) {
    return this._settings.onlyDirectories && !t.dirent.isDirectory();
  }
  _isSkippedByAbsoluteNegativePatterns(t, e) {
    if (!this._settings.absolute) return !1;
    const n = zi.path.makeAbsolute(this._settings.cwd, t);
    return zi.pattern.matchAny(n, e);
  }
  _isMatchToPatterns(t, e, n) {
    const r = zi.pattern.matchAny(t, e);
    return !r && n ? zi.pattern.matchAny(t + "/", e) : r;
  }
};
var ts = {};
Object.defineProperty(ts, "__esModule", { value: !0 });
const es = S;
ts.default = class {
  constructor(t) {
    this._settings = t;
  }
  getFilter() {
    return (t) => this._isNonFatalError(t);
  }
  _isNonFatalError(t) {
    return es.errno.isEnoentCodeError(t) || this._settings.suppressErrors;
  }
};
var ns = {};
Object.defineProperty(ns, "__esModule", { value: !0 });
const rs = S;
ns.default = class {
  constructor(t) {
    this._settings = t;
  }
  getTransformer() {
    return (t) => this._transform(t);
  }
  _transform(t) {
    let e = t.path;
    return this._settings.absolute &&
      (e = rs.path.makeAbsolute(this._settings.cwd, e), e = rs.path.unixify(e)),
      this._settings.markDirectories && t.dirent.isDirectory() && (e += "/"),
      this._settings.objectMode
        ? Object.assign(Object.assign({}, t), { path: e })
        : e;
  }
}, Object.defineProperty(Wi, "__esModule", { value: !0 });
const is = i, ss = Ui, os = Zi, as = ts, cs = ns;
Wi.default = class {
  constructor(t) {
    this._settings = t,
      this.errorFilter = new as.default(this._settings),
      this.entryFilter = new os.default(
        this._settings,
        this._getMicromatchOptions(),
      ),
      this.deepFilter = new ss.default(
        this._settings,
        this._getMicromatchOptions(),
      ),
      this.entryTransformer = new cs.default(this._settings);
  }
  _getRootDirectory(t) {
    return is.resolve(this._settings.cwd, t.base);
  }
  _getReaderOptions(t) {
    const e = "." === t.base ? "" : t.base;
    return {
      basePath: e,
      pathSegmentSeparator: "/",
      concurrency: this._settings.concurrency,
      deepFilter: this.deepFilter.getFilter(e, t.positive, t.negative),
      entryFilter: this.entryFilter.getFilter(t.positive, t.negative),
      errorFilter: this.errorFilter.getFilter(),
      followSymbolicLinks: this._settings.followSymbolicLinks,
      fs: this._settings.fs,
      stats: this._settings.stats,
      throwErrorOnBrokenSymbolicLink:
        this._settings.throwErrorOnBrokenSymbolicLink,
      transform: this.entryTransformer.getTransformer(),
    };
  }
  _getMicromatchOptions() {
    return {
      dot: this._settings.dot,
      matchBase: this._settings.baseNameMatch,
      nobrace: !this._settings.braceExpansion,
      nocase: !this._settings.caseSensitiveMatch,
      noext: !this._settings.extglob,
      noglobstar: !this._settings.globstar,
      posix: !0,
      strictSlashes: !1,
    };
  }
}, Object.defineProperty(Kn, "__esModule", { value: !0 });
const us = Vn, ls = Wi;
class ps extends ls.default {
  constructor() {
    super(...arguments), this._reader = new us.default(this._settings);
  }
  async read(t) {
    const e = this._getRootDirectory(t), n = this._getReaderOptions(t);
    return (await this.api(e, t, n)).map((t) => n.transform(t));
  }
  api(t, e, n) {
    return e.dynamic
      ? this._reader.dynamic(t, n)
      : this._reader.static(e.patterns, n);
  }
}
Kn.default = ps;
var fs = {};
Object.defineProperty(fs, "__esModule", { value: !0 });
const hs = o, ds = $i, ys = Wi;
class gs extends ys.default {
  constructor() {
    super(...arguments), this._reader = new ds.default(this._settings);
  }
  read(t) {
    const e = this._getRootDirectory(t),
      n = this._getReaderOptions(t),
      r = this.api(e, t, n),
      i = new hs.Readable({ objectMode: !0, read: () => {} });
    return r.once("error", (t) => i.emit("error", t)).on(
      "data",
      (t) => i.emit("data", n.transform(t)),
    ).once("end", () => i.emit("end")),
      i.once("close", () => r.destroy()),
      i;
  }
  api(t, e, n) {
    return e.dynamic
      ? this._reader.dynamic(t, n)
      : this._reader.static(e.patterns, n);
  }
}
fs.default = gs;
var ms = {}, _s = {};
Object.defineProperty(_s, "__esModule", { value: !0 });
const Ss = Zn, vs = Yn, bs = xi;
class Es extends bs.default {
  constructor() {
    super(...arguments),
      this._walkSync = vs.walkSync,
      this._statSync = Ss.statSync;
  }
  dynamic(t, e) {
    return this._walkSync(t, e);
  }
  static(t, e) {
    const n = [];
    for (const r of t) {
      const t = this._getFullEntryPath(r), i = this._getEntry(t, r, e);
      null !== i && e.entryFilter(i) && n.push(i);
    }
    return n;
  }
  _getEntry(t, e, n) {
    try {
      const n = this._getStat(t);
      return this._makeEntry(n, e);
    } catch (t) {
      if (n.errorFilter(t)) return null;
      throw t;
    }
  }
  _getStat(t) {
    return this._statSync(t, this._fsStatSettings);
  }
}
_s.default = Es, Object.defineProperty(ms, "__esModule", { value: !0 });
const ws = _s, As = Wi;
class Rs extends As.default {
  constructor() {
    super(...arguments), this._reader = new ws.default(this._settings);
  }
  read(t) {
    const e = this._getRootDirectory(t), n = this._getReaderOptions(t);
    return this.api(e, t, n).map(n.transform);
  }
  api(t, e, n) {
    return e.dynamic
      ? this._reader.dynamic(t, n)
      : this._reader.static(e.patterns, n);
  }
}
ms.default = Rs;
var Ps = {};
!function (t) {
  Object.defineProperty(t, "__esModule", { value: !0 }),
    t.DEFAULT_FILE_SYSTEM_ADAPTER = void 0;
  const e = c, n = r, i = Math.max(n.cpus().length, 1);
  t.DEFAULT_FILE_SYSTEM_ADAPTER = {
    lstat: e.lstat,
    lstatSync: e.lstatSync,
    stat: e.stat,
    statSync: e.statSync,
    readdir: e.readdir,
    readdirSync: e.readdirSync,
  };
  t.default = class {
    constructor(t = {}) {
      this._options = t,
        this.absolute = this._getValue(this._options.absolute, !1),
        this.baseNameMatch = this._getValue(this._options.baseNameMatch, !1),
        this.braceExpansion = this._getValue(this._options.braceExpansion, !0),
        this.caseSensitiveMatch = this._getValue(
          this._options.caseSensitiveMatch,
          !0,
        ),
        this.concurrency = this._getValue(this._options.concurrency, i),
        this.cwd = this._getValue(this._options.cwd, process.cwd()),
        this.deep = this._getValue(this._options.deep, 1 / 0),
        this.dot = this._getValue(this._options.dot, !1),
        this.extglob = this._getValue(this._options.extglob, !0),
        this.followSymbolicLinks = this._getValue(
          this._options.followSymbolicLinks,
          !0,
        ),
        this.fs = this._getFileSystemMethods(this._options.fs),
        this.globstar = this._getValue(this._options.globstar, !0),
        this.ignore = this._getValue(this._options.ignore, []),
        this.markDirectories = this._getValue(
          this._options.markDirectories,
          !1,
        ),
        this.objectMode = this._getValue(this._options.objectMode, !1),
        this.onlyDirectories = this._getValue(
          this._options.onlyDirectories,
          !1,
        ),
        this.onlyFiles = this._getValue(this._options.onlyFiles, !0),
        this.stats = this._getValue(this._options.stats, !1),
        this.suppressErrors = this._getValue(this._options.suppressErrors, !1),
        this.throwErrorOnBrokenSymbolicLink = this._getValue(
          this._options.throwErrorOnBrokenSymbolicLink,
          !1,
        ),
        this.unique = this._getValue(this._options.unique, !0),
        this.onlyDirectories && (this.onlyFiles = !1),
        this.stats && (this.objectMode = !0),
        this.ignore = [].concat(this.ignore);
    }
    _getValue(t, e) {
      return void 0 === t ? e : t;
    }
    _getFileSystemMethods(e = {}) {
      return Object.assign(Object.assign({}, t.DEFAULT_FILE_SYSTEM_ADAPTER), e);
    }
  };
}(Ps);
const Os = _, ks = Kn, xs = fs, Cs = ms, Ts = Ps, Ls = S;
async function $s(t, e) {
  Ds(t);
  const n = Fs(t, ks.default, e), r = await Promise.all(n);
  return Ls.array.flatten(r);
}
function Fs(t, e, n) {
  const r = [].concat(t),
    i = new Ts.default(n),
    s = Os.generate(r, i),
    o = new e(i);
  return s.map(o.read, o);
}
function Ds(t) {
  if (
    ![].concat(t).every((t) => Ls.string.isString(t) && !Ls.string.isEmpty(t))
  ) {
    throw new TypeError(
      "Patterns must be a string (non empty) or an array of strings",
    );
  }
}
!function (t) {
  function e(t, e) {
    Ds(t);
    const n = Fs(t, Cs.default, e);
    return Ls.array.flatten(n);
  }
  function n(t, e) {
    Ds(t);
    const n = Fs(t, xs.default, e);
    return Ls.stream.merge(n);
  }
  var r, i;
  t.glob = t,
    t.globSync = e,
    t.globStream = n,
    t.async = t,
    t.sync = e,
    t.stream = n,
    t.generateTasks = function (t, e) {
      Ds(t);
      const n = [].concat(t), r = new Ts.default(e);
      return Os.generate(n, r);
    },
    t.isDynamicPattern = function (t, e) {
      Ds(t);
      const n = new Ts.default(e);
      return Ls.pattern.isDynamicPattern(t, n);
    },
    t.escapePath = function (t) {
      return Ds(t), Ls.path.escape(t);
    },
    t.convertPathToPattern = function (t) {
      return Ds(t), Ls.path.convertPathToPattern(t);
    },
    (r = t.posix || (t.posix = {})).escapePath = function (t) {
      return Ds(t), Ls.path.escapePosixPath(t);
    },
    r.convertPathToPattern = function (t) {
      return Ds(t), Ls.path.convertPosixPathToPattern(t);
    },
    (i = t.win32 || (t.win32 = {})).escapePath = function (t) {
      return Ds(t), Ls.path.escapeWindowsPath(t);
    },
    i.convertPathToPattern = function (t) {
      return Ds(t), Ls.path.convertWindowsPathToPattern(t);
    };
}($s || ($s = {}));
var Ns = m($s);
async function Ms(t, e, n) {
  if ("string" != typeof n) {
    throw new TypeError("Expected a string, got " + typeof n);
  }
  try {
    return (await u[t](n))[e]();
  } catch (t) {
    if ("ENOENT" === t.code) return !1;
    throw t;
  }
}
function Hs(t, e, n) {
  if ("string" != typeof n) {
    throw new TypeError("Expected a string, got " + typeof n);
  }
  try {
    return c[t](n)[e]();
  } catch (t) {
    if ("ENOENT" === t.code) return !1;
    throw t;
  }
}
Ms.bind(null, "stat", "isFile");
const Is = Ms.bind(null, "stat", "isDirectory");
function js(t) {
  return t instanceof URL ? l(t) : t;
}
function Bs(t) {
  return Array.isArray(t) ? t : [t];
}
Ms.bind(null, "lstat", "isSymbolicLink"),
  Hs.bind(null, "statSync", "isFile"),
  Hs.bind(null, "statSync", "isDirectory"),
  Hs.bind(null, "lstatSync", "isSymbolicLink");
const Gs = /^\s+$/,
  Ws = /(?:[^\\]|^)\\$/,
  Us = /^\\!/,
  Ks = /^\\#/,
  Vs = /\r?\n/g,
  Ys = /^\.*\/|^\.+$/;
let Qs = "node-ignore";
"undefined" != typeof Symbol && (Qs = Symbol.for("node-ignore"));
const qs = Qs,
  Xs = /([0-z])-([0-z])/g,
  Js = () => !1,
  Zs = [
    [/^\uFEFF/, () => ""],
    [/\\?\s+$/, (t) => 0 === t.indexOf("\\") ? " " : ""],
    [/\\\s/g, () => " "],
    [/[\\$.|*+(){^]/g, (t) => `\\${t}`],
    [/(?!\\)\?/g, () => "[^/]"],
    [/^\//, () => "^"],
    [/\//g, () => "\\/"],
    [/^\^*\\\*\\\*\\\//, () => "^(?:.*\\/)?"],
    [/^(?=[^^])/, function () {
      return /\/(?!$)/.test(this) ? "^" : "(?:^|\\/)";
    }],
    [
      /\\\/\\\*\\\*(?=\\\/|$)/g,
      (t, e, n) => e + 6 < n.length ? "(?:\\/[^\\/]+)*" : "\\/.+",
    ],
    [
      /(^|[^\\]+)(\\\*)+(?=.+)/g,
      (t, e, n) => e + n.replace(/\\\*/g, "[^\\/]*"),
    ],
    [/\\\\\\(?=[$.|*+(){^])/g, () => "\\"],
    [/\\\\/g, () => "\\"],
    [
      /(\\)?\[([^\]/]*?)(\\*)($|\])/g,
      (t, e, n, r, i) =>
        "\\" === e
          ? `\\[${n}${
            ((t) => {
              const { length: e } = t;
              return t.slice(0, e - e % 2);
            })(r)
          }${i}`
          : "]" === i && r.length % 2 == 0
          ? `[${
            ((t) =>
              t.replace(
                Xs,
                (t, e, n) => e.charCodeAt(0) <= n.charCodeAt(0) ? t : "",
              ))(n)
          }${r}]`
          : "[]",
    ],
    [/(?:[^*])$/, (t) => /\/$/.test(t) ? `${t}$` : `${t}(?=$|\\/$)`],
    [/(\^|\\\/)?\\\*$/, (t, e) => `${e ? `${e}[^/]+` : "[^/]*"}(?=$|\\/$)`],
  ],
  zs = Object.create(null),
  to = (t) => "string" == typeof t;
class eo {
  constructor(t, e, n, r) {
    this.origin = t, this.pattern = e, this.negative = n, this.regex = r;
  }
}
const no = (t, e) => {
    const n = t;
    let r = !1;
    0 === t.indexOf("!") && (r = !0, t = t.substr(1));
    const i = ((t, e) => {
      let n = zs[t];
      return n ||
        (n = Zs.reduce((e, n) => e.replace(n[0], n[1].bind(t)), t), zs[t] = n),
        e ? new RegExp(n, "i") : new RegExp(n);
    })(t = t.replace(Us, "!").replace(Ks, "#"), e);
    return new eo(n, t, r, i);
  },
  ro = (t, e) => {
    throw new e(t);
  },
  io = (t, e, n) => {
    if (!to(t)) return n(`path must be a string, but got \`${e}\``, TypeError);
    if (!t) return n("path must not be empty", TypeError);
    if (io.isNotRelative(t)) {
      return n(
        `path should be a ${"`path.relative()`d"} string, but got "${e}"`,
        RangeError,
      );
    }
    return !0;
  },
  so = (t) => Ys.test(t);
io.isNotRelative = so, io.convert = (t) => t;
class oo {
  constructor(
    { ignorecase: t = !0, ignoreCase: e = t, allowRelativePaths: n = !1 } = {},
  ) {
    var r, i, s;
    r = this,
      i = qs,
      s = !0,
      Object.defineProperty(r, i, { value: s }),
      this._rules = [],
      this._ignoreCase = e,
      this._allowRelativePaths = n,
      this._initCache();
  }
  _initCache() {
    this._ignoreCache = Object.create(null),
      this._testCache = Object.create(null);
  }
  _addPattern(t) {
    if (t && t[qs]) {
      return this._rules = this._rules.concat(t._rules),
        void (this._added = !0);
    }
    if (
      ((t) => t && to(t) && !Gs.test(t) && !Ws.test(t) && 0 !== t.indexOf("#"))(
        t,
      )
    ) {
      const e = no(t, this._ignoreCase);
      this._added = !0, this._rules.push(e);
    }
  }
  add(t) {
    return this._added = !1,
      Bs(to(t) ? ((t) => t.split(Vs))(t) : t).forEach(this._addPattern, this),
      this._added && this._initCache(),
      this;
  }
  addPattern(t) {
    return this.add(t);
  }
  _testOne(t, e) {
    let n = !1, r = !1;
    return this._rules.forEach((i) => {
      const { negative: s } = i;
      if (r === s && n !== r || s && !n && !r && !e) return;
      i.regex.test(t) && (n = !s, r = s);
    }),
      { ignored: n, unignored: r };
  }
  _test(t, e, n, r) {
    const i = t && io.convert(t);
    return io(i, t, this._allowRelativePaths ? Js : ro), this._t(i, e, n, r);
  }
  _t(t, e, n, r) {
    if (t in e) return e[t];
    if (r || (r = t.split("/")), r.pop(), !r.length) {
      return e[t] = this._testOne(t, n);
    }
    const i = this._t(r.join("/") + "/", e, n, r);
    return e[t] = i.ignored ? i : this._testOne(t, n);
  }
  ignores(t) {
    return this._test(t, this._ignoreCache, !1).ignored;
  }
  createFilter() {
    return (t) => !this.ignores(t);
  }
  filter(t) {
    return Bs(t).filter(this.createFilter());
  }
  test(t) {
    return this._test(t, this._testCache, !0);
  }
}
const ao = (t) => new oo(t);
ao.isPathValid = (t) => io(t && io.convert(t), t, Js), ao.default = ao;
var co = ao;
if (
  "undefined" != typeof process &&
  (process.env && process.env.IGNORE_TEST_WIN32 || "win32" === process.platform)
) {
  const t = (t) =>
    /^\\\\\?\\/.test(t) || /["<>|\u0000-\u001F]+/u.test(t)
      ? t
      : t.replace(/\\/g, "/");
  io.convert = t;
  const e = /^[a-z]:\//i;
  io.isNotRelative = (t) => e.test(t) || so(t);
}
var uo = m(co);
function lo(t) {
  return t.startsWith("\\\\?\\") ? t : t.replace(/\\/g, "/");
}
const po = (t) => "!" === t[0],
  fo = ["**/node_modules", "**/flow-typed", "**/coverage", "**/.git"],
  ho = { absolute: !0, dot: !0 },
  yo = (t, e) => {
    const r = lo(n.relative(e, n.dirname(t.filePath)));
    return t.content.split(/\r?\n/).filter((t) => t && !t.startsWith("#")).map(
      (t) =>
        ((t, e) =>
          po(t) ? "!" + n.posix.join(e, t.slice(1)) : n.posix.join(e, t))(t, r),
    );
  },
  go = (t, e) => {
    const r = t.flatMap((t) => yo(t, e)), i = uo().add(r);
    return (t) => (t = ((t, e) => {
      if (e = lo(e), n.isAbsolute(t)) {
        if (lo(t).startsWith(e)) return n.relative(e, t);
        throw new Error(`Path ${t} is not in cwd ${e}`);
      }
      return t;
    })(t = js(t), e),
      !!t && i.ignores(lo(t)));
  },
  mo = async (e, n) => {
    const { cwd: r, suppressErrors: i, deep: s, ignore: o } = ((e = {}) => ({
        cwd: js(e.cwd) ?? t.cwd(),
        suppressErrors: Boolean(e.suppressErrors),
        deep: "number" == typeof e.deep ? e.deep : Number.POSITIVE_INFINITY,
        ignore: [...e.ignore ?? [], ...fo],
      }))(n),
      a = await Ns(e, { cwd: r, suppressErrors: i, deep: s, ignore: o, ...ho }),
      c = await Promise.all(
        a.map(
          async (t) => ({ filePath: t, content: await p.readFile(t, "utf8") }),
        ),
      );
    return go(c, r);
  },
  _o = async (e, { cwd: r = t.cwd(), files: i, extensions: s } = {}) => {
    const o = await Promise.all(e.map(async (t) =>
      await Is(((t, e) => {
          const r = po(t) ? t.slice(1) : t;
          return n.isAbsolute(r) ? r : n.join(e, r);
        })(t, r))
        ? (({ directoryPath: t, files: e, extensions: r }) => {
          const i = r?.length > 0
            ? `.${r.length > 1 ? `{${r.join(",")}}` : r[0]}`
            : "";
          return e
            ? e.map(
              (e) => n.posix.join(t, `**/${n.extname(e) ? e : `${e}${i}`}`),
            )
            : [n.posix.join(t, "**" + (i ? `/*${i}` : ""))];
        })({ directoryPath: t, files: i, extensions: s })
        : t
    ));
    return o.flat();
  },
  So = (t) => (((t) => {
    if (t.some((t) => "string" != typeof t)) {
      throw new TypeError("Patterns must be a string or an array of strings");
    }
  })(t = [...new Set([t].flat())]),
    t),
  vo = (t = {}) => (((t) => {
    if (!t) return;
    let n;
    try {
      n = e.statSync(t);
    } catch {
      return;
    }
    if (!n.isDirectory()) {
      throw new Error("The `cwd` option must be a path to a directory");
    }
  })(
    (t = {
      ...t,
      ignore: t.ignore ?? [],
      expandDirectories: t.expandDirectories ?? !0,
      cwd: js(t.cwd),
    }).cwd,
  ),
    t),
  bo = async (t) => {
    const e = ((t) => {
      const { ignoreFiles: e, gitignore: n } = t, r = e ? So(e) : [];
      return n && r.push("**/.gitignore"), r;
    })(t);
    return Eo(e.length > 0 && await mo(e, t));
  },
  Eo = (t) => {
    const e = new Set();
    return (r) => {
      const i = n.normalize(r.path ?? r);
      return !(e.has(i) || t && t(i)) && (e.add(i), !0);
    };
  },
  wo = async (t, e) => {
    const n = ((t, e) => {
        const n = [];
        for (; t.length > 0;) {
          const r = t.findIndex((t) => po(t));
          if (-1 === r) {
            n.push({ patterns: t, options: e });
            break;
          }
          const i = t[r].slice(1);
          for (const t of n) t.options.ignore.push(i);
          0 !== r &&
          n.push({
            patterns: t.slice(0, r),
            options: { ...e, ignore: [...e.ignore, i] },
          }), t = t.slice(r + 1);
        }
        return n;
      })(t, e),
      { cwd: r, expandDirectories: i } = e;
    if (!i) return n;
    const s = ((t, e) => ({
      ...e ? { cwd: e } : {},
      ...Array.isArray(t) ? { files: t } : t,
    }))(i, r);
    return Promise.all(n.map(async (t) => {
      let { patterns: e, options: n } = t;
      return [e, n.ignore] = await Promise.all([
        _o(e, s),
        _o(n.ignore, { cwd: r }),
      ]),
        { patterns: e, options: n };
    }));
  },
  Ao = (Ro = async (t, e) => {
    const [n, r] = await Promise.all([wo(t, e), bo(e)]);
    return ((t, e) => t.flat().filter((t) => e(t)))(
      await Promise.all(n.map((t) => Ns(t.patterns, t.options))),
      r,
    );
  },
    async (t, e) => Ro(So(t), vo(e)));
var Ro,
  Po = {},
  Oo = {
    fromCallback: function (t) {
      return Object.defineProperty(
        function (...e) {
          if ("function" != typeof e[e.length - 1]) {
            return new Promise((n, r) => {
              e.push((t, e) => null != t ? r(t) : n(e)), t.apply(this, e);
            });
          }
          t.apply(this, e);
        },
        "name",
        { value: t.name },
      );
    },
    fromPromise: function (t) {
      return Object.defineProperty(
        function (...e) {
          const n = e[e.length - 1];
          if ("function" != typeof n) return t.apply(this, e);
          e.pop(), t.apply(this, e).then((t) => n(null, t), n);
        },
        "name",
        { value: t.name },
      );
    },
  },
  ko = f,
  xo = process.cwd,
  Co = null,
  To = process.env.GRACEFUL_FS_PLATFORM || process.platform;
process.cwd = function () {
  return Co || (Co = xo.call(process)), Co;
};
try {
  process.cwd();
} catch (t) {}
if ("function" == typeof process.chdir) {
  var Lo = process.chdir;
  process.chdir = function (t) {
    Co = null, Lo.call(process, t);
  }, Object.setPrototypeOf && Object.setPrototypeOf(process.chdir, Lo);
}
var $o = function (t) {
  ko.hasOwnProperty("O_SYMLINK") &&
    process.version.match(/^v0\.6\.[0-2]|^v0\.5\./) && function (t) {
    t.lchmod = function (e, n, r) {
      t.open(e, ko.O_WRONLY | ko.O_SYMLINK, n, function (e, i) {
        e ? r && r(e) : t.fchmod(i, n, function (e) {
          t.close(i, function (t) {
            r && r(e || t);
          });
        });
      });
    },
      t.lchmodSync = function (e, n) {
        var r, i = t.openSync(e, ko.O_WRONLY | ko.O_SYMLINK, n), s = !0;
        try {
          r = t.fchmodSync(i, n), s = !1;
        } finally {
          if (s) {
            try {
              t.closeSync(i);
            } catch (t) {}
          } else t.closeSync(i);
        }
        return r;
      };
  }(t);
  t.lutimes || function (t) {
    ko.hasOwnProperty("O_SYMLINK") && t.futimes
      ? (t.lutimes = function (e, n, r, i) {
        t.open(e, ko.O_SYMLINK, function (e, s) {
          e ? i && i(e) : t.futimes(s, n, r, function (e) {
            t.close(s, function (t) {
              i && i(e || t);
            });
          });
        });
      },
        t.lutimesSync = function (e, n, r) {
          var i, s = t.openSync(e, ko.O_SYMLINK), o = !0;
          try {
            i = t.futimesSync(s, n, r), o = !1;
          } finally {
            if (o) {
              try {
                t.closeSync(s);
              } catch (t) {}
            } else t.closeSync(s);
          }
          return i;
        })
      : t.futimes && (t.lutimes = function (t, e, n, r) {
        r && process.nextTick(r);
      },
        t.lutimesSync = function () {});
  }(t);
  t.chown = r(t.chown),
    t.fchown = r(t.fchown),
    t.lchown = r(t.lchown),
    t.chmod = e(t.chmod),
    t.fchmod = e(t.fchmod),
    t.lchmod = e(t.lchmod),
    t.chownSync = i(t.chownSync),
    t.fchownSync = i(t.fchownSync),
    t.lchownSync = i(t.lchownSync),
    t.chmodSync = n(t.chmodSync),
    t.fchmodSync = n(t.fchmodSync),
    t.lchmodSync = n(t.lchmodSync),
    t.stat = s(t.stat),
    t.fstat = s(t.fstat),
    t.lstat = s(t.lstat),
    t.statSync = o(t.statSync),
    t.fstatSync = o(t.fstatSync),
    t.lstatSync = o(t.lstatSync),
    t.chmod && !t.lchmod && (t.lchmod = function (t, e, n) {
      n && process.nextTick(n);
    },
      t.lchmodSync = function () {});
  t.chown && !t.lchown && (t.lchown = function (t, e, n, r) {
    r && process.nextTick(r);
  },
    t.lchownSync = function () {});
  "win32" === To &&
    (t.rename = "function" != typeof t.rename ? t.rename : function (e) {
      function n(n, r, i) {
        var s = Date.now(), o = 0;
        e(n, r, function a(c) {
          if (
            c &&
            ("EACCES" === c.code || "EPERM" === c.code || "EBUSY" === c.code) &&
            Date.now() - s < 6e4
          ) {
            return setTimeout(function () {
              t.stat(r, function (t, s) {
                t && "ENOENT" === t.code ? e(n, r, a) : i(c);
              });
            }, o),
              void (o < 100 && (o += 10));
          }
          i && i(c);
        });
      }
      return Object.setPrototypeOf && Object.setPrototypeOf(n, e), n;
    }(t.rename));
  function e(e) {
    return e
      ? function (n, r, i) {
        return e.call(t, n, r, function (t) {
          a(t) && (t = null), i && i.apply(this, arguments);
        });
      }
      : e;
  }
  function n(e) {
    return e
      ? function (n, r) {
        try {
          return e.call(t, n, r);
        } catch (t) {
          if (!a(t)) throw t;
        }
      }
      : e;
  }
  function r(e) {
    return e
      ? function (n, r, i, s) {
        return e.call(t, n, r, i, function (t) {
          a(t) && (t = null), s && s.apply(this, arguments);
        });
      }
      : e;
  }
  function i(e) {
    return e
      ? function (n, r, i) {
        try {
          return e.call(t, n, r, i);
        } catch (t) {
          if (!a(t)) throw t;
        }
      }
      : e;
  }
  function s(e) {
    return e
      ? function (n, r, i) {
        function s(t, e) {
          e &&
          (e.uid < 0 && (e.uid += 4294967296),
            e.gid < 0 && (e.gid += 4294967296)), i && i.apply(this, arguments);
        }
        return "function" == typeof r && (i = r, r = null),
          r ? e.call(t, n, r, s) : e.call(t, n, s);
      }
      : e;
  }
  function o(e) {
    return e
      ? function (n, r) {
        var i = r ? e.call(t, n, r) : e.call(t, n);
        return i &&
          (i.uid < 0 && (i.uid += 4294967296),
            i.gid < 0 && (i.gid += 4294967296)),
          i;
      }
      : e;
  }
  function a(t) {
    return !t ||
      ("ENOSYS" === t.code ||
        !(process.getuid && 0 === process.getuid() ||
          "EINVAL" !== t.code && "EPERM" !== t.code));
  }
  t.read = "function" != typeof t.read ? t.read : function (e) {
    function n(n, r, i, s, o, a) {
      var c;
      if (a && "function" == typeof a) {
        var u = 0;
        c = function (l, p, f) {
          if (l && "EAGAIN" === l.code && u < 10) {
            return u++, e.call(t, n, r, i, s, o, c);
          }
          a.apply(this, arguments);
        };
      }
      return e.call(t, n, r, i, s, o, c);
    }
    return Object.setPrototypeOf && Object.setPrototypeOf(n, e), n;
  }(t.read),
    t.readSync = "function" != typeof t.readSync
      ? t.readSync
      : (c = t.readSync, function (e, n, r, i, s) {
        for (var o = 0;;) {
          try {
            return c.call(t, e, n, r, i, s);
          } catch (t) {
            if ("EAGAIN" === t.code && o < 10) {
              o++;
              continue;
            }
            throw t;
          }
        }
      });
  var c;
};
var Fo = o.Stream,
  Do = function (t) {
    return {
      ReadStream: function e(n, r) {
        if (!(this instanceof e)) return new e(n, r);
        Fo.call(this);
        var i = this;
        this.path = n,
          this.fd = null,
          this.readable = !0,
          this.paused = !1,
          this.flags = "r",
          this.mode = 438,
          this.bufferSize = 65536,
          r = r || {};
        for (var s = Object.keys(r), o = 0, a = s.length; o < a; o++) {
          var c = s[o];
          this[c] = r[c];
        }
        this.encoding && this.setEncoding(this.encoding);
        if (void 0 !== this.start) {
          if ("number" != typeof this.start) {
            throw TypeError("start must be a Number");
          }
          if (void 0 === this.end) this.end = 1 / 0;
          else if ("number" != typeof this.end) {
            throw TypeError("end must be a Number");
          }
          if (this.start > this.end) throw new Error("start must be <= end");
          this.pos = this.start;
        }
        if (null !== this.fd) {
          return void process.nextTick(function () {
            i._read();
          });
        }
        t.open(this.path, this.flags, this.mode, function (t, e) {
          if (t) return i.emit("error", t), void (i.readable = !1);
          i.fd = e, i.emit("open", e), i._read();
        });
      },
      WriteStream: function e(n, r) {
        if (!(this instanceof e)) return new e(n, r);
        Fo.call(this),
          this.path = n,
          this.fd = null,
          this.writable = !0,
          this.flags = "w",
          this.encoding = "binary",
          this.mode = 438,
          this.bytesWritten = 0,
          r = r || {};
        for (var i = Object.keys(r), s = 0, o = i.length; s < o; s++) {
          var a = i[s];
          this[a] = r[a];
        }
        if (void 0 !== this.start) {
          if ("number" != typeof this.start) {
            throw TypeError("start must be a Number");
          }
          if (this.start < 0) throw new Error("start must be >= zero");
          this.pos = this.start;
        }
        this.busy = !1,
          this._queue = [],
          null === this.fd &&
          (this._open = t.open,
            this._queue.push([
              this._open,
              this.path,
              this.flags,
              this.mode,
              void 0,
            ]),
            this.flush());
      },
    };
  };
var No = function (t) {
    if (null === t || "object" != typeof t) return t;
    if (t instanceof Object) { var e = { __proto__: Mo(t) }; }
    else e = Object.create(null);
    return Object.getOwnPropertyNames(t).forEach(function (n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(t, n));
    }),
      e;
  },
  Mo = Object.getPrototypeOf || function (t) {
    return t.__proto__;
  };
var Ho, Io, jo = c, Bo = $o, Go = Do, Wo = No, Uo = s;
function Ko(t, e) {
  Object.defineProperty(t, Ho, {
    get: function () {
      return e;
    },
  });
}
"function" == typeof Symbol && "function" == typeof Symbol.for
  ? (Ho = Symbol.for("graceful-fs.queue"),
    Io = Symbol.for("graceful-fs.previous"))
  : (Ho = "___graceful-fs.queue", Io = "___graceful-fs.previous");
var Vo = function () {};
if (
  Uo.debuglog
    ? Vo = Uo.debuglog("gfs4")
    : /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && (Vo = function () {
      var t = Uo.format.apply(Uo, arguments);
      t = "GFS4: " + t.split(/\n/).join("\nGFS4: "), console.error(t);
    }), !jo[Ho]
) {
  var Yo = g[Ho] || [];
  Ko(jo, Yo),
    jo.close = function (t) {
      function e(e, n) {
        return t.call(jo, e, function (t) {
          t || Zo(), "function" == typeof n && n.apply(this, arguments);
        });
      }
      return Object.defineProperty(e, Io, { value: t }), e;
    }(jo.close),
    jo.closeSync = function (t) {
      function e(e) {
        t.apply(jo, arguments), Zo();
      }
      return Object.defineProperty(e, Io, { value: t }), e;
    }(jo.closeSync),
    /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") &&
    process.on("exit", function () {
      Vo(jo[Ho]), h.equal(jo[Ho].length, 0);
    });
}
g[Ho] || Ko(g, jo[Ho]);
var Qo, qo = Xo(Wo(jo));
function Xo(t) {
  Bo(t),
    t.gracefulify = Xo,
    t.createReadStream = function (e, n) {
      return new t.ReadStream(e, n);
    },
    t.createWriteStream = function (e, n) {
      return new t.WriteStream(e, n);
    };
  var e = t.readFile;
  t.readFile = function (t, n, r) {
    "function" == typeof n && (r = n, n = null);
    return function t(n, r, i, s) {
      return e(n, r, function (e) {
        !e || "EMFILE" !== e.code && "ENFILE" !== e.code
          ? "function" == typeof i && i.apply(this, arguments)
          : Jo([t, [n, r, i], e, s || Date.now(), Date.now()]);
      });
    }(t, n, r);
  };
  var n = t.writeFile;
  t.writeFile = function (t, e, r, i) {
    "function" == typeof r && (i = r, r = null);
    return function t(e, r, i, s, o) {
      return n(e, r, i, function (n) {
        !n || "EMFILE" !== n.code && "ENFILE" !== n.code
          ? "function" == typeof s && s.apply(this, arguments)
          : Jo([t, [e, r, i, s], n, o || Date.now(), Date.now()]);
      });
    }(t, e, r, i);
  };
  var r = t.appendFile;
  r && (t.appendFile = function (t, e, n, i) {
    "function" == typeof n && (i = n, n = null);
    return function t(e, n, i, s, o) {
      return r(e, n, i, function (r) {
        !r || "EMFILE" !== r.code && "ENFILE" !== r.code
          ? "function" == typeof s && s.apply(this, arguments)
          : Jo([t, [e, n, i, s], r, o || Date.now(), Date.now()]);
      });
    }(t, e, n, i);
  });
  var i = t.copyFile;
  i && (t.copyFile = function (t, e, n, r) {
    "function" == typeof n && (r = n, n = 0);
    return function t(e, n, r, s, o) {
      return i(e, n, r, function (i) {
        !i || "EMFILE" !== i.code && "ENFILE" !== i.code
          ? "function" == typeof s && s.apply(this, arguments)
          : Jo([t, [e, n, r, s], i, o || Date.now(), Date.now()]);
      });
    }(t, e, n, r);
  });
  var s = t.readdir;
  t.readdir = function (t, e, n) {
    "function" == typeof e && (n = e, e = null);
    var r = o.test(process.version)
      ? function (t, e, n, r) {
        return s(t, i(t, e, n, r));
      }
      : function (t, e, n, r) {
        return s(t, e, i(t, e, n, r));
      };
    return r(t, e, n);
    function i(t, e, n, i) {
      return function (s, o) {
        !s || "EMFILE" !== s.code && "ENFILE" !== s.code
          ? (o && o.sort && o.sort(),
            "function" == typeof n && n.call(this, s, o))
          : Jo([r, [t, e, n], s, i || Date.now(), Date.now()]);
      };
    }
  };
  var o = /^v[0-5]\./;
  if ("v0.8" === process.version.substr(0, 4)) {
    var a = Go(t);
    f = a.ReadStream, h = a.WriteStream;
  }
  var c = t.ReadStream;
  c &&
    (f.prototype = Object.create(c.prototype),
      f.prototype.open = function () {
        var t = this;
        y(t.path, t.flags, t.mode, function (e, n) {
          e
            ? (t.autoClose && t.destroy(), t.emit("error", e))
            : (t.fd = n, t.emit("open", n), t.read());
        });
      });
  var u = t.WriteStream;
  u &&
  (h.prototype = Object.create(u.prototype),
    h.prototype.open = function () {
      var t = this;
      y(t.path, t.flags, t.mode, function (e, n) {
        e ? (t.destroy(), t.emit("error", e)) : (t.fd = n, t.emit("open", n));
      });
    }),
    Object.defineProperty(t, "ReadStream", {
      get: function () {
        return f;
      },
      set: function (t) {
        f = t;
      },
      enumerable: !0,
      configurable: !0,
    }),
    Object.defineProperty(t, "WriteStream", {
      get: function () {
        return h;
      },
      set: function (t) {
        h = t;
      },
      enumerable: !0,
      configurable: !0,
    });
  var l = f;
  Object.defineProperty(t, "FileReadStream", {
    get: function () {
      return l;
    },
    set: function (t) {
      l = t;
    },
    enumerable: !0,
    configurable: !0,
  });
  var p = h;
  function f(t, e) {
    return this instanceof f
      ? (c.apply(this, arguments), this)
      : f.apply(Object.create(f.prototype), arguments);
  }
  function h(t, e) {
    return this instanceof h
      ? (u.apply(this, arguments), this)
      : h.apply(Object.create(h.prototype), arguments);
  }
  Object.defineProperty(t, "FileWriteStream", {
    get: function () {
      return p;
    },
    set: function (t) {
      p = t;
    },
    enumerable: !0,
    configurable: !0,
  });
  var d = t.open;
  function y(t, e, n, r) {
    return "function" == typeof n && (r = n, n = null),
      function t(e, n, r, i, s) {
        return d(e, n, r, function (o, a) {
          !o || "EMFILE" !== o.code && "ENFILE" !== o.code
            ? "function" == typeof i && i.apply(this, arguments)
            : Jo([t, [e, n, r, i], o, s || Date.now(), Date.now()]);
        });
      }(t, e, n, r);
  }
  return t.open = y, t;
}
function Jo(t) {
  Vo("ENQUEUE", t[0].name, t[1]), jo[Ho].push(t), zo();
}
function Zo() {
  for (var t = Date.now(), e = 0; e < jo[Ho].length; ++e) {
    jo[Ho][e].length > 2 && (jo[Ho][e][3] = t, jo[Ho][e][4] = t);
  }
  zo();
}
function zo() {
  if (clearTimeout(Qo), Qo = void 0, 0 !== jo[Ho].length) {
    var t = jo[Ho].shift(), e = t[0], n = t[1], r = t[2], i = t[3], s = t[4];
    if (void 0 === i) Vo("RETRY", e.name, n), e.apply(null, n);
    else if (Date.now() - i >= 6e4) {
      Vo("TIMEOUT", e.name, n);
      var o = n.pop();
      "function" == typeof o && o.call(null, r);
    } else {
      var a = Date.now() - s, c = Math.max(s - i, 1);
      a >= Math.min(1.2 * c, 100)
        ? (Vo("RETRY", e.name, n), e.apply(null, n.concat([i])))
        : jo[Ho].push(t);
    }
    void 0 === Qo && (Qo = setTimeout(zo, 0));
  }
}
process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !jo.__patched &&
(qo = Xo(jo), jo.__patched = !0),
  function (t) {
    const e = Oo.fromCallback,
      n = qo,
      r = [
        "access",
        "appendFile",
        "chmod",
        "chown",
        "close",
        "copyFile",
        "fchmod",
        "fchown",
        "fdatasync",
        "fstat",
        "fsync",
        "ftruncate",
        "futimes",
        "lchmod",
        "lchown",
        "link",
        "lstat",
        "mkdir",
        "mkdtemp",
        "open",
        "opendir",
        "readdir",
        "readFile",
        "readlink",
        "realpath",
        "rename",
        "rm",
        "rmdir",
        "stat",
        "symlink",
        "truncate",
        "unlink",
        "utimes",
        "writeFile",
      ].filter((t) => "function" == typeof n[t]);
    Object.assign(t, n),
      r.forEach((r) => {
        t[r] = e(n[r]);
      }),
      t.exists = function (t, e) {
        return "function" == typeof e
          ? n.exists(t, e)
          : new Promise((e) => n.exists(t, e));
      },
      t.read = function (t, e, r, i, s, o) {
        return "function" == typeof o
          ? n.read(t, e, r, i, s, o)
          : new Promise((o, a) => {
            n.read(t, e, r, i, s, (t, e, n) => {
              if (t) return a(t);
              o({ bytesRead: e, buffer: n });
            });
          });
      },
      t.write = function (t, e, ...r) {
        return "function" == typeof r[r.length - 1]
          ? n.write(t, e, ...r)
          : new Promise((i, s) => {
            n.write(t, e, ...r, (t, e, n) => {
              if (t) return s(t);
              i({ bytesWritten: e, buffer: n });
            });
          });
      },
      t.readv = function (t, e, ...r) {
        return "function" == typeof r[r.length - 1]
          ? n.readv(t, e, ...r)
          : new Promise((i, s) => {
            n.readv(t, e, ...r, (t, e, n) => {
              if (t) return s(t);
              i({ bytesRead: e, buffers: n });
            });
          });
      },
      t.writev = function (t, e, ...r) {
        return "function" == typeof r[r.length - 1]
          ? n.writev(t, e, ...r)
          : new Promise((i, s) => {
            n.writev(t, e, ...r, (t, e, n) => {
              if (t) return s(t);
              i({ bytesWritten: e, buffers: n });
            });
          });
      },
      "function" == typeof n.realpath.native
        ? t.realpath.native = e(n.realpath.native)
        : process.emitWarning(
          "fs.realpath.native is not a function. Is fs being monkey-patched?",
          "Warning",
          "fs-extra-WARN0003",
        );
  }(Po);
var ta = {}, ea = {};
const na = i;
ea.checkPath = function (t) {
  if ("win32" === process.platform) {
    if (/[<>:"|?*]/.test(t.replace(na.parse(t).root, ""))) {
      const e = new Error(`Path contains invalid characters: ${t}`);
      throw e.code = "EINVAL", e;
    }
  }
};
const ra = Po,
  { checkPath: ia } = ea,
  sa = (t) => "number" == typeof t ? t : { mode: 511, ...t }.mode;
ta.makeDir = async (
  t,
  e,
) => (ia(t), ra.mkdir(t, { mode: sa(e), recursive: !0 })),
  ta.makeDirSync = (
    t,
    e,
  ) => (ia(t), ra.mkdirSync(t, { mode: sa(e), recursive: !0 }));
const oa = Oo.fromPromise, { makeDir: aa, makeDirSync: ca } = ta, ua = oa(aa);
var la = {
  mkdirs: ua,
  mkdirsSync: ca,
  mkdirp: ua,
  mkdirpSync: ca,
  ensureDir: ua,
  ensureDirSync: ca,
};
const pa = Oo.fromPromise, fa = Po;
var ha = {
  pathExists: pa(function (t) {
    return fa.access(t).then(() => !0).catch(() => !1);
  }),
  pathExistsSync: fa.existsSync,
};
const da = Po;
var ya = {
  utimesMillis: (0, Oo.fromPromise)(async function (t, e, n) {
    const r = await da.open(t, "r+");
    let i = null;
    try {
      await da.futimes(r, e, n);
    } finally {
      try {
        await da.close(r);
      } catch (t) {
        i = t;
      }
    }
    if (i) throw i;
  }),
  utimesMillisSync: function (t, e, n) {
    const r = da.openSync(t, "r+");
    return da.futimesSync(r, e, n), da.closeSync(r);
  },
};
const ga = Po, ma = i, _a = Oo.fromPromise;
function Sa(t, e) {
  return e.ino && e.dev && e.ino === t.ino && e.dev === t.dev;
}
function va(t, e) {
  const n = ma.resolve(t).split(ma.sep).filter((t) => t),
    r = ma.resolve(e).split(ma.sep).filter((t) => t);
  return n.every((t, e) => r[e] === t);
}
function ba(t, e, n) {
  return `Cannot ${n} '${t}' to a subdirectory of itself, '${e}'.`;
}
var Ea = {
  checkPaths: _a(async function (t, e, n, r) {
    const { srcStat: i, destStat: s } = await function (t, e, n) {
      const r = n.dereference
        ? (t) => ga.stat(t, { bigint: !0 })
        : (t) => ga.lstat(t, { bigint: !0 });
      return Promise.all([
        r(t),
        r(e).catch((t) => {
          if ("ENOENT" === t.code) return null;
          throw t;
        }),
      ]).then(([t, e]) => ({ srcStat: t, destStat: e }));
    }(t, e, r);
    if (s) {
      if (Sa(i, s)) {
        const r = ma.basename(t), o = ma.basename(e);
        if ("move" === n && r !== o && r.toLowerCase() === o.toLowerCase()) {
          return { srcStat: i, destStat: s, isChangingCase: !0 };
        }
        throw new Error("Source and destination must not be the same.");
      }
      if (i.isDirectory() && !s.isDirectory()) {
        throw new Error(
          `Cannot overwrite non-directory '${e}' with directory '${t}'.`,
        );
      }
      if (!i.isDirectory() && s.isDirectory()) {
        throw new Error(
          `Cannot overwrite directory '${e}' with non-directory '${t}'.`,
        );
      }
    }
    if (i.isDirectory() && va(t, e)) throw new Error(ba(t, e, n));
    return { srcStat: i, destStat: s };
  }),
  checkPathsSync: function (t, e, n, r) {
    const { srcStat: i, destStat: s } = function (t, e, n) {
      let r;
      const i = n.dereference
          ? (t) => ga.statSync(t, { bigint: !0 })
          : (t) => ga.lstatSync(t, { bigint: !0 }),
        s = i(t);
      try {
        r = i(e);
      } catch (t) {
        if ("ENOENT" === t.code) return { srcStat: s, destStat: null };
        throw t;
      }
      return { srcStat: s, destStat: r };
    }(t, e, r);
    if (s) {
      if (Sa(i, s)) {
        const r = ma.basename(t), o = ma.basename(e);
        if ("move" === n && r !== o && r.toLowerCase() === o.toLowerCase()) {
          return { srcStat: i, destStat: s, isChangingCase: !0 };
        }
        throw new Error("Source and destination must not be the same.");
      }
      if (i.isDirectory() && !s.isDirectory()) {
        throw new Error(
          `Cannot overwrite non-directory '${e}' with directory '${t}'.`,
        );
      }
      if (!i.isDirectory() && s.isDirectory()) {
        throw new Error(
          `Cannot overwrite directory '${e}' with non-directory '${t}'.`,
        );
      }
    }
    if (i.isDirectory() && va(t, e)) throw new Error(ba(t, e, n));
    return { srcStat: i, destStat: s };
  },
  checkParentPaths: _a(async function t(e, n, r, i) {
    const s = ma.resolve(ma.dirname(e)), o = ma.resolve(ma.dirname(r));
    if (o === s || o === ma.parse(o).root) return;
    let a;
    try {
      a = await ga.stat(o, { bigint: !0 });
    } catch (t) {
      if ("ENOENT" === t.code) return;
      throw t;
    }
    if (Sa(n, a)) throw new Error(ba(e, r, i));
    return t(e, n, o, i);
  }),
  checkParentPathsSync: function t(e, n, r, i) {
    const s = ma.resolve(ma.dirname(e)), o = ma.resolve(ma.dirname(r));
    if (o === s || o === ma.parse(o).root) return;
    let a;
    try {
      a = ga.statSync(o, { bigint: !0 });
    } catch (t) {
      if ("ENOENT" === t.code) return;
      throw t;
    }
    if (Sa(n, a)) throw new Error(ba(e, r, i));
    return t(e, n, o, i);
  },
  isSrcSubdir: va,
  areIdentical: Sa,
};
const wa = Po,
  Aa = i,
  { mkdirs: Ra } = la,
  { pathExists: Pa } = ha,
  { utimesMillis: Oa } = ya,
  ka = Ea;
async function xa(t, e, n) {
  return !n.filter || n.filter(t, e);
}
async function Ca(t, e, n, r) {
  const i = r.dereference ? wa.stat : wa.lstat, s = await i(e);
  if (s.isDirectory()) {
    return async function (t, e, n, r, i) {
      e || await wa.mkdir(r);
      const s = await wa.readdir(n);
      await Promise.all(s.map(async (t) => {
        const e = Aa.join(n, t), s = Aa.join(r, t);
        if (!await xa(e, s, i)) return;
        const { destStat: o } = await ka.checkPaths(e, s, "copy", i);
        return Ca(o, e, s, i);
      })), e || await wa.chmod(r, t.mode);
    }(s, t, e, n, r);
  }
  if (s.isFile() || s.isCharacterDevice() || s.isBlockDevice()) {
    return async function (t, e, n, r, i) {
      if (!e) return Ta(t, n, r, i);
      if (i.overwrite) return await wa.unlink(r), Ta(t, n, r, i);
      if (i.errorOnExist) throw new Error(`'${r}' already exists`);
    }(s, t, e, n, r);
  }
  if (s.isSymbolicLink()) {
    return async function (t, e, n, r) {
      let i = await wa.readlink(e);
      r.dereference && (i = Aa.resolve(process.cwd(), i));
      if (!t) return wa.symlink(i, n);
      let s = null;
      try {
        s = await wa.readlink(n);
      } catch (t) {
        if ("EINVAL" === t.code || "UNKNOWN" === t.code) {
          return wa.symlink(i, n);
        }
        throw t;
      }
      r.dereference && (s = Aa.resolve(process.cwd(), s));
      if (ka.isSrcSubdir(i, s)) {
        throw new Error(
          `Cannot copy '${i}' to a subdirectory of itself, '${s}'.`,
        );
      }
      if (ka.isSrcSubdir(s, i)) {
        throw new Error(`Cannot overwrite '${s}' with '${i}'.`);
      }
      return await wa.unlink(n), wa.symlink(i, n);
    }(t, e, n, r);
  }
  if (s.isSocket()) throw new Error(`Cannot copy a socket file: ${e}`);
  if (s.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${e}`);
  throw new Error(`Unknown file: ${e}`);
}
async function Ta(t, e, n, r) {
  if (await wa.copyFile(e, n), r.preserveTimestamps) {
    128 & t.mode || await function (t, e) {
      return wa.chmod(t, 128 | e);
    }(n, t.mode);
    const r = await wa.stat(e);
    await Oa(n, r.atime, r.mtime);
  }
  return wa.chmod(n, t.mode);
}
var La = async function (t, e, n = {}) {
  "function" == typeof n && (n = { filter: n }),
    n.clobber = !("clobber" in n) || !!n.clobber,
    n.overwrite = "overwrite" in n ? !!n.overwrite : n.clobber,
    n.preserveTimestamps && "ia32" === process.arch &&
    process.emitWarning(
      "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n\tsee https://github.com/jprichardson/node-fs-extra/issues/269",
      "Warning",
      "fs-extra-WARN0001",
    );
  const { srcStat: r, destStat: i } = await ka.checkPaths(t, e, "copy", n);
  if (await ka.checkParentPaths(t, r, e, "copy"), !await xa(t, e, n)) return;
  const s = Aa.dirname(e);
  await Pa(s) || await Ra(s), await Ca(i, t, e, n);
};
const $a = qo, Fa = i, Da = la.mkdirsSync, Na = ya.utimesMillisSync, Ma = Ea;
function Ha(t, e, n, r) {
  const i = (r.dereference ? $a.statSync : $a.lstatSync)(e);
  if (i.isDirectory()) {
    return function (t, e, n, r, i) {
      return e ? Ba(n, r, i) : function (t, e, n, r) {
        return $a.mkdirSync(n), Ba(e, n, r), ja(n, t);
      }(t.mode, n, r, i);
    }(i, t, e, n, r);
  }
  if (i.isFile() || i.isCharacterDevice() || i.isBlockDevice()) {
    return function (t, e, n, r, i) {
      return e
        ? function (t, e, n, r) {
          if (r.overwrite) return $a.unlinkSync(n), Ia(t, e, n, r);
          if (r.errorOnExist) throw new Error(`'${n}' already exists`);
        }(t, n, r, i)
        : Ia(t, n, r, i);
    }(i, t, e, n, r);
  }
  if (i.isSymbolicLink()) {
    return function (t, e, n, r) {
      let i = $a.readlinkSync(e);
      r.dereference && (i = Fa.resolve(process.cwd(), i));
      if (t) {
        let t;
        try {
          t = $a.readlinkSync(n);
        } catch (t) {
          if ("EINVAL" === t.code || "UNKNOWN" === t.code) {
            return $a.symlinkSync(i, n);
          }
          throw t;
        }
        if (
          r.dereference && (t = Fa.resolve(process.cwd(), t)),
            Ma.isSrcSubdir(i, t)
        ) {
          throw new Error(
            `Cannot copy '${i}' to a subdirectory of itself, '${t}'.`,
          );
        }
        if (Ma.isSrcSubdir(t, i)) {
          throw new Error(
            `Cannot overwrite '${t}' with '${i}'.`,
          );
        }
        return function (t, e) {
          return $a.unlinkSync(e), $a.symlinkSync(t, e);
        }(i, n);
      }
      return $a.symlinkSync(i, n);
    }(t, e, n, r);
  }
  if (i.isSocket()) throw new Error(`Cannot copy a socket file: ${e}`);
  if (i.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${e}`);
  throw new Error(`Unknown file: ${e}`);
}
function Ia(t, e, n, r) {
  return $a.copyFileSync(e, n),
    r.preserveTimestamps && function (t, e, n) {
      (function (t) {
        return !(128 & t);
      })(t) && function (t, e) {
        ja(t, 128 | e);
      }(n, t);
      (function (t, e) {
        const n = $a.statSync(t);
        Na(e, n.atime, n.mtime);
      })(e, n);
    }(t.mode, e, n),
    ja(n, t.mode);
}
function ja(t, e) {
  return $a.chmodSync(t, e);
}
function Ba(t, e, n) {
  $a.readdirSync(t).forEach((r) =>
    function (t, e, n, r) {
      const i = Fa.join(e, t), s = Fa.join(n, t);
      if (r.filter && !r.filter(i, s)) return;
      const { destStat: o } = Ma.checkPathsSync(i, s, "copy", r);
      return Ha(o, i, s, r);
    }(r, t, e, n)
  );
}
var Ga = function (t, e, n) {
  "function" == typeof n && (n = { filter: n }),
    (n = n || {}).clobber = !("clobber" in n) || !!n.clobber,
    n.overwrite = "overwrite" in n ? !!n.overwrite : n.clobber,
    n.preserveTimestamps && "ia32" === process.arch &&
    process.emitWarning(
      "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n\tsee https://github.com/jprichardson/node-fs-extra/issues/269",
      "Warning",
      "fs-extra-WARN0002",
    );
  const { srcStat: r, destStat: i } = Ma.checkPathsSync(t, e, "copy", n);
  if (Ma.checkParentPathsSync(t, r, e, "copy"), n.filter && !n.filter(t, e)) {
    return;
  }
  const s = Fa.dirname(e);
  return $a.existsSync(s) || Da(s), Ha(i, t, e, n);
};
var Wa = { copy: (0, Oo.fromPromise)(La), copySync: Ga };
const Ua = qo;
var Ka = {
  remove: (0, Oo.fromCallback)(function (t, e) {
    Ua.rm(t, { recursive: !0, force: !0 }, e);
  }),
  removeSync: function (t) {
    Ua.rmSync(t, { recursive: !0, force: !0 });
  },
};
const Va = Oo.fromPromise,
  Ya = Po,
  Qa = i,
  qa = la,
  Xa = Ka,
  Ja = Va(async function (t) {
    let e;
    try {
      e = await Ya.readdir(t);
    } catch {
      return qa.mkdirs(t);
    }
    return Promise.all(e.map((e) => Xa.remove(Qa.join(t, e))));
  });
function Za(t) {
  let e;
  try {
    e = Ya.readdirSync(t);
  } catch {
    return qa.mkdirsSync(t);
  }
  e.forEach((e) => {
    e = Qa.join(t, e), Xa.removeSync(e);
  });
}
var za = { emptyDirSync: Za, emptydirSync: Za, emptyDir: Ja, emptydir: Ja };
const tc = Oo.fromPromise, ec = i, nc = Po, rc = la;
var ic = {
  createFile: tc(async function (t) {
    let e;
    try {
      e = await nc.stat(t);
    } catch {}
    if (e && e.isFile()) return;
    const n = ec.dirname(t);
    let r = null;
    try {
      r = await nc.stat(n);
    } catch (e) {
      if ("ENOENT" === e.code) {
        return await rc.mkdirs(n), void await nc.writeFile(t, "");
      }
      throw e;
    }
    r.isDirectory() ? await nc.writeFile(t, "") : await nc.readdir(n);
  }),
  createFileSync: function (t) {
    let e;
    try {
      e = nc.statSync(t);
    } catch {}
    if (e && e.isFile()) return;
    const n = ec.dirname(t);
    try {
      nc.statSync(n).isDirectory() || nc.readdirSync(n);
    } catch (t) {
      if (!t || "ENOENT" !== t.code) throw t;
      rc.mkdirsSync(n);
    }
    nc.writeFileSync(t, "");
  },
};
const sc = Oo.fromPromise,
  oc = i,
  ac = Po,
  cc = la,
  { pathExists: uc } = ha,
  { areIdentical: lc } = Ea;
var pc = {
  createLink: sc(async function (t, e) {
    let n, r;
    try {
      n = await ac.lstat(e);
    } catch {}
    try {
      r = await ac.lstat(t);
    } catch (t) {
      throw t.message = t.message.replace("lstat", "ensureLink"), t;
    }
    if (n && lc(r, n)) return;
    const i = oc.dirname(e);
    await uc(i) || await cc.mkdirs(i), await ac.link(t, e);
  }),
  createLinkSync: function (t, e) {
    let n;
    try {
      n = ac.lstatSync(e);
    } catch {}
    try {
      const e = ac.lstatSync(t);
      if (n && lc(e, n)) return;
    } catch (t) {
      throw t.message = t.message.replace("lstat", "ensureLink"), t;
    }
    const r = oc.dirname(e);
    return ac.existsSync(r) || cc.mkdirsSync(r), ac.linkSync(t, e);
  },
};
const fc = i, hc = Po, { pathExists: dc } = ha;
var yc = {
  symlinkPaths: (0, Oo.fromPromise)(async function (t, e) {
    if (fc.isAbsolute(t)) {
      try {
        await hc.lstat(t);
      } catch (t) {
        throw t.message = t.message.replace("lstat", "ensureSymlink"), t;
      }
      return { toCwd: t, toDst: t };
    }
    const n = fc.dirname(e), r = fc.join(n, t);
    if (await dc(r)) return { toCwd: r, toDst: t };
    try {
      await hc.lstat(t);
    } catch (t) {
      throw t.message = t.message.replace("lstat", "ensureSymlink"), t;
    }
    return { toCwd: t, toDst: fc.relative(n, t) };
  }),
  symlinkPathsSync: function (t, e) {
    if (fc.isAbsolute(t)) {
      if (!hc.existsSync(t)) throw new Error("absolute srcpath does not exist");
      return { toCwd: t, toDst: t };
    }
    const n = fc.dirname(e), r = fc.join(n, t);
    if (hc.existsSync(r)) return { toCwd: r, toDst: t };
    if (!hc.existsSync(t)) throw new Error("relative srcpath does not exist");
    return { toCwd: t, toDst: fc.relative(n, t) };
  },
};
const gc = Po;
var mc = {
  symlinkType: (0, Oo.fromPromise)(async function (t, e) {
    if (e) return e;
    let n;
    try {
      n = await gc.lstat(t);
    } catch {
      return "file";
    }
    return n && n.isDirectory() ? "dir" : "file";
  }),
  symlinkTypeSync: function (t, e) {
    if (e) return e;
    let n;
    try {
      n = gc.lstatSync(t);
    } catch {
      return "file";
    }
    return n && n.isDirectory() ? "dir" : "file";
  },
};
const _c = Oo.fromPromise,
  Sc = i,
  vc = Po,
  { mkdirs: bc, mkdirsSync: Ec } = la,
  { symlinkPaths: wc, symlinkPathsSync: Ac } = yc,
  { symlinkType: Rc, symlinkTypeSync: Pc } = mc,
  { pathExists: Oc } = ha,
  { areIdentical: kc } = Ea;
var xc = {
  createSymlink: _c(async function (t, e, n) {
    let r;
    try {
      r = await vc.lstat(e);
    } catch {}
    if (r && r.isSymbolicLink()) {
      const [n, r] = await Promise.all([vc.stat(t), vc.stat(e)]);
      if (kc(n, r)) return;
    }
    const i = await wc(t, e);
    t = i.toDst;
    const s = await Rc(i.toCwd, n), o = Sc.dirname(e);
    return await Oc(o) || await bc(o), vc.symlink(t, e, s);
  }),
  createSymlinkSync: function (t, e, n) {
    let r;
    try {
      r = vc.lstatSync(e);
    } catch {}
    if (r && r.isSymbolicLink()) {
      const n = vc.statSync(t), r = vc.statSync(e);
      if (kc(n, r)) return;
    }
    const i = Ac(t, e);
    t = i.toDst, n = Pc(i.toCwd, n);
    const s = Sc.dirname(e);
    return vc.existsSync(s) || Ec(s), vc.symlinkSync(t, e, n);
  },
};
const { createFile: Cc, createFileSync: Tc } = ic,
  { createLink: Lc, createLinkSync: $c } = pc,
  { createSymlink: Fc, createSymlinkSync: Dc } = xc;
var Nc = {
  createFile: Cc,
  createFileSync: Tc,
  ensureFile: Cc,
  ensureFileSync: Tc,
  createLink: Lc,
  createLinkSync: $c,
  ensureLink: Lc,
  ensureLinkSync: $c,
  createSymlink: Fc,
  createSymlinkSync: Dc,
  ensureSymlink: Fc,
  ensureSymlinkSync: Dc,
};
var Mc = {
  stringify: function (
    t,
    { EOL: e = "\n", finalEOL: n = !0, replacer: r = null, spaces: i } = {},
  ) {
    const s = n ? e : "";
    return JSON.stringify(t, r, i).replace(/\n/g, e) + s;
  },
  stripBom: function (t) {
    return Buffer.isBuffer(t) && (t = t.toString("utf8")),
      t.replace(/^\uFEFF/, "");
  },
};
let Hc;
try {
  Hc = qo;
} catch (t) {
  Hc = c;
}
const Ic = Oo, { stringify: jc, stripBom: Bc } = Mc;
const Gc = Ic.fromPromise(async function (t, e = {}) {
  "string" == typeof e && (e = { encoding: e });
  const n = e.fs || Hc, r = !("throws" in e) || e.throws;
  let i, s = await Ic.fromCallback(n.readFile)(t, e);
  s = Bc(s);
  try {
    i = JSON.parse(s, e ? e.reviver : null);
  } catch (e) {
    if (r) throw e.message = `${t}: ${e.message}`, e;
    return null;
  }
  return i;
});
const Wc = Ic.fromPromise(async function (t, e, n = {}) {
  const r = n.fs || Hc, i = jc(e, n);
  await Ic.fromCallback(r.writeFile)(t, i, n);
});
const Uc = {
  readFile: Gc,
  readFileSync: function (t, e = {}) {
    "string" == typeof e && (e = { encoding: e });
    const n = e.fs || Hc, r = !("throws" in e) || e.throws;
    try {
      let r = n.readFileSync(t, e);
      return r = Bc(r), JSON.parse(r, e.reviver);
    } catch (e) {
      if (r) throw e.message = `${t}: ${e.message}`, e;
      return null;
    }
  },
  writeFile: Wc,
  writeFileSync: function (t, e, n = {}) {
    const r = n.fs || Hc, i = jc(e, n);
    return r.writeFileSync(t, i, n);
  },
};
var Kc = {
  readJson: Uc.readFile,
  readJsonSync: Uc.readFileSync,
  writeJson: Uc.writeFile,
  writeJsonSync: Uc.writeFileSync,
};
const Vc = Oo.fromPromise, Yc = Po, Qc = i, qc = la, Xc = ha.pathExists;
var Jc = {
  outputFile: Vc(async function (t, e, n = "utf-8") {
    const r = Qc.dirname(t);
    return await Xc(r) || await qc.mkdirs(r), Yc.writeFile(t, e, n);
  }),
  outputFileSync: function (t, ...e) {
    const n = Qc.dirname(t);
    Yc.existsSync(n) || qc.mkdirsSync(n), Yc.writeFileSync(t, ...e);
  },
};
const { stringify: Zc } = Mc, { outputFile: zc } = Jc;
var tu = async function (t, e, n = {}) {
  const r = Zc(e, n);
  await zc(t, r, n);
};
const { stringify: eu } = Mc, { outputFileSync: nu } = Jc;
var ru = function (t, e, n) {
  const r = eu(e, n);
  nu(t, r, n);
};
const iu = Oo.fromPromise, su = Kc;
su.outputJson = iu(tu),
  su.outputJsonSync = ru,
  su.outputJSON = su.outputJson,
  su.outputJSONSync = su.outputJsonSync,
  su.writeJSON = su.writeJson,
  su.writeJSONSync = su.writeJsonSync,
  su.readJSON = su.readJson,
  su.readJSONSync = su.readJsonSync;
var ou = su;
const au = Po,
  cu = i,
  { copy: uu } = Wa,
  { remove: lu } = Ka,
  { mkdirp: pu } = la,
  { pathExists: fu } = ha,
  hu = Ea;
var du = async function (t, e, n = {}) {
  const r = n.overwrite || n.clobber || !1,
    { srcStat: i, isChangingCase: s = !1 } = await hu.checkPaths(
      t,
      e,
      "move",
      n,
    );
  await hu.checkParentPaths(t, i, e, "move");
  const o = cu.dirname(e);
  return cu.parse(o).root !== o && await pu(o),
    async function (t, e, n, r) {
      if (!r) {
        if (n) await lu(e);
        else if (await fu(e)) throw new Error("dest already exists.");
      }
      try {
        await au.rename(t, e);
      } catch (r) {
        if ("EXDEV" !== r.code) throw r;
        await async function (t, e, n) {
          const r = { overwrite: n, errorOnExist: !0, preserveTimestamps: !0 };
          return await uu(t, e, r), lu(t);
        }(t, e, n);
      }
    }(t, e, r, s);
};
const yu = qo,
  gu = i,
  mu = Wa.copySync,
  _u = Ka.removeSync,
  Su = la.mkdirpSync,
  vu = Ea;
function bu(t, e, n) {
  try {
    yu.renameSync(t, e);
  } catch (r) {
    if ("EXDEV" !== r.code) throw r;
    return function (t, e, n) {
      const r = { overwrite: n, errorOnExist: !0, preserveTimestamps: !0 };
      return mu(t, e, r), _u(t);
    }(t, e, n);
  }
}
var Eu = function (t, e, n) {
  const r = (n = n || {}).overwrite || n.clobber || !1,
    { srcStat: i, isChangingCase: s = !1 } = vu.checkPathsSync(t, e, "move", n);
  return vu.checkParentPathsSync(t, i, e, "move"),
    function (t) {
      const e = gu.dirname(t);
      return gu.parse(e).root === e;
    }(e) || Su(gu.dirname(e)),
    function (t, e, n, r) {
      if (r) return bu(t, e, n);
      if (n) return _u(e), bu(t, e, n);
      if (yu.existsSync(e)) throw new Error("dest already exists.");
      return bu(t, e, n);
    }(t, e, r, s);
};
var wu = { move: (0, Oo.fromPromise)(du), moveSync: Eu },
  Au = m({
    ...Po,
    ...Wa,
    ...za,
    ...Nc,
    ...ou,
    ...la,
    ...wu,
    ...Jc,
    ...ha,
    ...Ka,
  });
const Ru = (t = 0) => (e) => `[${e + t}m`,
  Pu = (t = 0) => (e) => `[${38 + t};5;${e}m`,
  Ou = (t = 0) => (e, n, r) => `[${38 + t};2;${e};${n};${r}m`,
  ku = {
    modifier: {
      reset: [0, 0],
      bold: [1, 22],
      dim: [2, 22],
      italic: [3, 23],
      underline: [4, 24],
      overline: [53, 55],
      inverse: [7, 27],
      hidden: [8, 28],
      strikethrough: [9, 29],
    },
    color: {
      black: [30, 39],
      red: [31, 39],
      green: [32, 39],
      yellow: [33, 39],
      blue: [34, 39],
      magenta: [35, 39],
      cyan: [36, 39],
      white: [37, 39],
      blackBright: [90, 39],
      gray: [90, 39],
      grey: [90, 39],
      redBright: [91, 39],
      greenBright: [92, 39],
      yellowBright: [93, 39],
      blueBright: [94, 39],
      magentaBright: [95, 39],
      cyanBright: [96, 39],
      whiteBright: [97, 39],
    },
    bgColor: {
      bgBlack: [40, 49],
      bgRed: [41, 49],
      bgGreen: [42, 49],
      bgYellow: [43, 49],
      bgBlue: [44, 49],
      bgMagenta: [45, 49],
      bgCyan: [46, 49],
      bgWhite: [47, 49],
      bgBlackBright: [100, 49],
      bgGray: [100, 49],
      bgGrey: [100, 49],
      bgRedBright: [101, 49],
      bgGreenBright: [102, 49],
      bgYellowBright: [103, 49],
      bgBlueBright: [104, 49],
      bgMagentaBright: [105, 49],
      bgCyanBright: [106, 49],
      bgWhiteBright: [107, 49],
    },
  };
Object.keys(ku.modifier);
Object.keys(ku.color), Object.keys(ku.bgColor);
const xu = function () {
  const t = new Map();
  for (const [e, n] of Object.entries(ku)) {
    for (const [e, r] of Object.entries(n)) {
      ku[e] = { open: `[${r[0]}m`, close: `[${r[1]}m` },
        n[e] = ku[e],
        t.set(r[0], r[1]);
    }
    Object.defineProperty(ku, e, { value: n, enumerable: !1 });
  }
  return Object.defineProperty(ku, "codes", { value: t, enumerable: !1 }),
    ku.color.close = "[39m",
    ku.bgColor.close = "[49m",
    ku.color.ansi = Ru(),
    ku.color.ansi256 = Pu(),
    ku.color.ansi16m = Ou(),
    ku.bgColor.ansi = Ru(10),
    ku.bgColor.ansi256 = Pu(10),
    ku.bgColor.ansi16m = Ou(10),
    Object.defineProperties(ku, {
      rgbToAnsi256: {
        value: (t, e, n) =>
          t === e && e === n
            ? t < 8 ? 16 : t > 248 ? 231 : Math.round((t - 8) / 247 * 24) + 232
            : 16 + 36 * Math.round(t / 255 * 5) + 6 * Math.round(e / 255 * 5) +
              Math.round(n / 255 * 5),
        enumerable: !1,
      },
      hexToRgb: {
        value(t) {
          const e = /[a-f\d]{6}|[a-f\d]{3}/i.exec(t.toString(16));
          if (!e) return [0, 0, 0];
          let [n] = e;
          3 === n.length && (n = [...n].map((t) => t + t).join(""));
          const r = Number.parseInt(n, 16);
          return [r >> 16 & 255, r >> 8 & 255, 255 & r];
        },
        enumerable: !1,
      },
      hexToAnsi256: {
        value: (t) => ku.rgbToAnsi256(...ku.hexToRgb(t)),
        enumerable: !1,
      },
      ansi256ToAnsi: {
        value(t) {
          if (t < 8) return 30 + t;
          if (t < 16) return t - 8 + 90;
          let e, n, r;
          if (t >= 232) e = (10 * (t - 232) + 8) / 255, n = e, r = e;
          else {
            const i = (t -= 16) % 36;
            e = Math.floor(t / 36) / 5,
              n = Math.floor(i / 6) / 5,
              r = i % 6 / 5;
          }
          const i = 2 * Math.max(e, n, r);
          if (0 === i) return 30;
          let s = 30 +
            (Math.round(r) << 2 | Math.round(n) << 1 | Math.round(e));
          return 2 === i && (s += 60), s;
        },
        enumerable: !1,
      },
      rgbToAnsi: {
        value: (t, e, n) => ku.ansi256ToAnsi(ku.rgbToAnsi256(t, e, n)),
        enumerable: !1,
      },
      hexToAnsi: {
        value: (t) => ku.ansi256ToAnsi(ku.hexToAnsi256(t)),
        enumerable: !1,
      },
    }),
    ku;
}();
function Cu(e, n = (globalThis.Deno ? globalThis.Deno.args : t.argv)) {
  const r = e.startsWith("-") ? "" : 1 === e.length ? "-" : "--",
    i = n.indexOf(r + e),
    s = n.indexOf("--");
  return -1 !== i && (-1 === s || i < s);
}
const { env: Tu } = t;
let Lu;
function $u(e, { streamIsTTY: n, sniffFlags: r = !0 } = {}) {
  const i = function () {
    if ("FORCE_COLOR" in Tu) {
      return "true" === Tu.FORCE_COLOR
        ? 1
        : "false" === Tu.FORCE_COLOR
        ? 0
        : 0 === Tu.FORCE_COLOR.length
        ? 1
        : Math.min(Number.parseInt(Tu.FORCE_COLOR, 10), 3);
    }
  }();
  void 0 !== i && (Lu = i);
  const s = r ? Lu : i;
  if (0 === s) return 0;
  if (r) {
    if (Cu("color=16m") || Cu("color=full") || Cu("color=truecolor")) return 3;
    if (Cu("color=256")) return 2;
  }
  if ("TF_BUILD" in Tu && "AGENT_NAME" in Tu) return 1;
  if (e && !n && void 0 === s) return 0;
  const o = s || 0;
  if ("dumb" === Tu.TERM) return o;
  if ("win32" === t.platform) {
    const t = d.release().split(".");
    return Number(t[0]) >= 10 && Number(t[2]) >= 10586
      ? Number(t[2]) >= 14931 ? 3 : 2
      : 1;
  }
  if ("CI" in Tu) {
    return "GITHUB_ACTIONS" in Tu || "GITEA_ACTIONS" in Tu
      ? 3
      : ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"]
          .some((t) => t in Tu) || "codeship" === Tu.CI_NAME
      ? 1
      : o;
  }
  if ("TEAMCITY_VERSION" in Tu) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(Tu.TEAMCITY_VERSION) ? 1 : 0;
  }
  if ("truecolor" === Tu.COLORTERM) return 3;
  if ("xterm-kitty" === Tu.TERM) return 3;
  if ("TERM_PROGRAM" in Tu) {
    const t = Number.parseInt(
      (Tu.TERM_PROGRAM_VERSION || "").split(".")[0],
      10,
    );
    switch (Tu.TERM_PROGRAM) {
      case "iTerm.app":
        return t >= 3 ? 3 : 2;
      case "Apple_Terminal":
        return 2;
    }
  }
  return /-256(color)?$/i.test(Tu.TERM)
    ? 2
    : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(
        Tu.TERM,
      ) || "COLORTERM" in Tu
    ? 1
    : o;
}
function Fu(t, e = {}) {
  return function (t) {
    return 0 !== t &&
      { level: t, hasBasic: !0, has256: t >= 2, has16m: t >= 3 };
  }($u(t, { streamIsTTY: t && t.isTTY, ...e }));
}
Cu("no-color") || Cu("no-colors") || Cu("color=false") || Cu("color=never")
  ? Lu = 0
  : (Cu("color") || Cu("colors") || Cu("color=true") || Cu("color=always")) &&
    (Lu = 1);
const Du = {
  stdout: Fu({ isTTY: y.isatty(1) }),
  stderr: Fu({ isTTY: y.isatty(2) }),
};
function Nu(t, e, n) {
  let r = t.indexOf(e);
  if (-1 === r) return t;
  const i = e.length;
  let s = 0, o = "";
  do {
    o += t.slice(s, r) + e + n, s = r + i, r = t.indexOf(e, s);
  } while (-1 !== r);
  return o += t.slice(s), o;
}
const { stdout: Mu, stderr: Hu } = Du,
  Iu = Symbol("GENERATOR"),
  ju = Symbol("STYLER"),
  Bu = Symbol("IS_EMPTY"),
  Gu = ["ansi", "ansi", "ansi256", "ansi16m"],
  Wu = Object.create(null),
  Uu = (t) => {
    const e = (...t) => t.join(" ");
    return ((t, e = {}) => {
      if (
        e.level && !(Number.isInteger(e.level) && e.level >= 0 && e.level <= 3)
      ) throw new Error("The `level` option should be an integer from 0 to 3");
      const n = Mu ? Mu.level : 0;
      t.level = void 0 === e.level ? n : e.level;
    })(e, t),
      Object.setPrototypeOf(e, Ku.prototype),
      e;
  };
function Ku(t) {
  return Uu(t);
}
Object.setPrototypeOf(Ku.prototype, Function.prototype);
for (const [t, e] of Object.entries(xu)) {
  Wu[t] = {
    get() {
      const n = Xu(this, qu(e.open, e.close, this[ju]), this[Bu]);
      return Object.defineProperty(this, t, { value: n }), n;
    },
  };
}
Wu.visible = {
  get() {
    const t = Xu(this, this[ju], !0);
    return Object.defineProperty(this, "visible", { value: t }), t;
  },
};
const Vu = (t, e, n, ...r) =>
    "rgb" === t
      ? "ansi16m" === e
        ? xu[n].ansi16m(...r)
        : "ansi256" === e
        ? xu[n].ansi256(xu.rgbToAnsi256(...r))
        : xu[n].ansi(xu.rgbToAnsi(...r))
      : "hex" === t
      ? Vu("rgb", e, n, ...xu.hexToRgb(...r))
      : xu[n][t](...r),
  Yu = ["rgb", "hex", "ansi256"];
for (const t of Yu) {
  Wu[t] = {
    get() {
      const { level: e } = this;
      return function (...n) {
        const r = qu(Vu(t, Gu[e], "color", ...n), xu.color.close, this[ju]);
        return Xu(this, r, this[Bu]);
      };
    },
  };
  Wu["bg" + t[0].toUpperCase() + t.slice(1)] = {
    get() {
      const { level: e } = this;
      return function (...n) {
        const r = qu(Vu(t, Gu[e], "bgColor", ...n), xu.bgColor.close, this[ju]);
        return Xu(this, r, this[Bu]);
      };
    },
  };
}
const Qu = Object.defineProperties(() => {}, {
    ...Wu,
    level: {
      enumerable: !0,
      get() {
        return this[Iu].level;
      },
      set(t) {
        this[Iu].level = t;
      },
    },
  }),
  qu = (t, e, n) => {
    let r, i;
    return void 0 === n
      ? (r = t, i = e)
      : (r = n.openAll + t, i = e + n.closeAll),
      { open: t, close: e, openAll: r, closeAll: i, parent: n };
  },
  Xu = (t, e, n) => {
    const r = (...t) => Ju(r, 1 === t.length ? "" + t[0] : t.join(" "));
    return Object.setPrototypeOf(r, Qu), r[Iu] = t, r[ju] = e, r[Bu] = n, r;
  },
  Ju = (t, e) => {
    if (t.level <= 0 || !e) return t[Bu] ? "" : e;
    let n = t[ju];
    if (void 0 === n) return e;
    const { openAll: r, closeAll: i } = n;
    if (e.includes("")) {
      for (; void 0 !== n;) e = Nu(e, n.close, n.open), n = n.parent;
    }
    const s = e.indexOf("\n");
    return -1 !== s && (e = function (t, e, n, r) {
      let i = 0, s = "";
      do {
        const o = "\r" === t[r - 1];
        s += t.slice(i, o ? r - 1 : r) + e + (o ? "\r\n" : "\n") + n,
          i = r + 1,
          r = t.indexOf("\n", i);
      } while (-1 !== r);
      return s += t.slice(i), s;
    }(e, i, r, s)),
      r + e + i;
  };
Object.defineProperties(Ku.prototype, Wu);
const Zu = Ku();
function zu(t) {
  if ("dependencies" in t) {
    return Object.entries(t.dependencies).filter(
      ([t]) => t.startsWith("@types/"),
    );
  }
  return [];
}
Ku({ level: Hu ? Hu.level : 0 }),
  async function () {
    const t = await Ao([
        "aviation/*/package.json",
        "marine/*/package.json",
        "lib/*/package.json",
        "other/*/package.json",
        "rail/*/package.json",
        "road/*/package.json",
        "tools/*/package.json",
      ]),
      e = await Promise.all(
        t.map(
          async (t) => ({
            project: t.replace("/package.json", ""),
            items: zu(await Au.readJson(t)),
          }),
        ),
      ),
      n = e.filter(({ items: t }) => 0 !== t.length);
    n.forEach(({ project: t, items: e }) => {
      console.log(
        `Project: ${
          Zu.bold(t)
        } has declared following as dependency instead of devDependency:`,
      ), e.forEach(([t]) => console.log(`- ${t}`));
    }),
      n.length > 0 &&
      (console.log(Zu.red("Check above errors")), process.exitCode = 1);
  }().catch((t) => console.error(t));
