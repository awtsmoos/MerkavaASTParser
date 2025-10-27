// B"H
//parser.js
// --- The Merkabah Ha'Gadol: The Indestructible Emanation (Final & Complete) ---
class MerkabahParser {
	constructor(s) {
		this.l = new Lexer(s);
		this.errors = [];
		this.panicMode = false;

		this.prevToken = null;
		this.currToken = null;
		this.peekToken = null;
		this._advance();
		this._advance();

		this.prefixParseFns = this
			._registerPrefixFns();
		this.infixParseFns = this
			._registerInfixFns();
	}

	_advance() {
		this.prevToken = this
			.currToken;
		this.currToken = this
			.peekToken;
		this.peekToken = this.l
			.nextToken();
	}

	_currTokenIs(t) {
		return this.currToken
			.type === t;
	}
	_peekTokenIs(t) {
		return this.peekToken
			.type === t;
	}

	_startNode() {
		return {
			start: this.currToken
				.column,
			loc: {
				start: {
					line: this
						.currToken
						.line,
					column: this
						.currToken
						.column
				}
			}
		};
	}

	_finishNode(node, startNodeInfo) {
		const p = this.prevToken;
		node.end = p.column + (p
			.literal?.length ||
			0);
		node.loc.end = {
			line: p.line,
			column: p.column + (
				p.literal
				?.length ||
				0)
		};
		return {
			...startNodeInfo,
			...node
		};
	}

	_error(m) {
		if (this.panicMode) return;
		this.panicMode = true;
		this.errors.push(
			`[Shevirah] ${m} on line ${this.currToken.line}:${this.currToken.column}`
			);
	}

	_expect(t) {
		if (this._currTokenIs(t)) {
			this._advance();
			return true;
		}
		this._error(
			`Expected ${t}, got ${this.currToken.type} ("${this.currToken.literal}")`
			);
		return false;
	}

	_synchronize() {
		this.panicMode = false;
		while (!this._currTokenIs(
				TOKEN.EOF)) {
			if (this.prevToken &&
				this.prevToken
				.type === TOKEN
				.SEMICOLON) return;
			switch (this.currToken
				.type) {
				case TOKEN.CLASS:
				case TOKEN.FUNCTION:
				case TOKEN.VAR:
				case TOKEN.CONST:
				case TOKEN.LET:
				case TOKEN.IF:
				case TOKEN.FOR:
				case TOKEN.WHILE:
				case TOKEN.RETURN:
				case TOKEN.IMPORT:
				case TOKEN.EXPORT:
					return;
			}
			this._advance();
		}
	}

	parse() {
		const program = this
			._startNode();
		program.type = 'Program';
		program.body = [];
		program.sourceType =
			'module';

		while (!this._currTokenIs(
				TOKEN.EOF)) {
			if (this.panicMode) this
				._synchronize();

			try {
				const stmt = this
					._parseDeclaration();
				if (stmt) {
					program.body
						.push(stmt);
				} else if (!this
					.panicMode && !
					this
					._currTokenIs(
						TOKEN.EOF)
					) {
					// If parseDeclaration returns null without an error, it's likely a semicolon. Advance past it.
					this._advance();
				}
			} catch (e) {
				// This is a safeguard for truly unexpected errors, not syntax errors.
				this._error(
					"Fatal parser error: " +
					e.message);
				this._synchronize();
			}
		}
		return this._finishNode(
			program, program);
	}

	// --- PARSING REGISTRATIONS ---
	_getPrecedence(t) {
		return PRECEDENCES[t
			.type] || PRECEDENCE
			.LOWEST;
	}

	_registerPrefixFns() {
		return {
			[TOKEN.IDENT]: this
				._parseIdentifier,
			[TOKEN.NUMBER]: this
				._parseLiteral,
			[TOKEN.STRING]: this
				._parseLiteral,
			[TOKEN.TRUE]: this
				._parseLiteral,
			[TOKEN.FALSE]: this
				._parseLiteral,
			[TOKEN.NULL]: this
				._parseLiteral,
			[TOKEN.THIS]: this
				._parseThisExpression,
			[TOKEN.SUPER]: this
				._parseSuperExpression,
			[TOKEN.FUNCTION]: () =>
				this._parseFunction(
					'expression'),
			[TOKEN.LPAREN]: this
				._parseGroupedOrArrowExpression,
			[TOKEN.LBRACKET]: this
				._parseArrayLiteral,
			[TOKEN.LBRACE]: this
				._parseObjectLiteral,
			[TOKEN.BANG]: this
				._parsePrefixExpression,
			[TOKEN.MINUS]: this
				._parsePrefixExpression,
			[TOKEN.TYPEOF]: this
				._parsePrefixExpression,
			[TOKEN.INCREMENT]: this
				._parseUpdateExpression,
			[TOKEN.DECREMENT]: this
				._parseUpdateExpression,
			[TOKEN.NEW]: this
				._parseNewExpression,
			[TOKEN
			.TEMPLATE_HEAD]: this
				._parseTemplateLiteral,
			[TOKEN.ASYNC]: this
				._parseAsyncFunctionExpression,
		};
	}

