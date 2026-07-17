import { ExclamationCircleOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Button, Card, Checkbox, Select, Slider, Space, Typography } from 'antd'
import { useMemo } from 'react'
import type { FactorOption, ModelOption, TrainRequest } from '../types'

type ModelKey = TrainRequest['model']

interface Props {
  factors: FactorOption[]
  models: ModelOption[]
  selectedFactors: string[]
  model: ModelKey
  topN: number
  loading: boolean
  /** 最近一次成功训练的模型配置（用于检测配置变更） */
  lastTrainedModel?: string
  lastTrainedFactors?: string[]
  onFactors: (value: string[]) => void
  onModel: (value: ModelKey) => void
  onTopN: (value: number) => void
  onRun: () => void
}

/** 按 group 分组因子选项 */
function groupFactors(factors: FactorOption[]) {
  const map = new Map<string, FactorOption[]>()
  for (const f of factors) {
    const g = map.get(f.group) ?? []
    g.push(f)
    map.set(f.group, g)
  }
  return [...map.entries()]
}

export function ModelPanel(props: Props) {
  const groups = useMemo(() => groupFactors(props.factors), [props.factors])

  const countOk = props.selectedFactors.length >= 4 && props.selectedFactors.length <= 10
  const configChanged =
    props.lastTrainedModel != null &&
    (props.model !== props.lastTrainedModel ||
      !arraysEqual(props.selectedFactors, props.lastTrainedFactors ?? []))

  return (
    <Card
      title="多因子模型"
      extra={<span className="eyebrow">MODEL LAB</span>}
      className="full-height"
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 模型选择 */}
        <div>
          <Typography.Text type="secondary">模型</Typography.Text>
          <Select
            value={props.model}
            onChange={(v) => props.onModel(v as ModelKey)}
            options={props.models.map((m) => ({ value: m.key, label: m.label }))}
            style={{ width: '100%', marginTop: 8 }}
            disabled={props.loading}
          />
        </div>

        {/* 因子多选（分组） */}
        <div>
          <Typography.Text type="secondary">
            选择因子（{props.selectedFactors.length}/10）
          </Typography.Text>
          {!countOk && (
            <Typography.Text type="danger" style={{ marginLeft: 8, fontSize: 12 }}>
              {props.selectedFactors.length < 4 ? '至少选择 4 个因子' : '最多选择 10 个因子'}
            </Typography.Text>
          )}
          <div style={{ marginTop: 8 }}>
            {groups.map(([group, items]) => (
              <div key={group} style={{ marginBottom: 8 }}>
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  {group}
                </Typography.Text>
                <Checkbox.Group
                  className="factor-grid"
                  value={props.selectedFactors}
                  onChange={(value) => props.onFactors(value as string[])}
                  disabled={props.loading}
                >
                  {items.map((item) => (
                    <Checkbox key={item.key} value={item.key}>
                      {item.label}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </div>
            ))}
          </div>
        </div>

        {/* Top N */}
        <div>
          <Typography.Text type="secondary">输出 Top {props.topN}</Typography.Text>
          <Slider
            min={5}
            max={20}
            value={props.topN}
            onChange={props.onTopN}
            disabled={props.loading}
          />
        </div>

        {/* 配置变更提示 */}
        {configChanged && !props.loading && (
          <div className="config-changed">
            <ExclamationCircleOutlined />
            配置已更改，结果尚未更新
          </div>
        )}

        {/* 训练按钮 */}
        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          loading={props.loading}
          disabled={!countOk}
          onClick={props.onRun}
          block
        >
          {props.loading ? '训练中…' : '重新训练并评分'}
        </Button>
      </Space>
    </Card>
  )
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].sort()
  const sb = [...b].sort()
  return sa.every((v, i) => v === sb[i])
}
