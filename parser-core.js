// B"H
// In parser-core.js
class MerkabahParser {
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
	    
	    this.parsingTemplateExpression = false; // A flag to prevent recursion
	    

		this.currToken = this.l.nextToken();
		this.peekToken = this.l.nextToken();
	}

	_advance() {
		this.prevToken = this.currToken;
		this.currToken = this.peekToken;
		this.peekToken = this.l.nextToken();
	}
	
	_peekTokenIs(t) {
        return this.peekToken.type === t;
    }

	_currTokenIs(t) { 
	    return this.currToken.type === t; 
    }

	_startNode() { 
	    return { loc: { start: { line: this.currToken.line, column: this.currToken.column } } }; 
    }

	_finishNode(node, startNodeInfo) {
	    const combinedNode = { ...startNodeInfo, ...node };
	    const endToken = this.prevToken;
	    if (endToken) {
	        combinedNode.loc.end = { line: endToken.line, column: endToken.column + (endToken.literal?.length || 0) };
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
		if (this._currTokenIs(t)) { this._advance(); return true; }
		this._error(`Expected next token to be ${t}`);
	}

	_synchronize() {
	    throw new Error(`PARSER PANIC: Entering error recovery mode. The initial error was thrown while processing the token: Type=${this.currToken.type}, Literal="${this.currToken.literal}"`);
		
        // This logic is currently unreachable due to the error thrown above.
		this.panicMode = false;
		while (!this._currTokenIs(TOKEN.EOF)) {
			if (this.prevToken && this.prevToken.type === TOKEN.SEMICOLON) return;
			switch (this.currToken.type) {
				case TOKEN.CLASS: case TOKEN.FUNCTION: case TOKEN.VAR: case TOKEN.CONST: case TOKEN.LET:
				case TOKEN.IF: case TOKEN.FOR: case TOKEN.WHILE: case TOKEN.RETURN: case TOKEN.IMPORT:
				case TOKEN.EXPORT: case TOKEN.SWITCH:
					return;
			}
			this._advance();
		}
	}

    _consumeSemicolon() {
        if (this._currTokenIs(TOKEN.SEMICOLON)) { this._advance(); return; }
        if (this._currTokenIs(TOKEN.RBRACE) || this._currTokenIs(TOKEN.EOF) || this.currToken.hasLineTerminatorBefore) { return; }
    }

	_getPrecedence(t) { return PRECEDENCES[t.type] || PRECEDENCE.LOWEST; }

    parse() {
        const program = { type: 'Program', body: [], sourceType: 'module', loc: { start: { line: 1, column: 0 } } };

        while (!this._currTokenIs(TOKEN.EOF)) {
            const positionBeforeParse = this.l.position;

            try {
                const stmt = this._parseDeclaration();
                if (stmt) {
                    program.body.push(stmt);
                } else if (!this.panicMode) {
                    this._error(`Unexpected token: "${this.currToken.literal}" cannot start a statement.`);
                    this._advance(); 
                }
            } catch (e) {
                console.error("CAUGHT INITIAL ERROR:", e); 
                this._synchronize();
            }

            // This is the correct, robust infinite loop guard.
            if (this.l.position === positionBeforeParse && !this._currTokenIs(TOKEN.EOF)) {
                throw new Error(
                    `PARSER HALTED: Infinite loop detected. Main loop failed to advance.`
                );
            }
        }

        const endToken = this.prevToken || this.currToken;
        program.loc.end = { line: endToken.line, column: endToken.column + (endToken.literal?.length || 0) };
        return program;
    }
}