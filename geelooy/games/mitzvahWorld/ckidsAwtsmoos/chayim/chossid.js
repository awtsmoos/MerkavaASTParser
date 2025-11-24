/**
 * B"H
 * Player = Chossid
 */

import * as THREE from '/games/scripts/build/three.module.js';
import InventoryManager from '../systems/InventoryManager.js';

/**
 * Chossid is a subclass of Medabeir representing the player's character.
 * 
 * @class
 * @extends Medabeir
 */
import Medabeir from './medabeir.js';


var ACTION_TOGGLE = "KeyB";
var ACTION_SELECT = "Enter";

var CAMERA_PAN_UP = "KeyR";
var CAMERA_PAN_DOWN = "KeyF";

var CAMERA_FPS_TOGGLE = "KeyT";

var pressedFps = false;
var pressedToggle = false;
var pressedSelect = false;


var isInEditorMode = false;
export default class Chossid extends Medabeir {
    /**
     * The type of the character (Chossid)
     * @type {String}
     */
    type = "chossid";

   

    rayLength = 50;
    
    /**
     * varructs a new Chossid (character).
     * 
     * @param {Object} options The options for this Chossid.
     * @param {string} options.name The name of this Chossid.
     * @param {string} options.path The path to the glTF model for this Chossid.
     * @param {Object} options.position The initial position of this Chossid.
     * @param {Array<Object>} options.inventory The initial inventory of this Chossid.
     */
    _optionsSpeed = null;


    /**
     * @property approachedEntities
     * when the player gets close
     * to an NPC that he can 
     * talk to it is added
     * in this array
     * until he walks away from it
     * 
     */
    approachedEntities = [];
    constructor(options) {
        super(options);
        this.inventory = new InventoryManager(this);
        this.selectedInventorySlot = 0;
        
        this.rotateOffset = 0;
        this.optionsSpeed = options.speed;
    }
    

    
    /**
     * Controls character movement based on key input
     * 
     * @param {number} deltaTime Time since the last frame
     */
    controls( deltaTime ) {
        
        this.resetMoving();
        //this.rotateOffset  = 0;

        if(this.olam.showingImportantMessage )
            return;

        if(this.olam.inputs.RUNNING) {
            this.moving.running = true;
        }
        // Forward and Backward controls
        
        if ( this.olam.inputs.FORWARD ) {
            this.moving.forward = true;
        }

        if ( this.olam.inputs.BACKWARD ) {
            this.moving.backward = true;
        }

        if ( this.olam.inputs.DOWN ) {
            this.moving.down = true;
        }

        if ( this.olam.inputs.UP ) {
            this.moving.up = true;
        }

        
        // Rotation controls
        if ( 
            this.olam.inputs.LEFT_ROTATE
        ) {
            
            this.moving.turningLeft = true;
        }

        if ( 
            this.olam.inputs.RIGHT_ROTATE
        ) {
            
            this.moving.turningRight = true;
        }

        // Striding controls
        if ( this.olam.inputs.LEFT_STRIDE ) {
            this.moving.stridingLeft = true;
        }

        if ( this.olam.inputs.RIGHT_STRIDE ) {
            this.moving.stridingRight = true;
        }

        
        if(this.olam.inputs.JUMP) {
            this.moving.jump = true;
        }
        
        
        
        



        
        this.cameraControls();
        this.movingSounds()
    }

    movingSounds() {
        
    }


    cameraControls() {
        if(
            this.olam
            .keyStates[CAMERA_PAN_UP]
        ) {
            this.olam.ayin
            .panUp();
        } else if(
            this.olam.keyStates[CAMERA_PAN_DOWN]
        ) {
            this.olam.ayin
            .panDown();

        }

        

    }
    
    dialogueControls(e/*key pressed*/) {
        var k = e.key;
      //  console.log("Pressed!", k, this.interactingWith)
        if(!this.interactingWith) {
            return;
        }


        // Check if the key pressed is a number between 1 and 9
        if (k >= 1 && k <= 9) {
            //console.log(`Number ${k} was pressed.`);
            // Return the number as an integer
            var num = parseInt(k, 10);
            this.interactingWith?.toggleToOption?.(num - 1);
        }
    }

