const fs = require('fs');

const path = 'pages/AdminDashboard.tsx';
const content = fs.readFileSync(path, 'utf8');

const target = 'if (user?.role !== UserRole.ADMIN) return null;';
const parts = content.split(target);

if (parts.length === 2) {
    const newContent = parts[0] + target + `

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans animate-fadeIn">
      {/* Top Header */}
      <header className="bg-[#003366] text-white flex items-center justify-between px-6 py-4 shadow-md z-20 relative">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 shadow-inner">
            <div className="w-full h-full bg-yellow-500 rounded flex items-center justify-center border-2 border-[#003366]">
              <span className="text-[#003366] font-black text-xs">DLC</span>
            </div>
          </div>
          <h1 className="text-xl md:text-2xl font-medium tracking-wide">Administrator Dashboard</h1>
        </div>
        <button className="text-white hover:text-slate-300 transition-colors">
          <i className="fa-solid fa-bars text-xl"></i>
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <aside className="w-64 bg-[#004080] text-white hidden lg:flex flex-col py-8 shadow-xl z-10 shrink-0">
          <nav className="flex-1 space-y-2 px-4">
            <button 
              onClick={() => setActiveTab('network')} 
              className={\`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-medium transition-all \${activeTab === 'network' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10 text-white/80'}\`}
            >
              <i className="fa-solid fa-house w-5"></i> Dashboard Overview
            </button>
            <button 
              onClick={() => setActiveTab('sellers')} 
              className={\`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-medium transition-all \${activeTab === 'sellers' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10 text-white/80'}\`}
            >
              <i className="fa-solid fa-users w-5"></i> User Management
            </button>
            <button 
              onClick={() => setActiveTab('products')} 
              className={\`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-medium transition-all \${activeTab === 'products' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10 text-white/80'}\`}
            >
              <i className="fa-solid fa-box-open w-5"></i> Listings Approval
            </button>
            <button 
              onClick={() => setActiveTab('reports')} 
              className={\`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-medium transition-all \${activeTab === 'reports' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10 text-white/80'}\`}
            >
              <i className="fa-solid fa-flag w-5"></i> Reports & Logs
            </button>
            <div className="pt-8 pb-4">
               <div className="h-px w-full bg-white/20"></div>
            </div>
            <button 
              className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-medium text-white/40 cursor-not-allowed"
            >
              <i className="fa-solid fa-gear w-5"></i> Settings (Locked)
            </button>
          </nav>
        </aside>

        {/* Mobile Navigation (Tabs) */}
        <div className="lg:hidden absolute top-0 left-0 w-full bg-[#004080] flex overflow-x-auto p-2 gap-2 shadow-md z-10">
           {(['network', 'sellers', 'products', 'reports'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={\`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap \${activeTab === tab ? 'bg-white/20 text-white' : 'text-white/70'}\`}
              >
                 {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
           ))}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 bg-slate-100 p-4 md:p-8 overflow-y-auto mt-12 lg:mt-0">
          
          <div className="max-w-7xl mx-auto space-y-8">
             {/* Always visible metric cards matching the mockup */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <h2 className="text-lg font-bold text-slate-700 mb-6 border-b border-slate-100 pb-2">Administrator Hub</h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Verified Users Card */}
                  <div className="bg-[#3498db] text-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center text-center transform transition-transform hover:scale-105 cursor-default">
                     <p className="text-sm font-medium mb-2 opacity-90 uppercase tracking-wider">Verified Users</p>
                     <h3 className="text-5xl font-light">{users.filter(u => u.sellerStatus === SellerStatus.VERIFIED).length}</h3>
                  </div>
                  {/* Pending Listings Card */}
                  <div className="bg-[#2ecc71] text-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center text-center transform transition-transform hover:scale-105 cursor-default">
                     <p className="text-sm font-medium mb-2 opacity-90 uppercase tracking-wider">Total Listings</p>
                     <h3 className="text-5xl font-light">{products.length}</h3>
                  </div>
                  {/* Dispute Tickets Card */}
                  <div className="bg-[#e74c3c] text-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center text-center transform transition-transform hover:scale-105 cursor-default">
                     <p className="text-sm font-medium mb-2 opacity-90 uppercase tracking-wider">Dispute Tickets</p>
                     <h3 className="text-5xl font-light">{reports.filter(r => r.status !== 'resolved').length}</h3>
                  </div>
               </div>
             </div>

             {/* Tab Content Wrappers */}
             {loading ? (
                <div className="py-32 flex flex-col items-center justify-center space-y-6">
                   <div className="w-16 h-16 border-4 border-slate-200 border-t-[#003366] rounded-full animate-spin"></div>
                   <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Data...</p>
                </div>
             ) : (
                <div className="animate-slideUp">
                  
                  {/* MODAL: User Details */}
                  {selectedUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                       <div className="absolute inset-0 bg-[#003366]/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)}></div>
                       <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
                          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
                             <div className="flex items-center gap-4">
                                <img
                                  src={selectedUser.avatarUrl || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(selectedUser.name)}&background=003366&color=fff\`}
                                  className="h-16 w-16 rounded-xl object-cover shadow-sm"
                                  alt={selectedUser.name}
                                />
                                <div>
                                   <h3 className="text-xl font-bold text-[#003366]">{selectedUser.name}</h3>
                                   <p className="text-sm text-slate-500">{selectedUser.email}</p>
                                </div>
                             </div>
                             <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-rose-500">
                                <i className="fa-solid fa-xmark text-xl"></i>
                             </button>
                          </div>
                          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                             <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matric Number</p>
                                <p className="font-medium text-[#003366] mt-1">{selectedUser.matricNumber || "N/A"}</p>
                             </div>
                             <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department</p>
                                <p className="font-medium text-[#003366] mt-1">{selectedUser.department || "N/A"}</p>
                             </div>
                             <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Level</p>
                                <p className="font-medium text-[#003366] mt-1">{selectedUser.level || "N/A"}</p>
                             </div>
                             <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                                <p className="font-medium text-[#003366] mt-1">{selectedUser.phoneNumber || "N/A"}</p>
                             </div>
                             <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Financial Details</p>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                     <p className="text-xs text-slate-500">Bank Name</p>
                                     <p className="font-medium text-[#003366] text-sm">{selectedUser.bankName || "N/A"}</p>
                                  </div>
                                  <div>
                                     <p className="text-xs text-slate-500">Account Number</p>
                                     <p className="font-medium text-[#003366] text-sm">{selectedUser.accountNumber || "N/A"}</p>
                                  </div>
                                  <div className="col-span-2">
                                     <p className="text-xs text-slate-500">Account Name</p>
                                     <p className="font-medium text-[#003366] text-sm">{selectedUser.accountName || "N/A"}</p>
                                  </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {activeTab === 'network' && (
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                           {/* Recent Activity Log (Mocked UI matching the image) */}
                           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                              <h3 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">Recent Activity Log</h3>
                              <div className="overflow-x-auto">
                                 <table className="w-full text-left text-sm">
                                    <thead>
                                       <tr className="text-slate-500 border-b border-slate-100">
                                          <th className="pb-3 font-medium">Timestamp</th>
                                          <th className="pb-3 font-medium">User</th>
                                          <th className="pb-3 font-medium">Action</th>
                                          <th className="pb-3 font-medium">Status</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                       {users.slice(0, 3).map((u, i) => (
                                          <tr key={i} className="text-slate-700 hover:bg-slate-50 transition-colors">
                                             <td className="py-3 px-2 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                                             <td className="py-3 px-2 font-medium text-[#003366]">{u.name}</td>
                                             <td className="py-3 px-2">Verified Student</td>
                                             <td className="py-3 px-2"><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">Success</span></td>
                                          </tr>
                                       ))}
                                       {products.slice(0, 3).map((p, i) => (
                                          <tr key={\`p-\${i}\`} className="text-slate-700 hover:bg-slate-50 transition-colors">
                                             <td className="py-3 px-2 text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                                             <td className="py-3 px-2 font-medium text-[#003366]">Seller {p.sellerId.substring(0,4)}</td>
                                             <td className="py-3 px-2">Approved Listing</td>
                                             <td className="py-3 px-2"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200">Active</span></td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>
                           </div>

                           {/* Pending Listings Table (Mocked to match image structure) */}
                           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                              <h3 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">Pending Listings for Review</h3>
                              <div className="overflow-x-auto">
                                 <table className="w-full text-left text-sm">
                                    <thead>
                                       <tr className="text-slate-500 border-b border-slate-100">
                                          <th className="pb-3 font-medium">Product</th>
                                          <th className="pb-3 font-medium">Seller ID</th>
                                          <th className="pb-3 font-medium">Price</th>
                                          <th className="pb-3 font-medium text-right">Action</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                       {products.slice(0, 5).map(p => (
                                          <tr key={p.$id} className="text-slate-700 hover:bg-slate-50 transition-colors">
                                             <td className="py-3 px-2 font-medium text-[#003366] truncate max-w-[150px]">{p.name}</td>
                                             <td className="py-3 px-2 text-xs font-mono text-slate-400">{p.sellerId.substring(0,8)}</td>
                                             <td className="py-3 px-2">₦{p.price.toLocaleString()}</td>
                                             <td className="py-3 px-2 text-right space-x-2">
                                                <button className="px-3 py-1 bg-white border border-rose-200 text-rose-600 rounded hover:bg-rose-50 text-xs font-medium">Reject</button>
                                                <button className="px-3 py-1 bg-white border border-[#003366] text-[#003366] rounded hover:bg-slate-50 text-xs font-medium">Accept</button>
                                             </td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                        </div>

                        {/* Right Sidebar Charts (Visual representation) */}
                        <div className="space-y-6">
                           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                              <h3 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">System Statistics</h3>
                              <div className="h-40 w-full flex items-end justify-between gap-2 border-b border-l border-slate-200 p-2 relative">
                                 {/* CSS Bar Chart Simulation */}
                                 <div className="w-1/5 bg-[#003366]/50 hover:bg-[#003366] transition-colors h-[30%] rounded-t-sm relative group"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100">30%</span></div>
                                 <div className="w-1/5 bg-[#003366]/50 hover:bg-[#003366] transition-colors h-[50%] rounded-t-sm relative group"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100">50%</span></div>
                                 <div className="w-1/5 bg-rose-400/50 hover:bg-rose-500 transition-colors h-[40%] rounded-t-sm relative group"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100">40%</span></div>
                                 <div className="w-1/5 bg-[#003366]/50 hover:bg-[#003366] transition-colors h-[80%] rounded-t-sm relative group"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100">80%</span></div>
                                 <div className="w-1/5 bg-[#003366]/50 hover:bg-[#003366] transition-colors h-[60%] rounded-t-sm relative group"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100">60%</span></div>
                              </div>
                           </div>
                           
                           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                              <h3 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">New Users</h3>
                              <div className="h-40 w-full flex items-end justify-between gap-2 border-b border-l border-slate-200 p-2 relative">
                                 <div className="w-1/4 bg-[#3498db]/50 hover:bg-[#3498db] transition-colors h-[20%] rounded-t-sm"></div>
                                 <div className="w-1/4 bg-[#3498db]/50 hover:bg-[#3498db] transition-colors h-[60%] rounded-t-sm"></div>
                                 <div className="w-1/4 bg-[#3498db]/50 hover:bg-[#3498db] transition-colors h-[45%] rounded-t-sm"></div>
                                 <div className="w-1/4 bg-[#3498db]/50 hover:bg-[#3498db] transition-colors h-[90%] rounded-t-sm"></div>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  {activeTab === 'products' && (
                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-bold text-[#003366] mb-6 border-b border-slate-100 pb-3">Listings Approval & Registry</h2>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                              <thead>
                                 <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="pb-4">Asset Details</th>
                                    <th className="pb-4">Category</th>
                                    <th className="pb-4">Price</th>
                                    <th className="pb-4 text-right">Actions</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {products.map(p => (
                                    <tr key={p.$id} className="hover:bg-slate-50 transition-colors">
                                       <td className="py-4">
                                          <div className="flex items-center gap-4">
                                             <img src={p.imageUrls[0]} alt={p.name} className="w-12 h-12 rounded-lg object-cover shadow-sm border border-slate-100" />
                                             <div>
                                                <p className="text-sm font-bold text-[#003366] line-clamp-1">{p.name}</p>
                                                <p className="text-xs text-slate-400 font-mono">ID: {p.$id.substring(0,8)}</p>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="py-4">
                                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{p.category}</span>
                                       </td>
                                       <td className="py-4">
                                          <p className="text-sm font-bold text-[#003366]">₦{p.price.toLocaleString()}</p>
                                       </td>
                                       <td className="py-4 text-right space-x-2">
                                          <Link to={\`/product/\${p.$id}\`} className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors inline-block">Inspect</Link>
                                          <button onClick={() => deleteProduct(p.$id)} className="px-3 py-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors inline-block">Delete</button>
                                       </td>
                                    </tr>
                                 ))}
                                 {products.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">No products found.</td></tr>}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  )}

                  {activeTab === 'sellers' && (
                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-bold text-[#003366] mb-6 border-b border-slate-100 pb-3">User Management & Verification</h2>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                              <thead>
                                 <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="pb-4">User Details</th>
                                    <th className="pb-4">Department</th>
                                    <th className="pb-4">Status</th>
                                    <th className="pb-4 text-right">Actions</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {users.map(u => (
                                    <tr key={u.userId} className="hover:bg-slate-50 transition-colors">
                                       <td className="py-4">
                                          <div className="flex items-center gap-4">
                                             <img src={u.avatarUrl || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(u.name)}&background=003366&color=fff\`} alt="" className="w-10 h-10 rounded-lg shadow-sm" />
                                             <div>
                                                <p className="text-sm font-bold text-[#003366]">{u.name}</p>
                                                <p className="text-xs text-slate-400">{u.email}</p>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="py-4 text-sm text-slate-600">{u.department || 'N/A'}</td>
                                       <td className="py-4">
                                          <span className={\`px-3 py-1 rounded-md text-xs font-bold \${
                                             u.sellerStatus === SellerStatus.VERIFIED ? 'bg-green-100 text-green-700' :
                                             u.sellerStatus === SellerStatus.REJECTED ? 'bg-rose-100 text-rose-700' :
                                             'bg-yellow-100 text-yellow-700'
                                          }\`}>{u.sellerStatus}</span>
                                       </td>
                                       <td className="py-4 text-right space-x-2">
                                          <button onClick={() => setSelectedUser(u)} className="px-3 py-2 bg-slate-100 text-[#003366] rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">Details</button>
                                          {u.sellerStatus !== SellerStatus.VERIFIED && (
                                            <button onClick={() => handleSellerStatusUpdate(u, SellerStatus.VERIFIED)} disabled={updatingSellerId === u.userId} className="px-3 py-2 bg-[#003366] text-white rounded-lg text-xs font-bold hover:bg-[#004080] transition-colors disabled:opacity-50">Verify</button>
                                          )}
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  )}

                  {activeTab === 'reports' && (
                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
                           <h2 className="text-xl font-bold text-[#003366]">Reports & Dispute Logs</h2>
                           <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold">{reports.filter(r => r.status !== 'resolved').length} Active</span>
                        </div>
                        <div className="space-y-4">
                           {reports.map(r => (
                              <div key={r.$id} className={\`p-5 rounded-xl border \${r.status === 'resolved' ? 'bg-slate-50 border-slate-200' : 'bg-white border-rose-200 shadow-sm'}\`}>
                                 <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div>
                                       <div className="flex items-center gap-3 mb-2">
                                          <h4 className="text-base font-bold text-[#003366]">{r.reason}</h4>
                                          <span className={\`text-xs px-2 py-0.5 rounded font-bold \${r.status === 'resolved' ? 'bg-slate-200 text-slate-600' : 'bg-rose-100 text-rose-600'}\`}>{r.status || 'Pending'}</span>
                                       </div>
                                       <p className="text-sm text-slate-600 mb-4">"{r.description}"</p>
                                       <div className="flex gap-6 text-xs text-slate-500">
                                          <p><strong>Reporter:</strong> {r.reporterName}</p>
                                          <p><strong>Target:</strong> {(r as any).reportedName || 'Unknown'}</p>
                                          <p><strong>Date:</strong> {new Date(r.createdAt).toLocaleDateString()}</p>
                                       </div>
                                    </div>
                                    {r.status !== 'resolved' && (
                                       <div className="flex md:flex-col gap-2 shrink-0">
                                          <button onClick={() => resolveReport(r.$id, 'investigating' as any)} disabled={r.status === 'investigating' || resolvingReportId === r.$id} className="px-4 py-2 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-200 disabled:opacity-50">Investigate</button>
                                          <button onClick={() => resolveReport(r.$id, 'resolved')} disabled={resolvingReportId === r.$id} className="px-4 py-2 bg-[#003366] text-white text-xs font-bold rounded-lg hover:bg-[#004080] disabled:opacity-50">Resolve</button>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           ))}
                           {reports.length === 0 && <p className="text-center text-slate-400 py-10">No dispute reports available.</p>}
                        </div>
                     </div>
                  )}

                </div>
             )}
          </div>

        </main>
      </div>

      {/* Footer matching reference */}
      <footer className="bg-[#002244] text-white text-center py-4 text-xs font-medium tracking-widest uppercase z-20 relative">
        UNIVERSITY OF IBADAN DISTANCE LEARNING CENTRE
      </footer>
    </div>
  );
};

export default AdminDashboard;
`;
    fs.writeFileSync(path, newContent, 'utf8');
}
