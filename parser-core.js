// B"H
// --- The Merkabah Ha'Gadol: The Indestructible Emanation (Core) ---
class MerkabahParser {
	constructor(s) {
		this.l = new Lexer(s);
		this.errors = [];
		this.panicMode = false;

		this.prevToken = null;
		this.currToken = null;
		this.peekToken = null;

		// Initialize the function maps. They will be populated by the other files.
		this.prefixParseFns = {};
		this.infixParseFns = {};

		// The other scripts add these methods to the prototype before the constructor is called.
		// We MUST call them here to populate the maps.
		this.registerExpressionParsers();
        this.registerStatementParsers();
        this.registerDeclarationParsers();

		// Now that the parser knows how to handle tokens, we can advance.
		this._advance(); this._advance();
	}

	_advance() {
		this.prevToken = this.currToken;
		this.currToken = this.peekToken;
		this.peekToken = this.l.nextToken();
	}

	_currTokenIs(t) { return this.currToken.type === t; }
	_peekTokenIs(t) { return this.peekToken.type === t; }

	_startNode() {
		return {
			start: this.currToken.column,
			loc: { start: { line: this.currToken.line, column: this.currToken.column } }
		};
	}

	_finishNode(node, startNodeInfo) {
		const p = this.prevToken;
		node.end = p.column + (p.literal?.length || 0);
		node.loc.end = { line: p.line, column: p.column + (p.literal?.length || 0) };
		return { ...startNodeInfo, ...node };
	}

	_error(m) {
		if (this.panicMode) return;
		this.panicMode = true;
		this.errors.push(`[Shevirah] ${m} on line ${this.currToken.line}:${this.currToken.column}. Got token ${this.currToken.type} ("${this.currToken.literal}")`);
	}

	_synchronize() {
		this.panicMode = false;
		while (!this._currTokenIs(TOKEN.EOF)) {
			if (this.prevToken && this.prevToken.type === TOKEN.SEMICOLON) return;
			switch (this.currToken.type) {
				case TOKEN.CLASS: case TOKEN.FUNCTION: case TOKEN.VAR:
				case TOKEN.CONST: case TOKEN.LET: case TOKEN.IF:
				case TOKEN.FOR: case TOKEN.WHILE: case TOKEN.RETURN:
				case TOKEN.IMPORT: case TOKEN.EXPORT: case TOKEN.SWITCH:
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
        if (this.currToken.hasLineTerminatorBefore || this._currTokenIs(TOKEN.RBRACE) || this._currTokenIs(TOKEN.EOF)) {
            return;
        }
    }

	_getPrecedence(t) { return PRECEDENCES[t.type] || PRECEDENCE.LOWEST; }

	// --- THE MAIN PARSING LOOP ---
	
	
	parse() {
	    const program = this._startNode();
	    program.type = 'Program';
	    program.body = [];
	    program.sourceType = 'module';
	
	    while (!this._currTokenIs(TOKEN.EOF)) {
	        // First, check if we are recovering from a previous error.
	        if (this.panicMode) {
	            this._synchronize();
	            // CRITICAL: After synchronizing, restart the loop from the new, safe token.
	            // Do not attempt to parse anything else in this iteration.
	            continue; 
	        }
	        
	        try {
	            const stmt = this._parseDeclaration();
	            if (stmt) {
	                program.body.push(stmt);
	            } 
	            // This handles valid-but-empty statements like semicolons to prevent loops.
	            else if (!this.panicMode && !this._currTokenIs(TOKEN.EOF)) {
	                this._advance();
	            }
	        } catch (e) {
	            this._error("Fatal parser state encountered: " + e.message + ". Attempting recovery.");
	        }
	    }
	    return this._finishNode(program, program);
	}
}