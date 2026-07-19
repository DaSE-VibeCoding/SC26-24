import type { ThemeConfig } from 'antd'

/**
 * AlphaScope 智选 Design Tokens
 * 对齐需求文档 §7.5 视觉规范
 */
export const DESIGN_TOKENS = {
  pageBg: '#F5F5F7',
  cardBg: '#FFFFFF',
  cardHover: '#F2F2F7',
  primary: '#007AFF',
  modelAccent: '#30B0C7',
  up: '#FF3B30',        // A股涨 — 必须配合 + 或 ↑
  down: '#34C759',      // A股跌 — 必须配合 - 或 ↓
  warning: '#FF9F0A',
  bodyText: '#1D1D1F',
  secondaryText: '#6E6E73',
  borderRadius: 14,
  spacing: { xs: 8, sm: 16, md: 24, lg: 32 },
} as const

export const theme: ThemeConfig = {
  token: {
    colorPrimary: DESIGN_TOKENS.primary,
    colorInfo: DESIGN_TOKENS.primary,
    colorSuccess: DESIGN_TOKENS.down,
    colorError: DESIGN_TOKENS.up,
    colorWarning: DESIGN_TOKENS.warning,
    colorBgBase: DESIGN_TOKENS.pageBg,
    colorBgContainer: DESIGN_TOKENS.cardBg,
    colorTextBase: DESIGN_TOKENS.bodyText,
    colorTextSecondary: DESIGN_TOKENS.secondaryText,
    colorBorder: 'rgba(60,60,67,0.16)',
    borderRadius: DESIGN_TOKENS.borderRadius,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif",
  },
  components: {
    Card: {
      colorBgContainer: DESIGN_TOKENS.cardBg,
      headerBg: 'transparent',
    },
    Table: {
      colorBgContainer: DESIGN_TOKENS.cardBg,
      headerBg: '#F7F7FA',
      headerColor: DESIGN_TOKENS.secondaryText,
      rowHoverBg: DESIGN_TOKENS.cardHover,
      borderColor: 'rgba(60,60,67,0.10)',
    },
    Segmented: {
      trackBg: '#E9E9ED',
      itemSelectedBg: '#FFFFFF',
      itemSelectedColor: '#1D1D1F',
    },
    Button: {
      primaryShadow: 'none',
      defaultBg: 'rgba(255,255,255,0.82)',
      defaultBorderColor: 'rgba(60,60,67,0.16)',
    },
    Tag: {
      defaultBg: 'rgba(0,122,255,0.08)',
      defaultColor: DESIGN_TOKENS.primary,
    },
    Drawer: {
      colorBgElevated: DESIGN_TOKENS.cardBg,
    },
    Select: {
      colorBgElevated: DESIGN_TOKENS.cardBg,
    },
  },
}
