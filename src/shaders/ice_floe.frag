precision mediump float;

uniform vec4 color;
uniform sampler2D texureBlock;

uniform samplerCube envmap;

varying vec2 tex_position;

varying vec3 v2f_normal; // normal vector in camera coordinates
varying vec3 v2f_dir_to_light; // direction to light source
varying vec3 v2f_dir_from_view; // viewing vector (from eye to vertex in view coordinates)




		
void main () {

    vec3  light_color = vec3(.5, 1., 1.);

    vec3 material_color = tex_worley_euclidian(tex_position);


    vec3 ambient_light = 0.2 * light_color * material_color ;

    vec3 diffuse_light = light_color  * material_color * max( dot( normalize(v2f_normal) , normalize(v2f_dir_to_light) ) , 0.0 ) ;

    vec3 reflectDir =  reflect( normalize(-v2f_dir_to_light) , normalize(v2f_normal) ) ;

    float shininess = 20.;

    vec3 specularLight = light_color * material_color * pow( max( dot( normalize(reflectDir) , normalize(v2f_dir_from_view) ) , 0.0) , shininess ) ;

    vec3 color = ambient_light + diffuse_light + specularLight;

    gl_FragColor = vec4(color, 1.);



    /*
    vec4 env_reflect_color =  textureCube(envmap, normalize(reflectDir));

    vec4 env_refract_color =  textureCube(envmap , normalize(refract(normalize(-v2f_dir_to_light) , normalize(v2f_normal) , 1./1.33) ));

    gl_FragColor = mix( 
        mix(vec4(color, 1.) , env_reflect_color , 0.06) , 
        env_refract_color , 
        0.1); // output: RGBA in 0..1 range
    */
}