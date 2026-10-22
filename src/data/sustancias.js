// Datos ajustables de las sustancias y de la stat de traba.
// Cada número lleva su unidad y el efecto que tiene en el juego.

/** Perfil de cada sustancia que traba (el tintico no): cuánta traba da, qué tan rápido pega y qué efectos pesan más */
export const PERFILES = {
  pegante: {
    traba: 25,
    subida: 5,
    duracion: 120,
    bajon: 'medio',
    velocidadSombra: 1.5,
    pesos: { velocidad: 0, euforia: 0.3, mareo: 1, sombras: 0.4, tesorosFalsos: 0.2 }
  },
  pastilla: {
    traba: 35,
    subida: 40,
    duracion: 240,
    bajon: 'fuerte',
    velocidadSombra: 2.5,
    pesos: { velocidad: 0.2, euforia: 1, mareo: 0.3, sombras: 0.2, tesorosFalsos: 1 }
  },
  bazuco: {
    traba: 40,
    subida: 1,
    duracion: 45,
    bajon: 'brutal',
    velocidadSombra: 4.5,
    pesos: { velocidad: 1, euforia: 0.5, mareo: 0.2, sombras: 1, tesorosFalsos: 0.1 }
  }
};

/** Icono de cada sustancia del dealer (el tintico es café: tiene icono pero no perfil de traba) */
export const ICONOS = { tintico: '☕', pegante: '🧴', pastilla: '💊', bazuco: '🔥' };

/** Parámetros generales de la traba */
export const TRABA = {
  max: 100,                  // puntos de traba máximos
  decaimientoBase: 0.05,     // traba/s que baja siempre
  umbrales: { trabado: 30, muyTrabado: 60, zonaRoja: 85, colapso: 100 }, // traba mínima de cada nivel
  escalaNivel: { leve: 0.3, trabado: 1, muyTrabado: 1, zonaRoja: 1 },    // × sobre velocidad y euforia
  velocidadMax: 1.25,        // × velocidad de movimiento con peso 1 y escala 1
  euforiaAnimoPorSeg: 0.5,   // ánimo/s que sube la euforia con peso y escala 1
  frenoNecesidades: 0.5,     // fracción del DECAY de hambre y energía que se compensa
  saludZonaRojaPorSeg: 0.5   // salud/s que se pierde en zona roja o peor
};

/** Bajón al terminar una dosis; los totales se reparten durante la duración */
export const BAJONES = {
  leve:   { animo: 5,  energia: 5,  duracion: 30, vicioMult: 1.5 }, // animo y energia: puntos totales que se pierden; duracion en s; vicioMult: × sobre el DECAY de vicio
  medio:  { animo: 10, energia: 10, duracion: 45, vicioMult: 2 },
  fuerte: { animo: 20, energia: 15, duracion: 60, vicioMult: 2.5 },
  brutal: { animo: 30, energia: 25, duracion: 60, vicioMult: 3 }
};

/** Mareo de cámara */
export const MAREO = {
  porNivel: { leve: 0, trabado: 0, muyTrabado: 0.5, zonaRoja: 1 }, // intensidad base por nivel (0–1)
  pisoPeso: 0.3,           // fracción mínima de intensidad aunque el peso de mareo sea 0
  amplitudLateral: 0.03,   // rad de giro lateral máximo
  frecuenciaLateral: 0.25, // Hz
  amplitudAlabeo: 0.04,    // rad de alabeo máximo
  frecuenciaAlabeo: 0.18,  // Hz
  desaturacionMax: 0.5     // desaturación del color (0–1) con mareo 1
};

/** Viñeta oscura de pantalla */
export const VINETA = {
  opacidadPorNivel: { leve: 0, trabado: 0, muyTrabado: 0.25, zonaRoja: 0.6 } // opacidad 0–1
};

/** Sombras y tesoros falsos */
export const ALUCINACIONES = {
  maxSombras: 3,            // sombras simultáneas
  sombraPorSeg: 0.08,       // probabilidad/s de que aparezca una, × peso de sombras
  tesoroPorSeg: 0.05,       // probabilidad/s de un tesoro falso, × peso de tesorosFalsos
  maxTesoros: 1,            // tesoros falsos simultáneos
  distanciaAparicion: 12,   // m del jugador a los que aparecen
  distanciaMinAparicion: 6, // m mínimos al jugador del punto de aparición real (si queda más cerca, no aparece)
  distanciaDesvanecer: 25,  // m a los que se desvanecen
  radioAlcance: 0.9,        // m a los que una sombra "alcanza" al jugador
  radioTesoro: 15,          // m de distancia máxima a la que aparece un tesoro falso
  desvanecerSeg: 1,         // s que tarda en desvanecerse
  opacidadSombra: 0.6,      // opacidad 0–1 de la sombra
  castigoAnimo: 5,          // ánimo que quita una sombra al alcanzarte
  castigoSalud: 3           // salud que quita una sombra al alcanzarte
};

/** Consecuencias del colapso */
export const COLAPSO = {
  horas: 4,   // horas de juego que se pierden
  salud: 25,  // salud con la que despierta
  animo: 25   // ánimo con el que despierta
};

/** Textos de situación */
export const TEXTOS = {
  colapso: [
    'Te despertaste abrazado a un poste.',
    'Amaneciste en un andén sin zapatos y sin dignidad.',
    'Un perro te cuidó toda la noche. Él sí es buena gente.'
  ],
  sombraAlcanza: [
    'Algo te tocó el hombro. No había nadie.',
    'Sentiste un aliento helado en la nuca.',
    'Una sombra pasó rozándote y se esfumó.'
  ],
  tesoroFalso: [
    'Brillaba… pero era una tapa de gaseosa.',
    'Juraste que era una moneda. Era un pedazo de vidrio.',
    'Era un reflejo. Otra vez.'
  ],
  zonaRoja: [
    'El corazón te va a mil. Pare ahí, parcero.',
    'Te zumban los oídos y el piso se mueve.',
    'Todo da vueltas. Si seguís, no la contás.'
  ]
};

const ETIQUETAS_EFECTO = [
  ['animo', 'ánimo'], ['energia', 'energía'], ['salud', 'salud'],
  ['hambre', 'hambre'], ['sed', 'sed'], ['higiene', 'higiene']
];

/** Texto de efecto de un ítem consumible: icono, vicio y cada stat presente con signo */
export function describirEfecto(item) {
  const partes = [`+${item.amount} vicio`];
  for (const [campo, etiqueta] of ETIQUETAS_EFECTO) {
    const v = item[campo];
    if (v) partes.push(`${v > 0 ? '+' : ''}${v} ${etiqueta}`);
  }
  const icono = ICONOS[item.id];
  return (icono ? `${icono} ` : '') + partes.join(', ');
}
