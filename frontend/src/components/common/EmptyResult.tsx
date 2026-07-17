import { Empty } from 'antd'

interface Props {
  description?: string
}

export function EmptyResult({ description = '暂无数据' }: Props) {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={description}
      style={{ padding: '48px 0' }}
    />
  )
}
