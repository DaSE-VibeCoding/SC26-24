import { Skeleton } from 'antd'

interface Props {
  rows?: number
  /** 是否显示为表格骨架 */
  table?: boolean
}

export function LoadingSkeleton({ rows = 4, table = false }: Props) {
  if (table) {
    return (
      <div style={{ padding: '16px 0' }}>
        <Skeleton active title paragraph={{ rows: 1 }} />
        <Skeleton active title={false} paragraph={{ rows }} />
      </div>
    )
  }
  return <Skeleton active paragraph={{ rows }} />
}
