import PropTypes from 'prop-types';

const MenuList = ({ menuItems, onMenuItemClick }) => {
  return (
    <div className="absolute right-0 mt-2 w-48 bg-[#1F4068] rounded-md shadow-lg py-1 z-20">
      {menuItems.map((item, index) => (
        <button
          key={index}
          className="block px-4 py-2 text-sm text-white hover:bg-gray-700 w-full text-left"
          onClick={() => onMenuItemClick(item.action)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

MenuList.propTypes = {
  menuItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      action: PropTypes.string.isRequired
    })
  ).isRequired,
  onMenuItemClick: PropTypes.func.isRequired
};

export default MenuList;
