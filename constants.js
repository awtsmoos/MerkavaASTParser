// B"H
// --- The Sefirot and the Aleph-Bet of Syntax ---

 const TOKEN = {
    EOF: 'EOF', ILLEGAL: 'ILLEGAL',

    // Identifiers & Literals
    IDENT: 'IDENT', NUMBER: 'NUMBER', STRING: 'STRING',
    TEMPLATE_HEAD: 'TEMPLATE_HEAD', TEMPLATE_MIDDLE: 'TEMPLATE_MIDDLE', TEMPLATE_TAIL: 'TEMPLATE_TAIL',

    // Operators
    ASSIGN: '=', PLUS: '+', MINUS: '-', BANG: '!', ASTERISK: '*', SLASH: '/',
    LT: '<', GT: '>', EQ: '==', NOT_EQ: '!=', EQ_STRICT: '===', NOT_EQ_STRICT: '!==',
    LTE: '<=', GTE: '>=',

    // Delimiters
    COMMA: ',', SEMICOLON: ';', COLON: ':', DOT: '.', QUESTION: '?',
    LPAREN: '(', RPAREN: ')', LBRACE: '{', RBRACE: '}', LBRACKET: '[', RBRACKET: ']',

    // Keywords
    FUNCTION: 'FUNCTION', LET: 'LET', CONST: 'CONST', VAR: 'VAR', RETURN: 'RETURN',
    IF: 'IF', ELSE: 'ELSE', FOR: 'FOR', WHILE: 'WHILE', DO: 'DO',
    SWITCH: 'SWITCH', CASE: 'CASE', DEFAULT: 'DEFAULT', BREAK: 'BREAK', CONTINUE: 'CONTINUE',
    TRUE: 'TRUE', FALSE: 'FALSE', NULL: 'NULL', THIS: 'THIS',
    CLASS: 'CLASS', EXTENDS: 'EXTENDS', SUPER: 'SUPER',
    NEW: 'NEW', IMPORT: 'IMPORT', EXPORT: 'EXPORT', FROM: 'FROM', AS: 'AS',
    ASYNC: 'ASYNC', AWAIT: 'AWAIT', YIELD: 'YIELD',
    TYPEOF: 'TYPEOF', INSTANCEOF: 'INSTANCEOF', IN: 'IN',
    TRY: 'TRY', CATCH: 'CATCH', FINALLY: 'FINALLY', THROW: 'THROW',
    
    // Multi-character
    ARROW: '=>', INCREMENT: '++', DECREMENT: '--', EXPONENT: '**',
    AND: '&&', OR: '||', NULLISH_COALESCING: '??', OPTIONAL_CHAINING: '?.',
    DOTDOTDOT: '...',

    // Assignments
    PLUS_ASSIGN: '+=', MINUS_ASSIGN: '-=', ASTERISK_ASSIGN: '*=', SLASH_ASSIGN: '/=',
    EXPONENT_ASSIGN: '**=', NULLISH_ASSIGN: '??=',
};

 const KEYWORDS = {
    'function': TOKEN.FUNCTION, 'let': TOKEN.LET, 'const': TOKEN.CONST, 'var': TOKEN.VAR,
    'return': TOKEN.RETURN, 'if': TOKEN.IF, 'else': TOKEN.ELSE, 'for': TOKEN.FOR,
    'while': TOKEN.WHILE, 'do': TOKEN.DO, 'switch': TOKEN.SWITCH, 'case': TOKEN.CASE,
    'default': TOKEN.DEFAULT, 'break': TOKEN.BREAK, 'continue': TOKEN.CONTINUE,
    'true': TOKEN.TRUE, 'false': TOKEN.FALSE, 'null': TOKEN.NULL, 'this': TOKEN.THIS,
    'class': TOKEN.CLASS, 'extends': TOKEN.EXTENDS, 'super': TOKEN.SUPER, 'new': TOKEN.NEW,
    'import': TOKEN.IMPORT, 'export': TOKEN.EXPORT, 'from': TOKEN.FROM, 'as': TOKEN.AS,
    'async': TOKEN.ASYNC, 'await': TOKEN.AWAIT, 'yield': TOKEN.YIELD,
    'typeof': TOKEN.TYPEOF, 'instanceof': TOKEN.INSTANCEOF, 'in': TOKEN.IN,
    'try': TOKEN.TRY, 'catch': TOKEN.CATCH, 'finally': TOKEN.FINALLY, 'throw': TOKEN.THROW,
};

 const PRECEDENCE = {
    LOWEST: 0,
    SEQUENCE: 1,      // ,
    ASSIGNMENT: 2,    // =
    CONDITIONAL: 3,   // ?:
    NULLISH: 4,       // ??
    OR: 5,            // ||
    AND: 6,           // &&
    EQUALITY: 7,      // ==, !=, ===, !==
    COMPARISON: 8,    // <, >, <=, >=, in, instanceof
    SUM: 9,           // +, -
    PRODUCT: 10,      // *, /, %
    EXPONENT: 11,     // **
    PREFIX: 12,       // -X, !X, typeof X
    POSTFIX: 13,      // X++
    CALL: 14,         // myFunction(X)
    MEMBER: 15,       // object.prop
    NEW: 16,          // new
};

 const PRECEDENCES = {
    [TOKEN.ASSIGN]: PRECEDENCE.ASSIGNMENT,
    [TOKEN.PLUS_ASSIGN]: PRECEDENCE.ASSIGNMENT,
    [TOKEN.MINUS_ASSIGN]: PRECEDENCE.ASSIGNMENT,
    [TOKEN.QUESTION]: PRECEDENCE.CONDITIONAL,
    [TOKEN.NULLISH_COALESCING]: PRECEDENCE.NULLISH,
    [TOKEN.OR]: PRECEDENCE.OR,
    [TOKEN.AND]: PRECEDENCE.AND,
    [TOKEN.EQ]: PRECEDENCE.EQUALITY, [TOKEN.EQ_STRICT]: PRECEDENCE.EQUALITY,
    [TOKEN.NOT_EQ]: PRECEDENCE.EQUALITY, [TOKEN.NOT_EQ_STRICT]: PRECEDENCE.EQUALITY,
    [TOKEN.LT]: PRECEDENCE.COMPARISON, [TOKEN.GT]: PRECEDENCE.COMPARISON,
    [TOKEN.LTE]: PRECEDENCE.COMPARISON, [TOKEN.GTE]: PRECEDENCE.COMPARISON,
    [TOKEN.IN]: PRECEDENCE.COMPARISON, [TOKEN.INSTANCEOF]: PRECEDENCE.COMPARISON,
    [TOKEN.PLUS]: PRECEDENCE.SUM, [TOKEN.MINUS]: PRECEDENCE.SUM,
    [TOKEN.SLASH]: PRECEDENCE.PRODUCT, [TOKEN.ASTERISK]: PRECEDENCE.PRODUCT,
    [TOKEN.EXPONENT]: PRECEDENCE.EXPONENT,
    [TOKEN.LPAREN]: PRECEDENCE.CALL,
    [TOKEN.LBRACKET]: PRECEDENCE.MEMBER,
    [TOKEN.DOT]: PRECEDENCE.MEMBER,
    [TOKEN.OPTIONAL_CHAINING]: PRECEDENCE.MEMBER,
};