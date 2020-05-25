precision highp float;

// varying vec2 v2f_tex_coord;
varying vec3 v2f_normal; // normal vector in camera coordinates
varying vec3 v2f_dir_to_light; // direction to light source
varying vec3 v2f_dir_from_view; // viewing vector (from eye to vertex in view coordinates)
varying float v2f_height;

const vec3  light_color = vec3(1.0, 0.941, 0.898);
// Small perturbation to prevent "z-fighting" on the water on some machines...
const float terrain_water_level    = -0.03125 + 1e-6;
const vec3  terrain_color_water    = vec3(0.29, 0.51, 0.62);
const vec3  terrain_color_mountain = vec3(0.8, 0.5, 0.4);
const vec3  terrain_color_grass    = vec3(0.33, 0.43, 0.18);

void main()
{
  const vec3 ambient = 0.2 * light_color; // Ambient light intensity
  float height = v2f_height;

  /* TODO
  Compute the terrain color ("material") and shininess based on the height as
  described in the handout.

  Water:
      color = terrain_color_water
      shininess = 8.0
  Ground:
      color = interpolate between terrain_color_grass and terrain_color_mountain, weight is (height - terrain_water_level)*2
      shininess = 0.5
  */

  vec3 material_color;
  float shininess;

  if(height  >=  terrain_water_level ) {
    material_color = mix(terrain_color_grass, terrain_color_mountain , (height - terrain_water_level)*2.) ;
    shininess = 0.5;
  }else {
    material_color = terrain_color_water;
    shininess = 8.;
  }

  /* TODO 3.2: apply the phong lighting model
      Implement the Phong shading model by using the passed variables and write the resulting color to `color`.
      `material_color should be used as material parameter for ambient, diffuse and specular lighting.
      Hints:
  */

  vec3 ambient_light = ambient * material_color ;

  vec3 diffuse_light = light_color  * material_color * max( dot( normalize(v2f_normal) , normalize(v2f_dir_to_light) ) , 0.0 ) ;


  vec3 reflectDir =  reflect( normalize(-v2f_dir_to_light) , normalize(v2f_normal) ) ;

    vec3 specularLight = light_color * material_color * pow( max( dot( normalize(reflectDir) , normalize(v2f_dir_from_view) ) , 0.0) , shininess ) ;


  vec3 color = ambient_light + diffuse_light + specularLight;
  gl_FragColor = vec4(color, 1.); // output: RGBA in 0..1 range
}

