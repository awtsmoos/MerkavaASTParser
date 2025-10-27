// B"H
// --- The Merkabah Ha'Gadol: The Indestructible Emanation (Core) [FINAL REFORGED VERSION] ---
class MerkabahParser {
	constructor(s) {
		this.l = new Lexer(s);
		this.errors = [];
		this.panicMode = false;

		this.prevToken = null;
		this.currToken = null;
		this.peekToken = null;

		this.prefixParseFns = {};
		this.infixParseFns = {};

        // This is the robust way to initialize the parser.
        // We do not rely on a clever _advance() method for startup.
        // We simply pull two tokens to fill our `currToken` and `peekToken` registers.
        // This guarantees `currToken` is NEVER null.
		this.currToken = this.l.nextToken();
		this.peekToken = this.l.nextToken();
	}

	_advance() {
		this.prevToken = this.currToken;
		this.currToken = this.peekToken;
		this.peekToken = this.l.nextToken();
	}

	_currTokenIs(t) { return this.currToken.type === t; }
	_peekTokenIs(t) { return this.peekToken.type === t; }

    // --- REBUILT HELPER FUNCTIONS ---
	_startNode() {
		// This captures the starting point of a potential node.
		return {
			start: this.currToken.position, // Use absolute position
			loc: { start: { line: this.currToken.line, column: this.currToken.column } }
		};
	}

	/***********************************************************************
	*
	*  --- CRITICAL FIX: THE CORRECTED _finishNode FUNCTION ---
	*
	*  This version prevents the crash by first creating a complete node
	*  object and then adding the end location data to it. This ensures
	*  the `loc` property always exists before we try to modify it.
	*
	***********************************************************************/
	_finishNode(node, startNodeInfo) {
		// First, create the combined node object.
		// It will now correctly have `start`, `loc: { start: ... }`, and other properties.
		const combinedNode = { ...startNodeInfo, ...node };
	
		// The end of a node is the end of the last token that was part of it.
		// `this.prevToken` correctly holds this last token after `_advance()` is called.
		const endToken = this.prevToken;
	
		// Now that `combinedNode.loc` is guaranteed to exist, we can safely
		// add the end location properties to it.
		if (endToken) {
			combinedNode.end = endToken.position + (endToken.literal?.length || 0);
			combinedNode.loc.end = {
				line: endToken.line,
				column: endToken.column + (endToken.literal?.length || 0)
			};
		}
	
		return combinedNode;
	}
    // --- END REBUILT HELPERS ---

	_error(m) {
        // Corrected error handling. A thrown exception will no longer cause an infinite loop.
		if (this.panicMode) return;
		this.panicMode = true;
        const msg = `[Shevirah] ${m} on line ${this.currToken.line}:${this.currToken.column}. Got token ${this.currToken.type} ("${this.currToken.literal}")`;
		this.errors.push(msg);
        // We now throw a controlled error that the main parse loop can catch,
        // preventing the interpreter from halting.
        throw new Error(msg);
	}

	_expect(t) {
		if (this._currTokenIs(t)) {
			this._advance();
			return true;
		}
        // Use the new error system to throw
		this._error(`Expected next token to be ${t}`);
        return false; // Will not be reached due to throw, but good practice
	}

	_synchronize() {
		this.panicMode = false;
		while (!this._currTokenIs(TOKEN.EOF)) {
			// A semicolon almost always ends a statement. Good place to recover.
			if (this.prevToken && this.prevToken.type === TOKEN.SEMICOLON) return;

			// These tokens are likely the start of a new, valid statement.
			switch (this.currToken.type) {
				case TOKEN.CLASS:
				case TOKEN.FUNCTION:
				case TOKEN.VAR:
				case TOKEN.CONST:
				case TOKEN.LET:
				case TOKEN.IF:
				case TOKEN.FOR:
				case TOKEN.WHILE:
				case TOKEN.RETURN:
				case TOKEN.IMPORT:
				case TOKEN.EXPORT:
				case TOKEN.SWITCH:
					return;
			}
			this._advance();
		}
	}
    
    _consumeSemicolon() {
        if (this._currTokenIs(TOKEN.SEMICOLON)) {
            this._advance();
            return;
        }
        // Automatic Semicolon Insertion rules are simplified here.
        if (this.currToken.hasLineTerminatorBefore || this._currTokenIs(TOKEN.RBRACE) || this._currTokenIs(TOKEN.EOF)) {
            return;
        }
    }

	_getPrecedence(t) { return PRECEDENCES[t.type] || PRECEDENCE.LOWEST; }

	// --- THE MAIN PARSING LOOP (REFORGED) ---
	parse() {
	    const program = {
            type: 'Program',
            body: [],
            sourceType: 'module',
            loc: { start: { line: 1, column: 0 } } // Placeholder start
        };
	
	    while (!this._currTokenIs(TOKEN.EOF)) {
	        try {
	            const stmt = this._parseDeclaration();
	            if (stmt) {
	                program.body.push(stmt);
	            } 
	            else if (!this.panicMode) {
                    // If parsing returns nothing but we're not in panic,
                    // it's a stray token. Advance to prevent infinite loops.
	                this._advance();
	            }
	        } catch (e) {
                // This catch block is ESSENTIAL.
                // It catches the controlled error from _error() or any other REAL runtime error.
	            if (!this.errors.includes(e.message)) {
                   this.errors.push(`[FATAL] Parser crashed: ${e.message}. Attempting recovery.`);
                }
                this._synchronize();
	        }
	    }
        // Finalize the Program node's location data
        const endToken = this.prevToken || this.currToken;
        program.loc.end = { line: endToken.line, column: endToken.column };
	    return program;
	}
}