    async selectIntersected() {
        if(!this.intersected) {
            return;
        }
        if(this.selected) {
            return;
        }
        this.intersected.ob.material.emissive.setHex( 
            // intersected.currentHex
            0xdd0022
        );
        this.selected = this.intersected;
        this.olam.htmlAction({
            shaym: "block selector menu",
            methods: {
                classList: {
                    remove: "hidden"
                }
            }
        })
        var opts = await this.olam.ayshPeula(
            "ui event", 
            "block selector menu", 
            {
                awtsmoosOptions: {
                    lol:5
                }
            }
        )
        console.log("got options",opts)
    }

    removeIntersected() {
        if(!this.selected && !this.intersected) {
            return;
        }
        this.intersected.niv.isHoveredOver = false;
        this.olam.hoveredNivra = null;

        this.intersected
        .ob.material.emissive.setHex( 
            // intersected.currentHex
            0x00
            );
        this.intersected= null;
        this.selected = null;
        this.olam.htmlAction({
            shaym: "block selector menu",
            methods: {
                classList: {
                    add: ["hidden"]
                }
            }
        })
      /*  if(!nohtml)
            this.olam.htmlAction({
                selector: "body",
                properties: {
                    style: {
                        cursor: "revert"
                    }
                }
            })*/
    }

    toggleSelectedMenu() {
        if(!this.currentSelectOption) {
            this.currentSelectOption = "Grab";
        }
        this.olam.ayshPeula(
            "ui event", 
            "menu item "+this.currentSelectOption,
            {
                awtsmoosHighlight: "yes"
            }
        )
    }
    selectMenuOption() {
        this.olam.ayshPeula(
            "ui event", 
            "menu item "+this.currentSelectOption,
            {
                awtsmoosHighlight: "yes"
            }
        )
    }
    /**
     * Starts the Chossid. Sets the initial position and sets this Chossid as the target of the camera
     * 
     * @param {Olam} olam The world in which this Chossid is being started.
     */
    async heescheel(olam) {
        await super.heescheel(olam);
        this.setPosition(new THREE.Vector3());
        
        
        
        this.on("you approached", npc => {
            var exists = this.approachedEntities
                .indexOf(
                    npc
                );

            if(exists < 0) {
                this
                .approachedEntities
                .push(npc);
            }
        });

        var removeNpc = npc => {
            if(!npc) return;
            var ind = this.approachedEntities.indexOf(npc);
            if(ind > -1) {
                this.approachedEntities.splice(ind, 1);
            }
        }

        this.on("the dialogue was closed from", npc => {
            removeNpc(npc)
        })
        
        this.on("you moved away from", npc => {
            removeNpc(npc)
        });

        
        var isOtherview = false;
        olam.on("keypressed", async k => {
            this.ayshPeula("keypressed", k);
            this.dialogueControls(k);
            switch(k.code) {
                case "KeyR":
                this.rotatePreview();
                break;
                
                case "KeyQ":
                this.resetPreviewRotation();
                break;
                
                case "NumLock":
                    this.movingAutomatically = 
                    !this.movingAutomatically
                break;
                case "KeyY":
                    await this.makeRay(this.rayLength);
                    if(!this.activeRay) {
                        this.removeIntersected();
                    }
                /*if (!isOtherview) {
                    if (m?.asset?.cameras[0]) {
                        m.olam.activeCamera = m.asset.cameras[0]
                    }
                    isOtherview = true;
                } else {
                    isOtherview = false;
                    m.olam.activeCamera = null;
                }*/
                break;
                case "KeyG":
                    isInEditorMode = !isInEditorMode;
                case ACTION_TOGGLE:
                    
                    if(!this.interactingWith) {
                        
                        /**
                         * TODO toggle
                         * between 
                         * multiple NPCs
                         */
                        var npc = this.approachedEntities[0];
                        
                        if(!npc) {
                            if(!this.selected) {
                                this.shoot(); 
                            } else {
                                this.toggleSelectedMenu();
                            }
                            /*
                            this.throwBall(
                                this.olam.randomLetter(),
                                {
                                    color: 
                                    this.olam.randomColor()
                                }
                            )*/
                            return;
                        }
                        npc.ayshPeula("accepted interaction");
                        return;
                    }
                    
                    this.interactingWith.toggleOption();
                break;

                case ACTION_SELECT:
                    if(this.selected) {
                        this.selectMenuOption();
                    }
                    if(this.intersected) {
                        await this.selectIntersected();
                        return;
                    }
                    if(!this.interactingWith) {
                        
                        return;
                    }
                    await this.interactingWith.selectOption();

                break;

                case CAMERA_FPS_TOGGLE: 
                    this.olam.ayin.isFPS = 
                    !this.olam.ayin.isFPS;
                    this.olam.ayshPeula("setFPS", this.olam.ayin.isFPS)
                break;
                case "Space":
                    this.olam.ayshPeula("setInput", {
                        code: "Space"
                    });
                    
                    setTimeout(() => {
                        this.olam.ayshPeula("setInputOut", {
                            code: "Space"
                        });
                        
                        
                    },50);
                default:;
            }
        });

       

    }

