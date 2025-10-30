// B"H 
//--- THE DEFINITIVE AND FINAL Lexer.js ---

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
		this.op_count = 0;
		this.max_ops = 25000;
		this._advance();
	}

	_guard() {
		if (this.op_count++ > this.max_ops) {
			throw new Error(
				`LEXER HALTED: Maximum operation count (${this.max_ops}) exceeded. ` +
				`This is a guaranteed infinite loop, likely caused by a bug in the lexer's state. ` +
				`Stuck near character: '${this.ch}' at Line: ${this.line}, Col: ${this.column}`
			);
		}
	}

	_advance() {
		this._guard();
		if (this.readPosition >= this.source.length) {
			this.ch = null;
		} else {
			this.ch = this.source[this.readPosition];
		}
		this.position = this.readPosition;
		this.readPosition++;
		if (this.ch !== '\n' && this.ch !== '\r') {
			this.column++;
		}
	}

	_peek() {
		this._guard();
		if (this.readPosition >= this.source.length) return null;
		return this.source[this.readPosition];
	}

	_makeToken(type, literal, startColumn, startLine) {
		this._guard();
		const col = startColumn || this.column - (literal?.length || (this.ch === null ? 0 : 1));
		const line = startLine || this.line;
		return {
			type,
			literal,
			line: line,
			column: col,
			hasLineTerminatorBefore: this.hasLineTerminatorBefore,
			startIndex: this.position
		};
	}

	// -------------------------------------------------------------------------
	// --- THE SINGLE, CORRECT, AND FINAL _skipWhitespace METHOD ---
	// -------------------------------------------------------------------------
	// B"H --- THE DEFINITIVE AND FINAL _skipWhitespace METHOD ---

