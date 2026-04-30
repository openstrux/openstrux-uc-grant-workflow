#!/usr/bin/env node

// src/commands/build.ts
import { readFileSync as readFileSync2, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve as resolve2, dirname, relative, matchesGlob } from "node:path";

// ../parser/dist/lexer.js
var TokenType;
(function(TokenType2) {
  TokenType2["AT_TYPE"] = "AT_TYPE";
  TokenType2["AT_PANEL"] = "AT_PANEL";
  TokenType2["AT_CONTEXT"] = "AT_CONTEXT";
  TokenType2["AT_ACCESS"] = "AT_ACCESS";
  TokenType2["AT_DP"] = "AT_DP";
  TokenType2["AT_UNKNOWN"] = "AT_UNKNOWN";
  TokenType2["LBRACE"] = "LBRACE";
  TokenType2["RBRACE"] = "RBRACE";
  TokenType2["LANGLE"] = "LANGLE";
  TokenType2["RANGLE"] = "RANGLE";
  TokenType2["LPAREN"] = "LPAREN";
  TokenType2["RPAREN"] = "RPAREN";
  TokenType2["LBRACKET"] = "LBRACKET";
  TokenType2["RBRACKET"] = "RBRACKET";
  TokenType2["COLON"] = "COLON";
  TokenType2["COMMA"] = "COMMA";
  TokenType2["DOT"] = "DOT";
  TokenType2["EQUALS"] = "EQUALS";
  TokenType2["STAR"] = "STAR";
  TokenType2["STRING"] = "STRING";
  TokenType2["NUMBER"] = "NUMBER";
  TokenType2["DURATION"] = "DURATION";
  TokenType2["IDENT"] = "IDENT";
  TokenType2["NEWLINE"] = "NEWLINE";
  TokenType2["UNKNOWN"] = "UNKNOWN";
  TokenType2["EOF"] = "EOF";
})(TokenType || (TokenType = {}));
function charAt(source, pos) {
  return source[pos] ?? "";
}
function isIdentChar(ch) {
  return /[a-zA-Z0-9_-]/.test(ch);
}
function isIdentStart(ch) {
  return /[a-zA-Z_]/.test(ch);
}
function advanceState(s, source) {
  const ch = charAt(source, s.pos);
  if (ch === "")
    return "";
  s.pos++;
  if (ch === "\n") {
    s.line++;
    s.col = 1;
  } else {
    s.col++;
  }
  return ch;
}
function tokenize(source) {
  const tokens = [];
  const s = { pos: 0, line: 1, col: 1, inPanel: false, waitingForPanelBrace: false, panelBraceDepth: 0 };
  function emit2(type, value, tLine, tCol, tOffset) {
    tokens.push({ type, value, line: tLine, col: tCol, length: value.length, offset: tOffset });
  }
  while (s.pos < source.length) {
    const startLine = s.line;
    const startCol = s.col;
    const startPos = s.pos;
    const ch = charAt(source, s.pos);
    if (ch === "/" && charAt(source, s.pos + 1) === "/") {
      while (s.pos < source.length && charAt(source, s.pos) !== "\n") {
        s.pos++;
        s.col++;
      }
      continue;
    }
    if (ch === "\n") {
      if (s.inPanel && s.panelBraceDepth === 1) {
        emit2(TokenType.NEWLINE, "\n", startLine, startCol, startPos);
      }
      advanceState(s, source);
      continue;
    }
    if (ch === " " || ch === "	" || ch === "\r") {
      advanceState(s, source);
      continue;
    }
    if (ch === "@") {
      advanceState(s, source);
      let ident = "";
      while (s.pos < source.length && isIdentChar(charAt(source, s.pos))) {
        ident += charAt(source, s.pos);
        s.pos++;
        s.col++;
      }
      const fullValue = "@" + ident;
      let type;
      switch (ident) {
        case "type":
          type = TokenType.AT_TYPE;
          break;
        case "panel":
          type = TokenType.AT_PANEL;
          s.waitingForPanelBrace = true;
          break;
        case "context":
          type = TokenType.AT_CONTEXT;
          break;
        case "access":
          type = TokenType.AT_ACCESS;
          break;
        case "dp":
          type = TokenType.AT_DP;
          break;
        default:
          type = TokenType.AT_UNKNOWN;
          break;
      }
      emit2(type, fullValue, startLine, startCol, startPos);
      continue;
    }
    if (ch === '"') {
      advanceState(s, source);
      let str = '"';
      while (s.pos < source.length) {
        const sc = charAt(source, s.pos);
        if (sc === "\\") {
          str += sc;
          advanceState(s, source);
          const esc = charAt(source, s.pos);
          str += esc;
          advanceState(s, source);
        } else if (sc === '"') {
          str += sc;
          advanceState(s, source);
          break;
        } else if (sc === "\n") {
          break;
        } else {
          str += sc;
          advanceState(s, source);
        }
      }
      emit2(TokenType.STRING, str, startLine, startCol, startPos);
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let num = "";
      while (s.pos < source.length && /[0-9]/.test(charAt(source, s.pos))) {
        num += charAt(source, s.pos);
        s.pos++;
        s.col++;
      }
      const durationUnit = charAt(source, s.pos);
      const afterUnit = charAt(source, s.pos + 1);
      if (/[smhd]/.test(durationUnit) && !isIdentChar(afterUnit)) {
        num += durationUnit;
        s.pos++;
        s.col++;
        emit2(TokenType.DURATION, num, startLine, startCol, startPos);
        continue;
      }
      if (s.pos < source.length && charAt(source, s.pos) === ".") {
        num += ".";
        s.pos++;
        s.col++;
        while (s.pos < source.length && /[0-9]/.test(charAt(source, s.pos))) {
          num += charAt(source, s.pos);
          s.pos++;
          s.col++;
        }
      }
      emit2(TokenType.NUMBER, num, startLine, startCol, startPos);
      continue;
    }
    if (isIdentStart(ch)) {
      let ident = "";
      while (s.pos < source.length && isIdentChar(charAt(source, s.pos))) {
        ident += charAt(source, s.pos);
        s.pos++;
        s.col++;
      }
      emit2(TokenType.IDENT, ident, startLine, startCol, startPos);
      continue;
    }
    advanceState(s, source);
    switch (ch) {
      case "{":
        if (s.waitingForPanelBrace) {
          s.inPanel = true;
          s.panelBraceDepth = 1;
          s.waitingForPanelBrace = false;
        } else if (s.inPanel) {
          s.panelBraceDepth++;
        }
        emit2(TokenType.LBRACE, ch, startLine, startCol, startPos);
        break;
      case "}":
        if (s.inPanel) {
          s.panelBraceDepth--;
          if (s.panelBraceDepth === 0) {
            s.inPanel = false;
          }
        }
        emit2(TokenType.RBRACE, ch, startLine, startCol, startPos);
        break;
      case "<":
        emit2(TokenType.LANGLE, ch, startLine, startCol, startPos);
        break;
      case ">":
        emit2(TokenType.RANGLE, ch, startLine, startCol, startPos);
        break;
      case "(":
        emit2(TokenType.LPAREN, ch, startLine, startCol, startPos);
        break;
      case ")":
        emit2(TokenType.RPAREN, ch, startLine, startCol, startPos);
        break;
      case "[":
        emit2(TokenType.LBRACKET, ch, startLine, startCol, startPos);
        break;
      case "]":
        emit2(TokenType.RBRACKET, ch, startLine, startCol, startPos);
        break;
      case ":":
        emit2(TokenType.COLON, ch, startLine, startCol, startPos);
        break;
      case ",":
        emit2(TokenType.COMMA, ch, startLine, startCol, startPos);
        break;
      case ".":
        emit2(TokenType.DOT, ch, startLine, startCol, startPos);
        break;
      case "=":
        emit2(TokenType.EQUALS, ch, startLine, startCol, startPos);
        break;
      case "*":
        emit2(TokenType.STAR, ch, startLine, startCol, startPos);
        break;
      default:
        emit2(TokenType.UNKNOWN, ch, startLine, startCol, startPos);
        break;
    }
  }
  emit2(TokenType.EOF, "", s.line, s.col, s.pos);
  return tokens;
}

// ../parser/dist/types.js
var PRIMITIVE_TYPES = /* @__PURE__ */ new Set([
  "string",
  "number",
  "bool",
  "date",
  "bytes"
]);

