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
    <div className="kpi-cards-grid">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className={`kpi-card ${card.gradient}`}>
            <div className="kpi-card-glow" />
            <div className="kpi-card-content">
              <div className="kpi-icon-wrapper">
                <Icon className="kpi-icon" size={24} />
              </div>
              <div className="kpi-stats">
                <h3 className="kpi-value">{card.value}</h3>
                <p className="kpi-title">{card.title}</p>
                {card.subtitle && <p className="kpi-subtitle">{card.subtitle}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;
