precision mediump float;

/* Rendu du jeu */
uniform sampler2D uSampler;

/* Texture de déformation en rouge et vert */
uniform sampler2D uDeformation;

/* Texture pour contrôler l'intensité de la déformation */
uniform sampler2D uIntensity;

/* Interval de temps multiplié par la vitesse depuis l'activation du composant */
uniform float uTime;

/* Échelle de la déformation */
uniform float uScale;

/* Coordonnées UV du fragment */
varying vec2 vTextureCoord;

vec4 getIntensityDef(sampler2D uIntensity, float uTime, float uScale) {
    vec2 coordDef;
    coordDef.x = uTime;
    coordDef.y = 0.5;
    return texture2D(uIntensity, coordDef) * uScale;
}

vec4 getDeformationVect(sampler2D uDeformation, float uTime, vec2 vTextureCoord) {
    vec2 decalByTime = vTextureCoord + abs(sin(uTime));
    return texture2D(uDeformation, decalByTime);
}

void main(void) {
     //Calcul intensity à appliquer selon le bon axe.
    float xIntensity = uScale * texture2D(uIntensity, vec2(uTime,0.5)).x - 0.005;
    float yIntensity = uScale * texture2D(uIntensity, vec2(uTime,0.5)).y -0.005;

    //Recherche du vecteur deformation par la texture deformatio,
    vec2 offSetCoord = vec2(vTextureCoord.x + sin(uTime), vTextureCoord.y + sin(uTime));
    vec2 vecDeformation = texture2D(uDeformation, offSetCoord).xy;
    
    //Texture finale avec l'offset de deformation. Le -0.5 du vecteur deformation correspond à un décallage de lecran vers un point en bas à gauche.
    vec2 vecTextwithOffSet = vec2(vTextureCoord.x + ( (vecDeformation.x - 0.5) * xIntensity), vTextureCoord.y + ( (vecDeformation - 0.5) * yIntensity));

    //Application finale
    gl_FragColor = texture2D(uSampler, vecTextwithOffSet);
}