precision mediump float;

uniform vec4 color;
uniform sampler2D texureBlock;

uniform float zoom;

uniform samplerCube envmap;

varying mat3 mat_normals_copy;

varying vec2 tex_position;
varying vec2 tex_position_parallax;

varying vec3 v2f_dir_to_light; // direction to light source
varying vec3 v2f_dir_from_view; // viewing vector (from eye to vertex in view coordinates)

uniform float reflect_level;
uniform float refract_level;


uniform float snow_spread;
uniform float snow_level;



		
void main () {
    
    vec3 normal = ( mat_normals_copy * 
        (( tex_normal_grain( tex_position ) * 2.0 - 1.0 ) + ( tex_normal_map( tex_position , zoom ) * 2.0 - 1.0 ) ));

    vec3 reflectDir =  reflect( normalize(-v2f_dir_to_light) , normalize(normal) ) ;

    vec3  light_color = vec3(.5, 1., 1.);

    vec3 material_color = tex_distorted_worley_euclidian( tex_position_parallax , zoom );

    vec3 ambient_light = 0.2 * light_color * material_color ;

    vec3 diffuse_light = light_color  * material_color * max( dot( normalize(normal) , normalize(v2f_dir_to_light) ) , 0.0 ) ;

    float shininess = 20.;

    vec3 specularLight = light_color * material_color * pow( max( dot( normalize(reflectDir) , normalize(v2f_dir_from_view) ) , 0.0) , shininess ) ;

    vec3 color = ambient_light + diffuse_light + specularLight;




    
    vec3 normal2 = ( mat_normals_copy * vec3(0,0,1) );

    vec3 reflectDir2 =  reflect( normalize(-v2f_dir_to_light) , normalize(normal2) ) ;

    vec3 diffuse_light2 = light_color  * material_color * max( dot( normalize(normal2) , normalize(v2f_dir_to_light) ) , 0.0 ) ;

    vec3 specularLight2 = light_color * material_color * pow( max( dot( normalize(reflectDir2) , normalize(v2f_dir_from_view) ) , 0.0) , shininess ) ;

    vec3 color2 = ambient_light + diffuse_light2 + specularLight2;

    // to make the cracks look transparent
    color = mix(color , color2 , 0.5);





    
    vec4 env_reflect_color =  textureCube(envmap, normalize(reflectDir));

    vec4 env_refract_color =  textureCube(envmap , normalize(refract(normalize(-v2f_dir_to_light) , normalize(normal) , 1./1.33) )); // refract angle

    color = mix( 
        mix(vec4(color, 1.) , env_reflect_color , 
        reflect_level // how much reflected
        ) , 
        env_refract_color , 
        refract_level // how much refracted
        ).rgb;


    vec3 snow = distort_snow(tex_position , zoom , snow_spread , snow_level );
    if(snow.r > 0. ){
        color = mix( color , snow + 0.3  , smoothstep( 0.0 , 0.5 , snow.r+ 0.3)  ) ;
    }

    


    gl_FragColor = vec4(color, 1.);
    
}