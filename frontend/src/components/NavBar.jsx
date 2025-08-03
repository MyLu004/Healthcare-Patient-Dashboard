import { useState, useRef, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { MdHealthAndSafety } from "react-icons/md";

const NavBar = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "User";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("username");
    sessionStorage.removeItem("accessToken");
    navigate("/"); // or "/login"
  };

  return (
    <nav className="bg-white shadow-soft px-6 py-3 flex justify-between items-center">
      {/* App title */}
      <div className="flex items-center gap-2">
        <MdHealthAndSafety size={25} color="rgb(56 178 172)" />
        <h1 className="text-xl font-semibold text-neutral-dark">Health Dashboard</h1>
      </div>
      

      {/* Right side: username + profile */}
      <div className="relative flex items-center gap-2" ref={dropdownRef}>
        {/* Show username only on md+ screens */}
        <span className="hidden md:block text-neutral-dark font-medium">{username}</span>
        
        <button
          onClick={() => setOpen(!open)}
          className="text-neutral-dark text-2xl hover:text-primary focus:outline-none"
        >
          <FaUserCircle />
        </button>

        {open && (
          <div className="absolute right-0 mt-[7.5rem] w-40 bg-white border rounded-xl shadow-lg z-50">
            <ul className="text-sm text-neutral-dark">
              <li>
                <Link
                  to="/settings"
                  className="block px-4 py-2 hover:bg-neutral-light rounded-t-xl"
                  onClick={() => setOpen(false)}
                >
                  Settings
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-neutral-light rounded-b-xl"
                >
                  Log out
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
