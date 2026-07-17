import { Descriptions, Tag } from 'antd'
import type { ModelMetrics, ModelStatus } from '../types'
import { MODEL_STATUS_COLORS, MODEL_STATUS_LABELS } from '../utils/format'

interface Props {
  status: ModelStatus
  metrics: ModelMetrics
  trainedAt: string
  predictionDate: string
  trainPeriod: [string, string]
  testPeriod: [string, string]
  modelName: string
}

export function MetricsSummary({
  status,
  metrics,
  trainedAt,
  predictionDate,
  trainPeriod,
  testPeriod,
  modelName,
}: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Descriptions size="small" column={{ xs: 2, sm: 3, md: 5 }} bordered>
        <Descriptions.Item label="模型">{modelName}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={MODEL_STATUS_COLORS[status]}>{MODEL_STATUS_LABELS[status]}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Rank IC">{metrics.rank_ic.toFixed(4)}</Descriptions.Item>
        <Descriptions.Item label="IC 正值比例">
          {(metrics.ic_positive_ratio * 100).toFixed(1)}%
        </Descriptions.Item>
        <Descriptions.Item label="Top10 命中率">
          {(metrics.top10_hit_rate * 100).toFixed(1)}%
        </Descriptions.Item>
        <Descriptions.Item label="Top10 超额收益">
          {metrics.top10_excess_return.toFixed(3)}
        </Descriptions.Item>
        <Descriptions.Item label="MAE">{metrics.mae.toFixed(4)}</Descriptions.Item>
        <Descriptions.Item label="训练区间">
          {trainPeriod[0]} → {trainPeriod[1]}
        </Descriptions.Item>
        <Descriptions.Item label="测试区间">
          {testPeriod[0]} → {testPeriod[1]}
        </Descriptions.Item>
        <Descriptions.Item label="训练时间">
          {new Date(trainedAt).toLocaleString('zh-CN')}
        </Descriptions.Item>
        <Descriptions.Item label="预测日期">{predictionDate}</Descriptions.Item>
      </Descriptions>

      {status === 'weak' && (
        <div
          style={{
            marginTop: 8,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(245,185,66,0.1)',
            border: '1px solid rgba(245,185,66,0.25)',
            color: '#F5B942',
            fontSize: 13,
          }}
        >
          模型历史测试表现较弱，以下排名仅作研究参考，不代表未来表现。
        </div>
      )}
      {status === 'invalid' && (
        <div
          style={{
            marginTop: 8,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(240,91,114,0.1)',
            border: '1px solid rgba(240,91,114,0.25)',
            color: '#F05B72',
            fontSize: 13,
          }}
        >
          模型未通过有效性检查，不生成 Top 10 排名。基础看盘功能仍可使用。
        </div>
      )}
    </div>
  )
}
