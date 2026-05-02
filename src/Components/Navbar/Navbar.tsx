import { useState, useRef, useEffect } from "react";
import { Menu, X } from "lucide-react";
import "./Navbar.css";

interface NavButton {
  label: string;
  action: string;
}

interface NavbarProps {
  buttons: NavButton[];
  onNavClick: (action: string) => void;
}

function Navbar({ buttons, onNavClick }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleButtonClick = (action: string) => {
    onNavClick(action);
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <button className="hamburger" onClick={toggleMenu} aria-label="Menu">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      <div className={`nav-links ${isOpen ? "open" : ""}`} ref={menuRef}>
        {buttons.map((btn, index) => (
          <button
            key={index}
            className={`nav-button ${index === 3 ? "nav-leyendas" : ""}`}
            onClick={() => handleButtonClick(btn.action)}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <div className={`overlay ${isOpen ? "visible" : ""}`} onClick={() => setIsOpen(false)}></div>
    </nav>
  );
}

export default Navbar;