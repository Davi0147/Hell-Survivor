import type { DialogueLine } from '../systems/DialogueSystem';

/**
 * Roteiro do jogo: todas as falas de diálogo do Modo História.
 * Para mudar um texto, edite só este arquivo. `speaker` define a voz, `portraitKey` o retrato.
 */

/** Falas da Nixy ao começar cada capítulo (primeira vez, sem ter morrido). */
export const CHAPTER_OPENING_DIALOGUE: Record<number, DialogueLine[]> = {
  1: [
    {
      speaker: 'nixy',
      speakerName: 'Nixy',
      portraitKey: 'chat-nixy',
      text: 'Argh... As catacumbas do abismo. Não me importa quantos demônios ou carrascos aquele filho da puta do Chefe mande atrás de mim...'
    },
    {
      speaker: 'nixy',
      speakerName: 'Nixy',
      portraitKey: 'chat-nixy',
      text: 'Eu vou sair dessa merda, nem que eu morra tentando! Hora da colheita!'
    }
  ],
  2: [
    {
      speaker: 'nixy',
      speakerName: 'Nixy',
      portraitKey: 'chat-nixy',
      text: 'Então esse é o segundo círculo... O ar daqui cheira a enxofre queimado e arrogância de demônio antigo.'
    },
    {
      speaker: 'nixy',
      speakerName: 'Nixy',
      portraitKey: 'chat-nixy',
      text: 'Rosalin já foi pro saco. Quem quer que seja o próximo engravatado no meu caminho... que prepare o caixão!'
    }
  ],
};

/** Primeiro encontro com a Imperatriz Rosalin (chefe do Capítulo 1). */
export const ROSALIN_INTRO_DIALOGUE: DialogueLine[] = [
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'Ora, ora, ora... Olha só quem resolveu sair da sua mesinha de escritório.'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'Nixy!'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'O que aconteceu, querida? Perdeu o emprego ou finalmente perdeu o juízo?'
  },
  {
    speaker: 'nixy',
    speakerName: 'Nixy',
    portraitKey: 'chat-nixy',
    text: 'Os dois. E adivinha qual dos dois problemas eu vim resolver primeiro?'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'Hahaha! Continua com essa boquinha suja, pelo visto.'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'Vamos facilitar as coisas, querida. Você já causou problemas demais por aqui. Que tal dar meia-volta, retornar ao trabalho e deixar os adultos resolverem essa bagunça?'
  },
  {
    speaker: 'nixy',
    speakerName: 'Nixy',
    portraitKey: 'chat-nixy',
    text: 'Ow, sua [CENSURADO]! Sai da minha frente antes que eu arranque essas asas de merda e enfie elas no seu [CENSURADO]!'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'Nossa! Alguém acordou com o rabinho pegando fogo!'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'Sempre soube que você era esquentadinha, mas nunca imaginei que fosse tão desesperada.'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'Embora... pensando bem, talvez eu devesse ter previsto isso. O chefe sempre teve um talento especial para ignorar as funcionárias problemáticas.'
  },
  {
    speaker: 'nixy',
    speakerName: 'Nixy',
    portraitKey: 'chat-nixy',
    text: 'Engraçado. Eu sempre achei que ele tivesse um talento especial para promover as [CENSURADO] que dão pra ele.'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'C-COMO É QUE É?!'
  },
  {
    speaker: 'nixy',
    speakerName: 'Nixy',
    portraitKey: 'chat-nixy',
    text: 'Você ouviu, querida. Ou precisa que eu desenhe? Posso até preencher um formulário, se ajudar.'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'Sua... sua insolente!'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'Eu conquistei cada pedaço do poder que tenho! Enquanto você ficava enterrada em papelada, eu estava subindo na hierarquia!'
  },
  {
    speaker: 'nixy',
    speakerName: 'Nixy',
    portraitKey: 'chat-nixy',
    text: 'Subindo na hierarquia ou subindo no colo do chefe? Porque, sinceramente, com essa sua cara de [CENSURADO], fica difícil distinguir.'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'Sua inveja é tão patética que chega a ser adorável.'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'Você passou mil anos rastejando pelos corredores deste inferno, achando que alguém se importava com você. E agora está aqui, fazendo birra porque descobriu que é descartável.'
  },
  {
    speaker: 'nixy',
    speakerName: 'Nixy',
    portraitKey: 'chat-nixy',
    text: 'E você passou mil anos lambendo as botas de um demônio que nem deve lembrar seu nome quando está de costas.'
  },
  {
    speaker: 'nixy',
    speakerName: 'Nixy',
    portraitKey: 'chat-nixy',
    text: 'A diferença é que eu sei fazer meu trabalho.'
  },
  {
    speaker: 'nixy',
    speakerName: 'Nixy',
    portraitKey: 'chat-nixy',
    text: 'Você só sabe abrir as pernas e bater as asas.'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: '...'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'Muito bem.'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'Eu ia deixar você voltar para sua insignificante vidinha de funcionária revoltada.'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'Mas agora...'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'Agora vou arrancar cada pedacinho dessa sua arrogância.'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'Vou me deliciar com seu sangue enquanto uso esses chifres ridículos para abrir um buraco tão fundo em você que nem o próprio inferno vai conseguir encontrar o fundo!'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'HAHAHAHAHAHA!'
  },
  {
    speaker: 'nixy',
    speakerName: 'Nixy',
    portraitKey: 'chat-nixy',
    text: 'Caralho, mulher. Você ensaiou isso na frente do espelho?'
  },
  {
    speaker: 'succubus',
    speakerName: 'Rosalin',
    portraitKey: 'chat-succubus',
    text: 'EU VOU MATAR VOCÊ!'
  },
  {
    speaker: 'nixy',
    speakerName: 'Nixy',
    portraitKey: 'chat-nixy',
    text: 'ENTÃO CAI DENTRO, SUA DESGRAÇADA!'
  }
];

