// B"H
// --- The Artificer of Golems (Final Emanation with Template State) ---
class Lexer {
	constructor(source) {
		this.source = source;
		this.position = 0;
		this.readPosition = 0;
		this.ch = '';
		this.line = 1;
		this.column = 0;
		this.hasLineTerminatorBefore = false;
		this.templateStack = [];
		this._advance()
	}
	_advance() {
		if (this.readPosition >= this.source.length) {
			this.ch = null
		} else {
			this.ch = this.source[this.readPosition]
		}
		this.position = this.readPosition;
		this.readPosition++;
		this.column++
	}
	_peek() {
		if (this.readPosition >= this.source.length) return null;
		return this.source[this.readPosition]
	}
	_makeToken(type, literal) {
		const column = this.column - (literal?.length || 1) + 1;
		return {
			type,
			literal,
			line: this.line,
			column,
			hasLineTerminatorBefore: this.hasLineTerminatorBefore
		}
	}
	_skipWhitespaceAndComments() {
		this.hasLineTerminatorBefore = false;
		while (this.ch !== null) {
			if (' \t'.includes(this.ch)) {
				this._advance()
			} else if ('\n\r'.includes(this.ch)) {
				this.hasLineTerminatorBefore = true;
				if (this.ch === '\r' && this._peek() === '\n') this._advance();
				this._advance();
				this.line++;
				this.column = 0
			} else if (this.ch === '/' && this._peek() === '/') {
				while (this.ch !== '\n' && this.ch !== '\r' && this.ch !== null) this._advance()
			} else if (this.ch === '/' && this._peek() === '*') {
				this._advance();
				this._advance();
				while (this.ch !== null && (this.ch !== '*' || this._peek() !== '/')) {
					if ('\n\r'.includes(this.ch)) {
						this.hasLineTerminatorBefore = true;
						this.line++;
						this.column = 0
					}
					this._advance()
				}
				if (this.ch !== null) {
					this._advance();
					this._advance()
				}
			} else break
		}
	}
	nextToken() {
		if (this.templateStack.length > 0 && this.templateStack[this.templateStack.length - 1] === 'template') {
			return this._readTemplate()
		}
		this._skipWhitespaceAndComments();
		if (this.ch === null) return this._makeToken(TOKEN.EOF, '');
		const startChar = this.ch;
		let tok;
		switch (startChar) {
			case '=':
				if (this._peek() === '>') this._advance(), tok = this._makeToken(TOKEN.ARROW, '=>');
				else if (this._peek() === '=') this._advance(), tok = this._peek() === '=' ? (this._advance(), this._makeToken(TOKEN.EQ_STRICT, '===')) : this._makeToken(TOKEN.EQ, '==');
				else tok = this._makeToken(TOKEN.ASSIGN, '=');
				break;
			case '!':
				if (this._peek() === '=') this._advance(), tok = this._peek() === '=' ? (this._advance(), this._makeToken(TOKEN.NOT_EQ_STRICT, '!==')) : this._makeToken(TOKEN.NOT_EQ, '!=');
				else tok = this._makeToken(TOKEN.BANG, '!');
				break;
			case '+':
				if (this._peek() === '+') this._advance(), tok = this._makeToken(TOKEN.INCREMENT, '++');
				else if (this._peek() === '=') this._advance(), tok = this._makeToken(TOKEN.PLUS_ASSIGN, '+=');
				else tok = this._makeToken(TOKEN.PLUS, '+');
				break;
			case '-':
				if (this._peek() === '-') this._advance(), tok = this._makeToken(TOKEN.DECREMENT, '--');
				else if (this._peek() === '=') this._advance(), tok = this._makeToken(TOKEN.MINUS_ASSIGN, '-=');
				else tok = this._makeToken(TOKEN.MINUS, '-');
				break;
			case '*':
				if (this._peek() === '*') this._advance(), tok = this._peek() === '=' ? (this._advance(), this._makeToken(TOKEN.EXPONENT_ASSIGN, '**=')) : this._makeToken(TOKEN.EXPONENT, '**');
				else if (this._peek() === '=') this._advance(), tok = this._makeToken(TOKEN.ASTERISK_ASSIGN, '*=');
				else tok = this._makeToken(TOKEN.ASTERISK, '*');
				break;
			case '/':
				if (this._peek() === '=') this._advance(), tok = this._makeToken(TOKEN.SLASH_ASSIGN, '/=');
				else tok = this._makeToken(TOKEN.SLASH, '/');
				break;
			case '<':
				tok = this._peek() === '=' ? (this._advance(), this._makeToken(TOKEN.LTE, '<=')) : this._makeToken(TOKEN.LT, '<');
				break;
			case '>':
				tok = this._peek() === '=' ? (this._advance(), this._makeToken(TOKEN.GTE, '>=')) : this._makeToken(TOKEN.GT, '>');
				break;
			case '&':
				tok = this._peek() === '&' ? (this._advance(), this._makeToken(TOKEN.AND, '&&')) : this._makeToken(TOKEN.ILLEGAL, '&');
				break;
			case '|':
				tok = this._peek() === '|' ? (this._advance(), this._makeToken(TOKEN.OR, '||')) : this._makeToken(TOKEN.ILLEGAL, '|');
				break;
			case '?':
				if (this._peek() === '?') this._advance(), tok = this._peek() === '=' ? (this._advance(), this._makeToken(TOKEN.NULLISH_ASSIGN, '??=')) : this._makeToken(TOKEN.NULLISH_COALESCING, '??');
				else if (this._peek() === '.') this._advance(), tok = this._makeToken(TOKEN.OPTIONAL_CHAINING, '?.');
				else tok = this._makeToken(TOKEN.QUESTION, '?');
				break;
			case '.':
				if (this._peek() === '.' && this.source[this.readPosition + 1] === '.') {
					this._advance();
					this._advance();
					tok = this._makeToken(TOKEN.DOTDOTDOT, '...')
				} else tok = this._makeToken(TOKEN.DOT, '.');
				break;
			case '`':
				this.templateStack.push('template');
				return this._readTemplate();
			case '{':
				if (this.templateStack.length > 0 && this.templateStack[this.templateStack.length - 1] === 'expr') {
					this.templateStack.pop();
					this.templateStack.push('template');
					return this._readTemplate()
				}
				tok = this._makeToken(TOKEN.LBRACE, '{');
				break;
			case '}':
				this.templateStack.push('expr');
				tok = this._makeToken(TOKEN.RBRACE, '}');
				break;
			case '(':
				tok = this._makeToken(TOKEN.LPAREN, '(');
				break;
			case ')':
				tok = this._makeToken(TOKEN.RPAREN, ')');
				break;
			case '[':
				tok = this._makeToken(TOKEN.LBRACKET, '[');
				break;
			case ']':
				tok = this._makeToken(TOKEN.RBRACKET, ']');
				break;
			case ',':
				tok = this._makeToken(TOKEN.COMMA, ',');
				break;
			case ';':
				tok = this._makeToken(TOKEN.SEMICOLON, ';');
				break;
			case ':':
				tok = this._makeToken(TOKEN.COLON, ':');
				break;
			case '"':
			case "'":
				return this._readString(startChar);
			default:
				if (this._isLetter(startChar)) {
					const ident = this._readIdentifier();
					return this._makeToken(KEYWORDS[ident] || TOKEN.IDENT, ident)
				} else if (this._isDigit(startChar)) return this._makeToken(TOKEN.NUMBER, this._readNumber());
				else tok = this._makeToken(TOKEN.ILLEGAL, startChar)
		}
		this._advance();
		return tok
	}
	_readIdentifier() {
		const startPos = this.position;
		while (this._isIdentifierChar(this.ch)) this._advance();
		return this.source.slice(startPos, this.position)
	}
	_readNumber() {
		const startPos = this.position;
		while (this._isDigit(this.ch)) this._advance();
		return this.source.slice(startPos, this.position)
	}
	_readString(quote) {
		this._advance();
		const startPos = this.position;
		while (this.ch !== quote && this.ch !== null) this._advance();
		const str = this.source.slice(startPos, this.position);
		if (this.ch !== quote) return this._makeToken(TOKEN.ILLEGAL, str);
		this._advance();
		return this._makeToken(TOKEN.STRING, str)
	}
	_readTemplate() {
		const startPos = this.position;
		while (this.ch !== null && this.ch !== '`') {
			if (this.ch === '$' && this._peek() === '{') {
				if (this.position > startPos) {
					const literal = this.source.slice(startPos, this.position);
					this.templateStack.pop();
					this.templateStack.push('expr');
					return this._makeToken(TOKEN.TEMPLATE_HEAD, literal)
				}
				this._advance();
				this._advance();
				this.templateStack.pop();
				this.templateStack.push('expr');
				return this._makeToken(TOKEN.LBRACE, '${')
			}
		}
		this._advance()
	}
	const literal = this.source.slice(startPos, this.position);
	this.templateStack.pop();
	if (this.ch === '`') this._advance();
	return this._makeToken(TOKEN.TEMPLATE_TAIL, literal)
}
_isLetter(ch) {
	return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_'
}
_isDigit(ch) {
	return ch >= '0' && ch <= '9'
}
_isIdentifierChar(ch) {
	return this._isLetter(ch) || this._isDigit(ch)
}
}