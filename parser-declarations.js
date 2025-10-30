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
        
        
        case TOKEN.TRY: return this._parseTryStatement();

        // Async Function Declaration check
        case TOKEN.ASYNC:
    if (this._peekTokenIs(TOKEN.FUNCTION)) {
        this._advance();
        return this._parseFunction('declaration', true);
    }
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
// B"H 

proto._parseProperty = function() {
    const s = this._startNode();
    if (!this._currTokenIs(TOKEN.IDENT)) {
        this._error("Expected identifier in object pattern property.");
        return null;
    }
    const key = this._parseIdentifier();
    let value = key;
    let shorthand = true;

    // Check for aliasing: { oldName: newName }
    if (this._currTokenIs(TOKEN.COLON)) {
        shorthand = false;
        this._advance(); // consume ':'
        value = this._parseBindingPattern(); // The value is another pattern
    }

    // --- THIS IS THE TIKKUN (THE FIX) ---
    // Now, we check for a default value for this property.
    if (this._currTokenIs(TOKEN.ASSIGN)) {
        // If there's a default value, it must be an AssignmentPattern.
        // The 'value' we've parsed so far becomes the 'left' side of the assignment.
        const assignStart = this._startNode();
        assignStart.loc.start = value.loc.start;
        this._advance(); // consume '='
        
        // Parse the expression for the default value (e.g., the async arrow function)
        const right = this._parseExpression(PRECEDENCE.ASSIGNMENT); 
        
        // Wrap the property's value in an AssignmentPattern node.
        value = this._finishNode({ type: 'AssignmentPattern', left: value, right: right }, assignStart);
        
        // A property with a default value can't be shorthand.
        shorthand = false; 
    }

    return this._finishNode({ 
        type: 'Property', 
        key: key, 
        value: value, // The value can now be an Identifier, a Pattern, or an AssignmentPattern
        kind: 'init', 
        method: false, 
        shorthand: shorthand, 
        computed: false 
    }, s);
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
// 

proto._parseVariableDeclaration = function(inForHead = false) { // Add inForHead parameter
    if(times++>max) {
		throw "wow what are u"
		}
    const s = this._startNode();
    const kind = this.currToken.literal;
    this._advance();

    const declarations = [];
    let guard = 0; 

    do {
        if (guard++ > 5000) { 
            console.error("PARSER HALTED: Infinite loop detected in _parseVariableDeclaration. Stuck on token:", this.currToken);
            throw new Error("Infinite loop in _parseVariableDeclaration");
        }
        if (declarations.length > 0) {
            this._expect(TOKEN.COMMA);
        }

        // --- Pass the context flag down to the declarator ---
        const decl = this._parseVariableDeclarator(kind, inForHead);
        if (decl) {
            declarations.push(decl);
        } else {
            console.trace("what happened")
            throw "broke "
            break;
        }
    } while (this._currTokenIs(TOKEN.COMMA));
    
    // --- THE TIKKUN ---
    // Only look for a closing semicolon if we are in a normal context.
    if (!inForHead) {
        this._consumeSemicolon();
    }
    
    return this._finishNode({ type: 'VariableDeclaration', declarations, kind }, s);
};

// B"H 

proto._parseVariableDeclarator = function(kind, inForHead = false) { // Add inForHead parameter
   
    const s = this._startNode();
    const id = this._parseBindingPattern(); 
    if (!id) return null;

    let init = null;
    if (this._currTokenIs(TOKEN.ASSIGN)) {
        this._advance();
        init = this._parseExpression(PRECEDENCE.ASSIGNMENT);
        if (!init) {
            this._error("Expected an expression after '=' in variable declaration.");
            return null;
        }
    // --- THIS IS THE TIKKUN ---
    // Only enforce the const initializer rule if we are NOT inside the head of a for loop.
    } else if (kind === 'const' && !inForHead) {
        this._error("'const' declarations must be initialized.");
        return null;
    }

    return this._finishNode({ type: 'VariableDeclarator', id, init }, s);
};
	// REPLACE your current _parseFunction with this final version.
proto._parseFunction = function(context, isAsync = false) {
    const s = this._startNode();
    if (this.currToken.type === TOKEN.FUNCTION) this._advance();

    // THIS IS THE UPGRADE: Check for the generator star *before* the name.
    const isGenerator = this._currTokenIs(TOKEN.ASTERISK);
    if (isGenerator) {
        this._advance(); // Consume '*'
    }

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
            const param = this._parseBindingWithDefault()
            
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
    
    // Pass the generator flag when creating the final node.
    return this._finishNode({ type, id, params, body, async: isAsync, generator: isGenerator }, s);
};




proto._parseClassDeclaration = function() {
    const s = this._startNode();
    this._expect(TOKEN.CLASS);

    // --- THE TIKKUN ---
    // A class declaration's Identifier is optional, specifically for `export default class ...`
    let id = null;
    if (this._currTokenIs(TOKEN.IDENT)) {
        id = this._parseIdentifier();
    }
    // We remove the strict requirement that an ID must exist.
    
    let superClass = null;
    if (this._currTokenIs(TOKEN.EXTENDS)) {
        this._advance();
        // The superclass is an EXPRESSION, so calling _parseExpression here is correct.
        // This is what allows it to parse the `(class ChaosMatrix...)` expression.
        superClass = this._parseExpression(PRECEDENCE.LOWEST);
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
	
	
	
	

// B"H 




proto._parseClassElement = function() {
    const s = this._startNode();

    // Step 1: Initialize all possible attributes of the class member.
    let isStatic = false;
    let isAsync = false;
    let isGenerator = false;
    let kind = 'method'; // Default kind
    let computed = false;

    // Step 2: Create a loop to consume all possible prefixes/modifiers.
    // This allows the parser to correctly handle `static async * myMethod...`
    while (true) {
        if (this.currToken.type === TOKEN.IDENT && this.currToken.literal === 'static') {
            isStatic = true;
            this._advance();
            continue;
        }
        // --- THIS FIXES THE `async apply()` PROBLEM ---
        // We see `async`, set the flag, and continue parsing the SAME element.
        if (this.currToken.type === TOKEN.ASYNC) {
            isAsync = true;
            this._advance();
            continue;
        }
        if (this._currTokenIs(TOKEN.ASTERISK)) {
            isGenerator = true;
            this._advance();
            continue;
        }
        // Check for get/set after other modifiers.
        const isGetter = this.currToken.type === TOKEN.IDENT && this.currToken.literal === 'get';
        const isSetter = this.currToken.type === TOKEN.IDENT && this.currToken.literal === 'set';
        if (isGetter || isSetter) {
            kind = isGetter ? 'get' : 'set';
            this._advance();
            continue;
        }
        // If no more modifiers are found, break the loop.
        break;
    }

    // Step 3: Parse the key (the name) of the class member.
    let key;
    // --- THIS FIXES THE `[Symbol.iterator]` PROBLEM ---
    // We now correctly check for a computed property name.
    if (this._currTokenIs(TOKEN.LBRACKET)) {
        computed = true;
        this._advance(); // Consume '['
        key = this._parseExpression(PRECEDENCE.LOWEST); // Parse the expression inside
        this._expect(TOKEN.RBRACKET); // Consume ']'
    } else if (this._currTokenIs(TOKEN.PRIVATE_IDENT)) {
        key = this._parsePrivateIdentifier();
    } else {
        // For any other case, it must be a standard identifier (or keyword acting as one).
        key = this._parseIdentifier();
    }
    if (!key) return null;

    // Step 4: Distinguish between a class field and a method.
    // If the key is NOT followed by '(', it's a field (PropertyDefinition).
    if (!this._currTokenIs(TOKEN.LPAREN)) {
        let value = null;
        if (this._currTokenIs(TOKEN.ASSIGN)) {
            this._advance();
            value = this._parseExpression(PRECEDENCE.ASSIGNMENT);
        }
        this._consumeSemicolon();
        return this._finishNode({ 
            type: 'PropertyDefinition', 
            key, 
            value, 
            static: isStatic, 
            computed 
        }, s);
    }

    // --- If we get here, it is a MethodDefinition ---
    if (key.name === 'constructor' && kind !== 'get' && kind !== 'set') {
        kind = 'constructor';
    }

    // Step 5: Parse the function part of the method.
    const params = this._parseParametersList(); // This helper correctly parses all parameters.
    const body = this._parseBlockStatement();
    if (!body) return null;

    const func = {
        type: 'FunctionExpression',
        id: null,
        params,
        body,
        async: isAsync,     // Apply the collected async flag here.
        generator: isGenerator // Apply the collected generator flag here.
    };

    return this._finishNode({ 
        type: 'MethodDefinition', 
        key, 
        value: func, 
        kind, 
        static: isStatic, 
        computed              // Apply the collected computed flag here.
    }, s);
};



	// B"H --- UPGRADED Method Definition Parsing ---







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
                // When we see `export default class`, it is a Class DECLARATION.
                // We must call the declaration parser, not the expression parser.
                declaration = this._parseClassDeclaration();
                break;
                
                
            case TOKEN.ASYNC:
                 // Check if it's `export default async function...`
                 if (this._peekTokenIs(TOKEN.FUNCTION)) {
                    this._advance(); // consume 'async'
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



// ADD THIS NEW HELPER FUNCTION to parser-declarations.js
proto._parseBindingWithDefault = function() {
    const s = this._startNode();
    const left = this._parseBindingPattern(); // First, parse the parameter name/pattern
    if (!left) return null;

    // NOW, check if it's followed by a default value
    if (this._currTokenIs(TOKEN.ASSIGN)) {
        this._advance(); // consume '='
        const right = this._parseExpression(PRECEDENCE.ASSIGNMENT); // Parse the expression for the default value
        // Wrap the whole thing in an AssignmentPattern node
        return this._finishNode({ type: 'AssignmentPattern', left, right }, s);
    }

    return left; // If there was no '=', just return the simple parameter node
};



// ADD THIS NEW HELPER FUNCTION to parser-declarations.js
// Its only job is to parse a list of parameters.
proto._parseParametersList = function() {
    const params = [];
    this._expect(TOKEN.LPAREN);
    if (!this._currTokenIs(TOKEN.RPAREN)) {
        do {
            // Use our most powerful pattern-parsing function
            params.push(this._parseBindingWithDefault());
        } while (this._currTokenIs(TOKEN.COMMA) && (this._advance(), true));
    }
    this._expect(TOKEN.RPAREN);
    return params;
};








// B"H


// It contains the pure logic for parsing a comma-separated list of binding patterns.


proto._parseParameterListContents = function() {
    const params = [];
    if (this._currTokenIs(TOKEN.RPAREN)) return params; // Handle empty list ()

    do {
        // This function correctly parses destructuring with default values.
        const param = this._parseBindingWithDefault();
        if (!param) return null; // Propagate any errors.
        params.push(param);

        if (!this._currTokenIs(TOKEN.COMMA)) break; // Exit if there are no more parameters.
        this._advance(); // Consume the comma to prepare for the next parameter.
    } while (true);

    return params;
};


})(MerkabahParser.prototype);