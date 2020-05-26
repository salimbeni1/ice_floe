precision mediump float;
attribute vec2 position;



uniform mat4 mat_mvp;
uniform mat4 mat_model_view;
uniform mat3 mat_normals;
		
        
void main () {

    

    gl_Position = mat_mvp * vec4(position ,0 , 1); // apply mvp matrix

}