// this version is needed for: indexing an array, const array, modulo %
precision highp float;

//=============================================================================
//	Exercise code for "Introduction to Computer Graphics 2018"
//     by
//	Krzysztof Lis @ EPFL
//=============================================================================

#define NUM_GRADIENTS 12

// -- Gradient table --
vec2 gradients(int i) {
	if (i ==  0) return vec2( 1,  1);
	if (i ==  1) return vec2(-1,  1);
	if (i ==  2) return vec2( 1, -1);
	if (i ==  3) return vec2(-1, -1);
	if (i ==  4) return vec2( 1,  0);
	if (i ==  5) return vec2(-1,  0);
	if (i ==  6) return vec2( 1,  0);
	if (i ==  7) return vec2(-1,  0);
	if (i ==  8) return vec2( 0,  1);
	if (i ==  9) return vec2( 0, -1);
	if (i == 10) return vec2( 0,  1);
	if (i == 11) return vec2( 0, -1);
	return vec2(0, 0);
}

float hash_poly(float x) {
	return mod(((x*34.0)+1.0)*x, 289.0);
}

// -- Hash function --
// Map a gridpoint to 0..(NUM_GRADIENTS - 1)
int hash_func(vec2 grid_point) {
	return int(mod(hash_poly(hash_poly(grid_point.x) + grid_point.y), float(NUM_GRADIENTS)));
}

// -- Smooth interpolation polynomial --
// Use mix(a, b, blending_weight_poly(t))
float blending_weight_poly(float t) {
	return t*t*t*(t*(t*6.0 - 15.0)+10.0);
}


// Constants for FBM
const float freq_multiplier = 2.17;
const float ampl_multiplier = 0.5;
const int num_octaves = 4;

// ==============================================================
// 1D Perlin noise evaluation and plotting

float perlin_noise_1d(float x) {
	/*
	// Note Gradients in the table are 2d, so in the 1D case we use grad.x
	*/

	/* TODO 2.1
	Evaluate the 1D Perlin noise function at "x" as described in the handout. 
	You will determine the two grid points surrounding x, 
	look up their gradients, 
	evaluate the the linear functions these gradients describe, 
	and interpolate these values 
	using the smooth interolation polygnomial blending_weight_poly.
	
	Note: gradients in the gradient lookup table are 2D, 
	 */

	float c0 = floor(x);
	float c1 = c0 + 1.;

	vec2 g0 = gradients( hash_func( vec2(c0 , 0.) ) );
	vec2 g1 = gradients( hash_func( vec2(c1 , 0.) ) ); 

	float phi0 = g0.x * ( x - c0 );
	float phi1 = g1.x * ( x - c1 );

	float res = mix( phi0 , phi1 , blending_weight_poly( x-c0 ) );

	return res;
}

float perlin_fbm_1d(float x) {
	/* TODO 3.1
	Implement 1D fractional Brownian motion (fBm) as described in the handout.
	You should add together num_octaves octaves of Perlin noise, starting at octave 0. 
	You also should use the frequency and amplitude multipliers:
	freq_multiplier and ampl_multiplier defined above to rescale each successive octave.
	
	Note: the GLSL `for` loop may be useful.
	*/

	float res = 0.;

	for(float i = 0. ; i < float(num_octaves) ; i += 1.){
		res += pow(ampl_multiplier,i) * perlin_noise_1d( x*pow(freq_multiplier,i) );
	}

	return res;
}

// ----- plotting -----

const vec3 plot_foreground = vec3(0.5, 0.8, 0.5);
const vec3 plot_background = vec3(0.2, 0.2, 0.2);

vec3 plot_value(float func_value, float coord_within_plot) {
	return (func_value < ((coord_within_plot - 0.5)*2.0)) ? plot_foreground : plot_background;
}

vec3 plots(vec2 point) {
	// Press D (or right arrow) to scroll

	// fit into -1...1
	point += vec2(1., 1.);
	point *= 0.5;

	if(point.y < 0. || point.y > 1.) {
		return vec3(255, 0, 0);
	}

	float y_inv = 1. - point.y;
	float y_rel = y_inv / 0.2;
	int which_plot = int(floor(y_rel));
	float coord_within_plot = fract(y_rel);

	vec3 result;
	if(which_plot < 4) {
		result = plot_value(
 			perlin_noise_1d(point.x * pow(freq_multiplier, float(which_plot))),
			coord_within_plot
		);
	} else {
		result = plot_value(
			perlin_fbm_1d(point.x) * 1.5,
			coord_within_plot
		);
	}

	return result;
}

