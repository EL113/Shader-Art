#define S(a, b, t) smoothstep(a, b, t)

struct ray {
  vec3 o, d;
};

//------- 通过光线追踪转换uv坐标为3D坐标 -------------
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
//---------------------------------------------------

//-------在3d空间中绘制圆，得到r点坐标的渐变值 -----------
//点p在向量r上的投影点坐标
vec3 projectToray(ray r, vec3 p) {
  return r.o + max(.0, dot(r.d, p - r.o)) * r.d;
}

//点p到向量r的垂直距离
float distRay(ray r, vec3 p) {
  return length(p - projectToray(r, p)); 
}
//在3d空间中绘制圆，得到r点坐标的颜色值
float Bokeh(ray r, vec3 p, float size, float blur) {
  size *= length(p);  //让远处的点显得更大
  
  //以p为原点绘制圆
  float d = distRay(r, p);
  float c = S(size, size * (1. - blur), d); //1100 整体区域渐变
  c *= mix(.7, 1., S(size * .8, size, d));  //0011 区域渐变+颜色渐变 .6.6 1.1.(渐变区域 .8 1.)
  return c;
}
//---------------------------------------------------
//随机数
float N(float i) {
  //乘以一个很大的数，把值的差距拉大；再把值拉回 0 1 范围
  return fract(sin(i * 3456.) * 6547.);
}

vec4 RandomVec4(float i) {
  //乘以一个很大的数，把值的差距拉大；再把值拉回 0 1 范围
  return fract(sin(i * vec4(1264, 254, 3548, 1563)) * vec4(654, 895, 1256, 652));
}

// ------------------ 黄色路灯效果 ---------------------
vec3 streetLight(ray r, float t) {
  float side = step(r.d.x, .0); //获取符号 1 整数 0 负数
  r.d.x = abs(r.d.x) - .002; //水平移动一下
  //float t = iTime * .1;
  float m = .0;   //坐标点r颜色渐变值
  //通过循环，在一帧中渲染多个图形
  for(float i=0.; i<1.; i+=.1) {
    float ti = fract(t + i);  //根据i增加点与点之间的距离，fract函数保证坐标不会超出范围
    vec3 p = vec3(2., 2., 100. - 100. * ti);  //绘制圆的中心点坐标
    //在3d空间中绘制圆，得到r点坐标的渐变值
    m += Bokeh(r, p, .05, .1) * ti * ti * ti;  //通过ti让点由远及近的过程中亮度变大
  }
  return vec3(1., .7, .3) * m;
}
// ------------------ 环境灯光效果 ---------------------
vec3 EnvLight(ray r, float t) {
  float side = step(r.d.x, .0); //获取符号 1 整数 0 负数
  r.d.x = abs(r.d.x) - .002;
  //float t = iTime * .1;
  vec3 c;
  for(float i=0.; i<1.; i+=.1) {
    float ti = fract(t + i); 

    vec4 n = RandomVec4(i + side * 100.);
    float x = mix(2.5, 10., n.x); //把坐标限制在一定范围内
    float y = mix(0.1, 1.5, n.y);
    vec3 color = n.wyz; //随机的颜色
    float fade = sin(ti * 6.25 * 10. * n.x) * .2 + .2;  

    vec3 p = vec3(x, y, 50. - 50. * ti);
    c += Bokeh(r, p, .05, .1) * fade * color;
  }
  return c;
}