/** Primeiro encontro com Azazel (chefe do Capítulo 2). Roteiro do dono (2026-11-27). */
const azazelSays = (text: string): DialogueLine => ({ speaker: 'azazel', speakerName: 'Azazel', portraitKey: 'chat-azazel', text });

export const AZAZEL_INTRO_DIALOGUE: DialogueLine[] = [
  azazelSays('O que uma criatura tão inferior está fazendo causando desgraça no reino?'),
  nixySays('Ah, Azazel, cê ainda tá nessa? Seu reino? Sério?'),
  azazelSays('Eu sou o Deus do novo mundo, curve-se diante de mim, demônio insolente!'),
  nixySays('Bem que falaram que você havia enlouquecido de vez, mas eu achei que fosse mentira...'),
  azazelSays('Como ousa me taxar de louco?!'),
  azazelSays('Você vai pagar pela sua boca! Eu irei arrancar a sua cabeça e condenar sua alma para fazer parte do meu trono por toda a eternidade!'),
  nixySays('Quem?'),
  azazelSays('Hã?! O quê---'),
  nixySays('Perguntou.'),
  azazelSays('Vai se fuder!')
];

/** Como a cena entra numa imagem nova da cinemática de fim de capítulo. */
export type EndingTransition = 'fade' | 'cut' | 'cut-shake';

export interface EndingLine {
  /** Número da imagem (`EndChapN_<image>.jpg`). */
  image: number;
  speaker: 'nixy' | 'azazel' | 'narrator';
  text: string;
  /** Entrada na imagem quando ela muda: fade suave, corte seco com batida, ou corte + tremida. */
  enter?: EndingTransition;
  /** Fala interrompida: passa sozinha para a próxima etapa depois de terminar de digitar. */
  autoAdvanceMs?: number;
}

/**
 * Derrota do Azazel (fim do Capítulo 2). Depois da última fala a tela corta para o preto e a
 * imagem 7 (Nixy arrancando a cabeça dele) entra com estrondo, grito e tela tremendo.
 */