    async ready(m) {
        await super.ready();
	    
        this.olam.chossid = this;
        this.olam.player = this;
        this.olam.ayin.target = this;
        
        if(this.optionsSpeed) {
            this.speed = this.optionsSpeed;
        }
        var self = this
        if (this.modelMesh) {
            this.modelMesh.traverse((child) => {
                if (child.isMesh) {
                    child.frustumCulled = false;
                   
                }
                 if(child?.name == ("body")) {
                    self.updateDimensionsFromModel(child);
                    this.olam.ayin.target = this;
	                  
	          }
                
            });
        }
        
        
    }
	
	actionList = {
        Delete(self) {
            self?.selected?.niv?.ayshPeula("sealayk");
        },
        Grab(self) {
            self?.selected?.niv?.ayshPeula("sealayk");
            self.removeIntersected();
            self.selected = null;
            self.intersected = null;
            self.removeRay()
            self.makeRay();
            self.placeBlockOnRay();
        }
    }
	async afterBriyah() {
		await super.afterBriyah(this);
		
		
	        this.olam.ayshPeula("save player position")
	        this.distanceFromRay = 5;  // Initial distance value (can be adjusted)
	        this.on("activeObjectAction", async a => {
	            console.log("action",a,this.selected)
	            if(this.selected) {
	                var act = this.actionList[a];
	                if(act) {
	                    act?.(this)
	                }
	                var dist = this?.intersected?.hit?.distance;
	                if(dist) {
	                    this.distanceFromRay = dist;
	                }
	                
	            }
	        })
	        this.olam.on("mousemove", e => {
	           /* if(!this.olam.mouseDown) {
	                if(this.olam.isLookingForSomething) {
	                    this.olam.isLookingForSomething = false
	                }
	                return;
	            }   
	            if(!this.olam.ayin.isFPS) {
	                if(this.olam.isLookingForSomething) {
	                    this.olam.isLookingForSomething = false
	                }
	                return;
	            }*/
	
	            if(!this.activeRay) {
	                if(this.olam.isLookingForSomething) {
	                    this.olam.isLookingForSomething = false
	                }
	                return;
	            }
	
	
	            //this.alignObject();
	            if(this.activeObject) {
	                if(this.olam.isLookingForSomething) {
	                    this.olam.isLookingForSomething = false
	                }
	                return;
	            }
	            if(!this.olam.isLookingForSomething) {
	                this.olam.isLookingForSomething = true
	            }
	
	            
	
	            hoverHitCheck({
	                chossid: this,
	                olam: this.olam
	            })
	        })
	        this.olam.on("wheel", ({deltaY}) => {
	            if(this.activeObject) {
	                var baseFactor = 0.003;
	        
	        // Dynamically adjust factor based on the current distance
	                var factor = baseFactor * Math.max(0.5, Math.min(2, this.distanceFromRay / 10));
	        
	                // Adjust the distance based on the wheel input
	                // Invert the direction of the scroll (positive scroll moves closer, negative scroll moves further away)
	                this.distanceFromRay += deltaY * factor; // Adjust the multiplier to control the speed of the change
	
	                // You can limit the distance to prevent it from becoming too small or too large
	                this.distanceFromRay = Math
	                    .max(1, Math.min(this.rayLength, this.distanceFromRay)); // Example limits
	                this.setDistanceFromRay(this.distanceFromRay);
	            } else {
	
	                this.olam.ayin.deltaY = deltaY;
	                
	                this.olam.ayin.zoom(deltaY)
	            }
	        })
        
	}
    async started() {
        this.iconPath = "chossid.svg";
        this.iconType = "centered"
        
        await this
        .olam?.minimap?.setMinimapItems?.([this], "chossid");
	       this.inventory.addItem({
        id: 'sparks_hammer',
        className: 'Tool', 
        name: 'Sparks Collector',
        description: 'Use this to retrieve sparks (blocks) from the world.',
        icon: '/games/mitzvahWorld/icons/items/hammer.svg' // You'll need an icon eventually
    }, 1);
	       // Add 64 standard 1x1x1 bricks
	    this.inventory.addItem({
	        id: 'brick_1x1x1',
	        className: 'Brick',
	        name: 'Standard Brick',
	        description: 'A classic 1x1x1 brick.'
	    }, 64);
	
	    // Add 32 larger 2x2x2 bricks
	    this.inventory.addItem({
	        id: 'brick_2x2x2',
	        className: 'Brick',
	        name: 'Cube Brick',
	        description: 'A large 2x2x2 brick.',
	        dimensions: { x: 2, y: 2, z: 2 }
	    }, 32);
	
	    // Add 16 long 1x1x4 bricks
	    this.inventory.addItem({
	        id: 'brick_1x1x4',
	        className: 'Brick',
	        name: 'Plank Brick',
	        description: 'A long 1x1x4 plank.',
	        dimensions: { x: 1, y: 1, z: 4 }
	    }, 16);
	    
	    // Add 16 long 1x1x4 bricks
	    this.inventory.addItem({
	        id: 'brick_1x0.5x2',
	        className: 'Brick',
	        name: 'Thin Plank Brick',
	        description: 'A long 1x0.5x2 plank, ideal for building stairs',
	        dimensions: { x: 1, y: 0.5, z: 2 }
	    }, 1024);
        
    }

