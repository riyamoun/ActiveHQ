import { useState, useEffect } from 'react';
import { 
  Users, 
  IndianRupee, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Bell
} from 'lucide-react';

// Simulated real-time data
const recentActivity = [
  { id: 1, type: 'checkin', name: 'Amit Sharma', time: '2 min ago' },
  { id: 2, type: 'payment', name: 'Rahul Verma', amount: 5000, time: '8 min ago' },
  { id: 3, type: 'checkin', name: 'Priya Patel', time: '12 min ago' },
  { id: 4, type: 'reminder', name: 'Suresh Kumar', time: '15 min ago' },
  { id: 5, type: 'checkin', name: 'Kavita Singh', time: '18 min ago' },
];

const expiringMembers = [
  { name: 'Vikram M.', days: 2, phone: '98XXX-XXXXX' },
  { name: 'Neha S.', days: 3, phone: '87XXX-XXXXX' },
  { name: 'Rohit K.', days: 5, phone: '99XXX-XXXXX' },
];

export function LiveDashboardHero() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkIns, setCheckIns] = useState(47);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Simulate live check-in
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setCheckIns(prev => prev + 1);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="min-h-screen bg-slate-950 pt-20">
      {/* Top bar - Gym info */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white font-medium">FitZone Gym</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 text-sm">Koramangala, Bangalore</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Clock className="h-4 w-4" />
            <span>Updated {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Section title */}
        <div className="mb-6">
          <h1 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Today at your gym</h1>
          <p className="text-slate-600 text-xs mt-1">
            {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Main stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Today's Check-ins */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <Users className="h-5 w-5 text-emerald-500" />
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Live</span>
            </div>
            <div className="text-3xl font-bold text-white">{checkIns}</div>
            <div className="text-sm text-slate-400 mt-1">Check-ins today</div>
            <div className="text-xs text-slate-500 mt-2">Peak: 6:30 PM – 8:30 PM</div>
          </div>

          {/* Active Members */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="text-xs text-blue-400">+8 this week</span>
            </div>
            <div className="text-3xl font-bold text-white">247</div>
            <div className="text-sm text-slate-400 mt-1">Active members</div>
            <div className="text-xs text-slate-500 mt-2">23 joined this month</div>
          </div>

          {/* Today's Collection */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <IndianRupee className="h-5 w-5 text-green-500" />
              <span className="text-xs text-green-400">3 payments</span>
            </div>
            <div className="text-3xl font-bold text-white">₹12,500</div>
            <div className="text-sm text-slate-400 mt-1">Collected today</div>
            <div className="text-xs text-slate-500 mt-2">Cash: ₹7,500 | UPI: ₹5,000</div>
          </div>

          {/* Expiring Soon */}
          <div className="bg-slate-900 border border-amber-900/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">Action needed</span>
            </div>
            <div className="text-3xl font-bold text-white">18</div>
            <div className="text-sm text-slate-400 mt-1">Expiring in 7 days</div>
            <div className="text-xs text-amber-500 mt-2 cursor-pointer hover:underline">Send reminders →</div>
          </div>
        </div>

        {/* Two column layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Activity feed + Chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live notification */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <IndianRupee className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-white font-medium">New payment received</p>
                  <p className="text-emerald-400 text-sm">₹5,000 from Rahul Verma • Cash</p>
                </div>
              </div>
              <span className="text-slate-400 text-xs">Just now</span>
            </div>

            {/* Attendance chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">This Week's Attendance</h3>
                <span className="text-sm text-slate-400">Avg: 52/day</span>
              </div>
              <div className="flex items-end gap-2 h-32">
                {[
                  { day: 'Mon', am: 28, pm: 35 },
                  { day: 'Tue', am: 22, pm: 30 },
                  { day: 'Wed', am: 35, pm: 42 },
                  { day: 'Thu', am: 30, pm: 38 },
                  { day: 'Fri', am: 38, pm: 45 },
                  { day: 'Sat', am: 45, pm: 52 },
                  { day: 'Sun', am: 32, pm: 28 },
                ].map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 h-24 items-end">
                      <div
                        className="flex-1 rounded-t bg-emerald-600"
                        style={{ height: `${(d.am / 52) * 100}%` }}
                      />
                      <div
                        className="flex-1 rounded-t bg-emerald-400"
                        style={{ height: `${(d.pm / 52) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{d.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-600" />
                  <span className="text-slate-400">Morning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-400" />
                  <span className="text-slate-400">Evening</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-white font-medium mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'checkin' ? 'bg-emerald-500/20' :
                        activity.type === 'payment' ? 'bg-green-500/20' :
                        'bg-blue-500/20'
                      }`}>
                        {activity.type === 'checkin' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                        {activity.type === 'payment' && <IndianRupee className="h-4 w-4 text-green-500" />}
                        {activity.type === 'reminder' && <Bell className="h-4 w-4 text-blue-500" />}
                      </div>
                      <div>
                        <p className="text-white text-sm">{activity.name}</p>
                        <p className="text-slate-500 text-xs">
                          {activity.type === 'checkin' && 'Checked in'}
                          {activity.type === 'payment' && `Paid ₹${activity.amount?.toLocaleString()}`}
                          {activity.type === 'reminder' && 'Reminder sent'}
                        </p>
                      </div>
                    </div>
                    <span className="text-slate-500 text-xs">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Expiring members */}
          <div className="space-y-6">
            {/* Expiring members list */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">Expiring Soon</h3>
                <span className="text-xs text-amber-400 cursor-pointer hover:underline">View all 18</span>
              </div>
              <div className="space-y-3">
                {expiringMembers.map((member, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-white text-sm">{member.name}</p>
                        <p className="text-amber-400 text-xs">{member.days} days left</p>
                      </div>
                    </div>
                    <button className="text-xs text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
                      Remind
                    </button>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors">
                Send bulk reminder
              </button>
            </div>

            {/* Quick stats */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-white font-medium mb-4">This Month</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Total Collection</span>
                  <span className="text-white font-medium">₹2,41,500</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">New Members</span>
                  <span className="text-white font-medium">23</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Renewals</span>
                  <span className="text-white font-medium">45</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Pending Dues</span>
                  <span className="text-amber-400 font-medium">₹45,000</span>
                </div>
              </div>
            </div>

            {/* Dues pending */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="text-amber-400 font-medium">Dues Pending</h3>
              </div>
              <p className="text-white text-2xl font-bold mb-1">₹45,000</p>
              <p className="text-slate-400 text-sm mb-4">from 12 members</p>
              <button className="w-full py-2 text-sm text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-colors">
                Send payment reminders
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
