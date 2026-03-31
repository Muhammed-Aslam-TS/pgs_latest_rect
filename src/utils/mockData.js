export const MOCK_PARKING_DATA = {
  data: [
    {
      _id: "P1",
      name: "MLCP",
      total_floors: 5,
      total_spaces: 800,
      total_occupied: 450,
      total_free: 350,
    },
    {
      _id: "P2",
      name: "Basement",
      total_floors: 2,
      total_spaces: 800,
      total_occupied: 200,
      total_free: 600,
    },
  ],
  graphData: {
    parkingByDay: [
      { time: "08:00", parkingArray: [{ total_occupied: 120 }] },
      { time: "10:00", parkingArray: [{ total_occupied: 350 }] },
      { time: "12:00", parkingArray: [{ total_occupied: 580 }] },
      { time: "14:00", parkingArray: [{ total_occupied: 620 }] },
      { time: "16:00", parkingArray: [{ total_occupied: 550 }] },
      { time: "18:00", parkingArray: [{ total_occupied: 400 }] },
      { time: "20:00", parkingArray: [{ total_occupied: 150 }] },
    ],
  },
};

export const MOCK_FLOOR_DATA = {
  P1: [ // Floors for MLCP
    {
      _id: "F1",
      floor_name: "Floor 1",
      total_spaces: 160,
      occupied: 120,
      free: 40,
      total_zones: 4,
    },
    {
        _id: "F2",
        floor_name: "Floor 2",
        total_spaces: 160,
        occupied: 100,
        free: 60,
        total_zones: 4,
    },
    {
        _id: "F3",
        floor_name: "Floor 3",
        total_spaces: 160,
        occupied: 90,
        free: 70,
        total_zones: 4,
    },
    {
        _id: "F4",
        floor_name: "Floor 4",
        total_spaces: 160,
        occupied: 80,
        free: 80,
        total_zones: 4,
    },
    {
        _id: "F5",
        floor_name: "Floor 5",
        total_spaces: 160,
        occupied: 60,
        free: 100,
        total_zones: 4,
    },
  ],
  P2: [ // Floors for Basement
    {
        _id: "B1",
        floor_name: "Basement 1",
        total_spaces: 400,
        occupied: 150,
        free: 250,
        total_zones: 8,
    },
    {
        _id: "B2",
        floor_name: "Basement 2",
        total_spaces: 400,
        occupied: 50,
        free: 350,
        total_zones: 8,
    },
  ]
};

export const MOCK_ZONE_DATA = {
  F1: [ // Zones for Floor 1
    {
      _id: "Z1",
      zone_name: "Zone A",
      total_spaces: 40,
      occupied: 35,
      free: 5,
    },
    {
      _id: "Z2",
      zone_name: "Zone B",
      total_spaces: 40,
      occupied: 30,
      free: 10,
    },
    {
        _id: "Z3",
        zone_name: "Zone C",
        total_spaces: 40,
        occupied: 28,
        free: 12,
      },
      {
        _id: "Z4",
        zone_name: "Zone D",
        total_spaces: 40,
        occupied: 27,
        free: 13,
      },
  ],
  // Simplified mock data for other floors - replicating similar structure
  default: [
    {
        _id: "Z1",
        zone_name: "Zone A",
        total_spaces: 40,
        occupied: 20,
        free: 20,
      },
      {
        _id: "Z2",
        zone_name: "Zone B",
        total_spaces: 40,
        occupied: 15,
        free: 25,
      },
      {
        _id: "Z3",
        zone_name: "Zone C",
        total_spaces: 40,
        occupied: 10,
        free: 30,
      },
      {
        _id: "Z4",
        zone_name: "Zone D",
        total_spaces: 40,
        occupied: 5,
        free: 35,
      },
  ]
};
