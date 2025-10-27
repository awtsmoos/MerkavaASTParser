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
	
	reinitialize(s) {
		this.l = new Lexer(s);
		this.errors = [];
		this.panicMode = false;
		this.prevToken = null;
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
	
	// In parser-core.js

	// --- REPLACEMENT FOR _startNode ---
	// This version ONLY uses properties that your Lexer actually creates.
	_startNode() {
	    return {
	        loc: {
	            start: {
	                line: this.currToken.line,
	                column: this.currToken.column
	            }
	        }
	    };
	}
	
	
	// --- REPLACEMENT FOR _finishNode ---
	// This is the definitive, crash-proof version.
	_finishNode(node, startNodeInfo) {
	    // 1. Combine the nodes. This guarantees `combinedNode.loc` exists.
	    const combinedNode = { ...startNodeInfo, ...node };
	
	    // 2. Get the token that ended the node. This is the last token we consumed.
	    const endToken = this.prevToken;
	
	    // 3. Safely add the end location using ONLY properties that exist.
	    if (endToken) {
	        combinedNode.loc.end = {
	            line: endToken.line,
	            // The end column is the token's starting column plus its length.
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
    
    // In parser-core.js

    _consumeSemicolon() {
        // Case 1: An explicit semicolon exists. Consume it and we are done.
        if (this._currTokenIs(TOKEN.SEMICOLON)) {
            this._advance();
            return;
        }

        // Case 2: Automatic Semicolon Insertion (ASI) rules.
        // A semicolon is automatically inserted if:
        //  - The next token is a '}'
        //  - The end of the entire file (EOF) has been reached.
        //  - There is a line terminator (newline) between the previous token and the current one.
        if (this._currTokenIs(TOKEN.RBRACE) || this._currTokenIs(TOKEN.EOF) || this.currToken.hasLineTerminatorBefore) {
            return; // ASI applies, so we do nothing and return successfully.
        }

        // If neither of the above is true, a semicolon was syntactically required.
        // This is not always an error (e.g., the end of a `for` loop part), 
        // but for a variable declaration statement, the calling function expects one.
        // The calling function will throw an error if it doesn't see a required token next.
    }
    
    
	_getPrecedence(t) { return PRECEDENCES[t.type] || PRECEDENCE.LOWEST; }

	// --- THE MAIN PARSING LOOP (REFORGED) ---
	// In parser-core.js

	// --- THE MAIN PARSING LOOP (REFORGED AND UNBREAKABLE) ---
		// --- THE MAIN PARSING LOOP (REFORGED AND UNBREAKABLE) ---
	parse() {
	    const program = {
	        type: 'Program',
	        body: [],
	        sourceType: 'module',
	        loc: { start: { line: 1, column: 0 } }
	    };
	
	    // The loop continues as long as we are not on the End-Of-File token.
	    while (!this._currTokenIs(TOKEN.EOF)) {
	        try {
	            // Attempt to parse a top-level statement or declaration.
	            const stmt = this._parseDeclaration();
	            
	            if (stmt) {
	                // If we successfully got a statement, add it to our program's body.
	                program.body.push(stmt);
	            } else if (!this.panicMode) {
	                // THIS IS THE GUARDIAN CLAUSE AGAINST FREEZING:
	                // If _parseDeclaration returned null and we are NOT in panic mode,
	                // it means we encountered a token that cannot start a statement.
	                // To prevent an infinite loop, we must throw an error to trigger
	                // recovery, which will advance the token.
	                this._error(`Unexpected token: "${this.currToken.literal}" cannot start a statement.`);
	            }
	            
	        } catch (e) {
	            // If any parsing function throws an error, we catch it here.
	            // The _synchronize function will advance the token stream until it finds
	            // a safe place to resume parsing, preventing a crash.
	            this._synchronize();
	        }
	    }
	    
	    // Finalize the Program node's location data
	    const endToken = this.prevToken || this.currToken;
	    program.loc.end = { line: endToken.line, column: endToken.column + (endToken.literal?.length || 0) };
	    return program;
	}
}