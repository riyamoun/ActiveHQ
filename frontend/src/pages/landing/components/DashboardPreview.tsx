import { 
  Users, 
  TrendingUp, 
  CreditCard, 
  Calendar, 
  Bell, 
  ArrowUpRight,
  Clock,
  Dumbbell
} from 'lucide-react';

export function DashboardPreview() {
  return (
    <section className="relative py-32 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            See Everything.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Miss Nothing.
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-xl mx-auto">
            Real-time insights that help you make smarter decisions.
          </p>
        </div>

        {/* Full Dashboard Preview */}
        <div className="relative">
          {/* Glow */}
          <div className="absolute -inset-8 bg-gradient-to-r from-emerald-500/20 via-cyan-500/10 to-emerald-500/20 rounded-[40px] blur-3xl" />

          <div className="relative rounded-[32px] border border-slate-700/50 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Top chrome */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/30 bg-slate-800/30">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <Dumbbell className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-white">ActiveHQ</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="h-5 w-5 text-slate-400" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-medium">3</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                  <span className="text-xs text-white font-medium">RK</span>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="p-8">
              {/* Welcome + Live badge */}
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-3xl font-bold text-white">Welcome back, Rajesh</h3>
                  <p className="text-slate-400 mt-1">Here's what's happening at FitZone today</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-sm text-emerald-400 font-medium">Live Dashboard</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: Users, label: "Today's Check-ins", value: '47', sub: '12 in last hour', color: 'emerald', trend: '+12%' },
                  { icon: TrendingUp, label: 'Active Members', value: '247', sub: '8 new this week', color: 'blue', trend: '+8' },
                  { icon: CreditCard, label: 'Revenue (Jan)', value: '₹2,41,500', sub: '₹45K pending', color: 'purple', trend: '+18%' },
                  { icon: Calendar, label: 'Expiring in 7 Days', value: '18', sub: 'Send reminders', color: 'amber', trend: 'Action' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`relative rounded-2xl p-6 border overflow-hidden group cursor-pointer transition-all hover:scale-[1.02] ${
                      stat.color === 'emerald' ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-500/40' :
                      stat.color === 'blue' ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40' :
                      stat.color === 'purple' ? 'bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40' :
                      'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                        stat.color === 'emerald' ? 'bg-emerald-500/20' :
                        stat.color === 'blue' ? 'bg-blue-500/20' :
                        stat.color === 'purple' ? 'bg-purple-500/20' :
                        'bg-amber-500/20'
                      }`}>
                        <stat.icon className={`h-6 w-6 ${
                          stat.color === 'emerald' ? 'text-emerald-500' :
                          stat.color === 'blue' ? 'text-blue-500' :
                          stat.color === 'purple' ? 'text-purple-500' :
                          'text-amber-500'
                        }`} />
                      </div>
                      <span className={`flex items-center gap-1 text-sm font-medium ${
                        stat.color === 'emerald' ? 'text-emerald-400' :
                        stat.color === 'blue' ? 'text-blue-400' :
                        stat.color === 'purple' ? 'text-purple-400' :
                        'text-amber-400'
                      }`}>
                        {stat.trend}
                        {stat.trend !== 'Action' && <ArrowUpRight className="h-4 w-4" />}
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                    <div className="text-xs text-slate-500 mt-2">{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid lg:grid-cols-5 gap-6">
                {/* Main chart - wider */}
                <div className="lg:col-span-3 rounded-2xl bg-slate-800/30 border border-slate-700/30 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-lg font-semibold text-white">Weekly Attendance</h4>
                      <p className="text-sm text-slate-400 mt-0.5">Average: 52/day</p>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                      <ArrowUpRight className="h-4 w-4" />
                      +23% vs last week
                    </div>
                  </div>
                  
                  {/* Chart */}
                  <div className="relative h-48">
                    <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-slate-600 w-8">
                      {['80', '60', '40', '20', '0'].map((n) => <span key={n}>{n}</span>)}
                    </div>
                    <div className="ml-10 h-full flex items-end gap-3 pb-8">
                      {[
                        { day: 'Mon', am: 32, pm: 28 },
                        { day: 'Tue', am: 28, pm: 22 },
                        { day: 'Wed', am: 45, pm: 38 },
                        { day: 'Thu', am: 35, pm: 30 },
                        { day: 'Fri', am: 52, pm: 42 },
                        { day: 'Sat', am: 58, pm: 35 },
                        { day: 'Sun', am: 42, pm: 28 },
                      ].map((d) => (
                        <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex gap-1 h-40 items-end">
                            <div
                              className="flex-1 rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all hover:from-emerald-500 hover:to-emerald-300"
                              style={{ height: `${d.am}%` }}
                            />
                            <div
                              className="flex-1 rounded-t-lg bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all hover:from-cyan-500 hover:to-cyan-300"
                              style={{ height: `${d.pm}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 mt-2">{d.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-8 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-emerald-500" />
                      <span className="text-xs text-slate-400">Morning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-cyan-500" />
                      <span className="text-xs text-slate-400">Evening</span>
                    </div>
                  </div>
                </div>

                {/* Recent activity */}
                <div className="lg:col-span-2 rounded-2xl bg-slate-800/30 border border-slate-700/30 p-6">
                  <h4 className="text-lg font-semibold text-white mb-6">Recent Activity</h4>
                  
                  <div className="space-y-4">
                    {[
                      { icon: '💪', text: 'Rahul S. checked in', time: '2 min ago', color: 'emerald' },
                      { icon: '💰', text: '₹5,000 payment received', time: '15 min ago', color: 'purple' },
                      { icon: '🔔', text: '5 reminders sent', time: '1 hour ago', color: 'blue' },
                      { icon: '✅', text: 'Priya K. renewed (6 months)', time: '2 hours ago', color: 'emerald' },
                      { icon: '👤', text: 'New member: Amit V.', time: '3 hours ago', color: 'cyan' },
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-700/30 last:border-0">
                        <div className="text-xl">{activity.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{activity.text}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
