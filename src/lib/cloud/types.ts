import type { Position } from "@/lib/nukida/types";

export type PaperBook = {
  cash: number;
  startEquity: number;
  positions: Position[];
  history: Position[];
  haltUntil: number;
  lossesToday: number;
  lastLossDay: string;
};
