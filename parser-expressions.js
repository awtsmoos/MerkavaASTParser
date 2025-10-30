// In parser-expressions.js
// B"H --- Parsing Expressions [DEFINITIVE, UNIVERSAL & COMPLETE] ---
(function(proto) {
	// B"H
// --- Start of Replacement for registerExpressionParsers in parser-expressions.js ---

	proto.registerExpressionParsers = function() {
		const p = this.prefixParseFns, i = this.infixParseFns;

        // Register the new prefix operator `~`
        p[TOKEN.BANG] = p[TOKEN.MINUS] = p[TOKEN.PLUS] = p[TOKEN.AWAIT] = p[TOKEN.BITWISE_NOT] = p[TOKEN.TYPEOF] = p[TOKEN.VOID] = this._parsePrefixExpression;
        
        p[TOKEN.SLASH] = this._parseRegExpLiteral;
		p[TOKEN.IDENT] = this._parseIdentifier,
		p[TOKEN.NUMBER] = p[TOKEN.STRING] = p[TOKEN.TRUE] = p[TOKEN.FALSE] = p[TOKEN.NULL] = this._parseLiteral, 
        p[TOKEN.THIS] = this._parseThisExpression,
		p[TOKEN.SUPER] = this._parseSuper, 
		p[TOKEN.INCREMENT] = p[TOKEN.DECREMENT] = l => this._parseUpdateExpression(l, !0), 
        p[TOKEN.LPAREN] = this._parseGroupedOrArrowExpression,
		p[TOKEN.LBRACE] = this._parseObjectLiteral,
		p[TOKEN.LBRACKET] = this._parseArrayLiteral,
		p[TOKEN.TEMPLATE_HEAD] = p[TOKEN.TEMPLATE_TAIL] = this._parseTemplateLiteral,
		p[TOKEN.NEW] = this._parseNewExpression,
		p[TOKEN.FUNCTION] = this._parseFunctionExpression,
		p[TOKEN.CLASS] = this._parseClassExpression;
		p[TOKEN.ASYNC] = this._parseAsyncExpression;
		p[TOKEN.YIELD] = this._parseYieldExpression;
		p[TOKEN.DOTDOTDOT] = this._parseSpreadElement;
		p[TOKEN.IMPORT] = this._parseImportExpression;
			
		const binary = l => this._parseBinaryExpression(l);
		
		i[TOKEN.TEMPLATE_HEAD] = i[TOKEN.TEMPLATE_TAIL] = this._parseTaggedTemplateExpression;
		
        // Register all binary operators, including the new bitwise and shift ones
        i[TOKEN.PLUS] = i[TOKEN.MINUS] = i[TOKEN.SLASH] = i[TOKEN.ASTERISK] = i[TOKEN.MODULO] = binary; 
        i[TOKEN.EQ] = i[TOKEN.NOT_EQ] = i[TOKEN.EQ_STRICT] = i[TOKEN.NOT_EQ_STRICT] = binary; 
        i[TOKEN.LT] = i[TOKEN.GT] = i[TOKEN.LTE] = i[TOKEN.GTE] = i[TOKEN.IN] = i[TOKEN.INSTANCEOF] = binary; 
        i[TOKEN.AND] = i[TOKEN.OR] = i[TOKEN.NULLISH_COALESCING] = binary; 
        i[TOKEN.EXPONENT] = binary; 
        i[TOKEN.BITWISE_AND] = i[TOKEN.BITWISE_OR] = i[TOKEN.BITWISE_XOR] = binary;
        i[TOKEN.LEFT_SHIFT] = i[TOKEN.RIGHT_SHIFT] = i[TOKEN.UNSIGNED_RIGHT_SHIFT] = binary;

        // Register all assignment operators, including the new bitwise and shift ones
        i[TOKEN.ASSIGN] = i[TOKEN.PLUS_ASSIGN] = i[TOKEN.MINUS_ASSIGN] = i[TOKEN.ASTERISK_ASSIGN] = i[TOKEN.SLASH_ASSIGN] = i[TOKEN.EXPONENT_ASSIGN] = i[TOKEN.MODULO_ASSIGN] = i[TOKEN.BITWISE_AND_ASSIGN] = i[TOKEN.BITWISE_OR_ASSIGN] = i[TOKEN.BITWISE_XOR_ASSIGN] = i[TOKEN.LEFT_SHIFT_ASSIGN] = i[TOKEN.RIGHT_SHIFT_ASSIGN] = i[TOKEN.UNSIGNED_RIGHT_SHIFT_ASSIGN] = l => this._parseAssignmentExpression(l); 
        
        i[TOKEN.COMMA] = l => this._parseSequenceExpression(l); 
        i[TOKEN.INCREMENT] = i[TOKEN.DECREMENT] = l => this._parseUpdateExpression(l, !1);
        i[TOKEN.LPAREN] = this._parseCallExpression;
		i[TOKEN.DOT] = this._parseMemberExpression;
		i[TOKEN.LBRACKET] = this._parseMemberExpression;
		i[TOKEN.OPTIONAL_CHAINING] = this._parseChainExpression;
		i[TOKEN.QUESTION] = this._parseConditionalExpression;
	};


	// B"H
	
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
	
	
	// B"H
	


// 

// B"H - The rectified _parseRegExpLiteral
proto._parseRegExpLiteral = function() {
    const s = this._startNode();
    const lexer = this.l;

    // The current token is guaranteed to be '/'. We read directly from the source.
    let i = lexer.position + 1; // Start scanning from the character AFTER the opening '/'
    let inCharSet = false;

    // Find the end of the regex body, correctly handling escaped slashes and character sets.
    while (i < lexer.source.length) {
        const char = lexer.source[i];
        if (char === '\\') { // Skip any escaped character
            i += 2;
            continue;
        }
        if (char === '[') inCharSet = true;
        if (char === ']') inCharSet = false;
        if (char === '/' && !inCharSet) break; // Found the end
        i++;
    }
    const endOfBody = i;

    const body = lexer.source.substring(lexer.position + 1, endOfBody);
    i++; // Move past the closing '/'

    // Now parse the flags (g, i, m, s, u, y)
    let startOfFlags = i;
    while (i < lexer.source.length && 'gimsuy'.includes(lexer.source[i])) {
        i++;
    }
    const flags = lexer.source.substring(startOfFlags, i);
    
    // --- THIS IS THE CRITICAL FIX ---
    // Manually advance the lexer's internal state to be *past* the entire regex.
    lexer.position = i - 1;
    lexer.readPosition = i;
    lexer.ch = lexer.source[lexer.position] || null;

    // Create the AST node for the literal we just parsed.
    const node = {
        type: 'Literal',
        value: null,
        raw: `/${body}/${flags}`,
        regex: {
            pattern: body,
            flags: flags
        }
    };
    const finishedNode = this._finishNode(node, s);

    // After manually advancing the lexer, we must completely refresh the
    // parser's token lookahead buffer. We CANNOT use _advance() here as it
    // would use a stale peekToken. We must load the NEXT token.
    this.currToken = this.l.nextToken();
    this.peekToken = this.l.nextToken();

    // Finally, return the AST node for the regular expression.
    return finishedNode;
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
		
		
	



// B"H




// B"H 

proto._parseGroupedOrArrowExpression = function() {
    const s = this._startNode();
    this._expect(TOKEN.LPAREN);

    if (this._currTokenIs(TOKEN.RPAREN)) { // handles `()` for `() => ...`
        this._advance();
        if (!this._currTokenIs(TOKEN.ARROW)) {
            this._error("Unexpected empty parentheses in expression.");
            return null;
        }
        return this._parseArrowFunctionExpression(s, [], false);
    }

    // --- The Tikkun HaGadol (The Great Rectification) ---
    const exprList = [];
    do {
        // Step 1: The Heuristic.
        // If the token inside the parentheses is `{` or `[`, we can be almost certain
        // that this is a destructuring pattern for an arrow function's parameters.
        if (this._currTokenIs(TOKEN.LBRACE) || this._currTokenIs(TOKEN.LBRACKET)) {
            // Use the parser that is specifically designed for patterns with default values.
            // This correctly parses `({ customId = id } = {})`.
            exprList.push(this._parseBindingWithDefault());
        } else {
            // For all other cases, like `(function*(){...})` or `(a + b)`,
            // parse it as a standard, generic expression.
            exprList.push(this._parseExpression(PRECEDENCE.ASSIGNMENT));
        }
    } while (this._currTokenIs(TOKEN.COMMA) && (this._advance(), true));

    this._expect(TOKEN.RPAREN);

    // Step 2: Resolve the ambiguity.
    // After parsing the contents, we look for the `=>` to make our final decision.
    if (this._currTokenIs(TOKEN.ARROW)) {
        // It IS an arrow function. Convert the parsed expressions to valid patterns.
        const params = exprList.map(e => this._convertExpressionToPattern(e));
        return this._parseArrowFunctionExpression(s, params, false);
    }

    // It was NOT an arrow function. Return the parsed content as a grouped expression or sequence.
    if (exprList.length > 1) {
        const seqNode = { type: 'SequenceExpression', expressions: exprList };
        const seqStart = { loc: { start: exprList[0].loc.start } };
        return this._finishNode(seqNode, seqStart);
    } else {
        return exprList[0];
    }
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
		
		
		
		
	// B"H

// B"H


proto._parseObjectProperty = function() {
    const s = this._startNode();

    if (this._currTokenIs(TOKEN.DOTDOTDOT)) {
        return this._parseSpreadElement();
    }

    let kind = 'init';
    let isAsync = false;
    let isGenerator = false;
    let key;

    // --- THIS IS THE FINAL TIKKUN ---
    // This refined logic correctly distinguishes between a method named 'get' and a getter keyword.
    // A 'get' or 'set' is only a keyword if it's followed by something that is NOT a parenthesis or colon.
    const isGetterKeyword = this.currToken.type === TOKEN.IDENT && this.currToken.literal === 'get' && this.peekToken.type !== TOKEN.LPAREN && this.peekToken.type !== TOKEN.COLON;
    const isSetterKeyword = this.currToken.type === TOKEN.IDENT && this.currToken.literal === 'set' && this.peekToken.type !== TOKEN.LPAREN && this.peekToken.type !== TOKEN.COLON;

    // Consume modifiers if they exist.
    if (this.currToken.type === TOKEN.ASYNC) {
        // `async (` is a method named async. `async prop(` is an async method.
        if (this.peekToken.type !== TOKEN.LPAREN && this.peekToken.type !== TOKEN.COLON) {
           isAsync = true;
           this._advance();
        }
    }
    if (this._currTokenIs(TOKEN.ASTERISK)) {
        isGenerator = true;
        this._advance();
    }
    if (isGetterKeyword || isSetterKeyword) {
        kind = this.currToken.literal;
        this._advance();
    }
    
    // Now, parse the key.
    let computed = false;
    if (this._currTokenIs(TOKEN.LBRACKET)) {
        computed = true;
        this._advance();
        key = this._parseExpression(PRECEDENCE.LOWEST);
        this._expect(TOKEN.RBRACKET);
    } else {
        key = (this.currToken.type === TOKEN.STRING || this.currToken.type === TOKEN.NUMBER)
            ? this._parseLiteral()
            : this._parseIdentifier();
    }
    if (!key) return null;

    // Decide what follows the key.
    
    // Case A: Method-like forms (Method, Getter, Setter)
    if (this._currTokenIs(TOKEN.LPAREN)) {
        const params = this._parseParametersList();
        const body = this._parseBlockStatement();
        const value = { type: 'FunctionExpression', id: null, params, body, async: isAsync, generator: isGenerator };

        return this._finishNode({
            type: 'Property',
            key: key,
            value: value,
            kind: kind,
            method: (kind === 'init'),
            shorthand: false,
            computed: computed
        }, s);
    }
    
    // Case B: Regular `key: value` pair. No modifiers allowed here.
    if (isAsync || isGenerator || kind !== 'init') {
        this._error(`Object property with async, generator, get, or set must be a method and have a parameter list.`);
        return null;
    }

    if (this._currTokenIs(TOKEN.COLON)) {
        this._advance();
        const value = this._parseExpression(PRECEDENCE.ASSIGNMENT);
        return this._finishNode({
            type: 'Property',
            key: key,
            value: value,
            kind: 'init',
            method: false,
            shorthand: false,
            computed: computed
        }, s);
    }

    // Case C: Shorthand property like `{ myKey }`.
    if (key.type === 'Identifier' && !computed) {
        return this._finishNode({
            type: 'Property',
            key: key,
            value: key,
            kind: 'init',
            method: false,
            shorthand: true,
            computed: false
        }, s);
    }

    this._error("Invalid object property syntax. Expected ':', '(', or shorthand property.");
    return null;
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
	// B"H

	proto._parseNewExpression = function() {
		const s = this._startNode();
		this._expect(TOKEN.NEW);

		// --- THIS IS THE TIKKUN (THE FIX) ---
		// Check specifically for the 'new.target' meta-property.
		if (this._currTokenIs(TOKEN.DOT)) {
			this._advance(); // Consume '.'
			
			// Manually create the 'new' identifier node for the AST.
			const meta = { type: 'Identifier', name: 'new', loc: s.loc };
			
			if (!this._currTokenIs(TOKEN.IDENT) || this.currToken.literal !== 'target') {
				this._error("Expected 'target' after 'new.'.");
				return null;
			}
			
			// Parse the 'target' identifier.
			const property = this._parseIdentifier();
			
			// According to ESTree, this is a MetaProperty node.
			return this._finishNode({ type: 'MetaProperty', meta: meta, property: property }, s);
		}
		
		// 

		// If it wasn't 'new.target', proceed with the original logic for a constructor call.
		const callee = this._parseExpression(PRECEDENCE.MEMBER);
		let args = [];
		if (this._currTokenIs(TOKEN.LPAREN)) {
			args = this._parseArgumentsList();
		}
		
		return this._finishNode({
			type: "NewExpression",
			callee: callee,
			arguments: args
		}, s);
	};

// --- 
	
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
		
		
	// B"H

	// B"H - The rectified _parseArgumentsList
proto._parseArgumentsList = function() {
    this._expect(TOKEN.LPAREN); // Consume '('
    const args = [];

    // This single, more robust loop correctly handles all argument list patterns.
    while (!this._currTokenIs(TOKEN.RPAREN) && !this._currTokenIs(TOKEN.EOF)) {
        // It correctly handles:
        //  - An empty list: ()
        //  - A single argument: (a)
        //  - Multiple arguments: (a, b)
        //  - Trailing commas, which are valid JS syntax: (a, b, )
        
        // Parse the next argument expression. This will also handle spread elements (`...args`).
        const arg = this._parseExpression(PRECEDENCE.ASSIGNMENT);
        args.push(arg);

        // If the next token is not a comma, it must be the end of the list.
        if (!this._currTokenIs(TOKEN.COMMA)) {
            break;
        }

        // If it is a comma, consume it and prepare for the next argument.
        this._advance();
    }

    this._expect(TOKEN.RPAREN); // Expect and consume the closing ')'
    return args;
};
	
		
	



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






// Its purpose is to convert an AST parsed as an expression into a valid pattern for binding.


// B"H 

proto._convertExpressionToPattern = function(node) {
    if (!node) return null;
    switch (node.type) {
        // --- THE TIKKUN (THE FIX) ---
        // An AssignmentPattern is ALREADY a valid pattern. It represents a
        // parameter with a default value. We simply allow it to pass through.
        case 'AssignmentPattern':
        case 'Identifier':
        case 'ObjectPattern':
        case 'ArrayPattern':
            return node;

        // Convert expression types to their pattern equivalents.
        case 'ObjectExpression':
            node.type = 'ObjectPattern';
            node.properties.forEach(prop => {
                // The key of a property is not converted, but its value is.
                prop.value = this._convertExpressionToPattern(prop.value);
            });
            return node;

        case 'ArrayExpression':
            node.type = 'ArrayPattern';
            node.elements = node.elements.map(el => this._convertExpressionToPattern(el));
            return node;
        
        // This case is now handled above, but we keep the logic for clarity.
        case 'AssignmentExpression':
            node.type = 'AssignmentPattern';
            node.left = this._convertExpressionToPattern(node.left);
            return node;

        // If we find an expression that truly cannot be a pattern, it's a syntax error.
        default:
            this._error(`Cannot use expression of type ${node.type} as a parameter.`);
            return null;
    }
};





// B"H 


proto._parseImportExpression = function() {
    const s = this._startNode();
    
    // Manually create the 'import' identifier node for the AST, as it doesn't come
    // from a standard IDENT token but from the IMPORT keyword.
    const metaIdentifier = { type: 'Identifier', name: 'import', loc: s.loc };
    
    this._advance(); // Consume the 'import' keyword.

    // --- THIS IS THE TIKKUN (THE FIX) ---
    // After 'import', we check for a '.' to see if it is the 'import.meta' property.
    if (this._currTokenIs(TOKEN.DOT)) {
        this._advance(); // Consume '.'

        const property = this._parseIdentifier();
        if (property.name !== 'meta') {
            this._error("Expected 'meta' after 'import.'");
            return null;
        }

        // According to the ESTree spec, this is a MetaProperty node.
        return this._finishNode({ type: 'MetaProperty', meta: metaIdentifier, property: property }, s);
    }

    // If it was not 'import.meta', it must be a dynamic import: 'import()'.
    if (!this._currTokenIs(TOKEN.LPAREN)) {
        this._error("Expected '(' after import for a dynamic import expression.");
        return null;
    }
    this._advance(); // Consume '('

    // Parse the module source as an expression.
    const source = this._parseExpression(PRECEDENCE.LOWEST);

    this._expect(TOKEN.RPAREN); // Consume ')'

    // According to the ESTree spec, this is an ImportExpression node.
    return this._finishNode({ type: 'ImportExpression', source: source }, s);
};

// --- 



// B"H

proto._parseTaggedTemplateExpression = function(tag) { // 'tag' is the expression on the left
    const s = this._startNode();
    s.loc.start = tag.loc.start;

    // The current token is TEMPLATE_HEAD, so we can now parse the literal part.
    // _parseTemplateLiteral is already a prefix function, which is fine to call here.
    const quasi = this._parseTemplateLiteral();

    return this._finishNode({
        type: 'TaggedTemplateExpression',
        tag: tag,
        quasi: quasi
    }, s);
};

})(MerkabahParser
	.prototype
	); // This is the end of the file