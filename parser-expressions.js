// B"H --- Parsing Expressions [DEFINITIVE & COMPLETE] ---
(function(proto) {
	proto.registerExpressionParsers = function() {
        /***********************************************************************
        *  --- THE DEFINITIVE FIX ---
        *  Corrected the typo from `prefixParseFuns` to `prefixParseFns`.
        ***********************************************************************/
		const p = this.prefixParseFns;
		p[TOKEN.IDENT] = this._parseIdentifier;
		p[TOKEN.NUMBER] = p[TOKEN.STRING] = p[TOKEN.TRUE] = p[TOKEN.FALSE] = p[TOKEN.NULL] = this._parseLiteral;
		p[TOKEN.LPAREN] = this._parseGroupedOrArrowExpression;
        p[TOKEN.LBRACE] = this._parseObjectLiteral;

        /***********************************************************************
        *  --- THE DEFINITIVE FIX ---
        *  Corrected the typo from `infixParseFuns` to `infixParseFns`.
        ***********************************************************************/
		const i = this.infixParseFns;
		const binary = l => this._parseBinaryExpression(l);
		i[TOKEN.PLUS] = i[TOKEN.MINUS] = i[TOKEN.SLASH] = i[TOKEN.ASTERISK] = binary;
		i[TOKEN.EQ] = i[TOKEN.NOT_EQ] = i[TOKEN.EQ_STRICT] = i[TOKEN.NOT_EQ_STRICT] = binary;
		i[TOKEN.LT] = i[TOKEN.GT] = i[TOKEN.LTE] = i[TOKEN.GTE] = binary;
		i[TOKEN.ASSIGN] = l => this._parseAssignmentExpression(l);
        i[TOKEN.COMMA] = l => this._parseSequenceExpression(l);
	};

	proto._parseExpression = function(precedence) {
		const prefix = this.prefixParseFns[this.currToken.type];
		if (!prefix) {
			this._error(`No prefix parse function for ${this.currToken.type}`);
			return null;
		}
		let leftExp = prefix.call(this);

		while (!this._peekTokenIs(TOKEN.SEMICOLON) && precedence < this._getPrecedence(this.peekToken)) {
			const infix = this.infixParseFns[this.peekToken.type];
			if (!infix) {
				return leftExp;
			}
			this._advance();
			leftExp = infix.call(this, leftExp);
		}
		return leftExp;
	};
    
    proto._parseSequenceExpression = function(left) {
        const s = this._startNode();
        s.loc.start = left.loc.start;
        const expressions = left.type === 'SequenceExpression' ? left.expressions : [left];
        expressions.push(this._parseExpression(PRECEDENCE.SEQUENCE - 1)); // Parse with lower precedence
        return this._finishNode({ type: 'SequenceExpression', expressions }, s);
    };

	proto._parseArrowFunctionExpression = function(s, params) {
		this._expect(TOKEN.ARROW);
		const body = this._currTokenIs(TOKEN.LBRACE)
			? this._parseBlockStatement()
			: this._parseExpression(PRECEDENCE.ASSIGNMENT);
		if (!body) return null;
		return this._finishNode({ type: 'ArrowFunctionExpression', id: null, params, body, async: false, expression: body.type !== 'BlockStatement' }, s);
	};

	proto._parseIdentifier = function() {
		if (this._peekTokenIs(TOKEN.ARROW)) {
			const s = this._startNode();
			const param = { type: 'Identifier', name: this.currToken.literal };
			this._advance();
			const paramNode = this._finishNode(param, s);
			return this._parseArrowFunctionExpression(s, [paramNode]);
		}
		const s = this._startNode();
		const node = { type: 'Identifier', name: this.currToken.literal };
		this._advance();
		return this._finishNode(node, s);
	};

	proto._parseLiteral = function() { 
        const s = this._startNode();
        const t = this.currToken;
        let v = t.literal;
        if (t.type === TOKEN.NUMBER) v = parseFloat(v);
        else if (t.type === TOKEN.TRUE) v = true;
        else if (t.type === TOKEN.FALSE) v = false;
        else if (t.type === TOKEN.NULL) v = null;
        const node = { type: 'Literal', value: v, raw: t.literal };
        this._advance();
        return this._finishNode(node, s);
    };
	
	proto._parseBinaryExpression = function(left) { 
        const s = this._startNode();
        s.loc.start = left.loc.start;
        const op = this.currToken.literal;
        const prec = this._getPrecedence(this.currToken);
        this._advance();
        const right = this._parseExpression(prec);
        return this._finishNode({ type: 'BinaryExpression', operator: op, left, right }, s);
    };

    proto._parseAssignmentExpression = function(left) {
        if (left.type !== 'Identifier' && left.type !== 'MemberExpression') {
            this._error("Invalid left-hand side in assignment.");
            return null;
        }
        const s = this._startNode();
        s.loc.start = left.loc.start;
        const op = this.currToken.literal;
        this._advance();
        const right = this._parseExpression(PRECEDENCE.ASSIGNMENT - 1);
        if (!right) return null;
        return this._finishNode({ type: 'AssignmentExpression', operator: op, left, right }, s);
    };

	proto._parseGroupedOrArrowExpression = function() {
		const s = this._startNode();
		this._expect(TOKEN.LPAREN);

		if (this._currTokenIs(TOKEN.RPAREN)) {
			this._expect(TOKEN.RPAREN);
			if (!this._currTokenIs(TOKEN.ARROW)) {
				this._error("Unexpected empty parentheses in expression.");
				return null;
			}
			return this._parseArrowFunctionExpression(s, []);
		}

		const expression = this._parseExpression(PRECEDENCE.LOWEST);
		this._expect(TOKEN.RPAREN);

		if (this._currTokenIs(TOKEN.ARROW)) {
			const params = expression.type === 'SequenceExpression' ? expression.expressions : [expression];
			return this._parseArrowFunctionExpression(s, params);
		}

		return expression;
	};
    
	proto._parseObjectLiteral = function() {
		const s = this._startNode();
		this._expect(TOKEN.LBRACE);
		const properties = [];
		while (!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) {
			properties.push(this._parseObjectProperty());
			if (this._currTokenIs(TOKEN.RBRACE)) break;
			if(this._currTokenIs(TOKEN.COMMA)) {
                this._advance();
            } else {
                // This allows for trailing commas, which are valid.
                if (!this._currTokenIs(TOKEN.RBRACE)) {
                    this._error("Expected a comma between object properties.");
                    break;
                }
            }
		}
		this._expect(TOKEN.RBRACE);
		return this._finishNode({ type: 'ObjectExpression', properties }, s);
	};

	proto._parseObjectProperty = function() {
		const s = this._startNode();
		if (this._currTokenIs(TOKEN.DOTDOTDOT)) {
			this._advance();
			const argument = this._parseExpression(PRECEDENCE.ASSIGNMENT);
			return this._finishNode({ type: 'SpreadElement', argument }, s);
		}
		let computed = false;
		let key;
		if (this._currTokenIs(TOKEN.LBRACKET)) {
			computed = true;
			this._advance();
			key = this._parseExpression(PRECEDENCE.LOWEST);
			this._expect(TOKEN.RBRACKET);
		} else {
			// In an object literal, a key can be any literal or an identifier.
			if (this.currToken.type === TOKEN.STRING || this.currToken.type === TOKEN.NUMBER) {
				key = this._parseLiteral();
			} else {
				key = this._parseIdentifier();
			}
		}
		if (this._currTokenIs(TOKEN.COLON)) {
			this._expect(TOKEN.COLON);
			const value = this._parseExpression(PRECEDENCE.ASSIGNMENT);
			return this._finishNode({ type: 'Property', key, value, kind: 'init', method: false, shorthand: false, computed }, s);
		}
		if (key.type === 'Identifier' && (this._currTokenIs(TOKEN.COMMA) || this._currTokenIs(TOKEN.RBRACE))) {
			return this._finishNode({ type: 'Property', key, value: key, kind: 'init', method: false, shorthand: true, computed: false }, s);
		}
        // This handles cases like methods: `myMethod() {}` but we'll treat it as an error for now.
		this._error("Invalid object property syntax. Expected ':' after key.");
		return null;
	};

})(MerkabahParser.prototype);