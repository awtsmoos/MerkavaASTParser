/**
 * B"H
 * @file tool.js
 * Represents a tool or weapon (like a Hammer) in the game.
 */

import Tzomayach from "../chayim/tzomayach.js";
import hammerSVG from "../../icons/items/hammer.js";

export default class Tool extends Tzomayach {
    type = "tool";
    
    // Convert the SVG string to a Data URI so CSS 'background-image' can use it immediately
    static icon = "data:image/svg+xml;base64," + btoa(hammerSVG);
    
    static itemName = "Tool";
    static description = "A tool used to interact with the world.";
    static stackSize = 1; // Tools don't usually stack

    constructor(op) {
        // If a tool is dropped in the world, it needs a physical shape (golem).
        // If none is provided, give it a generic one.
        if (!op.golem) {
            op.golem = {
                guf: { BoxGeometry: [0.5, 0.5, 1.5] }, // Long handle-like shape
                toyr: { MeshLambertMaterial: { color: "#FFD700" } } // Gold color
            };
        }
        
        super(op);
    }
}