import { useStore } from "@/lib/store";
import UserSwitcher from "./user-switcher";

const MobileHeader = () => {
  const { toggleMobileSidebar, user } = useStore();
  
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button 
          id="menu-toggle" 
          className="text-secondary p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={toggleMobileSidebar}
        >
          <span className="material-icons">menu</span>
        </button>
        <div className="flex items-center">
          <div className="h-8 w-8 bg-primary rounded flex items-center justify-center mr-2">
            <span className="material-icons text-white text-sm">business</span>
          </div>
          <span className="font-bold">Kontek Lön</span>
        </div>
        <div className="flex items-center">
          <UserSwitcher />
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
