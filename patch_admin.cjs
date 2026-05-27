const fs = require('fs');

const path = 'pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Break out of container to make it full screen
content = content.replace(
  'className="min-h-screen bg-slate-100 flex flex-col font-sans animate-fadeIn"',
  'className="fixed inset-0 z-[100] bg-slate-100 flex flex-col font-sans animate-fadeIn"'
);

// 2. Change sidebar from #004080 to #003366
content = content.replace(
  'className="w-64 bg-[#004080] text-white hidden lg:flex flex-col py-8 shadow-xl z-10 shrink-0"',
  'className="w-64 bg-[#003366] text-white hidden lg:flex flex-col py-8 shadow-xl z-10 shrink-0"'
);

// 2b. Also change mobile navigation background just in case
content = content.replace(
  'className="lg:hidden absolute top-0 left-0 w-full bg-[#004080] flex overflow-x-auto p-2 gap-2 shadow-md z-10"',
  'className="lg:hidden absolute top-0 left-0 w-full bg-[#003366] flex overflow-x-auto p-2 gap-2 shadow-md z-10"'
);

// 3. Remove the menu icon button entirely
content = content.replace(
  /<button className="text-white hover:text-slate-300 transition-colors">\s*<i className="fa-solid fa-bars text-xl"><\/i>\s*<\/button>/g,
  ''
);

// 4. Remove the footer entirely
content = content.replace(
  /{[^}]*Footer matching reference[^}]*}\s*<footer className="bg-\[#002244\] text-white text-center py-4 text-xs font-medium tracking-widest uppercase z-20 relative">\s*UNIVERSITY OF IBADAN DISTANCE LEARNING CENTRE\s*<\/footer>/g,
  ''
);

// 5. Change "Settings (Locked)" to a functional tab
content = content.replace(
  /<button \s*className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-medium text-white\/40 cursor-not-allowed"\s*>\s*<i className="fa-solid fa-gear w-5"><\/i> Settings \(Locked\)\s*<\/button>/g,
  `<button 
              onClick={() => setActiveTab('settings')} 
              className={\`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-medium transition-all \${activeTab === 'settings' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10 text-white/80'}\`}
            >
              <i className="fa-solid fa-gear w-5"></i> Settings
            </button>`
);

// Update mobile nav to include settings
content = content.replace(
  /as const\)\.map\(tab =>/g,
  `| 'settings'`
);
// Ah, the original is: (['network', 'sellers', 'products', 'reports'] as const).map(tab =>
content = content.replace(
  /\(\['network', 'sellers', 'products', 'reports'\] as const\)\.map/g,
  `(['network', 'sellers', 'products', 'reports', 'settings'] as const).map`
);

// Add the settings content area
content = content.replace(
  /({activeTab === 'reports' && \([\s\S]*?<\/div>\s*\)}\s*)<\/div>\s*\)}\s*<\/div>\s*<\/main>/g,
  `$1
                  {activeTab === 'settings' && (
                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-bold text-[#003366] mb-6 border-b border-slate-100 pb-3">System Settings</h2>
                        <div className="space-y-6">
                           <div>
                              <h3 className="text-sm font-bold text-slate-700 mb-2">Platform Configuration</h3>
                              <p className="text-sm text-slate-500 mb-4">Manage core marketplace settings and administrative configurations here.</p>
                              
                              <div className="grid gap-4 max-w-xl">
                                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div>
                                       <p className="font-bold text-sm text-[#003366]">Maintenance Mode</p>
                                       <p className="text-xs text-slate-500">Temporarily disable marketplace access for users.</p>
                                    </div>
                                    <button className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold cursor-not-allowed">Disabled</button>
                                 </div>

                                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div>
                                       <p className="font-bold text-sm text-[#003366]">Auto-Approve Sellers</p>
                                       <p className="text-xs text-slate-500">Automatically verify sellers with valid matric numbers.</p>
                                    </div>
                                    <button className="px-4 py-2 bg-[#003366] text-white rounded-lg text-xs font-bold cursor-not-allowed">Enabled</button>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                </div>
             )}
          </div>

        </main>`
);

fs.writeFileSync(path, content, 'utf8');
