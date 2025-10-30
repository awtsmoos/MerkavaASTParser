// B"H --- Parsing Declarations [DEFINITIVE & COMPLETE] ---
(function(proto) {
var times=0
var max=300
	proto.registerDeclarationParsers = function() { /* No registration needed */ };

	// B"H --- In parser-declarations.js ---

// REPLACE your _parseDeclaration function with this one.
proto._parseDeclaration = function() {
    // This function is now the single source of truth for deciding
    // what kind of statement or declaration to parse.
    if (this.panicMode) return null;

    switch (this.currToken.type) {
        // Declarations
        case TOKEN.EXPORT: return this._parseExportDeclaration();
        case TOKEN.IMPORT: return this._parseImportDeclaration();
        case TOKEN.FUNCTION: return this._parseFunction('declaration');
        case TOKEN.CLASS: return this._parseClassDeclaration();
        case TOKEN.LET:
        case TOKEN.CONST:
        case TOKEN.VAR:
            return this._parseVariableDeclaration();
        
        // Statements (Moved from the old _parseStatement function)
        case TOKEN.LBRACE: return this._parseBlockStatement();
        case TOKEN.IF: return this._parseIfStatement();
        case TOKEN.FOR: return this._parseForStatement();
        case TOKEN.WHILE: return this._parseWhileStatement();
        case TOKEN.RETURN: return this._parseReturnStatement();
        
        case TOKEN.SWITCH: return this._parseSwitchStatement();
        case TOKEN.BREAK: return this._parseBreakStatement();

        // Async Function Declaration check
        case TOKEN.ASYNC:
            if (this._peekTokenIs(TOKEN.FUNCTION)) {
                this._advance();
                return this._parseFunction('declaration', true);
            }
            // Fall through to default for async expressions
            
        // Default Case
        default:
            // If it's none of the above, it must be an expression statement.
            return this._parseExpressionStatement();
    }
};
    

	proto._parseBindingPattern = function() {
		if(times++>max) {
		throw "wow what are u"
		}
		
		if (this._currTokenIs(TOKEN.LBRACE)) return this._parseObjectPattern();
		if (this._currTokenIs(TOKEN.LBRACKET)) return this._parseArrayPattern();
		if (!this._currTokenIs(TOKEN.IDENT)) {
			this._error("Expected an identifier, object pattern, or array pattern for binding.");
			return null;
		}
		const s = this._startNode();
		const identNode = { type: 'Identifier', name: this.currToken.literal };
        this._advance();
		return this._finishNode(identNode, s);
	};

	/***********************************************************************
	*  --- CRITICAL FIX 1: IMPLEMENT THE MISSING _parseProperty FUNCTION ---
	*  This function is responsible for parsing a single property inside
	*  an object pattern, like `a`, `a: b`, or `a = 1` in `{ a, a: b, a = 1}`.
	***********************************************************************/
	proto._parseProperty = function() {
		const s = this._startNode();
		if (!this._currTokenIs(TOKEN.IDENT)) {
			this._error("Expected identifier in object pattern property.");
			return null;
		}
		const key = this._parseIdentifier();
		let value = key;
		let shorthand = true;
		
		if (this._currTokenIs(TOKEN.COLON)) {
			shorthand = false;
			this._advance(); // consume ':'
			value = this._parseBindingPattern(); // The value in a pattern is another pattern
		}
		
		return this._finishNode({ type: 'Property', key, value, kind: 'init', method: false, shorthand, computed: false }, s);
	};

	proto._parseObjectPattern = function() {
		const s = this._startNode();
		this._expect(TOKEN.LBRACE);
		const properties = [];
		while (!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) {
			const prop = this._parseProperty();
			if (!prop) return null;
			properties.push(prop);
			if (this._currTokenIs(TOKEN.COMMA)) this._advance();
			else break;
		}
		this._expect(TOKEN.RBRACE);
		return this._finishNode({ type: 'ObjectPattern', properties }, s);
	};

	proto._parseArrayPattern = function() {
		const s = this._startNode();
		this._expect(TOKEN.LBRACKET);
		const elements = [];
		while (!this._currTokenIs(TOKEN.RBRACKET) && !this._currTokenIs(TOKEN.EOF)) {
			if (this._currTokenIs(TOKEN.COMMA)) {
				elements.push(null);
			} else {
				const elem = this._parseBindingPattern();
				if (!elem) return null;
				elements.push(elem);
			}
			if (this._currTokenIs(TOKEN.COMMA)) this._advance();
			else break;
		}
		this._expect(TOKEN.RBRACKET);
		return this._finishNode({ type: 'ArrayPattern', elements }, s);
	};
	
	// In parser-declarations.js
// B"H
// In parser-declarations.js
proto._parseVariableDeclaration = function() {
    if(times++>max) {
		throw "wow what are u"
		}
    const s = this._startNode();
    const kind = this.currToken.literal;
    this._advance(); // Consume 'var', 'let', or 'const'

    const declarations = [];
    let guard = 0; // The circuit breaker.

    // This loop handles `var f=3, g=4, ...`
    do {
        if (guard++ > 5000) { // Check the circuit breaker.
            console.error("PARSER HALTED: Infinite loop detected in _parseVariableDeclaration. Stuck on token:", this.currToken);
            throw new Error("Infinite loop in _parseVariableDeclaration");
        }

        // If this isn't the first variable in the list, we must consume a comma.
        if (declarations.length > 0) {
            this._expect(TOKEN.COMMA);
        }

        const decl = this._parseVariableDeclarator(kind);
        if (decl) {
            declarations.push(decl);
        } else {
        console.trace("what happened")
        throw "broke "
            // If a declarator is malformed, stop trying to parse more.
            break;
        }
    // The loop ONLY continues if there is a comma after the declarator.
    } while (this._currTokenIs(TOKEN.COMMA));
    
    // Remember the token before we try to consume a semicolon.
    const tokenBeforeASI = this.currToken;


    this._consumeSemicolon();
    
    if (this.currToken === tokenBeforeASI && !this._currTokenIs(TOKEN.EOF) && !this._currTokenIs(TOKEN.RBRACE)) {
        // This error will fire instead of the browser freezing.
        throw new Error(
            `PARSER HALTED: Infinite loop detected. A statement was parsed, but the parser did not advance. ` +
            `This is typically caused by a missing semicolon before a token that cannot start a new statement. ` +
            `Stuck at: line ${this.currToken.line}, col ${this.currToken.column}, token "${this.currToken.literal}" (${this.currToken.type})`
        );
    }
    return this._finishNode({ type: 'VariableDeclaration', declarations, kind }, s);
};
// In parser-declarations.js
proto._parseVariableDeclarator = function(kind) {
   if(times++>max){
		throw "maxed"
		
		}
    const s = this._startNode();
    const id = this._parseBindingPattern(); // Parses the variable name/pattern.
    if (!id) return null; // Important for error handling.

    let init = null;
    if (this._currTokenIs(TOKEN.ASSIGN)) {
        this._advance(); // Consume '='
        init = this._parseExpression(PRECEDENCE.ASSIGNMENT);
        if (!init) {
            // If there's an '=' but no expression, it's a syntax error.
            this._error("Expected an expression after '=' in variable declaration.");
            return null;
        }
    } else if (kind === 'const') {
        // Enforces that 'const' declarations must have an initializer.
        this._error("'const' declarations must be initialized.");
        return null;
    }

    return this._finishNode({ type: 'VariableDeclarator', id, init }, s);
};
	proto._parseFunction = function(context, isAsync = false) {
		const s = this._startNode();
		if (this.currToken.type === TOKEN.FUNCTION) this._advance();
		let id = null;
		if (this._currTokenIs(TOKEN.IDENT)) {
			id = this._parseIdentifier();
		} else if (context === 'declaration') {
			this._error("Function declarations require a name");
            return null;
		}
		this._expect(TOKEN.LPAREN);
		const params = [];
		if (!this._currTokenIs(TOKEN.RPAREN)) {
			do {
				const param = this._parseBindingPattern();
				if (!param) return null;
				params.push(param);
                if (!this._currTokenIs(TOKEN.COMMA)) break;
                this._advance();
			} while (true);
		}
		this._expect(TOKEN.RPAREN);
		const body = this._parseBlockStatement();
		if (!body) return null;
		const type = context === 'declaration' ? 'FunctionDeclaration' : 'FunctionExpression';
		return this._finishNode({ type, id, params, body, async: isAsync, generator: false }, s);
	};

	proto._parseClassDeclaration = function() {
		const s = this._startNode();
		this._expect(TOKEN.CLASS);
		const id = this._parseIdentifier();
		if (!id) return null;
		let superClass = null;
		if (this._currTokenIs(TOKEN.EXTENDS)) {
			this._advance();
			superClass = this._parseIdentifier();
			if (!superClass) return null;
		}
		const body = this._parseClassBody();
		if (!body) return null;
		return this._finishNode({ type: 'ClassDeclaration', id, superClass, body }, s);
	};

	// REPLACE your old _parseClassBody with this one
proto._parseClassBody = function() {
    const s = this._startNode();
    this._expect(TOKEN.LBRACE);
    const body = [];
    while (!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) {
        // Use our new, more powerful function here
        const element = this._parseClassElement();
        if (element) {
            body.push(element);
        } else {
             this._error("Invalid syntax in class body");
             this._advance(); // Prevent infinite loop
        }
    }
    this._expect(TOKEN.RBRACE);
    return this._finishNode({ type: 'ClassBody', body }, s);
};
	
	
	
	// ADD THIS NEW FUNCTION where the old _parseMethodDefinition was
proto._parseClassElement = function() {
    const s = this._startNode();
    let isStatic = false;
    let kind = 'method'; // Default to method
    let isGenerator = false;

    if (this.currToken.type === TOKEN.IDENT && this.currToken.literal === 'static') {
        isStatic = true;
        this._advance();
    }

    const isGetter = this.currToken.type === TOKEN.IDENT && this.currToken.literal === 'get';
    const isSetter = this.currToken.type === TOKEN.IDENT && this.currToken.literal === 'set';

    if (isGetter || isSetter) {
        kind = isGetter ? 'get' : 'set';
        this._advance();
    }
    
    if (this._currTokenIs(TOKEN.ASTERISK)) {
        isGenerator = true;
        this._advance();
    }

    let key;
    if (this._currTokenIs(TOKEN.PRIVATE_IDENT)) {
         // We need to use the parser's private identifier helper
         // This requires adding it from the expressions parser. For now, we'll create it directly.
         const privateStart = this._startNode();
         const privateName = this.currToken.literal.slice(1);
         key = this._finishNode({ type: 'PrivateIdentifier', name: privateName }, privateStart);
         this._advance();
    } else {
        key = this._parseIdentifier();
    }
    if (!key) return null;

    // If it's NOT a method (i.e., not followed by a '('), it's a class field (PropertyDefinition)
    if (!this._currTokenIs(TOKEN.LPAREN)) {
        let value = null;
        if (this._currTokenIs(TOKEN.ASSIGN)) {
            this._advance();
            value = this._parseExpression(PRECEDENCE.ASSIGNMENT);
        }
        this._consumeSemicolon();
        return this._finishNode({ type: 'PropertyDefinition', key, value, static: isStatic, computed: false }, s);
    }

    // --- If we get here, it's a MethodDefinition ---
    if (key.name === 'constructor' && !isGetter && !isSetter) {
        kind = 'constructor';
    }

    // Parse the function part
    this._expect(TOKEN.LPAREN);
    const params = [];
    if (!this._currTokenIs(TOKEN.RPAREN)) {
        do {
            params.push(this._parseBindingPattern());
            if (!this._currTokenIs(TOKEN.COMMA)) break;
            this._advance();
        } while (true);
    }
    this._expect(TOKEN.RPAREN);
    const body = this._parseBlockStatement();
    if (!body) return null;

    const func = {
        type: 'FunctionExpression',
        id: null,
        params,
        body,
        async: false, 
        generator: isGenerator
    };

    return this._finishNode({ type: 'MethodDefinition', key, value: func, kind, static: isStatic, computed: false }, s);
};

	// B"H --- UPGRADED Method Definition Parsing ---
// B"H --- THIS IS THE DEFINITIVE, UNIFIED METHOD PARSER ---
// Replace the old _parseMethodDefinition with this one.
proto._parseMethodDefinition = function() {
    const s = this._startNode();
    let isStatic = false;
    let kind = 'method';

    // Check for static keyword first
    if (this.currToken.type === TOKEN.IDENT && this.currToken.literal === 'static') {
        isStatic = true;
        this._advance();
    }

    // Check for get/set keywords. This is a key part of the logic.
    const isGetter = this.currToken.type === TOKEN.IDENT && this.currToken.literal === 'get';
    const isSetter = this.currToken.type === TOKEN.IDENT && this.currToken.literal === 'set';

    if (isGetter || isSetter) {
        kind = isGetter ? 'get' : 'set';
        this._advance();
    }

    // Now, parse the method's name.
    const key = this._parseIdentifier();
    if (!key) return null;

    // The 'constructor' keyword is special and overrides the kind.
    if (key.name === 'constructor' && !isGetter && !isSetter) {
        kind = 'constructor';
    }

    // THIS IS THE CRITICAL FIX:
    // We are now parsing the function part directly, NOT calling the old _parseFunction.
    // This gives us the control we need.
    this._expect(TOKEN.LPAREN);
    const params = [];
		if (!this._currTokenIs(TOKEN.RPAREN)) {
			do {
				const param = this._parseBindingPattern();
				if (!param) return null;
				params.push(param);
                if (!this._currTokenIs(TOKEN.COMMA)) break;
                this._advance();
			} while (true);
		}
    this._expect(TOKEN.RPAREN);
    
    const body = this._parseBlockStatement();
    if (!body) return null;

    // We build the FunctionExpression node manually here.
    const value = {
        type: 'FunctionExpression',
        id: null,
        params: params,
        body: body,
        async: false,
        generator: false
    };

    // Add validation for getters and setters
    if (kind === 'set' && value.params.length !== 1) {
        this._error("Setter functions must have exactly one argument.");
        return null;
    }
    if (kind === 'get' && value.params.length !== 0) {
        this._error("Getter functions must have no arguments.");
        return null;
    }

    return this._finishNode({ 
        type: 'MethodDefinition', 
        key: key, 
        value: value, 
        kind: kind, 
        static: isStatic,
        computed: false
    }, s);
};

	// --- THIS IS THE NEW, CORRECT FUNCTION ---
	proto._parseImportDeclaration = function() {
	    const s = this._startNode();
	    this._expect(TOKEN.IMPORT);
	    const specifiers = [];
	    if (this._currTokenIs(TOKEN.STRING)) {
	        const source = this._parseLiteral();
	        this._consumeSemicolon();
	        return this._finishNode({ type: 'ImportDeclaration', specifiers, source }, s);
	    }
	    if (this._currTokenIs(TOKEN.IDENT)) {
	        const specStart = this._startNode();
	        const local = this._parseIdentifier();
	        specifiers.push(this._finishNode({ type: 'ImportDefaultSpecifier', local }, specStart));
	        if (this._currTokenIs(TOKEN.COMMA)) {
	            this._advance();
	        }
	    }
	    if (this._currTokenIs(TOKEN.LBRACE)) {
	        this._expect(TOKEN.LBRACE);
	        while (!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) {
	            const specStart = this._startNode();
	            const imported = this._parseIdentifier();
	            let local = imported;
	            if (this._currTokenIs(TOKEN.AS)) {
	                this._advance();
	                local = this._parseIdentifier();
	            }
	            specifiers.push(this._finishNode({ type: 'ImportSpecifier', imported, local }, specStart));
	            if (!this._currTokenIs(TOKEN.COMMA)) break;
                this._advance();
	        }
	        this._expect(TOKEN.RBRACE);
	    }
	    this._expect(TOKEN.FROM);
	    const source = this._parseLiteral();
	    this._consumeSemicolon();
	    return this._finishNode({ type: 'ImportDeclaration', specifiers, source }, s);
	};

	proto._parseExportDeclaration = function() {
    const s = this._startNode();
    this._expect(TOKEN.EXPORT);

    // This block handles `export default ...`
    if (this._currTokenIs(TOKEN.DEFAULT)) {
        this._advance(); // Consume 'default'

        let declaration;
        // This switch is the key. It decides what to parse next.
        switch (this.currToken.type) {
            case TOKEN.FUNCTION:
                declaration = this._parseFunction('expression');
                break;
            case TOKEN.CLASS:
                declaration = this._parseClassExpression();
                break;
            case TOKEN.ASYNC:
                 if (this._peekTokenIs(TOKEN.FUNCTION)) {
                    this._advance();
                    declaration = this._parseFunction('expression', true);
                 } else {
                    // This is the fallback for an async expression
                    declaration = this._parseExpression(PRECEDENCE.ASSIGNMENT);
                 }
                break;
            // CRITICAL FIX: This default case handles `export default 3`, `export default a + b`, etc.
            default:
                declaration = this._parseExpression(PRECEDENCE.ASSIGNMENT);
                break;
        }
        
        if (!declaration) {
            this._error("Expected an expression or declaration after 'export default'");
            return null;
        }

        // Expressions might be followed by a semicolon.
        this._consumeSemicolon();
        return this._finishNode({ type: 'ExportDefaultDeclaration', declaration }, s);
    }

    // This block handles named exports like `export const x = 5;`
    let declaration;
    switch (this.currToken.type) {
        case TOKEN.LET: case TOKEN.CONST: case TOKEN.VAR:
            declaration = this._parseVariableDeclaration();
            break;
        case TOKEN.FUNCTION:
            declaration = this._parseFunction('declaration');
            break;
        case TOKEN.CLASS:
            declaration = this._parseClassDeclaration();
            break;
        default:
            this._error("Unexpected token after export. Expected a named declaration.");
            return null;
    }
    
    return this._finishNode({ type: 'ExportNamedDeclaration', declaration, specifiers: [], source: null }, s);
};

})(MerkabahParser.prototype);