export const CHAPTER2_ENDING: EndingLine[] = [
  { image: 1, speaker: 'azazel', text: 'Ai... Não acredito, como isso aconteceu?' },
  { image: 1, speaker: 'azazel', text: 'Como um deus pode ter perdido pra um demônio tão inferior?' },
  { image: 1, speaker: 'azazel', text: 'Como!' },
  { image: 2, speaker: 'azazel', text: 'Ahhh, pera aí, isso dói!', enter: 'cut' },
  { image: 3, speaker: 'azazel', text: 'Hehe, Nixy... Meu amor, olha, você sabe que eu tava brincando, né?', enter: 'fade' },
  { image: 3, speaker: 'azazel', text: 'Eu sempre gostei tanto de você, eu que te indiquei quando chegou aqui, sabia?' },
  { image: 4, speaker: 'azazel', text: 'Oh...', enter: 'cut-shake' },
  { image: 4, speaker: 'azazel', text: 'Nixy?...' },
  { image: 5, speaker: 'azazel', text: 'Ehh...', enter: 'cut-shake' },
  { image: 6, speaker: 'azazel', text: 'O que você vai faz---', enter: 'cut', autoAdvanceMs: 120 }
];

/**
 * Retorna falas de ressurreição da Nixy com o ódio escalando progressivamente a cada morte no Modo História
 */
export function getStoryRevivalDialogue(deathCount: number): DialogueLine[] {
  if (deathCount <= 1) {
    return [
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'De volta do mundo dos mortos... É claro. Eu já estou morta, seus idiotas!'
      },
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'Vocês não podem me matar duas vezes! Nem que eu tenha que morrer mil vezes, eu vou sair dessa merda!'
      }
    ];
  }

  if (deathCount === 2) {
    return [
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'Argh... Minha cabeça... Então é assim que funciona? Eu caio e o purgatório me cospe de volta pro mesmo buraco?!'
      },
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'Ótimo! Porque agora eu tô começando a ficar REALMENTE puta!'
      }
    ];
  }

  if (deathCount === 3) {
    return [
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'De novo essa merda?! Esses desgraçados acham mesmo que vão me vencer pelo cansaço?!'
      },
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'Eu passei mil anos carimbando papel no escuro, seus [CENSURADO]! Teimosia é o meu sobrenome!'
      }
    ];
  }

  if (deathCount === 4) {
    return [
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'CARALHO! Doeu pra cacete dessa vez!'
      },
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'Quem foi o filho da puta que me cercou?! Eu vou arrancar a espinha de cada um de vocês com os dentes!'
      }
    ];
  }

  if (deathCount === 5) {
    return [
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'CINCO VEZES?! Vocês tão de sacanagem comigo?!'
      },
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'Esquece a saída! Agora é pessoal! Eu não vou deixar uma única alma inteira nesse corredor!'
      }
    ];
  }

  if (deathCount === 6) {
    return [
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'EU ODEIO ESSE LUGAR! EU ODEIO ESSES MONSTROS! EU ODEIO A PORRA DO MEU EX-CHEFE!'
      },
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'Saiam da minha frente antes que eu engula vocês vivos, seus lixos do inferno!'
      }
    ];
  }

  if (deathCount === 7) {
    return [
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'Meu sangue tá fervendo tanto que até o chão tá derretendo...'
      },
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'Podem vir em bando, podem vir em mil! Cada vez que eu volto, o meu ódio dobra de tamanho!'
      }
    ];
  }

  if (deathCount === 8) {
    return [
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'Hahahaha... Sabe o que é engraçado? Eu nem sinto mais dor. Só vontade de MATAR.'
      },
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'Vem cá, seus cachorros sarnentos... A titia Nixy trouxe massacre pra todo mundo!'
      }
    ];
  }

  if (deathCount === 9) {
    return [
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'NOVE VEZES NESSE INFERNO! Eu juro que quando eu colocar as mãos no pescoço daqueles engravatados...'
      },
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'NADA VAI SOBRAR! NEM AS CINZAS!'
      }
    ];
  }

  // 10+ Mortes: Ódio Máximo Absoluto com variações ferozes
  const maxRageVariations: DialogueLine[][] = [
    [
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'EU SOU IMORRÍVEL, SEUS [CENSURADO]! O próprio inferno vai pedir arrego antes de eu desistir!'
      }
    ],
    [
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'MAIS UMA VEZ! E eu tô com tanto ódio acumulado que vou explodir esse círculo inteiro no soco!'
      }
    ],
    [
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'Vocês criaram um monstro quando me deram mais quinhentos anos... AGORA AGUENTEM A PORRA DA CONSEQUÊNCIA!'
      }
    ],
    [
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'SANGUE! EU QUERO VER SANGUE! Ninguém sai vivo dessa arena hoje, ouviram?! NINGUÉM!'
      }
    ]
  ];

  return maxRageVariations[(deathCount - 10) % maxRageVariations.length];
}