// ../parser/dist/parser.js
var KNOWN_ROD_TYPES = /* @__PURE__ */ new Set([
  "read-data",
  "write-data",
  "receive",
  "respond",
  "call",
  "transform",
  "filter",
  "group",
  "aggregate",
  "merge",
  "join",
  "window",
  "guard",
  "store",
  "validate",
  "pseudonymize",
  "encrypt",
  "split"
]);
var Parser = class {
  tokens;
  cursor = 0;
  diagnostics = [];
  source;
  constructor(source) {
    this.source = source;
    this.tokens = tokenize(source);
  }
  // ---- token cursor helpers ----
  peek(offset = 0) {
    const idx = this.cursor + offset;
    return this.tokens[idx] ?? this.eofToken();
  }
  eofToken() {
    const last = this.tokens[this.tokens.length - 1];
    return last ?? { type: TokenType.EOF, value: "", line: 1, col: 1, length: 0, offset: 0 };
  }
  consume() {
    const tok = this.peek();
    if (tok.type !== TokenType.EOF)
      this.cursor++;
    return tok;
  }
  /** Consume if the next token matches `type`; otherwise add diagnostic and return null. */
  expect(type, context) {
    const tok = this.peek();
    if (tok.type === type) {
      return this.consume();
    }
    this.addError("E000", `Expected ${type}${context ? ` ${context}` : ""} but got ${tok.type} (${JSON.stringify(tok.value)})`, tok);
    return null;
  }
  /** Skip tokens until NEWLINE, RBRACE, or EOF (error recovery). */
  recover() {
    while (true) {
      const tok = this.peek();
      if (tok.type === TokenType.EOF || tok.type === TokenType.NEWLINE || tok.type === TokenType.RBRACE) {
        break;
      }
      this.consume();
    }
  }
  addError(code, message, tok) {
    this.diagnostics.push({
      code,
      message,
      severity: "error",
      line: tok.line,
      col: tok.col,
      length: tok.length > 0 ? tok.length : 1
    });
  }
  addWarning(code, message, tok) {
    this.diagnostics.push({
      code,
      message,
      severity: "warning",
      line: tok.line,
      col: tok.col,
      length: tok.length > 0 ? tok.length : 1
    });
  }
  loc(tok) {
    return { line: tok.line, col: tok.col };
  }
  // ---- skip NEWLINEs ----
  skipNewlines() {
    while (this.peek().type === TokenType.NEWLINE)
      this.consume();
  }
  // -------------------------------------------------------------------------
  // parseFile — top-level dispatcher
  // -------------------------------------------------------------------------
  parseFile() {
    const ast = [];
    while (this.peek().type !== TokenType.EOF) {
      const tok = this.peek();
      if (tok.type === TokenType.AT_TYPE) {
        const node = this.parseTypeDecl();
        if (node !== null)
          ast.push(node);
      } else if (tok.type === TokenType.AT_PANEL) {
        const node = this.parsePanel();
        if (node !== null)
          ast.push(node);
      } else if (tok.type === TokenType.AT_CONTEXT) {
        this.consume();
        this.consume();
        if (this.peek().type === TokenType.LBRACE) {
          this.skipBlock();
        }
      } else if (tok.type === TokenType.NEWLINE) {
        this.consume();
      } else {
        this.consume();
        this.addError("E000", `Unexpected token at top level: ${JSON.stringify(tok.value)}`, tok);
        this.recover();
        if (this.peek().type === TokenType.NEWLINE)
          this.consume();
      }
    }
    return { ast, diagnostics: this.diagnostics };
  }
  // -------------------------------------------------------------------------
  // @type declarations
  // -------------------------------------------------------------------------
  parseTypeDecl() {
    const atTok = this.consume();
    const nameTok = this.peek();
    if (nameTok.type !== TokenType.IDENT) {
      this.addError("E000", "Expected type name after @type", atTok);
      this.recover();
      return null;
    }
    this.consume();
    const name = nameTok.value;
    if (this.peek().type === TokenType.LBRACE) {
      return this.parseRecord(name, this.loc(atTok));
    } else if (this.peek().type === TokenType.EQUALS) {
      this.consume();
      const kw = this.peek();
      if (kw.type === TokenType.IDENT && kw.value === "enum") {
        return this.parseEnum(name, this.loc(atTok));
      } else if (kw.type === TokenType.IDENT && kw.value === "union") {
        return this.parseUnion(name, this.loc(atTok));
      } else {
        this.addError("E000", `Expected 'enum' or 'union' after '=' in @type declaration, got ${JSON.stringify(kw.value)}`, kw);
        this.recover();
        return null;
      }
    } else {
      this.addError("E000", `Expected '{' or '=' after type name '${name}'`, this.peek());
      this.recover();
      return null;
    }
  }
  /** Parse `{ field: Type, ... }` record body (assumes @type Name already consumed). */
  parseRecord(name, loc) {
    const lbrace = this.expect(TokenType.LBRACE, "opening '{' of record");
    if (lbrace === null)
      return null;
    const fields = [];
    while (this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
      this.skipNewlines();
      if (this.peek().type === TokenType.RBRACE || this.peek().type === TokenType.EOF)
        break;
      const fieldTok = this.peek();
      if (fieldTok.type !== TokenType.IDENT) {
        this.addError("E000", `Expected field name, got ${JSON.stringify(fieldTok.value)}`, fieldTok);
        this.recover();
        continue;
      }
      this.consume();
      const fieldName = fieldTok.value;
      if (this.expect(TokenType.COLON, `':' after field '${fieldName}'`) === null) {
        this.recover();
        continue;
      }
      const typeExpr = this.parseTypeExpr();
      if (typeExpr === null) {
        this.recover();
        continue;
      }
      fields.push({ name: fieldName, type: typeExpr });
      if (this.peek().type === TokenType.COMMA)
        this.consume();
      this.skipNewlines();
    }
    const rbraceTok = this.peek();
    if (this.expect(TokenType.RBRACE, "closing '}' of record") === null) {
      this.addError("E001", `Unclosed '{' in record type '${name}'`, rbraceTok);
      return null;
    }
    return { kind: "record", name, fields, loc };
  }
  /** Parse `enum { val1, val2 }` (assumes @type Name = already consumed). */
  parseEnum(name, loc) {
    this.consume();
    const lbrace = this.expect(TokenType.LBRACE, "'{' after enum");
    if (lbrace === null)
      return null;
    const variants = [];
    while (this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
      this.skipNewlines();
      if (this.peek().type === TokenType.RBRACE || this.peek().type === TokenType.EOF)
        break;
      const vTok = this.peek();
      if (vTok.type !== TokenType.IDENT) {
        this.addError("E000", `Expected enum variant name, got ${JSON.stringify(vTok.value)}`, vTok);
        this.recover();
        break;
      }
      this.consume();
      variants.push(vTok.value);
      if (this.peek().type === TokenType.COMMA)
        this.consume();
      this.skipNewlines();
    }
    const rbraceTok = this.peek();
    if (this.expect(TokenType.RBRACE, "closing '}' of enum") === null) {
      this.addError("E001", `Unclosed '{' in enum type '${name}'`, rbraceTok);
      return null;
    }
    return { kind: "enum", name, variants, loc };
  }
  /** Parse `union { tag: Type, ... }` (assumes @type Name = already consumed). */
  parseUnion(name, loc) {
    this.consume();
    const lbrace = this.expect(TokenType.LBRACE, "'{' after union");
    if (lbrace === null)
      return null;
    const variants = [];
    while (this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
      this.skipNewlines();
      if (this.peek().type === TokenType.RBRACE || this.peek().type === TokenType.EOF)
        break;
      const tagTok = this.peek();
      if (tagTok.type !== TokenType.IDENT) {
        this.addError("E000", `Expected union variant tag, got ${JSON.stringify(tagTok.value)}`, tagTok);
        this.recover();
        break;
      }
      this.consume();
      const tag = tagTok.value;
      if (this.expect(TokenType.COLON, `':' after union variant '${tag}'`) === null) {
        this.recover();
        continue;
      }
      const typeExpr = this.parseTypeExpr();
      if (typeExpr === null) {
        this.recover();
        continue;
      }
      variants.push({ tag, type: typeExpr });
      if (this.peek().type === TokenType.COMMA)
        this.consume();
      this.skipNewlines();
    }
    const rbraceTok = this.peek();
    if (this.expect(TokenType.RBRACE, "closing '}' of union") === null) {
      this.addError("E001", `Unclosed '{' in union type '${name}'`, rbraceTok);
      return null;
    }
    return { kind: "union", name, variants, loc };
  }
  /** Parse a type expression: `string`, `Optional<T>`, `Map<K,V>`, `MyType`. */
  parseTypeExpr() {
    const tok = this.peek();
    if (tok.type !== TokenType.IDENT) {
      this.addError("E000", `Expected type expression, got ${JSON.stringify(tok.value)}`, tok);
      return null;
    }
    this.consume();
    const name = tok.value;
    if (this.peek().type === TokenType.LANGLE) {
      this.consume();
      const args2 = [];
      while (this.peek().type !== TokenType.RANGLE && this.peek().type !== TokenType.EOF) {
        const arg = this.parseTypeExpr();
        if (arg === null) {
          this.recover();
          break;
        }
        args2.push(arg);
        if (this.peek().type === TokenType.COMMA)
          this.consume();
      }
      this.expect(TokenType.RANGLE, "closing '>' of container type");
      return { kind: "container", container: name, args: args2 };
    }
    if (this.peek().type === TokenType.LBRACKET) {
      if (name === "string") {
        this.consume();
        const values = [];
        while (this.peek().type !== TokenType.RBRACKET && this.peek().type !== TokenType.EOF) {
          const vTok = this.peek();
          if (vTok.type !== TokenType.STRING) {
            this.addError("E000", `Expected string literal in string constraint, got ${JSON.stringify(vTok.value)}`, vTok);
            this.recover();
            break;
          }
          this.consume();
          values.push(vTok.value);
          if (this.peek().type === TokenType.COMMA)
            this.consume();
        }
        this.expect(TokenType.RBRACKET, "closing ']' of string constraint");
        return { kind: "constrained-string", values };
      }
      if (name === "number") {
        this.consume();
        const minTok = this.peek();
        if (minTok.type !== TokenType.NUMBER) {
          this.addError("E000", `Expected number in numeric range constraint, got ${JSON.stringify(minTok.value)}`, minTok);
          this.recover();
          return { kind: "primitive", name: "number" };
        }
        this.consume();
        const min = Number(minTok.value);
        const dot1 = this.peek();
        if (dot1.type !== TokenType.IDENT || dot1.value !== "..") {
          if (this.peek().type === TokenType.IDENT && this.peek().value.startsWith("..")) {
            this.consume();
          } else {
            this.addError("E000", `Expected '..' in numeric range constraint`, dot1);
            this.recover();
            return { kind: "primitive", name: "number" };
          }
        } else {
          this.consume();
        }
        const maxTok = this.peek();
        if (maxTok.type !== TokenType.NUMBER) {
          this.addError("E000", `Expected number after '..' in numeric range constraint, got ${JSON.stringify(maxTok.value)}`, maxTok);
          this.recover();
          return { kind: "primitive", name: "number" };
        }
        this.consume();
        const max = Number(maxTok.value);
        this.expect(TokenType.RBRACKET, "closing ']' of numeric range constraint");
        return { kind: "constrained-number", min, max };
      }
    }
    if (PRIMITIVE_TYPES.has(name)) {
      return { kind: "primitive", name };
    }
    return { kind: "named", name };
  }
  // -------------------------------------------------------------------------
  // @panel
  // -------------------------------------------------------------------------
  parsePanel() {
    const atTok = this.consume();
    const nameTok = this.peek();
    if (nameTok.type !== TokenType.IDENT) {
      this.addError("E000", "Expected panel name after @panel", atTok);
      this.recover();
      return null;
    }
    this.consume();
    const name = nameTok.value;
    if (this.peek().type !== TokenType.LBRACE) {
      this.addError("E001", `Expected '{' to open panel '${name}'`, this.peek());
      this.recover();
      return null;
    }
    this.consume();
    let dp;
    let access;
    const rods = [];
    this.skipNewlines();
    while (this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
      const tok = this.peek();
      if (tok.type === TokenType.AT_DP) {
        this.consume();
        const block = this.parseKnotBlock();
        dp = block;
        this.skipNewlines();
        continue;
      }
      if (tok.type === TokenType.AT_ACCESS) {
        this.consume();
        access = this.parseAccessBlock();
        this.skipNewlines();
        continue;
      }
      if (tok.type === TokenType.NEWLINE) {
        this.consume();
        continue;
      }
      if (tok.type === TokenType.IDENT) {
        const rod = this.parseRod();
        if (rod !== null)
          rods.push(rod);
        this.skipNewlines();
        continue;
      }
      this.addError("E000", `Unexpected token inside panel '${name}': ${JSON.stringify(tok.value)}`, tok);
      this.recover();
      this.skipNewlines();
    }
    const rbraceTok = this.peek();
    if (rbraceTok.type !== TokenType.RBRACE) {
      this.addError("E001", `Unclosed '{' in panel '${name}'`, rbraceTok);
      return null;
    }
    this.consume();
    if (access === void 0) {
      this.addWarning("W001", `Panel '${name}' is missing an @access block`, atTok);
    }
    return { kind: "panel", name, dp, access, rods, loc: this.loc(atTok) };
  }
  /** Parse `{ key: value, ... }` knot block (for @dp, rod bodies, nested configs). */
  parseKnotBlock() {
    const result = {};
    if (this.peek().type !== TokenType.LBRACE) {
      this.addError("E000", "Expected '{' for block", this.peek());
      return result;
    }
    this.consume();
    this.skipNewlines();
    while (this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
      if (this.peek().type === TokenType.NEWLINE) {
        this.consume();
        continue;
      }
      const keyTok = this.peek();
      if (keyTok.type !== TokenType.IDENT) {
        this.addError("E000", `Expected key in block, got ${JSON.stringify(keyTok.value)}`, keyTok);
        this.recover();
        break;
      }
      this.consume();
      const key = keyTok.value;
      if (this.expect(TokenType.COLON, `':' after key '${key}'`) === null) {
        this.recover();
        continue;
      }
      const value = this.parseKnotValue(key);
      result[key] = value;
      if (this.peek().type === TokenType.COMMA)
        this.consume();
      this.skipNewlines();
    }
    this.expect(TokenType.RBRACE, "closing '}' of block");
    return result;
  }
  /** Parse `@access { ... }` into a PanelAccessNode. */
  parseAccessBlock() {
    const fields = this.parseKnotBlock();
    return { kind: "access", fields };
  }
  // -------------------------------------------------------------------------
  // Rod parsing
  // -------------------------------------------------------------------------
  /** Parse `name = rod-type { knots }`. Handles optional nested `@ops { ... }` inside rod body. */
  parseRod() {
    const nameTok = this.consume();
    const rodName = nameTok.value;
    if (this.expect(TokenType.EQUALS, `'=' after rod name '${rodName}'`) === null) {
      this.recover();
      return null;
    }
    const typeTok = this.peek();
    if (typeTok.type !== TokenType.IDENT) {
      this.addError("E000", `Expected rod type after '=', got ${JSON.stringify(typeTok.value)}`, typeTok);
      this.recover();
      return null;
    }
    this.consume();
    const rodType = typeTok.value;
    if (!KNOWN_ROD_TYPES.has(rodType)) {
      this.addError("E002", `Unknown rod type '${rodType}'. Known types: ${[...KNOWN_ROD_TYPES].join(", ")}`, typeTok);
    }
    const { knots, ops } = this.parseRodBody();
    return { kind: "rod", name: rodName, rodType, knots, ops, loc: this.loc(nameTok) };
  }
  /**
   * Parse a rod body block `{ ... }`, allowing both `key: value` pairs
   * and a nested `@ops { ... }` decorator block.
   */
  parseRodBody() {
    const knots = {};
    let ops;
    if (this.peek().type !== TokenType.LBRACE) {
      this.addError("E000", "Expected '{' for rod body", this.peek());
      return { knots, ops };
    }
    this.consume();
    this.skipNewlines();
    while (this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
      if (this.peek().type === TokenType.NEWLINE) {
        this.consume();
        continue;
      }
      if (this.peek().type === TokenType.AT_UNKNOWN && this.peek().value === "@ops") {
        this.consume();
        ops = this.parseKnotBlock();
        this.skipNewlines();
        continue;
      }
      const keyTok = this.peek();
      if (keyTok.type !== TokenType.IDENT) {
        this.addError("E000", `Expected key in rod body, got ${JSON.stringify(keyTok.value)}`, keyTok);
        this.recover();
        break;
      }
      this.consume();
      const key = keyTok.value;
      if (this.expect(TokenType.COLON, `':' after key '${key}'`) === null) {
        this.recover();
        continue;
      }
      const value = this.parseKnotValue(key);
      knots[key] = value;
      if (this.peek().type === TokenType.COMMA)
        this.consume();
      this.skipNewlines();
    }
    this.expect(TokenType.RBRACE, "closing '}' of rod body");
    return { knots, ops };
  }
  // -------------------------------------------------------------------------
  // Knot value parsing
  // -------------------------------------------------------------------------
  /**
   * Parse the value of a knot. Handles:
   * - string literals: `"value"`
   * - number literals: `5432`
   * - bool: `true` / `false`
   * - type paths with optional block: `db.sql.postgres { ... }`, `http { ... }`, `Proposal`
   * - raw expressions: `status == "submitted"`, `env("DB_HOST")`, etc.
   * - nested blocks: `{ key: val }`
   */
  parseKnotValue(_key = "") {
    const tok = this.peek();
    if (tok.type === TokenType.STRING) {
      this.consume();
      const raw = tok.value;
      const inner = raw.slice(1, raw.length - 1).replace(/\\"/g, '"');
      return { kind: "string", value: inner };
    }
    if (tok.type === TokenType.NUMBER) {
      this.consume();
      return { kind: "number", value: parseFloat(tok.value) };
    }
    if (tok.type === TokenType.DURATION) {
      this.consume();
      const raw = tok.value;
      const unit = raw[raw.length - 1];
      const value = parseFloat(raw.slice(0, -1));
      return { kind: "duration", value, unit };
    }
    if (tok.type === TokenType.IDENT) {
      if (tok.value === "true") {
        this.consume();
        return { kind: "bool", value: true };
      }
      if (tok.value === "false") {
        this.consume();
        return { kind: "bool", value: false };
      }
      const startOffset = tok.offset;
      const segments = this.parseDotPath();
      const next = this.peek();
      if (next.type === TokenType.LBRACE) {
        const config = this.parseKnotBlock();
        return { kind: "path", segments, config };
      }
      if (next.type !== TokenType.COMMA && next.type !== TokenType.RBRACE && next.type !== TokenType.NEWLINE && next.type !== TokenType.EOF && next.type !== TokenType.COLON) {
        return this.captureRawExpr(startOffset);
      }
      return { kind: "path", segments };
    }
    if (tok.type === TokenType.LBRACE) {
      const config = this.parseKnotBlock();
      return { kind: "block", config };
    }
    return this.captureRawExpr(tok.offset);
  }
  /**
   * Parse a dot-separated identifier path: `a`, `a.b`, `a.b.c`.
   * Emits E003 if a segment is missing (e.g. trailing dot or double dot).
   */
  parseDotPath() {
    const segments = [];
    const firstTok = this.peek();
    if (firstTok.type !== TokenType.IDENT)
      return segments;
    this.consume();
    segments.push(firstTok.value);
    while (this.peek().type === TokenType.DOT) {
      const dotTok = this.consume();
      const segTok = this.peek();
      if (segTok.type !== TokenType.IDENT) {
        this.addError("E003", `Malformed type path: expected identifier after '.' but got ${JSON.stringify(segTok.value)}`, dotTok);
        break;
      }
      this.consume();
      segments.push(segTok.value);
    }
    return segments;
  }
  /**
   * Capture a raw expression as text by reading tokens until a stopping point.
   *
   * Stopping points: COMMA or RBRACE at nesting depth 0, NEWLINE, EOF.
   * Text is reconstructed by slicing the source string.
   *
   * @param startOffset - Byte offset where the expression begins in source.
   *   The cursor may already be past this position (when called after parseDotPath
   *   has consumed tokens). Tokens from cursor onward are consumed until the stop.
   */
  captureRawExpr(startOffset) {
    let exprEnd = startOffset;
    if (this.cursor > 0) {
      const lastConsumed = this.tokens[this.cursor - 1];
      if (lastConsumed !== void 0 && lastConsumed.offset >= startOffset) {
        exprEnd = lastConsumed.offset + lastConsumed.length;
      }
    }
    let braceDepth = 0;
    while (true) {
      const t = this.peek();
      if (t.type === TokenType.EOF)
        break;
      if (t.type === TokenType.NEWLINE)
        break;
      if (t.type === TokenType.COMMA && braceDepth === 0)
        break;
      if (t.type === TokenType.RBRACE && braceDepth === 0)
        break;
      if (t.type === TokenType.LBRACE)
        braceDepth++;
      else if (t.type === TokenType.RBRACE)
        braceDepth--;
      this.consume();
      exprEnd = t.offset + t.length;
    }
    const text = this.source.slice(startOffset, exprEnd).trim();
    return { kind: "raw-expr", text };
  }
  // -------------------------------------------------------------------------
  // Utility: skip an entire { ... } block (used for @context)
  // -------------------------------------------------------------------------
  skipBlock() {
    if (this.peek().type !== TokenType.LBRACE)
      return;
    this.consume();
    let depth = 1;
    while (depth > 0 && this.peek().type !== TokenType.EOF) {
      const t = this.consume();
      if (t.type === TokenType.LBRACE)
        depth++;
      else if (t.type === TokenType.RBRACE)
        depth--;
    }
  }
};
function parse(source) {
  const parser = new Parser(source);
  return parser.parseFile();
}

// ../generator/dist/types.js
var UnknownTargetError = class extends Error {
  constructor(framework) {
    super(`No adapter registered for target: "${framework}"`);
    this.name = "UnknownTargetError";
  }
};

// ../generator/dist/registry.js
var registry = /* @__PURE__ */ new Map();
function registerAdapter(framework, adapter) {
  registry.set(framework, adapter);
}
function getAdapter(framework) {
  const adapter = registry.get(framework);
  if (adapter === void 0)
    throw new UnknownTargetError(framework);
  return adapter;
}

// ../generator/dist/generate.js
function stubResolved(framework) {
  const stub = (name) => ({ name, version: "0.0.0", adapter: "stub" });
  return {
    framework: stub(framework),
    orm: stub("prisma"),
    validation: stub("zod"),
    runtime: stub("node")
  };
}
function build(ast, manifest, options) {
  const resolved = resolveOptions(options);
  const adapter = getAdapter(resolved.framework.name);
  const files = adapter.emit(ast, manifest, resolved);
  const pkg2 = adapter.package(files);
  return { files, pkg: pkg2 };
}
function resolveOptions(options) {
  if (typeof options.framework === "object" && options.framework !== null && "name" in options.framework) {
    return options;
  }
  const legacy = options;
  if (legacy.resolved !== void 0)
    return legacy.resolved;
  const frameworkName = typeof legacy.framework === "string" ? legacy.framework : "next";
  return stubResolved(frameworkName);
}

// ../generator/dist/promote.js
function promoteTypeExpr(pt) {
  if (pt.kind === "primitive") {
    return { kind: "PrimitiveType", name: pt.name };
  }
  if (pt.kind === "named") {
    return { kind: "TypeRef", name: pt.name };
  }
  if (pt.kind === "constrained-string") {
    return { kind: "ConstrainedStringType", values: pt.values };
  }
  if (pt.kind === "constrained-number") {
    return { kind: "ConstrainedNumberType", min: pt.min, max: pt.max };
  }
  return {
    kind: "ContainerType",
    container: pt.container,
    typeArgs: pt.args.map(promoteTypeExpr)
  };
}
function promoteKnotValue(kv) {
  if (kv.kind === "string")
    return { kind: "LitString", value: kv.value };
  if (kv.kind === "number")
    return { kind: "LitNumber", value: kv.value };
  if (kv.kind === "bool")
    return { kind: "LitBool", value: kv.value };
  if (kv.kind === "duration")
    return { kind: "LitDuration", value: kv.value, unit: kv.unit };
  if (kv.kind === "path")
    return { kind: "TypeRef", name: kv.segments.join("."), segments: kv.segments, config: kv.config ? promoteBlock(kv.config) : void 0 };
  if (kv.kind === "raw-expr")
    return { kind: "RawExpr", text: kv.text };
  return promoteBlock(kv.config);
}
function promoteBlock(config) {
  const out = {};
  for (const [k, v] of Object.entries(config)) {
    out[k] = promoteKnotValue(v);
  }
  return out;
}
function promote(ast) {
  const result = [];
  for (const node of ast) {
    if (node.kind === "record") {
      const promoted = {
        kind: "TypeRecord",
        name: node.name,
        fields: node.fields.map((f) => ({
          name: f.name,
          type: promoteTypeExpr(f.type)
        }))
      };
      result.push(promoted);
      continue;
    }
    if (node.kind === "enum") {
      const promoted = {
        kind: "TypeEnum",
        name: node.name,
        variants: node.variants
      };
      result.push(promoted);
      continue;
    }
    if (node.kind === "union") {
      const promoted = {
        kind: "TypeUnion",
        name: node.name,
        variants: node.variants.map((v) => ({
          tag: v.tag,
          type: promoteTypeExpr(v.type)
        }))
      };
      result.push(promoted);
      continue;
    }
    if (node.kind === "panel") {
      const rods = node.rods.map((rod) => {
        const cfg = {};
        for (const [k, v] of Object.entries(rod.knots)) {
          cfg[k] = promoteKnotValue(v);
        }
        return {
          kind: "Rod",
          name: rod.name,
          rodType: rod.rodType,
          cfg,
          arg: {}
        };
      });
      const rawAccess = node.access;
      const intent = rawAccess ? {
        purpose: String(rawAccess["purpose"] ?? ""),
        basis: String(rawAccess["basis"] ?? ""),
        operation: String(rawAccess["operation"] ?? ""),
        urgency: "routine"
      } : void 0;
      const access = {
        kind: "AccessContext",
        intent
      };
      const promoted = {
        kind: "Panel",
        name: node.name,
        dp: node.dp ? promoteBlock(node.dp) : {},
        access,
        rods,
        snaps: []
      };
      result.push(promoted);
    }
  }
  return result;
}

// ../generator/dist/config.js
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
var ENTRY_RE = /^(@?[a-zA-Z0-9_/.-]+)@(.+)$/;
function parseEntry(raw, field) {
  const m = ENTRY_RE.exec(raw.trim());
  if (!m) {
    throw new ConfigParseError(`Invalid ${field} entry "${raw}": expected "<name>@<semver-range>"`);
  }
  return { name: m[1] ?? "", range: m[2] ?? "" };
}
function parseConfig(yaml) {
  const lines = yaml.split("\n");
  let section = "none";
  const raw = {};
  const sourceGlobs = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#"))
      continue;
    if (!line.startsWith(" ") && !line.startsWith("	")) {
      if (trimmed === "target:") {
        section = "target";
        continue;
      }
      if (trimmed === "source:") {
        section = "source";
        continue;
      }
      if (trimmed === "output:") {
        section = "output";
        continue;
      }
      section = "none";
      continue;
    }
    if (section === "target") {
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx === -1)
        continue;
      const key = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();
      raw[key] = value;
    }
    if (section === "source") {
      const listMatch = trimmed.match(/^-\s+"(.+)"$/) ?? trimmed.match(/^-\s+'(.+)'$/) ?? trimmed.match(/^-\s+(.+)$/);
      if (listMatch)
        sourceGlobs.push(listMatch[1].trim());
    }
  }
  const required = ["base", "framework", "orm", "validation", "runtime"];
  for (const key of required) {
    if (!raw[key]) {
      throw new ConfigParseError(`Missing required target field "${key}" in strux.config.yaml`);
    }
  }
  return {
    base: parseEntry(raw["base"], "base"),
    framework: parseEntry(raw["framework"], "framework"),
    orm: parseEntry(raw["orm"], "orm"),
    validation: parseEntry(raw["validation"], "validation"),
    runtime: parseEntry(raw["runtime"], "runtime"),
    source: sourceGlobs
  };
}
function loadConfig(projectRoot) {
  const configPath = resolve(projectRoot, "strux.config.yaml");
  let yaml;
  try {
    yaml = readFileSync(configPath, "utf-8");
  } catch {
    throw new ConfigParseError(`strux.config.yaml not found at ${configPath}. Run "strux init" to create it.`);
  }
  return parseConfig(yaml);
}
var ConfigParseError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigParseError";
  }
};

