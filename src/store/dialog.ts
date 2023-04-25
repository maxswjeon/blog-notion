import { create } from "zustand";

type DialogStore = {
  state: Record<string, boolean>;
  onOpen: (name: string) => void;
  onClose: (name: string) => void;
  onToggle: (name: string) => void;
};

const useDialogStore = create<DialogStore>()((set) => ({
  state: {},
  onOpen: (name) =>
    set((state) => ({ state: { ...state.state, [name]: true } })),
  onClose: (name) =>
    set((state) => ({ state: { ...state.state, [name]: false } })),
  onToggle: (name) =>
    set((state) => ({ state: { ...state.state, [name]: !state.state[name] } })),
}));

export const useDialog = (name: string) =>
  useDialogStore((state) => state.state[name]);
export const useDialogMutations = () =>
  useDialogStore((state) => ({
    onOpen: state.onOpen,
    onClose: state.onClose,
    onToggle: state.onToggle,
  }));
