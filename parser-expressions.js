// In parser-expressions.js
// B"H --- Parsing Expressions [DEFINITIVE, UNIVERSAL & COMPLETE] ---
(function(proto) {
	proto
		.registerExpressionParsers =
		function() {
			const p = this
				.prefixParseFns,
				i = this
				.infixParseFns;
			p[TOKEN.IDENT] = this
				._parseIdentifier,
				p[TOKEN.NUMBER] = p[
					TOKEN.STRING] =
				p[TOKEN.TRUE] = p[
					TOKEN.FALSE] =
				p[TOKEN.NULL] = this
				._parseLiteral, p[
					TOKEN.THIS] =
				this
				._parseThisExpression,
				p[TOKEN.SUPER] =
				this._parseSuper, p[
					TOKEN.BANG] = p[
					TOKEN.MINUS] =
				p[TOKEN.PLUS] = p[
					TOKEN.TYPEOF] =
				p[TOKEN.AWAIT] =
				this
				._parsePrefixExpression,
				p[TOKEN.INCREMENT] =
				p[TOKEN.DECREMENT] =
				l => this
				._parseUpdateExpression(
					l, !0), p[TOKEN
					.LPAREN] = this
				._parseGroupedOrArrowExpression,
				p[TOKEN.LBRACE] =
				this
				._parseObjectLiteral,
				p[TOKEN.LBRACKET] =
				this
				._parseArrayLiteral,
				p[TOKEN
					.TEMPLATE_HEAD
				] = p[TOKEN
					.TEMPLATE_TAIL
				] = this
				._parseTemplateLiteral,
				p[TOKEN.NEW] = this
				._parseNewExpression,
				p[TOKEN.FUNCTION] =
				this
				._parseFunctionExpression,
				p[TOKEN.CLASS] =
				this
				._parseClassExpression;
				
				p[TOKEN.ASYNC] = this._parseAsyncExpression;
				
				
				p[TOKEN.YIELD] = this._parseYieldExpression;
				
				
				p[TOKEN.DOTDOTDOT] = this._parseSpreadElement;
				
			const binary = l => this
				._parseBinaryExpression(
					l);
			i[TOKEN.PLUS] = i[TOKEN
					.MINUS] = i[
					TOKEN.SLASH] =
				i[TOKEN.ASTERISK] =
				i[TOKEN.MODULO] =
				binary, i[TOKEN
					.EQ] = i[TOKEN
					.NOT_EQ] = i[
					TOKEN.EQ_STRICT
				] = i[TOKEN
					.NOT_EQ_STRICT
				] = binary, i[
					TOKEN.LT] = i[
					TOKEN.GT] = i[
					TOKEN.LTE] = i[
					TOKEN.GTE] = i[
					TOKEN.IN] = i[
					TOKEN.INSTANCEOF
				] = binary, i[
					TOKEN.AND] = i[
					TOKEN.OR] = i[
					TOKEN
					.NULLISH_COALESCING
				] = binary, i[
					TOKEN.EXPONENT
				] = binary, i[
					TOKEN.ASSIGN] =
				i[TOKEN
					.PLUS_ASSIGN] =
				i[
					TOKEN
					.MINUS_ASSIGN] =
				i[TOKEN
					.ASTERISK_ASSIGN
				] = i[TOKEN
					.SLASH_ASSIGN] =
				i[TOKEN
					.EXPONENT_ASSIGN
				] = i[TOKEN
					.MODULO_ASSIGN
				] = l => this
				._parseAssignmentExpression(
					l), i[TOKEN
					.COMMA] = l =>
				this
				._parseSequenceExpression(
					l), i[TOKEN
					.INCREMENT] = i[
					TOKEN.DECREMENT
				] = l => this
				._parseUpdateExpression(
					l, !1), i[TOKEN
					.LPAREN] = this
				._parseCallExpression,
				i[TOKEN.DOT] = this
				._parseMemberExpression,
				i[TOKEN.LBRACKET] =
				this
				._parseMemberExpression,
				i[TOKEN
					.OPTIONAL_CHAINING
				] = this
				._parseChainExpression,
				i[TOKEN.QUESTION] =
				this
				._parseConditionalExpression
		};

	// B"H
	// In parser-expressions.js
	// B"H
	// In parser-expressions.js
	// In parser-expressions.js

	proto._parseExpression =
		function(precedence) {
			this.recursionDepth++;
			if (this
				.recursionDepth >
				this
				.maxRecursionDepth
			) {
				// This is our safety valve against a true runaway recursion bug.
				throw new Error(
					"Stack overflow detected: Maximum recursion depth exceeded."
				);
			}

			try {
				// --- ALL THE ORIGINAL LOGIC GOES INSIDE THE 'TRY' BLOCK ---
				let prefix = this
					.prefixParseFns[
						this
						.currToken
						.type];
				if (!prefix) {
					this._error(
						`No prefix parse function for ${this.currToken.type}`
					);
					return null;
				}
				let leftExp = prefix
					.call(this);

				let guard = 0;
				while (precedence <
					this
					._getPrecedence(
						this
						.currToken)
				) {
					if (guard++ >
						5000) {
						throw new Error(
							"Infinite loop detected in _parseExpression's while loop."
						);
					}
					let infix = this
						.infixParseFns[
							this
							.currToken
							.type];
					if (!infix) {
						return leftExp;
					}
					leftExp = infix
						.call(this,
							leftExp
						);
				}
				return leftExp;
				// --- END OF ORIGINAL LOGIC ---

			} finally {
				// --- THIS IS THE CRITICAL FIX ---
				// This 'finally' block is GUARANTEED to execute when the function returns,
				// no matter where it returns from. This correctly decrements the counter.
				this
					.recursionDepth--;
			}
		};

	proto._parseIdentifier =
		function() {
			if (this._peekTokenIs(
					TOKEN.ARROW)) {
				const t = this
					._startNode(),
					e = {
						type: "Identifier",
						name: this
							.currToken
							.literal
					};
				this._advance();
				const s = this
					._finishNode(e,
						t);
				return this
					._parseArrowFunctionExpression(
						t, [s])
			}
			const t = this
				._startNode(),
				e = {
					type: "Identifier",
					name: this
						.currToken
						.literal
				};
			return this._advance(),
				this._finishNode(e,
					t)
		};
	proto._parseLiteral =
		function() {
			const t = this
				._startNode(),
				e = this.currToken;
			let s = e.literal;
			e.type === TOKEN
				.NUMBER ? s =
				parseFloat(s) : e
				.type === TOKEN
				.TRUE ? s = !0 : e
				.type === TOKEN
				.FALSE ? s = !1 : e
				.type === TOKEN
				.NULL && (s = null);
			const i = {
				type: "Literal",
				value: s,
				raw: e.literal
			};
			return this._advance(),
				this._finishNode(i,
					t)
		};
	proto._parseThisExpression =
		function() {
			const t = this
				._startNode();
			return this._advance(),
				this._finishNode({
					type: "ThisExpression"
				}, t)
		};
	proto._parseSuper = function() {
		const t = this
			._startNode();
		return this._advance(),
			this._finishNode({
				type: "Super"
			}, t)
	};
	proto._parsePrefixExpression =
		function() {
			const t = this
				._startNode(),
				e = this.currToken
				.literal,
				s = this.currToken
				.type === TOKEN
				.AWAIT;
			this._advance();
			const i = this
				._parseExpression(
					PRECEDENCE
					.PREFIX),
				o = s ?
				"AwaitExpression" :
				"UnaryExpression";
			return this
				._finishNode({
					type: o,
					operator: e,
					argument: i,
					prefix: !0
				}, t)
		};
	proto._parseUpdateExpression =
		function(t, e) {
			const s = this
				._startNode();
			e ? (t = this
					._parseIdentifier()
				) : s.loc
				.start = t.loc
				.start;
			const i = this.currToken
				.literal;
			return this._advance(),
				this._finishNode({
					type: "UpdateExpression",
					operator: i,
					argument: t,
					prefix: e
				}, s)
		};
		
		
	



proto._parseGroupedOrArrowExpression = function() {
    const s = this._startNode();
    this._expect(TOKEN.LPAREN);

    // Handle the special case of an empty `()`
    if (this._currTokenIs(TOKEN.RPAREN)) {
        this._expect(TOKEN.RPAREN);
        if (this._currTokenIs(TOKEN.ARROW)) {
            // This is a no-parameter arrow function: () => ...
            return this._parseArrowFunctionExpression(s, [], false);
        }
        // This was just `()`, which is an error in an expression context.
        this._error("Unexpected empty parentheses in expression.");
        return null;
    }

    // THIS IS THE CRITICAL CHANGE:
    // Parse the content as a single, generic expression first.
    // This will correctly handle `(a + b)` and even `(async () => {...})`.
    const innerExpression = this._parseExpression(PRECEDENCE.LOWEST);
    
    this._expect(TOKEN.RPAREN);

    // NOW, AFTER we have parsed the content and the closing parenthesis,
    // we check if an arrow follows. This is the only way to resolve the ambiguity.
    if (this._currTokenIs(TOKEN.ARROW)) {
        let params = [];
        let isAsync = false;

        // Now we reverse-engineer the parameter list from the expression we parsed.
        if (innerExpression.type === 'Identifier') {
            // Case: (a) => ...  or async a => ... (handled elsewhere)
            params = [innerExpression];
        } else if (innerExpression.type === 'SequenceExpression') {
            // Case: (a, b) => ...
            params = innerExpression.expressions;
        } else if (innerExpression.type === 'ArrowFunctionExpression' && innerExpression.async) {
            // This handles the IIFE case: `(async () => {})`
            // The expression itself is the function. The arrow we see now is an error.
             this._error("Unexpected token => after async arrow function in parentheses.");
             return null;
        } else {
             this._error("Invalid parameter list for arrow function.");
             return null;
        }
        
        return this._parseArrowFunctionExpression(s, params, isAsync);
    }

    // If no arrow followed, the expression we parsed was just a grouped expression.
    // Return it as is.
    return innerExpression;
};
		
		
		
		
		
	proto._parseBinaryExpression =
		function(t) {
			const e = this
				._startNode();
			e.loc.start = t.loc
				.start;
			const s = this.currToken
				.literal,
				i = this
				._getPrecedence(this
					.currToken);
			this._advance();
			const o = this
				._parseExpression(
					i);
			return this
				._finishNode({
					type: "BinaryExpression",
					operator: s,
					left: t,
					right: o
				}, e)
		};
	proto
		._parseAssignmentExpression =
		function(t) {
			if ("Identifier" !== t
				.type &&
				"MemberExpression" !==
				t.type) return this
				._error(
					"Invalid left-hand side in assignment."
				), null;
			const e = this
				._startNode();
			e.loc.start = t.loc
				.start;
			const s = this.currToken
				.literal;
			this._advance();
			const i = this
				._parseExpression(
					PRECEDENCE
					.ASSIGNMENT - 1
				);
			return this
				._finishNode({
					type: "AssignmentExpression",
					operator: s,
					left: t,
					right: i
				}, e)
		};
	proto
		._parseConditionalExpression =
		function(t) {
			const e = this
				._startNode();
			e.loc.start = t.loc
				.start, this
				._advance();
			const s = this
				._parseExpression(
					PRECEDENCE
					.LOWEST);
			this._expect(TOKEN
				.COLON);
			const i = this
				._parseExpression(
					PRECEDENCE
					.LOWEST);
			return this
				._finishNode({
					type: "ConditionalExpression",
					test: t,
					consequent: s,
					alternate: i
				}, e)
		};
	proto._parseSequenceExpression =
		function(t) {
			const e = this
				._startNode();
			e.loc.start = t.loc
				.start;
			const s =
				"SequenceExpression" ===
				t.type ? t
				.expressions : [t];
			return this._advance(),
				s.push(this
					._parseExpression(
						PRECEDENCE
						.SEQUENCE -
						1)), this
				._finishNode({
					type: "SequenceExpression",
					expressions: s
				}, e)
		};
	proto._parseArrayLiteral =
		function() {
			const t = this
				._startNode();
			this._expect(TOKEN
				.LBRACKET);
			const e = [];
			for (; !this
				._currTokenIs(TOKEN
					.RBRACKET) && !
				this._currTokenIs(
					TOKEN.EOF);) {
				if (this
					._currTokenIs(
						TOKEN.COMMA)
				) {
					this._advance(),
						e.push(
							null);
					continue
				}
				if (e.push(this
						._parseExpression(
							PRECEDENCE
							.ASSIGNMENT
						)), this
					._currTokenIs(
						TOKEN.COMMA)
				) this
					._advance();
				else if (!this
					._currTokenIs(
						TOKEN
						.RBRACKET)
				) {
					this._error(
						"Expected comma or ']' after array element."
					);
					break
				}
			}
			return this._expect(
					TOKEN.RBRACKET),
				this._finishNode({
					type: "ArrayExpression",
					elements: e
				}, t)
		};
	proto._parseObjectLiteral =
		function() {
			const t = this
				._startNode();
			this._expect(TOKEN
				.LBRACE);
			const e = [];
			for (; !this
				._currTokenIs(TOKEN
					.RBRACE) && !
				this._currTokenIs(
					TOKEN.EOF);) {
				if (e.push(this
						._parseObjectProperty()
					), this
					._currTokenIs(
						TOKEN.RBRACE
					)) break;
				if (this
					._currTokenIs(
						TOKEN.COMMA)
				) this
					._advance();
				else if (!this
					._currTokenIs(
						TOKEN.RBRACE
					)) {
					this._error(
						"Expected a comma between object properties."
					);
					break
				}
			}
			return this._expect(
					TOKEN.RBRACE),
				this._finishNode({
					type: "ObjectExpression",
					properties: e
				}, t)
		};
	proto._parseObjectProperty =
		function() {
			const t = this
				._startNode();
			if (this._currTokenIs(
					TOKEN.DOTDOTDOT
				)) return this
				._parseSpreadElement();
			let e = !1,
				s;
			if (this._currTokenIs(
					TOKEN.LBRACKET))
				e = !0, this
				._advance(), s =
				this
				._parseExpression(
					PRECEDENCE
					.LOWEST), this
				._expect(TOKEN
					.RBRACKET);
			else s = this.currToken
				.type === TOKEN
				.STRING || this
				.currToken.type ===
				TOKEN.NUMBER ? this
				._parseLiteral() :
				this
				._parseIdentifier();
			if (this._currTokenIs(
					TOKEN.COLON)) {
				this._expect(TOKEN
					.COLON);
				const i = this
					._parseExpression(
						PRECEDENCE
						.ASSIGNMENT
					);
				return this
					._finishNode({
						type: "Property",
						key: s,
						value: i,
						kind: "init",
						method:
							!1,
						shorthand:
							!1,
						computed: e
					}, t)
			}
			return "Identifier" ===
				s.type && (this
					._currTokenIs(
						TOKEN.COMMA
					) || this
					._currTokenIs(
						TOKEN.RBRACE
					)) ? this
				._finishNode({
					type: "Property",
					key: s,
					value: s,
					kind: "init",
					method: !1,
					shorthand: !
						0,
					computed: !1
				}, t) : (this
					._error(
						"Invalid object property syntax. Expected ':' or shorthand."
					), null)
		};
	proto._parseSpreadElement =
		function() {
			const t = this
				._startNode();
			this._expect(TOKEN
				.DOTDOTDOT);
			const e = this
				._parseExpression(
					PRECEDENCE
					.ASSIGNMENT);
			return this
				._finishNode({
					type: "SpreadElement",
					argument: e
				}, t)
		};
	

proto._parseArrowFunctionExpression = function(t, e, isAsync = false) { // The 'isAsync' parameter is new
    this._expect(TOKEN.ARROW);
    const s = this._currTokenIs(TOKEN.LBRACE) ? this._parseBlockStatement() : this._parseExpression(PRECEDENCE.ASSIGNMENT);
    return this._finishNode({
        type: "ArrowFunctionExpression",
        id: null,
        params: e,
        body: s,
        async: isAsync, // Use the new parameter here
        expression: "BlockStatement" !== s.type
    }, t)
};



// ADD THIS ENTIRE NEW FUNCTION to parser-expressions.js
// This is the new, smart entry point for all 'async' expressions.
proto._parseAsyncExpression = function() {
    const s = this._startNode();
    this._advance(); // Consume 'async'

    // After 'async', we could have 'async function() {}'
    if (this._currTokenIs(TOKEN.FUNCTION)) {
        // It's an async function EXPRESSION, so we call _parseFunction and tell it.
        return this._parseFunction('expression', true);
    }

    // Otherwise, it MUST be an async arrow function.
    // An arrow function can start with an identifier (async a => ...)
    // or parentheses (async () => ...). Let's parse that part.
    let arrowFn;
    if (this._currTokenIs(TOKEN.LPAREN)) {
        arrowFn = this._parseGroupedOrArrowExpression();
    } else if (this._currTokenIs(TOKEN.IDENT)) {
        arrowFn = this._parseIdentifier();
    } else {
        return this._error("Unexpected token after async keyword.");
    }

    // Now, we must verify that what we parsed was actually an arrow function
    if (arrowFn && arrowFn.type === 'ArrowFunctionExpression') {
        // It was! Now, we mark it as async and fix its start location.
        arrowFn.async = true;
        arrowFn.loc.start = s.loc.start; // The start was the 'async' token, not the '(' or identifier.
        return arrowFn;
    }

    // If we get here, it was something like `async (a + b)`, which is invalid.
    return this._error("async keyword must be followed by a function or an arrow function.");
};


	proto._parseFunctionExpression =
		function() {
			return this
				._parseFunction(
					"expression")
		};
	proto._parseClassExpression =
		function() {
			const t = this
				._startNode();
			this._expect(TOKEN
				.CLASS);
			let e = null;
			this._currTokenIs(TOKEN
				.IDENT) && (e =
				this
				._parseIdentifier()
			);
			let s = null;
			this._currTokenIs(TOKEN
				.EXTENDS) && (
				this._advance(),
				s = this
				._parseIdentifier()
			);
			const i = this
				._parseClassBody();
			return this
				._finishNode({
					type: "ClassExpression",
					id: e,
					superClass: s,
					body: i
				}, t)
		};
	proto._parseNewExpression =
		function() {
			const t = this
				._startNode();
			this._expect(TOKEN.NEW);
			const e = this
				._parseExpression(
					PRECEDENCE
					.MEMBER);
			let s = [];
			return this
				._currTokenIs(TOKEN
					.LPAREN) && (s =
					this
					._parseArgumentsList()
				), this
				._finishNode({
					type: "NewExpression",
					callee: e,
					arguments: s
				}, t)
		};
	proto._parseCallExpression =
		function(t) {
			const e = this
				._startNode();
			e.loc.start = t.loc
				.start;
			const s = this
				._parseArgumentsList();
			return this
				._finishNode({
					type: "CallExpression",
					callee: t,
					arguments: s,
					optional: !1
				}, e)
		};
	proto._parseArgumentsList =
		function() {
			this._expect(TOKEN
				.LPAREN);
			const t = [];
			if (this._currTokenIs(
					TOKEN.RPAREN))
				return this
					._advance(), t;
			do t.push(this
				._parseExpression(
					PRECEDENCE
					.ASSIGNMENT)
			); while (this
				._currTokenIs(TOKEN
					.COMMA) && (this
					._advance(), !0)
			);
			return this._expect(
				TOKEN.RPAREN), t
		};
	// REPLACE your old _parseMemberExpression with this one
proto._parseMemberExpression = function(t, e = !1) {
    const s = this._startNode();
    s.loc.start = t.loc.start;
    const i = this._currTokenIs(TOKEN.LBRACKET);
    this._advance(); // Consume '.' or '['

    // THIS IS THE UPGRADE: Check for a private identifier after the '.'
    let o;
    if (!i && this._currTokenIs(TOKEN.PRIVATE_IDENT)) {
        o = this._parsePrivateIdentifier();
    } else {
        o = i ? this._parseExpression(PRECEDENCE.LOWEST) : this._parseIdentifier();
    }

    if (i) {
        this._expect(TOKEN.RBRACKET);
    }
    
    return this._finishNode({
        type: "MemberExpression",
        object: t,
        property: o,
        computed: i,
        optional: e
    }, s);
};
	// B"H 

proto._parseChainExpression = function(left) { // `left` is the object being chained, e.g., `user.profile`
    const chainStartNode = this._startNode();
    chainStartNode.loc.start = left.loc.start;
    
    let expressionNode = left; // Start with the left-hand side

    // Loop to handle chains like a?.b?.c
    while (this._currTokenIs(TOKEN.OPTIONAL_CHAINING)) {
        const optionalStartNode = this._startNode();
        optionalStartNode.loc.start = expressionNode.loc.start;
        this._advance(); // Consume the '?.' token

        if (this._currTokenIs(TOKEN.LPAREN)) {
            // It's an optional call: `...?.()`
            const args = this._parseArgumentsList(); // This handles parsing `(...)`
            expressionNode = this._finishNode({
                type: 'CallExpression',
                callee: expressionNode,
                arguments: args,
                optional: true // Mark as optional
            }, optionalStartNode);

        } else if (this._currTokenIs(TOKEN.LBRACKET)) {
            // It's optional computed property access: `...?.[...]`
            this._advance(); // consume '['
            const property = this._parseExpression(PRECEDENCE.LOWEST);
            this._expect(TOKEN.RBRACKET);
            expressionNode = this._finishNode({
                type: 'MemberExpression',
                object: expressionNode,
                property: property,
                computed: true,
                optional: true // Mark as optional
            }, optionalStartNode);

        } else {
            // It's optional property access: `...?.prop`
            const property = this._parseIdentifier(); // This will parse 'prop'
            expressionNode = this._finishNode({
                type: 'MemberExpression',
                object: expressionNode,
                property: property,
                computed: false,
                optional: true // Mark as optional
            }, optionalStartNode);
        }
    }
    
    // According to ESTree, the whole thing is wrapped in a ChainExpression
    return this._finishNode({ type: 'ChainExpression', expression: expressionNode }, chainStartNode);
};
		
		
	// Add this new function to parser-expressions.js
proto._parseYieldExpression = function() {
    const s = this._startNode();
    this._advance(); // Consume 'yield'

    let argument = null;
    let delegate = false;

    // Check for yield*
    if (this._currTokenIs(TOKEN.ASTERISK)) {
        delegate = true;
        this._advance(); // Consume '*'
    }

    // Parse an argument if it's there and not prohibited by ASI
    if (!this._currTokenIs(TOKEN.SEMICOLON) && !this._currTokenIs(TOKEN.RBRACE) && !this.currToken.hasLineTerminatorBefore) {
        argument = this._parseExpression(PRECEDENCE.LOWEST);
    }

    return this._finishNode({ type: 'YieldExpression', argument, delegate }, s);
};




	proto._parseTemplateLiteral =
		function() {
			const startNodeInfo =
				this._startNode();
			const quasis = [];
			const expressions = [];

			let isTail = false;
			// Loop until we find the final 'tail' part of the template string
			while (!isTail) {
				const quasiStart =
					this
					._startNode();
				const tokenType =
					this.currToken
					.type;

				// Safety check
				if (tokenType !==
					TOKEN
					.TEMPLATE_HEAD &&
					tokenType !==
					TOKEN
					.TEMPLATE_MIDDLE &&
					tokenType !==
					TOKEN
					.TEMPLATE_TAIL
				) {
					this._error(
						"Unexpected token inside template literal."
					);
					return null;
				}

				// Parse the static string part
				isTail =
					tokenType ===
					TOKEN
					.TEMPLATE_TAIL;
				const value = {
					raw: this
						.currToken
						.literal,
					cooked: this
						.currToken
						.literal
				};
				quasis.push(this
					._finishNode({
							type: 'TemplateElement',
							value: value,
							tail: isTail
						},
						quasiStart
					));

				this
					._advance(); // Consume the quasi token.

				// If this wasn't the last part, we MUST parse an expression next.
				if (!isTail) {
					expressions
						.push(this
							._parseExpression(
								PRECEDENCE
								.LOWEST
							));
				}
			}

			return this
				._finishNode({
						type: 'TemplateLiteral',
						quasis,
						expressions
					},
					startNodeInfo);
		};
		
		
		
		// Add this new helper function to parser-expressions.js
proto._parsePrivateIdentifier = function() {
    const s = this._startNode();
    // The literal from the lexer already includes the '#'
    const name = this.currToken.literal.slice(1);
    const node = { type: 'PrivateIdentifier', name: name };
    this._advance();
    return this._finishNode(node, s);
};


})(MerkabahParser
	.prototype
	); // This is the end of the file