// ../generator/dist/resolve.js
var BUNDLED_MANIFESTS = [
  {
    name: "adapter/nextjs",
    version: "1.0.0",
    supports: {
      framework: "next@>=13.0 <17.0",
      base: "typescript@>=5.0",
      orm: ["prisma@>=5.0 <8.0"],
      validation: ["zod@>=3.0"],
      runtime: ["node@>=18", "bun@>=1.0"]
    }
  }
];
function satisfies(version, range) {
  const v = parseVersion(version);
  if (v === null)
    return false;
  const terms = range.trim().split(/\s+/).filter(Boolean);
  return terms.every((term) => satisfiesTerm(v, term));
}
function parseVersion(v) {
  const m = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(v.trim());
  if (!m)
    return null;
  return {
    major: parseInt(m[1] ?? "0", 10),
    minor: parseInt(m[2] ?? "0", 10),
    patch: parseInt(m[3] ?? "0", 10)
  };
}
function cmp(a, b) {
  if (a.major !== b.major)
    return a.major - b.major;
  if (a.minor !== b.minor)
    return a.minor - b.minor;
  return a.patch - b.patch;
}
function satisfiesTerm(v, term) {
  if (term.startsWith("^")) {
    const base2 = parseVersion(term.slice(1));
    if (!base2)
      return false;
    if (base2.major === 0) {
      return v.major === 0 && v.minor === base2.minor && v.patch >= base2.patch;
    }
    return v.major === base2.major && cmp(v, base2) >= 0;
  }
  if (term.startsWith("~")) {
    const base2 = parseVersion(term.slice(1));
    if (!base2)
      return false;
    return v.major === base2.major && v.minor === base2.minor && v.patch >= base2.patch;
  }
  if (term.startsWith(">=")) {
    const base2 = parseVersion(term.slice(2));
    return base2 !== null && cmp(v, base2) >= 0;
  }
  if (term.startsWith(">")) {
    const base2 = parseVersion(term.slice(1));
    return base2 !== null && cmp(v, base2) > 0;
  }
  if (term.startsWith("<=")) {
    const base2 = parseVersion(term.slice(2));
    return base2 !== null && cmp(v, base2) <= 0;
  }
  if (term.startsWith("<")) {
    const base2 = parseVersion(term.slice(1));
    return base2 !== null && cmp(v, base2) < 0;
  }
  if (term.startsWith("=")) {
    const base2 = parseVersion(term.slice(1));
    return base2 !== null && cmp(v, base2) === 0;
  }
  const base = parseVersion(term);
  return base !== null && cmp(v, base) === 0;
}
function rangeIntersects(configRange, manifestRange) {
  const configLower = extractLowerBound(configRange);
  if (configLower !== null && satisfiesAllRanges(configLower, manifestRange))
    return true;
  const manifestLower = extractLowerBound(manifestRange);
  if (manifestLower !== null && satisfiesAllRanges(manifestLower, configRange))
    return true;
  return false;
}
function extractLowerBound(range) {
  const term = range.trim().split(/\s+/)[0] ?? "";
  const version = term.replace(/^[~^>=<]+/, "");
  return version || null;
}
function satisfiesAllRanges(version, range) {
  return satisfies(version, range);
}
var AdapterResolutionError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "AdapterResolutionError";
  }
};
function resolveField(configEntry, adapterName) {
  const version = extractLowerBound(configEntry.range) ?? configEntry.range;
  return {
    name: configEntry.name,
    version,
    adapter: adapterName
  };
}
function resolveOptions2(config, manifests = BUNDLED_MANIFESTS) {
  const manifest = manifests.find((m) => {
    const fw = Array.isArray(m.supports.framework) ? m.supports.framework : [m.supports.framework];
    return fw.some((r) => {
      const range = r.includes("@") ? r.slice(r.indexOf("@") + 1) : r;
      return rangeIntersects(config.framework.range, range);
    });
  });
  if (!manifest) {
    throw new AdapterResolutionError(`No adapter found for framework "${config.framework.name}@${config.framework.range}". Available adapters: ${manifests.map((m) => m.name).join(", ")}`);
  }
  return {
    framework: resolveField(config.framework, manifest.name),
    orm: resolveField(config.orm, manifest.name),
    validation: resolveField(config.validation, manifest.name),
    runtime: resolveField(config.runtime, manifest.name)
  };
}

