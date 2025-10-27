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

	proto._parseBlockStatement = function() {
		const s = this._startNode();
		this._expect(TOKEN.LBRACE);
		const body = [];
		while (!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) {
			const stmt = this._parseDeclaration();
			if (stmt) {
				body.push(stmt);
			} else {
                this._advance(); // Recover from bad statement
            }
		}
		this._expect(TOKEN.RBRACE);
		return this._finishNode({ type: 'BlockStatement', body }, s); // THIS RETURN WAS MISSING
	};

	proto._parseExpressionStatement = function() {
		const s = this._startNode();
		const expr = this._parseExpression(PRECEDENCE.LOWEST);
		if (!expr) return null;
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