// ==============================================================
// 2D Perlin noise evaluation


float perlin_noise(vec2 point) {
	/* TODO 4.1
	Implement 2D perlin noise as described in the handout.
	You may find a glsl `for` loop useful here, but it's not necessary.
	*/
	vec2 c00 = floor(point);
	vec2 c11 = c00 + vec2(1.,1.);
	vec2 c01 = c00 + vec2(0.,1.);
	vec2 c10 = c00 + vec2(1.,0.);

	vec2 g00 = gradients( hash_func(c00) );
	vec2 g11 = gradients( hash_func(c11) );
	vec2 g01 = gradients( hash_func(c01) );
	vec2 g10 = gradients( hash_func(c10) );

	float s = dot(point - c00 , g00);
	float v = dot(point - c11 , g11);
	float u = dot(point - c01 , g01);
	float t = dot(point - c10 , g10);

	float st = mix(s,t, blending_weight_poly(point.x-c00.x));
	float uv = mix(u,v, blending_weight_poly(point.x-c00.x));
	float noise = mix(st,uv, blending_weight_poly(point.y-c00.y));

	return noise;
}

vec3 tex_perlin(vec2 point) {
	// Visualize noise as a vec3 color
	float freq = 23.15;
 	float noise_val = perlin_noise(point * freq) + 0.5;
	return vec3(noise_val);
}

// ==============================================================
// 2D Fractional Brownian Motion

float perlin_fbm(vec2 point) {
	/* TODO 4.2
	Implement 2D fBm as described in the handout. Like in the 1D case, you
	should use the constants num_octaves, freq_multiplier, and ampl_multiplier. 
	*/

	float res = 0.;

	for(float i = 0. ; i < float(num_octaves) ; i += 1.){
		res += pow(ampl_multiplier,i) * perlin_noise( point * pow(freq_multiplier,i) );
	}

	return res;
}

vec3 tex_fbm(vec2 point) {
	// Visualize noise as a vec3 color
	float noise_val = perlin_fbm(point) + 0.5;
	return vec3(noise_val);
}

vec3 tex_fbm_for_terrain(vec2 point) {
	// scale by 0.25 for a reasonably shaped terrain
	// the +0.5 transforms it to 0..1 range - for the case of writing it to a non-float textures on older browsers or GLES3
	float noise_val = (perlin_fbm(point) * 0.25) + 0.5;
	return vec3(noise_val);
}

// ==============================================================
// 2D turbulence

float turbulence(vec2 point) {
	/* TODO 4.3
	Implement the 2D turbulence function as described in the handout.
	Again, you should use num_octaves, freq_multiplier, and ampl_multiplier.
	*/
	float res = 0.;

	for(float i = 0. ; i < float(num_octaves) ; i += 1.){
		res += pow(ampl_multiplier,i) * abs(perlin_noise( point * pow(freq_multiplier,i) ));
	}

	return res;
	
}

vec3 tex_turbulence(vec2 point) {
	// Visualize noise as a vec3 color
	float noise_val = turbulence(point);
	return vec3(noise_val);
}

// ==============================================================
// Procedural "map" texture

const float terrain_water_level = -0.075;
const vec3 terrain_color_water = vec3(0.29, 0.51, 0.62);
const vec3 terrain_color_grass = vec3(0.43, 0.53, 0.23);
const vec3 terrain_color_mountain = vec3(0.8, 0.7, 0.7);

vec3 tex_map(vec2 point) {
	/* TODO 5.1.1
	Implement your map texture evaluation routine as described in the handout. 
	You will need to use your perlin_fbm routine and the terrain color constants described above.
	*/

	float s = perlin_fbm(point);
	if(s < terrain_water_level){
		return terrain_color_water;
	}

	return mix(terrain_color_grass , terrain_color_mountain , s - terrain_water_level);
}