// ../generator/dist/adapters/ts-base/types.js
function tsType(expr) {
  switch (expr.kind) {
    case "PrimitiveType": {
      switch (expr.name) {
        case "string":
          return "string";
        case "number":
          return "number";
        case "bool":
          return "boolean";
        case "date":
          return "Date";
        case "bytes":
          return "Buffer";
        default:
          return expr.name;
      }
    }
    case "ContainerType": {
      const inner = tsType(expr.typeArgs[0] ?? { kind: "PrimitiveType", name: "unknown" });
      switch (expr.container) {
        case "Optional":
          return `${inner} | null`;
        case "Batch":
          return `${inner}[]`;
        case "Stream":
          return `AsyncIterable<${inner}>`;
        case "Single":
          return inner;
        case "Map":
          return `Record<string, ${inner}>`;
        default:
          return `${expr.container}<${inner}>`;
      }
    }
    case "ConstrainedNumberType":
      return "number";
    case "ConstrainedStringType":
      return expr.values.map((v) => JSON.stringify(v)).join(" | ");
    case "TypeRef":
      return expr.name;
    default:
      return "unknown";
  }
}
function prismaType(expr, _enumNames) {
  switch (expr.kind) {
    case "PrimitiveType": {
      switch (expr.name) {
        case "string":
          return "String";
        case "number":
          return "Float";
        case "bool":
          return "Boolean";
        case "date":
          return "DateTime";
        case "bytes":
          return "Bytes";
        default:
          return "String";
      }
    }
    case "ContainerType": {
      const inner = prismaType(expr.typeArgs[0] ?? { kind: "PrimitiveType", name: "string" }, _enumNames);
      switch (expr.container) {
        case "Optional":
          return `${inner}?`;
        case "Batch":
          return `${inner}[]`;
        case "Map":
          return "Json";
        default:
          return inner;
      }
    }
    case "ConstrainedNumberType":
      return "Float";
    case "ConstrainedStringType":
      return "String";
    case "TypeRef":
      return expr.name;
    default:
      return "String";
  }
}
function zodType(expr, enumNames) {
  switch (expr.kind) {
    case "PrimitiveType": {
      switch (expr.name) {
        case "string":
          return "z.string()";
        case "number":
          return "z.number()";
        case "bool":
          return "z.boolean()";
        case "date":
          return "z.coerce.date()";
        case "bytes":
          return "z.instanceof(Buffer)";
        default:
          return "z.unknown()";
      }
    }
    case "ContainerType": {
      const inner = zodType(expr.typeArgs[0] ?? { kind: "PrimitiveType", name: "string" }, enumNames);
      switch (expr.container) {
        case "Optional":
          return `${inner}.nullable()`;
        case "Batch":
          return `${inner}.array()`;
        default:
          return inner;
      }
    }
    case "ConstrainedNumberType":
      return `z.number().min(${expr.min}).max(${expr.max})`;
    case "ConstrainedStringType":
      return `z.enum([${expr.values.map((v) => JSON.stringify(v)).join(", ")}])`;
    case "TypeRef":
      if (enumNames.has(expr.name))
        return `z.nativeEnum(${expr.name})`;
      return `z.lazy(() => ${expr.name}Schema)`;
    default:
      return "z.unknown()";
  }
}
function collectTypeRefs(expr) {
  if (expr.kind === "TypeRef")
    return [expr.name];
  if (expr.kind === "ContainerType")
    return expr.typeArgs.flatMap(collectTypeRefs);
  return [];
}

