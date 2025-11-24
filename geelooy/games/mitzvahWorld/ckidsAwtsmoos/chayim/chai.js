/**
 * B"H
 */


import Tzomayach from "./tzomayach.js";
import * as THREE from '/games/scripts/build/three.module.js';


import {Capsule} from '../Olam/math/Capsule.js';
import Utils from "../utils.js";

const SPHERE_RADIUS = 0.2;
const sphereGeometry = new THREE.IcosahedronGeometry( SPHERE_RADIUS, 5 );
const sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xdede8d } );
const _predictedPosition = new THREE.Vector3();
const _ground_check_ray = new THREE.Ray();
export default class Chai extends Tzomayach {
    type = "chai";
    rotationSpeed;
    distanceFromRay = 5;
    speedScale = 1.4
    defaultSpeed = 127;
    rayAnchor = null;
    _speed = this.defaultSpeed;
    _originalSpeed = this._speed;
    _movementSpeed = this._speed;
    
    jumpHeight = 12

    get speed () {
        return this._speed;
    }

    set speed(v) {
        this._speed = v;
    }

    
    /**
     * The velocity vector of the character
     * @type {THREE.Vector3}
     */
    velocity = new THREE.Vector3();  // Added velocity property

    /**
     * Collider object for the character, for detecting and handling collisions
     * @type {Capsule}
     */
    collider;
   
    cameraRotation = null;

    offset = 0;
    gotOffset = false;
    lastRotateOffset = 0;
    rotateOffset = 0;
    currentModelVector = new THREE.Vector3();
    worldDirectionVector = new THREE.Vector3();
    worldSideDirectionVector = new THREE.Vector3();
    height = 0.75;
    radius = 0.35;

    lerpTurnSpeed = 0.145;
    targetRotateOffset = 0;

    empty;
    modelMesh = null;
    dontRotateMesh = false;
     /**
     * Flag to check if the character is on the floor
     * @type {Boolean}
     */
     onFloor = true;

     // Added moving property
     moving = {
        stridingLeft: false,
        stridingRight: false,
        forward: false,
        backward: false,
        turningLeft: false,
        turningRight: false,
        running: false,
        jump: false
    };

    /**
     * @method resetMoving
     * @description resets the moving object,
     * for use in a loop to keep track of 
     * if the character is currently moving or not.
     */
    resetMoving() {
        Object.keys(this.moving)
        .forEach(q => {
            this.moving[q] = false;
        })
    }
    movingAutomatically = false;
    isDancing = false;
    chaweeyoosMap = {
        run: () => this.moving.running ? 
            "run":"walk",
        idle: this.isDancing?"dance silly" :"stand",
        walk: "walk",
        jump: "jump",
        falling: "falling",
        "right turn": "right turn",
        "left turn": "left turn",
        "dance silly": "dance silly"
    }

    /**
     * @method chaweeyoos
     * @description selects the relevant
     * chaweeyoos (animation name) from the map to
     * be used with playChaweeyoos.
     * 
     * The difference between this and just
     * selecting it is regarding those animations
     * that have multiple possibilities and probabilities.
     */
    getChaweeyoos(nm) {
        var c = this.chaweeyoosMap[nm];
        if(!c) return null;
        if(typeof(c) == "string") {
            return c;
        }

        if(typeof(c) == "function") {
            return c();
        }
        if(typeof(c) == "object") {
            /**
             * select random index based on numbers.
             */
            var ran = Math.random();
            var sum = 0;
            var entries = Object.entries(c);
            var found = null;
            entries.forEach(q => {
                if(found !== null)
                    return found;
                if(
                    typeof(q[1]/*value*/) == "number" &&
                    q[1] <= 1
                ) {
                    sum += q[1]
                }
                if(ran <= sum) {
                    found = q[0];
                }
            });
            return found;
        }
    }
    
