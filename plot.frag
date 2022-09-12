/*
  绘制一些几何形状
*/
vec3 backColor = vec3(.0);

// 坐标轴
vec3 x_axis(vec2 uv) {
  float edge = .01;
  float ratio = smoothstep(-edge, .0, uv.y);
  ratio *= smoothstep(edge, .0, uv.y);

  vec3 axis_color = vec3(.8, .0, .0);
  vec3 color = mix(backColor, axis_color, ratio);
  return color;
}

vec3 y_axis(vec2 uv) {
  float edge = .01;
  float ratio = smoothstep(-edge, .0, uv.x);
  ratio *= smoothstep(edge, .0, uv.x);

  vec3 axis_color = vec3(.0, .0, .8);
  vec3 color = mix(backColor, axis_color, ratio);
  return color;
}

// Bezier curve
float quadraticBezier (float x, float a, float b){
  float epsilon = 0.00001f;
  a = min(0.0, min(1.0, a)); 
  b = max(0.0, min(1.0, b)); 
  if (a == 0.5){
    a += epsilon;
  }
  
  // solve t from x (an inverse operation)
  float om2a = 1.0 - 2.0*a;
  float t = (sqrt(a*a + om2a*x) - a)/om2a;
  float y = (1.0-2.0*b)*(t*t) + (2.0*b)*t;
  return y;
}

// functions
vec2 getPoint(vec2 uv) {
  float y = uv.x * uv.x;
  y = clamp(uv.x, -.2, .6);
  // y = sin(uv.x * 10.) * .5;
  // y = cos(uv.x * 10.) * .5;
  // y = sin(uv.x * 5.) * .5 + cos(uv.x * 10.) * .3;
  // y = smoothstep(-.3, .3, uv.x);
  // y = clamp(uv.x, -.6, .5); //坐标限制在两个值之间
  // y = quadraticBezier(uv.x, .8, -.4);
  vec2 point = vec2(uv.x, y);
  return point; 
}

// draw plot
vec3 renderPlot(vec2 uv) {
  //get points
  vec2 offset = vec2(.001, .0);
  vec2 point = getPoint(uv);
  vec2 point1 = getPoint(uv + offset);
  //get ange
  vec2 slop = point1 - point;
  float ang = atan(slop.y , slop.x);

  //get vertical vector
  float v_offset = .01;
  float edge = v_offset / cos(ang);

  //smooth it
  float ratio = smoothstep(point.y - edge, point.y, uv.y);
  ratio *= smoothstep(point.y + edge, point.y, uv.y);

  //mix color
  vec3 lineColor = vec3(.0, .8, .0);
  //lineColor * ratio + backColor * (1-ratio)
  vec3 color = mix(backColor, lineColor, ratio);
  return color;
}

//render point
vec3 renderPoint(vec2 uv, vec2 point) {
  //distance
  float distance = length(uv - point);

  //mix color
  float edge = .02;
  vec3 pointColor = vec3(.8, .8, .0);
  float ratio = smoothstep(edge, .0, distance);
  vec3 color = mix(backColor, pointColor, ratio);
  return color;
}

// render circle
vec3 renderCircle(vec2 uv, vec2 center, float radius) {
  // distance of pixel to center
  float distance = length(uv - center);

  // smooth distance
  float edge = .01;
  vec3 lineColor = vec3(.0, .8, .0);
  float ratio = smoothstep(radius - edge, radius, distance);
  ratio *= smoothstep(radius + edge, radius, distance);

  // mix color
  vec3 color = mix(backColor, lineColor, ratio);
  return color;
}

// render moving circle
vec3 renderCircle0(vec2 uv, vec2 center, float outer) {
  //move the radius by time
  float radius = mod(iTime * .2, outer);

  // distance of pixel to center
  float distance = length(uv - center);

  // smooth distance
  float edge = .25;
  vec3 lineColor = vec3(.0, .8, .0);
  float ratio = smoothstep(radius - edge, radius, distance);
  ratio *= step(distance, radius - .1); //截断最外层

  // mix color
  vec3 color = mix(backColor, lineColor, ratio);
  return color;
}

vec3 renderBall(vec2 uv, vec3 center, float radius) {

  return vec3(.8, .3, .5);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  uv = uv * 2. -1.;   //坐标系为 -1 1
  // 坐标轴
  vec3 x_axisColor = x_axis(uv);
  vec3 y_axisColor = y_axis(uv);
  vec3 color = x_axisColor + y_axisColor;
  // 函数曲线
  color += renderPlot(uv);
  // 坐标点
  vec2 point = vec2(cos(iTime) * .5 + sin(iTime) * .3, 
                    cos(iTime * 2.) * .4 + sin(iTime) * .5);
  color += renderPoint(uv, point);
  // color += renderCircle(uv, vec2(.0, .0), .3);
  color += renderCircle0(uv, vec2(.0, .0), .5);
  gl_FragColor = vec4(color, 1.);
}