// ../generator/dist/adapters/ts-base/emitters.js
var FILE_HEADER = "// generated by openstrux-generator \u2014 do not edit\n";
function emitRecord(node, enumNames, prismaBlocks) {
  const refNames = /* @__PURE__ */ new Set();
  for (const f of node.fields) {
    for (const ref of collectTypeRefs(f.type)) {
      if (ref !== node.name)
        refNames.add(ref);
    }
  }
  const importLines = Array.from(refNames).sort().map((r) => `import type { ${r} } from "./${r}.js";`).join("\n");
  const importBlock = importLines ? `
${importLines}
` : "";
  const fields = node.fields.map((f) => `  ${f.name}: ${tsType(f.type)};`).join("\n");
  const content = `${FILE_HEADER}${importBlock}
export interface ${node.name} {
${fields}
}
`;
  const prismaFields = node.fields.map((f) => {
    const pt = prismaType(f.type, enumNames);
    return `  ${f.name.padEnd(16)} ${pt}`;
  }).join("\n");
  prismaBlocks.push(`model ${node.name} {
${prismaFields}
}`);
  return { path: `types/${node.name}.ts`, content, lang: "typescript" };
}
function emitEnum(node, prismaBlocks) {
  const variants = node.variants.map((v) => `  ${v} = "${v}",`).join("\n");
  const content = `${FILE_HEADER}
export enum ${node.name} {
${variants}
}
`;
  prismaBlocks.push(`enum ${node.name} {
${node.variants.map((v) => `  ${v}`).join("\n")}
}`);
  return { path: `types/${node.name}.ts`, content, lang: "typescript" };
}
function emitUnion(node) {
  const refNames = /* @__PURE__ */ new Set();
  for (const v of node.variants) {
    for (const ref of collectTypeRefs(v.type)) {
      if (ref !== node.name)
        refNames.add(ref);
    }
  }
  const importLines = Array.from(refNames).sort().map((r) => `import type { ${r} } from "./${r}.js";`).join("\n");
  const importBlock = importLines ? `
${importLines}
` : "";
  const variants = node.variants.map((v) => `  | { kind: "${v.tag}"; value: ${tsType(v.type)} }`).join("\n");
  const content = `${FILE_HEADER}${importBlock}
export type ${node.name} =
${variants}
  ;
`;
  return { path: `types/${node.name}.ts`, content, lang: "typescript" };
}
function emitZodSchema(typeName, node, enumNames) {
  const fields = node.fields.map((f) => `  ${f.name}: ${zodType(f.type, enumNames)},`).join("\n");
  const enumImports = [];
  for (const f of node.fields) {
    if (f.type.kind === "TypeRef" && enumNames.has(f.type.name)) {
      enumImports.push(f.type.name);
    }
    if (f.type.kind === "ContainerType" && f.type.typeArgs[0]?.kind === "TypeRef") {
      const ref = f.type.typeArgs[0];
      if (ref.kind === "TypeRef" && enumNames.has(ref.name))
        enumImports.push(ref.name);
    }
  }
  const importLines = enumImports.length > 0 ? enumImports.map((e) => `import { ${e} } from "../types/${e}.js";`).join("\n") + "\n" : "";
  const content = `${FILE_HEADER}
import { z } from "zod";
${importLines}
export const ${typeName}Schema = z.object({
${fields}
});

export type ${typeName}Input = z.infer<typeof ${typeName}Schema>;
`;
  return { path: `schemas/${typeName}.schema.ts`, content, lang: "typescript" };
}
var PRISMA_HEADER = `// generated by openstrux-generator \u2014 do not edit

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`;
function emitPrismaSchema(prismaBlocks) {
  const content = PRISMA_HEADER + "\n" + prismaBlocks.join("\n\n") + "\n";
  return { path: "prisma/schema.prisma", content, lang: "prisma" };
}

// ../generator/dist/adapters/nextjs/rods/receive.js
function emitReceive(_rod, _ctx) {
  return {
    imports: [{ names: ["NextRequest", "NextResponse"], from: "next/server" }],
    statement: "const body = await req.json();",
    outputVar: "body",
    outputType: "unknown"
  };
}

// ../generator/dist/adapters/nextjs/rods/validate.js
function emitValidate(rod, ctx) {
  const typeName = getSchemaTypeName(rod);
  if (typeName === null) {
    return {
      imports: [],
      statement: `// STRUX-STUB: validate \u2014 ${rod.name} \u2014 schema type unresolved`,
      outputVar: ctx.inputVar,
      outputType: ctx.inputType
    };
  }
  return {
    imports: [
      { names: [`${typeName}Schema`], from: `../schemas/${typeName}.schema.js` }
    ],
    statement: `const input = ${typeName}Schema.parse(${ctx.inputVar});`,
    outputVar: "input",
    outputType: `${typeName}Input`
  };
}
function getSchemaTypeName(rod) {
  const schemaCfg = rod.cfg["schema"];
  if (schemaCfg === void 0)
    return null;
  if (schemaCfg["kind"] === "TypeRef" && typeof schemaCfg["name"] === "string") {
    return schemaCfg["name"];
  }
  return null;
}

// ../generator/dist/adapters/nextjs/rods/guard.js
function emitGuard(_rod, ctx) {
  const panelName = ctx.panel.name ?? "unknown";
  const pascal = panelName.split(/[-_]/).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
  return {
    imports: [{ names: ["withGuard"], from: `../guards/${panelName}.guard.js` }],
    statement: `// guard: see guards/${panelName}.guard.ts`,
    outputVar: ctx.inputVar,
    outputType: `${pascal}AccessContext`
  };
}

// ../generator/dist/adapters/nextjs/rods/write-data.js
function emitWriteData(_rod, ctx) {
  const modelName = deriveModelName(ctx.inputType);
  return {
    imports: [{ names: ["prisma"], from: "../lib/prisma.js" }],
    statement: `const result = await prisma.${modelName}.create({ data: ${ctx.inputVar} });`,
    outputVar: "result",
    outputType: modelName.charAt(0).toUpperCase() + modelName.slice(1)
  };
}
function deriveModelName(inputType) {
  const base = inputType.endsWith("Input") ? inputType.slice(0, -5) : inputType;
  return base.charAt(0).toLowerCase() + base.slice(1);
}

// ../generator/dist/adapters/nextjs/rods/read-data.js
function emitReadData(_rod, ctx) {
  const modelName = deriveModelName2(ctx.inputType);
  return {
    imports: [{ names: ["prisma"], from: "../lib/prisma.js" }],
    statement: `const result = await prisma.${modelName}.findMany();`,
    outputVar: "result",
    outputType: `${modelName.charAt(0).toUpperCase() + modelName.slice(1)}[]`
  };
}
function deriveModelName2(inputType) {
  const base = inputType.endsWith("Input") ? inputType.slice(0, -5) : inputType;
  const clean = base.endsWith("[]") ? base.slice(0, -2) : base;
  return clean.charAt(0).toLowerCase() + clean.slice(1);
}

