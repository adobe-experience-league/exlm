/**
 * Reads a resolved CSS custom property from ExL's root styles, keeping BC's
 * theme in sync with styles.css without manual duplication.
 * @param {string} name - CSS custom property name, e.g. '--non-spectrum-navy-blue'.
 * @param {string} fallback - Value to use if the property is empty or unset.
 * @returns {string}
 */
const rootStyles = getComputedStyle(document.documentElement);

function exlVar(name, fallback) {
  return rootStyles.getPropertyValue(name).trim() || fallback;
}

/**
 * Derives a namespace key from the URL path so each ExL product surface
 * keeps its own conversation history in local storage.
 * @returns {string}
 */
function getProductNamespace() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const key = segments.slice(0, 3).join('-');
  return key ? `exl-bc-${key}` : 'exl-bc';
}

const brandConciergeConfig = {
  // destructured out in brand-concierge.js before forwarding to bootstrap().
  stickySession: true,

  behavior: {
    chatTranscript: {
      enabled: true,
      maxSessions: 1,
      maxMessagesPerSession: 10,
      cleanupInterval: 24,
    },
  },

  metadata: {
    brandName: 'Experience League',
    version: '1.0.0',
    language: document.documentElement.lang || 'en-US',
    namespace: getProductNamespace(),
  },

  text: {
    'welcome.heading': 'Not sure where to start?<br>Ask me anything about Adobe products.',
    'welcome.subheading': 'Type your question or pick a suggestion below.',
    'input.placeholder': 'Ask a question…',
    'input.messageInput.aria': 'Message input',
    'input.send.aria': 'Send message',
    'input.mic.aria': 'Voice input',
    'card.aria.select': 'Select example message',
    'carousel.prev.aria': 'Previous cards',
    'carousel.next.aria': 'Next cards',
    'scroll.bottom.aria': 'Scroll to bottom',
    'error.network': "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
    'error.general': "I'm sorry, something went wrong. Please try again in a moment.",
    'loading.message': "Generating from Adobe's trusted resources",
    'feedback.dialog.title.positive': 'Your feedback is appreciated',
    'feedback.dialog.title.negative': 'Your feedback is appreciated',
    'feedback.dialog.question.positive': 'What went well? Select all that apply.',
    'feedback.dialog.question.negative': 'What went wrong? Select all that apply.',
    'feedback.dialog.notes': 'Notes',
    'feedback.dialog.submit': 'Submit',
    'feedback.dialog.cancel': 'Cancel',
    'feedback.dialog.notes.placeholder': 'Additional notes (optional)',
    'feedback.toast.success': 'Thank you for the feedback.',
    'feedback.thumbsUp.aria': 'Thumbs up',
    'feedback.thumbsDown.aria': 'Thumbs down',
  },

  arrays: {
    'welcome.examples': [
      { text: 'Get started with Adobe Experience Manager' },
      { text: 'Set up an Adobe Analytics report suite' },
      { text: 'Troubleshoot my Adobe Campaign delivery' },
      { text: 'Explain Adobe Target A/B testing' },
    ],
    'feedback.positive.options': [
      'Helpful and relevant',
      'Clear and easy to understand',
      'Friendly and conversational tone',
      'Other',
    ],
    'feedback.negative.options': ['Not helpful or relevant', 'Confusing or unclear', 'Too formal or robotic', 'Other'],
  },

  // CSS variable overrides forwarded to BC. Only set values that diverge from
  // BC defaults or need tuning for the compact dialog context.
  // spacing and sizing for pill/suggestion buttons are intentionally set only
  // in brand-concierge.css (with !important) to keep one authoritative source.
  theme: {
    '--font-family': exlVar(
      '--body-font-family',
      '"Adobe Clean", adobe-clean, "Source Sans Pro", -apple-system, system-ui, "Segoe UI", roboto, ubuntu, "Trebuchet MS", "Lucida Grande", sans-serif',
    ),

    '--color-primary': exlVar('--non-spectrum-navy-blue', '#1473e6'),
    '--color-primary-hover': exlVar('--non-spectrum-dark-navy-blue', '#0265dc'),
    '--color-primary-alpha': exlVar('--non-spectrum-navy-blue-alpha', 'rgba(20, 115, 230, 0.25)'),

    '--color-button-primary': exlVar('--non-spectrum-navy-blue', '#1473e6'),
    '--color-button-primary-hover': exlVar('--non-spectrum-dark-navy-blue', '#0265dc'),
    '--color-button-primary-border': exlVar('--non-spectrum-navy-blue', '#1473e6'),

    '--color-message-user': exlVar('--bc-user-bubble', '#e8e3f8'),

    '--main-container-background': '#ffffff',
    '--chat-container-background': '#ffffff',

    '--welcome-input-order': '4',
    '--welcome-cards-order': '2',
    '--welcome-padding': '12px 0',
    '--card-width': '300px',

    '--prompt-suggestions-button-width': '100%',
    '--prompt-suggestions-button-width-max': '100%',

    '--input-height': '52px',
    '--input-max-height': '96px',
    '--input-padding': '0 4px 0 10px',
    '--input-font-size': '14px',
    '--input-container-gap': '5px',
    '--input-button-width': '36px',
    '--input-button-height': '36px',
    '--submit-button-icon-size': '16px',

    '--container-padding-desktop': '8px',
    '--container-padding-mobile': '8px',
  },
};

