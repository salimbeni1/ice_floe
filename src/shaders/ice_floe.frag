precision mediump float;

uniform vec4 color;
uniform sampler2D texureBlock;

varying vec2 tex_position;
		
void main () {

	gl_FragColor = texture2D(texureBlock, tex_position );
}