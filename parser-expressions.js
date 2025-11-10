// In parser-expressions.js
// B"H --- Parsing Expressions [DEFINITIVE, UNIVERSAL & COMPLETE] ---
(function() {

const { TOKEN, PRECEDENCE, PRECEDENCES } = window.MerkavahConstants;
    const proto = MerkavahParser.prototype;
(function(proto) {
	// B"H
// --- Start of Replacement for registerExpressionParsers in parser-expressions.js ---

	// B"H
// In parser-expressions.js
// --- Replace your existing registerExpressionParsers with this complete, corrected version ---

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

    // --- THIS IS THE TIKKUN (THE FIX) ---
    // The new LOGICAL_OR_ASSIGN and LOGICAL_AND_ASSIGN tokens have been added to this list.
    // Now, the parser will correctly use the _parseAssignmentExpression function for them.
    i[TOKEN.ASSIGN] = i[TOKEN.PLUS_ASSIGN] = i[TOKEN.MINUS_ASSIGN] = i[TOKEN.ASTERISK_ASSIGN] = 
    i[TOKEN.SLASH_ASSIGN] = i[TOKEN.EXPONENT_ASSIGN] = i[TOKEN.MODULO_ASSIGN] = i[TOKEN.NULLISH_ASSIGN] =
    i[TOKEN.LOGICAL_OR_ASSIGN] = i[TOKEN.LOGICAL_AND_ASSIGN] = // <-- ADDED HERE
    i[TOKEN.BITWISE_AND_ASSIGN] = i[TOKEN.BITWISE_OR_ASSIGN] = i[TOKEN.BITWISE_XOR_ASSIGN] = 
    i[TOKEN.LEFT_SHIFT_ASSIGN] = i[TOKEN.RIGHT_SHIFT_ASSIGN] = i[TOKEN.UNSIGNED_RIGHT_SHIFT_ASSIGN] = 
    l => this._parseAssignmentExpression(l); 
    
    i[TOKEN.COMMA] = l => this._parseSequenceExpression(l); 
    i[TOKEN.INCREMENT] = i[TOKEN.DECREMENT] = l => this._parseUpdateExpression(l, !1);
    i[TOKEN.LPAREN] = this._parseCallExpression;
    i[TOKEN.DOT] = this._parseMemberExpression;
    i[TOKEN.LBRACKET] = this._parseMemberExpression;
    i[TOKEN.OPTIONAL_CHAINING] = this._parseChainExpression;
    i[TOKEN.QUESTION] = this._parseConditionalExpression;
};


	// B"H
	
	


// B"H
// In parser-core.js (or wherever _parseExpression is defined)

// --- REPLACEMENT for _parseExpression ---
proto._parseExpression = function(precedence) {
    this.recursionDepth++;
    if (this.recursionDepth > this.maxRecursionDepth) {
        throw new Error("Stack overflow detected: Maximum recursion depth exceeded.");
    }

    try {
        let prefix = this.prefixParseFns[this.currToken.type];
        if (!prefix) {
            this._error(`No prefix parse function for ${this.currToken.type}`);
            return null;
        }
        let leftExp = prefix.call(this);

        while (precedence < this._getPrecedence(this.currToken)) {
            // --- THE FIX ---
            // If we are inside a template literal, and the next token is the start
            // of another template part, it is NOT an infix operator. We must stop.
            if (this.parsingTemplateExpression && 
               (this.currToken.type === TOKEN.TEMPLATE_MIDDLE || this.currToken.type === TOKEN.TEMPLATE_TAIL)) {
                return leftExp;
            }
            // --- END OF THE FIX ---

            let infix = this.infixParseFns[this.currToken.type];
            if (!infix) {
                return leftExp;
            }
            leftExp = infix.call(this, leftExp);
        }
        return leftExp;
    } finally {
        this.recursionDepth--;
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
		
		
	
	
	// B"H

// This version adds logic to correctly handle numeric separators and BigInts.
proto._parseLiteral = function() {
    const s = this._startNode();
    const token = this.currToken;
    let value = token.literal;
    let node = { type: "Literal" };

    switch (token.type) {
        case TOKEN.NUMBER:
            // --- FIX FOR BIGINT ---
            if (token.literal.endsWith('n')) {
                const bigintStr = token.literal.slice(0, -1).replace(/_/g, '');
                node.value = null; // Per ESTree spec for BigInt
                node.bigint = bigintStr;
            } else {
            // --- FIX FOR NUMERIC SEPARATORS ---
                node.value = parseFloat(token.literal.replace(/_/g, ''));
            }
            break;
        case TOKEN.TRUE:     value = true;  break;
        case TOKEN.FALSE:    value = false; break;
        case TOKEN.NULL:     value = null;  break;
        case TOKEN.STRING:   /* value is already correct */ break;
    }

    // Assign value if it hasn't been handled by a special case
    if (node.value === undefined) {
        node.value = value;
    }
    node.raw = token.literal;

    this._advance();
    return this._finishNode(node, s);
};


// B"H

// This version correctly handles parsing the flags after the pattern.
proto._parseRegExpLiteral = function() {
    const s = this._startNode();
    const lexer = this.l;

    const bodyStartPosition = this.currToken.startIndex + 1;
    let scanPosition = bodyStartPosition;
    let inCharSet = false;
    while (scanPosition < lexer.source.length) {
        const char = lexer.source[scanPosition];
        if (char === '\\') { scanPosition += 2; continue; }
        if (char === '[') inCharSet = true;
        else if (char === ']') inCharSet = false;
        if (char === '/' && !inCharSet) break;
        scanPosition++;
    }
    const bodyEndPosition = scanPosition;
    const body = lexer.source.substring(bodyStartPosition, bodyEndPosition);
    
    // --- THIS IS THE FIX ---
    scanPosition++; // Move past the closing '/'
    const flagsStartPosition = scanPosition;
    // Scan for all valid regex flags
    while (scanPosition < lexer.source.length && 'gimsuy'.includes(lexer.source[scanPosition])) {
        scanPosition++;
    }
    const flagsEndPosition = scanPosition;
    const flags = lexer.source.substring(flagsStartPosition, flagsEndPosition);
    // --- END OF FIX ---

    const node = {
        type: 'Literal', value: null, raw: `/${body}/${flags}`,
        regex: { pattern: body, flags: flags }
    };
    const finishedNode = this._finishNode(node, s);

    lexer.readPosition = flagsEndPosition;
    lexer._advance();
    
    this.currToken = this.l.nextToken();
    this.peekToken = this.l.nextToken();

    return finishedNode;
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
// In parser-expressions.js

// --- THE DEFINITIVE REPLACEMENT for _parseGroupedOrArrowExpression ---
proto._parseGroupedOrArrowExpression = function() {
    const s = this._startNode();
    this._expect(TOKEN.LPAREN);

    if (this._currTokenIs(TOKEN.RPAREN)) { // Handles `()` for `() => ...`
        this._advance();
        if (!this._currTokenIs(TOKEN.ARROW)) {
            this._error("Unexpected empty parentheses in expression.");
            return null;
        }
        return this._parseArrowFunctionExpression(s, [], false);
    }

    const exprList = [];
    do {
        // --- THE FIX ---
        // We parse each item in the parenthesized list with the precedence of SEQUENCE.
        // This is the perfect balance:
        // 1. It is LOW enough (1) to allow an AssignmentExpression (precedence 2) to be parsed within it.
        // 2. It is HIGH enough (1) to NOT treat a comma (precedence 1) as an infix sequence operator,
        //    leaving the comma to be correctly handled by this do...while loop as a separator.
        exprList.push(this._parseExpression(PRECEDENCE.SEQUENCE));
    } while (this._currTokenIs(TOKEN.COMMA) && (this._advance(), true));

    this._expect(TOKEN.RPAREN);

    // After parsing, we resolve the ambiguity by looking for the arrow.
    if (this._currTokenIs(TOKEN.ARROW)) {
        // It's an arrow function. Convert expressions to valid parameter patterns.
        const params = exprList.map(e => this._convertExpressionToPattern(e));
        return this._parseArrowFunctionExpression(s, params, false);
    }

    // It was not an arrow function.
    if (exprList.length > 1) {
        // It was a sequence expression, like `(a, b, c)`.
        const seqNode = { type: 'SequenceExpression', expressions: exprList };
        const seqStart = { loc: { start: exprList[0].loc.start } };
        return this._finishNode(seqNode, seqStart);
    } else {
        // It was a single grouped expression, like `(a + b)`.
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
	// B"H
// --- The Unification: The rectified _parseAssignmentExpression function ---

proto._parseAssignmentExpression = function(left) {
    // First, use our new lens to reveal the true nature of the left-hand side.
    const pattern = this._convertExpressionToPattern(left);

    // If the conversion fails, it means the left side is truly invalid (e.g., a number literal).
    // This new check replaces the old, rigid guard clause.
    if (!pattern) {
        this._error("Invalid left-hand side in assignment.");
        return null;
    }

    // The rest of the function proceeds with this newfound clarity.
    const s = this._startNode();
    s.loc.start = pattern.loc.start;
    const operator = this.currToken.literal;
    this._advance();
    const right = this._parseExpression(PRECEDENCE.ASSIGNMENT - 1);

    return this._finishNode({
        type: "AssignmentExpression",
        operator: operator,
        left: pattern, // Use the enlightened pattern
        right: right
    }, s);
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
// --- The Final Tikkun for _parseObjectProperty ---
// This version integrates the wisdom to handle the "get" ambiguity
// with the previous fix for default value assignments.

proto._parseObjectProperty = function() {
    const s = this._startNode();

    if (this._currTokenIs(TOKEN.DOTDOTDOT)) {
        return this._parseSpreadElement();
    }

    let kind = 'init';
    let isAsync = false;
    let isGenerator = false;
    let computed = false;
    let key;

    // --- THE RECTIFICATION ---
    // Bestow the wisdom of foresight. "get" is only a keyword if it is an identifier
    // AND the token that follows it is NOT a parenthesis or a colon.
    const isGetterKeyword = this.currToken.type === TOKEN.IDENT && this.currToken.literal === 'get' && this.peekToken.type !== TOKEN.LPAREN && this.peekToken.type !== TOKEN.COLON;
    const isSetterKeyword = this.currToken.type === TOKEN.IDENT && this.currToken.literal === 'set' && this.peekToken.type !== TOKEN.LPAREN && this.peekToken.type !== TOKEN.COLON;

    // Consume modifiers ONLY if they are truly acting as modifiers.
    if (this.currToken.type === TOKEN.ASYNC && this.peekToken.type !== TOKEN.COLON) { isAsync = true; this._advance(); }
    if (this._currTokenIs(TOKEN.ASTERISK)) { isGenerator = true; this._advance(); }
    if (isGetterKeyword || isSetterKeyword) { kind = this.currToken.literal; this._advance(); }
    
    // Now, parse the property's key.
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

    // Check if it's a method (identified by the parenthesis).
    if (this._currTokenIs(TOKEN.LPAREN)) {
        const params = this._parseParametersList();
        const body = this._parseBlockStatement();
        const value = { type: 'FunctionExpression', id: null, params, body, async: isAsync, generator: isGenerator };

        return this._finishNode({
            type: 'Property', key: key, value: value, kind: kind,
            method: (kind === 'init'), shorthand: false, computed: computed
        }, s);
    }
    
    // Check if it's a standard `key: value` pair.
    if (this._currTokenIs(TOKEN.COLON)) {
        if (isAsync || isGenerator || kind !== 'init') {
             this._error(`Modifiers like async, get, or set must be followed by a method definition.`);
             return null;
        }
        this._advance();
        const value = this._parseExpression(PRECEDENCE.ASSIGNMENT);
        return this._finishNode({
            type: 'Property', key: key, value: value, kind: 'init',
            method: false, shorthand: false, computed: computed
        }, s);
    }

    // If it's none of the above, it must be a shorthand property.
    // Shorthand properties cannot have modifiers or be computed.
    if (key.type !== 'Identifier' || computed || isAsync || isGenerator || kind !== 'init') {
        this._error("Invalid object property syntax. Expected ':', '(', or a valid shorthand property.");
        return null;
    }
    
    let value = key;
    let shorthand = true;
    
    // This preserves the fix for the Omega Test (shorthand with default value).
    if (this._currTokenIs(TOKEN.ASSIGN)) {
        shorthand = false;
        const assignStart = this._startNode();
        assignStart.loc.start = key.loc.start;
        this._advance();
        const right = this._parseExpression(PRECEDENCE.ASSIGNMENT);
        value = this._finishNode({ type: 'AssignmentPattern', left: key, right: right }, assignStart);
    }
    
    return this._finishNode({
        type: 'Property', key: key, value: value, kind: 'init',
        method: false, shorthand: shorthand, computed: computed
    }, s);
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



// B"H
// In parser-expressions.js

// --- REPLACEMENT for _parseTemplateLiteral ---
proto._parseTemplateLiteral = function() {
    const startNodeInfo = this._startNode();
    const quasis = [];
    const expressions = [];
    let isTail = false;

    while (!isTail) {
        const quasiStart = this._startNode();
        const tokenType = this.currToken.type;

        if (tokenType !== TOKEN.TEMPLATE_HEAD && tokenType !== TOKEN.TEMPLATE_MIDDLE && tokenType !== TOKEN.TEMPLATE_TAIL) {
            this._error("Unexpected token inside template literal.");
            return null;
        }

        isTail = tokenType === TOKEN.TEMPLATE_TAIL;
        const value = { raw: this.currToken.literal, cooked: this.currToken.literal };
        quasis.push(this._finishNode({ type: 'TemplateElement', value: value, tail: isTail }, quasiStart));
        
        this._advance();

        if (!isTail) {
            // --- THE FIX ---
            // Set a flag to notify the expression parser of its special context.
            this.parsingTemplateExpression = true;
            
            expressions.push(this._parseExpression(PRECEDENCE.LOWEST));
            
            // Unset the flag immediately so it doesn't affect the rest of the parser.
            this.parsingTemplateExpression = false;
            // --- END OF THE FIX ---
        }
    }

    return this._finishNode({ type: 'TemplateLiteral', quasis, expressions }, startNodeInfo);
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
// 

proto._parseTaggedTemplateExpression = function(tag) { // 'tag' is the expression on the left
    const s = this._startNode();
    s.loc.start = tag.loc.start;

    // --- THIS IS THE FIX ---
    // The original function just called `_parseTemplateLiteral()`, which was wrong
    // and caused the recursion.
    // The correct behavior is for this INFIX function to parse the template literal
    // that it knows is coming. The logic for parsing a template literal is complex,
    // so we will call the prefix parser, BUT we must consume the current token first
    // to prevent it from being seen by the prefix parser.
    
    // The current token is guaranteed to be TEMPLATE_HEAD or TEMPLATE_TAIL.
    // _parseTemplateLiteral is the prefix parser for this token, so we call it.
    const quasi = this._parseTemplateLiteral();
    
    return this._finishNode({
        type: 'TaggedTemplateExpression',
        tag: tag,
        quasi: quasi
    }, s);
};
// B"H
// --- The Illumination: A new helper function to reveal the true nature of a pattern ---

proto._convertExpressionToPattern = function(node) {
    if (!node) return null;
    switch (node.type) {
        // These types are already valid patterns or can be part of one.
        case 'Identifier':
        case 'MemberExpression':
        case 'ObjectPattern': // Already a pattern
        case 'ArrayPattern':  // Already a pattern
            return node;

        // An ObjectExpression in this context is truly an ObjectPattern.
        case 'ObjectExpression':
            node.type = 'ObjectPattern';
            // Recursively convert the values of its properties.
            for (const prop of node.properties) {
                prop.value = this._convertExpressionToPattern(prop.value);
            }
            return node;

        // An ArrayExpression in this context is truly an ArrayPattern.
        case 'ArrayExpression':
            node.type = 'ArrayPattern';
            // Recursively convert its elements.
            node.elements = node.elements.map(el => this._convertExpressionToPattern(el));
            return node;

        // If we find any other type of expression, it is an invalid assignment target.
        default:
            // This is where the error for `1 = 2` would be caught.
            return null;
    }
}; 







})(MerkavahParser
	.prototype
	);
})();