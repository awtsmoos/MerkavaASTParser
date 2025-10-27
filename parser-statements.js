// B"H --- Parsing Statements ---
(function(proto) {
    proto.registerStatementParsers = function() { /* No registration needed */ };

    proto._parseStatement = function() {
        if(this.panicMode) return null;
		switch (this.currToken.type) {
			case TOKEN.LBRACE: return this._parseBlockStatement();
			case TOKEN.IF: return this._parseIfStatement();
			case TOKEN.FOR: return this._parseForStatement();
			case TOKEN.WHILE: return this._parseWhileStatement();
            case TOKEN.DO: return this._parseDoWhileStatement();
            case TOKEN.SWITCH: return this._parseSwitchStatement();
            case TOKEN.RETURN: return this._parseReturnStatement();
            case TOKEN.BREAK: return this._parseBreakStatement();
            case TOKEN.CONTINUE: return this._parseContinueStatement();
            case TOKEN.TRY: return this._parseTryStatement();
			default: return this._parseExpressionStatement();
		}
	};

    proto._parseBlockStatement = function() {
        const s = this._startNode();
        this._expect(TOKEN.LBRACE);
        const body = [];
        while(!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) {
            if(this.panicMode) this._synchronize();
            const stmt = this._parseDeclaration();
            if(stmt) body.push(stmt);
        }
        this._expect(TOKEN.RBRACE);
        return this._finishNode({ type: 'BlockStatement', body }, s);
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
        this._advance();
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
        const s = this._startNode(); this._advance(); this._expect(TOKEN.LPAREN);
        let init = null;
        if (this._currTokenIs(TOKEN.LET) || this._currTokenIs(TOKEN.CONST) || this._currTokenIs(TOKEN.VAR)) { init = this._parseVariableDeclaration(); }
        else if (!this._currTokenIs(TOKEN.SEMICOLON)) { init = this._parseExpression(PRECEDENCE.LOWEST); }
        if (this._currTokenIs(TOKEN.IN) || (this.currToken.type === TOKEN.IDENT && this.currToken.literal === 'of')) {
            const isForOf = this.currToken.literal === 'of'; this._advance();
            const right = this._parseExpression(PRECEDENCE.LOWEST); this._expect(TOKEN.RPAREN);
            const body = this._parseStatement(); if (!init || !right || !body) return null;
            return this._finishNode({ type: isForOf ? 'ForOfStatement' : 'ForInStatement', left: init, right, body, await: false }, s);
        }
        this._expect(TOKEN.SEMICOLON);
        const test = this._currTokenIs(TOKEN.SEMICOLON) ? null : this._parseExpression(PRECEDENCE.LOWEST); this._expect(TOKEN.SEMICOLON);
        const update = this._currTokenIs(TOKEN.RPAREN) ? null : this._parseExpression(PRECEDENCE.LOWEST); this._expect(TOKEN.RPAREN);
        const body = this._parseStatement(); if (!body) return null;
        return this._finishNode({ type: 'ForStatement', init, test, update, body }, s);
    };

    proto._parseWhileStatement = function() { const s = this._startNode(); this._advance(); this._expect(TOKEN.LPAREN); const test = this._parseExpression(PRECEDENCE.LOWEST); this._expect(TOKEN.RPAREN); const body = this._parseStatement(); if (!test || !body) return null; return this._finishNode({ type: 'WhileStatement', test, body }, s); };
    proto._parseDoWhileStatement = function() { const s = this._startNode(); this._advance(); const body = this._parseStatement(); this._expect(TOKEN.WHILE); this._expect(TOKEN.LPAREN); const test = this._parseExpression(PRECEDENCE.LOWEST); this._expect(TOKEN.RPAREN); this._consumeSemicolon(); if (!body || !test) return null; return this._finishNode({ type: 'DoWhileStatement', body, test }, s); };
    proto._parseSwitchStatement = function() { const s = this._startNode(); this._advance(); this._expect(TOKEN.LPAREN); const discriminant = this._parseExpression(PRECEDENCE.LOWEST); this._expect(TOKEN.RPAREN); this._expect(TOKEN.LBRACE); const cases = []; while (!this._currTokenIs(TOKEN.RBRACE)) cases.push(this._parseSwitchCase()); this._expect(TOKEN.RBRACE); if (!discriminant) return null; return this._finishNode({ type: 'SwitchStatement', discriminant, cases }, s); };
    proto._parseSwitchCase = function() { const s = this._startNode(); let test = null; if (this._currTokenIs(TOKEN.CASE)) { this._advance(); test = this._parseExpression(PRECEDENCE.LOWEST); } else { this._expect(TOKEN.DEFAULT); } this._expect(TOKEN.COLON); const consequent = []; while (!this._currTokenIs(TOKEN.CASE) && !this._currTokenIs(TOKEN.DEFAULT) && !this._currTokenIs(TOKEN.RBRACE)) { const stmt = this._parseStatement(); if (stmt) consequent.push(stmt); } return this._finishNode({ type: 'SwitchCase', test, consequent }, s); };
    proto._parseReturnStatement = function() { const s = this._startNode(); this._advance(); let argument = null; if (!this._currTokenIs(TOKEN.SEMICOLON) && !this.currToken.hasLineTerminatorBefore) { argument = this._parseExpression(PRECEDENCE.LOWEST); } this._consumeSemicolon(); return this._finishNode({ type: 'ReturnStatement', argument }, s); };
    proto._parseBreakStatement = function() { const s = this._startNode(); this._advance(); this._consumeSemicolon(); return this._finishNode({ type: 'BreakStatement', label: null }, s); };
    proto._parseContinueStatement = function() { const s = this._startNode(); this._advance(); this._consumeSemicolon(); return this._finishNode({ type: 'ContinueStatement', label: null }, s); };
    proto._parseTryStatement = function() { const s = this._startNode(); this._advance(); const block = this._parseBlockStatement(); let handler = null; let finalizer = null; if (this._currTokenIs(TOKEN.CATCH)) { handler = this._parseCatchClause(); } if (this._currTokenIs(TOKEN.FINALLY)) { this._advance(); finalizer = this._parseBlockStatement(); } if (!handler && !finalizer) this._error("Expected catch or finally block"); if (!block) return null; return this._finishNode({ type: 'TryStatement', block, handler, finalizer }, s); };
    proto._parseCatchClause = function() { const s = this._startNode(); this._advance(); let param = null; if (this._currTokenIs(TOKEN.LPAREN)) { this._expect(TOKEN.LPAREN); param = this._parseBindingPattern(); this._expect(TOKEN.RPAREN); } const body = this._parseBlockStatement(); if (!body) return null; return this._finishNode({ type: 'CatchClause', param, body }, s); };

})(MerkabahParser.prototype);