// ==============================================================
// Procedural "wood" texture

const vec3 brown_dark 	= vec3(0.48, 0.29, 0.00);
const vec3 brown_light 	= vec3(0.90, 0.82, 0.62);

vec3 tex_wood(vec2 point) {
	/* TODO 5.1.2
	Implement your wood texture evaluation routine as described in thE handout. 
	You will need to use your 2d turbulence routine and the wood color constants described above.
	*/

	float alpha = 0.5 * ( 1.+sin(100.*( length(point)+0.15*turbulence(point) )) );
	vec3 wood_color = mix(brown_dark, brown_light, 
			alpha
			);

	return wood_color;
}


// ==============================================================
// Procedural "marble" texture

const vec3 white 			= vec3(0.95, 0.95, 0.95);

vec3 tex_marble(vec2 point) {
	/* TODO 5.1.3
	Implement your marble texture evaluation routine as described in the handout.
	You will need to use your 2d fbm routine and the marble color constants described above.
	*/

	vec2 q = vec2( perlin_fbm(point) , perlin_fbm( point + vec2(1.7, 4.6) ) );

	float alpha = 0.5*(1.+perlin_fbm(point + 4.*q));

	vec3 marble_color = mix(white , brown_dark , 
				alpha
				);

	return marble_color;
}



// =============================================================
// Worley noise


const int size = 13;
vec2 points[size];

const int closePointsSize = 13;
vec2 closePoints[closePointsSize];




void initArrays(){
	points[0] = vec2(0.83,0.75);
    points[1] = vec2(0.60,0.07);
    points[2] = vec2(0.28,0.64);
    points[3] = vec2(- 0.31,0.26);
	points[4] = vec2(0.83, -0.75);
    points[5] = vec2(-0.60,-0.07);
    points[6] = vec2(0.28,-0.64);
    points[7] = vec2(0.31,0.26);
	points[8] = vec2(-0.84, -0.75);
    points[9] = vec2(-0.60,-0.67);
    points[10] = vec2(-0.28,-0.74);
    points[11] = vec2(-0.31,0.66);
	points[12] = vec2(0.0,0.0);

	closePoints[0] = vec2(0.13,0.25);
    closePoints[1] = vec2(0.20,0.27);
    closePoints[2] = vec2(0.38,0.24);
    closePoints[3] = vec2(0.41,0.26);
	closePoints[4] = vec2(0.53,0.25);
    closePoints[5] = vec2(0.60,0.27);
    closePoints[6] = vec2(0.38,0.44);
    closePoints[7] = vec2(0.31,0.46);
	closePoints[8] = vec2(0.84,0.45);
    closePoints[9] = vec2(0.60,0.47);
    closePoints[10] = vec2(0.28,0.44);
    closePoints[11] = vec2(0.31,0.46);
	closePoints[12] = vec2(0.0,0.0);
}



// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------

// make array dynamic ...

vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

vec3 worley_noise_euclidian(vec2 point , float zoom){

	vec2 st = point/zoom;
    st.x *= 1.;// u_resolution.x/u_resolution.y; we r assuming the texture is squared

    // Scale
    st *= 3.;

    // Tile the space
    vec2 i_st = floor(st);
    vec2 f_st = fract(st);

    float m_dist = 1.;  // minimum distance

    for (int y= -1; y <= 1; y++) {
        for (int x= -1; x <= 1; x++) {
            // Neighbor place in the grid
            vec2 neighbor = vec2(float(x),float(y));

            // Random position from current + neighbor place in the grid
            vec2 point = random2(i_st + neighbor);

			// Vector between the pixel and the point
            vec2 diff = neighbor + point - f_st;

            // Distance to the point
            float dist = length(diff);

            // Keep the closer distance
            m_dist = min(m_dist, dist);
        }
    }

    return 1. - vec3(m_dist);
}


