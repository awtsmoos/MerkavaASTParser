// B"H --- Parsing Expressions ---
(function(proto) {
	// --- Self-Registration ---
	// This function attaches all expression-related parsing methods to the parser's prototype.
	proto
		.registerExpressionParsers =
		function() {
			const p = this
				.prefixParseFns;
			p[TOKEN.IDENT] = this
				._parseIdentifier;
			p[TOKEN.NUMBER] = p[
					TOKEN.STRING] =
				p[TOKEN.TRUE] = p[
					TOKEN.FALSE] =
				p[TOKEN.NULL] = this
				._parseLiteral;
			p[TOKEN.THIS] = this
				._parseThisExpression;
			p[TOKEN.SUPER] = this
				._parseSuperExpression;
			p[TOKEN.FUNCTION] =
			() => this
				._parseFunction(
					'expression');
			p[TOKEN.LPAREN] = this
				._parseGroupedOrArrowExpression;
			p[TOKEN.LBRACKET] = this
				._parseArrayLiteral;
			p[TOKEN.LBRACE] = this
				._parseObjectLiteral;
			p[TOKEN.BANG] = p[TOKEN
					.MINUS] = p[
					TOKEN.TYPEOF] =
				this
				._parsePrefixExpression;
			p[TOKEN.INCREMENT] = p[
					TOKEN.DECREMENT
					] = (
				isPrefix) => this
				._parseUpdateExpression(
					null, isPrefix);
			p[TOKEN.NEW] = this
				._parseNewExpression;
			p[TOKEN.TEMPLATE_HEAD] =
				this
				._parseTemplateLiteral;

			const i = this
				.infixParseFns;
			const binary = l => this
				._parseBinaryExpression(
					l);
			const assign = l => this
				._parseAssignmentExpression(
					l);
			i[TOKEN.PLUS] = i[TOKEN
					.MINUS] = i[
					TOKEN.SLASH] =
				i[TOKEN.ASTERISK] =
				i[TOKEN.EXPONENT] =
				binary;
			i[TOKEN.EQ] = i[TOKEN
					.NOT_EQ] = i[
					TOKEN.EQ_STRICT
					] = i[TOKEN
					.NOT_EQ_STRICT
					] = binary;
			i[TOKEN.LT] = i[TOKEN
					.GT] = i[TOKEN
					.LTE] = i[TOKEN
					.GTE] = i[TOKEN
					.INSTANCEOF] =
				i[TOKEN.IN] =
				binary;
			i[TOKEN.AND] = i[TOKEN
					.OR] = i[TOKEN
					.NULLISH_COALESCING
					] = l => this
				._parseBinaryExpression(
					l,
					'LogicalExpression'
					);
			i[TOKEN.ASSIGN] = i[
					TOKEN
					.PLUS_ASSIGN] =
				i[TOKEN
					.MINUS_ASSIGN] =
				i[TOKEN
					.ASTERISK_ASSIGN
					] = assign;
			i[TOKEN.LPAREN] = l =>
				this
				._parseCallExpression(
					l);
			i[TOKEN.DOT] = l => this
				._parseMemberExpression(
					l);
			i[TOKEN.LBRACKET] = l =>
				this
				._parseMemberExpression(
					l, true);
			i[TOKEN.QUESTION] = l =>
				this
				._parseConditionalExpression(
					l);
			i[TOKEN.INCREMENT] = i[
					TOKEN.DECREMENT
					] = l => this
				._parseUpdateExpression(
					l, false);
		};

	proto._parseExpression =
		function(precedence) {
			if (this.panicMode)
				return null;
			if (!this
				.prefixParseFns[this
					.currToken.type]
				) {
				this._error(
					`Cannot parse expression starting with ${this.currToken.type}`
					);
				return null;
			}
			let leftExp = this
				.prefixParseFns[this
					.currToken.type]
				.call(this);

			while (!this
				._peekTokenIs(TOKEN
					.SEMICOLON) &&
				precedence < this
				._getPrecedence(this
					.peekToken)) {
				if (!this
					.infixParseFns[
						this
						.peekToken
						.type])
					return leftExp;
				if (!leftExp)
				return null;
				this._advance();
				leftExp = this
					.infixParseFns[
						this
						.currToken
						.type].call(
						this,
						leftExp);
			}
			return leftExp;
		};

	proto._parseIdentifier =
		function() {
			const s = this
				._startNode();
			const node = {
				type: 'Identifier',
				name: this
					.currToken
					.literal
			};
			this._advance();
			return this._finishNode(
				node, s);
		};
	proto._parseLiteral =
function() {
		const s = this
			._startNode();
		const t = this
		.currToken;
		let v = t.literal;
		if (t.type === TOKEN
			.NUMBER) v =
			parseFloat(v);
		else if (t.type ===
			TOKEN.TRUE) v =
		true;
		else if (t.type ===
			TOKEN.FALSE) v =
			false;
		else if (t.type ===
			TOKEN.NULL) v =
		null;
		this._advance();
		return this
	._finishNode({
			type: 'Literal',
			value: v,
			raw: t
				.literal
		}, s);
	};
	proto._parseThisExpression =
		function() {
			const s = this
				._startNode();
			this._advance();
			return this
		._finishNode({
				type: 'ThisExpression'
			}, s);
		};
	proto._parseSuperExpression =
		function() {
			const s = this
				._startNode();
			this._advance();
			return this
		._finishNode({
				type: 'Super'
			}, s);
		};
	proto._parsePrefixExpression =
		function() {
			const s = this
				._startNode();
			const op = this
				.currToken.literal;
			this._advance();
			const arg = this
				._parseExpression(
					PRECEDENCE
					.PREFIX);
			if (!arg) return null;
			return this
		._finishNode({
				type: 'UnaryExpression',
				operator: op,
				argument: arg,
				prefix: true
			}, s);
		};
	proto._parseUpdateExpression =
		function(left, isPrefix =
			true) {
			const s = isPrefix ?
				this._startNode() :
				{
					start: left
						.start,
					loc: {
						start: left
							.loc
							.start
					}
				};
			if (!isPrefix && this
				.currToken
				.hasLineTerminatorBefore
				) return left;
			const op = this
				.currToken.literal;
			this._advance();
			const arg = isPrefix ?
				this
				._parseExpression(
					PRECEDENCE
					.PREFIX) : left;
			if (!arg || (arg
					.type !==
					'Identifier' &&
					arg.type !==
					'MemberExpression'
					)) {
				this._error(
					"Invalid left-hand side in update expression"
					);
				return null;
			}
			return this
		._finishNode({
				type: 'UpdateExpression',
				operator: op,
				argument: arg,
				prefix: isPrefix
			}, s);
		};
	proto._parseBinaryExpression =
		function(left, type =
			'BinaryExpression') {
			const s = {
				start: left
					.start,
				loc: {
					start: left
						.loc
						.start
				}
			};
			const op = this
				.currToken.literal;
			const prec = this
				._getPrecedence(this
					.currToken);
			this._advance();
			const right = this
				._parseExpression(
					prec - (op ===
						'**' ? 1 : 0
						));
			if (!right) return null;
			return this
		._finishNode({
				type,
				operator: op,
				left,
				right
			}, s);
		};
	proto
		._parseAssignmentExpression =
		function(left) {
			if (left.type !==
				'Identifier' && left
				.type !==
				'MemberExpression' &&
				left.type !==
				'ObjectPattern' &&
				left.type !==
				'ArrayPattern') {
				this._error(
					"Invalid left-hand side in assignment."
					);
				return null;
			}
			const s = {
				start: left
					.start,
				loc: {
					start: left
						.loc
						.start
				}
			};
			const op = this
				.currToken.literal;
			this._advance();
			const right = this
				._parseExpression(
					PRECEDENCE
					.ASSIGNMENT - 1
					);
			if (!right) return null;
			return this
		._finishNode({
				type: 'AssignmentExpression',
				operator: op,
				left,
				right
			}, s);
		};
		
	proto._parseConditionalExpression =
		function(test) {
			const s = {
				start: test.start,
				loc: {
					start: test.loc.start
				}
			};
			// The next expression is the 'consequent'. We MUST store its result.
			const consequent = this._parseExpression(PRECEDENCE.ASSIGNMENT - 1);
			
			if (!this._expect(TOKEN.COLON)) return null;
			
			// The final expression is the 'alternate'.
			const alternate = this._parseExpression(PRECEDENCE.ASSIGNMENT - 1);
			
			if (!consequent || !alternate) return null;
	
			return this._finishNode({
				type: 'ConditionalExpression',
				test,
				consequent, // Now this holds the correct AST node
				alternate
			}, s);
		};
	
	
	proto._parseMemberExpression =
		function(obj, computed =
			false) {
			const s = {
				start: obj
					.start,
				loc: {
					start: obj
						.loc
						.start
				}
			};
			const prop = computed ?
				this
				._parseExpression(
					PRECEDENCE
					.LOWEST) : this
				._parseIdentifier();
			if (computed) this
				._expect(TOKEN
					.RBRACKET);
			if (!prop) return null;
			return this
		._finishNode({
				type: 'MemberExpression',
				object: obj,
				property: prop,
				computed,
				optional: false
			}, s);
		};
	proto._parseCallExpression =
		function(callee) {
			const s = {
				start: callee
					.start,
				loc: {
					start: callee
						.loc
						.start
				}
			};
			const args = [];
			if (!this._peekTokenIs(
					TOKEN.RPAREN)) {
				this._advance();
				do {
					args.push(this
						._currTokenIs(
							TOKEN
							.DOTDOTDOT
							) ?
						this
						._parseSpreadElement() :
						this
						._parseExpression(
							PRECEDENCE
							.ASSIGNMENT
							));
				} while (this
					._currTokenIs(
						TOKEN.COMMA
						) && (this
						._advance(),
						true));
			}
			this._expect(TOKEN
				.RPAREN);
			return this
		._finishNode({
				type: 'CallExpression',
				callee,
				arguments: args,
				optional: false
			}, s);
		};
	proto._parseNewExpression =
		function() {
			const s = this
				._startNode();
			this._advance();
			const callee = this
				._parseExpression(
					PRECEDENCE.NEW);
			let args = [];
			if (this._currTokenIs(
					TOKEN.LPAREN)) {
				this._advance();
				if (!this
					._currTokenIs(
						TOKEN.RPAREN
						)) {
					do {
						args.push(
							this
							._parseExpression(
								PRECEDENCE
								.ASSIGNMENT
								)
							);
					} while (this
						._currTokenIs(
							TOKEN
							.COMMA
							) && (
							this
							._advance(),
							true));
				}
				this._expect(TOKEN
					.RPAREN);
			}
			if (!callee)
		return null;
			return this
		._finishNode({
				type: 'NewExpression',
				callee,
				arguments: args
			}, s);
		};
	proto._parseArrayLiteral =
		function() {
			const s = this
				._startNode();
			this._advance();
			const elements = [];
			while (!this
				._currTokenIs(TOKEN
					.RBRACKET) && !
				this._currTokenIs(
					TOKEN.EOF)) {
				if (this
					._currTokenIs(
						TOKEN.COMMA)
					) {
					this._advance();
					elements.push(
						null);
				} else {
					elements.push(
						this
						._currTokenIs(
							TOKEN
							.DOTDOTDOT
							) ?
						this
						._parseSpreadElement() :
						this
						._parseExpression(
							PRECEDENCE
							.ASSIGNMENT
							));
					if (this
						._currTokenIs(
							TOKEN
							.COMMA))
						this
						._advance();
				}
			}
			this._expect(TOKEN
				.RBRACKET);
			return this
		._finishNode({
				type: 'ArrayExpression',
				elements
			}, s);
		};
	proto._parseObjectLiteral =
		function() {
			const s = this
				._startNode();
			this._advance();
			const properties = [];
			while (!this
				._currTokenIs(TOKEN
					.RBRACE) && !
				this._currTokenIs(
					TOKEN.EOF)) {
				properties.push(this
					._parseProperty()
					);
				if (!this
					._currTokenIs(
						TOKEN.RBRACE
						)) {
					if (!this
						._expect(
							TOKEN
							.COMMA))
						break;
				}
			}
			this._expect(TOKEN
				.RBRACE);
			return this
		._finishNode({
				type: 'ObjectExpression',
				properties
			}, s);
		};
	proto._parseProperty =
	function() {
		const s = this
			._startNode();
		if (this._currTokenIs(
				TOKEN.DOTDOTDOT
				)) return this
			._parseSpreadElement();
		let computed = false,
			key;
		if (this._currTokenIs(
				TOKEN.LBRACKET
				)) {
			computed = true;
			this._advance();
			key = this
				._parseExpression(
					PRECEDENCE
					.LOWEST);
			this._expect(TOKEN
				.RBRACKET);
		} else {
			key = this
				._parseIdentifier();
		}
		let value = key,
			shorthand = true;
		if (this._currTokenIs(
				TOKEN.COLON)) {
			shorthand = false;
			this._advance();
			value = this
				._parseExpression(
					PRECEDENCE
					.ASSIGNMENT
					);
		}
		if (!key || !value)
			return null;
		return this
	._finishNode({
			type: 'Property',
			key,
			value,
			computed,
			shorthand,
			kind: 'init'
		}, s);
	};
	proto
		._parseGroupedOrArrowExpression =
		function() {
			const s = this
				._startNode();
			this._advance();
			if (this._currTokenIs(
					TOKEN.RPAREN)) {
				this._advance();
				if (!this._expect(
						TOKEN.ARROW
						)) {
					this._error(
						"Expected => for arrow function with no parameters"
						);
					return this
						._finishNode({
							type: 'GroupedExpression',
							expression: null
						}, s);
				}
				const body = this
					._currTokenIs(
						TOKEN.LBRACE
						) ? this
					._parseBlockStatement() :
					this
					._parseExpression(
						PRECEDENCE
						.ASSIGNMENT
						);
				return this
					._finishNode({
						type: 'ArrowFunctionExpression',
						params: [],
						body,
						expression: body
							.type !==
							'BlockStatement'
					}, s);
			}
			const expr = this
				._parseExpression(
					PRECEDENCE
					.LOWEST);
			if (!this._expect(TOKEN
					.RPAREN))
			return null;
			if (!this._currTokenIs(
					TOKEN.ARROW))
				return expr;
			this._advance();
			const params = expr
				.type ===
				'SequenceExpression' ?
				expr.expressions : [
					expr
				];
			for (const p of
				params) {
				if (p.type !==
					'Identifier' &&
					p.type !==
					'ObjectPattern' &&
					p.type !==
					'ArrayPattern')
					this._error(
						"Invalid arrow function parameter"
						);
			}
			const body = this
				._currTokenIs(TOKEN
					.LBRACE) ? this
				._parseBlockStatement() :
				this
				._parseExpression(
					PRECEDENCE
					.ASSIGNMENT);
			if (!body) return null;
			return this
		._finishNode({
				type: 'ArrowFunctionExpression',
				params,
				body,
				expression: body
					.type !==
					'BlockStatement'
			}, s);
		};
	
	
	
	
	
	
	
	proto._parseTemplateLiteral =
		function() {
			const s = this._startNode();
			const quasis = [];
			const expressions = [];
	
			// Handle the TEMPLATE_HEAD
			quasis.push(this._finishNode({
				type: 'TemplateElement',
				value: {
					raw: this.currToken.literal,
					cooked: this.currToken.literal // In a real parser, you'd process escape sequences here
				},
				tail: false
			}, this._startNode()));
			
			this._advance(); // Consume TEMPLATE_HEAD
	
			// Loop through expressions and template middle parts
			while (!this._currTokenIs(TOKEN.TEMPLATE_TAIL)) {
				expressions.push(this._parseExpression(PRECEDENCE.LOWEST));
				
				// After an expression, we MUST find a TEMPLATE_MIDDLE or TEMPLATE_TAIL
				if (!this._currTokenIs(TOKEN.TEMPLATE_MIDDLE) && !this._currTokenIs(TOKEN.TEMPLATE_TAIL)) {
					this._error("Expected a template middle or tail token after expression.");
					// Return what we have, or null, to stop the loop.
					return null; 
				}
	
				const isTail = this._currTokenIs(TOKEN.TEMPLATE_TAIL);
				quasis.push(this._finishNode({
					type: 'TemplateElement',
					value: {
						raw: this.currToken.literal,
						cooked: this.currToken.literal
					},
					tail: isTail
				}, this._startNode()));
				
				// This advance is CRITICAL to prevent the infinite loop.
				this._advance();
			}
			
			return this._finishNode({
				type: 'TemplateLiteral',
				quasis,
				expressions
			}, s);
		};
	
	proto._parseSpreadElement =
		function() {
			const s = this
				._startNode();
			this._advance();
			const arg = this
				._parseExpression(
					PRECEDENCE
					.ASSIGNMENT);
			if (!arg) return null;
			return this
		._finishNode({
				type: 'SpreadElement',
				argument: arg
			}, s);
		};

})(MerkabahParser.prototype);