    updateDimensionsFromModel(model) {
        if (model || !this.modelMesh) return;

        // Calculate the bounding box of the visual model
        const box = new THREE.Box3().setFromObject(model || this.modelMesh);
        const size = new THREE.Vector3();
        box.getSize(size);

        // Update the height and radius based on the model's dimensions
        // Add a small vertical buffer to the height for the camera target
        this.height = size.y * 0.95; 
        this.radius = Math.max(size.x, size.z) / 2 * 0.8;
    }

    constructor(options) {
        super(options);
        this.rotationSpeed = options
            .rotationSpeed || 2;
        this.heesHawveh = true;
	    this.rayAnchor = new THREE.Group();
        this.height = options.height || this.height;
        this.radius = options.radius || this.radius;
        // Create a new collider for the character
        this.collider = new Capsule(
            new THREE.Vector3(0, this.height, 0), 
            new THREE.Vector3(0, this.height, 0), 
            this.radius
        );

        this.collider.nivraReference = this;

        var cm = options.chaweeyoosMap;
        if(cm && typeof(cm) == "object") {
            Object.keys(cm)
            .forEach(k => {
                this.chaweeyoosMap[k] = cm[k];

            })
        }

        this.on("collider transform update", ({
            position, rotation
        }) => {
            
          //  this.collider.start.set( position.x, 0.35, position.z );
          //  this.collider.end.set( position.x, 1, position.z );
        });
        
        // Additional properties can be set here
    }

    async heescheel(olam) {
        await super.heescheel(olam);
        
        // Implement Chai-specific behavior here
    }
	
	
	async afterBriyah() {
		await super.afterBriyah(this)
        this.disanceFromRay = 5;
	}

    async ready() {
        await super.ready();
        this.olam.scene.add(this.rayAnchor);
        this.speed = this.speed;
        this.animationSpeed = this.speed;
        var solid = Utils.getSolid(this.mesh);
        if(solid) {
            solid.visible = false;
        }
        /*set mesh to half down if has collider*/
        /*not really wokring just for test*/
        this.empty = new THREE.Group();
        this.olam.scene.add(this.empty);
        var pos = this?.mesh?.position;
        if(pos) {
            if(this?.empty?.position)
                this.empty.position.copy(pos);
        }
        this.modelMesh = this?.mesh;
        this.mesh = this.empty;
        this.emptyCopy = this.empty.clone();
        this.nonRotatingEmptyForMovement = this.empty.clone();
        this.olam.scene.add(this.emptyCopy);
        this.setPosition(this.mesh.position);
        
    }

    
   
	collisions() {
        // This function's sole purpose is to resolve collisions after a movement step.
        const result = this.olam.worldOctree.capsuleIntersect(this.collider);
    
        if (result) {
            // Correct the capsule's position out of the collided object.
            this.collider.translate(result.normal.multiplyScalar(result.depth));
    
            // Adjust the character's main velocity to slide along the wall, not stick to it.
            this.velocity.addScaledVector(result.normal, -result.normal.dot(this.velocity));
        }
    }
    
    /**
     * Checks and handles collisions for the character
     * 
     * @param {number} deltaTime Time since the last frame
     */

  
    
    
    
    async calculateOffset() {
        if (!this.onFloor) {
            return;
        }
    
        // Wait for the next frame so that the collider's position is updated
        await new Promise(resolve => requestAnimationFrame(resolve));
    
        var raycaster = new THREE.Raycaster();
        raycaster.set(this.collider.start, new THREE.Vector3(0, -1, 0));
    
        var intersects = raycaster.intersectObjects(this.olam.scene.children, true);
        if (intersects.length > 0) {
            this.offset = intersects[0].distance;
        }

        
    }

    getCapsule() {
        if(!this.collider) {
            return null;
        }
        var radius = this.collider.radius;
        var height = this.collider.end.y - 
            this.collider.start.y;
        return {radius, height}
    }

    getModelVector() {
        return Utils.getForwardVector(
            this.modelMesh,
            this.currentModelVector
        );
    }
    getForwardVector() {
        return Utils.getForwardVector(
            this.nonRotatingEmptyForMovement,
            this.worldDirectionVector
        );
    }
    /**
     * Sets the position of the character's collider
     * 
     * @param {THREE.Vector3} vec3 Position to set
     */
    setPosition(vec3) {
        this.collider.start.set(
            vec3.x, 
            vec3.y + this.height / 2, 
            vec3.z
        );
        this.collider.end.set(
            vec3.x, 
            vec3.y + this.height, 
            vec3.z
        );
        this.collider.radius = this.radius;
        this.isTeleporting = true;
    }

