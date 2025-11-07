import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { DayPacket, ScheduledEvent, IsoDate, SnowflakeId } from "@/types/core";
import { db } from "@/services/persistence";
import { eventEngine } from "@/services/eventEngine";

interface ScenarioState {
  dayPackets: DayPacket[];
  scheduledEvents: ScheduledEvent[];
  selectedPacketId: SnowflakeId | null;
  replacementArcActive: boolean;
}

interface ScenarioSlice extends ScenarioState {
  loadDayPackets: () => Promise<void>;
  loadScheduledEvents: () => Promise<void>;
  setSelectedPacket: (packetId: SnowflakeId | null) => void;
  createDayPacket: (packet: DayPacket) => Promise<void>;
  scheduleEvent: (eventId: SnowflakeId, scheduledFor: IsoDate) => Promise<void>;
  setReplacementArcActive: (active: boolean) => void;
  getPacketForDate: (date: IsoDate) => DayPacket | undefined;
}

export const useScenarioStore = create<ScenarioSlice>()(
  immer((set, get) => ({
    dayPackets: [],
    scheduledEvents: [],
    selectedPacketId: null,
    replacementArcActive: false,

    loadDayPackets: async () => {
      const packets = await db.dayPackets.toArray();
      set((draft) => {
        draft.dayPackets = packets.sort((a, b) => a.date.localeCompare(b.date));
      });
    },

    loadScheduledEvents: async () => {
      const events = await eventEngine.getScheduledEvents();
      set((draft) => {
        draft.scheduledEvents = events;
      });
    },

    setSelectedPacket: (packetId) => {
      set((draft) => {
        draft.selectedPacketId = packetId;
      });
    },

    createDayPacket: async (packet) => {
      await db.dayPackets.add(packet);
      set((draft) => {
        draft.dayPackets.push(packet);
        draft.dayPackets.sort((a, b) => a.date.localeCompare(b.date));
      });
    },

    scheduleEvent: async (eventId, scheduledFor) => {
      const event = await db.scheduledEvents.get(eventId);
      if (event) {
        event.scheduledFor = scheduledFor;
        await db.scheduledEvents.update(eventId, event);
        await get().loadScheduledEvents();
      }
    },

    setReplacementArcActive: (active) => {
      set((draft) => {
        draft.replacementArcActive = active;
      });
    },

    getPacketForDate: (date) => {
      return get().dayPackets.find((p) => p.date === date);
    },
  }))
);

