// B"H 
//--- THE DEFINITIVE AND FINAL Lexer.js ---
(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./constants.js'));
    } else {
        root.Lexer = factory(root.MerkavahConstants);
    }
}(typeof self !== 'undefined' ? self : this, function({ TOKEN, KEYWORDS }) {
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
        
        // TIKKUN: Use a stack for brace nesting levels to handle nested templates correctly.
        // We start with a base level of 0.
		this.braceNestingStack = [0]; 
        
		this.comments = []; 
		this.op_count = 0;
		this.max_ops = 250000;
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

	

	// -------------------------------------------------------------------------
	// --- THE SINGLE, CORRECT, AND FINAL _skipWhitespace METHOD ---
	// -------------------------------------------------------------------------
// B"H
// In Lexer.js, replace the entire _skipWhitespace method with this one.
_skipWhitespace() {
    while (this.ch !== null) {
        this._guard();

        if (' \t'.includes(this.ch)) {
            this._advance();

        } else if ('\n\r'.includes(this.ch)) {
            this.hasLineTerminatorBefore = true;
            if (this.ch === '\r' && this._peek() === '\n') this._advance();
            this._advance();
            this.line++;
            this.column = 0;

        // --- MODIFICATION FOR SINGLE-LINE COMMENTS ---
        } else if (this.ch === '/' && this._peek() === '/') {
            const startPos = this.position;
            const startLine = this.line;
            const startCol = this.column;
            
            this._advance(); // Consume /
            this._advance(); // Consume /

            const commentStart = this.position;
            while (this.ch !== '\n' && this.ch !== '\r' && this.ch !== null) {
                this._advance();
            }
            const commentEnd = this.position;
            const value = this.source.slice(commentStart, commentEnd);

            // Add the found comment to our new array
            this.comments.push({
                type: "Line",
                value: " " + value, // ESTree spec often includes leading space
                start: startPos,
                end: commentEnd,
                loc: {
                    start: { line: startLine, column: startCol },
                    end: { line: this.line, column: this.column }
                }
            });
        // --- END OF MODIFICATION ---
        
        // --- MODIFICATION FOR MULTI-LINE COMMENTS ---
        } else if (this.ch === '/' && this._peek() === '*') {
            const startPos = this.position;
            const startLine = this.line;
            const startCol = this.column;

            this._advance(); // Consume /
            this._advance(); // Consume *

            const commentStart = this.position;
            while (this.ch !== null && (this.ch !== '*' || this._peek() !== '/')) {
                if ('\n\r'.includes(this.ch)) {
                    this.hasLineTerminatorBefore = true;
                    if (this.ch === '\r' && this._peek() === '\n') this._advance();
                    this.line++;
                    this.column = 0;
                }
                this._advance();
            }
            const commentEnd = this.position;
            const value = this.source.slice(commentStart, commentEnd);
            
            if (this.ch !== null) {
                this._advance(); // Consume *
                this._advance(); // Consume /
            }

            // Add the found comment to our new array
             this.comments.push({
                type: "Block",
                value: value,
                start: startPos,
                end: commentEnd + 2, // account for */
                loc: {
                    start: { line: startLine, column: startCol },
                    end: { line: this.line, column: this.column }
                }
            });
        // --- END OF MODIFICATION ---

        } else if (this.hasLineTerminatorBefore && this.ch === '<' && this._peek() === '!' && this.source.substring(this.position, this.position + 4) === '<!--') {
            while (this.ch !== '\n' && this.ch !== '\r' && this.ch !== null) this._advance();

        } else if (this.hasLineTerminatorBefore && this.ch === '-' && this._peek() === '-' && this.source.substring(this.position, this.position + 3) === '-->') {
            while (this.ch !== '\n' && this.ch !== '\r' && this.ch !== null) this._advance();
        
        } else {
            break;
        }
    }
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


    // B"H 
    nextToken() {
        this._guard();
        this.hasLineTerminatorBefore = false;
        this._skipWhitespace();

        const startLine = this.line;
        const startColumn = this.column;
        const startPosition = this.position; 

        if (this.ch === null) {
            return this._makeToken(TOKEN.EOF, '', startColumn, startLine, startPosition);
        }
        
        const c = this.ch;
        let tok;

        switch (c) {
            case '{':
                // TIKKUN: Increment the current context's brace level
                this.braceNestingStack[this.braceNestingStack.length - 1]++;
                tok = this._makeToken(TOKEN.LBRACE, '{', startColumn, startLine, startPosition); 
                this._advance(); return tok;
            case '}':
                // TIKKUN: Check the current context's brace level
                const currentLevel = this.braceNestingStack[this.braceNestingStack.length - 1];
                if (currentLevel > 0) {
                    this.braceNestingStack[this.braceNestingStack.length - 1]--;
                    
                    // Check if we hit 0 AND we are inside a template interpolation (templateStack not empty)
                    // If so, this '}' ends the interpolation block.
                    if (this.braceNestingStack[this.braceNestingStack.length - 1] === 0 && this.templateStack.length > 0) {
                        this.templateStack.pop();
                        // We are leaving an interpolation, so we pop its brace context
                        this.braceNestingStack.pop();
                        
                        this._advance(); // Consume the '}'
                        // Resume reading the template string
                        return this._readTemplatePart(true, startPosition); 
                    }
                }
                tok = this._makeToken(TOKEN.RBRACE, '}', startColumn, startLine, startPosition); 
                this._advance(); return tok;
            
            // ... The rest of the switch cases remain exactly as they were in the previous valid version ...
            case '`': this._advance(); return this._readTemplatePart(false, startPosition); 
            case '=': this._advance(); if (this.ch === '>') { this._advance(); return this._makeToken(TOKEN.ARROW, '=>', startColumn, startLine, startPosition); } if (this.ch === '=') { this._advance(); return this.ch === '=' ? (this._advance(), this._makeToken(TOKEN.EQ_STRICT, '===', startColumn, startLine, startPosition)) : this._makeToken(TOKEN.EQ, '==', startColumn, startLine, startPosition); } return this._makeToken(TOKEN.ASSIGN, '=', startColumn, startLine, startPosition);
            case '!': this._advance(); if (this.ch === '=') { this._advance(); return this.ch === '=' ? (this._advance(), this._makeToken(TOKEN.NOT_EQ_STRICT, '!==', startColumn, startLine, startPosition)) : this._makeToken(TOKEN.NOT_EQ, '!=', startColumn, startLine, startPosition); } return this._makeToken(TOKEN.BANG, '!', startColumn, startLine, startPosition);
            case '+': this._advance(); if (this.ch === '+') { this._advance(); return this._makeToken(TOKEN.INCREMENT, '++', startColumn, startLine, startPosition); } if (this.ch === '=') { this._advance(); return this._makeToken(TOKEN.PLUS_ASSIGN, '+=', startColumn, startLine, startPosition); } return this._makeToken(TOKEN.PLUS, '+', startColumn, startLine, startPosition);
            case '-': this._advance(); if (this.ch === '-') { this._advance(); return this._makeToken(TOKEN.DECREMENT, '--', startColumn, startLine, startPosition); } if (this.ch === '=') { this._advance(); return this._makeToken(TOKEN.MINUS_ASSIGN, '-=', startColumn, startLine, startPosition); } return this._makeToken(TOKEN.MINUS, '-', startColumn, startLine, startPosition);
            case '*': this._advance(); if (this.ch === '*') { this._advance(); return this.ch === '=' ? (this._advance(), this._makeToken(TOKEN.EXPONENT_ASSIGN, '**=', startColumn, startLine, startPosition)) : this._makeToken(TOKEN.EXPONENT, '**', startColumn, startLine, startPosition); } if (this.ch === '=') { this._advance(); return this._makeToken(TOKEN.ASTERISK_ASSIGN, '*=', startColumn, startLine, startPosition); } return this._makeToken(TOKEN.ASTERISK, '*', startColumn, startLine, startPosition);
            case '/': this._advance(); if (this.ch === '=') { this._advance(); return this._makeToken(TOKEN.SLASH_ASSIGN, '/=', startColumn, startLine, startPosition); } return this._makeToken(TOKEN.SLASH, '/', startColumn, startLine, startPosition);
            case '%': this._advance(); if (this.ch === '=') { this._advance(); return this._makeToken(TOKEN.MODULO_ASSIGN, '%=', startColumn, startLine, startPosition); } return this._makeToken(TOKEN.MODULO, '%', startColumn, startLine, startPosition);
            case '<': this._advance(); if (this.ch === '<') { this._advance(); return this.ch === '=' ? (this._advance(), this._makeToken(TOKEN.LEFT_SHIFT_ASSIGN, '<<=', startColumn, startLine, startPosition)) : this._makeToken(TOKEN.LEFT_SHIFT, '<<', startColumn, startLine, startPosition); } if (this.ch === '=') { this._advance(); return this._makeToken(TOKEN.LTE, '<=', startColumn, startLine, startPosition); } return this._makeToken(TOKEN.LT, '<', startColumn, startLine, startPosition);
            case '>': this._advance(); if (this.ch === '>') { this._advance(); if (this.ch === '>') { this._advance(); return this.ch === '=' ? (this._advance(), this._makeToken(TOKEN.UNSIGNED_RIGHT_SHIFT_ASSIGN, '>>>=', startColumn, startLine, startPosition)) : this._makeToken(TOKEN.UNSIGNED_RIGHT_SHIFT, '>>>', startColumn, startLine, startPosition); } if (this.ch === '=') { this._advance(); return this._makeToken(TOKEN.RIGHT_SHIFT_ASSIGN, '>>=', startColumn, startLine, startPosition); } return this._makeToken(TOKEN.RIGHT_SHIFT, '>>', startColumn, startLine, startPosition); } if (this.ch === '=') { this._advance(); return this._makeToken(TOKEN.GTE, '>=', startColumn, startLine, startPosition); } return this._makeToken(TOKEN.GT, '>', startColumn, startLine, startPosition);
            case '&': this._advance(); if (this.ch === '&') { this._advance(); return this.ch === '=' ? (this._advance(), this._makeToken(TOKEN.LOGICAL_AND_ASSIGN, '&&=', startColumn, startLine, startPosition)) : this._makeToken(TOKEN.AND, '&&', startColumn, startLine, startPosition); } if (this.ch === '=') { this._advance(); return this._makeToken(TOKEN.BITWISE_AND_ASSIGN, '&=', startColumn, startLine, startPosition); } return this._makeToken(TOKEN.BITWISE_AND, '&', startColumn, startLine, startPosition);
            case '|': this._advance(); if (this.ch === '|') { this._advance(); return this.ch === '=' ? (this._advance(), this._makeToken(TOKEN.LOGICAL_OR_ASSIGN, '||=', startColumn, startLine, startPosition)) : this._makeToken(TOKEN.OR, '||', startColumn, startLine, startPosition); } if (this.ch === '=') { this._advance(); return this._makeToken(TOKEN.BITWISE_OR_ASSIGN, '|=', startColumn, startLine, startPosition); } return this._makeToken(TOKEN.BITWISE_OR, '|', startColumn, startLine, startPosition);
            case '^': this._advance(); if (this.ch === '=') { this._advance(); return this._makeToken(TOKEN.BITWISE_XOR_ASSIGN, '^=', startColumn, startLine, startPosition); } return this._makeToken(TOKEN.BITWISE_XOR, '^', startColumn, startLine, startPosition);
            case '~': tok = this._makeToken(TOKEN.BITWISE_NOT, '~', startColumn, startLine, startPosition); this._advance(); return tok;
            case '?': this._advance(); if (this.ch === '?') { this._advance(); return this.ch === '=' ? (this._advance(), this._makeToken(TOKEN.NULLISH_ASSIGN, '??=', startColumn, startLine, startPosition)) : this._makeToken(TOKEN.NULLISH_COALESCING, '??', startColumn, startLine, startPosition); } if (this.ch === '.') { this._advance(); return this._makeToken(TOKEN.OPTIONAL_CHAINING, '?.', startColumn, startLine, startPosition); } return this._makeToken(TOKEN.QUESTION, '?', startColumn, startLine, startPosition);
            case '.': this._advance(); if (this.ch === '.' && this._peek() === '.') { this._advance(); this._advance(); return this._makeToken(TOKEN.DOTDOTDOT, '...', startColumn, startLine, startPosition); } return this._makeToken(TOKEN.DOT, '.', startColumn, startLine, startPosition);
            case '(': tok = this._makeToken(TOKEN.LPAREN, '(', startColumn, startLine, startPosition); this._advance(); return tok;
            case ')': tok = this._makeToken(TOKEN.RPAREN, ')', startColumn, startLine, startPosition); this._advance(); return tok;
            case '[': tok = this._makeToken(TOKEN.LBRACKET, '[', startColumn, startLine, startPosition); this._advance(); return tok;
            case ']': tok = this._makeToken(TOKEN.RBRACKET, ']', startColumn, startLine, startPosition); this._advance(); return tok;
            case ',': tok = this._makeToken(TOKEN.COMMA, ',', startColumn, startLine, startPosition); this._advance(); return tok;
            case ';': tok = this._makeToken(TOKEN.SEMICOLON, ';', startColumn, startLine, startPosition); this._advance(); return tok;
            case ':': tok = this._makeToken(TOKEN.COLON, ':', startColumn, startLine, startPosition); this._advance(); return tok;
            case '"': case "'": return this._readString(c, startColumn, startLine, startPosition);
            case '#': return this._readPrivateIdentifier(startColumn, startLine, startPosition);
            case '\\': const ident = this._readIdentifier(); return this._makeToken(TOKEN.IDENT, ident, startColumn, startLine, startPosition);
            default:
                if (this._isLetter(c)) {
                    const ident = this._readIdentifier();
                    const type = Object.prototype.hasOwnProperty.call(KEYWORDS, ident) ? KEYWORDS[ident] : TOKEN.IDENT;
                    return this._makeToken(type, ident, startColumn, startLine, startPosition);
                }
                if (this._isDigit(c)) {
                    return this._makeToken(TOKEN.NUMBER, this._readNumber(), startColumn, startLine, startPosition);
                }
                tok = this._makeToken(TOKEN.ILLEGAL, c, startColumn, startLine, startPosition);
                this._advance();
                return tok;
        }
    }

    // B"H - Rectified _isLetter to include all non-ASCII chars (e.g. ಠ)
	_isLetter(c) { 
        return (c >= 'a' && c <= 'z') || 
               (c >= 'A' && c <= 'Z') || 
               c === '_' || c === '$' || 
               c >= '\u0080'; // Accept extended unicode
    }

    // B"H - Rectified _isIdentifierChar to include Backslash
	_isIdentifierChar(c) { 
        return c !== null && (this._isLetter(c) || this._isDigit(c) || c === '\\'); 
    }

    // B"H 
	_readTemplatePart(isResuming = false, startPosition) {
        const p = this.position;
        while (this.ch !== null) {
            if (this.ch === '`') {
                const literal = this.source.slice(p, this.position);
                this._advance();
                return this._makeToken(TOKEN.TEMPLATE_TAIL || 'TEMPLATE_TAIL', literal, undefined, undefined, startPosition);
            }
            if (this.ch === '$' && this._peek() === '{') {
                const literal = this.source.slice(p, this.position);
                this._advance(); // Consume '$'
                this._advance(); // Consume '{'
                this.templateStack.push(true);
                
                // TIKKUN: Push a new context level (1) for the new interpolation.
                this.braceNestingStack.push(1);
                
                const type = isResuming ? (TOKEN.TEMPLATE_MIDDLE || 'TEMPLATE_MIDDLE') : (TOKEN.TEMPLATE_HEAD || 'TEMPLATE_HEAD');
                return this._makeToken(type, literal, undefined, undefined, startPosition);
            }
            if (this.ch === '\\') {
                this._advance(); 
                if (this.ch === null) break;
            }
            this._advance();
        }
        return this._makeToken(TOKEN.ILLEGAL, 'Unterminated template literal', undefined, undefined, startPosition);
    }

    // B"H - Rectified _makeToken
	_makeToken(type, literal, startColumn, startLine, startPosition) {
		this._guard();
		const col = startColumn ?? this.column - (literal?.length || (this.ch === null ? 0 : 1));
		const line = startLine || this.line;
		
		return {
			type,
			literal,
			line: line,
			column: col,
			hasLineTerminatorBefore: this.hasLineTerminatorBefore,
            // Use the explicitly passed startPosition if available.
            // If not (fallback), calculate it from the end.
			startIndex: startPosition !== undefined ? startPosition : (this.position - (literal?.length || 0))
		};
	}

	_readIdentifier() {
		const p = this.position;
		while (this.ch !== null && this._isIdentifierChar(this.ch)) {
			this._advance();
		}
		return this.source.slice(p, this.position);
	}

	// B"H
// In Lexer.js, replace the _readNumber method with this one.
// This version adds support for numeric separators (e.g., 1_000_000)
// to the existing logic for different number types.
_readNumber() {
    const p = this.position;
    // Handle hex (0x), binary (0b), and octal (0o) literals
    if (this.ch === '0' && this._peek() && 'xob'.includes(this._peek().toLowerCase())) {
        this._advance(); // consume '0'
        this._advance(); // consume 'x', 'o', or 'b'
        // Loop through hex/binary digits, allowing underscores between them.
        while (this.ch !== null) {
            if (this._isIdentifierChar(this.ch)) { // isIdentifierChar is a decent proxy for hex/binary chars
                this._advance();
                if (this.ch === '_' && this._isIdentifierChar(this._peek())) {
                    this._advance();
                }
            } else {
                break;
            }
        }
    } else {
        // Handle standard decimal numbers
        while (this.ch !== null) {
            if (this._isDigit(this.ch)) {
                this._advance();
                // A separator is only valid if it's followed by another digit.
                if (this.ch === '_' && this._isDigit(this._peek())) {
                    this._advance(); // consume the separator
                }
            } else {
                break;
            }
        }

        // Handle the decimal part
        if (this.ch === '.' && this._isDigit(this._peek())) {
            this._advance(); // consume '.'
            while (this.ch !== null) {
                if (this._isDigit(this.ch)) {
                    this._advance();
                    // Separators can also be in the fractional part.
                    if (this.ch === '_' && this._isDigit(this._peek())) {
                        this._advance(); // consume the separator
                    }
                } else {
                    break;
                }
            }
        }
    }
    
    // Handle BigInt suffix 'n'
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

	_isDigit(c) { return c >= '0' && c <= '9'; }
	
}
return Lexer;
}));