vec3 worley_euld_2nd(vec2 point , float zoom){

	vec2 st = point/zoom;
    st.x *= 1.;// u_resolution.x/u_resolution.y; we r assuming the texture is squared

    // Scale
    st *= 3.;

    // Tile the space
    vec2 i_st = floor(st);
    vec2 f_st = fract(st);

    float m_dist = 1.;  // minimum distance
	float m2_dist = 2.;

    for (int y= -1; y <= 1; y++) {
        for (int x= -1; x <= 1; x++) {
            // Neighbor place in the grid
            vec2 neighbor = vec2(float(x),float(y));

            // Random position from current + neighbor place in the grid
            vec2 point = random2(i_st + neighbor);

			// Vector between the pixel and the point
            vec2 diff = neighbor + point - f_st;

            // Distance to the point
            float dist = length(diff);

            // Keep the closer distance
            //m_dist = min(m_dist, dist);

			if(m_dist > dist ){
				m2_dist = m_dist;
				m_dist =  dist;
			} else if (dist < m2_dist && dist != m_dist)  
				m2_dist = dist; 
        }
    }

	float noise = (m2_dist - m_dist);
	return mix( vec3(0.) , vec3(1.) , smoothstep( 0.0 , 0.5 , noise) );
	
}


vec3 distorted_borders( vec2 point , float zoom ){

	vec3 distortion = tex_turbulence(point * 1. );

	vec3 color_distorted = worley_euld_2nd( point + (distortion.xy * 0.15 *zoom)  , zoom);

	return mix( vec3(0.) , vec3(1.) , smoothstep( 0. , 1. , color_distorted.r) ) ;
}



vec3 tex_normal_map(vec2 point , float zoom){

	if(distorted_borders(point , zoom).r < 0.2){

		const float detail = 0.0001;

		vec2 sample1 = point  + vec2( detail ,  detail);
		vec2 sample2 = point  + vec2(-detail , -detail);
		vec2 sample3 = point  + vec2( detail , -detail);

		vec3 point1 = vec3( sample1 , distorted_borders(sample1 , zoom).r);
		vec3 point2 = vec3( sample2 , distorted_borders(sample2 , zoom).r);
		vec3 point3 = vec3( sample3 , distorted_borders(sample3 , zoom).r);

		vec3 vector1 = point1 - point2;
		vec3 vector2 = point2 - point3;

		vec3 final_normal = cross(vector1 , vector2);

		return normalize(final_normal) * 0.5 + 0.5;
		

	}
	else{
		return vec3(0.5 , 0.5 , 1);
	}

}


vec3 tex_distorted_worley_euclidian( vec2 point , float zoom ){

	// u can play with the 2 constants to get different results
	vec3 distortion = tex_turbulence(point * 1. );
	return worley_noise_euclidian( point + (distortion.xy * 0.15 * zoom)  , zoom);
}


vec3 worley_euld_2nd_larger(vec2 point , float zoom , float spread){

	vec2 st = point/zoom;
    st.x *= 1.;// u_resolution.x/u_resolution.y; we r assuming the texture is squared

    // Scale
    st *= 3.;

    // Tile the space
    vec2 i_st = floor(st);
    vec2 f_st = fract(st);

    float m_dist = 1.;  // minimum distance
	float m2_dist = 2.;

    for (int y= -1; y <= 1; y++) {
        for (int x= -1; x <= 1; x++) {
            // Neighbor place in the grid
            vec2 neighbor = vec2(float(x),float(y));

            // Random position from current + neighbor place in the grid
            vec2 point = random2(i_st + neighbor);

			// Vector between the pixel and the point
            vec2 diff = neighbor + point - f_st;

            // Distance to the point
            float dist = length(diff);

            // Keep the closer distance
            //m_dist = min(m_dist, dist);

			if(m_dist > dist ){
				m2_dist = m_dist;
				m_dist =  dist;
			} else if (dist < m2_dist && dist != m_dist)  
				m2_dist = dist; 
        }
    }

    vec3 color = vec3(.0);
	float noise = (m2_dist - m_dist);
	if(noise < spread)
		color = vec3(0.);
	else
		color = vec3(1.);
	return color;

	// TODO make smooth
	
}


vec3 distorted_worley_euld_2nd_larger( vec2 point , float zoom , float spread){

	// u can play with the 2 constants to get different results
	vec3 distortion = tex_turbulence(point * 1. );
	return worley_euld_2nd_larger( point + (distortion.xy * 0.15 * zoom)  , zoom , spread);
}





