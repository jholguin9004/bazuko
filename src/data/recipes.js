// src/data/recipes.js
// Recetas de crafteo: ingredientes (id item -> cantidad) -> resultado

export const RECIPES = [
  {
    id: 'radioTransistor',
    name: 'Radio transistor AM/FM',
    emoji: '📻',
    result: 'radioTransistor',
    qty: 1,
    ingredients: {
      chatarra: 1,
      cable: 2,
      pilas: 1
    }
  },

  {
    id: 'arma',
    name: 'Arma casera',
    emoji: '🗡️',
    result: 'arma',
    qty: 1,
    ingredients: {
      chatarra: 2,
      alambre: 1,
      madera: 1
    }
  },
  {
    id: 'mochila',
    name: 'Mochila',
    emoji: '🎒',
    result: 'mochila',
    qty: 1,
    ingredients: {
      tela: 3,
      alambre: 1
    }
  },
  {
    id: 'curita',
    name: 'Curita',
    emoji: '🩹',
    result: 'curita',
    qty: 2,
    ingredients: {
      tela: 1,
      plastico: 1
    }
  },
  {
    id: 'antibiotico',
    name: 'Antibiótico',
    emoji: '💊',
    result: 'antibiotico',
    qty: 1,
    ingredients: {
      pastilla: 1,
      botella: 1
    }
  },
  {
    id: 'rifa',
    name: 'Cartón de rifa',
    emoji: '🎟️',
    result: 'rifa',
    qty: 1,
    ingredients: {
      carton: 2,
      lata: 1
    }
  },
  {
    id: 'hierba',
    name: 'Hierba seca',
    emoji: '🌿',
    result: 'hierba',
    qty: 2,
    ingredients: {
      tela: 1,
      madera: 1
    }
  }
];
