// B"H
// B"H
(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        // Node.js: The factory returns a promise.
        module.exports = factory();
    } else {
        // Browser/Worker: The factory returns a promise which we attach to the window/self.
        root.MerkavahParserPromise = factory();
    }
}(typeof self !== 'undefined' ? self : this, function() {
    // This is the universal, promise-based factory.
    const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
    const isWorker = typeof importScripts === 'function';

    const loadScript = (path) => {
        if (isNode) {
            // In Node, just require it synchronously.
            return Promise.resolve(require(path));
        }
        // In Browser/Worker, load asynchronously.
        return new Promise((resolve, reject) => {
            const fullPath = basePath + path;
            if (isWorker) {
                try {
                    importScripts(fullPath);
                    resolve();
                } catch (e) { reject(new Error(`Worker importScripts failed for: ${fullPath}`)); }
            } else {
                const script = document.createElement('script');
                script.src = fullPath;
                script.onload = resolve;
                script.onerror = () => reject(new Error(`Script load failed for: ${fullPath}`));
                document.head.appendChild(script);
            }
        });
    };
    
    // Determine the base path for browser/worker loading.
    let basePath = '';
    if (!isNode) {
        try {
            const stackLine = (new Error()).stack.split('\n').find(line => line.includes('parser-core.js'));
            const fullPath = stackLine.match(/(https?|file):\/\/[^\s):]+/)[0];
            basePath = fullPath.substring(0, fullPath.lastIndexOf('/') + 1);
        } catch(e) { /* fallback to relative path */ }
    }

    const initialize = async () => {
        // Load dependencies in order
        await loadScript(isNode ? './constants.js' : 'constants.js');
        await loadScript(isNode ? './Lexer.js' : 'Lexer.js');
        
        // At this point, `Lexer` and `MerkavahConstants` are available globally or loaded.
        const { TOKEN, PRECEDENCES, PRECEDENCE } = isNode ? require('./constants.js') : self.MerkavahConstants;
        const LexerClass = isNode ? require('./Lexer.js') : self.Lexer;
        
        if (typeof LexerClass !== 'function') {
            throw new Error("[Shevirah] The Lexer class failed to load.");
        }

class MerkavahParser {
    constructor(s) {
        this.l = new Lexer(s);
        this.errors = [];
        this.panicMode = false;
        this.prevToken = null;
        this.currToken = null;
        this.peekToken = null;
        this.prefixParseFns = {};
        this.infixParseFns = {};
        this.recursionDepth = 0;
        this.maxRecursionDepth = 1500;
        this.parsingTemplateExpression = false;
        
        // Initialize tokens
        this.currToken = this.l.nextToken();
        this.peekToken = this.l.nextToken();
    }

    // --- Paste ALL your other core parser methods here ---
    // (Starting from _advance() and ending with parse())
    _advance() {
        this.prevToken = this.currToken;
        this.currToken = this.peekToken;
        this.peekToken = this.l.nextToken();
    }

    _peekTokenIs(t) { return this.peekToken.type === t; }
    _currTokenIs(t) { return this.currToken.type === t; }

    _startNode() {
        return {
            loc: {
                start: { line: this.currToken.line, column: this.currToken.column }
            }
        };
    }

    _finishNode(node, startNodeInfo) {
        const combinedNode = { ...startNodeInfo, ...node };
        const endToken = this.prevToken;
        if (endToken) {
            combinedNode.loc.end = {
                line: endToken.line,
                column: endToken.column + (endToken.literal?.length || 0)
            };
        }
        return combinedNode;
    }

    _error(m) {
        if (this.panicMode) return;
        this.panicMode = true;
        const msg = `[Shevirah] ${m} on line ${this.currToken.line}:${this.currToken.column}. Got token ${this.currToken.type} ("${this.currToken.literal}")`;
        this.errors.push(msg);
        throw new Error(msg);
    }

    _expect(t) {
        if (this._currTokenIs(t)) {
            this._advance();
            return true;
        }
        this._error(`Expected next token to be ${t}`);
    }

    _synchronize() {
        while (!this._currTokenIs(TOKEN.EOF)) {
            if (this.prevToken && this.prevToken.type === TOKEN.SEMICOLON) {
                this.panicMode = false;
                return;
            }
            switch (this.currToken.type) {
                case TOKEN.CLASS:
                case TOKEN.FUNCTION:
                case TOKEN.VAR:
                case TOKEN.CONST:
                case TOKEN.LET:
                case TOKEN.IF:
                case TOKEN.RETURN:
                    this.panicMode = false;
                    return;
            }
            this._advance();
        }
    }

    _consumeSemicolon() {
        if (this._currTokenIs(TOKEN.SEMICOLON)) {
            this._advance();
            return;
        }
        if (this._currTokenIs(TOKEN.RBRACE) || this._currTokenIs(TOKEN.EOF) || this.currToken.hasLineTerminatorBefore) {
            return;
        }
    }

    _getPrecedence(t) {
        return PRECEDENCES[t.type] || PRECEDENCE.LOWEST;
    }

    parse() {
        const program = {
            type: 'Program',
            body: [],
            sourceType: 'module',
            loc: { start: { line: 1, column: 0 } }
        };

        while (!this._currTokenIs(TOKEN.EOF)) {
            try {
                const stmt = this._parseDeclaration();
                if (stmt) {
                    program.body.push(stmt);
                }
            } catch (e) {
                 if(this.panicMode) this._synchronize();
                 else break;
            }
        }

        const endToken = this.prevToken || this.currToken;
        program.loc.end = {
            line: endToken.line,
            column: endToken.column + (endToken.literal?.length || 0)
        };
        program.comments = this.l.comments;
        return program;
    }
}
// Make the base class globally available for the extension files
        if (!isNode) self.MerkavahParser = MerkavahParser;

        // Load the extensions
        await loadScript(isNode ? './parser-expressions.js' : 'parser-expressions.js');
        await loadScript(isNode ? './parser-statements.js' : 'parser-statements.js');
        await loadScript(isNode ? './parser-declarations.js' : 'parser-declarations.js');

        return isNode ? module.require('./parser-core.js-node-export.js') : self.MerkavahParser;
    };
    
    // This intermediate file is needed to get around CommonJS caching issues when extensions modify the class.
    if(isNode) {
      const fs = require('fs');
      const nodeExportContent = "const proto = MerkavahParser.prototype; (function() { /* expressions */ })(); (function() { /* statements */ })(); (function() { /* declarations */ })(); module.exports = MerkavahParser;";
      const expContent = fs.readFileSync('./parser-expressions.js', 'utf8').replace(/.*\((proto)\).*\{/, '').slice(0, -1);
      const staContent = fs.readFileSync('./parser-statements.js', 'utf8').replace(/.*\((proto)\).*\{/, '').slice(0, -1);
      const decContent = fs.readFileSync('./parser-declarations.js', 'utf8').replace(/.*\((proto)\).*\{/, '').slice(0, -1);
      fs.writeFileSync('./parser-core.js-node-export.js', nodeExportContent.replace('/* expressions */', expContent).replace('/* statements */', staContent).replace('/* declarations */', decContent));
    }

    return initialize();
}));