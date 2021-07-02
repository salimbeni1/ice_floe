

# ICE FLOW SHADER
![ice flow 1](img/ice_1.png)

real-time ice cracked shader with [regl](https://github.com/regl-project/regl) (a simplified library of WebGL : OpenGL for the browsers) 

The density of the cracks , level of snow is custumisable.


## Methods used

* parallax effect is used to simulate the caustic lights 

* Worley noise is used to generated a normal map to simulate the cracks

* Simple Perlin noise is added to irregularities to the ice surface

* snow is simulated 

* Bezier curves have been implemented for smooth rotation of the camera

* environment lighting is implemented using cube maps


see [report](https://github.com/salimbeni1/ice_floe/blob/master/report.pdf) for more details


## Examples of different angles of the ligh source angle

![ice flow 2](img/ice_1.png)
![ice flow 3](img/ice_1.png)