// ------------------ 白色车灯效果 ---------------------
vec3 HeadLight(ray r, float t) {
  t *= 2.;
  float w = .25;
  float w2 = w * 1.2;
  float loopCount = 1. / 30.;
  float m = .0;
  //多绘制了几个点
  for(float i=0.; i<1.; i+= loopCount) {
    //通过随机数，让百分之90的点不能被渲染出来
    float n = N(i);
    if(n > .1) continue;

    float ti = fract(t + i);  //变量值，用于调整距离变量z和模糊值fade
    float z = 100. - 100. * ti; //距离逐渐变小
    float fade = ti * ti * ti * ti * ti;  //逐渐清晰
    float focus = S(.9, 1., ti);
    float size = mix(0.05, 0.03, focus);  //车灯大小逐渐变小

    float laneShift = S(.99, .95, ti);
    float lane = step(.25, n);  //车道
    float x = -1.5 - lane * laneShift;
    //白色车灯
    m += Bokeh(r, vec3(x - w, .15, z), size, .1) * fade;  //通过ti让点由远及近的过程中亮度变大
    m += Bokeh(r, vec3(x + w, .15, z), size, .1) * fade;
    //车灯的模糊重影
    m += Bokeh(r, vec3(x - w2, .15, z), size, .1) * fade;
    m += Bokeh(r, vec3(x + w2, .15, z), size, .1) * fade;
    //车灯倒影
    float ref = 0.0;
    ref += Bokeh(r, vec3(x - w2, -.15, z), size * 3., 1.) * fade; // 把blur模糊值调整到了1.0
    ref += Bokeh(r, vec3(x + w2, -.15, z), size * 3., 1.) * fade; 
    m += ref * focus;   //在0. 1.的范围显示倒影
  }
  return vec3(.9, .9, 1.) * m;
}
//------------------- 尾灯效果 --------------------------------
vec3 TailLight(ray r, float t) {
  t *= 0.5;
  float w = .25;
  float w2 = w * 1.2;
  float loopCount = 1. / 30.;
  float m = .0;
  //多绘制了几个点
  for(float i=0.; i<1.; i+= loopCount) {
    float n = N(i);
    if(n > .1) continue;

    float ti = fract(t + i);  //变量值，用于调整距离变量z和模糊值fade
    float z = 100. - 100. * ti; //距离逐渐变小
    float fade = ti * ti * ti * ti * ti;  //逐渐清晰
    float focus = S(.9, 1., ti);
    float size = mix(0.05, 0.03, focus);  //车灯大小逐渐变小

    //白色车灯
    float x = 1.5;
    m += Bokeh(r, vec3(x - w, .15, z), size, .1) * fade;  //通过ti让点由远及近的过程中亮度变大
    m += Bokeh(r, vec3(x + w, .15, z), size, .1) * fade;
    //车灯的模糊重影
    float blink = step(0., sin(t*1000.)) * 7. * step(.96, ti);   //尾灯闪烁效果，sin内部的变量迅速变化，加上step的01效果
    m += Bokeh(r, vec3(x - w2, .15, z), size, .1) * fade;
    m += Bokeh(r, vec3(x + w2, .15, z), size, .1) * fade * (1. + blink);
    //车灯倒影
    float ref = 0.0;
    ref += Bokeh(r, vec3(x - w2, -.15, z), size * 3., 1.) * fade; // 把blur模糊值调整到了1.0
    ref += Bokeh(r, vec3(x + w2, -.15, z), size * 3., 1.) * fade * (1. + blink * .1); 
    m += ref * focus;   //在0. 1.的范围显示倒影
  }
  return vec3(1., .1, .03) * m;
}

//----------------------- 雨点效果 ------------------------
vec2 Rain(vec2 uv, float t){
  t*=40.;
  vec2 a = vec2(3., 1.);
  vec2 st = uv * a; //通过fragt函数和a函数将坐标拆分成小格，不过会产生形变
  //让坐标系整体向下移动
  vec2 id = floor(st);  //将st的floor值作为id值，st是坐标系的放大得到的结果
  st.y += t * .22; 
  float n = fract(sin(id.x * 4876.) * 4548.); //根据id，坐标系向下移动的随机值都不一样
  st.y += n;
  uv.y += n;
  id = floor(st);
  st = fract(st) - .5; //设置小格坐标系原点到中心原点

  //绘制圆点
  t += fract(sin(id.x * 1567. + id.y * 563.) * 785.2) * 6.28; //每个圆点的向下移动速度根据id都不一样
  float y = -sin(t+sin(t+sin(t) * .5)) * 0.45;  //圆点上下移动
  vec2 p1 = vec2(0, y);   //圆点圆心坐标
  vec2 o1 = (st - p1)/a;  //坐标乘以a有形变，这里除以a解除形变
  float d = length(o1); 
  float m1 = S(.05, .01, d);

  //绘制小圆点
  vec2 o2 = (fract(uv * a.x * vec2(1., 2.)) - .5)/vec2(1., 2.);
  d = length(o2); //同样对uv进行操作形成小格，重置原点坐标，最后解除形变
  //m1坐标要大于m2坐标，即大于m1 y坐标的m2的点才会被显示出来
  //m2的大小由m1到顶部的距离
  float m2 = S(.26 * (0.5 - st.y), .0, d) * S(-.1, .1, st.y - p1.y); 

  //if(st.x > 0.49 || st.y > 0.49) m1 = 1.;
  //给圆点一个o1的方向向量，在这个方向上增加颜色强度，其他方向减弱颜色强度
  return vec2(m1 * o1 * 30. + m2 * o2 * 5.); 
}
//---------------------------------------------------
void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  uv -= .5;
  uv.x *= iResolution.x / iResolution.y;

  vec2 m = iMouse.xy / iResolution.xy;
  float t = iTime * .05 + m.x;

  vec3 camPos = vec3(.5, .2, .0);
  vec3 lookat = vec3(.5, .2, 1.); //相机看向的点

  vec2 rainDistort = Rain(uv * 5., t) * .2;    //雨点
  rainDistort += Rain(uv * 7., t) * .5;   //雨点效果增强

  uv.x += sin(uv.y * 70.) * 0.003;    //扭曲坐标系
  uv.y += sin(uv.x * 170.) * 0.001;

  ray r = getRay(uv - rainDistort, camPos, lookat, 2.);
  
  vec3 col = streetLight(r, t); //街灯效果
  col += HeadLight(r, t);   //车灯效果
  col += TailLight(r, t);   //尾灯效果
  col += EnvLight(r, t);    //环境灯光效果
  col += (r.d.y + 0.25) * vec3(.2, .1, .5); //天空减半效果，整个背景颜色从上到下渐变

  //col = vec3(rainDistort, .0);
  gl_FragColor = vec4(col, 1.);
}