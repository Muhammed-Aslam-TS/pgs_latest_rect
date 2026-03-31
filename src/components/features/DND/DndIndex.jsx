import { useDrop } from "react-dnd";
import { ItemTypes } from "./dnd/ItemTypes";
import { Icon } from "@iconify/react";

const DndIndex = ({ indexId, assignedSlot, onDrop, handleRemoveSlot }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.SLOT,
    drop: (item) => onDrop(indexId, item.slot),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`w-40 h-24 border-2 rounded p-2 ${
        isOver ? "bg-green-100" : "bg-black text-white"
      }`}
    >
      <p className="text-center">Index {indexId}</p>
      {assignedSlot && (
        <div className="mt-2 relative text-center bg-white text-black rounded">
          {assignedSlot.space_id}
          <div
            onClick={() => handleRemoveSlot(indexId)}
            className="absolute cursor-pointer bg-red-600 rounded-full right-[-5px] top-[-5px]"
          >
            <Icon icon="lets-icons:close-round" width="16" color="white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default DndIndex;
