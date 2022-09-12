/*
    总结一些有用的方法，备用
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

//---------------------- ray trace 光线追踪 --------------------
// ro 相机原点 uv 坐标
// 返回值：在视觉空间中相机原点到uv坐标的向量
vec3 getRayTraceRd(vec3 ro, vec2 uv, vec3 lookat) {
  //camera
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
