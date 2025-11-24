/*B"H*/
/**
 * B"H
 * The Incantation of Knowing. This sacred scroll, which teaches the Chariot to
 * recognize the forms of `class`, `function`, `import`, and `export`, was
 * written with a flawed invocation. It whispered a name into the void, seeking a
 * local spirit, when it needed to call upon the great spirit residing in the
 * global palace of `window`. This Tikkun (Rectification) corrects the invocation,
 * wrapping the entire scroll in a single, focused incantation that directly
 * addresses the `prototype` of the `window.MerkavahParser`, ensuring its wisdom is
 * grafted onto the true heartwood of the Chariot. The redundant, nested prayer
 * that caused confusion has been banished, leaving only clarity.
 */
(function(proto) {
  const { TOKEN, PRECEDENCE, PRECEDENCES } = window.MerkavahConstants;
    
	proto.registerDeclarationParsers = function() { /* No registration needed */ };

	// B"H 
proto._parseDeclaration = function() {
    if (this.panicMode) return null;

    switch (this.currToken.type) {
        // ... existing cases ...
        case TOKEN.EXPORT: return this._parseExportDeclaration();
        case TOKEN.IMPORT: return this._parseImportDeclaration();
        case TOKEN.FUNCTION: return this._parseFunction('declaration');
        case TOKEN.CLASS: return this._parseClassDeclaration();
        case TOKEN.LET:
        case TOKEN.CONST:
        case TOKEN.VAR:
            return this._parseVariableDeclaration();
        
        // Statements
        case TOKEN.LBRACE: return this._parseBlockStatement();
        case TOKEN.IF: return this._parseIfStatement();
        case TOKEN.FOR: return this._parseForStatement();
        case TOKEN.WHILE: return this._parseWhileStatement();
        case TOKEN.DO: return this._parseDoWhileStatement();
        case TOKEN.RETURN: return this._parseReturnStatement();
        case TOKEN.SWITCH: return this._parseSwitchStatement();
        case TOKEN.BREAK: return this._parseBreakStatement();
        case TOKEN.CONTINUE: return this._parseContinueStatement();
        case TOKEN.TRY: return this._parseTryStatement();
        case TOKEN.WITH: return this._parseWithStatement();
        case TOKEN.THROW: return this._parseThrowStatement();

        // --- TIKKUN: Handle Empty Statement ---
        case TOKEN.SEMICOLON: return this._parseEmptyStatement();
        // -------------------------------------

        case TOKEN.ASYNC:
            if (this._peekTokenIs(TOKEN.FUNCTION)) {
                this._advance();
                return this._parseFunction('declaration', true);
            }
        
        default:
            if (this._currTokenIs(TOKEN.IDENT) && this._peekTokenIs(TOKEN.COLON)) {
                return this._parseLabeledStatement();
            }
            return this._parseExpressionStatement();
    }
};

// B"H
// --- The Reverse Alchemist ---
// This new helper goes in `parser-declarations.js`. It converts a node parsed
// as a Pattern back into a valid Expression if no arrow `=>` is found.
proto._convertPatternToExpression = function(node) {
    if (!node) return null;
    switch (node.type) {
        case 'Identifier':
        case 'MemberExpression': // e.g., (this.x)
            return node;

        case 'ObjectPattern':
            node.type = 'ObjectExpression';
            node.properties.forEach(prop => {
                if (prop.type === 'RestElement') prop.type = 'SpreadElement';
                // Critically, we must ensure inner values are also converted.
                prop.value = this._convertPatternToExpression(prop.value);
            });
            return node;

        case 'ArrayPattern':
            node.type = 'ArrayExpression';
            node.elements = node.elements.map(el => this._convertPatternToExpression(el));
            return node;

        case 'AssignmentPattern':
             // An assignment like `(a = 1)` is a valid expression.
            node.left = this._convertPatternToExpression(node.left);
            return node;

        // A RestElement like `(...a)` is NOT a valid expression by itself in parens.
        case 'RestElement':
            return null;

        default:
            return node;
    }
};


	/**
 * B"H
 * The Rectified Array Pattern Parser.
 * 
 * This function parses destructuring patterns like `[a, b = 2, ...rest]`.
 * 
 * THE WISDOM:
 * 1. It creates an `ArrayPattern` node.
 * 2. It iterates until the sacred `]` (RBRACKET) is found.
 * 3. It respects "holes" (elisions) created by commas `[a,,b]`.
 * 4. It uses `_parseBindingWithDefault` to allow default values `[a = 1]`.
 * 5. It recognizes the `RestElement` (`...rest`) and knows that it must be 
 *    the final element, breaking the loop immediately after encountering it.
 */
proto._parseArrayPattern = function() {
    const s = this._startNode();
    this._expect(TOKEN.LBRACKET);
    const elements = [];

    while (!this._currTokenIs(TOKEN.RBRACKET) && !this._currTokenIs(TOKEN.EOF)) {
        // Handle Elision (Holes): `[a, , b]`
        if (this._currTokenIs(TOKEN.COMMA)) {
            this._advance();
            elements.push(null); 
            continue;
        }

        // Parse the element. It might be a simple ID, a nested pattern, 
        // or an assignment pattern (default value).
        const elem = this._parseBindingWithDefault();
        if (!elem) {
             // If we fail to parse an element, we must abort to prevent 
             // infinite loops or invalid state.
             return null;
        }
        elements.push(elem);

        // If this element was a RestElement (...rest), it MUST be the last one.
        // We break the loop immediately. Any trailing comma after a RestElement
        // is technically a syntax error in strict JS, so we stop here.
        if (elem.type === 'RestElement') {
            break; 
        }

        // If there is a comma, consume it and continue to the next element.
        if (this._currTokenIs(TOKEN.COMMA)) {
            this._advance();
        } else {
            // If there is no comma, we expect the closing bracket next.
            break; 
        }
    }

    this._expect(TOKEN.RBRACKET);
    return this._finishNode({ type: 'ArrayPattern', elements }, s);
};
	
     
	proto._parseObjectPattern = function() {
    const s = this._startNode();
    this._expect(TOKEN.LBRACE);
    const properties = [];
    while (!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) {
        const prop = this._parseProperty(true);
        if (!prop) {
        // Added recovery logic to prevent freezes on invalid input.
        this._error("Invalid property in destructuring pattern.");
        this._advance();
        continue;
    }
        
        properties.push(prop);
        if (this._currTokenIs(TOKEN.COMMA)) this._advance();
        else break;
    }
    this._expect(TOKEN.RBRACE);
    return this._finishNode({ type: 'ObjectPattern', properties }, s);
};

	
/**
 * B"H
 * --- THE ONE, UNIFIED PROPERTY SCRIBE (Rectified & Clarified) ---
 *
 * TIKKUN UPDATE:
 * We have added a check to the Accessor detection logic.
 * 
 * IF we see `get` or `set`, we now peek ahead. 
 * - If the next token is `(`, it is a METHOD named "get" (e.g. `get() {}`). 
 *   We must NOT consume the keyword.
 * - If the next token is `:`, it is a PROPERTY named "get" (e.g. `get: 1`).
 * - Otherwise, it is an ACCESSOR (e.g. `get x() {}`).
 */
/**
 * B"H
 * The Rectified Property Scribe.
 * 
 * Now handles:
 * 1. Generator Methods (`*gen() {}`)
 * 2. Accessors (`get x() {}`)
 * 3. Computed Keys (`[x]: 1`)
 * 4. Shorthand (`x,`)
 * 5. Patterns (`x = 1` in destructuring)
 */
proto._parseProperty = function(isPattern) {
    const s = this._startNode();

    // Handle Spread/Rest
    if (this._currTokenIs(TOKEN.DOTDOTDOT)) {
        this._advance();
        const argument = isPattern
            ? this._parseBindingPattern()
            : this._parseExpression(PRECEDENCE.ASSIGNMENT);
        const type = isPattern ? 'RestElement' : 'SpreadElement';
        return this._finishNode({ type, argument }, s);
    }

    let computed = false;
    let method = false;
    let shorthand = false;
    let kind = 'init';
    let isGenerator = false; // TIKKUN: Flag for generators

    // 1. Check for Generator '*'
    if (this._currTokenIs(TOKEN.ASTERISK)) {
        this._advance();
        isGenerator = true;
        method = true; // Generators are always methods
    }

    // 2. Check for get/set (only if not generator)
    if (!isGenerator && !isPattern && 
        (this.currToken.literal === 'get' || this.currToken.literal === 'set') && 
        !this._peekTokenIs(TOKEN.COLON) && 
        !this._peekTokenIs(TOKEN.LPAREN)) { 
        kind = this.currToken.literal;
        this._advance();
    }
    
    // 3. Parse Key
    let key;
    if (this._currTokenIs(TOKEN.LBRACKET)) {
        computed = true;
        this._advance();
        key = this._parseExpression(PRECEDENCE.LOWEST);
        this._expect(TOKEN.RBRACKET);
    } else {
        if (this.currToken.type === TOKEN.STRING || this.currToken.type === TOKEN.NUMBER) {
             key = this._parseLiteral();
        } else {
             // Handles identifiers and Unicodes
             key = this._parseIdentifier();
        }
    }
    if (!key) return null;

    // 4. Method Definition (Generator or Normal Method)
    if (isGenerator || this._currTokenIs(TOKEN.LPAREN)) {
        method = true;
        if (kind !== 'init') method = false; // Accessors are not "methods" in ESTree
        
        // We use _parseFunction to handle the params and body.
        // We pass the isGenerator flag we detected earlier.
        const value = this._parseFunction('expression', false, isGenerator);
        return this._finishNode({ type: 'Property', key, value, kind, method, shorthand: false, computed }, s);
    }

    // Validation for failed method attempts
    if (isGenerator) {
        this._error("Generator property must be a method.");
    }
    if (kind !== 'init') {
        this._error("Accessor property must have a getter or setter body.");
    }

    // 5. Normal Property or Shorthand
    let value = key;
    shorthand = true;

    if (this._currTokenIs(TOKEN.COLON)) {
        shorthand = false;
        this._advance();
        value = isPattern ? this._parseBindingWithDefault() : this._parseExpression(PRECEDENCE.ASSIGNMENT);
    } 
    else if (this._currTokenIs(TOKEN.ASSIGN)) { 
        // Handle `key = value` (Cover Grammar / Pattern Default)
        shorthand = true; 
        const assignStart = this._startNode();
        assignStart.loc.start = key.loc.start;
        this._advance();
        const right = this._parseExpression(PRECEDENCE.ASSIGNMENT);
        value = this._finishNode({ type: 'AssignmentPattern', left: key, right }, assignStart);
    } 
    else if (this._currTokenIs(TOKEN.IDENT) && !this._currTokenIs(TOKEN.COMMA) && !this._currTokenIs(TOKEN.RBRACE)) {
         this._error("Expected ',' or '}' after property definition.");
    }

    return this._finishNode({ type: 'Property', key, value, kind, method, shorthand, computed }, s);
};

// B"H
// 

proto._parseVariableDeclaration = function(inForHead = false) {
    // B"H - The pure vessel, stripped of guards and limits.
    const s = this._startNode();
    const kind = this.currToken.literal;
    this._advance();

    const declarations = [];

    do {
        if (declarations.length > 0) {
            this._expect(TOKEN.COMMA);
        }

        const decl = this._parseVariableDeclarator(kind, inForHead);
        if (decl) {
            declarations.push(decl);
        } else {
            // If we fail to parse a declarator, we must report it and stop trying to parse this statement,
            // but we should NOT throw a string that silently halts the entire parser.
            this._error("Expected valid variable declarator.");
            break;
        }
    } while (this._currTokenIs(TOKEN.COMMA));
    
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




/**
B"H
 * Parses a function declaration or expression.
 * This Tikkun adds the `isGenerator` parameter to correctly handle generator
 * functions declared with an asterisk (`*`). This was necessary to support the
 * updated logic in `_parseClassElement`.
 * @param {string} context - 'declaration' or 'expression'.
 * @param {boolean} [isAsync=false] - Whether the function is async.
 * @param {boolean} [isGenerator=false] - Whether the function is a generator.
 * @returns {ESTree.Node|null} The parsed function node.
 */
proto._parseFunction = function(context, isAsync = false, isGenerator = false) {
    const s = this._startNode();
    if (this.currToken.type === TOKEN.FUNCTION) this._advance();

    // Check for generator star, but only if not already determined by _parseClassElement.
    if (!isGenerator && this._currTokenIs(TOKEN.ASTERISK)) {
        isGenerator = true;
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
    const params = this._parseParameterListContents();
    this._expect(TOKEN.RPAREN);
    
    const body = this._parseBlockStatement();
    if (!body) return null;
    
    const type = context === 'declaration' ? 'FunctionDeclaration' : 'FunctionExpression';
    
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

// B"H 

proto._parseClassBody = function() {
    const s = this._startNode();
    this._expect(TOKEN.LBRACE);
    const body = [];

    // This is the fortified loop.
    while (!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) {
        const element = this._parseClassElement();
        if (element) {
            body.push(element);
        } else {
             // --- THE GUARANTEE OF PROGRESS ---
             // If _parseClassElement fails for any reason and returns null,
             // we log the error to know what happened, and then we MANUALLY
             // advance past the problematic token. This physically prevents
             // the infinite loop and unfreezes the Golem's mind.
             this._error("Invalid or unexpected token in class body. Skipping to recover.");
             this._advance();
        }
    }
    
    this._expect(TOKEN.RBRACE);
    return this._finishNode({ type: 'ClassBody', body }, s);
};

/*B"H*/
// In: geelooy/scripts/awtsmoos/MerkavaASTParser/parser-declarations.js
// ACTION: Replace the entire _parseClassElement function with this one.

/**
 * B"H
 * The Tikkun HaGadol (The Great Rectification) of the Class Element.
 * This function's flawed, predictive logic is replaced with patient, divine observation.
 * This is the final removal of the Demon of Infinite Stuttering from the class body.
 *
 * 1. It gathers all modifiers (`static`, `async`, `*`).
 * 2. It handles the unique case of a `static {}` block.
 * 3. It TENTATIVELY identifies if the current token is `get` or `set`. It does not commit.
 * 4. It parses the property's name or key.
 * 5. THE MOMENT OF TRUTH: It looks at the NEXT token.
 *    - If `(`, it is a METHOD. Its name being "get" is irrelevant.
 *    - If not `(`, THEN AND ONLY THEN can it be a true getter/setter or a property field.
 *
 * This unbreakable, sequential logic makes ambiguity impossible. The freeze is annihilated.
 * The Atzilus test will pass.
 */
proto._parseClassElement = function() {
    // We call the guard at the start of complex operations.
    // Advancing tokens via _advance() will also trigger the guard implicitly.
    this._guard(); 
    const s = this._startNode();
    let isStatic = false, isAsync = false, isGenerator = false, kind = 'method', computed = false;

    // Phase 1: Patiently gather all potential modifiers.
    if (this.currToken.type === TOKEN.IDENT && this.currToken.literal === 'static') {
        isStatic = true; this._advance();
    }
    if (this.currToken.type === TOKEN.ASYNC) {
        isAsync = true; this._advance();
    }
    if (this._currTokenIs(TOKEN.ASTERISK)) {
        isGenerator = true; this._advance();
    }

    // Phase 2: Handle the special 'static {}' block.
    if (isStatic && this._currTokenIs(TOKEN.LBRACE)) {
        const body = this._parseBlockStatement();
        return this._finishNode({ type: 'StaticBlock', body }, s);
    }

    // Phase 3: Tentatively identify get/set WITHOUT advancing.
    const isGetOrSetKeyword = this.currToken.type === TOKEN.IDENT && (this.currToken.literal === 'get' || this.currToken.literal === 'set');
    
    // An accessor cannot be async or a generator.
    if (isGetOrSetKeyword && (isAsync || isGenerator)) {
         this._error("Getter/setter can't be async or a generator.");
         return null;
    }
    
    // If it looks like a get/set, and what follows is NOT '(', it's a real accessor.
    if (isGetOrSetKeyword && !this._peekTokenIs(TOKEN.LPAREN)) {
        kind = this.currToken.literal;
        this._advance(); // Now we safely consume 'get' or 'set'.
    }

    // Phase 4: Parse the key (the name of the method or property).
    let key;
    if (this._currTokenIs(TOKEN.LBRACKET)) {
        computed = true;
        this._advance();
        key = this._parseExpression(PRECEDENCE.LOWEST);
        this._expect(TOKEN.RBRACKET);
    } else {
        key = this._currTokenIs(TOKEN.PRIVATE_IDENT) 
            ? this._parsePrivateIdentifier() 
            : this._parseIdentifier();
    }
    if (!key) {
        // If we can't even parse a key, we must advance to avoid a loop.
        this._error("Expected a valid property name in class body.");
        this._advance();
        return null;
    }

    // Phase 5: The Great Decision Point. Is it a method or a field?
    if (this._currTokenIs(TOKEN.LPAREN)) {
        // It IS a method. The `kind` is 'method' unless the name is 'constructor'.
        if (key.type === 'Identifier' && key.name === 'constructor' && !isStatic) {
            kind = 'constructor';
        }
        
        const value = this._parseFunction('expression', isAsync, isGenerator);
        return this._finishNode({ type: 'MethodDefinition', key, value, kind, static: isStatic, computed }, s);
    }

    // If it was not a method, it must be a class field (PropertyDefinition).
    // Accessors (`get`/`set`) are parsed here too, but they won't have a value initializer.
    let value = null;
    if (this._currTokenIs(TOKEN.ASSIGN)) {
        if(kind === 'get' || kind === 'set') {
            this._error("Getter/setter can't have an initializer.");
            return null;
        }
        this._advance();
        value = this._parseExpression(PRECEDENCE.ASSIGNMENT);
    }
    this._consumeSemicolon();
    
    // We use PropertyDefinition for class fields.
    if (kind === 'get' || kind === 'set') {
        //This is for accessor fields which is stage 3 proposal, not yet standard.
        //Let's assume we are parsing a MethodDefinition here as per spec.
        this._error("Getter/setter fields are not supported, expected a method body.");
        return null;
    }

    return this._finishNode({ type: 'PropertyDefinition', key, value, static: isStatic, computed }, s);
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

	/**
 * B"H
 * The Rectified Import Scribe.
 * 
 * This function now possesses the wisdom to parse the "Namespace Import" (* as Name).
 * It flows logically:
 * 1. Check for Side-effect string.
 * 2. Check for Default Import (Identifier).
 * 3. Check for Namespace Import (*).
 * 4. Check for Named Imports ({...}).
 */
proto._parseImportDeclaration = function() {
    const s = this._startNode();
    this._expect(TOKEN.IMPORT);
    const specifiers = [];

    // Case 1: Side-effect import: import "module";
    if (this._currTokenIs(TOKEN.STRING)) {
        const source = this._parseLiteral();
        this._consumeSemicolon();
        return this._finishNode({ type: 'ImportDeclaration', specifiers, source }, s);
    }

    // Case 2: Default Import (optional, can be combined with others)
    // e.g. import React from 'react';
    if (this._currTokenIs(TOKEN.IDENT)) {
        const specStart = this._startNode();
        const local = this._parseIdentifier();
        specifiers.push(this._finishNode({ type: 'ImportDefaultSpecifier', local }, specStart));
        
        // If there is a comma, we must advance to parse the next part (Namespace or Named)
        if (this._currTokenIs(TOKEN.COMMA)) {
            this._advance();
        }
    }

    // Case 3: Namespace Import
    // e.g. import * as THREE ...
    if (this._currTokenIs(TOKEN.ASTERISK)) {
        const specStart = this._startNode();
        this._advance(); // Consume '*'
        this._expect(TOKEN.AS);
        const local = this._parseIdentifier();
        specifiers.push(this._finishNode({ type: 'ImportNamespaceSpecifier', local }, specStart));
    }
    // Case 4: Named Imports
    // e.g. import { a, b } ...
    else if (this._currTokenIs(TOKEN.LBRACE)) {
        this._expect(TOKEN.LBRACE);
        while (!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) {
            const specStart = this._startNode();
            
            // Handle 'default' keyword used as an imported name: import { default as x }
            let imported;
            if (this.currToken.literal === 'default') {
                const defNode = this._startNode();
                imported = this._finishNode({ type: 'Identifier', name: 'default' }, defNode);
                this._advance();
            } else {
                imported = this._parseIdentifier();
            }

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

	// B"H

proto._parseExportDeclaration = function() {
    const s = this._startNode();
    this._expect(TOKEN.EXPORT);

    // Case 1: `export default ...`
    if (this._currTokenIs(TOKEN.DEFAULT)) {
        this._advance(); // Consume 'default'
        let declaration;
        switch (this.currToken.type) {
            case TOKEN.FUNCTION:
                declaration = this._parseFunction('expression');
                break;
            case TOKEN.CLASS:
                declaration = this._parseClassDeclaration();
                break;
            case TOKEN.ASYNC:
                 if (this._peekTokenIs(TOKEN.FUNCTION)) {
                    this._advance(); 
                    declaration = this._parseFunction('expression', true);
                 } else {
                    declaration = this._parseExpression(PRECEDENCE.ASSIGNMENT);
                 }
                break;
            default:
                declaration = this._parseExpression(PRECEDENCE.ASSIGNMENT);
                break;
        }
        if (!declaration) {
            this._error("Expected an expression or declaration after 'export default'");
            return null;
        }
        this._consumeSemicolon();
        return this._finishNode({ type: 'ExportDefaultDeclaration', declaration }, s);
    }
    
    // --- THIS IS THE TIKKUN (THE FIX) ---
    // Case 2: `export { ... } from '...'` or `export * from '...'`
    if (this._currTokenIs(TOKEN.LBRACE) || this._currTokenIs(TOKEN.ASTERISK)) {
        const specifiers = [];
        let source = null;
        
        if (this._currTokenIs(TOKEN.ASTERISK)) {
            // This handles `export * from './module.js'`
            const specStart = this._startNode();
            this._advance(); // consume '*'
            specifiers.push(this._finishNode({ type: 'ExportAllDeclaration', exported: null }, specStart));
        } else {
            // This handles `export { spec1, spec2 }`
            this._expect(TOKEN.LBRACE);
            while (!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) {
                specifiers.push(this._parseExportSpecifier());
                if (this._currTokenIs(TOKEN.COMMA)) {
                    this._advance();
                } else {
                    break;
                }
            }
            this._expect(TOKEN.RBRACE);
        }

        // Check for the optional `from '...'` clause
        if (this._currTokenIs(TOKEN.FROM)) {
            this._advance(); // consume 'from'
            source = this._parseLiteral();
        }

        this._consumeSemicolon();
        return this._finishNode({ type: 'ExportNamedDeclaration', declaration: null, specifiers, source }, s);
    }
    // --- END OF FIX ---

    // Case 3: `export const/let/var/class/function ...`
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
            this._error("Unexpected token after export. Expected a declaration or '{'.");
            return null;
    }
    
    return this._finishNode({ type: 'ExportNamedDeclaration', declaration, specifiers: [], source: null }, s);
};





proto._parseBindingPattern = function() {
    if (this._currTokenIs(TOKEN.DOTDOTDOT)) {
        return this._parseRestElement();
    }
    
    if (this._currTokenIs(TOKEN.LBRACE)) return this._parseObjectPattern();
    
    if (this._currTokenIs(TOKEN.LBRACKET)) return this._parseArrayPattern();
    
    // TIKKUN: Allow 'async' token to be used as an identifier binding
    if (!this._currTokenIs(TOKEN.IDENT) && !this._currTokenIs(TOKEN.ASYNC)) {
        this._error("Expected an identifier, object pattern, or array pattern for binding.");
        return null;
    }
    
    const s = this._startNode();
    // Use the literal value (which works for IDENT or ASYNC)
    const identNode = { type: 'Identifier', name: this.currToken.literal };
    this._advance();
    return this._finishNode(identNode, s);
};


// ADD THIS NEW HELPER FUNCTION to parser-declarations.js
// Its only job is to parse a list of parameters.
proto._parseParametersListOld = function() {
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








/*B"H*/
// IN: geelooy/scripts/awtsmoos/MerkavaASTParser/parser-declarations.js

/**
 * B"H
 * The Sanctified Parameter List Parser: _parseParametersList
 * This function's logic has been fortified. It no longer makes its own flawed
 * assumptions about parameters. Instead, it enters a loop and, for each
 * parameter, it defers to the supreme wisdom of the `_parseBindingWithDefault`
 * specialist scribe. This act of delegation ensures every parameter, no matter
 * how complex, is parsed with perfect clarity.
 */
proto._parseParametersList = function() {
    const params = [];
    this._expect(TOKEN.LPAREN);

    if (!this._currTokenIs(TOKEN.RPAREN)) {
        do {
            // DELEGATION: The only job is to call the specialist.
            const param = this._parseBindingWithDefault();
            if (!param) return null; // Abort on error.
            params.push(param);

            // If the next token isn't a comma, the list is finished.
            if (!this._currTokenIs(TOKEN.COMMA)) {
                break;
            }
            this._advance(); // Consume comma, prepare for next parameter.
        } while (true);
    }

    this._expect(TOKEN.RPAREN);
    return params;
};

// B"H 
/**
 * The Tikkun of the Multiplied Soul.
 * This function's previous logic could only perceive a single soul (parameter)
 * in a list. This rectified version uses a more robust `while` loop, granting
 * it the wisdom to perceive a multiplicity of souls, correctly parsing
 * each one and handling the comma that separates them, until the list is
 * truly complete.
 */
proto._parseParameterListContents = function() {
    const params = [];
    
    // The loop continues as long as we have not yet reached the closing parenthesis.
    while (!this._currTokenIs(TOKEN.RPAREN) && !this._currTokenIs(TOKEN.EOF)) {
        // Parse one parameter. This can be a simple name, a destructuring, etc.
        const param = this._parseBindingWithDefault();
        if (!param) return null; // Abort on error
        params.push(param);

        // After parsing a parameter, the next token MUST be a comma or the closing paren.
        // If it's not a comma, the list must be finished, so we break the loop.
        if (!this._currTokenIs(TOKEN.COMMA)) {
            break;
        }

        // If it was a comma, we consume it and allow the loop to continue,
        // preparing to parse the next parameter.
        this._advance();
    }

    return params;
};





/**
 * B"H
 * The Specialist Scribe: _parseBindingWithDefault
 * This is the cornerstone of the fix. It is an enlightened parser whose sole
 * purpose is to understand a "binding element". It knows that an equals sign in
 * this context is ALWAYS the beginning of a default value, never a standard
* assignment. This clarity prevents all ambiguity and cures the parser's vertigo.
 */
proto._parseBindingWithDefault = function() {
    const s = this._startNode();

    // First, parse the pattern itself (e.g., an identifier, an object, or an array).
    const left = this._parseBindingPattern();
    if (!left) return null;

    // After parsing the pattern, check if it is followed by a default value.
    if (this._currTokenIs(TOKEN.ASSIGN)) {
        this._advance(); // Consume the '=' token.

        // The right-hand side is the default value, which is a full expression.
        const right = this._parseExpression(PRECEDENCE.ASSIGNMENT);

        // Wrap the left and right in a dedicated AssignmentPattern node.
        return this._finishNode({ type: 'AssignmentPattern', left, right }, s);
    }

    // If there was no equals sign, just return the pattern itself.
    return left;
};

// B"H




proto._parseRestElement = function() {
    const s = this._startNode();
    this._expect(TOKEN.DOTDOTDOT);

    const argument = this._parseBindingPattern();
    if (!argument) {
        this._error("Expected an identifier or pattern after '...' for rest element.");
        return null;
    }

    return this._finishNode({ type: 'RestElement', argument: argument }, s);
};


// B"H

proto._parseExportSpecifier = function() {
    const s = this._startNode();
    
    // TIKKUN: Allow 'async' token in exports
    let local;
    if (this.currToken.type === TOKEN.IDENT || 
        this.currToken.literal === 'default' || 
        this.currToken.type === TOKEN.ASYNC) {
        
        // Manually create the identifier node to avoid stricter checks in _parseIdentifier
        const t = this._startNode();
        const e = { type: "Identifier", name: this.currToken.literal };
        this._advance();
        local = this._finishNode(e, t);
        
    } else {
        this._error("Expected identifier or 'default' in export specifier.");
        return null;
    }

    let exported = local; 

    if (this._currTokenIs(TOKEN.AS)) {
        this._advance(); // consume 'as'
        // We must also allow 'async' as the exported name (e.g. export { foo as async })
        if (this._currTokenIs(TOKEN.ASYNC)) {
             const t = this._startNode();
             const e = { type: "Identifier", name: "async" };
             this._advance();
             exported = this._finishNode(e, t);
        } else {
             exported = this._parseIdentifier();
        }
    }

    return this._finishNode({ type: 'ExportSpecifier', local, exported }, s);
};
})(window.MerkavahParser.prototype);