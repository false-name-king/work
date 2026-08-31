import { lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Calendar, Loader2 } from "lucide-react";

const Data = lazy(() => import("./Data"));
const DatePage = lazy(() => import("./Date"));

const PageLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center py-20 space-y-3" aria-live="polite">
    <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
    <span className="text-xs font-semibold text-black/40">加载模块中...</span>
  </div>
);

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = location.pathname === '/date' ? 'date' : 'data';

  return (
    <div className="min-h-svh bg-[#F2F2F7] relative text-black antialiased selection:bg-[#007AFF]/20">
      {/* iOS Floating Tab Bar at Top */}
      <header className="fixed top-0 left-0 right-0 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))] pointer-events-none z-50">
        <div className="max-w-[480px] mx-auto w-full pointer-events-auto">
          <nav 
            aria-label="功能导航"
            className="ios-glass rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/50 p-1 backdrop-blur-2xl"
          >
            <Tabs 
              value={activeTab} 
              onValueChange={(val) => navigate(val === 'date' ? '/date' : '/')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-transparent h-11 p-0.5 gap-1">
                <TabsTrigger 
                  value="data" 
                  aria-label="数据管理"
                  className="rounded-[1.25rem] data-[state=active]:bg-[#007AFF] data-[state=active]:text-white data-[state=active]:shadow-sm gap-1.5 font-bold text-xs transition-all duration-200"
                >
                  <LayoutGrid className="w-4 h-4" />
                  生产数据
                </TabsTrigger>
                <TabsTrigger 
                  value="date" 
                  aria-label="排班日历"
                  className="rounded-[1.25rem] data-[state=active]:bg-[#007AFF] data-[state=active]:text-white data-[state=active]:shadow-sm gap-1.5 font-bold text-xs transition-all duration-200"
                >
                  <Calendar className="w-4 h-4" />
                  排班日历
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </nav>
        </div>
      </header>

      {/* Main Content View with Safe Area Insets */}
      <main className="px-3.5 pt-[calc(4.75rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))] max-w-[480px] mx-auto w-full">
        <Suspense fallback={<PageLoadingFallback />}>
          {activeTab === 'data' ? (
            <section aria-label="生产数据记录视图">
              <Data />
            </section>
          ) : (
            <section aria-label="排班日历视图">
              <DatePage />
            </section>
          )}
        </Suspense>
      </main>
    </div>
  );
};

export default Home;
