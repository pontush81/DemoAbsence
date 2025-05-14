import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

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
          <img 
            src="https://pixabay.com/get/g71147032ef23548394939a9177a80ee6c469d108bf2fef71f6aae5036927c5fe34037a517d978a8abd60877a73f2bf4b4a26e41fa877986bf2d3cc41ff44950a_1280.jpg" 
            alt="Kontek Lön Logo" 
            className="h-8"
          />
          <span className="font-bold ml-2">Kontek Lön</span>
        </div>
        <div className="flex items-center">
          <Link href="/settings">
            <a>
              <Badge 
                variant={user.currentRole === 'manager' ? 'secondary' : 'default'}
                className="mr-2 py-1 px-2"
              >
                {user.currentRole === 'manager' ? 'Chef' : 'Anställd'}
              </Badge>
            </a>
          </Link>
          <button className="ml-1">
            <span className="material-icons">account_circle</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
