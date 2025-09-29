const DEFAULT_FONT_FAMILY =
  '"Adobe Clean", adobe-clean, "Source Sans Pro", -apple-system, system-ui, "Segoe UI", roboto, ubuntu, "Trebuchet MS", "Lucida Grande", sans-serif';

/**
 * Builds CSS font string from font object or string
 */
function buildFontString(fontConfig) {
  if (typeof fontConfig === 'string') {
    return fontConfig;
  }

  if (typeof fontConfig === 'object' && fontConfig !== null) {
    const {
      size = '24px',
      family = DEFAULT_FONT_FAMILY,
      weight = 'normal',
      style = 'normal',
      variant = 'normal',
    } = fontConfig;

    return `${style} ${variant} ${weight} ${size} ${family}`.trim();
  }

  return `24px ${DEFAULT_FONT_FAMILY}`;
}

/**
 * Applies default font configuration to text object
 */
function applyDefaultFont(textObj) {
  if (!textObj.font) {
    textObj.font = { size: '24px' };
  } else if (typeof textObj.font === 'string') {
    const parts = textObj.font.split(' ');
    const size = parts.find((part) => part.includes('px')) || '24px';
    textObj.font = { size };
  }
  return textObj;
}

/**
 * Creates default text configuration
 */
function createDefaultTextConfig() {
  return {
    content: '',
    position: { x: 50, y: 50 },
    font: { size: '24px' },
    color: '#000000',
    align: 'left',
  };
}

/**
 * Draws text on canvas with multi-line support
 */
function drawTextOnCanvas(ctx, config) {
  const { content, position, font, color, align } = config;

  const fontString = buildFontString(font);
  ctx.font = fontString;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';

  const lines = content.split('\n');
  const fontSize = typeof font === 'object' ? font.size : font;
  const lineHeight = parseInt(fontSize, 10) * 1.2;

  lines.forEach((line, index) => {
    const y = position.y + index * lineHeight;
    ctx.fillText(line, position.x, y);
  });
}

/**
 * Loads image and returns a promise
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Draws image to cover the entire area (crops if necessary)
 */
function drawImageCover(ctx, img, x, y, width, height) {
  const imgAspect = img.width / img.height;
  const targetAspect = width / height;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = img.width;
  let sourceHeight = img.height;

  if (imgAspect > targetAspect) {
    sourceWidth = img.height * targetAspect;
    sourceX = (img.width - sourceWidth) / 2;
  } else {
    sourceHeight = img.width / targetAspect;
    sourceY = (img.height - sourceHeight) / 2;
  }

  ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

/**
 * Draws image to fit within the area (letterboxing if necessary)
 */
function drawImageContain(ctx, img, x, y, width, height) {
  const imgAspect = img.width / img.height;
  const targetAspect = width / height;

  let drawWidth = width;
  let drawHeight = height;
  let drawX = x;
  let drawY = y;

  if (imgAspect > targetAspect) {
    drawHeight = width / imgAspect;
    drawY = y + (height - drawHeight) / 2;
  } else {
    drawWidth = height * imgAspect;
    drawX = x + (width - drawWidth) / 2;
  }

  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

/**
 * Draws image on canvas with specified configuration
 */
function drawImageOnCanvas(ctx, img, config) {
  const { position, width, height, fit } = config;

  switch (fit) {
    case 'cover':
      drawImageCover(ctx, img, position.x, position.y, width, height);
      break;
    case 'contain':
      drawImageContain(ctx, img, position.x, position.y, width, height);
      break;
    case 'fill':
    default:
      ctx.drawImage(img, position.x, position.y, width, height);
      break;
  }
}

/**
 * Draws placeholder when image fails to load
 */
function drawImagePlaceholder(ctx, config) {
  const { position, width, height } = config;

  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(position.x, position.y, width, height);

  ctx.fillStyle = '#999999';
  ctx.font = `16px ${DEFAULT_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Image not available', position.x + width / 2, position.y + height / 2);
}

/**
 * Creates a canvas with text and image
 */
async function createCanvas(config = {}) {
  const { width = 800, height = 600, backgroundColor = '#ffffff', className = 'dynamic-canvas', options = {} } = config;

  const { image = {}, text } = options;

  // Configure image
  const imageConfig = {
    src: '',
    alt: 'Canvas Image',
    position: { x: 0, y: 0 },
    width,
    height,
    fit: 'cover',
    ...image,
  };

  // Configure text
  let textConfig = text;
  if (!textConfig) {
    textConfig = createDefaultTextConfig();
  } else if (!Array.isArray(textConfig) && typeof textConfig === 'object') {
    textConfig = { ...createDefaultTextConfig(), ...textConfig };
    textConfig = applyDefaultFont(textConfig);
  } else if (Array.isArray(textConfig)) {
    textConfig = textConfig.map((textObj) => {
      const defaultTextObj = { ...createDefaultTextConfig(), ...textObj };
      return applyDefaultFont(defaultTextObj);
    });
  }

  // Create canvas element
  const canvasElement = document.createElement('canvas');
  canvasElement.width = width;
  canvasElement.height = height;
  canvasElement.classList.add(className);
  canvasElement.alt = imageConfig.alt;

  const ctx = canvasElement.getContext('2d');

  // Set background
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  // Draw image
  if (imageConfig.src) {
    try {
      const img = await loadImage(imageConfig.src);
      drawImageOnCanvas(ctx, img, imageConfig);
    } catch (error) {
      /* eslint-disable-next-line no-console */
      console.error('Error loading image:', error);
      drawImagePlaceholder(ctx, imageConfig);
    }
  }

  // Draw text
  if (textConfig.content || (Array.isArray(textConfig) && textConfig.length > 0)) {
    if (Array.isArray(textConfig)) {
      textConfig.forEach((textObj) => {
        if (textObj.content) {
          drawTextOnCanvas(ctx, textObj);
        }
      });
    } else {
      drawTextOnCanvas(ctx, textConfig);
    }
  }

  return canvasElement;
}

export default createCanvas;
