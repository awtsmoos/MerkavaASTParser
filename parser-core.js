// B"H
// In parser-core.js
var time=0
var max=2000
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

		this.currToken = this.l.nextToken();
		this.peekToken = this.l.nextToken();
	}

	_advance() {
	if(time++>max) throw "stoped";
		
		this.prevToken = this.currToken;
		this.currToken = this.peekToken;
		this.peekToken = this.l.nextToken();
	}

	_currTokenIs(t) { 
	if(time++>max) throw "stoped curr";
	return this.currToken.type === t; }
	_startNode() { 
	if(time++>max) throw "started";
	return { loc: { start: { line: this.currToken.line, column: this.currToken.column } } }; }

	_finishNode(node, startNodeInfo) {
	    if(time++>max) throw "stoped";
		
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
	
	
	if(time++>max) throw "stoped";
		
		this.panicMode = false;
		while (time++ <max&&
		!this._currTokenIs(TOKEN.EOF)
		) {
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
    if(time++>max) throw "stoped";
        if (this._currTokenIs(TOKEN.SEMICOLON)) { this._advance(); return; }
        if (this._currTokenIs(TOKEN.RBRACE) || this._currTokenIs(TOKEN.EOF) || this.currToken.hasLineTerminatorBefore) { return; }
    }

	_getPrecedence(t) { return PRECEDENCES[t.type] || PRECEDENCE.LOWEST; }

	// THIS IS THE MODIFIED METHOD
	// B"H
// In parser-core.js, inside the MerkabahParser class

// In parser-core.js, inside the MerkabahParser class

// In parser-core.js, inside the MerkabahParser class

parse() {
    const program = { type: 'Program', body: [], sourceType: 'module', loc: { start: { line: 1, column: 0 } } };

    while (!this._currTokenIs(TOKEN.EOF)) {
        const positionBeforeParse = this.l.position;

        try {
            const stmt = this._parseDeclaration();
            if (stmt) {
                program.body.push(stmt);
            } else if (!this.panicMode) {
                // This branch is taken if a parsing function returns null,
                // indicating it couldn't parse a statement.
                this._error(`Unexpected token: "${this.currToken.literal}" cannot start a statement.`);
                // We must advance to prevent a loop on the bad token.
                this._advance(); 
            }
        } catch (e) {
            // --- THIS IS THE CRITICAL DIAGNOSTIC ---
            // Before we do anything else, log the ORIGINAL error.
            // This will give us the true stack trace and point to the real bug.
            console.error("CAUGHT INITIAL ERROR:", e); 
            
            // Now, we can try to recover.
            this._synchronize();
        }

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