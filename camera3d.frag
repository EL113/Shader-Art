
/*
  用ray trace绘制3d空间
*/

//----------------------- 绘制3d点 --------------------
float getDistance(vec3 ro, vec3 rd, vec3 p) {
  //叉乘得到向量平行四边形面积，面积除以底边，得到高，即距离
  return length(cross(p - ro, rd)) / length(rd); 
}

float drawPoint(vec3 ro, vec3 rd, vec3 p) {
  float d = getDistance(ro, rd, p);
  return smoothstep(.06, .05, d);
}
// -----------------------------------------------------

//---------------------- ray trace 光线追踪方法 --------------------

vec3 getRayTraceRd(vec3 ro, vec2 uv) {
  //camera
  vec3 lookat = vec3(.5); //相机看向的点
  vec3 up = vec3(.0, 1., .0);
  //f r u 视觉空间三个坐标轴，构成视觉空间的转换矩阵
  vec3 f = normalize(lookat - ro);  
  vec3 r = cross(up, f);
  vec3 u = cross(f, r);

  float zoom = 1.;
  vec3 c = ro + f * zoom;   //近视平面坐标
  //将uv点转到视觉空间上 ru矩阵左乘 uv，c相当于计算z坐标
  //ro相当于是矩阵的移动部分，f是矩阵旋转部分
  vec3 i = c + uv.x * r + uv.y * u;   
  vec3 rd = i - ro; //相机原点到uv点的向量
  return rd;
}
//--------------------------------------------------------------------

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  uv -= .5;
  uv.x *= iResolution.x / iResolution.y;

  //相机的视觉空间原点，这里绕固定点（0.5 0.5 0.5）旋转
  vec3 ro = vec3(sin(iTime) * 3., .0, cos(iTime) * 3.) + vec3(.5);
  vec3 rd = getRayTraceRd(ro, uv);

  float d = drawPoint(ro, rd, vec3(.0, .0, .0));
  d += drawPoint(ro, rd, vec3(.0, .0, 1.));
  d += drawPoint(ro, rd, vec3(.0, 1., .0));
  d += drawPoint(ro, rd, vec3(.0, 1., 1.));
  d += drawPoint(ro, rd, vec3(1., 0., 0.));
  d += drawPoint(ro, rd, vec3(1., 0., 1.));
  d += drawPoint(ro, rd, vec3(1., 1., .0));
  d += drawPoint(ro, rd, vec3(1., 1., 1.));

  float mask = smoothstep(.09, .1, d);
  gl_FragColor = mix(vec4(.0, .0, .0, 1.), vec4(1.), mask);
}