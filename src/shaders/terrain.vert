attribute vec3 position;
attribute vec3 normal;

// Vertex shader computes eye-space vertex position and normals + world-space height
varying vec3 v2f_normal; // normal vector in camera coordinates
varying vec3 v2f_dir_to_light; // direction to light source
varying vec3 v2f_dir_from_view; // viewing vector (from eye to vertex in view coordinates)
varying float v2f_height;

uniform mat4 mat_mvp;
uniform mat4 mat_model_view;
uniform mat3 mat_normals; // mat3 not 4, because normals are only rotated and not translated

uniform vec4 light_position; //in camera space coordinates already
void main()
{
    v2f_height = position.z;
    vec4 position_v4 = vec4(position, 1);

    /** TODO 3.2:
	Setup all outgoing variables so that you can compute in the fragmend shader
    the phong lighting. You will need to setup all the uniforms listed above, before you
    can start coding this shader.

    Hint: Compute the vertex position, normal and light_position in eye space.
    Hint: Write the final vertex position to gl_Position
    */

    // viewing vector (from camera to vertex in view coordinates), camera is at vec3(0, 0, 0) in cam coords
    v2f_dir_from_view =  - ( mat_model_view * vec4(position, 1) ).xyz  ; // TODO calculate
    // direction to light source
    v2f_dir_to_light =  light_position.xyz - ( mat_model_view * vec4(position, 1) ).xyz; // TODO calculate
    // transform normal to camera coordinates
    v2f_normal = mat_normals * normal; // TODO apply normal transformation

    gl_Position = mat_mvp * vec4(position, 1); // TODO apply mvp matrix
}

