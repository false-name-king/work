import { CalendarDays } from "lucide-react";

const DatePage = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6">
      <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center border border-white">
        <div className="w-16 h-16 bg-[#FF3B30]/10 rounded-2xl flex items-center justify-center">
          <CalendarDays className="w-8 h-8 text-[#FF3B30]" />
        </div>
      </div>
      <div className="text-center space-y-2 px-6">
        <h3 className="text-2xl font-bold text-black/90 tracking-tight">历史记录</h3>
        <p className="text-sm text-black/40 font-medium leading-relaxed">
          云端同步与历史记录查询功能<br/>正在紧张开发中，敬请期待
        </p>
      </div>
      <div className="w-full ios-card p-6 mt-8 border border-white/60">
        <div className="space-y-4">
          <div className="h-4 bg-black/[0.03] rounded-full w-3/4" />
          <div className="h-4 bg-black/[0.03] rounded-full w-1/2" />
          <div className="h-4 bg-black/[0.03] rounded-full w-2/3" />
        </div>
      </div>
    </div>
  );
};

export default DatePage;