    /**
     * Update function called each frame. Controls the character and handles collisions.
     * 
     * @param {number} deltaTime Time since the last frame
     */
    heesHawvoos(deltaTime) {
        if(!this.startedAll) {
            this.olam.ayshPeula("ready from chossid")
            this.startedAll = true;
        }
		if(!this.olam.isPlayingCutscene) {
            
			this.controls(deltaTime);
			
		}

        this.adjustDOF()
        this.postProcessing();
        super.heesHawvoos(deltaTime);
        
        /*
        if(typeof(this.olam.resetY) == "number")
        if(this.mesh.position.y < this.olam.resetY) {
            if(!this.teleporting) {
        
                this.teleporting = true;
                setTimeout(() => {
                    this.olam.ayshPeula('reset player position')
                    this.teleporting = false
                }, 100)
            }
        }*/
       
    }

    minimapPos = false;
    
    lastPos = new THREE.Vector3();
    postProcessing() {
        return;
        var pos = new THREE.Vector3();
        var offset;
        if(!this.lastPos.equals(this.mesh.position)) {
           pos.copy(this.mesh.position)

            var offset = new THREE.Vector3(
                pos.x, 15,
                pos.z
            )
        
            this.olam.ayshPeula("update minimap camera", ({
                position:offset,
                targetPosition:pos
            }))

            this.lastPos.copy(pos)

            this.ayshPeula("update earlier")
        }
    //    this.olam.ayshPeula("meshanehOyr", this.mesh.position)


        /**
         * minimap update
         */

        var mm =this.olam.minimap
        if(!mm) {
            return;
        }
        if(!mm.shaderPass) {
            return
        }

        var coords = //this.olam.getNormalizedMinimapCoords(
            pos
       // );
        if(!coords) return;
        this.minimapPos = coords;
        if(!this._did) {
            this._did=true;
        }
        var {x, y} = coords;  /*
            even though its checking on 
            z since its top down,
            but its returnign a vector2 which is x and y
        */
        if(typeof(x) == "number" && typeof(y) == "number")
            mm.shaderPass.uniforms.playerPos.value = coords

        var dir = this.modelMesh.rotation.y;
        mm.shaderPass.uniforms.playerRot.value = dir;
        var {x,y} = mm.shaderPass.uniforms.playerPos.value;
   
    }

    adjustDOF() {
        if(!this.olam.postprocessing) {
            return;
        }
        /*
        // Calculate distance from camera to player
        var playerDistance = this.olam.ayin.camera
            .position.distanceTo(this.mesh.position);
        
        this.olam.postprocessing
        .bokeh_uniforms[ 'focalDepth' ]
        .value = playerDistance;
*/
        
    }

    
}

