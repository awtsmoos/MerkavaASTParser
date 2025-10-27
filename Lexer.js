// B"H 
//Lexer.js
//--- The Artificer of Golems (Final, Flawless & Unbreakable) ---
class Lexer {
	constructor(s) {
		this.source = s;
		this.position = 0;
		this.readPosition = 0;
		this.ch = '';
		this.line = 1;
		this.column = 0;
		this.hasLineTerminatorBefore = false;
		this.templateStack = []; // Used to handle nested template literals
		this._advance();
	}

	_advance() {
		if (this.readPosition >= this.source.length) {
			this.ch = null;
		} else {
			this.ch = this.source[this.readPosition];
		}
		this.position = this.readPosition;
		this.readPosition++;
		this.column++;
	}

	_peek() {
		if (this.readPosition >= this.source.length) return null;
		return this.source[this.readPosition];
	}

	_makeToken(type, literal) {
		const col = this.column - (literal?.length || (this.ch === null ? 0 : 1));
		return { type, literal, line: this.line, column: col, hasLineTerminatorBefore: this.hasLineTerminatorBefore };
	}

	_skipWhitespace() {
		this.hasLineTerminatorBefore = false;
		while (this.ch !== null) {
			if (' \t'.includes(this.ch)) {
				this._advance();
			} else if ('\n\r'.includes(this.ch)) {
				this.hasLineTerminatorBefore = true;
				if (this.ch === '\r' && this._peek() === '\n') this._advance();
				this._advance();
				this.line++;
				this.column = 0;
			} else if (this.ch === '/' && this._peek() === '/') {
				while (this.ch !== '\n' && this.ch !== '\r' && this.ch !== null) this._advance();
			} else if (this.ch === '/' && this._peek() === '*') {
				this._advance(); this._advance();
				while (this.ch !== null && (this.ch !== '*' || this._peek() !== '/')) {
					if ('\n\r'.includes(this.ch)) {
						this.hasLineTerminatorBefore = true;
						if (this.ch === '\r' && this._peek() === '\n') this._advance();
						this.line++;
						this.column = 0;
					}
					this._advance();
				}
				if (this.ch !== null) { this._advance(); this._advance(); }
			} else {
				break;
			}
		}
	}

