"use strict";

//const {mat2, mat4, mat3, vec4, vec3, vec2} = glMatrix;
//const deg_to_rad = Math.PI / 180;

async function main() {
	/* const in JS means the variable will not be bound to a new value, but the value can be modified (if its an object or array)
		https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const
	*/

	const debug_overlay = document.getElementById('debug-overlay');

	// We are using the REGL library to work with webGL
	// http://regl.party/api
	// https://github.com/regl-project/regl/blob/master/API.md


	// The <canvas> (HTML element for drawing graphics) was created by REGL, lets take a handle to it.
	const canvas_elem = document.getElementById("simulation");//document.getElementsByTagName('canvas')[0];


	const regl = createREGL({ // the canvas to use
		canvas: canvas_elem,
		profile: true, // if we want to measure the size of buffers/textures in memory
		extensions: ['oes_texture_float'], // enable float textures
	});


	let update_needed = true;

	{
		// Resize canvas to fit the window, but keep it square.
		function resize_canvas() {
			canvas_elem.width = window.innerWidth/2;
			canvas_elem.height = window.innerHeight;

			update_needed = true;
		}
		resize_canvas();
		window.addEventListener('resize', resize_canvas);
	}

	/*---------------------------------------------------------------
		Resource loading
	---------------------------------------------------------------*/

	// Start downloads in parallel
	const resources = {};

	[
		"noise.frag",
		"display.vert",

		"terrain.vert",
		"terrain.frag",

		"buffer_to_screen.vert",
		"buffer_to_screen.frag",

		"ice_floe.frag",
		"ice_floe.vert",

	].forEach((shader_filename) => {
		resources[`shaders/${shader_filename}`] = load_text(`./src/shaders/${shader_filename}`);
	});

	// Wait for all downloads to complete
	for (const key in resources) {
		if (resources.hasOwnProperty(key)) {
			resources[key] = await resources[key]
		}
	}

	// download images
	const resourcesImages = {};
	const imagesRes = {};

	[
		"posx.jpg",
		"negx.jpg",
		"posy.jpg",
		"negy.jpg",
		"posz.jpg",
		"negz.jpg",
	].forEach((textures_filename) => {
		imagesRes[`textures/${textures_filename}`] = new Image();
		imagesRes[`textures/${textures_filename}`].src = `../src/textures/${textures_filename}`;
		resourcesImages[`textures/${textures_filename}`] = load_texture(regl, `../src/textures/${textures_filename}` );
	});

	// Wait for all downloads to complete
	for (const key in resourcesImages) {
		if (resourcesImages.hasOwnProperty(key)) {
			resourcesImages[key] = await resourcesImages[key]
		}
	}

	// merge the 2 resources arrays
	for (const key in imagesRes) {
		resources[key] = imagesRes[key];
	}


	/*---------------------------------------------------------------
		Camera
	---------------------------------------------------------------*/
	const mat_world_to_cam = mat4.create();
	const cam_distance_base = 0.75;

	let cam_angle_z = -0.5; // in radians!
	let cam_angle_y = -0.42; // in radians!
	let cam_distance_factor = 1.;

	let cam_target = [0, 0, 0];

	function update_cam_transform() {

		let r = cam_distance_base*cam_distance_factor;
		// Example camera matrix, looking along forward-X, edit this
		const look_at = mat4.lookAt(mat4.create(),
		  [-r, 0, 0], // camera position in world coord
		  [0, 0, 0], // view target point
		  [0, 0, 1], // up vector
		);
		// Store the combined transform in mat_world_to_cam
		// mat_world_to_cam = A * B * ...
		mat4_matmul_many(mat_world_to_cam,
				 look_at,
				 mat4.fromYRotation(mat4.create(), cam_angle_y),
				 mat4.fromZRotation(mat4.create(), cam_angle_z)
				  );
	}

	update_cam_transform();

	// Prevent clicking and dragging from selecting the GUI text.
	canvas_elem.addEventListener('mousedown', (event) => { event.preventDefault(); });

	// to know if the mouse is over the canvas
	canvas_elem.mouseIsOver = false;
	canvas_elem.onmouseover = function()   {
		canvas_elem.mouseIsOver = true;
   	};
   	canvas_elem.onmouseout = function()   {
		canvas_elem.mouseIsOver = false;
   	}

	// Rotate camera position by dragging with the mouse
	window.addEventListener('mousemove', (event) => {
		// if left or middle button is pressed
		if (event.buttons & 1 || event.buttons & 4) { 
			if(canvas_elem.mouseIsOver){
				if (event.shiftKey) {
					const r = mat2.fromRotation(mat2.create(), -cam_angle_z);
					const offset = vec2.transformMat2([0, 0], [event.movementY, event.movementX], r);
					vec2.scale(offset, offset, -0.01);
					cam_target[0] += offset[0];
					cam_target[1] += offset[1];
				} else {
					cam_angle_z += event.movementX*0.005;
					cam_angle_y += -event.movementY*0.005;
				}
				update_cam_transform();
				update_needed = true;
			}
		}

	});

	window.addEventListener('wheel', (event) => {
		if(canvas_elem.mouseIsOver){
			// scroll wheel to zoom in or out
			const factor_mul_base = 1.08;
			const factor_mul = (event.deltaY > 0) ? factor_mul_base : 1./factor_mul_base;
			cam_distance_factor *= factor_mul;
			cam_distance_factor = Math.max(0.1, Math.min(cam_distance_factor, 4));
			// console.log('wheel', event.deltaY, event.deltaMode);
			event.preventDefault(); // don't scroll the page too...
			update_cam_transform();
			update_needed = true;
		}
	})

	/*---------------------------------------------------------------
		Actors
	---------------------------------------------------------------*/

	const noise_textures = init_noise(regl, resources);

	const texture_fbm = (() => {
		for(const t of noise_textures) {
			//if(t.name === 'FBM') {
			if(t.name === 'W-Eucl') {
				return t;
			}
		}
	})();

	texture_fbm.draw_texture_to_buffer({width: 96, height: 96, mouse_offset: [0, 0]});

	//const terrain_actor = init_terrain(regl, resources, texture_fbm.get_buffer());
	const ice_floe_actor = init_ice_floe(regl , resources , texture_fbm.get_buffer() );

	const environment_actor = init_environment(regl , resources , {} );

	/*
		UI
	*/
	register_keyboard_action('z', () => {
		debug_overlay.classList.toggle('hide');
	})


	function activate_preset_view() {
		cam_angle_z = -1.0;
		cam_angle_y = -0.42;
		cam_distance_factor = 1.0;
		cam_target = [0, 0, 0];
		
		update_cam_transform();
		update_needed = true;
	}
	activate_preset_view();

	document.getElementById('btn-preset-view').addEventListener('click', activate_preset_view);
	register_keyboard_action('c', activate_preset_view);

	/*---------------------------------------------------------------
		Frame render
	---------------------------------------------------------------*/
	const mat_projection = mat4.create();
	const mat_view = mat4.create();

	let light_position_world = [0.2, -0.3, 0.8, 1.0];
	//let light_position_world = [1, -1, 1., 1.0];


	window.addEventListener("keydown", function (event) {
		if(canvas_elem.mouseIsOver){
			update_needed = true;
			switch(event.key) {
				case "ArrowUp":
					light_position_world[1] += 0.05;
				break;
				case "ArrowDown":
					light_position_world[1] -= 0.05;
				break;
				case "ArrowLeft":
					light_position_world[0] -= 0.05;
				break;
				case "ArrowRight":
					light_position_world[0] += 0.05;
				break;
				default:
				// code block
			}
		}
	});

	const light_position_cam = vec4.create();

	const zoom_range = document.getElementById("zoomRange");
	zoom_range.addEventListener("change", function() {
		update_needed = true;
	});

	const reflect_range = document.getElementById("reflectRange");
	reflect_range.addEventListener("change", function() {
		update_needed = true;
	});

	regl.frame((frame) => {
		if(update_needed) {
			update_needed = false; // do this *before* running the drawing code so we don't keep updating if drawing throws an error.

			mat4.perspective(mat_projection,
				deg_to_rad * 60, // fov y
				frame.framebufferWidth / frame.framebufferHeight, // aspect ratio
				0.01, // near
				100, // far
			)

			mat4.copy(mat_view, mat_world_to_cam);

			// Calculate light position in camera frame
			vec4.transformMat4(light_position_cam, light_position_world, mat_view);

			const scene_info = {
				mat_view:        mat_view,
				mat_projection:  mat_projection,
				light_position_cam: light_position_cam,
				light_position_world : light_position_world,

				zoom : zoom_range.value * 1.0, // to cast it to float

				reflect_level : reflect_range.value * 1.0,
			}
			// Set the whole image to black
			regl.clear({color: [0.0, 0.0, 0., 1]});

			//terrain_actor.draw(scene_info);
			
			environment_actor.draw(scene_info);
			ice_floe_actor.draw(scene_info);
		}
	});
}

DOM_loaded_promise.then(main);

