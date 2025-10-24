// B"H
// --- Node Creation Utilities ---

// Creates a starting point for a new AST node
function startNode(currentToken) {
    return {
        start: currentToken.range ? currentToken.range[0] : 0,
        loc: {
            start: {
                line: currentToken.line,
                column: currentToken.column,
            },
        },
    };
}

// Finishes an AST node by adding end location info from the *previous* token
function finishNode(node, startNodeInfo, previousToken) {
    node.end = previousToken.range ? previousToken.range[1] : 0;
    node.loc.end = {
        line: previousToken.line,
        column: previousToken.column + (previousToken.literal?.length || 0),
    };
    // Combine the start info with the new node properties
    return { ...startNodeInfo, ...node };
}