	nextToken() {
		if (this.templateStack.length > 0 && this.ch === '}') {
			return this._readTemplateMiddleOrTail();
		}
		
		this._skipWhitespace();
		if (this.ch === null) return this._makeToken(TOKEN.EOF, '');

		const c = this.ch;
		let tok;

		switch (c) {
			case '=':
				if (this._peek() === '>') { this._advance(); tok = this._makeToken(TOKEN.ARROW, '=>'); }
				else if (this._peek() === '=') { this._advance(); tok = this._peek() === '=' ? (this._advance(), this._makeToken(TOKEN.EQ_STRICT, '===')) : this._makeToken(TOKEN.EQ, '=='); }
				else { tok = this._makeToken(TOKEN.ASSIGN, '='); }
				break;
			case '!':
				if (this._peek() === '=') { this._advance(); tok = this._peek() === '=' ? (this._advance(), this._makeToken(TOKEN.NOT_EQ_STRICT, '!==')) : this._makeToken(TOKEN.NOT_EQ, '!='); }
				else { tok = this._makeToken(TOKEN.BANG, '!'); }
				break;
			case '+':
				if (this._peek() === '+') { this._advance(); tok = this._makeToken(TOKEN.INCREMENT, '++'); }
				else if (this._peek() === '=') { this._advance(); tok = this._makeToken(TOKEN.PLUS_ASSIGN, '+='); }
				else { tok = this._makeToken(TOKEN.PLUS, '+'); }
				break;
			case '-':
				if (this._peek() === '-') { this._advance(); tok = this._makeToken(TOKEN.DECREMENT, '--'); }
				else if (this._peek() === '=') { this._advance(); tok = this._makeToken(TOKEN.MINUS_ASSIGN, '-='); }
				else { tok = this._makeToken(TOKEN.MINUS, '-'); }
				break;
			case '*':
				if (this._peek() === '*') { this._advance(); tok = this._peek() === '=' ? (this._advance(), this._makeToken(TOKEN.EXPONENT_ASSIGN, '**=')) : this._makeToken(TOKEN.EXPONENT, '**'); }
				else if (this._peek() === '=') { this._advance(); tok = this._makeToken(TOKEN.ASTERISK_ASSIGN, '*='); }
				else { tok = this._makeToken(TOKEN.ASTERISK, '*'); }
				break;
			case '/':
				if (this._peek() === '=') { this._advance(); tok = this._makeToken(TOKEN.SLASH_ASSIGN, '/='); }
				else { tok = this._makeToken(TOKEN.SLASH, '/'); }
				break;
			case '<': tok = this._peek() === '=' ? (this._advance(), this._makeToken(TOKEN.LTE, '<=')) : this._makeToken(TOKEN.LT, '<'); break;
			case '>': tok = this._peek() === '=' ? (this._advance(), this._makeToken(TOKEN.GTE, '>=')) : this._makeToken(TOKEN.GT, '>'); break;
			case '&': tok = this._peek() === '&' ? (this._advance(), this._makeToken(TOKEN.AND, '&&')) : this._makeToken(TOKEN.ILLEGAL, '&'); break;
			case '|': tok = this._peek() === '|' ? (this._advance(), this._makeToken(TOKEN.OR, '||')) : this._makeToken(TOKEN.ILLEGAL, '|'); break;
			case '?':
				if (this._peek() === '?') { this._advance(); tok = this._peek() === '=' ? (this._advance(), this._makeToken(TOKEN.NULLISH_ASSIGN, '??=')) : this._makeToken(TOKEN.NULLISH_COALESCING, '??'); }
				else if (this._peek() === '.') { this._advance(); tok = this._makeToken(TOKEN.OPTIONAL_CHAINING, '?.'); }
				else { tok = this._makeToken(TOKEN.QUESTION, '?'); }
				break;
			case '.':
				if (this._peek() === '.' && this.source[this.readPosition + 1] === '.') { this._advance(); this._advance(); tok = this._makeToken(TOKEN.DOTDOTDOT, '...'); }
				else { tok = this._makeToken(TOKEN.DOT, '.'); }
				break;
			case '`': this.templateStack.push(true); return this._readTemplateHead();
			case '{': tok = this._makeToken(TOKEN.LBRACE, '{'); break;
			case '}': tok = this._makeToken(TOKEN.RBRACE, '}'); break;
			case '(': tok = this._makeToken(TOKEN.LPAREN, '('); break;
			case ')': tok = this._makeToken(TOKEN.RPAREN, ')'); break;
			case '[': tok = this._makeToken(TOKEN.LBRACKET, '['); break;
			case ']': tok = this._makeToken(TOKEN.RBRACKET, ']'); break;
			case ',': tok = this._makeToken(TOKEN.COMMA, ','); break;
			case ';': tok = this._makeToken(TOKEN.SEMICOLON, ';'); break;
			case ':': tok = this._makeToken(TOKEN.COLON, ':'); break;
			case '"': case "'": return this._readString(c);
			default:
				if (this._isLetter(c)) {
					const ident = this._readIdentifier();
					return this._makeToken(KEYWORDS[ident] || TOKEN.IDENT, ident);
				} else if (this._isDigit(c)) {
					return this._makeToken(TOKEN.NUMBER, this._readNumber());
				} else {
					tok = this._makeToken(TOKEN.ILLEGAL, c);
				}
		}

		this._advance();
		return tok;
	}
	
	_readTemplateHead() {
		this._advance();
		return this._readTemplatePart('TEMPLATE_HEAD');
	}

	_readTemplateMiddleOrTail() {
		// Assumes current char is '}'
		this._advance(); // Consume '}'
		const type = this.templateStack.length > 0 ? 'TEMPLATE_MIDDLE' : 'ILLEGAL';
		return this._readTemplatePart(type);
	}
	
	_readTemplatePart(initialType) {
		const p = this.position;
		while (this.ch !== null && this.ch !== '`') {
			if (this.ch === '$' && this._peek() === '{') {
				const literal = this.source.slice(p, this.position);
				this._advance(); // Consume '$'
				this._advance(); // Consume '{'
				this.templateStack.push(true); // Enter expression part
				return this._makeToken(initialType, literal);
			}
			this._advance();
		}

		const literal = this.source.slice(p, this.position);
		if (this.ch === '`') {
			this.templateStack.pop();
			this._advance(); // Consume '`'
			return this._makeToken(TOKEN.TEMPLATE_TAIL, literal);
		}
		
		return this._makeToken(TOKEN.ILLEGAL, `Unterminated template literal`);
	}

	_readIdentifier() {
		const p = this.position;
		while (this._isIdentifierChar(this.ch)) this._advance();
		return this.source.slice(p, this.position);
	}

	_readNumber() {
		const p = this.position;
		while (this._isDigit(this.ch)) this._advance();
		return this.source.slice(p, this.position);
	}

	_readString(quote) {
		this._advance(); // consume opening quote
		const p = this.position;
		while (this.ch !== quote && this.ch !== null) {
			if (this.ch === '\\') this._advance(); // skip escaped char
			this._advance();
		}
		const s = this.source.slice(p, this.position);
		if (this.ch !== quote) return this._makeToken(TOKEN.ILLEGAL, s); // Unterminated string
		this._advance(); // consume closing quote
		return this._makeToken(TOKEN.STRING, s);
	}

	_isLetter(c) { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' || c === '$'; }
	_isDigit(c) { return c >= '0' && c <= '9'; }
	_isIdentifierChar(c) { return c !== null && (this._isLetter(c) || this._isDigit(c)); }
}