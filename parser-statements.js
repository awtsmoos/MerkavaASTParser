// B"H --- Parsing Statements [DEFINITIVE & COMPLETE] ---
(function(proto) {
	proto.registerStatementParsers = function() { /* No registration needed */ };

	proto._parseStatement = function() {
		if (this.panicMode) return null;
		switch (this.currToken.type) {
			case TOKEN.LBRACE: return this._parseBlockStatement();
			case TOKEN.IF: return this._parseIfStatement();
			case TOKEN.FOR: return this._parseForStatement();
			case TOKEN.WHILE: return this._parseWhileStatement();
			case TOKEN.RETURN: return this._parseReturnStatement();
            // Add more statement types here as needed
			default: return this._parseExpressionStatement();
		}
	};

	// In parser-statements.js

	proto._parseBlockStatement = function() {
		const s = this._startNode();
		this._expect(TOKEN.LBRACE);
		const body = [];
		while (!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) {
			// This now correctly relies on the main error handling (try/catch in the parse() loop)
			// to deal with bad statements inside a block.
			const stmt = this._parseDeclaration();
			if (stmt) {
				body.push(stmt);
			} else {
                // If a statement could not be parsed, we MUST break the loop.
                // The main `parse` function's recovery will handle advancing the token.
                // Blindly advancing here was the original bug.
                break;
            }
		}
		this._expect(TOKEN.RBRACE);
		return this._finishNode({ type: 'BlockStatement', body }, s);
	};

	// In parser-statements.js

	proto._parseExpressionStatement = function() {
		const s = this._startNode();
		
		// An expression statement cannot start with these tokens.
		// Checking this prevents trying to parse things that are obviously declarations.
		if(this.currToken.type === TOKEN.FUNCTION || this.currToken.type === TOKEN.CLASS || this.currToken.type === TOKEN.LET) {
			return null;
		}

		const expr = this._parseExpression(PRECEDENCE.LOWEST);
		
		// If _parseExpression failed (e.g., due to an illegal token),
		// it will have already thrown an error, which bubbles up.
		// We should not proceed if the expression is invalid.
		if (!expr) {
			// This check handles cases where _parseExpression might return null 
			// without throwing (though the current design makes that unlikely).
			// Returning null here tells the main loop that this wasn't a valid statement.
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
		const consequent = this._parseStatement();
		let alternate = null;
		if (this._currTokenIs(TOKEN.ELSE)) {
			this._advance();
			alternate = this._parseStatement();
		}
		if (!test || !consequent) return null;
		return this._finishNode({ type: 'IfStatement', test, consequent, alternate }, s);
	};

	proto._parseForStatement = function() {
		const s = this._startNode();
		this._expect(TOKEN.FOR);
		this._expect(TOKEN.LPAREN);
		let init = null;
		if (this._currTokenIs(TOKEN.LET) || this._currTokenIs(TOKEN.CONST) || this._currTokenIs(TOKEN.VAR)) {
			init = this._parseVariableDeclaration();
		} else if (!this._currTokenIs(TOKEN.SEMICOLON)) {
			init = this._parseExpression(PRECEDENCE.LOWEST);
		}
		if (this._currTokenIs(TOKEN.IN) || (this.currToken.type === TOKEN.IDENT && this.currToken.literal === 'of')) {
            const isForOf = this.currToken.literal === 'of';
			this._advance();
			const right = this._parseExpression(PRECEDENCE.LOWEST);
			this._expect(TOKEN.RPAREN);
			const body = this._parseStatement();
			if (!init || !right || !body) return null;
			return this._finishNode({ type: isForOf ? 'ForOfStatement' : 'ForInStatement', left: init, right, body, await: false }, s);
		}
		this._expect(TOKEN.SEMICOLON);
		const test = this._currTokenIs(TOKEN.SEMICOLON) ? null : this._parseExpression(PRECEDENCE.LOWEST);
		this._expect(TOKEN.SEMICOLON);
		const update = this._currTokenIs(TOKEN.RPAREN) ? null : this._parseExpression(PRECEDENCE.LOWEST);
		this._expect(TOKEN.RPAREN);
		const body = this._parseStatement();
		if (!body) return null;
		return this._finishNode({ type: 'ForStatement', init, test, update, body }, s);
	};

	proto._parseWhileStatement = function() {
		const s = this._startNode();
		this._expect(TOKEN.WHILE);
		this._expect(TOKEN.LPAREN);
		const test = this._parseExpression(PRECEDENCE.LOWEST);
		this._expect(TOKEN.RPAREN);
		const body = this._parseStatement();
		if (!test || !body) return null;
		return this._finishNode({ type: 'WhileStatement', test, body }, s);
	};

	proto._parseReturnStatement = function() {
		const s = this._startNode();
		this._advance();
		let argument = null;
		if (!this._currTokenIs(TOKEN.SEMICOLON) && !this.currToken.hasLineTerminatorBefore) {
			argument = this._parseExpression(PRECEDENCE.LOWEST);
		}
		this._consumeSemicolon();
		return this._finishNode({ type: 'ReturnStatement', argument }, s);
	};
})(MerkabahParser.prototype);