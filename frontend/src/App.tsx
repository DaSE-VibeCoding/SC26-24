import { ExperimentOutlined, GithubOutlined, RadarChartOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, ConfigProvider, Empty, Layout, message, Row, Segmented, Skeleton, Space, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { api } from './api'
import { MarketSummary } from './components/MarketSummary'
import { ModelPanel } from './components/ModelPanel'
import { PotentialTable } from './components/PotentialTable'
import { ScreenerTable } from './components/ScreenerTable'
import { StockDrawer } from './components/StockDrawer'
import { theme } from './theme'
import type { MarketResponse, OptionsResponse, PredictionResponse, StockDetail } from './types'

export default function App() {
  const [market, setMarket] = useState<MarketResponse>()
  const [options, setOptions] = useState<OptionsResponse>()
  const [predictions, setPredictions] = useState<PredictionResponse>()
  const [view, setView] = useState<string>('智能候选')
  const [model, setModel] = useState('random_forest')
  const [factors, setFactors] = useState<string[]>([])
  const [topN, setTopN] = useState(10)
  const [running, setRunning] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detail, setDetail] = useState<StockDetail>()
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => { Promise.all([api.market(), api.options(), api.latestPredictions()]).then(([marketData, optionData, predictionData]) => { setMarket(marketData); setOptions(optionData); setFactors(optionData.factors.filter(x => x.default_selected).map(x => x.key)); setPredictions(predictionData) }).catch(error => message.error(error.message)) }, [])

  async function runModel() { setRunning(true); try { setPredictions(await api.predict({ model, factors, top_n: topN })); message.success('评分完成') } catch (error) { message.error(error instanceof Error ? error.message : '运行失败') } finally { setRunning(false) } }
  async function openStock(symbol: string) { setDrawerOpen(true); setDetail(undefined); setDetailLoading(true); try { setDetail(await api.stock(symbol)) } catch { message.error('股票详情加载失败') } finally { setDetailLoading(false) } }

  return <ConfigProvider theme={theme}><Layout className="app-shell"><header className="topbar"><div className="brand"><span className="brand-mark"><RadarChartOutlined /></span><div><b>AlphaScope</b><small>CSI 300 INTELLIGENCE</small></div></div><Space><Tag color="cyan">沪深300</Tag><Button type="text" icon={<GithubOutlined />} href="https://github.com/cjkzbl/alphascope-stock-picker" target="_blank">GitHub</Button></Space></header><main className="content"><section className="hero"><div><span className="eyebrow">QUANT RESEARCH CONSOLE</span><Typography.Title>从多因子信号中，发现更值得关注的股票</Typography.Title><Typography.Paragraph>在沪深300固定股票池内，组合常用因子与机器学习模型，生成可解释的候选排序。</Typography.Paragraph></div><div className="hero-orbit"><ExperimentOutlined /></div></section>
    {!market ? <Skeleton active /> : <><Alert className="mock-alert" type="warning" showIcon message="当前为 Mock 演示数据" description={market.status.message} /><MarketSummary data={market} /><Row gutter={[16, 16]} className="workspace"><Col xs={24} xl={7}>{options && <ModelPanel factors={options.factors} models={options.models} selectedFactors={factors} model={model} topN={topN} loading={running} onFactors={setFactors} onModel={setModel} onTopN={setTopN} onRun={runModel} />}</Col><Col xs={24} xl={17}><Card title={<Segmented value={view} onChange={value => setView(String(value))} options={['智能候选', '基础看盘']} />} extra={predictions && <span className="muted">更新于 {new Date(predictions.generated_at).toLocaleTimeString()}</span>}>{view === '智能候选' ? (predictions ? <PotentialTable rows={predictions.items} onSelect={openStock} /> : <Empty />) : <ScreenerTable stocks={market.stocks} onSelect={openStock} />}</Card></Col></Row></>}
    <footer>模型输出仅用于技术演示，不构成投资建议。</footer></main><StockDrawer open={drawerOpen} loading={detailLoading} detail={detail} onClose={() => setDrawerOpen(false)} /></Layout></ConfigProvider>
}

