export const NodeShape = {
  RECT: 'rect',
  ROUND_RECT: 'roundRect',
  ELLIPSE: 'ellipse',
  DIAMOND: 'diamond',
  PARALLELOGRAM: 'parallelogram'
}

export const ConnectionCurve = {
  STRAIGHT: 'straight',
  BEZIER: 'bezier',
  CURVED: 'curved',
  ORTHOGONAL: 'orthogonal'
}

export const LayoutType = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  RADIAL: 'radial',
  FREE: 'free',
  OUTLINE: 'outline'
}

export const ThemeType = {
  CLASSIC: 'classic',
  DARK: 'dark',
  EYE_CARE: 'eye-care',
  OCEAN: 'ocean',
  SUNSET: 'sunset'
}

export const NodeIcon = {
  NONE: null,
  STAR: 'Star',
  FLAG: 'Flag',
  HEART: 'Heart',
  CHECK: 'Check',
  CIRCLE: 'Circle',
  SQUARE: 'Square',
  TRIANGLE: 'Triangle',
  LIGHTBULB: 'Lightbulb',
  IDEA: 'Sparkles',
  TARGET: 'Target',
  CALENDAR: 'Calendar',
  CLOCK: 'Clock',
  USER: 'User',
  USERS: 'Users',
  FILE: 'File',
  FOLDER: 'Folder',
  LINK: 'Link',
  TAG: 'Tag',
  LAYERS: 'Layers'
}

export const createNode = (id, text, parentId = null, options = {}) => ({
  id,
  text,
  parentId,
  x: options.x || 0,
  y: options.y || 0,
  shape: options.shape || NodeShape.ROUND_RECT,
  icon: options.icon || NodeIcon.NONE,
  expanded: options.expanded !== undefined ? options.expanded : true,
  bold: options.bold || false,
  italic: options.italic || false,
  underline: options.underline || false,
  color: options.color || null,
  children: []
})

export const createMindMap = (title = '新思维导图') => ({
  id: 'map_' + Date.now(),
  title,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  rootNodeId: null,
  nodes: {},
  layout: LayoutType.HORIZONTAL,
  theme: ThemeType.CLASSIC,
  connectionStyle: {
    curve: ConnectionCurve.BEZIER,
    width: 2,
    color: null
  },
  viewport: {
    x: 0,
    y: 0,
    scale: 1
  }
})
