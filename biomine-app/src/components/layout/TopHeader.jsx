import { Search, Bell, Menu } from "lucide-react";
import { Input } from "../ui/Input";

export function TopHeader({ setIsMobileOpen, title = "Dashboard", subtitle = "Overview" }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-dark-border bg-dark-bg/80 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden p-2 text-gray-400 hover:text-white"
        >
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">{title}</h1>
          <p className="hidden text-xs text-gray-400 sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden relative w-64 md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search operations..." 
            className="pl-10 h-10 bg-dark-card/50 border-transparent focus:border-primary/50" 
          />
        </div>

        <button className="relative rounded-full p-2 text-gray-400 transition-colors hover:bg-dark-border hover:text-white">
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
        </button>

        <div className="h-8 w-px bg-dark-border"></div>

        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-sm font-medium text-white">Shubham</span>
            <span className="text-xs text-gray-400">Admin</span>
          </div>
          <img 
            src="https://i.pravatar.cc/150?u=shubham" 
            alt="User avatar" 
            className="h-10 w-10 rounded-xl border border-dark-border object-cover"
          />
        </div>
      </div>
    </header>
  );
}