/** Per-locale overlays (datastream, strings, examples, feedback). Unknown path langs use English above. */
const LOCALE_CONFIGS = {
  'zh-hans': {
    language: 'zh-CN',
    htmlLang: 'zh-Hans',
    datastreamId: 'exl-bc-multilingual-test-zh-hans',
    interceptDatastreamId: '9899e6af-7021-4b72-87a6-fee1584078a0',
    text: {
      'welcome.heading': '欢迎！请问有什么可以帮您？',
      'welcome.subheading':
        '我是您的 Adobe Experience League 智能助手，随时为您解答问题。请从以下选项中选择，或直接告诉我您的需求。',
      'input.placeholder': '请输入您的问题…',
      'input.messageInput.aria': '消息输入框',
      'input.send.aria': '发送消息',
      'input.mic.aria': '语音输入',
      'card.aria.select': '选择示例消息',
      'carousel.prev.aria': '上一组',
      'carousel.next.aria': '下一组',
      'scroll.bottom.aria': '滚动到底部',
      'error.network': '抱歉，连接服务时出现问题，请稍后再试。',
      'error.general': '抱歉，出现了问题。请稍后再试。',
      'loading.message': '正在根据 Adobe 可信资源生成内容',
      'feedback.dialog.title.positive': '感谢您的反馈',
      'feedback.dialog.title.negative': '感谢您的反馈',
      'feedback.dialog.question.positive': '哪些方面做得好？请选择所有适用项。',
      'feedback.dialog.question.negative': '哪些方面需要改进？请选择所有适用项。',
      'feedback.dialog.notes': '备注',
      'feedback.dialog.submit': '提交',
      'feedback.dialog.cancel': '取消',
      'feedback.dialog.notes.placeholder': '其他备注（可选）',
      'feedback.toast.success': '感谢您的反馈。',
      'feedback.thumbsUp.aria': '点赞',
      'feedback.thumbsDown.aria': '点踩',
    },
    welcomeExamples: [
      { text: '如何开始使用 Adobe Experience Platform？' },
      { text: '什么是实时客户数据平台（Real-Time CDP）？' },
      { text: '如何在 Adobe Analytics 中创建细分受众？' },
      { text: '如何开始使用 Adobe Experience Manager？' },
    ],
    feedbackPositive: ['回答有帮助且相关', '清晰易懂', '语气友好自然', '其他'],
    feedbackNegative: ['回答无帮助或不相关', '内容混乱或不清晰', '语气过于正式或机械', '其他'],
  },

  fr: {
    language: 'fr-FR',
    htmlLang: 'fr',
    datastreamId: '1ff7592c-77b2-49c4-8599-f70b99c969e1',
    interceptDatastreamId: null,
    text: {
      'welcome.heading': 'Bienvenue ! Comment puis-je vous aider ?',
      'welcome.subheading':
        "Je suis votre assistant IA Adobe Experience League, disponible pour répondre à vos questions. Choisissez une option ci-dessous ou dites-moi ce dont vous avez besoin.",
      'input.placeholder': 'Posez votre question…',
      'input.messageInput.aria': 'Zone de saisie',
      'input.send.aria': 'Envoyer le message',
      'input.mic.aria': 'Saisie vocale',
      'card.aria.select': 'Sélectionner un exemple',
      'carousel.prev.aria': 'Cartes précédentes',
      'carousel.next.aria': 'Cartes suivantes',
      'scroll.bottom.aria': 'Défiler vers le bas',
      'error.network':
        "Désolé, je rencontre des difficultés à me connecter à nos services. Veuillez réessayer.",
      'error.general': "Désolé, une erreur s'est produite. Veuillez réessayer dans un instant.",
      'loading.message': 'Génération à partir des ressources fiables d’Adobe',
      'feedback.dialog.title.positive': 'Merci pour votre retour',
      'feedback.dialog.title.negative': 'Merci pour votre retour',
      'feedback.dialog.question.positive': "Qu'est-ce qui s'est bien passé ? Sélectionnez tout ce qui s'applique.",
      'feedback.dialog.question.negative': "Qu'est-ce qui n'a pas fonctionné ? Sélectionnez tout ce qui s'applique.",
      'feedback.dialog.notes': 'Notes',
      'feedback.dialog.submit': 'Envoyer',
      'feedback.dialog.cancel': 'Annuler',
      'feedback.dialog.notes.placeholder': 'Notes supplémentaires (facultatif)',
      'feedback.toast.success': 'Merci pour votre retour.',
      'feedback.thumbsUp.aria': 'Pouce levé',
      'feedback.thumbsDown.aria': 'Pouce baissé',
    },
    welcomeExamples: [
      { text: 'Comment démarrer avec Adobe Experience Platform ?' },
      { text: "Qu'est-ce que la plateforme de données clients en temps réel ?" },
      { text: "Comment créer des segments d'audience dans Adobe Analytics ?" },
      { text: 'Comment démarrer avec Adobe Experience Manager ?' },
    ],
    feedbackPositive: ['Utile et pertinent', 'Clair et facile à comprendre', 'Ton amical et conversationnel', 'Autre'],
    feedbackNegative: ['Pas utile ou non pertinent', 'Confus ou peu clair', 'Trop formel ou robotique', 'Autre'],
  },

  'pt-br': {
    language: 'pt-BR',
    htmlLang: 'pt-BR',
    datastreamId: '8c0ae8f8-d82c-4cc8-ac2a-30cb1009d4f8',
    interceptDatastreamId: null,
    text: {
      'welcome.heading': 'Bem-vindo! Como posso ajudar você?',
      'welcome.subheading':
        'Sou seu assistente de IA da Adobe Experience League, pronto para responder suas perguntas. Escolha uma opção abaixo ou me diga o que você precisa.',
      'input.placeholder': 'Digite sua pergunta…',
      'input.messageInput.aria': 'Campo de entrada',
      'input.send.aria': 'Enviar mensagem',
      'input.mic.aria': 'Entrada de voz',
      'card.aria.select': 'Selecionar exemplo',
      'carousel.prev.aria': 'Cartões anteriores',
      'carousel.next.aria': 'Próximos cartões',
      'scroll.bottom.aria': 'Rolar para baixo',
      'error.network':
        'Desculpe, estou com dificuldades para me conectar aos nossos serviços. Por favor, tente novamente.',
      'error.general': 'Desculpe, algo deu errado. Tente novamente em instantes.',
      'loading.message': 'Gerando a partir dos recursos confiáveis da Adobe',
      'feedback.dialog.title.positive': 'Agradecemos seu feedback',
      'feedback.dialog.title.negative': 'Agradecemos seu feedback',
      'feedback.dialog.question.positive': 'O que funcionou bem? Selecione tudo que se aplica.',
      'feedback.dialog.question.negative': 'O que não funcionou? Selecione tudo que se aplica.',
      'feedback.dialog.notes': 'Observações',
      'feedback.dialog.submit': 'Enviar',
      'feedback.dialog.cancel': 'Cancelar',
      'feedback.dialog.notes.placeholder': 'Observações adicionais (opcional)',
      'feedback.toast.success': 'Obrigado pelo seu feedback.',
      'feedback.thumbsUp.aria': 'Gostei',
      'feedback.thumbsDown.aria': 'Não gostei',
    },
    welcomeExamples: [
      { text: 'Como começar a usar o Adobe Experience Platform?' },
      { text: 'O que é a Real-Time Customer Data Platform?' },
      { text: 'Como criar segmentos de público no Adobe Analytics?' },
      { text: 'Como começar com o Adobe Experience Manager?' },
    ],
    feedbackPositive: ['Útil e relevante', 'Claro e fácil de entender', 'Tom amigável e conversacional', 'Outro'],
    feedbackNegative: ['Não foi útil ou relevante', 'Confuso ou pouco claro', 'Muito formal ou robótico', 'Outro'],
  },

  es: {
    language: 'es-ES',
    htmlLang: 'es',
    datastreamId: 'ff33d127-833c-488b-a086-6baaa989ca4d',
    interceptDatastreamId: null,
    text: {
      'welcome.heading': '¡Bienvenido! ¿En qué puedo ayudarle?',
      'welcome.subheading':
        'Soy su asistente de IA de Adobe Experience League, listo para responder sus preguntas. Elija una opción a continuación o dígame lo que necesita.',
      'input.placeholder': 'Escriba su pregunta…',
      'input.messageInput.aria': 'Campo de entrada',
      'input.send.aria': 'Enviar mensaje',
      'input.mic.aria': 'Entrada de voz',
      'card.aria.select': 'Seleccionar ejemplo',
      'carousel.prev.aria': 'Tarjetas anteriores',
      'carousel.next.aria': 'Tarjetas siguientes',
      'scroll.bottom.aria': 'Desplazarse hacia abajo',
      'error.network':
        'Lo sentimos, estamos teniendo problemas para conectarnos a nuestros servicios. Por favor, inténtelo de nuevo.',
      'error.general': 'Lo sentimos, algo salió mal. Inténtelo de nuevo en un momento.',
      'loading.message': 'Generando a partir de los recursos confiables de Adobe',
      'feedback.dialog.title.positive': 'Gracias por sus comentarios',
      'feedback.dialog.title.negative': 'Gracias por sus comentarios',
      'feedback.dialog.question.positive': '¿Qué salió bien? Seleccione todo lo que corresponda.',
      'feedback.dialog.question.negative': '¿Qué salió mal? Seleccione todo lo que corresponda.',
      'feedback.dialog.notes': 'Notas',
      'feedback.dialog.submit': 'Enviar',
      'feedback.dialog.cancel': 'Cancelar',
      'feedback.dialog.notes.placeholder': 'Notas adicionales (opcional)',
      'feedback.toast.success': 'Gracias por sus comentarios.',
      'feedback.thumbsUp.aria': 'Me gusta',
      'feedback.thumbsDown.aria': 'No me gusta',
    },
    welcomeExamples: [
      { text: '¿Cómo empezar a usar Adobe Experience Platform?' },
      { text: '¿Qué es la plataforma de datos de clientes en tiempo real?' },
      { text: '¿Cómo crear segmentos de audiencia en Adobe Analytics?' },
      { text: '¿Cómo empezar con Adobe Experience Manager?' },
    ],
    feedbackPositive: ['Útil y relevante', 'Claro y fácil de entender', 'Tono amigable y conversacional', 'Otro'],
    feedbackNegative: ['No fue útil ni relevante', 'Confuso o poco claro', 'Demasiado formal o robótico', 'Otro'],
  },
};

/**
 * @param {string} [pathLang] - Language key from getPathDetails().lang (e.g. en, zh-hans, pt-br).
 */
export function resolveBrandConciergeLocale(pathLang) {
  const key = (pathLang || 'en').toLowerCase();
  const overlay = LOCALE_CONFIGS[key];
  if (!overlay) {
    return {
      key: 'en',
      datastreamId: null,
      interceptDatastreamId: null,
      text: {},
      arrays: {},
    };
  }

  return {
    key,
    language: overlay.language,
    datastreamId: overlay.datastreamId ?? null,
    interceptDatastreamId: overlay.interceptDatastreamId ?? null,
    text: overlay.text,
    arrays: {
      'welcome.examples': overlay.welcomeExamples,
      'feedback.positive.options': overlay.feedbackPositive,
      'feedback.negative.options': overlay.feedbackNegative,
    },
  };
}

export default brandConciergeConfig;
