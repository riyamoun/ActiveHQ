import { Search, MoreVertical, Phone, MessageCircle } from 'lucide-react';

const members = [
  { 
    id: 1, 
    name: 'Amit Sharma', 
    phone: '98765-43210', 
    plan: 'Yearly', 
    status: 'active', 
    expiry: '15 Dec 2026',
    lastVisit: 'Today, 7:15 AM'
  },
  { 
    id: 2, 
    name: 'Rahul Verma', 
    phone: '87654-32109', 
    plan: 'Quarterly', 
    status: 'expiring', 
    expiry: '3 Feb 2026',
    lastVisit: 'Yesterday'
  },
  { 
    id: 3, 
    name: 'Priya Patel', 
    phone: '76543-21098', 
    plan: 'Monthly', 
    status: 'active', 
    expiry: '28 Feb 2026',
    lastVisit: 'Today, 6:30 AM'
  },
  { 
    id: 4, 
    name: 'Suresh Kumar', 
    phone: '65432-10987', 
    plan: 'Half Yearly', 
    status: 'expired', 
    expiry: '20 Jan 2026',
    lastVisit: '5 days ago'
  },
  { 
    id: 5, 
    name: 'Kavita Singh', 
    phone: '54321-09876', 
    plan: 'Yearly', 
    status: 'active', 
    expiry: '10 Oct 2026',
    lastVisit: 'Today, 5:45 PM'
  },
];

export function MemberTablePreview() {
  return (
    <section className="bg-slate-900 py-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white text-lg font-medium">Members</h2>
            <p className="text-slate-500 text-sm">247 total • 5 new this week</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search members..."
                className="w-64 pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors">
              + Add Member
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-4 px-4 text-slate-400 text-sm font-medium">Member</th>
                <th className="text-left py-4 px-4 text-slate-400 text-sm font-medium">Plan</th>
                <th className="text-left py-4 px-4 text-slate-400 text-sm font-medium">Status</th>
                <th className="text-left py-4 px-4 text-slate-400 text-sm font-medium">Expiry</th>
                <th className="text-left py-4 px-4 text-slate-400 text-sm font-medium">Last Visit</th>
                <th className="text-right py-4 px-4 text-slate-400 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{member.name}</p>
                        <p className="text-slate-500 text-xs">{member.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-slate-300 text-sm">{member.plan}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      member.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                      member.status === 'expiring' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {member.status === 'active' && 'Active'}
                      {member.status === 'expiring' && 'Expiring Soon'}
                      {member.status === 'expired' && 'Expired'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-sm ${
                      member.status === 'expired' ? 'text-red-400' :
                      member.status === 'expiring' ? 'text-amber-400' :
                      'text-slate-300'
                    }`}>
                      {member.expiry}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-slate-400 text-sm">{member.lastVisit}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <Phone className="h-4 w-4 text-slate-400" />
                      </button>
                      <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <MessageCircle className="h-4 w-4 text-green-500" />
                      </button>
                      <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment modal simulation */}
        <div className="mt-8 max-w-sm mx-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 relative">
            {/* Modal header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-medium">Record Payment</h3>
              <span className="text-slate-500 text-xs">Modal preview</span>
            </div>

            {/* Member */}
            <div className="mb-4">
              <label className="text-slate-400 text-sm mb-2 block">Member</label>
              <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                  <span className="text-white text-xs">RV</span>
                </div>
                <span className="text-white text-sm">Rahul Verma</span>
              </div>
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="text-slate-400 text-sm mb-2 block">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                <input
                  type="text"
                  value="5,000"
                  readOnly
                  className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-lg font-medium"
                />
              </div>
            </div>

            {/* Payment mode */}
            <div className="mb-6">
              <label className="text-slate-400 text-sm mb-2 block">Payment Mode</label>
              <div className="flex gap-3">
                <button className="flex-1 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg">
                  Cash
                </button>
                <button className="flex-1 py-2.5 bg-slate-800 text-slate-400 text-sm font-medium rounded-lg border border-slate-700">
                  UPI
                </button>
                <button className="flex-1 py-2.5 bg-slate-800 text-slate-400 text-sm font-medium rounded-lg border border-slate-700">
                  Card
                </button>
              </div>
            </div>

            {/* Submit */}
            <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors">
              Record Payment
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