/**
 * Retorna o diálogo de revanche de um Chefe caso o jogador já tenha sido derrotado por ele anteriormente.
 * Arquitetura padrão de Lore para todos os Chefes do jogo!
 */
export function getBossRematchDialogue(bossId: string, deathsToBoss: number): DialogueLine[] {
  if (bossId === 'azazel') {
    if (deathsToBoss === 1) {
      return [
        {
          speaker: 'azazel',
          speakerName: 'Azazel',
          portraitKey: 'chat-azazel',
          text: 'Sua alma teimosa ousa retornar ao meu domínio? Da última vez deixei suas cinzas escaparem... Não cometerei o mesmo erro.'
        },
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'Menos papo de vilão dramático e mais porrada, Azazel! Já decorei seus truques de mágica barata!'
        }
      ];
    }
    return [
      {
        speaker: 'azazel',
        speakerName: 'Azazel',
        portraitKey: 'chat-azazel',
        text: 'Insistência fútil. Quantas vezes precisarei esmagar sua mente na escuridão até você aceitar seu destino?'
      },
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'Até eu apagar esse seu sorrisinho arrogante no soco! Vem logo!'
      }
    ];
  }

  if (bossId === 'rosalin') {
    if (deathsToBoss === 1) {
      return [
        {
          speaker: 'succubus',
          speakerName: 'Rosalin',
          portraitKey: 'chat-succubus',
          text: 'Ora, ora... Olha quem voltou rastejando das cinzas. A surra que eu te dei ainda não foi suficiente para colocar você no seu devido lugar, querida?'
        },
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'Guarda o fôlego, Rosalin. Da última vez eu só estava aquecendo... Agora eu vim pra arrancar a sua cabeça!'
        }
      ];
    }

    if (deathsToBoss === 2) {
      return [
        {
          speaker: 'succubus',
          speakerName: 'Rosalin',
          portraitKey: 'chat-succubus',
          text: 'Você de novo?! Hahahaha! Confesso que sua humilhação está se tornando o meu passatempo favorito neste círculo.'
        },
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'Ri bastante enquanto ainda tem dentes na boca, sua [CENSURADO]! Dessa vez você não escapa!'
        }
      ];
    }

    return [
      {
        speaker: 'succubus',
        speakerName: 'Rosalin',
        portraitKey: 'chat-succubus',
        text: 'Quantas vezes mais eu vou precisar pisar na sua cara até você entender que jamais vencerá uma superiora, sua funcionáriazinha patética?!'
      },
      {
        speaker: 'nixy',
        speakerName: 'Nixy',
        portraitKey: 'chat-nixy',
        text: 'CALA A BOCA E LUTA! Eu posso morrer mil vezes, mas eu só preciso te matar UMA!'
      }
    ];
  }

  return [];
}

