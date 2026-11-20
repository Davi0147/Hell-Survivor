/**
 * Textos das janelas de explicação do menu de pausa (clique num bônus ou numa arma).
 * Armas: chave = ícone da arma (o `-evo` é a forma evoluída).
 */
export const WEAPON_INFO: Record<string, { name: string; text: string }> = {
  'icon-weapon-soulbolt': {
    name: 'DISPARO DE ALMAS',
    text: 'Atira esferas de alma no monstro mais próximo. Cada nível aumenta o dano e a velocidade dos disparos.',
  },
  'icon-weapon-soulbolt-evo': {
    name: 'RAIO DO APOCALIPSE',
    text: 'Os disparos viram raios dourados de alta cadência que atravessam muitos monstros de uma vez.',
  },
  'icon-weapon-scythes': {
    name: 'LÂMINAS ORBITAIS',
    text: 'Foices giram em volta da Nixy e cortam quem encostar. Cada nível adiciona mais uma lâmina (até 6).',
  },
  'icon-weapon-scythes-evo': {
    name: 'CEIFADORA DO VAZIO',
    text: 'As foices se fundem num vórtice carmesim muito rápido que corta sem parar tudo ao redor.',
  },
  'icon-weapon-hellfire': {
    name: 'CHAMAS DO PURGATÓRIO',
    text: 'Solta pulsos de fogo em volta da Nixy de tempos em tempos. Cada nível aumenta o raio e o dano.',
  },
  'icon-weapon-hellfire-evo': {
    name: 'SUPERNOVA ABISSAL',
    text: 'Ondas estelares queimam uma área enorme e ainda devolvem um pouco de vida à Nixy.',
  },
  'icon-weapon-daggers': {
    name: 'ADAGAS DE SANGUE',
    text: 'Arremessa um leque de adagas para onde a Nixy está olhando. Cada nível adiciona adagas e dano.',
  },
  'icon-weapon-daggers-evo': {
    name: 'CHUVA CARMESIM',
    text: 'Dispara 8 adagas espectrais quase sem pausa, atravessando vários monstros.',
  },
  'icon-weapon-chains': {
    name: 'CADEIAS ABISSAIS',
    text: 'Correntes prendem e machucam grupos de monstros próximos, deixando-os parados por um tempo.',
  },
  'icon-weapon-chains-evo': {
    name: 'GRILHÕES TARTARUS',
    text: 'Prende até 8 monstros em estacas abissais e os deixa atordoados por quase 2 segundos.',
  },
  'icon-weapon-meteor': {
    name: 'METEORO INFERNAL',
    text: 'Rochas em chamas caem do céu e explodem sobre a horda. Cada nível aumenta o dano e a frequência.',
  },
  'icon-weapon-meteor-evo': {
    name: 'CATACLISMO SOLAR',
    text: 'Um bombardeio de 5 meteoros gigantes que destrói grupos inteiros de monstros.',
  },
};
