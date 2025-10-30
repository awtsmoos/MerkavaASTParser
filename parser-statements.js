// B"H --- Parsing Statements [DEFINITIVE, CORRECT & COMPLETE] ---
(function(proto) {
	proto.registerStatementParsers = function() { /* No registration needed */ };

	// This function is now deprecated, as its logic has been correctly
	// centralized into `_parseDeclaration`. It is left here for safety
	// but should not be the main entry point for parsing statements.
	proto._parseStatement = function() {
		return this._parseExpressionStatement();
	};

	// --- THIS IS THE CORRECT IMPLEMENTATION ---
	proto._parseBlockStatement = function() {
		const s = this._startNode();
		this._expect(TOKEN.LBRACE); // Expect and consume '{'

		const body = [];

		// This loop correctly parses statements until it finds the closing brace.
		while (!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) {
			// It calls `_parseDeclaration`, which is the single source of truth.
			const stmt = this._parseDeclaration();
			if (stmt) {
				body.push(stmt);
			} else {
				// To prevent infinite loops on an unknown token, we advance.
				this._error("Expected a statement or declaration within the block.");
				this._advance();
			}
		}

		this._expect(TOKEN.RBRACE); // Expect and consume '}'
		
		return this._finishNode({ type: 'BlockStatement', body }, s);
	};

	proto._parseExpressionStatement = function() {
		const s = this._startNode();
		
		// Expression statements cannot start with these keywords.
		if(this.currToken.type === TOKEN.FUNCTION || this.currToken.type === TOKEN.CLASS || this.currToken.type === TOKEN.LET) {
			return null;
		}

		const expr = this._parseExpression(PRECEDENCE.LOWEST);
		
		if (!expr) {
			return null; 
		}

		this._consumeSemicolon();
		return this._finishNode({ type: 'ExpressionStatement', expression: expr }, s);
	};

	proto._parseIfStatement = function() {
		const s = this._startNode();
		this._expect(TOKEN.IF);
		this._expect(TOKEN.LPAREN);
		const test = this._parseExpression(PRECEDENCE.LOWEST);
		this._expect(TOKEN.RPAREN);
		const consequent = this._parseDeclaration(); // Use _parseDeclaration to handle blocks or single statements
		let alternate = null;
		if (this._currTokenIs(TOKEN.ELSE)) {
			this._advance();
			alternate = this._parseDeclaration(); // Also use _parseDeclaration here
		}
		if (!test || !consequent) return null;
		return this._finishNode({ type: 'IfStatement', test, consequent, alternate }, s);
	};

	// B"H --- CORRECTED For Statement Parsing ---
proto._parseForStatement = function() {
    const s = this._startNode();
    this._expect(TOKEN.FOR);
    this._expect(TOKEN.LPAREN);
    let init = null;

    // This logic branch handles `for (let i = 0; ...)`
    if (this._currTokenIs(TOKEN.LET) || this._currTokenIs(TOKEN.CONST) || this._currTokenIs(TOKEN.VAR)) {
        init = this._parseVariableDeclaration(); 
        // We DO NOT expect a semicolon here, because _parseVariableDeclaration consumed it.
    
    // This logic branch handles `for (i = 0; ...)` or `for ( ; ...)`
    } else if (!this._currTokenIs(TOKEN.SEMICOLON)) {
        init = this._parseExpression(PRECEDENCE.LOWEST);
        // An expression MUST be followed by a semicolon.
        this._expect(TOKEN.SEMICOLON);
    } else {
        // This handles the empty init case `for (;;)`
        this._expect(TOKEN.SEMICOLON);
    }
    
    // --- The logic for for...in and for...of was also problematic here ---
    // It is simpler and more correct to check for it *after* parsing the initializer.
    if (this._currTokenIs(TOKEN.IN) || (this.currToken.type === TOKEN.IDENT && this.currToken.literal === 'of')) {
        const isForOf = this.currToken.literal === 'of';
        this._advance();
        const right = this._parseExpression(PRECEDENCE.LOWEST);
        this._expect(TOKEN.RPAREN);
        const body = this._parseDeclaration();
        if (!init || !right || !body) return null;
        return this._finishNode({ type: isForOf ? 'ForOfStatement' : 'ForInStatement', left: init, right, body, await: false }, s);
    }

    // Standard C-style for loop continues from here.
    // We are now past the first semicolon.
    const test = this._currTokenIs(TOKEN.SEMICOLON) ? null : this._parseExpression(PRECEDENCE.LOWEST);
    this._expect(TOKEN.SEMICOLON);
    const update = this._currTokenIs(TOKEN.RPAREN) ? null : this._parseExpression(PRECEDENCE.LOWEST);
    this._expect(TOKEN.RPAREN);
    const body = this._parseDeclaration();
    if (!body) return null;
    return this._finishNode({ type: 'ForStatement', init, test, update, body }, s);
};

	proto._parseWhileStatement = function() {
		const s = this._startNode();
		this._expect(TOKEN.WHILE);
		this._expect(TOKEN.LPAREN);
		const test = this._parseExpression(PRECEDENCE.LOWEST);
		this._expect(TOKEN.RPAREN);
		const body = this._parseDeclaration();
		if (!test || !body) return null;
		return this._finishNode({ type: 'WhileStatement', test, body }, s);
	};

	// --- THIS IS THE CORRECT IMPLEMENTATION ---
	proto._parseReturnStatement = function() {
		const s = this._startNode();
		this._advance(); // Consume the 'return' token.

		let argument = null;

		// This logic correctly checks if an expression follows 'return'.
		// It handles Automatic Semicolon Insertion by checking for a newline.
		if (!this._currTokenIs(TOKEN.SEMICOLON) && !this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF) && !this.currToken.hasLineTerminatorBefore) {
			argument = this._parseExpression(PRECEDENCE.LOWEST);
		}

		this._consumeSemicolon();
		
		return this._finishNode({ type: 'ReturnStatement', argument }, s);
	};
	
	
	// B"H --- Add these to the bottom of parser-statements.js ---

    proto._parseSwitchStatement = function() {
        const s = this._startNode();
        this._expect(TOKEN.SWITCH);
        this._expect(TOKEN.LPAREN);
        const discriminant = this._parseExpression(PRECEDENCE.LOWEST);
        this._expect(TOKEN.RPAREN);
        this._expect(TOKEN.LBRACE);

        const cases = [];
        while (!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) {
            const caseClause = this._parseSwitchCase();
            if (caseClause) {
                cases.push(caseClause);
            }
        }

        this._expect(TOKEN.RBRACE);
        return this._finishNode({ type: 'SwitchStatement', discriminant, cases }, s);
    };

    proto._parseSwitchCase = function() {
        const s = this._startNode();
        let test = null;

        if (this._currTokenIs(TOKEN.CASE)) {
            this._advance(); // Consume 'case'
            test = this._parseExpression(PRECEDENCE.LOWEST);
        } else if (this._currTokenIs(TOKEN.DEFAULT)) {
            this._advance(); // Consume 'default'
            // test remains null
        } else {
            this._error("Expected 'case' or 'default' keyword.");
            return null;
        }

        this._expect(TOKEN.COLON);

        const consequent = [];
        // Loop until we hit the next case, default, or the end of the switch block
        while (!this._currTokenIs(TOKEN.RBRACE) && 
               !this._currTokenIs(TOKEN.CASE) &&
               !this._currTokenIs(TOKEN.DEFAULT) &&
               !this._currTokenIs(TOKEN.EOF)) {
            const stmt = this._parseDeclaration();
            if (stmt) {
                consequent.push(stmt);
            }
        }

        return this._finishNode({ type: 'SwitchCase', test, consequent }, s);
    };

    proto._parseBreakStatement = function() {
        const s = this._startNode();
        this._advance(); // Consume 'break'
        // According to ESTree spec, break statements can have a label, but we'll keep it simple.
        this._consumeSemicolon();
        return this._finishNode({ type: 'BreakStatement', label: null }, s);
    };

})(MerkabahParser.prototype);