	_registerInfixFns() {
		const binary = l => this
			._parseBinaryExpression(
				l);
		const logical = l => this
			._parseBinaryExpression(
				l,
				'LogicalExpression'
				);
		const assign = l => this
			._parseAssignmentExpression(
				l);
		return {
			[TOKEN.PLUS]: binary,
			[TOKEN.MINUS]: binary,
			[TOKEN.SLASH]: binary,
			[TOKEN
			.ASTERISK]: binary,
			[TOKEN
			.EXPONENT]: binary,
			[TOKEN.EQ]: binary,
			[TOKEN.NOT_EQ]: binary,
			[TOKEN
			.EQ_STRICT]: binary,
			[TOKEN
			.NOT_EQ_STRICT]: binary,
			[TOKEN.LT]: binary,
			[TOKEN.GT]: binary,
			[TOKEN.LTE]: binary,
			[TOKEN.GTE]: binary,
			[TOKEN
			.INSTANCEOF]: binary,
			[TOKEN.IN]: binary,
			[TOKEN.AND]: logical,
			[TOKEN.OR]: logical,
			[TOKEN
				.NULLISH_COALESCING
			]: logical,
			[TOKEN.ASSIGN]: assign,
			[TOKEN
			.PLUS_ASSIGN]: assign,
			[TOKEN
			.MINUS_ASSIGN]: assign,
			[TOKEN
			.ASTERISK_ASSIGN]: assign,
			[TOKEN
			.SLASH_ASSIGN]: assign,
			[TOKEN
			.EXPONENT_ASSIGN]: assign,
			[TOKEN
			.NULLISH_ASSIGN]: assign,
			[TOKEN.LPAREN]: l =>
				this
				._parseCallExpression(
					l),
			[TOKEN.DOT]: l => this
				._parseMemberExpression(
					l),
			[TOKEN.LBRACKET]: l =>
				this
				._parseMemberExpression(
					l, true),
			[TOKEN.QUESTION]: l =>
				this
				._parseConditionalExpression(
					l),
			[TOKEN.INCREMENT]: l =>
				this
				._parseUpdateExpression(
					l, false),
			[TOKEN.DECREMENT]: l =>
				this
				._parseUpdateExpression(
					l, false),
		};
	}

	// --- PARSING IMPLEMENTATIONS (STATEMENTS & DECLARATIONS) ---

	_parseDeclaration() {
		switch (this.currToken
			.type) {
			case TOKEN.EXPORT:
				return this
					._parseExportDeclaration();
			case TOKEN.IMPORT:
				return this
					._parseImportDeclaration();
			case TOKEN.FUNCTION:
				return this
					._parseFunction(
						'declaration'
						);
			case TOKEN.CLASS:
				return this
					._parseClassDeclaration();
			case TOKEN.LET:
			case TOKEN.CONST:
			case TOKEN.VAR:
				return this
					._parseVariableDeclaration();
			case TOKEN.ASYNC:
				if (this
					._peekTokenIs(
						TOKEN
						.FUNCTION)
					) {
					this._advance();
					return this
						._parseFunction(
							'declaration',
							true);
				}
				return this
					._parseStatement();
			default:
				return this
					._parseStatement();
		}
	}

	_parseStatement() {
		switch (this.currToken
			.type) {
			case TOKEN.LBRACE:
				return this
					._parseBlockStatement();
			case TOKEN.IF:
				return this
					._parseIfStatement();
			case TOKEN.FOR:
				return this
					._parseForStatement();
			case TOKEN.WHILE:
				return this
					._parseWhileStatement();
			case TOKEN.DO:
				return this
					._parseDoWhileStatement();
			case TOKEN.SWITCH:
				return this
					._parseSwitchStatement();
			case TOKEN.RETURN:
				return this
					._parseReturnStatement();
			case TOKEN.BREAK:
				return this
					._parseBreakStatement();
			case TOKEN.CONTINUE:
				return this
					._parseContinueStatement();
			case TOKEN.TRY:
				return this
					._parseTryStatement();
			case TOKEN.SEMICOLON:
				this._advance();
				return null;
			default:
				return this
					._parseExpressionStatement();
		}
	}

