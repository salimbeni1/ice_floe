precision mediump float;
attribute vec2 position;



uniform mat4 mat_mvp;
uniform mat4 mat_model_view;
uniform mat3 mat_normals;

varying mat3 mat_normals_copy;

uniform vec3 camera_position;


varying vec2 tex_position;
varying vec2 tex_position_parallax;

varying vec3 v2f_normal; // normal vector in camera coordinates
varying vec3 v2f_dir_to_light; // direction to light source
varying vec3 v2f_dir_from_view; // viewing vector (from eye to vertex in view coordinates)


uniform vec4 light_position; //in camera space coordinates already
uniform vec4 light_position_world; 

uniform float zoom;
		
        
void main () {


    
    tex_position = position;

    mat_normals_copy = mat_normals;

    /*
    // for parallax
    tex_position_parallax = 
        position - camera_position.xy 
        //* tex_distorted_borders(position).r // to make the OFFSET depend on the texture
        * 0.2; // OFFSET

    */
    
    // for shadows
    tex_position_parallax = position + normalize(light_position_world).xy * 0.05 * zoom;


    // viewing vector (from camera to vertex in view coordinates), camera is at vec3(0, 0, 0) in cam coords
    v2f_dir_from_view =  - ( mat_model_view * vec4(position,0, 1) ).xyz  ;
    // direction to light source
    v2f_dir_to_light =  light_position.xyz - ( mat_model_view * vec4(position,0, 1) ).xyz; 
    // transform normal to camera coordinates
    // transform normal vector to range [-1,1] with '* 2.0 - 1.0' 
    //v2f_normal = mat_normals * ( tex_normal_map(position) * 2.0 - 1.0 ); // apply normal transformation
    //v2f_normal = mat_normals * vec3( 0., 0., 1. );
    
    gl_Position = mat_mvp * vec4(position ,0 , 1); // apply mvp matrix

}