async function hoverHitCheck({
    olam,
    chossid,
    nohtml = true
} = {}) {
    if(!olam.isLookingForSomething) {
        return;
    }
    
    var intersected = chossid.intersected
    var hit = olam.ayin.getHovered(
        chossid?.getRayStart(),
        chossid?.getRayDirection()
    )
        
    
    var ob = hit?.object;
    var niv = ob?.nivraAwtsmoos;
    
    
    //   console.log("HIT 1",hit,ob)
    
    
  
    
    if(niv && !niv.wasSealayked && niv.type != "chossid") {
        if(hit) {
          //  console.log("Got a hit!",hit, niv)
        }
        niv.isHoveredOver = true;
        if(intersected && intersected?.niv != niv) {

            
            chossid.removeIntersected()
        }
        if((niv.dialogue || ob.hasDialogue)) {
            const makeMessage = async ({
                tooFar=false,
                gone=false
            }={}) => {
                if(gone) {
                    if(!nohtml)
                    await olam.ayshPeula("hide label")
                    return;
                }
                var msg = "This is: " + niv.name;
                if(!niv.inRangeNivra || tooFar) {
                    msg += ".\nYou are too far away. Come closer!"
                }
                var tx = olam.achbar.x;
                var ty = olam.achbar.y;
                hoveredLabel = true;
                if(!nohtml)
                    await olam.htmlAction({
                        shaym: "minimap label",
                        properties: {
                            innerHTML:msg,
                            style: {
                                
                                transform:`translate(${tx}px, ${ty}px)`
                            }
                        },
                        
                        methods: {
                            classList: {
                                remove: "invisible"
                            }
                        }
                    })
            }
            if(!nohtml)
                await makeMessage()
            
            if(intersected?.niv != niv) {
                console.log("NIV")
                //wasApproached
                var color = 0xff0000;
                if(niv?.wasApproached) {
                    color = 0x00ff00;
                }
                

                if(!ob.material.awtsmoosifized) {
                    var nm = ob.material.clone();
                    nm.awtsmoosifized = true;
                    nm.needsUpdate = true;
                    ob.material = nm;
                    
                }

                
                
                niv.on("someone left", async () => {
                    if(!niv.isHoveredOver) return;
                    if(!ob) {
                        if(!nohtml)
                            await makeMessage({gone:true})
                        ob.material.emissive.setHex(0x00);
                        niv.clear("someone left")
                        
                    } else {
                        if(!nohtml)
                            await makeMessage({tooFar:true})
                        ob.material.emissive.setHex(0xff0000);
                        
                    }
                    
                });

            
                niv.on("was approached", async () => {
                    if(!niv.isHoveredOver) return;
                    if(ob) {
                        ob.material.emissive.setHex(0x00ff00)
                        await makeMessage()
                    } else {
                        ob.material.emissive.setHex(0x00);
                        niv.clear("was approached")
                        
                    }
                  
                    
                })
                
                
                chossid.intersected = {niv, ob, hit};
                chossid.intersected.currentHex = ob
                    .material
                    .emissive.getHex();
                ob.material.emissive.sethoveredNivraHex( color );
                olam.hoveredNivra = niv;
                if(!nohtml)
                    olam.htmlAction({
                        selector: "body",
                        properties: {
                            style: {
                                cursor: "pointer"
                            }
                        }
                    })
            }
    
        } else {
            if(intersected?.niv != niv) {
                chossid.intersected = {niv, ob, hit};
                chossid.intersected.currentHex = ob
                    .material
                    .emissive.getHex();
                ob.material.emissive.setHex(0x0000ff)
            }
        }
    } else {
     
        if(intersected) {
            
            chossid.removeIntersected()
        }
        

    }
    olam.hoveredNivra = niv;
    
}

function updateMeshOrientation() {
    const worldUp = new THREE.Vector3(0, 1, 0); // Global up direction
    const currentDirection = new THREE.Vector3();
    mesh.getWorldDirection(currentDirection);

    // Project the current direction onto the XZ plane (ignore Y-axis movement)
    currentDirection.y = 0;
    currentDirection.normalize();

    // Compute the quaternion that rotates the mesh to face this direction
    const targetQuaternion = new THREE.Quaternion();
    targetQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), currentDirection);

    // Apply the quaternion to the mesh, keeping it upright
    mesh.quaternion.copy(targetQuaternion);
}