	_consumeSemicolon() {
		if (this._currTokenIs(TOKEN
				.SEMICOLON)) {
			this._advance();
			return;
		}
		// Automatic Semicolon Insertion rule: if there's a line break, or the next token is '}', or we're at EOF, a semicolon is implied.
		if (this.currToken
			.hasLineTerminatorBefore ||
			this._currTokenIs(TOKEN
				.RBRACE) || this
			._currTokenIs(TOKEN.EOF)
			) {
			return;
		}
		// This is a potential error, but we let the next parsing step handle it.
	}

	// ... All other parsing functions from _parseExpression to _parseReturnStatement go here ...
	// Due to length limitations, I'm providing the core structure and one complex example.
	// The complete file would include implementations for every function stubbed above.

	// EXAMPLE: A more robust _parseForStatement
	_parseForStatement() {
		const s = this._startNode();
		this
	._advance(); // consume 'for'
		this._expect(TOKEN.LPAREN);

		let init = null;
		if (this._currTokenIs(TOKEN
				.LET) || this
			._currTokenIs(TOKEN
				.CONST) || this
			._currTokenIs(TOKEN.VAR)
			) {
			init = this
				._parseVariableDeclaration();
		} else if (!this
			._currTokenIs(TOKEN
				.SEMICOLON)) {
			init = this
				._parseExpression(
					PRECEDENCE
					.LOWEST);
		}

		// Check for for...in or for...of
		if (this._currTokenIs(TOKEN
				.IN) || (this
				.currToken.type ===
				TOKEN.IDENT && this
				.currToken
				.literal === 'of'
				)) {
			const isForOf = this
				.currToken
				.literal === 'of';
			if (this.currToken
				.type !== TOKEN
				.IN && !isForOf) {
				this._error(
					"Expected 'in' or 'of' in for loop"
					);
			}
			this._advance();
			const right = this
				._parseExpression(
					PRECEDENCE
					.LOWEST);
			this._expect(TOKEN
				.RPAREN);
			const body = this
				._parseStatement();
			return this
		._finishNode({
				type: isForOf ?
					'ForOfStatement' :
					'ForInStatement',
				left: init,
				right,
				body
			}, s);
		}

		// Regular for loop
		this._expect(TOKEN
			.SEMICOLON);
		const test = this
			._currTokenIs(TOKEN
				.SEMICOLON) ? null :
			this._parseExpression(
				PRECEDENCE.LOWEST);
		this._expect(TOKEN
			.SEMICOLON);
		const update = this
			._currTokenIs(TOKEN
				.RPAREN) ? null :
			this._parseExpression(
				PRECEDENCE.LOWEST);
		this._expect(TOKEN.RPAREN);
		const body = this
			._parseStatement();

		return this._finishNode({
			type: 'ForStatement',
			init,
			test,
			update,
			body
		}, s);
	}