    rays = [];
    // Function to update the ray and place/update the block on the ray
    // Function to update the ray and place/update the block on the ray
    

    spheres = [];
    updateSpheres(deltaTime) {
        this.spheres.forEach(s => {
            s.collider.center.addScaledVector( s.velocity, deltaTime );
            s.mesh.position.copy( s.collider.center );
            if(Date.now() - s.startTime > 300) {
                try {
                    s.mesh.removeFromParent();
                    var ind = this.spheres.indexOf(s);
                    if(ind > -1) {
                        this.spheres.splice(ind, 1)
                    }
                } catch(e) {

                }
            }
        })
    }

    makeSphere(letter, options={}) {
        var mesh;
        if(letter) {
            mesh = this.olam.makeNewHebrewLetter(letter, options);
        }
        if(!mesh)
            mesh = 
            new THREE.Mesh( sphereGeometry, sphereMaterial )
      
        var sphere = {
            mesh,
            collider: new THREE.Sphere( new THREE.Vector3( 0, - 100, 0 ), SPHERE_RADIUS ),
            velocity: new THREE.Vector3(),
            startTime: Date.now()
        }
        this.spheres.push(sphere);
        return sphere;
    }

    throwBall(letter, options) {
      //  console.log("HI",letter)
        var sphere = this.makeSphere(letter, options);
        
        var v = new THREE.Vector3();  
        var dir;
        if(this.olam.ayin.isFPS) {
            dir = this.olam.ayin.camera.getWorldDirection( v );
        } else {
            dir = this.currentModelVector; 
        }
    
        sphere
        .collider
        .center
        .copy( this.collider.end )
        .addScaledVector( dir/*direction*/, this.collider.radius * 1.5 );

        const impulse = 15 + 30;
        var quat = new THREE.Quaternion
        quat.setFromUnitVectors(
            new THREE.Vector3(0,0,1),
            dir.normalize()
        )

        //setting it upright
        let up = new THREE.Vector3(0, 1, 0);
        let right = new THREE.Vector3().crossVectors(up, dir).normalize();
        let adjustedUp = new THREE.Vector3().crossVectors(dir, right);

        let uprightQuaternion = new THREE.Quaternion();
        uprightQuaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), adjustedUp.normalize());

        quat.multiply(uprightQuaternion);
        sphere.mesh.quaternion.copy(quat)
        sphere.velocity.copy( dir ).multiplyScalar( impulse );


        this.olam.scene.add(sphere.mesh)
    }

    removeObject() {
        if(this.activeObject) {
            this.activeRay.mesh.remove(this.activeObject.mesh);
        }
    }

    /**
     * B"H
     * Aligns the active preview object to remain level with the world, compensating for camera pitch.
     * This is the final corrected version that ensures the block does not tilt with the camera in FPS mode.
     * @returns {void}
     */
    alignObject() {
        if (!this.activeRay || !this.activeRay.group || !this.activeObject) return;

        if (this.olam.ayin.isFPS) {
            // Get the world rotation of the parent (the camera).
            const parentWorldQuaternion = new THREE.Quaternion();
            this.activeRay.group.parent.getWorldQuaternion(parentWorldQuaternion);

            // Invert the parent's rotation.
            const inverseQuaternion = parentWorldQuaternion.invert();

            // Apply the inverse rotation to the block's quaternion. This cancels out the parent's tilt,
            // making the block's world orientation always upright.
            this.activeObject.mesh.quaternion.copy(inverseQuaternion);
        } else {
            // In 3rd person, the parent group is already level, so just ensure the block has no local rotation.
            this.activeObject.mesh.rotation.set(0, 0, 0);
        }
    }

	// This function removes the temporary preview block