// ../generator/dist/adapters/nextjs/rods/respond.js
function emitRespond(_rod, ctx) {
  return {
    imports: [],
    statement: `return NextResponse.json(${ctx.inputVar}, { status: 201 });`,
    outputVar: "(returned)",
    outputType: "NextResponse"
  };
}

// ../generator/dist/adapters/nextjs/rods/transform.js
function emitTransform(rod, ctx) {
  const inType = getCfgTypeName(rod, "in") ?? ctx.inputType;
  const outType = getCfgTypeName(rod, "out") ?? "unknown";
  const fnName = `transform${toPascal(rod.name)}`;
  return {
    imports: [],
    // The stub helper function is injected as a preamble by the chain composer
    statement: `const result = ${fnName}(${ctx.inputVar} as ${inType});`,
    outputVar: "result",
    outputType: outType,
    // Extra field used by chain composer to emit a preamble function
    ...{ _helperFn: buildHelperFn(fnName, inType, outType, rod.name) }
  };
}
function getTransformHelper(step) {
  return step._helperFn;
}
function buildHelperFn(fnName, inType, outType, rodName) {
  return [
    `function ${fnName}(input: ${inType}): ${outType} {`,
    `  // STRUX-STUB: transform \u2014 ${rodName} \u2014 expression not lowered`,
    `  throw new Error("not implemented");`,
    `}`
  ].join("\n");
}
function getCfgTypeName(rod, key) {
  const val = rod.cfg[key];
  if (val === void 0)
    return void 0;
  if (val["kind"] === "TypeRef" && typeof val["name"] === "string")
    return val["name"];
  if (typeof val["resolvedType"] === "string")
    return val["resolvedType"];
  return void 0;
}
function toPascal(name) {
  return name.split(/[-_]/).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}

// ../generator/dist/adapters/nextjs/rods/filter.js
function emitFilter(_rod, ctx) {
  return {
    imports: [],
    statement: `const result = (${ctx.inputVar} as unknown[]).filter((item) => item);`,
    outputVar: "result",
    outputType: "unknown[]"
  };
}

// ../generator/dist/adapters/nextjs/rods/split.js
function emitSplit(rod, ctx) {
  const routes = getRouteNames(rod);
  const cases = routes.map((r) => [
    `  case "${r}":`,
    `    // STRUX-STUB: split branch \u2014 ${r}`,
    `    break;`
  ].join("\n")).join("\n");
  const stmt = routes.length > 0 ? `switch ((${ctx.inputVar} as { kind?: string }).kind) {
${cases}
}` : `// STRUX-STUB: split \u2014 ${rod.name} \u2014 no routes defined`;
  return {
    imports: [],
    statement: stmt,
    outputVar: ctx.inputVar,
    outputType: ctx.inputType
  };
}
function getRouteNames(rod) {
  const routesArg = rod.arg["routes"];
  if (routesArg === void 0)
    return [];
  if (routesArg["kind"] === "SplitRoutesExpr") {
    const expr = routesArg;
    return expr.routes.map((r) => r.name);
  }
  return [];
}

// ../generator/dist/adapters/nextjs/rods/call.js
function emitCall(rod, _ctx) {
  const endpoint = getCfgString(rod, "endpoint") ?? "TODO: endpoint";
  const method = getCfgString(rod, "method") ?? "GET";
  return {
    imports: [],
    statement: `const result = await fetch("${endpoint}", { method: "${method}" }).then(r => r.json());`,
    outputVar: "result",
    outputType: "unknown"
  };
}
function getCfgString(rod, key) {
  const val = rod.cfg[key];
  if (val === void 0)
    return void 0;
  if (val["kind"] === "LitString" && typeof val["value"] === "string")
    return val["value"];
  if (typeof val === "string")
    return val;
  return void 0;
}

// ../generator/dist/adapters/nextjs/rods/pseudonymize.js
function emitPseudonymize(_rod, ctx) {
  const fields = getScopeFields(ctx.panel);
  const fieldsDoc = fields.length > 0 ? fields.join(", ") : "TODO: specify fields";
  return {
    imports: [],
    statement: [
      `/**`,
      ` * @compliance pseudonymize`,
      ` * @access scope.fieldMask: ${fieldsDoc}`,
      ` */`,
      `const result = await pseudonymize(${ctx.inputVar}, ctx);`
    ].join("\n"),
    outputVar: "result",
    outputType: ctx.inputType
  };
}
function getScopeFields(panel) {
  const access = panel.access;
  const fieldMask = access?.scope?.fieldMask;
  if (Array.isArray(fieldMask))
    return [...fieldMask];
  return [];
}

// ../generator/dist/adapters/nextjs/rods/encrypt.js
function emitEncrypt(_rod, ctx) {
  const fields = getScopeFields2(ctx.panel);
  const fieldsDoc = fields.length > 0 ? fields.join(", ") : "TODO: specify fields";
  return {
    imports: [],
    statement: [
      `/**`,
      ` * @compliance encrypt`,
      ` * @access scope.fieldMask: ${fieldsDoc}`,
      ` */`,
      `const result = await encrypt(${ctx.inputVar}, ctx);`
    ].join("\n"),
    outputVar: "result",
    outputType: ctx.inputType
  };
}
function getScopeFields2(panel) {
  const access = panel.access;
  const fieldMask = access?.scope?.fieldMask;
  if (Array.isArray(fieldMask))
    return [...fieldMask];
  return [];
}

// ../generator/dist/adapters/nextjs/rods/tier2.js
function makeStub(rodType) {
  return (rod, ctx) => ({
    imports: [],
    statement: `// STRUX-STUB: ${rodType} \u2014 ${rod.name} \u2014 not implemented in v0.6`,
    outputVar: ctx.inputVar,
    outputType: ctx.inputType
  });
}
var emitGroup = makeStub("group");
var emitAggregate = makeStub("aggregate");
var emitMerge = makeStub("merge");
var emitJoin = makeStub("join");
var emitWindow = makeStub("window");
var emitStore = makeStub("store");

// ../generator/dist/adapters/nextjs/rods/index.js
var TIER2_ROD_TYPES = /* @__PURE__ */ new Set([
  "group",
  "aggregate",
  "merge",
  "join",
  "window"
]);
var ROD_STEP_EMITTERS = {
  "receive": emitReceive,
  "validate": emitValidate,
  "guard": emitGuard,
  "write-data": emitWriteData,
  "read-data": emitReadData,
  "respond": emitRespond,
  "transform": emitTransform,
  "filter": emitFilter,
  "split": emitSplit,
  "call": emitCall,
  "pseudonymize": emitPseudonymize,
  "encrypt": emitEncrypt,
  "store": emitStore,
  "group": emitGroup,
  "aggregate": emitAggregate,
  "merge": emitMerge,
  "join": emitJoin,
  "window": emitWindow
};
function dispatchRodStep(rod, ctx) {
  const emitter = ROD_STEP_EMITTERS[rod.rodType];
  if (emitter !== void 0)
    return emitter(rod, ctx);
  console.warn(`[openstrux-generator] Unrecognised rod type "${rod.rodType}" \u2014 emitting stub`);
  return {
    imports: [],
    statement: `// STRUX-STUB: ${rod.rodType} \u2014 ${rod.name} \u2014 unrecognised rod type`,
    outputVar: ctx.inputVar,
    outputType: ctx.inputType
  };
}
function isTier2Rod(rodType) {
  return TIER2_ROD_TYPES.has(rodType);
}

// ../generator/dist/adapters/nextjs/chain.js
var FILE_HEADER2 = "// generated by openstrux-generator \u2014 do not edit\n";
function httpMethod(rod) {
  const trigger = rod.cfg["trigger"];
  if (trigger !== void 0 && typeof trigger === "object") {
    const t = trigger;
    const directMethod = t["method"];
    if (typeof directMethod === "string")
      return directMethod.toUpperCase();
    const config = t["config"];
    if (config !== void 0) {
      const m = config["method"];
      if (m?.["kind"] === "LitString" && typeof m["value"] === "string") {
        return m["value"].toUpperCase();
      }
    }
    if (t["kind"] === "ObjectValue" && typeof t["fields"] === "object" && t["fields"] !== null) {
      const fields = t["fields"];
      const methodVal = fields["method"];
      if (methodVal?.["kind"] === "LitString" && typeof methodVal["value"] === "string") {
        return methodVal["value"].toUpperCase();
      }
    }
    if (t["kind"] === "ObjectValue" && Array.isArray(t["fields"])) {
      for (const entry of t["fields"]) {
        if (entry["key"] === "method" && entry["value"] && typeof entry["value"] === "object") {
          const mv = entry["value"];
          if (mv["kind"] === "LitString" && typeof mv["value"] === "string") {
            return mv["value"].toUpperCase();
          }
        }
      }
    }
  }
  return "GET";
}
function mergeImports(all) {
  const map = /* @__PURE__ */ new Map();
  for (const decl of all) {
    const existing = map.get(decl.from);
    if (existing === void 0) {
      map.set(decl.from, new Set(decl.names));
    } else {
      for (const n of decl.names)
        existing.add(n);
    }
  }
  return Array.from(map.entries()).map(([from, names]) => ({
    names: Array.from(names).sort(),
    from
  }));
}
function renderImports(imports) {
  return imports.map((d) => `import { ${d.names.join(", ")} } from "${d.from}";`).join("\n");
}
function composeHandler(panelName, rods, panel) {
  const receiveRod = rods.find((r) => r.rodType === "receive");
  const method = receiveRod ? httpMethod(receiveRod) : "GET";
  const rodSteps = [];
  let currentVar = "req";
  let currentType = "NextRequest";
  for (const rod of rods) {
    const ctx = {
      panel,
      previousSteps: rodSteps.map((rs) => rs.step),
      inputVar: currentVar,
      inputType: currentType
    };
    const step = dispatchRodStep(rod, ctx);
    rodSteps.push({ rod, step });
    if (step.outputVar !== "(returned)") {
      currentVar = step.outputVar;
      currentType = step.outputType;
    }
  }
  const allImports = [
    { names: ["NextRequest", "NextResponse"], from: "next/server" },
    ...rodSteps.flatMap((rs) => rs.step.imports)
  ];
  const mergedImports = mergeImports(allImports);
  const preambles = [];
  for (const { step } of rodSteps) {
    const helper = getTransformHelper(step);
    if (helper !== void 0)
      preambles.push(helper);
  }
  const bodyLines = [];
  for (const { rod, step } of rodSteps) {
    if (rod.rodType === "receive") {
      bodyLines.unshift(`  ${step.statement}`);
      continue;
    }
    for (const line of step.statement.split("\n")) {
      bodyLines.push(`  ${line}`);
    }
  }
  const hasReturn = rodSteps.some((rs) => rs.step.outputVar === "(returned)");
  if (!hasReturn) {
    const statusCode = method === "POST" ? 201 : 200;
    bodyLines.push(`  return NextResponse.json(${currentVar}, { status: ${statusCode} });`);
  }
  const preambleBlock = preambles.length > 0 ? "\n" + preambles.join("\n\n") + "\n" : "";
  const importBlock = renderImports(mergedImports);
  const content = [
    FILE_HEADER2,
    importBlock,
    preambleBlock,
    `export async function ${method}(req: NextRequest): Promise<NextResponse> {`,
    bodyLines.join("\n"),
    `}`,
    ``
  ].join("\n");
  return { path: `handlers/${panelName}.ts`, content, lang: "typescript" };
}

