"use strict";


let timeLimit = undefined;


function getCurvePointsTimed( controls, time ){
  
    const controlPoints = [];
    

    var el;
	//generate the end and control points
	for ( el = 1 ; el < controls.length - 1 ; el+=2 ){

		controlPoints.push(center(controls[el-1], controls[el]));
		controlPoints.push(controls[el]);
		controlPoints.push(controls[el+1]);
		if ( el+2 < controls.length - 1 ){
			controlPoints.push(center(controls[el+1], controls[el+2]));
		}
	}

    // time [0,100]
    const i = Math.floor((time/4)) * 4;

    console.log("i = "+i);
    console.log(controlPoints);
  
    if(i >= controlPoints.length) {
        if(timeLimit == undefined)
            timeLimit = time;
        return getCurvePointsTimed( controls , time % timeLimit );
    }

    const  a0 = controlPoints[i];
    const  a1 = controlPoints[i+1];
	const  a2 = controlPoints[i+2];

	if ( i + 3 > controlPoints.length - 1 ){
			//quad
			const j = (time%4)/3;
			return (quadBezier(a0,a1,a2,j));
			
	}else{
			//cubic
			const  a3 = controlPoints[i+3];
            const j = (time%4)/4;
			return (cubicBezier(a0,a1,a2,a3,j));
	}

}

// B(t) = (1 - t)3P0 + 3(1-t)2tP1 + 3(1-t)t2P2 + t3P3

function cubicBezier( p1,  p2,  p3,  p4,  t){
  return [
      cubicBezierPoint(p1[0], p2[0], p3[0], p4[0], t), 
      cubicBezierPoint(p1[1], p2[1], p3[1], p4[1], t)
    ];
}


function quadBezier( p1,  p2,  p3,  t){
  return [
      quadBezierPoint(p1[0], p2[0], p3[0], t), 
      quadBezierPoint(p1[1], p2[1], p3[1], t)
    ];
}


function cubicBezierPoint( a0,  a1,  a2,  a3,  t){
  return ((1-t)*(1-t)*(1-t)) * a0 + 3* ((1-t)*(1-t)) * t * a1 + 3*(1-t) * (t*t) * a2 + (t*t*t) * a3;
}


function quadBezierPoint( a0,  a1,  a2,  t){
  return ((1-t)*(1-t)) * a0 + 2* (1-t) * t * a1 + (t*t) * a2;
}


function center( p1,  p2){
  return [
      (p1[0] + p2[0]) / 2, 
      (p1[1] + p2[1]) / 2
    ];
}