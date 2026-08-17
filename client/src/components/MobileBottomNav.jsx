import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, X } from "lucide-react";
import Avatar from "./OwnerServices/Avatar";
import { isNavItemNew } from "../data/newFeatures";

const MAX_VISIBLE = 4;

const MobileBottomNav = ({
  items,
  activeId,
  accentVar = "#6366F1",
  accentVar2 = "#8B5CF6",
  avatar,
  user,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const hasMore = items.length > MAX_VISIBLE;
  const visibleItems = hasMore ? items.slice(0, MAX_VISIBLE - 1) : items;
  const moreItems = hasMore ? items.slice(MAX_VISIBLE - 1) : [];
  const isMoreActive = moreItems.some((i) => i.id === activeId);

  useEffect(() => {
    setShowMore(false);
  }, [location.pathname]);

  const handleNav = (item) => {
    setShowMore(false);
    navigate(item.path);
  };

  const gradient = `linear-gradient(135deg, ${accentVar}, ${accentVar2})`;

  const renderIcon = (item, isActive) => {
    if (item.isProfile) {
      return (
        <Avatar
          image={avatar}
          name={user?.displayName || "Profile"}
          size="xs"
          rounded="full"
        />
      );
    }
    const Icon = item.icon;
    return <Icon className="w-[22px] h-[22px]" style={{ color: isActive ? '#ffffff' : 'var(--text-secondary)' }} />;
  };

  const renderBadge = (item) => {
    if (!isNavItemNew(item.id)) return null;
    return (
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border-2"
        style={{ borderColor: 'var(--bg-sidebar)' }} />
    );
  };

  return (
    <>
      <div
        className="fixed bottom-0 inset-x-0 z-50 lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <nav
          className="mx-2 sm:mx-3 mb-2 sm:mb-3 rounded-2xl border backdrop-blur-2xl shadow-2xl flex items-stretch px-1 py-1.5"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--bg-sidebar) 88%, transparent)',
            borderColor: 'var(--border-primary)',
            boxShadow: '0 10px 40px -12px rgba(0,0,0,0.45)',
          }}
        >
          {visibleItems.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                id={item.tourId}
                onClick={() => handleNav(item)}
                className="relative flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer min-w-0"
              >
                <span
                  className={`relative flex items-center justify-center rounded-xl transition-all duration-300 ${isActive ? "px-4 py-1.5" : "px-2 py-1.5"}`}
                  style={isActive ? { background: gradient, boxShadow: '0 6px 18px -6px rgba(0,0,0,0.5)' } : undefined}
                >
                  {renderIcon(item, isActive)}
                  {renderBadge(item)}
                </span>
                <span
                  className={`text-[10px] leading-none font-medium truncate max-w-full px-1 ${isActive ? "font-bold" : ""}`}
                  style={{ color: isActive ? accentVar : 'var(--text-muted)' }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {hasMore && (
            <button
              onClick={() => setShowMore(true)}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer min-w-0"
            >
              <span
                className={`relative flex items-center justify-center rounded-xl transition-all duration-300 px-2 py-1.5 ${isMoreActive ? "px-4 py-1.5" : ""}`}
                style={isMoreActive ? { background: gradient, boxShadow: '0 6px 18px -6px rgba(0,0,0,0.5)' } : undefined}
              >
                <LayoutGrid className="w-[22px] h-[22px]" style={{ color: isMoreActive ? '#ffffff' : 'var(--text-secondary)' }} />
              </span>
              <span
                className={`text-[10px] leading-none font-medium ${isMoreActive ? "font-bold" : ""}`}
                style={{ color: isMoreActive ? accentVar : 'var(--text-muted)' }}
              >
                More
              </span>
            </button>
          )}
        </nav>
      </div>

      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] lg:hidden bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
            />
            <motion.div
              className="fixed bottom-0 inset-x-0 z-[70] lg:hidden rounded-t-3xl border-t backdrop-blur-2xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--bg-card) 92%, transparent)',
                borderColor: 'var(--border-primary)',
                paddingBottom: 'env(safe-area-inset-bottom)',
                boxShadow: '0 -12px 40px -12px rgba(0,0,0,0.45)',
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
            >
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--border-primary)' }} />
              </div>
              <div className="flex items-center justify-between px-5 pt-1 pb-2">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>More</p>
                <button
                  onClick={() => setShowMore(false)}
                  className="p-1.5 rounded-full transition-colors cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 px-4 pb-5 max-h-[60vh] overflow-y-auto">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeId === item.id;
                  return (
                    <button
                      key={item.id}
                      id={item.tourId}
                      onClick={() => handleNav(item)}
                      className="flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 active:scale-95 cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderColor: isActive ? accentVar : 'var(--border-primary)',
                        boxShadow: isActive ? `0 8px 24px -10px ${accentVar}` : undefined,
                      }}
                    >
                      <span
                        className="relative flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl"
                        style={isActive ? { background: gradient } : { backgroundColor: 'var(--bg-card)' }}
                      >
                        {item.isProfile ? (
                          <Avatar
                            image={avatar}
                            name={user?.displayName || "Profile"}
                            size="sm"
                            rounded="full"
                          />
                        ) : (
                          <Icon className="w-5 h-5" style={{ color: isActive ? '#ffffff' : 'var(--text-secondary)' }} />
                        )}
                        {renderBadge(item)}
                      </span>
                      <span
                        className="flex-1 min-w-0 text-left text-xs font-medium truncate"
                        style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileBottomNav;