import { Shield, Users, AlertCircle, Home } from "lucide-react";

const KPICards = ({ stats }) => {
  const cards = [
    {
      icon: Shield,
      title: "Total Wardens",
      value: stats.totalWardens,
      subtitle: `${stats.pendingWardens} pending`,
      gradient: "card-purple"
    },
    {
      icon: Users,
      title: "Total Students",
      value: stats.totalStudents,
      subtitle: `${stats.pendingStudents} pending`,
      gradient: "card-blue"
    },
    {
      icon: AlertCircle,
      title: "Pending Approvals",
      value: stats.totalPending,
      subtitle: "Needs your attention",
      gradient: "card-orange"
    },
    {
      icon: Home,
      title: "Hostels",
      value: stats.totalHostels,
      subtitle: "Under management",
      gradient: "card-green"
    }
  ];

  return (
    <div className="grid grid-cols-1  sm:grid-cols-2 lg:grid-cols-4 gap-2  ">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`relative flex min-h-[190px] h-full rounded-2xl overflow-hidden p-5 sm:min-h-[220px] sm:p-7 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl ${card.gradient}`}
          >
            <div className="absolute -top-1/2 -right-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(255,255,255,0.2)_0%,transparent_70%)] pointer-events-none" />
            <div className="relative z-10 flex h-full w-full flex-col">
              <div className="inline-flex self-start p-3 bg-white/20 backdrop-blur-md rounded-xl mb-4">
                <Icon className="text-white w-6 h-6" />
              </div>
              <div className="mt-auto text-white">
                <h3 className="text-3xl sm:text-4xl font-extrabold mb-1 leading-none break-words">{card.value}</h3>
                <p className="text-sm sm:text-base font-semibold mb-1 opacity-95 leading-snug break-words whitespace-normal max-w-full">{card.title}</p>
                {card.subtitle && <p className="text-xs sm:text-sm m-0 opacity-80 leading-snug break-words whitespace-normal max-w-full">{card.subtitle}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;
