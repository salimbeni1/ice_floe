"use strict";


function init_noise(regl, resources) {

	// shader implementing all noise functions
	const noise_library_code = resources['shaders/noise.frag'];

	// Safari (at least older versions of it) does not support reading float buffers...
	var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
	
	// shared buffer to which the texture are rendered
	const noise_buffer = regl.framebuffer({
		width: 768,
		height: 768,
		colorFormat: 'rgba',
		colorType: isSafari ? 'uint8' : 'float',
		stencil: false,
		depth: false,
		mag: 'linear',
		min: 'linear', 
	});

	const mesh_quad_2d = {
		position: [
			// 4 vertices with 2 coordinates each
			[-1, -1],
			[1, -1],
			[1, 1],
			[-1, 1],
		],
		faces: [
			[0, 1, 2], // top right
			[0, 2, 3], // bottom left
		],
	}

	const pipeline_generate_texture = regl({
		attributes: {position: mesh_quad_2d.position},
		elements: mesh_quad_2d.faces,
		
		uniforms: {
			viewer_position: regl.prop('viewer_position'),
			viewer_scale:    regl.prop('viewer_scale'),
		},
				
		vert: resources['shaders/display.vert'],
		frag: regl.prop('shader_frag'),

		framebuffer: noise_buffer,
	});

	const pipeline_draw_buffer_to_screen = regl({
		attributes: {position: mesh_quad_2d.position},
		elements: mesh_quad_2d.faces,
		uniforms: {
			buffer_to_draw: noise_buffer,
		},
		vert: resources['shaders/buffer_to_screen.vert'],
		frag: resources['shaders/buffer_to_screen.frag'],
	});

	class NoiseTexture {
		constructor(name, shader_func_name, hidden) {
			this.name = name;
			this.shader_func_name = shader_func_name;
			this.shader_frag = this.generate_frag_shader();
			this.hidden = hidden;
		}

		generate_frag_shader() {
			return `${noise_library_code}
					// --------------
			
					varying vec2 v2f_tex_coords;

					void main() {
						vec3 color = ${this.shader_func_name}(v2f_tex_coords);
						gl_FragColor = vec4(color, 1.0);
					} 
					`;
		}



		get_buffer() {
			return noise_buffer;
		}

		draw_texture_to_buffer({mouse_offset = [0, 0], zoom_factor = 1.0, width = 768, height = 768}) {
			// adjust the buffer size to the desired value
			if (noise_buffer.width != width || noise_buffer.height != height) {
				noise_buffer.resize(width, height);
			}

			regl.clear({
				framebuffer: noise_buffer,
				color: [0, 0, 0, 1], 
			});

			pipeline_generate_texture({
				shader_frag: this.shader_frag,
				viewer_position: vec2.negate([0, 0], mouse_offset),
				viewer_scale: zoom_factor,
			});
			
			return noise_buffer;
		}

		draw_buffer_to_screen() {
			pipeline_draw_buffer_to_screen();
		}
	}

	const noise_textures = [

		new NoiseTexture('Euclidian Worley noise ', 'to_print2'),
		new NoiseTexture('Manathan Worley noise ', 'to_print3'),
		new NoiseTexture('Normal map ', 'print_normal1'),
		new NoiseTexture('Grain ', 'tex_normal_grain'),
		new NoiseTexture('Texture ', 'normal_grain'),
		new NoiseTexture('Texture ', 'normal_grain'),
		
	];

	return noise_textures;
}