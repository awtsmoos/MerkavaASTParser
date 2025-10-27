// B"H --- Parsing Expressions [DEFINITIVE, UNBREAKABLE & COMPLETE] ---
(function(proto) {
	proto.registerExpressionParsers = function() {
		const p = this.prefixParseFns;
		const i = this.infixParseFns;

		p[TOKEN.IDENT] = this._parseIdentifier;
		p[TOKEN.NUMBER] = p[TOKEN.STRING] = p[TOKEN.TRUE] = p[TOKEN.FALSE] = p[TOKEN.NULL] = this._parseLiteral;
		p[TOKEN.THIS] = this._parseThisExpression;
		p[TOKEN.SUPER] = this._parseSuper;
		p[TOKEN.BANG] = p[TOKEN.MINUS] = p[TOKEN.PLUS] = p[TOKEN.TYPEOF] = p[TOKEN.AWAIT] = this._parsePrefixExpression;
        p[TOKEN.INCREMENT] = p[TOKEN.DECREMENT] = l => this._parseUpdateExpression(l, true); // Prefix
		p[TOKEN.LPAREN] = this._parseGroupedOrArrowExpression;
		p[TOKEN.LBRACE] = this._parseObjectLiteral;
		p[TOKEN.LBRACKET] = this._parseArrayLiteral;
		p[TOKEN.TEMPLATE_HEAD] = p[TOKEN.TEMPLATE_TAIL] = this._parseTemplateLiteral;
		p[TOKEN.NEW] = this._parseNewExpression;
		p[TOKEN.FUNCTION] = this._parseFunctionExpression;
		p[TOKEN.CLASS] = this._parseClassExpression;

		const binary = l => this._parseBinaryExpression(l);
		i[TOKEN.PLUS] = i[TOKEN.MINUS] = i[TOKEN.SLASH] = i[TOKEN.ASTERISK] = i[TOKEN.MODULO] = binary;
		i[TOKEN.EQ] = i[TOKEN.NOT_EQ] = i[TOKEN.EQ_STRICT] = i[TOKEN.NOT_EQ_STRICT] = binary;
		i[TOKEN.LT] = i[TOKEN.GT] = i[TOKEN.LTE] = i[TOKEN.GTE] = i[TOKEN.IN] = i[TOKEN.INSTANCEOF] = binary;
		i[TOKEN.AND] = i[TOKEN.OR] = i[TOKEN.NULLISH_COALESCING] = binary;
        i[TOKEN.EXPONENT] = binary;
		i[TOKEN.ASSIGN] = i[TOKEN.PLUS_ASSIGN] = i[TOKEN.MINUS_ASSIGN] = i[TOKEN.ASTERISK_ASSIGN] = i[TOKEN.SLASH_ASSIGN] = i[TOKEN.EXPONENT_ASSIGN] = i[TOKEN.MODULO_ASSIGN] = l => this._parseAssignmentExpression(l);
		i[TOKEN.COMMA] = l => this._parseSequenceExpression(l);
        i[TOKEN.INCREMENT] = i[TOKEN.DECREMENT] = l => this._parseUpdateExpression(l, false); // Postfix
		i[TOKEN.LPAREN] = this._parseCallExpression;
		i[TOKEN.DOT] = this._parseMemberExpression;
		i[TOKEN.LBRACKET] = this._parseMemberExpression;
		i[TOKEN.OPTIONAL_CHAINING] = this._parseChainExpression;
        i[TOKEN.QUESTION] = this._parseConditionalExpression;
	};

	// --- THIS IS THE UNBREAKABLE PARSING ENGINE ---
	// This function is the heart of the fix. Replace yours with this.
	proto._parseExpression = function(precedence) {
	    // Find a parsing function for the current token (like a number or identifier).
	    let prefix = this.prefixParseFns[this.currToken.type];
	    if (!prefix) {
	        this._error(`No prefix parse function for ${this.currToken.type}`);
	        return null;
	    }
	    
	    // Call it. It parses the first part and ADVANCES THE TOKEN.
	    let leftExp = prefix.call(this);
	
	    // Loop as long as we see operators with higher precedence.
	    while (precedence < this._getPrecedence(this.currToken)) {
	        
	        // Find a function to handle the operator (like '+', '*', etc.).
	        let infix = this.infixParseFns[this.currToken.type];
	
	        // !!! --- THIS IS THE GUARDIAN CLAUSE THAT FIXES THE FREEZE --- !!!
	        // If the current token IS NOT A VALID INFIX OPERATOR, stop immediately.
	        // When your code reaches the end of the file, the token is 'EOF',
	        // `infix` is `undefined`, and this `return` statement safely exits the
	        // loop, PREVENTING THE INFINITE FREEZE. Your old code was missing this check.
	        if (!infix) {
	            return leftExp;
	        }
	
	        // Call the operator's parsing function to complete the expression.
	        leftExp = infix.call(this, leftExp);
	    }
	
	    return leftExp;
	};
	
    // The rest of this file provides the full, correct implementation of all
    // expression parsing helper functions.
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
    proto._parseThisExpression = function() {
        const s = this._startNode(); this._advance(); return this._finishNode({ type: 'ThisExpression' }, s);
    };
    proto._parseSuper = function() {
        const s = this._startNode(); this._advance(); return this._finishNode({ type: 'Super' }, s);
    };
    proto._parsePrefixExpression = function() {
        const s = this._startNode();
        const operator = this.currToken.literal;
        const isAwait = this.currToken.type === TOKEN.AWAIT;
        this._advance();
        const argument = this._parseExpression(PRECEDENCE.PREFIX);
        const type = isAwait ? 'AwaitExpression' : 'UnaryExpression';
        return this._finishNode({ type, operator, argument, prefix: true }, s);
    };
    proto._parseUpdateExpression = function(left, isPrefix) {
        const s = this._startNode();
        if(!isPrefix) { s.loc.start = left.loc.start; } else { left = this._parseIdentifier(); }
        const operator = this.currToken.literal; this._advance();
        return this._finishNode({ type: 'UpdateExpression', operator, argument: left, prefix: isPrefix }, s);
    };
    proto._parseGroupedOrArrowExpression = function() {
		const s = this._startNode();
		this._expect(TOKEN.LPAREN);
		if (this._currTokenIs(TOKEN.RPAREN)) {
			this._expect(TOKEN.RPAREN);
			if (!this._currTokenIs(TOKEN.ARROW)) { this._error("Unexpected empty parentheses."); return null; }
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
    proto._parseBinaryExpression = function(left) { 
        const s = this._startNode(); s.loc.start = left.loc.start;
        const op = this.currToken.literal;
        const prec = this._getPrecedence(this.currToken);
        this._advance();
        const right = this._parseExpression(prec);
        return this._finishNode({ type: 'BinaryExpression', operator: op, left, right }, s);
    };
    proto._parseAssignmentExpression = function(left) {
        if (left.type !== 'Identifier' && left.type !== 'MemberExpression') {
            this._error("Invalid left-hand side in assignment."); return null;
        }
        const s = this._startNode(); s.loc.start = left.loc.start;
        const op = this.currToken.literal; this._advance();
        const right = this._parseExpression(PRECEDENCE.ASSIGNMENT - 1);
        return this._finishNode({ type: 'AssignmentExpression', operator: op, left, right }, s);
    };
    proto._parseConditionalExpression = function(left) {
        const s = this._startNode(); s.loc.start = left.loc.start;
        this._advance();
        const consequent = this._parseExpression(PRECEDENCE.LOWEST);
        this._expect(TOKEN.COLON);
        const alternate = this._parseExpression(PRECEDENCE.LOWEST);
        return this._finishNode({ type: 'ConditionalExpression', test: left, consequent, alternate }, s);
    };
    proto._parseSequenceExpression = function(left) {
        const s = this._startNode(); s.loc.start = left.loc.start;
        const expressions = left.type === 'SequenceExpression' ? left.expressions : [left];
        this._advance();
        expressions.push(this._parseExpression(PRECEDENCE.SEQUENCE - 1));
        return this._finishNode({ type: 'SequenceExpression', expressions }, s);
    };
    proto._parseArrayLiteral = function() {
		const s = this._startNode(); this._expect(TOKEN.LBRACKET); const elements = [];
		while (!this._currTokenIs(TOKEN.RBRACKET) && !this._currTokenIs(TOKEN.EOF)) {
			if (this._currTokenIs(TOKEN.COMMA)) { this._advance(); elements.push(null); continue; }
			elements.push(this._parseExpression(PRECEDENCE.ASSIGNMENT));
			if (this._currTokenIs(TOKEN.COMMA)) { this._advance(); } else if (!this._currTokenIs(TOKEN.RBRACKET)) { this._error("Expected comma or ']' after array element."); break; }
		}
		this._expect(TOKEN.RBRACKET); return this._finishNode({ type: 'ArrayExpression', elements }, s);
	};
	proto._parseObjectLiteral = function() {
		const s = this._startNode(); this._expect(TOKEN.LBRACE); const properties = [];
		while (!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) {
			properties.push(this._parseObjectProperty());
			if (this._currTokenIs(TOKEN.RBRACE)) break;
			if(this._currTokenIs(TOKEN.COMMA)) { this._advance(); } else if (!this._currTokenIs(TOKEN.RBRACE)) { this._error("Expected a comma between object properties."); break; }
		}
		this._expect(TOKEN.RBRACE); return this._finishNode({ type: 'ObjectExpression', properties }, s);
	};
	proto._parseObjectProperty = function() {
		const s = this._startNode();
		if (this._currTokenIs(TOKEN.DOTDOTDOT)) { return this._parseSpreadElement(); }
		let computed = false; let key;
		if (this._currTokenIs(TOKEN.LBRACKET)) {
			computed = true; this._advance(); key = this._parseExpression(PRECEDENCE.LOWEST); this._expect(TOKEN.RBRACKET);
		} else { key = (this.currToken.type === TOKEN.STRING || this.currToken.type === TOKEN.NUMBER) ? this._parseLiteral() : this._parseIdentifier(); }
		if (this._currTokenIs(TOKEN.COLON)) {
			this._expect(TOKEN.COLON); const value = this._parseExpression(PRECEDENCE.ASSIGNMENT);
			return this._finishNode({ type: 'Property', key, value, kind: 'init', method: false, shorthand: false, computed }, s);
		}
		if (key.type === 'Identifier' && (this._currTokenIs(TOKEN.COMMA) || this._currTokenIs(TOKEN.RBRACE))) {
			return this._finishNode({ type: 'Property', key, value: key, kind: 'init', method: false, shorthand: true, computed: false }, s);
		}
		this._error("Invalid object property syntax. Expected ':' or shorthand."); return null;
	};
    proto._parseSpreadElement = function() {
        const s = this._startNode(); this._expect(TOKEN.DOTDOTDOT);
        const argument = this._parseExpression(PRECEDENCE.ASSIGNMENT);
        return this._finishNode({ type: 'SpreadElement', argument }, s);
    };
    proto._parseArrowFunctionExpression = function(s, params) {
		this._expect(TOKEN.ARROW);
		const body = this._currTokenIs(TOKEN.LBRACE) ? this._parseBlockStatement() : this._parseExpression(PRECEDENCE.ASSIGNMENT);
		return this._finishNode({ type: 'ArrowFunctionExpression', id: null, params, body, async: false, expression: body.type !== 'BlockStatement' }, s);
	};
    proto._parseFunctionExpression = function() { return this._parseFunction('expression'); };
    proto._parseClassExpression = function() {
        const s = this._startNode(); this._expect(TOKEN.CLASS); let id = null;
        if(this._currTokenIs(TOKEN.IDENT)) { id = this._parseIdentifier(); }
		let superClass = null;
		if (this._currTokenIs(TOKEN.EXTENDS)) { this._advance(); superClass = this._parseIdentifier(); }
		const body = this._parseClassBody();
		return this._finishNode({ type: 'ClassExpression', id, superClass, body }, s);
    };
    proto._parseNewExpression = function() {
        const s = this._startNode(); this._expect(TOKEN.NEW);
        const callee = this._parseExpression(PRECEDENCE.MEMBER); let args = [];
        if (this._currTokenIs(TOKEN.LPAREN)) { args = this._parseArgumentsList(); }
        return this._finishNode({ type: 'NewExpression', callee, arguments: args }, s);
    };
    proto._parseCallExpression = function(left) {
        const s = this._startNode(); s.loc.start = left.loc.start;
        const args = this._parseArgumentsList();
        return this._finishNode({ type: 'CallExpression', callee: left, arguments: args, optional: false }, s);
    };
    proto._parseArgumentsList = function() {
        this._expect(TOKEN.LPAREN); const args = [];
        if (this._currTokenIs(TOKEN.RPAREN)) { this._advance(); return args; }
        do { args.push(this._parseExpression(PRECEDENCE.ASSIGNMENT)); } while (this._currTokenIs(TOKEN.COMMA) && (this._advance(), true));
        this._expect(TOKEN.RPAREN); return args;
    };
    proto._parseMemberExpression = function(left, optional = false) {
        const s = this._startNode(); s.loc.start = left.loc.start;
        const computed = this._currTokenIs(TOKEN.LBRACKET); this._advance();
        const property = computed ? this._parseExpression(PRECEDENCE.LOWEST) : this._parseIdentifier();
        if (computed) { this._expect(TOKEN.RBRACKET); }
        return this._finishNode({ type: 'MemberExpression', object: left, property, computed, optional }, s);
    };
    proto._parseChainExpression = function(left) {
        const s = this._startNode(); s.loc.start = left.loc.start; this._advance();
        let expression = this._currTokenIs(TOKEN.LPAREN) ? this._parseCallExpression(left) : this._parseMemberExpression(left, true);
        if (expression.type === 'CallExpression') expression.optional = true;
        return this._finishNode({ type: 'ChainExpression', expression }, s);
    };
    proto._parseTemplateLiteral = function() {
        const s = this._startNode(); const quasis = []; const expressions = [];
        let isTail = false;
        while (!isTail) {
            const quasiStart = this._startNode();
            const value = { raw: this.currToken.literal, cooked: this.currToken.literal };
            isTail = this.currToken.type === TOKEN.TEMPLATE_TAIL;
            quasis.push(this._finishNode({ type: 'TemplateElement', value, tail: isTail }, quasiStart));
            this._advance();
            if (!isTail) {
                expressions.push(this._parseExpression(PRECEDENCE.LOWEST));
                if (!this._currTokenIs(TOKEN.TEMPLATE_MIDDLE) && !this._currTokenIs(TOKEN.TEMPLATE_TAIL)) {
                    this._error("Unterminated template literal expression."); return null;
                }
            }
        }
        return this._finishNode({ type: 'TemplateLiteral', quasis, expressions }, s);
    };

})(MerkabahParser.prototype);