_skipWhitespace() {
    while (this.ch !== null) {
        this._guard();

        // Handle simple whitespace
        if (this.ch === ' ' || this.ch === '\t') {
            this._advance();
            continue;
        }

        // The SINGLE SOURCE OF TRUTH for handling newlines.
        // All single-line comment handlers will stop at a newline, allowing this block to run.
        if (this.ch === '\n' || this.ch === '\r') {
            this.hasLineTerminatorBefore = true;
            if (this.ch === '\r' && this._peek() === '\n') this._advance(); // Handle CRLF
            this._advance(); // Consume LF
            this.line++;
            this.column = 0;
            continue;
        }

        // Handle all single-line comment types.
        const isJSComment = this.ch === '/' && this._peek() === '/';
        const isHTMLOpenComment = this.ch === '<' && this._peek() === '!' && this.source.substring(this.position, this.position + 4) === '<!--';
        const isHTMLCloseComment = this.column === 1 && this.ch === '-' && this._peek() === '-' && this.source.substring(this.position, this.position + 3) === '-->';

        if (isJSComment || isHTMLOpenComment || isHTMLCloseComment) {
            // This is the simple, robust logic: consume everything until the line ends.
            // Do not try to parse anything inside the comment.
            while (this.ch !== null && this.ch !== '\n' && this.ch !== '\r') {
                this._advance();
            }
            // Now, loop again. The master newline handler above will take care of the state reset.
            continue;
        }

        // Handle multi-line JS comments
        if (this.ch === '/' && this._peek() === '*') {
            this._advance(); // Consume '/'
            this._advance(); // Consume '*'
            while (this.ch !== null && (this.ch !== '*' || this._peek() !== '/')) {
                // Multi-line comments are the only case that must handle newlines internally.
                if (this.ch === '\n' || this.ch === '\r') {
                    this.hasLineTerminatorBefore = true;
                    if (this.ch === '\r' && this._peek() === '\n') this._advance();
                    this._advance();
                    this.line++;
                    this.column = 0;
                    continue; // Restart the inner comment-parsing loop
                }
                this._advance();
            }
            if (this.ch !== null) { // Consume closing '*/'
                this._advance();
                this._advance();
            }
            continue;
        }

        // If no whitespace or comment was found, it must be a token. Stop skipping.
        break;
    }
}
	// -------------------------------------------------------------------------
	// --- END OF THE CORRECTED METHOD ---
	// -------------------------------------------------------------------------


	nextToken() {
		this._guard();
		this.hasLineTerminatorBefore = false;
		this._skipWhitespace();

		const startLine = this.line;
		const startColumn = this.column;

		if (this.ch === null) {
			return this._makeToken(TOKEN.EOF, '', startColumn, startLine);
		}

		if (this.templateStack.length > 0 && this.ch === '}') {
			return this._readTemplateMiddleOrTail();
		}

		const c = this.ch;
		let tok;

		switch (c) {
			case '=':
				if (this._peek() === '>') { this._advance(); tok = this._makeToken(TOKEN.ARROW, '=>', startColumn); }
				else if (this._peek() === '=') { this._advance(); tok = this._peek() === '=' ? (this._advance(), this._makeToken(TOKEN.EQ_STRICT, '===', startColumn)) : this._makeToken(TOKEN.EQ, '==', startColumn); }
				else { tok = this._makeToken(TOKEN.ASSIGN, '=', startColumn); }
				break;
			case '!':
				if (this._peek() === '=') { this._advance(); tok = this._peek() === '=' ? (this._advance(), this._makeToken(TOKEN.NOT_EQ_STRICT, '!==', startColumn)) : this._makeToken(TOKEN.NOT_EQ, '!=', startColumn); }
				else { tok = this._makeToken(TOKEN.BANG, '!', startColumn); }
				break;
			case '+':
				if (this._peek() === '+') { this._advance(); tok = this._makeToken(TOKEN.INCREMENT, '++', startColumn); }
				else if (this._peek() === '=') { this._advance(); tok = this._makeToken(TOKEN.PLUS_ASSIGN, '+=', startColumn); }
				else { tok = this._makeToken(TOKEN.PLUS, '+', startColumn); }
				break;
			case '-':
				if (this._peek() === '-') { this._advance(); tok = this._makeToken(TOKEN.DECREMENT, '--', startColumn); }
				else if (this._peek() === '=') { this._advance(); tok = this._makeToken(TOKEN.MINUS_ASSIGN, '-=', startColumn); }
				else { tok = this._makeToken(TOKEN.MINUS, '-', startColumn); }
				break;
			case '*':
				if (this._peek() === '*') { this._advance(); tok = this._peek() === '=' ? (this._advance(), this._makeToken(TOKEN.EXPONENT_ASSIGN, '**=', startColumn)) : this._makeToken(TOKEN.EXPONENT, '**', startColumn); }
				else if (this._peek() === '=') { this._advance(); tok = this._makeToken(TOKEN.ASTERISK_ASSIGN, '*=', startColumn); }
				else { tok = this._makeToken(TOKEN.ASTERISK, '*', startColumn); }
				break;
			case '/':
				if (this._peek() === '=') { this._advance(); tok = this._makeToken(TOKEN.SLASH_ASSIGN, '/=', startColumn); }
				else { tok = this._makeToken(TOKEN.SLASH, '/', startColumn); }
				break;
			case '%':
	            if (this._peek() === '=') { this._advance(); tok = this._makeToken(TOKEN.MODULO_ASSIGN, '%=', startColumn); }
	            else { tok = this._makeToken(TOKEN.MODULO, '%', startColumn); }
	            break;
            case '<':
                if (this._peek() === '<') { this._advance(); tok = this._peek() === '=' ? (this._advance(), this._makeToken(TOKEN.LEFT_SHIFT_ASSIGN, '<<=', startColumn)) : this._makeToken(TOKEN.LEFT_SHIFT, '<<', startColumn); }
                else if (this._peek() === '=') { this._advance(); tok = this._makeToken(TOKEN.LTE, '<=', startColumn); }
                else { tok = this._makeToken(TOKEN.LT, '<', startColumn); }
                break;
            case '>':
                if (this._peek() === '>') { this._advance(); if (this._peek() === '>') { this._advance(); tok = this._peek() === '=' ? (this._advance(), this._makeToken(TOKEN.UNSIGNED_RIGHT_SHIFT_ASSIGN, '>>>=', startColumn)) : this._makeToken(TOKEN.UNSIGNED_RIGHT_SHIFT, '>>>', startColumn); } else if (this._peek() === '=') { this._advance(); tok = this._makeToken(TOKEN.RIGHT_SHIFT_ASSIGN, '>>=', startColumn); } else { tok = this._makeToken(TOKEN.RIGHT_SHIFT, '>>', startColumn); } }
                else if (this._peek() === '=') { this._advance(); tok = this._makeToken(TOKEN.GTE, '>=', startColumn); }
                else { tok = this._makeToken(TOKEN.GT, '>', startColumn); }
                break;
            case '&':
                if (this._peek() === '&') { this._advance(); tok = this._makeToken(TOKEN.AND, '&&', startColumn); }
                else if (this._peek() === '=') { this._advance(); tok = this._makeToken(TOKEN.BITWISE_AND_ASSIGN, '&=', startColumn); }
                else { tok = this._makeToken(TOKEN.BITWISE_AND, '&', startColumn); }
                break;
            case '|':
                if (this._peek() === '|') { this._advance(); tok = this._makeToken(TOKEN.OR, '||', startColumn); }
                else if (this._peek() === '=') { this._advance(); tok = this._makeToken(TOKEN.BITWISE_OR_ASSIGN, '|=', startColumn); }
                else { tok = this._makeToken(TOKEN.BITWISE_OR, '|', startColumn); }
                break;
            case '^':
                if (this._peek() === '=') { this._advance(); tok = this._makeToken(TOKEN.BITWISE_XOR_ASSIGN, '^=', startColumn); }
                else { tok = this._makeToken(TOKEN.BITWISE_XOR, '^', startColumn); }
                break;
            case '~':
                tok = this._makeToken(TOKEN.BITWISE_NOT, '~', startColumn);
                break;
			case '?':
				if (this._peek() === '?') { this._advance(); tok = this._peek() === '=' ? (this._advance(), this._makeToken(TOKEN.NULLISH_ASSIGN, '??=', startColumn)) : this._makeToken(TOKEN.NULLISH_COALESCING, '??', startColumn); }
				else if (this._peek() === '.') { this._advance(); tok = this._makeToken(TOKEN.OPTIONAL_CHAINING, '?.', startColumn); }
				else { tok = this._makeToken(TOKEN.QUESTION, '?', startColumn); }
				break;
			case '.':
				if (this._peek() === '.' && this.source[this.readPosition + 1] === '.') { this._advance(); this._advance(); tok = this._makeToken(TOKEN.DOTDOTDOT, '...', startColumn); }
				else { tok = this._makeToken(TOKEN.DOT, '.', startColumn); }
				break;
			case '`': this.templateStack.push(true); return this._readTemplateHead();
			case '{': tok = this._makeToken(TOKEN.LBRACE, '{', startColumn); break;
			case '}': tok = this._makeToken(TOKEN.RBRACE, '}', startColumn); break;
			case '(': tok = this._makeToken(TOKEN.LPAREN, '(', startColumn); break;
			case ')': tok = this._makeToken(TOKEN.RPAREN, ')', startColumn); break;
			case '[': tok = this._makeToken(TOKEN.LBRACKET, '[', startColumn); break;
			case ']': tok = this._makeToken(TOKEN.RBRACKET, ']', startColumn); break;
			case ',': tok = this._makeToken(TOKEN.COMMA, ',', startColumn); break;
			case ';': tok = this._makeToken(TOKEN.SEMICOLON, ';', startColumn); break;
			case ':': tok = this._makeToken(TOKEN.COLON, ':', startColumn); break;
			case '"': case "'": return this._readString(c);
			case '#': return this._readPrivateIdentifier();

			default:
				if (this._isLetter(c)) {
					const ident = this._readIdentifier();
					return this._makeToken(KEYWORDS[ident] || TOKEN.IDENT, ident, startColumn);
				} else if (this._isDigit(c)) {
					return this._makeToken(TOKEN.NUMBER, this._readNumber(), startColumn);
				} else {
					tok = this._makeToken(TOKEN.ILLEGAL, c, startColumn);
				}
		}

		this._advance();
		return tok;
	}

	_readPrivateIdentifier() {
		this._advance(); // Consume '#'
		const startColumn = this.column - 1;
		const ident = this._readIdentifier();
		if (!ident) {
			return this._makeToken(TOKEN.ILLEGAL, '#', startColumn);
		}
		return this._makeToken(TOKEN.PRIVATE_IDENT, '#' + ident, startColumn);
	}

	_readTemplateHead() {
		this._guard();
		this._advance();
		return this._readTemplatePart('TEMPLATE_HEAD');
	}

	_readTemplateMiddleOrTail() {
		this._guard();
		this._advance(); // Consume '}'
		this.templateStack.pop();
		return this._readTemplatePart('TEMPLATE_MIDDLE');
	}

	_readTemplatePart(initialType) {
		const p = this.position;
		while (this.ch !== null && this.ch !== '`') {
			this._guard();
			if (this.ch === '$' && this._peek() === '{') {
				const literal = this.source.slice(p, this.position);
				this._advance(); // Consume '$'
				this._advance(); // Consume '{'
				this.templateStack.push(true);
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
		while (this.ch !== null && this._isIdentifierChar(this.ch)) {
			this._advance();
		}
		return this.source.slice(p, this.position);
	}

	_readNumber() {
		const p = this.position;
		if (this.ch === '0' && this._peek() && 'xob'.includes(this._peek().toLowerCase())) {
			this._advance();
			this._advance();
			while (this.ch !== null && this._isIdentifierChar(this.ch)) {
				this._advance();
			}
		} else {
			while (this.ch !== null && this._isDigit(this.ch)) {
				this._advance();
			}
			if (this.ch === '.' && this._isDigit(this._peek())) {
				this._advance();
				while (this.ch !== null && this._isDigit(this.ch)) {
					this._advance();
				}
			}
		}
		if (this.ch === 'n') {
			this._advance();
		}
		return this.source.slice(p, this.position);
	}

	_readString(quote) {
		this._advance(); // consume opening quote
		const p = this.position;
		while (this.ch !== quote && this.ch !== null) {
			this._guard();
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