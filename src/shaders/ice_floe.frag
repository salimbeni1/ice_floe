precision mediump float;

uniform vec4 color;
uniform sampler2D texureBlock;

uniform samplerCube envmap;

varying mat3 mat_normals_copy;

varying vec2 tex_position;
varying vec2 tex_position_parallax;

varying vec3 v2f_dir_to_light; // direction to light source
varying vec3 v2f_dir_from_view; // viewing vector (from eye to vertex in view coordinates)

varying float zoom ; 




		
void main () {


    

    vec3 normal = ( mat_normals_copy * ( tex_normal_map( tex_position , zoom ) * 2.0 - 1.0 ) );

    vec3 reflectDir =  reflect( normalize(-v2f_dir_to_light) , normalize(normal) ) ;

    vec3  light_color = vec3(.5, 1., 1.);

    vec3 material_color = tex_distorted_worley_euclidian( tex_position_parallax , zoom );

    vec3 ambient_light = 0.2 * light_color * material_color ;

    vec3 diffuse_light = light_color  * material_color * max( dot( normalize(normal) , normalize(v2f_dir_to_light) ) , 0.0 ) ;

    float shininess = 20.;

    vec3 specularLight = light_color * material_color * pow( max( dot( normalize(reflectDir) , normalize(v2f_dir_from_view) ) , 0.0) , shininess ) ;

    vec3 color = ambient_light + diffuse_light + specularLight;


    if(distort_snow(tex_position , zoom ,  .2 , 0.5).r > 0.1 ){
        color = distort_snow(tex_position , zoom ,  .2 , 0.5);
    }



    

    
    vec4 env_reflect_color =  textureCube(envmap, normalize(reflectDir));

    vec4 env_refract_color =  textureCube(envmap , normalize(refract(normalize(-v2f_dir_to_light) , normalize(normal) , 1./1.33) ));

    color = mix( 
        mix(vec4(color, 1.) , env_reflect_color , 
        0.04 // how much reflected
        ) , 
        env_refract_color , 
        0.0 // how much refracted
        ).rgb;


    gl_FragColor = vec4(color, 1.);
    
}