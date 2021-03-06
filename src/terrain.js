"use strict";

class BufferData {

	constructor(regl, buffer) {
		this.width = buffer.width;
		this.height = buffer.height;
		this.data = regl.read({framebuffer: buffer});

		// this can read both float and uint8 buffers
		if (this.data instanceof Uint8Array) {
			// uint8 array is in range 0...255
			this.scale = 1./255.;
		} else {
			this.scale = 1.;
		}

	}

	get(x, y) {
		x = Math.min(Math.max(x, 0), this.width - 1);
		y = Math.min(Math.max(y, 0), this.height - 1);

		return this.data[x + y*this.width << 2] * this.scale;
	}
}

function terrain_build_mesh(height_map) {
	const grid_width = height_map.width;
	const grid_height = height_map.height;

	const WATER_LEVEL = -0.03125;

	const vertices = [];
	const normals = [];
	const faces = [];

	let max_ver_x = -10;
	let max_ver_y = -10;

	let min_ver_x = 10;
	let min_ver_y = 10;

	

	// Map a 2D grid index (x, y) into a 1D index into the output vertex array.
	function xy_to_v_index(x, y) {
		return x + y*grid_width;
	}

	for(let gy = 0; gy < grid_height; gy++) {
		for(let gx = 0; gx < grid_width; gx++) {
			const idx = xy_to_v_index(gx, gy);
			let elevation = height_map.get(gx, gy) - 0.5 // we put the value between 0...1 so that it could be stored in a non-float texture on older browsers/GLES3, the -0.5 brings it back to -0.5 ... 0.5;

			// normal as finite difference of the height map
			// dz/dx = (h(x+dx) - h(x-dx)) / (2 dx)
			normals[idx] = vec3.normalize([0, 0, 0], [
				-(height_map.get(gx+1, gy) - height_map.get(gx-1, gy)) / (2. / grid_width),
				-(height_map.get(gx, gy+1) - height_map.get(gx, gy-1)) / (2. / grid_height),
				1.,
			]);

			
			/*
			The XY coordinates are calculated so that the full grid covers the square [-0.5, 0.5]^2 in the XY plane.
			*/

			const x = (gx / grid_width) -0.5;
			const y = (gy / grid_height) -0.5;
			const z = Math.max(elevation , WATER_LEVEL);

			if(elevation < WATER_LEVEL){
				normals[idx] = [0,0,1];
			}
			vertices[idx] = [x,y,z];
		}
	}

	for(let gy = 0; gy < grid_height - 1; gy++) {
		for(let gx = 0; gx < grid_width - 1; gx++) {
			/*
			Triangulate the grid cell whose lower lefthand corner is grid index (gx, gy).
			You will need to create two triangles to fill each square.
			*/
			const va = xy_to_v_index(gx, gy);
			const vb = xy_to_v_index(gx+1, gy);
			const vc = xy_to_v_index(gx, gy+1);
			const vd = xy_to_v_index(gx+1, gy+1);

			faces.push([va,vb,vc]);
			faces.push([vb,vd,vc]);
			// faces.push([v1, v2, v3]); // adds a triangle on vertex indices v1, v2, v3
		}
	}

	return {
		vertex_positions: vertices,
		vertex_normals: normals,
		faces: faces,
	};
}


function init_ice_floe(regl , resources , buffer ){

	const pipeline_draw_ice_floe = regl({
		attributes: {
			position: [
				[-1, 1],
				[-1, -1],
				[1, 1],

				[1, -1],
				[-1, -1],
				[1, 1],
			  ]
		},
		uniforms: {

			envmap: regl.prop('cube'),
			mat_mvp: regl.prop('mat_mvp'),
			mat_model_view: regl.prop('mat_model_view'),
			mat_normals: regl.prop('mat_normals'),

			light_position: regl.prop('light_position'),
			camera_position: regl.prop('camera_position'),
			light_position_world : regl.prop('light_position_world'),

			zoom : regl.prop("zoom"),

			reflect_level : regl.prop("reflect_level"),

			refract_level : regl.prop("refract_level"),


			snow_spread : regl.prop("snow_spread"),
			snow_level : regl.prop("snow_level"),


			texureBlock: buffer,

			color: [1, 0, 0, 1]
		},


		vert: resources['shaders/noise.frag'] +' '
			+ resources['shaders/ice_floe.vert'],
		frag: resources['shaders/noise.frag'] +' '
			+ resources['shaders/ice_floe.frag'],

		count : 6

	});


	class IveFloeActor {
		constructor() {

			this.cube = regl.cube(
				resources["textures/posx.jpg"], resources["textures/negx.jpg"],
				resources["textures/posy.jpg"], resources["textures/negy.jpg"],
				resources["textures/posz.jpg"], resources["textures/negz.jpg"],)

			this.mat_mvp = mat4.create();
			this.mat_model_view = mat4.create();
			this.mat_normals = mat3.create();
			this.mat_model_to_world = mat4.create();
			this.mat_camera_to_world = mat4.create();
			this.camera_position = vec3.create(); // world coorinates
			this.light_position_world = vec3.create();
			
		}

		draw({mat_projection, mat_view, light_position_cam , light_position_world , zoom , reflect_level , refract_level , snow_spread , snow_level}){

			mat4_matmul_many(this.mat_model_view, mat_view, this.mat_model_to_world);
			mat4_matmul_many(this.mat_mvp, mat_projection, this.mat_model_view);
	
			mat3.fromMat4(this.mat_normals, this.mat_model_view);
			mat3.transpose(this.mat_normals, this.mat_normals);
			mat3.invert(this.mat_normals, this.mat_normals);

			mat4.invert(this.mat_camera_to_world , mat_view);
			mat4.getTranslation(this.camera_position, this.mat_camera_to_world);
			
			pipeline_draw_ice_floe({
				mat_mvp: this.mat_mvp,
				mat_model_view: this.mat_model_view,
				mat_normals: this.mat_normals,
				camera_position : this.camera_position,
		
				light_position: light_position_cam,
				light_position_world : light_position_world,
				cube : this.cube,
				zoom : zoom,
				reflect_level :reflect_level,
				refract_level : refract_level,

				snow_spread : snow_spread,
				snow_level : snow_level,
			});
		}

	}

	return new IveFloeActor();
}



