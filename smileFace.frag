#define S(a, b, t) smoothstep(a, b, t)
//clamp函数，将x数值限制在0 1之间，范围之外的数值为0
#define Sat(x) clamp(x, .0, 1.)

//t在a b区间中，将t映射到 0 1
//添加clamp函数保证数值不会出现超出范围的值，如负数
float remap01(float a, float b, float t) {
  return Sat((t - a) / (b - a));
}

//t在区间a  b中，将t重新映射到 c d 区间中
float remap(float a, float b, float c, float d, float t) {
  return Sat(((t - a) / (b - a)) * (d - c) + c);
}

// 设置当前矩形为局部坐标系，坐标原点在左下角，11在右上角位置
// 左下角到uv的向量，和左下角到右上角向量，两个向量的分别对应相除
vec2 within(vec2 uv, vec4 rect) {
  return (uv - rect.xy) / (rect.zw - rect.xy);
}

vec4 head(vec2 uv) {
  //两种渐变：颜色渐变 区域渐变
  //区域渐变：最好是图像最外层的渐变可以是 0011，内层的渐变是1100

  vec4 color = vec4(.9, .65, .1, 1.);
  float d = length(uv);

  //整体黄色圆,颜色渐变1100
  //smoothstep渐变 .49 .5 渐变 以内为1， .5以外为0的圆饼
  //关于渐变重点关注渐变区域和 0 1 的区域
  color.a = S(.5, .49, d);

  //外层颜色渐变，区域渐变1 1 .5 0
  //.35 .5区间内映射为 0 1 线性渐变
  float edgeShade = remap01(.35, .5, d);
  edgeShade *= edgeShade; //数值平方，让渐变更陡峭
  //乘以.5 渐变范围0 0 .5 1 数值反转1 1 .5 0
  color.rgb *= 1. - edgeShade * .5; 

  //最外层圆环，颜色渐变0 0 1 1
  //在.47 .48渐变颜色混合，.48以外范围为圆环原色
  color.rgb = mix(color.rgb, vec3(.6, .3, .1), S(.47, .48, d));

  //额头高光
  float highlight = S(.41, .405, d);  //高光圆饼，区域渐变 1100
  //通过映射高光圆饼的高光程度和高光范围，高光范围为按照y进行变化，高光程度为y的值进行映射
  highlight *= remap(.41, -.1, .75, .0, uv.y); 
  highlight *= S(.18, .19, length(uv - vec2(.21, .08)));

  //面颊红晕  1 1 0 0
  d = length(uv - vec2(.25, -.2));  //红晕只画一边，另一边由最外层的对称效果得到
  float cheeck = S(.2, .01, d) * .4;  //乘以.4减小红晕颜色
  cheeck *= S(.17, .16, d); //加一层边缘效果，增强.17到.16的渐变色
  color.rgb = mix(color.rgb, vec3(1., .1, .1), cheeck);

  color.rgb = mix(color.rgb, vec3(1.), highlight);
  return color;
}

vec4 eye(vec2 uv, float side, vec2 m, float smileFactor) {
  uv -= .5; // 设置原点在坐标系中心
  uv.x *= side;
  vec4 color = vec4(1.);

  float d = length(uv);

  //蓝色眼白部分 区域渐变 0 0 1 1
  vec3 iriColor = vec3(.3, .5, 1.);
  color.rgb = mix(vec3(1.), iriColor, S(.1, .7, d) * .5);
  //眼角阴影 颜色渐变1100，渐变是坐标轴右下两个负数得到的阴影最多
  color.rgb *= 1. - S(.45, .5, d) * .5 * Sat(-uv.y - uv.x * side);

  float d1 = length(uv - m * .3); //移动眼睛效果
  //瞳孔
  //黑色圆环 区域渐变 1 1 0 0
  color.rgb = mix(color.rgb, vec3(.0), S(.3, .28, d1));  //黑色
  //蓝色部分
  iriColor.rgb *= S(.3, .05, d1) + 1.; //颜色渐变 1100
  float irisMask = S(.28, .25, d1);
  color.rgb = mix(color.rgb, iriColor, irisMask);  //区域渐变1100
  
  //黑色瞳孔 1100
  float pupilSize = mix(.4, .16, smileFactor);
  d1 = length(uv - m * .5);
  float pupilMask = S(pupilSize, pupilSize * .95, d1);
  pupilMask *= irisMask;  //用蓝色眼白的渐变范围去限制黑色瞳孔，防止瞳孔放大超过蓝色眼白
  color.rgb = mix(color.rgb, vec3(.0), pupilMask);

  //瞳孔高光 1100
  float t = iTime * 3.;   //瞳孔高光闪耀的效果
  vec2 offs = vec2(sin(t + uv.y * 15.), sin(t + uv.x * 15.));
  uv += offs * .02 * (1. - smileFactor);
  float highlight = length(uv - vec2(-.15, .15));
  color.rgb = mix(color.rgb, vec3(1.), S(.1, .09, highlight));
  highlight = length(uv + vec2(-.08, .08));
  color.rgb = mix(color.rgb, vec3(1.), S(.07, .05, highlight));

  //通过设置的alpha值，决定眼睛部分要显示的区域有多大 1 1 0 0
  //超过坐标.5的部分的alpha值为0
  color.a = S(.5, .48, d);
  return color;
}

vec4 mouth(vec2 uv, float smileFactor) {
  uv -= .5;
  vec4 color = vec4(.5, .18, .05, 1.);

  uv.y *= 1.5;  //y轴缩放
  uv.y -= uv.x * uv.x * 2. * smileFactor; //二次函数，让y坐标向上位移

  uv.x *= mix(2.5, 1., smileFactor);  //x轴横向缩放

  //嘴巴形状
  //矩形坐标系中画圆可以得到椭圆
  float d = length(uv); 
  color.a = S(.5, .48, d);  //通过设置alpha的值，只显示椭圆的部分，其余部分为0

  //牙齿
  vec2 tUv = uv;
  tUv.y += (abs(uv.x) * .5) * (1. - smileFactor);  //改变坐标系，用绝对值函数让左右对称
  float td = length(tUv - vec2(.0, .6));
  vec3 toothColor = vec3(1.) * S(.6, .35, d); //颜色渐变 1100
  color.rgb = mix(color.rgb, toothColor, S(.4, .37, td)); //区域渐变 1100

  //舌头
  td = length(uv - vec2(.0, -.5));
  color.rgb = mix(color.rgb, vec3(1., .5, .5), S(.5, .2, td)); //区域渐变 1100

  return color;
}

vec4 brow(vec2 uv, float smileFactor) {
  //用两个圆的差集来实现眉毛的形状
  //坐标系按矩形发生了形变，圆表现为椭圆
  uv -= .5;
  float offs = mix(.2, 0., smileFactor);  //上下移动
  uv.y += offs;

  //眉毛部分
  //调整眉毛位置
  float y = uv.y;
  uv.y += uv.x * mix(.5, .8, smileFactor) -.3;  //沿y轴调整，调整幅度为kx函数
  uv.x -= mix(.0, .1, smileFactor) ; //沿x轴移动一点

  vec4 color = vec4(.0);
  float blur = .1;

  //第一个圆
  float d1 = length(uv);
  float s1 = S(.45, .45 - blur, d1);

  //第二个圆
  float d2 = length(uv - vec2(.1, -.2) * .7);
  float s2 = S(.5, .5 - blur, d2);

  //差集操作得到眉毛部分
  float browMask = Sat(s1 - s2);
  float colMask = remap01(.5, .8, y) * .75; //颜色渐变 把.7到.8映射到01范围
  colMask *= S(.6, .9, browMask); //区域渐变 眉毛颜色 眉毛坐标的.6 .9部分进行渐变处理白色
  colMask *= smileFactor;
  vec4 browCol = mix(vec4(.4, .2, .2, 1.), vec4(1.), colMask);  //混合一点白色
  color = mix(color, browCol, S(.2, .4, browMask));

  //眉毛阴影
  //同样的操作，两个圆的差集
  uv.y += .15 - offs * .5;
  blur += mix(.0, .1, smileFactor);
  d1 = length(uv);
  s1 = S(.45, .45-blur, d1);
  d2 = length(uv - vec2(.1, -.2) * .7);
  s2 = S(.5, .5 - blur, d2);
  float shadowMask = Sat(s1 - s2);
  color = mix(color, browCol, S(.0, 1., shadowMask));  //区域渐变，眉毛阴影颜色就是眉毛颜色模糊的效果

  return color;
}

vec4 smile(vec2 uv, vec2 m, float smileFactor) {
  vec4 color = vec4(.0, .0, .0, 1.);
  float side = sign(uv.x);

  //对称，负x部分也能得到正x部分相同的效果
  uv.x = abs(uv.x);

  vec4 head = head(uv);
  //通过alpha通道来混合颜色
  color = mix(color, head, head.a);

  //眼睛部分
  //以当前矩形作为局部坐标系，坐标原点在左下角
  vec4 eye = eye(within(uv, vec4(.03, -.1, .37, .25)), side, m, smileFactor);
  color = mix(color, eye, eye.a);

  //嘴巴部分
  vec4 mouth = mouth(within(uv, vec4(-.3, -.4, .3, -.1)), smileFactor);
  color = mix(color, mouth, mouth.a);

  //眉毛
  vec4 brow = brow(within(uv, vec4(.03, .2, .38, .35)), smileFactor);
  color = mix(color, brow, brow.a);

  return color;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  uv -= .5;
  uv.x *= iResolution.x / iResolution.y;  //调整显示分辨率

  vec2 m = iMouse.xy / iResolution.xy;
  m -= .5f;

  float smileFactor = sin(iTime) * .5 + .5;
  gl_FragColor = smile(uv, m, smileFactor);
}