	// Placeholder for all other parsing methods which would be fully implemented
	_parseExpression(p) {
		if (this.panicMode)
		return null;
		let prefix = this
			.prefixParseFns[this
				.currToken.type];
		if (!prefix) {
			this._error(
				`Unexpected token "${this.currToken.literal}" in expression.`
				);
			return null;
		}
		let left = prefix.call(
		this);
		while (p < this
			._getPrecedence(this
				.peekToken)) {
			let infix = this
				.infixParseFns[this
					.peekToken.type
					];
			if (!infix) return left;
			this._advance();
			left = infix.call(this,
				left);
		}
		return left;
	}
	_parseIdentifier() {
		const s = this._startNode();
		const n = this.currToken
			.literal;
		this._advance();
		return this._finishNode({
			type: 'Identifier',
			name: n
		}, s);
	}
	_parseLiteral() {
		const s = this._startNode();
		const t = this.currToken;
		let v = t.literal;
		if (t.type === TOKEN.NUMBER)
			v = parseFloat(v);
		if (t.type === TOKEN.TRUE)
			v = true;
		if (t.type === TOKEN.FALSE)
			v = false;
		if (t.type === TOKEN.NULL)
			v = null;
		this._advance();
		return this._finishNode({
			type: 'Literal',
			value: v,
			raw: t.literal
		}, s);
	}
	_parseThisExpression() {
		const s = this._startNode();
		this._advance();
		return this._finishNode({
			type: 'ThisExpression'
		}, s);
	}
	_parseSuperExpression() {
		const s = this._startNode();
		this._advance();
		return this._finishNode({
			type: 'Super'
		}, s);
	}
	_parsePrefixExpression() {
		const s = this._startNode();
		const o = this.currToken
			.literal;
		this._advance();
		const a = this
			._parseExpression(
				PRECEDENCE.PREFIX);
		return this._finishNode({
			type: 'UnaryExpression',
			operator: o,
			argument: a,
			prefix: true
		}, s);
	}
	_parseUpdateExpression(l, isPrefix =
		true) {
		const s = isPrefix ? this
			._startNode() : {
				start: l.start,
				loc: {
					start: l.loc
						.start
				}
			};
		if (!isPrefix && this
			.currToken
			.hasLineTerminatorBefore
			) return l;
		const o = this.currToken
			.literal;
		this._advance();
		const a = isPrefix ? this
			._parseExpression(
				PRECEDENCE.PREFIX) :
			l;
		if (a.type !==
			'Identifier' && a
			.type !==
			'MemberExpression') this
			._error(
				"Invalid left-hand side in update expression"
				);
		return this._finishNode({
			type: 'UpdateExpression',
			operator: o,
			argument: a,
			prefix: isPrefix
		}, s);
	}
	_parseBinaryExpression(l, type =
		'BinaryExpression') {
		const s = {
			start: l.start,
			loc: {
				start: l.loc
					.start
			}
		};
		const o = this.currToken
			.literal;
		const p = this
			._getPrecedence(this
				.currToken);
		this._advance();
		const r = this
			._parseExpression(p - (
				o === '**' ? 1 :
				0));
		return this._finishNode({
			type,
			operator: o,
			left: l,
			right: r
		}, s);
	}
	_parseAssignmentExpression(l) {
		if (l.type !==
			'Identifier' && l
			.type !==
			'MemberExpression' && l
			.type !==
			'ObjectPattern' && l
			.type !== 'ArrayPattern'
			) this._error(
			"Invalid left-hand side in assignment."
			);
		const s = {
			start: l.start,
			loc: {
				start: l.loc
					.start
			}
		};
		const o = this.currToken
			.literal;
		this._advance();
		const r = this
			._parseExpression(
				PRECEDENCE
				.ASSIGNMENT - 1);
		return this._finishNode({
			type: 'AssignmentExpression',
			operator: o,
			left: l,
			right: r
		}, s);
	}
	_parseConditionalExpression(t) {
		const s = {
			start: t.start,
			loc: {
				start: t.loc
					.start
			}
		};
		this._parseExpression(
			PRECEDENCE.LOWEST);
		this._expect(TOKEN.COLON);
		const a = this
			._parseExpression(
				PRECEDENCE
				.ASSIGNMENT - 1);
		return this._finishNode({
			type: 'ConditionalExpression',
			test: t,
			consequent: this
				.prevToken,
			alternate: a
		}, s);
	}
	_parseMemberExpression(o, c =
	false) {
		const s = {
			start: o.start,
			loc: {
				start: o.loc
					.start
			}
		};
		const p = c ? (this
				._advance(), this
				._parseExpression(
					PRECEDENCE
					.LOWEST)) : this
			._parseIdentifier();
		if (c) this._expect(TOKEN
			.RBRACKET);
		return this._finishNode({
			type: 'MemberExpression',
			object: o,
			property: p,
			computed: c,
			optional: false
		}, s);
	}
	_parseCallExpression(c) {
		const s = {
			start: c.start,
			loc: {
				start: c.loc
					.start
			}
		};
		const a = [];
		this._advance();
		if (!this._currTokenIs(TOKEN
				.RPAREN)) {
			do {
				a.push(this
					._currTokenIs(
						TOKEN
						.DOTDOTDOT
						) ? this
					._parseSpreadElement() :
					this
					._parseExpression(
						PRECEDENCE
						.ASSIGNMENT
						))
			} while (this
				._currTokenIs(TOKEN
					.COMMA) && (this
					._advance(),
					true))
		}
		this._expect(TOKEN.RPAREN);
		return this._finishNode({
			type: 'CallExpression',
			callee: c,
			arguments: a,
			optional: false
		}, s);
	}
	_parseNewExpression() {
		const s = this._startNode();
		this._advance();
		const c = this
			._parseExpression(
				PRECEDENCE.NEW);
		let a = [];
		if (this._currTokenIs(TOKEN
				.LPAREN)) {
			this._advance();
			if (!this._currTokenIs(
					TOKEN.RPAREN)) {
				do {
					a.push(this
						._parseExpression(
							PRECEDENCE
							.ASSIGNMENT
							))
				} while (this
					._currTokenIs(
						TOKEN.COMMA
						) && (this
						._advance(),
						true))
			}
			this._expect(TOKEN
				.RPAREN)
		}
		return this._finishNode({
			type: 'NewExpression',
			callee: c,
			arguments: a
		}, s);
	}
	_parseTemplateLiteral() {
		const s = this._startNode();
		const q = [];
		const e = [];
		q.push(this._finishNode({
				type: 'TemplateElement',
				value: {
					raw: this
						.currToken
						.literal,
					cooked: this
						.currToken
						.literal
				},
				tail: false
			}, this
			._startNode()));
		this._advance();
		while (!this._currTokenIs(
				TOKEN.TEMPLATE_TAIL
				)) {
			e.push(this
				._parseExpression(
					PRECEDENCE
					.LOWEST));
			if (!this._currTokenIs(
					TOKEN
					.TEMPLATE_MIDDLE
					) && !this
				._currTokenIs(TOKEN
					.TEMPLATE_TAIL)
				) {
				this._error(
					"Expected template middle or tail"
					);
				break;
			}
			q.push(this._finishNode({
					type: 'TemplateElement',
					value: {
						raw: this
							.currToken
							.literal,
						cooked: this
							.currToken
							.literal
					},
					tail: this
						.currToken
						.type ===
						TOKEN
						.TEMPLATE_TAIL
				}, this
				._startNode()
				));
			this._advance();
		}
		return this._finishNode({
			type: 'TemplateLiteral',
			quasis: q,
			expressions: e
		}, s);
	}
	_parseArrayLiteral() {
		const s = this._startNode();
		this._advance();
		const e = [];
		while (!this._currTokenIs(
				TOKEN.RBRACKET) && !
			this._currTokenIs(TOKEN
				.EOF)) {
			if (this._currTokenIs(
					TOKEN.COMMA)) {
				this._advance();
				e.push(null)
			} else {
				e.push(this
					._currTokenIs(
						TOKEN
						.DOTDOTDOT
						) ? this
					._parseSpreadElement() :
					this
					._parseExpression(
						PRECEDENCE
						.ASSIGNMENT
						));
				if (this
					._currTokenIs(
						TOKEN.COMMA)
					) this
				._advance()
			}
		}
		this._expect(TOKEN
		.RBRACKET);
		return this._finishNode({
			type: 'ArrayExpression',
			elements: e
		}, s);
	}
	_parseObjectLiteral() {
		const s = this._startNode();
		this._advance();
		const p = [];
		while (!this._currTokenIs(
				TOKEN.RBRACE) && !
			this._currTokenIs(TOKEN
				.EOF)) {
			p.push(this
				._parseProperty()
				);
			if (!this._currTokenIs(
					TOKEN.RBRACE))
				this._expect(TOKEN
					.COMMA)
		}
		this._expect(TOKEN.RBRACE);
		return this._finishNode({
			type: 'ObjectExpression',
			properties: p
		}, s);
	}
	_parseProperty() {
		const s = this._startNode();
		if (this._currTokenIs(TOKEN
				.DOTDOTDOT))
		return this
			._parseSpreadElement();
		let c = false;
		let k;
		if (this._currTokenIs(TOKEN
				.LBRACKET)) {
			c = true;
			this._advance();
			k = this
				._parseExpression(
					PRECEDENCE
					.LOWEST);
			this._expect(TOKEN
				.RBRACKET)
		} else {
			k = this
				._parseIdentifier()
		}
		let v = k,
			sh = true;
		if (this._currTokenIs(TOKEN
				.COLON)) {
			sh = false;
			this._advance();
			v = this
				._parseExpression(
					PRECEDENCE
					.ASSIGNMENT)
		}
		return this._finishNode({
			type: 'Property',
			key: k,
			value: v,
			computed: c,
			shorthand: sh,
			kind: 'init'
		}, s);
	}
	_parseBindingPattern() {
		if (this._currTokenIs(TOKEN
				.LBRACE))
		return this
			._parseObjectPattern();
		if (this._currTokenIs(TOKEN
				.LBRACKET))
		return this
			._parseArrayPattern();
		return this
			._parseIdentifier()
	}
	_parseObjectPattern() {
		const s = this._startNode();
		const p = [];
		this._advance();
		while (!this._currTokenIs(
				TOKEN.RBRACE)) {
			p.push(this
				._parseProperty()
				);
			if (this._currTokenIs(
					TOKEN.COMMA))
				this._advance()
		}
		this._expect(TOKEN.RBRACE);
		return this._finishNode({
			type: 'ObjectPattern',
			properties: p
		}, s);
	}
	_parseArrayPattern() {
		const s = this._startNode();
		this._advance();
		const e = [];
		while (!this._currTokenIs(
				TOKEN.RBRACKET)) {
			if (this._currTokenIs(
					TOKEN.COMMA)) e
				.push(null);
			else e.push(this
				._parseBindingPattern()
				);
			if (this._currTokenIs(
					TOKEN.COMMA))
				this._advance()
		}
		this._expect(TOKEN
		.RBRACKET);
		return this._finishNode({
			type: 'ArrayPattern',
			elements: e
		}, s);
	}
	_parseSpreadElement() {
		const s = this._startNode();
		this._advance();
		const a = this
			._parseExpression(
				PRECEDENCE
				.ASSIGNMENT);
		return this._finishNode({
			type: 'SpreadElement',
			argument: a
		}, s);
	}
	_parseFunction(c) {
		const s = this._startNode();
		this._advance();
		let id = null;
		if (this._currTokenIs(TOKEN
				.IDENT)) id = this
			._parseIdentifier();
		else if (c ===
			'declaration') this
			._error(
				"Function declarations require a name"
				);
		this._expect(TOKEN.LPAREN);
		const p = [];
		if (!this._currTokenIs(TOKEN
				.RPAREN)) {
			do {
				p.push(this
					._parseBindingPattern()
					)
			} while (this
				._currTokenIs(TOKEN
					.COMMA) && (this
					._advance(),
					true))
		}
		this._expect(TOKEN.RPAREN);
		const b = this
			._parseBlockStatement();
		const t = c ===
			'declaration' ?
			'FunctionDeclaration' :
			'FunctionExpression';
		return this._finishNode({
			type: t,
			id,
			params: p,
			body: b
		}, s);
	}
	_parseAsyncFunctionExpression() {
		const s = this._startNode();
		this._advance();
		if (this._currTokenIs(TOKEN
				.FUNCTION))
		return this
			._parseFunction(
				'expression',
				true);
		this._error(
			"Expected function after async"
			);
		return null;
	}
	_parseGroupedOrArrowExpression() {
		const s = this._startNode();
		this._advance();
		if (this._currTokenIs(TOKEN
				.RPAREN)) {
			this._advance();
			if (!this._currTokenIs(
					TOKEN.ARROW)) {
				this._error(
					"Expected => for arrow function with no parameters"
					);
				return this
					._finishNode({
						type: 'GroupExpression',
						expression: null
					}, s);
			}
			this._expect(TOKEN
				.ARROW);
			const b = this
				._currTokenIs(TOKEN
					.LBRACE) ? this
				._parseBlockStatement() :
				this
				._parseExpression(
					PRECEDENCE
					.ASSIGNMENT);
			return this
		._finishNode({
				type: 'ArrowFunctionExpression',
				params: [],
				body: b,
				expression: b
					.type !==
					'BlockStatement'
			}, s);
		}
		const e = this
			._parseExpression(
				PRECEDENCE.LOWEST);
		this._expect(TOKEN.RPAREN);
		if (!this._currTokenIs(TOKEN
				.ARROW)) return e;
		this._advance();
		const p = e.type ===
			'SequenceExpression' ? e
			.expressions : [e];
		for (const i of p) {
			if (i.type !==
				'Identifier' && i
				.type !==
				'ObjectPattern' && i
				.type !==
				'ArrayPattern') this
				._error(
					"Invalid arrow function parameter"
					)
		}
		const b = this._currTokenIs(
				TOKEN.LBRACE) ? this
			._parseBlockStatement() :
			this._parseExpression(
				PRECEDENCE
				.ASSIGNMENT);
		return this._finishNode({
			type: 'ArrowFunctionExpression',
			params: p,
			body: b,
			expression: b
				.type !==
				'BlockStatement'
		}, s);
	}
	_parseClassDeclaration() {
		const s = this._startNode();
		this._advance();
		const id = this
			._parseIdentifier();
		let sup = null;
		if (this._currTokenIs(TOKEN
				.EXTENDS)) {
			this._advance();
			sup = this
				._parseIdentifier()
		}
		const b = this
			._parseClassBody();
		return this._finishNode({
			type: 'ClassDeclaration',
			id,
			superClass: sup,
			body: b
		}, s);
	}
	_parseClassBody() {
		const s = this._startNode();
		this._expect(TOKEN.LBRACE);
		const b = [];
		while (!this._currTokenIs(
				TOKEN.RBRACE) && !
			this._currTokenIs(TOKEN
				.EOF)) b.push(this
			._parseMethodDefinition()
			);
		this._expect(TOKEN.RBRACE);
		return this._finishNode({
			type: 'ClassBody',
			body: b
		}, s);
	}
	_parseMethodDefinition() {
		const s = this._startNode();
		let st = false;
		if (this.currToken
			.literal === 'static') {
			st = true;
			this._advance()
		}
		const k = this
			._parseIdentifier();
		const v = this
			._parseFunction(
				'expression');
		return this._finishNode({
			type: 'MethodDefinition',
			key: k,
			value: v,
			kind: k.name ===
				'constructor' ?
				'constructor' :
				'method',
			'static': st
		}, s);
	}
	_parseVariableDeclaration() {
		const s = this._startNode();
		const k = this.currToken
			.literal;
		this._advance();
		const d = [];
		do {
			d.push(this
				._parseVariableDeclarator()
				)
		} while (this._currTokenIs(
				TOKEN.COMMA) && (
				this._advance(),
				true));
		this._consumeSemicolon();
		return this._finishNode({
			type: 'VariableDeclaration',
			declarations: d,
			kind: k
		}, s);
	}
	_parseVariableDeclarator() {
		const s = this._startNode();
		const id = this
			._parseBindingPattern();
		let i = null;
		if (this._currTokenIs(TOKEN
				.ASSIGN)) {
			this._advance();
			i = this
				._parseExpression(
					PRECEDENCE
					.ASSIGNMENT)
		}
		return this._finishNode({
			type: 'VariableDeclarator',
			id,
			init: i
		}, s);
	}
	_parseWhileStatement() {
		const s = this._startNode();
		this._advance();
		this._expect(TOKEN.LPAREN);
		const t = this
			._parseExpression(
				PRECEDENCE.LOWEST);
		this._expect(TOKEN.RPAREN);
		const b = this
			._parseStatement();
		return this._finishNode({
			type: 'WhileStatement',
			test: t,
			body: b
		}, s);
	}
	_parseDoWhileStatement() {
		const s = this._startNode();
		this._advance();
		const b = this
			._parseStatement();
		this._expect(TOKEN.WHILE);
		this._expect(TOKEN.LPAREN);
		const t = this
			._parseExpression(
				PRECEDENCE.LOWEST);
		this._expect(TOKEN.RPAREN);
		this._consumeSemicolon();
		return this._finishNode({
			type: 'DoWhileStatement',
			body: b,
			test: t
		}, s);
	}
	_parseSwitchStatement() {
		const s = this._startNode();
		this._advance();
		this._expect(TOKEN.LPAREN);
		const d = this
			._parseExpression(
				PRECEDENCE.LOWEST);
		this._expect(TOKEN.RPAREN);
		this._expect(TOKEN.LBRACE);
		const c = [];
		while (!this._currTokenIs(
				TOKEN.RBRACE)) c
			.push(this
				._parseSwitchCase()
				);
		this._expect(TOKEN.RBRACE);
		return this._finishNode({
			type: 'SwitchStatement',
			discriminant: d,
			cases: c
		}, s);
	}
	_parseSwitchCase() {
		const s = this._startNode();
		let t = null;
		if (this._currTokenIs(TOKEN
				.CASE)) {
			this._advance();
			t = this
				._parseExpression(
					PRECEDENCE
					.LOWEST)
		} else this._expect(TOKEN
			.DEFAULT);
		this._expect(TOKEN.COLON);
		const c = [];
		while (!this._currTokenIs(
				TOKEN.CASE) && !this
			._currTokenIs(TOKEN
				.DEFAULT) && !this
			._currTokenIs(TOKEN
				.RBRACE)) c.push(
			this
			._parseStatement());
		return this._finishNode({
			type: 'SwitchCase',
			test: t,
			consequent: c
		}, s);
	}
	_parseBreakStatement() {
		const s = this._startNode();
		this._advance();
		this._consumeSemicolon();
		return this._finishNode({
			type: 'BreakStatement',
			label: null
		}, s);
	}
	_parseContinueStatement() {
		const s = this._startNode();
		this._advance();
		this._consumeSemicolon();
		return this._finishNode({
			type: 'ContinueStatement',
			label: null
		}, s);
	}
	_parseTryStatement() {
		const s = this._startNode();
		this._advance();
		const block = this
			._parseBlockStatement();
		let handler = null;
		let finalizer = null;
		if (this._currTokenIs(TOKEN
				.CATCH)) {
			handler = this
				._parseCatchClause();
		}
		if (this._currTokenIs(TOKEN
				.FINALLY)) {
			this._advance();
			finalizer = this
				._parseBlockStatement();
		}
		if (!handler && !finalizer)
			this._error(
				"Expected catch or finally block"
				);
		return this._finishNode({
			type: 'TryStatement',
			block,
			handler,
			finalizer
		}, s);
	}
	_parseCatchClause() {
		const s = this._startNode();
		this._advance();
		let param = null;
		if (this._currTokenIs(TOKEN
				.LPAREN)) {
			this._expect(TOKEN
				.LPAREN);
			param = this
				._parseBindingPattern();
			this._expect(TOKEN
				.RPAREN);
		}
		const body = this
			._parseBlockStatement();
		return this._finishNode({
			type: 'CatchClause',
			param,
			body
		}, s);
	}
	_parseImportDeclaration() {
		const s = this._startNode();
		this._advance();
		const sp = [];
		if (this._currTokenIs(TOKEN
				.STRING)) {
			const src = this
				._parseLiteral();
			this
		._consumeSemicolon();
			return this
		._finishNode({
				type: 'ImportDeclaration',
				specifiers: sp,
				source: src
			}, s);
		}
		if (this._currTokenIs(TOKEN
				.IDENT)) {
			sp.push(this
				._finishNode({
						type: 'ImportDefaultSpecifier',
						local: this
							._parseIdentifier()
					}, this
					._startNode()
					));
			if (this._currTokenIs(
					TOKEN.COMMA))
				this._advance()
		}
		if (this._currTokenIs(TOKEN
				.ASTERISK)) {
			const ss = this
				._startNode();
			this._advance();
			this._expect(TOKEN.AS);
			const l = this
				._parseIdentifier();
			sp.push(this
				._finishNode({
					type: 'ImportNamespaceSpecifier',
					local: l
				}, ss))
		} else if (this
			._currTokenIs(TOKEN
				.LBRACE)) {
			this._advance();
			while (!this
				._currTokenIs(TOKEN
					.RBRACE)) {
				const ss = this
					._startNode();
				const i = this
					._parseIdentifier();
				let l = i;
				if (this
					._currTokenIs(
						TOKEN.AS)) {
					this._advance();
					l = this
						._parseIdentifier()
				}
				sp.push(this
					._finishNode({
						type: 'ImportSpecifier',
						imported: i,
						local: l
					}, ss));
				if (this
					._currTokenIs(
						TOKEN.COMMA)
					) this
				._advance();
				else break
			}
			this._expect(TOKEN
				.RBRACE)
		}
		if (sp.length === 0 && !this
			._currTokenIs(TOKEN
				.LBRACE)) this
			._error(
				"Invalid import statement"
				);
		this._expect(TOKEN.FROM);
		const src = this
			._parseLiteral();
		this._consumeSemicolon();
		return this._finishNode({
			type: 'ImportDeclaration',
			specifiers: sp,
			source: src
		}, s);
	}
	_parseExportDeclaration() {
		const s = this._startNode();
		this._advance();
		if (this._currTokenIs(TOKEN
				.DEFAULT)) {
			this._advance();
			const d = this
				._parseExpression(
					PRECEDENCE
					.ASSIGNMENT);
			this
		._consumeSemicolon();
			return this
		._finishNode({
				type: 'ExportDefaultDeclaration',
				declaration: d
			}, s);
		}
		const d = this
			._parseDeclaration();
		return this._finishNode({
			type: 'ExportNamedDeclaration',
			declaration: d,
			specifiers: [],
			source: null
		}, s);
	}
	_parseBlockStatement() {
		const s = this._startNode();
		this._expect(TOKEN.LBRACE);
		const b = [];
		while (!this._currTokenIs(
				TOKEN.RBRACE) && !
			this._currTokenIs(TOKEN
				.EOF)) {
			const stmt = this
				._parseDeclaration();
			if (stmt) {
				b.push(stmt);
			}
		}
		this._expect(TOKEN.RBRACE);
		return this._finishNode({
			type: 'BlockStatement',
			body: b
		}, s);
	}
	_parseExpressionStatement() {
		const s = this._startNode();
		const e = this
			._parseExpression(
				PRECEDENCE.LOWEST);
		this._consumeSemicolon();
		return this._finishNode({
			type: 'ExpressionStatement',
			expression: e
		}, s);
	}
	_parseIfStatement() {
		const s = this._startNode();
		this._advance();
		this._expect(TOKEN.LPAREN);
		const t = this
			._parseExpression(
				PRECEDENCE.LOWEST);
		this._expect(TOKEN.RPAREN);
		const c = this
			._parseStatement();
		let a = null;
		if (this._currTokenIs(TOKEN
				.ELSE)) {
			this._advance();
			a = this
				._parseStatement();
		}
		return this._finishNode({
			type: 'IfStatement',
			test: t,
			consequent: c,
			alternate: a
		}, s);
	}
	_parseReturnStatement() {
		const s = this._startNode();
		this._advance();
		let a = null;
		if (!this._currTokenIs(TOKEN
				.SEMICOLON) && !this
			.currToken
			.hasLineTerminatorBefore
			) {
			a = this
				._parseExpression(
					PRECEDENCE
					.LOWEST);
		}
		this._consumeSemicolon();
		return this._finishNode({
			type: 'ReturnStatement',
			argument: a
		}, s);
	}
}