// ../generator/dist/adapters/nextjs/index.js
var FILE_HEADER3 = "// generated by openstrux-generator \u2014 do not edit\n";
function emitGuardFile(panel, _guardRod) {
  const panelName = panel.name;
  const access = panel.access;
  const intent = access?.["intent"];
  const purpose = intent ? String(intent["purpose"] ?? "") : "";
  const operation = intent ? String(intent["operation"] ?? "") : "";
  const pascal = panelName.split(/[-_]/).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
  const content = `${FILE_HEADER3}
import { NextRequest, NextResponse } from "next/server";
import type { AccessContext } from "@openstrux/runtime";

export interface ${pascal}AccessContext extends AccessContext {
  purpose: "${purpose}";
  operation: "${operation}";
}

export async function withGuard(
  req: NextRequest,
  handler: (req: NextRequest, ctx: ${pascal}AccessContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const ctx = {} as ${pascal}AccessContext;
  return handler(req, ctx);
}
`;
  return { path: `guards/${panelName}.guard.ts`, content, lang: "typescript" };
}
var PRISMA_UTIL = {
  path: "lib/prisma.ts",
  lang: "typescript",
  content: `${FILE_HEADER3}
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
`
};
function emit(ast, _manifest, _options) {
  const files = [];
  const prismaBlocks = [];
  let hasPrisma = false;
  const enumNames = /* @__PURE__ */ new Set();
  for (const node of ast) {
    if (node.kind === "TypeEnum")
      enumNames.add(node.name);
  }
  const recordMap = /* @__PURE__ */ new Map();
  for (const node of ast) {
    if (node.kind === "TypeRecord")
      recordMap.set(node.name, node);
  }
  for (const node of ast) {
    switch (node.kind) {
      case "TypeRecord":
        files.push(emitRecord(node, enumNames, prismaBlocks));
        break;
      case "TypeEnum":
        files.push(emitEnum(node, prismaBlocks));
        break;
      case "TypeUnion":
        files.push(emitUnion(node));
        break;
    }
  }
  for (const node of ast) {
    if (node.kind !== "Panel")
      continue;
    const panel = node;
    const rods = panel.rods;
    const guardRod = rods.find((r) => r.rodType === "guard");
    const validateRods = rods.filter((r) => r.rodType === "validate");
    const hasWrite = rods.some((r) => r.rodType === "write-data" || r.rodType === "store");
    const hasRead = rods.some((r) => r.rodType === "read-data");
    const routeRodTypes = /* @__PURE__ */ new Set(["receive", "respond", "store", "write-data", "read-data", "call", "split", "transform", "filter", "validate", "guard", "pseudonymize", "encrypt", "group", "aggregate", "merge", "join", "window"]);
    if (rods.some((r) => routeRodTypes.has(r.rodType))) {
      files.push(composeHandler(panel.name, rods, panel));
    }
    if (guardRod !== void 0) {
      files.push(emitGuardFile(panel, guardRod));
    }
    for (const rod of validateRods) {
      const schemaCfg = rod.cfg["schema"];
      if (schemaCfg?.["kind"] === "TypeRef" && typeof schemaCfg["name"] === "string") {
        const typeName = schemaCfg["name"];
        const record = recordMap.get(typeName);
        if (record !== void 0) {
          files.push(emitZodSchema(typeName, record, enumNames));
        }
      }
    }
    if (hasWrite || hasRead)
      hasPrisma = true;
  }
  if (prismaBlocks.length > 0) {
    files.push(emitPrismaSchema(prismaBlocks));
  }
  if (hasPrisma) {
    files.push(PRISMA_UTIL);
  }
  emitSummary(ast);
  return files;
}
function pkg(files) {
  const typePaths = files.filter((f) => f.path.startsWith("types/")).map((f) => f.path);
  const schemaPaths = files.filter((f) => f.path.startsWith("schemas/") && !f.path.endsWith("index.ts")).map((f) => f.path);
  const handlerPaths = files.filter((f) => f.path.startsWith("handlers/") && !f.path.endsWith("index.ts")).map((f) => f.path);
  const allRootExports = typePaths.map((p) => {
    const name = p.replace("types/", "").replace(".ts", "");
    const isEnum = files.find((f) => f.path === p)?.content.includes("export enum ");
    const keyword = isEnum === true ? "" : "type ";
    return { name, line: `export ${keyword}{ ${name} } from "./${p.replace(".ts", ".js")}";` };
  });
  allRootExports.sort((a, b) => a.name.localeCompare(b.name));
  const rootIndex = {
    path: "index.ts",
    lang: "typescript",
    content: `${FILE_HEADER3}
${allRootExports.map((e) => e.line).join("\n")}
`
  };
  const schemaExports = schemaPaths.flatMap((p) => {
    const name = p.replace("schemas/", "").replace(".schema.ts", "");
    return [
      `export { ${name}Schema } from "./${name}.schema.js";`,
      `export type { ${name}Input } from "./${name}.schema.js";`
    ];
  });
  const schemasIndex = {
    path: "schemas/index.ts",
    lang: "typescript",
    content: `${FILE_HEADER3}
${schemaExports.join("\n")}
`
  };
  const handlerExports = handlerPaths.map((p) => {
    const panelName = p.replace("handlers/", "").replace(".ts", "");
    const camel = panelName.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    return `export { POST as ${camel} } from "./${panelName}.js";`;
  });
  const handlersIndex = {
    path: "handlers/index.ts",
    lang: "typescript",
    content: `${FILE_HEADER3}
${handlerExports.join("\n")}
`
  };
  const packageJson = {
    path: "package.json",
    lang: "json",
    content: JSON.stringify({
      name: "@openstrux/build",
      version: "0.0.0",
      private: true,
      type: "module",
      exports: {
        ".": { types: "./index.ts" },
        "./schemas": { types: "./schemas/index.ts" },
        "./handlers": { types: "./handlers/index.ts" }
      }
    }, null, 2) + "\n"
  };
  const tsconfigJson = {
    path: "tsconfig.json",
    lang: "json",
    content: JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        strict: true,
        declaration: true,
        composite: true,
        outDir: "./dist"
      }
    }, null, 2) + "\n"
  };
  return {
    outputDir: ".openstrux/build",
    metadata: [packageJson, tsconfigJson],
    entrypoints: [rootIndex, schemasIndex, handlersIndex]
  };
}
function emitSummary(ast) {
  let tier1Count = 0;
  let tier2Count = 0;
  const stubPanels = [];
  for (const node of ast) {
    if (node.kind !== "Panel")
      continue;
    const panel = node;
    const rods = panel.rods;
    let panelHasStub = false;
    for (const rod of rods) {
      if (isTier2Rod(rod.rodType)) {
        tier2Count++;
        panelHasStub = true;
      } else if (!TIER2_ROD_TYPES.has(rod.rodType))
        tier1Count++;
    }
    if (panelHasStub)
      stubPanels.push(panel.name);
  }
  if (tier1Count === 0 && tier2Count === 0)
    return;
  console.log(`[openstrux-generator] Summary: ${tier1Count} Tier 1 rod(s) emitted, ${tier2Count} Tier 2 stub(s) emitted`);
  if (stubPanels.length > 0) {
    console.log(`[openstrux-generator] Non-demo-capable panels (contain Tier 2 stubs): ${stubPanels.join(", ")}`);
  }
}
var NextJsAdapter = {
  name: "nextjs",
  emit,
  package: pkg
};

// ../generator/dist/index.js
registerAdapter("next", NextJsAdapter);

// src/commands/build.ts
async function runBuild(projectRoot = process.cwd()) {
  let config;
  try {
    config = loadConfig(projectRoot);
  } catch (e) {
    if (e instanceof ConfigParseError) {
      console.error(`strux: config error \u2014 ${e.message}`);
      process.exit(1);
    }
    throw e;
  }
  let resolved;
  try {
    resolved = resolveOptions2(config);
  } catch (e) {
    if (e instanceof AdapterResolutionError) {
      console.error(`strux: adapter resolution failed \u2014 ${e.message}`);
      process.exit(1);
    }
    throw e;
  }
  const sourceGlobs = Array.isArray(config.source) ? config.source : [];
  const struxFiles = findStruxFiles(projectRoot, sourceGlobs);
  if (struxFiles.length === 0) {
    console.warn("strux: no .strux files matched source globs in strux.config.yaml. Nothing to build.");
    return;
  }
  const allNodes = [];
  for (const filePath of struxFiles) {
    const source = readFileSync2(filePath, "utf-8");
    const result = parse(source);
    if (result.diagnostics && result.diagnostics.length > 0) {
      const rel = relative(projectRoot, filePath);
      console.error(`strux: parse error in ${rel}:`);
      for (const err of result.diagnostics) {
        console.error(`  ${err.severity.toUpperCase()} ${err.code} [${err.line}:${err.col}] ${err.message}`);
      }
      process.exit(1);
    }
    allNodes.push(...promote(result.ast));
  }
  const { files, pkg: pkg2 } = build(allNodes, {}, resolved);
  const outDir = resolve2(projectRoot, pkg2.outputDir);
  const allFiles = [...files, ...pkg2.metadata, ...pkg2.entrypoints];
  for (const file of allFiles) {
    const filePath = join(outDir, file.path);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, file.content, "utf-8");
  }
  console.log(
    `strux: \u2713 built ${allFiles.length} files \u2192 ${pkg2.outputDir}/`
  );
}
function findStruxFiles(root, sourceGlobs) {
  const results = [];
  const IGNORE = /* @__PURE__ */ new Set(["node_modules", ".git", ".openstrux", "dist"]);
  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (IGNORE.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith(".strux")) {
        const rel = relative(root, full);
        if (sourceGlobs.length === 0 || sourceGlobs.some((g) => matchesGlob(rel, g))) {
          results.push(full);
        }
      }
    }
  }
  walk(root);
  return results;
}

