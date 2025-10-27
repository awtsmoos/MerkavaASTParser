// B"H
// --- The Merkabah Ha'Gadol: The Indestructible Emanation (Core) ---
class MerkabahParser {
	constructor(s) {
		this.l = new Lexer(s);
		this.errors = [];
		this.panicMode = false; // When true, we are recovering from a syntax error

		this.prevToken = null;
		this.currToken = null;
		this.peekToken = null;
		this._advance(); this._advance();

		// These will be populated by the other parse-*.js files
		this.prefixParseFns = {};
		this.infixParseFns = {};

        // Call the registration functions from the other files to attach their methods
        this.registerExpressionParsers();
        this.registerStatementParsers();
        this.registerDeclarationParsers();
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

    // --- GUARANTEED NON-CRASHING ERROR HANDLING ---
	_error(m) {
		// Only record the first error in a cascade to avoid noisy, repetitive errors.
		if (this.panicMode) return;
		this.panicMode = true;
		this.errors.push(`[Shevirah] ${m} on line ${this.currToken.line}:${this.currToken.column}. Got token ${this.currToken.type} ("${this.currToken.literal}")`);
	}

    // Intelligently recovers by finding the next safe place to resume parsing.
	_synchronize() {
		this.panicMode = false;
		while (!this._currTokenIs(TOKEN.EOF)) {
			// If the previous token was a semicolon, we are likely at a safe point.
			if (this.prevToken && this.prevToken.type === TOKEN.SEMICOLON) return;

            // Check for keywords that reliably start new, recognizable statements.
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

	_expect(t) {
		if (this._currTokenIs(t)) {
			this._advance();
			return true;
		}
		this._error(`Expected next token to be ${t}`);
		return false;
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
			// If we are in panic mode, synchronize before attempting to parse again.
			if (this.panicMode) this._synchronize();
			
			// This is the final guarantee. No internal crash can stop the loop.
			try {
				const stmt = this._parseDeclaration(); // Delegate to declaration parser
				if (stmt) { // A null stmt means a valid but empty statement (like a semicolon) was parsed
					program.body.push(stmt);
				}
			} catch (e) {
				this._error("Fatal parser state encountered: " + e.message + ". Attempting recovery.");
				this._synchronize();
			}
		}
		return this._finishNode(program, program);
	}
}