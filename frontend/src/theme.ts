import type { ThemeConfig } from 'antd'

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#45d6b5',
    colorInfo: '#45d6b5',
    colorBgBase: '#07111f',
    colorTextBase: '#eaf4ff',
    colorBorder: '#203249',
    borderRadius: 12,
    fontFamily: "Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  components: {
    Card: { colorBgContainer: '#0d1a2b' },
    Table: { colorBgContainer: '#0d1a2b', headerBg: '#12233a' },
  },
}

