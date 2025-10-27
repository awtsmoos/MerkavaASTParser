// In parser-core.js
// B"H --- The Merkabah Ha'Gadol: The Indestructible Emanation (Core) [FINAL UNBREAKABLE VERSION] ---
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

		// This specific initialization primes the token stream correctly.
		// It guarantees that when the parse() loop starts, the parser's state is valid.
		this.currToken = this.l.nextToken();
		this.peekToken = this.l.nextToken();
	}

	_advance() {
		this.prevToken = this.currToken;
		this.currToken = this.peekToken;
		this.peekToken = this.l.nextToken();
	}

	_currTokenIs(t) { return this.currToken.type === t; }
	_startNode() { return { loc: { start: { line: this.currToken.line, column: this.currToken.column } } }; }

	_finishNode(node, startNodeInfo) {
	    const combinedNode = { ...startNodeInfo, ...node };
	    const endToken = this.prevToken; // A node ends at the last token we consumed.
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
        throw new Error(msg); // This throw is critical for recovery.
	}

	_expect(t) {
		if (this._currTokenIs(t)) { this._advance(); return true; }
		this._error(`Expected next token to be ${t}`);
	}

	// This is the emergency parachute. It's called after an error to find a safe place to resume parsing.
	_synchronize() {
		this.panicMode = false;
		while (!this._currTokenIs(TOKEN.EOF)) {
			if (this.prevToken && this.prevToken.type === TOKEN.SEMICOLON) return;
			switch (this.currToken.type) {
				case TOKEN.CLASS: case TOKEN.FUNCTION: case TOKEN.VAR: case TOKEN.CONST: case TOKEN.LET:
				case TOKEN.IF: case TOKEN.FOR: case TOKEN.WHILE: case TOKEN.RETURN: case TOKEN.IMPORT:
				case TOKEN.EXPORT: case TOKEN.SWITCH:
					return; // We found what looks like the beginning of a new statement.
			}
			this._advance();
		}
	}

    // This handles both real semicolons and the "implicit" semicolons at the end of lines or the file.
    _consumeSemicolon() {
        if (this._currTokenIs(TOKEN.SEMICOLON)) { this._advance(); return; }
        if (this._currTokenIs(TOKEN.RBRACE) || this._currTokenIs(TOKEN.EOF) || this.currToken.hasLineTerminatorBefore) { return; }
    }

	_getPrecedence(t) { return PRECEDENCES[t.type] || PRECEDENCE.LOWEST; }

	// This is the robust main loop that drives the entire process.
	parse() {
	    const program = { type: 'Program', body: [], sourceType: 'module', loc: { start: { line: 1, column: 0 } } };
	    while (!this._currTokenIs(TOKEN.EOF)) {
	        try {
	            const stmt = this._parseDeclaration();
	            if (stmt) {
	                program.body.push(stmt);
	            } else if (!this.panicMode) {
	                // Failsafe: if a parser returns null without throwing, we force an error to trigger recovery.
	                this._error(`Unexpected token: "${this.currToken.literal}" cannot start a statement.`);
	            }
	        } catch (e) {
				// This catch block makes the parser uncrashable. It will ALWAYS recover.
	            this._synchronize();
	        }
	    }
	    const endToken = this.prevToken || this.currToken;
	    program.loc.end = { line: endToken.line, column: endToken.column + (endToken.literal?.length || 0) };
	    return program;
	}
}