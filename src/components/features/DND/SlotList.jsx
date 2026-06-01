import Slot from "./Slot";

const SlotList = ({ slots }) => (
  <div className="p-4 bg-gray-100 rounded">
    <input
      type="text"
      placeholder="Search Slot.."
      className="border border-gray-400 mb-5 text-gray-800 rounded px-2 py-1"
    />
    {slots?.map((slot) => (
      <Slot key={slot._id} slot={slot} />
    ))}
  </div>
);

export default SlotList;
