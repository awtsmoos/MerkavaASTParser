// B"H
// --- Node Creation Utilities ---
//node_helpers.js
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
// In node_helpers.js

// Finishes an AST node by adding end location info from the *previous* token
function finishNode(node, startNodeInfo, previousToken) {
    // First, combine the objects. Now the result is guaranteed to have a .loc property.
    const combinedNode = { ...startNodeInfo, ...node };

    // Now, safely add the end location data to the existing .loc object.
    combinedNode.end = previousToken.range ? previousToken.range[1] : 0;
    combinedNode.loc.end = {
        line: previousToken.line,
        column: previousToken.column + (previousToken.literal?.length || 0),
    };
    
    // Return the fully constructed node.
    return combinedNode;
}