/** Fala da Nixy na tela de diálogo (retrato na esquerda). */
function nixySays(text: string): DialogueLine {
  return { speaker: 'nixy', speakerName: 'Nixy', portraitKey: 'chat-nixy', text };
}

/** Fala de um funcionário do corredor (retrato `portrait-<id>` na direita). */
function npcSays(id: string, name: string, text: string): DialogueLine {
  return { speaker: id, speakerName: name, portraitKey: `portrait-${id}`, text };
}

/** Lina e Gina aparecem juntas; só acende quem fala (as duas = falando juntas). */
const LINA_GINA: readonly [string, string] = ['portrait-lina', 'portrait-gina'];
function duoSays(who: 'lina' | 'gina' | 'ambas', text: string): DialogueLine {
  const speaking = who === 'lina' ? [0] : who === 'gina' ? [1] : [0, 1];
  const name = who === 'lina' ? 'Lina' : who === 'gina' ? 'Gina' : 'Lina e Gina';
  return { speaker: who === 'gina' ? 'gina' : 'lina', speakerName: name, portraitKey: 'portrait-lina', text, duo: { portraits: LINA_GINA, speaking } };
}

/**
 * Conversas com os funcionários do corredor do RH (o `id` vem de config/prologueData.ts), na
 * mesma tela de diálogo da história: Nixy na esquerda, o funcionário na direita. Roteiro do dono.
 */
export const PROLOGUE_NPC_DIALOGUES: Record<string, DialogueLine[]> = {
  carlos: [
    npcSays('carlos', 'Carlos', 'Que barulho foi esse saindo da tua sala?'),
    nixySays('Eu vou fugir daqui.'),
    npcSays('carlos', 'Carlos', '...'),
    npcSays('carlos', 'Carlos', 'Endoidou?'),
    nixySays('Estou mais sã do que nunca.'),
    nixySays('Todos aqui vacilaram comigo, e eu não vou mais aceitar ser usada!'),
    npcSays('carlos', 'Carlos', 'Nossa, que coragem, hein...'),
    npcSays('carlos', 'Carlos', 'Boa sorte...'),
    nixySays('Você quer vir comigo?'),
    npcSays('carlos', 'Carlos', 'Nah, obrigado. O plano de saúde daqui é muito bom...'),
    npcSays('carlos', 'Carlos', 'Deus me livre depender do público...'),
    nixySays('Deus?!?!'),
    npcSays('carlos', 'Carlos', 'Eita...'),
  ],
  'lina-gina': [
    duoSays('lina', 'Oiiii, Nixy, tá um arraso hoje, hein...'),
    duoSays('gina', 'Eu adoro a sua capa de Drácula espalhafatosa.'),
    duoSays('lina', 'Com certeza um acessório muito importante para o ambiente corporativo.'),
    duoSays('gina', 'Para completar, só falta um chapéu tão grande quanto essa sua cabeça.'),
    nixySays('Haha, muito engraçadas, meninas. Eu adoraria ficar aqui e concordar com todas as suas opiniões...'),
    nixySays('Mas aí seriam três pessoas falando merda.'),
    nixySays('Se eu fosse vocês, eu me apressaria para lamber as bolas do chefe. Já faz um tempo que ele tá fora e acredito que já estão secas.'),
  ],
  leo: [
    npcSays('leo', 'Léo', 'Já tá no horário de almoço?'),
    nixySays('Não...'),
    npcSays('leo', 'Léo', 'Então por que não tá trabalhando?'),
    nixySays('Porque não quero...'),
    npcSays('leo', 'Léo', 'Não sei se temos essa escolha aqui...'),
    nixySays('Olha, Léo, eu vou embora. E, sendo sincera, eu vou com você deixando ou não...'),
    npcSays('leo', 'Léo', '...'),
    npcSays('leo', 'Léo', 'Acho que cê é cabeça dura demais pra eu tentar te impedir.'),
    npcSays('leo', 'Léo', 'Bom, não é como se você fosse conseguir ir muito longe mesmo...'),
  ],
};