function init_environment(regl , resources , buffer){

	const pipeline_draw_environment = regl({

		frag: `
  			precision mediump float;
			uniform samplerCube envmap;
			varying vec3 reflectDir;
			void main () {
				gl_FragColor = textureCube(envmap, reflectDir);
			}`,

		vert: `
			precision mediump float;
			attribute vec2 position;
			uniform mat4 view;
			varying vec3 reflectDir;
			void main() {
				reflectDir = (view * vec4(position, 1, 0)).xyz;
				gl_Position = vec4(position, 0, 1);
			}`,


		uniforms: {
			envmap: regl.prop('cube'),
			view: //regl.prop('mat_mvp'),
				mat4.lookAt([],
				[30 * Math.cos(3.14), 2.5, 30 * Math.sin(3.14)],
				[0, 2.5, 0],
				[0, 1, 0]),
		},

		attributes: {
			position: [
			  -4, -4,
			  -4, 4,
			  8, 0]
		  },
		  depth: {
			mask: false,
			enable: false
		  },
		  count: 3

	});

	class EnvironmentActor {
		constructor() {

			this.mat_mvp = mat4.create();
			this.mat_model_view = mat4.create();
			this.mat_normals = mat3.create();
			this.mat_model_to_world = mat4.create();

			this.cube = regl.cube(
				resources["textures/posx.jpg"], resources["textures/negx.jpg"],
				resources["textures/posy.jpg"], resources["textures/negy.jpg"],
				resources["textures/posz.jpg"], resources["textures/negz.jpg"],)

		}

		draw({mat_projection, mat_view, light_position_cam}) {
			mat4_matmul_many(this.mat_model_view, mat_view, this.mat_model_to_world);
			mat4_matmul_many(this.mat_mvp, mat_projection, this.mat_model_view);
	
			mat3.fromMat4(this.mat_normals, this.mat_model_view);
			mat3.transpose(this.mat_normals, this.mat_normals);
			mat3.invert(this.mat_normals, this.mat_normals);

			pipeline_draw_environment({
				cube : this.cube,
				mat_mvp: this.mat_mvp,
				});
		}

	}

	return new EnvironmentActor();


}

function init_terrain(regl, resources, height_map_buffer) {

	const terrain_mesh = terrain_build_mesh(new BufferData(regl, height_map_buffer));

	const pipeline_draw_terrain = regl({
		attributes: {
			position: terrain_mesh.vertex_positions,
			normal: terrain_mesh.vertex_normals,
		},
		uniforms: {
			mat_mvp: regl.prop('mat_mvp'),
			mat_model_view: regl.prop('mat_model_view'),
			mat_normals: regl.prop('mat_normals'),

			light_position: regl.prop('light_position'),
		},
		elements: terrain_mesh.faces,

		vert: resources['shaders/terrain.vert'],
		frag: resources['shaders/terrain.frag'],
	});


	class TerrainActor {
		constructor() {
			this.mat_mvp = mat4.create();
			this.mat_model_view = mat4.create();
			this.mat_normals = mat3.create();
			this.mat_model_to_world = mat4.create();
		}

		draw({mat_projection, mat_view, light_position_cam}) {
			mat4_matmul_many(this.mat_model_view, mat_view, this.mat_model_to_world);
			mat4_matmul_many(this.mat_mvp, mat_projection, this.mat_model_view);
	
			mat3.fromMat4(this.mat_normals, this.mat_model_view);
			mat3.transpose(this.mat_normals, this.mat_normals);
			mat3.invert(this.mat_normals, this.mat_normals);
	
			pipeline_draw_terrain({
				mat_mvp: this.mat_mvp,
				mat_model_view: this.mat_model_view,
				mat_normals: this.mat_normals,
		
				light_position: light_position_cam,
			});
		}
	}

	return new TerrainActor();
}

