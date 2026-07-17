import { Alert, Button, Space } from 'antd'

interface Props {
  message?: string
  detail?: string
  /** 是否保留旧数据（此时只显示 warning 而非 error） */
  stale?: boolean
  onRetry?: () => void
}

export function DataError({
  message = '数据加载失败',
  detail,
  stale = false,
  onRetry,
}: Props) {
  return (
    <Alert
      type={stale ? 'warning' : 'error'}
      showIcon
      message={stale ? '数据刷新失败，当前显示最近缓存数据' : message}
      description={
        <Space direction="vertical" size="small">
          {detail && <span>{detail}</span>}
          {onRetry && (
            <Button size="small" onClick={onRetry} type={stale ? 'default' : 'primary'}>
              重试
            </Button>
          )}
        </Space>
      }
      style={{ marginBottom: 16 }}
    />
  )
}
