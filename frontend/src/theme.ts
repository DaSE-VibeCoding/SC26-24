import type { ThemeConfig } from 'antd'

/**
 * AlphaScope 智选 Design Tokens
 * 对齐需求文档 §7.5 视觉规范
 */
export const DESIGN_TOKENS = {
  pageBg: '#08111F',
  cardBg: '#0F1B2D',
  cardHover: '#14243A',
  primary: '#6C7CFF',
  modelAccent: '#21D4B4',
  up: '#F05B72',        // A股涨 — 必须配合 + 或 ↑
  down: '#2BB673',       // A股跌 — 必须配合 - 或 ↓
  warning: '#F5B942',
  bodyText: '#E8EEF7',
  secondaryText: '#8FA1B8',
  borderRadius: 12,
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
    colorBorder: '#203249',
    borderRadius: DESIGN_TOKENS.borderRadius,
    fontFamily: "Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  components: {
    Card: {
      colorBgContainer: DESIGN_TOKENS.cardBg,
    },
    Table: {
      colorBgContainer: DESIGN_TOKENS.cardBg,
      headerBg: '#14243A',
      headerColor: DESIGN_TOKENS.secondaryText,
      rowHoverBg: DESIGN_TOKENS.cardHover,
    },
    Segmented: {
      itemSelectedBg: DESIGN_TOKENS.primary,
    },
    Button: {
      primaryShadow: 'none',
    },
    Tag: {
      defaultBg: 'rgba(108,124,255,0.12)',
      defaultColor: DESIGN_TOKENS.primary,
    },
    Drawer: {
      colorBgElevated: DESIGN_TOKENS.cardBg,
    },
    Select: {
      colorBgElevated: DESIGN_TOKENS.cardHover,
    },
  },
}
