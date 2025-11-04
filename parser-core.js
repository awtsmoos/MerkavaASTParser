// B"H
// In parser-core.js -- A more robust, rectified loader
(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.MerkavahParserPromise = factory();
        root.MerkavahParserPromise
            .then(Parser => {
                root.MerkavahParser = Parser;
            })
            .catch(err => {
                console.error("Merkava Parser failed to load:", err)
            });
    }
}(typeof self !== 'undefined' ? self : this, function() {

    const getScriptPath = () => {
        try {
            if (document.currentScript) {
                return document.currentScript.src;
            }
            throw new Error();
        } catch (e) {
            const stackLine = e.stack.split('\n').find(line => line.includes('.js'));
            if (stackLine) {
                const match = stackLine.match(/(https?|file):\/\/[^\s):]+/);
                if (match) {
                    return match[0];
                }
            }
        }
        return './';
    };

    const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

    const initialize = async () => {
        let basePath = '';
        if (!isNode) {
            const fullPath = getScriptPath();
            basePath = fullPath.substring(0, fullPath.lastIndexOf('/') + 1);
        }

        const loadScript = (url) => {
            const fullUrl = basePath + url;
            if (isNode) {
                return Promise.resolve(require(fullUrl));
            }
            return new Promise((resolve, reject) => {
                if (typeof importScripts === 'function') {
                    try {
                        importScripts(fullUrl);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    const script = document.createElement('script');
                    script.src = fullUrl;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                }
            });
        };

        // --- 1. Load Core Dependencies First ---
        await loadScript('constants.js');
        await loadScript('Lexer.js');

        // --- 2. Define the Final Parser Class Structure ---
        const { Lexer, TOKEN, PRECEDENCES, PRECEDENCE } = self;

        // This guard clause will give a much better error if Lexer.js fails to load
        if (typeof Lexer !== 'function') {
            throw new Error(`[Shevirah] The Lexer class failed to load. Check that the path to Lexer.js is correct and the file is not empty.`);
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

            // --- All your core parser methods from the original file go here ---
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
                // A simple synchronization strategy: advance until a potential statement boundary
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
                         else break; // Break on non-parser errors
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

        // --- 3. Attach the REAL class to the global scope ---
        // This allows the extension files to find and modify its prototype.
        self.MerkavahParser = MerkavahParser;

        // --- 4. Load the extensions which will add methods to the prototype ---
        await loadScript('parser-expressions.js');
        await loadScript('parser-statements.js');
        await loadScript('parser-declarations.js');
        
        // --- 5. Return the now-complete and fully-extended class ---
        return self.MerkavahParser;
    };

    return initialize();
}));