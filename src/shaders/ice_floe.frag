precision mediump float;

uniform vec4 color;
uniform sampler2D texureBlock;

varying vec2 tex_position;



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

	// Blue Ice
	//vec3 color = vec3(.0 , 1. , 1.0);
    //color.xy -= vec2(m_dist);

	vec3 color = vec3(1.);
	color -= vec3(m_dist);
	return color;
}

vec3 tex_worley_euclidian(vec2 point){

	// TODO : make the points array dynamic
	initArrays(); 

	return worley_noise_euclidian(point , points , size);

}

vec3 worley_noise_manhatan(vec2 point , vec2 points[size] , int arraySize){
	float m_dist = 404.;  // minimum distance
	int closestIndex = 0;

    // Iterate through the points positions
    for (int i = 0; i < size; i++) {
		vec2 p = point -points[i];
		float dist = abs(p.x)+abs(p.y);
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

vec3 tex_worley_manhatan(vec2 point){

	// TODO : make the points array dynamic
	initArrays(); 

	return worley_noise_manhatan(point , points , size);

}

vec3 worley_manhatan_euclidian(vec2 point , vec2 points[size] , int arraySize){
	float m_dist = 404.;  // minimum distance
	int closestIndex = 0;

    // Iterate through the points positions
    for (int i = 0; i < size; i++) {
		vec2 p = point -points[i];
		float manhatan = abs(p.x)+abs(p.y);

		float dist = mix(manhatan , length(p) , 0.8);
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

vec3 tex_worley_manhatan_euclidian(vec2 point){


	// TODO : make the points array dynamic
	initArrays(); 

	return worley_manhatan_euclidian(point , points , size);


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

	/* 
	// failed attempt to blurr edges
	vec3 noise = vec3(m2_dist - m_dist);
	float valueChange = length(point) * 0.5;
	float isBorder = 1. - smoothstep(0.05 - valueChange, 0.05 + valueChange, noise.x);
	vec3 color = mix( vec3(0.) , vec3(1.) , isBorder);
	return color;
	*/

	vec3 color = vec3(.0);
	vec3 noise = vec3(1.) - vec3(m2_dist - m_dist);
	if(noise.x > 0.99)
		color = vec3(0.);
	else
		color = vec3(1.);
	return color;
	
}

vec3 tex_worley_euld_2nd(vec2 point){
	// TODO : make the points array dynamic
	initArrays(); 

	return worley_euld_2nd(point , points , size);
}


// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------
		
void main () {

	gl_FragColor = vec4( tex_worley_euclidian(tex_position) ,1. ) ;//texture2D(texureBlock, tex_position );
}