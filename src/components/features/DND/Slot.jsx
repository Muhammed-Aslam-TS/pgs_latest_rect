import { useDrag } from "react-dnd";
import { ItemTypes } from "./dnd/ItemTypes";

const Slot = ({ slot }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.SLOT,
    item: { slot },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="p-2 relative bg-blue-500 text-white text-center rounded mb-2 cursor-move"
    >
      {slot.space_id}
    </div>
  );
};

export default Slot;
