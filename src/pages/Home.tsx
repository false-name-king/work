import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Calendar } from "lucide-react";
import Data from "./Data";
import DatePage from "./Date";
import { cn } from "@/lib/utils";

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = location.pathname === '/date' ? 'date' : 'data';

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col relative">
      {/* Scrollable Views Container */}
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-24 max-w-[500px] mx-auto w-full relative">
        {/* View 1: Data */}
        <div className={cn("absolute top-0 left-0 right-0 px-4 pt-6 pb-24", activeTab === 'data' ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0")}>
           <Data />
        </div>
        
        {/* View 2: Date */}
        <div className={cn("absolute top-0 left-0 right-0 px-4 pt-6 pb-24", activeTab === 'date' ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0")}>
           <DatePage />
        </div>
      </main>

      {/* iOS Floating Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none z-50">
        <div className="max-w-[500px] mx-auto w-full pointer-events-auto">
          <div className="ios-glass rounded-[2rem] shadow-[0_-8px_30px_rgb(0,0,0,0.04)] border border-white/40 p-1.5">
            <Tabs 
              value={activeTab} 
              onValueChange={(val) => navigate(val === 'date' ? '/date' : '/')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-transparent h-12">
                <TabsTrigger 
                  value="data" 
                  className="rounded-[1.5rem] data-[state=active]:bg-[#007AFF] data-[state=active]:text-white data-[state=active]:shadow-md gap-2 font-bold"
                >
                  <LayoutGrid className="w-4 h-4" />
                  数据
                </TabsTrigger>
                <TabsTrigger 
                  value="date" 
                  className="rounded-[1.5rem] data-[state=active]:bg-[#007AFF] data-[state=active]:text-white data-[state=active]:shadow-md gap-2 font-bold"
                >
                  <Calendar className="w-4 h-4" />
                  日期
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;