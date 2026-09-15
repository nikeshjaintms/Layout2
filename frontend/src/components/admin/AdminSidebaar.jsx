'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Briefcase, Menu, X, Shield, Database, ChevronDown, Coffee, Activity, Palette } from 'lucide-react';
import { Can } from '@/lib/ability';
import { AbilityContext } from '@/lib/ability';
import { useContext } from 'react';

export default function AdminSidebaar() {
  const pathname = usePathname();
  const ability = useContext(AbilityContext);
  const [isOpen, setIsOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (name) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      activeMatch: '/admin/dashboard',
      icon: LayoutDashboard,
      action: 'sidebar',
      subject: 'dashboard'
    },
    {
      name: 'Users',
      href: '/admin/users',
      activeMatch: '/admin/users',
      icon: Users,
      action: 'sidebar',
      subject: 'user'
    },
    {
      name: 'Roles & Permissions',
      href: '/admin/roles',
      activeMatch: '/admin/roles',
      icon: Shield,
      action: 'sidebar',
      subject: 'role'
    },
    {
      name: 'Subscriptions',
      href: '/admin/subscriptions',
      activeMatch: '/admin/subscriptions',
      icon: Activity,
      action: 'sidebar',
      subject: 'user' // piggyback on user permission
    },
    {
      name: 'Assigned Projects',
      href: '/admin/assigned-projects',
      activeMatch: '/admin/assigned-projects',
      icon: Briefcase,
      action: 'sidebar',
      subject: 'project'
    },
    {
      name: 'Masters',
      icon: Database,
      children: [
        {
          name: 'Amenities',
          href: '/masters/amenities',
          activeMatch: '/masters/amenities',
          icon: Coffee,
          action: 'sidebar',
          subject: 'amenity'
        }
      ]
    }
  ];

  // Helper to check if a user has access to at least one child of a parent menu
  const canAccessParent = (item) => {
    if (!item.children) return ability.can(item.action, item.subject);
    return item.children.some(child => ability.can(child.action, child.subject));
  };

  return (
    <>
      {/* Mobile Header / Hamburger */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex-1 flex justify-center overflow-hidden mr-2">
          <div className="h-12 flex items-center justify-center shrink-0">
            <img src="/techomax.png" alt="Techomax" className="h-10 w-auto object-contain" />
          </div>
        </div>
        <button onClick={() => setIsOpen(true)} className="text-gray-900 p-1 shrink-0">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col h-full min-h-screen transform transition-transform duration-300 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex-shrink-0`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8 pl-3 md:mb-8 md:justify-center md:pl-0">
            <div className="flex justify-center items-center w-full overflow-hidden">
              <div className="flex items-center justify-center shrink-0">
                <img src="/techomax.png" alt="Techomax" className="h-16 w-auto max-w-[200px] object-contain drop-shadow-md" />
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-900 md:hidden p-1 shrink-0 ml-2">
              <X size={24} />
            </button>
          </div>
          
          <nav className="space-y-3 relative pl-3">
            {navItems.map((item) => {
              if (item.action && item.subject && !ability.can(item.action, item.subject)) {
                return null;
              }
              
              if (item.children) {
                if (!canAccessParent(item)) return null;
                
                const isActive = item.children.some(child => pathname.startsWith(child.activeMatch));
                const isMenuOpen = openMenus[item.name] || isActive;
                const Icon = item.icon;

                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full group flex items-center justify-between px-4 py-3 text-[14px] font-medium transition-all duration-300 relative rounded-l-xl ${
                        isActive || isMenuOpen ? 'text-gray-900 bg-[#FDF6ED]' : 'text-gray-600 hover:text-[#ABD2FA] hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Icon className={`w-[18px] h-[18px] transition-colors ${isActive ? 'text-[#ABD2FA]' : 'text-gray-600 group-hover:text-[#ABD2FA]'}`} />
                        <span>{item.name}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isMenuOpen ? 'rotate-180 text-gray-900' : 'text-gray-600'}`} />
                    </button>
                    
                    {/* Children Dropdown */}
                    <div className={`overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="pl-4 py-1 space-y-1 border-l-2 border-gray-200 ml-6 mt-1">
                        {item.children.map(child => {
                          if (!ability.can(child.action, child.subject)) return null;
                          const isChildActive = pathname.startsWith(child.activeMatch);
                          const ChildIcon = child.icon;
                          
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              onClick={() => setIsOpen(false)}
                              className={`group flex items-center gap-3 px-3 py-2 text-[13px] font-medium transition-all duration-300 rounded-lg ${
                                isChildActive ? 'text-[#ABD2FA] bg-[#FDF6ED]' : 'text-gray-600 hover:text-[#ABD2FA] hover:bg-gray-50'
                              }`}
                            >
                              <ChildIcon className={`w-4 h-4 ${isChildActive ? 'text-[#ABD2FA]' : 'text-gray-600 group-hover:text-[#ABD2FA]'}`} />
                              <span>{child.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              const isActive = pathname.startsWith(item.activeMatch);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`group flex items-center gap-4 px-4 py-3 text-[14px] font-medium transition-all duration-300 relative ${
                    isActive
                      ? 'text-[#ABD2FA]'
                      : 'text-gray-600 hover:text-[#ABD2FA]'
                  }`}
                >
                  {/* Active Tab Background & Glowing Border */}
                  {isActive && (
                    <div className="absolute inset-0 bg-[#FDF6ED] rounded-l-xl border border-[#ABD2FA] border-r-0 shadow-[inset_4px_0_15px_rgba(171,210,250,0.1)] -right-6 overflow-hidden">
                       <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-[#ABD2FA] shadow-[0_0_12px_rgba(171,210,250,0.8)]"></div>
                    </div>
                  )}
                  
                  {/* Hover state for inactive tabs */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-gray-50 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -right-6"></div>
                  )}
                  
                  <Icon className={`w-[18px] h-[18px] relative z-10 transition-transform duration-300 ${isActive ? 'text-[#ABD2FA]' : 'text-gray-600 group-hover:text-[#ABD2FA]'}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
