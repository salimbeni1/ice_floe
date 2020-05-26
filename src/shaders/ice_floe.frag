precision mediump float;

uniform vec4 color;
uniform sampler2D texureBlock;
		
void main () {

    float state = texture2D(texureBlock, vec2(0.) ).r;

	gl_FragColor = vec4(state);
}