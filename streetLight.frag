#define S(a, b, t) smoothstep(a, b, t)

struct ray {
  vec3 o, d;
};

//计算相机原点到像素点的光线
ray getRay(vec2 uv, vec3 camPos, vec3 lookat, float zoom) {
  ray a;
  a.o = camPos;
  vec3 ro = camPos;
  vec3 up = vec3(.0, 1., .0);

  vec3 f = normalize(lookat - ro);
  vec3 r = cross(up, f);
  vec3 u = cross(f, r);

  vec3 c = ro + f * zoom;
  vec3 i = c + uv.x * r + uv.y * u;   
  vec3 rd = i - ro;

  a.d = normalize(rd);  //注意要标准化
  return a;
}

//光线到点p的最近点
vec3 closestPoint(ray r, vec3 p) {
  //计算投影计算最近点坐标
  return r.o + max(.0, dot(r.d, p - r.o)) * r.d;
}

//点p到光线的垂直距离
float distRay(ray r, vec3 p) {
  return length(p - closestPoint(r, p)); 
}

float Bokeh(ray r, vec3 p, float size, float blur) {
  size *= length(p);  //让远处的点显得更大
  
  float d = distRay(r, p);
  float c = S(size, size * (1. - blur), d); //1100 整体区域渐变
  c *= mix(.7, 1., S(size * .8, size, d));  //0011 区域渐变+颜色渐变 .6.6 1.1.(渐变区域 .8 1.)
  return c;
}

vec3 streetLight(ray r) {
  float side = step(r.d.x, .0); //获取符号 1 整数 0 负数
  r.d.x = abs(r.d.x) - .02; //水平移动一下
  float t = iTime * .1;
  float s = .1; 
  float m = .0;
  //通过循环，可以一次性渲染多个点
  //相当于轮询每个点，每个点都和像素点进行比较
  //检查像素是否在点中，其实就一个点影响了该像素
  //这样就在一帧中绘制了多个点
  for(float i=0.; i<1.; i+=s) {
    float ti = fract(t + i + s * side * .5);  //通过i增加点与点之间的距离
    vec3 p = vec3(2., 2., 100. - 100. * ti); //fract函数取小数，可以达到一秒一个的效果
    //这里累加了每个点对这个像素的影响，其实只需要有一个点对其有影响即可
    m += Bokeh(r, p, .05, .1) * ti * ti * ti;  //乘以ti可以削减这个点对像素的光亮，避免光照过曝
  }
  return vec3(1., .7, .3) * m;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  uv -= .5;
  uv.x *= iResolution.x / iResolution.y;

  vec3 camPos = vec3(.0, .2, .0);
  vec3 lookat = vec3(.0, .2, 1.); //相机看向的点
  ray r = getRay(uv, camPos, lookat, 2.);
  
  vec3 col = streetLight(r);
  gl_FragColor = vec4(col, 1.);
}