vec3 tex_normal_optimized(vec2 point){

	//return distort_snow(point , 1. , .2 , 0.5);
	return tex_normal_map(point , 1.);
}

vec3 tex_disturbed_optimied(vec2 point){

	return distorted_borders(point , 1.);
}

vec3 tex_cndwcdkdwcnk(vec2 point){
	return worley_euld_2nd(point , 1.);
}


// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------

// snow
vec3 distorted_noised_worley_euld_2nd_larger( vec2 point , float zoom , float spread , float snow_level){
	// white --> snow
	if( distorted_worley_euld_2nd_larger(point , zoom , spread).r < 0.1){
		if(tex_fbm(point*5.).r < snow_level){
			return vec3(0.);
		}
		return tex_fbm(point*5.);
	}else {
		return vec3(0.);
	}
}

vec3 distort_snow(vec2 point , float zoom , float spread , float snow_level){
	vec3 distortion = tex_turbulence(point * 1. );
	return distorted_noised_worley_euld_2nd_larger( point + (distortion.xy * 0.1 * zoom)  , zoom , spread , snow_level);
}

// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------

// closest to point


vec3 worley_noise_euclidian(vec2 point , vec2 points[size] , int arraySize){
	float m_dist = 404.;  // minimum distance
	int closestIndex = 0;

    // Iterate through the points positions
    for (int i = 0; i < size; i++) {
        float euclidianDist = distance( point, points[i] );
		float dist = euclidianDist;
        // Keep the closer distance
		if(m_dist > dist ){
			m_dist =  dist;
			closestIndex = i;
		}
        
    }

	vec3 color = vec3(1.);
	color -= vec3(m_dist);
	return color;
}

vec3 tex_worley_euclidian(vec2 point){
	initArrays(); 
	return worley_noise_euclidian(point , points , size);
}


// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------


// closest to edge


// subtract the distance to the nearest point from the distance to the second nearest point

vec3 worley_euld_2nd(vec2 point , vec2 points[size] , int arraySize){
	float m_dist = 404.;  // minimum distance
	float m2_dist = 405.; // second minimum

    // Iterate through the points positions
    for (int i = 0; i < size; i++) {
		vec2 p = point -points[i];
		float dist = length(p);
        // Keep the closer distance
		if(m_dist > dist ){
			m2_dist = m_dist;
			m_dist =  dist;
		}
		else if (dist < m2_dist && dist != m_dist)  
            m2_dist = dist; 
        
    }

	vec3 color = vec3(.0);
	float noise = (m2_dist - m_dist);
	return mix( vec3(0.) , vec3(1.) , smoothstep( 0.01 - 0.01 , 0.01 + 0.01 , noise) );
	
}

vec3 tex_worley_euld_2nd(vec2 point){
	initArrays(); 
	return worley_euld_2nd(point , points , size);
}


// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------



// DISTORTION !!! 


vec3 tex_distorted_borders( vec2 point ){

	vec3 distortion = tex_turbulence(point * 1. );

	vec3 color_distorted = tex_worley_euld_2nd( point + (distortion.xy * 0.2) );

	return mix( tex_perlin(point * .2 ) , vec3(1.) , smoothstep( 0.0 , 0.5 , color_distorted.r) ) ;

}

vec3 tex_distorted_worley_euclidian( vec2 point ){
	vec3 distortion = tex_turbulence(point * 1. );
	return tex_worley_euclidian( point + (distortion.xy * 0.2) );
}


// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------

// normal map

vec3 tex_normal_map(vec2 point){

	const float detail = 0.001;

	vec2 sample1 = point  + vec2( detail ,  detail);
	vec2 sample2 = point  + vec2(-detail , -detail);
	vec2 sample3 = point  + vec2( detail , -detail);

	vec3 point1 = vec3( sample1 , tex_distorted_borders(sample1).r);
	vec3 point2 = vec3( sample2 , tex_distorted_borders(sample2).r);
	vec3 point3 = vec3( sample3 , tex_distorted_borders(sample3).r);

	vec3 vector1 = point1 - point2;
	vec3 vector2 = point2 - point3;

	vec3 final_normal = cross(vector1 , vector2);

	return normalize(final_normal) * 0.5 + 0.5;

}