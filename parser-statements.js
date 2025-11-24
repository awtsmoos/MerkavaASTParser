/*B"H*/
/**
 * B"H
 * The Incantation of Control. This scroll, which imbues the Chariot with the
 * wisdom of control flow—the sacred rhythms of `if`, `for`, `while`, and `try`—
 * also spoke its prayer into the void. It sought a local spirit when it required
 * the global one. This rectification seals the final crack in the Chariot's
 * assembly. Like its brethren, its core invocation is rewritten to call upon the
 * `prototype` of the `window.MerkavahParser` directly. With this final act of
 * Tikkun, all three aspects of the parser's soul are unified, and the Merkava is
 * whole, ready for its ascent.
 */
(function(proto) {
    const { TOKEN, PRECEDENCE, PRECEDENCES } = window.MerkavahConstants;

	proto.registerStatementParsers = function() { /* No registration needed */ };

	// This function is now deprecated, as its logic has been correctly
	// centralized into `_parseDeclaration`. It is left here for safety
	// but should not be the main entry point for parsing statements.
	proto._parseStatement = function() {
		return this._parseExpressionStatement();
	};

	// --- THIS IS THE CORRECT IMPLEMENTATION ---
	proto._parseBlockStatement = function() {
		const s = this._startNode();
		this._expect(TOKEN.LBRACE); // Expect and consume '{'

		const body = [];

		// This loop correctly parses statements until it finds the closing brace.
		while (!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) {
			// It calls `_parseDeclaration`, which is the single source of truth.
			const stmt = this._parseDeclaration();
			if (stmt) {
				body.push(stmt);
			} else {
				// To prevent infinite loops on an unknown token, we advance.
				this._error("Expected a statement or declaration within the block.");
				this._advance();
			}
		}

		this._expect(TOKEN.RBRACE); // Expect and consume '}'
		
		return this._finishNode({ type: 'BlockStatement', body }, s);
	};

	proto._parseExpressionStatement = function() {
		const s = this._startNode();
		
		// Expression statements cannot start with these keywords.
		if(this.currToken.type === TOKEN.FUNCTION || this.currToken.type === TOKEN.CLASS || this.currToken.type === TOKEN.LET) {
			return null;
		}

		const expr = this._parseExpression(PRECEDENCE.LOWEST);
		
		if (!expr) {
			return null; 
		}

		this._consumeSemicolon();
		return this._finishNode({ type: 'ExpressionStatement', expression: expr }, s);
	};

	proto._parseIfStatement = function() {
		const s = this._startNode();
		this._expect(TOKEN.IF);
		this._expect(TOKEN.LPAREN);
		const test = this._parseExpression(PRECEDENCE.LOWEST);
		this._expect(TOKEN.RPAREN);
		const consequent = this._parseDeclaration(); // Use _parseDeclaration to handle blocks or single statements
		let alternate = null;
		if (this._currTokenIs(TOKEN.ELSE)) {
			this._advance();
			alternate = this._parseDeclaration(); // Also use _parseDeclaration here
		}
		if (!test || !consequent) return null;
		return this._finishNode({ type: 'IfStatement', test, consequent, alternate }, s);
	};

	// B"H 
	
	

// B"H


proto._parseForStatement = function() {
    const s = this._startNode();
    this._expect(TOKEN.FOR);

    // --- THIS IS THE TIKKUN (THE FIX) ---
    // Check for the optional 'await' keyword used in 'for await...of' loops.
    let isAwait = false;
    if (this._currTokenIs(TOKEN.AWAIT)) {
        isAwait = true;
        this._advance(); // Consume 'await'
    }
    // --- END OF TIKKUN ---

    this._expect(TOKEN.LPAREN); // Now, we expect the parenthesis.

    let left = null;
    if (!this._currTokenIs(TOKEN.SEMICOLON)) {
        if (this._currTokenIs(TOKEN.LET) || this._currTokenIs(TOKEN.CONST) || this._currTokenIs(TOKEN.VAR)) {
            left = this._parseVariableDeclaration(true);
        } else {
            left = this._parseExpression(PRECEDENCE.LOWEST);
        }
    }

    if ((this.currToken.type === TOKEN.IDENT && this.currToken.literal === 'of') || this._currTokenIs(TOKEN.IN)) {
        const isForOf = this.currToken.literal === 'of';

        // Add a check: 'for await...in' is invalid syntax.
        if (isAwait && !isForOf) {
            this._error("'for await' is only valid with 'of', not 'in'.");
            return null;
        }

        this._advance(); // consume 'in' or 'of'

        if (left.type === 'VariableDeclaration' && left.declarations.length > 1) {
            this._error("for-in/of loops may not contain more than one variable declaration.");
            return null;
        }
        
        const right = this._parseExpression(PRECEDENCE.LOWEST);
        this._expect(TOKEN.RPAREN);
        const body = this._parseDeclaration();
        if (!left || !right || !body) return null;
        
        // Pass the 'isAwait' flag to the final AST node.
        return this._finishNode({ 
            type: isForOf ? 'ForOfStatement' : 'ForInStatement', 
            left, 
            right, 
            body, 
            await: isAwait // The ESTree spec uses this 'await' property.
        }, s);
    }

    // If it's a C-style loop, the 'await' keyword is illegal here.
    if (isAwait) {
        this._error("Unexpected 'await' in C-style for loop declaration.");
        return null;
    }

    this._expect(TOKEN.SEMICOLON);
    const test = this._currTokenIs(TOKEN.SEMICOLON) ? null : this._parseExpression(PRECEDENCE.LOWEST);
    this._expect(TOKEN.SEMICOLON);
    const update = this._currTokenIs(TOKEN.RPAREN) ? null : this._parseExpression(PRECEDENCE.LOWEST);
    this._expect(TOKEN.RPAREN);
    const body = this._parseDeclaration();
    if (!body) return null;
    return this._finishNode({ type: 'ForStatement', init: left, test, update, body }, s);
};




	proto._parseWhileStatement = function() {
		const s = this._startNode();
		this._expect(TOKEN.WHILE);
		this._expect(TOKEN.LPAREN);
		const test = this._parseExpression(PRECEDENCE.LOWEST);
		this._expect(TOKEN.RPAREN);
		const body = this._parseDeclaration();
		if (!test || !body) return null;
		return this._finishNode({ type: 'WhileStatement', test, body }, s);
	};

	// --- THIS IS THE CORRECT IMPLEMENTATION ---
	proto._parseReturnStatement = function() {
		const s = this._startNode();
		this._advance(); // Consume the 'return' token.

		let argument = null;

		// This logic correctly checks if an expression follows 'return'.
		// It handles Automatic Semicolon Insertion by checking for a newline.
		if (!this._currTokenIs(TOKEN.SEMICOLON) && !this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF) && !this.currToken.hasLineTerminatorBefore) {
			argument = this._parseExpression(PRECEDENCE.LOWEST);
		}

		this._consumeSemicolon();
		
		return this._finishNode({ type: 'ReturnStatement', argument }, s);
	};
	
	
	// B"H --- Add these to the bottom of parser-statements.js ---

    proto._parseSwitchStatement = function() {
        const s = this._startNode();
        this._expect(TOKEN.SWITCH);
        this._expect(TOKEN.LPAREN);
        const discriminant = this._parseExpression(PRECEDENCE.LOWEST);
        this._expect(TOKEN.RPAREN);
        this._expect(TOKEN.LBRACE);

        const cases = [];
        while (!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) {
            const caseClause = this._parseSwitchCase();
            if (caseClause) {
                cases.push(caseClause);
            }
        }

        this._expect(TOKEN.RBRACE);
        return this._finishNode({ type: 'SwitchStatement', discriminant, cases }, s);
    };

    proto._parseSwitchCase = function() {
        const s = this._startNode();
        let test = null;

        if (this._currTokenIs(TOKEN.CASE)) {
            this._advance(); // Consume 'case'
            test = this._parseExpression(PRECEDENCE.LOWEST);
        } else if (this._currTokenIs(TOKEN.DEFAULT)) {
            this._advance(); // Consume 'default'
            // test remains null
        } else {
            this._error("Expected 'case' or 'default' keyword.");
            return null;
        }

        this._expect(TOKEN.COLON);

        const consequent = [];
        // Loop until we hit the next case, default, or the end of the switch block
        while (!this._currTokenIs(TOKEN.RBRACE) && 
               !this._currTokenIs(TOKEN.CASE) &&
               !this._currTokenIs(TOKEN.DEFAULT) &&
               !this._currTokenIs(TOKEN.EOF)) {
            const stmt = this._parseDeclaration();
            if (stmt) {
                consequent.push(stmt);
            }
        }

        return this._finishNode({ type: 'SwitchCase', test, consequent }, s);
    };

    // B"H
// --- 
    proto._parseBreakStatement = function() {
        const s = this._startNode();
        this._advance(); // Consume 'break'

        let label = null;
        // THIS IS THE TIKKUN:
        // Check if an identifier follows on the same line.
        // If it does, it's a label for the break statement.
        if (!this.currToken.hasLineTerminatorBefore && this._currTokenIs(TOKEN.IDENT)) {
            label = this._parseIdentifier();
        }

        this._consumeSemicolon();
        return this._finishNode({ type: 'BreakStatement', label: label }, s);
    };

// --- 
    proto._parseTryStatement = function() {
        const s = this._startNode();
        this._expect(TOKEN.TRY);
    
        const block = this._parseBlockStatement(); // The main 'try' block
        let handler = null;
        let finalizer = null;
    
        // Parse the 'catch' block, if it exists
        if (this._currTokenIs(TOKEN.CATCH)) {
            const catchStart = this._startNode();
            this._advance(); // consume 'catch'
            
            let param = null;
            // The parameter in catch is optional: catch {..} vs catch(e) {..}
            if (this._currTokenIs(TOKEN.LPAREN)) {
                this._expect(TOKEN.LPAREN);
                param = this._parseBindingPattern(); // Parse the error parameter (e.g., 'e')
                this._expect(TOKEN.RPAREN);
            }
            
            const catchBody = this._parseBlockStatement();
            handler = this._finishNode({ type: 'CatchClause', param, body: catchBody }, catchStart);
        }
    
        // Parse the 'finally' block, if it exists
        if (this._currTokenIs(TOKEN.FINALLY)) {
            this._advance(); // consume 'finally'
            finalizer = this._parseBlockStatement();
        }
    
        // A 'try' must have either a 'catch' or a 'finally'
        if (!handler && !finalizer) {
            this._error("try statement must have a catch or finally block.");
            return null;
        }
    
        return this._finishNode({ type: 'TryStatement', block, handler, finalizer }, s);
    };
    
    
    // B"H
// --- Add these two new methods to the bottom of parser-statements.js ---

proto._parseLabeledStatement = function() {
    const s = this._startNode();
    const label = this._parseIdentifier(); // Parse the label (e.g., 'mainLoop')
    this._expect(TOKEN.COLON);             // Consume the ':'
    
    // The body of a labeled statement is another statement.
    const body = this._parseDeclaration(); 
    
    return this._finishNode({ type: 'LabeledStatement', label, body }, s);
};

proto._parseDoWhileStatement = function() {
    const s = this._startNode();
    this._expect(TOKEN.DO);
    
    // Parse the statement block.
    const body = this._parseDeclaration();
    
    this._expect(TOKEN.WHILE);
    this._expect(TOKEN.LPAREN);
    const test = this._parseExpression(PRECEDENCE.LOWEST);
    this._expect(TOKEN.RPAREN);
    
    this._consumeSemicolon(); // Optional semicolon at the end.
    
    return this._finishNode({ type: 'DoWhileStatement', body, test }, s);
};

// 

// B"H

proto._parseContinueStatement = function() {
    const s = this._startNode();
    this._advance(); // Consume 'continue'

    let label = null;
    // Check if an identifier (the label) follows on the same line.
    if (!this.currToken.hasLineTerminatorBefore && this._currTokenIs(TOKEN.IDENT)) {
        label = this._parseIdentifier();
    }

    this._consumeSemicolon();
    return this._finishNode({ type: 'ContinueStatement', label: label }, s);
};

    
    
    
    // B"H

proto._parseWithStatement = function() {
    const s = this._startNode();
    this._expect(TOKEN.WITH);
    this._expect(TOKEN.LPAREN);
    
    const object = this._parseExpression(PRECEDENCE.LOWEST);
    
    this._expect(TOKEN.RPAREN);
    
    const body = this._parseDeclaration(); // The body can be a block or single statement
    
    if (!object || !body) return null;

    return this._finishNode({ type: 'WithStatement', object, body }, s);
};


/**
 * B"H
 * The Casting of the Stone.
 * Parses a `throw` statement. It strictly forbids a newline (line terminator)
 * between the `throw` keyword and the expression being thrown, per ASI rules.
 */
proto._parseThrowStatement = function() {
    const s = this._startNode();
    this._advance(); // Consume 'throw'

    // ASI Rule: No newline allowed after 'throw'
    if (this.currToken.hasLineTerminatorBefore) {
        this._error("Illegal newline after throw.");
        return null;
    }

    const argument = this._parseExpression(PRECEDENCE.LOWEST);
    this._consumeSemicolon();

    return this._finishNode({ type: 'ThrowStatement', argument }, s);
};



proto._parseEmptyStatement = function() {
    const s = this._startNode();
    this._consumeSemicolon();
    return this._finishNode({ type: 'EmptyStatement' }, s);
};


})(window.MerkavahParser.prototype);