// src/commands/init.ts
import {
  readFileSync as readFileSync3,
  writeFileSync as writeFileSync2,
  existsSync,
  appendFileSync,
  mkdirSync as mkdirSync2
} from "node:fs";
import { join as join2 } from "node:path";
import { createInterface } from "node:readline";
function detectStack(projectRoot) {
  const pkgPath = join2(projectRoot, "package.json");
  if (!existsSync(pkgPath)) {
    return { framework: null, orm: null, validation: null, base: null, runtime: "node" };
  }
  const pkg2 = JSON.parse(readFileSync3(pkgPath, "utf-8"));
  const deps = {
    ...pkg2["dependencies"] ?? {},
    ...pkg2["devDependencies"] ?? {}
  };
  const resolve_version = (name) => {
    const raw = deps[name];
    if (!raw) return null;
    return raw.replace(/^[~^>=<]+/, "");
  };
  const nextVer = resolve_version("next");
  const prismaVer = resolve_version("prisma") ?? resolve_version("@prisma/client");
  const zodVer = resolve_version("zod");
  const tsVer = resolve_version("typescript");
  return {
    framework: nextVer ? `next@${nextVer}` : null,
    orm: prismaVer ? `prisma@${prismaVer}` : null,
    validation: zodVer ? `zod@${zodVer}` : null,
    base: tsVer ? `typescript@${tsVer}` : null,
    runtime: "node@>=20"
  };
}
function writeStruxConfig(projectRoot, stack) {
  const content = [
    `target:`,
    `  base: ${stack.base ?? "typescript@~5.5"}`,
    `  framework: ${stack.framework ?? "next@^15.0"}`,
    `  orm: ${stack.orm ?? "prisma@^6.0"}`,
    `  validation: ${stack.validation ?? "zod@^3.23"}`,
    `  runtime: ${stack.runtime}`,
    ``
  ].join("\n");
  writeFileSync2(join2(projectRoot, "strux.config.yaml"), content, "utf-8");
}
function configureTsconfig(projectRoot) {
  const tsconfigPath = join2(projectRoot, "tsconfig.json");
  if (!existsSync(tsconfigPath)) {
    console.warn("strux init: tsconfig.json not found \u2014 skipping path alias configuration");
    return;
  }
  let tsconfig;
  try {
    tsconfig = JSON.parse(readFileSync3(tsconfigPath, "utf-8"));
  } catch {
    console.warn("strux init: could not parse tsconfig.json \u2014 skipping path alias configuration");
    return;
  }
  const compilerOptions = tsconfig["compilerOptions"] ?? {};
  const existingPaths = compilerOptions["paths"] ?? {};
  existingPaths["@openstrux/build"] = [".openstrux/build"];
  existingPaths["@openstrux/build/*"] = [".openstrux/build/*"];
  compilerOptions["paths"] = existingPaths;
  tsconfig["compilerOptions"] = compilerOptions;
  writeFileSync2(tsconfigPath, JSON.stringify(tsconfig, null, 2) + "\n", "utf-8");
}
function addToGitignore(projectRoot) {
  const gitignorePath = join2(projectRoot, ".gitignore");
  const entry = ".openstrux/";
  if (existsSync(gitignorePath)) {
    const contents = readFileSync3(gitignorePath, "utf-8");
    if (contents.includes(entry)) return;
    appendFileSync(gitignorePath, `
${entry}
`, "utf-8");
  } else {
    writeFileSync2(gitignorePath, `${entry}
`, "utf-8");
  }
}
var STARTER_STRUX = `// starter.strux \u2014 generated by strux init

@type HealthCheck {
  status: string
  timestamp: date
}

@panel health {
  @access { purpose: "monitoring", operation: "read" }
  check = receive {
    trigger: http { method: "GET", path: "/health" }
  }
  respond-ok = respond {
    schema: HealthCheck
  }
}
`;
function writeStarterFile(projectRoot) {
  const dir = join2(projectRoot, "src", "strux");
  mkdirSync2(dir, { recursive: true });
  const filePath = join2(dir, "starter.strux");
  if (!existsSync(filePath)) {
    writeFileSync2(filePath, STARTER_STRUX, "utf-8");
  }
}
async function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve3) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve3(answer.trim());
    });
  });
}
async function runInit(projectRoot = process.cwd()) {
  const stack = detectStack(projectRoot);
  const manifest = BUNDLED_MANIFESTS[0];
  console.log("\n  Detected stack:");
  if (stack.framework) console.log(`    framework:  ${stack.framework}`);
  if (stack.orm) console.log(`    orm:        ${stack.orm}`);
  if (stack.validation) console.log(`    validation: ${stack.validation}`);
  if (stack.base) console.log(`    base:       ${stack.base}`);
  console.log(`    runtime:    ${stack.runtime}`);
  if (stack.framework && manifest) {
    console.log(`
  Adapter: ${manifest.name}@${manifest.version}`);
  } else {
    console.log(`
  Warning: no compatible adapter found for detected stack.`);
    console.log(`  Available adapters: ${BUNDLED_MANIFESTS.map((m) => m.name).join(", ")}`);
  }
  const answer = await prompt("\n  Proceed with detected stack? [Y/n] ");
  if (answer.toLowerCase() === "n") {
    console.log("  Aborted.");
    return;
  }
  writeStruxConfig(projectRoot, stack);
  console.log("  \u2713 Wrote strux.config.yaml");
  configureTsconfig(projectRoot);
  console.log("  \u2713 Configured tsconfig.json paths for @openstrux/build");
  addToGitignore(projectRoot);
  console.log("  \u2713 Added .openstrux/ to .gitignore");
  writeStarterFile(projectRoot);
  console.log("  \u2713 Wrote src/strux/starter.strux");
  await runBuild(projectRoot);
}

// src/commands/doctor.ts
import { readFileSync as readFileSync4, existsSync as existsSync2 } from "node:fs";
import { join as join3 } from "node:path";
function runDoctor(projectRoot = process.cwd()) {
  console.log("\nstrux doctor\n");
  let config;
  try {
    config = loadConfig(projectRoot);
  } catch (e) {
    if (e instanceof ConfigParseError) {
      console.log(`  \u2717 strux.config.yaml \u2014 ${e.message}`);
      console.log('\n  Run "strux init" to create a config file.');
      return;
    }
    throw e;
  }
  console.log("  \u2713 strux.config.yaml \u2014 found and parsed");
  console.log(`      framework:  ${config.framework.name}@${config.framework.range}`);
  console.log(`      orm:        ${config.orm.name}@${config.orm.range}`);
  console.log(`      validation: ${config.validation.name}@${config.validation.range}`);
  console.log(`      base:       ${config.base.name}@${config.base.range}`);
  console.log(`      runtime:    ${config.runtime.name}@${config.runtime.range}`);
  let resolved;
  try {
    resolved = resolveOptions2(config, BUNDLED_MANIFESTS);
    console.log(`
  \u2713 adapter resolved \u2014 ${resolved.framework.adapter}`);
  } catch (e) {
    if (e instanceof AdapterResolutionError) {
      console.log(`
  \u2717 adapter resolution failed \u2014 ${e.message}`);
      console.log("\n  Available adapters:");
      for (const m of BUNDLED_MANIFESTS) {
        console.log(`    ${m.name}@${m.version}`);
        console.log(`      framework: ${JSON.stringify(m.supports.framework)}`);
      }
    } else {
      throw e;
    }
  }
  const tsconfigPath = join3(projectRoot, "tsconfig.json");
  if (!existsSync2(tsconfigPath)) {
    console.log("\n  \u2717 tsconfig.json \u2014 not found");
  } else {
    try {
      const tsconfig = JSON.parse(readFileSync4(tsconfigPath, "utf-8"));
      const co = tsconfig["compilerOptions"];
      const paths = co?.["paths"];
      const hasBuild = paths?.["@openstrux/build"] !== void 0;
      const hasBuildStar = paths?.["@openstrux/build/*"] !== void 0;
      if (hasBuild && hasBuildStar) {
        console.log("\n  \u2713 tsconfig.json \u2014 @openstrux/build paths configured");
      } else {
        console.log("\n  \u2717 tsconfig.json \u2014 @openstrux/build paths not configured");
        if (!hasBuild) {
          console.log('      missing: "@openstrux/build": [".openstrux/build"]');
        }
        if (!hasBuildStar) {
          console.log('      missing: "@openstrux/build/*": [".openstrux/build/*"]');
        }
        console.log('  Run "strux init" to configure automatically.');
      }
    } catch {
      console.log("\n  \u2717 tsconfig.json \u2014 could not parse");
    }
  }
  console.log("\n");
}

// src/bin.ts
var STRUX_VERSION = true ? "0.6.0" : "0.0.0-dev";
var [, , command, ...args] = process.argv;
async function main() {
  switch (command) {
    case "--version":
    case "-V":
      console.log(STRUX_VERSION);
      break;
    case "build":
      await runBuild(args[0]);
      break;
    case "init":
      await runInit(args[0]);
      break;
    case "doctor":
      runDoctor(args[0]);
      break;
    default:
      console.log("strux \u2014 OpenStrux build tool\n");
      console.log("Usage:");
      console.log("  strux build   Build .strux files \u2192 .openstrux/build/");
      console.log("  strux init    Initialize project (detect stack, write config)");
      console.log("  strux doctor  Check config, adapters, and tsconfig paths");
      if (command) {
        console.error(`
Unknown command: ${command}`);
        process.exit(1);
      }
  }
}
main().catch((err) => {
  console.error("strux:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
