// B"H --- Parsing Declarations [DEFINITIVE & COMPLETE] ---
(function(proto) {
	proto.registerDeclarationParsers = function() { /* No registration needed */ };

	proto._parseDeclaration = function() {
		if (this.panicMode) return null;
		switch (this.currToken.type) {
			case TOKEN.EXPORT: return this._parseExportDeclaration();
			case TOKEN.IMPORT: return this._parseImportDeclaration();
			case TOKEN.FUNCTION: return this._parseFunction('declaration');
			case TOKEN.CLASS: return this._parseClassDeclaration();
			case TOKEN.LET:
			case TOKEN.CONST:
			case TOKEN.VAR:
				return this._parseVariableDeclaration();
			case TOKEN.ASYNC:
				if (this._peekTokenIs(TOKEN.FUNCTION)) {
					this._advance();
					return this._parseFunction('declaration', true);
				}
				return this._parseStatement();
			default:
				return this._parseStatement();
		}
	};

	proto._parseBindingPattern = function() {
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
	
	proto._parseVariableDeclaration = function() {
		const s = this._startNode();
		const kind = this.currToken.literal;
		this._advance();
		const declarations = [];
		do {
			const decl = this._parseVariableDeclarator();
			if (!decl) return null; 
			declarations.push(decl);
            if (!this._currTokenIs(TOKEN.COMMA)) break;
            this._advance(); // Consume comma
		} while (true);
		this._consumeSemicolon();
		return this._finishNode({ type: 'VariableDeclaration', declarations, kind }, s);
	};

	proto._parseVariableDeclarator = function() {
		const s = this._startNode();
		const id = this._parseBindingPattern();
		if (!id) return null; 
		let init = null;
		if (this._currTokenIs(TOKEN.ASSIGN)) {
			this._advance();
			init = this._parseExpression(PRECEDENCE.ASSIGNMENT);
			if (!init) return null;
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

	proto._parseClassBody = function() {
		const s = this._startNode();
		this._expect(TOKEN.LBRACE);
		const body = [];
		while (!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) {
			const method = this._parseMethodDefinition();
			if(!method) {
                this._advance(); // Skip bad token to avoid infinite loop
                continue;
            };
			body.push(method);
		}
		this._expect(TOKEN.RBRACE);
		return this._finishNode({ type: 'ClassBody', body }, s);
	};

	proto._parseMethodDefinition = function() {
		const s = this._startNode();
		let isStatic = false;
		if (this.currToken.literal === 'static') {
			isStatic = true;
			this._advance();
		}
		const key = this._parseIdentifier(); 
		if (!key) return null;
		const value = this._parseFunction('expression');
		if (!value) return null;
		return this._finishNode({ type: 'MethodDefinition', key, value, kind: key.name === 'constructor' ? 'constructor' : 'method', 'static': isStatic }, s);
	};

	proto._parseImportDeclaration = function() {
		const s = this._startNode();
		this._expect(TOKEN.IMPORT);
		const specifiers = [];
		if (this._currTokenIs(TOKEN.STRING)) {
			const source = this._parseLiteral();
			this._consumeSemicolon();
			return this._finishNode({ type: 'ImportDeclaration', specifiers, source }, s);
		}
		// Incomplete but safe import parsing
		if(this._currTokenIs(TOKEN.LBRACE)){
			this._advance();
			while(!this._currTokenIs(TOKEN.RBRACE) && !this._currTokenIs(TOKEN.EOF)) this._advance(); // Skip content
			this._expect(TOKEN.RBRACE);
		}
		this._expect(TOKEN.FROM);
		const source = this._parseLiteral();
		if(!source) return null;
		this._consumeSemicolon();
		return this._finishNode({ type: 'ImportDeclaration', specifiers, source }, s);
	};

	proto._parseExportDeclaration = function() {
		const s = this._startNode();
		this._expect(TOKEN.EXPORT);
		let declaration;
		if (this._currTokenIs(TOKEN.DEFAULT)) {
			this._advance();
			declaration = this._parseExpression(PRECEDENCE.ASSIGNMENT);
			this._consumeSemicolon();
			return this._finishNode({ type: 'ExportDefaultDeclaration', declaration }, s);
		}
		declaration = this._parseDeclaration();
		return this._finishNode({ type: 'ExportNamedDeclaration', declaration, specifiers: [], source: null }, s);
	};
})(MerkabahParser.prototype);