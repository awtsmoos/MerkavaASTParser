// B"H --- The Artificer of Golems (Final, Flawless & Unbreakable) ---
class Lexer {
	constructor(s) {
		this.source = s;
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
		this.ch = this.readPosition >= this.source.length ? null : this.source[this.readPosition];
		this.position = this.readPosition++;
		this.column++
	}
	_peek() {
		return this.readPosition >= this.source.length ? null : this.source[this.readPosition]
	}
	_makeToken(t, l) {
		const c = this.column - (l?.length || 1) + 1;
		return {
			type: t,
			literal: l,
			line: this.line,
			column: c,
			hasLineTerminatorBefore: this.hasLineTerminatorBefore
		}
	}
	_skipWhitespace() {
		this.hasLineTerminatorBefore = false;
		while (this.ch !== null) {
			if (' \t'.includes(this.ch)) this._advance();
			else if ('\n\r'.includes(this.ch)) {
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
		if (this.templateStack.length > 0) return this._readTemplatePart();
		this._skipWhitespace();
		if (this.ch === null) return this._makeToken(TOKEN.EOF, '');
		const c = this.ch;
		let tok;
		switch (c) {
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
				this.templateStack.push(1);
				return this._readTemplatePart();
			case '{':
				tok = this._makeToken(TOKEN.LBRACE, '{');
				break;
			case '}':
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
				return this._readString(c);
			default:
				if (this._isLetter(c)) {
					const i = this._readIdentifier();
					return this._makeToken(KEYWORDS[i] || TOKEN.IDENT, i)
				} else if (this._isDigit(c)) return this._makeToken(TOKEN.NUMBER, this._readNumber());
				else tok = this._makeToken(TOKEN.ILLEGAL, c)
		}
		this._advance();
		return tok
	}
	_readIdentifier() {
		const p = this.position;
		while (this._isIdentifierChar(this.ch)) this._advance();
		return this.source.slice(p, this.position)
	}
	_readNumber() {
		const p = this.position;
		while (this._isDigit(this.ch)) this._advance();
		return this.source.slice(p, this.position)
	}
	_readString(q) {
		this._advance();
		const p = this.position;
		while (this.ch !== q && this.ch !== null) this._advance();
		const s = this.source.slice(p, this.position);
		if (this.ch !== q) return this._makeToken(TOKEN.ILLEGAL, s);
		this._advance();
		return this._makeToken(TOKEN.STRING, s)
	}
	_readTemplatePart() {
		const p = this.position;
		while (this.ch !== null && this.ch !== '`') {
			if (this.ch === '$' && this._peek() === '{') {
				if (this.position > p) {
					const l = this.source.slice(p, this.position);
					return this._makeToken(TOKEN.TEMPLATE_HEAD, l)
				}
				this._advance();
				this._advance();
				this.templateStack.pop();
				return this._makeToken(TOKEN.LBRACE, '${')
			}
			this._advance()
		}
		const l = this.source.slice(p, this.position);
		if (this.ch === '`') {
			this._advance();
			this.templateStack.pop()
		} else {
			return this._makeToken(TOKEN.ILLEGAL, `Unterminated template literal`)
		}
		return this._makeToken(TOKEN.TEMPLATE_TAIL, l)
	}
	_isLetter(c) {
		return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_'
	}
	_isDigit(c) {
		return c >= '0' && c <= '9'
	}
	_isIdentifierChar(c) {
		return this._isLetter(c) || this._isDigit(c)
	}
}