removeActiveObject() {
    if (this.activeObject) {
        this.olam.scene.remove(this.activeObject.mesh);
        this.activeObject = null;
    }
} 

/**
     * B"H
     * Sets the distance of the active preview object from the player along the ray.
     * This function is called by the mouse wheel event to move the preview block closer or further away.
     * @param {number} distance - The new distance to set.
     */
    setDistanceFromRay(distance) {
        // Update the stored distance value for the Chai instance.
        this.distanceFromRay = distance;

        // If there is an active preview object, update its position.
        if (this.activeObject && this.activeObject.mesh) {
            // The preview block's position is relative to its parent (the ray group).
            // By changing its local z position, we move it along the length of the ray.
            this.activeObject.mesh.position.z = -this.distanceFromRay;
        }
    }

    
    
	/**
     * B"H
     * Finalizes the placement of the active preview object, creating a permanent, solid object in the world.
     * This method correctly calculates the preview object's world-space transform (position, rotation, scale)
     * before creating the new object, ensuring it appears exactly where the preview was.
     * It then removes the item from inventory and cleans up the temporary preview object and ray.
     * @async
     * @returns {Promise<void>} A promise that resolves when the object is placed and cleanup is complete.
     */
    async placeObject() {
        if (!this.activeObject || !this.activeObject.mesh) return;

        const golem = this.activeObject.mesh.awtsmoosGolem;
        if (!golem) {
            console.error("Could not find golem data on the temporary object to place.");
            return;
        }

        // --- CORRECTED LOGIC: Get World Transform ---
        // Ensure the world matrix of the preview object is up-to-date.
        this.activeObject.mesh.updateMatrixWorld(true);

        // Create new instances for position, rotation (quaternion), and scale.
        const worldPosition = new THREE.Vector3();
        const worldQuaternion = new THREE.Quaternion();
        const worldScale = new THREE.Vector3();

        // Decompose the world matrix to get the object's absolute position, rotation, and scale in the scene.
        this.activeObject.mesh.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);
        
        // Convert the quaternion to Euler angles for compatibility with the addObject method.
        const worldRotation = new THREE.Euler().setFromQuaternion(worldQuaternion);
        // --- END OF CORRECTION ---

        // Remove the item from inventory if applicable.
        if (this.inventory && this.selectedInventorySlot !== null) {
            const slot = this.inventory.slots[this.selectedInventorySlot];
            if (slot && (slot.item === 'Brick' || slot.className === 'Brick')) {
                this.inventory.removeItem(this.selectedInventorySlot, 1);
                if (!this.inventory.slots[this.selectedInventorySlot]) {
                    this.selectedInventorySlot = null;
                }
            }
        }

        // Create the permanent object in the world using the CORRECT world transform.
        await this.olam.addObject('Domem', {
            position: worldPosition,
            scale: worldScale,
            rotation: worldRotation, // Pass the Euler rotation
            golem,
            isSolid: true,
            interactable: true,
            name: "BH_permanent_block_" + Date.now()
        });

        // Clean up the temporary preview object and the ray.
        this.removeActiveObject();
        this.removeRay();
    }