/** Léo segura a porta: se ela tentar sair sem falar com ele, a conversa começa por aqui. */
export const PROLOGUE_GUARD_STOP_LINE: DialogueLine = npcSays('leo', 'Léo', 'Ei, espera aí!');

/** Retratos do Cão Infernal na conversa (a arte detalhada é só daqui; no mundo é o Cão Zumbi). */
export const DOG_PORTRAITS = { idle: 'portrait-dog-idle', bark: 'portrait-dog-bark' } as const;

function dogSays(text: string, barking: boolean = false): DialogueLine {
  return { speaker: 'cao', speakerName: 'Cão Infernal', portraitKey: barking ? DOG_PORTRAITS.bark : DOG_PORTRAITS.idle, text };
}

/**
 * Na arena, logo depois de sair pela porta: a Nixy dá de cara com o cão de guarda (roteiro do
 * dono). A fala com o retrato latindo (`DOG_PORTRAITS.bark`) também treme a tela e late.
 */
export const STORY_ARRIVAL_DIALOGUE: DialogueLine[] = [
  nixySays('Oi...'),
  nixySays('Bichinho...'),
  dogSays('...'),
  nixySays('Você vai me deixar passar?'),
  dogSays('...'),
  nixySays('Olha, eu só vou ali e...'),
  dogSays('Grrr...'),
  dogSays('WOOF WOOF WOOF WOOF', true),
  nixySays('É, acho que vou precisar passar por vocês...'),
  nixySays('PODE VIR!'),
];

/** Tela da carta única que desperta o ataque da Nixy (o cão vindo para cima dela). */
export const AWAKENING_CARD_TEXT = {
  title: 'DESPERTAR // O PODER DO ABISMO',
  hint: 'ESCOLHA PARA DESPERTAR SEU PODER',
} as const;

/**
 * Primeiro encontro com a Shylph (Capítulo 3). Roteiro do dono (2026-11-28).
 * Ela canta "Toxic" da Britney; a letra da música não entra no jogo (direito autoral), então ela
 * cantarola a melodia e a piada da Nixy ("Cê tá cantando Britney?") continua funcionando.
 */
const shylphSays = (text: string): DialogueLine => ({ speaker: 'shylph', speakerName: 'Shylph', portraitKey: 'chat-shylph', text });

export const SHYLPH_INTRO_DIALOGUE: DialogueLine[] = [
  nixySays('O que diabos é você?'),
  shylphSays('Oooooohhh...'),
  shylphSays('Hmm-hmm, hmm-hmm-hmmm... Tã-rã-rã-rãaam...'),
  nixySays('???'),
  shylphSays('Tã-rã-rãaa... Hmm-hmm-hmmm...'),
  nixySays('Cê tá cantando Britney?'),
  shylphSays('Pobre criatura renegada, sua alma será levada pro mais profundo inferno sem fim... Hmm-hmm-hmmm, tã-rã-rã-rãaaaam!'),
  nixySays('Caramba, todo esse tempo que eu trabalhei aqui...'),
  nixySays('Presa no meu próprio cubículo...'),
  nixySays('Eu nunca pensei nisso!'),
  nixySays('Aqui só tem retardado!')
];

/**
 * Shylph, a Serafim Caída (Capítulo 3): falas da luta (balões em cima dela). Sem telas de
 * vitória: a queda entre o Serafim e a fase final é só a animação (decisão do dono).
 */
export const SHYLPH_FIGHT_TEXT = {
  barName: 'SHYLPH, A SERAFIM CAÍDA',
  seraphTaunt: 'Contemple minha verdadeira forma.',
  risePhrase: 'Hihihi... você acreditou mesmo?',
  lickTaunts: [
    'Hmm... o seu vai ser mais doce.',
    'Mais perto... eu quero provar.',
    'Que cheiro bom de medo...',
  ],
  defeatLabel: 'SHYLPH DERROTADA',
} as const;