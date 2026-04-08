import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Battery, 
  DollarSign, 
  Maximize, 
  MapPin, 
  Zap, 
  Leaf, 
  TrendingUp, 
  Info,
  Moon,
  SunMedium,
  LayoutDashboard,
  Calculator,
  History,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { calculateRecommendation, Recommendation, UserInput, PANEL_DATA } from './lib/solar-engine';
import { getSolarInsights } from './lib/gemini';

// --- Components ---

const Card = ({ children, className, title, icon: Icon, delay = 0 }: { children: React.ReactNode, className?: string, title?: string, icon?: any, delay?: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    className={cn(
      "relative overflow-hidden",
      "bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl",
      "rounded-3xl p-6 shadow-2xl shadow-slate-200/50 dark:shadow-none",
      "border border-white/20 dark:border-slate-800/50",
      className
    )}
  >
    {title && (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20">
            {Icon && <Icon className="w-5 h-5 text-amber-500" />}
          </div>
          <h3 className="font-bold text-lg tracking-tight text-slate-800 dark:text-slate-100">{title}</h3>
        </div>
      </div>
    )}
    {children}
  </motion.div>
);

const Stat = ({ label, value, unit, icon: Icon, color, delay = 0 }: { label: string, value: string | number, unit?: string, icon: any, color: string, delay?: number }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="group flex items-center gap-4 p-5 rounded-2xl bg-white/40 dark:bg-slate-800/30 backdrop-blur-md border border-white/20 dark:border-slate-700/30 hover:border-amber-500/50 transition-all duration-300"
  >
    <div className={cn("p-4 rounded-2xl shadow-lg transition-transform group-hover:scale-110", color)}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
        {value} <span className="text-sm font-medium text-slate-400">{unit}</span>
      </p>
    </div>
  </motion.div>
);

const PanelVisualizer = ({ count, type }: { count: number, type: string }) => {
  const rows = Math.ceil(Math.sqrt(count));
  const cols = Math.ceil(count / rows);
  
  return (
    <div className="relative p-8 bg-slate-100/50 dark:bg-slate-950/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      
      <div 
        className="grid gap-2 mx-auto"
        style={{ 
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          maxWidth: `${cols * 60}px`
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02 }}
            className={cn(
              "aspect-[3/4] rounded-sm shadow-sm border border-white/10 relative group",
              type === 'monocrystalline' ? "bg-slate-900" : 
              type === 'polycrystalline' ? "bg-blue-900" : "bg-slate-700"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-500/20" />
            {/* Grid lines on panel */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 opacity-20">
              {Array.from({ length: 12 }).map((_, j) => (
                <div key={j} className="border-[0.5px] border-white/30" />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-6 text-center">
        <p className="text-xs font-mono text-slate-400 uppercase tracking-tighter">
          Roof Layout Simulation: {count} Units
        </p>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [step, setStep] = useState<'input' | 'results'>('input');
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState<UserInput>({
    location: '',
    monthlyConsumption: 500,
    budget: 5000,
    availableArea: 30,
  });
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [history, setHistory] = useState<{input: UserInput, rec: Recommendation, date: string}[]>([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const rec = calculateRecommendation(input);
    setRecommendation(rec);
    
    // Get AI Insights
    const insights = await getSolarInsights(input, rec);
    setAiInsights(insights);
    
    // Save to history
    setHistory(prev => [{ input, rec, date: new Date().toLocaleTimeString() }, ...prev].slice(0, 5));
    
    setStep('results');
    setLoading(false);
  };

  const chartData = recommendation ? [
    { name: 'Jan', consumption: input.monthlyConsumption, production: Math.round(recommendation.monthlyProduction * 0.8) },
    { name: 'Feb', consumption: input.monthlyConsumption, production: Math.round(recommendation.monthlyProduction * 0.9) },
    { name: 'Mar', consumption: input.monthlyConsumption, production: recommendation.monthlyProduction },
    { name: 'Apr', consumption: input.monthlyConsumption, production: Math.round(recommendation.monthlyProduction * 1.1) },
    { name: 'May', consumption: input.monthlyConsumption, production: Math.round(recommendation.monthlyProduction * 1.2) },
    { name: 'Jun', consumption: input.monthlyConsumption, production: Math.round(recommendation.monthlyProduction * 1.3) },
    { name: 'Jul', consumption: input.monthlyConsumption, production: Math.round(recommendation.monthlyProduction * 1.3) },
    { name: 'Aug', consumption: input.monthlyConsumption, production: Math.round(recommendation.monthlyProduction * 1.2) },
    { name: 'Sep', consumption: input.monthlyConsumption, production: Math.round(recommendation.monthlyProduction * 1.1) },
    { name: 'Oct', consumption: input.monthlyConsumption, production: recommendation.monthlyProduction },
    { name: 'Nov', consumption: input.monthlyConsumption, production: Math.round(recommendation.monthlyProduction * 0.8) },
    { name: 'Dec', consumption: input.monthlyConsumption, production: Math.round(recommendation.monthlyProduction * 0.7) },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Sun className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">SolarWise</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <SunMedium className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {step === 'results' && (
              <button 
                onClick={() => setStep('input')}
                className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <Calculator className="w-4 h-4" />
                New Simulation
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === 'input' ? (
            <motion.div 
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid lg:grid-cols-2 gap-12 items-start"
            >
              <div>
                <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                  Power Your Future with Solar.
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                  Get a personalized solar recommendation in seconds. We analyze your consumption, budget, and space to find the perfect fit.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-500" /> Location
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. San Francisco, CA"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                        value={input.location}
                        onChange={e => setInput({...input, location: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" /> Monthly Usage (kWh)
                      </label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                        value={input.monthlyConsumption}
                        onChange={e => setInput({...input, monthlyConsumption: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-amber-500" /> Budget (USD)
                      </label>
                      <input 
                        type="number" 
                        required
                        min="100"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                        value={input.budget}
                        onChange={e => setInput({...input, budget: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Maximize className="w-4 h-4 text-amber-500" /> Roof Area (m²)
                      </label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                        value={input.availableArea}
                        onChange={e => setInput({...input, availableArea: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Generate Recommendation <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </form>
              </div>

              <div className="space-y-6">
                <Card title="Why go solar?" icon={Info}>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg h-fit">
                        <Leaf className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Reduce your carbon footprint and help fight climate change with clean energy.</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg h-fit">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Increase your property value and protect yourself against rising energy costs.</p>
                    </li>
                  </ul>
                </Card>

                {history.length > 0 && (
                  <Card title="Recent Simulations" icon={History}>
                    <div className="space-y-3">
                      {history.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm">
                          <span>{item.input.location}</span>
                          <span className="font-mono text-amber-600">{item.rec.systemSizeKW} kW</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold">Your Solar Dashboard</h2>
                  <p className="text-slate-500">Based on your profile in {input.location}</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-xs font-bold uppercase tracking-wider">
                    Optimized for Budget
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Stat label="System Size" value={recommendation?.systemSizeKW || 0} unit="kW" icon={Sun} color="bg-gradient-to-br from-amber-400 to-amber-600" delay={0.1} />
                <Stat label="Estimated Cost" value={`$${recommendation?.estimatedCost.toLocaleString()}`} icon={DollarSign} color="bg-gradient-to-br from-emerald-400 to-emerald-600" delay={0.2} />
                <Stat label="Monthly Production" value={recommendation?.monthlyProduction || 0} unit="kWh" icon={Zap} color="bg-gradient-to-br from-blue-400 to-blue-600" delay={0.3} />
                <Stat label="Payback Period" value={recommendation?.paybackPeriod || 0} unit="Years" icon={TrendingUp} color="bg-gradient-to-br from-purple-400 to-purple-600" delay={0.4} />
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  <Card title="Energy Production vs Consumption" icon={LayoutDashboard} delay={0.5}>
                    <div className="h-[350px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#64748b" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 11, fill: '#94a3b8'}} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 11, fill: '#94a3b8'}} 
                          />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '16px', 
                              border: 'none', 
                              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              backdropFilter: 'blur(8px)'
                            }}
                          />
                          <Legend verticalAlign="top" height={40} iconType="circle" />
                          <Area 
                            type="monotone" 
                            dataKey="production" 
                            stroke="#f59e0b" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorProd)" 
                            name="Solar Production (kWh)" 
                            animationDuration={2000}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="consumption" 
                            stroke="#64748b" 
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorCons)"
                            strokeDasharray="5 5" 
                            name="Monthly Usage (kWh)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-8">
                      <Card title="Installation Layout" icon={Maximize} delay={0.6}>
                        <PanelVisualizer 
                          count={recommendation?.numberOfPanels || 0} 
                          type={recommendation?.panelType.type || 'monocrystalline'} 
                        />
                        <div className="mt-6 grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Area</p>
                            <p className="text-lg font-black">{recommendation?.totalAreaRequired} m²</p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Panel Count</p>
                            <p className="text-lg font-black">{recommendation?.numberOfPanels} Units</p>
                          </div>
                        </div>
                      </Card>

                      <Card title="System Specs" icon={TrendingUp} delay={0.9}>
                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Recommended Model</p>
                                <p className="text-sm font-bold text-amber-600">{recommendation?.panelType.brand}</p>
                                <p className="text-base font-black">{recommendation?.panelType.model}</p>
                              </div>
                              <a 
                                href={recommendation?.panelType.purchaseUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                                title="View Product"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </a>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed italic">
                              "{recommendation?.panelType.description}"
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Efficiency</p>
                              <p className="text-lg font-black text-amber-500">{(recommendation?.panelType.efficiency || 0) * 100}%</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Power/Panel</p>
                              <p className="text-lg font-black text-blue-500">{recommendation?.panelType.wattsPerPanel}W</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <Card title="Environmental Impact" icon={Leaf} delay={0.7}>
                      <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
                        <div className="relative group">
                          <motion.div 
                            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 5, repeat: Infinity }}
                            className="absolute inset-0 bg-green-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" 
                          />
                          <Leaf className="w-20 h-20 text-green-500 relative drop-shadow-2xl" />
                        </div>
                        <div>
                          <p className="text-4xl font-black text-green-600 dark:text-green-400 tabular-nums">
                            {recommendation?.annualCO2Savings.toLocaleString()}
                            <span className="text-lg ml-1">kg</span>
                          </p>
                          <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-widest">CO₂ saved annually</p>
                        </div>
                        <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />
                        <div className="flex items-center gap-3 text-slate-500">
                          <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center border-2 border-white dark:border-slate-900">
                                <Leaf className="w-4 h-4 text-green-600" />
                              </div>
                            ))}
                          </div>
                          <span className="text-xs font-medium">
                            Equivalent to planting **{Math.round((recommendation?.annualCO2Savings || 0) / 20)}** mature trees.
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Sidebar - AI Insights */}
                <div className="space-y-8">
                  <Card title="AI Solar Consultant" icon={Sun} delay={0.8}>
                    <div className="prose prose-slate dark:prose-invert prose-sm max-w-none">
                      {aiInsights ? (
                        <ReactMarkdown>{aiInsights}</ReactMarkdown>
                      ) : (
                        <div className="space-y-4 animate-pulse">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                          <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-full" />
                        </div>
                      )}
                    </div>
                    {!aiInsights && (
                      <p className="text-[10px] text-slate-400 mt-4 text-center font-mono uppercase tracking-tighter">
                        Neural engine analyzing location data...
                      </p>
                    )}
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 py-8 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            © 2026 SolarWise. Estimates are based on global averages and may vary by specific location and equipment.
          </p>
        </div>
      </footer>
    </div>
  );
}
