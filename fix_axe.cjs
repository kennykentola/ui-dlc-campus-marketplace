const fs = require('fs');

// Fix ProductCard
let pc = fs.readFileSync('components/ProductCard.tsx', 'utf8');
pc = pc.replace(
  'className="absolute top-3 right-3 z-30 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-colors shadow-sm"',
  'className="absolute top-3 right-3 z-30 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-colors shadow-sm" title="Delete Product" aria-label="Delete Product"'
);
fs.writeFileSync('components/ProductCard.tsx', pc);

// Fix AdminDashboard
let ad = fs.readFileSync('pages/AdminDashboard.tsx', 'utf8');
ad = ad.replace(
  'className="text-slate-400 hover:text-rose-500"',
  'className="text-slate-400 hover:text-rose-500" title="Close modal" aria-label="Close modal"'
);
fs.writeFileSync('pages/AdminDashboard.tsx', ad);