/**
     * B"H
     * Correctly removes the entire ray group and all its children (visual cylinder, preview block) from the scene.
     * It also nullifies the activeRay reference, allowing the makeRay method to function as a toggle.
     * @returns {void}
     */
    removeRay() {
        // First, ensure any preview block is removed.
        this.removeActiveObject();

        // Guard clause: If there's no ray or ray group, there's nothing to do.
        if (!this.activeRay || !this.activeRay.group) return;

        // The ray group has a parent (either the camera or the character).
        // We remove the entire group from that parent.
        if (this.activeRay.group.parent) {
            this.activeRay.group.parent.remove(this.activeRay.group);
        }

        // Critically, set the activeRay to null. This is what allows 'Y' to work as a toggle.
        this.activeRay = null;
        
        // Clean up the event listener to prevent memory leaks.
        this.olam.remove("setFPS");
    }
   /**
     * B"H
     * Creates or removes the placement ray. This is the corrected version that properly handles
     * world vs. local coordinate spaces to ensure the ray is visible and correctly positioned.
     * It parents the ray's container group to the character's anchor and then calculates the
     * correct local position to match the desired world start position.
     * @async
     * @param {number} [length=72] - The maximum length of the ray.
     * @returns {Promise<object|undefined>} A promise that resolves with the activeRay object if created, or undefined if toggled off.
     */
    async makeRay(length = 72) {
        if (this.activeRay) {
            this.removeRay();
            return;
        }

        const rayGroup = new THREE.Group();
        
        // --- THIS IS THE CRITICAL FIX ---
        // 1. Determine the parent first.
        const parent = this.olam.ayin.isFPS ? this.olam.ayin.camera : this.emptyCopy;
        
        // 2. Add the ray group to the parent immediately.
        parent.add(rayGroup);

        // 3. Get the desired START position and DIRECTION in WORLD space.
        const worldStart = this.getRayStart();
        const worldDirection = this.getRayDirection();

        // 4. Convert the WORLD start position to the PARENT's LOCAL space.
        const localStart = parent.worldToLocal(worldStart.clone());
        
        // 5. Set the ray group's LOCAL position and LOCAL rotation.
        rayGroup.position.copy(localStart);
        rayGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), worldDirection);
        // --- END OF FIX ---

        // Create the VISUAL cylinder for the ray.
        const geometry = new THREE.CylinderGeometry(0.015, 0.015, length, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.5 });
        const cylinderMesh = new THREE.Mesh(geometry, material);
        
        // Rotate and position the cylinder *locally* within the rayGroup to point it forward.
        cylinderMesh.rotation.x = Math.PI / 2;
        cylinderMesh.position.z = -length / 2;
        rayGroup.add(cylinderMesh);

        this.activeRay = {
            group: rayGroup,
            visual: cylinderMesh,
            direction: worldDirection,
            length: length,
            start: worldStart
        };

        // Handle switching between FPS and 3rd person.
        this.olam.on("setFPS", () => {
            const hadObject = !!this.activeObject;
            this.removeRay();
            this.makeRay(length).then(() => {
                if (hadObject) this.placeBlockOnRay();
            });
        }, { once: true });

        return this.activeRay;
    }

    getRayStart() {
        return this.collider.end.clone(); // Starting position for the ray
    }
    /**
     * B"H
     * Calculates the "forward" direction for the ray in world space.
     * This corrected version ensures the vector points away from the front of the character or camera.
     * @returns {THREE.Vector3} A normalized vector representing the forward direction.
     */
    getRayDirection() {
        if (this.olam.ayin.isFPS) {
            // In FPS mode, "forward" is the direction the camera is looking.
            // We get this directly from the camera. The previous version incorrectly inverted this.
            return this.olam.ayin.camera.getWorldDirection(new THREE.Vector3());
        } else {
            // In 3rd person mode, we get the model's forward direction.
            // By starting with (0, 0, 1) instead of (0, 0, -1), we are flipping the direction
            // to correctly point out of the character's front, matching the visual orientation.
            const forward = new THREE.Vector3(0, 0, 1);
            forward.applyQuaternion(this.modelMesh.quaternion);
            forward.y = 0; // Ensure the ray is level with the ground.
            return forward.normalize();
        }
    }
    async shoot() {
        if(!this.activeRay) return;
        if (!this.activeObject) {
            await this.placeBlockOnRay();
        } else {
            this.placeObject();
        }
    }
	/**
     * B"H
     * Creates and attaches a temporary preview block to the active ray's group.
     * This version includes a call to removeActiveObject() at the beginning, which prevents
     * multiple preview blocks from appearing simultaneously.
     * @async
     * @returns {Promise<void>}
     */
    async placeBlockOnRay() {
        if (!this.activeRay || !this.activeRay.group) return;
        
        // --- THIS IS THE FIX for multiple previews ---
        this.removeActiveObject(); // Always clear any old preview first.
        // --- END OF FIX ---

        let blockDefinition;
        if (this.inventory && this.selectedInventorySlot !== null) {
            const slot = this.inventory.slots[this.selectedInventorySlot];
            if (slot && slot.className === 'Brick') {
                try {
                    const brickModule = await import('../dvarim/brick.js');
                    const BrickClass = brickModule.default;
                    const tempBrick = new BrickClass(slot);
                    blockDefinition = tempBrick.originalOptions.golem;
                } catch (e) { console.error("Could not load brick module for building", e); }
            }
        }
        if (!blockDefinition) {
            blockDefinition = this?.olam?.vars?.defaultBlock || {
                guf: { BoxGeometry: [1, 1, 1] },
                toyr: { MeshLambertMaterial: { color: "blue" } }
            };
        }

        const mesh = await this.olam.generateThreeJsMesh(blockDefinition);
        if (!mesh) return;
        
        mesh.awtsmoosGolem = blockDefinition;
        this.activeObject = { mesh };

        this.activeObject.mesh.position.z = -this.distanceFromRay;
        this.activeRay.group.add(this.activeObject.mesh);
        
        // This will align the newly created block.
        this.alignObject();
    }
    
    




    resetJump = false;
    jumped = false;

    fallingFrames = 0
    heesHawvoos(dt) {
	// Clamp deltaTime to prevent physics explosions.
	const deltaTime = Math.min(dt, 0.1);

	super.heesHawvoos(deltaTime);
	if (this.isTeleporting) {
		this.isTeleporting = false;
		return;
	}

	// --- 1. PRE-MOVEMENT GROUND CHECK (Your original code) ---
	const steepSlopeAngle = Math.cos(THREE.MathUtils.degToRad(50));
	_ground_check_ray.origin.copy(this.collider.start);
	_ground_check_ray.direction.set(0, -1, 0);
	const groundHit = this.olam.worldOctree.rayIntersect(_ground_check_ray);
	this.onFloor = groundHit && groundHit.normal.y > steepSlopeAngle && groundHit.distance <= this.radius + 0.25;


	// --- 2. GATHER USER INPUT & APPLY FORCES (Your original code) ---
	let damping = Math.exp(-20 * deltaTime) - 1;
	if (!this.onFloor) {
		this.velocity.y -= this.olam.GRAVITY * deltaTime;
		const airDamping = damping * 0.1;
		this.velocity.x += this.velocity.x * airDamping;
		this.velocity.z += this.velocity.z * airDamping;
	}
	else {
		this.velocity.addScaledVector(this.velocity, damping);
	}

	var speedDelta = deltaTime * (this.onFloor ? (this.speed * this.speedScale) : 8);
	if (!this.moving.running) {
		speedDelta *= 0.5;
	}

	let combinedVector = new THREE.Vector3();
	var isWalking = false; // We will use this variable later for the slope fix
	var isWalkingForOrBack = false;
	var isWalkingForward = false;
	var isWalkingBack = false;
	var isTurning = false;
	var velocityAddAmounts = [];
	if (this.moving.forward || this.movingAutomatically) {
		isWalking = true;
		isWalkingForOrBack = true;
		isWalkingForward = true;
		velocityAddAmounts.push([this.getForwardVector(), speedDelta]);
		this.targetRotateOffset = 0;
	}
	else if (this.moving.backward) {
		isWalking = true;
		isWalkingForOrBack = true;
		isWalkingBack = true;
		velocityAddAmounts.push([this.getForwardVector(), -speedDelta]);
		this.targetRotateOffset = -Math.PI;
	}
	if (this.moving.stridingLeft) {
		isWalking = true;
		velocityAddAmounts.push([Utils.getSideVector(this.nonRotatingEmptyForMovement, this.worldSideDirectionVector), -speedDelta]);
		this.targetRotateOffset = Math.PI / 2;
		if (isWalkingForward) {
			this.targetRotateOffset -= Math.PI / 4
		}
		else if (isWalkingBack) {
			this.targetRotateOffset += Math.PI / 4
		}
	}
	else if (this.moving.stridingRight) {
		isWalking = true;
		velocityAddAmounts.push([Utils.getSideVector(this.nonRotatingEmptyForMovement, this.worldSideDirectionVector), speedDelta]);
		this.targetRotateOffset = -Math.PI / 2;
		if (isWalkingForward) {
			this.targetRotateOffset += Math.PI / 4
		}
		else if (isWalkingBack) {
			this.targetRotateOffset -= Math.PI / 4
		}
	}

	velocityAddAmounts.forEach(q => {
		combinedVector.add(q[0].clone()
			.multiplyScalar(q[1]));
	});
	let totalMagnitude = combinedVector.length();
	let maxMagnitude = Math.abs(speedDelta);
	let scalingFactor = (totalMagnitude > maxMagnitude) ? (maxMagnitude / totalMagnitude) : 1;
	combinedVector.multiplyScalar(scalingFactor);

	this.velocity.x += combinedVector.x;
	this.velocity.z += combinedVector.z;


	// --- 3. JUMP LOGIC ---
	if (this.onFloor && this.moving.jump) {
		this.jumped = true;
		this.velocity.y = this.jumpHeight;
		if (!this.didJump) {
			this.didJump = true;
			this.ayshPeula("jumped", this)
		}
	}
	else {
		if (this.didJump) {
			this.didJump = false;
		}
	}
    


	// --- 4. SUB-STEPPED MOVEMENT & COLLISION (Your original code) ---
	const deltaPosition = this.velocity.clone()
		.multiplyScalar(deltaTime);
	this.olam.worldOctree?.update?.(this.collider.end, this.velocity);

	const capsule = this.collider;
	const numSteps = Math.ceil(deltaPosition.length() / (capsule.radius * 0.5));

	if (numSteps > 1) {
		const stepDelta = deltaPosition.clone()
			.divideScalar(numSteps);
		for (let i = 0; i < numSteps; i++) {
			capsule.translate(stepDelta);
			this.collisions();
		}
	}
	else {
		capsule.translate(deltaPosition);
		this.collisions();
	}
	// After all movement, we do a final check to stick to the ground.
	const finalGroundHit = this.olam.worldOctree.rayIntersect(_ground_check_ray);
	this.onFloor = finalGroundHit && finalGroundHit.normal.y > steepSlopeAngle && finalGroundHit.distance <= this.radius + 0.25;

	if (this.onFloor && this.velocity.y <= 0) {

		// --- POSITIONAL CORRECTION FIRST ---
		// First, fix any penetration. This is more robust than the old snapping.
		// It calculates how deep we are inside the ground and pushes us out along the slope's normal.
		const penetrationDepth = this.radius - finalGroundHit.distance;
		if (penetrationDepth > 0) {
			this.collider.translate(finalGroundHit.normal.clone().multiplyScalar(penetrationDepth));
		}

		// --- VELOCITY CORRECTION SECOND ---
		// Now that position is correct, we can safely calculate the velocity for the next frame.
		this.velocity.projectOnPlane(finalGroundHit.normal);

		// If not moving, apply friction to STICK to the slope.
		if (!isWalking && !this.moving.jump) {
			this.velocity.x = 0;
			this.velocity.z = 0;
		}
		
		// Ensure vertical velocity is zeroed out after corrections.
		this.velocity.y = 0;
	}


	// --- 6. ANIMATION LOGIC (Your original code, untouched) ---
	var rotationSpeed = this.rotationSpeed * deltaTime
	if (this.moving.turningLeft) {
		if (!isWalking && this.onFloor) {
			this.playChaweeyoos(this.getChaweeyoos("left turn"));
			isTurning = true;
		}
		this.rotation.y += rotationSpeed;
		this.ayshPeula("rotate", this.rotation.y);
	}
	else if (this.moving.turningRight) {
		if (!isWalking && this.onFloor) {
			this.playChaweeyoos(this.getChaweeyoos("right turn"));
			isTurning = true;
		}
		this.rotation.y -= rotationSpeed;
		this.ayshPeula("rotate", this.rotation.y);
	}

	if (this.onFloor) {
		if (this.jumped && !this.moving.jump) {
			this.jumped = false;
			if (!this.hitFloor) {
				this.hitFloor = true;
				this.ayshPeula("hit floor", this)
			}
		}
		if (isWalking) {
			this.playChaweeyoos(this.getChaweeyoos("run"));
			if (!this.startedWalking) {
				this.startedWalking = true;
				this.ayshPeula("started walking", this)
			}
		}
		else if (!isTurning) {
			this.playChaweeyoos(this.getChaweeyoos("idle"));
		}
		if (!isWalking) {
			if (this.startedWalking) {
				this.startedWalking = false;
				this.ayshPeula("stopped walking", this)
			}
		}
		this.fallingFrames = 0;
	}
	else {
		if (this.startedWalking) {
			this.startedWalking = false;
			this.ayshPeula("stopped walking", this)
		}
		if (this.velocity.y > 0 && this.jumped) {
			this.fallingFrames = 0;
			this.playChaweeyoos(this.getChaweeyoos("jump"), {
				loop: false
			});
		}
		else if (this.jumped && this.velocity.y < -9) {
			this.playChaweeyoos(this.getChaweeyoos("falling"));
			this.fallingFrames = 0;
		}
		else if (!this.jumped && this.velocity.y < -3) {
			if (++this.fallingFrames > 14) {
				this.playChaweeyoos(this.getChaweeyoos("falling"));
			}
		}
	}

	// --- 7. MESH UPDATES (Your original code, untouched) ---
	this.mesh.position.copy(this.collider.start);
	this.mesh.position.y -= this.radius;
	this.mesh.rotation.y = this.rotation.y;
	if (this?.emptyCopy?.rotation) this.emptyCopy.rotation.copy(this.mesh.rotation);
	if (this?.nonRotatingEmptyForMovement?.rotation) this.nonRotatingEmptyForMovement.rotation.copy(this.mesh.rotation);

	let angularDistance = this.targetRotateOffset - this.rotateOffset;
	if (angularDistance > Math.PI) {
		angularDistance -= 2 * Math.PI;
	}
	else if (angularDistance < -Math.PI) {
		angularDistance += 2 * Math.PI;
	}
	if (Math.abs(angularDistance - Math.PI) < 0.01) {
		angularDistance = -Math.PI;
	}
	this.rotateOffset += angularDistance * this.lerpTurnSpeed;
	if (this.rotateOffset > Math.PI) {
		this.rotateOffset -= 2 * Math.PI;
	}
	else if (this.rotateOffset < -Math.PI) {
		this.rotateOffset += 2 * Math.PI;
	}

	this.modelMesh.rotation.y = this.rotation.y + this.rotateOffset;
	if (this.lastRotateOffset !== this.rotateOffset) {
		this.ayshPeula("rotate", this.modelMesh.rotation.y);
		this.lastRotateOffset = this.rotateOffset;
	}

	this.modelMesh.position.copy(this.mesh.position);
	this.emptyCopy.position.copy(this.mesh.position);
	this.nonRotatingEmptyForMovement.position.copy(this.mesh.position);
	this.emptyCopy.rotation.copy(this.modelMesh.rotation);



	if (this.activeRay && this.olam.ayin.isFPS) {
	        const camera = this.olam.ayin.camera;
	        this.rayAnchor.position.copy(camera.position);
	
	        // We only want the horizontal (Y-axis) rotation from the camera.
	        // We create a temporary Euler angle to isolate it, preventing the anchor from tilting.
	        const cameraEuler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
	        this.rayAnchor.rotation.y = cameraEuler.y;
	    }
    // This was the call you correctly pointed out I had removed. It is preserved here.
	this.updateSpheres(deltaTime);
	if (this.activeObject) {
	        this.alignObject();
	    }
	if (isNaN(this.mesh.position.x) || isNaN(this.mesh.position.y) || isNaN(this.mesh.position.z)) {
		console.error("!!! FATAL: Player position became NaN. Physics explosion detected!", {
			pos: this.mesh.position,
			vel: this.velocity
		});
		throw new Error("Player position is NaN!");
	}
}
}
