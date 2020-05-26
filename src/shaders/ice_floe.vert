precision mediump float;
attribute vec2 position;



uniform mat4 mat_mvp;
uniform mat4 mat_model_view;
uniform mat3 mat_normals;

varying vec2 tex_position;

varying vec3 v2f_normal; // normal vector in camera coordinates
varying vec3 v2f_dir_to_light; // direction to light source
varying vec3 v2f_dir_from_view; // viewing vector (from eye to vertex in view coordinates)


uniform vec4 light_position; //in camera space coordinates already
		
        
void main () {

    
    tex_position = position;


    // viewing vector (from camera to vertex in view coordinates), camera is at vec3(0, 0, 0) in cam coords
    v2f_dir_from_view =  - ( mat_model_view * vec4(position,0, 1) ).xyz  ;
    // direction to light source
    v2f_dir_to_light =  light_position.xyz - ( mat_model_view * vec4(position,0, 1) ).xyz; 
    // transform normal to camera coordinates
    v2f_normal = mat_normals * vec3(0,0,1); // apply normal transformation

    gl_Position = mat_mvp * vec4(position ,0 , 1); // apply mvp matrix

}