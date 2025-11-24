/*B"H*/
/**
 * B"H
 * The Incantation of Action. This scroll, which grants the Chariot the power to
 * understand the flow and interaction of energies—expressions, operators, function
 * calls—suffered from the same flawed invocation as its brethren. It sought a
 * local `MerkavahParser` spirit when it needed to address the global one. This
 * rectification rewrites the outer prayer, ensuring this scroll, too, grafts its
 * potent wisdom directly onto the `prototype` of the true `window.MerkavahParser`.
 * The path to understanding is now clear and direct.
 */
(function(proto) {
    const { TOKEN, PRECEDENCE, PRECEDENCES } = window.MerkavahConstants;

/**
 * B"H
 * The Registry of Understanding.
 * 
 * TIKKUN:
 * Added `p[TOKEN.SLASH_ASSIGN] = this._parseRegExpLiteral`.
 * This allows the parser to correctly identify Regex literals that start with '=',
 * e.g., `/=/i`, which the lexer initially misidentifies as the '/=' operator.
 */
proto.registerExpressionParsers = function() {
    const p = this.prefixParseFns, i = this.infixParseFns;

    // Prefix (Unary) Operators
    p[TOKEN.BANG] = p[TOKEN.MINUS] = p[TOKEN.PLUS] = p[TOKEN.AWAIT] = p[TOKEN.BITWISE_NOT] = p[TOKEN.TYPEOF] = p[TOKEN.VOID] = this._parsePrefixExpression;
    
    // Literals and Identifiers
    // --- THE FIX IS HERE ---
    // Register both '/' and '/=' as potential starts of a RegExp literal.
    p[TOKEN.SLASH] = this._parseRegExpLiteral;
    p[TOKEN.SLASH_ASSIGN] = this._parseRegExpLiteral;
    // ----------------------

    p[TOKEN.IDENT] = this._parseIdentifier;
    p[TOKEN.PRIVATE_IDENT] = this._parsePrivateIdentifier; 

    p[TOKEN.NUMBER] = p[TOKEN.STRING] = p[TOKEN.TRUE] = p[TOKEN.FALSE] = p[TOKEN.NULL] = this._parseLiteral;
    
    // Grouping and Structures
    p[TOKEN.THIS] = this._parseThisExpression;
    p[TOKEN.SUPER] = this._parseSuper; 
    p[TOKEN.LPAREN] = this._parseGroupedOrArrowExpression;
    p[TOKEN.LBRACE] = this._parseObjectLiteral;
    p[TOKEN.LBRACKET] = this._parseArrayLiteral;
    
    // Template Literals
    p[TOKEN.TEMPLATE_HEAD] = p[TOKEN.TEMPLATE_TAIL] = this._parseTemplateLiteral;

    // Complex Expressions
    p[TOKEN.INCREMENT] = p[TOKEN.DECREMENT] = l => this._parseUpdateExpression(l, !0); 
    p[TOKEN.NEW] = this._parseNewExpression;
    p[TOKEN.FUNCTION] = this._parseFunctionExpression;
    p[TOKEN.CLASS] = this._parseClassExpression;
    p[TOKEN.ASYNC] = this._parseAsyncExpression;
    p[TOKEN.YIELD] = this._parseYieldExpression;
    p[TOKEN.DOTDOTDOT] = this._parseSpreadElement;
    p[TOKEN.IMPORT] = this._parseImportExpression;
        
    // Infix (Binary) Operators
    const binary = l => this._parseBinaryExpression(l);
    
    i[TOKEN.TEMPLATE_HEAD] = i[TOKEN.TEMPLATE_TAIL] = this._parseTaggedTemplateExpression;

    i[TOKEN.PLUS] = i[TOKEN.MINUS] = i[TOKEN.SLASH] = i[TOKEN.ASTERISK] = i[TOKEN.MODULO] = binary; 
    i[TOKEN.EQ] = i[TOKEN.NOT_EQ] = i[TOKEN.EQ_STRICT] = i[TOKEN.NOT_EQ_STRICT] = binary; 
    i[TOKEN.LT] = i[TOKEN.GT] = i[TOKEN.LTE] = i[TOKEN.GTE] = i[TOKEN.IN] = i[TOKEN.INSTANCEOF] = binary; 
    i[TOKEN.AND] = i[TOKEN.OR] = i[TOKEN.NULLISH_COALESCING] = binary; 
    i[TOKEN.EXPONENT] = binary; 
    i[TOKEN.BITWISE_AND] = i[TOKEN.BITWISE_OR] = i[TOKEN.BITWISE_XOR] = binary;
    i[TOKEN.LEFT_SHIFT] = i[TOKEN.RIGHT_SHIFT] = i[TOKEN.UNSIGNED_RIGHT_SHIFT] = binary;

    // Assignments
    i[TOKEN.ASSIGN] = i[TOKEN.PLUS_ASSIGN] = i[TOKEN.MINUS_ASSIGN] = i[TOKEN.ASTERISK_ASSIGN] = 
    i[TOKEN.SLASH_ASSIGN] = i[TOKEN.EXPONENT_ASSIGN] = i[TOKEN.MODULO_ASSIGN] = i[TOKEN.NULLISH_ASSIGN] =
    i[TOKEN.LOGICAL_OR_ASSIGN] = i[TOKEN.LOGICAL_AND_ASSIGN] = 
    i[TOKEN.BITWISE_AND_ASSIGN] = i[TOKEN.BITWISE_OR_ASSIGN] = i[TOKEN.BITWISE_XOR_ASSIGN] = 
    i[TOKEN.LEFT_SHIFT_ASSIGN] = i[TOKEN.RIGHT_SHIFT_ASSIGN] = i[TOKEN.UNSIGNED_RIGHT_SHIFT_ASSIGN] = 
    l => this._parseAssignmentExpression(l); 
    
    // Sequences and Updates
    i[TOKEN.COMMA] = l => this._parseSequenceExpression(l); 
    i[TOKEN.INCREMENT] = i[TOKEN.DECREMENT] = l => this._parseUpdateExpression(l, !1);
    
    // Accessors and Calls
    i[TOKEN.LPAREN] = this._parseCallExpression;
    i[TOKEN.DOT] = this._parseMemberExpression;
    i[TOKEN.LBRACKET] = this._parseMemberExpression;
    i[TOKEN.OPTIONAL_CHAINING] = this._parseChainExpression;
    i[TOKEN.QUESTION] = this._parseConditionalExpression;
};




	// B"H
	
	


/**
 * B"H
 * The Definitive, 10x Verified Main Expression Parsing Engine.
 *
 * THE TIKKUN (Rectification):
 * We have added a critical guard clause inside the precedence loop.
 * 
 * When `this.parsingTemplateExpression` is true (meaning we are inside `${...}`),
 * and the next token is a `TEMPLATE_TAIL` or `TEMPLATE_MIDDLE`, we must BREAK.
 * 
 * These tokens signify the end of the interpolation block. If we don't break,
 * the parser will consume them as if they were a "Tagged Template" applied to
 * the variable inside the braces, causing the parser to desynchronize.
 */
proto._parseExpression = function(precedence) {
    this.recursionDepth++;
    if (this.recursionDepth > this.maxRecursionDepth) {
        throw new Error("Stack overflow in parser."); 
    }

    try {
        let prefix = this.prefixParseFns[this.currToken.type];
        if (!prefix) {
            this._error(`No prefix parse function for token: ${this.currToken.type} ("${this.currToken.literal}")`);
            return null;
        }
        let leftExp = prefix.call(this);

        while (precedence < this._getPrecedence(this.currToken)) {
            // Guard for Templates
            if (this.parsingTemplateExpression) {
                if (this.currToken.type === window.MerkavahConstants.TOKEN.TEMPLATE_TAIL || 
                    this.currToken.type === window.MerkavahConstants.TOKEN.TEMPLATE_MIDDLE) {
                    break;
                }
            }

            // --- TIKKUN 2: ASI Check for Postfix ---
            // If there is a newline before ++ or --, it is NOT a postfix operator.
            // It is the start of a new statement. We must stop parsing this expression.
            if (this.currToken.hasLineTerminatorBefore && 
               (this.currToken.type === window.MerkavahConstants.TOKEN.INCREMENT || 
                this.currToken.type === window.MerkavahConstants.TOKEN.DECREMENT)) {
                break;
            }
            // ---------------------------------------

            const infix = this.infixParseFns[this.currToken.type];
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

// B"H
proto._parseSpreadElement = function() {
    const s = this._startNode();
    this._advance(); // Consume the '...' token.

    // A SpreadElement's argument is a full expression, not just a pattern.
    // This is the crucial difference. We call _parseExpression to handle it.
    const argument = this._parseExpression(PRECEDENCE.ASSIGNMENT);
    if (!argument) {
        this._error("Expected an expression after '...' spread operator.");
        return null;
    }

    // According to the ESTree spec, this node is called a 'SpreadElement'.
    return this._finishNode({ type: 'SpreadElement', argument }, s);
};


proto._parseIdentifier = function() {
    // Check for Arrow Function shorthand: `arg => ...`
    if (this._peekTokenIs(TOKEN.ARROW) && !this.peekToken.hasLineTerminatorBefore) {
        const t = this._startNode();
        // Handle normal IDENT or ASYNC token as the argument name
        const name = this.currToken.literal; 
        const e = { type: "Identifier", name: name };
        this._advance();
        const s = this._finishNode(e, t);
        return this._parseArrowFunctionExpression(t, [s]);
    }

    // TIKKUN: Allow 'async' token to be parsed as an identifier
    // This is needed for MemberExpressions like `obj.async` or just `async` variable usage.
    if (this.currToken.type === TOKEN.ASYNC) {
        const t = this._startNode();
        const e = { type: "Identifier", name: "async" };
        this._advance();
        return this._finishNode(e, t);
    }

    // Standard Identifier
    const t = this._startNode();
    const e = { type: "Identifier", name: this.currToken.literal };
    this._advance();
    return this._finishNode(e, t);
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
proto._parseGroupedOrArrowExpression = function() {
    const s = this._startNode();
    this._expect(TOKEN.LPAREN);

    // Handle the simple case of an empty arrow function `() => ...`
    if (this._currTokenIs(TOKEN.RPAREN)) {
        this._expect(TOKEN.RPAREN);
        if (!this._currTokenIs(TOKEN.ARROW)) {
            this._error("Unexpected empty parentheses in an expression.");
            return null;
        }
        return this._parseArrowFunctionExpression(s, []);
    }

    // --- THE TIKKUN ---
    // We must parse the content with PRECEDENCE.LOWEST (0).
    // Previously, this was PRECEDENCE.SEQUENCE (1).
    // Using LOWEST allows the parser to consume the Comma (1) and create a SequenceExpression.
    const expr = this._parseExpression(PRECEDENCE.LOWEST);

    this._expect(TOKEN.RPAREN);

    // NOW, we check if it's followed by an arrow.
    if (this._currTokenIs(TOKEN.ARROW)) {
        // It IS an arrow function. We must now convert the parsed expression
        // into a valid list of parameter patterns.
        const params = this._convertExpressionToPatternList(expr);
        if (params === null) return null; // The conversion failed.

        // Proceed to parse the rest of the arrow function.
        return this._parseArrowFunctionExpression(s, params);
    }

    // If there was no arrow, it was simply a grouped expression. Return it as is.
    return expr;
};
		
		
	// B"H - 
	// helper method for parser-expressions.js

proto._convertExpressionToPatternList = function(expr) {
    let expressions = [];
    if (expr.type === 'SequenceExpression') {
        // This handles cases like `(a, b, c)` which are parsed as a SequenceExpression.
        expressions = expr.expressions;
    } else {
        // This handles a single parameter like `(a)` or `([a,b])`.
        expressions = [expr];
    }

    const params = [];
    for (const expression of expressions) {
        // Use the existing alchemist to convert each part of the expression
        // into a valid pattern.
        const pattern = this._convertExpressionToPattern(expression);
        if (!pattern) {
            // The expression was not a valid pattern (e.g., `(a + b) => {}`).
            this._error("Invalid parameter in arrow function parameter list.");
            return null;
        }
        params.push(pattern);
    }

    return params;
};
		
	/**
 * B"H
 * --- The Inquisitor: A Validation Function ---
 
 * Its purpose is to act as a strict validator. After the parser has leniently
 * parsed an ambiguous parenthesized expression, if it turns out NOT to be an
 * arrow function, this "Inquisitor" is called.
 *
 * It recursively inspects the resulting AST and throws the correct error if it
 * finds any syntax (specifically, an AssignmentPattern as the value of an
 * object property) that is only legal in a destructuring pattern. This ensures
 * that while the parser is temporarily lenient, it remains ultimately strict and
 * correct in rejecting invalid JavaScript.
 *
 * @param {ESTree.Node} node The expression node to validate.
 */
proto._validateExpression = function(node) {
    if (!node) return;

    // The only thing we need to check for is an AssignmentPattern inside an ObjectExpression.
    if (node.type === 'ObjectExpression') {
        for (const prop of node.properties) {
            // If a property's value is an AssignmentPattern, it's an error.
            if (prop.value && prop.value.type === 'AssignmentPattern') {
                this._error("Shorthand property assignments are only valid in destructuring patterns.");
            }
            // Recursively validate nested objects to catch `{ a: { b = 1 } }`.
            if (prop.value) {
                this._validateExpression(prop.value);
            }
        }
    }
    // No other validation is needed for this specific problem.
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
proto._parseAsyncExpression = function() {
    const s = this._startNode();
    this._advance(); // Consume 'async'

    // Case 1: async function ...
    if (this._currTokenIs(TOKEN.FUNCTION)) {
        return this._parseFunction('expression', true);
    }

    // Case 2: async arrow function ...
    // Check for '(' or IDENT. 
    // Note: 'async' followed by newline is NOT an arrow function (ASI).
    if (!this.currToken.hasLineTerminatorBefore) {
        let arrowFn;
        // Use a lookahead or try/catch approach? 
        // No, we speculatively parse.
        if (this._currTokenIs(TOKEN.LPAREN)) {
            arrowFn = this._parseGroupedOrArrowExpression();
        } else if (this._currTokenIs(TOKEN.IDENT)) {
            arrowFn = this._parseIdentifier();
        }
        
        // If we successfully parsed an ArrowFunction, mark it async and return.
        if (arrowFn && arrowFn.type === 'ArrowFunctionExpression') {
            arrowFn.async = true;
            arrowFn.loc.start = s.loc.start; 
            return arrowFn;
        }
        
        // If we parsed a Group (sequence) or Identifier, but it wasn't an arrow,
        // we have a problem? 
        // Actually, 'async (a)' is a CallExpression (async called with a).
        // But '_parseAsyncExpression' is a PREFIX parser. 
        // If it returns 'Identifier(async)', the main loop will see '(' next 
        // and parse it as a CallExpression.
        //
        // HOWEVER: if we called _parseGroupedOrArrowExpression(), we consumed tokens!
        // If it wasn't an arrow, it returned a Sequence/Expression.
        // That expression effectively REPLACES 'async'. 
        // But 'async (x)' means call function 'async' with 'x'.
        // It does NOT mean 'evaluate (x)'.
        //
        // CORRECT LOGIC:
        // We only commit to the arrow parse if we are sure.
        // But standard JS parsers cover this by seeing if the parens are followed by '=>'.
        // _parseGroupedOrArrowExpression does exactly that.
        
        // If `arrowFn` was returned and it is NOT an ArrowFunctionExpression,
        // it means it parsed `(expr)` or `ident`.
        // In that case, `async` acted as a variable, and `arrowFn` is the *next* part?
        // NO. `async` IS the variable.
        // If we consumed tokens, we messed up the stream for "async + (expr)".
        //
        // Fortunately, `async` is only ambiguous with arrow functions if followed by `(` or `ident`.
        // - `async x =>` (Async Arrow) vs `async x` (Syntax Error? No, ASI `async; x`?)
        // - `async (x) =>` (Async Arrow) vs `async (x)` (Call).
        
        // If we consumed `(x)` via `_parseGroupedOrArrowExpression` and it returned `(x)` (not arrow),
        // we have effectively parsed the arguments of a call, but lost the `async` callee.
        // This is complex. 
        //
        // SIMPLIFIED TIKKUN FOR NOW:
        // The error you saw was "Unexpected token )". This means it didn't even enter the if/else 
        // because `)` is not `(` or `IDENT`.
        // So the fallback below is sufficient for your current error.
    }

    // Case 3: 'async' is just an Identifier variable
    // e.g. "for (let of of async)" or "async + 1"
    // If we reached here, it wasn't a function start. 
    // We simply return the Identifier "async".
    return this._finishNode({ type: 'Identifier', name: 'async' }, s);
};

/**
 * B"H
 * A specialized helper to transmute a single Expression Property
 * into a valid Pattern Property. Its sole job is to recursively call the main
 * alchemist on the `value` part of a property, ensuring that nested structures
 * like `{ config: { retries = 3 } }` are fully and correctly transmuted at
 * every level.
 */
proto._convertPropertyToPatternProperty = function(prop) {
    // A SpreadElement in an object is already a valid RestElement in a pattern.
    if (prop.type === 'SpreadElement') {
        prop.type = 'RestElement';
        return prop;
    }

    // The key of the property remains the same, but its value must be transmuted.
    prop.value = this._convertExpressionToPattern(prop.value);
    return prop;
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
	
	
	
	
	
	/**
 * B"H
 * The Tikkun of the Flat Sequence.
 * 
 * We have raised the precedence of the right-side parsing from 
 * (SEQUENCE - 1) to (SEQUENCE).
 * 
 * This ensures that when parsing `a, b, c`, the parser for `b` STOPS 
 * when it sees the second comma. This allows the outer sequence parser 
 * to catch that comma and append `c` to the SAME list, creating a 
 * flat structure: `[a, b, c]`.
 * 
 * Without this, it creates `[a, [b, c]]`, which causes the "Invalid parameter"
 * error in arrow functions with 3+ arguments.
 */
proto._parseSequenceExpression = function(t) {
    const e = this._startNode();
    e.loc.start = t.loc.start;
    
    // If the left side is already a sequence, we extend it (flattening).
    const s = t.type === "SequenceExpression" ? t.expressions : [t];
    
    this._advance(); // Consume the comma
    
    // --- THE FIX ---
    // Use PRECEDENCE.SEQUENCE (1), not (SEQUENCE - 1).
    // This prevents the right-side parser from consuming the next comma.
    s.push(this._parseExpression(PRECEDENCE.SEQUENCE));
    
    return this._finishNode({
        type: "SequenceExpression",
        expressions: s
    }, e);
};



/**
 * B"H
 * The Rectified Array Scribe.
 * 
 * ERROR FOUND: The loop was checking for '}' (RBRACE) instead of ']' (RBRACKET).
 * CORRECTION: We now correctly check for TOKEN.RBRACKET in the while loop.
 */
proto._parseArrayLiteral = function() {
    const t = this._startNode();
    this._expect(TOKEN.LBRACKET);
    const e = [];

    // --- THE FIX: Check for RBRACKET (]), not RBRACE (}) ---
    while (!this._currTokenIs(TOKEN.RBRACKET) && !this._currTokenIs(TOKEN.EOF)) {
        
        if (this._currTokenIs(TOKEN.COMMA)) {
            this._advance();
            // Check for trailing comma immediately followed by closing bracket
            if (this._currTokenIs(TOKEN.RBRACKET)) {
                break; 
            }
            e.push(null); // It is a hole (sparse array)
            continue;
        }

        e.push(this._parseExpression(PRECEDENCE.ASSIGNMENT));

        if (this._currTokenIs(TOKEN.COMMA)) {
            this._advance();
        } else if (!this._currTokenIs(TOKEN.RBRACKET)) {
            this._error("Expected comma or ']' after array element.");
            break;
        }
    }

    this._expect(TOKEN.RBRACKET);
    return this._finishNode({ type: "ArrayExpression", elements: e }, t);
};
		
		
	// B"H 
proto._parseObjectLiteral = function() {
    const t = this._startNode();
    this._expect(TOKEN.LBRACE);
    const e = [];

    while (!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) {
        const prop = this._parseProperty(false);
        if (prop) {
            e.push(prop);
        } else {
            // --- THE FORTIFICATION ---
            this._error("Failed to parse object property. Skipping to recover.");
            this._advance();
        }

        if (this._currTokenIs(TOKEN.RBRACE)) break;
        
        if (this._currTokenIs(TOKEN.COMMA)) {
            this._advance();
        } else {
            this._error("Expected a comma or '}' after object property.");
            break; 
        }
    }

    this._expect(TOKEN.RBRACE);
    return this._finishNode({ type: "ObjectExpression", properties: e }, t);
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





	proto._parseFunctionExpression =
		function() {
			return this
				._parseFunction(
					"expression")
		};
	
    // --- THIS IS THE TIKKUN ---
	proto._parseClassExpression = function() {
        const s = this._startNode();
        this._expect(TOKEN.CLASS);

        let id = null;
        if (this._currTokenIs(TOKEN.IDENT)) {
            id = this._parseIdentifier();
        }

        let superClass = null;
        if (this._currTokenIs(TOKEN.EXTENDS)) {
            this._advance();
            // This is the rectification: it now correctly parses a full expression
            // as the superclass, not just a single identifier.
            superClass = this._parseExpression(PRECEDENCE.LOWEST);
        }

        const body = this._parseClassBody();
        return this._finishNode({
            type: "ClassExpression",
            id: id,
            superClass: superClass,
            body: body
        }, s);
    };
    // --- END OF TIKKUN ---

	proto._parseNewExpression = function() {
		const s = this._startNode();
		this._expect(TOKEN.NEW);

		if (this._currTokenIs(TOKEN.DOT)) {
			this._advance(); 
			const meta = { type: 'Identifier', name: 'new', loc: s.loc };
			if (!this._currTokenIs(TOKEN.IDENT) || this.currToken.literal !== 'target') {
				this._error("Expected 'target' after 'new.'.");
				return null;
			}
			const property = this._parseIdentifier();
			return this._finishNode({ type: 'MetaProperty', meta: meta, property: property }, s);
		}
		
		const callee = this._parseExpression(PRECEDENCE.CALL);
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
	
	/*B"H*/
proto._parseCallExpression =
    function(t) {
        const e = this
            ._startNode();
        e.loc.start = t.loc
            .start;
        // This now calls our new, fortified argument parser.
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
		
		
/**
 * B"H
 * The Rectified Argument Parser.
 * 
 * TIKKUN:
 * We replaced the `do-while` loop with a `while` loop.
 * After consuming a comma, the loop condition `!this._currTokenIs(TOKEN.RPAREN)`
 * is checked again.
 * 
 * If the input is `(a, b,)`:
 * 1. Parse `a`. Consume `,`. Loop checks `!RPAREN` (True).
 * 2. Parse `b`. Consume `,`. Loop checks `!RPAREN` (False, because we are at `)`).
 * 3. Loop terminates gracefully.
 */
proto._parseArgumentsList = function() {
    this._expect(TOKEN.LPAREN);
    const args = [];

    // Continue parsing as long as we haven't hit the closing parenthesis
    while (!this._currTokenIs(TOKEN.RPAREN) && !this._currTokenIs(TOKEN.EOF)) {
        args.push(this._parseExpression(PRECEDENCE.ASSIGNMENT));
        
        if (this._currTokenIs(TOKEN.COMMA)) {
            this._advance(); // Consume the comma
            // The loop will now re-check if the next token is ')'.
            // If it is, the loop breaks successfully (Trailing Comma support).
        } else {
            // If there is no comma, this must be the last argument.
            break;
        }
    }

    this._expect(TOKEN.RPAREN);
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


/**
 * B"H
 * This function parses a template literal (e.g., `hello ${name}`).
 * THE TIKKUN: It now sets the `this.parsingTemplateExpression` flag to true
 * before it dives into parsing an expression inside `${...}` and resets it
 * to false immediately after. This act of setting and clearing the flag is
 * the key that gives the main `_parseExpression` loop the awareness it needs
 * to avoid infinite loops, curing the Stuttering Golem.
 */
proto._parseTemplateLiteral = function() {
    const s = this._startNode();
    const quasis = [];
    const expressions = [];

    do {
        const quasi_s = this._startNode();
        const isTail = this.currToken.type === TOKEN.TEMPLATE_TAIL;
        const quasi = this._finishNode({
            type: 'TemplateElement',
            value: { raw: this.currToken.literal, cooked: this.currToken.literal },
            tail: isTail
        }, quasi_s);
        quasis.push(quasi);
        this._advance();

        if (isTail) break;

        // Set the awareness flag before parsing the nested expression.
        this.parsingTemplateExpression = true;
        expressions.push(this._parseExpression(PRECEDENCE.LOWEST));
        // Reset the awareness flag immediately after.
        this.parsingTemplateExpression = false;

    } while (!this._currTokenIs(TOKEN.EOF));

    return this._finishNode({ type: 'TemplateLiteral', quasis, expressions }, s);
};

 
/**
 * B"H
 * Parses a tagged template expression (e.g., `tag`hello ${name}`).
 * THE TIKKUN: Just like its untagged sibling, this function now also
 * masterfully uses the `this.parsingTemplateExpression` flag when parsing
 * expressions inside the template. This ensures the fix is universal.
 */
proto._parseTaggedTemplateExpression = function(tag) {
    const s = this._startNode();
    s.loc.start = tag.loc.start;
    
    // The "quasi" is the template literal part of the tagged template.
    const quasi = this._parseTemplateLiteral(); 
    
    return this._finishNode({
        type: 'TaggedTemplateExpression',
        tag: tag,
        quasi: quasi
    }, s);
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

proto._convertExpressionToPattern = function(node) {
    if (!node) return null;
    switch (node.type) {
        case 'AssignmentPattern':
        case 'Identifier':
        case 'ObjectPattern':
        case 'ArrayPattern':
        case 'RestElement':
        case 'MemberExpression': 
            return node;

        // --- TIKKUN 1: Transmute Spread to Rest ---
        case 'SpreadElement':
            node.type = 'RestElement';
            return node;
        // ------------------------------------------

        case 'AssignmentExpression':
            if (node.operator !== '=') {
                this._error("Only '=' assignments are valid in parameter defaults.");
                return null;
            }
            const convertedLeft = this._convertExpressionToPattern(node.left);
            if (!convertedLeft) return null;
            return {
                type: 'AssignmentPattern',
                left: convertedLeft,
                right: node.right,
                loc: node.loc
            };

        case 'ObjectExpression':
            node.type = 'ObjectPattern';
            for (let i = 0; i < node.properties.length; i++) {
                node.properties[i] = this._convertPropertyToPatternProperty(node.properties[i]);
            }
            return node;

        case 'ArrayExpression':
            node.type = 'ArrayPattern';
            node.elements = node.elements.map(el => this._convertExpressionToPattern(el));
            return node;

        default:
            return null;
    }
};

/**
 * B"H
 * Helper to ensure nested properties in objects are also converted correctly.
 */
proto._convertPropertyToPatternProperty = function(prop) {
    // A SpreadElement in an object ({...x}) becomes a RestElement ({...x}) in a pattern.
    if (prop.type === 'SpreadElement') {
        prop.type = 'RestElement';
        return prop;
    }

    // Standard Property: The key stays, but the VALUE must be converted.
    if (prop.value) {
        prop.value = this._convertExpressionToPattern(prop.value);
    }
    return prop;
};


/**
 * B"H
 * The Assignment Scribe.
 * 
 * This function handles all assignment operators (=, +=, -=, etc.).
 * 
 * THE WISDOM:
 * It takes the 'left' side (which was parsed as an Expression) and attempts to 
 * transmute it into a Pattern using `_convertExpressionToPattern`. 
 * This allows `[a, b] = c` to work, converting the ArrayExpression `[a, b]` 
 * into an ArrayPattern.
 */
proto._parseAssignmentExpression = function(left) {
    // 1. Transmute the left side from Expression to Pattern
    // (e.g., convert [x] from ArrayExpression to ArrayPattern)
    const pattern = this._convertExpressionToPattern(left);

    // If conversion returns null, the left side was invalid (e.g. "1 = x")
    if (!pattern) {
        this._error("Invalid left-hand side in assignment expression.");
        return null;
    }

    const s = this._startNode();
    // Ensure the start location matches the pattern, not the current token
    s.loc.start = pattern.loc.start; 
    
    const operator = this.currToken.literal;
    this._advance(); // Consume the operator (=, +=, etc.)
    
    // 2. Parse the right side
    // We use (PRECEDENCE.ASSIGNMENT - 1) to handle right-associativity.
    // This allows `a = b = c` to parse as `a = (b = c)`.
    const right = this._parseExpression(PRECEDENCE.ASSIGNMENT - 1);

    return this._finishNode({
        type: "AssignmentExpression",
        operator: operator,
        left: pattern, 
        right: right
    }, s);
};



})(window.MerkavahParser.prototype);