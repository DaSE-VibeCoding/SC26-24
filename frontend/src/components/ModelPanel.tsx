import { ThunderboltOutlined } from '@ant-design/icons'
import { Button, Card, Checkbox, Select, Slider, Space, Typography } from 'antd'
import type { FactorOption, ModelOption } from '../types'

interface Props {
  factors: FactorOption[]; models: ModelOption[]; selectedFactors: string[]; model: string; topN: number; loading: boolean
  onFactors: (value: string[]) => void; onModel: (value: string) => void; onTopN: (value: number) => void; onRun: () => void
}

export function ModelPanel(props: Props) {
  return <Card title="多因子模型" extra={<span className="eyebrow">MODEL LAB</span>} className="full-height">
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div><Typography.Text type="secondary">模型</Typography.Text><Select value={props.model} onChange={props.onModel} options={props.models.map(x => ({ value: x.key, label: x.label }))} style={{ width: '100%', marginTop: 8 }} /></div>
      <div><Typography.Text type="secondary">选择因子（4–10个）</Typography.Text><Checkbox.Group className="factor-grid" value={props.selectedFactors} onChange={value => props.onFactors(value as string[])}>{props.factors.map(item => <Checkbox key={item.key} value={item.key}>{item.label}</Checkbox>)}</Checkbox.Group></div>
      <div><Typography.Text type="secondary">输出 Top {props.topN}</Typography.Text><Slider min={5} max={20} value={props.topN} onChange={props.onTopN} /></div>
      <Button type="primary" size="large" icon={<ThunderboltOutlined />} loading={props.loading} disabled={props.selectedFactors.length < 4 || props.selectedFactors.length > 10} onClick={props.onRun} block>运行评分</Button>
    </Space>
  </Card>
}

