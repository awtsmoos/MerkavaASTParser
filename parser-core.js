// B"H
// In parser-core.js -- FINAL, ROBUST LOADER
(function(root, factory) {
	if (typeof module ===
		'object' && module.exports
		) {
		module.exports = factory();
	} else {
		root.MerkavahParserPromise =
			factory();
		root.MerkavahParserPromise
			.then(Parser => {
				root.MerkavahParser =
					Parser;
			})
			.catch(err => {
				console.error(
					"Merkava Parser failed to load:",
					err)
			});
	}
}(typeof self !== 'undefined' ?
	self : this,
	function() {

		const getScriptPath =
	() => {
			// This function robustly finds the full path to this script.
			try {
				// The standard, preferred way.
				if (document
					.currentScript
					) {
					return document
						.currentScript
						.src;
				}
				// A fallback for environments where document.currentScript is unreliable.
				// It creates a temporary error and parses the stack trace to find the script URL.
				throw new Error();
			} catch (e) {
				const
					stackLine =
					e.stack
					.split('\n')
					.find(
						line =>
						line
						.includes(
							'.js'
							));
				if (stackLine) {
					const
						match =
						stackLine
						.match(
							/(https?|file):\/\/[^\s):]+/
							);
					if (match) {
						return match[
							0
							];
					}
				}
			}
			return './'; // Ultimate fallback.
		};

		const isNode =
			typeof process !==
			'undefined' && process
			.versions != null &&
			process.versions.node !=
			null;

		const initialize =
	async () => {
				let basePath =
					'';
				if (!isNode) {
					const
						fullPath =
						getScriptPath();
					basePath =
						fullPath
						.substring(
							0,
							fullPath
							.lastIndexOf(
								'/'
								) +
							1);
				}

				const
					loadScript =
					(url) => {
						const
							fullUrl =
							basePath +
							url;
						if (
							isNode) {
							return Promise
								.resolve(
									require(
										fullUrl
										)
									);
						}
						return new Promise(
							(resolve,
								reject
								) => {
								if (typeof importScripts ===
									'function'
									) { // Worker context
									try {
										importScripts
											(
												fullUrl);
										resolve
											();
									} catch (
										e
										) {
										reject
											(
												e);
									}
								} else { // Browser context
									const
										script =
										document
										.createElement(
											'script'
											);
									script
										.src =
										fullUrl;
									script
										.onload =
										resolve;
									script
										.onerror =
										reject;
									document
										.head
										.appendChild(
											script
											);
								}
							}
							);
					};

				// --- LOAD DEPENDENCIES AND EXTENSIONS ---
				// This order is critical and now works correctly.
				await loadScript
					(
						'constants.js');
				await loadScript
					(
					'Lexer.js');

				// Temporarily define a placeholder on the global scope so extensions can find it.
				self.MerkavahParser =
					class MerkavahParser {};

				await loadScript
					(
						'parser-expressions.js');
				await loadScript
					(
						'parser-statements.js');
				await loadScript
					(
						'parser-declarations.js');

				// --- DEFINE THE REAL CLASS ---
				// It will overwrite the placeholder, but the prototype extensions will be preserved.
				const {
					Lexer,
					TOKEN,
					PRECEDENCES,
					PRECEDENCE
				} = self;
				class MerkavahParser {
					constructor(
						s) {
						this.l =
							new Lexer(
								s
								);
						this
					.errors = [];
						this.panicMode =
							false;
						this.prevToken =
							null;
						this.currToken =
							null;
						this.peekToken =
							null;
						this
						.prefixParseFns = {};
						this
						.infixParseFns = {};
						this.recursionDepth =
							0;
						this.maxRecursionDepth =
							1500;
						this.parsingTemplateExpression =
							false;
						this.currToken =
							this
							.l
							.nextToken();
						this.peekToken =
							this
							.l
							.nextToken();
					}
					_advance() {
						this.prevToken =
							this
							.currToken;
						this.currToken =
							this
							.peekToken;
						this.peekToken =
							this
							.l
							.nextToken();
					}
					_peekTokenIs
						(t) {
							return this
								.peekToken
								.type ===
								t;
						}
					_currTokenIs
						(t) {
							return this
								.currToken
								.type ===
								t;
						}
					_startNode
				() {
						return {
							loc: {
								start: {
									line: this
										.currToken
										.line,
									column: this
										.currToken
										.column
								}
							}
						};
					}
					_finishNode(
						node,
						startNodeInfo
						) {
						const
							combinedNode = {
								...
								startNodeInfo,
								...
								node
							};
						const
							endToken =
							this
							.prevToken;
						if (
							endToken) {
							combinedNode
								.loc
								.end = {
									line: endToken
										.line,
									column: endToken
										.column +
										(endToken
											.literal
											?.length ||
											0
											)
								};
						}
						return combinedNode;
					}
					_error(m) {
						if (this
							.panicMode
							)
							return;
						this.panicMode =
							true;
						const
							msg =
							`[Shevirah] ${m} on line ${this.currToken.line}:${this.currToken.column}. Got token ${this.currToken.type} ("${this.currToken.literal}")`;
						this.errors
							.push(
								msg
								);
						throw new Error(
							msg
							);
					}
					_expect(t) {
						if (this
							._currTokenIs(
								t
								)
							) {
							this
						._advance();
							return true;
						}
						this._error(
							`Expected next token to be ${t}`
							);
					}
					_synchronize
						() {
							throw new Error(
								`PARSER PANIC: Entering error recovery mode. The initial error was thrown while processing the token: Type=${this.currToken.type}, Literal="${this.currToken.literal}"`
								);
						}
					_consumeSemicolon
						() {
							if (this
								._currTokenIs(
									TOKEN
									.SEMICOLON
									)
								) {
								this
							._advance();
								return;
							}
							if (this
								._currTokenIs(
									TOKEN
									.RBRACE
									) ||
								this
								._currTokenIs(
									TOKEN
									.EOF
									) ||
								this
								.currToken
								.hasLineTerminatorBefore
								) {
								return;
							}
						}
					_getPrecedence
						(t) {
							return PRECEDENCES[
									t
									.type
									] ||
								PRECEDENCE
								.LOWEST;
						}
					parse() {
						const
							program = {
								type: 'Program',
								body: [],
								sourceType: 'module',
								loc: {
									start: {
										line: 1,
										column: 0
									}
								}
							};
						while (
							!
							this
							._currTokenIs(
								TOKEN
								.EOF
								)
							) {
							const
								positionBeforeParse =
								this
								.l
								.position;
							try {
								const
									stmt =
									this
									._parseDeclaration();
								if (
									stmt) {
									program
										.body
										.push(
											stmt
											);
								} else if (
									!
									this
									.panicMode
									) {
									this._error(
										`Unexpected token: "${this.currToken.literal}" cannot start a statement.`
										);
									this
								._advance();
								}
							} catch (
								e
								) {
								console
									.error(
										"CAUGHT INITIAL ERROR:",
										e
										);
								this
							._synchronize();
							}
							if (this
								.l
								.position ===
								positionBeforeParse &&
								!
								this
								._currTokenIs(
									TOKEN
									.EOF
									)
								) {
								throw new Error(
									`PARSER HALTED: Infinite loop detected. Main loop failed to advance.`
									);
							}
						}
						const
							endToken =
							this
							.prevToken ||
							this
							.currToken;
						program
							.loc
							.end = {
								line: endToken
									.line,
								column: endToken
									.column +
									(endToken
										.literal
										?.length ||
										0
										)
							};
						program
							.comments =
							this
							.l
							.comments;
						return program;
					}
				}

				// Re-assign the global to be the real, fully constructed class.
				self.MerkavahParser =
					MerkavahParser;

				return self
					.MerkavahParser;
			};

		return initialize();
	}));