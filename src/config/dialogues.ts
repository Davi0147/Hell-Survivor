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

/** Primeiro encontro com Azazel (chefe do Capítulo 2). */
export const AZAZEL_INTRO_DIALOGUE: DialogueLine[] = [
  {
    speaker: 'azazel',
    speakerName: 'Azazel',
    portraitKey: 'chat-azazel',
    text: 'Então é você a funcionária rebelde que esmagou Rosalin... Eu sentia o cheiro da sua insolência desde o primeiro círculo.'
  },
  {
    speaker: 'nixy',
    speakerName: 'Nixy',
    portraitKey: 'chat-nixy',
    text: 'Ótimo, já me poupa o trabalho de me apresentar. Você vai sair da frente por bem ou vou ter que te carimbar na parede também?'
  },
  {
    speaker: 'azazel',
    speakerName: 'Azazel',
    portraitKey: 'chat-azazel',
    text: 'Tola. Rosalin brincava com força bruta. Eu governo a escuridão e a mente dos condenados... Aqui dentro, cada passo seu pertence a mim.'
  },
  {
    speaker: 'nixy',
    speakerName: 'Nixy',
    portraitKey: 'chat-nixy',
    text: 'Todo chefe que fala bonito demais cai do mesmo jeito. Vem tentar a sorte, seu desgraçado!'
  }
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

/** Uma fala curta no corredor do prólogo (balão em cima de quem fala, sem retrato). */
export interface PrologueTalkLine {
  /** `npc2`: a segunda pessoa de um NPC em dupla (ver `speakers` em config/prologueData.ts). */
  who: 'npc' | 'npc2' | 'nixy';
  text: string;
}

/**
 * Conversas dos funcionários parados no corredor do RH (o `id` vem de config/prologueData.ts).
 * Cada vez que a Nixy fala com a mesma pessoa, vem a próxima conversa da lista.
 */
export const PROLOGUE_NPC_TALKS: Record<string, PrologueTalkLine[][]> = {
  arquivista: [
    [
      { who: 'npc', text: 'Formulário 666-B em três vias... não, quatro... não, cinco...' },
      { who: 'nixy', text: 'Faz quantos séculos que você tá nesse formulário?' },
      { who: 'npc', text: 'Quatro. Mas esse ano eu termino.' },
    ],
    [
      { who: 'npc', text: 'Você não pode sair do setor sem carimbo de saída.' },
      { who: 'nixy', text: 'Carimba isso aqui, ó.' },
    ],
    [
      { who: 'npc', text: 'Arquivaram meu pedido de férias. No arquivo morto. Junto comigo.' },
    ],
  ],
  estagiario: [
    [
      { who: 'npc', text: 'Oi! Eu sou o estagiário! Faz 300 anos que eu sou o estagiário!' },
      { who: 'nixy', text: 'E a efetivação?' },
      { who: 'npc', text: 'Ano que vem! Sempre ano que vem!' },
    ],
    [
      { who: 'npc', text: 'O Chefe pediu pra eu buscar café. Em 1543.' },
      { who: 'nixy', text: 'Larga essa bandeja e foge comigo.' },
      { who: 'npc', text: 'E perder meu vale-refeição de enxofre? Nem pensar!' },
    ],
  ],
  // Duas colegas juntas: 'npc' é a de cabelo preto (café na mão), 'npc2' a loira
  fofoqueiras: [
    [
      { who: 'npc', text: 'Menina, você soube? A Nixy chutou a mesa do Chefe!' },
      { who: 'npc2', text: 'Não acredito! Na frente de todo mundo?' },
      { who: 'nixy', text: 'Eu tô bem aqui, viu.' },
      { who: 'npc', text: '...Enfim. E esse café, hein? Tá horrível.' },
    ],
    [
      { who: 'npc2', text: 'Dizem que quem foge do RH vira ração do cachorro lá fora.' },
      { who: 'npc', text: 'Dizem que o cachorro é do próprio RH.' },
      { who: 'nixy', text: 'Ótimo. Mais um colega de trabalho pra eu odiar.' },
    ],
    [
      { who: 'npc', text: 'Fuga do expediente? Vão descontar do seu salário.' },
      { who: 'nixy', text: 'Que salário?' },
      { who: 'npc2', text: 'Exatamente.' },
    ],
  ],
  seguranca: [
    [
      { who: 'npc', text: 'Ei. Ninguém passa daquela porta sem crachá.' },
      { who: 'nixy', text: 'E se eu passar mesmo assim?' },
      { who: 'npc', text: '...Meu turno acaba em cinco minutos. Eu não vi nada.' },
    ],
    [
      { who: 'npc', text: 'Lá fora tem cachorro. Daqueles que não gostam de gente.' },
      { who: 'nixy', text: 'Que bom. Eu também não.' },
    ],
  ],
};

/** Na arena, logo depois de sair pela porta: a Nixy dá de cara com o cão de guarda. */
export const STORY_ARRIVAL_DIALOGUE: DialogueLine[] = [
  {
    speaker: 'nixy',
    speakerName: 'Nixy',
    portraitKey: 'chat-nixy',
    text: 'Argh... As catacumbas do abismo. Saí do escritório e caí direto no porão do inferno.'
  },
  {
    speaker: 'nixy',
    speakerName: 'Nixy',
    portraitKey: 'chat-nixy',
    text: '...Ah, não. Cachorrinho do RH. Bonzinho... Senta... Fica... Não faz barulho, tá?'
  }
];

/** Balões depois dos latidos, antes da horda chegar. */
export const STORY_ARRIVAL_BARK_TEXT = 'AU! AU! AUUUUU!';
export const STORY_ARRIVAL_AFTER_BARK_TEXT = 'Ótimo. Agora o inferno inteiro sabe que eu fugi. Hora da colheita!';
